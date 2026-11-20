# Drive Uploader

A small web page that uploads files straight into a folder in your own Google Drive. It runs as a free Google Apps Script web app, so you can open one link from any device, pick or drag a file, and it is saved to Drive.

## Files

| File | Purpose |
|------|---------|
| `Code.gs` | Backend. Saves each uploaded file into a Drive folder and lists recent uploads. |
| `Index.html` | The upload page (choose files or drag and drop, shows status per file). |

## Setup

1. Go to [script.google.com](https://script.google.com) and click **New project**.
2. Replace the contents of the default `Code.gs` with the `Code.gs` from this repo.
3. Click **+** next to Files, choose **HTML**, name it `Index`, and paste in the contents of `Index.html`.
4. Click **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Only myself**
5. Click **Deploy** and approve the Drive permission. Google may show an "unverified app" warning because it is your own script. Click **Advanced**, then continue.
6. Open the web app link. On a phone, bookmark it or use **Add to Home screen**.

## Usage

- Click **Choose files** or drag files onto the page.
- Each file shows its own status: Uploading, Saved, or Failed.
- Files are saved in a Drive folder named **My Uploads** (created automatically).
- The 10 most recent uploads are listed at the bottom with links.

## Settings

- **Folder name:** change `FOLDER_NAME` at the top of `Code.gs`.
- **Size limit:** `MAX_MB` in `Index.html` is set to 30 MB. Apps Script handles roughly 50 MB per upload, so keep it below that.

## Updating the app

After editing the code in Apps Script, go to **Deploy → Manage deployments → Edit → New version** so the live link uses your changes.

## Notes

- Only your Google account can open the page when access is set to **Only myself**.
- Do not commit passwords or API keys to this repo. The tool does not need any.
