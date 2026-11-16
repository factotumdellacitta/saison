---
description: Ajouter une ou plusieurs sorties (ex. /ajoute La Mouette, Odéon, mars 2027 ; /ajoute expo Bourse de Commerce)
---
À ajouter : $ARGUMENTS

1. Recherche sur le web la page officielle, les dates exactes, les artistes (avec leur rôle), les horaires, la billetterie, les offres jeunes et les dates d'ouverture des ventes.
2. Vérifie qu'elle n'existe pas déjà dans `data/affiche.json`, `data/journal.json` ou `data/archive.json` (même œuvre, même production ; une sortie archivée que Léonard veut revoir à l'affiche y retourne avec son id).
3. Vérifie que le lieu existe dans `data/lieux.json` (sinon crée-le avec un `lieuId` en slug). Pour chaque artiste, réutilise la graphie de `data/index-artistes.json` s'il y figure.
4. Crée la sortie dans `affiche.json` selon CLAUDE.md (bonne `categorie`, `sousGenre` si utile), note selon le barème de CLAUDE.md (avec `calcul`), `pourquoi` en une phrase factuelle, `source` = adresse d'où vient l'information. Aucun champ inventé.
5. **Exposition** (`categorie: "Exposition"`, section « Factotum Expo » de CLAUDE.md) : ajoute le bloc `expo` (`type` musée, fondation ou galerie, `tarif`, `gratuit`, `jeunes` dont `gratuit-ue-18-25` quand la gratuité des musées nationaux s'applique, `creneau`, `nocturnes`, `source`, `ajouteLe` = aujourd'hui), `relaches` = jours de fermeture, artistes exposés en `artiste` et commissaires en `commissaire`, `lien` officiel obligatoire, adresse du lieu avec code postal (arrondissement). Elle paraît sur Factotum Expo.
6. Procédure CLAUDE.md. Réponse : la note attribuée et pourquoi, une ligne par sortie.
