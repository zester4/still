alter table profiles add column if not exists memory_enabled boolean not null default true;
alter table profiles add column if not exists notifications_enabled boolean not null default false;
alter table profiles add column if not exists email_notifications_enabled boolean not null default false;
alter table profiles add column if not exists timezone text not null default 'UTC';
alter table profiles add column if not exists check_in_time text not null default '20:00';
alter table profiles add column if not exists quiet_hours_start text not null default '22:00';
alter table profiles add column if not exists quiet_hours_end text not null default '08:00';

create table if not exists notifications (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text not null default '/talk',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on notifications (user_id);

create table if not exists check_in_schedules (
  id text primary key,
  user_id text not null unique references users (id) on delete cascade,
  qstash_schedule_id text,
  frequency text not null default 'few',
  enabled boolean not null default false,
  timezone text not null default 'UTC',
  check_in_time text not null default '20:00',
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists check_in_schedules_user_id_idx on check_in_schedules (user_id);
