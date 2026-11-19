# Editable checklists and individual heading dropdowns

## Upload
Download a backup from your current app. Extract this ZIP and upload index.html, app.js, style.css and workbook.js together to tools/task-recorder/ in GitHub. The included JSZip files are unchanged. Refresh after the Pages deployment finishes.

## Editable checklist
The Notes editor is replaced by Checklist. Each checklist row has a checkbox, directly editable text and a Remove button. Select + Add item to add a row; Enter while editing also adds a row. Select Save checklist after edits. Ticking an item saves the current checklist automatically. Blank rows are omitted when saving. Editing an existing row preserves its checked state.

Quick Add offers Add checklist (optional). Edit Task uses the same editable rows and saves them with Save changes. Existing notes become checklist rows and existing checks are preserved. Checklist checks are independent of the parent work item's completion.

## Main heading dropdown
Each main heading has its own arrow: ▾ when open and ▸ when closed. Click the arrow to open or close only that main heading. The title and counts stay visible. All its subheadings and work items stay stored. Other headings are unaffected. Open/closed settings persist after refresh.

## Compatibility and verification
JSON backup format remains version 4, with support for older backups. Existing saved data is preserved. Excel now labels the column Checklist and includes [x]/[ ] states.

Automated simulations passed for adding, editing, removing and checking checklist rows, preserving checks when editing, quick-add, reload persistence, backups, Excel output, individual heading dropdowns, legacy data migration and existing view rendering. Live browser appearance and mobile interaction remain unverified because Chromium cannot launch in this environment.
