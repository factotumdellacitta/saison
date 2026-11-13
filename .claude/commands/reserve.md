---
description: Enregistrer une réservation (ex. /reserve Werther 8 février 20h, 2 places)
---
Réservation : $ARGUMENTS

1. Identifie le spectacle dans `data/spectacles.json` (crée la fiche s'il n'existe pas, selon CLAUDE.md).
2. Vérifie les conflits (dispo.json et réservations privées). S'il y en a un, signale-le mais enregistre quand même.
3. `node tools/prive.mjs ouvrir`, ajoute ou mets à jour `reservations[id]` : date, heure (20:00 si inconnue, et note « heure à préciser »), salle, places, note. Puis `node tools/prive.mjs fermer`.
4. Passe `leonardYVa` à true dans la fiche publique.
5. Suis la procédure de CLAUDE.md (build, check, commit, push) et réponds en 2 lignes.
