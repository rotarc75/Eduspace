-- ============================================================
-- MIGRATION MATIÈRES DYNAMIQUES + SOUMISSIONS ÉLÈVES
-- Supabase > SQL Editor > New query > Run
-- ============================================================

-- 1. Table des matières par élève
create table if not exists subjects (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  name       text not null,
  color      text not null default 'blue',  -- blue | green | purple | amber | red
  created_at timestamptz default now()
);
alter table subjects enable row level security;
create policy "public_all" on subjects for all using (true) with check (true);

-- 2. Remplacer la colonne matiere (text contraint) par subject_id
alter table resources add column if not exists subject_id uuid references subjects(id) on delete set null;
alter table chapters  add column if not exists subject_id uuid references subjects(id) on delete cascade;

-- 3. Soumissions élève dans les devoirs
alter table devoirs add column if not exists submission_url  text;
alter table devoirs add column if not exists submission_name text;
alter table devoirs add column if not exists submitted_at    timestamptz;

-- Note: les anciennes colonnes matiere restent pour compatibilité,
-- les nouvelles données utilisent subject_id
