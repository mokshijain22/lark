# Nook Modules — End-to-End Testing Checklist

Two accounts needed throughout: **Owner** (first registered user) and
**Member** (second registered user, in an Incognito window). Where a test
needs a specific role, it's called out.

---

## Setup
- [ ] Backend running (`npm run dev` in `backend/`), no errors in terminal
- [ ] Frontend running (`npm run dev` in `frontend/`), loads at localhost:5173
- [ ] Register Owner account → role shows "Owner" in Contacts
- [ ] Register Member account (incognito) → role shows "Member" in Contacts
- [ ] Login/logout works for both

## 1. Contacts
- [ ] Both users appear in the directory
- [ ] Search by name filters correctly
- [ ] Click a contact → detail panel shows avatar, email, role, online/offline
- [ ] Owner can change Member's role via dropdown; Member cannot see that dropdown

## 2. Approvals
- [ ] Member submits a request (type, title, description) with no approver selected
- [ ] Owner sees it under "To Approve" tab
- [ ] Owner approves it → Member's "My Requests" shows status "Approved"
- [ ] Owner rejects a separate request → status "Rejected"
- [ ] **Real-time check**: keep both windows open side-by-side — when Owner approves, Member's 🔔 bell should light up within a second, no refresh

## 3. Calendar
- [ ] Create an event with both users as attendees
- [ ] Event shows in month view for both
- [ ] Member accepts/declines RSVP → reflected on Owner's view of the event
- [ ] Create a recurring (weekly) event → confirm it appears on multiple weeks in the list
- [ ] Set a meeting room → shows in event detail

## 4. Tasks
- [ ] Owner creates a task, assigns to Member
- [ ] Member sees it under "Assigned to me"; Owner sees it under "Created by me"
- [ ] Member changes status To-do → In Progress → Done
- [ ] **Real-time check**: Member gets a notification when assigned

## 5. Docs & Wiki
- [ ] Create a document, type content, wait ~1s → confirm autosave (reload page, content persists)
- [ ] Create a second doc in a named folder
- [ ] Version history: make an edit, check `GET /api/docs/:id/versions` returns the prior version (no UI button for revert yet — API only)

## 6. Base
- [ ] Create a table with 2–3 columns (text, number, dropdown)
- [ ] Add rows, edit cell values inline
- [ ] Confirm data persists on reload

## 7. Sheets
- [ ] Create a spreadsheet
- [ ] Enter plain numbers in A1, A2
- [ ] Enter `=SUM(A1:A2)` in A3 → shows correct sum
- [ ] Enter `=AVERAGE(A1:A2)` and `=IF(A1>5,"big","small")` → both evaluate correctly
- [ ] Click into the formula cell → shows raw formula; click out → shows computed result

## 8. Slides
- [ ] Create a presentation
- [ ] Add a text element, drag it, resize it via the corner handle
- [ ] Add a shape element, change its position
- [ ] Delete an element
- [ ] Add a second slide, switch between them via thumbnails
- [ ] Click "Present" → arrow buttons move between slides, Exit works

## 9. OKR
- [ ] Create an Objective with 2 key results
- [ ] Drag the progress slider on a key result → overall progress % updates
- [ ] Confirm progress bar in the list view matches

## 10. Attendance
- [ ] Member clicks "Check In" → timestamp recorded
- [ ] Member clicks "Check Out" → timestamp recorded
- [ ] Leave balance shows correctly (starts at 18/18)
- [ ] **Cross-module check**: submit an Approval of type "Leave Request" with `leaveStartDate`/`leaveEndDate` set (need to test via API directly — frontend form doesn't expose these fields yet), get it Approved, then confirm Attendance history shows those days as "leave"

## 11. Mail
- [ ] Compose an email from Owner to Member with a subject/body
- [ ] Member sees it in Inbox, Owner sees it in Sent
- [ ] Open the email → marks as read
- [ ] Save a draft (don't send) → appears under Drafts, not Inbox

## 12. Minutes
- [ ] Create meeting notes linked to a Calendar event with the Member as attendee
- [ ] Confirm Member can see the notes (shared automatically via event attendees)
- [ ] Type notes, confirm autosave

## 13. Magic Share
- [ ] Share a Task or Document with the Member via `POST /api/share` (no share button in UI yet — test via API)
- [ ] Member's "Shared" panel shows the item with correct preview title and permission

## 14. Anycross
- [ ] Create a schedule-type rule for 1–2 minutes in the future, with a message
- [ ] Wait for that time → confirm a notification arrives (cron checks every minute)
- [ ] Toggle a rule to "Paused" → confirm it does NOT fire at its scheduled time
- [ ] Create an "approvals" trigger rule, submit a new Approval request → confirm the rule creator gets notified

## 15. Auto-translation
- [ ] `POST /api/translation/translate` currently returns a 501 "not configured" message — this is expected until a `TRANSLATE_API_KEY` is added
- [ ] `PATCH /api/translation/preference` with `preferredLanguage` updates successfully

## 16. Custom Workplace
- [ ] Owner clicks "Edit page", adds an Announcement block and a Link block, saves
- [ ] Member (no edit button visible) sees the same blocks read-only
- [ ] Reload — blocks persist

## 17. Third-party Integrations
- [ ] Owner connects "GitHub" → status flips to Connected
- [ ] Owner disconnects → status flips back
- [ ] Member does NOT see connect/disconnect buttons (view-only)
- [ ] `POST /api/integrations/github/webhook` with a body like `{"summary":"test"}` → confirm Owner/Admins get a notification

## Cross-cutting
- [ ] Dark/light theme toggle works and persists across reload
- [ ] Logging out and back in doesn't lose data
- [ ] Refreshing mid-session doesn't log you out (JWT persists via localStorage)

---

## Known gaps (not bugs — documented limitations)
- Leave-date fields and Magic Share aren't exposed in the UI yet (API-only)
- Auto-translation needs an API key to actually translate
- Slides only supports text/shape elements (no images/tables in the editor UI)
- Single organization only — no multi-tenant switching
