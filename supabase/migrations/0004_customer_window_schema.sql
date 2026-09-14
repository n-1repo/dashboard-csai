create function customer_window_expiry(ts timestamptz)
returns timestamptz as $$
  select ts + interval '24 hours';
$$ language sql immutable;

alter table conversations
  add column last_customer_message_at timestamptz,
  add column customer_window_expires_at timestamptz
    generated always as (customer_window_expiry(last_customer_message_at)) stored;

create index conversations_window_expires_idx
  on conversations (customer_window_expires_at)
  where status = 'OPEN';
