
-- Migration: Create Parental Control Tables
-- Description: Creates tables for network settings, time limits, and usage logs
-- Date: 2024

-- ============================================
-- 1. Create network_settings table
-- ============================================
create table if not exists network_settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  ssid text not null,
  password text not null,
  security_type text not null check (security_type in ('WPA2', 'WPA3', 'WEP', 'Open')),
  is_connected boolean default false,
  last_connected timestamp with time zone,
  signal_strength integer,
  user_id uuid references auth.users(id) on delete cascade
);

-- Enable RLS on network_settings
alter table network_settings enable row level security;

-- Create RLS policies for network_settings
create policy "Users can view their own network settings"
  on network_settings for select
  using (user_id = auth.uid() or user_id is null);

create policy "Users can insert their own network settings"
  on network_settings for insert
  with check (user_id = auth.uid() or user_id is null);

create policy "Users can update their own network settings"
  on network_settings for update
  using (user_id = auth.uid() or user_id is null);

create policy "Users can delete their own network settings"
  on network_settings for delete
  using (user_id = auth.uid() or user_id is null);

-- Create index for faster queries
create index if not exists network_settings_user_id_idx on network_settings(user_id);
create index if not exists network_settings_ssid_idx on network_settings(ssid);

-- ============================================
-- 2. Create time_limits table
-- ============================================
create table if not exists time_limits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  profile_name text not null,
  enabled boolean default true,
  daily_limit integer not null check (daily_limit > 0),
  schedule_start text not null,
  schedule_end text not null,
  days text[] not null,
  user_id uuid references auth.users(id) on delete cascade
);

-- Enable RLS on time_limits
alter table time_limits enable row level security;

-- Create RLS policies for time_limits
create policy "Users can view their own time limits"
  on time_limits for select
  using (user_id = auth.uid() or user_id is null);

create policy "Users can insert their own time limits"
  on time_limits for insert
  with check (user_id = auth.uid() or user_id is null);

create policy "Users can update their own time limits"
  on time_limits for update
  using (user_id = auth.uid() or user_id is null);

create policy "Users can delete their own time limits"
  on time_limits for delete
  using (user_id = auth.uid() or user_id is null);

-- Create index for faster queries
create index if not exists time_limits_user_id_idx on time_limits(user_id);
create index if not exists time_limits_profile_name_idx on time_limits(profile_name);

-- ============================================
-- 3. Create usage_logs table
-- ============================================
create table if not exists usage_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  time_limit_id uuid not null references time_limits(id) on delete cascade,
  date date not null,
  hours_used numeric(5,2) not null default 0 check (hours_used >= 0),
  user_id uuid references auth.users(id) on delete cascade,
  unique(time_limit_id, date)
);

-- Enable RLS on usage_logs
alter table usage_logs enable row level security;

-- Create RLS policies for usage_logs
create policy "Users can view their own usage logs"
  on usage_logs for select
  using (user_id = auth.uid() or user_id is null);

create policy "Users can insert their own usage logs"
  on usage_logs for insert
  with check (user_id = auth.uid() or user_id is null);

create policy "Users can update their own usage logs"
  on usage_logs for update
  using (user_id = auth.uid() or user_id is null);

create policy "Users can delete their own usage logs"
  on usage_logs for delete
  using (user_id = auth.uid() or user_id is null);

-- Create indexes for faster queries
create index if not exists usage_logs_user_id_idx on usage_logs(user_id);
create index if not exists usage_logs_time_limit_id_idx on usage_logs(time_limit_id);
create index if not exists usage_logs_date_idx on usage_logs(date);

-- ============================================
-- 4. Create updated_at trigger function
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_network_settings_updated_at
  before update on network_settings
  for each row
  execute function update_updated_at_column();

create trigger update_time_limits_updated_at
  before update on time_limits
  for each row
  execute function update_updated_at_column();

-- ============================================
-- 5. Insert sample data (optional)
-- ============================================
-- Uncomment the following lines to insert sample data

-- insert into network_settings (ssid, password, security_type, is_connected, signal_strength) values
--   ('Home WiFi', 'password123', 'WPA2', true, 85),
--   ('Guest Network', 'guest123', 'WPA2', false, 60);

-- insert into time_limits (profile_name, enabled, daily_limit, schedule_start, schedule_end, days) values
--   ('أحمد', true, 3, '08:00', '21:00', ARRAY['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الأحد']),
--   ('سارة', true, 2, '09:00', '20:00', ARRAY['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الأحد']),
--   ('محمد', false, 4, '10:00', '22:00', ARRAY['السبت', 'الجمعة']);

-- ============================================
-- Migration Complete
-- ============================================
-- All tables created successfully with RLS policies enabled
-- Run this SQL in your Supabase SQL Editor to create the tables
