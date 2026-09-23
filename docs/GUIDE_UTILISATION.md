# Guide d’utilisation de la plateforme APILD

Ce guide est organisé par acteur, puis par action. Les droits sont contrôlés par l’API : un menu masqué ne constitue pas, à lui seul, une autorisation. Un compte peut cumuler plusieurs rôles. L’espace principal dépend des rôles qui lui sont attribués.

## 1. Visiteur du site public

### Consulter les informations

- **Accueil** : présente APILD, les projets, les actualités et les indicateurs issus de la base de données. Les quatre chiffres sont les projets actifs ou terminés, la somme des bénéficiaires déclarés dans les interventions terminées, le nombre d’interventions terminées et les partenaires actifs.
- **À propos** : présente l’histoire, les valeurs et les objectifs de l’organisation.
- **Projets** : ouvre la liste et la fiche de chaque projet publié. La barre en pourcentage représente **le temps écoulé entre la date de début et la date de fin prévues**, pas le pourcentage des travaux réellement achevés. Un projet terminé affiche 100 % ; un projet sans dates exploitables affiche 0 %.
- **Interventions** : présente les actions achevées et leur domaine.
- **Actualités** : ouvre les articles publiés. Une fiche permet d’aimer, de commenter et de partager l’article, et de consulter ses documents PDF/Word joints lorsqu’il y en a.
- **Contact** : transmet un message à APILD.

Les entrées `INT-DEMO-001` et `INT-DEMO-002` actuellement présentes dans la base sont des **données de démonstration**. Leurs bénéficiaires déclarés sont respectivement `45 + 52 + 80 = 177` et `63 + 89 + 24 = 176`, soit **353** au total. Ce total ne constitue pas un bilan terrain vérifié. La page d’accueil le signale tant que ces entrées figurent parmi les statistiques.

### Choisir la langue et l’apparence

Dans l’en-tête, choisissez **FR**, **EN** ou **SW** ; le bouton de thème bascule entre les modes clair et sombre. Ces préférences ne modifient pas les données enregistrées.

### S’abonner aux nouvelles — installation locale uniquement

Le formulaire de newsletter inscrit une adresse dans la liste des abonnés et permet de recevoir les campagnes et nouvelles publications lorsque le serveur SMTP fonctionne. Le lien de désabonnement figure dans les e-mails. La version Render masque ces fonctions tant que l’envoi d’e-mails y est désactivé.

## 2. Manager APILD / administrateur (`admin`)

### Accéder et gérer son compte

Connectez-vous avec l’adresse et le mot de passe attribués. À la première connexion, la plateforme oblige à remplacer le mot de passe provisoire par un mot de passe fort. En cliquant sur votre avatar ou vos initiales, vous pouvez modifier votre prénom, nom, fonction, mot de passe et photo de profil. La déconnexion demande confirmation. Une adresse e-mail reste nécessaire comme identifiant, même sur Render.

### Suivre le tableau de bord

Le **Tableau de bord** réunit les comptes, tâches, projets actifs, retards, graphiques de performance, projets récents et actions rapides. Cliquez sur **Actualiser** pour relire les données de l’API. Les chiffres ne sont pas saisis dans le tableau de bord : ils proviennent des enregistrements de la base.

### Gérer les projets

Dans **Projets**, créez une fiche avec un nom, un statut, des dates, un responsable et, si nécessaire, un budget et une zone. La référence est générée automatiquement. Utilisez les filtres et la recherche pour retrouver une fiche ; l’action de modification corrige ses données. Le pourcentage affiché est calculé automatiquement à partir du calendrier et ne se saisit pas à la main. Pour mesurer l’exécution réelle, renseignez les interventions et les livrables : ne confondez pas le temps écoulé avec les travaux réalisés.

### Gérer les tâches

Dans **Tâches**, créez un intitulé, une échéance, un statut et une priorité. Une tâche peut être indépendante d’un projet : aucun projet n’est obligatoire. Mettez son statut à jour au fil du travail. La recherche et les filtres concernent uniquement cette liste.

### Utiliser le calendrier et les réunions

Dans **Calendrier**, les jours passés restent consultables ; cliquez sur un jour pour voir ses activités. Pour créer une réunion, choisissez une date présente ou future, le motif, les heures et, si besoin, un projet et des participants. Le choix **En présentiel / En ligne** affiche respectivement le champ *Lieu* ou *Lien de réunion* : ce sont les deux anciens champs qui apparaissaient ensemble. Sur l’installation locale avec SMTP actif, choisissez aussi le délai de rappel ; les participants reçoivent une invitation et un rappel. Sur Render, la réunion est enregistrée au calendrier sans envoi d’e-mail.

### Gérer l’équipe et les accès

