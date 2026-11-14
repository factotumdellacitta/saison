---
description: Veille hebdomadaire complète (lancée chaque lundi par la routine)
---
Veille de la semaine. Fais tout, dans cet ordre, puis un seul commit :

1. **Ménage** : sorties `a-voir` de `affiche.json` terminées depuis plus de 7 jours → retire-les (sauf réservation ou envie en cours). Les `ecarte` terminés aussi.
2. **Réservations passées** : liste-les dans ta réponse pour que Léonard confirme avec /vu.
2 bis. **File « À compléter »** (`aCompleter` dans la zone privée, alimentée par la saisie rapide du site) : pour chaque billet, retrouve la sortie (ou ajoute-la), enregistre la réservation (contrôle de conflit, `leonardYVa: true`), puis retire l'élément de la file. Ce qui reste ambigu : garde-le et pose la question dans ta réponse.
3. **Nouveautés** : parcours les programmations des lieux de `lieux.json` (zones Paris et Petite couronne) et les sources de `liens.json`. Couvre toutes les catégories : théâtre, opéra, danse, comédie musicale, récitals, concerts, festivals, **expositions** (musées et fondations), **cinéma** (rétrospectives, avant-premières, ciné-concerts), **événements** (salons, conférences, visites, spectacles immersifs), à Paris et en petite couronne. Note chaque nouveauté avec le **barème de CLAUDE.md** (total sur 8, même barème pour toutes les catégories) et ajoute ce qui obtient au moins 2. Ne repropose pas une sortie `ecarte` ou déjà au journal.
4. **Offres** : avant-premières jeunes de l'Opéra de Paris, Carte Jeunes TCE, tarifs -28/-30 ans, gratuités jeunes des musées ; ajoute les offres et dates de vente manquantes (`venteApprox` si estimée). Mets à jour l'**état des ventes** (`etat` : `dernieres-places`, `attente` ou `complet`, sur la sortie entière ou sur une offre ; retire le champ quand des places reviennent) en priorité pour les sorties notées 4, en envie ou dont la vente ouvre sous 14 jours.
5. **Critiques et notes** : recalcule avec le barème les notes `pronostic` dont les critiques sont parues, et toute note dont un critère a changé (prix, dates, offre). Jamais en fonction des envies ou des réservations. Vérifie le plafond des 4.
6. **Liens** : complète les liens officiels et `billetterie` manquants (affiche, puis journal) ; signale les URL mortes de `liens.json`.
7. Procédure CLAUDE.md.
8. Réponse courte, dans l'ordre du Radar : ventes qui ouvrent dans les 7 jours, notes 4 encore à réserver, dernières chances (fin sous 21 jours, note 3+), nouveautés notées 3 et plus, notes révisées avec leur détail (« C2 A1 O1 G2 = 6 → 3 »), réservations à confirmer.
