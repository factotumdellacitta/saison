# Projet « Saison » – règles pour Claude Code

Site public de Léonard : https://factotumdellacitta.github.io/saison/
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
| `data/agenda-<icsToken>.ics` | Flux « Saison – réservations », généré | Adresse non devinable |
| `data/ventes-<icsToken>.ics` | Flux « Saison – ouvertures de ventes », généré | Adresse non devinable |
| `index.html`, `assets/app.js`, `sw.js` | Le site (coque et CSS, logique, service worker). Ne les modifie que si Léonard demande un changement d'interface. | |

Le site publié ne contient que `index.html`, `sw.js`, `assets/` et `data/`. Jamais `tools/`, `_setup/` ni fichier en clair.
Après toute modification de `assets/app.js` : incrémente `?v=` dans `index.html` et dans `SHELL` de `sw.js`, ainsi que `V` dans `sw.js` (sinon les téléphones gardent l'ancienne version en cache). Icônes et image de partage : `node tools/visuels.mjs` (une fois).
Routes du site : `#affiche?filtres`, `#journal`, `#artistes`, `#lieux`, `#artiste-<slug>`, `#lieu-<id>`, `#liens`, `#sortie-<id>`, `#admin` (les anciens `#fiche-<id>` redirigent).

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
- `node tools/prive.mjs fermer` → rechiffre et supprime le clair. **Obligatoire avant tout commit.**

Schéma (version 2) :
```json
{"version":2,"icsToken":"…",
 "reservations":{"<id>":{"date":"2027-02-08","heure":"20:00","salle":"","places":2,"siege":"","prix":24,"tarif":"Carte Jeune","accompagnants":["…"],"billetterie":"","note":""}},
 "envies":{"<id>":{"ajouteLe":"2026-11-13","priorite":2,"note":""}},
 "journalPrive":{"<id>":{"prix":24,"accompagnants":["…"]}},
 "blocages":[]}
```
`priorite` : 1 forte, 2 normale, 3 faible.

## Fichiers générés (`node tools/build.mjs`)
- `index-artistes.json` (`{slug: {nom, sorties}}`) et `index-lieux.json` (`{lieuId: {sorties}}`), même sans mot de passe.
- `dispo.json.reservations`, flux agenda, flux ventes : avec `SAISON_MDP` (ou `_prive.json` ouvert).
- Flux ventes : un événement de 15 min à l'heure d'ouverture (10h si inconnue, « ~ » si approximative), alarme 15 min avant, pour toute offre dont la sortie est en envie, réservée, notée 4, ou de type avant-première.
- L'action « Publier le site » relance `build.mjs` à chaque passage (avec le secret) et commite les fichiers générés. Sortie déterministe : pas de commit si rien n'a changé.

## Procédure à chaque modification
1. Modifie les données (et la zone privée si besoin, puis `fermer`).
2. `node tools/build.mjs`.
3. `node tools/check.mjs` : corrige jusqu'à « OK ».
4. Mets `maj` de affiche.json (et journal.json s'il a changé) à la date du jour.
5. Commit en français, une ligne par changement (« Réservé : Werther le 8 févr. »), puis push. La branche `claude/…` est fusionnée et publiée automatiquement par GitHub Actions : ne crée pas de pull request.
6. Réponds à Léonard en 2–4 lignes : ce qui a changé, conflits éventuels, prochaines ventes utiles.

## Contrôles automatiques à faire de toi-même
- Conflit : avant toute réservation, vérifie `dispo.json` (toutes listes), les réservations privées et `blocages` ; signale tout soir déjà pris.
- Avant d'ajouter une sortie : vérifie qu'elle n'est pas déjà dans l'affiche ou le journal (même œuvre, même production).
- Une réservation passée (date < aujourd'hui) : demande à Léonard s'il l'a vue, puis propose `/vu`.

## Commandes
`/ajoute`, `/reserve`, `/vu`, `/pris`, `/note`, `/veille`, `/envie`, `/modifie`, `/annule`, `/import` (voir `.claude/commands/`).
