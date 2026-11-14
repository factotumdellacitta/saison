# Saison

Veille, agenda et archive des sorties culturelles de Léonard (théâtre, opéra, danse, concerts, expositions, cinéma, événements) : https://factotumdellacitta.github.io/saison/

Données dans `data/` (`affiche.json`, `journal.json`, `lieux.json`, `liens.json`, `dispo.json`, zone privée chiffrée `prive.enc`), site dans `index.html`, règles de maintenance dans `CLAUDE.md`.
Mises à jour via Claude Code (`/ajoute`, `/reserve`, `/vu`, `/pris`, `/note`, `/veille`, `/envie`, `/modifie`, `/annule`, `/import`), fichiers dérivés et publication automatiques par GitHub Actions (secrets `SAISON_MDP` et `ICLOUD_ICS_URL`).

## Mode admin (depuis le site)
Onglet cadenas « Admin » : mot de passe de la zone privée, plus, la première fois sur un appareil, un jeton GitHub « fine-grained » limité au dépôt `saison` (Contents : lecture et écriture ; Actions : lecture). Le jeton est conservé sur l'appareil, chiffré avec le mot de passe.
Chaque action (envie, réservation, vu, ajout de sortie, saisie rapide de billets, soirs pris, liens) crée un commit sur `main` via l'API GitHub, puis le workflow « Publier le site » régénère les fichiers dérivés et publie (environ 1 à 2 min). Code : `assets/admin.js`. Détails et règles : `CLAUDE.md`, section « Mode admin ».
