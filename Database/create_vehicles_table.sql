-- Create Vehicles Table for User Parking Management

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_number text not null,
  vehicle_type text not null check (vehicle_type in ('Car', 'Bike', 'Scooter', 'Truck', 'Auto', 'Other')),
  vehicle_brand text,
  vehicle_color text,
  is_default boolean default false,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, vehicle_number)
);

-- Create index for faster queries
create index if not exists idx_vehicles_user_id on public.vehicles(user_id);
create index if not exists idx_vehicles_vehicle_number on public.vehicles(vehicle_number);

-- Enable RLS
alter table public.vehicles enable row level security;

-- Vehicles RLS Policies
drop policy if exists "vehicles_select_own" on public.vehicles;
create policy "vehicles_select_own" on public.vehicles
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "vehicles_insert_own" on public.vehicles;
create policy "vehicles_insert_own" on public.vehicles
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "vehicles_update_own" on public.vehicles;
create policy "vehicles_update_own" on public.vehicles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "vehicles_delete_own" on public.vehicles;
create policy "vehicles_delete_own" on public.vehicles
  for delete to authenticated
  using (user_id = auth.uid());

-- Update trigger for vehicles
drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row
  execute function public.set_updated_at();

-- Grant permissions
grant all on public.vehicles to authenticated;
