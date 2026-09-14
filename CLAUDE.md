# WA Cloud Logger

Follow the `lean-dev` skill for how to think, scope, change and verify code.
This file holds only what is specific to this project or stricter than the
skill.

Next.js (App Router) + TypeScript + Tailwind + Supabase + Meta WhatsApp
Cloud API dashboard. Read `docs/ARCHITECTURE.md`, `docs/DATABASE.md`,
`docs/WEBHOOK.md` and `docs/IMPLEMENTATION_SPEC.md` before making non-trivial
changes — they cover the custom-auth/Realtime design, schema, webhook
idempotency, and known scope cuts.

## Conventions

- npm, not pnpm/yarn.
- No code comments. Plain code only.
- Row/Insert/Update shapes referenced by `types/database.ts`'s `Database`
  type must be declared with `type X = {...}`, never `interface X {...}` —
  interfaces don't satisfy postgrest-js's generic constraints and every
  query on that table silently types as `never`.
- All Supabase access from the browser goes through `supabase-js` Realtime
  subscriptions only (RLS-gated `SELECT`), never direct reads/writes. Every
  read and write from the dashboard's own logic goes through a Next.js
  Route Handler using `lib/supabase/server.ts` (service-role key).
- Meta access tokens and the Supabase service-role key are read only in
  server-side modules (`import "server-only"`) and must never be imported
  by anything under `components/` or any client component.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm test` should all
  pass before considering a change done.
- Customer window status (`NONE`/`ACTIVE`/`EXPIRING`/`EXPIRED`) is always
  computed from `conversations.customer_window_expires_at` at read time
  (`lib/whatsapp/window-status.ts`) — never stored as a column, never
  written by a background job. Don't add one; extend `getWindowStatus`.
- Contact CSV import phone normalization (`lib/contacts/import.ts`'s
  `normalizePhoneNumber`) must keep producing the exact same format
  `lib/contacts/service.ts`'s `findOrCreateContact` stores from the webhook
  path (digits only, `62` country code, no `+`) — a different format here
  creates a second `contacts` row for a number that already exists.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
