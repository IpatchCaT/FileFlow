# Email-Gen

A browser-based dashboard for generating, editing, saving, and reusing professional emails.

## Run locally

Open `index.html` in a modern browser, or serve the project over HTTP for more predictable clipboard and storage behavior.

```sh
python -m http.server 8000
```

Open http://localhost:8000. For static hosting, use the directory containing `index.html` as the publishing root. There are no dependencies, API keys, or build steps.

## Workflow

- **Generate Email** — choose Follow-up, Reminder, Request, or Status update. Fill in the fields, generate a subject and message, and edit either directly. Copy the subject separately or copy both together.
- **Drafts** — save an email and its form values, search by subject, recipient, or email type, and open, duplicate, or delete records.
- **Templates** — duplicate a built-in or custom template. Edit its wording and insert placeholders using the buttons below the editor. Custom templates use the fields from their original email type.

Placeholders use double braces, such as `{{topic}}`. A line containing an empty optional placeholder is omitted. Saved drafts retain their rendered content and a copy of their template patterns for use if the original template is deleted.

Drafts and custom templates are stored in the current browser profile and are scoped to the site's address. Clearing site data removes them. The app has no account sync, AI service, or direct email sending.

## Files

- `index.html` — pages, navigation, and template dialog
- `assets/style.css` — responsive workspace and editor styles
- `assets/templates.js` — template definitions and placeholder substitution
- `assets/app.js` — interaction, validation, and browser storage
