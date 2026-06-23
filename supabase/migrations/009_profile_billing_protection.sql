-- ============================================
-- HealthFlow — Migration 009: Protection billing profiles
-- Empêche la modification client des champs d'abonnement
-- Modifiables uniquement via service_role ou rôles privilégiés (handle_new_user)
-- Dépend de : 004_billing.sql, 007_complete_rls.sql
-- ============================================

-- ---------------------------------------------------------------------------
-- Vérifie si le contexte courant peut modifier les champs billing
-- (service_role Supabase, ou fonctions SECURITY DEFINER système)
-- ---------------------------------------------------------------------------
create or replace function public.can_modify_profile_billing()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(auth.role(), '') = 'service_role'
    or current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin');
$$;

comment on function public.can_modify_profile_billing() is
  'True si la session peut modifier subscription_* / trial_* sur profiles.';

-- ---------------------------------------------------------------------------
-- Helper RLS : les champs billing de la ligne NEW sont identiques à la DB
-- ---------------------------------------------------------------------------
create or replace function public.profile_billing_fields_unchanged(
  p_profile_id uuid,
  p_subscription_status varchar,
  p_subscription_plan varchar,
  p_trial_ends_at timestamptz,
  p_subscription_ends_at timestamptz
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.subscription_status is not distinct from p_subscription_status
      and p.subscription_plan is not distinct from p_subscription_plan
      and p.trial_ends_at is not distinct from p_trial_ends_at
      and p.subscription_ends_at is not distinct from p_subscription_ends_at
  );
$$;

comment on function public.profile_billing_fields_unchanged(uuid, varchar, varchar, timestamptz, timestamptz) is
  'Compare les champs billing proposés avec les valeurs actuelles en base (policy UPDATE).';

-- ---------------------------------------------------------------------------
-- Trigger : verrouille billing pour les sessions authentifiées (JWT utilisateur)
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_billing_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.can_modify_profile_billing() then
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    -- Création profil côté client : valeurs billing imposées par le serveur
    NEW.subscription_status := 'trialing';
    NEW.subscription_plan := 'free';
    NEW.trial_ends_at := now() + interval '14 days';
    NEW.subscription_ends_at := null;
    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    -- Mise à jour profil côté client : champs billing figés
    NEW.subscription_status := OLD.subscription_status;
    NEW.subscription_plan := OLD.subscription_plan;
    NEW.trial_ends_at := OLD.trial_ends_at;
    NEW.subscription_ends_at := OLD.subscription_ends_at;
    return NEW;
  end if;

  return NEW;
end;
$$;

drop trigger if exists protect_profile_billing_fields on public.profiles;
create trigger protect_profile_billing_fields
  before insert or update on public.profiles
  for each row
  execute function public.protect_profile_billing_fields();

-- ---------------------------------------------------------------------------
-- RLS profiles : INSERT / UPDATE avec garde-fous billing
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

-- INSERT : l'utilisateur ne peut pas s'inscrire avec un abonnement actif
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (
    auth.uid() = user_id
    and coalesce(subscription_status, 'trialing') = 'trialing'
    and coalesce(subscription_plan, 'free') = 'free'
    and subscription_ends_at is null
  );

-- UPDATE : autres champs libres, billing inchangé (double contrôle avec le trigger)
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.profile_billing_fields_unchanged(
      id,
      subscription_status,
      subscription_plan,
      trial_ends_at,
      subscription_ends_at
    )
  );
