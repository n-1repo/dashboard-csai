# Implementation spec

Contract summary for continuing this project without re-reading every file.

## Status

MVP is implemented end-to-end: auth, webhook ingestion, outbound send,
contacts/conversations/messages CRUD, realtime, dashboard UI. Nothing here
is a mock — every path talks to Supabase for real and to Meta's real Graph
API endpoints; it has not been exercised against a live Meta app/Supabase
project from this session (see "What still needs your own setup" in
`README.md`).

## Auth model (read this before touching auth)

Not Supabase Auth. `operators` table + bcrypt (`lib/auth/password.ts`). Two
JWTs, both signed with `jose`:

- App session (`lib/auth/session.ts` → `signAppSessionToken` /
  `verifyAppSessionToken`), httpOnly cookie `wa_session`, checked by
  `proxy.ts` for `/dashboard/**` and every protected API route.
- Supabase Realtime token (`signSupabaseRealtimeToken`), signed with
  `SUPABASE_JWT_SECRET`, `role: authenticated`, minted on demand by
  `GET /api/auth/session`, consumed by `lib/supabase/browser.ts`'s
  `setRealtimeAuth`. Never persisted (no localStorage) — refetched by
  `hooks/useRealtimeAuth` every 45 minutes.

Every Supabase read the dashboard needs goes through a Route Handler using
`lib/supabase/server.ts` (service-role, bypasses RLS). The only thing the
browser's Supabase client is for is Realtime subscriptions authorized via
RLS `authenticated` policies (`supabase/migrations/0002_rls.sql`).

## Adding a new table

1. Add the SQL to a new `supabase/migrations/NNNN_*.sql` file.
2. Add the `Row`/`Insert`/`Update`/`Relationships` shape to the `Database`
   type in `types/database.ts` — **use `type X = {...}`, not `interface
   X {...}`**, for anything referenced as a table's `Row`/`Insert`/`Update`.
   Plain interfaces don't structurally satisfy postgrest-js's
   `Record<string, unknown>` constraint and every query on that table
   silently types as `never`. This bit us once during the initial build;
   don't reintroduce it.
3. If the browser needs to read it live, add an `authenticated` `SELECT`
   policy in a new RLS migration — never an `INSERT`/`UPDATE`/`DELETE`
   policy; writes stay server-side.

## Adding a new Meta message type / webhook field

`lib/whatsapp/webhook-parser.ts` (`mapMessageType`, `extractMessageContent`)
is the single place that turns a raw Meta message into our `message_type` /
`body` / `media_url` / `caption` columns. `components/whatsapp/MessageBubble.tsx`
is the single place that renders a `Message` row back into UI — the two are
meant to stay in sync deliberately (parser decides what's stored, bubble
decides how it displays).

## Adding a new outbound message type (currently TEXT only)

`app/api/whatsapp/send/route.ts` and `lib/whatsapp/client.ts` only implement
`sendTextMessage`. A new type needs: a new `client.ts` function building the
right Graph API payload, a `MessageComposer` UI affordance, and the same
"insert SENT only if Meta returned a message id, otherwise FAILED" handling
already used for text — don't skip that part, it's the thing that satisfies
"send request succeeding is not the same as delivered".

## Customer messaging window (read this before touching it)

`conversations.last_customer_message_at` (plain column, set only by the RPC
in `supabase/migrations/0006_customer_window_rpc.sql`) and
`customer_window_expires_at` (generated, `+ 24h`, never set directly) are
the only stored state. Status (`NONE | ACTIVE | EXPIRING | EXPIRED`) is
always computed from `customer_window_expires_at` vs. now —
`lib/whatsapp/window-status.ts`'s `getWindowStatus` — never stored, and the
4-hour "expiring soon" threshold lives in that one file
(`WINDOW_EXPIRING_THRESHOLD_MS`). `hooks/useWindowStatus.ts` re-ticks this
every 30s for the UI; nothing else polls.

There is no reminder table and no cron job. The Follow-ups panel
(`components/whatsapp/FollowUpCenter.tsx`) filters the same `conversations`
array `hooks/useConversations` already holds (status `OPEN` and
`getWindowStatus(...) === "EXPIRING"`), so it updates from the existing
Realtime subscription for free. If you're asked to add "acknowledge /
dismiss so it disappears from the list before it expires" — that's new
state that needs its own table; don't try to fake it by mutating
`conversations`.

The reset rule (only a genuinely new inbound message moves
`last_customer_message_at`) is enforced by
`lib/whatsapp/webhook-parser.ts`'s `shouldResetCustomerWindow(direction,
isNewMessage)`, gating the exact same call site that already gated
`increment_conversation_unread` on `isNewMessage`. If you add a new way to
create an inbound message (a different webhook field, a backfill script),
route it through that same predicate — don't reimplement the gate.

## Where AI CS plugs in later

Per `docs/ARCHITECTURE.md`, an AI layer is just another reader/writer of
`conversations` / `messages` / `message_events` — most naturally as its own
Route Handler or worker that: reads new inbound messages (via the same
realtime subscription pattern, or a poll on `message_events` where
`event_type = 'MESSAGE_CREATED'`), and writes replies through the same
`/api/whatsapp/send` contract (or a dedicated internal equivalent) so the
FAILED/SENT/DELIVERED/READ lifecycle stays exactly one path. Do not give it
a second way to write `messages` rows.

## Known scope cuts (intentional, not oversights)

- No operator management UI/API (only one seeded operator); `assigned_to` on
  a conversation is settable in the schema but has no picker UI yet.
- No Supabase Storage caching of inbound media; `/api/whatsapp/media/[id]`
  proxies from Meta on every request.
- No template messages, interactive replies, or outbound media — outbound
  MVP is text only, per the original spec.
- Conversation/contact search is client-side over the full fetched list
  (fine at MVP scale); the API shapes (`/api/conversations`,
  `/api/contacts?q=`) are ready to grow into server-side pagination/search
  without changing their response shape.
- No acknowledge/dismiss for the Follow-ups panel (an operator can't mark a
  conversation "handled" to hide it before the window actually expires) —
  that's a product decision, not built until there's a concrete need for
  it, and needs its own state table when it is.
