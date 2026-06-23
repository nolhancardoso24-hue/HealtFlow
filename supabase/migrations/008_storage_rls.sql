-- ============================================
-- HealthFlow — Migration 008: Storage RLS sécurisé
-- Bucket privé healthflow-documents
-- Structure cible : documents/{practitioner_id}/{patient_id}/{filename}
-- Compatibilité legacy : {practitioner_id}/{patient_id}/{filename} (app actuelle)
-- Compatibilité migration 003 : ne supprime ni ne remplace les policies existantes
-- Dépend de : 007_complete_rls.sql (current_practitioner_id)
-- ============================================
-- Notes :
-- - Pas de DROP POLICY / COMMENT ON POLICY sur storage.objects (droits owner requis).
-- - Les policies 003 ("Practitioner can …") sont conservées telles quelles.
-- - Cette migration ajoute uniquement les policies nommées storage_documents_* si absentes.
-- - PostgreSQL n'a pas CREATE POLICY IF NOT EXISTS : garde conditionnelle via pg_policies.
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

-- Vérifie que l'objet appartient au praticien connecté (auth.uid → profiles.user_id)
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

-- ---------------------------------------------------------------------------
-- Policies Storage (création conditionnelle — idempotent, sans DROP)
-- ---------------------------------------------------------------------------

-- SELECT : lecture / URLs signées — praticien propriétaire uniquement
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'storage_documents_select_own'
  ) THEN
    CREATE POLICY "storage_documents_select_own"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'healthflow-documents'
        AND public.storage_object_owned_by_current_practitioner(name)
      );
  END IF;
END
$policy$;

-- INSERT : upload — chemin = praticien connecté + patient qui lui appartient
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'storage_documents_insert_own'
  ) THEN
    CREATE POLICY "storage_documents_insert_own"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'healthflow-documents'
        AND public.storage_object_owned_by_current_practitioner(name)
      );
  END IF;
END
$policy$;

-- UPDATE : remplacement / métadonnées — espace praticien inchangé
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'storage_documents_update_own'
  ) THEN
    CREATE POLICY "storage_documents_update_own"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'healthflow-documents'
        AND public.storage_object_owned_by_current_practitioner(name)
      )
      WITH CHECK (
        bucket_id = 'healthflow-documents'
        AND public.storage_object_owned_by_current_practitioner(name)
      );
  END IF;
END
$policy$;

-- DELETE : suppression — propriétaire du chemin uniquement
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'storage_documents_delete_own'
  ) THEN
    CREATE POLICY "storage_documents_delete_own"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'healthflow-documents'
        AND public.storage_object_owned_by_current_practitioner(name)
      );
  END IF;
END
$policy$;
