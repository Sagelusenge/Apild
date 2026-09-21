# Rôles et autorisations APILD

Les droits sont toujours vérifiés par l'API. L'interface masque les espaces
inadaptés, mais elle ne remplace jamais ce contrôle côté serveur.

| Rôle | Espace principal | Responsabilités |
| --- | --- | --- |
| **Manager APILD** (`admin`) | `/admin` | Pilote les projets, tâches, calendrier et équipe ; gère les comptes, rôles, le journal d’audit et toutes les données de la plateforme. Seul ce rôle peut bloquer ou réactiver un compte. |
| **Communication** (`communication`) | `/communication` | Prépare et publie les articles, médias et newsletters ; suit l’audience anonyme, les abonnements et les messages de contact. La publication d’un article déclenche la diffusion vers les abonnés actifs ; il peut retirer une publication du site sans l’effacer. |
| **Personnel** (`staff`) | `/staff` | Consulte les projets, ses tâches, documents et rapports ; met à jour les tâches qui lui sont confiées. Il ne gère ni utilisateurs, ni rôles, ni accès. |

## Points importants

- Un compte peut recevoir plusieurs rôles ; ses autorisations sont alors cumulées.
- Les anciens comptes `manager` sont consolidés dans le rôle `admin` ; les anciennes URLs `/manager/*` redirigent vers `/admin`.
- Seul le rôle Manager APILD attribue les rôles, crée les comptes et bloque ou réactive un autre compte. Il ne peut pas se bloquer lui-même.
- Les suppressions de données métier sont en général des archivages logiques : elles restent traçables dans le journal d'audit.
- Le journal d'audit est volontairement en lecture seule.
- Les rôles système (`admin`, `communication`, `staff`) ne doivent pas être supprimés.

## Parcours recommandés

- **Manager APILD** : `/admin`
- **Communication** : `/communication`
- **Personnel** : `/staff`
