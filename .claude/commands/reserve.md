---
description: Enregistrer une réservation (ex. /reserve Werther 8 février 20h, 2 places, 24 € Carte Jeune, avec Paul)
---
Réservation : $ARGUMENTS

1. Identifie la sortie dans `data/affiche.json` (crée-la s'il n'existe pas, selon CLAUDE.md).
2. Vérifie les conflits (`dispo.json` toutes listes, réservations privées, `blocages`). S'il y en a un, signale-le mais enregistre quand même.
3. `node tools/prive.mjs ouvrir`, ajoute ou mets à jour `reservations[id]` : `date`, `heure` (20:00 si inconnue, et note « heure à préciser »), `salle`, `siege`, `billets` (une ligne par spectateur : `spectateur` « Moi » ou prénom, `prix` de la place, `paiement` moi / offert / spectateur / gratuit, `tarif` et `categoriePlace` facultatifs ; voir CLAUDE.md), `places` (= nombre de lignes), `pleinPlace` (facultatif), `accompagnants` (spectateurs autres que Moi), `billetterie`, `note`. Retire l'id de `envies` s'il y est. Puis `node tools/prive.mjs fermer`.
4. Passe `leonardYVa` à true dans la fiche publique. Rien d'autre de la réservation ne va dans un fichier public.
5. Procédure CLAUDE.md (build, check, commit, push) et réponds en 2 lignes.
