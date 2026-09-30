create table if not exists password_reset_tokens (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists password_reset_tokens_hash_idx on password_reset_tokens (token_hash);
create index if not exists password_reset_tokens_user_id_idx on password_reset_tokens (user_id);
