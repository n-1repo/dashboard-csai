# WA Cloud Logger

Internal dashboard that logs Meta WhatsApp Cloud API conversations into
Supabase and exposes them through a WhatsApp-Web-style operator interface:
conversation logger, chat history viewer, contact management, message status
tracker, and a realtime inbox. It is the base layer for a future AI Customer
Service / CRM integration — no AI is implemented yet.

## Architecture

```
Meta WhatsApp Cloud API -> Next.js Webhook -> Supabase PostgreSQL
                                                     |
                                              Supabase Realtime
                                                     |
                                        WhatsApp-like Dashboard

Dashboard -> Next.js API -> Meta WhatsApp Cloud API -> Meta status webhook
   -> Supabase -> Supabase Realtime -> Dashboard
```

Supabase is the source of truth; Meta is only the transport layer. See
`docs/ARCHITECTURE.md` for the full data/webhook/outbound/realtime flow and
`docs/DATABASE.md` / `docs/WEBHOOK.md` for schema and webhook details.

## Stack

Next.js (App Router) + React + TypeScript + Tailwind CSS + hand-built
shadcn-style UI components (Radix primitives) + lucide-react icons +
Supabase (Postgres, Realtime) + Meta WhatsApp Cloud API. Backend logic lives
entirely in Next.js Route Handlers — there is no separate backend server.

Authentication is a custom email + password (bcrypt) login, not Supabase
Auth. See `docs/ARCHITECTURE.md` for why, and how it still gets genuine
Supabase Realtime + RLS.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Open http://localhost:3000 — you will be redirected to `/login`.

### Environment variables

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings → API (anon/publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings → API (service_role key, server-only, never expose) |
| `SUPABASE_JWT_SECRET` | Supabase project settings → API → JWT Settings |
| `META_APP_SECRET` | Meta App dashboard → Settings → Basic |
| `META_WEBHOOK_VERIFY_TOKEN` | Any string you choose; must match what you enter in the Meta webhook subscription form |
| `META_GRAPH_API_VERSION` | e.g. `v21.0` |
| `APP_SESSION_SECRET` | Any long random string (used to sign the operator's login session) |
| `APP_URL` | Public URL of this app, used as the base for the Meta webhook URL |

### Supabase setup (manual)

1. Create a Supabase project.
2. Run the SQL files in `supabase/migrations/` in order (Supabase SQL editor
   or `supabase db push` with the Supabase CLI).
3. For local development, also run `supabase/seed.sql` — it creates a dev
   operator (`operator@example.com` / `devpassword123`), a placeholder
   WhatsApp account row, and sample contacts/conversations/messages. Never
   run the seed against a production project.
4. Once you have a real WhatsApp number, insert its row into `wa_accounts`
   yourself (phone_number_id, business_account_id, access_token from Meta) —
   there is no UI for this in the MVP, by design, since it holds a secret.

### Meta setup (manual)

1. Create a Meta App with the WhatsApp product added, and a WhatsApp
   Business Account + test/production phone number.
2. Under WhatsApp → Configuration, set the webhook URL to
   `${APP_URL}/api/whatsapp/webhook` and the verify token to the same value
   as `META_WEBHOOK_VERIFY_TOKEN`.
3. Subscribe to the `messages` webhook field.
4. Copy the phone number ID, WABA ID and a permanent access token into the
   `wa_accounts` table (see above).

## Development

```bash
npm run lint
npx tsc --noEmit
npm run build
npm test
```

## Deployment

Deploy the Next.js app to Vercel as usual (`vercel deploy` or Git
integration). Set all the environment variables above in the Vercel project
settings. Point Meta's webhook at the deployed `APP_URL`.

A static, backend-free prototype of the dashboard (mock data, no Supabase or
Meta API needed) is now live at **https://n-1repo.github.io/dashboard-csai/**.
See `prototype/README.md` for details.

## Version log

- **0.1.0** — Initial MVP: WhatsApp Cloud API dashboard on Supabase
  (webhook ingestion, realtime inbox, contacts, message status tracking).
- **0.1.1** — Added CI workflow to run `npm run build` on push/PR.
- **0.2.0** — Added a static prototype (`prototype/`) deployable to GitHub
  Pages, with its own GitHub Actions workflow.
