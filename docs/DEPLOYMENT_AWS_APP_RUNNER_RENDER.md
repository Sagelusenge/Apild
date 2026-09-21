# Déploiement AWS App Runner + Render + Aiven

L’architecture de production est maintenant séparée ainsi :

- AWS App Runner : API Express (`backend`) ;
- Render Static Site : frontend React (`frontend`) ;
- Aiven for MySQL : base de données distante, chiffrée et vérifiée avec son certificat CA.

## 1. Préparer les secrets dans AWS

Dans **AWS Systems Manager Parameter Store**, créer les paramètres de type `SecureString` dans la même région que le service :

- `/apild/production/DB_PASSWORD` ;
- `/apild/production/DB_SSL_CA` : contenu complet du certificat CA téléchargé dans Aiven ;
- `/apild/production/JWT_ACCESS_SECRET` ;
- `/apild/production/JWT_REFRESH_SECRET`.

Créer ou choisir le rôle d’instance App Runner, puis lui accorder uniquement `ssm:GetParameters` sur ces entrées et `kms:Decrypt` si une clé KMS personnalisée est utilisée. Ne jamais écrire ces valeurs dans GitHub ou dans `apprunner.yaml`.

## 2. Créer l’API AWS App Runner

1. Dans AWS App Runner, sélectionner **Create service > Source code repository > GitHub**.
2. Autoriser le connecteur GitHub AWS, choisir `Sagelusenge/Apild`, branche `main` et répertoire source `/`.
3. Choisir **Use a configuration file** : App Runner utilisera `apprunner.yaml`.
4. Choisir une région AWS proche de l’équipe et créer le service sous le nom `apild-api`.
5. Le fichier `apprunner.yaml` référence automatiquement les quatre paramètres SSM. Associer au service le rôle d’instance qui peut les lire.
6. Ajouter les valeurs non secrètes après réception des URL :
   - `APP_URL` = URL HTTPS App Runner ;
   - `FRONTEND_URL` = URL HTTPS Render du site statique.
7. Définir le contrôle de santé HTTP sur `/health`, puis déployer.

Au démarrage, le script d’initialisation crée le schéma APILD seulement si Aiven est vide, puis applique les migrations. Les comptes de démonstration restent désactivés et le compte manager impose un changement de mot de passe.

## 3. Créer le frontend Render

1. Dans Render, créer un Blueprint depuis `main`.
2. Le Blueprint crée uniquement `apild-web-sagel` comme **Static Site**.
3. Lorsque Render demande `VITE_API_ORIGIN`, saisir l’URL HTTPS App Runner, sans `/api` final.
4. Déployer, puis reprendre l’URL Render obtenue pour compléter `FRONTEND_URL` dans App Runner et redéployer l’API.

Le frontend ajoute automatiquement `/api` à `VITE_API_ORIGIN`. Les routes React sont réécrites vers `index.html` par Render.

## Vérifications

1. `https://<url-app-runner>/health` répond avec `success: true`.
2. `https://<url-app-runner>/health/database` confirme l’accès Aiven.
3. Le site Render charge les actualités et permet la connexion sans erreur CORS.
4. Après configuration SMTP, ajouter les variables SMTP et `SMTP_PASSWORD` depuis SSM, passer `ENABLE_JOBS=true`, puis redéployer App Runner.
