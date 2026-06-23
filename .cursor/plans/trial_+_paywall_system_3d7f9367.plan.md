---
name: Trial + Paywall System
overview: Ajouter un essai gratuit de 14 jours à l'inscription, bloquer l'accès à l'app après expiration et afficher une page de tarifs avec plans Starter/Pro/Annuel (paiement simulé, prêt pour Stripe).
todos:
  - id: sql-billing
    content: "Migration SQL 004: ajouter trial_ends_at, subscription_status à profiles + mettre à jour trigger handle_new_user"
    status: completed
  - id: types
    content: Mettre à jour Profile dans src/types/database.ts avec les champs billing
    status: completed
  - id: app-layout
    content: Modifier src/app/(app)/layout.tsx pour vérifier le statut d'essai et rediriger si expiré
    status: completed
  - id: trial-banner
    content: Créer src/components/layout/trial-banner.tsx avec barre de progression et jours restants
    status: completed
  - id: dashboard-shell
    content: Ajouter trialDaysLeft prop + TrialBanner dans dashboard-shell.tsx
    status: completed
  - id: pricing-page
    content: Créer src/app/pricing/page.tsx avec les 3 cartes tarifaires (Starter/Pro + annuel)
    status: completed
  - id: billing-api
    content: Créer src/app/api/billing/upgrade/route.ts (mock upgrade)
    status: completed
  - id: run-sql
    content: "Instruction à l'utilisateur: exécuter 004_billing.sql dans le SQL Editor Supabase"
    status: completed
isProject: false
---

# Système d'essai gratuit + Paywall

```mermaid
flowchart TD
```



