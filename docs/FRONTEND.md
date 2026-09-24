# Frontend React APILD

Le frontend reprend le systeme visuel du dossier `Maquette` : vert institutionnel, titres Manrope, contenu Inter, cartes sobres, site public editorial et portail interne operationnel.

## Identite et contenu institutionnel

- logo officiel : `frontend/public/images/logo-apild.png`, provenant du fichier fourni par l'organisation ;
- contenu institutionnel : adapte textuellement depuis `https://apildong.com/`, sans reprendre sa structure ni son habillage ;
- titres : police locale `Manrope Variable` ;
- textes et controles : police locale `Inter Variable` ;
- marges publiques : gouttiere responsive de 24 a 80 px, contenu limite a 1240 px et cadre visuel distinct autour des heroes ;
- photos : images locales nettes et distinctes dans `frontend/public/images/site`, avec un degrade vert APILD pour conserver la lisibilite du texte ;
- accueil et entetes des pages publiques : photo de terrain en arriere-plan avec voile de contraste ; la page Contact conserve un entete sans photo ;
- langues : interface publique et donnees de demonstration disponibles en francais, anglais et kiswahili ; le selecteur n'affiche que `FR`, `EN` et `SW` ;
- apparence : modes clair et sombre, avec contrastes dedies pour les formulaires, cartes, boutons et newsletter ; les preferences sont memorisees localement dans le navigateur.
- actualites : la grille lit directement l’API, affiche 10 publications par page (cinq colonnes sur grand ecran), montre un extrait plus détaillé et utilise une pagination précédente / page / suivante ;
- détail d’actualité : les visiteurs peuvent aimer une publication une seule fois par navigateur, la partager avec le mécanisme natif ou la copie de lien, et publier un commentaire avec leur nom ;
- interventions : les six domaines stratégiques institutionnels sont présentés avant les interventions documentées venant de la base ;
- animations : les contenus publics apparaissent a leur entree dans la fenetre et chaque changement de page utilise une transition discrete, desactivee lorsque le systeme demande une reduction des mouvements.
- compteurs d’accueil : les quatre chiffres viennent de `GET /api/public/impact` et défilent à l’entrée dans la fenêtre ; aucun nombre n’est codé en dur ;
- À propos : une frise « Notre histoire » de démonstration, traduite FR/EN/SW, complète les informations institutionnelles ;
- profil : l’avatar dans l’en-tête ouvre les paramètres personnels (nom, fonction, mot de passe et photo locale JPG/PNG/WebP) ;
- espace interne : les tâches sont des to-do indépendants ; le calendrier sélectionne une date future, l’heure, le personnel invité et le délai de rappel ; les rapports sont momentanément masqués de la navigation.

Les projets, interventions, statistiques et publications restent alimentes par l'API et la base APILD. Aucun chiffre ou projet fictif n'est affiche lorsque l'API est indisponible.

## Technologies

- React et React DOM ;
- Vite pour le developpement et la compilation ;
- React Router pour les routes publiques et protegees ;
- Axios pour l'API, avec renouvellement automatique du jeton ;
- Lucide React pour les icones accessibles.

## Demarrage

```powershell
cd frontend
npm install
npm run dev
```

Le site est disponible sur `http://localhost:5173`. Le backend doit fonctionner sur `http://localhost:4000`.

Les preferences de langue et de theme sont conservees dans `localStorage` sous les cles `apild-language` et `apild-theme`. Elles ne contiennent aucune donnee sensible.

Les traductions de l'interface se trouvent dans `src/data/translations.js`. Les contenus de demonstration connus de la base sont localises dans `src/data/localizedContent.js`. Lorsqu'un article, projet ou une intervention sera ajoute(e) plus tard, la version francaise reste affichee tant que son contenu anglais et kiswahili n'aura pas ete saisi dans le CMS.

## Verification

```powershell
cd frontend
npm run check
npm run build
```

La compilation de production est generee dans `frontend/dist`.

## Routes publiques

- `/` : accueil institutionnel ;
- `/a-propos` : mission, vision et valeurs ;
- `/projets` et `/projets/:id` ;
- `/interventions` ;
- `/actualites` et `/actualites/:id` ;
- `/contact` ;
- `/connexion`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`, `/premiere-connexion`.

## Espaces proteges

- `/admin` : espace unique de pilotage : projets, tâches, calendrier, rapports, documents, acteurs, rôles et journal d’audit ;
- `/manager/*` : ancienne URL redirigee vers `/admin` ;
- `/communication` : tableau d’audience distinct, interventions illustrées, calendrier, articles, médias et, en local avec SMTP, newsletters et abonnés ;
- `/rh` : dossiers du personnel, contrats liés à un acteur, congés et calendrier ;
- `/staff/*` : ancienne URL redirigée vers `/portail`, sans rôle `staff` actif.

Les routes sont controlees par les roles renvoyes par `GET /api/auth/me`. Les autorisations metier restent egalement verifiees par le backend : masquer un bouton dans React ne remplace jamais un controle serveur.

Chaque changement de page replace automatiquement la vue au debut de la page. Les cartes et les contenus publics ont des transitions discretes qui respectent le reglage systeme `prefers-reduced-motion`.

Le site public conserve ses textes d’interface en FR/EN/SW et charge le widget Google Translate pour le contenu éditorial provenant de la base, notamment les titres et articles publiés. Le widget est discret : le sélecteur principal de l’en-tête reste la commande visible. Une connexion Internet est nécessaire pour traduire un article qui n’a pas de version éditée dans la langue choisie.

Le calendrier permet de choisir une date future, un horaire, le motif et des acteurs participants. Le projet associé est facultatif. Les invitations sont envoyées uniquement lorsque les e-mails et les tâches de fond sont activés. Les rapports et les fiches contractuelles disposent d’une action de téléchargement PDF.

## Désabonnement

Un abonne peut ouvrir `/desabonnement?token=…` depuis un email de publication pour retirer son adresse de la liste. Cette page publique ne demande pas de connexion et ne transmet que le jeton de désabonnement.

## Gestion de session

Les jetons sont conserves dans `sessionStorage`, jamais dans l'URL. Le jeton d'acces est ajoute aux requetes autorisees et peut etre renouvele une fois avec le refresh token. Une erreur de renouvellement efface la session locale.

Un compte cree par le Manager APILD est dirige vers `/premiere-connexion` avant tout acces au portail. Cette page impose un mot de passe fort et remplace les jetons de session apres validation. La récupération de mot de passe utilise un code à 6 chiffres reçu par e-mail, plutôt qu’un jeton affiché dans l’URL.

Cette strategie est compatible avec l'API actuelle. Pour une protection encore plus forte en production, une evolution future pourra placer le refresh token dans un cookie `HttpOnly`, `Secure` et `SameSite` emis par le backend.
