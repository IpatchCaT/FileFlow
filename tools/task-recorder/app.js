"use strict";

const storageKey = "fileflow.task-recorder.v1";
const byId = id => document.getElementById(id);
const search = byId("search");
const headingFilter = byId("heading-filter");
const statusFilter = byId("status-filter");
const sort = byId("sort");
const archiveFilter = byId("archive-filter");
const content = byId("content");
const dialog = byId("dialog");
const dialogBody = byId("dialog-body");
const form = byId("dialog-form");
const expanded = new Set();
const drafts = new Map();
const noteDrafts = new Map();
const openNotePanels = new Set();
const noteLimit = 4000;
const accents = ["#6c9c77", "#c5955b", "#8191b6", "#a581a0"];

let headings = [];
let view = "dashboard";
let storageIssue = "";
let submitDialog;
let undoDeletion;
let selectedWeek = "";
let todaySection = "";
let renderedDay = "";
let midnightTimer;

const views = {
  dashboard: ["Work dashboard", "Organise your work and check off tasks as you go."],
  today: ["Today", "Review deadlines and follow-ups across active headings."],
  records: ["Task records", "Search, filter, and export your task history."],
  weekly: ["Weekly Summary", "Review completed work and share your current open tasks."],
  archived: ["Archived headings", "Review finished projects or restore them to the dashboard."]
};

function calendarDay(date = new Date()) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromDay(value) {
  return new Date(`${value}T12:00:00`);
}

function validDay(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(dateFromDay(value).getTime()) && calendarDay(dateFromDay(value)) === value;
}

const dateOnly = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const displayDay = value => value ? dateOnly.format(dateFromDay(value)) : "";
const taskStatus = task => task.completed ? "Completed" : task.waiting ? "Waiting" : "Pending";

function webLink(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
  headings = normalizeHeadings(saved);
} catch {
  storageIssue = "Saved records could not be loaded. Changes will be kept for this session only.";
}

function notify(message = "") {
  byId("notice").textContent = [storageIssue, message].filter(Boolean).join(" ");
  byId("undo").hidden = !undoDeletion;
}

function downloadFile(blob, filename) {
  const link = element("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function parseBackup(text) {
  const backup = JSON.parse(text);
  if (backup?.format !== "fileflow-task-recorder" || ![1, 2, 3, 4].includes(backup.version)) {
    throw new Error("Invalid backup format");
  }
  return normalizeHeadings(backup.headings);
}

function normalizeHeadings(data) {
  if (!Array.isArray(data)) throw new Error("Invalid heading list");
  const ids = new Set();
  function validId(id) {
    if (typeof id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(id) || ids.has(id)) return false;
    ids.add(id);
    return true;
  }
  const validText = value => typeof value === "string" && value.trim() && value.length <= 300;
  const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

  const optionalText = (value, max) => value === undefined || (typeof value === "string" && value.length <= max);
  const optionalDay = value => value === undefined || value === "" || validDay(value);
  const optionalFlag = value => value === undefined || typeof value === "boolean";
  return data.map(heading => {
    if (!heading || !validId(heading.id) || !validText(heading.name) || !Array.isArray(heading.tasks) || !optionalFlag(heading.archived) || !optionalFlag(heading.collapsed) ||
        !optionalText(heading.notes, noteLimit)) {
      throw new Error("Invalid heading");
    }
    const subheadings = heading.subheadings === undefined
      ? [{ id: crypto.randomUUID(), name: "General" }]
      : heading.subheadings;
    if (!Array.isArray(subheadings) || !subheadings.length || subheadings.some(group =>
      !group || !validId(group.id) || !validText(group.name))) throw new Error("Invalid subheading");
    const tasks = heading.tasks.map(task => {
      const subheadingId = task.subheadingId ?? subheadings[0].id;
      if (!subheadings.some(group => group.id === subheadingId)) throw new Error("Invalid task subheading");
      if (!task || !validId(task.id) || !validText(task.text) || !validDate(task.added) ||
          (task.completed !== null && !validDate(task.completed)) || !optionalFlag(task.waiting) ||
          !optionalDay(task.due) || !optionalDay(task.followUp) || !optionalText(task.waitingFor, 300) ||
          !optionalText(task.notes, 4000) ||
          (task.noteChecks !== undefined && (!Array.isArray(task.noteChecks) || task.noteChecks.length !== noteLines(task.notes).length || task.noteChecks.some(value => typeof value !== "boolean"))) || !optionalText(task.link, 2000) ||
          (task.link && !webLink(task.link))) throw new Error("Invalid task");
      return {
        id: task.id, subheadingId, text: task.text, added: task.added, completed: task.completed,
        due: task.due ?? "", followUp: task.followUp ?? "", waiting: Boolean(task.waiting),
        waitingFor: task.waitingFor ?? "", notes: task.notes ?? "", noteChecks: noteLines(task.notes).map((_, i) => task.noteChecks?.[i] ?? false), link: task.link ?? ""
      };
    });
    return { id: heading.id, name: heading.name, collapsed: Boolean(heading.collapsed), archived: Boolean(heading.archived), notes: heading.notes ?? "", subheadings: subheadings.map(({id, name}) => ({id, name})), tasks };
  });
}

function save(message = "") {
  if (!storageIssue.startsWith("Saved records")) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(headings));
      storageIssue = "";
    } catch {
      storageIssue = "Browser storage is unavailable. Export your records before closing the page.";
    }
  }
  render();
  notify(message);
}

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function button(text, action, className = "") {
  const node = element("button", className, text);
  node.type = "button";
  node.addEventListener("click", action);
  return node;
}

function openDialog(title, field, confirmText, action) {
  byId("calendar-download").hidden = true;
  byId("calendar-download").onclick = null;
  byId("dialog-title").textContent = title;
  dialogBody.replaceChildren(field);
  byId("confirm").textContent = confirmText;
  byId("confirm").classList.remove("destructive");
  submitDialog = action;
  dialog.showModal();
  dialogBody.querySelector("input, select, textarea")?.focus();
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const confirm = byId("confirm");
  if (confirm.disabled) return;
  confirm.disabled = true;
  try {
    if (await submitDialog(new FormData(form)) !== false) dialog.close();
  } finally {
    confirm.disabled = false;
  }
});
byId("cancel").addEventListener("click", () => {
  if (!byId("confirm").disabled) dialog.close();
});

function textDialog(title, label, value, confirm, action) {
  const field = element("label", "", label);
  const input = element("input");
  input.autocomplete = "off";
  input.spellcheck = false;
  input.required = true;
  input.maxLength = 300;
  input.value = value;
  field.append(input);
  input.addEventListener("input", () => input.setCustomValidity(""));
  openDialog(title, field, confirm, () => {
    const text = input.value.trim();
    if (!text) {
      input.setCustomValidity("Enter a name.");
      input.reportValidity();
      return false;
    }
    action(text);
  });
  input.select();
}

function newHeading() {
  textDialog("New heading", "Heading name", "", "Create heading", name => {
    headings.push({ id: crypto.randomUUID(), name, subheadings: [{ id: crypto.randomUUID(), name: "General" }], tasks: [] });
    headingFilter.value = "";
    search.value = "";
    view = "dashboard";
    save();
  });
}

function reorder(items, item, offset) {
  const index = items.indexOf(item);
  const [moved] = items.splice(index, 1);
  items.splice(index + offset, 0, moved);
  save();
}

function menu(label, actions) {
  const details = element("details", "menu");
  const summary = element("summary", "", "⋯");
  summary.setAttribute("aria-label", label);
  const panel = element("div", "menu-actions");
  for (const [name, action, disabled] of actions) {
    const item = button(name, () => {
      details.open = false;
      action();
    });
    item.disabled = Boolean(disabled);
    panel.append(item);
  }
  details.append(summary, panel);
  return details;
}

