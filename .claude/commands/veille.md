---
description: Veille hebdomadaire complète (lancée chaque lundi par la routine)
---
Veille de la semaine. Fais tout, dans cet ordre, puis un seul commit :

1. **Ménage** : sorties `a-voir` de `affiche.json` terminées depuis plus de 7 jours → retire-les (sauf réservation ou envie en cours). Les `ecarte` terminés aussi.
2. **Réservations passées** : liste-les dans ta réponse pour que Léonard confirme avec /vu.
2 bis. **File « À compléter »** (`aCompleter` dans la zone privée, alimentée par la saisie rapide du site) : pour chaque billet, retrouve la sortie (ou ajoute-la), enregistre la réservation (contrôle de conflit, `leonardYVa: true`), puis retire l'élément de la file. Ce qui reste ambigu : garde-le et pose la question dans ta réponse.
3. **Nouveautés** : parcours les programmations des lieux de `lieux.json` (zones Paris et Petite couronne) et les sources de `liens.json`. Couvre toutes les catégories : théâtre, opéra, danse, comédie musicale, récitals, concerts, festivals, **expositions** (musées et fondations), **cinéma** (rétrospectives, avant-premières, ciné-concerts), **événements** (salons, conférences, visites, spectacles immersifs), à Paris et en petite couronne. Ajoute ce qui mérite au moins 2 selon la grille (même grille pour toutes les catégories). Ne repropose pas une sortie `ecarte` ou déjà au journal.
4. **Offres** : avant-premières jeunes de l'Opéra de Paris, Carte Jeunes TCE, tarifs -28/-30 ans, gratuités jeunes des musées ; ajoute les offres et dates de vente manquantes (`venteApprox` si estimée).
5. **Critiques** : révise les notes `pronostic`.
6. **Liens** : complète les liens officiels et `billetterie` manquants (affiche, puis journal) ; signale les URL mortes de `liens.json`.
7. Procédure CLAUDE.md.
8. Réponse courte : ventes qui ouvrent dans les 14 jours, nouveautés ★★★ et plus, notes révisées, réservations à confirmer.
