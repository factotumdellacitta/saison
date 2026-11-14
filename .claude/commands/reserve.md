---
description: Enregistrer une réservation (ex. /reserve Werther 8 février 20h, 2 places, 24 € Carte Jeune, avec Paul)
---
Réservation : $ARGUMENTS

1. Identifie la sortie dans `data/affiche.json` (crée-la s'il n'existe pas, selon CLAUDE.md).
2. Vérifie les conflits (`dispo.json` toutes listes, réservations privées, `blocages`). S'il y en a un, signale-le mais enregistre quand même.
3. `node tools/prive.mjs ouvrir`, ajoute ou mets à jour `reservations[id]` : `date`, `heure` (20:00 si inconnue, et note « heure à préciser »), `salle`, `places`, `siege`, `prixPlace` (prix **par place**, nombre en euros) ou, si les places n'ont pas le même prix, `billets` (`[{pour, prix, tarif?, categoriePlace?}]`, une entrée par place), `tarif`, `categoriePlace` (cat. 1…), `pleinPlace` (plein tarif par place, facultatif), `accompagnants` (prénoms), `billetterie`, `note`. Retire l'id de `envies` s'il y est. Puis `node tools/prive.mjs fermer`.
4. Passe `leonardYVa` à true dans la fiche publique. Rien d'autre de la réservation ne va dans un fichier public.
5. Procédure CLAUDE.md (build, check, commit, push) et réponds en 2 lignes.
