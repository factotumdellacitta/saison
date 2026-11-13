---
description: Importer des sorties en lot (ex. /import liste collée, fichier CSV, brochure, historique de billets)
---
À importer : $ARGUMENTS

1. Lis la source (texte collé, fichier du dépôt, page web). Pour chaque entrée, détermine si elle va dans l'affiche (à venir) ou le journal (déjà vue, avec `vuLe`).
2. Dédoublonne contre `affiche.json` et `journal.json` (même œuvre, même production) ; complète les fiches existantes au lieu d'en créer.
3. Crée les lieux manquants, réutilise les graphies de `index-artistes.json`, note selon la grille (journal : `note` 0 si non évaluée).
4. Les prix, places, sièges et accompagnants éventuels vont dans la zone privée (`reservations` ou `journalPrive`), jamais dans les fichiers publics.
5. Procédure CLAUDE.md. Réponse : nombre importé (affiche / journal), doublons ignorés, entrées à vérifier.
