-- ============================================
-- HealthFlow — Migration 002: Triggers & Fonctions
-- ============================================

-- ============================================
-- FONCTION: updated_at automatique
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Appliquer sur toutes les tables concernées
drop trigger if exists set_profiles_updated_at on profiles;
create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

drop trigger if exists set_patients_updated_at on patients;
create trigger set_patients_updated_at
  before update on patients
  for each row execute function update_updated_at_column();

drop trigger if exists set_appointments_updated_at on appointments;
create trigger set_appointments_updated_at
  before update on appointments
  for each row execute function update_updated_at_column();

-- ============================================
-- FONCTION: Créer profil automatiquement après signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, first_name, last_name, specialty)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', 'Praticien'),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'specialty', 'Autre')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- FONCTION: Calcul âge patient
-- ============================================
create or replace function calculate_age(dob date)
returns int as $$
begin
  return extract(year from age(dob))::int;
end;
$$ language plpgsql immutable;

-- ============================================
-- FONCTION: Mise à jour compteur séances patient
-- ============================================
create or replace function update_patient_on_appointment_complete()
returns trigger as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    update patients
    set
      total_appointments = total_appointments + 1,
      last_appointment_date = new.date_time::date,
      updated_at = now()
    where id = new.patient_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_appointment_completed on appointments;
create trigger on_appointment_completed
  after update on appointments
  for each row execute function update_patient_on_appointment_complete();

-- ============================================
-- FONCTION: Créer notification automatique
-- (risque patient élevé)
-- ============================================
create or replace function notify_high_risk_patient()
returns trigger as $$
declare
  pract_id uuid;
begin
  -- Récupérer le practitioner
  select practitioner_id into pract_id from patients where id = new.id;

  if new.risk_score >= 60 and (old.risk_score < 60 or old.risk_score is null) then
    insert into notifications (practitioner_id, type, title, message, link, entity_id, entity_type)
    values (
      pract_id,
      'risk',
      'Patient à risque détecté',
      new.first_name || ' ' || new.last_name || ' a un score de risque de ' || new.risk_score || '/100',
      '/patients/' || new.id,
      new.id,
      'patient'
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_patient_risk_updated on patients;
create trigger on_patient_risk_updated
  after update of risk_score on patients
  for each row execute function notify_high_risk_patient();

-- ============================================
-- FONCTION: Générer token questionnaire
-- ============================================
create or replace function generate_questionnaire_token()
returns text as $$
declare
  token text;
begin
  token := encode(gen_random_bytes(32), 'hex');
  return token;
end;
$$ language plpgsql;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- PROFILES
alter table profiles enable row level security;
drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;

create policy "profiles_select_own" on profiles for select using (auth.uid() = user_id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = user_id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = user_id);

-- PATIENTS
alter table patients enable row level security;
drop policy if exists "patients_all_own" on patients;

create policy "patients_all_own" on patients for all
  using (practitioner_id in (select id from profiles where user_id = auth.uid()));

-- APPOINTMENTS
alter table appointments enable row level security;
drop policy if exists "appointments_all_own" on appointments;

create policy "appointments_all_own" on appointments for all
  using (practitioner_id in (select id from profiles where user_id = auth.uid()));

-- QUESTIONNAIRES
alter table questionnaires enable row level security;
drop policy if exists "questionnaires_select_own" on questionnaires;

create policy "questionnaires_select_own" on questionnaires for select
  using (patient_id in (
    select id from patients where practitioner_id in (
      select id from profiles where user_id = auth.uid()
    )
  ));

-- MESSAGES
alter table messages enable row level security;
drop policy if exists "messages_all_own" on messages;

create policy "messages_all_own" on messages for all
  using (practitioner_id in (select id from profiles where user_id = auth.uid()));

-- DOCUMENTS
alter table documents enable row level security;
drop policy if exists "documents_all_own" on documents;

create policy "documents_all_own" on documents for all
  using (practitioner_id in (select id from profiles where user_id = auth.uid()));

-- NOTIFICATIONS
alter table notifications enable row level security;
drop policy if exists "notifications_all_own" on notifications;

create policy "notifications_all_own" on notifications for all
  using (practitioner_id in (select id from profiles where user_id = auth.uid()));

-- AUDIT LOGS
alter table audit_logs enable row level security;
drop policy if exists "audit_select_own" on audit_logs;

create policy "audit_select_own" on audit_logs for select
  using (practitioner_id in (select id from profiles where user_id = auth.uid()));

-- ============================================
-- VUES UTILES
-- ============================================

create or replace view dashboard_stats_today as
select
  p.id as practitioner_id,
  count(distinct a.id) filter (where date(a.date_time at time zone 'Europe/Paris') = current_date) as appointments_today,
  count(distinct a.id) filter (where a.status = 'completed' and date(a.date_time at time zone 'Europe/Paris') = current_date) as completed_today,
  count(distinct a.id) filter (where a.status = 'no-show' and date(a.date_time at time zone 'Europe/Paris') = current_date) as no_shows_today
from profiles p
left join appointments a on p.id = a.practitioner_id
group by p.id;
