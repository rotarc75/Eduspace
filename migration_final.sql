-- ============================================================
-- MIGRATION FINALE — Supabase > SQL Editor > New query > Run
-- ============================================================

-- 1. Correction contrainte matiere (bug chapitres invisibles)
alter table chapters  alter column matiere drop not null;
alter table resources alter column matiere drop not null;
alter table chapters  drop constraint if exists chapters_matiere_check;
alter table resources drop constraint if exists resources_matiere_check;

-- 2. Colonnes subject_id
alter table chapters  add column if not exists subject_id uuid references subjects(id) on delete cascade;
alter table resources add column if not exists subject_id uuid references subjects(id) on delete set null;

-- 3. Colonnes devoirs (soumissions élèves + matière dynamique)
alter table devoirs add column if not exists subject_id      uuid references subjects(id) on delete set null;
alter table devoirs add column if not exists submission_url  text;
alter table devoirs add column if not exists submission_name text;
alter table devoirs add column if not exists submitted_at    timestamptz;

-- 4. Table professeurs
create table if not exists professors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  username   text not null unique,
  password   text not null,
  is_owner   boolean not null default false,
  created_at timestamptz default now()
);

alter table professors enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'professors' and policyname = 'public_all'
  ) then
    execute 'create policy "public_all" on professors for all using (true) with check (true)';
  end if;
end $$;

-- 5. Compte prof par défaut (identifiant: prof / mdp: prof2024)
insert into professors (name, username, password, is_owner)
values ('Professeur', 'prof', 'prof2024', true)
on conflict (username) do nothing;
