# Initialisation (à faire une seule fois par Claude Code)

1. Si `.github/workflows/` est absent, crée-le en copiant `_setup/github-workflows/*`. Si `.claude/commands/` est absent, copie `_setup/claude-commands/*`.
2. Vérifie que `SAISON_MDP` est défini (sans l'afficher). S'il manque, arrête-toi et dis à Léonard de l'ajouter dans les variables d'environnement Claude Code.
3. `node tools/prive.mjs init _setup/prive-initial.json` (chiffre la zone privée, crée le jeton des flux, supprime le fichier en clair).
4. `node tools/build.mjs` puis `node tools/check.mjs`.
5. Supprime `_setup/github-workflows` et `_setup/claude-commands` si les dossiers définitifs existent. Garde ce fichier.
6. Commit « Initialisation du site » et push.
7. Réponds à Léonard avec :
   - l'adresse du site : https://factotumdellacitta.github.io/saison/
   - où trouver les adresses d'abonnement Apple Calendar : mode admin du site, onglet Abonnements (elles ne s'écrivent jamais dans le dépôt ni dans une réponse publique)
   - un rappel : l'onglet Actions du dépôt doit montrer deux coches vertes (« Intégrer » puis « Publier »).
