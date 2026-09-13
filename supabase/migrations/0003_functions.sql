create function increment_conversation_unread(
  p_conversation_id uuid,
  p_message_id uuid,
  p_timestamp timestamptz
)
returns void as $$
begin
  update conversations
  set
    unread_count = unread_count + 1,
    last_message_id = p_message_id,
    last_message_at = p_timestamp
  where id = p_conversation_id;
end;
$$ language plpgsql;
