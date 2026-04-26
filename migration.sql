-- ============================================================
-- MIGRATION — À exécuter dans Supabase SQL Editor > New query
-- Pour les bases déjà existantes
-- ============================================================

-- 1. Nouvelles colonnes journal
alter table journal add column if not exists objectifs  text;
alter table journal add column if not exists note       integer check (note between 1 and 5);
alter table journal add column if not exists mood       integer check (mood between 0 and 4);
alter table journal add column if not exists duree      text;
alter table journal add column if not exists notions    text[];

-- 2. file_name dans resources
alter table resources add column if not exists file_name text;

-- 3. journal_id dans devoirs (lien séance)
alter table devoirs add column if not exists journal_id uuid references journal(id) on delete set null;

-- 4. Prochaine séance dans settings
insert into settings (key, value) values ('next_session', '')
on conflict (key) do nothing;

-- 5. Storage bucket pour les PDFs
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', true)
on conflict (id) do nothing;

create policy "public read pdfs"  on storage.objects for select using (bucket_id = 'pdfs');
create policy "public upload pdfs" on storage.objects for insert with check (bucket_id = 'pdfs');
create policy "public delete pdfs" on storage.objects for delete using (bucket_id = 'pdfs');
