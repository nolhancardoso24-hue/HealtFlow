-- ============================================
-- HealthFlow — Migration 003: Storage Supabase
-- ============================================

-- Créer le bucket documents
insert into storage.buckets (id, name, public)
values ('healthflow-documents', 'healthflow-documents', false)
on conflict (id) do nothing;

-- Policy: upload par le praticien uniquement
create policy "Practitioner can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'healthflow-documents' AND
    auth.uid() is not null
  );

-- Policy: lecture par le praticien propriétaire
create policy "Practitioner can read own documents"
  on storage.objects for select
  using (
    bucket_id = 'healthflow-documents' AND
    (storage.foldername(name))[1] in (
      select id::text from profiles where user_id = auth.uid()
    )
  );

-- Policy: suppression
create policy "Practitioner can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'healthflow-documents' AND
    (storage.foldername(name))[1] in (
      select id::text from profiles where user_id = auth.uid()
    )
  );
