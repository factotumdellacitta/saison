---
description: Ne plus suivre un artiste dans la veille (ex. /nesuisplus Kungs)
---
À ne plus suivre : $ARGUMENTS

1. `node tools/prive.mjs ouvrir`, retire de `suivis` chaque artiste nommé (comparaison sans accents ni casse ; plusieurs correspondances : pose la question), puis `node tools/prive.mjs fermer`.
2. Ne touche à aucune fiche : les sorties déjà à l'affiche restent, avec leur note.
3. Procédure CLAUDE.md. Le commit ne nomme jamais l'artiste (« Veille : liste de suivi mise à jour »).
4. Réponse : qui a été retiré, combien d'artistes restent suivis par domaine, et le nombre de fiches ajoutées (aucune).
