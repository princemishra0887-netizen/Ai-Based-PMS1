-- Land Owner Parking System Schema

-- Spots Table (Parking spaces created by land owners)
create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Open Air', 'Covered', 'Basement', 'Street', 'Mall')),
  description text,
  address text not null,
  city text,
  state text,
  pincode text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  price_hour numeric(10, 2),
  price_day numeric(10, 2),
  status text not null default 'active' check (status in ('active', 'inactive', 'paused')),
  total_slots integer default 1,
  available_slots integer default 1,
  time_from time default '08:00:00',
  time_to time default '20:00:00',
  amenities text[] default '{}',
  photo_url text,
  rating numeric(3, 1) default 0,
  total_bookings integer default 0,
  total_revenue numeric(12, 2) default 0,
  availability jsonb default '{"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":false,"sun":false}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bookings Table (Parking requests and confirmations)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_number text not null,
  vehicle_type text not null check (vehicle_type in ('Car', 'Bike', 'Scooter', 'Truck', 'Auto', 'Other')),
  vehicle_brand text,
  vehicle_color text,
  user_name text not null,
  user_phone text,
  booking_date date not null,
  start_time time,
  end_time time,
  duration_hours integer,
  booking_type text not null default 'hourly' check (booking_type in ('hourly', 'daily', 'weekly', 'monthly')),
  amount numeric(10, 2),
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'cancelled', 'no-show')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Spot Reviews Table
create table if not exists public.spot_reviews (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  rating integer check (rating >= 1 and rating <= 5),
  review_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for better query performance
create index if not exists idx_spots_owner_id on public.spots(owner_id);
create index if not exists idx_spots_city on public.spots(city);
create index if not exists idx_spots_status on public.spots(status);
create index if not exists idx_bookings_owner_id on public.bookings(owner_id);
create index if not exists idx_bookings_user_id on public.bookings(user_id);
create index if not exists idx_bookings_spot_id on public.bookings(spot_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_booking_date on public.bookings(booking_date);
create index if not exists idx_spot_reviews_spot_id on public.spot_reviews(spot_id);

-- Enable RLS
alter table public.spots enable row level security;
alter table public.bookings enable row level security;
alter table public.spot_reviews enable row level security;

-- Spots RLS Policies
drop policy if exists "spots_select_public" on public.spots;
create policy "spots_select_public" on public.spots
  for select to public
  using (status = 'active');

drop policy if exists "spots_select_owner" on public.spots;
create policy "spots_select_owner" on public.spots
  for select to authenticated
  using (owner_id = auth.uid() or status = 'active');

drop policy if exists "spots_insert_owner" on public.spots;
create policy "spots_insert_owner" on public.spots
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "spots_update_owner" on public.spots;
create policy "spots_update_owner" on public.spots
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "spots_delete_owner" on public.spots;
create policy "spots_delete_owner" on public.spots
  for delete to authenticated
  using (owner_id = auth.uid());

-- Bookings RLS Policies
drop policy if exists "bookings_select_user" on public.bookings;
create policy "bookings_select_user" on public.bookings
  for select to authenticated
  using (user_id = auth.uid() or owner_id = auth.uid());

drop policy if exists "bookings_insert_user" on public.bookings;
create policy "bookings_insert_user" on public.bookings
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "bookings_update_user" on public.bookings;
create policy "bookings_update_user" on public.bookings
  for update to authenticated
  using (user_id = auth.uid() or owner_id = auth.uid())
  with check (user_id = auth.uid() or owner_id = auth.uid());

drop policy if exists "bookings_delete_owner" on public.bookings;
create policy "bookings_delete_owner" on public.bookings
  for delete to authenticated
  using (owner_id = auth.uid());

-- Spot Reviews RLS Policies
drop policy if exists "reviews_select_all" on public.spot_reviews;
create policy "reviews_select_all" on public.spot_reviews
  for select to public
  using (true);

drop policy if exists "reviews_insert_user" on public.spot_reviews;
create policy "reviews_insert_user" on public.spot_reviews
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "reviews_update_user" on public.spot_reviews;
create policy "reviews_update_user" on public.spot_reviews
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Update trigger for spots
drop trigger if exists spots_set_updated_at on public.spots;
create trigger spots_set_updated_at
  before update on public.spots
  for each row
  execute function public.set_updated_at();

-- Update trigger for bookings
drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row
  execute function public.set_updated_at();

-- Update trigger for reviews
drop trigger if exists reviews_set_updated_at on public.spot_reviews;
create trigger reviews_set_updated_at
  before update on public.spot_reviews
  for each row
  execute function public.set_updated_at();

-- Grant permissions
grant all on public.spots to authenticated;
grant all on public.bookings to authenticated;
grant all on public.spot_reviews to authenticated;
grant select on public.spots to anon;
grant select on public.spot_reviews to anon;
