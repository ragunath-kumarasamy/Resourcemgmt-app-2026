-- ES Resource Command Center - Supabase schema
-- Run in: Supabase -> SQL Editor -> New query -> Run
drop table if exists allocations cascade;
drop table if exists rfps         cascade;
drop table if exists logs         cascade;
drop table if exists accounts     cascade;
drop table if exists resources    cascade;

create table resources (
  id                text primary key,
  resource_name     text not null,
  email             text,
  role              text,
  department        text,
  employee_type     text,
  reporting_manager text,
  team_head         text,
  resource_geo      text default 'EMEA' check (resource_geo in ('EMEA','APAC','NA')),
  status            text default 'Active',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table accounts (
  id            text primary key,
  account_name  text not null unique,
  geo           text default 'EMEA' check (geo in ('EMEA','APAC','NA')),
  account_owner text,
  start_date    date,
  end_date      date,
  status        text default 'Active',
  created_at    timestamptz default now()
);

create table allocations (
  id                    bigint generated always as identity primary key,
  resource_id           text not null references resources(id) on delete cascade,
  account_id            text not null references accounts(id)  on delete cascade,
  project_name          text,
  allocation_month      date not null,
  allocation_percentage numeric not null default 0,
  project_geo           text check (project_geo in ('EMEA','APAC','NA')),
  comments              text,
  is_locked             boolean default false,
  updated_by            text default 'admin',
  updated_at            timestamptz default now(),
  unique (resource_id, account_id, allocation_month)
);

create table rfps (
  id uuid primary key default gen_random_uuid(),
  rfp_name text not null, account_name text, market_geo text,
  technology text, status text default 'InProgress',
  expected_start_date date, expected_end_date date,
  resource_required text, resources_planned text, revenue numeric, owner text,
  linked_project_id text references accounts(id),
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table logs (
  id bigint generated always as identity primary key,
  module text not null, action text not null, entity_name text,
  old_value jsonb, new_value jsonb, updated_by text default 'admin',
  created_at timestamptz default now()
);

create index idx_alloc_month on allocations(allocation_month);
create index idx_alloc_resource on allocations(resource_id);
create index idx_alloc_account on allocations(account_id);
create index idx_res_geo on resources(resource_geo);
create index idx_acc_geo on accounts(geo);
