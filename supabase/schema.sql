-- HealthFlow Database Schema (Supabase PostgreSQL)
-- Exécuter dans Supabase SQL Editor

-- ============================================
-- 1. ENABLE EXTENSIONS
-- ============================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================
-- 2. PROFILES (Praticiens)
-- ============================================
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  
  -- Infos personnelles
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  phone varchar(20),
  
  -- Infos cabinet
  specialty varchar(50) not null, -- Médecin, Kiné, Ostéopathe, etc
  cabinet_name varchar(200),
  
  -- Horaires
  hours_start time,
  hours_end time,
  days_closed int[] default '{6,7}', -- 0=lun, 6=sam, 7=dim
  session_duration_minutes int default 45,
  
  -- Préférences
  language varchar(5) default 'fr', -- fr, en
  timezone varchar(50) default 'Europe/Paris',
  email_reminders boolean default true,
  sms_reminders boolean default false,
  
  -- Souscription (pour plus tard)
  subscription_plan varchar(20) default 'free', -- free, starter, pro
  onboarding_completed boolean default false,
  
  created_at timestamp default now(),
  updated_at timestamp default now(),
  
  constraint specialty_check check (specialty in ('Médecin', 'Kiné', 'Ostéopathe', 'Masseuse', 'Nutritionniste', 'Coach', 'Autre'))
);

-- Index
create index idx_profiles_user_id on profiles(user_id);
create index idx_profiles_specialty on profiles(specialty);

-- ============================================
-- 3. PATIENTS
-- ============================================
create table patients (
  id uuid primary key default uuid_generate_v4(),
  practitioner_id uuid not null references profiles(id) on delete cascade,
  
  -- Infos personnelles
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  date_of_birth date not null,
  email varchar(255),
  phone varchar(20),
  
  -- Infos cliniques
  chief_complaint varchar(500) not null, -- Motif principal
  medical_history text, -- Antécédents
  contraindications text,
  allergies text,
  
  -- Segmentation auto
  tags text[] default '{}', -- sportif, senior, télétravail, etc
  age_group varchar(20), -- jeune, adulte, senior (calculé)
  
  -- Engagement & statut
  status varchar(20) default 'active', -- active, inactive, archived
  total_appointments int default 0,
  last_appointment_date date,
  
  -- Risque abandon (0-100)
  risk_score int default 0,
  risk_level varchar(20) default 'low', -- low, medium, high, critical
  
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Index
create index idx_patients_practitioner on patients(practitioner_id);
create index idx_patients_status on patients(status);
create index idx_patients_tags on patients using gin(tags);
create index idx_patients_risk on patients(risk_score);

-- ============================================
-- 4. APPOINTMENTS (Rendez-vous)
-- ============================================
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  practitioner_id uuid not null references profiles(id) on delete cascade,
  
  -- Détails RDV
  date_time timestamp not null,
  duration_minutes int default 45,
  reason varchar(500),
  notes text, -- Notes post-séance
  
  -- Statut
  status varchar(20) default 'scheduled', -- scheduled, completed, cancelled, no-show
  is_absent boolean default false,
  
  -- Rappels
  reminder_sent boolean default false,
  reminder_sent_at timestamp,
  
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Index
create index idx_appointments_patient on appointments(patient_id);
create index idx_appointments_practitioner on appointments(practitioner_id);
create index idx_appointments_date on appointments(date_time);
create index idx_appointments_status on appointments(status);

-- ============================================
-- 5. QUESTIONNAIRES (Post-séance)
-- ============================================
create table questionnaires (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null unique references appointments(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  
  -- Réponses
  relief_level int, -- 1-10 soulagement
  side_effects boolean,
  side_effects_description text,
  current_pain int, -- 0-10
  exercises_done varchar(20), -- yes, partial, no
  comments text,
  
  -- Données progr ès
  mobility_score int, -- 0-100
  sleep_quality int, -- 0-10
  activity_level varchar(20), -- sedentary, moderate, intense
  
  -- Timestamps
  created_at timestamp default now(),
  submitted_at timestamp,
  
  constraint relief_check check (relief_level between 1 and 10),
  constraint pain_check check (current_pain between 0 and 10),
  constraint mobility_check check (mobility_score between 0 and 100),
  constraint sleep_check check (sleep_quality between 0 and 10)
);

-- Index
create index idx_questionnaires_appointment on questionnaires(appointment_id);
create index idx_questionnaires_patient on questionnaires(patient_id);
create index idx_questionnaires_submitted on questionnaires(submitted_at);

-- ============================================
-- 6. QUESTIONNAIRE TOKENS (URLs publiques sécurisées)
-- ============================================
create table questionnaire_tokens (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null unique references appointments(id) on delete cascade,
  token varchar(255) not null unique,
  
  -- Expiration
  created_at timestamp default now(),
  expires_at timestamp default now() + interval '7 days',
  used_at timestamp,
  
  constraint token_length check (length(token) >= 32)
);

-- Index
create index idx_questionnaire_tokens_token on questionnaire_tokens(token);
create index idx_questionnaire_tokens_expires on questionnaire_tokens(expires_at);

-- ============================================
-- 7. MESSAGES (Communication centralisée)
-- ============================================
create table messages (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  practitioner_id uuid not null references profiles(id) on delete cascade,
  
  -- Message
  content text not null,
  sender_type varchar(20) not null, -- 'practitioner', 'patient'
  is_read boolean default false,
  read_at timestamp,
  
  created_at timestamp default now()
);

-- Index
create index idx_messages_patient on messages(patient_id);
create index idx_messages_practitioner on messages(practitioner_id);
create index idx_messages_created on messages(created_at);
create index idx_messages_read on messages(is_read);

-- ============================================
-- 8. ANALYTICS (Dashboard stats)
-- ============================================
create table analytics (
  id uuid primary key default uuid_generate_v4(),
  practitioner_id uuid not null references profiles(id) on delete cascade,
  
  -- Stats
  date date not null default current_date,
  total_appointments int default 0,
  completed_appointments int default 0,
  no_show_count int default 0,
  questionnaire_responses int default 0,
  questionnaire_response_rate numeric default 0.0,
  
  created_at timestamp default now(),
  updated_at timestamp default now(),
  
  unique(practitioner_id, date)
);

-- Index
create index idx_analytics_practitioner on analytics(practitioner_id);
create index idx_analytics_date on analytics(date);

-- ============================================
-- 9. AUDIT LOG (Compliance)
-- ============================================
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  practitioner_id uuid not null references profiles(id) on delete cascade,
  
  action varchar(100) not null,
  entity_type varchar(50), -- patients, appointments, messages
  entity_id uuid,
  changes jsonb,
  ip_address varchar(45),
  
  created_at timestamp default now()
);

-- Index
create index idx_audit_logs_practitioner on audit_logs(practitioner_id);
create index idx_audit_logs_created on audit_logs(created_at);

-- ============================================
-- 10. RLS (Row Level Security) - IMPORTANT
-- ============================================

-- RLS on profiles
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = user_id);

