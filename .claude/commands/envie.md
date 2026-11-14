---
description: Noter une envie (ex. /envie Werther ; /envie retire Giselle)
---
Envie : $ARGUMENTS

1. Identifie la sortie dans `data/affiche.json` (crée-la selon CLAUDE.md si elle n'existe pas).
2. `node tools/prive.mjs ouvrir`, ajoute ou mets à jour `envies[id]` : `ajouteLe` (aujourd'hui) et `note` (privée, facultative). Pas de priorité : une envie est binaire, et elle ne change jamais la note de la sortie. Pour « retire », supprime l'entrée. Puis `node tools/prive.mjs fermer`.
3. Les ouvertures de ventes de cette sortie apparaissent alors dans le flux « ouvertures de ventes ».
4. Procédure CLAUDE.md. Réponse en 1–2 lignes, avec les prochaines ventes de la sortie s'il y en a.
