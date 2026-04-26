-- ============================================================
-- MIGRATION MULTI-ÉLÈVES
-- Colle ce SQL dans Supabase > SQL Editor > New query > Run
-- ============================================================

-- 1. Créer la table des élèves
create table if not exists students (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  username     text not null unique,
  password     text not null,
  next_session text,
  created_at   timestamptz default now()
);
alter table students enable row level security;
create policy "public_all" on students for all using (true) with check (true);

-- 2. Ajouter student_id à toutes les tables de données
alter table resources add column if not exists student_id uuid references students(id) on delete cascade;
alter table chapters  add column if not exists student_id uuid references students(id) on delete cascade;
alter table tickets   add column if not exists student_id uuid references students(id) on delete cascade;
alter table journal   add column if not exists student_id uuid references students(id) on delete cascade;
alter table devoirs   add column if not exists student_id uuid references students(id) on delete cascade;

-- 3. Migrer les données existantes
--    Si tu avais déjà des données, crée d'abord ton élève via l'app,
--    note son ID (dans Supabase > Table Editor > students),
--    puis remplace 'STUDENT_ID_ICI' par cet UUID et exécute :
--
-- UPDATE resources SET student_id = 'STUDENT_ID_ICI' WHERE student_id IS NULL;
-- UPDATE chapters  SET student_id = 'STUDENT_ID_ICI' WHERE student_id IS NULL;
-- UPDATE tickets   SET student_id = 'STUDENT_ID_ICI' WHERE student_id IS NULL;
-- UPDATE journal   SET student_id = 'STUDENT_ID_ICI' WHERE student_id IS NULL;
-- UPDATE devoirs   SET student_id = 'STUDENT_ID_ICI' WHERE student_id IS NULL;

-- 4. Déplacer next_session de settings vers students (nettoyage optionnel)
-- DELETE FROM settings WHERE key = 'next_session';
