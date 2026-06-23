-- ============================================
-- HealthFlow — Migration 007: RLS complètes
-- Isolation stricte par praticien via auth.uid() → profiles.user_id
-- Exécuter après 001 → 006
-- ============================================

-- ---------------------------------------------------------------------------
-- Fonction utilitaire : ID du profil praticien connecté
-- ---------------------------------------------------------------------------
create or replace function public.current_practitioner_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select id
  from public.profiles
  where user_id = auth.uid()
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- PRACTITIONERS (extension métier 1:1 de profiles)
-- ---------------------------------------------------------------------------
alter table public.practitioners enable row level security;

drop policy if exists "practitioners_all_own" on public.practitioners;
drop policy if exists "practitioners_select_own" on public.practitioners;
drop policy if exists "practitioners_insert_own" on public.practitioners;
drop policy if exists "practitioners_update_own" on public.practitioners;
drop policy if exists "practitioners_delete_own" on public.practitioners;

create policy "practitioners_select_own"
  on public.practitioners for select
  using (profile_id = public.current_practitioner_id());

create policy "practitioners_insert_own"
  on public.practitioners for insert
  with check (profile_id = public.current_practitioner_id());

create policy "practitioners_update_own"
  on public.practitioners for update
  using (profile_id = public.current_practitioner_id())
  with check (profile_id = public.current_practitioner_id());

create policy "practitioners_delete_own"
  on public.practitioners for delete
  using (profile_id = public.current_practitioner_id());

-- ---------------------------------------------------------------------------
-- PATIENTS
-- ---------------------------------------------------------------------------
alter table public.patients enable row level security;

drop policy if exists "patients_all_own" on public.patients;
drop policy if exists "Practitioner can view own patients" on public.patients;
drop policy if exists "Practitioner can manage own patients" on public.patients;
drop policy if exists "patients_select_own" on public.patients;
drop policy if exists "patients_insert_own" on public.patients;
drop policy if exists "patients_update_own" on public.patients;
drop policy if exists "patients_delete_own" on public.patients;

create policy "patients_select_own"
  on public.patients for select
  using (practitioner_id = public.current_practitioner_id());

create policy "patients_insert_own"
  on public.patients for insert
  with check (practitioner_id = public.current_practitioner_id());

create policy "patients_update_own"
  on public.patients for update
  using (practitioner_id = public.current_practitioner_id())
  with check (practitioner_id = public.current_practitioner_id());

create policy "patients_delete_own"
  on public.patients for delete
  using (practitioner_id = public.current_practitioner_id());

-- ---------------------------------------------------------------------------
-- APPOINTMENTS
-- ---------------------------------------------------------------------------
alter table public.appointments enable row level security;

drop policy if exists "appointments_all_own" on public.appointments;
drop policy if exists "Practitioner can view own appointments" on public.appointments;
drop policy if exists "Practitioner can manage own appointments" on public.appointments;
drop policy if exists "appointments_select_own" on public.appointments;
drop policy if exists "appointments_insert_own" on public.appointments;
drop policy if exists "appointments_update_own" on public.appointments;
drop policy if exists "appointments_delete_own" on public.appointments;

create policy "appointments_select_own"
  on public.appointments for select
  using (practitioner_id = public.current_practitioner_id());

create policy "appointments_insert_own"
  on public.appointments for insert
  with check (
    practitioner_id = public.current_practitioner_id()
    and patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "appointments_update_own"
  on public.appointments for update
  using (practitioner_id = public.current_practitioner_id())
  with check (
    practitioner_id = public.current_practitioner_id()
    and patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "appointments_delete_own"
  on public.appointments for delete
  using (practitioner_id = public.current_practitioner_id());

-- ---------------------------------------------------------------------------
-- CONSULTATIONS (notes SOAP)
-- ---------------------------------------------------------------------------
alter table public.consultations enable row level security;

drop policy if exists "consultations_all_own" on public.consultations;
drop policy if exists "consultations_select_own" on public.consultations;
drop policy if exists "consultations_insert_own" on public.consultations;
drop policy if exists "consultations_update_own" on public.consultations;
drop policy if exists "consultations_delete_own" on public.consultations;

create policy "consultations_select_own"
  on public.consultations for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.practitioner_id = public.current_practitioner_id()
    )
  );

