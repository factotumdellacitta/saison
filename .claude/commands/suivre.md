---
description: Suivre un artiste dans la veille (ex. /suivre Zaho de Sagazan ; /suivre Julien Gosselin, Christiane Jatahy)
---
À suivre : $ARGUMENTS

1. Pour chaque nom : retrouve la graphie exacte dans `data/index-artistes.json` (sinon vérifie-la sur une source officielle : nom complet, accents, apostrophe ’). Nom ambigu ou introuvable : pose la question, n'invente pas.
2. `node tools/prive.mjs ouvrir`, ajoute à `suivis` `{nom, domaine, depuis: aujourd'hui, origine: "manuel"}` (`domaine` ∈ Théâtre, Danse, Musique, Classique et lyrique) s'il n'y est pas déjà, garde la liste triée par domaine puis par nom, puis `node tools/prive.mjs fermer`.
3. Passage rapide sur chaque artiste ajouté : dates annoncées à Paris et en petite couronne, mises en vente. Ce qui obtient au moins 2 au barème entre à l'affiche selon la section « Veille » de CLAUDE.md (`lien`, `source`, `nouveau: true`, offres datées).
4. Procédure CLAUDE.md. Le commit ne nomme jamais l'artiste suivi (« Veille : liste de suivi mise à jour »).
5. Réponse : la liste de suivi par domaine avec leur nombre, ce qui a changé, et le nombre de fiches ajoutées.
