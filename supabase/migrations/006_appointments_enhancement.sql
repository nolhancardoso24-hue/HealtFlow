-- ============================================
-- HealthFlow — Migration 006: Appointments enhancement
-- NON DESTRUCTIVE — n'altère aucune colonne existante
-- Exécuter dans Supabase SQL Editor après 001 → 005
-- ============================================

-- Nouvelles colonnes
alter table appointments
  add column if not exists appointment_type varchar,
  add column if not exists price numeric,
  add column if not exists location text,
  add column if not exists meeting_url text,
  add column if not exists recurring boolean default false,
  add column if not exists parent_appointment_id uuid,
  add column if not exists confirmed_at timestamptz,
  add column if not exists cancellation_reason text;

-- Valeur par défaut pour les lignes existantes
update appointments
set recurring = false
where recurring is null;

-- Contraintes
alter table appointments
  drop constraint if exists appointments_price_nonneg_check;
alter table appointments
  add constraint appointments_price_nonneg_check
    check (price is null or price >= 0);

alter table appointments
  drop constraint if exists appointments_parent_not_self_check;
alter table appointments
  add constraint appointments_parent_not_self_check
    check (parent_appointment_id is null or parent_appointment_id <> id);

alter table appointments
  drop constraint if exists appointments_cancellation_reason_check;
alter table appointments
  add constraint appointments_cancellation_reason_check
    check (cancellation_reason is null or status = 'cancelled');

alter table appointments
  drop constraint if exists appointments_parent_fk;
alter table appointments
  add constraint appointments_parent_fk
    foreign key (parent_appointment_id)
    references appointments(id)
    on delete set null;

-- Index
create index if not exists idx_appointments_parent
  on appointments(parent_appointment_id)
  where parent_appointment_id is not null;

create index if not exists idx_appointments_recurring
  on appointments(recurring)
  where recurring = true;

create index if not exists idx_appointments_appointment_type
  on appointments(appointment_type)
  where appointment_type is not null;

create index if not exists idx_appointments_confirmed_at
  on appointments(confirmed_at)
  where confirmed_at is not null;
