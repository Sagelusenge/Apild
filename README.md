# APILD Platform

Plateforme de gestion des projets, interventions, communications et activites de l'APILD.

## Etat actuel

- Base principale : `Apild_bd.sql`
- API backend : Node.js, Express et MariaDB
- Frontend : React, Vite, React Router et Axios, inspire des maquettes du dossier `Maquette`

## Demarrage du backend

1. Importer `Apild_bd.sql` dans MariaDB.
2. Ouvrir `backend/.env` et remplacer au minimum `DB_PASSWORD`, les secrets JWT et, si necessaire, les parametres SMTP.
3. Demarrer l'API :

```powershell
cd backend
npm run dev
```

L'API ecoute par defaut sur `http://localhost:4000`. Les controles de disponibilite sont exposes sur `/health` et `/health/database`.

## Comptes de demonstration

Les comptes crees par le script SQL utilisent temporairement le mot de passe `password` :

- `admin@apild.test`
- `manager@apild.test`
- `communication@apild.test`
- `staff1@apild.test`
- `staff2@apild.test`

Ces comptes et leurs mots de passe doivent etre modifies ou supprimes avant tout deploiement en production.

La documentation des routes se trouve dans `docs/API.md`.

## Demarrage du frontend

Dans un second terminal :

```powershell
cd frontend
npm install
npm run dev
```

Le frontend est disponible sur `http://localhost:5173` et utilise l'API configuree dans `frontend/.env`.

Documentation complementaire :

- `docs/CONFIGURATION.md` : variables d'environnement et controles avant production ;
- `docs/FRONTEND.md` : architecture React, routes et commandes ;
- `docs/DATABASE.md` : securisation et exploitation MariaDB.