function removeHeading(heading) {
  const remove = () => {
    const index = headings.indexOf(heading);
    if (index < 0) return;
    headings.splice(index, 1);
    undoDeletion = () => headings.splice(index, 0, heading);
    expanded.delete(heading.id);
    drafts.delete(heading.id);
    for (const key of [`Heading-${heading.id}`, ...heading.subheadings.map(group => `Quick-${heading.id}-${group.id}`), ...heading.tasks.map(task => `Task-${task.id}`)]) {
      noteDrafts.delete(key);
      openNotePanels.delete(key);
    }
    save("Heading deleted.");
  };
  if (!heading.tasks.length) return remove();
  openDialog("Delete heading?", element("p", "", `“${heading.name}” and its ${heading.tasks.length} task(s) will be deleted.`), "Delete heading", remove);
}

function moveTask(heading, task) {
  const field = element("label", "", "Destination heading");
  const select = element("select");
  select.name = "destination";
  for (const item of headings.filter(item => item !== heading && !item.archived)) {
    select.add(new Option(item.name, item.id));
  }
  field.append(select);
  openDialog("Move task", field, "Move task", data => {
    const destination = headings.find(item => item.id === data.get("destination"));
    if (!destination) return false;
    task.subheadingId = destination.subheadings[0].id;
    destination.tasks.push(task);
    heading.tasks = heading.tasks.filter(item => item !== task);
    save(`Task moved to ${destination.name}.`);
  });
}

function matches(task) {
  const query = search.value.trim().toLocaleLowerCase();
  const owner = headings.find(heading => heading.tasks.some(item => item.id === task.id));
  const groupName = task.subheading || owner?.subheadings.find(group => group.id === task.subheadingId)?.name;
  return [task.text, task.notes, task.link, task.waitingFor, groupName].some(value => value?.toLocaleLowerCase().includes(query));
}

function calendarTimestamp(date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function calendarText(value) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/[,;]/g, "\\$&");
}

function foldCalendarLine(line) {
  const encoder = new TextEncoder();
  let folded = "";
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) {
      folded += "\r\n ";
      bytes = 1;
    }
    folded += character;
    bytes += size;
  }
  return folded;
}

function calendarReminder(start, now) {
  const previousDay = new Date(start);
  previousDay.setDate(previousDay.getDate() - 1);
  if (previousDay > now) return { time: previousDay, label: "one day before" };

  const earlier = new Date(start.getTime() - 15 * 60_000);
  if (earlier > now && calendarDay(earlier) === calendarDay(start)) {
    return { time: earlier, label: "15 minutes before" };
  }
  return { time: start, label: "at the event time" };
}

function calendarFile(event, taskId, now) {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FileFlow//Task Recorder//EN",
    "BEGIN:VEVENT", `UID:${taskId}@fileflow-task-recorder`,
    `DTSTAMP:${calendarTimestamp(now)}`,
    `DTSTART:${calendarTimestamp(event.start)}`,
    `DTEND:${calendarTimestamp(event.end)}`,
    `SUMMARY:${calendarText(event.title)}`,
    `DESCRIPTION:${calendarText(event.details)}`,
    "BEGIN:VALARM", "ACTION:DISPLAY",
    `TRIGGER;VALUE=DATE-TIME:${calendarTimestamp(event.reminder.time)}`,
    `DESCRIPTION:${calendarText(event.title)}`,
    "END:VALARM", "END:VEVENT", "END:VCALENDAR"
  ].map(foldCalendarLine).join("\r\n") + "\r\n";
}

function openCalendar(heading, task) {
  const panel = element("div", "calendar-dialog");
  const fields = element("div", "calendar-fields");
  const eventDate = element("input");
  eventDate.type = "date";
  eventDate.required = true;
  eventDate.value = task.due;
  eventDate.min = calendarDay();
  const eventTime = element("input");
  eventTime.type = "time";
  eventTime.required = true;
  eventTime.value = "09:00";
  const dateLabel = element("label", "", "Calendar date");
  const timeLabel = element("label", "", "Calendar time");
  dateLabel.append(eventDate);
  timeLabel.append(eventTime);
  fields.append(dateLabel, timeLabel);
  const reminderHint = element("p", "small");
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const title = `Due · ${task.text}`;
  const details = `Heading: ${heading.name}\nSubheading: ${heading.subheadings.find(group => group.id === task.subheadingId)?.name ?? ""}\nOriginal due date: ${task.due}`;
  panel.append(
    element("strong", "", task.text),
    element("p", "small", `${heading.name} · Due ${displayDay(task.due)}`),
    fields,
    element("p", "small", zone ? `Time zone: ${zone}` : "Device local time"),
    reminderHint,
    element("p", "small", "Confirm the reminder in your calendar and choose email or a device notification if available."),
    element("p", "small", "If the task is rescheduled or completed, update or remove the event in your calendar.")
  );

  function selectedStart() {
    return new Date(`${eventDate.value}T${eventTime.value}`);
  }

  function refreshReminder() {
    eventDate.setCustomValidity("");
    eventTime.setCustomValidity("");
    const start = selectedStart();
    const now = new Date();
    reminderHint.textContent = start > now
      ? `Suggested reminder: ${calendarReminder(start, now).label}.`
      : "Choose a future calendar date and time. The original due date stays in the event details.";
  }

  function selectedEvent() {
    refreshReminder();
    const now = new Date();
    eventDate.min = calendarDay(now);
    if (!eventDate.reportValidity() || !eventTime.reportValidity()) return null;
    const start = selectedStart();
    if (!(start > now) || calendarDay(start) !== eventDate.value ||
        start.toTimeString().slice(0, 5) !== eventTime.value) {
      eventTime.setCustomValidity("Choose a valid future time in your time zone.");
      eventTime.reportValidity();
      return null;
    }
    return { title, details, start, end: new Date(start.getTime() + 15 * 60_000), reminder: calendarReminder(start, now) };
  }

  eventDate.addEventListener("input", refreshReminder);
  eventTime.addEventListener("input", refreshReminder);
  refreshReminder();
  openDialog("Add to calendar", panel, "Open in Google Calendar", () => {
    const event = selectedEvent();
    if (!event) return false;
    const url = new URL("https://calendar.google.com/calendar/render");
    url.search = new URLSearchParams({
      action: "TEMPLATE", text: event.title, details: event.details,
      dates: `${calendarTimestamp(event.start)}/${calendarTimestamp(event.end)}`
    });
    window.open(url.href, "_blank", "noopener,noreferrer");
    notify("Finish saving in Google Calendar.");
  });
  const download = byId("calendar-download");
  download.hidden = false;
  download.onclick = () => {
    const event = selectedEvent();
    if (!event) return;
    const file = new Blob([calendarFile(event, task.id, new Date())], { type: "text/calendar;charset=utf-8" });
    downloadFile(file, "fileflow-deadline.ics");
    dialog.close();
    notify("Calendar file downloaded.");
  };
}

