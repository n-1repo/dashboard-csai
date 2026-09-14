# Architecture

## System overview

```
Meta WhatsApp Cloud API
   |  (webhook: messages + statuses)
   v
Next.js Route Handler (/api/whatsapp/webhook)
   |  service-role client
   v
Supabase PostgreSQL  --------->  Supabase Realtime  --------->  Dashboard (browser)

Dashboard composer
   v
Next.js Route Handler (/api/whatsapp/send)
   |  account access_token, server-side only
   v
Meta WhatsApp Cloud API
   v
Meta status webhook  --------->  same ingestion path above  --------->  Realtime  --------->  Dashboard
```

Supabase is the source of truth for every conversation, contact and message.
Meta is only ever read from or written to inside a Next.js Route Handler —
the browser never talks to Meta directly and never sees a Meta or Supabase
service-role credential.

## Why custom auth still gets real Supabase Realtime + RLS

The dashboard's login is a plain email + password form checked against an
`operators` table with bcrypt-hashed passwords — not Supabase Auth (GoTrue).
Supabase Realtime and Row Level Security are normally driven by a Supabase
Auth session's JWT, so a custom login needs an equivalent to keep Realtime
and RLS genuinely enforced instead of relying on a permissive, meaningless
policy.

The fix is Supabase's own "third-party auth" integration point: any JWT
signed with the project's `SUPABASE_JWT_SECRET` containing `role:
"authenticated"` and a `sub` claim is accepted by PostgREST and Realtime for
authorization, whether or not that `sub` exists in `auth.users`. So:

1. `POST /api/auth/login` verifies the bcrypt hash, then mints two JWTs:
   - an app-session JWT (httpOnly cookie, `wa_session`), used only by this
     app's own `proxy.ts` to gate `/dashboard/**` and the protected API
     routes;
   - nothing else is issued at login time — the Supabase-compatible token is
     minted on demand.
2. `GET /api/auth/session` (itself gated by the app session) mints a
   short-lived Supabase JWT (`role: authenticated`, `sub: operator.id`) and
   returns it to the browser.
3. The browser's `supabase-js` client (created with the public anon key)
   calls `realtime.setAuth(token)` with that JWT, so its `postgres_changes`
   subscriptions are authorized as `authenticated`, not `anon`.
4. RLS policies (see `docs/DATABASE.md`) grant `SELECT` to `authenticated`
   on the tables the dashboard reads. There are no `authenticated` write
   policies anywhere — every mutation goes through a Route Handler using the
   `service_role` key, which bypasses RLS by design.

This means the client-side Supabase credentials the browser ever holds are
the public anon key and a 1-hour token that only grants read access via RLS
policies that were already public-dashboard-appropriate — never the
service-role key, and never a Meta access token.

## Data flow: incoming message

```
Meta -> POST /api/whatsapp/webhook
     -> verify X-Hub-Signature-256 against META_APP_SECRET
     -> resolve wa_accounts by phone_number_id
     -> find-or-create contacts by wa_id (phone number)
     -> find-or-create conversations by (contact_id, wa_account_id)
     -> insert messages (upsert, ignoreDuplicates on meta_message_id)
     -> insert message_events (WEBHOOK_RECEIVED, MESSAGE_CREATED, CONTACT_CREATED)
     -> bump conversations.unread_count / last_message_at / last_message_id
     -> Supabase Realtime notifies subscribed dashboards
```

See `docs/WEBHOOK.md` for the idempotency mechanics in detail.

## Data flow: outbound message

```
Dashboard composer -> POST /api/whatsapp/send { conversationId, text }
   -> load conversation + contact + wa_account server-side
   -> call Meta Graph API /{phone_number_id}/messages with the account's access_token
   -> insert an OUTBOUND message row with status SENT only if Meta returned a message id,
      otherwise status FAILED (a failed HTTP call is never treated as a delivered message)
   -> insert message_events (MESSAGE_CREATED, MESSAGE_SENT or MESSAGE_FAILED)
   -> conversation's last_message is updated
   -> the later status webhook (delivered/read/failed) is the only thing that ever
      moves the message to DELIVERED/READ/FAILED afterwards
```

## Realtime flow

`hooks/useConversations`, `hooks/useMessages` and `hooks/useContacts` each:

1. Fetch their initial data from a Route Handler (`/api/conversations`,
   `/api/messages`, `/api/contacts`).
2. Open a `supabase-js` `postgres_changes` subscription (conversations,
   messages filtered by `conversation_id`, contacts) and patch local state
   as events arrive.
3. Unsubscribe (`supabase.removeChannel`) on unmount / dependency change.

`hooks/useRealtimeAuth` bootstraps the Realtime JWT described above and
refreshes it periodically so long-lived dashboard tabs keep working.

No component polls — every list re-renders purely from realtime events plus
the one-time initial fetch.

## Customer messaging window

Meta only allows free-form outbound messages within 24 hours of the
customer's last inbound message; after that, only approved templates can be
sent. The dashboard tracks this as `conversations.last_customer_message_at`
and a generated column `customer_window_expires_at` (`last_customer_message_at
+ interval '24 hours'`) — see `docs/DATABASE.md` for the schema and why it's
only two columns.

Status (`NONE | ACTIVE | EXPIRING | EXPIRED`) is never stored — it's derived
from `customer_window_expires_at` vs. the current time by
`lib/whatsapp/window-status.ts`'s `getWindowStatus`, called both server-side
(if ever needed) and client-side via `hooks/useWindowStatus` (a 30s tick so
the countdown moves without a reload, always recomputed from the same
`customer_window_expires_at` value — a reload or switching conversations
never resets it). `EXPIRING` is `remaining <= 4h`; `EXPIRED` is `remaining
<= 0`. There is deliberately no `customer_window_reminders` table or cron
job: the "Follow-ups" panel (`components/whatsapp/FollowUpCenter.tsx`) is a
plain client-side filter over the same `conversations` array
`hooks/useConversations` already keeps live via Realtime — a conversation's
`customer_window_expires_at` changing is itself a `conversations` row
update, which the existing subscription already re-fetches.

Reset rule: only a genuinely new inbound message moves
`last_customer_message_at` — never a redelivered webhook (duplicate
`meta_message_id`) and never an outbound message. This is enforced by
`lib/whatsapp/webhook-parser.ts`'s `shouldResetCustomerWindow(direction,
isNewMessage)`, which gates the same RPC call already used for the unread
counter (`increment_conversation_unread` in
`supabase/migrations/0006_customer_window_rpc.sql`) — one atomic update, not
a second query. An `EXPIRED` window blocks the composer's normal send flow
in the UI (`components/whatsapp/MessageComposer.tsx`) in favor of a message
pointing the operator at an approved template; `EXPIRING` only shows a
warning.

## Media

Meta's media URLs are short-lived and require the account's access token, so
inbound media messages store the Meta media **id** (not a URL) in
`messages.media_url`. `GET /api/whatsapp/media/[mediaId]` resolves and
proxies the actual bytes server-side on demand, so the token never reaches
the browser. There is no local caching of media in this MVP (a Supabase
Storage cache is a natural, listed future extension, not required now).

## Future AI integration

The logger only ever writes to `messages` / `message_events` /
`conversations` — an AI Customer Service layer added later plugs in purely
as another consumer/producer of those same tables (read new inbound
messages, write an OUTBOUND message the same way `/api/whatsapp/send` does),
with no changes needed to the ingestion or realtime path described above.
