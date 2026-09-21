# Déploiement Render + Aiven

Le dépôt contient `render.yaml` pour créer deux services Render séparés :

- `apild-api-sagel` : l’API Express ;
- `apild-web-sagel` : le frontend React livré comme site statique.

La base reste sur Aiven pour MySQL. Aucun mot de passe, certificat ou jeton n’est versionné.

## Première installation

1. Dans Render, créer un **Blueprint** depuis la branche `main` de `Sagelusenge/Apild`.
2. Render demande la valeur de `DB_PASSWORD` : saisir le mot de passe Aiven en cours, uniquement dans ce formulaire.
3. Télécharger le certificat CA depuis Aiven, le coller intégralement dans `DB_SSL_CA`, puis conserver `DB_SSL=true` et `DB_SSL_REJECT_UNAUTHORIZED=true`. L’API refuse de démarrer en production sans cette vérification TLS.
4. Valider le Blueprint. La commande de build initialise la base Aiven si elle est vide, puis applique les migrations.
5. Ouvrir l’URL publique attribuée par Render au service API, ajouter `/health` et vérifier que l’API répond. Ouvrir ensuite l’URL publique du site statique.

Les URL ne sont pas écrites en dur : le Blueprint les transmet automatiquement de l’API vers le frontend et inversement. Cela maintient CORS et les liens d’email corrects même après l’ajout d’un domaine personnalisé.

Le compte manager `sagelusenge@gmail.com` est créé lors d’une première initialisation et exige le changement immédiat du mot de passe temporaire. Les comptes `@apild.test` sont désactivés dans l’environnement public.

## Courriel et tâches planifiées

Une fois les identifiants SMTP renseignés dans le service API, définir `ENABLE_JOBS=true` et redéployer. Cela active les rappels, invitations, newsletters et alertes de fin de projet.

## Points d’exploitation

- Un service web Render gratuit se met en veille après inactivité ; il convient à une démonstration, pas à une production continue.
- Les fichiers déposés localement sur un service gratuit ne sont pas persistants. Prévoir un stockage objet pour les documents et avatars avant la mise en production commerciale.
- Après le premier déploiement, changer le mot de passe Aiven et celui du compte manager.
