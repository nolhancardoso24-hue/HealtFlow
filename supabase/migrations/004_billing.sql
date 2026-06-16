-- ============================================
-- HealthFlow — Migration 004: Billing & Trial
-- Exécuter dans Supabase SQL Editor
-- ============================================

-- Ajouter les colonnes billing à profiles
alter table profiles
  add column if not exists trial_ends_at timestamptz default (now() + interval '14 days'),
  add column if not exists subscription_status varchar(20) default 'trialing',
  add column if not exists subscription_ends_at timestamptz;

-- Contrainte sur les statuts valides
alter table profiles
  drop constraint if exists subscription_status_check;
alter table profiles
  add constraint subscription_status_check
    check (subscription_status in ('trialing', 'active', 'expired', 'cancelled'));

-- Mettre à jour le trigger handle_new_user pour initialiser le trial
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    user_id,
    first_name,
    last_name,
    specialty,
    trial_ends_at,
    subscription_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', 'Praticien'),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'specialty', 'Autre'),
    now() + interval '14 days',
    'trialing'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Initialiser les utilisateurs existants qui n'ont pas encore trial_ends_at
update profiles
set
  trial_ends_at = coalesce(trial_ends_at, created_at + interval '14 days'),
  subscription_status = coalesce(subscription_status, 'trialing')
where trial_ends_at is null or subscription_status is null;

-- Index pour les vérifications de statut
create index if not exists idx_profiles_subscription on profiles(subscription_status);
create index if not exists idx_profiles_trial_ends on profiles(trial_ends_at);
