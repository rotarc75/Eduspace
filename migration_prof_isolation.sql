-- ============================================================
-- MIGRATION : Isolation des élèves par professeur
-- Supabase > SQL Editor > New query > Run
-- ============================================================

-- 1. Ajouter prof_id à la table students
alter table students add column if not exists prof_id uuid references professors(id) on delete set null;

-- 2. Rattacher les élèves existants au prof admin (is_owner = true)
--    Si tu as des élèves déjà créés, ils seront attribués au premier compte admin.
update students
set prof_id = (select id from professors where is_owner = true order by created_at limit 1)
where prof_id is null;
