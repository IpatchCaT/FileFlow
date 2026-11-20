# Drive Uploader

A small web page that uploads files straight into a folder in your own Google Drive. It runs as a free Google Apps Script web app, so you can open one link from any device, pick or drag a file, and it is saved to Drive.

## Files

| File | Purpose |
|------|---------|
| `Code.gs` | Backend. Saves each uploaded file into a Drive folder and lists recent uploads. |
| `Index.html` | The upload page (choose files or drag and drop, shows status per file). |
| `README.md` | This guide. |

Keep the two code files separate. Do not paste the Apps Script code into the HTML file.

## Full setup guide

### Before you start

- A Google account (the one whose Drive will store the files)
- A GitHub account
- The files `Code.gs`, `Index.html` and `README.md`

### Part 1: Create the Apps Script project

1. Open [script.google.com](https://script.google.com) while signed in to only the Google account you want to use.
2. Click **New project**.
3. Rename the project (for example `Drive Uploader`).

### Part 2: Add the code

**Backend file**
1. In the left sidebar, click **Code.gs**.
2. Delete the default code.
3. Paste in the contents of `Code.gs` and press **Ctrl+S**.

**Page file**
1. Click **+** next to **Files** and choose **HTML**.
2. Name it exactly `Index` (capital I). Apps Script adds `.html` itself.
3. Delete the default content, paste in the contents of `Index.html`, and save.

The sidebar should show `Code.gs` and `Index.html`.

### Part 3: Approve permissions

This step prevents the "Loading..." hang.

1. In the function dropdown at the top (next to **Run**), choose `recentFiles`.
2. Click **Run**.
3. Click **Review permissions** and choose your account.
4. If you see "Google hasn't verified this app", click **Advanced**, then **Go to Drive Uploader (unsafe)**. This is normal for your own script.
5. Click **Allow**.

A folder named **My Uploads** now exists in your Drive.

### Part 4: Deploy as a web app

1. Click **Deploy -> New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - Description: `v1`
   - Execute as: **Me**
   - Who has access: **Only myself**
4. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).

### Part 5: Test it

1. Open the URL in a new tab. If several Google accounts are signed in, use an Incognito window and sign in with only the right account.
2. Click **Choose files** and pick a small file.
3. Wait for **Saved**, then check the **My Uploads** folder in Drive.
4. Bookmark the page. On a phone, use **Add to Home screen** so it works like an app.

If it hangs, open **Executions** in the Apps Script sidebar to see the error.

### Part 6: Create the GitHub repo

1. Sign in at [github.com](https://github.com) and click **+ -> New repository**.
2. Name it `drive-uploader`.
3. Choose **Private** (recommended).
4. Tick **Add a README file** and click **Create repository**.

### Part 7: Upload the files to GitHub

1. Open the repo and click **Add file -> Upload files**.
2. Drag in `Code.gs`, `Index.html` and `README.md`. The uploaded README replaces the default one.
3. Write a commit message such as `Add Drive uploader files`.
4. Select **Commit directly to the main branch** and click **Commit changes**.

### Part 8: Updating later

1. Edit the code in the Apps Script editor and save.
2. Click **Deploy -> Manage deployments -> Edit (pencil) -> Version: New version -> Deploy**. Without this step the live link keeps running the old code.
3. To keep GitHub in sync, open the file in the repo, click the pencil icon, paste the new code, and commit.

## Settings

- **Folder name:** change `FOLDER_NAME` at the top of `Code.gs`.
- **Size limit:** `MAX_MB` in `Index.html` is 30 MB. Apps Script handles roughly 50 MB per upload, so keep it below that.

## Troubleshooting

| Problem | Fix |
|---|---|
| Page stuck on "Loading..." or "Uploading..." | Run `recentFiles` once and approve permissions (Part 3). Try Incognito with a single signed-in account. |
| "File not found: Index" error | Rename the HTML file to exactly `Index`. |
| Blank page | Check that `Index.html` has only the page code and `Code.gs` only the backend code. |
| Changes do not show up | Create a **New version** in Manage deployments (Part 8). |
| "Too big" message | The page limit is 30 MB. Compress or zip the file, or use the Drive site for large files. |
| Slow uploads | Normal for Apps Script (files are base64 encoded and sent one at a time). Upload fewer or smaller files on stable Wi-Fi. |

## Checklist

- [ ] `Code.gs` and `Index.html` both in the Apps Script project
- [ ] `recentFiles` run once and permissions approved
- [ ] Deployed as web app, access set to **Only myself**
- [ ] Test upload appears in **My Uploads** in Drive
- [ ] GitHub repo created with the three files committed

## Notes

- Only your Google account can open the page when access is set to **Only myself**.
- Do not commit passwords or API keys to this repo. The tool does not need any.
