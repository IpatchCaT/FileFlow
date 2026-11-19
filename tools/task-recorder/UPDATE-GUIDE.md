# Task Recorder: subheadings and work checklists

## Enhanced prompt
Update the existing FileFlow Task Recorder to use three levels: Main heading → Highlighted subheading → Work checklist. Keep the main heading as the overall work title. Allow users to add, rename and reorder subheadings using consistent highlighting. Each subheading contains work items with individual checkboxes. Checking an item marks it completed and saves its state; unchecking reopens it. Keep checked items visible beneath their subheading. Preserve existing tasks, notes, deadlines and other features. Include the subheading in records, Excel exports and JSON backups.

## Upload
1. In the existing live app, download a JSON backup using Backup & Restore.
2. Extract this ZIP on your computer.
3. Open your GitHub repository's tools/task-recorder/ folder.
4. Use Add file → Upload files to replace index.html, app.js, style.css and workbook.js together. The ZIP also contains unchanged jszip.min.js and JSZip-LICENSE.txt for completeness.
5. Commit the upload. After the Pages deployment completes, refresh the app (Ctrl+Shift+R if necessary).
6. Your existing browser records load under a General subheading in each main heading. Use its three-dot menu to rename it.

## Use
- New heading creates the main work title and an initial General subheading.
- Add subheading creates another highlighted section.
- Enter a work item beneath its section and press Add or Enter. Optional task notes remain available.
- Check each work item as you finish it. Completed work remains visible and can be unchecked.
- Edit a task and choose another Subheading to reorganise it within its main heading.
- Move to heading moves an item into that heading's first subheading; use Edit to choose another one.
- Subheading menus allow renaming and ordering. A subheading can be deleted only when empty, and each main heading retains at least one.
- Main heading progress counts all checklist items across its subheadings.
- The left heading index continues to list only main headings.
- New JSON backups use format version 3; this version also restores older version 1 and 2 backups. Older app versions cannot restore version 3 backups.

## Verification
Automated Node simulations passed: loading legacy saved tasks and notes; quick-add with notes into a chosen subheading; checking and unchecking; saving and reloading; changing a task's subheading; duplicating headings with distinct group IDs; JSON round-trip; rejection of invalid subheading references; subheading search; Today deadline grouping; rendering dashboard, Today, records, weekly and archive views; actual XLSX generation containing subheading and note values.

A live browser could not launch in the execution environment. Visual mobile layout, real keyboard navigation and calendar handoff were not browser-tested for this update. After upload, try one main heading with two subheadings, add and tick an item, refresh, then check its notes and export.
