# HealthFlow

Plateforme SaaS pour praticiens de santé indépendants (kinés, ostéopathes, médecins, etc.).

## Fonctionnalités MVP

- Landing page avec tarifs
- Authentification Supabase (email/mot de passe)
- Onboarding praticien (3 étapes)
- Dashboard avec statistiques et alertes
- Gestion patients (CRUD + segmentation auto)
- Calendrier des rendez-vous
- Questionnaires post-séance (lien public sécurisé)
- Assistant IA (Claude) — résumés, questions, analyse risques
- Paramètres cabinet
- Emails via Resend (rappels, questionnaires)

## Stack

- **Frontend:** Next.js 14, TypeScript, TailwindCSS, Shadcn/ui, React Query, Recharts
- **Backend:** Supabase (PostgreSQL + Auth)
- **IA:** Claude API (claude-sonnet-4-6)
- **Email:** Resend

## Installation

```bash
npm install
cp .env.example .env.local
# Remplir les variables d'environnement
```

### Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter les migrations dans le SQL Editor **dans l'ordre** :
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_triggers_functions.sql`
   - `supabase/migrations/003_storage.sql`
   - `supabase/migrations/004_billing.sql` *(essai gratuit 14 jours + abonnements)*
   - `supabase/migrations/005_clinical_workflows.sql` *(praticiens, consultations SOAP, dossiers médicaux, workflows)*
3. Copier URL, anon key et service role key dans `.env.local`

### Lancer en dev

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup, forgot-password
│   ├── (app)/           # Dashboard, patients, calendar, AI, settings
│   ├── onboarding/      # Configuration initiale
│   ├── q/[token]/       # Questionnaire public patient
│   └── api/             # Routes API
├── components/
├── lib/                 # Supabase, IA, email, utils
└── types/
```

## Déploiement

- **Frontend:** Vercel
- **Backend:** Supabase Cloud
- Configurer les variables d'environnement sur Vercel

## Licence

Propriétaire — HealthFlow
