'use strict';

const scope = 'https://www.googleapis.com/auth/drive.file';
const api = 'https://www.googleapis.com/drive/v3';
const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files';
const folderType = 'application/vnd.google-apps.folder';
const byId = id => document.getElementById(id);
const connect = byId('connect');
const folder = byId('folder');
const files = byId('files');
const drop = byId('drop');
const queue = byId('queue');
const upload = byId('upload');
const notice = byId('notice');
const entries = [];
let token = '';
let identity = '';
let busy = false;
let authorizing = false;

function apiError(status, response) {
  const googleMessage = response?.error?.message;
  const message = status === 401 ? 'Drive access expired. Reconnect and retry.'
    : googleMessage || `Google Drive returned HTTP ${status}.`;
  return Object.assign(new Error(message), { status });
}

async function request(path, data) {
  const options = {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(45000)
  };
  if (data) {
    options.method = 'POST';
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }
  const response = await fetch(api + path, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw apiError(response.status, body);
  return body;
}

async function loadFolders() {
  const params = new URLSearchParams({
    q: `trashed = false and mimeType = '${folderType}'`,
    fields: 'nextPageToken,files(id,name,capabilities(canAddChildren),appProperties)',
    orderBy: 'name',
    pageSize: '100'
  });
  const folders = [];
  do {
    const page = await request('/files?' + params);
    folders.push(...page.files.filter(item => item.capabilities?.canAddChildren));
    if (!page.nextPageToken) break;
    params.set('pageToken', page.nextPageToken);
  } while (true);

  let defaultFolder = folders.find(item => item.appProperties?.fileflowDefault === '1');
  if (!defaultFolder) {
    defaultFolder = await request('/files?fields=id,name', {
      name: 'FileFlow Uploads',
      mimeType: folderType,
      appProperties: { fileflowDefault: '1' }
    });
    folders.unshift(defaultFolder);
  }
  const previous = folder.value;
  folder.replaceChildren(...folders.map(item => new Option(item.name, item.id)));
  folder.value = folders.some(item => item.id === previous) ? previous : defaultFolder.id;
}

function disconnect(message) {
  token = '';
  byId('account').textContent = 'Account disconnected';
  notice.textContent = message;
}

connect.addEventListener('click', () => {
  const clientId = window.FILEFLOW_DRIVE_CLIENT_ID?.trim();
  const oauth = window.google?.accounts?.oauth2;
  if (!clientId) {
    notice.textContent = 'Add your Google OAuth web client ID in config.js. See the setup guide.';
    return;
  }
  if (!oauth) {
    notice.textContent = 'Google sign-in could not load. Check your connection and try again.';
    return;
  }

  function finish(error) {
    if (error) disconnect(error.message);
    authorizing = false;
    render();
  }

  authorizing = true;
  notice.textContent = 'Waiting for Google authorization…';
  render();
  try {
    oauth.initTokenClient({
      client_id: clientId,
      scope,
      include_granted_scopes: false,
      error_callback: () => finish(new Error('Google authorization was closed or blocked. Try connecting again.')),
      callback: async response => {
        try {
          if (!response.access_token || !oauth.hasGrantedAllScopes(response, scope)) {
            throw new Error('Google Drive access was declined. Reconnect to grant access.');
          }
          token = response.access_token;
          const { user } = await request('/about?fields=user(displayName,emailAddress,permissionId)');
          identity = user.permissionId || user.emailAddress;
          if (!identity) throw new Error('Could not verify the Google Drive account.');
          byId('account').textContent = user.emailAddress || user.displayName || 'Google Drive connected';
          await loadFolders();
          notice.textContent = 'Choose a writable folder available to FileFlow.';
          finish();
        } catch (error) {
          finish(error);
        }
      }
    }).requestAccessToken({ prompt: 'select_account' });
  } catch (error) {
    finish(error);
  }
});

function send(method, url, headers, body, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    for (const [header, value] of Object.entries(headers)) xhr.setRequestHeader(header, value);
    if (onProgress) xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.floor(event.loaded / event.total * 100));
    };
    xhr.timeout = 15 * 60 * 1000;
    xhr.onerror = xhr.ontimeout = () => reject(new Error('Upload connection interrupted. Retry this file.'));
    xhr.onload = () => {
      let result;
      try { result = JSON.parse(xhr.responseText); } catch { result = null; }
      if (xhr.status >= 200 && xhr.status < 300) resolve({ result, location: xhr.getResponseHeader('Location') });
      else reject(apiError(xhr.status, result));
    };
    xhr.send(body);
  });
}

