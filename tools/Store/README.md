# FileFlow Drive Uploader

## 1. Configure Google Cloud once

1. Open the [Google Cloud console](https://console.cloud.google.com/) and create or select a project. Under **APIs & Services → Library**, enable **Google Drive API**.
2. In **Google Auth Platform**, set up **Branding** and **Audience**. For a personal Gmail account, choose **External**. While the app is in **Testing**, add your Google account under **Audience → Test users**.
3. Under **Data Access**, add `https://www.googleapis.com/auth/drive.file`. FileFlow uses this permission to upload files and manage the destinations it creates.
4. Under **Clients**, create an OAuth client of type **Web application**. Add `https://ipatchcat.github.io` to **Authorized JavaScript origins**. An origin contains only the scheme and host, so leave out `/FileFlow/` and the trailing slash. If Pages uses a custom domain, register its actual HTTPS origin instead. This popup flow needs no redirect URI.
5. Copy the **Client ID** ending in `.apps.googleusercontent.com` and put it between the quotes in `tools/drive-uploader/config.js`. You can edit the file on GitHub using the pencil button. The client ID is public. Keep the client secret out of GitHub.

[Google Identity Services setup](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid) · [Drive upload documentation](https://developers.google.com/workspace/drive/api/guides/manage-uploads)

## 2. Upload through GitHub

1. Extract the ZIP. In the [FileFlow repository](https://github.com/IpatchCaT/FileFlow), open the root of the branch that GitHub Pages publishes, expected to be `main`.
2. Click **Add file → Upload files**. Drag the extracted `index.html` and `tools` folder onto the upload area. Check that the upload shows `tools/drive-uploader/index.html` and the other uploader files under the same path. Commit the changes from the web interface.
3. The ZIP includes a replacement root `index.html` based on FileFlow commit `42c9134`. If your homepage has changed since then, upload only the `tools` folder and add this link inside the homepage's existing navigation instead:
   `<a class="drive-link" href="tools/drive-uploader/">Drive Uploader</a>`
4. After Pages redeploys, open [Drive Uploader](https://ipatchcat.github.io/FileFlow/tools/drive-uploader/) or click **Drive Uploader** from FileFlow’s sidebar.

## 3. Send files to Drive

1. Click **Connect Google Drive** and select the account you added as a test user.
2. Check the displayed account and choose a destination. FileFlow creates **FileFlow Uploads** in My Drive on first connection. You can create more destinations from the page and switch between them. The limited permission only shows writable folders accessible to this app, so arbitrary existing folders from My Drive may be absent.
3. Choose or drop files, then click **Upload to Drive**. Check the summary, and use **Open in Drive** to confirm that a successful file is in the selected folder.
4. If one file fails, click **Retry** on its row. Retry uses the original account and destination. If prompted, reconnect with the same Google account first. Keep the page open during uploads. Closing or refreshing the tab clears the queue.

FileFlow sends file data directly to Google Drive. Files inherit the destination’s sharing settings. The tool does not change sharing permissions.