function taskRow(heading, task, siblings, showHeading = false) {
  const row = element("li", task.completed ? "task done" : "task");
  const label = element("label");
  const checkbox = element("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(task.completed);
  checkbox.addEventListener("change", () => {
    task.completed = checkbox.checked ? new Date().toISOString() : null;
    if (checkbox.checked) task.waiting = false;
    save();
    content.querySelector(`[data-task-id="${task.id}"] input`)?.focus();
  });
  const copy = element("span", "task-copy");
  copy.append(element("span", "task-text", task.text));
  const metadata = [];
  if (showHeading) metadata.push(heading.name, heading.subheadings.find(group => group.id === task.subheadingId)?.name);
  if (task.waiting && !task.completed) metadata.push(task.waitingFor ? `Waiting for ${task.waitingFor}` : "Waiting");
  if (task.due) metadata.push(`${!task.completed && task.due < calendarDay() ? "Overdue" : "Due"} ${displayDay(task.due)}`);
  if (task.waiting && task.followUp && !task.completed) metadata.push(`Follow-up ${displayDay(task.followUp)}`);
  if (metadata.length) copy.append(element("small", "task-meta", metadata.join(" · ")));
  label.append(checkbox, copy);
  row.dataset.taskId = task.id;
  const position = siblings.indexOf(task);
  const shift = offset => {
    const other = siblings[position + offset];
    const first = heading.tasks.indexOf(task);
    const second = heading.tasks.indexOf(other);
    [heading.tasks[first], heading.tasks[second]] = [heading.tasks[second], heading.tasks[first]];
    save();
  };
  const actions = [
    ["Move up", () => shift(-1), showHeading || position === 0],
    ["Move down", () => shift(1), showHeading || position === siblings.length - 1],
    ["Move to heading", () => moveTask(heading, task), !headings.some(item => item !== heading && !item.archived)],
    ["Delete task", () => {
      const index = heading.tasks.indexOf(task);
      if (index < 0) return;
      heading.tasks.splice(index, 1);
      noteDrafts.delete(`Task-${task.id}`);
      openNotePanels.delete(`Task-${task.id}`);
      undoDeletion = () => heading.tasks.splice(index, 0, task);
      save("Task deleted.");
    }]
  ];
  const reference = webLink(task.link);
  if (reference) {
    actions.unshift(["Open reference link", () => window.open(reference, "_blank", "noopener,noreferrer")]);
  }
  const controls = element("div", "task-controls");
  const edit = button("Edit", () => editTask(task), "task-edit");
  edit.setAttribute("aria-label", `Edit task: ${task.text}`);
  controls.append(edit);
  if (!task.completed && task.due && !heading.archived) {
    const calendar = button("Add to calendar", () => openCalendar(heading, task), "task-calendar");
    describeControl(calendar, "calendar");
    const icon = element("span", "calendar-icon");
    icon.setAttribute("aria-hidden", "true");
    calendar.prepend(icon);
    controls.append(calendar);
  }
  controls.append(menu(`Actions for ${task.text}`, actions));
  const line = element("div", "task-line");
  line.append(label, controls);
  row.append(line);
  row.append(notesPanel(task, "Task", task.text));
  return row;
}

function taskList(heading, siblings) {
  const list = element("ul");
  list.append(...siblings.filter(matches).map(task => taskRow(heading, task, siblings)));
  return list;
}

function noteLines(text = "") {
  return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function reconcileNoteChecks(previous, checks, next) {
  const queues = new Map();
  noteLines(previous).forEach((line, i) => {
    if (!queues.has(line)) queues.set(line, []);
    queues.get(line).push(Boolean(checks?.[i]));
  });
  return noteLines(next).map(line => queues.get(line)?.shift() ?? false);
}

function resizeChecklistField(field) {
  if (!field.isConnected || !field.getClientRects().length) return;
  field.style.height = "auto";
  const style = getComputedStyle(field);
  const borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  field.style.height = `${Math.ceil(field.scrollHeight + borders)}px`;
}

function resizeChecklistFields() {
  document.querySelectorAll("textarea.checklist-item-input").forEach(resizeChecklistField);
}

window.addEventListener("resize", resizeChecklistFields);
document.addEventListener("toggle", () => requestAnimationFrame(resizeChecklistFields), true);
// Refit wrapping after responsive columns or dialogs change width.
if (typeof ResizeObserver !== "undefined") {
  const widths = new WeakMap();
  const observer = new ResizeObserver(entries => {
    let changed = false;
    for (const entry of entries) {
      if (widths.get(entry.target) !== entry.contentRect.width) {
        widths.set(entry.target, entry.contentRect.width);
        changed = true;
      }
    }
    if (changed) requestAnimationFrame(resizeChecklistFields);
  });
  observer.observe(content);
  observer.observe(dialogBody);
}

function noteEditor(record, label, initialText = record.notes ?? "", onCheck) {
  const panel = element("div", "note-editor");
  // Retain the existing storage format for compatibility with saved records.
  const input = element("input");
  input.type = "hidden";
  input.value = initialText;
  const initialChecks = reconcileNoteChecks(record.notes, record.noteChecks, initialText);
  let items = noteLines(initialText).map((text, i) => ({ text, checked: initialChecks[i] }));
  const list = element("ul", "note-checklist");
  const error = element("p", "small");
  error.setAttribute("role", "alert");
  const nonempty = () => items.filter(item => item.text.trim());
  function sync() {
    input.value = nonempty().map(item => item.text.trim()).join("\n");
    input.dispatchEvent(new Event("input"));
  }
  function draw() {
    list.replaceChildren();
    items.forEach((item, index) => {
      const row = element("li", item.checked ? "editable-check-item checked" : "editable-check-item");
      const checkbox = element("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.checked;
      checkbox.id = `note-check-${record.id}-${index}`;
      checkbox.setAttribute("aria-label", `Complete checklist item ${index + 1}`);
      const text = element("textarea", "checklist-item-input");
      text.rows = 1;
      text.wrap = "soft";
      text.value = item.text;
      text.maxLength = noteLimit;
      text.autocomplete = "off";
      text.spellcheck = false;
      text.placeholder = "Enter checklist item…";
      text.setAttribute("aria-label", `${label}, item ${index + 1}`);
      text.addEventListener("input", () => {
        const previous = item.text;
        text.value = text.value.replace(/[\r\n]+/g, " ");
        item.text = text.value;
        if (nonempty().map(item => item.text.trim()).join("\n").length > noteLimit) {
          item.text = previous;
          text.value = previous;
          error.textContent = "This checklist can contain up to 4,000 characters.";
          return;
        }
        error.textContent = "";
        resizeChecklistField(text);
        sync();
      });
      text.addEventListener("keydown", event => {
        if (event.key === "Enter") {
          event.preventDefault();
          addItem();
        }
      });
      checkbox.addEventListener("change", () => {
        item.checked = checkbox.checked;
        row.className = item.checked ? "editable-check-item checked" : "editable-check-item";
        sync();
        if (onCheck && item.text.trim()) onCheck(input.value, nonempty().map(item => item.checked), checkbox.id);
      });
      const remove = button("Remove", () => {
        items.splice(index, 1);
        sync();
        draw();
        add.focus();
      }, "checklist-remove");
      remove.setAttribute("aria-label", `Remove checklist item ${index + 1}`);
      row.append(checkbox, text, remove);
      list.append(row);
    });
    requestAnimationFrame(resizeChecklistFields);
  }
  function addItem() {
    items.push({text: "", checked: false});
    draw();
    list.querySelector("li:last-child .checklist-item-input")?.focus();
  }
  const add = button("+ Add item", addItem, "checklist-add");
  panel.append(list, add, error, input);
  draw();
  return { panel, input, getChecks: () => nonempty().map(item => item.checked) };
}

function notesPanel(record, kind, name) {
  const key = `${kind}-${record.id}`;
  const panel = element("details", "heading-notes");
  const summary = element("summary", "heading-notes-summary");
  summary.id = `checklist-summary-${record.id}`;
  const count = noteLines(record.notes).length;
  const done = (record.noteChecks ?? []).filter(Boolean).length;
  summary.append(element("span", "", count ? `Checklist · ${done}/${count} done` : "Checklist"));
  if (record.notes?.trim()) summary.append(element("span", "heading-note-preview", record.notes.trim().replace(/\s+/g, " ")));
  panel.open = openNotePanels.has(key);
  panel.addEventListener("toggle", () => {
    if (!panel.isConnected) return;
    if (panel.open) openNotePanels.add(key);
    else openNotePanels.delete(key);
  });
  function commit(text, checks, focusId) {
    record.notes = text;
    record.noteChecks = checks;
    noteDrafts.delete(key);
    openNotePanels.add(key);
    save("Checklist saved.");
    byId(focusId)?.focus();
  }
  const editor = noteEditor(record, `Checklist for ${name}`, noteDrafts.get(key) ?? record.notes ?? "", commit);
  editor.input.id = `notes-${key}`;
  const saveNote = button("Save checklist", () => commit(editor.input.value, editor.getChecks(), `checklist-summary-${record.id}`));
  editor.input.addEventListener("input", () => noteDrafts.set(key, editor.input.value));
  panel.append(summary, editor.panel, element("p", "small", "Save your edits with Save checklist. Ticking an item saves the current list automatically."), saveNote);
  return panel;
}

function headingCard(heading) {
  const index = headings.indexOf(heading);
  const pending = heading.tasks.filter(task => !task.completed);
  const completed = heading.tasks.filter(task => task.completed);
  const card = element("article", "card heading-card");
  card.style.setProperty("--accent", accents[index % accents.length]);
  const header = element("div", "card-header");
  const title = element("div");
  const waiting = pending.filter(task => task.waiting).length;
  const counts = element("div", "heading-counts");
  counts.append(
    element("span", "heading-status status-dot", `${pending.length - waiting} pending`),
    element("span", "heading-status status-dot waiting", `${waiting} waiting`)
  );
  title.append(element("h2", "", heading.name), counts);
  header.append(title, menu(`Actions for ${heading.name}`, [
    ["Rename heading", () => textDialog("Rename heading", "Heading name", heading.name, "Save changes", name => { heading.name = name; save(); })],
    ["Move earlier", () => reorder(headings, heading, -1), index === 0],
    ["Move later", () => reorder(headings, heading, 1), index === headings.length - 1],
    ["Duplicate heading", () => duplicateHeading(heading)],
    [heading.archived ? "Restore heading" : "Archive heading", () => {
      heading.archived = !heading.archived;
      headingFilter.value = "";
      save(heading.archived ? "Heading archived." : "Heading restored to the dashboard.");
    }],
    ["Delete heading", () => removeHeading(heading)]
  ]));
  const contentsId = `heading-contents-${heading.id}`;
  const toggle = button(heading.collapsed ? "▸" : "▾", () => {
    heading.collapsed = !heading.collapsed;
    save();
    byId(`heading-toggle-${heading.id}`)?.focus();
  }, "heading-collapse");
  toggle.id = `heading-toggle-${heading.id}`;
  toggle.setAttribute("aria-expanded", String(!heading.collapsed));
  toggle.setAttribute("aria-controls", contentsId);
  toggle.setAttribute("aria-label", `${heading.collapsed ? "Show" : "Hide"} contents of ${heading.name}`);
  header.prepend(toggle);
  card.append(header);
  const body = element("div", "heading-body");
  body.id = contentsId;
  body.hidden = Boolean(heading.collapsed);
  card.append(body);
  if (heading.collapsed) return card;
  if (heading.tasks.length) {
    const progress = element("progress", "heading-progress");
    progress.max = heading.tasks.length;
    progress.value = completed.length;
    const label = element("label", "progress-label", `${completed.length} of ${heading.tasks.length} completed`);
    label.append(progress);
    body.append(label);
  }
  for (const group of heading.subheadings) {
    const section = element("section", "subheading-section");
    const groupHeader = element("div", "subheading-header");
    const items = heading.tasks.filter(task => task.subheadingId === group.id);
    const groupTitle = element("h3", "", group.name);
    groupTitle.id = `subheading-${group.id}`;
    section.setAttribute("aria-labelledby", groupTitle.id);
    groupHeader.append(groupTitle, element("span", "subheading-count", `${items.filter(task => task.completed).length}/${items.length}`));
    if (!heading.archived) groupHeader.append(menu(`Actions for subheading ${group.name}`, [
      ["Rename subheading", () => textDialog("Rename subheading", "Subheading name", group.name, "Save changes", name => { group.name = name; save(); })],
      ["Move up", () => reorder(heading.subheadings, group, -1), heading.subheadings.indexOf(group) === 0],
      ["Move down", () => reorder(heading.subheadings, group, 1), heading.subheadings.indexOf(group) === heading.subheadings.length - 1],
      ["Delete empty subheading", () => { heading.subheadings = heading.subheadings.filter(item => item !== group); save(); }, items.length > 0 || heading.subheadings.length === 1]
    ]));
    section.append(groupHeader);
    const list = taskList(heading, items);
    section.append(list.children.length ? list : element("p", "small", items.length ? "No matching work items." : "Add your first work item below."));
    if (!heading.archived) section.append(quickAdd(heading, group));
    body.append(section);
  }
  if (!heading.archived) body.append(button("+ Add subheading", () => {
    textDialog("Add subheading", "Subheading name", "", "Add subheading", name => {
      heading.subheadings.push({ id: crypto.randomUUID(), name });
      save("Subheading added.");
    });
  }, "add-subheading"));
  return card;
}

function quickAdd(heading, group) {
  const draftKey = `${heading.id}-${group.id}`;
  const add = element("form", "add");
  add.autocomplete = "off";
  const input = element("input");
  input.autocomplete = "off";
  input.spellcheck = false;
  input.placeholder = "Add work item…";
  input.setAttribute("aria-label", `Add work item to ${heading.name}, ${group.name}`);
  input.id = `add-${draftKey}`;
  input.maxLength = 300;
  input.required = true;
  input.value = drafts.get(draftKey) ?? "";
  input.addEventListener("input", () => drafts.set(draftKey, input.value));
  const submit = element("button", "", "Add");
  const noteKey = `Quick-${draftKey}`;
  const quickNotes = element("details", "heading-notes quick-notes");
  quickNotes.open = openNotePanels.has(noteKey);
  const quickEditor = noteEditor({ id: draftKey, notes: "", noteChecks: [] }, `Checklist for new task in ${heading.name}`, noteDrafts.get(noteKey) ?? "");
  const quickInput = quickEditor.input;
  quickInput.addEventListener("input", () => noteDrafts.set(noteKey, quickInput.value));
  quickNotes.addEventListener("toggle", () => {
    if (!quickNotes.isConnected) return;
    if (quickNotes.open) openNotePanels.add(noteKey);
    else openNotePanels.delete(noteKey);
  });
  quickNotes.append(element("summary", "heading-notes-summary", "Add checklist (optional)"), quickEditor.panel);
  add.append(input, submit, quickNotes);
  add.addEventListener("submit", event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const task = newTask(text);
    task.notes = quickInput.value;
    task.noteChecks = quickEditor.getChecks();
    task.subheadingId = group.id;
    heading.tasks.push(task);
    drafts.delete(draftKey);
    noteDrafts.delete(noteKey);
    openNotePanels.delete(noteKey);
    save(matches(task) ? "" : "Task added. Clear search to see it.");
    byId(input.id)?.focus();
  });
  return add;
}

function allRecords() {
  return headings.flatMap(heading => heading.tasks.map(task => ({ ...task, heading: heading.name, subheading: heading.subheadings.find(group => group.id === task.subheadingId)?.name ?? "", headingId: heading.id, archived: Boolean(heading.archived) })));
}

function filteredRecords(records, includeStatus = true) {
  const [field, direction] = sort.value.split("-");
  const archiveScope = archiveFilter.value;
  const date = field === "heading" ? "completed" : field;
  return records.filter(task =>
    (!headingFilter.value || task.headingId === headingFilter.value) &&
    matches(task) &&
    (!includeStatus || ((!statusFilter.value || taskStatus(task) === statusFilter.value) &&
      (archiveScope === "all" || task.archived === (archiveScope === "archived"))))
  ).sort((a, b) => {
    if (field === "heading") {
      const byHeading = headingNameOrder.compare(a.heading, b.heading) || a.headingId.localeCompare(b.headingId);
      if (byHeading) return direction === "asc" ? byHeading : -byHeading;
      const bySubheading = headingNameOrder.compare(a.subheading ?? "", b.subheading ?? "") || (a.subheadingId ?? "").localeCompare(b.subheadingId ?? "");
      if (bySubheading) return bySubheading;
      return (b.completed || "").localeCompare(a.completed || "") || b.added.localeCompare(a.added);
    }
    if (!a[date]) return b[date] ? 1 : 0;
    if (!b[date]) return -1;
    return direction === "asc" ? a[date].localeCompare(b[date]) : b[date].localeCompare(a[date]);
  });
}

function recordsTable(records) {
  const wrap = element("div", "table-wrap");
  wrap.tabIndex = 0;
  wrap.setAttribute("aria-label", "Task records table");
  const table = element("table");
  const header = table.createTHead().insertRow();
  for (const column of recordColumns) {
    const th = element("th", "", column);
    th.scope = "col";
    header.append(th);
  }
  const body = table.createTBody();
  for (const task of records) {
    const row = body.insertRow();
    for (const column of recordFields) {
      const value = column.value(task);
      const cell = row.insertCell();
      if (column.label === "Reference link" && webLink(value)) {
        const link = element("a", "", value);
        link.href = webLink(value);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        cell.append(link);
      } else {
        cell.textContent = value && column.type === "timestamp" ? localDate.format(new Date(value)) :
          column.type === "day" ? displayDay(value) : value ?? "";
      }
    }
  }
  if (!records.length) {
    const cell = body.insertRow().insertCell();
    cell.colSpan = recordColumns.length;
    cell.textContent = "No tasks match the current view.";
  }
  wrap.append(table);
  return wrap;
}

function renderStorageUsage() {
  const indicator = byId("storage-used");
  try {
    const saved = localStorage.getItem(storageKey);
    const bytes = saved === null ? 0 : new Blob([saved]).size;
    const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
    indicator.textContent = `Storage used · ${size}`;
  } catch {
    indicator.textContent = "Storage used · Unavailable";
  }
}

const headingNameOrder = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

function renderHeadingIndex() {
  const index = byId("heading-index-list");
  const order = byId("heading-sort").value;
  const sorted = [...headings];
  if (order !== "manual") {
    const direction = order === "za" ? -1 : 1;
    sorted.sort((first, second) => direction * headingNameOrder.compare(first.name, second.name));
  }

  const shortcuts = element("ul", "heading-shortcuts");
  for (const heading of sorted) {
    const destination = heading.archived ? "archived" : "dashboard";
    const id = `heading-shortcut-${heading.id}`;
    const shortcut = button("", () => {
      clearFilters();
      view = destination;
      render({ headingId: heading.id });
      byId(id)?.focus();
    }, "heading-shortcut");
    shortcut.id = id;
    shortcut.append(element("span", "heading-shortcut-name", heading.name));
    if (heading.archived) shortcut.append(element("small", "", "Archived"));
    if (view === destination && headingFilter.value === heading.id) {
      shortcut.setAttribute("aria-current", "true");
    }
    const item = element("li");
    item.append(shortcut);
    shortcuts.append(item);
  }
  index.replaceChildren(sorted.length ? shortcuts : element("p", "small", "No headings yet."));
}

byId("heading-sort").addEventListener("change", renderHeadingIndex);

function render({ headingId = headingFilter.value } = {}) {
  renderStorageUsage();
  const isRecords = view === "records";
  [byId("title").textContent, byId("subtitle").textContent] = views[view];
  for (const id of Object.keys(views)) {
    if (view === id) byId(id).setAttribute("aria-current", "page");
    else byId(id).removeAttribute("aria-current");
  }
  statusFilter.hidden = sort.hidden = archiveFilter.hidden = !isRecords;
  headingFilter.hidden = view === "weekly";
  search.closest(".search-control").hidden = view === "weekly";
  const visibleHeadings = headings.filter(heading => isRecords || Boolean(heading.archived) === (view === "archived"));
  headingFilter.replaceChildren(new Option("All Headings", ""), ...visibleHeadings.map(heading => new Option(heading.name, heading.id)));
  headingFilter.value = visibleHeadings.some(heading => heading.id === headingId) ? headingId : "";
  if (isRecords && headingFilter.value && archiveFilter.value !== "all") {
    const selectedHeading = visibleHeadings.find(heading => heading.id === headingFilter.value);
    if (Boolean(selectedHeading.archived) !== (archiveFilter.value === "archived")) {
      archiveFilter.value = selectedHeading.archived ? "archived" : "active";
    }
  }
  renderHeadingIndex();
  const records = allRecords();
  const active = records.filter(task => !task.archived);
  renderedDay = calendarDay();
  const deadlineMetrics = deadlineGroups(active, renderedDay).map(group => [
    group.title === "Follow-ups" ? "Follow-ups due" : group.title,
    group.tasks.length, "today", group.title
  ]);
  const metrics = [
    ["Active headings", headings.filter(heading => !heading.archived).length, "dashboard", ""],
    ...["Pending", "Waiting", "Completed"].map(status => [status, (status === "Completed" ? records : active).filter(task => taskStatus(task) === status).length, "records", status]),
    ...deadlineMetrics
  ];
  byId("totals").replaceChildren(...metrics.map(([label, value, destination, filter]) => {
    const stat = button("", () => {
      clearFilters();
      view = destination;
      if (destination === "records") {
        statusFilter.value = filter;
        if (filter === "Completed") showAllCompleted();
      }
      if (destination === "today") todaySection = filter;
      render();
      byId(destination).focus();
    }, "stat");
    const number = element("strong", "stat-number status-dot", value);
    number.classList.add(label.toLowerCase().replaceAll(" ", "-"));
    stat.append(number, document.createTextNode(label));
    stat.setAttribute("aria-label", `${label}: ${value}`);
    return stat;
  }));
  const hasFilters = search.value !== "" || (view !== "weekly" && headingFilter.value !== "") ||
    (isRecords && (statusFilter.value !== "" || archiveFilter.value !== "active" || sort.value !== "added-desc")) ||
    (view === "today" && todaySection !== "");
  byId("clear-filters").hidden = !hasFilters || view === "weekly";

  if (isRecords) {
    content.replaceChildren(recordsTable(filteredRecords(records)));
  } else if (view === "today") {
    content.replaceChildren(todayView(records, renderedDay));
  } else if (view === "weekly") {
    content.replaceChildren(weeklyView(records));
  } else if (visibleHeadings.length) {
    const grid = element("div", "grid");
    grid.append(...visibleHeadings.filter(heading => !headingFilter.value || heading.id === headingFilter.value).map(headingCard));
    content.replaceChildren(grid);
  } else if (view === "archived") {
    content.replaceChildren(element("p", "empty", "No archived headings."));
  } else {
    const empty = element("div", "empty");
    empty.append(element("h2", "", "Create your first heading"),
      element("p", "", "Group related tasks under a heading, then add your checklist."),
      button("New Heading", newHeading, "primary"));
    content.replaceChildren(empty);
  }
}

function newTask(text) {
  return {
    id: crypto.randomUUID(), text, added: new Date().toISOString(), completed: null,
    due: "", waiting: false, waitingFor: "", followUp: "", notes: "", link: ""
  };
}

function duplicateHeading(heading) {
  textDialog("Duplicate heading", "New heading name", `${heading.name.slice(0, 293)} (copy)`, "Duplicate heading", name => {
    const groupMap = new Map(heading.subheadings.map(group => [group.id, crypto.randomUUID()]));
    headings.push({
      id: crypto.randomUUID(), name, archived: false, notes: heading.notes ?? "",
      subheadings: heading.subheadings.map(group => ({ id: groupMap.get(group.id), name: group.name })),
      tasks: heading.tasks.map(task => ({ ...newTask(task.text), subheadingId: groupMap.get(task.subheadingId), notes: task.notes ?? "", link: task.link ?? "" }))
    });
    headingFilter.value = "";
    search.value = "";
    view = "dashboard";
    save("Checklist duplicated.");
  });
}

function editTask(task, creating = false) {
  const panel = element("div", "editor-fields");
  function field(label, control, value, type, maxLength) {
    const wrapper = element("label", "", label);
    control.autocomplete = "off";
    control.spellcheck = false;
    if (type) control.type = type;
    if (maxLength) control.maxLength = maxLength;
    control.value = value ?? "";
    wrapper.append(control);
    panel.append(wrapper);
    return control;
  }

  const destination = element("select");
  if (creating) {
    for (const heading of headings.filter(item => !item.archived)) destination.add(new Option(heading.name, heading.id));
    field("Heading", destination, headingFilter.value || destination.options[0].value);
    if (!destination.value) destination.selectedIndex = 0;
  }
  const owner = headings.find(heading => heading.tasks.includes(task));
  const subgroup = element("select");
  field("Subheading", subgroup, "");
  function fillSubheadings() {
    const heading = creating ? headings.find(item => item.id === destination.value) : owner;
    subgroup.replaceChildren(...(heading?.subheadings ?? []).map(group => new Option(group.name, group.id)));
    if (heading?.subheadings.some(group => group.id === task.subheadingId)) subgroup.value = task.subheadingId;
  }
  fillSubheadings();
  destination.addEventListener("change", fillSubheadings);
  const title = field("Work item", element("input"), task.text, "text", 300);
  title.required = true;
  const statusSelect = element("select");
  for (const status of ["Pending", "Waiting", "Completed"]) statusSelect.add(new Option(status));
  field("Status", statusSelect, taskStatus(task));
  const due = field("Due date", element("input"), task.due, "date");
  const waitingFor = field("Waiting for", element("input"), task.waitingFor, "text", 300);
  const followUp = field("Follow-up date", element("input"), task.followUp, "date");
  const notesEditor = noteEditor(task, "Task checklist");
  panel.append(element("strong", "", "Checklist"), notesEditor.panel);
  const notes = notesEditor.input;
  const link = field("Reference link", element("input"), task.link, "url", 2000);
  function showWaitingFields() {
    waitingFor.parentElement.hidden = followUp.parentElement.hidden = statusSelect.value !== "Waiting";
  }
  statusSelect.addEventListener("change", showWaitingFields);
  showWaitingFields();
  for (const input of [title, link]) input.addEventListener("input", () => input.setCustomValidity(""));

  openDialog(creating ? "New task" : "Edit task", panel, creating ? "Create task" : "Save changes", () => {
    const text = title.value.trim();
    if (!text) {
      title.setCustomValidity("Enter a task name.");
      title.reportValidity();
      return false;
    }
    const reference = link.value.trim();
    if (reference && !webLink(reference)) {
      link.setCustomValidity("Enter a link starting with https:// or http://.");
      link.reportValidity();
      return false;
    }
    const heading = creating ? headings.find(item => item.id === destination.value && !item.archived) : null;
    if (creating && !heading) return false;
    noteDrafts.delete(`Task-${task.id}`);
    Object.assign(task, {
      text, subheadingId: subgroup.value, due: due.value, waiting: statusSelect.value === "Waiting",
      completed: statusSelect.value === "Completed" ? task.completed || new Date().toISOString() : null,
      waitingFor: waitingFor.value.trim(), followUp: followUp.value, notes: notes.value, noteChecks: notesEditor.getChecks(), link: reference
    });
    if (creating) {
      heading.tasks.push(task);
      clearFilters();
      view = "dashboard";
      headingFilter.value = heading.id;
    }
    save(creating ? "Task created." : "Task updated.");
  });
  if (creating) title.focus();
}

function deadlineGroups(records, day) {
  const open = records.filter(task => !task.archived && !task.completed);
  return [
    {
      title: "Overdue",
      empty: "No open tasks with a deadline before today.",
      tasks: open.filter(task => task.due && task.due < day).sort((a, b) => a.due.localeCompare(b.due))
    },
    {
      title: "Due today",
      empty: "No open tasks with a deadline today.",
      tasks: open.filter(task => task.due === day)
    },
    {
      title: "Follow-ups",
      empty: "No waiting tasks with a follow-up due today or earlier.",
      tasks: open.filter(task => task.waiting && task.followUp && task.followUp <= day)
        .sort((a, b) => a.followUp.localeCompare(b.followUp))
    }
  ];
}

function todayGroups(records, day) {
  const visible = records.filter(task => matches(task) &&
    (!headingFilter.value || task.headingId === headingFilter.value));
  return deadlineGroups(visible, day).filter(group => !todaySection || group.title === todaySection);
}

function todayView(records, day) {
  const grid = element("div", "grid");
  for (const group of todayGroups(records, day)) {
    const card = element("article", "card");
    const header = element("div", "today-group-header");
    header.append(element("h2", "", group.title), element("span", "today-count", String(group.tasks.length)));
    card.append(header);
    if (group.tasks.length) {
      const list = element("ul");
      for (const record of group.tasks) {
        const heading = headings.find(item => item.id === record.headingId);
        const task = heading.tasks.find(item => item.id === record.id);
        list.append(taskRow(heading, task, heading.tasks, true));
      }
      card.append(list);
    } else {
      card.append(element("p", "small", search.value.trim() || headingFilter.value ? "No tasks match your filters." : group.empty));
    }
    grid.append(card);
  }
  return grid;
}

function weekRange(value) {
  const start = dateFromDay(value);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: calendarDay(start), end: calendarDay(end) };
}

function weeklyGroups(records, week) {
  const completed = records.filter(task => {
    if (!task.completed) return false;
    const day = calendarDay(new Date(task.completed));
    return day >= week.start && day <= week.end;
  }).sort((a, b) => b.completed.localeCompare(a.completed));
  return [
    { title: "Completed this week", tasks: completed },
    { title: "Currently pending", tasks: records.filter(task => !task.archived && taskStatus(task) === "Pending") },
    { title: "Currently waiting", tasks: records.filter(task => !task.archived && taskStatus(task) === "Waiting") }
  ];
}

function weeklyView(records) {
  const week = weekRange(selectedWeek || calendarDay());
  const groups = weeklyGroups(records, week);
  const panel = element("div");
  const tools = element("div", "weekly-tools");
  const pickerLabel = element("label", "", "Select a day in the week");
  const picker = element("input");
  picker.type = "date";
  picker.value = selectedWeek || calendarDay();
  picker.addEventListener("change", () => {
    if (!validDay(picker.value)) return;
    selectedWeek = picker.value;
    render();
    content.querySelector(".weekly-tools input")?.focus();
  });
  pickerLabel.append(picker);
  const range = `${displayDay(week.start)} – ${displayDay(week.end)}`;
  const grid = element("div", "grid");
  const lines = [`Weekly work summary · ${range}`];
  const exportRows = [];
  for (const group of groups) {
    const card = element("article", "card");
    card.append(element("h2", "", `${group.title} (${group.tasks.length})`));
    lines.push("", group.title);
    if (!group.tasks.length) {
      lines.push("None");
      card.append(element("p", "small", "No tasks."));
    }
    const byHeading = new Map();
    for (const task of group.tasks) {
      if (!byHeading.has(task.headingId)) byHeading.set(task.headingId, []);
      byHeading.get(task.headingId).push(task);
    }
    for (const tasks of byHeading.values()) {
      const name = tasks[0].heading;
      card.append(element("h3", "", name));
      lines.push(name);
      const list = element("ul", "weekly-list");
      for (const task of tasks) {
        const date = task.completed ? localDate.format(new Date(task.completed)) :
          task.waiting && task.followUp ? `Follow-up ${displayDay(task.followUp)}` :
          task.due ? `Due ${displayDay(task.due)}` : "";
        const description = [task.subheading, task.text, task.waiting && task.waitingFor ? `Waiting for ${task.waitingFor}` : "", date].filter(Boolean).join(" · ");
        list.append(element("li", "", description));
        lines.push(`• ${description}`);
        exportRows.push({ ...task, summaryGroup: group.title, weekStart: week.start, weekEnd: week.end });
      }
      card.append(list);
    }
    grid.append(card);
  }
  tools.append(pickerLabel, element("strong", "", range),
    button("Copy summary", async () => {
      const summary = lines.join("\n");
      try {
        await navigator.clipboard.writeText(summary);
        notify("Weekly summary copied.");
      } catch {
        const text = element("textarea", "summary-copy");
        text.readOnly = true;
        text.value = summary;
        text.rows = 12;
        text.setAttribute("aria-label", "Weekly summary text");
        openDialog("Copy weekly summary", text, "Done", () => {});
        text.select();
      }
    }),
    button("Export summary to Excel", async () => {
      try {
        const blob = await makeWorkbook(exportRows, "blob", true);
        downloadFile(blob, `weekly-summary-${week.start}.xlsx`);
        notify("Weekly summary downloaded.");
      } catch {
        notify("The weekly export failed. Try again.");
      }
    }));
  panel.append(tools, grid);
  return panel;
}

byId("undo").addEventListener("click", () => {
  if (!undoDeletion) return;
  undoDeletion();
  undoDeletion = undefined;
  save("Deletion undone.");
});

function clearFilters() {
  search.value = "";
  headingFilter.value = "";
  statusFilter.value = "";
  archiveFilter.value = "active";
  sort.value = "added-desc";
  todaySection = "";
}

byId("clear-filters").addEventListener("click", () => {
  clearFilters();
  render();
  byId(view).focus();
});
byId("new").addEventListener("click", newHeading);
byId("new-task").addEventListener("click", () => {
  if (headings.some(heading => !heading.archived)) editTask(newTask(""), true);
  else newHeading();
});
document.addEventListener("keydown", event => {
  if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || dialog.open || view === "weekly" ||
      event.target.closest?.("input, textarea, select, [contenteditable]")) return;
  event.preventDefault();
  search.focus();
});

