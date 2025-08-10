MyVault – Requirements (Enhanced v1.1)

Vision
- A comprehensive personal vault and command center to capture, store, and retrieve links, notes, docs/IDs, health reports, expenses, and tasks across mobile and desktop with cloud storage and synchronization.

Guiding Principles
- Quick capture first, organize later (Inbox default).
- Offline‑first; fast local reads/writes with optional sync later.
- One place to go; minimal clicks; clean, calm UI.

Primary Categories (Home icons)
- Inbox, Links, Notes, Docs & IDs, Expenses, Tasks, Health, Search.

Core User Stories
- As a user, I can Quick Add an item (link/note/doc/expense/task) from the home screen in one tap.
- As a user, I can share from other apps to MyVault via Android Web Share Target; shared items land in Inbox.
- As a user, I can store images/PDFs of IDs and open them fullscreen quickly (favorite pin for top access).
- As a user, I can track expenses (date, category, note, amount) and view monthly totals.
- As a user, I can jot short notes and search across everything.
- As a user, I can view health documents grouped by type (reports, prescriptions, insurance, vaccinations).
- As a user, I can create simple tasks with due dates and mark them done.
- As a user, I can protect the app with an optional passcode/biometric gate.

Enhanced Features (v1.1)
- ✅ Firebase Cloud Storage integration for document uploads
- ✅ Real-time file upload with drag & drop interface  
- ✅ Gallery-style document viewer with image previews
- ✅ Push notification capability via Firebase Cloud Messaging
- ✅ Production deployment on Google Cloud Run
- ✅ Comprehensive API logging and monitoring
- ✅ Enhanced error handling and user feedback
- ✅ PWA manifest with proper app icons
- ✅ Responsive desktop search functionality

Non‑Goals (for MVP)
- Advanced budgeting, OCR, multi‑user accounts, complex analytics, automated reminders.

Constraints & Architecture
- PWA first (installable, works offline, responsive); desktop and mobile.
- Local persistence: IndexedDB (via idb/Dexie). Files stored in Cache/IndexedDB; optional bucket later.
- Optional sync (Phase 2): minimal FastAPI on Cloud Run + SQLite/Cloud SQL + signed URL file storage (GCS).

UX Requirements
- Home shows category icons and Quick Add tiles; most recent items below.
- Bottom nav on mobile exposes all categories within 1–2 taps (overflow for extra items).
- Left sidebar on desktop groups Quick Access and More; uses soft color accents, not stark white.
- Consistent color system with a branded primary and subtle surface tints.

Security & Privacy
- Local-only by default. Optional device passcode/biometric lock screen.
- If sync enabled, encrypt in transit; minimal telemetry; personal use only.

Acceptance Criteria (MVP)
- Installable PWA with manifest, icons, service worker; works offline for existing content.
- Routes exist for all categories with stub UIs and sample data.
- Quick Add presents five tiles (Link, Note, Doc, Expense, Task) and navigates correctly.
- Share Target accepts text/URLs and creates an Inbox item (Android only in Phase 1).
- Expense screen shows sample table and simple monthly summary.
- Search screen exists with input; wired later to local index.
- Basic theming applied; brand name displayed as “MyVault”.



