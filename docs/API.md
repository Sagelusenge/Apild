# API APILD

URL locale par defaut : `http://localhost:4000/api`

Toutes les reponses JSON suivent la forme `{ success, message, data, meta? }`. Les listes acceptent `page`, `limit`, `search`, `sortBy`, `sortOrder` ainsi que les filtres propres a chaque ressource.

## Authentification

| Methode | Route | Description |
| --- | --- | --- |
| POST | `/auth/login` | Connexion |
| POST | `/auth/register` | Désactivée : seul l’admin crée les comptes |
| POST | `/auth/refresh` | Renouvellement des jetons |
| POST | `/auth/logout` | Revocation du refresh token |
| GET | `/auth/me` | Profil, roles et permissions |
| PATCH | `/auth/profile` | Mise a jour de son propre prenom, nom et fonction |
| POST | `/auth/profile/avatar` | Téléversement de sa propre photo de profil (`multipart/form-data`, champ `avatar`) |
| POST | `/auth/forgot-password` | Envoie un code de réinitialisation à 6 chiffres |
| POST | `/auth/reset-password` | Nouveau mot de passe, avec e-mail et code à 6 chiffres |
| POST | `/auth/change-password` | Definit le mot de passe personnel lors de la premiere connexion, ou le modifie ensuite |

Les routes protegees attendent `Authorization: Bearer <accessToken>`.

Lorsqu’un responsable cree ou reinitialise un compte, la reponse de connexion expose `user.must_change_password=true`. Seule la route `/auth/change-password` reste accessible jusqu’au choix d’un mot de passe personnel. Le nouveau mot de passe doit contenir au moins 12 caracteres, une majuscule, une minuscule, un chiffre et un caractere special, sans espace.

`PATCH /auth/profile` ne cible jamais un identifiant fourni par le client et ne permet pas de modifier l’email, le statut, les roles ou les permissions. Ces attributs restent reserves a l’administration des comptes.

La photo de profil accepte uniquement les images JPEG, PNG et WebP, jusqu’à 5 Mo. Le type MIME, la signature binaire et le nom de fichier sont contrôlés côté serveur ; l’ancienne photo gérée par APILD est supprimée après une mise à jour réussie.

La récupération de mot de passe crée un code aléatoire à 6 chiffres, valable 15 minutes. Seul son condensat SHA-256 est conservé ; cinq essais incorrects au maximum sont autorisés. Le corps attendu par les nouvelles interfaces est `{ "email", "code", "password" }`. Les anciens liens déjà émis restent acceptés jusqu’à leur expiration.

## Ressources CRUD