for (const id of Object.keys(views)) {
  byId(id).addEventListener("click", () => {
    view = id;
    todaySection = "";
    render();
  });
}
search.addEventListener("input", render);
window.addEventListener("pageshow", () => {
  search.value = "";
  render();
});
function showAllCompleted() {
  archiveFilter.value = "all";
  sort.value = "heading-asc";
}

statusFilter.addEventListener("change", () => {
  if (statusFilter.value === "Completed") showAllCompleted();
  render();
});
archiveFilter.addEventListener("change", () => {
  const selected = headings.find(heading => heading.id === headingFilter.value);
  if (selected && archiveFilter.value !== "all" && Boolean(selected.archived) !== (archiveFilter.value === "archived")) {
    headingFilter.value = "";
  }
  render();
});
for (const filter of [headingFilter, sort]) filter.addEventListener("change", render);

byId("export").addEventListener("click", () => {
  const records = allRecords();
  let filtered;
  if (view === "today") {
    const visible = todayGroups(records, calendarDay()).flatMap(group => group.tasks);
    filtered = [...new Map(visible.map(task => [task.id, task])).values()];
  } else if (view === "weekly") {
    filtered = weeklyGroups(records, weekRange(selectedWeek || calendarDay())).flatMap(group => group.tasks);
  } else {
    filtered = filteredRecords(records, view === "records")
      .filter(task => view === "records" || task.archived === (view === "archived"));
  }
  const options = element("div");
  const picker = element("details", "export-picker");
  picker.hidden = true;
  const summary = element("summary", "", "Choose tasks (0 selected)");
  const list = element("div", "export-task-list");
  const checkboxes = records.map(task => {
    const checkbox = element("input");
    checkbox.type = "checkbox";
    checkbox.name = "export-task";
    checkbox.value = task.id;
    const label = element("label", "export-task-option");
    const text = element("span");
    text.append(element("strong", "", task.text), element("small", "", `${task.heading} · ${task.subheading} · ${taskStatus(task)}`));
    label.append(checkbox, text);
    list.append(label);
    return checkbox;
  });
  function updateSelection() {
    const count = checkboxes.filter(checkbox => checkbox.checked).length;
    summary.textContent = `Choose tasks (${count} selected)`;
    selectAll.disabled = count === records.length;
    clearSelection.disabled = count === 0;
    error.textContent = "";
  }
  function checkAll(checked) {
    for (const checkbox of checkboxes) checkbox.checked = checked;
    updateSelection();
  }
  const error = element("p", "small");
  error.setAttribute("role", "alert");
  const actions = element("div", "export-picker-actions");
  const selectAll = button("Select all", () => checkAll(true));
  const clearSelection = button("Clear selection", () => checkAll(false));
  actions.append(selectAll, clearSelection);
  list.addEventListener("change", updateSelection);
  picker.append(summary, actions, list);
  updateSelection();

  for (const [value, title, count] of [
    ["all", `All tasks (${records.length})`, records.length],
    ["filtered", `Current filters (${filtered.length})`, filtered.length],
    ["selected", "Select individual tasks", records.length]
  ]) {
    const label = element("label", "radio");
    const input = element("input");
    input.type = "radio";
    input.name = "scope";
    input.value = value;
    input.checked = value === "all";
    input.disabled = count === 0 && value !== "all";
    input.addEventListener("change", () => {
      picker.hidden = value !== "selected";
      if (!picker.hidden) picker.open = true;
      error.textContent = "";
    });
    label.append(input, document.createTextNode(title));
    options.append(label);
  }
  options.append(picker, error);

  openDialog("Export to Excel", options, "Download .xlsx", async data => {
    const scope = data.get("scope");
    const ids = new Set(data.getAll("export-task"));
    const tasks = scope === "selected" ? records.filter(task => ids.has(task.id)) : scope === "filtered" ? filtered : records;
    if (scope === "selected" && !tasks.length) {
      picker.open = true;
      error.textContent = "Select at least one task to export.";
      summary.focus();
      return false;
    }
    try {
      const blob = await makeWorkbook(tasks);
      downloadFile(blob, "task-records.xlsx");
      notify("Excel workbook downloaded.");
    } catch {
      error.textContent = "The Excel export failed. Try again.";
      return false;
    }
  });
});

