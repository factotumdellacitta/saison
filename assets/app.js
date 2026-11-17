/* Factotum – interface publique (lots 2 et 3). Aucune dépendance. Le mode admin est dans assets/admin.js, chargé à la demande. */
"use strict";
const OWNER = "Léonard";
// Deux sites, un seul code : Factotum (spectacles, à la racine) et Factotum Expo (expositions, sous expo/).
// La coque dit lequel par <html data-site> ; RACINE ramène les chemins (data/, assets/, sw.js) à la racine du site.
const EXPO = document.documentElement.dataset.site === "expo", RACINE = EXPO ? "../" : "";
const NOM = EXPO ? "Factotum Expo" : "Factotum", ACCUEIL = EXPO ? "a-voir" : "affiche";
const URL_RACINE = new URL(RACINE || "./", location.href).href.split(/[?#]/)[0];
const estExpo = (e) => !!e && e.categorie === "Exposition", duSite = (e) => estExpo(e) === EXPO;
const urlSortie = (id) => URL_RACINE + (estExpo(BYID.get(id)) ? "expo/" : "") + "#sortie-" + id;
const CATS = ["Théâtre", "Opéra", "Concert", "Récital", "Danse", "Comédie musicale", "Humour", "Festival", "Exposition", "Cinéma", "Événement", "Sur scène", "Autre"];
const ROLES = ["auteur", "compositeur", "mise en scène", "chorégraphie", "direction musicale", "réalisation", "commissaire", "compagnie", "interprète", "artiste"];
const CAT_LIENS = ["Billetteries", "Cartes et tarifs jeunes", "Calendriers de vente", "Outils"];
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOIS_L = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const COURT = {
  "comedie-francaise": "Comédie-Française", odeon: "Odéon", "la-colline": "La Colline", tce: "TCE", chaillot: "Chaillot",
  "opera-bastille": "Bastille", "palais-garnier": "Garnier", "opera-de-paris": "Opéra de Paris", "opera-comique": "Opéra-Comique",
  "theatre-de-la-ville": "Th. de la Ville", athenee: "Athénée", "comedie-des-champs-elysees": "Comédie des Champs-Él.",
  "grande-halle-villette": "Grande Halle", "zenith-paris": "Zénith", "theatre-cite-internationale": "Cité internationale",
  t2g: "T2G", tgp: "TGP", "theatre-public-montreuil": "Th. de Montreuil", "nanterre-amandiers": "Amandiers",
  "festival-avignon": "Avignon", "rond-point": "Rond-Point", "theatre-du-gymnase": "Gymnase", "theatre-du-soleil": "Th. du Soleil",
  "theatre-de-paris": "Th. de Paris", "poche-montparnasse": "Poche-Montparnasse", "seine-musicale": "Seine Musicale", lido: "Lido 2",
};

/* ---------- Outils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
const NOW = new Date();
const D = (s) => { if (!s) return null; const [y, m, d] = String(s).slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const add = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const jj = (d) => d.getDate() + (d.getDate() === 1 ? "er" : "");
const fmt = (d, wd) => d ? (wd ? JOURS[d.getDay()] + " " : "") + jj(d) + " " + MOIS[d.getMonth()] : "";
const fmtY = (d, wd) => d ? fmt(d, wd) + " " + d.getFullYear() : "";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe").replace(/æ/g, "ae");
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[œ]/g, "oe").replace(/[æ]/g, "ae").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const plural = (n, s, p) => n + " " + (n > 1 ? (p || s + "s") : s);
const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;
/* ---------- Identité Factotum : saison calculée, clé F, thème ---------- */
// Saison de septembre à août : « Saison 26–27 ». Jamais écrite en dur.
const saisonDe = (d = TODAY) => { const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; return { debut: y, cle: String(y), court: String(y % 100).padStart(2, "0") + "–" + String((y + 1) % 100).padStart(2, "0") }; };
const saisonTxt = (d) => "Saison " + saisonDe(d).court;
// La clé F (assets/logo.svg) : passe-partout incliné à 45°, panneton en F. Ne jamais la redresser ni l’animer.
const CLE_F = '<g transform="translate(24 24) rotate(45) scale(.88) translate(-23.5 -25)"><rect x="18" y="5" width="5" height="25"/><rect x="18" y="5" width="17" height="5"/><rect x="18" y="14" width="12" height="5"/><circle cx="20.5" cy="36" r="6.5" fill="none" stroke="currentColor" stroke-width="5"/></g>';
const cleF = (cls = "cle", px) => `<svg class="${cls}" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" focusable="false"${px ? ` width="${px}" height="${px}"` : ""}>${CLE_F}</svg>`;
/* Icônes Factotum : trait 2 px sur une grille de 24, extrémités carrées, angles vifs, en encre (jamais en rouge sur fond clair).
   Elles remplacent un mot (le libellé reste pour l’accessibilité) ou accompagnent le genre ; jamais décoratives. */
const ICO = {
  "Théâtre": "<path d=\"M13 7.5V3h9.5v5.5A4.75 4.75 0 0 1 15 12.37M15 6.3l1.6-.8M20.5 6.3l-1.6-.8M16 10a3 3 0 0 1 3.5 0\" stroke-linecap=\"butt\"/><path d=\"M1.5 10H12v4.5a5.25 5.25 0 0 1-10.5 0z\"/><path d=\"M3.9 12.4h2M7.6 12.4h2M4.75 15.2a3 3 0 0 0 4 0\" stroke-linecap=\"butt\"/>",
  "Opéra": "<path d=\"M3 21h18M5 21V12h14v9M9 12v9M12 12v9M15 12v9M4 12h16M6 12a6 6 0 0 1 12 0M12 6V3\"/>",
  "Danse": "<path d=\"M3 16c0-1.7 1.3-3 3-3h5c3.5 0 7 1.8 10 4v3H6.5C4.6 20 3 18.4 3 16.5z\"/><path d=\"M7 13 12 4M11 13 6 4\" stroke-linecap=\"butt\"/>",
  "Comédie musicale": "<path d=\"M1.5 7H12v4.5a5.25 5.25 0 0 1-10.5 0z\"/><path d=\"M3.9 9.4h2M7.6 9.4h2M4.75 12.2a3 3 0 0 0 4 0\" stroke-linecap=\"butt\"/><path d=\"M18 16.94V3.5M18 3.5c0 3 3.4 3.5 3.4 7.5\" stroke-linecap=\"butt\"/><ellipse cx=\"16.4\" cy=\"17.4\" rx=\"2.7\" ry=\"1.95\" transform=\"rotate(-22 16.4 17.4)\" fill=\"currentColor\" stroke=\"none\"/>",
  "Récital": "<path d=\"M4 3h5c0 7 11 6 11 13v5H4zM4 17h16M8 17v4M12 17v4M16 17v4\"/>",
  "Concert": "<path d=\"M8 17.74V6.4l10-2v11.34\" stroke-linecap=\"butt\"/><ellipse cx=\"6.4\" cy=\"18.2\" rx=\"2.7\" ry=\"1.95\" transform=\"rotate(-22 6.4 18.2)\" fill=\"currentColor\" stroke=\"none\"/><ellipse cx=\"16.4\" cy=\"16.2\" rx=\"2.7\" ry=\"1.95\" transform=\"rotate(-22 16.4 16.2)\" fill=\"currentColor\" stroke=\"none\"/>",
  "Humour": "<path d=\"M9 2h6v9H9zM12 13v6M7 21h10\"/>",
  "Festival": "<path d=\"M3.6 20 12 6.6 20.4 20M10 20l2-4.5 2 4.5M12 6.6V3\" stroke-linecap=\"butt\"/><path d=\"M12 2h4.5v3H12z\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M2 20h20\"/>",
  "Exposition": "<path d=\"M3 4h18v16H3zM7 8h10v8H7z\"/>",
  "Cinéma": "<path d=\"M3 10h18v10H3zM3 5h18v5H3z\"/><path d=\"M9.5 5 7 10M15.5 5 13 10\" stroke-linecap=\"butt\"/>",
  "Événement": "<path d=\"M7 3h10l-1 7a4 4 0 0 1-8 0zM12 14v6M8 21h8\"/>",
  "Sur scène": "<path d=\"M12 2v3M8 5h8l-1 4H9zM9 9L5 20M15 9l4 11M3 21h18\"/>",
  "Autre": "<circle cx=\"5\" cy=\"12\" r=\"1.5\" fill=\"currentColor\"/><circle cx=\"12\" cy=\"12\" r=\"1.5\" fill=\"currentColor\"/><circle cx=\"19\" cy=\"12\" r=\"1.5\" fill=\"currentColor\"/>",
  "clair": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1\"/>",
  "sombre": "<path d=\"M20 14.5A8.5 8.5 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z\"/>",
  "auto": "<circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"M12 4a8 8 0 0 1 0 16z\" fill=\"currentColor\"/>",
  "cadenas": "<path d=\"M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4\"/>",
  "cadenas-ouvert": "<path d=\"M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2\"/>",
  "loupe": "<circle cx=\"10\" cy=\"10\" r=\"6\"/><path d=\"M14.5 14.5 21 21\"/>",
  "liste": "<path d=\"M3 6h18M3 12h18M3 18h18\"/>",
  "mois": "<path d=\"M3 5h18v16H3zM3 10h18M8 3v4M16 3v4\"/>",
  "filtres": "<path d=\"M3 6h18M6 12h12M10 18h4\"/>",
  "tri": "<path d=\"M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4\"/>",
  "prec": "<path d=\"M15 4l-8 8 8 8\"/>",
  "suiv": "<path d=\"M9 4l8 8-8 8\"/>",
  "fermer": "<path d=\"M5 5l14 14M19 5 5 19\"/>",
  "partager": "<path d=\"M12 3v12M7 8l5-5 5 5M5 12v9h14v-9\"/>",
  "billet": "<path d=\"M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z\"/><path d=\"M15 7.5v9\" stroke-dasharray=\"1.5 1.5\" stroke-linecap=\"butt\"/>",
  "externe": "<path d=\"M14 4h6v6M20 4l-9 9M18 14v6H4V6h6\"/>",
  "lieu": "<path d=\"M12 21s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z\"/><circle cx=\"12\" cy=\"9\" r=\"2.5\"/>",
  "horaires": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 3\"/>",
  "stats": "<path d=\"M5 21V12M12 21V4M19 21v-9\"/>",
  "ajouter": "<path d=\"M12 4v16M4 12h16\"/>",
  "modifier": "<path d=\"M4 20v-4L15 5l4 4L8 20zM12.5 7.5l4 4\"/>",
  "supprimer": "<path d=\"M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7\"/>",
  "coche": "<path d=\"M4 12.5 9.5 18 20 6.5\"/>",
  "oeil": "<path d=\"M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z\"/><path d=\"M9 12a3 3 0 0 0 6 0 3 3 0 0 0-6 0\"/>",
  "oeil-barre": "<path d=\"M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z\"/><path d=\"M4 20 20 4\"/>",
  "billet-ok": "<path d=\"M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z\"/><path d=\"M8.5 12l2.5 2.5 4.5-5\"/>",
  "billet-barre": "<path d=\"M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z\"/><path d=\"M4 20 20 4\"/>",
  "carres": "<path d=\"M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z\"/>",
  "poignee": "<g fill=\"currentColor\" stroke=\"none\"><circle cx=\"9\" cy=\"6\" r=\"1.5\"/><circle cx=\"15\" cy=\"6\" r=\"1.5\"/><circle cx=\"9\" cy=\"12\" r=\"1.5\"/><circle cx=\"15\" cy=\"12\" r=\"1.5\"/><circle cx=\"9\" cy=\"18\" r=\"1.5\"/><circle cx=\"15\" cy=\"18\" r=\"1.5\"/></g>",
  "ventes": "<path d=\"M6 17v-6a6 6 0 0 1 12 0v6M4 17h16M10 21h4\"/>",
};
const ico = (n, cls) => ICO[n] ? `<svg class="pi${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">${ICO[n]}</svg>` : "";
// Familles de genre (code couleur) : théâtre, musique, danse, images ; le reste est neutre.
// Familles de couleur : bleu pour la scène lyrique, vert pour la musique de concert ; Expo et Cinéma neutres.
const FAMILLE = { "Théâtre": "theatre", "Opéra": "lyrique", "Comédie musicale": "lyrique", "Concert": "concert", "Récital": "concert", "Danse": "danse" };
const famille = (c) => FAMILLE[c] || "neutre";
// Factotum Expo : code couleur par domaine (sousGenre), sur les mêmes encres et aplats que les genres ; le vert reste à l’identité du site.
const X_DOMAINES = { beaux: "Peinture et dessin", photo: "Photographie", contemporain: "Art contemporain", objets: "Arts et civilisations" };
const X_DOM_DE = { Peinture: "beaux", Dessin: "beaux", Gravure: "beaux", Estampe: "beaux", Sculpture: "beaux", "Arts graphiques": "beaux", Pastel: "beaux", "Beaux-arts": "beaux",
  Photographie: "photo", "Cinéma": "photo", "Vidéo": "photo", Image: "photo",
  "Art contemporain": "contemporain", "Art moderne": "contemporain", Installation: "contemporain", Performance: "contemporain", "Street art": "contemporain" };
const domaineX = (e) => X_DOM_DE[e.sousGenre] || "objets";
const famE = (e) => (e.categorie === "Exposition" ? "x" + domaineX(e) : famille(e.categorie));
const gk = (e) => `<span class="gk">${genreIco(e)}${esc(genre(e))}</span>`;
const genreIco = (e, cls) => ico(CATS.includes(e.categorie) ? e.categorie : "Autre", cls);
const THEMES = ["auto", "light", "dark"], THEME_TXT = { auto: "Auto", light: "Clair", dark: "Sombre" }, THEME_ICO = { auto: "auto", light: "clair", dark: "sombre" };
const themeLu = () => { try { const t = localStorage.getItem("factotum-theme"); return THEMES.includes(t) ? t : "auto"; } catch (_) { return "auto"; } };
function themePose(t) {
  if (t === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  try { if (t === "auto") localStorage.removeItem("factotum-theme"); else localStorage.setItem("factotum-theme", t); } catch (_) {}
  $$("[data-theme-btn]").forEach((b) => { b.innerHTML = ico(THEME_ICO[t]); b.setAttribute("aria-label", "Thème : " + THEME_TXT[t].toLowerCase()); });
  $$("[data-theme-set]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.themeSet === t)));
}
// Bouton du thème : l’icône montre le réglage en cours ; un appui ouvre le menu Auto / Clair / Sombre.
const themeBouton = () => { const t = themeLu(); return `<span class="tm"><button class="theme ic" type="button" data-theme-btn aria-haspopup="menu" aria-expanded="false" aria-label="Thème : ${THEME_TXT[t].toLowerCase()}">${ico(THEME_ICO[t])}</button></span>`; };
function themeFerme() { $$(".tmenu").forEach((m) => { const b = m.parentElement.querySelector("[data-theme-btn]"); m.remove(); if (b) b.setAttribute("aria-expanded", "false"); }); }
function themeMenu(b) {
  const box = b.parentElement, ouvert = box.querySelector(".tmenu");
  themeFerme(); if (ouvert) return;
  const t = themeLu(), m = document.createElement("div");
  m.className = "tmenu"; m.setAttribute("role", "menu"); m.setAttribute("aria-label", "Thème");
  m.innerHTML = THEMES.map((k) => `<button type="button" role="menuitemradio" aria-checked="${k === t}" data-theme-set="${k}">${ico(THEME_ICO[k])}${THEME_TXT[k]}</button>`).join("");
  box.appendChild(m); b.setAttribute("aria-expanded", "true");
  m.querySelector('[aria-checked="true"]').focus();
}
// Champ de recherche à loupe : « Rechercher », sans phrase d’exemple.
const rech = (id, lab, val = "") => `<label class="rech flex1">${ico("loupe")}<input type="search" id="${id}" placeholder="Rechercher" aria-label="${lab}" value="${esc(val)}" enterkeyhint="search" autocomplete="off"></label>`;
// Note en carrés pour les puces de filtre (« 3 et + »).
const carres = (n, plus) => `<span class="st" aria-hidden="true">${[1, 2, 3, 4].map((i) => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}</span>${plus ? "+" : ""}`;
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2600); }
const getJSON = (u, o) => fetch(u, o).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });

/* ---------- Données ---------- */
let DEJA_VU = {}, ENVIES_PUB = [], AFF = [], LIVE = [], LIEUX = {}, BUSY = new Set(), BUSY_SRC = {}, MAJ = "", JOURNAL = null, JMAJ = "", LIENS = null, PRIVE = null;
let DISPO_PUB = null; // soirs pris publics tels que servis (rétablis au verrouillage du mode admin)
let HORIZON = ""; // dernier jour couvert par les soirs pris publics (au-delà : inconnu) ; vide en mode admin
let ADMIN = null, JAVEC = ""; // ADMIN : module admin (assets/admin.js) ; JAVEC : filtre du journal par accompagnant (mémoire seulement)
const BYID = new Map();
let jP = null, lP = null;
const loadJournal = () => jP || (jP = getJSON(RACINE + "data/journal.json").then((j) => { JOURNAL = j.sorties; JMAJ = j.maj; JOURNAL.forEach((e) => BYID.set(e.id, e)); ART = null; return JOURNAL; }).catch((e) => { jP = null; throw e; }));
// Rapports de veille (data/radar.json) : chroniques datées publiées dans le Radar, la plus récente en tête.
let RAPPORTS = null, rpP = null;
const loadRadar = () => rpP || (rpP = getJSON(RACINE + "data/radar.json").then((r) => (RAPPORTS = Array.isArray(r.rapports) ? r.rapports : [])).catch(() => { rpP = null; return (RAPPORTS = RAPPORTS || []); }));
const loadLiens = () => lP || (lP = getJSON(RACINE + "data/liens.json").then((l) => (LIENS = l)).catch((e) => { lP = null; throw e; }));

