create table if not exists users (
  id uuid primary key,
  username text unique not null,
  password_hash text not null,
  role text not null default 'user',
  created_at timestamptz not null default now()
);
create table if not exists games (
  id uuid primary key,
  external_id text,
  team_home text not null,
  team_away text not null,
  starts_at timestamptz not null,
  stage text not null,
  group_name text,
  score_home int,
  score_away int,
  status text not null default 'scheduled',
  live_minute int,
  last_live_sync_at timestamptz
);
create table if not exists guesses (
  id uuid primary key,
  user_id uuid not null references users(id),
  game_id uuid not null references games(id),
  guess_home int not null,
  guess_away int not null,
  points int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, game_id)
);
create table if not exists groups (
  id uuid primary key,
  name text not null,
  description text,
  owner_user_id uuid not null references users(id),
  invite_code text unique not null,
  created_at timestamptz not null default now()
);
create table if not exists group_members (
  id uuid primary key,
  group_id uuid not null references groups(id),
  user_id uuid not null references users(id),
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique(group_id, user_id)
);


