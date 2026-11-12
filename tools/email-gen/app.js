"use strict";

const byId = id => document.getElementById(id);
const select = byId("template-select");
const subject = byId("subject");
const message = byId("message");
const dialog = byId("template-dialog");
const templateForm = byId("template-form");
const patternSubject = byId("pattern-subject");
const patternBody = byId("pattern-body");
const stateKey = "email-gen:v1";
const pages = ["compose", "drafts", "templates"];
let state = { drafts: [], templates: [] };
let storageError = false;
try {
  const saved = JSON.parse(localStorage.getItem(stateKey));
  if (saved) {
    if (!Array.isArray(saved.drafts) || !Array.isArray(saved.templates)) throw new Error("Invalid workspace");
    state = saved;
  }
} catch {
  storageError = true;
}

let draftId = null;
let cleanSnapshot = "";
let editorEdited = false;
let templateSource;
let patternTarget = patternBody;
let toastTimer;
let detachedTemplate = null;

function notify(text) {
  clearTimeout(toastTimer);
  byId("toast").textContent = text;
  toastTimer = setTimeout(() => { byId("toast").textContent = ""; }, 4500);
}

function saveState(next) {
  if (storageError) {
    notify("Saved workspace data could not be loaded. Copy your email to keep it.");
    return false;
  }
  try {
    localStorage.setItem(stateKey, JSON.stringify(next));
    state = next;
    updateCount();
    return true;
  } catch {
    notify("Browser storage is unavailable or full. Copy your email to keep it.");
    return false;
  }
}