-- RLS on patients
alter table patients enable row level security;

create policy "Practitioner can view own patients"
  on patients for select
  using (auth.uid() in (
    select user_id from profiles where id = practitioner_id
  ));

create policy "Practitioner can manage own patients"
  on patients for all
  using (auth.uid() in (
    select user_id from profiles where id = practitioner_id
  ));

-- RLS on appointments
alter table appointments enable row level security;

create policy "Practitioner can view own appointments"
  on appointments for select
  using (auth.uid() in (
    select user_id from profiles where id = practitioner_id
  ));

create policy "Practitioner can manage own appointments"
  on appointments for all
  using (auth.uid() in (
    select user_id from profiles where id = practitioner_id
  ));

-- RLS on questionnaires
alter table questionnaires enable row level security;

create policy "Practitioner can view own questionnaires"
  on questionnaires for select
  using (auth.uid() in (
    select user_id from profiles where id in (
      select practitioner_id from patients where id = patient_id
    )
  ));

-- RLS on messages
alter table messages enable row level security;

create policy "Users can view own messages"
  on messages for select
  using (
    auth.uid() in (
      select user_id from profiles where id = practitioner_id
    )
  );

create policy "Users can create messages"
  on messages for insert
  with check (
    auth.uid() in (
      select user_id from profiles where id = practitioner_id
    )
  );

-- ============================================
-- 11. FUNCTIONS (Utilitaires)
-- ============================================

-- Fonction: Calculer âge patient
create or replace function calculate_age(date_of_birth date)
returns int as $$
begin
  return extract(year from age(date_of_birth))::int;
