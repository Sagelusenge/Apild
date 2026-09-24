# Rôles et autorisations APILD

Les droits sont toujours vérifiés par l'API. L'interface masque les espaces
inadaptés, mais elle ne remplace jamais ce contrôle côté serveur.

| Rôle | Espace principal | Responsabilités |
| --- | --- | --- |
| **Manager APILD** (`admin`) | `/admin` | Pilote les projets, tâches, calendrier et équipe ; gère les comptes, rôles, le journal d’audit et toutes les données de la plateforme. Seul ce rôle peut bloquer ou réactiver un compte. |
| **Communication** (`communication`) | `/communication` | Prépare et publie les articles, médias et newsletters ; documente les interventions avec photo et bénéficiaires, sans droit de suppression ; suit l’audience anonyme, les abonnements et les messages de contact. La publication d’un article déclenche la diffusion vers les abonnés actifs lorsque l’e-mail est activé ; il peut retirer une publication du site sans l’effacer. |
| **Ressources humaines** (`rh`) | `/rh` | Gère les dossiers du personnel, les données contractuelles et les congés. Ne voit pas les comptes, rôles et opérations d’administration sans rôle supplémentaire. Aucun pointage des présences. |

## Points importants

- Un compte peut recevoir plusieurs rôles ; ses autorisations sont alors cumulées.
- Les anciens comptes `manager` sont consolidés dans le rôle `admin` ; les anciennes URLs `/manager/*` redirigent vers `/admin`.
- Seul le rôle Manager APILD attribue les rôles, crée les comptes et bloque ou réactive un autre compte. Il ne peut pas se bloquer lui-même.
- Les suppressions de données métier sont en général des archivages logiques : elles restent traçables dans le journal d'audit.
- Le journal d'audit est volontairement en lecture seule.
- Seuls `admin`, `communication` et `rh` restent actifs. Les comptes uniquement `staff` perdent l’accès jusqu’à leur réattribution explicite par un admin. Les autres rôles historiques restent archivés, sans accès ; aucun compte n’est promu automatiquement.
- La création et la suppression des rôles sont désactivées. L’admin peut ajuster les permissions des trois rôles actifs.
- Les contrats RH sont rattachés à un acteur et leur PDF est accessible à l’admin et au RH. Les rapports possèdent également un PDF imprimable.
- Le salaire contractuel CDF/USD et le statut expatrié sont enregistrés dans le dossier RH, mais le calcul légal de paie reste indisponible tant que les règles applicables à APILD et le cours de conversion ne sont pas validés.

## Parcours recommandés

- **Manager APILD** : `/admin`
- **Communication** : `/communication`
- **Ressources humaines** : `/rh`
