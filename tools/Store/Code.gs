// Drive Uploader - backend (Google Apps Script)
// Files are saved into a folder in YOUR Google Drive.

const FOLDER_NAME = 'My Uploads'; // change to any folder name you like

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Upload to Drive')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getFolder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

// Called from the page for each file
function saveFile(name, mimeType, base64) {
  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, mimeType || 'application/octet-stream', name);
  const file = getFolder_().createFile(blob);
  return { id: file.getId(), name: file.getName(), url: file.getUrl() };
}

// Shows the 10 most recent uploads on the page
function recentFiles() {
  const files = getFolder_().getFiles();
  const list = [];
  while (files.hasNext()) {
    const f = files.next();
    list.push({ name: f.getName(), url: f.getUrl(), time: f.getDateCreated().getTime() });
  }
  return list.sort((a, b) => b.time - a.time).slice(0, 10);
}
