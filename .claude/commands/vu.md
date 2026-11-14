---
description: Archiver une sortie vue (ex. /vu Faust ★★★★ « vertigineux, trop long »)
---
Sortie vue : $ARGUMENTS

1. Trouve la fiche dans `data/affiche.json` (ou dans `data/journal.json` si c'est une nouvelle date d'une sortie déjà vue ; sinon crée-la directement dans le journal). Date : celle de la réservation privée si elle existe, sinon celle donnée, sinon aujourd'hui.
2. Déplace la fiche de `affiche.json` vers `journal.json` (même id) : `statut: "vu"`, ajoute la date à `vuLe`, `noteLeonard` (nombre d'étoiles donné, sinon null), `avis` (ses mots exacts, sinon vide), `leonardYVa: false`.
3. Cherche la page officielle archivée et mets-la dans `lien` si la fiche n'en a pas.
4. Zone privée (ouvrir / fermer) : si une réservation existe, copie `places`, `prixPlace` ou `billets`, `tarif`, `categoriePlace`, `pleinPlace` et `accompagnants` dans `journalPrive[id]`, puis retire la réservation ; retire aussi l'id de `envies`.
5. Procédure CLAUDE.md (mets aussi à jour `maj` de journal.json), réponse en 1–2 lignes.