function newId() {
  return globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(text, action, className = "outline") {
  const node = element("button", text, className);
  node.type = "button";
  node.addEventListener("click", action);
  return node;
}

function templates() {
  return [...builtIns, ...state.templates];
}

function selectedTemplate() {
  return templates().find(item => item.id === select.value) || detachedTemplate || builtIns[0];
}

function renderOptions(selectedId) {
  const options = templates();
  if (detachedTemplate) options.push(detachedTemplate);
  select.replaceChildren(...options.map(template => {
    const option = element("option", template.name);
    option.value = template.id;
    return option;
  }));
  select.value = options.some(template => template.id === selectedId) ? selectedId : builtIns[0].id;
}

function renderFields(values = {}) {
  const fields = emailTypes[selectedTemplate().type].fields;
  byId("dynamic-fields").replaceChildren(...fields.map(field => {
    const label = element("label", field.label);
    if (field.optional) label.append(element("small", "Optional"));
    const input = document.createElement("input");
    input.id = "field-" + field.key;
    input.placeholder = "e.g. " + field.example;
    input.maxLength = 500;
    input.required = !field.optional;
    input.value = values[field.key] || "";
    input.addEventListener("input", () => input.setCustomValidity(""));
    label.append(input);
    return label;
  }));
}

function capture() {
  const template = selectedTemplate();
  const fields = Object.fromEntries(emailTypes[template.type].fields.map(field => [
    field.key, byId("field-" + field.key).value
  ]));
  return {
    templateId: template.id,
    templateName: template.name,
    templateSnapshot: { subject: template.subject, body: template.body },
    type: template.type,
    recipient: byId("recipient").value,
    signature: byId("signature").value,
    fields,
    subject: subject.value,
    body: message.value
  };
}

function snapshot() {
  const { templateName, templateSnapshot, ...content } = capture();
  return JSON.stringify(content);
}

function refreshEditor() {
  const words = message.value.trim().match(/\S+/g)?.length || 0;
  byId("word-count").textContent = words + (words === 1 ? " word" : " words");
  byId("editor-state").textContent = snapshot() !== cleanSnapshot ? "Unsaved changes" : draftId ? "Saved draft" : "New draft";
}

function loadDraft(draft = {}, templateId = draft.templateId) {
  draftId = draft.id || null;
  detachedTemplate = null;
  if (templateId && draft.type && !templates().some(item => item.id === templateId)) {
    const base = emailTypes[draft.type];
    detachedTemplate = {
      id: templateId, type: draft.type, name: draft.templateName,
      subject: draft.templateSnapshot?.subject || base.subject,
      body: draft.templateSnapshot?.body || base.body
    };
  }
  renderOptions(templateId);
  renderFields(draft.fields);
  byId("recipient").value = draft.recipient || "";
  byId("signature").value = draft.signature || "";
  subject.value = draft.subject || "";
  message.value = draft.body || "";
  editorEdited = Boolean(draft.subject || draft.body);
  cleanSnapshot = snapshot();
  refreshEditor();
}

function mayReplace() {
  return snapshot() === cleanSnapshot || confirm("Replace the current unsaved draft?");
}

function goToCompose() {
  location.hash = "compose";
  if (!byId("compose").hidden) select.focus();
}

function startDraft(templateId) {
  if (!mayReplace()) return false;
  loadDraft({}, templateId);
  goToCompose();
  return true;
}

function updateCount() {
  byId("draft-count").textContent = state.drafts.length || "";
}

function showPage() {
  const requested = location.hash.slice(1);
  const active = pages.includes(requested) ? requested : "compose";
  for (const page of pages) {
    byId(page).hidden = page !== active;
    const link = document.querySelector('[data-page="' + page + '"]');
    if (page === active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  if (active === "drafts") renderDrafts();
  if (active === "templates") renderTemplates();
}

function renderDrafts() {
  const query = byId("draft-search").value.trim().toLowerCase();
  const matches = state.drafts
    .filter(draft => [draft.subject, draft.recipient, emailTypes[draft.type].name].join(" ").toLowerCase().includes(query))
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  const list = byId("draft-list");
  list.replaceChildren();
  if (!matches.length) {
    list.append(element("p", query ? "No matching drafts." : "Saved emails will appear here.", "empty"));
    return;
  }
  for (const draft of matches) {
    const card = element("article", "", "card record");
    const detail = [emailTypes[draft.type].name, draft.recipient, new Date(draft.updatedAt).toLocaleString()].filter(Boolean);
    const actions = element("div", "", "record-actions");
    actions.append(
      button("Open", () => {
        if (!mayReplace()) return;
        loadDraft(draft);
        goToCompose();
      }, "dark"),
      button("Duplicate", () => {
        if (!mayReplace()) return;
        loadDraft({ ...draft, id: null });
        cleanSnapshot = "";
        refreshEditor();
        goToCompose();
        notify("Draft duplicated. Save it to keep a separate copy.");
      }),
      button("Delete", () => {
        if (!confirm('Delete "' + (draft.subject || "Untitled draft") + '"?')) return;
        if (!saveState({ ...state, drafts: state.drafts.filter(item => item.id !== draft.id) })) return;
        if (draftId === draft.id) {
          draftId = null;
          cleanSnapshot = "";
          refreshEditor();
        }
        renderDrafts();
        notify("Draft deleted.");
      }, "text-button")
    );
    card.append(element("h3", draft.subject || "Untitled draft"), element("p", detail.join(" · ")), actions);
    list.append(card);
  }
}

function renderTemplates() {
  const list = byId("template-list");
  list.replaceChildren();
  for (const template of templates()) {
    const custom = state.templates.some(item => item.id === template.id);
    const card = element("article", "", "card record");
    const type = emailTypes[template.type];
    const actions = element("div", "", "record-actions");
    actions.append(
      button("Use template", () => startDraft(template.id), "dark"),
      button("Duplicate", () => editTemplate(template, false))
    );
    if (custom) actions.append(
      button("Edit", () => editTemplate(template, true)),
      button("Delete", () => {
        if (!confirm('Delete the "' + template.name + '" template?')) return;
        const selected = selectedTemplate().id === template.id;
        if (!saveState({ ...state, templates: state.templates.filter(item => item.id !== template.id) })) return;
        if (selected) detachedTemplate = template;
        renderOptions(select.value);
        renderTemplates();
        notify("Template deleted.");
      }, "text-button")
    );
    card.append(element("h3", template.name), element("p", custom ? "Custom " + type.name.toLowerCase() + " template" : type.description), actions);
    list.append(card);
  }
}

function templateKeys(type) {
  return ["greeting", "recipient", "signature", ...emailTypes[type].fields.map(field => field.key)];
}

function editTemplate(template, editing) {
  templateSource = { template, editing };
  patternTarget = patternBody;
  byId("dialog-title").textContent = editing ? "Edit template" : "Duplicate template";
  byId("template-name").value = editing ? template.name : template.name.slice(0, 95) + " copy";
  patternSubject.value = template.subject;
  patternBody.value = template.body;
  byId("template-error").textContent = "";
  byId("placeholders").replaceChildren(...templateKeys(template.type).map(key => {
    const token = "{{" + key + "}}";
    return button(token, () => {
      patternTarget.setRangeText(token, patternTarget.selectionStart, patternTarget.selectionEnd, "end");
      patternTarget.focus();
    });
  }));
  dialog.showModal();
}

templateForm.addEventListener("submit", event => {
  event.preventDefault();
  const { template, editing } = templateSource;
  const name = byId("template-name").value.trim();
  const subjectPattern = patternSubject.value.trim();
  const body = patternBody.value.trim();
  const allowed = templateKeys(template.type);
  const invalid = [subjectPattern, body].some(pattern => {
    const remainder = pattern.replace(/\{\{(\w+)\}\}/g, (token, key) => allowed.includes(key) ? "" : token);
    return /\{\{|\}\}/.test(remainder);
  });
  const error = byId("template-error");
  if (!name || !subjectPattern || !body || invalid) {
    error.textContent = invalid ? "Use the available placeholders shown below the message pattern." : "Enter a name, subject pattern, and message pattern.";
    return;
  }
  const record = { id: editing ? template.id : newId(), type: template.type, name, subject: subjectPattern, body };
  const updated = editing ? state.templates.map(item => item.id === record.id ? record : item) : [...state.templates, record];
  if (!saveState({ ...state, templates: updated })) {
    error.textContent = "The template could not be saved in this browser.";
    return;
  }
  renderOptions(select.value);
  renderTemplates();
  dialog.close();
  notify("Template saved.");
});

for (const field of [patternSubject, patternBody]) field.addEventListener("focus", () => { patternTarget = field; });
byId("close-dialog").addEventListener("click", () => dialog.close());

select.addEventListener("change", () => {
  const values = Object.fromEntries([...byId("dynamic-fields").querySelectorAll("input")].map(input => [input.id.slice(6), input.value]));
  renderFields(values);
});

byId("compose-form").addEventListener("input", refreshEditor);
for (const field of [subject, message]) field.addEventListener("input", () => {
  editorEdited = true;
  refreshEditor();
});

byId("compose-form").addEventListener("submit", event => {
  event.preventDefault();
  const data = capture();
  const type = emailTypes[data.type];
  for (const field of type.fields) {
    if (field.optional || data.fields[field.key].trim()) continue;
    const input = byId("field-" + field.key);
    input.setCustomValidity("Enter " + field.label.toLowerCase() + ".");
    input.reportValidity();
    return;
  }
  const template = selectedTemplate();
  const recipient = data.recipient.trim();
  const values = {
    ...Object.fromEntries(Object.entries(data.fields).map(([key, value]) => [key, value.trim()])),
    recipient,
    greeting: recipient ? "Hi " + recipient + "," : "Hello,",
    signature: data.signature.trim()
  };
  const generatedSubject = fillPattern(template.subject, values);
  const generatedBody = fillPattern(template.body, values);
  if (!generatedSubject || !generatedBody) {
    notify("Add the missing template details to generate a subject and message.");
    return;
  }
  if (editorEdited && (subject.value || message.value) && !confirm("Replace the current subject and message with the generated draft?")) return;
  subject.value = generatedSubject;
  message.value = generatedBody;
  editorEdited = false;
  refreshEditor();
  subject.focus();
  notify("Draft generated.");
});

byId("save-draft").addEventListener("click", () => {
  const data = capture();
  if (!data.subject.trim() && !data.body.trim()) {
    notify("Write a subject or message before saving.");
    return;
  }
  const draft = { ...data, id: draftId || newId(), updatedAt: new Date().toISOString() };
  if (!saveState({ ...state, drafts: [...state.drafts.filter(item => item.id !== draft.id), draft] })) return;
  draftId = draft.id;
  cleanSnapshot = snapshot();
  refreshEditor();
  notify("Draft saved.");
});

async function copy(text, success) {
  if (!text.trim()) {
    notify("There is nothing to copy yet.");
    return;
  }
  try {
    if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(text);
  } catch {
    const field = document.createElement("textarea");
    const previous = document.activeElement;
    field.value = text;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    try {
      if (!document.execCommand("copy")) throw new Error("Copy failed");
    } catch {
      notify("Clipboard access is unavailable. Select and copy the text manually.");
      return;
    } finally {
      field.remove();
      previous?.focus();
    }
  }
  notify(success);
}

byId("copy-subject").addEventListener("click", () => copy(subject.value.trim(), "Subject copied."));
byId("copy-email").addEventListener("click", () => copy([subject.value.trim(), message.value.trim()].filter(Boolean).join("\n\n"), "Email copied."));
byId("new-draft").addEventListener("click", () => startDraft());
byId("drafts-new").addEventListener("click", event => {
  event.preventDefault();
  startDraft();
});
byId("draft-search").addEventListener("input", renderDrafts);
window.addEventListener("hashchange", showPage);
window.addEventListener("beforeunload", event => {
  if (snapshot() === cleanSnapshot) return;
  event.preventDefault();
  event.returnValue = "";
});

loadDraft();
updateCount();
showPage();
if (storageError) notify("Saved workspace data could not be loaded.");
