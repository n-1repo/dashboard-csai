# Database

Schema lives in `supabase/migrations/`, applied in filename order:

- `0001_schema.sql` — enum types, tables, indexes, `updated_at` triggers.
- `0002_rls.sql` — Row Level Security policies.
- `0003_functions.sql` — `increment_conversation_unread`, used by the webhook
  to atomically bump `conversations.unread_count` / `last_message_id` /
  `last_message_at` on an inbound message.
- `0004_customer_window_schema.sql` — adds `conversations.last_customer_message_at`
  and the generated `customer_window_expires_at` column, plus a partial index.
- `0005_customer_window_events_enum.sql` — adds `CUSTOMER_WINDOW_STARTED` /
  `CUSTOMER_WINDOW_RESET` to `message_event_type` (kept in its own migration:
  Postgres won't let a newly added enum value be used in the same
  transaction it was added in).
- `0006_customer_window_rpc.sql` — extends `increment_conversation_unread`
  (`create or replace`, same function) to also set
  `last_customer_message_at` and log the matching window event.
- `0007_contact_imports.sql` — adds `contact_imports`, an audit record for
  bulk CSV contact imports (`docs/IMPLEMENTATION_SPEC.md`).

`supabase/seed.sql` is development-only sample data (contacts, conversations
in different states, a failed outbound message, a read outbound message, one
dev operator login). Never run it against a production project.

## Tables

**operators** — dashboard login accounts (custom auth, not Supabase Auth).
`email` unique, `password_hash` bcrypt.

**wa_accounts** — one row per connected WhatsApp Business number.
`phone_number_id` unique (used to route inbound webhooks to the right
account). `access_token` is a secret, read only by server-side Route
Handlers.

**contacts** — one row per WhatsApp phone number (`phone_number` unique).
`tags` is a `jsonb` string array (kept simple/maintainable over a relational
tags table for MVP scale). Auto-created on first inbound message from a
number; editable from the dashboard.

**conversations** — one open thread per `(contact_id, wa_account_id)` pair
(unique constraint). `status` is `OPEN | PENDING | RESOLVED | ARCHIVED`.
`last_message_id` / `last_message_at` / `unread_count` are denormalized onto
the conversation so the conversation list never has to aggregate `messages`
to render or sort.

`last_customer_message_at` is the timestamp of the customer's most recent
inbound message — set only by the RPC in `0006_customer_window_rpc.sql`,
never by application code directly, and never by an outbound message or a
redelivered webhook (see `docs/WEBHOOK.md`). `customer_window_expires_at` is
a `generated always as (last_customer_message_at + interval '24 hours')
stored` column — Postgres keeps it consistent by construction, so there's no
"window started" timestamp to duplicate and no way for the two values to
disagree. Neither column stores a status (`ACTIVE`/`EXPIRING`/`EXPIRED`):
that's computed on read, see `docs/ARCHITECTURE.md`.

**messages** — one row per WhatsApp message, inbound or outbound.
`meta_message_id` is unique (nullable, since a message that failed to send
before Meta ever returned an id has none) — this is the idempotency key for
the webhook, see `docs/WEBHOOK.md`. `status` moves forward only:
`RECEIVED` (inbound) / `SENT -> DELIVERED -> READ`, with `FAILED` reachable
from any state and terminal. `media_url` stores the Meta **media id**, not a
real URL — see `docs/ARCHITECTURE.md`. `raw_payload` keeps the full Meta
payload for audit/debugging.

**message_events** — an append-only audit trail:
`WEBHOOK_RECEIVED | MESSAGE_CREATED | MESSAGE_SENT | MESSAGE_DELIVERED |
MESSAGE_READ | MESSAGE_FAILED | CONTACT_CREATED | CONTACT_UPDATED |
CUSTOMER_WINDOW_STARTED | CUSTOMER_WINDOW_RESET`. `message_id` and
`contact_id` are both nullable FKs (a `CONTACT_UPDATED` event from the
dashboard's contact editor has no associated message) — at least
conceptually one of them is set for any given event. `CUSTOMER_WINDOW_STARTED`
/ `_RESET` are logged by the same RPC that updates
`last_customer_message_at`: `STARTED` the first time a conversation ever
gets an inbound message, `RESET` every time after. There is no
`CUSTOMER_WINDOW_EXPIRING` / `_EXPIRED` event — expiry is a continuous
function of time, not a discrete occurrence, so there's no correct moment
to log it without a background process (deliberately not built, see
`docs/ARCHITECTURE.md`).

**contact_imports** — one row per CSV bulk-import run (audit only, not a
processing queue): `filename`, `total_rows`, and the same
created/updated/skipped/invalid counts the import API returns, plus
`imported_by` (the logged-in operator, never client-supplied — see
`docs/IMPLEMENTATION_SPEC.md` for the full CSV import contract). No raw CSV
file is stored.

## Relationships

```
wa_accounts 1───* conversations *───1 contacts
conversations 1───* messages
messages 1───* message_events
contacts 1───* message_events
conversations.last_message_id ──> messages.id
operators 1───* conversations (assigned_to, nullable)
operators 1───* contact_imports (imported_by)
```

## Indexes

- `conversations(last_message_at desc)` — the conversation list's sort order.
- `messages(conversation_id, "timestamp")` — the chat window's history query.
- `messages(meta_message_id)` and its `unique` constraint — webhook
  idempotency and status-update lookups.
- `contacts(phone_number)` — contact find-or-create and search.
- `conversations(customer_window_expires_at) where status = 'OPEN'` — the
  Follow-ups live query (`docs/ARCHITECTURE.md`); partial because only open
  conversations are ever relevant to it.

## Row Level Security

RLS is enabled on every table. The only policies are `SELECT ... TO
authenticated USING (true)` on `contacts`, `conversations`, `messages`,
`message_events` and `contact_imports` — the same pattern every table gets
(`docs/IMPLEMENTATION_SPEC.md`'s "Adding a new table" procedure), even
though `contact_imports` isn't currently read by any Realtime subscription
(it's audit-only, no history UI yet). See `docs/ARCHITECTURE.md` for how a
custom-auth login still produces a Supabase `authenticated` JWT.

`last_customer_message_at` and `customer_window_expires_at` ride the
existing `conversations` `SELECT` policy — no new policy was needed since
no new table was added and the columns are never written by anything other
than the service-role RPC.

There are no `authenticated` `INSERT`/`UPDATE`/`DELETE` policies anywhere,
and no policies at all on `operators` or `wa_accounts` (not even `SELECT`):
every write, and every read of those two tables, happens exclusively
server-side through a Next.js Route Handler using the `service_role` key,
which bypasses RLS entirely. The browser can never read an access token or a
password hash.
