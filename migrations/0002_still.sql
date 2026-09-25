create table if not exists users (
  id text primary key,
  name text not null default '',
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists users_email_idx on users (email);

create table if not exists profiles (
  user_id text primary key references users (id) on delete cascade,
  display_name text not null default '',
  concerns jsonb not null default '[]'::jsonb,
  onboarded boolean not null default false,
  check_ins_enabled boolean not null default false,
  check_in_frequency text not null default 'few',
  last_shown_at text,
  last_answered_at text,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  started_at text not null,
  updated_at text not null,
  pulse_asked boolean not null default false
);
create index if not exists conversations_user_id_idx on conversations (user_id);

create table if not exists messages (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  conversation_id text not null references conversations (id) on delete cascade,
  role text not null,
  content text not null,
  intent text,
  crisis boolean not null default false,
  created_at text not null,
  sort_order integer not null default 0
);
create index if not exists messages_user_id_idx on messages (user_id);
create index if not exists messages_conversation_id_idx on messages (conversation_id);

create table if not exists memories (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  kind text not null,
  title text not null,
  detail text not null default '',
  source text not null default 'you',
  created_at text not null,
  updated_at text not null
);
create index if not exists memories_user_id_idx on memories (user_id);

create table if not exists letters (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  "to" text not null default '',
  body text not null default '',
  created_at text not null,
  updated_at text not null
);
create index if not exists letters_user_id_idx on letters (user_id);

create table if not exists check_in_entries (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  at text not null,
  mood text not null,
  note text not null default ''
);
create index if not exists check_in_entries_user_id_idx on check_in_entries (user_id);

create table if not exists pulses (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  conversation_id text not null,
  at text not null,
  value text not null
);
create index if not exists pulses_user_id_idx on pulses (user_id);