create policy "consultations_insert_own"
  on public.consultations for insert
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.practitioner_id = public.current_practitioner_id()
    )
  );

create policy "consultations_update_own"
  on public.consultations for update
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.practitioner_id = public.current_practitioner_id()
    )
  )
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.practitioner_id = public.current_practitioner_id()
    )
  );

create policy "consultations_delete_own"
  on public.consultations for delete
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.practitioner_id = public.current_practitioner_id()
    )
  );

-- ---------------------------------------------------------------------------
-- PATIENT MEDICAL RECORDS
-- ---------------------------------------------------------------------------
alter table public.patient_medical_records enable row level security;

drop policy if exists "patient_medical_records_all_own" on public.patient_medical_records;
drop policy if exists "patient_medical_records_select_own" on public.patient_medical_records;
drop policy if exists "patient_medical_records_insert_own" on public.patient_medical_records;
drop policy if exists "patient_medical_records_update_own" on public.patient_medical_records;
drop policy if exists "patient_medical_records_delete_own" on public.patient_medical_records;

create policy "patient_medical_records_select_own"
  on public.patient_medical_records for select
  using (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "patient_medical_records_insert_own"
  on public.patient_medical_records for insert
  with check (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "patient_medical_records_update_own"
  on public.patient_medical_records for update
  using (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  )
  with check (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "patient_medical_records_delete_own"
  on public.patient_medical_records for delete
  using (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

-- ---------------------------------------------------------------------------
-- PATIENT WORKFLOWS
-- ---------------------------------------------------------------------------
alter table public.patient_workflows enable row level security;

drop policy if exists "patient_workflows_all_own" on public.patient_workflows;
drop policy if exists "patient_workflows_select_own" on public.patient_workflows;
drop policy if exists "patient_workflows_insert_own" on public.patient_workflows;
drop policy if exists "patient_workflows_update_own" on public.patient_workflows;
drop policy if exists "patient_workflows_delete_own" on public.patient_workflows;

create policy "patient_workflows_select_own"
  on public.patient_workflows for select
  using (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "patient_workflows_insert_own"
  on public.patient_workflows for insert
  with check (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "patient_workflows_update_own"
  on public.patient_workflows for update
  using (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  )
  with check (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "patient_workflows_delete_own"
  on public.patient_workflows for delete
  using (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

-- ---------------------------------------------------------------------------
-- WORKFLOW STEPS
-- ---------------------------------------------------------------------------
alter table public.workflow_steps enable row level security;

drop policy if exists "workflow_steps_all_own" on public.workflow_steps;
drop policy if exists "workflow_steps_select_own" on public.workflow_steps;
drop policy if exists "workflow_steps_insert_own" on public.workflow_steps;
drop policy if exists "workflow_steps_update_own" on public.workflow_steps;
drop policy if exists "workflow_steps_delete_own" on public.workflow_steps;

create policy "workflow_steps_select_own"
  on public.workflow_steps for select
  using (
    workflow_id in (
      select pw.id
      from public.patient_workflows pw
      join public.patients pt on pt.id = pw.patient_id
      where pt.practitioner_id = public.current_practitioner_id()
    )
  );

create policy "workflow_steps_insert_own"
  on public.workflow_steps for insert
  with check (
    workflow_id in (
      select pw.id
      from public.patient_workflows pw
      join public.patients pt on pt.id = pw.patient_id
      where pt.practitioner_id = public.current_practitioner_id()
    )
  );

create policy "workflow_steps_update_own"
  on public.workflow_steps for update
  using (
    workflow_id in (
      select pw.id
      from public.patient_workflows pw
      join public.patients pt on pt.id = pw.patient_id
      where pt.practitioner_id = public.current_practitioner_id()
    )
  )
  with check (
    workflow_id in (
      select pw.id
      from public.patient_workflows pw
      join public.patients pt on pt.id = pw.patient_id
      where pt.practitioner_id = public.current_practitioner_id()
    )
  );

create policy "workflow_steps_delete_own"
  on public.workflow_steps for delete
  using (
    workflow_id in (
      select pw.id
      from public.patient_workflows pw
      join public.patients pt on pt.id = pw.patient_id
      where pt.practitioner_id = public.current_practitioner_id()
    )
  );

-- ---------------------------------------------------------------------------
-- DOCUMENTS
-- ---------------------------------------------------------------------------
alter table public.documents enable row level security;

drop policy if exists "documents_all_own" on public.documents;
drop policy if exists "documents_select_own" on public.documents;
drop policy if exists "documents_insert_own" on public.documents;
drop policy if exists "documents_update_own" on public.documents;
drop policy if exists "documents_delete_own" on public.documents;

create policy "documents_select_own"
  on public.documents for select
  using (practitioner_id = public.current_practitioner_id());

create policy "documents_insert_own"
  on public.documents for insert
  with check (
    practitioner_id = public.current_practitioner_id()
    and patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
    and (
      appointment_id is null
      or exists (
        select 1 from public.appointments a
        where a.id = appointment_id
          and a.practitioner_id = public.current_practitioner_id()
          and a.patient_id = patient_id
      )
    )
  );

create policy "documents_update_own"
  on public.documents for update
  using (practitioner_id = public.current_practitioner_id())
  with check (
    practitioner_id = public.current_practitioner_id()
    and patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
    and (
      appointment_id is null
      or exists (
        select 1 from public.appointments a
        where a.id = appointment_id
          and a.practitioner_id = public.current_practitioner_id()
          and a.patient_id = patient_id
      )
    )
  );

create policy "documents_delete_own"
  on public.documents for delete
  using (practitioner_id = public.current_practitioner_id());

-- ---------------------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------------------
alter table public.messages enable row level security;

drop policy if exists "messages_all_own" on public.messages;
drop policy if exists "Users can view own messages" on public.messages;
drop policy if exists "Users can create messages" on public.messages;
drop policy if exists "messages_select_own" on public.messages;
drop policy if exists "messages_insert_own" on public.messages;
drop policy if exists "messages_update_own" on public.messages;
drop policy if exists "messages_delete_own" on public.messages;

create policy "messages_select_own"
  on public.messages for select
  using (practitioner_id = public.current_practitioner_id());

create policy "messages_insert_own"
  on public.messages for insert
  with check (
    practitioner_id = public.current_practitioner_id()
    and patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "messages_update_own"
  on public.messages for update
  using (practitioner_id = public.current_practitioner_id())
  with check (
    practitioner_id = public.current_practitioner_id()
    and patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "messages_delete_own"
  on public.messages for delete
  using (practitioner_id = public.current_practitioner_id());

-- ---------------------------------------------------------------------------
-- QUESTIONNAIRES (accès via patient du praticien)
-- Les soumissions publiques passent par service_role (API admin).
-- ---------------------------------------------------------------------------
alter table public.questionnaires enable row level security;

drop policy if exists "questionnaires_select_own" on public.questionnaires;
drop policy if exists "Practitioner can view own questionnaires" on public.questionnaires;
drop policy if exists "questionnaires_insert_own" on public.questionnaires;
drop policy if exists "questionnaires_update_own" on public.questionnaires;
drop policy if exists "questionnaires_delete_own" on public.questionnaires;

create policy "questionnaires_select_own"
  on public.questionnaires for select
  using (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "questionnaires_insert_own"
  on public.questionnaires for insert
  with check (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
    and exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.practitioner_id = public.current_practitioner_id()
        and a.patient_id = patient_id
    )
  );

create policy "questionnaires_update_own"
  on public.questionnaires for update
  using (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  )
  with check (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
    and exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.practitioner_id = public.current_practitioner_id()
        and a.patient_id = patient_id
    )
  );

create policy "questionnaires_delete_own"
  on public.questionnaires for delete
  using (
    patient_id in (
      select id from public.patients
      where practitioner_id = public.current_practitioner_id()
    )
  );

-- ---------------------------------------------------------------------------
-- QUESTIONNAIRE TOKENS (accès via rendez-vous du praticien)
-- ---------------------------------------------------------------------------
alter table public.questionnaire_tokens enable row level security;

drop policy if exists "questionnaire_tokens_select_own" on public.questionnaire_tokens;
drop policy if exists "questionnaire_tokens_insert_own" on public.questionnaire_tokens;
drop policy if exists "questionnaire_tokens_update_own" on public.questionnaire_tokens;
drop policy if exists "questionnaire_tokens_delete_own" on public.questionnaire_tokens;

create policy "questionnaire_tokens_select_own"
  on public.questionnaire_tokens for select
  using (
    appointment_id in (
      select id from public.appointments
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "questionnaire_tokens_insert_own"
  on public.questionnaire_tokens for insert
  with check (
    appointment_id in (
      select id from public.appointments
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "questionnaire_tokens_update_own"
  on public.questionnaire_tokens for update
  using (
    appointment_id in (
      select id from public.appointments
      where practitioner_id = public.current_practitioner_id()
    )
  )
  with check (
    appointment_id in (
      select id from public.appointments
      where practitioner_id = public.current_practitioner_id()
    )
  );

create policy "questionnaire_tokens_delete_own"
  on public.questionnaire_tokens for delete
  using (
    appointment_id in (
      select id from public.appointments
      where practitioner_id = public.current_practitioner_id()
    )
  );

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists "notifications_all_own" on public.notifications;
drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_insert_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_delete_own" on public.notifications;

create policy "notifications_select_own"
  on public.notifications for select
  using (practitioner_id = public.current_practitioner_id());

create policy "notifications_insert_own"
  on public.notifications for insert
  with check (practitioner_id = public.current_practitioner_id());

create policy "notifications_update_own"
  on public.notifications for update
  using (practitioner_id = public.current_practitioner_id())
  with check (practitioner_id = public.current_practitioner_id());

create policy "notifications_delete_own"
  on public.notifications for delete
  using (practitioner_id = public.current_practitioner_id());

-- ---------------------------------------------------------------------------
-- ANALYTICS
-- ---------------------------------------------------------------------------
alter table public.analytics enable row level security;

drop policy if exists "analytics_select_own" on public.analytics;
drop policy if exists "analytics_insert_own" on public.analytics;
drop policy if exists "analytics_update_own" on public.analytics;
drop policy if exists "analytics_delete_own" on public.analytics;

create policy "analytics_select_own"
  on public.analytics for select
  using (practitioner_id = public.current_practitioner_id());

create policy "analytics_insert_own"
  on public.analytics for insert
  with check (practitioner_id = public.current_practitioner_id());

create policy "analytics_update_own"
  on public.analytics for update
  using (practitioner_id = public.current_practitioner_id())
  with check (practitioner_id = public.current_practitioner_id());

create policy "analytics_delete_own"
  on public.analytics for delete
  using (practitioner_id = public.current_practitioner_id());

-- ---------------------------------------------------------------------------
-- AUDIT LOGS (lecture + insertion ; journal immuable)
-- ---------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

drop policy if exists "audit_select_own" on public.audit_logs;
drop policy if exists "audit_logs_select_own" on public.audit_logs;
drop policy if exists "audit_logs_insert_own" on public.audit_logs;
drop policy if exists "audit_logs_update_own" on public.audit_logs;
drop policy if exists "audit_logs_delete_own" on public.audit_logs;

create policy "audit_logs_select_own"
  on public.audit_logs for select
  using (practitioner_id = public.current_practitioner_id());

create policy "audit_logs_insert_own"
  on public.audit_logs for insert
  with check (practitioner_id = public.current_practitioner_id());

-- Journal d'audit : pas de modification ni suppression côté client
create policy "audit_logs_update_own"
  on public.audit_logs for update
  using (false);

create policy "audit_logs_delete_own"
  on public.audit_logs for delete
  using (false);
