---
description: Ajouter une ou plusieurs sorties (ex. /ajoute La Mouette, Odéon, mars 2027 ; /ajoute expo Bourse de Commerce)
---
À ajouter : $ARGUMENTS

1. Recherche sur le web la page officielle, les dates exactes, les artistes (avec leur rôle), les horaires, la billetterie, les offres jeunes et les dates d'ouverture des ventes.
2. Vérifie qu'elle n'existe pas déjà dans `data/affiche.json` ou `data/journal.json` (même œuvre, même production).
3. Vérifie que le lieu existe dans `data/lieux.json` (sinon crée-le avec un `lieuId` en slug). Pour chaque artiste, réutilise la graphie de `data/index-artistes.json` s'il y figure.
4. Crée la sortie dans `affiche.json` selon CLAUDE.md (bonne `categorie`, `sousGenre` si utile), note selon la grille, `pourquoi` en une phrase factuelle.
5. Procédure CLAUDE.md. Réponse : la note attribuée et pourquoi, une ligne par sortie.
