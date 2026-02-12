-- Affiliate System Schema

-- 1. Affiliates Table
create table if not exists public.affiliates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  referral_code text unique not null,
  stripe_account_id text,
  status text default 'active' check (status in ('active', 'pending', 'suspended')),
  created_at timestamptz default now(),
  constraint unique_user_affiliate unique(user_id)
);

-- 2. Referrals Table
create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references public.affiliates(id) not null,
  referred_user_id uuid references auth.users(id) not null,
  status text default 'pending' check (status in ('pending', 'completed', 'paid_out')),
  commission_amount numeric default 0,
  created_at timestamptz default now()
);

-- 3. RLS Policies
alter table public.affiliates enable row level security;
alter table public.referrals enable row level security;

-- Policies for Affiliates
create policy "Users can view their own affiliate record" on public.affiliates
  for select using (auth.uid() = user_id);

create policy "Service Role can manage affiliates" on public.affiliates
  for all using (true);

-- Policies for Referrals
create policy "Affiliates can view their own referrals" on public.referrals
  for select using (
    exists (
      select 1 from public.affiliates
      where affiliates.id = referrals.referrer_id
      and affiliates.user_id = auth.uid()
    )
  );

create policy "Service Role can manage referrals" on public.referrals
  for all using (true);

-- Indexes
create index if not exists idx_affiliates_referral_code on public.affiliates(referral_code);
create index if not exists idx_referrals_referrer_id on public.referrals(referrer_id);
create index if not exists idx_referrals_referred_user_id on public.referrals(referred_user_id);
