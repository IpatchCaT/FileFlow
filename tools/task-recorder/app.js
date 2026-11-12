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
  if (backup?.format !== "fileflow-task-recorder" || ![1, 2].includes(backup.version)) {
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
    if (!heading || !validId(heading.id) || !validText(heading.name) || !Array.isArray(heading.tasks) || !optionalFlag(heading.archived) ||
        !optionalText(heading.notes, noteLimit)) {
      throw new Error("Invalid heading");
    }
    const tasks = heading.tasks.map(task => {
      if (!task || !validId(task.id) || !validText(task.text) || !validDate(task.added) ||
          (task.completed !== null && !validDate(task.completed)) || !optionalFlag(task.waiting) ||
          !optionalDay(task.due) || !optionalDay(task.followUp) || !optionalText(task.waitingFor, 300) ||
          !optionalText(task.notes, 4000) || !optionalText(task.link, 2000) ||
          (task.link && !webLink(task.link))) throw new Error("Invalid task");
      return {
        id: task.id, text: task.text, added: task.added, completed: task.completed,
        due: task.due ?? "", followUp: task.followUp ?? "", waiting: Boolean(task.waiting),
        waitingFor: task.waitingFor ?? "", notes: task.notes ?? "", link: task.link ?? ""
      };
    });
    return { id: heading.id, name: heading.name, archived: Boolean(heading.archived), notes: heading.notes ?? "", tasks };
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
    headings.push({ id: crypto.randomUUID(), name, tasks: [] });
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
    for (const key of [`Heading-${heading.id}`, `Quick-${heading.id}`, ...heading.tasks.map(task => `Task-${task.id}`)]) {
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
    destination.tasks.push(task);
    heading.tasks = heading.tasks.filter(item => item !== task);
    save(`Task moved to ${destination.name}.`);
  });
}

