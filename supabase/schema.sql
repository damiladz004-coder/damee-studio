create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'user');
create type public.publish_status as enum ('draft', 'published', 'featured');
create type public.content_type as enum ('comic', 'animation', 'game');
create type public.transaction_type as enum (
  'purchase',
  'referral_commission',
  'reward',
  'withdrawal',
  'locked_transfer',
  'unlock_transfer'
);
create type public.transaction_status as enum ('pending', 'completed', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  referral_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  referral_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  thumbnail_url text,
  media_url text,
  status public.publish_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comic_issues (
  id uuid primary key default gen_random_uuid(),
  comic_id uuid not null references public.comics(id) on delete cascade,
  title text not null,
  slug text not null unique,
  issue_number integer not null,
  summary text,
  price_naira integer not null default 0 check (price_naira >= 0),
  status public.publish_status not null default 'draft',
  release_date timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (comic_id, issue_number)
);

create table public.comic_pages (
  id uuid primary key default gen_random_uuid(),
  comic_id uuid not null references public.comics(id) on delete cascade,
  comic_issue_id uuid references public.comic_issues(id) on delete cascade,
  page_number integer not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  unique (comic_id, page_number),
  unique (comic_issue_id, page_number)
);

create table public.animations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  thumbnail_url text,
  media_url text,
  status public.publish_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  thumbnail_url text,
  media_url text,
  status public.publish_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_id uuid not null,
  content_type public.content_type not null,
  body text not null check (char_length(body) <= 1200),
  created_at timestamptz not null default now()
);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_id uuid not null,
  content_type public.content_type not null,
  created_at timestamptz not null default now(),
  unique (user_id, content_id, content_type)
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid references public.profiles(id) on delete set null,
  referral_code text not null,
  created_at timestamptz not null default now(),
  unique (referred_user_id)
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  available_balance integer not null default 0 check (available_balance >= 0),
  locked_balance integer not null default 0 check (locked_balance >= 0),
  lifetime_earnings integer not null default 0 check (lifetime_earnings >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  comic_issue_id uuid not null references public.comic_issues(id) on delete cascade,
  amount_naira integer not null check (amount_naira >= 0),
  payment_reference text,
  created_at timestamptz not null default now(),
  unique (user_id, comic_issue_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  purchase_id uuid references public.purchases(id) on delete set null,
  transaction_type public.transaction_type not null,
  transaction_status public.transaction_status not null default 'completed',
  amount_naira integer not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  comic_issue_id uuid not null references public.comic_issues(id) on delete cascade,
  game_slug text not null,
  score integer not null default 0 check (score >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, comic_issue_id, game_slug)
);

create table public.leaderboards (
  id uuid primary key default gen_random_uuid(),
  comic_issue_id uuid not null references public.comic_issues(id) on delete cascade,
  game_slug text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rank integer not null check (rank > 0),
  score integer not null default 0 check (score >= 0),
  reward_amount_naira integer not null default 0 check (reward_amount_naira >= 0),
  reward_settled_at timestamptz,
  reward_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (comic_issue_id, game_slug, user_id),
  unique (comic_issue_id, game_slug, rank)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_referral_code text;
  matched_referrer_id uuid;
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1),
    split_part(new.email, '@', 1)
  );

  insert into public.wallets (user_id)
  values (new.id);

  normalized_referral_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'referral_code', '')));

  if normalized_referral_code <> '' then
    select id
    into matched_referrer_id
    from public.profiles
    where referral_code = normalized_referral_code
    limit 1;

    if matched_referrer_id is not null and matched_referrer_id <> new.id then
      insert into public.referrals (referrer_id, referred_user_id, referral_code)
      values (matched_referrer_id, new.id, normalized_referral_code)
      on conflict (referred_user_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.increment_referral_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set referral_count = referral_count + 1
  where id = new.referrer_id;
  return new;
end;
$$;

create trigger on_referral_created
after insert on public.referrals
for each row execute procedure public.increment_referral_count();

alter table public.profiles enable row level security;
alter table public.comics enable row level security;
alter table public.comic_issues enable row level security;
alter table public.comic_pages enable row level security;
alter table public.animations enable row level security;
alter table public.games enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.referrals enable row level security;
alter table public.wallets enable row level security;
alter table public.purchases enable row level security;
alter table public.transactions enable row level security;
alter table public.game_scores enable row level security;
alter table public.leaderboards enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id);

create policy "Published comics are public" on public.comics for select using (status <> 'draft');
create policy "Published comic issues are public" on public.comic_issues for select using (status <> 'draft');
create policy "Published comic pages are public" on public.comic_pages for select using (true);
create policy "Published animations are public" on public.animations for select using (status <> 'draft');
create policy "Published games are public" on public.games for select using (status <> 'draft');

create policy "Comments are public" on public.comments for select using (true);
create policy "Authenticated users comment" on public.comments for insert with check (auth.uid() = user_id);
create policy "Likes are public" on public.likes for select using (true);
create policy "Authenticated users like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users view related referrals" on public.referrals for select using (auth.uid() = referrer_id or auth.uid() = referred_user_id);
create policy "Users view own wallet" on public.wallets for select using (auth.uid() = user_id);
create policy "Users view own purchases" on public.purchases for select using (auth.uid() = user_id);
create policy "Users view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Scores are public" on public.game_scores for select using (true);
create policy "Authenticated users submit scores" on public.game_scores for insert with check (auth.uid() = user_id);
create policy "Authenticated users update scores" on public.game_scores for update using (auth.uid() = user_id);
create policy "Leaderboards are public" on public.leaderboards for select using (true);

insert into storage.buckets (id, name, public)
values
  ('comics', 'comics', true),
  ('comic-pages', 'comic-pages', true),
  ('videos', 'videos', true),
  ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

create policy "Public storage reads" on storage.objects for select using (bucket_id in ('comics', 'comic-pages', 'videos', 'thumbnails'));
