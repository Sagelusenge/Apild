# Déploiement AWS : Amplify, App Runner, RDS et S3

L’application APILD est déployée intégralement sur AWS, sans dépendance Render ni Aiven :

- **AWS Amplify Hosting** héberge le frontend React statique ;
- **AWS App Runner** exécute l’API Express ;
- **Amazon RDS for MySQL** conserve les données ;
- **Amazon S3** conserve durablement les avatars, images et documents ;
- **AWS Systems Manager Parameter Store** conserve les secrets ;
- **Amazon SES** peut assurer les emails transactionnels.

La région de travail sélectionnée dans la console est `eu-north-1` (Europe, Stockholm). Les instances EC2 déjà présentes ne sont pas utilisées ni modifiées par cette architecture.

## 1. Réseau, base de données et stockage

1. Dans RDS, créer une instance MySQL privée nommée `apild-db`, avec la base initiale `apild_platform`, le chiffrement, les sauvegardes automatiques et la protection contre la suppression activés.
2. Conserver l’accès public désactivé. Placer RDS dans au moins deux sous-réseaux privés du VPC.
3. Créer un groupe de sécurité `apild-db-sg` : une seule règle entrante MySQL/TCP `3306`, dont la source est le groupe `apild-apprunner-sg`.
4. Dans App Runner, créer un connecteur VPC utilisant ces sous-réseaux et `apild-apprunner-sg`. L’API publique reste accessible, mais seule l’API atteint RDS.
5. Créer le bucket privé `apild-media-<identifiant-unique>` dans `eu-north-1`, avec accès public bloqué, chiffrement par défaut et versioning. Le backend diffuse les images par son API : aucune politique publique S3 n’est nécessaire.
6. Créer un point de terminaison VPC de type **Gateway** pour S3, associé aux tables de routage des sous-réseaux du connecteur App Runner. Il permet à l’API de joindre son bucket depuis le VPC privé. Prévoir aussi une sortie NAT ou les points de terminaison nécessaires si l’API doit appeler d’autres services externes depuis ce VPC.
7. Télécharger le bundle CA Amazon RDS de la région Stockholm et le stocker comme paramètre `DB_SSL_CA`. La validation TLS reste obligatoire.

Avant de lancer les ressources, vérifier les plans et coûts affichés par AWS. RDS, App Runner, Amplify, S3 et les transferts peuvent être facturés selon le plan choisi.

## 2. Paramètres AWS Systems Manager

Dans **Systems Manager > Parameter Store**, créer les paramètres `SecureString` suivants dans `eu-north-1` :

- `/apild/production/DB_HOST` : endpoint RDS sans port ;
- `/apild/production/DB_USER` : compte MySQL applicatif ;
- `/apild/production/DB_PASSWORD` ;
- `/apild/production/DB_SSL_CA` : bundle CA RDS complet ;
- `/apild/production/JWT_ACCESS_SECRET` ;
- `/apild/production/JWT_REFRESH_SECRET` ;
- `/apild/production/S3_BUCKET` : nom du bucket créé à l’étape 1.

Créer un rôle d’instance App Runner minimal. Il doit lire uniquement ces paramètres et accéder uniquement aux objets `uploads/*` du bucket APILD avec `s3:GetObject`, `s3:PutObject` et `s3:DeleteObject`. Avec une clé KMS personnalisée, ajouter uniquement le droit `kms:Decrypt` correspondant.

Ne placer aucun mot de passe, certificat ou jeton dans GitHub, `apprunner.yaml`, Amplify ou le frontend.

## 3. API App Runner

1. Ouvrir **App Runner > Create service > Source code repository**, connecter GitHub et sélectionner `Sagelusenge/Apild`, branche `main`, répertoire `/`.
2. Choisir **Use a configuration file** : App Runner lit [apprunner.yaml](../apprunner.yaml).
3. Associer le rôle d’instance SSM/S3 et le connecteur VPC créés à l’étape 1.
4. Régler le health check sur `/health`, puis créer le service `apild-api`.
5. Lorsque l’URL HTTPS App Runner est disponible, ajouter `APP_URL` à la configuration d’exécution de l’API avec cette URL.

Au premier démarrage, App Runner initialise le schéma uniquement si la base RDS est vide, puis applique les migrations. Le même démarrage est idempotent lors des déploiements suivants.

## 4. Frontend Amplify

1. Dans **AWS Amplify > Create new app > GitHub**, sélectionner le même dépôt et la branche `main`.
2. Cocher **My app is a monorepo** et renseigner `frontend`. Amplify renseigne ainsi `AMPLIFY_MONOREPO_APP_ROOT=frontend`.
3. Garder le fichier [amplify.yml](../amplify.yml), qui exécute `npm ci`, construit Vite et publie `frontend/dist`.
4. Ajouter la variable de build `VITE_API_ORIGIN` avec l’URL HTTPS App Runner, sans `/api` final.
5. Dans **Rewrites and redirects**, ajouter la réécriture SPA : source `/<*>`, cible `/index.html`, statut `200`.
6. Déployer, puis copier l’URL HTTPS Amplify obtenue dans la variable App Runner `FRONTEND_URL` et redéployer l’API.

Le frontend ajoute automatiquement `/api` à `VITE_API_ORIGIN`. `FRONTEND_URL` est aussi l’origine CORS et la base des liens figurant dans les emails.

## 5. Emails avec Amazon SES

Après avoir vérifié le domaine ou l’adresse expéditrice dans Amazon SES et quitté le sandbox si nécessaire, créer les paramètres SMTP appropriés (hôte SMTP SES de Stockholm, utilisateur SMTP, mot de passe SMTP et expéditeur). Les passer à App Runner, activer `ENABLE_JOBS=true`, puis tester l’envoi depuis les paramètres de la plateforme.

## Vérifications finales

1. `https://<app-runner>/health` répond avec `success: true`.
2. `https://<app-runner>/health/database` confirme la connexion TLS à RDS.
3. Le site Amplify charge les actualités, les images S3 et la connexion sans erreur CORS.
4. Un avatar téléversé, un média d’article et un document restent disponibles après un redéploiement App Runner.
5. Vérifier la connexion, les droits par rôle, la réinitialisation de mot de passe et les emails avant l’ouverture au public.
