# EduSpace

Application web privée pour centraliser le suivi entre un professeur et son élève.

## Fonctionnalités

- **Deux rôles** : élève (accès libre) et professeur (mot de passe)
- **Mathématiques & Informatique** : ressources par chapitre, avec date limite
- **Tickets** : système de questions/révisions (style GitHub Issues)
- **Journal de bord** : compte-rendu de chaque séance
- **Données partagées** en temps réel via Supabase

---

## Déploiement complet (environ 20 minutes)

### Étape 1 — Créer la base de données (Supabase)

1. Va sur [supabase.com](https://supabase.com) et crée un compte gratuit
2. Clique sur **"New project"**
3. Choisis un nom (ex: `eduspace`) et un mot de passe de base de données (note-le)
4. Région : choisis **EU West** (Europe) pour la latence
5. Attends que le projet soit prêt (~2 minutes)

6. Dans le menu de gauche, clique sur **SQL Editor**
7. Clique sur **"New query"**
8. Copie-colle **tout le contenu** du fichier `supabase_schema.sql`
9. Clique sur **"Run"** (bouton vert en bas à droite)
   → Tu dois voir "Success. No rows returned"

10. Dans le menu de gauche, clique sur **Settings → API**
11. Note les deux valeurs :
    - **Project URL** : `https://xxxxxxxxxxxx.supabase.co`
    - **anon public** key : `eyJhbGci...` (la clé longue sous "Project API keys")

---

### Étape 2 — Préparer le code sur ton ordinateur

1. **Installe Node.js** si ce n'est pas fait → [nodejs.org](https://nodejs.org) (prends la version LTS)

2. **Clone ou télécharge ce projet** dans un dossier sur ton PC

3. Dans le dossier du projet, crée un fichier nommé **`.env`** (à la racine, à côté de `package.json`)

4. Colle ce contenu dans `.env` en remplaçant par tes vraies valeurs :
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. Ouvre un terminal dans le dossier du projet et lance :
   ```bash
   npm install
   npm run dev
   ```

6. Ouvre [http://localhost:5173](http://localhost:5173) → l'app doit s'afficher ✅

> Mot de passe prof par défaut : **prof2024** (à changer dans Réglages)

---

### Étape 3 — Mettre le code sur GitHub

1. Va sur [github.com](https://github.com) et crée un **nouveau dépôt** (repository)
   - Nom : `eduspace`
   - Visibilité : **Private** (recommandé)
   - Ne coche rien d'autre

2. Dans le terminal, dans le dossier du projet :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TON_USERNAME/eduspace.git
   git push -u origin main
   ```
   > Remplace `TON_USERNAME` par ton nom d'utilisateur GitHub

3. Vérifie sur GitHub que les fichiers sont bien là ✅

> **Important** : Le fichier `.env` ne sera PAS uploadé sur GitHub (il est dans `.gitignore`).
> C'est normal et voulu — les clés API restent privées.

---

### Étape 4 — Déployer sur Vercel (mise en ligne gratuite)

1. Va sur [vercel.com](https://vercel.com) et crée un compte avec ton GitHub

2. Clique sur **"Add New Project"**

3. Sélectionne ton dépôt `eduspace`

4. Dans la section **"Environment Variables"**, ajoute tes deux variables :
   - `VITE_SUPABASE_URL` → colle ta Project URL
   - `VITE_SUPABASE_ANON_KEY` → colle ta clé anon

5. Clique sur **"Deploy"**

6. Attends ~1 minute → Vercel te donne une URL du type `https://eduspace-xxx.vercel.app`

7. **Partage cette URL avec ton élève** — c'est tout ! ✅

---

### Mises à jour futures

Après chaque modification du code :
```bash
git add .
git commit -m "Description de la modification"
git push
```
Vercel redéploie automatiquement à chaque push. Environ 30 secondes.

---

## Structure du projet

```
eduspace/
├── index.html                  # Point d'entrée HTML
├── vite.config.js              # Config Vite
├── package.json                # Dépendances
├── supabase_schema.sql         # SQL à exécuter dans Supabase
├── .env.example                # Template des variables d'environnement
├── .env                        # Tes vraies clés (ne pas commit !)
└── src/
    ├── main.jsx                # Point d'entrée React
    ├── index.css               # Styles globaux
    ├── App.jsx                 # Composant racine (routing + auth)
    ├── context/
    │   └── AppContext.jsx      # État global + toutes les requêtes Supabase
    ├── lib/
    │   └── supabase.js         # Client Supabase
    ├── shared/                 # Composants réutilisables
    │   ├── Icon.jsx
    │   ├── Modal.jsx
    │   ├── Sidebar.jsx
    │   └── ResourceCard.jsx
    └── views/                  # Pages de l'application
        ├── Accueil.jsx         # Dashboard
        ├── MatiereView.jsx     # Section Maths ou Infos
        ├── Tickets.jsx         # Système de tickets
        ├── Journal.jsx         # Journal de bord
        └── Settings.jsx        # Réglages (prof uniquement)
```

## FAQ

**Q : L'élève a-t-il besoin d'un compte ?**
Non. L'URL suffit. Seul le professeur a besoin d'un mot de passe pour débloquer les fonctions d'édition.

**Q : Les données sont-elles partagées en temps réel ?**
Oui. Les deux utilisateurs voient les mêmes données via Supabase. Un rechargement de page suffit pour voir les nouvelles entrées.

**Q : Puis-je uploader des PDFs directement ?**
L'app supporte les liens vers des fichiers externes (Google Drive, Dropbox, etc.). Pour l'upload direct, il faudrait activer Supabase Storage — c'est possible gratuitement mais demande une configuration supplémentaire.

**Q : Le plan gratuit Supabase est-il suffisant ?**
Largement. La limite gratuite est de 500 MB de base de données et 2 GB de bande passante par mois, ce qui représente des milliers d'entrées.
