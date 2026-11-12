"use strict";

const storageKey = "fileflow.task-recorder.v1";
const byId = id => document.getElementById(id);
const search = byId("search");
const headingFilter = byId("heading-filter");
const statusFilter = byId("status-filter");
const sort = byId("sort");
const content = byId("content");
const dialog = byId("dialog");
const dialogBody = byId("dialog-body");
const form = byId("dialog-form");
const expanded = new Set();
const drafts = new Map();
const accents = ["#6c9c77", "#c5955b", "#8191b6", "#a581a0"];

let headings = [];
let view = "dashboard";
let storageIssue = "";
let submitDialog;

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
  if (!Array.isArray(saved)) throw new Error("Invalid task data");
  headings = saved;
} catch {
  storageIssue = "Saved records could not be loaded. Changes will be kept for this session only.";
}

function notify(message = "") {
  byId("notice").textContent = [storageIssue, message].filter(Boolean).join(" ");
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
  if (backup?.format !== "fileflow-task-recorder" || backup.version !== 1 ||
      !Array.isArray(backup.headings)) throw new Error("Invalid backup format");

  const ids = new Set();
  function validId(id) {
    if (typeof id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(id) || ids.has(id)) return false;
    ids.add(id);
    return true;
  }
  const validText = value => typeof value === "string" && value.trim() && value.length <= 300;
  const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

  return backup.headings.map(heading => {
    if (!heading || !validId(heading.id) || !validText(heading.name) || !Array.isArray(heading.tasks)) {
      throw new Error("Invalid heading");
    }
    const tasks = heading.tasks.map(task => {
      if (!task || !validId(task.id) || !validText(task.text) || !validDate(task.added) ||
          (task.completed !== null && !validDate(task.completed))) throw new Error("Invalid task");
      return { id: task.id, text: task.text, added: task.added, completed: task.completed };
    });
    return { id: heading.id, name: heading.name, tasks };
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
  byId("dialog-title").textContent = title;
  dialogBody.replaceChildren(field);
  byId("confirm").textContent = confirmText;
  submitDialog = action;
  dialog.showModal();
  dialogBody.querySelector("input, select")?.focus();
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
    headings = headings.filter(item => item !== heading);
    expanded.delete(heading.id);
    drafts.delete(heading.id);
    save();
  };
  if (!heading.tasks.length) return remove();
  openDialog("Delete heading?", element("p", "", `“${heading.name}” and its ${heading.tasks.length} task(s) will be deleted.`), "Delete heading", remove);
}

function moveTask(heading, task) {
  const field = element("label", "", "Destination heading");
  const select = element("select");
  select.name = "destination";
  for (const item of headings.filter(item => item !== heading)) {
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
  return task.text.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase());
}

function taskRow(heading, task, siblings) {
  const row = element("li", task.completed ? "task done" : "task");
  const label = element("label");
  const checkbox = element("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(task.completed);
  checkbox.addEventListener("change", () => {
    task.completed = checkbox.checked ? new Date().toISOString() : null;
    save();
    content.querySelector(`[data-task-id="${task.id}"] input`)?.focus();
  });
  label.append(checkbox, element("span", "task-text", task.text));
  row.dataset.taskId = task.id;
  const position = siblings.indexOf(task);
  const shift = offset => {
    const other = siblings[position + offset];
    const first = heading.tasks.indexOf(task);
    const second = heading.tasks.indexOf(other);
    [heading.tasks[first], heading.tasks[second]] = [heading.tasks[second], heading.tasks[first]];
    save();
  };
  row.append(label, menu(`Actions for ${task.text}`, [
    ["Edit task", () => textDialog("Edit task", "Task", task.text, "Save changes", text => { task.text = text; save(); })],
    ["Move up", () => shift(-1), position === 0],
    ["Move down", () => shift(1), position === siblings.length - 1],
    ["Move to heading", () => moveTask(heading, task), headings.length < 2],
    ["Delete task", () => {
      heading.tasks = heading.tasks.filter(item => item !== task);
      save();
    }]
  ]));
  return row;
}

function taskList(heading, siblings) {
  const list = element("ul");
  list.append(...siblings.filter(matches).map(task => taskRow(heading, task, siblings)));
  return list;
}

function headingCard(heading) {
  const index = headings.indexOf(heading);
  const pending = heading.tasks.filter(task => !task.completed);
  const completed = heading.tasks.filter(task => task.completed);
  const card = element("article", "card");
  card.style.setProperty("--accent", accents[index % accents.length]);
  const header = element("div", "card-header");
  const title = element("div");
  title.append(element("h2", "", heading.name), element("span", "pending", `${pending.length} pending`));
  header.append(title, menu(`Actions for ${heading.name}`, [
    ["Rename heading", () => textDialog("Rename heading", "Heading name", heading.name, "Save changes", name => { heading.name = name; save(); })],
    ["Move earlier", () => reorder(headings, heading, -1), index === 0],
    ["Move later", () => reorder(headings, heading, 1), index === headings.length - 1],
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

  const add = element("form", "add");
  add.autocomplete = "off";
  const input = element("input");
  input.autocomplete = "off";
  input.placeholder = "Add task…";
  input.setAttribute("aria-label", `Add task to ${heading.name}`);
  input.id = `add-${heading.id}`;
  input.maxLength = 300;
  input.required = true;
  input.value = drafts.get(heading.id) ?? "";
  input.addEventListener("input", () => drafts.set(heading.id, input.value));
  const submit = element("button", "", "Add");
  add.append(input, submit);
  add.addEventListener("submit", event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    heading.tasks.push({ id: crypto.randomUUID(), text, added: new Date().toISOString(), completed: null });
    drafts.delete(heading.id);
    save(matches({ text }) ? "" : "Task added. Clear search to see it.");
    byId(input.id)?.focus();
  });
  card.append(add);
  return card;
}

function allRecords() {
  return headings.flatMap(heading => heading.tasks.map(task => ({ ...task, heading: heading.name, headingId: heading.id })));
}

function filteredRecords(records, includeStatus = true) {
  const [date, direction] = sort.value.split("-");
  return records.filter(task =>
    (!headingFilter.value || task.headingId === headingFilter.value) &&
    matches(task) &&
    (!includeStatus || !statusFilter.value || (task.completed ? "Completed" : "Pending") === statusFilter.value)
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
    const values = [
      task.heading, task.text, task.completed ? "Completed" : "Pending",
      localDate.format(new Date(task.added)), task.completed ? localDate.format(new Date(task.completed)) : ""
    ];
    for (const value of values) row.insertCell().textContent = value;
  }
  if (!records.length) {
    const cell = body.insertRow().insertCell();
    cell.colSpan = recordColumns.length;
    cell.textContent = "No tasks match the current view.";
  }
  wrap.append(table);
  return wrap;
}

function render() {
  const isRecords = view === "records";
  byId("title").textContent = isRecords ? "Task records" : "Work dashboard";
  byId("subtitle").textContent = isRecords ? "Search, filter, and export your task history." : "Organise your work and check off tasks as you go.";
  for (const id of ["dashboard", "records"]) {
    if (view === id) byId(id).setAttribute("aria-current", "page");
    else byId(id).removeAttribute("aria-current");
  }
  statusFilter.hidden = sort.hidden = !isRecords;
  const selected = headingFilter.value;
  headingFilter.replaceChildren(new Option("All Headings", ""), ...headings.map(heading => new Option(heading.name, heading.id)));
  headingFilter.value = headings.some(heading => heading.id === selected) ? selected : "";
  const records = allRecords();
  const done = records.filter(task => task.completed).length;
  byId("totals").replaceChildren(...[
    ["Headings", headings.length], ["Pending", records.length - done], ["Completed", done]
  ].map(([label, value]) => {
    const stat = element("div", "stat");
    stat.append(element("strong", "", value), document.createTextNode(label));
    return stat;
  }));

  if (isRecords) {
    content.replaceChildren(recordsTable(filteredRecords(records)));
  } else if (headings.length) {
    const grid = element("div", "grid");
    grid.append(...headings.filter(heading => !headingFilter.value || heading.id === headingFilter.value).map(headingCard));
    content.replaceChildren(grid);
  } else {
    const empty = element("div", "empty");
    empty.append(element("h2", "", "Create your first heading"),
      element("p", "", "Group related tasks under a heading, then add your checklist."),
      button("New Heading", newHeading, "primary"));
    content.replaceChildren(empty);
  }
}

byId("new").addEventListener("click", newHeading);
for (const id of ["dashboard", "records"]) {
  byId(id).addEventListener("click", () => {
    view = id;
    render();
  });
}
search.addEventListener("input", render);
window.addEventListener("pageshow", () => {
  search.value = "";
  render();
});
for (const filter of [headingFilter, statusFilter, sort]) filter.addEventListener("change", render);

byId("export").addEventListener("click", () => {
  const records = allRecords();
  const filtered = filteredRecords(records, view === "records");
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

byId("backup").addEventListener("click", () => {
  const panel = element("div");
  const download = button("Download backup", () => {
    const data = JSON.stringify({ format: "fileflow-task-recorder", version: 1, headings }, null, 2);
    downloadFile(new Blob([data], { type: "application/json" }), "task-recorder-backup.json");
  });
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
    expanded.clear();
    drafts.clear();
    search.value = "";
    headingFilter.value = "";
    statusFilter.value = "";
    view = "dashboard";
    storageIssue = "";
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
    const updated = JSON.parse(event.newValue ?? "[]");
    if (!Array.isArray(updated)) return;
    headings = updated;
    render();
  } catch {
    notify("An update from another tab could not be loaded.");
  }
});

search.value = "";
render();
notify();
