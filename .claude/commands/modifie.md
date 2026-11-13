---
description: Corriger une sortie, un lieu ou une réservation (ex. /modifie Ruy Blas : fin le 30 janvier ; /modifie réservation Werther 19h30)
---
Modification : $ARGUMENTS

1. Identifie la cible : sortie (`affiche.json` ou `journal.json`), lieu (`lieux.json`), lien (`liens.json`) ou donnée privée (réservation, envie, journalPrive : `node tools/prive.mjs ouvrir` / `fermer`).
2. Applique seulement la modification demandée. Un `id` ne change jamais. Un changement de nom d'artiste se répercute sur toutes les fiches qui le citent (vérifie `index-artistes.json`).
3. Si une date de réservation change, vérifie les conflits comme pour /reserve.
4. Procédure CLAUDE.md. Réponse en 1–2 lignes : avant → après.
