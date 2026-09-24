# Déploiement APILD : Render + Aiven

`render.yaml` définit deux services indépendants dans le même Blueprint Render :

- `apild-api` : API Node.js, déployée comme Web Service ;
- `apild-web` : application React, déployée comme Static Site avec réécriture des routes vers `index.html`.

Le site reçoit automatiquement l’URL publique de l’API via `VITE_API_ORIGIN`. L’API autorise l’origine du site via `FRONTEND_URL`. Les JWT et le mot de passe initial du manager sont générés par Render et ne figurent pas dans Git.

## Préparer Aiven

1. Vérifier que le service MySQL est actif. La présence du service Aiven ne prouve pas que le schéma APILD a déjà été importé.
2. Choisir la base Aiven à utiliser (`defaultdb` si aucune base APILD n’a été créée). Le bootstrap crée les tables dans la base indiquée par `DB_NAME` ; il ne crée pas la base elle-même.
3. Télécharger le certificat CA du service Aiven. Le contenu PEM complet doit être fourni à Render dans `DB_SSL_CA`, avec ses lignes `BEGIN CERTIFICATE` et `END CERTIFICATE`.
4. Conserver le mot de passe Aiven hors du dépôt Git.

## Créer les services Render

1. Pousser la branche contenant `render.yaml` sur GitHub.
2. Dans Render : **New > Blueprint**, sélectionner `Sagelusenge/Apild` et la branche `main`.
3. Saisir les variables demandées pour l’API : `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL_CA`. Elles sont marquées `sync: false` et ne sont pas commitées.
4. Appliquer le Blueprint. Au démarrage, l’API initialise le schéma si nécessaire, applique les migrations puis sécurise/provisionne le compte manager.
5. Les fonctions e-mail sont actuellement désactivées sur Render (`EMAIL_FEATURES_ENABLED=false` et `VITE_EMAIL_FEATURES_ENABLED=false`) : ne pas attendre l’envoi des invitations, rappels, codes ou newsletters sur cet hébergement. Elles restent disponibles en local avec un SMTP valide. Ne jamais mettre le mot de passe SMTP dans Git.
6. Contrôler `https://<api>.onrender.com/health/database`, puis ouvrir le site et tester une page publique et la connexion.

Le compte manager est `sagelusenge@gmail.com`. Son mot de passe initial est `ADMIN_INITIAL_PASSWORD` dans les variables secrètes de Render et doit être remplacé dès la première connexion. Si l’ancien compte utilisait encore le mot de passe de démonstration, il est automatiquement réinitialisé au démarrage. Un mot de passe déjà changé n’est pas écrasé.

Pour le premier accès, ouvrir **Render > apild-api > Environment**, afficher puis copier `ADMIN_INITIAL_PASSWORD` sans le partager. Se connecter sur `https://apild-web.onrender.com/connexion` avec l'adresse du manager et ce secret ; l'application demande ensuite un nouveau mot de passe fort. Le mot de passe de démonstration ne fonctionne pas en production. Si l'API gratuite était en veille, attendre son réveil (jusqu'à environ une minute) puis réessayer. Si le mot de passe personnel a déjà été changé, `ADMIN_INITIAL_PASSWORD` ne le remplace plus : utiliser le nouveau mot de passe ou la récupération par e-mail, après configuration SMTP.

Les e-mails APILD (code de réinitialisation, invitation, réunion, échéance de projet, newsletter et nouvel article) utilisent un modèle commun dans l’installation locale. Sur Render, les parcours correspondants sont masqués et l’envoi désactivé. Une future activation nécessite un fournisseur SMTP joignable et un traitement des tâches de fond fiable ; `ENABLE_JOBS=false` dans le Blueprint gratuit.

## Limites importantes du plan gratuit

Le Web Service gratuit se met en veille et son système de fichiers local est éphémère. Les nouveaux médias et avatars que l’application stocke en base résistent au redéploiement, mais les anciens fichiers enregistrés uniquement dans `backend/uploads` peuvent être perdus. Les rappels par tâche de fond ne sont pas fiables sur un service qui se met en veille. Pour une exploitation réelle, prévoir un stockage objet persistant et un service qui tourne en continu ; ne pas annoncer ces fonctions comme garanties sur cette configuration de démonstration.

La migration `20260924_hr_contracts_and_three_roles.sql` conserve les anciens rôles dans la base mais ne permet l’accès qu’à `admin`, `communication` et `rh`. Les comptes seulement `staff` ne sont pas promus et doivent être réattribués par un admin. Le démarrage du backend lance `db:migrate` avant l’API ; vérifier les logs et la route `/health/database` après redéploiement.

Les secrets de base de données et SMTP déjà partagés dans une conversation ou une capture d’écran doivent être renouvelés après la mise en ligne.
