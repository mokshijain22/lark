# Nook — Additional Modules (MVP: Contacts, Approvals, Calendar, Tasks)

Backend-first, modular MERN build. Each module in `backend/modules/*` is
self-contained (model + controller + routes) so it can be copied into
another project independently.

## Modules included (Phase 1 + Phase 2 — all except Voice/Video calling)

Contacts, Approvals, Calendar, Tasks, Docs & Wiki, Base, Sheets, Slides, OKR,
Attendance, Mail, Minutes, Magic Share, Anycross (automation), Auto-translation,
Custom Workplace (company portal), Third-party Integrations.

## Setup

### Backend
```bash
cd backend
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, Cloudinary keys
npm install
npm run dev                # starts on http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env       # points to backend API
npm install
npm run dev                # starts on http://localhost:5173
```

First registered user automatically becomes **Owner**. Everyone after
that registers as **Member** by default.

## Folder structure

```
backend/
  modules/
    auth/        → register, login, JWT
    contacts/     → org directory, search, role management
    approvals/    → request/approve/reject, templates
    calendar/     → events, recurrence, RSVP
    tasks/        → task CRUD, assigned/created views
  shared/
    models/       → OrgMember, Notification (cross-module)
    middleware/   → auth, role-check, file upload (Cloudinary)
    config/       → db, cloudinary

frontend/
  src/
    modules/       → one folder per module, mirrors backend
    shared/
      components/  → Avatar, IconRail, Badge, Button, Modal, PanelLayout, etc.
      context/      → Auth, Theme (dark/light)
      api/          → axios client
    pages/          → LoginPage
```

## Notes / things intentionally simplified or still deferred
- **Auto-translation**: endpoint is wired end-to-end but returns a clear
  "not configured" message until a `TRANSLATE_API_KEY` (Google Translate /
  DeepL) is added to `backend/.env` — no provider key was available.
- **Slides editor**: supports draggable/resizable text and shape elements
  per slide, and a present mode. Image and table element types are
  supported by the data model but have no insert UI yet.
- **Chat integration**: built without access to Nook's existing chat code,
  so this is a standalone set of backend APIs + a demo frontend. Stubs are
  left where a future chat link would go (e.g. `linkedChannel` on Event).
- **Multi-tenant**: not implemented — single organization per deployment.

## Recently completed (real-time notifications, cron automations, formulas)
- **Notifications are now real-time**: `shared/config/socket.js` runs a
  JWT-authenticated Socket.io server alongside Express (same port, via one
  shared `http.Server`). `shared/services/notify.service.js` is the single
  entry point every module uses to create + push a notification — the
  frontend's `NotificationContext` connects on login and the bell icon in
  the sidebar shows a live unread badge and dropdown.
- **Anycross automations now actually run**: `shared/services/cron.service.js`
  checks every minute (via `node-cron`) for active `schedule`-type rules
  matching the current time and fires their action. The "new Approval
  request" trigger is wired directly into `approval.controller.js`.
- **Sheets formulas work**: `shared/services/formula.service.js` (using
  `hot-formula-parser`) evaluates `=SUM(...)`, `=AVERAGE(...)`, `=IF(...)`,
  `=VLOOKUP(...)` and more against real cell references and ranges. The
  frontend shows the raw formula while a cell is focused and the computed
  result otherwise (errors shown in red).
- **Magic Share is now usable from the UI**: a reusable `ShareButton`
  component is wired into Tasks, Docs, Sheets, Slides, Calendar events, and
  Base tables — no more API-only sharing.
- **File uploads now have UI**: Approvals attachments, Contacts avatar
  change, and Mail attachments all have real file inputs wired to their
  existing Cloudinary-backed backend endpoints (previously the endpoints
  existed but nothing in the frontend could reach them).
- **Approvals leave dates** are now in the New Request form, so the
  Attendance-sync behavior (leave approved → attendance marked) can be
  tested end-to-end from the UI instead of needing a raw API call.

## Verification performed
Every frontend `client.get/post/patch/delete` call was cross-checked
against the backend's actual mounted routes and each controller's
`req.body` destructuring, module by module — confirming request paths,
methods, and field names all line up. A real end-to-end run with a live
database wasn't possible in the environment this was built in (no network
access to download a MongoDB binary), so this static verification plus a
full `npm run build` on both frontend and backend (zero errors) is the
verification that's been done here. Run through
`nook-modules-testing-checklist.md` against a real MongoDB connection to
confirm runtime behavior.
