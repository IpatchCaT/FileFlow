"use strict";

const emailTypes = {
  followup: {
    name: "Follow-up",
    description: "Check in on a previous email, document, or conversation.",
    fields: [
      { key: "topic", label: "Item or topic", example: "APM user guide" },
      { key: "context", label: "Previous contact or context", example: "I shared the latest version on 10 November.", optional: true },
      { key: "action", label: "Requested response", example: "Could you let me know if any changes are needed?" },
      { key: "deadline", label: "Reply-by date", example: "Friday, 13 November", optional: true }
    ],
    subject: "Follow-up on {{topic}}",
    body: "{{greeting}}\n\nI’m following up on {{topic}}.\n{{context}}\n\n{{action}}\nIf possible, please reply by {{deadline}}.\n\nThank you,\n{{signature}}"
  },
  reminder: {
    name: "Reminder",
    description: "Remind someone about a task, event, or deadline.",
    fields: [
      { key: "topic", label: "Task or event", example: "RFQ review" },
      { key: "deadline", label: "Due date or time", example: "Friday at 3 pm" },
      { key: "action", label: "Action needed", example: "Please review the attached quotation." }
    ],
    subject: "Reminder: {{topic}}",
    body: "{{greeting}}\n\nThis is a reminder about {{topic}}, due by {{deadline}}.\n\n{{action}}\n\nThank you,\n{{signature}}"
  },
  request: {
    name: "Request",
    description: "Ask for information, approval, or support.",
    fields: [
      { key: "topic", label: "Request topic", example: "Access to the project folder" },
      { key: "action", label: "What you need", example: "Could you grant me access to the project folder?" },
      { key: "context", label: "Reason or context", example: "I need to check the latest drawing.", optional: true },
      { key: "deadline", label: "Needed by", example: "Thursday afternoon", optional: true }
    ],
    subject: "Request: {{topic}}",
    body: "{{greeting}}\n\n{{action}}\n{{context}}\n\nIf possible, I would appreciate your help by {{deadline}}.\n\nThank you,\n{{signature}}"
  },
  status: {
    name: "Status update",
    description: "Share progress, next steps, and blockers.",
    fields: [
      { key: "topic", label: "Project or item", example: "APM user guide" },
      { key: "status", label: "Current status", example: "The draft is ready for review." },
      { key: "action", label: "Next step", example: "I’ll consolidate feedback on Friday." },
      { key: "blocker", label: "Blocker", example: "Pending screenshots from QA.", optional: true }
    ],
    subject: "Status update: {{topic}}",
    body: "{{greeting}}\n\nHere’s an update on {{topic}}.\n\nCurrent status: {{status}}\nNext step: {{action}}\nBlocker: {{blocker}}\n\nRegards,\n{{signature}}"
  }
};

const builtIns = Object.entries(emailTypes).map(([type, definition]) => ({
  id: type, type, name: definition.name, subject: definition.subject, body: definition.body
}));

function fillPattern(pattern, values) {
  return pattern.split("\n").flatMap(line => {
    const matches = [...line.matchAll(/\{\{(\w+)\}\}/g)];
    if (matches.some(([, key]) => !values[key])) return [];
    return line.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key]);
  }).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
