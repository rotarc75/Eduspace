-- ============================================================
-- EDUSPACE — Schéma Supabase
-- Colle ce SQL dans : Supabase Dashboard > SQL Editor > New query
-- Puis clique sur "Run"
-- ============================================================

-- Ressources (cours, exercices, PDFs…)
create table if not exists resources (
  id          uuid primary key default gen_random_uuid(),
  matiere     text not null check (matiere in ('maths', 'infos')),
  titre       text not null,
  description text,
  url         text,
  file_name   text,
  type        text not null default 'cours' check (type in ('cours', 'exercice', 'ressource', 'rendu')),
  deadline    date,
  chap        text,
  added_by    text not null default 'prof' check (added_by in ('prof', 'eleve')),
  created_at  timestamptz default now()
);

-- Chapitres du programme
create table if not exists chapters (
  id         uuid primary key default gen_random_uuid(),
  matiere    text not null check (matiere in ('maths', 'infos')),
  num        text,
  titre      text not null,
  created_at timestamptz default now()
);

-- Tickets (questions, sujets à réviser…)
create table if not exists tickets (
  id         uuid primary key default gen_random_uuid(),
  titre      text not null,
  description text,
  label      text not null default 'question' check (label in ('question', 'revision', 'erreur', 'autre')),
  statut     text not null default 'ouvert' check (statut in ('ouvert', 'fermé')),
  created_at timestamptz default now()
);

-- Commentaires des tickets
create table if not exists ticket_comments (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references tickets(id) on delete cascade,
  author     text not null check (author in ('Prof', 'Élève')),
  text       text not null,
  created_at timestamptz default now()
);

-- Journal de bord
create table if not exists journal (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  resume      text not null,
  a_preparer  text,
  objectifs   text,
  notes       text,
  note        integer check (note between 1 and 5),
  mood        integer check (mood between 0 and 4),
  duree       text,
  notions     text[],
  created_at  timestamptz default now()
);

-- Devoirs
create table if not exists devoirs (
  id          uuid primary key default gen_random_uuid(),
  titre       text not null,
  description text,
  matiere     text not null check (matiere in ('maths', 'infos')),
  deadline    date not null,
  url         text,
  done        boolean not null default false,
  created_at  timestamptz default now()
);

-- Paramètres (mot de passe prof, etc.)
create table if not exists settings (
  key   text primary key,
  value text not null
);

-- Mot de passe prof par défaut : prof2024
insert into settings (key, value)
values ('prof_pwd', 'prof2024')
on conflict (key) do nothing;

-- ============================================================
-- STORAGE — Bucket pour les PDFs
-- À faire manuellement dans : Storage > New bucket
--   Nom du bucket : pdfs
--   Public bucket : OUI (cocher "Public")
-- Puis colle ce SQL pour les policies :
-- ============================================================
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', true)
on conflict (id) do nothing;

create policy "public read pdfs"
  on storage.objects for select
  using (bucket_id = 'pdfs');

create policy "public upload pdfs"
  on storage.objects for insert
  with check (bucket_id = 'pdfs');

create policy "public delete pdfs"
  on storage.objects for delete
  using (bucket_id = 'pdfs');

-- ============================================================
-- Accès public (app privée entre 2 personnes, pas de compte)
-- ============================================================
alter table resources        enable row level security;
alter table chapters         enable row level security;
alter table tickets          enable row level security;
alter table ticket_comments  enable row level security;
alter table journal          enable row level security;
alter table devoirs          enable row level security;
alter table settings         enable row level security;

-- Tout le monde peut lire et écrire (accès contrôlé par le mot de passe prof dans l'app)
create policy "public_all" on resources        for all using (true) with check (true);
create policy "public_all" on chapters         for all using (true) with check (true);
create policy "public_all" on tickets          for all using (true) with check (true);
create policy "public_all" on ticket_comments  for all using (true) with check (true);
create policy "public_all" on journal          for all using (true) with check (true);
create policy "public_all" on devoirs          for all using (true) with check (true);
create policy "public_all" on settings         for all using (true) with check (true);
