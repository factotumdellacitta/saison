---
description: Déclarer des soirs pris (ex. /pris 20 au 28 décembre, ou /pris tous les mercredis jusqu'en juin)
---
Soirs pris : $ARGUMENTS

1. Convertis en liste de dates ISO (Europe/Paris) et ajoute-les à `manuel` dans `data/dispo.json`, sans doublon, triées. Pas de motif.
2. Signale les réservations (zone privée) ou avant-premières visées qui tombent ces soirs-là.
3. Procédure CLAUDE.md, réponse en 1–2 lignes.
Pour libérer des soirs (« /pris retire le 3 mars »), retire-les de `manuel`.
