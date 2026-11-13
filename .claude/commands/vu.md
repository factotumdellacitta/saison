---
description: Archiver un spectacle vu (ex. /vu Faust ★★★★ « vertigineux, trop long »)
---
Spectacle vu : $ARGUMENTS

1. Trouve la fiche (ou crée-la avec `statut: "vu"`). Date : celle de la réservation privée si elle existe, sinon celle donnée, sinon aujourd'hui.
2. `statut: "vu"`, ajoute la date à `vuLe`, `noteLeonard` (nombre d'étoiles donné, sinon laisse vide), `avis` (ses mots exacts, sinon vide). `leonardYVa: false`.
3. Cherche la page officielle archivée du spectacle et mets-la dans `lien` si la fiche n'en a pas.
4. Retire la réservation de la zone privée (ouvrir / fermer).
5. Procédure CLAUDE.md, réponse en 1–2 lignes.