**Équipe** est alimentée par les comptes créés dans **Utilisateurs** : il n’existe pas de fiche d’équipe séparée. Créez un acteur avec son prénom, nom, adresse, mot de passe provisoire fort et rôle. L’utilisateur doit changer ce mot de passe lors de sa première connexion. Le manager peut modifier les comptes, les bloquer ou les réactiver ; seul ce rôle dispose de cette action. Dans **Rôles et permissions**, créez un rôle et choisissez ses autorisations si un nouveau profil métier est nécessaire. Évitez de supprimer les rôles système.

### Lire le journal d’audit

Le **Journal d’audit** indique l’action, l’élément concerné, l’auteur, la date et les champs modifiés. Recherchez par utilisateur ou opération ; filtrez par action et type d’élément. Ouvrez **Voir le détail** pour comparer les valeurs avant/après. Les identifiants techniques et les champs sensibles ne sont pas affichés dans la lecture courante. Le journal est en lecture seule.

## 3. Agent de communication (`communication`)

### Lire son tableau de bord

Le tableau de bord Communication affiche les visites anonymes, clics, pages les plus consultées et état des publications. En local, si les e-mails sont activés, il affiche aussi les abonnements à la newsletter. Sur Render, ces sections liées à l’e-mail sont masquées.

### Publier des articles

Dans **Articles**, créez le titre, le résumé et le texte, puis choisissez le statut approprié. Ajoutez une photo principale depuis l’ordinateur et, si nécessaire, un ou plusieurs fichiers **PDF, DOC ou DOCX**. Une fois l’article publié, il apparaît dans les actualités publiques et ses pièces jointes sont téléchargeables depuis sa fiche. **Retirer du site** dépublie l’article sans le supprimer : il reste dans l’espace éditorial et peut être corrigé. La suppression est une action différente.

### Utiliser la médiathèque

La **Médiathèque** est la bibliothèque des images et documents téléversés. Elle sert à conserver les fichiers, leur titre et leur lien avec un article ; ce n’est pas une page de rédaction. Un fichier joint depuis le formulaire d’article est aussi enregistré comme média. Les nouveaux médias et avatars téléversés sur Render sont stockés dans la base pour survivre aux redémarrages ; les anciens fichiers déjà perdus sur le disque Render doivent être téléversés à nouveau.

### Gérer newsletters et abonnés — installation locale uniquement

Dans **Newsletters**, préparez une campagne, son objet et son contenu, puis déclenchez l’envoi selon les droits accordés. **Abonnés** liste les inscriptions. La publication d’un article peut avertir les abonnés actifs. Ces parcours exigent un SMTP opérationnel. Ils sont masqués et l’envoi est désactivé sur Render ; la rédaction et la publication des articles restent disponibles.

## 4. Personnel / staff (`staff`)

### Suivre le travail

Le **Tableau de bord** présente ses éléments de travail. Dans **Mes tâches**, retrouvez les tâches accessibles et mettez à jour leur statut selon vos autorisations. **Calendrier** affiche les rendez-vous accessibles au personnel. **Documents** regroupe les pièces partagées et les livrables autorisés. Le staff ne gère pas les utilisateurs, rôles ou blocages de comptes.

## 5. Mot de passe et e-mails

### Installation locale avec SMTP

Le parcours **Mot de passe oublié** se déroule en trois étapes : 1) saisir l’adresse e-mail ; 2) saisir et vérifier le code à six chiffres reçu ; 3) choisir et confirmer un nouveau mot de passe fort. Le code expire après 15 minutes. L’envoi SMTP a un délai d’attente limité pour éviter de bloquer longtemps la requête. Si l’e-mail ne part pas, le formulaire affiche une erreur et n’annonce pas un envoi réussi.

### Version Render actuelle

Les fonctions dépendantes des e-mails sont volontairement désactivées (`EMAIL_FEATURES_ENABLED=false` côté API, `VITE_EMAIL_FEATURES_ENABLED=false` côté site) : newsletter, diffusion d’articles, invitations/rappels par e-mail et récupération du mot de passe par code. Elles restent disponibles dans l’installation locale par défaut. Pour récupérer un accès hébergé, contactez le manager APILD afin qu’il réinitialise le compte selon la procédure administrative. Ne réactivez les fonctions d’e-mail qu’après configuration et essai d’un fournisseur SMTP réellement accessible depuis Render.

## 6. Conseils de qualité des données

- Ne déclarez les bénéficiaires que pour des interventions réelles et vérifiées ; le total public additionne hommes, femmes et enfants des interventions **terminées**.
- Ne laissez pas une référence contenant `DEMO` dans un bilan destiné à un client sans la remplacer par une donnée vérifiée ; le site affiche un avertissement tant que de telles interventions contribuent aux indicateurs.
- Le pourcentage d’un projet est un indicateur **calendaire**, non une preuve d’exécution physique ou budgétaire.
- Après toute publication ou modification importante, vérifiez le rendu public et les droits des comptes concernés.
