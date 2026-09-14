create table contact_imports (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  total_rows integer not null,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  invalid_count integer not null default 0,
  imported_by uuid not null references operators (id),
  created_at timestamptz not null default now()
);

alter table contact_imports enable row level security;

create policy contact_imports_authenticated_select on contact_imports
  for select to authenticated using (true);
