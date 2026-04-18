create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'user');
create type public.publish_status as enum ('draft', 'published', 'featured');
create type public.content_type as enum ('comic', 'animation', 'game');

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

create table public.comic_pages (
  id uuid primary key default gen_random_uuid(),
  comic_id uuid not null references public.comics(id) on delete cascade,
  page_number integer not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  unique (comic_id, page_number)
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
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1),
    split_part(new.email, '@', 1)
  );
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
alter table public.comic_pages enable row level security;
alter table public.animations enable row level security;
alter table public.games enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.referrals enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id);

create policy "Published comics are public" on public.comics for select using (status <> 'draft');
create policy "Published comic pages are public" on public.comic_pages for select using (true);
create policy "Published animations are public" on public.animations for select using (status <> 'draft');
create policy "Published games are public" on public.games for select using (status <> 'draft');

create policy "Comments are public" on public.comments for select using (true);
create policy "Authenticated users comment" on public.comments for insert with check (auth.uid() = user_id);
create policy "Likes are public" on public.likes for select using (true);
create policy "Authenticated users like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users view related referrals" on public.referrals for select using (auth.uid() = referrer_id or auth.uid() = referred_user_id);

insert into storage.buckets (id, name, public)
values
  ('comics', 'comics', true),
  ('videos', 'videos', true),
  ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

create policy "Public storage reads" on storage.objects for select using (bucket_id in ('comics', 'videos', 'thumbnails'));
