# Base de donnees APILD

La base principale est definie par `Apild_bd.sql` et porte le nom `apild_platform`.

## Migrations applicatives

Apres l’import initial du schema, appliquer les evolutions versionnees avant de lancer le backend :

```powershell
cd backend
npm run db:migrate
```

La commande memorise les migrations deja appliquees dans `schema_migrations`. Elle inclut notamment la consolidation du role responsable de plateforme, la mesure d’audience anonyme, la diffusion fiable des articles aux abonnes, les publications institutionnelles APILD et l’obligation de changer un mot de passe temporaire lors du premier acces.

## Regles de donnees actives

- les references `PRJ`, `TSK`, `INT`, `ART` et `RPT`, ainsi que le code d’un role, sont attribues par l’API et ne peuvent pas etre imposes par un formulaire ;
- la progression d’un projet est une valeur calculee a partir de `start_date` et `end_date`, pas une saisie manuelle ;
- les 12 actualites institutionnelles publiees sont conservees en base et la pagination publique les lit directement par l’API.

## Compte applicatif recommande

En production, le backend ne doit pas se connecter avec le compte `root`. Apres l'import du schema, creer un compte dedie avec un mot de passe fort :

```sql
CREATE USER 'apild_app'@'%' IDENTIFIED BY 'REMPLACER_PAR_UN_MOT_DE_PASSE_FORT';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES, CREATE VIEW, SHOW VIEW,
  CREATE ROUTINE, ALTER ROUTINE, EXECUTE, TRIGGER, EVENT ON apild_platform.* TO 'apild_app'@'%';
FLUSH PRIVILEGES;
```

Utiliser ensuite `DB_USER=apild_app` dans `backend/.env`. Sur Amazon RDS, créer ce compte depuis le compte maître RDS et limiter son accès à l’instance privée ; l’API App Runner y accède via son connecteur VPC. Ces privilèges de schéma sont nécessaires car le démarrage applique les migrations. Dans une exploitation plus mature, exécuter les migrations avec un rôle distinct puis retirer les droits DDL du compte d’exécution.

## Connexion chiffree

Pour une base distante, activer :

```env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

La verification du certificat ne doit etre desactivee que dans un environnement de developpement controle.

## Sauvegardes

- automatiser une sauvegarde quotidienne chiffree ;
- conserver plusieurs generations de sauvegarde ;
- stocker une copie sur un emplacement distinct ;
- tester regulierement la restauration ;
- limiter l'acces aux sauvegardes, car elles contiennent les memes donnees sensibles que la base active.

## Donnees de demonstration

Les adresses se terminant par `.test`, les references contenant `DEMO` et le mot de passe temporaire `password` sont reserves au developpement. Ils doivent etre retires ou remplaces avant la production.