function downloadBackup() {
  const data = JSON.stringify({ format: "fileflow-task-recorder", version: 4, headings }, null, 2);
  downloadFile(new Blob([data], { type: "application/json" }), "task-recorder-backup.json");
}

function resetWorkspace() {
  undoDeletion = undefined;
  expanded.clear();
  drafts.clear();
  noteDrafts.clear();
  openNotePanels.clear();
  search.value = "";
  headingFilter.value = "";
  statusFilter.value = "";
  sort.value = "added-desc";
  archiveFilter.value = "active";
  selectedWeek = "";
  todaySection = "";
  view = "dashboard";
  storageIssue = "";
}

byId("clear-data").addEventListener("click", () => {
  const panel = element("div");
  const error = element("p", "small");
  error.setAttribute("role", "alert");
  panel.append(
    element("p", "", "Delete all headings, subheadings, tasks, and notes saved in this browser, including archived headings? Download a backup first if you want to restore them later."),
    button("Download backup", downloadBackup),
    error
  );
  openDialog("Clear saved data?", panel, "Delete all saved data", () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      error.textContent = "Browser storage could not be cleared. Your records are still available.";
      return false;
    }
    headings = [];
    resetWorkspace();
    render();
    notify("Saved Task Recorder data cleared.");
  });
  byId("confirm").classList.add("destructive");
  byId("cancel").focus();
});

