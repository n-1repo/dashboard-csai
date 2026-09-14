# WA Cloud Logger — Prototype (static, no backend)

A standalone, static-export copy of the dashboard for trying out the UI and
flows on GitHub Pages, without Supabase, Meta API credentials, or any
server. Lives in its own `prototype/` folder so it never touches the real
app in the repo root.

Now live at **https://n-1repo.github.io/dashboard-csai/**

## What's different from the real app

- No Supabase, no Route Handlers, no Meta WhatsApp Cloud API calls.
- All data (contacts, conversations, messages, login session) lives in
  `localStorage`, seeded from `lib/seed.ts` on first load.
- Login accepts any email/password.
- Sending a message simulates delivery and a canned auto-reply a couple of
  seconds later; a fresh inbound auto-reply also resets that conversation's
  24-hour customer window, same reset rule as the real app.
- Contacts page has bulk CSV import (drag & drop → map columns → preview →
  confirm), applied directly against the in-memory/localStorage contact list
  instead of a server route.
- Settings has a "Reset data demo" button to wipe localStorage back to the
  seed data.

## Local dev

```bash
npm install
npm run dev
```

## Build (matches CI)

```bash
NEXT_BASE_PATH=/dashboard-csai npm run build
```

Output goes to `out/`. `.github/workflows/deploy-prototype.yml` builds and
publishes this folder to GitHub Pages on every push to `main` that touches
`prototype/`.

## Version log

- **0.1.0** (2026-09-14) — Initial prototype: login, chat list, send/receive
  messages with a simulated auto-reply, contacts CRUD, settings with a
  reset-demo-data button. All state in `localStorage`, seeded on first load.
  Deployed to GitHub Pages via `deploy-prototype.yml`.
- **0.2.0** (2026-09-14) — Brought the prototype up to date with the real
  app's two most recent features: the 24-hour customer messaging window
  (live status on the conversation list/chat header/contact panel, a
  Follow-ups panel, composer blocked when expired) and bulk CSV contact
  import (Contacts page → Import Contacts). Both reimplemented against
  `lib/store.tsx`'s mock data layer instead of Supabase/a Route Handler.
