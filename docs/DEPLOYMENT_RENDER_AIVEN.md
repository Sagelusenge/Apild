# Ancien déploiement Render + Aiven

Cette procédure est remplacée par [AWS App Runner + Render + Aiven](DEPLOYMENT_AWS_APP_RUNNER_RENDER.md). Le dépôt contient désormais `render.yaml` pour créer le frontend Render uniquement :

- `apild-web-sagel` : le frontend React livré comme site statique.

La base reste sur Aiven pour MySQL. Aucun mot de passe, certificat ou jeton n’est versionné.

## Première installation

Suivre le guide AWS App Runner pour créer l’API et saisir son URL dans `VITE_API_ORIGIN` lors de la création du Blueprint Render.

Le compte manager `sagelusenge@gmail.com` est créé lors d’une première initialisation et exige le changement immédiat du mot de passe temporaire. Les comptes `@apild.test` sont désactivés dans l’environnement public.

## Courriel et tâches planifiées

Une fois les identifiants SMTP renseignés dans le service API, définir `ENABLE_JOBS=true` et redéployer. Cela active les rappels, invitations, newsletters et alertes de fin de projet.

## Points d’exploitation

- Un service web Render gratuit se met en veille après inactivité ; il convient à une démonstration, pas à une production continue.
- Les fichiers déposés localement sur un service gratuit ne sont pas persistants. Prévoir un stockage objet pour les documents et avatars avant la mise en production commerciale.
- Après le premier déploiement, changer le mot de passe Aiven et celui du compte manager.
