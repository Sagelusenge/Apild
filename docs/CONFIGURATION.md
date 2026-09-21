# Configuration APILD

Ce document decrit les variables d'environnement attendues. Les valeurs reelles et les secrets restent exclusivement dans `backend/.env` et `frontend/.env`. Ils ne doivent jamais etre copies dans la documentation, les journaux, les captures d'ecran ou le depot Git.

La configuration locale a ete verifiee avec MariaDB, l'API Express et l'authentification SMTP. Pour Gmail, utilisez `smtp.gmail.com`, le port `587`, `SMTP_SECURE=false`, l'adresse Gmail complete comme utilisateur et un mot de passe d'application Google comme mot de passe SMTP. Le mot de passe ordinaire du compte Gmail ne doit pas etre utilise.

## Backend

Le fichier de reference est `backend/.env.example`.

### Application et securite

| Variable | Role | Recommandation de production |
| --- | --- | --- |
| `NODE_ENV` | Environnement d'execution | `production` |
| `PORT` | Port HTTP interne de l'API | `4000` ou valeur de l'hebergeur |
| `APP_URL` | URL publique de l'API | URL HTTPS finale |
| `FRONTEND_URL` | Origines autorisees par CORS | URL HTTPS du frontend, valeurs separees par des virgules si necessaire |
| `TRUST_PROXY` | Prise en compte du reverse proxy | Activer uniquement derriere un proxy maitrise |
| `JWT_ACCESS_SECRET` | Signature des jetons courts | Secret aleatoire unique de 32 caracteres minimum |
| `JWT_REFRESH_SECRET` | Signature des jetons de renouvellement | Secret different du precedent, 32 caracteres minimum |
| `BCRYPT_ROUNDS` | Cout de hachage des mots de passe | `12` par defaut |
| `ALLOW_PUBLIC_REGISTRATION` | Autorise l'inscription libre | Conserver `false` sauf besoin valide |

Ne jamais reutiliser un secret entre le developpement, les tests et la production. Une rotation de `JWT_REFRESH_SECRET` deconnecte toutes les sessions existantes.

### MariaDB

| Variable | Role |
| --- | --- |
| `DB_HOST` / `DB_PORT` | Adresse du serveur MariaDB |
| `DB_USER` / `DB_PASSWORD` | Compte applicatif dedie et son secret |
| `DB_NAME` | Base principale, normalement `apild_platform` |
| `DB_CONNECTION_LIMIT` | Taille maximale du pool de connexions |
| `DB_SSL` | Chiffrement de la connexion distante |
| `DB_SSL_REJECT_UNAUTHORIZED` | Verification du certificat du serveur |
| `DB_SSL_CA` | Certificat CA PEM de la base distante, requis avec vérification TLS stricte |

En production, utiliser le compte a privileges limites documente dans `docs/DATABASE.md`, et non `root`. Pour Aiven, télécharger le certificat CA, le définir dans `DB_SSL_CA`, puis garder `DB_SSL=true` et `DB_SSL_REJECT_UNAUTHORIZED=true`.

### SMTP

Pour le port `587`, utiliser `SMTP_SECURE=false` : la connexion est elevee en STARTTLS. Pour le port `465`, utiliser `SMTP_SECURE=true`.

Configuration avec mot de passe SMTP ou mot de passe d'application :

```env
SMTP_HOST=smtp.fournisseur.tld
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=adresse@domaine.tld
SMTP_PASSWORD=SECRET_FOURNI_PAR_LE_PRESTATAIRE
SMTP_AUTH_TYPE=password
MAIL_FROM=APILD <adresse@domaine.tld>
```

Configuration OAuth2 :

```env
SMTP_AUTH_TYPE=oauth2
SMTP_CLIENT_ID=IDENTIFIANT_APPLICATION
SMTP_CLIENT_SECRET=SECRET_APPLICATION
SMTP_REFRESH_TOKEN=JETON_DE_RENOUVELLEMENT
SMTP_ACCESS_TOKEN=
```

Apres configuration, un administrateur peut tester l'envoi avec `POST /api/settings/test-email`.

### Fichiers, limites et taches planifiees

| Variable | Role |
| --- | --- |
| `UPLOAD_MAX_SIZE_MB` | Taille maximale d'un fichier accepte |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Limitation generale des requetes |
| `AUTH_RATE_LIMIT_MAX` | Limitation renforcee de l'authentification |
| `LOG_LEVEL` | Niveau des journaux applicatifs |
| `ENABLE_JOBS` | Active les traitements planifies : reprises newsletter, rappels de réunion, échéances de projet et file d’invitations |

Après avoir validé SMTP avec `POST /api/settings/test-email`, définir `ENABLE_JOBS=true` puis redémarrer l’API pour envoyer les invitations et rappels planifiés. Laisser cette valeur à `false` pendant les essais évite tout envoi extérieur involontaire.

## Frontend

Le frontend ne doit contenir aucun secret. Les variables Vite sont integrees au code livre au navigateur et sont donc publiques.

```env
VITE_API_URL=http://localhost:4000/api
# En production Render, préférer VITE_API_ORIGIN=https://api.example.org : le frontend ajoute /api.
```

En production, remplacer cette valeur par l'URL HTTPS publique de l'API.

## Verification avant production

1. Retirer ou modifier tous les comptes de demonstration.
2. Utiliser HTTPS pour le frontend et l'API.
3. Utiliser un compte MariaDB dedie et activer TLS pour une base distante.
4. Configurer des secrets JWT differents et aleatoires.
5. Verifier CORS avec le domaine frontend exact.
6. Tester l'email, la connexion, le renouvellement de session et les droits de chaque role.
7. Activer et tester les sauvegardes de la base et des documents.