function matches(task) {
  const query = search.value.trim().toLocaleLowerCase();
  return [task.text, task.notes, task.link, task.waitingFor].some(value => value?.toLocaleLowerCase().includes(query));
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
  const details = `Heading: ${heading.name}\nOriginal due date: ${task.due}`;
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
  if (showHeading) metadata.push(heading.name);
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

function notesPanel(record, kind, name) {
  const key = `${kind}-${record.id}`;
  const panel = element("details", "heading-notes");
  const summary = element("summary", "heading-notes-summary");
  summary.append(element("span", "", `${kind} notes`));
  if (record.notes?.trim()) {
    summary.append(element("span", "heading-note-preview", record.notes.trim().replace(/\s+/g, " ")));
  }
  panel.open = openNotePanels.has(key);
  panel.addEventListener("toggle", () => {
    if (!panel.isConnected) return;
    if (panel.open) openNotePanels.add(key);
    else openNotePanels.delete(key);
  });

  const input = element("textarea", "heading-note-input");
  input.id = `notes-${key}`;
  input.setAttribute("aria-label", `${kind} notes for ${name}`);
  input.autocomplete = "off";
  input.spellcheck = false;
  input.rows = 4;
  input.maxLength = noteLimit;
  input.placeholder = `Add notes about this ${kind.toLowerCase()}…`;
  const saved = record.notes ?? "";
  input.value = noteDrafts.get(key) ?? saved;
  const saveNote = button("Save notes", () => {
    record.notes = input.value;
    noteDrafts.delete(key);
    openNotePanels.add(key);
    save(`${kind} notes saved.`);
    byId(input.id)?.focus();
  });
  saveNote.disabled = input.value === saved;
  input.addEventListener("input", () => {
    saveNote.disabled = input.value === saved;
    if (saveNote.disabled) noteDrafts.delete(key);
    else noteDrafts.set(key, input.value);
  });
  panel.append(summary, input, saveNote);
  return panel;
}

function headingCard(heading) {
  const index = headings.indexOf(heading);
  const pending = heading.tasks.filter(task => !task.completed);
  const completed = heading.tasks.filter(task => task.completed);
  const card = element("article", "card");
  card.style.setProperty("--accent", accents[index % accents.length]);
  const header = element("div", "card-header");
  const title = element("div");
  title.append(element("h2", "", heading.name), element("span", "pending", `${pending.filter(task => !task.waiting).length} pending · ${pending.filter(task => task.waiting).length} waiting`));
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
  card.append(header);
  if (heading.tasks.length) {
    const progress = element("progress", "heading-progress");
    progress.max = heading.tasks.length;
    progress.value = completed.length;
    const label = element("label", "progress-label", `${completed.length} of ${heading.tasks.length} completed`);
    label.append(progress);
    card.append(label);
  }
  const pendingList = taskList(heading, pending);
  card.append(pendingList.children.length ? pendingList : element("p", "small", pending.length ? "No matching pending tasks." : "No pending tasks."));
  const visibleDone = completed.filter(matches);
  if (visibleDone.length) {
    const done = element("details", "complete");
    const searching = Boolean(search.value.trim());
    done.open = expanded.has(heading.id) || searching;
    done.addEventListener("toggle", () => {
      if (searching || !done.isConnected) return;
      if (done.open) expanded.add(heading.id);
      else expanded.delete(heading.id);
    });
    done.append(element("summary", "", `Completed (${visibleDone.length})`), taskList(heading, completed));
    card.append(done);
  }

  if (heading.archived) return card;

  const add = element("form", "add");
  add.autocomplete = "off";
  const input = element("input");
  input.autocomplete = "off";
  input.spellcheck = false;
  input.placeholder = "Add task…";
  input.setAttribute("aria-label", `Add task to ${heading.name}`);
  input.id = `add-${heading.id}`;
  input.maxLength = 300;
  input.required = true;
  input.value = drafts.get(heading.id) ?? "";
  input.addEventListener("input", () => drafts.set(heading.id, input.value));
  const submit = element("button", "", "Add");
  const noteKey = `Quick-${heading.id}`;
  const quickNotes = element("details", "heading-notes quick-notes");
  quickNotes.open = openNotePanels.has(noteKey);
  const quickInput = element("textarea", "heading-note-input");
  quickInput.setAttribute("aria-label", `Notes for new task in ${heading.name}`);
  quickInput.autocomplete = "off";
  quickInput.spellcheck = false;
  quickInput.rows = 3;
  quickInput.maxLength = noteLimit;
  quickInput.placeholder = "Add notes for this new task…";
  quickInput.value = noteDrafts.get(noteKey) ?? "";
  quickInput.addEventListener("input", () => noteDrafts.set(noteKey, quickInput.value));
  quickNotes.addEventListener("toggle", () => {
    if (!quickNotes.isConnected) return;
    if (quickNotes.open) openNotePanels.add(noteKey);
    else openNotePanels.delete(noteKey);
  });
  quickNotes.append(element("summary", "heading-notes-summary", "Add task notes (optional)"), quickInput);
  add.append(input, submit, quickNotes);
  add.addEventListener("submit", event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const task = newTask(text);
    task.notes = quickInput.value;
    heading.tasks.push(task);
    drafts.delete(heading.id);
    noteDrafts.delete(noteKey);
    openNotePanels.delete(noteKey);
    save(matches(task) ? "" : "Task added. Clear search to see it.");
    byId(input.id)?.focus();
  });
  card.append(add);
  return card;
}

function allRecords() {
  return headings.flatMap(heading => heading.tasks.map(task => ({ ...task, heading: heading.name, headingId: heading.id, archived: Boolean(heading.archived) })));
}

