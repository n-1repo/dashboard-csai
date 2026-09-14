create or replace function increment_conversation_unread(
  p_conversation_id uuid,
  p_message_id uuid,
  p_timestamp timestamptz
)
returns void as $$
declare
  v_previous_customer_message_at timestamptz;
begin
  select last_customer_message_at into v_previous_customer_message_at
  from conversations
  where id = p_conversation_id
  for update;

  update conversations
  set
    unread_count = unread_count + 1,
    last_message_id = p_message_id,
    last_message_at = p_timestamp,
    last_customer_message_at = p_timestamp
  where id = p_conversation_id;

  insert into message_events (message_id, contact_id, event_type, payload)
  select
    p_message_id,
    contact_id,
    case when v_previous_customer_message_at is null
      then 'CUSTOMER_WINDOW_STARTED'
      else 'CUSTOMER_WINDOW_RESET'
    end::message_event_type,
    '{}'::jsonb
  from conversations
  where id = p_conversation_id;
end;
$$ language plpgsql;