Chaque ressource ci-dessous expose `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `PATCH /:id` et `DELETE /:id`, sous controle des permissions :

| Ressource | Route |
| --- | --- |
| Utilisateurs | `/users` |
| Roles | `/roles` (lecture et modification des trois rôles actifs uniquement ; création et suppression désactivées) |
| Projets | `/projects` |
| Taches | `/tasks` |
| Evenements | `/events` |
| Partenaires | `/partners` |
| Interventions | `/interventions` |
| Articles | `/articles` |
| Medias | `/media` |
| Newsletters | `/newsletter` |
| Notifications | `/notifications` |
| Documents | `/documents` |
| Rapports | `/reports` |
| Messages de contact | `/contact` |
| Parametres | `/settings` |

Les suppressions sont logiques pour les donnees metier sensibles et physiques pour les ressources de configuration appropriees.

Les references de projets, taches, interventions, articles, contrats et rapports sont generees exclusivement par l’API. Les codes des rôles actifs sont fixes : `admin`, `communication`, `rh`. L’avancement d’un projet est calcule en direct a partir de ses dates de debut et de fin ; une valeur fournie par le navigateur est ignoree.

Une tâche est un élément de type *to-do* : `project_id` est facultatif. Une réunion doit contenir une date et une heure futures, une fin postérieure au début, et peut inclure un `reminder_minutes` compris entre `0` et `43200`.

## Sous-ressources

- Projets : `/:id/summary`, `/:id/members`, `/:id/domains`
- Taches : `/:id/assignees`, `/:id/comments`
- Evenements : `/actors` (acteurs actifs ; alias historique `/staff`), `/:id/participants`, `PUT /:id/participants` avec `{ "user_ids": [1, 2] }`. Les rôles communication et RH peuvent lire leur calendrier et leurs réunions via `events.read`.
- Articles : `/categories`, `PATCH /:id/unpublish` pour retirer une publication du site public sans la supprimer ; l’article passe à `archived`, reste modifiable et l’action est auditée.
- Interactions d’actualité publiques : `GET /articles/:id/engagement?visitor_id=<uuid>`, `GET /articles/:id/comments`, `POST /articles/:id/comments`, `POST /articles/:id/like` avec `{ "visitor_id": "uuid" }`, et `POST /articles/:id/share`.
- Interventions : `/domains`
- Newsletters : `/subscribe`, `/unsubscribe` (public), `/subscribers`, `/:id/send`
- Notifications : `/read-all`
- Medias : `/upload`
- Documents : `/upload`
- Rapports : `/:id/pdf` (état imprimable avec en-tête APILD et pagination)
- RH : `/hr/contracts/:id/pdf` (fiche contractuelle de l’acteur)
- Roles : `/permissions`, `/:id/permissions`
- Parametres : `/test-email` pour verifier la configuration SMTP

## Statistiques et audit

- `/statistics/overview`
- `/statistics/projects`
- `/statistics/communication`
- `/statistics/communication-dashboard` : audience des 30 derniers jours, pages/liens les plus consultes, abonnements et etat editorial ;
- `/statistics/newsletters`
- `/audit-logs`

Le journal d'audit est volontairement en lecture seule.

## Routes publiques

- `/public/projects`
- `/public/projects/:id`
- `/public/interventions`
- `/public/events`
- `/public/partners`
- `/public/settings`
- `/public/impact`
- `/articles`
- `/articles/:id/engagement`, `/articles/:id/comments`, `/articles/:id/like`, `/articles/:id/share` : interactions disponibles uniquement pour les articles publiés. Les likes sont limités à un par navigateur grâce à un condensat irréversible de son identifiant local ; l’e-mail facultatif d’un commentaire n’est jamais renvoyé par l’API publique.
- `/newsletter/subscribe`
- `/contact`
- `/analytics/track` : mesure publique anonymisee des pages et clics publics ; accepte uniquement les chemins publics, sans IP, user-agent, parametres URL ni contenu de formulaire.

## Publication et emails aux abonnés

Lorsqu’un utilisateur autorisé crée ou passe un article a `published`, APILD fige la liste des abonnes actifs, puis lance une diffusion dedupliquee. Chaque destinataire est trace individuellement. Les reponses SMTP refusees, l’absence de SMTP et les erreurs sont enregistrees comme des echecs, jamais comme des envois reussis.

Les envois interrompus sont repris au redemarrage. Avec `ENABLE_JOBS=true`, un traitement periodique reprend aussi les echecs temporaires, avec trois tentatives au maximum et quinze minutes entre deux tentatives. L’email contient un lien de desabonnement individuel.

## Emails opérationnels et calendrier

La création d’un acteur actif place une invitation de connexion dans la file d’envoi : elle contient un bouton vers la connexion et rappelle que le mot de passe temporaire doit être remplacé lors du premier accès, sans jamais afficher ce mot de passe dans l’e-mail. La récupération de mot de passe est différente : son code de confirmation est envoyé immédiatement, car il expire après 15 minutes.

Lorsqu’un responsable sélectionne des membres du personnel pour une réunion, les invitations et les rappels sont placés dans une file durable. Le traitement planifié envoie au plus 25 messages par cycle, crée aussi une notification interne et ne contacte jamais SMTP pendant les tests. Avec `ENABLE_JOBS=true`, les rappels de réunion sont vérifiés chaque minute et les échéances de projet sont préparées chaque matin à 07:00 (Africa/Lubumbashi). Les messages restent en attente tant que les jobs sont désactivés ; une configuration SMTP valide est nécessaire pour leur délivrance.

## Commandes de verification

```powershell
cd backend
npm run check
npm test
npm audit
```

Les tests d'integration MariaDB sont conditionnels et s'activent avec `RUN_DB_TESTS=true` et les variables `DB_*` pointant vers une base de test.

## Interventions et ressources humaines

- `POST /api/interventions` et `PATCH /api/interventions/:id` : droits `interventions.create` et `interventions.update`, attribués au manager et à la communication. Le droit de suppression `interventions.manage` reste réservé au manager. La photo est téléversée avec `POST /api/media/upload`, puis son `public_url` est enregistré dans `image_url` de l’intervention.
- `GET /api/public/interventions` : ne renvoie que les interventions terminées, y compris leur photo lorsqu’elle existe. Les bénéficiaires de l’accueil sont calculés depuis ces mêmes interventions, et non depuis une saisie indépendante.
- `GET /api/hr/overview`, `GET /api/hr/users`, `GET|POST /api/hr/{employees|leaves|contracts}` et `GET|PATCH|DELETE /api/hr/{employees|leaves|contracts}/:id` : réservés aux rôles `admin` et `rh` avec la permission `hr.manage`. Les suppressions sont logiques. `GET /api/hr/contracts/:id/pdf` produit une fiche imprimable pour le contrat demandé.
- Les champs de salaire contractuel ne constituent pas un moteur de paie. Aucun net légal n’est calculé ou validé par ces routes.

## Configuration SMTP

`SMTP_HOST` est le nom du serveur d'envoi fourni par l'hebergeur de l'adresse email. Avec le port `587`, conserver `SMTP_SECURE=false` : Nodemailer utilise alors STARTTLS. Avec le port `465`, utiliser `SMTP_SECURE=true`.

Exemple Gmail ou Google Workspace :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-adresse@gmail.com
SMTP_PASSWORD=VOTRE_MOT_DE_PASSE_APPLICATION
SMTP_AUTH_TYPE=password
MAIL_FROM=APILD <votre-adresse@gmail.com>
```

Exemple Microsoft 365 :

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-adresse@votre-domaine.org
SMTP_PASSWORD=VOTRE_SECRET_SMTP
SMTP_AUTH_TYPE=password
MAIL_FROM=APILD <votre-adresse@votre-domaine.org>
```

Pour un fournisseur imposant OAuth2, utiliser `SMTP_AUTH_TYPE=oauth2` puis renseigner `SMTP_CLIENT_ID`, `SMTP_CLIENT_SECRET` et `SMTP_REFRESH_TOKEN` ou `SMTP_ACCESS_TOKEN`.
