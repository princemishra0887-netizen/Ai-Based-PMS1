create extension if not exists "pgcrypto";

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    first_name,
    last_name,
    gender,
    dob,
    phone,
    email,
    address,
    city,
    state,
    pincode,
    role,
    photo_url,
    aadhaar_url
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'gender',
    nullif(new.raw_user_meta_data ->> 'dob', '')::date,
    new.raw_user_meta_data ->> 'phone',
    new.email,
    new.raw_user_meta_data ->> 'address',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'state',
    new.raw_user_meta_data ->> 'pincode',
    coalesce(new.raw_user_meta_data ->> 'role', 'user'),
    new.raw_user_meta_data ->> 'photo_url',
    new.raw_user_meta_data ->> 'aadhaar_url'
  )
  on conflict (id) do update
  set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    gender = excluded.gender,
    dob = excluded.dob,
    phone = excluded.phone,
    email = excluded.email,
    address = excluded.address,
    city = excluded.city,
    state = excluded.state,
    pincode = excluded.pincode,
    role = excluded.role,
    photo_url = excluded.photo_url,
    aadhaar_url = excluded.aadhaar_url,
    updated_at = now();

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  gender text,
  dob date,
  phone text,
  email text,
  address text,
  city text,
  state text,
  pincode text,
  role text not null default 'user' check (role in ('user', 'landOwner')),
  aadhaar_url text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text,
  address text,
  price_hour numeric(10,2) default 0,
  price_day numeric(10,2) default 0,
  status text default 'active',
  availability jsonb default '{}'::jsonb,
  time_from text,
  time_to text,
  amenities text[] default '{}',
  photo text,
  slots integer default 1,
  rating numeric(3,1) default 0,
  reviews integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_id text default encode(gen_random_bytes(5), 'hex'),
  user_id uuid not null references public.profiles(id) on delete cascade,
  spot_id uuid references public.spots(id) on delete set null,
  spot_name text,
  spot_address text,
  vehicle_number text,
  amount numeric(10,2) default 0,
  booking_type text default 'hourly',
  type text,
  status text default 'active',
  time text,
  date date default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  number text not null,
  type text default 'Car',
  model text,
  color text,
  is_primary boolean default false,
  status text default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.spots enable row level security;
alter table public.bookings enable row level security;
alter table public.vehicles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "spots_select_all" on public.spots;
create policy "spots_select_all"
on public.spots
for select
to authenticated
using (true);

drop policy if exists "spots_insert_own" on public.spots;
create policy "spots_insert_own"
on public.spots
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "spots_update_own" on public.spots;
create policy "spots_update_own"
on public.spots
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "spots_delete_own" on public.spots;
create policy "spots_delete_own"
on public.spots
for delete
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own"
on public.bookings
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.spots s
    where s.id = bookings.spot_id
      and s.owner_id = auth.uid()
  )
);

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own"
on public.bookings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "vehicles_select_own" on public.vehicles;
create policy "vehicles_select_own"
on public.vehicles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "vehicles_insert_own" on public.vehicles;
create policy "vehicles_insert_own"
on public.vehicles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "vehicles_update_own" on public.vehicles;
create policy "vehicles_update_own"
on public.vehicles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "vehicles_delete_own" on public.vehicles;
create policy "vehicles_delete_own"
on public.vehicles
for delete
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('user-documents', 'user-documents', true)
on conflict (id) do nothing;

drop policy if exists "storage_public_read_user_documents" on storage.objects;
create policy "storage_public_read_user_documents"
on storage.objects
for select
to public
using (bucket_id = 'user-documents');

drop policy if exists "storage_insert_user_documents" on storage.objects;
create policy "storage_insert_user_documents"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'user-documents');

drop policy if exists "storage_update_user_documents" on storage.objects;
create policy "storage_update_user_documents"
on storage.objects
for update
to authenticated
using (bucket_id = 'user-documents')
with check (bucket_id = 'user-documents');