async function transfer(entry, onProgress) {
  const { file } = entry;
  if (!entry.id) {
    const { ids } = await request('/files/generateIds?count=1&space=drive&type=files');
    entry.id = ids[0];
  }
  const metadata = { id: entry.id, name: file.name, parents: [entry.destination] };
  const mime = file.type || 'application/octet-stream';
  try {
    if (file.size > 5 * 1024 * 1024) {
      const { location } = await send('POST', uploadUrl + '?uploadType=resumable&fields=id', {
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mime,
        'X-Upload-Content-Length': String(file.size)
      }, JSON.stringify(metadata));
      if (!location) throw new Error('Google Drive did not return an upload session.');
      const session = new URL(location);
      if (session.origin !== new URL(uploadUrl).origin) throw new Error('Unexpected upload session URL.');
      return (await send('PUT', session.href, { 'Content-Type': mime }, file, onProgress)).result;
    }
    const boundary = 'fileflow-' + crypto.randomUUID();
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
      file,
      `\r\n--${boundary}--\r\n`
    ]);
    return (await send('POST', uploadUrl + '?uploadType=multipart&fields=id', {
      'Content-Type': 'multipart/related; boundary=' + boundary
    }, body, onProgress)).result;
  } catch (error) {
    // A prior upload may have finished before the response reached the browser.
    if (error.status !== 409) throw error;
    return request('/files/' + encodeURIComponent(entry.id) + '?fields=id');
  }
}

async function run(batch) {
  if (busy || authorizing || !token || !folder.value) return;
  busy = true;
  for (const entry of batch) {
    if (!token) break;
    if (entry.owner && entry.owner !== identity) continue;
    entry.owner = identity;
    entry.destination ||= folder.value;
    entry.status = 'Uploading';
    entry.message = '';
    entry.percent = 0;
    render();
    try {
      const uploaded = await transfer(entry, percent => {
        entry.percent = percent;
        entry.progress.value = percent;
      });
      if (!uploaded?.id) throw new Error('Could not confirm the upload. Retry this file.');
      entry.status = 'Uploaded';
      entry.link = 'https://drive.google.com/open?id=' + encodeURIComponent(uploaded.id);
    } catch (error) {
      entry.status = 'Needs retry';
      entry.message = error.message;
      if (error.status === 401) disconnect(error.message);
    }
  }
  busy = false;
  render();
}

function add(fileList) {
  if (busy) return;
  for (const file of fileList) entries.push({ file, status: 'Queued' });
  render();
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 ** 2).toFixed(1) + ' MB';
}

function renderEntry(entry) {
  const row = document.createElement('li');
  const name = document.createElement('strong');
  name.textContent = entry.file.name;
  const status = document.createElement('small');
  status.textContent = [formatSize(entry.file.size), entry.status, entry.message].filter(Boolean).join(' · ');
  row.append(name);
  if (entry.link) {
    const link = document.createElement('a');
    link.href = entry.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open in Drive';
    row.append(link);
  } else if (entry.status !== 'Uploading') {
    const action = document.createElement('button');
    const retry = entry.status === 'Needs retry';
    action.textContent = retry ? 'Retry' : 'Remove';
    action.setAttribute('aria-label', action.textContent + ' ' + entry.file.name);
    action.disabled = busy || (retry && (authorizing || !token || entry.owner !== identity));
    if (retry && token && entry.owner !== identity) {
      status.textContent += ' · Reconnect with the original Google account to retry.';
    }
    action.onclick = () => {
      if (retry) return run([entry]);
      entries.splice(entries.indexOf(entry), 1);
      render();
    };
    row.append(action);
  }
  row.append(status);
  if (entry.status === 'Uploading') {
    entry.progress = document.createElement('progress');
    entry.progress.max = 100;
    entry.progress.value = entry.percent;
    entry.progress.setAttribute('aria-label', 'Upload progress for ' + entry.file.name);
    row.append(entry.progress);
  }
  return row;
}

function render() {
  const queued = entries.filter(entry => entry.status === 'Queued');
  const uploaded = entries.filter(entry => entry.status === 'Uploaded').length;
  const failed = entries.filter(entry => entry.status === 'Needs retry').length;
  queue.replaceChildren(...entries.map(renderEntry));
  connect.disabled = busy || authorizing;
  connect.textContent = token ? 'Reconnect Google Drive' : 'Connect Google Drive';
  folder.disabled = busy || authorizing || !token;
  byId('folder-name').disabled = folder.disabled;
  byId('create-folder').disabled = folder.disabled;
  files.disabled = busy;
  upload.disabled = busy || authorizing || !token || !folder.value || !queued.length;
  byId('summary').textContent = entries.length
    ? `${uploaded} uploaded · ${failed} need retry · ${queued.length} queued`
    : 'No files selected.';
}

files.onchange = () => {
  add(files.files);
  files.value = '';
};
for (const event of ['dragenter', 'dragover']) {
  drop.addEventListener(event, e => {
    e.preventDefault();
    if (!busy) drop.classList.add('over');
  });
}
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', event => {
  event.preventDefault();
  drop.classList.remove('over');
  add(event.dataTransfer.files);
});
window.addEventListener('dragover', event => event.preventDefault());
window.addEventListener('drop', event => event.preventDefault());
byId('new-folder').onsubmit = async event => {
  event.preventDefault();
  const input = byId('folder-name');
  const name = input.value.trim();
  if (!name || busy || authorizing || !token) return;
  busy = true;
  render();
  try {
    const created = await request('/files?fields=id,name', { name, mimeType: folderType });
    folder.add(new Option(created.name, created.id, false, true));
    input.value = '';
    notice.textContent = 'Destination folder created in My Drive.';
  } catch (error) {
    if (error.status === 401) disconnect(error.message);
    else notice.textContent = error.message;
  } finally {
    busy = false;
    render();
  }
};
folder.onchange = render;
upload.onclick = () => run(entries.filter(entry => entry.status === 'Queued'));
render();
