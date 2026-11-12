# Task Recorder

A static, client-side task dashboard with a searchable Records view and native
Excel exports. There is no build step, account setup, or server-side database.

## Run locally

From the directory containing `task-recorder/`, run:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/task-recorder/` in your browser. Use **New Heading**
to create a work area, then add tasks directly to its card. Use the three-dot
menus to rename, reorder, or delete headings and to edit, reorder, move, or
delete tasks. Expand **Completed** on a card to reopen a task.

## Export

Use **Export to Excel** to download all tasks or only the current filtered
records. The Tasks sheet has one row per task, filterable column headers, and
Excel date cells in your browser's local time. Pending tasks have a blank
completion date.

## Add to Fileflow or deploy

Copy the entire `task-recorder/` directory into Fileflow's existing static
publishing directory. If Fileflow publishes its repository root, place
`task-recorder/` at the root. If it publishes a build output, configure the
existing build to copy the directory into that output. Commit the app files
on a branch and preview the deployed `/task-recorder/` path using Fileflow's
existing deployment workflow. For independent hosting, publish the contents
of `task-recorder/` as the site's root. Use HTTPS for deployment.

The app uses the namespaced browser storage key `fileflow.task-recorder.v1`.
Records stay with the browser profile and site origin. A different browser
profile, host, or port starts with separate records. Clearing site data removes
the saved tasks. Export an Excel copy when you need a portable record.

Excel files are created locally using the bundled JSZip distribution. Its
license is included in `JSZip-LICENSE.txt`.