byId("backup").addEventListener("click", () => {
  const panel = element("div");
  const download = button("Download backup", downloadBackup);
  const label = element("label", "", "Choose a Task Recorder backup");
  const input = element("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.required = true;
  label.append(input);
  const error = element("p", "small");
  error.setAttribute("role", "alert");
  panel.append(download, label, element("p", "small", "Restoring replaces all current tasks and headings in this browser."), error);

  input.addEventListener("change", () => { error.textContent = ""; });
  openDialog("Backup & Restore", panel, "Replace with backup", async () => {
    let restored;
    try {
      restored = parseBackup(await input.files[0].text());
    } catch {
      error.textContent = "Choose a valid Task Recorder JSON backup. Your current tasks are still available.";
      return false;
    }
    headings = restored;
    resetWorkspace();
    save("Backup restored.");
  });
});

document.addEventListener("click", event => {
  for (const item of document.querySelectorAll(".menu[open]")) {
    if (!item.contains(event.target)) item.open = false;
  }
});

window.addEventListener("storage", event => {
  if (event.key !== storageKey && event.key !== null) return;
  try {
    headings = normalizeHeadings(JSON.parse(event.newValue ?? "[]"));
    if (event.newValue === null) resetWorkspace();
    const noteKeys = new Set(headings.flatMap(heading => [
      `Heading-${heading.id}`, ...heading.subheadings.map(group => `Quick-${heading.id}-${group.id}`), ...heading.tasks.map(task => `Task-${task.id}`)
    ]));
    for (const key of noteDrafts.keys()) {
      if (!noteKeys.has(key)) noteDrafts.delete(key);
    }
    undoDeletion = undefined;
    if (dialog.open) dialog.close();
    render();
    notify();
  } catch {
    notify("An update from another tab could not be loaded.");
  }
});

function refreshCalendar() {
  clearTimeout(midnightTimer);
  if (calendarDay() !== renderedDay) render();
  const nextDay = new Date();
  nextDay.setHours(24, 0, 0, 0);
  midnightTimer = setTimeout(refreshCalendar, Math.max(0, nextDay.getTime() - Date.now()) + 50);
}

window.addEventListener("focus", refreshCalendar);
window.addEventListener("pageshow", refreshCalendar);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshCalendar();
});

