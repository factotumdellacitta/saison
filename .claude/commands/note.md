---
description: Réviser la note d'une ou plusieurs sorties (ex. /note Ruy Blas, ou /note tous les pronostics de la Comédie-Française)
---
À réviser : $ARGUMENTS

1. Cherche les critiques parues (presse nationale, sites spécialisés).
2. Applique le **barème de CLAUDE.md** (C, A, O, G de 0 à 2, total sur 8 → note). Envie et réservation n'entrent jamais en compte. Dans `data/affiche.json`, ajuste `note`, retire `pronostic` (false) si des critiques existent, complète `pourquoi` en une phrase factuelle (« Salué par la critique » ou une nuance).
3. Vérifie le plafond (une quinzaine de 4 par saison).
4. Procédure CLAUDE.md. Réponse : une ligne par sortie, « ancienne → nouvelle (C2 A1 O1 G2 = 6) ».