// Remplace les données en mémoire (démarrage, ou données fraîches lues par l’admin via l’API).
// Envies : liste publique (data/envies.json, générée) ou, en mode admin, la zone privée à jour.
const enviesIds = () => new Set(PRIVE ? Object.keys(PRIVE.envies || {}) : ENVIES_PUB);
const COEUR = '<svg class="coeur" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.5 3.6 12.1a4.8 4.8 0 0 1 6.8-6.8L12 6.9l1.6-1.6a4.8 4.8 0 0 1 6.8 6.8z"/></svg>';
const COEUR_APP = COEUR; // le cœur des envies, pour admin.js (qui a son propre COEUR local)
function applyData({ affiche, lieux, dispo, journal, liens }) {
  if (affiche) { AFF = affiche.sorties; MAJ = affiche.maj; }
  if (lieux) LIEUX = lieux;
  if (journal) { JOURNAL = journal.sorties; JMAJ = journal.maj; jP = Promise.resolve(JOURNAL); }
  if (liens) { LIENS = liens; lP = Promise.resolve(LIENS); }
  // Public : { pris, horizon } (une seule liste, sans raison). Admin : sources privées détaillées (réservations, soirs, agenda).
  if (dispo) { BUSY_SRC = dispo; BUSY = new Set([...(dispo.pris || []), ...(dispo.reservations || []), ...(dispo.manuel || []), ...(dispo.calendrier || [])]); HORIZON = dispo.horizon || ""; }
  BYID.clear(); AFF.forEach((e) => BYID.set(e.id, e)); (JOURNAL || []).forEach((e) => BYID.set(e.id, e));
  LIVE = AFF.filter((e) => e.statut === "a-voir" && !ended(e) && duSite(e)); // chaque site montre les siennes
  ART = null;
  if (MAJ) $("#maj").textContent = "À jour au " + fmt(D(MAJ));
}
const lieu = (e) => LIEUX[e.lieuId] || {};
function court(id) {
  if (!id || !LIEUX[id]) return "";
  if (COURT[id]) return COURT[id];
  return LIEUX[id].nom.replace(/^Théâtre (du |de la |de l’|des |de )/, "").replace(/^Théâtre /, "Th. ").replace(/ – .*/, "").replace(/ \(.*\)/, "");
}
const ended = (e) => { const b = D(e.fin) || D(e.debut); return b && b < TODAY; };
const span = (e) => { const a = D(e.debut); return a ? [a, D(e.fin) || a] : null; };
const RELJ = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
const playsOn = (e, d) => { const s = span(e); if (!s || d < s[0] || d > s[1]) return false; const r = e.relaches; return !r || (!r.includes(RELJ[d.getDay()]) && !r.includes(iso(d))); };
const overlaps = (e, s, t) => { const p = span(e); return p && p[0] <= t && p[1] >= s; };
function freeIn(e, s, t) {
  const p = span(e); if (!p) return false;
  let d = new Date(Math.max(+p[0], +s, +TODAY)); const end = new Date(Math.min(+p[1], +t));
  for (let i = 0; d <= end && i < 500; d = add(d, 1), i++) if (!BUSY.has(iso(d))) return true;
  return false;
}
const running = (e) => { const p = span(e); return p && p[0] < TODAY && p[1] >= TODAY && +p[0] !== +p[1]; };
const lastDays = (e) => { const p = span(e); return p && +p[0] !== +p[1] && p[1] >= TODAY && (p[1] - TODAY) / 864e5 <= 10; };
const venteDate = (o) => { const [d, t = "10:00"] = o.vente.split("T"); const [y, m, j] = d.split("-").map(Number); const [h, mi] = t.split(":").map(Number); return new Date(y, m - 1, j, h, mi); };
function venteTxt(o) {
  const h = /T(\d\d):(\d\d)/.exec(o.vente);
  return (o.venteApprox ? "~ " : "") + fmt(D(o.vente), true) + (h ? " " + (+h[1]) + "h" + (h[2] !== "00" ? h[2] : "") : "");
}
// État des ventes (champ facultatif « etat », sur la sortie ou sur une offre). N’influe jamais sur la note.
const ETATS = { "dernieres-places": "Dernières places", attente: "Liste d’attente", complet: "Complet" };
const etatB = (x) => ETATS[x] ? `<span class="b">${ETATS[x]}</span>` : "";
const dansJ = (d) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - TODAY) / 864e5);
const jTxt = (n) => n <= 0 ? "auj." : n === 1 ? "demain" : "J-" + n;
// Ouvertures encore à venir (aujourd’hui compris), hors offres complètes.
const ouvertures = (e) => (e.offres || []).filter((o) => o.vente && o.etat !== "complet" && venteDate(o) >= TODAY).sort((a, b) => venteDate(a) - venteDate(b));
// Nombre de jours joués sur toute la période (relâches retirées) ; null au-delà de 400 jours.
function nbJoues(e) {
  const p = span(e); if (!p) return 0;
  let n = 0; for (let d = p[0], i = 0; d <= p[1]; d = add(d, 1), i++) { if (i > 400) return null; if (playsOn(e, d)) n++; }
  return n;
}
function range(e) {
  if (e.datesTexte) return e.datesTexte;
  const p = span(e); if (!p) return "Dates à préciser";
  const [a, b] = p;
  if (+a === +b) return fmtY(a, true);
  if (nbJoues(e) === 2) return (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear() ? a.getDate() : fmt(a)) + " et " + fmtY(b);
  return a.getFullYear() === b.getFullYear() ? fmt(a) + " – " + fmtY(b) : fmtY(a) + " – " + fmtY(b);
}
// Barème de la veille (CLAUDE.md) : critique, notoriété, hype, bonus +Chef-d’œuvre et +Distinction. « calcul » = "C1 N3 H2 +Chef-d’œuvre" ; total sur 9.
const CRIT = { C: "Critique", N: "Notoriété", H: "Hype" };
function calculDe(t) {
  const m = /^C([0-2]) N([0-3]) H([0-2])((?: \+(?:Chef-d’œuvre|Distinction))*)$/.exec(String(t || "").trim());
  if (!m) return null;
  const socle = { C: +m[1], N: +m[2], H: +m[3] }, bonus = m[4].trim().split(" ").filter(Boolean).map((x) => x.slice(1));
  if (new Set(bonus).size !== bonus.length) return null;
  const total = socle.C + socle.N + socle.H + bonus.length;
  return { socle, bonus, total, note: total >= 7 ? 4 : total >= 5 ? 3 : total >= 2 ? 2 : total >= 1 ? 1 : 0 };
}
const NOTES_TXT = { 4: "incontournable", 3: "fortement recommandé", 2: "bon choix si disponible", 1: "curiosité" };
// Note : quatre carrés (pleins jusqu’à la note), « P » en exposant pour une prévision.
function stars(n, pro, label) {
  if (!n) return "";
  const lib = `${label ? label + " : " : ""}${n} sur 4${label ? "" : ", " + NOTES_TXT[n]}${pro ? ", prévision" : ""}`;
  return `<span class="st" role="img" aria-label="${lib}">${[1, 2, 3, 4].map((i) => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}${pro ? '<sup aria-hidden="true">P</sup>' : ""}</span>`;
}
// Adresses externes : http(s) seulement (jamais javascript:, data:…), même si une donnée était mal formée.
const web = (u) => (/^https?:\/\//i.test(String(u || "")) ? String(u) : "");
const booking = (e) => web(e.billetterie) || web(lieu(e).billetterie); // adresse d’achat seulement (sinon : page officielle)
const official = (e) => web(e.lien) || web(lieu(e).site);
const shareURL = urlSortie;

/* ---------- Index artistes ---------- */
let ART = null;
function artistes() {
  if (ART) return ART;
  ART = {};
  const put = (e, vu) => (e.artistes || []).forEach((a) => {
    const k = slug(a.nom); if (!k) return;
    const r = (ART[k] ??= { slug: k, nom: a.nom, roles: new Set(), aff: [], vus: [] });
    r.roles.add(a.role);
    const l = vu ? r.vus : r.aff; if (!l.includes(e)) l.push(e);
  });
  AFF.filter((e) => e.statut === "a-voir").forEach((e) => put(e, false));
  (JOURNAL || []).forEach((e) => put(e, true));
  return ART;
}

/* ---------- Expositions : état calculé, marques et infos pratiques (communs aux deux sites) ---------- */
// Bloc « expo » d’une sortie de catégorie Exposition (CLAUDE.md) : type, nocturnes, tarif, gratuit, jeunes, creneau, source, ajouteLe.
const EXPO_TYPES = { musee: "Musée", fondation: "Fondation", galerie: "Galerie" };
const EXPO_JEUNES = { "gratuit-ue-18-25": "Gratuit 18–25 ans", gratuit: "Gratuit jeunes", reduit: "Tarif jeune" };
const EXPO_JEUNES_L = { "gratuit-ue-18-25": "Gratuit pour les 18–25 ans résidents de l’Union européenne (musée national)", gratuit: "Gratuit pour les jeunes", reduit: "Tarif réduit pour les jeunes" };
const JOURS_L = { lun: "lundi", mar: "mardi", mer: "mercredi", jeu: "jeudi", ven: "vendredi", sam: "samedi", dim: "dimanche" };
const X_FIN = 14, X_NEUF = 14; // « Derniers jours » : fermeture sous 14 jours ; « Nouveau » : fiche ajoutée depuis 14 jours au plus
const xp = (e) => e.expo || {};
// « bientot » (pas encore ouverte), « derniers » (ferme sous 14 jours) ou « cours ».
const expoEtat = (e) => { const p = span(e); if (!p || p[0] > TODAY) return "bientot"; return dansJ(p[1]) <= X_FIN ? "derniers" : "cours"; };
const expoNeuve = (e) => { if (e.nouveau === true) return true; const d = D(xp(e).ajouteLe); return !!d && dansJ(d) <= 0 && dansJ(d) >= -X_NEUF; };
// Arrondissement de Paris, lu dans le code postal de l’adresse du lieu (75116 = 16e) ; 0 hors Paris ou adresse inconnue.
const arrdt = (e) => { const m = /\b75(\d{3})\b/.exec(lieu(e).adresse || ""); return m ? (+m[1] > 100 ? +m[1] - 100 : +m[1]) : 0; };
const arrdtTxt = (n) => (n ? n + (n === 1 ? "er" : "e") : "");
const joursTxt = (l) => (l || []).filter((j) => JOURS_L[j]).map((j) => "le " + JOURS_L[j]).join(", ");
function expoInfos(e) {
  const x = xp(e), nuit = joursTxt(x.nocturnes), ferme = joursTxt(e.relaches), src = web(x.source);
  const tarif = x.gratuit ? "Entrée libre" : x.tarif || "";
  const jeunes = x.gratuit ? "" : [EXPO_JEUNES_L[x.jeunes], x.jeunesTexte].filter(Boolean).join(". ");
  return `${EXPO_TYPES[x.type] ? `<dt>Type</dt><dd>${EXPO_TYPES[x.type]}${arrdt(e) ? ", Paris " + arrdtTxt(arrdt(e)) : ""}</dd>` : ""}${tarif ? `<dt>Tarif</dt><dd>${esc(tarif)}</dd>` : ""}${jeunes ? `<dt>Jeunes</dt><dd>${esc(jeunes)}</dd>` : ""}${typeof x.creneau === "boolean" ? `<dt>Créneau</dt><dd>${x.creneau ? "Réservation d’un créneau obligatoire" : "Sans réservation"}</dd>` : ""}${nuit ? `<dt>Nocturne</dt><dd>${cap(nuit)}</dd>` : ""}${ferme ? `<dt>Fermé</dt><dd>${cap(ferme)}</dd>` : ""}${src ? `<dt>Source</dt><dd><a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(hote(src))}</a></dd>` : ""}`;
}

