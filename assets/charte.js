/* Factotum – page #charte : référence vivante de la charte graphique (non liée dans la navigation).
   Données factices uniquement. Chargée à la demande par app.js. */
(() => {
  const NOTES = { 4: "incontournable", 3: "fortement recommandé", 2: "bon choix si disponible", 1: "curiosité" };
  const note = (n, pro) => `<span class="st" role="img" aria-label="${n} sur 4, ${NOTES[n]}${pro ? ", prévision" : ""}">${[1, 2, 3, 4].map((i) => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}${pro ? '<sup aria-hidden="true">P</sup>' : ""}</span>`;
  const DEMO = [
    { j: "15", m: "oct.", t: "Ruy Blas", a: "Victor Hugo, Claire Dumas", l: "Théâtre du Quai · Théâtre · 20h · 2h45", n: 3, b: ["Léonard y va"] },
    { j: "8", m: "févr.", t: "Werther", a: "Jules Massenet, Paul Arnaud (direction musicale)", l: "Opéra Nord · Opéra · 19h30", n: 4, b: ["Carte Jeunes"] },
    { j: "21", m: "janv.", t: "La Mouette", a: "Anton Tchekhov, Ivan Sorel", l: "Atelier Lumière · Théâtre · 20h", n: 2, p: true, b: ["Public jeune", "Dernières places"] },
    { j: "3", m: "mars", t: "Les Noces de Figaro, ou la Folle Journée en version de concert intégrale", a: "Wolfgang Amadeus Mozart, Lorenzo Da Ponte, Orchestre des Remparts", l: "Salle Pleyel-sur-Seine · Opéra (version de concert) · 19h", n: 1, b: [] },
  ];
  const badge = (x) => `<span class="b${x === "Léonard y va" ? " yva" : ""}">${x}</span>`;
  const ligne = (d) => `<article class="row"><a class="rb" href="#charte"><span class="stub"><b>${d.j}</b><small>${d.m}</small></span>
    <span class="mid"><span class="tt nom">${d.t}</span><span class="art nom">${d.a}</span><span class="ss">${d.l}</span></span>
    <span class="end">${note(d.n, d.p)}${d.b.length ? `<span class="bds">${d.b.map(badge).join("")}</span>` : ""}</span></a></article>`;

  // Favicon : la clé (dont le dessin occupe 75 % × 60 % de sa boîte) laisse 18 % de marge et se centre optiquement
  let CLE = null;
  const carre = (n) => { const t = n * 0.85, d = (t * 1.5) / 48; return CLE("", Math.round(t)).replace("<svg ", `<svg style="transform:translate(${-d}px,${d}px)" `); };
  function render(main, { cleF, saisonTxt, themeBouton }) {
    CLE = cleF; const S = saisonTxt();
    const logo = `<span class="logo">${cleF()}Factotum</span>`;
    const duo = (titre, html, note) => `<section class="ch-section"><h2 class="mh">${titre}</h2>${note ? `<p class="cr">${note}</p>` : ""}
      <div class="ch-duo"><div class="ch-planche" data-theme="light"><span class="meta">Clair</span>${html}</div><div class="ch-planche" data-theme="dark"><span class="meta">Sombre</span>${html}</div></div></section>`;

    const entete = `<header class="top"><div class="in"><a class="brand" href="#charte">${logo}</a><span class="saison">${S}</span>${themeBouton()}</div></header>
      <p class="meta muet" style="margin-top:var(--e3)">Barre compacte, au défilement sur mobile</p><div class="barre"><a href="#charte">${logo}</a></div>`;
    const nav = `<nav class="tabs" aria-label="Exemple de navigation">${[["Affiche", "À\u00a0l’affiche"], ["Journal", "Journal"], ["Index", "Artistes et lieux"], ["Liens", "Liens utiles"], ["Admin", "Admin"]]
      .map(([c, l], i) => `<a class="tab${i === 4 ? " lock" : ""}" href="#charte"${i === 0 ? ' aria-current="page"' : ""}><span class="court">${c}</span><span class="long">${l}</span></a>`).join("")}</nav>`;
    const lignes = `<div class="list">${DEMO.map(ligne).join("")}</div>`;
    const bandeaux = `<div class="list"><h3 class="jour">Jeudi 15 octobre <small>2 représentations</small></h3>${ligne(DEMO[0])}${ligne({ ...DEMO[2], j: "15", m: "oct." })}
      <h3 class="jour">Vendredi 16 octobre <small>1 représentation</small></h3>${ligne({ ...DEMO[1], j: "16", m: "oct." })}</div>`;
    const notes = `<table class="t"><tbody>${[4, 3, 2, 1].map((n) => `<tr><td>${note(n)}</td><td>${n} – ${NOTES[n]}</td></tr>`).join("")}<tr><td>${note(3, true)}</td><td>Prévision : création pas encore critiquée</td></tr></tbody></table>`;
    const badges = `<div class="bds">${["Léonard y va", "Public jeune", "Carte Jeunes", "Dernières places", "Offre jeune"].map(badge).join("")}</div>`;
    const boutons = `<div class="acts"><a class="btn pri" href="#charte">Réserver</a><a class="btn" href="#charte">Site officiel</a><button class="btn" type="button">Partager</button><button class="btn danger" type="button">Annuler la réservation</button><button class="btn" type="button" disabled>Indisponible</button></div>`;
    const puces = `<div class="chips"><button class="chip" type="button" aria-pressed="true">Théâtre</button><button class="chip" type="button" aria-pressed="false">Opéra</button><button class="chip" type="button" aria-pressed="false">Danse</button><button class="chip" type="button" aria-pressed="true">3 carrés et plus</button><button class="chip" type="button" aria-pressed="false">Libre ce soir-là</button><button class="chip effacer" type="button">Tout effacer</button></div>
      <div class="active"><span class="n">12 sorties</span><span>2 filtres actifs</span></div><div class="seg" role="group" aria-label="Affichage"><button type="button" aria-pressed="true">Liste</button><button type="button" aria-pressed="false">Mois</button></div>`;
    const JOURS = ["sam.", "dim.", "lun.", "mar.", "mer.", "jeu.", "ven."];
    const frise = `<div class="frise" role="group" aria-label="Les 14 prochains jours (exemple)">${Array.from({ length: 14 }, (_, i) => {
      const busy = [2, 6, 7].includes(i), va = [4, 10].includes(i), sel = i === 9;
      return `<button class="fd${i === 0 ? " today" : ""}${busy ? " busy" : ""}" type="button" aria-pressed="${sel}"><span class="dw">${i === 0 ? "auj." : JOURS[i % 7]}</span><span class="dn">${14 + i > 30 ? 14 + i - 30 : 14 + i}</span>${va ? '<span class="pc">Léonard y va</span>' : ""}</button>`;
    }).join("")}</div>`;
    const cal = `<div class="cal mini"><div class="calh"><h3>novembre 2026</h3></div><div class="grid">${["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."].map((d) => `<div class="dow">${d}</div>`).join("")}${Array.from({ length: 6 }, () => '<div class="cell out" aria-hidden="true"></div>').join("")}${Array.from({ length: 30 }, (_, i) => {
      const d = i + 1, c = ["cell", d < 14 ? "past" : "", d === 14 ? "today" : "", [16, 20, 21].includes(d) ? "busy" : "", [18, 24].includes(d) ? "va" : "", d >= 17 && d <= 29 && ![16, 20, 21].includes(d) ? "play" : ""].filter(Boolean).join(" ");
      return `<div class="${c}"><span class="n">${d}</span></div>`;
    }).join("")}</div></div><div class="legend"><span class="l-auj">Aujourd’hui</span><span class="l-pris">Soir pris</span><span class="l-va">Léonard y va</span><span class="l-joue">Se joue</span><span class="l-offre">Offre jeune</span></div>`;
    const fiche = `<div class="sheet-demo"><div class="shtop"><button class="btn ico" type="button" aria-label="Fermer">×</button><span class="k">Théâtre · Théâtre du Quai</span><button class="btn" type="button">Partager</button></div>
      <div class="shh"><span class="meta">15 oct. 2026 – 27 janv. 2027</span><h3 class="nom h2-demo">Ruy Blas</h3><div class="ligne">${note(3)}<span class="bds">${badge("Léonard y va")}${badge("Public jeune")}</span></div></div>
      <p class="cr"><span class="ro">auteur</span> <a href="#charte">Victor Hugo</a> · <span class="ro">mise en scène</span> <a href="#charte">Claire Dumas</a></p>
      <dl class="dl"><dt>Lieu</dt><dd><a href="#charte">Théâtre du Quai</a>, salle Richelieu</dd><dt>Dates</dt><dd>15 oct. 2026 – 27 janv. 2027</dd><dt>Horaires</dt><dd>20h, dimanche 15h · 2h45 avec entracte</dd><dt>Tarif jeune</dt><dd>10 € (moins de 28 ans)</dd></dl>
      <p class="why">Une phrase factuelle : la mise en scène a été saluée par la presse nationale à sa création.</p>
      <div class="acts"><a class="btn pri" href="#charte">Réserver</a><a class="btn" href="#charte">Site officiel</a></div></div>`;
    const stats = `<div class="kpis"><div><b>48</b><span>sorties vues</span></div><div><b>17</b><span>lieux</span></div><div><b>3,1</b><span>note moyenne</span></div><div><b>12</b><span>cette saison</span></div></div>
      <div class="stats"><h3>Par catégorie</h3><div class="bars">${[["Théâtre", 21], ["Opéra", 12], ["Danse", 7], ["Concert", 5], ["Exposition", 3]].map(([l, n]) => `<span class="bl">${l}</span><span class="bg" style="--v:${Math.round((n / 21) * 100)}" aria-hidden="true"></span><span class="bn">${n}</span>`).join("")}</div></div>`;
    const champs = `<form class="frm" onsubmit="return false"><label class="f"><span>Titre</span><input type="text" value="Ruy Blas" autocomplete="off" enterkeyhint="next"></label>
      <label class="f"><span>Date</span><input type="date" value="2026-10-15"></label><label class="f"><span>Prix de la place (€)</span><input type="text" inputmode="decimal" placeholder="18" enterkeyhint="next"></label>
      <label class="f"><span>Catégorie</span><select><option>Théâtre</option><option>Opéra</option></select></label><label class="f ck"><input type="checkbox" checked><span>Public jeune</span></label><p class="err">Message d’erreur de champ.</p></form>`;
    const messages = `<div class="msg">Publication en cours</div><p></p><div class="msg ok">En ligne <a href="#charte">Voir</a></div><p></p><div class="msg err">Erreur : la publication a échoué <button type="button">Réessayer</button></div><p></p><div class="msg">Hors ligne : données de la dernière visite</div>`;
    const admin = `<div class="adm-tete"><h3 class="h1-demo">Admin</h3><p>Édition · déverrouillé</p><nav class="chips" aria-label="Espace admin (exemple)"><a class="chip" href="#charte" aria-current="page">Réservations</a><a class="chip" href="#charte">Envies</a><a class="chip" href="#charte">Saisie rapide</a><a class="chip" href="#charte">Budget</a></nav></div>
      <h3 class="sec">Réservation</h3><form class="frm" onsubmit="return false"><label class="f"><span>Sortie</span><input type="text" value="Werther" autocomplete="off"></label><label class="f"><span>Date</span><input type="date" value="2027-02-08"></label><label class="f"><span>Heure</span><input type="time" value="20:00"></label>
      <div class="acts"><button class="btn pri" type="button">Enregistrer</button><button class="btn danger" type="button">Annuler la réservation</button></div>
      <div class="confirme" role="alert"><p>Annuler la réservation de « Werther » (8 févr.) ? Le soir sera libéré.</p><div class="acts"><button class="btn danger" type="button">Oui, annuler</button><button class="btn" type="button">Garder</button></div></div></form>
      <h3 class="sec">Saisie rapide</h3><div class="saisie"><label class="f"><span>Colle la confirmation de billet</span><textarea placeholder="Votre commande n° 1234 – Werther – 8 février 2027 20:00…" enterkeyhint="done"></textarea></label></div>
      <ul class="sugg"><li><button type="button"><b>Werther</b><span class="ss">Opéra Nord · 8 févr.</span></button></li><li><button type="button"><b>Le Barbier de Séville</b><span class="ss">Opéra Nord · 12 mars</span></button></li></ul>
      <h3 class="sec">Budget</h3><table class="t pile"><thead><tr><th>Sortie</th><th class="num">Engagé</th><th class="num">Payé par moi</th><th class="num">Économie</th></tr></thead><tbody>
      ${[["Werther", "36,00 €", "18,00 €", "44,00 €"], ["Ruy Blas", "10,00 €", "10,00 €", "32,00 €"], ["La Mouette", "24,00 €", "12,00 €", "16,00 €"]].map((r) => `<tr><td>${r[0]}</td><td class="num" data-l="Engagé">${r[1]}</td><td class="num" data-l="Payé par moi">${r[2]}</td><td class="num" data-l="Économie">${r[3]}</td></tr>`).join("")}
      <tr class="total"><td>Total</td><td class="num" data-l="Engagé">70,00 €</td><td class="num" data-l="Payé par moi">40,00 €</td><td class="num" data-l="Économie">92,00 €</td></tr></tbody></table>`;

    const tailles = [["Titre du site", "logo", "Factotum"], ["Titre de section", "mh-demo", "Journal de la saison"], ["Titre de fiche", "tt", "La Folle Journée ou le Mariage de Figaro"], ["Corps", "corps", "Une brochure de saison transposée à l’écran : typographique, dense, franche et lisible."], ["Métadonnées", "ss", "Théâtre du Quai · Théâtre · 20h"], ["Dates", "jour-demo", "Jeudi 15 octobre"], ["Chiffres", "kpi-demo", "1 234"]];

    main.innerHTML = `<a class="skip" href="#ch-contenu">Aller au contenu</a>
    <div class="ch-couv rouge"><span class="logo">${cleF()}Factotum</span><p class="meta">Charte graphique · ${S}</p><p>Largo al factotum della città. Le site de veille, d’agenda et de journal des sorties, comme une brochure de saison.</p><p><a class="theme" href="#affiche">Retour au site</a> ${themeBouton()}</p></div>
    <div id="ch-contenu" tabindex="-1">
    <section class="ch-section"><h2 class="mh">Nom</h2><p><b>Factotum</b>, d’après l’air de Figaro (<i>Largo al factotum della città</i>, Rossini). Jamais d’année dans le nom. Logotype : FACTOTUM en Schibsted Grotesk 800, capitales, approche −0,02em.</p>
      <p>La saison est un sous-titre calculé (septembre à août) : aujourd’hui <b>${S}</b>. Titre de page : « Factotum » ou « Titre de la page – Factotum ».</p></section>

    <section class="ch-section"><h2 class="mh">Symbole : la clé F</h2><p>Une clé passe-partout dont le panneton dessine un F, inclinée à 45° (anneau en bas à gauche, panneton en haut à droite). Géométrie stricte, extrémités carrées. Blanc sur aplat rouge, ou encre sur fond clair ou sombre. Jamais rouge sur rouge, ni contour, ombre, rotation ou animation. Taille minimale 16 px ; zone de protection : l’épaisseur de la tige. Usage réservé : en-tête, favicon, icônes, image de partage et cette page.</p>
      <div class="ch-cles">${[180, 32, 16].map((n) => `<figure><span class="carre" style="width:${n}px;height:${n}px">${carre(n)}</span><figcaption class="meta muet">${n} px</figcaption></figure>`).join("")}
      ${[64, 32, 16].map((n) => `<figure>${cleF("", n)}<figcaption class="meta muet">${n} px, encre</figcaption></figure>`).join("")}</div></section>

    <section class="ch-section"><h2 class="mh">Couleur</h2><p>Rouge #E30613 en aplats francs ; tout le reste en noir et blanc. Sur un aplat rouge, texte blanc uniquement. Le rouge employé comme couleur de texte passe à #FF5A4F sur fond sombre. Ni ombre, ni dégradé (hachures fonctionnelles exceptées), ni flou, ni transparence décorative.</p>
      <div class="ch-duo"><div class="ch-planche" data-theme="light"><span class="meta">Clair</span><div class="ch-jetons" data-jetons></div></div><div class="ch-planche" data-theme="dark"><span class="meta">Sombre</span><div class="ch-jetons" data-jetons></div></div></div>
      <h3 class="sec">Contrastes (WCAG AA)</h3><div class="defile-x"><table class="t" id="ch-contrastes"></table></div></section>

    <section class="ch-section"><h2 class="mh">Typographie</h2><p>Police unique : Schibsted Grotesk (OFL), auto-hébergée, graisses 400, 500, 700 et 800. Chiffres tabulaires partout. Guillemets « » avec espaces insécables, apostrophe ’, tiret demi-cadratin – pour les intervalles et les incises. Ni tiret cadratin ni espace fine.</p>
      <div class="ch-duo"><div class="ch-planche ch-type" data-theme="light">${tailles.map(([l, c, t]) => `<div><span class="meta muet" data-taille="${c}">${l}</span><div class="${c}">${t}</div></div>`).join("")}</div>
      <div class="ch-planche ch-type" data-theme="dark">${tailles.map(([l, c, t]) => `<div><span class="meta muet">${l}</span><div class="${c}">${t}</div></div>`).join("")}</div></div></section>

    <section class="ch-section"><h2 class="mh">Mise en page</h2><p>Grille de 12 colonnes, 1120 px au plus sur bureau ; 4 colonnes et marges de 16 px sur mobile. Espacements : 4, 8, 12, 16, 24, 32, 48 px. Angles droits (2 px au plus sur les champs). Filet de 1 px entre les lignes, filet de 3 px au-dessus de chaque section.</p>
      <div class="grille ch-grille">${Array.from({ length: 12 }, (_, i) => `<span>${i + 1}</span>`).join("")}</div></section>

    ${duo("1. En-tête", entete)}
    ${duo("2. Navigation", nav, "Libellés courts sur mobile (barre fixe en bas), complets sur bureau (rangée collante sous l’en-tête). Onglet actif : soulignement rouge de 3 px.")}
    ${duo("3. Ligne de spectacle", lignes, "Colonne de date de 64 px, filet vertical pointillé. Sur un conteneur large, la note et les badges passent à droite (@container).")}
    ${duo("4. Bandeaux de jour", bandeaux, "Collants en haut de la liste au défilement.")}
    ${duo("5. Note", notes)}
    ${duo("6. Badges", badges)}
    ${duo("7. Boutons", boutons, "Survol : inversion des couleurs, sans animation de taille.")}
    ${duo("8. Puces de filtre", puces)}
    ${duo("9. Bande des 14 jours et calendriers", frise + cal, "Hachures : soir pris. Cadre rouge : aujourd’hui. Carré rouge plein : un soir où Léonard va quelque part.")}
    ${duo("10. Fiche détaillée", fiche)}
    ${duo("11. Statistiques", stats)}
    ${duo("12. Champs de saisie", champs, "16 px minimum (pas de zoom de Safari). Focus : contour rouge de 2 px.")}
    ${duo("13. Messages", messages)}
    ${duo("14. Mode admin", admin, "En-tête en encre (noir en clair, inversé en sombre) pour distinguer l’édition de la consultation. Confirmation intégrée à la page, jamais de fenêtre système.")}

    <section class="ch-section"><h2 class="mh">Interdits</h2><ul class="ch-interdits">
      <li>Polices Inter, Roboto, Poppins, Montserrat, Space Grotesk ou police système par défaut</li><li>Dégradés (hachures fonctionnelles exceptées), glassmorphisme, ombres portées, flou d’arrière-plan</li>
      <li>Coins arrondis au-delà de 2 px, boutons en pilule, cartes flottantes</li><li>Icônes emoji, bibliothèques d’icônes, pictogrammes décoratifs</li>
      <li>Violet, indigo, bleu ardoise ou toute couleur hors palette</li><li>Héros centré avec accroche, grandes sections vides, texte d’accueil marketing</li>
      <li>Animations d’échelle, rebonds, révélations au défilement, squelettes de chargement : seules les transitions de couleur et d’opacité de 120 ms, aucune en mouvement réduit</li>
      <li>Texte noir sur aplat rouge ; clé F rouge sur rouge, redressée, ombrée ou animée</li></ul></section>
    <p class="meta muet" style="margin:var(--e8) 0">Largo al factotum della città.</p></div>`;

    // Jetons et contrastes, lus dans la feuille (aucune valeur recopiée ici)
    const JET = ["fond", "surface", "encre", "encre-2", "filet", "filet-leger", "rouge", "sur-rouge", "rouge-texte"];
    main.querySelectorAll("[data-jetons]").forEach((box) => {
      const cs = getComputedStyle(box.parentElement);
      box.innerHTML = JET.map((k) => `<div class="ch-jeton"><i style="--c:var(--${k})"></i><b>--${k}</b><span class="muet">${cs.getPropertyValue("--" + k).trim()}</span></div>`).join("");
    });
    const hex = (h) => { h = h.trim().replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
    const lum = (h) => { const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const PAIRES = [["encre", "fond", 4.5], ["encre", "surface", 4.5], ["encre-2", "fond", 4.5], ["encre-2", "surface", 4.5], ["rouge-texte", "fond", 4.5], ["rouge-texte", "surface", 4.5], ["sur-rouge", "rouge", 4.5], ["fond", "encre", 4.5], ["filet", "fond", 3], ["rouge", "fond", 3]];
    const [cl, so] = [...main.querySelectorAll("[data-jetons]")].map((b) => getComputedStyle(b.parentElement));
    const v = (cs, k) => cs.getPropertyValue("--" + k);
    $("#ch-contrastes", main).innerHTML = `<thead><tr><th>Texte</th><th>Fond</th><th class="num">Clair</th><th class="num">Sombre</th><th class="num">Seuil</th></tr></thead><tbody>${PAIRES.map(([t, f, s]) => {
      const a = ratio(v(cl, t), v(cl, f)), b = ratio(v(so, t), v(so, f));
      return `<tr><td>--${t}</td><td>--${f}</td><td class="num">${a.toFixed(2).replace(".", ",")}</td><td class="num">${b.toFixed(2).replace(".", ",")}</td><td class="num">${String(s).replace(".", ",")}</td></tr>`;
    }).join("")}</tbody>`;
    main.querySelectorAll("[data-taille]").forEach((m) => { const el = m.nextElementSibling, cs = getComputedStyle(el); m.textContent += ` · ${parseFloat(cs.fontSize)} px, ${cs.fontWeight}`; });
  }
  function $(s, r) { return r.querySelector(s); }
  window.CHARTE = { render };
})();
