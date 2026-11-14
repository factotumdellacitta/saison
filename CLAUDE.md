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
| `data/envies.json` | `{ids:[…]}` : identifiants des sorties à l’affiche en envie, généré par `build.mjs` depuis la zone privée (ni note, ni date) | Oui |
| `data/prive.enc` | Zone privée chiffrée (schéma ci-dessous) | Chiffré |
| `data/agenda-<icsToken>.ics` | Flux « Factotum – réservations », généré | Adresse non devinable |
| `data/ventes-<icsToken>.ics` | Flux « Factotum – ouvertures de ventes », généré | Adresse non devinable |
| `index.html`, `assets/factotum.css`, `assets/app.js`, `assets/admin.js`, `assets/charte.js`, `sw.js` | Le site (coque, feuille unique, logique publique, mode admin et page `#charte` chargés à la demande, service worker). Ne les modifie que si Léonard demande un changement d'interface. | |

Le site publié ne contient que `index.html`, `sw.js`, `assets/` et `data/`. Jamais `tools/`, `_setup/` ni fichier en clair.
Après toute modification de `assets/app.js`, `assets/admin.js`, `assets/charte.js` ou `assets/factotum.css` : incrémente `?v=` partout où il apparaît (`index.html`, `loadAdmin` et `loadCharte` d'`app.js`, `SHELL` de `sw.js`) ainsi que `V` dans `sw.js` (sinon les téléphones gardent l'ancienne version en cache). Icônes, image de partage et visuels GitHub : `node tools/icones.mjs` (à relancer seulement si le symbole change).
Routes du site : `#radar` (accueil : ventes sous 7 jours, notées 4 à réserver, dernières chances sous 21 jours, ouvertures suivantes, billetteries ; colonne latérale de l'Affiche sur bureau), `#affiche?filtres`, `#journal`, `#artistes`, `#lieux`, `#artiste-<slug>`, `#lieu-<id>`, `#liens` (section Billetteries du Radar), `#coeur` (envies, publique), `#sortie-<id>`, `#admin?v=res|ranger|envies|rapide|soirs|budget|acc|lieux|liens|abo`, `#journal?sa=<année de début>` (filtre de saison), `#charte` (charte graphique, non liée dans la navigation) (les anciens `#fiche-<id>` redirigent).

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

  **Code des genres** : une encre par famille (`--g-…`, texte AA) et un aplat sous texte blanc (`--a-…`, identique dans les deux thèmes), réservés au genre : surtitre et tranche de 3 px devant la date des lignes, icône des puces de genre, puce de genre active (aplat), barres « Par catégorie », en-tête de fiche (aplat ; Théâtre et genres neutres gardent le rouge franc). Familles (`famille()` dans `app.js`) :

  | Famille | Genres | `--g` clair / sombre | `--a` |
  |---|---|---|---|
  | `theatre` | Théâtre | #B4233C / #FF94A3 (carmin) | #B4233C (puce) ; fiche en rouge |
  | `musique` | Opéra, Récital, Concert, Comédie musicale | #1F5FA8 / #8DB8F2 (bleu de Prusse) | #1F5FA8 |
  | `danse` | Danse | #946200 / #E8B04A (ocre) | #946200 |
  | `images` | Exposition, Cinéma | #00695C / #4FC3A1 (vert sapin) | #00695C |
  | `neutre` | Festival, Événement, Sur scène, Autre | encre | rouge |

  Jamais d'aplat de genre ailleurs, jamais de couleur de genre sur le rouge ; le rouge reste aux actions, aux notes, à la sélection et aux bandeaux.
  Contrastes WCAG AA vérifiés par `tools/contrast.mjs` (appelé par `check.mjs`).
- **Typographie** : Schibsted Grotesk seule, auto-hébergée (`assets/fonts/`, 400, 500, 700, 800 ; chiffres tabulaires limités aux chiffres). Échelle mobile / bureau : titre du site 44 / 72 px 800 capitales ; section 22 / 28 px 800 ; fiche 17 / 19 px 700 ; corps 15 / 16 px 400, interlignage 1,45 ; métadonnées 12 px 500 capitales +0,06em ; dates 13 / 14 px 800 capitales ; champs 16 px minimum. Guillemets « » avec espaces insécables, apostrophe ’, tiret demi-cadratin –. Ni cadratin ni espace fine dans les fichiers publiés (bloquant ; le mode admin les convertit à l'écriture).
- **Mise en page** : grille de 12 colonnes, 1120 px au plus ; 4 colonnes et marges de 16 px sur mobile. Espacements 4, 8, 12, 16, 24, 32, 48. Angles droits (2 px au plus sur les champs). Filet 1 px entre les lignes, 3 px au-dessus des sections. Une ligne par représentation, sans cartes. Cibles tactiles de 44 px.
- **Composants** : Radar (colonne de date portant le jalon : « J-3 », « fin », rouge à deux jours ou moins), en-tête rouge (barre compacte au défilement sur mobile), navigation en capitales soulignée de rouge, ligne de spectacle (colonne de date de 64 px, filet pointillé), bandeaux de jour rouges collants, note en quatre carrés (« P » = prévision), badge « Léonard y va » en aplat rouge et autres badges en contour, boutons rectangulaires, puces à contour (active en rouge), hachures pour les soirs pris, fiche à en-tête rouge (ou à l'aplat de la famille du genre), statistiques en grands chiffres et barres rouges, messages en bandeau, mode admin à en-tête noir et confirmations intégrées (jamais `confirm()`). Cœur des envies (géométrie stricte, contour au repos, plein en rouge), dans la navigation et, sur chaque ligne, tout à droite de la première ligne (titre à gauche, note puis cœur à droite) : plein et non modifiable pour le public (envies seulement), bouton en mode admin ; il ne rallonge ni ne recouvre jamais la ligne. Ligne de spectacle : bande pleine et fine de la couleur du genre à gauche, colonne de date, puis picto du genre (de sa couleur) et titre, avec note et cœur à droite, artistes, sous-genre, badges en tête de la ligne lieu (et horaires sur bureau) ; aucun bouton sur la ligne fermée. Fiche : « Site officiel » (`lien`) toujours, « Billetterie » seulement si l’adresse d’achat est distincte. Toucher une ligne déroule toute la fiche (infos, offres, boutons Billetterie et Partager, calendrier ; en admin, actions en petits boutons à icône). Journal : le déroulé montre la fiche comme en public ; en admin s’y ajoutent mes infos privées et un bouton « Modifier » (icône) qui ouvre le formulaire complet (dates, note, avis, places, notes, fiche) dans une fenêtre superposée. À l’affiche est la page d’accueil. Affiche : barre unique (recherche, Liste/Calendrier, Filtres), genres en puces, panneau de filtres replié par rubriques (Note, Où, Quand, Pour).
- **Icônes** (jeu unique `ICO` dans `app.js`, planche dans `#charte`) : trait 2 px sur grille de 24, extrémités carrées, angles vifs, rien ne dépasse la grille, aucun trait ne se touche à l'intérieur d'une icône ; en encre (blanc sur aplat rouge), jamais rouge sur fond clair. Une par genre (toujours suivie du mot, en surtitre au-dessus du titre de chaque ligne, à la couleur de la famille ; grande à côté du titre de la fiche) et des icônes d'interface qui remplacent un mot, libellé gardé en `aria-label` (thème soleil / lune / auto avec menu, cadenas de connexion, loupe, liste / mois, filtres, tri, fermer, partager, réserver, site officiel, lieu, horaires, statistiques, ventes, ajouter, modifier, supprimer, poignée). Jamais décoratives. Tailles : 14 px en métadonnées, 18–22 px dans les boutons, 40–48 px dans la fiche. Interface sobre : pas de phrase explicative ni de compte répété quand l'information est déjà visible.
- **Interdits** : polices Inter, Roboto, Poppins, Montserrat, Space Grotesk ou système ; dégradés (sauf hachures fonctionnelles), glassmorphisme, ombres, flou ; arrondis au-delà de 2 px, pilules, cartes flottantes ; emoji, bibliothèques d'icônes, pictogrammes décoratifs, toute icône hors du jeu Factotum, de la clé F et du cœur ; violet, indigo, bleu ardoise ou toute couleur hors palette ; héros centré, grandes sections vides, texte marketing ; animations d'échelle, rebonds, révélations au défilement, squelettes. Seules les transitions de couleur et d'opacité de 120 ms, aucune en mouvement réduit. Aucune bibliothèque CSS ou JS, aucune ressource externe (polices comprises).
- **Thème** : Auto (défaut), Clair, Sombre ; un bouton icône (demi-disque, soleil, lune) qui ouvre un menu, choix dans `localStorage` (try/catch), `data-theme` posé avant le rendu.

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
- `relaches` (facultatif) : jours sans représentation entre `debut` et `fin`, jours de semaine (`"lun"` … `"dim"`) ou dates ISO (`["lun", "2027-01-17"]`). Le calendrier de la fiche les retire. À renseigner dès que le calendrier du lieu est connu (y compris dates isolées : liste des jours sans spectacle).
- `offres[].vente` : `AAAA-MM-JJ` ou `AAAA-MM-JJTHH:MM` ; `venteApprox: true` si la date est estimée.
- `etat` (facultatif, sur la sortie ou sur une offre) : état des ventes, `dernieres-places`, `attente` (liste d'attente) ou `complet`. Absent = rien à signaler (en vente si l'ouverture est passée). Tenu à jour par `/veille` et le mode admin ; n'influe jamais sur la note.
- Journal : `statut: "vu"`, `vuLe` (liste de dates ISO), `noteLeonard` (1–4 ou null), `avis` (ses mots, jamais les tiens).
- Passage à vu : la fiche **sort** de `affiche.json` et **entre** dans `journal.json` (même id).
- « Public jeune » = adapté à un public jeune (jamais « avec ton frère »).

## Confidentialité (bloquant dans check.mjs)
**Jamais** dans un fichier public : `prix`, `accompagnants`, `places`, `siege`, `heure` (de réservation), date de réservation. Public = drapeau `leonardYVa` et la liste des envies (`data/envies.json`, identifiants seuls, page publique « Envies » sous le cœur de la navigation) ; note et date d’ajout d’une envie restent privées. Tout le reste va dans la zone privée. Les flux `.ics` (adresse secrète) contiennent prix et accompagnants : c'est voulu.

## Barème de notation (note 0–4)
La note est celle de la veille : elle mesure l'intérêt de la sortie, jamais l'état de Léonard. **Envie, réservation et « Léonard y va » n'entrent jamais dans le calcul** ; on ne relève ni ne baisse une note pour cette raison. Même barème pour toutes les catégories (théâtre, opéra, expos, concerts, cinéma, événements).

Quatre critères, chacun de 0 à 2 points :

| Critère | 0 | 1 | 2 |
|---|---|---|---|
| **C – Critique** | mitigée, mauvaise ou inexistante | bonne presse nationale (Le Monde, Libération, Télérama, Figaro, France Inter, Diapason, Forum Opéra…) | accueil unanime, ou prix majeur (Molière, Grand Prix de la critique, Victoire, Diapason d'or, ffff Télérama) |
| **A – Œuvre et artistes** | œuvre et équipe peu connues | œuvre ou artiste reconnu | œuvre majeure du répertoire **et** artiste ou maison de premier plan, ou artiste majeur sur une œuvre forte |
| **O – Opportunité** | longue série, reprise fréquente, plein tarif seulement | un atout : dernières dates, tarif jeune avantageux (≤ 15 €), rare à Paris | événement unique : création mondiale, une ou deux dates, retour après 10 ans ou plus, star rare à Paris |
| **G – Goûts de Léonard** | genre qu'il fréquente peu | genre qu'il aime : classiques revisités, scène européenne (Odéon, Festival d'Automne), opéra, Molière | artiste, auteur ou metteur en scène qu'il a déjà vu et noté 3 ou 4 dans le journal (`noteLeonard`), ou Mouawad |

**Total sur 8 → note** : 7–8 → **4** incontournable · 5–6 → **3** fortement recommandé · 3–4 → **2** bon choix si disponible · 1–2 → **1** curiosité · 0 → pas de fiche. 0 dans `note` reste réservé au journal (vu sans note de veille).
- **Pronostic** (création pas encore critiquée) : C est estimé d'après l'accueil des deux dernières productions de l'équipe, au plus 1 ; `pronostic: true`. Dès que des critiques paraissent, recalcule C pour de bon et passe `pronostic` à false.
- **Plafond** : une quinzaine de 4 par saison au plus. Au-delà, garde en 4 les plus hauts totaux (à égalité, l'opportunité la plus forte) et passe les autres à 3.
- **Révision** : seulement quand un critère change (critiques parues, prix, dates ajoutées ou supprimées, offre jeune ouverte). Une sortie complète garde sa note (l'état de vente est dans `etat`).
- **Trace** : `pourquoi` reste une phrase factuelle ; dans la réponse de `/veille` ou `/note`, donne le détail « C2 A1 O1 G2 = 6 → 3 » pour chaque note posée ou révisée.

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
 "envies":{"<id>":{"ajouteLe":"2026-11-13","note":""}},
 "journalPrive":{"<id>":{"places":2,"billets":[{"spectateur":"Moi","prix":20,"paiement":"moi"},{"spectateur":"Papa","prix":75,"paiement":"offert","categoriePlace":"cat. 4"}],"accompagnants":["Papa"],"notes":"…"}},
 "blocages":[{"debut":"2027-04-10","fin":"2027-04-20","motif":"…"}],
 "aCompleter":[{"ajouteLe":"2026-11-14","texte":"…confirmation collée…","extrait":{"sortieId":null,"date":"2027-02-03","heure":"19:30","salle":"","places":1,"siege":"","prixPlace":12,"tarif":""}}]}
```
Une envie est binaire (pas de priorité ni de rang) ; `note` = note privée. Une seule réservation par sortie (clé = id).
**Places et prix** (réservations et journalPrive) : `billets`, **une ligne par spectateur** : `spectateur` (« Moi » ou un prénom déjà utilisé, voir l'onglet Accompagnants ; vide si inconnu), `prix` (de cette place, en euros, `null` si inconnu), `paiement`, `tarif` et `categoriePlace` facultatifs. `paiement` : `moi` (payée par Léonard ; défaut ; pour un tiers, place qu'il lui offre), `autrui` (place de Léonard offerte par quelqu'un : `prix` = valeur commerciale, hors dépenses), `spectateur` (le tiers paie sa part, ex. Alexandre), `gratuit` (gratuité, mécénat, cadeau reçu : prix 0). `places` = nombre de lignes ; `accompagnants` = spectateurs autres que « Moi » (toujours tenu à jour). `pleinPlace` (facultatif) = plein tarif par place, pour les économies. `notes` (journalPrive, facultatif) = notes privées de Léonard sur la sortie vue.
Tableau de bord : **payé par moi** = places de Moi en `moi` + places de tiers en `moi` (ancien `offert` lu comme `moi`), détaillé en « pour moi » et « offerts aux autres » ; **valeur de mes places** = toutes les places de Moi ; **offerts à moi** = places de Moi en `autrui` ; **valeur de toutes les places** et **réglé par les accompagnants** (`spectateur`). Les anciens champs (`prix` total, `prixPlace`, `pour`) sont encore lus mais ne s’écrivent plus.
`blocages` : périodes privées (`debut`, `fin` inclus, `motif`) comptées dans les conflits mais jamais publiées dans `dispo.json`.
`aCompleter` : billets collés dans la saisie rapide du site et non reconnus. `/veille` les traite (voir plus bas).

## Fichiers générés (`node tools/build.mjs`)
- `index-artistes.json` (`{slug: {nom, sorties}}`) et `index-lieux.json` (`{lieuId: {sorties}}`), même sans mot de passe.
- `dispo.json.reservations`, `envies.json`, flux agenda, flux ventes : avec `SAISON_MDP` (ou `_prive.json` ouvert).
- Flux ventes : un événement de 15 min à l'heure d'ouverture (10h si inconnue, « ~ » si approximative), alarme 15 min avant, pour toute offre dont la sortie est en envie, réservée, notée 4, ou de type avant-première.
- L'action « Publier le site » relance `build.mjs` à chaque passage (avec le secret) et commite les fichiers générés. Sortie déterministe : pas de commit si rien n'a changé.

## Mode admin (site, onglet cadenas)
Léonard gère aussi tout depuis le site (iPhone) : envies (cœur, note privée), réservations, vu, ajout et modification de sorties, lieux (ajout, modification, suppression d'un lieu inutilisé), saisie rapide de billets, soirs pris et périodes bloquées privées, liens, tableau de bord (engagé, payé par moi, pour mon bénéfice), accompagnants, abonnements.
- Connexion : mot de passe (déchiffre `prive.enc` dans le navigateur). Première fois sur un appareil : jeton GitHub « fine-grained » limité au dépôt (Contents : lecture et écriture ; Actions : lecture), testé puis rangé dans `localStorage` chiffré avec une clé dérivée du mot de passe. Cadenas de l'en-tête (fenêtre en surimpression ; l'onglet Admin n'apparaît qu'une fois connecté). Session gardée 1 jour (défaut), 7 jours ou jusqu'à la fermeture de l'onglet : clé AES non extractible dans IndexedDB, effacée à l'échéance ou par « Se déconnecter » (cadenas ouvert de l'en-tête), « Oublier cet appareil » efface aussi le jeton.
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
