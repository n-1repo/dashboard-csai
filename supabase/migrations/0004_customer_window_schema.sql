alter table conversations
  add column last_customer_message_at timestamptz,
  add column customer_window_expires_at timestamptz
    generated always as (last_customer_message_at + interval '24 hours') stored;

create index conversations_window_expires_idx
  on conversations (customer_window_expires_at)
  where status = 'OPEN';