const controlHelp = {
  new: ["New heading", "Create the main work title, then add highlighted subheadings and checklist items."],
  "new-task": ["New task", "Add a task with a due date, status, or editable checklist."],
  today: ["Today", "See overdue tasks, tasks due today, and follow-ups that need attention."],
  records: ["Records", "Search and filter your task history."],
  calendar: ["Add to calendar", "Open Google Calendar or download a calendar event for this deadline."],
  export: ["Export to Excel", "Download all tasks, filtered tasks, or individual tasks as an Excel workbook."],
  backup: ["Backup & Restore", "Download a backup or restore tasks from a saved backup file."],
  "clear-data": ["Clear saved data", "Delete this browser’s saved Task Recorder data after confirmation."]
};

function describeControl(control, key) {
  control.dataset.help = key;
  control.setAttribute("aria-describedby", `help-description-${key}`);
}

const helpDialog = byId("help-dialog");
const helpControls = byId("help-controls");
for (const [key, [label, description]] of Object.entries(controlHelp)) {
  const detail = element("dd", "", description);
  detail.id = `help-description-${key}`;
  helpControls.append(element("dt", "", label), detail);
  if (key !== "calendar") describeControl(byId(key), key);
}
byId("help").addEventListener("click", () => {
  hideTooltip();
  helpDialog.showModal();
});
byId("help-close").addEventListener("click", () => helpDialog.close());

