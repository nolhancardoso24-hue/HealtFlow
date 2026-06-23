-- ============================================
-- HealthFlow — Migration 005: Praticiens, consultations & workflows
-- NON DESTRUCTIVE — n'altère aucune table existante
-- Exécuter dans Supabase SQL Editor après 001 → 004
-- ============================================

-- ============================================
-- PRACTITIONERS
-- Extension métier du profil utilisateur (profiles)
-- ============================================
create table if not exists practitioners (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  cabinet_name varchar(200),
  practitioner_type varchar(50),
  created_at timestamptz not null default now(),
  constraint practitioners_type_check check (
    practitioner_type is null or practitioner_type in (
      'Médecin', 'Kiné', 'Ostéopathe', 'Masseuse', 'Nutritionniste', 'Coach', 'Autre'
    )
  )
);

create index if not exists idx_practitioners_profile_id on practitioners(profile_id);
create index if not exists idx_practitioners_type on practitioners(practitioner_type);

comment on table practitioners is 'Données métier praticien liées à profiles (1:1)';
comment on column practitioners.practitioner_type is 'Type de praticien (aligné sur profiles.specialty)';

-- ============================================
-- CONSULTATIONS (notes SOAP)
-- Une consultation documente une séance (appointment)
-- ============================================
create table if not exists consultations (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  subjective_notes text,
  objective_notes text,
  assessment text,
  plan text,
  created_at timestamptz not null default now()
);

create index if not exists idx_consultations_appointment on consultations(appointment_id);
create index if not exists idx_consultations_created_at on consultations(created_at desc);

comment on table consultations is 'Notes SOAP liées à un rendez-vous';
comment on column consultations.subjective_notes is 'S — Subjectif (ressenti patient)';
comment on column consultations.objective_notes is 'O — Objectif (observations)';
comment on column consultations.assessment is 'A — Analyse / diagnostic';
comment on column consultations.plan is 'P — Plan de traitement';

-- ============================================
-- PATIENT MEDICAL RECORDS
-- Historique structuré par type (allergie, antécédent, etc.)
-- ============================================
create table if not exists patient_medical_records (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  record_type varchar(50) not null,
  value text not null,
  created_at timestamptz not null default now(),
  constraint patient_medical_records_type_check check (
    record_type in (
      'allergy', 'contraindication', 'medical_history', 'medication',
      'vital_sign', 'diagnosis', 'note', 'other'
    )
  )
);

create index if not exists idx_patient_medical_records_patient on patient_medical_records(patient_id);
create index if not exists idx_patient_medical_records_type on patient_medical_records(patient_id, record_type);
create index if not exists idx_patient_medical_records_created_at on patient_medical_records(created_at desc);

comment on table patient_medical_records is 'Entrées médicales structurées par patient';

-- ============================================
-- PATIENT WORKFLOWS
-- Parcours de suivi patient (rééducation, suivi post-op, etc.)
-- ============================================
create table if not exists patient_workflows (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  workflow_type varchar(50) not null,
  status varchar(20) not null default 'active',
  next_action_date timestamptz,
  created_at timestamptz not null default now(),
  constraint patient_workflows_status_check check (
    status in ('active', 'paused', 'completed', 'cancelled')
  ),
  constraint patient_workflows_type_check check (
    workflow_type in (
      'rehabilitation', 'post_surgery', 'chronic_followup',
      'prevention', 'questionnaire_series', 'custom'
    )
  )
);

create index if not exists idx_patient_workflows_patient on patient_workflows(patient_id);
create index if not exists idx_patient_workflows_status on patient_workflows(status);
create index if not exists idx_patient_workflows_next_action on patient_workflows(next_action_date)
  where status = 'active' and next_action_date is not null;
create index if not exists idx_patient_workflows_type on patient_workflows(workflow_type);

comment on table patient_workflows is 'Parcours de suivi automatisé par patient';

-- ============================================
-- WORKFLOW STEPS
-- Étapes individuelles d'un parcours patient
-- ============================================
create table if not exists workflow_steps (
  id uuid primary key default uuid_generate_v4(),
  workflow_id uuid not null references patient_workflows(id) on delete cascade,
  step_name varchar(200) not null,
  trigger_date timestamptz,
  completed boolean not null default false
);

create index if not exists idx_workflow_steps_workflow on workflow_steps(workflow_id);
create index if not exists idx_workflow_steps_trigger on workflow_steps(trigger_date)
  where completed = false and trigger_date is not null;
create index if not exists idx_workflow_steps_pending on workflow_steps(workflow_id, completed)
  where completed = false;

comment on table workflow_steps is 'Étapes d''un parcours patient_workflows';

-- ============================================
-- BACKFILL (non destructif)
-- Crée un enregistrement practitioners pour chaque profile existant
-- ============================================
insert into practitioners (profile_id, cabinet_name, practitioner_type)
select
  p.id,
  p.cabinet_name,
  p.specialty
from profiles p
where not exists (
  select 1 from practitioners pr where pr.profile_id = p.id
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- PRACTITIONERS
alter table practitioners enable row level security;
drop policy if exists "practitioners_all_own" on practitioners;
create policy "practitioners_all_own" on practitioners for all
  using (profile_id in (select id from profiles where user_id = auth.uid()));

-- CONSULTATIONS (via appointment → practitioner)
alter table consultations enable row level security;
drop policy if exists "consultations_all_own" on consultations;
create policy "consultations_all_own" on consultations for all
  using (
    appointment_id in (
      select a.id from appointments a
      where a.practitioner_id in (
        select id from profiles where user_id = auth.uid()
      )
    )
  );

-- PATIENT MEDICAL RECORDS (via patient → practitioner)
alter table patient_medical_records enable row level security;
drop policy if exists "patient_medical_records_all_own" on patient_medical_records;
create policy "patient_medical_records_all_own" on patient_medical_records for all
  using (
    patient_id in (
      select id from patients
      where practitioner_id in (
        select id from profiles where user_id = auth.uid()
      )
    )
  );

-- PATIENT WORKFLOWS (via patient → practitioner)
alter table patient_workflows enable row level security;
drop policy if exists "patient_workflows_all_own" on patient_workflows;
create policy "patient_workflows_all_own" on patient_workflows for all
  using (
    patient_id in (
      select id from patients
      where practitioner_id in (
        select id from profiles where user_id = auth.uid()
      )
    )
  );

-- WORKFLOW STEPS (via workflow → patient → practitioner)
alter table workflow_steps enable row level security;
drop policy if exists "workflow_steps_all_own" on workflow_steps;
create policy "workflow_steps_all_own" on workflow_steps for all
  using (
    workflow_id in (
      select pw.id from patient_workflows pw
      join patients pt on pt.id = pw.patient_id
      where pt.practitioner_id in (
        select id from profiles where user_id = auth.uid()
      )
    )
  );
