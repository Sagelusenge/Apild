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
5. Configurer séparément les variables SMTP de l’API si les e-mails doivent partir : `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`. Ne jamais mettre le mot de passe SMTP dans Git.
6. Contrôler `https://<api>.onrender.com/health/database`, puis ouvrir le site et tester une page publique et la connexion.

Le compte manager est `sagelusenge@gmail.com`. Son mot de passe initial est `ADMIN_INITIAL_PASSWORD` dans les variables secrètes de Render et doit être remplacé dès la première connexion. Si l’ancien compte utilisait encore le mot de passe de démonstration, il est automatiquement réinitialisé au démarrage. Un mot de passe déjà changé n’est pas écrasé.

## Limites importantes du plan gratuit

Le Web Service gratuit se met en veille et son système de fichiers local est éphémère. Les images, avatars et documents téléversés dans `backend/uploads` ne sont donc **pas persistants** après redéploiement. Les rappels par tâche de fond ne sont pas fiables sur un service qui se met en veille. Pour une exploitation réelle, prévoir un stockage objet persistant et un service qui tourne en continu ; ne pas annoncer ces fonctions comme garanties sur cette configuration de démonstration.

Les secrets de base de données et SMTP déjà partagés dans une conversation ou une capture d’écran doivent être renouvelés après la mise en ligne.
