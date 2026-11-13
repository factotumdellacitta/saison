---
description: Annuler une réservation ou écarter une sortie (ex. /annule réservation Werther ; /annule Giselle)
---
Annulation : $ARGUMENTS

- **Réservation** : `node tools/prive.mjs ouvrir`, supprime `reservations[id]`, `fermer`. Passe `leonardYVa` à false dans la fiche publique.
- **Sortie** (« je n'irai pas », « pas intéressé ») : `statut: "ecarte"` dans `affiche.json` (ne la supprime pas, la veille ne doit pas la reproposer). Retire-la aussi de `envies`.
- **Erreur de saisie** (fiche créée par erreur, sans réservation ni journal) : supprime la fiche.
Procédure CLAUDE.md, réponse en 1 ligne.
