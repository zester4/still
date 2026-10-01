alter table users add column if not exists email_verified_at timestamptz;
alter table users add column if not exists session_version integer not null default 0;

create table if not exists email_verification_tokens (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists email_verification_tokens_hash_idx on email_verification_tokens (token_hash);
create index if not exists email_verification_tokens_user_id_idx on email_verification_tokens (user_id);

create table if not exists conversation_summaries (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  conversation_id text not null unique references conversations (id) on delete cascade,
  summary text not null,
  highlights jsonb not null default '[]'::jsonb,
  message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversation_summaries_user_id_idx on conversation_summaries (user_id);

create table if not exists weekly_reflections (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  week_start text not null,
  summary text not null,
  highlights jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);
create index if not exists weekly_reflections_user_id_idx on weekly_reflections (user_id);
