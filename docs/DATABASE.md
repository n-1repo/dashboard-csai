# Database

Schema lives in `supabase/migrations/`, applied in filename order:

- `0001_schema.sql` — enum types, tables, indexes, `updated_at` triggers.
- `0002_rls.sql` — Row Level Security policies.
- `0003_functions.sql` — `increment_conversation_unread`, used by the webhook
  to atomically bump `conversations.unread_count` / `last_message_id` /
  `last_message_at` on an inbound message.

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
MESSAGE_READ | MESSAGE_FAILED | CONTACT_CREATED | CONTACT_UPDATED`.
`message_id` and `contact_id` are both nullable FKs (a `CONTACT_UPDATED`
event from the dashboard's contact editor has no associated message) — at
least conceptually one of them is set for any given event.

## Relationships

```
wa_accounts 1───* conversations *───1 contacts
conversations 1───* messages
messages 1───* message_events
contacts 1───* message_events
conversations.last_message_id ──> messages.id
operators 1───* conversations (assigned_to, nullable)
```

## Indexes

- `conversations(last_message_at desc)` — the conversation list's sort order.
- `messages(conversation_id, "timestamp")` — the chat window's history query.
- `messages(meta_message_id)` and its `unique` constraint — webhook
  idempotency and status-update lookups.
- `contacts(phone_number)` — contact find-or-create and search.

## Row Level Security

RLS is enabled on every table. The only policies are `SELECT ... TO
authenticated USING (true)` on `contacts`, `conversations`, `messages` and
`message_events` — the tables the dashboard's Supabase Realtime
subscriptions read directly from the browser (see `docs/ARCHITECTURE.md` for
how a custom-auth login still produces a Supabase `authenticated` JWT).

There are no `authenticated` `INSERT`/`UPDATE`/`DELETE` policies anywhere,
and no policies at all on `operators` or `wa_accounts` (not even `SELECT`):
every write, and every read of those two tables, happens exclusively
server-side through a Next.js Route Handler using the `service_role` key,
which bypasses RLS entirely. The browser can never read an access token or a
password hash.
