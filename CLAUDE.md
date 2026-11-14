# Projet « Factotum » (dépôt `saison`) – règles pour Claude Code

Site public de Léonard, **Factotum** : https://factotumdellacitta.github.io/saison/ (le dépôt garde le nom `saison` : ne le renomme pas, l’adresse, les flux abonnés et les liens partagés en dépendent).
Outil unique de **veille** (affiche notée), d'**agenda** (réservations, soirs pris, flux Apple Calendar) et d'**archive** (journal des sorties vues) pour toutes les sorties culturelles.
Léonard écrit en français, style direct. Réponds en français, brièvement, sans préambule. Pas de tiret cadratin ni d'espace fine : utilise « – » ou la virgule.

## Fichiers

| Fichier | Contenu | Public ? |
| --- | --- | --- |
| `data/affiche.json` | `{maj, sorties:[…]}` : à venir ou en cours (`statut` `a-voir` ou `ecarte`) | Oui |
| `data/journal.json` | `{maj, sorties:[…]}` : déjà vues (`statut` `vu`) | Oui |
| `data/lieux.json` | `{ lieuId: {nom, ville, zone, statut, site, billetterie, tarifJeune, adresse?} }` | Oui |
| `data/liens.json` | `[{categorie, titre, url, note}]` | Oui |
| `data/dispo.json` | `reservations` (généré), `manuel` (soirs pris déclarés), `calendrier` (généré par l'action depuis Apple Calendar) : dates seules | Oui |
| `data/index-artistes.json`, `data/index-lieux.json` | Générés par `build.mjs`, ne pas modifier à la main | Oui |
| `data/prive.enc` | Zone privée chiffrée (schéma ci-dessous) | Chiffré |
| `data/agenda-<icsToken>.ics` | Flux « Factotum – réservations », généré | Adresse non devinable |
| `data/ventes-<icsToken>.ics` | Flux « Factotum – ouvertures de ventes », généré | Adresse non devinable |
| `index.html`, `assets/factotum.css`, `assets/app.js`, `assets/admin.js`, `assets/charte.js`, `sw.js` | Le site (coque, feuille unique, logique publique, mode admin et page `#charte` chargés à la demande, service worker). Ne les modifie que si Léonard demande un changement d'interface. | |

Le site publié ne contient que `index.html`, `sw.js`, `assets/` et `data/`. Jamais `tools/`, `_setup/` ni fichier en clair.
Après toute modification de `assets/app.js`, `assets/admin.js`, `assets/charte.js` ou `assets/factotum.css` : incrémente `?v=` partout où il apparaît (`index.html`, `loadAdmin` et `loadCharte` d'`app.js`, `SHELL` de `sw.js`) ainsi que `V` dans `sw.js` (sinon les téléphones gardent l'ancienne version en cache). Icônes, image de partage et visuels GitHub : `node tools/icones.mjs` (à relancer seulement si le symbole change).
Routes du site : `#affiche?filtres`, `#journal`, `#artistes`, `#lieux`, `#artiste-<slug>`, `#lieu-<id>`, `#liens`, `#sortie-<id>`, `#admin?v=res|envies|rapide|soirs|budget|acc|lieux|liens|abo`, `#journal?sa=<année de début>` (filtre de saison), `#charte` (charte graphique, non liée dans la navigation) (les anciens `#fiche-<id>` redirigent).

## Charte graphique (Factotum)
Référence vivante : la page `#charte` (imprimable en PDF). Toute modification d'interface la respecte ; `tools/check.mjs` bloque les écarts mesurables.
- **Nom** : Factotum (l'air de Figaro, *Largo al factotum della città*). Jamais d'année dans le nom. Titre de page : « Factotum » ou « Titre – Factotum ». Logotype : FACTOTUM en Schibsted Grotesk 800, capitales, approche −0,02em. Pied de page : « Largo al factotum della città. »
- **Saison** : toujours calculée (`saisonDe()` dans `app.js`), de septembre à août : « Saison 26–27 ». Jamais écrite en dur. Le Journal et ses statistiques se filtrent par saison, avec « Toutes les saisons ».
- **Symbole, la clé F** (`assets/logo.svg`, composant `cleF()` dans `app.js`) : clé passe-partout dont le panneton dessine un F, inclinée à 45° (anneau en bas à gauche, panneton en haut à droite), géométrie stricte. Blanc sur aplat rouge, ou encre sur fond clair ou sombre. Jamais rouge sur rouge, ni contour, ombre, autre rotation (ne jamais la redresser) ou animation. Taille minimale 16 px, zone de protection = épaisseur de la tige. Dans l'en-tête : hauteur des capitales du logotype. Usage réservé : en-tête, favicon, icônes PWA, image de partage, `#charte`. Jamais en ornement.
- **Couleur** : rouge #E30613 en **aplats francs** ; tout le reste en noir et blanc. Sur un aplat rouge, texte blanc uniquement. Jetons sur `:root` dans `assets/factotum.css`, aucune couleur ni taille de police en dur ailleurs :

  | Jeton | Clair | Sombre |
  |---|---|---|
  | `--fond` | #FFFFFF | #0E0E0E |
  | `--surface` | #FFFFFF | #161616 |
  | `--encre` | #111111 | #F2F2F2 |
  | `--encre-2` | #5C5C5C | #A6A6A6 |
  | `--filet` | #111111 | #F2F2F2 |
  | `--filet-leger` | #D9D9D9 | #2E2E2E |
  | `--rouge` | #E30613 | #E30613 |
  | `--sur-rouge` | #FFFFFF | #FFFFFF |
  | `--rouge-texte` | #E30613 | #FF5A4F |

  Contrastes WCAG AA vérifiés par `tools/contrast.mjs` (appelé par `check.mjs`).
- **Typographie** : Schibsted Grotesk seule, auto-hébergée (`assets/fonts/`, 400, 500, 700, 800 ; chiffres tabulaires limités aux chiffres). Échelle mobile / bureau : titre du site 44 / 72 px 800 capitales ; section 22 / 28 px 800 ; fiche 17 / 19 px 700 ; corps 15 / 16 px 400, interlignage 1,45 ; métadonnées 12 px 500 capitales +0,06em ; dates 13 / 14 px 800 capitales ; champs 16 px minimum. Guillemets « » avec espaces insécables, apostrophe ’, tiret demi-cadratin –. Ni cadratin ni espace fine dans les fichiers publiés (bloquant ; le mode admin les convertit à l'écriture).
- **Mise en page** : grille de 12 colonnes, 1120 px au plus ; 4 colonnes et marges de 16 px sur mobile. Espacements 4, 8, 12, 16, 24, 32, 48. Angles droits (2 px au plus sur les champs). Filet 1 px entre les lignes, 3 px au-dessus des sections. Une ligne par représentation, sans cartes. Cibles tactiles de 44 px.
- **Composants** : en-tête rouge (barre compacte au défilement sur mobile), navigation en capitales soulignée de rouge, ligne de spectacle (colonne de date de 64 px, filet pointillé), bandeaux de jour rouges collants, note en quatre carrés (« P » = prévision), badge « Léonard y va » en aplat rouge et autres badges en contour, boutons rectangulaires, puces à contour (active en rouge), hachures pour les soirs pris, fiche à en-tête rouge, statistiques en grands chiffres et barres rouges, messages en bandeau, mode admin à en-tête noir et confirmations intégrées (jamais `confirm()`).
- **Interdits** : polices Inter, Roboto, Poppins, Montserrat, Space Grotesk ou système ; dégradés (sauf hachures fonctionnelles), glassmorphisme, ombres, flou ; arrondis au-delà de 2 px, pilules, cartes flottantes ; emoji, bibliothèques d'icônes, pictogrammes décoratifs ; violet, indigo, bleu ardoise ou toute couleur hors palette ; héros centré, grandes sections vides, texte marketing ; animations d'échelle, rebonds, révélations au défilement, squelettes. Seules les transitions de couleur et d'opacité de 120 ms, aucune en mouvement réduit. Aucune bibliothèque CSS ou JS, aucune ressource externe (polices comprises).
- **Thème** : Auto (défaut), Clair, Sombre ; un bouton texte, choix dans `localStorage` (try/catch), `data-theme` posé avant le rendu.

## Sortie (affiche.json et journal.json)

```json
{"id":"ruy-blas","titre":"Ruy Blas","categorie":"Théâtre","sousGenre":"",
 "artistes":[{"nom":"Victor Hugo","role":"auteur"},{"nom":"Julie Duclos","role":"mise en scène"}],
 "lieuId":"comedie-francaise","salle":"Richelieu","debut":"2026-10-15","fin":"2027-01-27","datesTexte":"15 oct. 2026 – 27 janv. 2027","horaires":"2h45",
 "note":3,"pronostic":true,"pourquoi":"Une phrase factuelle.","lien":"https://…","billetterie":null,
 "publicJeune":false,"leonardYVa":false,"statut":"a-voir",
 "offres":[{"type":"Avant-première jeunes","date":"2027-01-25","tarif":"10 €","vente":"2027-01-07T12:00","venteApprox":false,"condition":"Moins de 28 ans"}]}
```
- `id` : minuscules, chiffres, tirets, unique entre affiche et journal. Les vus anciens sont préfixés `vu-`. Un id ne change jamais (réservations, envies et liens en dépendent).
- `categorie` ∈ Théâtre, Opéra, Danse, Comédie musicale, Récital, Concert, Festival, Exposition, Cinéma, Événement, Sur scène (représentations de Léonard), Autre. `sousGenre` libre (Cirque, Version de concert, Salon, Visite…).
- `artistes[].role` ∈ auteur, compositeur, mise en scène, chorégraphie, direction musicale, interprète, commissaire, réalisation, compagnie, artiste (en cas de doute). Une seule graphie par artiste : nom complet, accents, apostrophe ’ (vérifie `data/index-artistes.json` avant d'ajouter un nom).
- `lieuId` doit exister dans `lieux.json` (sinon ajoute le lieu). `null` toléré seulement dans le journal.
- `datesTexte` (facultatif) : dates en clair quand `debut`/`fin` ne suffisent pas. `horaires` (facultatif) : heures, durée, matinées.
- `offres[].vente` : `AAAA-MM-JJ` ou `AAAA-MM-JJTHH:MM` ; `venteApprox: true` si la date est estimée.
- Journal : `statut: "vu"`, `vuLe` (liste de dates ISO), `noteLeonard` (1–4 ou null), `avis` (ses mots, jamais les tiens).
- Passage à vu : la fiche **sort** de `affiche.json` et **entre** dans `journal.json` (même id).
- « Public jeune » = adapté à un public jeune (jamais « avec ton frère »).

## Confidentialité (bloquant dans check.mjs)
**Jamais** dans un fichier public : `prix`, `accompagnants`, `places`, `siege`, `heure` (de réservation), date de réservation. Public = drapeau `leonardYVa` seulement. Tout le reste va dans la zone privée. Les flux `.ics` (adresse secrète) contiennent prix et accompagnants : c'est voulu.

## Grille de notation (note 0–4)
Critique (presse nationale, prix, accueil à la création) + statut de l'œuvre et de l'artiste + opportunité (rareté, dernières dates, tarif jeune) + goûts de Léonard (classiques revisités, scène européenne Odéon/Festival d'Automne, opéra, Mouawad, Molière ; voir ses vus les mieux notés dans le journal).
- 4 incontournable (une quinzaine par saison au plus) · 3 fortement recommandé · 2 bon choix si disponible · 1 curiosité. En dessous : pas de fiche. 0 réservé au journal (vu sans note de veille).
- Même grille pour expos, concerts, cinéma, événements.
- `pronostic: true` si création non encore critiquée ; à retirer dès que des critiques existent.

## Liens
`lien` : toujours la page officielle de la sortie sur le site du lieu. À défaut, page officielle du festival, puis page de saison du lieu. L'Officiel des spectacles seulement en dernier recours. Pour un vu : page archivée officielle si elle existe. `billetterie` : URL d'achat directe si différente.
`liens.json` : catégories Billetteries, Cartes et tarifs jeunes, Calendriers de vente, Outils.

## Zone privée et mot de passe
Le mot de passe est dans la variable d'environnement `SAISON_MDP` (et dans le secret GitHub du même nom). Ne l'affiche jamais, ne l'écris dans aucun fichier.
- `node tools/prive.mjs ouvrir` → `_prive.json` en clair (ignoré par git). Modifie-le.
- `node tools/prive.mjs fermer` → rechiffre (en gardant le sel, pour que le mode admin reste connecté) et supprime le clair. **Obligatoire avant tout commit.**

Schéma (version 2) :
```json
{"version":2,"icsToken":"…",
 "reservations":{"<id>":{"date":"2027-02-08","heure":"20:00","salle":"","siege":"","places":2,
   "billets":[{"spectateur":"Moi","prix":18,"paiement":"moi","tarif":"Abonné jeune moins de 28 ans","categoriePlace":"cat. 1"},
              {"spectateur":"Alexandre","prix":18,"paiement":"spectateur"}],
   "pleinPlace":40,"accompagnants":["Alexandre"],"billetterie":"","note":""}},
 "envies":{"<id>":{"ajouteLe":"2026-11-13","priorite":2,"note":""}},
 "journalPrive":{"<id>":{"places":2,"billets":[{"spectateur":"Moi","prix":20,"paiement":"moi"},{"spectateur":"Papa","prix":75,"paiement":"offert","categoriePlace":"cat. 4"}],"accompagnants":["Papa"]}},
 "blocages":[{"debut":"2027-04-10","fin":"2027-04-20","motif":"…"}],
 "aCompleter":[{"ajouteLe":"2026-11-14","texte":"…confirmation collée…","extrait":{"sortieId":null,"date":"2027-02-03","heure":"19:30","salle":"","places":1,"siege":"","prixPlace":12,"tarif":""}}]}
```
`priorite` : 1 forte, 2 normale, 3 faible. Une seule réservation par sortie (clé = id).
**Places et prix** (réservations et journalPrive) : `billets`, **une ligne par spectateur** : `spectateur` (« Moi » ou un prénom déjà utilisé, voir l'onglet Accompagnants ; vide si inconnu), `prix` (de cette place, en euros, `null` si inconnu), `paiement`, `tarif` et `categoriePlace` facultatifs. `paiement` : `moi` (payée par Léonard ; défaut, y compris pour un tiers qui ne rembourse pas), `offert` (place d'un tiers offerte par Léonard), `spectateur` (le tiers paie sa part, ex. Alexandre), `gratuit` (gratuité, mécénat, cadeau reçu : prix 0). `places` = nombre de lignes ; `accompagnants` = spectateurs autres que « Moi » (toujours tenu à jour). `pleinPlace` (facultatif) = plein tarif par place, pour les économies.
Tableau de bord : **engagé** = toutes les places ; **payé par moi** = places de Moi non gratuites + places de tiers en `moi` ou `offert` ; **pour mon bénéfice** = places de Moi. Les anciens champs (`prix` total, `prixPlace`, `pour`) sont encore lus mais ne s'écrivent plus.
`blocages` : périodes privées (`debut`, `fin` inclus, `motif`) comptées dans les conflits mais jamais publiées dans `dispo.json`.
`aCompleter` : billets collés dans la saisie rapide du site et non reconnus. `/veille` les traite (voir plus bas).

## Fichiers générés (`node tools/build.mjs`)
- `index-artistes.json` (`{slug: {nom, sorties}}`) et `index-lieux.json` (`{lieuId: {sorties}}`), même sans mot de passe.
- `dispo.json.reservations`, flux agenda, flux ventes : avec `SAISON_MDP` (ou `_prive.json` ouvert).
- Flux ventes : un événement de 15 min à l'heure d'ouverture (10h si inconnue, « ~ » si approximative), alarme 15 min avant, pour toute offre dont la sortie est en envie, réservée, notée 4, ou de type avant-première.
- L'action « Publier le site » relance `build.mjs` à chaque passage (avec le secret) et commite les fichiers générés. Sortie déterministe : pas de commit si rien n'a changé.

## Mode admin (site, onglet cadenas)
Léonard gère aussi tout depuis le site (iPhone) : envies (cœur, priorité, note), réservations, vu, ajout et modification de sorties, lieux (ajout, modification, suppression d'un lieu inutilisé), saisie rapide de billets, soirs pris et périodes bloquées privées, liens, tableau de bord (engagé, payé par moi, pour mon bénéfice), accompagnants, abonnements.
- Connexion : mot de passe (déchiffre `prive.enc` dans le navigateur). Première fois sur un appareil : jeton GitHub « fine-grained » limité au dépôt (Contents : lecture et écriture ; Actions : lecture), testé puis rangé dans `localStorage` chiffré avec une clé dérivée du mot de passe. Verrouillage après 30 min d'inactivité, bouton « Verrouiller », « Oublier cet appareil ».
- Écriture : `assets/admin.js` relit `main` via l'API GitHub, applique l'action, valide (mêmes règles que `check.mjs`), rechiffre la zone privée et crée **un commit directement sur `main`** (« Admin : réservé Werther le 8 févr. »). Si `main` a bougé entre-temps, l'action est rejouée sur la version fraîche ; si l'objet visé a changé, Léonard est consulté.
- Le navigateur n'écrit que les sources : `affiche.json`, `journal.json`, `lieux.json`, `liens.json`, `dispo.json` (`manuel` seulement), `prive.enc`. Le push déclenche « Publier le site », qui régénère index, `dispo.reservations` et flux ; le site suit l'exécution (bandeau « Publication en cours », puis « En ligne »).
- Conséquence pour toi : **Léonard commite aussi sur `main`.** Pars toujours de `origin/main` à jour et rebase avant de pousser (voir la procédure). `prive.enc` tient sur une ligne : en cas de conflit, ne fusionne jamais à la main, rouvre la version de `main` et refais ta modification.
- Le dépôt est **public**, messages de commit compris : ils ne citent jamais un prix, un accompagnant, une envie ni une période bloquée (le site écrit « Admin : envies mises à jour », « Admin : périodes bloquées mises à jour »). Fais de même dans tes commits.
- Messages de commit commençant par « Admin : » = modifications faites depuis le site. Lis-les (`git log origin/main`) pour savoir ce qui a changé.

## Procédure à chaque modification
0. `git fetch origin main` puis pars de `origin/main` (`git rebase origin/main` si ta branche existe déjà) : le mode admin du site commite sur `main`.
1. Modifie les données (et la zone privée si besoin, puis `fermer`).
2. `node tools/build.mjs`.
3. `node tools/check.mjs` : corrige jusqu'à « OK ».
4. Mets `maj` de affiche.json (et journal.json s'il a changé) à la date du jour.
5. Commit en français, une ligne par changement (« Réservé : Werther le 8 févr. »), `git fetch origin main && git rebase origin/main` (en cas de conflit sur `prive.enc` : reprends la version de main, rouvre, refais, ferme), puis push. La branche `claude/…` est fusionnée et publiée automatiquement par GitHub Actions : ne crée pas de pull request.
6. Réponds à Léonard en 2–4 lignes : ce qui a changé, conflits éventuels, prochaines ventes utiles.

## Contrôles automatiques à faire de toi-même
- Conflit : avant toute réservation, vérifie `dispo.json` (toutes listes), les réservations privées et `blocages` ; signale tout soir déjà pris.
- Avant d'ajouter une sortie : vérifie qu'elle n'est pas déjà dans l'affiche ou le journal (même œuvre, même production).
- Une réservation passée (date < aujourd'hui) : demande à Léonard s'il l'a vue, puis propose `/vu`.
- File `aCompleter` non vide (zone privée) : traite chaque billet (retrouve ou ajoute la sortie, enregistre la réservation, vérifie les conflits), retire-le de la file, et signale ce qui reste ambigu.

## Commandes
`/ajoute`, `/reserve`, `/vu`, `/pris`, `/note`, `/veille`, `/envie`, `/modifie`, `/annule`, `/import` (voir `.claude/commands/`).
