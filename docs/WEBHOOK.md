# Webhook

`app/api/whatsapp/webhook/route.ts` implements both halves of Meta's webhook
contract.

## Verification (`GET`)

Meta calls `GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`
when you save the webhook subscription in the Meta App dashboard. The
handler checks `hub.mode === "subscribe"` and `hub.verify_token ===
META_WEBHOOK_VERIFY_TOKEN`, and if both match, echoes `hub.challenge` back
as plain text with a 200. Anything else gets a 403.

## Signature validation (`POST`)

Every delivery carries an `X-Hub-Signature-256: sha256=<hex>` header, an
HMAC-SHA256 of the raw request body keyed with the Meta App Secret
(`META_APP_SECRET`). The handler reads the raw body text first (before any
JSON parsing, since the signature is over the exact bytes Meta sent),
recomputes the HMAC, and compares it to the header with a timing-safe
comparison (`lib/whatsapp/signature.ts`). A missing or mismatched signature
is rejected with 401 before any parsing or database access happens.

## Incoming message idempotency

Meta can and does redeliver the same webhook event (retries on timeout, at
least once delivery). The handler must not create a duplicate message.

`messages.meta_message_id` is `unique`. Every inbound message is written
with:

```ts
supabase.from("messages").upsert(row, {
  onConflict: "meta_message_id",
  ignoreDuplicates: true,
});
```

`ignoreDuplicates: true` means a second delivery of the same message id is a
silent no-op at the database level — `.select()` on that call returns no row
for the duplicate, which the handler uses to detect "was this actually new?"
and skip the side effects that must only happen once:

- `MESSAGE_CREATED` and `CONTACT_CREATED` events are only logged when the
  insert was genuinely new.
- `conversations.unread_count` is only incremented, and `last_message_at`
  only bumped, when the insert was genuinely new — otherwise a redelivered
  webhook would inflate the unread badge every time Meta retries.

A `WEBHOOK_RECEIVED` event is still logged on every delivery (new or
duplicate) against the resolved message id, so the audit trail
(`message_events`) shows every webhook Meta actually sent, while the
`messages` table itself never gains a duplicate row.

## Customer messaging window reset

Every genuinely new inbound message also resets the 24-hour customer
messaging window: `lib/whatsapp/webhook-parser.ts`'s
`shouldResetCustomerWindow("INBOUND", isNewMessage)` gates the same call to
`touchConversationOnInbound` (the `increment_conversation_unread` RPC) that
already only fires when the upsert above was a genuine insert — so a
redelivered webhook (duplicate `meta_message_id`) can never reset the
window, only a message that was actually new. Outbound messages never go
through this webhook at all (they're created by `/api/whatsapp/send`), so
they structurally can't touch the window either. See
`docs/ARCHITECTURE.md` for the full customer-window design.

## Status updates

A `statuses` entry (`sent | delivered | read | failed`) is matched to its
message by `meta_message_id`. Status must only move forward:
`SENT -> DELIVERED -> READ`, with `FAILED` reachable from anywhere and
terminal (`lib/whatsapp/status-rank.ts`). A redelivered or out-of-order
status update (e.g. a late `sent` arriving after `read` was already applied)
is rejected by this check and never downgrades the stored status. The
matching `MESSAGE_SENT` / `MESSAGE_DELIVERED` / `MESSAGE_READ` /
`MESSAGE_FAILED` event is only logged when the update was actually applied.

## Error handling

Per-message/per-status processing happens inside the same request; an error
thrown while processing one entry currently propagates and the endpoint
returns a non-200, which is the correct behavior for Meta to retry that
exact delivery later (retrying is safe because of the idempotency guarantees
above). The endpoint does no work at all, for any entry, until the signature
check has passed.
