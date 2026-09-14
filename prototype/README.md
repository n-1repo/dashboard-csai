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
  seconds later.
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
