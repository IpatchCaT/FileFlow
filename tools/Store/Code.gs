// Drive Uploader v2 (fast) - backend
// The file bytes no longer pass through Apps Script. This script only finds
// your folder and hands the page a short-lived token, and the browser then
// uploads straight to Google Drive.

const FOLDER_NAME = 'My Uploads'; // change to any folder name you like

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Upload to Drive')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Finds (or creates) the upload folder once, then remembers its id.
function getFolderId_() {
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty('FOLDER_ID');
  if (saved) {
    try {
      const f = DriveApp.getFolderById(saved);
      if (!f.isTrashed() && f.getName() === FOLDER_NAME) return saved;
    } catch (e) {}
  }
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder.getId();
}

// Called by the page. Returns a token (about 1 hour) and the folder id.
function getUploadInfo() {
  return { token: ScriptApp.getOAuthToken(), folderId: getFolderId_() };
}
