-- ============================================
-- HealthFlow — Migration 001: Schéma initial
-- Exécuter dans Supabase SQL Editor
-- ============================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ============================================
-- PROFILES (Praticiens)
-- ============================================
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  phone varchar(20),
  specialty varchar(50) not null default 'Autre',
  cabinet_name varchar(200),
  hours_start time default '09:00',
  hours_end time default '18:00',
  days_closed int[] default '{5,6}',
  session_duration_minutes int default 45,
  language varchar(5) default 'fr',
  timezone varchar(50) default 'Europe/Paris',
  email_reminders boolean default true,
  sms_reminders boolean default false,
  subscription_plan varchar(20) default 'free',
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint specialty_check check (specialty in ('Médecin','Kiné','Ostéopathe','Masseuse','Nutritionniste','Coach','Autre'))
);

create index if not exists idx_profiles_user_id on profiles(user_id);

-- ============================================
-- PATIENTS
-- ============================================
create table if not exists patients (
  id uuid primary key default uuid_generate_v4(),
  practitioner_id uuid not null references profiles(id) on delete cascade,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  date_of_birth date not null,
  email varchar(255),
  phone varchar(20),
  chief_complaint varchar(500) not null,
  medical_history text,
  contraindications text,
  allergies text,
  tags text[] default '{}',
  age_group varchar(20),
  status varchar(20) default 'active',
  total_appointments int default 0,
  last_appointment_date date,
  risk_score int default 0,
  risk_level varchar(20) default 'low',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint status_check check (status in ('active','inactive','archived')),
  constraint risk_check check (risk_level in ('low','medium','high','critical'))
);

create index if not exists idx_patients_practitioner on patients(practitioner_id);
create index if not exists idx_patients_status on patients(status);
create index if not exists idx_patients_risk on patients(risk_score desc);
create index if not exists idx_patients_last_name on patients(last_name);

-- Index full-text pour recherche patients (FR)
create index if not exists idx_patients_fts on patients
  using gin(to_tsvector('french',
    coalesce(first_name,'') || ' ' ||
    coalesce(last_name,'') || ' ' ||
    coalesce(chief_complaint,'')
  ));

-- ============================================
-- APPOINTMENTS
-- ============================================
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  practitioner_id uuid not null references profiles(id) on delete cascade,
  date_time timestamptz not null,
  duration_minutes int default 45,
  reason varchar(500),
  notes text,
  status varchar(20) default 'scheduled',
  is_absent boolean default false,
  reminder_sent boolean default false,
  reminder_sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint appt_status_check check (status in ('scheduled','completed','cancelled','no-show'))
);

create index if not exists idx_appointments_practitioner_date on appointments(practitioner_id, date_time desc);
create index if not exists idx_appointments_patient on appointments(patient_id);
create index if not exists idx_appointments_date on appointments(date_time);
create index if not exists idx_appointments_status on appointments(status);

-- ============================================
-- QUESTIONNAIRES
-- ============================================
create table if not exists questionnaires (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null unique references appointments(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  relief_level int check (relief_level between 1 and 10),
  side_effects boolean,
  side_effects_description text,
  current_pain int check (current_pain between 0 and 10),
  exercises_done varchar(20) check (exercises_done in ('yes','partial','no')),
  comments text,
  mobility_score int check (mobility_score between 0 and 100),
  sleep_quality int check (sleep_quality between 0 and 10),
  activity_level varchar(20),
  created_at timestamptz default now(),
  submitted_at timestamptz
);

create index if not exists idx_questionnaires_appointment on questionnaires(appointment_id);
create index if not exists idx_questionnaires_patient on questionnaires(patient_id);

-- ============================================
-- QUESTIONNAIRE TOKENS
-- ============================================
create table if not exists questionnaire_tokens (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null unique references appointments(id) on delete cascade,
  token varchar(255) not null unique,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days',
  used_at timestamptz,
  constraint token_length check (length(token) >= 32)
);

create index if not exists idx_questionnaire_tokens_token on questionnaire_tokens(token);

-- ============================================
-- MESSAGES
-- ============================================
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  practitioner_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  sender_type varchar(20) not null check (sender_type in ('practitioner','patient')),
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_messages_conversation on messages(patient_id, practitioner_id, created_at desc);

-- ============================================
-- DOCUMENTS (Storage metadata)
-- ============================================
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  practitioner_id uuid not null references profiles(id) on delete cascade,
  appointment_id uuid references appointments(id),
  file_name varchar(255) not null,
  file_path text not null,
  file_size int,
  mime_type varchar(100),
  doc_type varchar(50) default 'report',
  created_at timestamptz default now()
);

create index if not exists idx_documents_patient on documents(patient_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  practitioner_id uuid not null references profiles(id) on delete cascade,
  type varchar(50) not null,
  title varchar(200) not null,
  message text not null,
  is_read boolean default false,
  link varchar(255),
  entity_id uuid,
  entity_type varchar(50),
  created_at timestamptz default now()
);

create index if not exists idx_notifications_practitioner on notifications(practitioner_id, is_read, created_at desc);

-- ============================================
-- ANALYTICS
-- ============================================
create table if not exists analytics (
  id uuid primary key default uuid_generate_v4(),
  practitioner_id uuid not null references profiles(id) on delete cascade,
  date date not null default current_date,
  total_appointments int default 0,
  completed_appointments int default 0,
  no_show_count int default 0,
  questionnaire_responses int default 0,
  questionnaire_response_rate numeric default 0.0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(practitioner_id, date)
);

-- ============================================
-- AUDIT LOGS
-- ============================================
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  practitioner_id uuid not null references profiles(id) on delete cascade,
  action varchar(100) not null,
  entity_type varchar(50),
  entity_id uuid,
  changes jsonb,
  ip_address varchar(45),
  created_at timestamptz default now()
);

create index if not exists idx_audit_logs_practitioner on audit_logs(practitioner_id, created_at desc);