function filteredRecords(records, includeStatus = true) {
  const [date, direction] = sort.value.split("-");
  return records.filter(task =>
    (!headingFilter.value || task.headingId === headingFilter.value) &&
    matches(task) &&
    (!includeStatus || ((!statusFilter.value || taskStatus(task) === statusFilter.value) &&
      (archiveFilter.value === "all" || task.archived === (archiveFilter.value === "archived"))))
  ).sort((a, b) => {
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

function render() {
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
  const selected = headingFilter.value;
  const visibleHeadings = headings.filter(heading => isRecords || Boolean(heading.archived) === (view === "archived"));
  headingFilter.replaceChildren(new Option("All Headings", ""), ...visibleHeadings.map(heading => new Option(heading.name, heading.id)));
  headingFilter.value = visibleHeadings.some(heading => heading.id === selected) ? selected : "";
  const records = allRecords();
  const active = records.filter(task => !task.archived);
  renderedDay = calendarDay();
  const deadlineMetrics = deadlineGroups(active, renderedDay).map(group => [
    group.title === "Follow-ups" ? "Follow-ups due" : group.title,
    group.tasks.length, "today", group.title
  ]);
  const metrics = [
    ["Active headings", headings.filter(heading => !heading.archived).length, "dashboard", ""],
    ...["Pending", "Waiting", "Completed"].map(status => [status, active.filter(task => taskStatus(task) === status).length, "records", status]),
    ...deadlineMetrics
  ];
  byId("totals").replaceChildren(...metrics.map(([label, value, destination, filter]) => {
    const stat = button("", () => {
      clearFilters();
      view = destination;
      if (destination === "records") statusFilter.value = filter;
      if (destination === "today") todaySection = filter;
      render();
      byId(destination).focus();
    }, "stat");
    stat.append(element("strong", "", value), document.createTextNode(label));
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
    headings.push({
      id: crypto.randomUUID(), name, archived: false,
      tasks: heading.tasks.map(task => ({ ...newTask(task.text), notes: task.notes ?? "", link: task.link ?? "" }))
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
  const title = field("Task name", element("input"), task.text, "text", 300);
  title.required = true;
  const statusSelect = element("select");
  for (const status of ["Pending", "Waiting", "Completed"]) statusSelect.add(new Option(status));
  field("Status", statusSelect, taskStatus(task));
  const due = field("Due date", element("input"), task.due, "date");
  const waitingFor = field("Waiting for", element("input"), task.waitingFor, "text", 300);
  const followUp = field("Follow-up date", element("input"), task.followUp, "date");
  const notes = field("Task notes", element("textarea"), task.notes, undefined, 4000);
  notes.rows = 5;
  notes.placeholder = "Add details about this task…";
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
      text, due: due.value, waiting: statusSelect.value === "Waiting",
      completed: statusSelect.value === "Completed" ? task.completed || new Date().toISOString() : null,
      waitingFor: waitingFor.value.trim(), followUp: followUp.value, notes: notes.value, link: reference
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

function weeklyView(records) {
  const week = weekRange(selectedWeek || calendarDay());
  const completed = records.filter(task => {
    if (!task.completed) return false;
    const day = calendarDay(new Date(task.completed));
    return day >= week.start && day <= week.end;
  }).sort((a, b) => b.completed.localeCompare(a.completed));
  const groups = [
    { title: "Completed this week", tasks: completed },
    { title: "Currently pending", tasks: records.filter(task => !task.archived && taskStatus(task) === "Pending") },
    { title: "Currently waiting", tasks: records.filter(task => !task.archived && taskStatus(task) === "Waiting") }
  ];
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
        const description = [task.text, task.waiting && task.waitingFor ? `Waiting for ${task.waitingFor}` : "", date].filter(Boolean).join(" · ");
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
for (const filter of [headingFilter, statusFilter, sort, archiveFilter]) filter.addEventListener("change", render);

byId("export").addEventListener("click", () => {
  const records = allRecords();
  const filtered = view === "today" ? todayGroups(records, calendarDay()).flatMap(group => group.tasks).filter((record, index, list) => list.findIndex(item => item.id === record.id) === index) :
    filteredRecords(records, view === "records").filter(task => view === "records" || view === "weekly" || task.archived === (view === "archived"));
  const options = element("div");
  for (const [value, title] of [["all", `All tasks (${records.length})`], ["filtered", `Current filters (${filtered.length})`]]) {
    const label = element("label", "radio");
    const input = element("input");
    input.type = "radio";
    input.name = "scope";
    input.value = value;
    input.checked = value === "all";
    label.append(input, document.createTextNode(title));
    options.append(label);
  }
  openDialog("Export to Excel", options, "Download .xlsx", async data => {
    try {
      const blob = await makeWorkbook(data.get("scope") === "all" ? records : filtered);
      downloadFile(blob, "task-records.xlsx");
      notify("Excel workbook downloaded.");
    } catch {
      notify("The Excel export failed. Try again.");
    }
  });
});

function downloadBackup() {
  const data = JSON.stringify({ format: "fileflow-task-recorder", version: 2, headings }, null, 2);
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
    element("p", "", "Delete all headings, tasks, and notes saved in this browser, including archived headings? Download a backup first if you want to restore them later."),
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
      `Heading-${heading.id}`, `Quick-${heading.id}`, ...heading.tasks.map(task => `Task-${task.id}`)
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

search.value = "";
render();
notify();
refreshCalendar();
