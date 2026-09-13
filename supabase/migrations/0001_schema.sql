create extension if not exists pgcrypto;

create type message_direction as enum ('INBOUND', 'OUTBOUND');

create type message_type as enum (
  'TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER',
  'LOCATION', 'CONTACT', 'INTERACTIVE', 'TEMPLATE', 'SYSTEM'
);

create type message_status as enum ('RECEIVED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

create type conversation_status as enum ('OPEN', 'PENDING', 'RESOLVED', 'ARCHIVED');

create type message_event_type as enum (
  'WEBHOOK_RECEIVED', 'MESSAGE_CREATED', 'MESSAGE_SENT', 'MESSAGE_DELIVERED',
  'MESSAGE_READ', 'MESSAGE_FAILED', 'CONTACT_CREATED', 'CONTACT_UPDATED'
);

create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table operators (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger operators_set_updated_at
  before update on operators
  for each row execute function set_updated_at();

create table wa_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_number text not null,
  phone_number_id text not null unique,
  business_account_id text not null,
  access_token text not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger wa_accounts_set_updated_at
  before update on wa_accounts
  for each row execute function set_updated_at();

create table contacts (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null unique,
  display_name text,
  profile_name text,
  avatar_url text,
  email text,
  notes text,
  tags jsonb not null default '[]'::jsonb,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contacts_set_updated_at
  before update on contacts
  for each row execute function set_updated_at();

create index contacts_phone_number_idx on contacts (phone_number);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  wa_account_id uuid not null references wa_accounts (id) on delete cascade,
  status conversation_status not null default 'OPEN',
  last_message_id uuid,
  last_message_at timestamptz,
  unread_count integer not null default 0,
  assigned_to uuid references operators (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contact_id, wa_account_id)
);

create trigger conversations_set_updated_at
  before update on conversations
  for each row execute function set_updated_at();

create index conversations_last_message_at_idx on conversations (last_message_at desc);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  meta_message_id text unique,
  direction message_direction not null,
  message_type message_type not null,
  body text,
  media_url text,
  media_mime_type text,
  caption text,
  status message_status not null,
  sender_phone text,
  recipient_phone text,
  "timestamp" timestamptz not null default now(),
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index messages_conversation_timestamp_idx on messages (conversation_id, "timestamp");
create index messages_meta_message_id_idx on messages (meta_message_id);

alter table conversations
  add constraint conversations_last_message_id_fkey
  foreign key (last_message_id) references messages (id) on delete set null;

create table message_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references messages (id) on delete cascade,
  contact_id uuid references contacts (id) on delete cascade,
  event_type message_event_type not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index message_events_message_id_idx on message_events (message_id);