end;
$$ language plpgsql immutable;

-- Fonction: Générer token questionnaire unique
create or replace function generate_questionnaire_token()
returns text as $$
declare
  token text;
begin
  token := encode(gen_random_bytes(32), 'hex');
  return token;
end;
$$ language plpgsql;

-- Fonction: Update patient tags (auto segmentation)
create or replace function update_patient_tags(patient_id uuid)
returns void as $$
declare
  p patients%rowtype;
  new_tags text[] := '{}';
  age int;
begin
  select * into p from patients where id = patient_id;
  
  age := calculate_age(p.date_of_birth);
  
  -- Age groups
  if age < 30 then new_tags := array_append(new_tags, 'jeune');
  elsif age >= 30 and age < 50 then new_tags := array_append(new_tags, 'adulte');
  else new_tags := array_append(new_tags, 'senior');
  end if;
  
  -- Update
  update patients set tags = new_tags, age_group = case
    when age < 30 then 'jeune'
    when age < 50 then 'adulte'
    else 'senior'
  end where id = patient_id;
end;
$$ language plpgsql;

-- Trigger: Auto-call update_patient_tags
create or replace function trigger_update_patient_tags()
returns trigger as $$
begin
  perform update_patient_tags(new.id);
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_tags_on_patient_insert
after insert on patients
for each row
execute function trigger_update_patient_tags();

-- ============================================
-- 12. VIEWS (Vues utiles)
-- ============================================

-- Vue: Dashboard stats pour praticien (today)
create or replace view dashboard_stats_today as
select
  p.id as practitioner_id,
  count(distinct a.id) as appointments_today,
  count(distinct case when a.status = 'completed' then a.id end) as completed_today,
  count(distinct case when a.status = 'no-show' then a.id end) as no_shows_today,
  count(distinct case when a.is_absent then a.id end) as absences_today
from profiles p
left join appointments a on p.id = a.practitioner_id 
  and date(a.date_time) = current_date
group by p.id;

-- Vue: Patient risk scores
create or replace view patient_risk_analysis as
select
  p.id,
  p.first_name,
  p.last_name,
  p.risk_score,
  p.risk_level,
  count(distinct a.id) as total_appointments,
  max(a.date_time) as last_appointment,
  avg(extract(day from now() - a.date_time)) as days_since_last_appt
from patients p
left join appointments a on p.id = a.patient_id and a.status = 'completed'
group by p.id, p.first_name, p.last_name, p.risk_score, p.risk_level;

-- Vue: Questionnaire completion rate
create or replace view questionnaire_stats as
select
  p.id as practitioner_id,
  count(distinct a.id) as total_appointments,
  count(distinct q.id) as responded_questionnaires,
  round(100.0 * count(distinct q.id) / nullif(count(distinct a.id), 0), 2) as response_rate
from profiles p
left join appointments a on p.id = a.practitioner_id and a.status = 'completed'
left join questionnaires q on a.id = q.appointment_id
group by p.id;

-- ============================================
-- 13. INITIAL DATA (Optionnel pour tests)
-- ============================================

-- Vous pouvez ajouter des données de test ici

-- ============================================
-- 14. INDEXES PERFORMANCE
-- ============================================

-- Composite indexes for common queries
create index idx_appointments_practitioner_date on appointments(practitioner_id, date_time desc);
create index idx_patients_practitioner_status on patients(practitioner_id, status);
create index idx_messages_conversation on messages(patient_id, practitioner_id, created_at desc);

-- ============================================
-- NOTES IMPORTANTES:
-- ============================================
-- 1. RLS est activé: les praticiens ne voient que leurs données
-- 2. Les timestamps sont en UTC (astuce: utiliser AT TIME ZONE 'Europe/Paris' si besoin)
-- 3. Tags patients sont des arrays (PGSQL array) pour flexibility
-- 4. Questionnaire tokens expirent après 7 jours
-- 5. Audit logs enregistrent tous les changements (pour compliance)
-- 6. Risk score calculé côté app (logique complexe = mieux en Python/Node)
-- 7. Backups daily recommandés (Supabase fait ça auto)
-- 8. Trier les indexes si perf issues

-- Pour deployer: copier-coller tout dans SQL Editor Supabase
