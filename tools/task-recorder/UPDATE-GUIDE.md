# Task notes checklists and collapsible main headings

Replace index.html, app.js, style.css and workbook.js together in tools/task-recorder/ using GitHub's upload interface. Extract the ZIP first. The included JSZip files are unchanged. Download a JSON backup from your current app before uploading. Refresh after GitHub Pages finishes deploying.

## Notes checklists
Each non-empty line in task notes becomes a separate checkbox item. Existing text is preserved, with one checklist item per non-empty line. Open Task notes to tick items. Checked items have a strikethrough and the summary shows how many are done.

Edit the text below the list, one item per line, then select Save notes. Ticking a checkbox automatically saves the current notes text and checklist state. Edit Task uses the same checklist; its changes are committed with Save changes. Quick Add accepts one notes item per line.

Unchanged lines keep their checked state when you reorder them. Renamed and newly added lines start unchecked. Duplicate lines retain their checked states in order. Checking notes does not complete the parent work item.

## Hide or show a main heading's contents
Select Hide contents on a main heading to collapse all its subheadings, checklist items and notes. The main heading title and counts stay visible. Select Show contents to expand it again. This setting is saved per heading and restored on refresh. Hidden content is not deleted and remains available in records, Today, backups and exports. Archived headings support this control too.

## Data and verification
JSON backups now use version 4 and preserve notes checkmarks and heading collapse settings. Older backup versions 1–3 still load. Older app versions cannot restore version 4 backups. Excel notes use [x] and [ ] to preserve completion information.

Automated simulations passed: legacy data conversion; note toggling independently of task completion; persistence after reload; editing notes in the task dialog; reordered/duplicate lines; backup restoration; Excel checkmark output; main heading hide/show and persistence; quick-add, task completion, duplication, Today grouping, all view renderers, and subheading export.

Live browser visual, mobile and keyboard checks remain unverified because the browser could not launch in this environment.