const tooltip = byId("control-tooltip");
let tooltipAnchor;
let tooltipTimer;
let tooltipHideTimer;

function hideTooltip() {
  clearTimeout(tooltipTimer);
  clearTimeout(tooltipHideTimer);
  tooltip.hidden = true;
  tooltipAnchor = undefined;
}

function placeTooltip() {
  if (!tooltipAnchor?.isConnected) {
    hideTooltip();
    return;
  }
  const anchor = tooltipAnchor.getBoundingClientRect();
  const { width, height } = tooltip.getBoundingClientRect();
  const gap = 7;
  const left = Math.max(gap, Math.min(anchor.left + (anchor.width - width) / 2, innerWidth - width - gap));
  const top = anchor.bottom + gap + height <= innerHeight
    ? anchor.bottom + gap
    : Math.max(gap, anchor.top - height - gap);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function queueTooltip(anchor, delay) {
  clearTimeout(tooltipHideTimer);
  if (tooltipAnchor === anchor && !tooltip.hidden) return;
  hideTooltip();
  tooltipAnchor = anchor;
  tooltipTimer = setTimeout(() => {
    if (!anchor.isConnected || dialog.open || helpDialog.open) return;
    tooltip.textContent = controlHelp[anchor.dataset.help][1];
    tooltip.hidden = false;
    placeTooltip();
  }, delay);
}

function leaveTooltip() {
  clearTimeout(tooltipTimer);
  clearTimeout(tooltipHideTimer);
  tooltipHideTimer = setTimeout(hideTooltip, 160);
}

document.addEventListener("pointerover", event => {
  if (event.pointerType !== "mouse") return;
  const anchor = event.target.closest?.("[data-help]");
  if (anchor && !anchor.contains(event.relatedTarget)) queueTooltip(anchor, 450);
});
document.addEventListener("pointerout", event => {
  if (event.pointerType === "mouse" && tooltipAnchor?.contains(event.target) &&
      !tooltipAnchor.contains(event.relatedTarget)) leaveTooltip();
});
tooltip.addEventListener("pointerenter", () => clearTimeout(tooltipHideTimer));
tooltip.addEventListener("pointerleave", event => {
  if (!tooltipAnchor?.contains(event.relatedTarget)) leaveTooltip();
});
document.addEventListener("focusin", event => {
  if (event.target.matches?.("[data-help]:focus-visible")) queueTooltip(event.target, 0);
});
document.addEventListener("focusout", event => {
  if (event.target === tooltipAnchor) hideTooltip();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && tooltipAnchor) hideTooltip();
});
document.addEventListener("click", hideTooltip, true);
window.addEventListener("resize", hideTooltip);
window.addEventListener("scroll", hideTooltip, true);

search.value = "";
render();
notify();
refreshCalendar();