/* ---------- Fragments ---------- */
function stubHTML(e, mode) {
  if (mode === "vu") {
    const v = D((e.vuLe || []).at(-1));
    return v ? `<span class="stub"><b>${v.getDate()}</b><small>${MOIS[v.getMonth()]} ${String(v.getFullYear()).slice(2)}</small></span>` : `<span class="stub"><b>–</b></span>`;
  }
  const p = span(e);
  if (!p) return `<span class="stub"><b>–</b><small>à venir</small></span>`;
  if (running(e)) return `<span class="stub" title="jusqu’au ${fmtY(p[1])}"><small class="fin">fin<span class="vh"> le</span></small><b>${p[1].getDate()}</b><small>${MOIS[p[1].getMonth()]}</small></span>`;
  // Trois lignes au plus : jour, mois, puis « au 24 » (même mois) ou « au 24/01 » ; « et » s’il n’y a que deux dates.
  const loin = (d) => (d.getFullYear() !== TODAY.getFullYear() && d.getFullYear() !== TODAY.getFullYear() + 1 ? " " + String(d.getFullYear()).slice(2) : "");
  // Même mois : « 16 / au 24 / avr. » ; mois différents : « 24 / févr. au / 7 mars ».
  const mot = nbJoues(e) === 2 ? "et" : "au", meme = p[0].getMonth() === p[1].getMonth() && p[0].getFullYear() === p[1].getFullYear();
  const tt = `${fmtY(p[0], true)} ${mot} ${fmtY(p[1], true)}`;
  if (+p[0] === +p[1]) return `<span class="stub"><b>${p[0].getDate()}</b><small>${MOIS[p[0].getMonth()]}${loin(p[0])}</small></span>`;
  if (meme) return `<span class="stub" title="${esc(tt)}"><b>${p[0].getDate()}</b><small class="au">${mot} ${p[1].getDate()}</small><small>${MOIS[p[0].getMonth()]}${loin(p[0])}</small></span>`;
  return `<span class="stub" title="${esc(tt)}"><b>${p[0].getDate()}</b><small class="au2"><span>${MOIS[p[0].getMonth()]}</span> ${mot}</small><small class="au2">${p[1].getDate()} ${MOIS[p[1].getMonth()]}</small></span>`;
}
function badges(e) {
  // Alignés à droite de la ligne lieu ; les plus importants au bord droit (ordre de lecture : déjà vu … Léonard y va).
  const b = [];
  const dv = e.statut !== "vu" && DEJA_VU[e.id]; // l’œuvre figure au journal (data/deja-vu.json, généré par build.mjs)
  if (dv && dv.length) { const t = "Vu le " + dv.map((x) => fmtY(D(x))).join(", "); b.push(`<span class="b vu" title="${esc(t)}" aria-label="Déjà vu (${esc(t.toLowerCase())})">Déjà vu</span>`); }
  if (estExpo(e) && e.statut !== "vu") {
    const x = xp(e), et = expoEtat(e);
    if (x.gratuit) b.push(`<span class="b">Gratuit</span>`); else if (EXPO_JEUNES[x.jeunes]) b.push(`<span class="b" title="${esc(EXPO_JEUNES_L[x.jeunes])}">${EXPO_JEUNES[x.jeunes]}</span>`);
    if (expoNeuve(e)) b.push(`<span class="b">Nouveau</span>`);
    if (et === "derniers") b.push(`<span class="b">Derniers jours</span>`); else if (et === "bientot") b.push(`<span class="b">Bientôt</span>`);
    if (e.leonardYVa) b.push(`<span class="b yva">${OWNER} y va</span>`);
    return b.length ? `<span class="bds">${b.join("")}</span>` : "";
  }
  if (e.nouveau === true && e.statut !== "vu") b.push(`<span class="b">Nouveau</span>`); // ajoutée par la dernière veille (CLAUDE.md, « Veille »)
  if (e.publicJeune) b.push(`<span class="b">Public jeune</span>`);
  if ((e.offres || []).length) b.push(`<span class="b">Offre jeune</span>`);
  if (ETATS[e.etat]) b.push(etatB(e.etat));
  else if (lastDays(e)) b.push(`<span class="b">Dernières dates</span>`);
  if (e.leonardYVa) b.push(`<span class="b yva">${OWNER} y va</span>`);
  return b.length ? `<span class="bds">${b.join("")}</span>` : "";
}
// Artistes en tête de ligne : auteur, compositeur, mise en scène, chorégraphie, puis les autres ; trois au plus.
const ORDRE_ART = ["auteur", "compositeur", "mise en scène", "chorégraphie", "direction musicale", "commissaire", "réalisation", "compagnie", "interprète", "artiste"];
const rangArt = (e, a) => (estExpo(e) && a.role === "artiste" ? -1 : ORDRE_ART.indexOf(a.role)); // exposition : les artistes exposés avant les commissaires
const artLigne = (e) => [...new Set([...(e.artistes || [])].sort((a, b) => rangArt(e, a) - rangArt(e, b)).map((a) => a.nom))].slice(0, 3).join(", "); // sans répéter un nom
// Recherche plein texte (titre, artistes, lieu, salle, avis, années vues ; notes privées si connecté), sans accents, tous les mots.
const normQ = (s) => norm(s).replace(/[’‘`]/g, "'");
function texteDe(e) {
  const L = lieu(e), jp = PRIVE && PRIVE.journalPrive ? PRIVE.journalPrive[e.id] : null;
  return normQ([e.titre, e.sousGenre, e.categorie, ...(e.artistes || []).map((a) => a.nom), court(e.lieuId), L.nom, L.ville, e.salle, e.avis, e.pourquoi, ...(e.vuLe || []), jp && jp.notes].filter(Boolean).join(" "));
}
const cherche = (e, q) => { const t = normQ(q).trim(); if (!t) return true; const x = texteDe(e); return t.split(/\s+/).every((m) => x.includes(m)); };
const genre = (e) => e.categorie + (e.sousGenre ? " (" + e.sousGenre.toLowerCase() + ")" : "");
// Ligne : 1) genre à gauche, note à droite (cœur juste avant en admin) ; 2) titre ; 3) artistes ; 4) lieu et horaires, puis badges.
const coeurPub = (e) => (!(PRIVE && ADMIN) && enviesIds().has(e.id) ? `<span class="coeur-l" role="img" aria-label="Coup de cœur de ${OWNER}">${COEUR}</span>` : "");
// Bande de genre : aplat fin de la couleur du genre, à gauche de la ligne.
const gb = (e) => `<span class="gb" aria-hidden="true"></span>`; // bande pleine de la couleur du genre, sans contenu
// Première ligne : titre à gauche, note puis cœur à droite.
// Première ligne : picto du genre (de sa couleur) et titre à gauche, note puis cœur à droite.
const l1 = (e, note) => `<span class="l1"><span class="tt nom">${genreIco(e, "gt")}<span class="vh">${esc(genre(e))} : </span>${esc(e.titre)}</span>${note}${coeurPub(e)}</span>`;
// Libellés courts des puces de genre (pour tenir sur une ligne) ; le nom complet reste en aria-label.
const GENRE_PUCE = { "Comédie musicale": "Musical" };
const sousG = (e) => (e.sousGenre ? cap(e.sousGenre.toLowerCase()) : "");
const ligneMeta = (meta, b) => (meta || b ? `<span class="ss">${meta ? `<span class="ssm">${meta}</span>` : ""}${b}</span>` : ""); // lieu à gauche, labels à droite
function rowA(e) {
  const h = e.horaires && e.horaires.length <= 40 ? e.horaires : "", art = artLigne(e);
  const meta = esc([sousG(e), estExpo(e) ? EXPO_TYPES[xp(e).type] : "", court(e.lieuId), estExpo(e) ? arrdtTxt(arrdt(e)) : ""].filter(Boolean).join(" · ")) + (h ? `<span class="hor"> · ${esc(h)}</span>` : ""); // horaires : bureau seulement (fiche dépliée sur mobile)
  return `<article class="row g-${famE(e)}" data-id="${esc(e.id)}"><button class="rb" type="button" aria-expanded="false" aria-controls="d-${esc(e.id)}">${gb(e)}${stubHTML(e)}
  <span class="mid">${l1(e, stars(e.note, e.pronostic))}${art ? `<span class="art nom">${esc(art)}</span>` : ""}${ligneMeta(meta, badges(e))}</span></button>${PRIVE && ADMIN ? ADMIN.heart(e.id) : ""}<div class="det" id="d-${esc(e.id)}" hidden></div></article>`;
}
function rowJ(e) {
  const n = (e.vuLe || []).length;
  const meta = [sousG(e), court(e.lieuId), n > 1 ? `vu ${n} fois : ${e.vuLe.map((d) => fmtY(D(d))).join(", ")}` : ""].filter(Boolean).join(" · ");
  // Admin : les personnes venues avec moi, en label sur la ligne.
  const jp = PRIVE && ADMIN && PRIVE.journalPrive ? PRIVE.journalPrive[e.id] : null, acc = jp ? [...new Set(jp.accompagnants || [])] : [];
  return `<article class="row g-${famE(e)}" data-id="${esc(e.id)}"><button class="rb" type="button" aria-expanded="false" aria-controls="d-${esc(e.id)}">${gb(e)}${stubHTML(e, "vu")}
  <span class="mid">${l1(e, e.noteLeonard ? stars(e.noteLeonard, false, "Ma note") : "")}${e.avis ? `<span class="art avis">« ${esc(e.avis)} »</span>` : artLigne(e) ? `<span class="art nom">${esc(artLigne(e))}</span>` : ""}${ligneMeta(esc(meta), acc.length ? `<span class="bds"><span class="b">avec ${esc(acc.join(", "))}</span></span>` : "")}</span></button><div class="det" id="d-${esc(e.id)}" hidden></div></article>`;
}
function creditsHTML(e) {
  const ordre = estExpo(e) ? ["artiste", ...ROLES.filter((r) => r !== "artiste")] : ROLES; // exposition : artistes exposés d’abord
  const rg = (r) => (ordre.includes(r) ? ordre.indexOf(r) : ordre.length);
  // Une personne à plusieurs rôles n’est citée qu’une fois : « auteur, mise en scène Laura Vazquez ».
  const pers = new Map();
  (e.artistes || []).forEach((a) => { const p = pers.get(a.nom) || pers.set(a.nom, { nom: a.nom, roles: [] }).get(a.nom); if (!p.roles.includes(a.role)) p.roles.push(a.role); });
  const grp = new Map();
  for (const p of pers.values()) { p.roles.sort((x, y) => rg(x) - rg(y)); const k = p.roles.join(", "); (grp.get(k) || grp.set(k, []).get(k)).push(p); }
  const lien = (a) => `<a href="#artiste-${slug(a.nom)}">${esc(a.nom)}</a>`, MAXN = 6;
  return [...grp].sort((a, b) => rg(a[1][0].roles[0]) - rg(b[1][0].roles[0]) || a[1][0].roles.length - b[1][0].roles.length).map(([k, n]) => {
    const vis = n.length > MAXN + 1 ? n.slice(0, MAXN) : n, reste = n.slice(vis.length);
    return `<span class="ro">${esc(k)}</span> ${vis.map(lien).join(", ")}${reste.length ? `<button class="plus" type="button" data-plus aria-expanded="false" aria-label="Voir ${reste.length} autres noms">+ ${reste.length}</button><span hidden>, ${reste.map(lien).join(", ")}</span>` : ""}`;
  }).join(" · ");
}
function offresHTML(e) {
  const L = lieu(e);
  const li = (e.offres || []).map((o) => {
    const v = o.vente ? venteDate(o) : null;
    let t = `<b>${esc(o.type)}</b>${o.date ? " le " + fmt(D(o.date), true) : ""}${o.tarif ? ", " + esc(o.tarif) : ""}`;
    if (v) t += v <= NOW ? (o.etat ? "" : ", en vente") : `, vente ${o.venteApprox ? "vers le " : "le "}${venteTxt(o).replace(/^~ /, "")}${dansJ(v) <= 14 ? ` <b class="warn">(${jTxt(dansJ(v))})</b>` : ""}`;
    if (ETATS[o.etat]) t += ` <b class="warn">${ETATS[o.etat].toLowerCase()}</b>`;
    if (o.condition) t += ` <span class="cr">(${esc(o.condition)})</span>`;
    return `<li>${t}</li>`;
  });
  if (L.tarifJeune) li.push(`<li class="soft">Tarif jeune du lieu : ${esc(L.tarifJeune)}</li>`);
  return li.length ? `<ul class="off">${li.join("")}</ul>` : "";
}
function actsHTML(e, details, adm = "") {
  const o = official(e), b0 = booking(e), b = b0 && b0 !== o ? b0 : "", vu = e.statut === "vu";
  const lo = vu ? "Page archivée" : "Site officiel"; // libellés masqués sur mobile quand les icônes admin suivent (aria-label gardé)
  return `<div class="acts">${b && !vu ? `<a class="btn pri" href="${esc(b)}" target="_blank" rel="noopener noreferrer" aria-label="Billetterie">${ico("billet")}<span class="lbl">Billetterie</span></a>` : ""}${o ? `<a class="btn${!b && !vu ? " pri" : ""}" href="${esc(o)}" target="_blank" rel="noopener noreferrer" aria-label="${lo}">${ico("externe")}<span class="lbl">${lo}</span></a>` : ""}${details ? `<button class="btn ico" type="button" data-share="${esc(e.id)}" aria-label="Partager" title="Partager">${ico("partager")}</button>` : ""}${adm ? `<span class="acts-adm" role="group" aria-label="Admin">${adm}</span>` : ""}</div>`;
}
function detHTML(e) {
  const c = creditsHTML(e);
  // Journal : la fiche, comme en public ; en admin, mes infos privées et un bouton « Modifier » qui ouvre le formulaire complet.
  if (e.statut === "vu") {
    const L = lieu(e), adm = PRIVE && ADMIN;
    const mod = adm ? `<button class="btn ai" type="button" data-adm="jmodif" data-id="${esc(e.id)}" aria-label="Modifier les entrées et la fiche" title="Modifier les entrées et la fiche">${ico("modifier")}</button><button class="btn ai danger" type="button" data-adm="supprimer" data-id="${esc(e.id)}" aria-label="Supprimer du journal" title="Supprimer du journal">${ico("supprimer")}</button>` : "";
    const res = adm ? ADMIN.journalResume(e) : "";
    return `${res ? `<section class="adm-c" aria-label="Admin">${res}</section>` : ""}${c ? `<p class="cr">${c}</p>` : ""}
    <dl class="dl"><dt>${ico("lieu")}<span class="vh">Lieu</span></dt><dd class="pl">${e.lieuId && L.nom ? `<a href="#lieu-${esc(e.lieuId)}">${esc(L.nom)}</a>` : "À préciser"}${e.salle ? ", " + esc(e.salle) : ""}</dd>
    ${e.note ? `<dt>Grille</dt><dd>${stars(e.note, false, "Note de la grille")}</dd>` : ""}</dl>
    ${e.pourquoi ? `<p class="why">${esc(e.pourquoi)}</p>` : ""}${actsHTML(e, true, mod)}`;
  }
  return ficheCorps(e);
}
// Détail du barème sous « Pourquoi » : « Critique 1 · Notoriété 3 · Hype 2 · Chef-d’œuvre +1 = 7 ».
function calculHTML(e) {
  const k = calculDe(e.calcul); if (!k) return "";
  const t = [...Object.entries(CRIT).map(([c, l]) => l + " " + k.socle[c]), ...k.bonus.map((b) => b + " +1")].join(" · ");
  return `<p class="calc"><span class="vh">Barème : </span>${esc(t)} = ${k.total} sur 9${e.pronostic ? " (prévision)" : ""}</p>`;
}
// Corps de la fiche : utilisé par la fiche plein écran et par le déroulé d’une ligne (toute la fiche, sans détour).
function ficheCorps(e, plein) {
  const L = lieu(e), c = creditsHTML(e);
  return `${PRIVE && ADMIN ? ADMIN.ficheHTML(e) : ""}${c ? `<p class="cr">${c}</p>` : ""}
    <dl class="dl"><dt>${ico("lieu")}<span class="vh">Lieu</span></dt><dd class="pl">${e.lieuId && L.nom ? `<a href="#lieu-${esc(e.lieuId)}">${esc(L.nom)}</a>` : "À préciser"}${e.salle ? ", " + esc(e.salle) : ""}${L.ville && L.ville !== "Paris" ? " (" + esc(L.ville) + ")" : ""}</dd>
    <dt>${ico("mois")}<span class="vh">Dates</span></dt><dd>${esc(range(e))}</dd>${e.horaires ? `<dt>${ico("horaires")}<span class="vh">Horaires</span></dt><dd>${esc(e.horaires)}</dd>` : ""}${estExpo(e) ? expoInfos(e) : ""}</dl>
    ${e.pourquoi ? `<p class="why">${esc(e.pourquoi)}</p>` : ""}${calculHTML(e)}${actsHTML(e, !plein, PRIVE && ADMIN ? ADMIN.ficheActs(e) : "")}
    ${(e.offres || []).length || L.tarifJeune ? `<h3 class="sec">Offres</h3>${offresHTML(e)}` : ""}<h3 class="sec">Dates</h3>${ficheCal(e)}`;
}

/* ---------- Calendriers ---------- */
function monthGrid(y, m, cellFn) {
  const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
  let h = '<div class="grid">' + ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."].map((d) => `<div class="dow" aria-hidden="true">${d}</div>`).join("");
  for (let i = 0, p = (first.getDay() + 6) % 7; i < p; i++) h += '<div class="cell out" aria-hidden="true"></div>';
  for (let d = 1; d <= last.getDate(); d++) h += cellFn(new Date(y, m, d));
  return h + "</div>";
}
const moisN = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth() + 1;
// Calendrier de la fiche : trois mois au plus d’emblée ; au-delà, deux puis « N mois suivants » à déplier (six au total).
function ficheCal(e) {
  const p = span(e); if (!p) return '<p class="empty">Dates inconnues.</p>';
  const offers = new Set((e.offres || []).map((o) => o.date).filter(Boolean));
  const st = p[0] < TODAY ? TODAY : p[0];
  let h = "", n = 0, plus = "";
  for (let c = new Date(st.getFullYear(), st.getMonth(), 1); c <= p[1] && n < 6; c = new Date(c.getFullYear(), c.getMonth() + 1, 1), n++) {
    if (n === 2 && moisN(st, p[1]) > 3) { plus = h; h = ""; }
    h += `<div class="cal mini"><div class="calh"><h3>${MOIS_L[c.getMonth()]} ${c.getFullYear()}</h3></div>` + monthGrid(c.getFullYear(), c.getMonth(), (d) => {
      const k = iso(d), on = playsOn(e, d) && d >= TODAY, busy = BUSY.has(k);
      const cls = ["cell", on ? (busy ? "busy" : "play") : "", d < TODAY ? "past" : "", +d === +TODAY ? "today" : "", offers.has(k) ? "of" : ""].filter(Boolean).join(" ");
      const joue = estExpo(e) ? ", ouverte" : ", se joue";
      const lab = `${fmt(d, true)}${on ? (busy ? `${joue}, ${OWNER} pris` : HORIZON && k > HORIZON ? joue : `${joue}, ${OWNER} libre`) : ""}${offers.has(k) ? ", " + esc((((e.offres || []).find((o) => o.date === k) || {}).type || "offre").toLowerCase()) : ""}`;
      return `<div class="${cls}" role="img" aria-label="${lab}"><span class="n" aria-hidden="true">${d.getDate()}</span></div>`;
    }) + "</div>";
  }
  const vus = new Set(); for (let c = new Date(st.getFullYear(), st.getMonth(), 1), i = 0; c <= p[1] && i < 6; c = new Date(c.getFullYear(), c.getMonth() + 1, 1), i++) vus.add(iso(c).slice(0, 7));
  const ofs = (e.offres || []).filter((o) => o.date && vus.has(o.date.slice(0, 7)) && D(o.date) >= TODAY), tys = [...new Set(ofs.map((o) => typeCourt(o.type)))];
  const libOf = tys.length === 1 ? tys[0] : "Offre";
  const loin = HORIZON && iso(p[1]) > HORIZON ? `<p class="aide">Soirs pris connus jusqu’au ${fmt(D(HORIZON))}.</p>` : "";
  const suite = plus ? `<details class="mois-plus"><summary>${plural(n - 2, "mois suivant", "mois suivants")}</summary><div class="mini-wrap">${h}</div></details>` : "";
  return `<div class="mini-wrap">${plus || h}</div>${suite}<div class="legend"><span class="l-joue">${OWNER} libre</span><span class="l-pris">${OWNER} pris</span>${ofs.length ? `<span class="l-offre">${esc(libOf)}</span>` : ""}</div>
  ${e.relaches ? "" : `<p class="aide">${estExpo(e) ? "Jours de fermeture non renseignés." : "Relâches non renseignées."}</p>`}${loin}`;
}

/* ---------- Filtres de l’affiche (état dans l’URL) ---------- */
const ZONES = { paris: "Paris", pc: "Petite couronne" }, STATUTS = { public: "Public", prive: "Privé" };
const RAC = { soir: "Ce soir", we: "Ce week-end", semaine: "Cette semaine" };
function parseF(q) {
  const p = new URLSearchParams(q || ""), L = (k) => (p.get(k) || "").split(",").filter(Boolean);
  return { cat: new Set(L("cat")), note: +p.get("note") || 0, zone: new Set(L("zone")), statut: new Set(L("statut")), jeune: p.has("jeune"), offre: p.has("offre"), yva: p.has("yva"), neuf: p.has("neuf"),
    q: p.get("q") || "", lieu: p.get("lieu") || "", per: p.get("per") || "", jour: p.get("jour") || "", rac: p.get("rac") || "", libre: p.has("libre"), vue: p.get("vue") === "mois" ? "mois" : "liste", mois: p.get("mois") || "", tri: p.get("tri") === "note" ? "note" : "date" };
}
function serF(f) {
  const p = [], put = (k, v) => p.push(v === true ? k : k + "=" + [...(v instanceof Set ? v : [v])].map(encodeURIComponent).join(","));
  if (f.vue === "mois") put("vue", "mois");
  if (f.vue === "mois" && f.mois) put("mois", f.mois);
  for (const k of ["cat", "zone", "statut"]) if (f[k].size) put(k, f[k]);
  if (f.note) put("note", f.note);
  for (const k of ["jeune", "offre", "yva", "neuf", "libre"]) if (f[k]) put(k, true);
  for (const k of ["lieu", "per", "jour", "rac"]) if (f[k]) put(k, f[k]);
  if (f.tri !== "date") put("tri", f.tri);
  if (f.q.trim()) put("q", f.q.trim());
  return p.join("&");
}
function racWindow(r) {
  const d = TODAY.getDay();
  if (r === "soir") return [TODAY, TODAY];
  const sun = add(TODAY, (7 - d) % 7);
  if (r === "semaine") return [TODAY, sun];
  if (r === "we") { if (d === 0 || d === 6 || d === 5) return [TODAY, sun]; const fri = add(TODAY, 5 - d); return [fri, add(fri, 2)]; }
  return null;
}
function window_(f) { if (f.jour) { const d = D(f.jour); return [d, d]; } return f.rac ? racWindow(f.rac) : null; }
function perWindow(f) {
  if (!f.per) return null;
  if (f.per === "30") return [TODAY, add(TODAY, 30)];
  const [y, m] = f.per.split("-").map(Number); return [new Date(y, m - 1, 1), new Date(y, m, 0)];
}
// Nouveauté : fiche ajoutée par la dernière veille (ou expo ajoutée depuis 14 jours).
const estNeuf = (e) => !!e.nouveau || (estExpo(e) && expoNeuve(e));
function matchA(e, f, noWin) {
  const L = lieu(e);
  if (f.q && !cherche(e, f.q)) return false;
  if (f.cat.size && !f.cat.has(slug(e.categorie))) return false;
  if (f.note && e.note < f.note) return false;
  if (f.zone.size && ![...f.zone].some((z) => ZONES[z] === L.zone)) return false;
  if (f.statut.size && ![...f.statut].some((s) => STATUTS[s] === L.statut)) return false;
  if (f.jeune && !e.publicJeune) return false;
  if (f.offre && !(e.offres || []).length) return false;
  if (f.yva && !e.leonardYVa) return false;
  if (f.neuf && !estNeuf(e)) return false;
  if (f.lieu && e.lieuId !== f.lieu) return false;
  const pw = perWindow(f); if (pw && !overlaps(e, pw[0], pw[1])) return false;
  const w = noWin ? null : window_(f);
  if (w && !overlaps(e, w[0], w[1])) return false;
  if (f.libre) { const ww = w || pw || [TODAY, new Date(9e15)]; if (!freeIn(e, ww[0], ww[1])) return false; }
  return true;
}
function activeList(f) {
  const a = [], lbl = (k, v, t) => a.push({ k, v, t });
  if (f.q.trim()) lbl("q", "", "« " + f.q.trim() + " »");
  if (f.jour) lbl("jour", "", fmt(D(f.jour), true));
  if (f.rac) lbl("rac", "", RAC[f.rac]);
  if (f.libre) lbl("libre", "", "Soirs libres");
  f.cat.forEach((c) => lbl("cat", c, CATS.find((x) => slug(x) === c) || c));
  if (f.note) lbl("note", "", f.note === 4 ? "Note 4" : "Note " + f.note + " et +");
  f.zone.forEach((z) => lbl("zone", z, ZONES[z] || z));
  f.statut.forEach((s) => lbl("statut", s, STATUTS[s] || s));
  if (f.jeune) lbl("jeune", "", "Public jeune");
  if (f.offre) lbl("offre", "", "Offre jeune");
  if (f.yva) lbl("yva", "", OWNER + " y va");
  if (f.neuf) lbl("neuf", "", "Nouveautés");
  if (f.lieu) lbl("lieu", "", court(f.lieu) || f.lieu);
  if (f.per) lbl("per", "", f.per === "30" ? "30 prochains jours" : MOIS_L[+f.per.slice(5) - 1] + " " + f.per.slice(0, 4));
  return a;
}

/* ---------- Vue « À l’affiche » ---------- */
let F = parseF(""), LAST_AFF = ACCUEIL;
function setF(mut) {
  mut(F);
  history.replaceState(null, "", "#affiche" + (serF(F) ? "?" + serF(F) : ""));
  BASE = RENDERED = LAST_AFF = location.hash.slice(1);
  updateAffiche();
}
function renderAffiche(q) {
  F = parseF(q); LAST_AFF = "affiche" + (q ? "?" + q : "");
  const cats = CATS.filter((c) => c !== "Exposition" && LIVE.some((e) => e.categorie === c)); // Expo : page dédiée à venir
  const lieux = [...new Set(LIVE.map((e) => e.lieuId).filter(Boolean))].sort((a, b) => norm(court(a)).localeCompare(norm(court(b))));
  const months = []; for (let i = 0; i < 10; i++) { const d = new Date(TODAY.getFullYear(), TODAY.getMonth() + i, 1); months.push([iso(d).slice(0, 7), cap(MOIS_L[d.getMonth()]) + " " + d.getFullYear()]); }
  const chip = (g, v, t, extra = "") => `<button class="chip" type="button" data-g="${g}" data-v="${esc(v)}" aria-pressed="false"${extra}>${t}</button>`;
  const rd = radar();
  $("#main").innerHTML = `<div class="aff-g"><section id="aff"><h1 class="vh">À l’affiche</h1>
  ${coeurLigne()}
  <div class="tools barre-f">${rech("aq", "Rechercher à l’affiche", F.q)}
    <button class="chip filtres" type="button" data-panel="pF" aria-expanded="false" aria-controls="pF">${ico("filtres")}<span class="lbf">Filtres</span><span class="nf" id="nF"></span></button></div>
  <div class="fbar"><div class="chips defile gtabs" role="group" aria-label="Genres">${cats.map((c) => chip("cat", slug(c), ico(c) + esc(GENRE_PUCE[c] || c), GENRE_PUCE[c] ? ` aria-label="${esc(c)}"` : "").replace('class="chip"', `class="chip g-${famille(c)}"`)).join("")}</div>
    <div class="fpanel" id="pF" hidden>
      <div class="fgr" role="group" aria-labelledby="fgN"><span class="fl" id="fgN">Note</span><div class="chips">${chip("note", "2", carres(2, true), ' aria-label="Note 2 et plus"')}${chip("note", "3", carres(3, true), ' aria-label="Note 3 et plus"')}${chip("note", "4", carres(4), ' aria-label="Note 4"')}</div></div>
      <div class="fgr" role="group" aria-labelledby="fgO"><span class="fl" id="fgO">Où</span><div><div class="chips">${chip("zone", "paris", "Paris")}${chip("zone", "pc", "Petite couronne")}<span class="sep" aria-hidden="true"></span>${chip("statut", "public", "Lieu public")}${chip("statut", "prive", "Lieu privé")}</div>
        <label class="f"><span>Lieu</span><select id="fLieu"><option value="">Tous les lieux</option>${lieux.map((l) => `<option value="${esc(l)}">${esc(court(l))}</option>`).join("")}</select></label></div></div>
      <div class="fgr" role="group" aria-labelledby="fgQ"><span class="fl" id="fgQ">Quand</span><div><div class="chips">${Object.entries(RAC).map(([k, t]) => chip("rac", k, t)).join("")}${chip("per", "30", "30 jours")}</div><label class="f"><span>Période</span><select id="fPer"><option value="">Toute la saison</option><option value="30">30 prochains jours</option>${months.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select></label>
        <div class="chips">${chip("libre", "1", "Soirs libres", ` aria-label="Seulement les soirs où ${OWNER} est libre"`)}</div></div></div>
      <div class="fgr" role="group" aria-labelledby="fgP"><span class="fl" id="fgP">Pour</span><div class="chips">${chip("jeune", "1", "Public jeune")}${chip("offre", "1", "Offre jeune")}${chip("yva", "1", OWNER + " y va")}${chip("neuf", "1", "Nouveautés")}</div></div>
    </div>
    <div class="resbar"><span class="n" id="nres" aria-live="polite"></span>
      <div class="vuectl"><button class="linkbtn tri" type="button" id="tri"></button><div class="seg seg-s" role="group" aria-label="Affichage"><button class="i" type="button" data-vue="liste" aria-pressed="true" aria-label="Liste">${ico("liste")}</button><button class="i" type="button" data-vue="mois" aria-pressed="false" aria-label="Calendrier">${ico("mois")}</button></div></div><div class="active" id="active"></div></div></div>
  <div id="monthBox"></div>
  <div id="alist" class="list"></div><p class="aussi" id="aussi" hidden></p></section>${radarLateral()}</div>`;
  const m = $("#aff");
  m.querySelector(".seg").onclick = (ev) => { const b = ev.target.closest("[data-vue]"); if (b) setF((f) => { f.vue = b.dataset.vue; }); };
  m.querySelectorAll("[data-panel]").forEach((b) => b.onclick = () => {
    const p = $("#" + b.dataset.panel), open = p.hidden;
    m.querySelectorAll("[data-panel]").forEach((x) => { $("#" + x.dataset.panel).hidden = true; x.setAttribute("aria-expanded", "false"); });
    p.hidden = !open; b.setAttribute("aria-expanded", String(open));
  });
  m.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-g]"); if (!b || !m.contains(b)) return;
    const g = b.dataset.g, v = b.dataset.v;
    setF((f) => {
      if (g === "rac") { f.rac = f.rac === v ? "" : v; f.jour = ""; }
      else if (g === "note") f.note = f.note === +v ? 0 : +v;
      else if (g === "per") f.per = f.per === v ? "" : v;
      else if (["libre", "jeune", "offre", "yva", "neuf"].includes(g)) f[g] = !f[g];
      else if (f[g] instanceof Set) f[g].has(v) ? f[g].delete(v) : f[g].add(v);
    });
  });
  $("#aq").oninput = (ev) => setF((f) => { f.q = ev.target.value; });
  $("#fLieu").onchange = (ev) => setF((f) => { f.lieu = ev.target.value; });
  $("#fPer").onchange = (ev) => setF((f) => { f.per = ev.target.value; });
  updateAffiche();
}
function updateAffiche() {
  const m = $("#aff"), f = F;
  m.querySelectorAll("[data-g]").forEach((b) => {
    const g = b.dataset.g, v = b.dataset.v;
    const on = g === "rac" ? f.rac === v : g === "per" ? f.per === v : g === "note" ? f.note === +v : typeof f[g] === "boolean" ? f[g] : f[g] instanceof Set ? f[g].has(v) : false;
    b.setAttribute("aria-pressed", String(!!on));
  });
  const nF = (f.note ? 1 : 0) + f.zone.size + f.statut.size + (f.lieu ? 1 : 0) + (f.per ? 1 : 0) + (f.rac ? 1 : 0) + [f.libre, f.jeune, f.offre, f.yva, f.neuf].filter(Boolean).length;
  $("#nF").textContent = nF ? " " + nF : ""; m.querySelector("[data-panel=pF]").setAttribute("aria-label", "Filtres" + (nF ? `, ${nF} actif${nF > 1 ? "s" : ""}` : ""));
  m.querySelectorAll("[data-vue]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vue === f.vue)));
  $("#fLieu").value = f.lieu; $("#fPer").value = f.per;
  const aq = $("#aq"); if (aq && document.activeElement !== aq && aq.value !== f.q) aq.value = f.q;
  // Résultats
  let items = LIVE.filter((e) => matchA(e, f, f.vue === "mois" && !f.jour));
  if (f.vue === "mois" && !f.jour) { const c = monthCursor(f); items = items.filter((e) => overlaps(e, c, new Date(c.getFullYear(), c.getMonth() + 1, 0))); }
  const act = activeList(f);
  $("#nres").textContent = plural(items.length, "sortie");
  $("#active").innerHTML = `${act.map((a) => `<button class="chip on${a.k === "cat" ? " g-" + famille(a.t) : ""}" type="button" data-rm="${a.k}" data-v="${esc(a.v)}" aria-label="Retirer le filtre ${esc(a.t)}">${esc(a.t)}<span class="x" aria-hidden="true">×</span></button>`).join("")}${act.length ? `<button class="chip effacer" type="button" id="clear">Tout effacer</button>` : ""}`;
  const tri = $("#tri"); tri.innerHTML = ico("tri") + (f.tri === "note" ? "Note" : "Date"); tri.setAttribute("aria-label", `Tri par ${f.tri === "note" ? "note" : "date"}, changer`);
  tri.onclick = () => setF((x) => { x.tri = x.tri === "note" ? "date" : "note"; });
  $("#active").onclick = (ev) => {
    const r = ev.target.closest("[data-rm]");
    if (r) return setF((x) => { const k = r.dataset.rm; if (x[k] instanceof Set) x[k].delete(r.dataset.v); else x[k] = typeof x[k] === "boolean" ? false : typeof x[k] === "number" ? 0 : ""; });
    if (ev.target.id === "clear") return setF((x) => { const keep = { vue: x.vue, mois: x.mois, tri: x.tri }; Object.assign(x, parseF(""), keep); });
  };
  // Mois
  $("#monthBox").innerHTML = f.vue === "mois" ? monthHTML(f) : "";
  if (f.vue === "mois") {
    $("#monthBox").onclick = (ev) => {
      const nav = ev.target.closest("[data-mnav]");
      if (nav) return setF((x) => { const c = monthCursor(x); x.mois = iso(new Date(c.getFullYear(), c.getMonth() + +nav.dataset.mnav, 1)).slice(0, 7); x.jour = ""; });
      const c = ev.target.closest("[data-day]"); if (c) setF((x) => { x.jour = x.jour === c.dataset.day ? "" : c.dataset.day; x.rac = ""; });
    };
  }
  // Liste
  const L = $("#alist"), w = window_(f);
  const byDate = (a, b) => sortKey(a) - sortKey(b) || a.titre.localeCompare(b.titre, "fr");
  let html = "";
  if (f.jour) { const d = D(f.jour); html += `<h2 class="jour">${cap(fmt(d, true))} ${d.getFullYear()}${BUSY.has(f.jour) ? ` <small>Pris</small>` : ""}</h2>`; }
  if (!items.length) html += `<p class="empty">Aucune sortie.</p>`;
  else if (f.tri === "note" || w) html += items.sort((a, b) => b.note - a.note || byDate(a, b)).map(rowA).join("");
  else {
    items.sort(byDate); let last = null;
    for (const e of items) {
      const g = groupOf(e);
      if (g !== last) { html += `<h2 class="jour">${g}</h2>`; last = g; }
      html += rowA(e);
    }
  }
  L.innerHTML = html;
  aussi(f.q);
}
// Recherche étendue : la même recherche au journal, parmi les artistes et les lieux (liens sous les résultats).
function aussi(q0) {
  const el = $("#aussi"), q = (q0 || "").trim(); if (!el) return;
  if (q.length < 2) { el.hidden = true; el.textContent = ""; return; }
  if (!JOURNAL) { loadJournal().then(() => { if (F.q.trim() === q) aussi(q); }).catch(() => {}); }
  const nq = norm(q), enc = encodeURIComponent(q), L = [];
  const nj = (JOURNAL || []).filter((e) => cherche(e, q)).length;
  const na = Object.values(artistes()).filter((a) => norm(a.nom).includes(nq)).length;
  const nl = Object.keys(LIEUX).filter((id) => norm(LIEUX[id].nom + " " + court(id) + " " + (LIEUX[id].ville || "")).includes(nq)).length;
  if (nj) L.push(`<a href="#journal?q=${enc}">${nj} au journal</a>`);
  if (na) L.push(`<a href="#artistes?q=${enc}">${plural(na, "artiste")}</a>`);
  if (nl) L.push(`<a href="#lieux?q=${enc}">${plural(nl, "lieu", "lieux")}</a>`);
  el.hidden = !L.length; el.innerHTML = L.length ? "Aussi : " + L.join(" · ") : "";
}
const sortKey = (e) => { const p = span(e); return p ? (running(e) ? +p[1] - 1e13 : +p[0]) : 9e15; };
function groupOf(e) {
  const p = span(e); if (!p) return "Dates à préciser";
  if (p[0] <= TODAY) return "En ce moment";
  return cap(MOIS_L[p[0].getMonth()]) + " " + p[0].getFullYear();
}
const monthCursor = (f) => { if (f.jour) { const d = D(f.jour); return new Date(d.getFullYear(), d.getMonth(), 1); } if (f.mois) { const [y, m] = f.mois.split("-").map(Number); return new Date(y, m - 1, 1); } return new Date(TODAY.getFullYear(), TODAY.getMonth(), 1); };
function monthHTML(f) {
  const c = monthCursor(f), y = c.getFullYear(), m = c.getMonth();
  const base = LIVE.filter((e) => matchA(e, f, true));
  const prem = new Set(), offs = new Set();
  base.forEach((e) => { if (e.note >= 3 && e.debut) prem.add(e.debut); (e.offres || []).forEach((o) => o.date && offs.add(o.date)); });
  return `<div class="cal"><div class="calh"><button class="btn ico" type="button" data-mnav="-1" aria-label="Mois précédent">${ico("prec")}</button><h2>${MOIS_L[m]} ${y}</h2><button class="btn ico" type="button" data-mnav="1" aria-label="Mois suivant">${ico("suiv")}</button></div>` +
    monthGrid(y, m, (d) => {
      const k = iso(d), busy = BUSY.has(k), n = base.filter((e) => e.note >= 3 && playsOn(e, d)).length;
      return `<button type="button" class="cell${busy ? " busy" : ""}${+d === +TODAY ? " today" : ""}${d < TODAY ? " past" : ""}${offs.has(k) ? " of" : ""}" data-day="${k}" aria-pressed="${f.jour === k}"><span class="n">${d.getDate()}</span><span class="vh"> ${MOIS[m]}${busy ? `, ${OWNER} pris` : ""}, </span>${n ? `<span class="nb">${n}</span><span class="vh"> ${n > 1 ? "sorties" : "sortie"} notées 3 ou plus</span>` : ""}${prem.has(k) ? '<span class="vh">, une première</span>' : ""}${offs.has(k) ? '<span class="vh">, une offre jeune</span>' : ""}</button>`;
    }) + `<div class="legend"><span class="l-nb">Chiffre : notées 3 et +</span><span class="l-pris">Pris</span><span class="l-offre">Offre jeune</span></div></div>`;
}

/* ---------- Fiche ---------- */
let SHEET_FROM = null, FROM_APP = false;
// Barre Factotum en tête de la fiche (aussi quand on arrive par un lien partagé) : retour à l’accueil.
const marqueFiche = () => `<a class="sh-marque" href="#${ACCUEIL}" aria-label="${NOM}, accueil"><span class="logo">${cleF()}Factotum</span>${EXPO ? '<span class="mention">Expo</span>' : ""}</a>`;
async function openSheet(id) {
  let e = BYID.get(id);
  if (!e) { try { await loadJournal(); } catch (_) {} e = BYID.get(id); }
  // Une sortie de l’autre site s’ouvre chez lui (les liens partagés tiennent, l’en-tête dit où l’on est).
  if (e && !duSite(e)) { location.replace(urlSortie(id)); return; }
  const box = $("#sheetIn");
  box.className = "sheet-in" + (e ? " g-" + famE(e) : "");
  if (!e) {
    box.innerHTML = `${marqueFiche()}<div class="shtop"><button class="btn ico" type="button" data-close aria-label="Fermer">${ico("fermer")}</button><span class="k"></span></div><h2 id="sheetT" class="mh">Sortie introuvable</h2><p class="empty">Cette fiche n’existe plus ou a changé d’adresse.</p>`;
  } else {
    const vu = e.statut === "vu", L = lieu(e), c = creditsHTML(e);
    box.innerHTML = `${marqueFiche()}<div class="shtop"><button class="btn ico" type="button" data-close aria-label="Fermer">${ico("fermer")}</button><span class="k">${esc([e.categorie, e.sousGenre].filter(Boolean).join(" · "))}${L.nom ? " · " + esc(court(e.lieuId)) : ""}</span><button class="btn ico" type="button" data-share="${esc(e.id)}" aria-label="Partager">${ico("partager")}</button></div>
    <div class="shh"><span class="meta">${esc(vu ? "Vu le " + (e.vuLe || []).map((d) => fmtY(D(d), true)).join(", ") : range(e))}</span><div class="tit">${genreIco(e, "g")}<h2 id="sheetT" class="nom">${esc(e.titre)}</h2></div>
      <div class="ligne">${!vu && e.note ? stars(e.note, e.pronostic) : ""}${vu && e.noteLeonard ? stars(e.noteLeonard, false, "Ma note") : ""}${badges(e)}</div></div>
    ${vu ? `${PRIVE && ADMIN ? ADMIN.ficheHTML(e) : ""}${c ? `<p class="cr">${c}</p>` : ""}<dl class="dl"><dt>Ma note</dt><dd>${e.noteLeonard ? stars(e.noteLeonard, false, "Ma note") : "pas de note"}</dd>${e.note ? `<dt>Grille</dt><dd>${stars(e.note, false, "Note de la grille")}</dd>` : ""}</dl>${e.avis ? `<blockquote>${esc(e.avis)}</blockquote>` : ""}${e.pourquoi ? `<p class="why">${esc(e.pourquoi)}</p>` : ""}${actsHTML(e, false, PRIVE && ADMIN ? ADMIN.ficheActs(e) : "")}` : ficheCorps(e, true)}`;
  }
  const s = $("#sheet");
  if (s.hidden) { SHEET_FROM = document.activeElement; s.hidden = false; document.documentElement.style.overflow = "hidden"; }
  box.scrollTop = 0; box.focus();
  document.title = (e ? e.titre + " – " : "") + NOM;
}
function closeSheet() {
  const s = $("#sheet"); if (s.hidden) return;
  s.hidden = true; document.documentElement.style.overflow = ""; document.title = TITRE_VUE || NOM;
  if (SHEET_FROM && document.contains(SHEET_FROM)) SHEET_FROM.focus({ preventScroll: true });
}
function requestClose() {
  if (FROM_APP) history.back();
  else { history.replaceState(null, "", "#" + (BASE || ACCUEIL)); route(); }
}
$("#sheet").addEventListener("click", (ev) => { if (ev.target.id === "sheet" || ev.target.closest("[data-close]")) requestClose(); });
document.addEventListener("keydown", (ev) => {
  if ($("#sheet").hidden) return;
  if (ev.key === "Escape") { ev.preventDefault(); requestClose(); }
  if (ev.key === "Tab") {
    const f = $$('a[href],button:not([disabled]),input,select,[tabindex="0"]', $("#sheetIn")).filter((x) => x.offsetParent);
    if (!f.length) return;
    if (ev.shiftKey && (document.activeElement === f[0] || document.activeElement === $("#sheetIn"))) { ev.preventDefault(); f.at(-1).focus(); }
    else if (!ev.shiftKey && document.activeElement === f.at(-1)) { ev.preventDefault(); f[0].focus(); }
  }
});

/* ---------- Radar : ce qu’il faut faire maintenant (accueil) ---------- */
// Cette semaine : ventes qui ouvrent sous 7 jours. À réserver : notées 4 (barème de la veille), pas encore réservées.
// Dernières chances : notées 3 et plus, dernière date sous 21 jours. Une sortie n’apparaît qu’une fois dans ces blocs.
const R_SEMAINE = 7, R_FIN = 21;
const reservee = (e) => e.leonardYVa || !!(PRIVE && PRIVE.reservations && PRIVE.reservations[e.id]);
const finDe = (e) => { const p = span(e); return p ? p[1] : null; };
function soirsLibres(e) {
  const p = span(e); if (!p) return null;
  let n = 0; for (let d = new Date(Math.max(+p[0], +TODAY)), i = 0; d <= p[1] && i < 400; d = add(d, 1), i++) if (playsOn(e, d) && !BUSY.has(iso(d))) n++;
  return n;
}
function radar() {
  const lim = add(TODAY, R_SEMAINE + 1), finLim = add(TODAY, R_FIN);
  const vivantes = LIVE.filter((e) => !reservee(e) && soirsLibres(e) !== 0); // aucune sortie dont tous les soirs restants sont pris
  const semaine = [], suite = [];
  vivantes.forEach((e) => ouvertures(e).forEach((o) => (venteDate(o) < lim ? semaine : suite).push({ e, o, v: venteDate(o) })));
  const parVente = (a, b) => a.v - b.v || b.e.note - a.e.note || a.e.titre.localeCompare(b.e.titre, "fr");
  semaine.sort(parVente); suite.sort(parVente);
  // Rang d’urgence : 0 vente sous 7 jours, 1 fin sous 21 jours, 2 en vente, 3 ouverture plus lointaine, 4 complet.
  const aReserver = vivantes.filter((e) => e.note === 4).map((e) => {
    const o = ouvertures(e)[0], f = finDe(e);
    let rang, cle;
    if (e.etat === "complet") { rang = 4; cle = f ? +f : 9e15; }
    else if (o && venteDate(o) < lim) { rang = 0; cle = +venteDate(o); }
    else if (f && f < finLim) { rang = 1; cle = +f; }
    else if (!o) { rang = 2; cle = f ? +f : 9e15; }
    else { rang = 3; cle = +venteDate(o); }
    return { e, o, rang, cle };
  }).sort((a, b) => a.rang - b.rang || a.cle - b.cle || a.e.titre.localeCompare(b.e.titre, "fr"));
  const deja = new Set(aReserver.map((x) => x.e.id));
  const chances = vivantes.filter((e) => e.note >= 3 && !deja.has(e.id) && finDe(e) && finDe(e) < finLim).sort((a, b) => finDe(a) - finDe(b) || b.note - a.note || a.titre.localeCompare(b.titre, "fr"));
  return { semaine, suite, aReserver, chances };
}
// Rubriques expo du Radar : « Nouvelles expos » (fiches ajoutées depuis 14 jours) et « Derniers jours » (fermeture sous 14 jours).
function radarExpos() {
  const X = AFF.filter((e) => estExpo(e) && e.statut === "a-voir" && !ended(e));
  const parNote = (a, b) => b.note - a.note || a.titre.localeCompare(b.titre, "fr");
  return { nouvelles: X.filter(expoNeuve).sort(parNote), derniers: X.filter((e) => expoEtat(e) === "derniers").sort((a, b) => finDe(a) - finDe(b) || parNote(a, b)) };
}
// Radar de Factotum : un encadré aux couleurs de Factotum Expo (les expositions n’y sont pas listées).
function pubExpo() {
  const x = radarExpos(), n = AFF.filter((e) => estExpo(e) && e.statut === "a-voir" && !ended(e) && running(e)).length;
  const t = [n ? plural(n, "exposition") + " en cours" : "", x.nouvelles.length ? plural(x.nouvelles.length, "nouvelle", "nouvelles") : "", x.derniers.length ? x.derniers.length + " en derniers jours" : ""].filter(Boolean).join(" · ");
  return `<a class="pub-expo" data-site="expo" href="expo/#a-voir" id="r-expos"><span class="pe-l"><span class="logo">${cleF()}Factotum</span><span class="mention">Expo</span></span><span class="pe-t">Musées, fondations et galeries de Paris : les expositions notées, à voir avant qu’elles ferment.</span>${t ? `<span class="pe-n">${esc(t)}</span>` : ""}<span class="pe-c">Voir les expos</span></a>`;
}
const heureV = (o) => { const h = /T(\d\d):(\d\d)/.exec(o.vente); return h ? (+h[1]) + "h" + (h[2] !== "00" ? h[2] : "") : ""; };
// Aperçus : libellés courts (« Ouverture des ventes hors abonnement » → « Hors abonnement », « Nés après le 1er janvier 1998, 2 places max. » → « –28 ans »).
const typeCourt = (t) => { const r = String(t || "").replace(/^ouverture des ventes\s*/i, "").trim(); return r ? cap(r) : "Vente"; };
function condCourte(c) {
  let t = String(c || "")
    .replace(/n[ée]e?s?\s+(?:après|à partir)\s+(?:du\s+|le\s+)?(?:1er\s+)?(?:janvier\s+)?(\d{4})/gi, (_, y) => "–" + (TODAY.getFullYear() - +y) + " ans")
    .replace(/moins de (\d+) ans/gi, "–$1 ans")
    .replace(/,?\s*sur justificatifs?/gi, "")
    .replace(/,?\s*\d+\s*places?\s*max(?:imum)?\.?/gi, "")
    .replace(/\s+/g, " ").replace(/^[\s,;.·]+|[\s,;.·]+$/g, "");
  return t ? cap(t) : "";
}
const offreTxt = (o) => esc(typeCourt(o.type)) + (o.tarif ? ", " + esc(o.tarif) : "");
// Info d’une ouverture : « Vente 12h · Avant-première jeunes, 10 € · –28 ans ».
const venteInfo = (o) => { const hv = heureV(o), c = condCourte(o.condition); return [`<b>Vente${hv ? " " + hv : ""}</b>`, o.venteApprox ? "date estimée" : "", typeCourt(o.type) === "Vente" && !o.tarif ? "" : offreTxt(o), c && c !== typeCourt(o.type) ? `<span class="cr">${esc(c)}</span>` : ""].filter(Boolean).join(" · "); };
// Dates de jeu courtes : « 16–24 avr. », « 26 et 27 mars », « 24 févr.–7 mars ».
function joueCourt(e) {
  const p = span(e); if (!p) return "";
  if (+p[0] === +p[1]) return fmt(p[0]);
  const meme = p[0].getMonth() === p[1].getMonth() && p[0].getFullYear() === p[1].getFullYear(), deux = nbJoues(e) === 2;
  return meme ? p[0].getDate() + (deux ? " et " : "–") + fmt(p[1]) : fmt(p[0]) + (deux ? " et " : "–") + fmt(p[1]);
}
const libresTxt = (e) => { const n = soirsLibres(e); return n == null ? "" : n ? plural(n, "soir libre", "soirs libres") : `<b class="warn">aucun soir libre</b>`; };
const stubR = (lbl, d, urg) => `<span class="stub"><small class="fin${urg ? " urg" : ""}">${lbl}</small><b>${d.getDate()}</b><small>${MOIS[d.getMonth()]}</small></span>`;
function rowR(e, pre, stub, info, jeu) {
  const k = esc(pre + "-" + e.id), meta = [sousG(e), court(e.lieuId), jeu ? joueCourt(e) : ""].filter(Boolean).join(" · ");
  return `<article class="row g-${famE(e)}" data-id="${esc(e.id)}"><button class="rb" type="button" aria-expanded="false" aria-controls="d-${k}">${gb(e)}${stub}
  <span class="mid">${l1(e, stars(e.note, e.pronostic))}${info ? `<span class="art">${info}</span>` : ""}${ligneMeta(esc(meta), badges(e).replace('<span class="b">Dernières dates</span>', "").replace('<span class="bds"></span>', ""))}</span></button>${PRIVE && ADMIN ? ADMIN.heart(e.id) : ""}<div class="det" id="d-${k}" hidden></div></article>`;
}
function infoReserver({ e, o, rang }) {
  const f = finDe(e), li = libresTxt(e);
  if (rang === 4) return [`<b class="warn">Complet</b> : guetter les reventes et la liste d’attente`, f ? "jusqu’au " + fmt(f) : ""].filter(Boolean).join(" · ");
  if (rang === 0 || rang === 3) return [`Vente ${o.venteApprox ? "vers le " : "le "}${esc(venteTxt(o).replace(/^~ /, ""))}${rang === 0 ? ` <b class="warn">(${jTxt(dansJ(venteDate(o)))})</b>` : ""}`, offreTxt(o), li].filter(Boolean).join(" · ");
  if (rang === 1) return [`<b class="warn">Dernières dates</b>, jusqu’au ${fmt(f, true)}`, li].filter(Boolean).join(" · ");
  return ["En vente" + (f ? ", jusqu’au " + fmt(f) : ""), li].filter(Boolean).join(" · ");
}
function stubReserver({ e, o, rang }) {
  const f = finDe(e);
  if ((rang === 0 || rang === 3) && o) { const v = venteDate(o); return stubR(rang === 0 ? jTxt(dansJ(v)) : "vente", v, rang === 0 && dansJ(v) <= 2); }
  if (f && (rang === 1 || running(e))) return stubR("fin", f, rang === 1 && dansJ(f) <= 7);
  return stubHTML(e);
}
// Une journée = un bandeau ; la vente du jour même est en tête.
function blocSemaine(r) {
  if (!r.semaine.length) return `<p class="empty">Aucune ouverture de vente connue dans les 7 jours.</p>`;
  let h = "", last = "";
  for (const { e, o, v } of r.semaine) {
    const k = iso(v), n = dansJ(v);
    if (k !== last) { h += `<h3 class="jour">${n === 0 ? "Aujourd’hui" : n === 1 ? "Demain" : cap(fmt(v, true))} <small>${plural(r.semaine.filter((x) => iso(x.v) === k).length, "ouverture")}</small></h3>`; last = k; }
    h += rowR(e, "s", stubR(jTxt(n), v, n <= 2), venteInfo(o), true);
  }
  return `<div class="list">${h}</div>`;
}
let RF = "tout"; // filtre des ouvertures suivantes (mémoire seulement)
const suivie = (e) => e.note === 4 || enviesIds().has(e.id);
// « Plus tard » : jusqu’à la fin du deuxième mois suivant ; la suite sur la page des ouvertures.
const LIM_SUITE = () => new Date(TODAY.getFullYear(), TODAY.getMonth() + 3, 1);
function blocSuite(r) {
  const T = RF === "tout" ? r.suite : r.suite.filter((x) => suivie(x.e)), L = T.filter((x) => x.v < LIM_SUITE()), reste = T.length - L.length;
  let h = "", last = "";
  for (const { e, o, v } of L) {
    const m = v.getFullYear() * 12 + v.getMonth();
    if (m !== last) { h += `<li class="vm">${cap(MOIS_L[v.getMonth()])} ${v.getFullYear()}</li>`; last = m; }
    h += apercu(e, venteTxt(o), offreTxt(o));
  }
  if (reste) h += `<li class="vm vr">Puis ${plural(reste, "ouverture")}</li>`;
  return h ? `<ul class="vl">${h}</ul>` : `<p class="empty">${RF === "tout" ? "Aucune autre ouverture connue." : "Aucune ouverture suivie plus tard : essaie « Toutes »."}</p>`;
}
function renderRadar() {
  const r = radar(), adm = PRIVE && ADMIN;
  const nC = adm ? (PRIVE.aCompleter || []).length : 0;
  const go = (id, n, t) => `<button class="chip" type="button" data-rgo="${id}">${(n + " " + t).trim()}</button>`;
  const nSuivies = r.suite.filter((x) => suivie(x.e)).length;
  $("#main").innerHTML = `<section id="radar"><h1 class="vh">Radar</h1>
  <nav class="r-res" aria-label="Accès du radar"><a class="chip" href="#ventes">${ico("ventes")}Ventes</a><a class="chip" href="#coeur">${COEUR}Coups de cœur</a>${go("r-reserver", "", "Incontournables")}${go("r-liens", "", "Billetteries")}</nav>
  ${nC ? `<div class="msg">${plural(nC, "billet")} à compléter <a href="#admin?v=rapide">Traiter</a></div>` : ""}
  <div class="r-g"><div class="r-col">${rapportEnTete()}
    <section class="r-b r-reserver" id="r-reserver"><h2 class="mh">Incontournables à réserver <small>${r.aReserver.length}</small></h2>
      ${r.aReserver.length ? `<div class="list">${r.aReserver.map((x) => rowR(x.e, "r", stubReserver(x), infoReserver(x))).join("")}</div>` : `<p class="empty">Tous les incontournables sont réservés.</p>`}</section>
    <section class="r-b r-chances" id="r-chances"><h2 class="mh">Dernières chances <small>notées 3 et +</small></h2>
      ${r.chances.length ? `<div class="list">${r.chances.map((e) => rowR(e, "c", stubR("fin", finDe(e), dansJ(finDe(e)) <= 7), [`Jusqu’au ${fmt(finDe(e), true)}`, libresTxt(e)].filter(Boolean).join(" · "))).join("")}</div>` : `<p class="empty">Rien de noté 3 ou plus ne s’arrête dans les ${R_FIN} jours.</p>`}</section>
  </div><div class="r-col r-lat2${r.semaine.length ? "" : " calme"}">
    <h2 class="mh">Prochaines ouvertures de vente</h2>
    <section class="r-b r-semaine" id="r-semaine"><h3 class="sec">Cette semaine</h3>${blocSemaine(r)}</section>
    <section class="r-b r-suite" id="r-suite"><h3 class="sec">Plus tard</h3>
      <div class="seg" role="group" aria-label="Ouvertures affichées"><button type="button" data-rf="tout" aria-pressed="${RF === "tout"}">Toutes (${r.suite.length})</button><button type="button" data-rf="suivies" aria-pressed="${RF === "suivies"}" title="Notées 4 ou coups de cœur">Suivies (${nSuivies})</button></div>
      <div id="rSuite">${blocSuite(r)}</div>
      <div class="acts"><a class="btn pri" href="#ventes">${ico("ventes")}Toutes les ouvertures de vente</a></div></section>
    ${EXPO ? "" : pubExpo()}
  </div></div>
  <section class="r-b" id="r-liens"><h2 class="mh">Billetteries et calendriers de vente</h2>${LIENS ? liensHTML() : '<p class="empty">Liens indisponibles hors connexion.</p>'}</section>
  ${PRIVE ? `<h2 class="mh">Abonnements (admin)</h2>${subsHTML()}` : ""}</section>`;
  const m = $("#radar");
  m.querySelector(".r-res").onclick = (ev) => { const b = ev.target.closest("[data-rgo]"); if (b) document.getElementById(b.dataset.rgo).scrollIntoView({ block: "start" }); };
  m.querySelector("#r-suite .seg").onclick = (ev) => {
    const b = ev.target.closest("[data-rf]"); if (!b) return;
    RF = b.dataset.rf; $$("#r-suite [data-rf]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.rf === RF))); $("#rSuite").innerHTML = blocSuite(r);
  };
  if (LIENS) brancherLiensRecherche();
}
// Affiche : une ligne vers le Radar (mobile) et une colonne latérale (bureau).
function radarLigne(r) {
  const t = [r.semaine.length ? plural(r.semaine.length, "vente") + " cette semaine" : "", r.aReserver.length ? r.aReserver.length + " à réserver" : "", r.chances.length ? plural(r.chances.length, "dernière chance", "dernières chances") : ""].filter(Boolean).join(" · ");
  return `<a class="r-ligne" href="#radar">${ico("ventes")}<b>Radar</b> <span>${t || "rien d’urgent"}</span></a>`;
}
// Colonne de droite de l’Affiche : les envies (à la place de « À réserver »), avec un lien vers la page de toutes les envies.
// Partager la page affichée (Coups de cœur, rapports, ouvertures, artiste, lieu) : le lien seul.
const partagerBtn = () => `<button class="btn ico ph-share" type="button" data-partage aria-label="Partager cette page" title="Partager cette page">${ico("partager")}</button>`;
// Aperçu court d’une sortie (colonnes latérales, Plus tard, rapports) : trait de la couleur du genre, date, titre, précision, note.
function apercu(e, date, sub, titre) {
  const t = titre || (e ? e.titre : ""), c = `<span class="vd">${esc(date || "")}</span><span class="vt"><b>${esc(t)}</b>${sub ? ` <span>· ${sub}</span>` : ""}</span>${e && e.note ? stars(e.note, e.pronostic) : ""}`;
  return `<li class="ap${e ? " g-" + famE(e) : ""}">${e && BYID.has(e.id) ? `<a href="#sortie-${esc(e.id)}">${c}</a>` : `<div class="ap-s">${c}</div>`}</li>`;
}
const dateAp = (e) => { const p = span(e); return !p ? "à venir" : running(e) ? "fin " + fmt(p[1]) : fmt(p[0]); };
function envLat() {
  // Les coups de cœur pas encore réservés (le texte d’introduction le dit).
  const E = enviesIds(), L = LIVE.filter((e) => E.has(e.id) && !reservee(e)).sort((a, b) => sortKey(a) - sortKey(b) || a.titre.localeCompare(b.titre, "fr"));
  const li = L.slice(0, 6).map((e) => apercu(e, dateAp(e), esc(court(e.lieuId)))).join(""), autres = L.length - Math.min(L.length, 6);
  return `<h2 class="mh">Coups de cœur <small>${L.length}</small></h2><p class="cr lat-intro">Les pièces que j’aimerais aller voir et que je n’ai pas encore réservées.</p>${li ? `<ul class="vl">${li}</ul>` : '<p class="cr">Aucun coup de cœur pour le moment.</p>'}${autres ? `<p class="lat-plus"><a href="#coeur">Et ${autres > 1 ? autres + " autres" : "une autre"}, à voir sur la page des coups de cœur</a></p>` : ""}
  <div class="acts"><a class="btn pri" href="#coeur">${COEUR}Découvre tous mes coups de cœur ici</a></div>`;
}
// Colonne de droite de l’Affiche (bureau) : les coups de cœur seulement (« Cette semaine » reste sur la page Radar).
function radarLateral() {
  return `<aside class="r-lat" aria-label="Coups de cœur de ${OWNER}">${envLat()}</aside>`;
}
// Bandeau mobile de l’Affiche vers les coups de cœur.
function coeurLigne() {
  const E = enviesIds(), n = LIVE.filter((e) => E.has(e.id)).length;
  return `<a class="r-ligne c-ligne" href="#coeur">${COEUR}<b>Coups de cœur de ${OWNER}</b> <span>${n ? plural(n, "sortie") : "aucun pour le moment"}</span><span class="cta" aria-hidden="true">Voir</span></a>`;
}

/* ---------- Rapports de veille (#rapports, #rapport-<id>, en tête du Radar) ---------- */
// Chaque veille publie un rapport daté dans data/radar.json : { id, date, domaine, titre, chapo, sections:[{ titre, texte:[…], lignes:[{ id, titre, texte }] }], bilan }.
// Public : aucune donnée privée. Flux Atom généré par build.mjs (data/radar.atom).
const DOMAINES = { complete: "Veille complète", spectacles: "Spectacles", concerts: "Concerts", expo: "Expositions", ventes: "Ventes" };
const rapportMeta = (r) => [cap(fmtY(D(r.date), true)), DOMAINES[r.domaine] || "", r.bilan && r.bilan.ajoutees ? plural(r.bilan.ajoutees, "fiche ajoutée", "fiches ajoutées") : ""].filter(Boolean).map(esc).join(" · ");
const rapportLiens = () => `<div class="acts"><a class="btn" href="#rapports">Tous les rapports</a><a class="btn" href="${RACINE}data/radar.atom" type="application/atom+xml">Flux Atom</a></div>`;
function rapportEnTete() {
  const r = (RAPPORTS || [])[0]; if (!r) return "";
  return `<section class="r-b rp" id="r-rapport"><h2 class="mh">Dernière veille <small>${esc(fmt(D(r.date)))}</small></h2>
  <p class="rp-chapo"><a href="#rapport-${esc(r.id)}">${esc(r.titre)}</a></p>${r.chapo ? `<p>${esc(r.chapo)}</p>` : ""}
  <div class="acts"><a class="btn" href="#rapports">Tous les rapports de veille</a></div></section>`;
}
function rapportHTML(r) {
  const ligne = (l) => { const e = l.id ? BYID.get(l.id) : null; return apercu(e, e ? dateAp(e) : "", l.texte ? esc(l.texte) : "", l.titre || (e && e.titre)); };
  return (r.sections || []).map((s) => {
    const L = s.lignes || [], T = s.texte || [], expo = !EXPO && /^expo/i.test(s.titre || "") || (L.length && L.every((l) => { const e = BYID.get(l.id); return e && estExpo(e); }));
    const fiches = L.length ? `<aside class="rp-a" aria-label="Fiches citées"><ul class="vl">${L.map(ligne).join("")}</ul></aside>` : "";
    // Expositions : aux couleurs de Factotum Expo (data-site), les fiches seules, puis l’encadré vers le site Expo.
    if (expo) return `<section class="rp-s rp-x" data-site="expo"><h2 class="mh">${esc(s.titre || "Expositions")}<span class="mention">Expo</span></h2>${fiches}${EXPO ? "" : pubExpo()}</section>`;
    const cls = !T.length ? " sans-texte" : L.length ? " a-lignes" : "";
    return `<section class="rp-s${cls}"><h2 class="mh">${esc(s.titre || "")}</h2>${T.length ? `<div class="rp-t">${T.map((p) => `<p>${esc(p)}</p>`).join("")}</div>` : ""}${fiches}</section>`;
  }).join("");
}
function renderRapport(id) {
  const r = (RAPPORTS || []).find((x) => x.id === id);
  if (!r) { $("#main").innerHTML = `<div class="ph"><h1>Rapport introuvable</h1></div><p class="empty">Ce rapport n’existe pas ou n’est pas disponible hors connexion.</p>${rapportLiens()}`; return; }
  document.title = TITRE_VUE = r.titre + " – " + NOM;
  $("#main").innerHTML = `<article class="rp"><div class="ph">${partagerBtn()}<h1>${esc(r.titre)}</h1><p>${rapportMeta(r)}</p></div>
  ${r.chapo ? `<p class="rp-chapo">${esc(r.chapo)}</p>` : ""}${rapportHTML(r)}
  <div class="acts rp-fin">${LIVE.some((e) => estNeuf(e) && duSite(e)) ? `<a class="btn pri" href="#${ACCUEIL}?neuf">Toutes les nouveautés (${LIVE.filter((e) => estNeuf(e) && duSite(e)).length})</a>` : ""}<a class="btn" href="#rapports">Tous les rapports</a><a class="btn" href="${RACINE}data/radar.atom" type="application/atom+xml">Flux Atom</a></div></article>`;
}
function renderRapports() {
  const L = RAPPORTS || [];
  $("#main").innerHTML = `<div class="ph">${partagerBtn()}<h1>Rapports de veille</h1></div>
  ${L.length ? `<ul class="lk">${L.map((r) => `<li><a href="#rapport-${esc(r.id)}"><span class="lt"><b>${esc(r.titre)}</b><small>${rapportMeta(r)}</small></span></a></li>`).join("")}</ul>` : `<p class="empty">Aucun rapport pour l’instant.</p>`}
  <div class="acts"><a class="btn" href="#radar">Radar</a><a class="btn" href="${RACINE}data/radar.atom" type="application/atom+xml">Flux Atom</a></div>`;
}

/* ---------- Ouvertures de vente : toutes les ouvertures à venir (#ventes, depuis le Radar) ---------- */
// Une ligne par ouverture (une sortie peut revenir pour plusieurs offres), bandeau par jour, filtres en mémoire.
const VF = { q: "", cat: new Set() };
function ventesToutes() {
  const L = [];
  LIVE.forEach((e) => ouvertures(e).forEach((o) => L.push({ e, o, v: venteDate(o) })));
  return L.sort((a, b) => a.v - b.v || b.e.note - a.e.note || a.e.titre.localeCompare(b.e.titre, "fr"));
}
// Groupe de lignes : titre en métadonnées sur filet, lignes en deux colonnes sur bureau (Ouvertures, Coups de cœur, Artiste, Lieu).
const groupeHTML = (t, n, rows) => `<section class="v-g"><h2 class="v-t">${t} <small>${n}</small></h2><div class="list v-l">${rows}</div></section>`;
function groupesPar(items, cle, row) {
  const G = []; for (const e of items) { const k = cle(e); if (!G.length || G.at(-1).k !== k) G.push({ k, L: [] }); G.at(-1).L.push(e); }
  return G.map((g) => groupeHTML(esc(g.k), g.L.length, g.L.map(row).join(""))).join("");
}
// Puces de genre des pages en groupes (Coups de cœur, Artiste, Lieu) : filtrent les lignes déjà affichées, groupes vides masqués.
function genresHTML(items) {
  const cats = CATS.filter((c) => items.some((e) => e.categorie === c)); if (cats.length < 2) return "";
  return `<div class="fbar fg"><div class="chips defile gtabs" role="group" aria-label="Genres">${cats.map((c) => `<button class="chip g-${famille(c)}" type="button" data-fg="${slug(c)}" aria-pressed="false" aria-label="${esc(c)}">${ico(c)}${esc(GENRE_PUCE[c] || c)}</button>`).join("")}</div></div>`;
}
function brancherGenres(root, init, quand) {
  const sel = new Set(init || []);
  const app = () => {
    root.querySelectorAll("[data-fg]").forEach((b) => b.setAttribute("aria-pressed", String(sel.has(b.dataset.fg))));
    root.querySelectorAll(".v-g").forEach((g) => {
      let n = 0;
      g.querySelectorAll(":scope>.v-l>.row").forEach((r) => { const e = BYID.get(r.dataset.id), ok = !sel.size || (e && sel.has(slug(e.categorie))); r.hidden = !ok; if (ok) n++; });
      g.hidden = !n; const sm = g.querySelector(".v-t small"); if (sm) sm.textContent = n;
    });
    if (quand) quand(sel);
  };
  root.addEventListener("click", (ev) => { const b = ev.target.closest("[data-fg]"); if (!b) return; const v = b.dataset.fg; sel.has(v) ? sel.delete(v) : sel.add(v); app(); });
  if (sel.size) app();
}
function listeVentes(T) {
  const q = norm(VF.q).trim();
  const L = T.filter(({ e }) => (RF === "tout" || suivie(e)) && (!VF.cat.size || VF.cat.has(slug(e.categorie)))
    && (!q || norm([e.titre, court(e.lieuId), e.categorie, e.sousGenre || "", ...(e.artistes || []).map((a) => a.nom)].join(" ")).includes(q)));
  const G = [];
  for (const x of L) {
    const n = dansJ(x.v), k = n <= R_SEMAINE ? "s" : iso(x.v).slice(0, 7);
    if (!G.length || G.at(-1).k !== k) G.push({ k, t: k === "s" ? "Cette semaine" : cap(MOIS_L[x.v.getMonth()]) + " " + x.v.getFullYear(), L: [] });
    G.at(-1).L.push(x);
  }
  const h = G.map((g) => groupeHTML(g.t, g.L.length, g.L.map(({ e, o, v }) => {
    const n = dansJ(v);
    return rowR(e, "v" + iso(v), stubR(n <= R_SEMAINE ? jTxt(n) : JOURS[v.getDay()], v, n <= 2), venteInfo(o), true);
  }).join(""))).join("");
  return h || `<p class="empty">${RF === "tout" ? "Aucune ouverture ne correspond." : "Aucune ouverture suivie ne correspond : essaie « Toutes »."}</p>`;
}
const serV = () => [VF.q.trim() ? "q=" + encodeURIComponent(VF.q.trim()) : "", VF.cat.size ? "cat=" + [...VF.cat].join(",") : "", RF === "suivies" ? "rf=suivies" : ""].filter(Boolean).join("&");
function renderVentes(q0) {
  const p0 = new URLSearchParams(q0 || "");
  if ([...p0.keys()].length) { VF.q = p0.get("q") || ""; VF.cat = new Set((p0.get("cat") || "").split(",").filter(Boolean)); RF = p0.get("rf") === "suivies" ? "suivies" : "tout"; }
  const T = ventesToutes(), cats = CATS.filter((c) => T.some((x) => x.e.categorie === c));
  const nS = T.filter((x) => suivie(x.e)).length;
  $("#main").innerHTML = `<section id="pv"><div class="ph">${partagerBtn()}<h1>Ouvertures de vente</h1></div>
  <div class="tools barre-f">${rech("vq", "Rechercher une ouverture", VF.q)}</div>
  <div class="fbar v-fbar"><div class="seg" role="group" aria-label="Ouvertures affichées"><button type="button" data-rf="tout" aria-pressed="${RF === "tout"}">Toutes ${T.length}</button><button type="button" data-rf="suivies" aria-pressed="${RF === "suivies"}" title="Notées 4 ou coups de cœur">Suivies ${nS}</button></div><div class="chips defile gtabs" role="group" aria-label="Genres">${cats.map((c) => `<button class="chip g-${famille(c)}" type="button" data-vc="${slug(c)}" aria-pressed="${VF.cat.has(slug(c))}">${ico(c)}${esc(c)}</button>`).join("")}</div></div>
  <div id="vListe">${listeVentes(T)}</div>
  ${PRIVE ? `<h2 class="mh">Abonnement aux ouvertures (admin)</h2>${subsHTML()}` : ""}</section>`;
  const m = $("#pv"), maj = () => { $("#vListe").innerHTML = listeVentes(T); const s = serV(); history.replaceState(null, "", "#ventes" + (s ? "?" + s : "")); BASE = RENDERED = location.hash.slice(1); };
  m.querySelector(".seg").onclick = (ev) => {
    const b = ev.target.closest("[data-rf]"); if (!b) return;
    RF = b.dataset.rf; m.querySelectorAll("[data-rf]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.rf === RF))); maj();
  };
  m.querySelector(".fbar").onclick = (ev) => {
    const b = ev.target.closest("[data-vc]"); if (!b) return;
    const v = b.dataset.vc; VF.cat.has(v) ? VF.cat.delete(v) : VF.cat.add(v); b.setAttribute("aria-pressed", String(VF.cat.has(v))); maj();
  };
  $("#vq").oninput = (ev) => { VF.q = ev.target.value; maj(); };
}

/* ---------- Plan du site (#plan, lien en pied de page) ---------- */
function renderPlan() {
  const it = (h, t, d) => `<li><a href="#${h}"><span class="lt"><b>${t}</b>${d ? `<small>${d}</small>` : ""}</span></a></li>`;
  const sec = (t, l) => `<section class="lks"><h2 class="mh">${t}</h2><ul class="lk">${l.join("")}</ul></section>`;
  if (EXPO) { $("#main").innerHTML = `<div class="ph"><h1>Plan du site</h1></div>
  ${sec("Expositions", [it("a-voir", "À voir", "Expositions en cours, derniers jours d’abord"), it("bientot", "Bientôt", "Expositions annoncées"), it("coeur", `Coups de cœur de ${esc(OWNER)}`, "")])}
  ${sec("Archive", [it("journal", "Journal", "Expositions vues, par saison"), it("artistes", "Artistes", "Spectacles et expositions"), it("lieux", "Lieux", "")])}
  ${sec("À propos", [`<li><a href="../"><span class="lt"><b>Factotum</b><small>Les spectacles</small></span></a></li>`, it("charte", "Charte graphique", "Nom, symbole, couleurs, typographie, icônes"), ...(PRIVE ? [it("admin", "Admin", "")] : [])])}`; return; }
  $("#main").innerHTML = `<div class="ph"><h1>Plan du site</h1></div>
  ${sec("Saison", [it("affiche", "À l’affiche", "Liste et calendrier, filtres"), it("coeur", `Coups de cœur de ${esc(OWNER)}`, ""),
    it("radar", "Radar", "Cette semaine, à réserver, dernières chances"), it("rapports", "Rapports de veille", "Chroniques datées, flux Atom"), it("ventes", "Ouvertures de vente", "Toutes les ouvertures à venir"), it("liens", "Billetteries", "Cartes jeunes, calendriers de vente")])}
  ${sec("Archive", [it("journal", "Journal", "Sorties vues, par saison"), it("artistes", "Artistes", ""), it("lieux", "Lieux", "")])}
  ${sec("À propos", [`<li><a href="expo/"><span class="lt"><b>Factotum Expo</b><small>Les expositions</small></span></a></li>`, it("charte", "Charte graphique", "Nom, symbole, couleurs, typographie, icônes"), ...(PRIVE ? [it("admin", "Admin", "")] : [])])}`;
}

/* ---------- Journal ---------- */
const saisonCourt = (cle) => saisonDe(new Date(+cle, 9, 1)).court, saisonLib = (cle) => "Saison " + saisonCourt(cle);
let JQ = "", JPANEL = ""; // recherche et panneau ouvert du journal (mémoire seulement)
function renderJournal(q) {
  const p = new URLSearchParams(q || ""), L = (k) => new Set((p.get(k) || "").split(",").filter(Boolean));
  const f = { cat: L("cat"), sa: L("sa"), mn: L("mn"), tri: p.get("tri") === "note" ? "note" : "date" };
  if (p.has("q")) JQ = p.get("q"); else if (RENDERED === null || !RENDERED.startsWith("journal")) JQ = "";
  const all = JOURNAL.filter((e) => (e.vuLe || []).length && duSite(e));
  const last = (e) => e.vuLe.at(-1), sOf = (e) => saisonDe(D(last(e))).cle;
  const saisons = [...new Set(all.map(sOf))].sort().reverse();
  const parSaison = all.filter((e) => !f.sa.size || f.sa.has(sOf(e)));
  const cats = CATS.filter((c) => parSaison.some((e) => e.categorie === c));
  if (!PRIVE || !ADMIN) JAVEC = "";
  const avec = JAVEC ? ADMIN.idsAvec(JAVEC) : null;
  const items = parSaison.filter((e) => (!f.cat.size || f.cat.has(slug(e.categorie))) && (!f.mn.size || f.mn.has(String(e.noteLeonard || 0))) && (!avec || avec.has(e.id)));
  items.sort(f.tri === "note" ? (a, b) => (b.noteLeonard || 0) - (a.noteLeonard || 0) || last(b).localeCompare(last(a)) : (a, b) => last(b).localeCompare(last(a)) || a.titre.localeCompare(b.titre, "fr"));
  const chip = (g, v, t, on = f[g].has(v), lab) => `<a class="chip" href="#journal?${esc(jq(f, g, v))}" data-k="${g}-${esc(v)}" aria-pressed="${on}" role="button"${lab ? ` aria-label="${esc(lab)}"` : ""}>${t}</a>`;
  const draw = () => {
    const vis = JQ.trim() ? items.filter((e) => cherche(e, JQ)) : items;
    let list = "", lastS = "";
    for (const e of vis) {
      const sa = sOf(e);
      if (f.tri === "date" && sa !== lastS) { list += `<h2 class="jour">${saisonLib(sa)}</h2>`; lastS = sa; }
      list += rowJ(e);
    }
    $("#jlist").innerHTML = list || `<p class="empty">Aucune sortie ne correspond${JQ.trim() ? " à « " + esc(JQ.trim()) + " »" : ""}.</p>`;
    $("#jn").textContent = plural(vis.length, "sortie");
  };
  // Barre comme l’Affiche : recherche, « + » (admin), Filtres (saison, ma note, avec) ; genres en puces ; statistiques en colonne sur bureau.
  const nF = f.sa.size + f.mn.size + (JAVEC ? 1 : 0);
  const accSel = PRIVE && ADMIN ? ADMIN.accSelectHTML(JAVEC).replace("<span>Avec (admin)</span>", '<span class="vh">Avec</span>').replace('class="tools"', 'class="j-avec"') : "";
  const libS = f.sa.size === 1 ? saisonLib([...f.sa][0]) : f.sa.size ? plural(f.sa.size, "saison") : "Toutes les saisons";
  const tok = (g, v, t) => `<a class="chip on" href="#journal?${esc(jq(f, g, v))}" aria-label="Retirer le filtre ${esc(t)}">${esc(t)}<span class="x" aria-hidden="true">×</span></a>`;
  const jetons = [...[...f.cat].map((c) => { const C = CATS.find((x) => slug(x) === c) || c; return tok("cat", c, C).replace('class="chip on"', `class="chip on g-${famille(C)}"`); }), ...[...f.sa].map((y) => tok("sa", y, saisonLib(y))), ...[...f.mn].map((n) => tok("mn", n, n === "0" ? "Sans note" : "Ma note " + n)), JAVEC ? `<button class="chip on" type="button" data-jclr aria-label="Retirer le filtre avec ${esc(JAVEC)}">Avec ${esc(JAVEC)}<span class="x" aria-hidden="true">×</span></button>` : ""].join("");
  const stats = statsHTML(parSaison, !f.sa.size);
  $("#main").innerHTML = `<div class="aff-g j-g"><section id="jr"><div class="ph"><h1>Journal</h1></div>
  <div class="tools barre-f">${rech("jq", "Rechercher dans le journal", JQ)}
    ${PRIVE && ADMIN ? `<button class="chip ajout" type="button" data-adm="journal" aria-label="Ajouter une entrée au journal" title="Ajouter une entrée au journal">${ico("ajouter")}</button>` : ""}
    <button class="chip filtres" type="button" data-jpanel="pJF" aria-expanded="${JPANEL === "pJF"}" aria-controls="pJF" aria-label="Filtres${nF ? `, ${nF} actif${nF > 1 ? "s" : ""}` : ""}">${ico("filtres")}<span class="lbf">Filtres</span><span class="nf">${nF ? " " + nF : ""}</span></button>
    <button class="chip j-st" type="button" data-jpanel="pJS" aria-expanded="${JPANEL === "pJS"}" aria-controls="pJS" aria-label="Statistiques">${ico("stats")}</button></div>
  <div class="fbar"><div class="chips defile gtabs" role="group" aria-label="Genres">${cats.map((c) => chip("cat", slug(c), ico(c) + esc(GENRE_PUCE[c] || c), f.cat.has(slug(c)), GENRE_PUCE[c] ? c : "").replace('class="chip"', `class="chip g-${famille(c)}"`)).join("")}</div>
    <div class="fpanel" id="pJF"${JPANEL === "pJF" ? "" : " hidden"}>
      <div class="fgr" role="group" aria-labelledby="fjS"><span class="fl" id="fjS">Saison</span><div class="chips">${chip("sa", "*", "Toutes", !f.sa.size)}${saisons.map((y) => chip("sa", y, saisonCourt(y), f.sa.has(y), saisonLib(y))).join("")}</div></div>
      <div class="fgr" role="group" aria-labelledby="fjN"><span class="fl" id="fjN">Ma note</span><div class="chips">${[4, 3, 2, 1].map((n) => chip("mn", String(n), carres(n), f.mn.has(String(n)), "Ma note " + n)).join("")}${chip("mn", "0", "Sans note")}</div></div>
      ${accSel ? `<div class="fgr"><span class="fl">Avec</span><div>${accSel}</div></div>` : ""}
    </div>
    <div class="resbar"><span class="n" id="jn" aria-live="polite"></span>
      <a class="linkbtn tri" href="#journal?${esc(jq(f, "tri", f.tri === "note" ? "date" : "note"))}" aria-label="Tri par ${f.tri === "note" ? "ma note" : "date"}, changer">${ico("tri")}${f.tri === "note" ? "Ma note" : "Date"}</a>
      <div class="active">${jetons}${jetons ? `<a class="chip effacer" href="#journal?${esc([f.tri === "note" ? "tri=note" : "", JQ.trim() ? "q=" + encodeURIComponent(JQ.trim()) : ""].filter(Boolean).join("&"))}" data-jclr>Tout effacer</a>` : ""}</div></div></div>
  <div class="j-stm" id="pJS"${JPANEL === "pJS" ? "" : " hidden"}><h2 class="mh">Statistiques <small>${esc(libS)}</small></h2><div class="stats">${stats}</div></div>
  <div class="list" id="jlist"></div></section>
  <aside class="r-lat j-lat" aria-label="Statistiques du journal"><h2 class="mh">Statistiques <small>${esc(libS)}</small></h2><div class="stats">${stats}</div></aside></div>`;
  $$("[data-jclr]").forEach((x) => x.addEventListener("click", () => { JAVEC = ""; if (x.tagName === "BUTTON") renderJournal(q); }));
  $$("[data-jpanel]").forEach((bt) => bt.onclick = () => {
    const id = bt.dataset.jpanel; JPANEL = JPANEL === id ? "" : id;
    $$("[data-jpanel]").forEach((x) => { const on = x.dataset.jpanel === JPANEL; $("#" + x.dataset.jpanel).hidden = !on; x.setAttribute("aria-expanded", String(on)); });
  });
  draw();
  // La recherche reste dans l’adresse (partageable), sans redessiner la page sous les doigts.
  $("#jq").oninput = (ev) => {
    JQ = ev.target.value; draw();
    const s = jq(f, "", ""); history.replaceState(null, "", "#journal" + (s ? "?" + s : "")); BASE = RENDERED = location.hash.slice(1);
    $$("#jr a.chip, #jr a.linkbtn").forEach((a) => { const u = new URLSearchParams(a.getAttribute("href").split("?")[1] || ""); if (JQ.trim()) u.set("q", JQ.trim()); else u.delete("q"); const t = u.toString(); a.setAttribute("href", "#journal" + (t ? "?" + t : "")); });
  };
  const as = $("#jAvec"); if (as) as.onchange = () => { JAVEC = as.value; renderJournal(q); };
}
function jq(f, g, v) {
  const n = { cat: new Set(f.cat), sa: new Set(f.sa), mn: new Set(f.mn), tri: f.tri };
  if (g === "tri") n.tri = v; else if (!g) { /* état courant, tel quel */ } else if (v === "*") n[g].clear(); else n[g].has(v) ? n[g].delete(v) : n[g].add(v);
  const p = []; for (const k of ["sa", "cat", "mn"]) if (n[k].size) p.push(k + "=" + [...n[k]].map(encodeURIComponent).join(","));
  if (n.tri === "note") p.push("tri=note");
  if (JQ.trim()) p.push("q=" + encodeURIComponent(JQ.trim()));
  return p.join("&");
}
function bars(rows) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return `<div class="bars">${rows.map(([l, n, href, cls]) => `<span class="bl">${href ? `<a href="${href}">${esc(l)}</a>` : esc(l)}</span><span class="bg${cls ? " " + cls : ""}" data-pc="${Math.round((n / max) * 100)}" aria-hidden="true"></span><span class="bn">${n}</span>`).join("")}</div>`;
}
function statsHTML(all, toutes) {
  const count = (fn) => { const o = new Map(); all.forEach((e) => [].concat(fn(e)).forEach((k) => k != null && k !== "" && o.set(k, (o.get(k) || 0) + 1))); return [...o]; };
  if (!all.length) return '<p class="empty">Aucune sortie vue sur cette période.</p>';
  const saisons = count((e) => saisonDe(D(e.vuLe.at(-1))).cle).sort((a, b) => b[0].localeCompare(a[0])).map(([k, n]) => [saisonLib(k), n]);
  const cats = count((e) => e.categorie).sort((a, b) => b[1] - a[1]);
  const lxAll = count((e) => e.lieuId);
  const lx = lxAll.sort((a, b) => b[1] - a[1] || norm(court(a[0])).localeCompare(norm(court(b[0])))).slice(0, 5).map(([id, n]) => [court(id) || id, n, "#lieu-" + id]);
  const ar = count((e) => [...new Set((e.artistes || []).map((a) => a.nom))]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr")).slice(0, 5).map(([nm, n]) => [nm, n, "#artiste-" + slug(nm)]);
  const notes = [4, 3, 2, 1].map((n) => [n + " – " + NOTES_TXT[n], all.filter((e) => e.noteLeonard === n).length]).concat([["Sans note", all.filter((e) => !e.noteLeonard).length]]);
  const notees = all.filter((e) => e.noteLeonard), moy = notees.length ? (notees.reduce((s, e) => s + e.noteLeonard, 0) / notees.length).toFixed(1).replace(".", ",") : "–";
  const both = all.filter((e) => e.noteLeonard && e.note);
  const cmp = both.length ? `<table class="t pile"><thead><tr><th>Sortie</th><th class="num">Ma note</th><th class="num">Grille</th><th class="num">Écart</th></tr></thead><tbody>${both.map((e) => `<tr><td><a href="#sortie-${esc(e.id)}">${esc(e.titre)}</a></td><td class="num" data-l="Ma note">${e.noteLeonard}</td><td class="num" data-l="Grille">${e.note}</td><td class="num" data-l="Écart">${e.noteLeonard - e.note > 0 ? "+" : e.noteLeonard - e.note < 0 ? "−" : ""}${Math.abs(e.noteLeonard - e.note)}</td></tr>`).join("")}</tbody></table><p class="cr">Écart moyen : ${(both.reduce((s, e) => s + e.noteLeonard - e.note, 0) / both.length).toFixed(1).replace(".", ",").replace("-", "−")}</p>` : `<p class="cr">Pas encore de sortie avec à la fois ma note et une note de la grille.</p>`;
  return `<div class="kpis"><div><b>${all.length}</b><span>${all.length > 1 ? "sorties vues" : "sortie vue"}</span></div><div><b>${lxAll.length}</b><span>${lxAll.length > 1 ? "lieux" : "lieu"}</span></div><div><b>${count((e) => (e.artistes || []).map((a) => a.nom)).length}</b><span>artistes</span></div><div><b>${moy}</b><span>ma note moyenne</span></div></div>
  ${toutes ? `<h3>Par saison</h3>${bars(saisons)}` : ""}<h3>Par catégorie</h3>${bars(cats.map(([c, n]) => [c, n, null, "g-" + famille(c)]))}<h3>Lieux les plus fréquentés</h3>${bars(lx)}<h3>Artistes les plus vus</h3>${bars(ar)}<h3>Mes notes</h3>${bars(notes)}<h3>Ma note et la grille</h3>${cmp}`;
}

/* ---------- Artistes & lieux ---------- */
let ALQ = "";
function renderAL(which, q0) {
  const p0 = new URLSearchParams(q0 || ""); if (p0.has("q")) ALQ = p0.get("q");
  $("#main").innerHTML = `<div class="ph"><h1>Artistes et lieux</h1></div>
  <div class="tools"><nav class="seg" aria-label="Index"><a href="#artistes"${which === "artistes" ? ' aria-current="page"' : ""}>Artistes</a><a href="#lieux"${which === "lieux" ? ' aria-current="page"' : ""}>Lieux</a></nav>
  ${rech("alq", "Rechercher un " + (which === "lieux" ? "lieu" : "artiste"), ALQ)}</div><div id="alist"></div>`;
  const draw = () => {
    const q = norm(ALQ).trim(); let h = "";
    if (which === "artistes") {
      const A = Object.values(artistes()), n = (a) => a.aff.length + a.vus.length;
      const hit = A.filter((a) => !q || norm(a.nom).includes(q)).sort((a, b) => norm(a.nom).localeCompare(norm(b.nom)));
      const item = (a) => `<li><a href="#artiste-${a.slug}">${esc(a.nom)}<span>${n(a)}</span></a></li>`;
      const top = hit.filter((a) => n(a) >= 2).sort((a, b) => n(b) - n(a) || norm(a.nom).localeCompare(norm(b.nom)));
      if (top.length && !q) h += `<h2 class="mh">Les plus présents</h2><ul class="idx">${top.map(item).join("")}</ul><h2 class="mh">Tous <small>${hit.length}</small></h2>`;
      let L = "", ul = "";
      for (const a of hit) { const l = /[a-z]/.test(norm(a.nom)[0]) ? norm(a.nom)[0].toUpperCase() : "#"; if (l !== L) { ul += `${L ? "</ul>" : ""}<h3 class="letter">${l}</h3><ul class="idx">`; L = l; } ul += item(a); }
      h += ul ? ul + "</ul>" : '<p class="empty">Aucun artiste trouvé.</p>';
    } else {
      const ids = Object.keys(LIEUX).filter((id) => !q || norm(LIEUX[id].nom + " " + court(id) + " " + (LIEUX[id].ville || "")).includes(q)).sort((a, b) => norm(court(a)).localeCompare(norm(court(b))));
      const cnt = (id) => AFF.filter((e) => e.lieuId === id && e.statut === "a-voir").length + (JOURNAL || []).filter((e) => e.lieuId === id).length;
      h = ids.length ? `<ul class="idx">${ids.map((id) => `<li><a href="#lieu-${id}">${esc(court(id))}<span>${esc(LIEUX[id].zone === "Paris" ? "" : LIEUX[id].ville || LIEUX[id].zone)} ${cnt(id)}</span></a></li>`).join("")}</ul>` : '<p class="empty">Aucun lieu trouvé.</p>';
    }
    $("#alist").innerHTML = h;
  };
  $("#alq").oninput = (ev) => { ALQ = ev.target.value; draw(); history.replaceState(null, "", "#" + which + (ALQ.trim() ? "?q=" + encodeURIComponent(ALQ.trim()) : "")); BASE = RENDERED = location.hash.slice(1); };
  draw();
}
const byStart = (a, b) => sortKey(a) - sortKey(b);
const byVu = (a, b) => (b.vuLe || []).at(-1).localeCompare((a.vuLe || []).at(-1));
function renderArtiste(k) {
  const a = artistes()[k];
  if (!a) { $("#main").innerHTML = `<a class="back" href="#artistes">Artistes et lieux</a><p class="empty">Artiste inconnu.</p>`; return; }
  const aff = a.aff.filter((e) => !ended(e)).sort(byStart), vus = a.vus.slice().sort(byVu);
  $("#main").innerHTML = `<a class="back" href="#artistes">Artistes et lieux</a><div class="ph">${partagerBtn()}<h1>${esc(a.nom)}</h1><p>${esc(cap(ROLES.filter((r) => a.roles.has(r)).join(", ")))} · ${plural(aff.length, "sortie")} à l’affiche, ${plural(vus.length, "vue", "vues")}</p></div>
  ${genresHTML([...aff, ...vus])}${aff.length ? groupeHTML("À l’affiche", aff.length, aff.map(rowA).join("")) : ""}${vus.length ? groupeHTML("Vu", vus.length, vus.map(rowJ).join("")) : ""}`;
  brancherGenres($("#main"));
  document.title = a.nom + " – " + NOM;
}
function renderLieu(id) {
  const L = LIEUX[id];
  if (!L) { $("#main").innerHTML = `<a class="back" href="#lieux">Artistes et lieux</a><p class="empty">Lieu inconnu.</p>`; return; }
  const aff = AFF.filter((e) => e.lieuId === id && e.statut === "a-voir" && !ended(e)).sort(byStart);
  const vus = (JOURNAL || []).filter((e) => e.lieuId === id).sort(byVu);
  const ext = (u, t) => web(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${t}</a>` : "";
  $("#main").innerHTML = `<a class="back" href="#lieux">Artistes et lieux</a><div class="ph">${partagerBtn()}<h1>${esc(L.nom)}</h1><p>${esc([L.ville, L.zone !== L.ville ? L.zone : ""].filter(Boolean).join(", "))} · lieu ${L.statut === "Public" ? "public" : "privé"}</p></div>
  <dl class="dl inl">${L.tarifJeune ? `<dt>Tarif jeune</dt><dd>${esc(L.tarifJeune)}</dd>` : ""}${L.adresse ? `<dt>Adresse</dt><dd>${esc(L.adresse)}</dd>` : ""}${L.site ? `<dt>Site</dt><dd>${ext(L.site, esc(L.site.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")))}</dd>` : ""}${L.billetterie ? `<dt>Billetterie</dt><dd>${ext(L.billetterie, "Acheter des places")}</dd>` : ""}</dl>
  ${genresHTML([...aff, ...vus])}${aff.length ? groupeHTML("À l’affiche", aff.length, aff.map(rowA).join("")) : ""}${vus.length ? groupeHTML("Vu ici", vus.length, vus.map(rowJ).join("")) : ""}`;
  brancherGenres($("#main"));
  document.title = L.nom + " – " + NOM;
}

/* ---------- Liens utiles ---------- */
const icsURL = (k) => `webcal://${location.host}${new URL(URL_RACINE).pathname}data/${k}-${PRIVE.icsToken}.ics`;
const ORDRE_LIENS = ["Cartes et tarifs jeunes", "Calendriers de vente", "Billetteries", "Outils"];
const hote = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (_) { return ""; } };
// Liens rangés par rubrique, dans l’ordre du fichier à l’intérieur de chaque rubrique.
const liensParRubrique = (L) => ORDRE_LIENS.map((c) => [c, L.filter((l) => l.categorie === c)]);
/* ---------- Coups de cœur (envies, publiques) ---------- */
function renderCoeur(q) {
  const E = enviesIds(), init = (new URLSearchParams(q || "").get("cat") || "").split(",").filter(Boolean);
  const items = LIVE.filter((e) => E.has(e.id)).sort((a, b) => sortKey(a) - sortKey(b) || a.titre.localeCompare(b.titre, "fr"));
  $("#main").innerHTML = `<div class="ph">${partagerBtn()}<h1>Coups de cœur de ${OWNER}</h1><p>${EXPO ? plural(items.length, "exposition") : plural(items.length, "sortie") + " à l’affiche"}</p></div>
  ${genresHTML(items)}${groupesPar(items, groupOf, rowA) || `<p class="empty">Aucun coup de cœur pour le moment.</p>`}`;
  // Genres retenus dans l’adresse (#coeur?cat=theatre,opera).
  brancherGenres($("#main"), init, (sel) => { history.replaceState(null, "", "#coeur" + (sel.size ? "?cat=" + [...sel].join(",") : "")); BASE = RENDERED = location.hash.slice(1); });
}
// Billetteries, cartes jeunes et calendriers de vente : section du Radar (l’ancienne page Liens, #liens y mène).
function liensHTML() {
  const groups = liensParRubrique(LIENS.filter((x) => web(x.url))).filter(([, l]) => l.length);
  const item = (x) => `<li data-q="${esc(norm(x.titre + " " + hote(x.url) + " " + (x.note || "")))}"><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><span class="lt"><b>${esc(x.titre)}</b><small>${esc(hote(x.url))}${x.note ? " · " + esc(x.note) : ""}</small></span><span class="vh"> (nouvel onglet)</span></a></li>`;
  const section = ([c, l]) => `<section class="lks" id="lk-${slug(c)}" data-lk="${slug(c)}"><h3 class="v-t">${esc(c)} <small>${l.length}</small></h3><ul class="lk lkc">${l.map(item).join("")}</ul></section>`;
  // Recherche et rubriques en puces-filtres ; liens compacts sur plusieurs colonnes.
  return `<div class="lk-barre">${rech("lkq", "Rechercher une billetterie")}<div class="chips defile" role="group" aria-label="Rubriques" id="lkNav"><button class="chip" type="button" data-lkf="" aria-pressed="true">Tout</button>${groups.map(([c]) => `<button class="chip" type="button" data-lkf="${slug(c)}" aria-pressed="false">${esc(c)}</button>`).join("")}</div></div>
  ${groups.map(section).join("")}<p class="empty" id="lkvide" hidden>Aucun lien ne correspond.</p>`;
}
function brancherLiensRecherche() {
  let rub = "";
  const app = () => {
    const q = norm($("#lkq").value).trim(); let n = 0;
    $$("#main .lks").forEach((sec) => {
      const lis = $$("li[data-q]", sec), dans = !rub || sec.dataset.lk === rub;
      let v = 0; lis.forEach((li) => { const ok = dans && (!q || li.dataset.q.includes(q)); li.hidden = !ok; v += ok; });
      sec.hidden = !v; n += v;
    });
    $("#lkvide").hidden = n > 0;
  };
  $("#lkNav").onclick = (ev) => { const b = ev.target.closest("[data-lkf]"); if (!b) return; rub = b.dataset.lkf; $$("#lkNav [data-lkf]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); app(); };
  $("#lkq").oninput = app;
}
function subsHTML() {
  return `<div class="subs"><p class="cr">iPhone : Réglages › Apps › Calendrier › Comptes › Ajouter un compte › Autre › S’abonner à un calendrier, puis colle l’adresse.</p>
  <p><b>Factotum – réservations</b></p><code class="code">${esc(icsURL("agenda"))}</code><button class="btn" type="button" data-copy="${esc(icsURL("agenda"))}">Copier</button>
  <p><b>Factotum – ouvertures de ventes</b></p><code class="code">${esc(icsURL("ventes"))}</code><button class="btn" type="button" data-copy="${esc(icsURL("ventes"))}">Copier</button></div>`;
}

/* ---------- Admin : le module est chargé à la première visite de l’onglet ---------- */
function lockIcon() {
  const t = $("#t-admin"); t.hidden = !PRIVE; t.classList.toggle("ouvert", !!PRIVE); t.setAttribute("aria-label", PRIVE ? "Admin, connecté" : "Admin");
  const c = $("#cx"); if (c) { c.innerHTML = ico(PRIVE ? "cadenas-ouvert" : "cadenas"); c.setAttribute("aria-label", PRIVE ? "Session" : "Connexion"); }
}
// Session admin gardée sur cet appareil (échéance seule, aucune donnée sensible) : admin.js la restaure au démarrage.
const sessionVive = () => { try { return +localStorage.getItem("factotum-session") > Date.now(); } catch (_) { return false; } };
let adP = null;
const loadAdmin = () => adP || (adP = new Promise((ok, ko) => {
  if (window.top !== window.self) { adP = null; return ko(new Error("cadre")); } // jamais de mode admin dans une page encadrée par un autre site
  const s = document.createElement("script"); s.src = RACINE + "assets/admin.js?v=4.55"; s.onload = () => ok(); s.onerror = () => { adP = null; s.remove(); ko(new Error("admin")); };
  document.head.appendChild(s);
}));
async function renderAdmin(q) {
  if (!ADMIN) { $("#main").innerHTML = '<p class="load">Chargement…</p>'; try { await loadAdmin(); } catch (_) { $("#main").innerHTML = '<p class="empty">Impossible de charger le mode admin. Vérifie la connexion puis recharge.</p>'; return; } }
  return ADMIN.render(q);
}

/* ---------- Expositions : vues « À voir » et « Bientôt » (assets/expo.js, chargé par le site Expo seulement) ---------- */
let exP = null;
const loadExpo = () => exP || (exP = new Promise((ok, ko) => {
  const s = document.createElement("script"); s.src = RACINE + "assets/expo.js?v=4.55"; s.onload = () => ok(); s.onerror = () => { exP = null; s.remove(); ko(new Error("expo")); };
  document.head.appendChild(s);
}));
async function renderExpo(vue, q) {
  if (!window.EXPOS) { try { await loadExpo(); } catch (_) { $("#main").innerHTML = '<p class="empty">Impossible de charger les expositions. Vérifie la connexion puis recharge.</p>'; return; } }
  window.EXPOS.render(vue, q);
}

/* ---------- Routeur ---------- */
const TABS = EXPO ? { "a-voir": "a-voir", bientot: "bientot", coeur: "coeur", journal: "journal", artistes: "artistes", lieux: "artistes", artiste: "artistes", lieu: "artistes", plan: null, admin: "admin" } : { radar: "radar", affiche: "affiche", coeur: "coeur", journal: "journal", artistes: "artistes", lieux: "artistes", artiste: "artistes", lieu: "artistes", liens: "radar", ventes: "radar", rapports: "radar", rapport: "radar", plan: null, admin: "admin" };
let BASE = null, RENDERED = null;
function setTab(t) {
  $$(".tab").forEach((b, i) => { const on = b.dataset.tab === t; b.setAttribute("aria-selected", String(on)); b.tabIndex = on || (!t && i === 0) ? 0 : -1; });
  if (t) $("#main").setAttribute("aria-labelledby", "t-" + t);
}
/* Page #charte : référence de la charte Factotum (assets/charte.js, chargé à la demande, non liée dans la navigation). */
let chP = null;
const loadCharte = () => chP || (chP = new Promise((ok, ko) => {
  const s = document.createElement("script"); s.src = RACINE + "assets/charte.js?v=4.55"; s.onload = () => ok(); s.onerror = () => { chP = null; s.remove(); ko(new Error("charte")); };
  document.head.appendChild(s);
}));
function modeCharte(on) { $("#top").hidden = on; document.documentElement.classList.toggle("charte", on); }
const TITRES = { "a-voir": "", bientot: "Bientôt", radar: "Radar", ventes: "Ouvertures de vente", rapports: "Rapports de veille", rapport: "Rapport de veille", plan: "Plan du site", affiche: "", coeur: "Coups de cœur", journal: "Journal", artistes: "Artistes et lieux", lieux: "Artistes et lieux", admin: "Admin" };
let TITRE_VUE = NOM;
async function renderView(h) {
  const [path, q = ""] = h.split("?");
  if (path === "charte") {
    modeCharte(true); setTab(null);
    try { await loadCharte(); } catch (_) { $("#main").innerHTML = '<p class="empty">Impossible de charger la charte. Vérifie la connexion puis recharge.</p>'; return; }
    window.CHARTE.render($("#main"), { EXPO, esc, cleF, saisonTxt, saisonDe, themeBouton, ico, ICONES: ICO, CATS, famille });
    document.title = TITRE_VUE = "Charte – " + NOM; RENDERED = h; window.scrollTo(0, 0); return;
  }
  modeCharte(false);
  const view = path.startsWith("artiste-") ? "artiste" : path.startsWith("lieu-") ? "lieu" : path.startsWith("rapport-") && !EXPO ? "rapport" : path === "liens" ? "radar" : Object.hasOwn(TABS, path) ? path : ACCUEIL;
  const samePath = RENDERED && RENDERED.split("?")[0] === path;
  const focusK = samePath && document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.k : null;
  setTab(TABS[view]);
  document.title = TITRE_VUE = TITRES[view] ? TITRES[view] + " – " + NOM : NOM;
  try {
    if (["journal", "artistes", "lieux", "artiste", "lieu"].includes(view) && !JOURNAL) { if (!samePath) $("#main").innerHTML = '<p class="load">Chargement…</p>'; await loadJournal(); }
  } catch (_) { $("#main").innerHTML = '<p class="empty">Impossible de charger ces données. Vérifie la connexion puis recharge.</p>'; return; }
  if (view === "radar") { if (!LIENS) { if (!samePath) $("#main").innerHTML = '<p class="load">Chargement…</p>'; await loadLiens().catch(() => {}); } if (!RAPPORTS) await loadRadar(); renderRadar(); }
  else if (view === "rapport" || view === "rapports") { if (!RAPPORTS) { if (!samePath) $("#main").innerHTML = '<p class="load">Chargement…</p>'; await loadRadar(); } if (view === "rapport" && path.length > 8) renderRapport(decodeURIComponent(path.slice(8))); else renderRapports(); }
  else if (view === "a-voir" || view === "bientot") await renderExpo(view, q);
  else if (view === "affiche") renderAffiche(q);
  else if (view === "journal") renderJournal(q);
  else if (view === "artistes" || view === "lieux") renderAL(view, q);
  else if (view === "artiste") renderArtiste(decodeURIComponent(path.slice(8)));
  else if (view === "lieu") renderLieu(decodeURIComponent(path.slice(5)));
  else if (view === "coeur") renderCoeur(q);
  else if (view === "ventes") renderVentes(q);
  else if (view === "plan") renderPlan();
  else if (view === "admin") await renderAdmin(q);
  const hc = $("#hcoeur"); if (hc) { if (view === "coeur") hc.setAttribute("aria-current", "page"); else hc.removeAttribute("aria-current"); }
  RENDERED = h;
  if (!samePath) { const m = $("#main"); m.classList.remove("entre"); void m.offsetWidth; m.classList.add("entre"); } // fondu d’entrée d’une nouvelle page (CSS, sauf mouvement réduit)
  colLat();
  if (path === "liens") { const l = $("#r-liens"); if (l) l.scrollIntoView({ block: "start" }); }
  else if (!samePath) window.scrollTo(0, 0);
  else if (focusK) { const el = $(`[data-k="${focusK}"]`); if (el) el.focus({ preventScroll: true }); }
}
const LEGACY = { calendrier: "affiche?vue=mois", vus: "journal", prive: "admin", ventes: "ventes", catalogue: "affiche" };
async function route() {
  let h = location.hash.slice(1);
  if (h.startsWith("fiche-")) { history.replaceState(null, "", "#sortie-" + h.slice(6)); h = "sortie-" + h.slice(6); }
  else if (h.startsWith("vue-")) { h = (!EXPO && LEGACY[h.slice(4)]) || ACCUEIL; history.replaceState(null, "", "#" + h); }
  if (!h) h = ACCUEIL;
  if (h.startsWith("sortie-")) {
    FROM_APP = BASE !== null;
    if (BASE === null) BASE = ACCUEIL;
    if (RENDERED === null) await renderView(BASE);
    return openSheet(decodeURIComponent(h.slice(7)));
  }
  const chemin = h.split("?")[0];
  if (!(Object.hasOwn(TABS, chemin) || chemin === "charte" || /^(artiste|lieu)-./.test(chemin) || (!EXPO && /^rapport-./.test(chemin)))) { h = ACCUEIL; history.replaceState(null, "", "#" + ACCUEIL); }
  const wasOpen = !$("#sheet").hidden;
  closeSheet();
  BASE = h;
  if (wasOpen && RENDERED === h) return;
  await renderView(h);
}
window.addEventListener("hashchange", route);
/* Colonne de droite (bureau) : collante, mais sans défilement propre. Plus haute que l'écran, elle défile avec la
   page jusqu'à montrer sa fin, puis reste en place (top négatif). */
function colLat() {
  $$(".r-lat").forEach((a) => {
    a.style.top = "";
    const cs = getComputedStyle(a); if (cs.position !== "sticky") return;
    const base = parseFloat(cs.top) || 0, h = a.offsetHeight;
    if (base + h > innerHeight) a.style.top = Math.round(innerHeight - h - 16) + "px";
  });
}
window.addEventListener("resize", colLat);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(colLat);

/* ---------- Événements globaux ---------- */
$$(".tab").forEach((b) => {
  b.onclick = () => {
    const t = b.dataset.tab;
    const target = t === ACCUEIL ? LAST_AFF : t;
    if (location.hash.slice(1) === target) { window.scrollTo({ top: 0 }); return; }
    location.hash = target;
  };
  b.onkeydown = (ev) => {
    const tabs = $$(".tab:not([hidden])"), i = tabs.indexOf(b);
    let j = ev.key === "ArrowRight" ? i + 1 : ev.key === "ArrowLeft" ? i - 1 : ev.key === "Home" ? 0 : ev.key === "End" ? tabs.length - 1 : null;
    if (j == null) return;
    ev.preventDefault(); j = (j + tabs.length) % tabs.length; tabs[j].focus(); tabs[j].click();
  };
});
document.addEventListener("click", async (ev) => {
  if (!ev.target.closest(".tm")) themeFerme();
  const rb = ev.target.closest("button.rb");
  if (rb) {
    const row = rb.closest(".row"), det = row.querySelector(".det"), open = det.hidden;
    if (open && !det.innerHTML) { det.innerHTML = detHTML(BYID.get(row.dataset.id)); }
    rb.setAttribute("aria-expanded", String(open));
    if (open) { det.classList.remove("ferme"); det.hidden = false; row.classList.add("open"); }
    else if (matchMedia("(prefers-reduced-motion: reduce)").matches) { det.hidden = true; row.classList.remove("open"); }
    else { // fermeture : fondu avant de masquer (animation CSS « m-replie »)
      row.classList.remove("open"); det.classList.add("ferme");
      const fin = () => { if (det.classList.contains("ferme")) { det.hidden = true; det.classList.remove("ferme"); } };
      det.addEventListener("animationend", fin, { once: true }); setTimeout(fin, 260);
    }
    return;
  }
  const pl = ev.target.closest("[data-plus]");
  if (pl) { pl.nextElementSibling.hidden = false; pl.remove(); return; } // crédits : noms suivants
  const pg = ev.target.closest("[data-partage]");
  if (pg) {
    const url = location.origin + location.pathname + location.hash;
    try { if (navigator.share) { await navigator.share({ title: document.title, url }); return; } } catch (err) { if (err && err.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(url); toast("Lien copié"); } catch (_) { prompt("Copie ce lien :", url); }
    return;
  }
  const sh = ev.target.closest("[data-share]");
  if (sh) {
    const e = BYID.get(sh.dataset.share), url = shareURL(sh.dataset.share);
    try { if (navigator.share) { await navigator.share({ url }); return; } } catch (err) { if (err && err.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(url); toast("Lien copié"); } catch (_) { prompt("Copie ce lien :", url); }
    return;
  }
  const cx = ev.target.closest("[data-cx]");
  if (cx) { try { await loadAdmin(); ADMIN.portail(); } catch (_) { toast("Impossible de charger la connexion. Vérifie le réseau."); } return; }
  const tb = ev.target.closest("[data-theme-btn]");
  if (tb) { themeMenu(tb); return; }
  const ts = ev.target.closest("[data-theme-set]");
  if (ts) { const b = ts.closest(".tm").querySelector("[data-theme-btn]"); themePose(ts.dataset.themeSet); themeFerme(); b.focus(); return; }
  const cp = ev.target.closest("[data-copy]");
  if (cp) { try { await navigator.clipboard.writeText(cp.dataset.copy); toast("Adresse copiée"); } catch (_) { prompt("Copie cette adresse :", cp.dataset.copy); } }
});

/* ---------- En-tête : saison calculée, thème, barre compacte au défilement ---------- */
$("#saison").innerHTML = '<span class="sl">Saison </span>' + saisonDe().debut + "–" + (saisonDe().debut + 1); // « Saison » replié sur mobile quand la mention du site partage la ligne
themePose(themeLu()); lockIcon();
document.addEventListener("keydown", (ev) => { const m = $(".tmenu"); if (ev.key === "Escape" && m) { const b = m.parentElement.querySelector("[data-theme-btn]"); themeFerme(); b.focus(); } });
if ("IntersectionObserver" in window) new IntersectionObserver(([x]) => document.body.classList.toggle("compact", !x.isIntersecting)).observe($("#top"));

/* ---------- Barres des statistiques : largeur posée par script (la politique de sécurité interdit les attributs style) ---------- */
const poseBarres = (root) => { if (root.querySelectorAll) root.querySelectorAll("[data-pc]").forEach((el) => el.style.setProperty("--v", String(Math.max(0, Math.min(100, +el.dataset.pc || 0))))); };
new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) { if (n.dataset && n.dataset.pc) poseBarres(n.parentNode); else poseBarres(n); } }))).observe(document.body, { childList: true, subtree: true });

/* ---------- Hors ligne : le site reste lisible (cache), le bandeau dit de quand datent les données ---------- */
function horsLigne() {
  const el = $("#hl"); if (!el) return;
  el.hidden = navigator.onLine !== false;
  if (!el.hidden) el.textContent = "Hors ligne" + (MAJ ? " – données du " + fmt(D(MAJ)) : "");
}
window.addEventListener("online", horsLigne); window.addEventListener("offline", horsLigne);

/* ---------- Démarrage ---------- */
(async () => {
  try {
    const [a, l, d, ev, dv] = await Promise.all([getJSON(RACINE + "data/affiche.json"), getJSON(RACINE + "data/lieux.json"), getJSON(RACINE + "data/dispo.json").catch(() => ({})), getJSON(RACINE + "data/envies.json").catch(() => ({})), getJSON(RACINE + "data/deja-vu.json").catch(() => ({}))]);
    ENVIES_PUB = Array.isArray(ev.ids) ? ev.ids : [];
    DEJA_VU = dv && typeof dv === "object" ? dv : {};
    DISPO_PUB = d;
    applyData({ affiche: a, lieux: l, dispo: d });
    horsLigne();
    await route();
    if (sessionVive()) loadAdmin().then(() => ADMIN.restaurer()).catch(() => {});
  } catch (err) {
    $("#main").innerHTML = '<p class="empty">Impossible de charger la saison. Vérifie la connexion puis recharge la page.</p>';
  }
})();
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost"))
  window.addEventListener("load", () => navigator.serviceWorker.register(RACINE + "sw.js").catch(() => {}));
