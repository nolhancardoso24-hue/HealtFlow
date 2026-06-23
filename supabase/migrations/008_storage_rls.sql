-- ============================================
-- HealthFlow — Migration 008: Storage RLS sécurisé
-- Bucket privé healthflow-documents
-- Structure cible : documents/{practitioner_id}/{patient_id}/{filename}
-- Compatibilité legacy : {practitioner_id}/{patient_id}/{filename} (app actuelle)
-- Dépend de : 007_complete_rls.sql (current_practitioner_id)
-- ============================================

-- ---------------------------------------------------------------------------
-- Bucket privé (pas d'accès public anonyme)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('healthflow-documents', 'healthflow-documents', false)
on conflict (id) do update
  set public = false;

-- ---------------------------------------------------------------------------
-- Helpers : extraire practitioner_id et patient_id depuis le chemin objet
--
-- Formats supportés :
--   documents/{practitioner_id}/{patient_id}/{filename}  ← structure cible
--   {practitioner_id}/{patient_id}/{filename}            ← legacy (upload actuel)
-- ---------------------------------------------------------------------------

-- Retourne l'UUID praticien encodé dans le chemin storage.objects.name
create or replace function public.storage_object_practitioner_id(object_path text)
returns uuid
language sql
immutable
set search_path = public, storage
as $$
  select (
    case
      when coalesce((storage.foldername(object_path))[1], '') = 'documents'
        then (storage.foldername(object_path))[2]
      else (storage.foldername(object_path))[1]
    end
  )::uuid;
$$;

comment on function public.storage_object_practitioner_id(text) is
  'Extrait profiles.id (praticien) depuis un chemin Storage HealthFlow.';

-- Retourne l'UUID patient encodé dans le chemin storage.objects.name
create or replace function public.storage_object_patient_id(object_path text)
returns uuid
language sql
immutable
set search_path = public, storage
as $$
  select (
    case
      when coalesce((storage.foldername(object_path))[1], '') = 'documents'
        then (storage.foldername(object_path))[3]
      else (storage.foldername(object_path))[2]
    end
  )::uuid;
$$;

comment on function public.storage_object_patient_id(text) is
  'Extrait patients.id depuis un chemin Storage HealthFlow.';

-- Vérifie que l''objet appartient au praticien connecté (auth.uid → profiles.user_id)
-- et que le patient référencé dans le chemin lui appartient bien.
create or replace function public.storage_object_owned_by_current_practitioner(object_path text)
returns boolean
language sql
stable
security invoker
set search_path = public, storage
as $$
  select
    auth.uid() is not null
    and public.storage_object_practitioner_id(object_path) = public.current_practitioner_id()
    and exists (
      select 1
      from public.patients p
      where p.id = public.storage_object_patient_id(object_path)
        and p.practitioner_id = public.current_practitioner_id()
    );
$$;

comment on function public.storage_object_owned_by_current_practitioner(text) is
  'True si le chemin Storage correspond au praticien connecté et à un de ses patients.';

-- ---------------------------------------------------------------------------
-- Suppression des policies Storage de la migration 003 (remplacées ci-dessous)
-- ---------------------------------------------------------------------------
drop policy if exists "Practitioner can upload documents" on storage.objects;
drop policy if exists "Practitioner can read own documents" on storage.objects;
drop policy if exists "Practitioner can delete own documents" on storage.objects;

-- Policies nommées de la migration 008 (idempotence si re-exécution partielle)
drop policy if exists "storage_documents_select_own" on storage.objects;
drop policy if exists "storage_documents_insert_own" on storage.objects;
drop policy if exists "storage_documents_update_own" on storage.objects;
drop policy if exists "storage_documents_delete_own" on storage.objects;

-- ---------------------------------------------------------------------------
-- SELECT — lecture / URLs signées
-- Seul le praticien propriétaire du dossier peut lire ses fichiers.
-- Les utilisateurs non authentifiés et les autres praticiens sont bloqués.
-- Compatible avec documents.file_path (legacy ou préfixe documents/).
-- ---------------------------------------------------------------------------
create policy "storage_documents_select_own"
  on storage.objects for select
  using (
    bucket_id = 'healthflow-documents'
    and public.storage_object_owned_by_current_practitioner(name)
  );

comment on policy "storage_documents_select_own" on storage.objects is
  'Lecture restreinte au praticien connecté (auth.uid → profiles). Empêche la lecture croisée entre comptes et l''accès public.';

-- ---------------------------------------------------------------------------
-- INSERT — upload
-- Le chemin doit contenir le practitioner_id du compte connecté
-- et un patient_id qui lui appartient (cohérence avec la table documents).
-- Structure recommandée : documents/{practitioner_id}/{patient_id}/{filename}
-- ---------------------------------------------------------------------------
create policy "storage_documents_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'healthflow-documents'
    and public.storage_object_owned_by_current_practitioner(name)
  );

comment on policy "storage_documents_insert_own" on storage.objects is
  'Upload autorisé uniquement dans le dossier du praticien connecté, pour un de ses patients. Bloque l''écriture dans le dossier d''un autre praticien.';

-- ---------------------------------------------------------------------------
-- UPDATE — remplacement ou déplacement de métadonnées
-- Même règle qu''à l''insertion : le chemin cible doit rester dans l''espace du praticien.
-- ---------------------------------------------------------------------------
create policy "storage_documents_update_own"
  on storage.objects for update
  using (
    bucket_id = 'healthflow-documents'
    and public.storage_object_owned_by_current_practitioner(name)
  )
  with check (
    bucket_id = 'healthflow-documents'
    and public.storage_object_owned_by_current_practitioner(name)
  );

comment on policy "storage_documents_update_own" on storage.objects is
  'Mise à jour autorisée uniquement sur les fichiers appartenant au praticien connecté. Empêche le déplacement vers un autre espace.';

-- ---------------------------------------------------------------------------
-- DELETE — suppression
-- Seul le propriétaire du dossier peut supprimer ses fichiers.
-- Aligné avec DELETE sur la table documents (file_path identique).
-- ---------------------------------------------------------------------------
create policy "storage_documents_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'healthflow-documents'
    and public.storage_object_owned_by_current_practitioner(name)
  );

comment on policy "storage_documents_delete_own" on storage.objects is
  'Suppression restreinte au praticien propriétaire du chemin. Empêche la suppression des fichiers d''un autre compte.';
