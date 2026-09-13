alter table operators enable row level security;
alter table wa_accounts enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table message_events enable row level security;

create policy contacts_authenticated_select on contacts
  for select to authenticated using (true);

create policy conversations_authenticated_select on conversations
  for select to authenticated using (true);

create policy messages_authenticated_select on messages
  for select to authenticated using (true);

create policy message_events_authenticated_select on message_events
  for select to authenticated using (true);
