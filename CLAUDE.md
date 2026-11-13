# Projet « Saison » – règles pour Claude Code

Site public de Léonard : https://factotumdellacitta.github.io/saison/
Il centralise trois usages : **prospection** (catalogue noté), **calendrier** (réservations, soirs pris, flux Apple Calendar) et **archivage** (déjà vus, type Letterboxd).
Léonard écrit en français, style direct. Réponds en français, brièvement, sans préambule. Pas de tiret cadratin ni d'espace fine : utilise « – » ou la virgule.

## Fichiers

| Fichier | Contenu | Public ? |
| --- | --- | --- |
| `data/spectacles.json` | `{maj, spectacles:[…]}` : toutes les fiches (à voir, vus, écartés) | Oui |
| `data/lieux.json` | `{ "Nom du lieu": {statut: Public/Privé, zone: Paris/Petite couronne/Avignon…, tarifJeune, site} }` | Oui |
| `data/dispo.json` | `reservations` (généré), `manuel` (soirs pris déclarés), `calendrier` (généré par l'action depuis Apple Calendar) : dates seules | Oui |
| `data/prive.enc` | Zone privée chiffrée : `reservations{id:{date,heure,salle,places,note}}`, `envies[]`, `notes{}`, `icsToken` | Chiffré |
| `data/agenda-<icsToken>.ics` | Flux Apple Calendar des réservations, généré | Adresse non devinable |
| `index.html` | Le site. Ne le modifie que si Léonard demande un changement d'interface. | |

## Fiche spectacle (spectacles.json)

```json
{"id":"ruy-blas","titre":"Ruy Blas","credits":"Hugo / Julie Duclos","genre":"Théâtre","lieu":"Comédie-Française","salle":"Richelieu",
 "debut":"2026-10-15","fin":"2027-01-27","note":3,"pronostic":true,"pourquoi":"Une phrase factuelle.","lien":"https://…",
 "publicJeune":false,"leonardYVa":false,"statut":"a-voir","offres":[{"type":"Avant-première jeunes","date":"2027-01-25","tarif":"10 €","vente":"2027-01-07T12:00"}]}
```
- `id` : minuscules, chiffres, tirets. Les vus anciens sont préfixés `vu-`.
- `genre` ∈ Théâtre, Opéra, Danse, Comédie musicale, Récital, Concert, Cirque (archives : aussi Cinéma, Exposition, Autre).
- `statut` ∈ `a-voir`, `vu`, `ecarte`. Un vu a `vuLe` (liste de dates ISO), et éventuellement `noteLeonard` (1–4) et `avis` (ses mots, jamais les tiens).
- `lieu` doit exister dans `lieux.json` (sinon ajoute-le).
- **Jamais** de date de réservation, d'heure ou de place dans ce fichier : tout ça va dans la zone privée. Public = drapeau `leonardYVa` seulement.
- « Public jeune » = adapté à un public jeune (jamais « avec ton frère »).

## Grille de notation (note 1–4)
Critique (presse nationale, prix, accueil à la création) + statut de l'œuvre et de l'artiste + opportunité (rareté, dernières dates, tarif jeune) + goûts de Léonard (classiques revisités, scène européenne Odéon/Festival d'Automne, opéra, Mouawad, Molière ; voir ses `vu` les mieux notés).
- 4 incontournable (une quinzaine par saison au plus) · 3 fortement recommandé · 2 bon choix si disponible · 1 curiosité. En dessous : pas de fiche.
- `pronostic: true` si création non encore critiquée ; à retirer dès que des critiques existent.

## Liens
Toujours la page officielle du spectacle sur le site du théâtre. À défaut, page officielle du festival, puis page de saison du théâtre. L'Officiel des spectacles seulement en dernier recours. Pour un vu : page archivée officielle si elle existe.

## Zone privée et mot de passe
Le mot de passe est dans la variable d'environnement `SAISON_MDP`. Ne l'affiche jamais, ne l'écris dans aucun fichier.
- `node tools/prive.mjs ouvrir` → `_prive.json` en clair (ignoré par git). Modifie-le.
- `node tools/prive.mjs fermer` → rechiffre et supprime le clair. **Obligatoire avant tout commit.**

## Procédure à chaque modification
1. Modifie les données (et la zone privée si besoin, puis `fermer`).
2. `node tools/build.mjs` (soirs réservés + flux agenda).
3. `node tools/check.mjs` : corrige jusqu'à « OK ».
4. Mets `maj` de spectacles.json à la date du jour.
5. Commit en français, une ligne par changement (« Réservé : Werther le 8 févr. »), puis push. La branche `claude/…` est fusionnée et publiée automatiquement par GitHub Actions : ne crée pas de pull request.
6. Réponds à Léonard en 2–4 lignes : ce qui a changé, conflits éventuels, prochaines ventes utiles.

## Contrôles automatiques à faire de toi-même
- Conflit : avant toute réservation, vérifie `dispo.json` (toutes listes) et les réservations privées ; signale tout soir déjà pris.
- Avant d'ajouter un spectacle : vérifie qu'il n'est pas déjà en `vu` (même œuvre, même production).
- Une réservation passée (date < aujourd'hui) : demande à Léonard s'il l'a vue, puis propose `/vu`.
