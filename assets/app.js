/* Factotum – interface publique (lots 2 et 3). Aucune dépendance. Le mode admin est dans assets/admin.js, chargé à la demande. */
"use strict";
const OWNER = "Léonard";
const CATS = ["Théâtre", "Opéra", "Danse", "Comédie musicale", "Récital", "Concert", "Festival", "Exposition", "Cinéma", "Événement", "Sur scène", "Autre"];
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
  "poignee": "<g fill=\"currentColor\" stroke=\"none\"><circle cx=\"9\" cy=\"6\" r=\"1.5\"/><circle cx=\"15\" cy=\"6\" r=\"1.5\"/><circle cx=\"9\" cy=\"12\" r=\"1.5\"/><circle cx=\"15\" cy=\"12\" r=\"1.5\"/><circle cx=\"9\" cy=\"18\" r=\"1.5\"/><circle cx=\"15\" cy=\"18\" r=\"1.5\"/></g>",
  "ventes": "<path d=\"M6 17v-6a6 6 0 0 1 12 0v6M4 17h16M10 21h4\"/>",
};
const ico = (n, cls) => ICO[n] ? `<svg class="pi${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">${ICO[n]}</svg>` : "";
// Familles de genre (code couleur) : théâtre, musique, danse, images ; le reste est neutre.
const FAMILLE = { "Théâtre": "theatre", "Opéra": "musique", "Récital": "musique", "Concert": "musique", "Comédie musicale": "musique", "Danse": "danse", "Exposition": "images", "Cinéma": "images" };
const famille = (c) => FAMILLE[c] || "neutre";
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
let ENVIES_PUB = [], AFF = [], LIVE = [], LIEUX = {}, BUSY = new Set(), BUSY_SRC = {}, MAJ = "", JOURNAL = null, JMAJ = "", LIENS = null, PRIVE = null;
let ADMIN = null, JAVEC = ""; // ADMIN : module admin (assets/admin.js) ; JAVEC : filtre du journal par accompagnant (mémoire seulement)
const BYID = new Map();
let jP = null, lP = null;
const loadJournal = () => jP || (jP = getJSON("data/journal.json").then((j) => { JOURNAL = j.sorties; JMAJ = j.maj; JOURNAL.forEach((e) => BYID.set(e.id, e)); ART = null; return JOURNAL; }).catch((e) => { jP = null; throw e; }));
const loadLiens = () => lP || (lP = getJSON("data/liens.json").then((l) => (LIENS = l)).catch((e) => { lP = null; throw e; }));

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
  if (dispo) { BUSY_SRC = dispo; BUSY = new Set([...(dispo.reservations || []), ...(dispo.manuel || []), ...(dispo.calendrier || [])]); }
  BYID.clear(); AFF.forEach((e) => BYID.set(e.id, e)); (JOURNAL || []).forEach((e) => BYID.set(e.id, e));
  LIVE = AFF.filter((e) => e.statut === "a-voir" && !ended(e));
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
function range(e) {
  if (e.datesTexte) return e.datesTexte;
  const p = span(e); if (!p) return "Dates à préciser";
  const [a, b] = p;
  if (+a === +b) return fmtY(a, true);
  return a.getFullYear() === b.getFullYear() ? fmt(a) + " – " + fmtY(b) : fmtY(a) + " – " + fmtY(b);
}
const NOTES_TXT = { 4: "incontournable", 3: "fortement recommandé", 2: "bon choix si disponible", 1: "curiosité" };
// Note : quatre carrés (pleins jusqu’à la note), « P » en exposant pour une prévision.
function stars(n, pro, label) {
  if (!n) return "";
  const lib = `${label ? label + " : " : ""}${n} sur 4${label ? "" : ", " + NOTES_TXT[n]}${pro ? ", prévision" : ""}`;
  return `<span class="st" role="img" aria-label="${lib}">${[1, 2, 3, 4].map((i) => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}${pro ? '<sup aria-hidden="true">P</sup>' : ""}</span>`;
}
const booking = (e) => e.billetterie || lieu(e).billetterie || e.lien || lieu(e).site || "";
const official = (e) => e.lien || lieu(e).site || "";
const shareURL = (id) => location.origin + location.pathname + "#sortie-" + id;

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

/* ---------- Fragments ---------- */
function stubHTML(e, mode) {
  if (mode === "vu") {
    const v = D((e.vuLe || []).at(-1));
    return v ? `<span class="stub"><b>${v.getDate()}</b><small>${MOIS[v.getMonth()]} ${String(v.getFullYear()).slice(2)}</small></span>` : `<span class="stub"><b>–</b></span>`;
  }
  const p = span(e);
  if (!p) return `<span class="stub"><b>–</b><small>à venir</small></span>`;
  if (running(e)) return `<span class="stub" title="jusqu’au ${fmtY(p[1])}"><small class="fin">fin<span class="vh"> le</span></small><b>${p[1].getDate()}</b><small>${MOIS[p[1].getMonth()]}</small></span>`;
  return `<span class="stub"><b>${p[0].getDate()}</b><small>${MOIS[p[0].getMonth()]}${p[0].getFullYear() !== TODAY.getFullYear() && p[0].getFullYear() !== TODAY.getFullYear() + 1 ? " " + p[0].getFullYear() : ""}</small></span>`;
}
function badges(e) {
  const b = [];
  if (e.leonardYVa) b.push(`<span class="b yva">${OWNER} y va</span>`);
  if (e.publicJeune) b.push(`<span class="b">Public jeune</span>`);
  if (ETATS[e.etat]) b.push(etatB(e.etat));
  else if (lastDays(e)) b.push(`<span class="b">Dernières dates</span>`);
  if ((e.offres || []).length) b.push(`<span class="b">Offre jeune</span>`);
  return b.length ? `<span class="bds">${b.join("")}</span>` : "";
}
// Artistes en tête de ligne : auteur, compositeur, mise en scène, chorégraphie, puis les autres ; trois au plus.
const ORDRE_ART = ["auteur", "compositeur", "mise en scène", "chorégraphie", "direction musicale", "commissaire", "réalisation", "compagnie", "interprète", "artiste"];
const artLigne = (e) => [...(e.artistes || [])].sort((a, b) => ORDRE_ART.indexOf(a.role) - ORDRE_ART.indexOf(b.role)).slice(0, 3).map((a) => a.nom).join(", ");
// Recherche plein texte (titre, artistes, lieu, salle, avis, années vues ; notes privées si connecté), sans accents, tous les mots.
const normQ = (s) => norm(s).replace(/[’‘`]/g, "'");
function texteDe(e) {
  const L = lieu(e), jp = PRIVE && PRIVE.journalPrive ? PRIVE.journalPrive[e.id] : null;
  return normQ([e.titre, e.sousGenre, e.categorie, ...(e.artistes || []).map((a) => a.nom), court(e.lieuId), L.nom, L.ville, e.salle, e.avis, e.pourquoi, ...(e.vuLe || []), jp && jp.notes].filter(Boolean).join(" "));
}
const cherche = (e, q) => { const t = normQ(q).trim(); if (!t) return true; const x = texteDe(e); return t.split(/\s+/).every((m) => x.includes(m)); };
const genre = (e) => e.categorie + (e.sousGenre ? " (" + e.sousGenre.toLowerCase() + ")" : "");
// Ligne : 1) genre à gauche, note à droite (cœur juste avant en admin) ; 2) titre ; 3) artistes ; 4) lieu et horaires, puis badges.
const l1 = (e, note) => `<span class="l1">${gk(e)}${note}</span>`;
const ligneMeta = (meta, b) => (meta || b ? `<span class="ss">${meta ? `<span class="ssm">${meta}</span>` : ""}${b}</span>` : "");
function rowA(e) {
  const meta = [court(e.lieuId), e.horaires && e.horaires.length <= 40 ? e.horaires : ""].filter(Boolean).join(" · "), art = artLigne(e);
  return `<article class="row g-${famille(e.categorie)}" data-id="${esc(e.id)}"><button class="rb" type="button" aria-expanded="false" aria-controls="d-${esc(e.id)}">${stubHTML(e)}
  <span class="mid">${l1(e, stars(e.note, e.pronostic))}<span class="tt nom">${esc(e.titre)}</span>${art ? `<span class="art nom">${esc(art)}</span>` : ""}${ligneMeta(esc(meta), badges(e))}</span></button>${PRIVE && ADMIN ? ADMIN.heart(e.id) : ""}<div class="det" id="d-${esc(e.id)}" hidden></div></article>`;
}
function rowJ(e) {
  const n = (e.vuLe || []).length;
  const meta = [court(e.lieuId), n > 1 ? `vu ${n} fois : ${e.vuLe.map((d) => fmtY(D(d))).join(", ")}` : ""].filter(Boolean).join(" · ");
  // Admin : les personnes venues avec moi, en label sur la ligne.
  const jp = PRIVE && ADMIN && PRIVE.journalPrive ? PRIVE.journalPrive[e.id] : null, acc = jp ? [...new Set(jp.accompagnants || [])] : [];
  return `<article class="row g-${famille(e.categorie)}" data-id="${esc(e.id)}"><button class="rb" type="button" aria-expanded="false" aria-controls="d-${esc(e.id)}">${stubHTML(e, "vu")}
  <span class="mid">${l1(e, e.noteLeonard ? stars(e.noteLeonard, false, "Ma note") : "")}<span class="tt nom">${esc(e.titre)}</span>${e.avis ? `<span class="art">« ${esc(e.avis)} »</span>` : artLigne(e) ? `<span class="art nom">${esc(artLigne(e))}</span>` : ""}${ligneMeta(esc(meta), acc.length ? `<span class="bds"><span class="b">avec ${esc(acc.join(", "))}</span></span>` : "")}</span></button><div class="det" id="d-${esc(e.id)}" hidden></div></article>`;
}
function creditsHTML(e) {
  const by = {};
  (e.artistes || []).forEach((a) => (by[a.role] ??= []).push(a));
  return ROLES.filter((r) => by[r]).map((r) => `<span class="ro">${esc(r)}</span> ${by[r].map((a) => `<a href="#artiste-${slug(a.nom)}">${esc(a.nom)}</a>`).join(", ")}`).join(" · ");
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
function actsHTML(e, details) {
  const b = booking(e), o = official(e);
  return `<div class="acts">${b && e.statut !== "vu" ? `<a class="btn pri" href="${esc(b)}" target="_blank" rel="noopener">${ico("billet")}Réserver</a>` : ""}${o && (o !== b || e.statut === "vu") ? `<a class="btn" href="${esc(o)}" target="_blank" rel="noopener">${ico("externe")}${e.statut === "vu" ? "Page archivée" : "Site officiel"}</a>` : ""}${PRIVE && ADMIN && e.statut === "a-voir" && !reservee(e) ? `<button class="btn" type="button" data-adm="reserver" data-id="${esc(e.id)}">Réservé</button>` : ""}${details ? `<a class="btn" href="#sortie-${esc(e.id)}">Détails</a><button class="btn ico" type="button" data-share="${esc(e.id)}" aria-label="Partager">${ico("partager")}</button>` : ""}</div>`;
}
function detHTML(e) {
  const c = creditsHTML(e);
  // Journal : en admin, la fiche se modifie directement sous la ligne ; sinon, détail public déroulé.
  if (e.statut === "vu") {
    if (PRIVE && ADMIN) return ADMIN.journalForm(e);
    return `${c ? `<p class="cr">${c}</p>` : ""}${e.avis ? `<blockquote>${esc(e.avis)}</blockquote>` : ""}${actsHTML(e, true)}`;
  }
  return `${c ? `<p class="cr">${c}</p>` : ""}${e.pourquoi ? `<p class="why">${esc(e.pourquoi)}</p>` : ""}${offresHTML(e)}${actsHTML(e, true)}`;
}

/* ---------- Calendriers ---------- */
function monthGrid(y, m, cellFn) {
  const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
  let h = '<div class="grid">' + ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."].map((d) => `<div class="dow" aria-hidden="true">${d}</div>`).join("");
  for (let i = 0, p = (first.getDay() + 6) % 7; i < p; i++) h += '<div class="cell out" aria-hidden="true"></div>';
  for (let d = 1; d <= last.getDate(); d++) h += cellFn(new Date(y, m, d));
  return h + "</div>";
}
function ficheCal(e) {
  const p = span(e); if (!p) return '<p class="empty">Dates inconnues.</p>';
  const offers = new Set((e.offres || []).map((o) => o.date).filter(Boolean));
  const st = p[0] < TODAY ? TODAY : p[0];
  let h = "", n = 0;
  for (let c = new Date(st.getFullYear(), st.getMonth(), 1); c <= p[1] && n < 6; c = new Date(c.getFullYear(), c.getMonth() + 1, 1), n++) {
    h += `<div class="cal mini"><div class="calh"><h3>${MOIS_L[c.getMonth()]} ${c.getFullYear()}</h3></div>` + monthGrid(c.getFullYear(), c.getMonth(), (d) => {
      const k = iso(d), on = playsOn(e, d) && d >= TODAY, busy = BUSY.has(k);
      const cls = ["cell", on ? (busy ? "busy" : "play") : "", d < TODAY ? "past" : "", +d === +TODAY ? "today" : "", offers.has(k) ? "of" : ""].filter(Boolean).join(" ");
      const lab = `${fmt(d, true)}${on ? (busy ? `, se joue, ${OWNER} pris` : `, se joue, ${OWNER} libre`) : ""}${offers.has(k) ? ", offre jeune" : ""}`;
      return `<div class="${cls}" role="img" aria-label="${lab}"><span class="n" aria-hidden="true">${d.getDate()}</span></div>`;
    }) + "</div>";
  }
  return `<div class="mini-wrap">${h}</div><div class="legend"><span class="l-joue">Libre</span><span class="l-pris">Pris</span><span class="l-offre">Offre jeune</span><span class="l-auj">Aujourd’hui</span></div>
  ${e.relaches ? "" : '<p class="aide">Relâches non renseignées.</p>'}`;
}

/* ---------- Filtres de l’affiche (état dans l’URL) ---------- */
const ZONES = { paris: "Paris", pc: "Petite couronne" }, STATUTS = { public: "Public", prive: "Privé" };
const RAC = { soir: "Ce soir", we: "Ce week-end", semaine: "Cette semaine" };
function parseF(q) {
  const p = new URLSearchParams(q || ""), L = (k) => (p.get(k) || "").split(",").filter(Boolean);
  return { cat: new Set(L("cat")), note: +p.get("note") || 0, zone: new Set(L("zone")), statut: new Set(L("statut")), jeune: p.has("jeune"), offre: p.has("offre"), yva: p.has("yva"),
    q: p.get("q") || "", lieu: p.get("lieu") || "", per: p.get("per") || "", jour: p.get("jour") || "", rac: p.get("rac") || "", libre: p.has("libre"), vue: p.get("vue") === "mois" ? "mois" : "liste", mois: p.get("mois") || "", tri: p.get("tri") === "note" ? "note" : "date" };
}
function serF(f) {
  const p = [], put = (k, v) => p.push(v === true ? k : k + "=" + [...(v instanceof Set ? v : [v])].map(encodeURIComponent).join(","));
  if (f.vue === "mois") put("vue", "mois");
  if (f.vue === "mois" && f.mois) put("mois", f.mois);
  for (const k of ["cat", "zone", "statut"]) if (f[k].size) put(k, f[k]);
  if (f.note) put("note", f.note);
  for (const k of ["jeune", "offre", "yva", "libre"]) if (f[k]) put(k, true);
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
  if (f.lieu) lbl("lieu", "", court(f.lieu) || f.lieu);
  if (f.per) lbl("per", "", f.per === "30" ? "30 prochains jours" : MOIS_L[+f.per.slice(5) - 1] + " " + f.per.slice(0, 4));
  return a;
}

/* ---------- Vue « À l’affiche » ---------- */
let F = parseF(""), LAST_AFF = "affiche";
function setF(mut) {
  mut(F);
  history.replaceState(null, "", "#affiche" + (serF(F) ? "?" + serF(F) : ""));
  BASE = RENDERED = LAST_AFF = location.hash.slice(1);
  updateAffiche();
}
function renderAffiche(q) {
  F = parseF(q); LAST_AFF = "affiche" + (q ? "?" + q : "");
  const cats = CATS.filter((c) => LIVE.some((e) => e.categorie === c));
  const lieux = [...new Set(LIVE.map((e) => e.lieuId).filter(Boolean))].sort((a, b) => norm(court(a)).localeCompare(norm(court(b))));
  const months = []; for (let i = 0; i < 10; i++) { const d = new Date(TODAY.getFullYear(), TODAY.getMonth() + i, 1); months.push([iso(d).slice(0, 7), cap(MOIS_L[d.getMonth()]) + " " + d.getFullYear()]); }
  const chip = (g, v, t, extra = "") => `<button class="chip" type="button" data-g="${g}" data-v="${esc(v)}" aria-pressed="false"${extra}>${t}</button>`;
  const rd = radar();
  $("#main").innerHTML = `<div class="aff-g"><section id="aff"><h1 class="vh">À l’affiche</h1>
  ${radarLigne(rd)}
  <div class="tools barre-f">${rech("aq", "Rechercher à l’affiche", F.q)}<div class="seg" role="group" aria-label="Affichage"><button class="i" type="button" data-vue="liste" aria-pressed="true" aria-label="Liste">${ico("liste")}</button><button class="i" type="button" data-vue="mois" aria-pressed="false" aria-label="Calendrier">${ico("mois")}</button></div>
    <button class="chip filtres" type="button" data-panel="pF" aria-expanded="false" aria-controls="pF">${ico("filtres")}<span class="lbf">Filtres</span><span class="nf" id="nF"></span></button></div>
  <div class="fbar"><div class="chips defile" role="group" aria-label="Genres">${cats.map((c) => chip("cat", slug(c), ico(c) + esc(c)).replace('class="chip"', `class="chip g-${famille(c)}"`)).join("")}</div>
    <div class="fpanel" id="pF" hidden>
      <div class="fgr" role="group" aria-labelledby="fgN"><span class="fl" id="fgN">Note</span><div class="chips">${chip("note", "2", carres(2, true), ' aria-label="Note 2 et plus"')}${chip("note", "3", carres(3, true), ' aria-label="Note 3 et plus"')}${chip("note", "4", carres(4), ' aria-label="Note 4"')}</div></div>
      <div class="fgr" role="group" aria-labelledby="fgO"><span class="fl" id="fgO">Où</span><div><div class="chips">${chip("zone", "paris", "Paris")}${chip("zone", "pc", "Petite couronne")}<span class="sep" aria-hidden="true"></span>${chip("statut", "public", "Lieu public")}${chip("statut", "prive", "Lieu privé")}</div>
        <label class="f"><span>Lieu</span><select id="fLieu"><option value="">Tous les lieux</option>${lieux.map((l) => `<option value="${esc(l)}">${esc(court(l))}</option>`).join("")}</select></label></div></div>
      <div class="fgr" role="group" aria-labelledby="fgQ"><span class="fl" id="fgQ">Quand</span><div><label class="f"><span>Période</span><select id="fPer"><option value="">Toute la saison</option><option value="30">30 prochains jours</option>${months.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select></label>
        <div class="chips">${chip("libre", "1", "Soirs libres", ` aria-label="Seulement les soirs où ${OWNER} est libre"`)}</div></div></div>
      <div class="fgr" role="group" aria-labelledby="fgP"><span class="fl" id="fgP">Pour</span><div class="chips">${chip("jeune", "1", "Public jeune")}${chip("offre", "1", "Offre jeune")}${chip("yva", "1", OWNER + " y va")}</div></div>
    </div>
    <div class="active" id="active" aria-live="polite"></div></div>
  <div id="monthBox"></div>
  <div id="alist" class="list"></div></section>${radarLateral(rd)}</div>`;
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
      else if (["libre", "jeune", "offre", "yva"].includes(g)) f[g] = !f[g];
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
    const on = g === "rac" ? f.rac === v : g === "note" ? f.note === +v : typeof f[g] === "boolean" ? f[g] : f[g] instanceof Set ? f[g].has(v) : false;
    b.setAttribute("aria-pressed", String(!!on));
  });
  const nF = (f.note ? 1 : 0) + f.zone.size + f.statut.size + (f.lieu ? 1 : 0) + (f.per ? 1 : 0) + [f.libre, f.jeune, f.offre, f.yva].filter(Boolean).length;
  $("#nF").textContent = nF ? " " + nF : ""; m.querySelector("[data-panel=pF]").setAttribute("aria-label", "Filtres" + (nF ? `, ${nF} actif${nF > 1 ? "s" : ""}` : ""));
  m.querySelectorAll("[data-vue]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vue === f.vue)));
  $("#fLieu").value = f.lieu; $("#fPer").value = f.per;
  const aq = $("#aq"); if (aq && document.activeElement !== aq && aq.value !== f.q) aq.value = f.q;
  // Résultats
  let items = LIVE.filter((e) => matchA(e, f, f.vue === "mois" && !f.jour));
  if (f.vue === "mois" && !f.jour) { const c = monthCursor(f); items = items.filter((e) => overlaps(e, c, new Date(c.getFullYear(), c.getMonth() + 1, 0))); }
  const act = activeList(f);
  $("#active").innerHTML = `<span class="n">${plural(items.length, "sortie")}</span>${act.map((a) => `<button class="chip on${a.k === "cat" ? " g-" + famille(a.t) : ""}" type="button" data-rm="${a.k}" data-v="${esc(a.v)}" aria-label="Retirer le filtre ${esc(a.t)}">${esc(a.t)}<span class="x" aria-hidden="true">×</span></button>`).join("")}${act.length ? `<button class="chip effacer" type="button" id="clear">Tout effacer</button>` : ""}<button class="linkbtn ml tri" type="button" id="tri" aria-label="Tri par ${f.tri === "note" ? "note" : "date"}, changer">${ico("tri")}${f.tri === "note" ? "Note" : "Date"}</button>`;
  $("#active").onclick = (ev) => {
    const r = ev.target.closest("[data-rm]");
    if (r) return setF((x) => { const k = r.dataset.rm; if (x[k] instanceof Set) x[k].delete(r.dataset.v); else x[k] = typeof x[k] === "boolean" ? false : typeof x[k] === "number" ? 0 : ""; });
    if (ev.target.id === "clear") return setF((x) => { const keep = { vue: x.vue, mois: x.mois, tri: x.tri }; Object.assign(x, parseF(""), keep); });
    if (ev.target.closest("#tri")) setF((x) => { x.tri = x.tri === "note" ? "date" : "note"; });
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
    }) + `<div class="legend"><span class="l-nb">Chiffre : notées 3 et +</span><span class="l-pris">Pris</span><span class="l-offre">Offre jeune</span><span class="l-auj">Aujourd’hui</span></div></div>`;
}

/* ---------- Fiche ---------- */
let SHEET_FROM = null, FROM_APP = false;
async function openSheet(id) {
  let e = BYID.get(id);
  if (!e) { try { await loadJournal(); } catch (_) {} e = BYID.get(id); }
  const box = $("#sheetIn");
  box.className = "sheet-in" + (e ? " g-" + famille(e.categorie) : "");
  if (!e) {
    box.innerHTML = `<div class="shtop"><button class="btn ico" type="button" data-close aria-label="Fermer">${ico("fermer")}</button><span class="k"></span></div><h2 id="sheetT" class="mh">Sortie introuvable</h2><p class="empty">Cette fiche n’existe plus ou a changé d’adresse.</p>`;
  } else {
    const vu = e.statut === "vu", L = lieu(e), c = creditsHTML(e);
    box.innerHTML = `<div class="shtop"><button class="btn ico" type="button" data-close aria-label="Fermer">${ico("fermer")}</button><span class="k">${esc([e.categorie, e.sousGenre].filter(Boolean).join(" · "))}${L.nom ? " · " + esc(court(e.lieuId)) : ""}</span><button class="btn ico" type="button" data-share="${esc(e.id)}" aria-label="Partager">${ico("partager")}</button></div>
    <div class="shh"><span class="meta">${esc(vu ? "Vu le " + (e.vuLe || []).map((d) => fmtY(D(d), true)).join(", ") : range(e))}</span><div class="tit">${genreIco(e, "g")}<h2 id="sheetT" class="nom">${esc(e.titre)}</h2></div>
      <div class="ligne">${!vu && e.note ? stars(e.note, e.pronostic) : ""}${vu && e.noteLeonard ? stars(e.noteLeonard, false, "Ma note") : ""}${badges(e)}</div></div>
    ${c ? `<p class="cr">${c}</p>` : ""}
    <dl class="dl"><dt>${ico("lieu")}<span class="vh">Lieu</span></dt><dd class="pl">${e.lieuId && L.nom ? `<a href="#lieu-${esc(e.lieuId)}">${esc(L.nom)}</a>` : "À préciser"}${e.salle ? ", " + esc(e.salle) : ""}${L.ville && L.ville !== "Paris" ? " (" + esc(L.ville) + ")" : ""}</dd>
    ${e.horaires ? `<dt>${ico("horaires")}<span class="vh">Horaires</span></dt><dd>${esc(e.horaires)}</dd>` : ""}
    ${vu ? `<dt>Ma note</dt><dd>${e.noteLeonard ? stars(e.noteLeonard, false, "Ma note") : "pas de note"}</dd>${e.note ? `<dt>Grille</dt><dd>${stars(e.note, false, "Note de la grille")}</dd>` : ""}` : ""}</dl>
    ${vu && e.avis ? `<blockquote>${esc(e.avis)}</blockquote>` : ""}
    ${e.pourquoi ? `<p class="why">${esc(e.pourquoi)}</p>` : ""}
    ${PRIVE && ADMIN ? ADMIN.ficheHTML(e) : ""}
    ${vu ? actsHTML(e, false) : `${(e.offres || []).length || L.tarifJeune ? `<h3 class="sec">Offres</h3>${offresHTML(e)}` : ""}${actsHTML(e, false)}<h3 class="sec">Dates</h3>${ficheCal(e)}`}`;
  }
  const s = $("#sheet");
  if (s.hidden) { SHEET_FROM = document.activeElement; s.hidden = false; document.documentElement.style.overflow = "hidden"; }
  box.scrollTop = 0; box.focus();
  document.title = (e ? e.titre + " – " : "") + "Factotum";
}
function closeSheet() {
  const s = $("#sheet"); if (s.hidden) return;
  s.hidden = true; document.documentElement.style.overflow = ""; document.title = TITRE_VUE || "Factotum";
  if (SHEET_FROM && document.contains(SHEET_FROM)) SHEET_FROM.focus({ preventScroll: true });
}
function requestClose() {
  if (FROM_APP) history.back();
  else { history.replaceState(null, "", "#" + (BASE || "radar")); route(); }
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
  const vivantes = LIVE.filter((e) => !reservee(e));
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
const heureV = (o) => { const h = /T(\d\d):(\d\d)/.exec(o.vente); return h ? (+h[1]) + "h" + (h[2] !== "00" ? h[2] : "") : ""; };
const offreTxt = (o) => esc(o.type) + (o.tarif ? ", " + esc(o.tarif) : "");
const libresTxt = (e) => { const n = soirsLibres(e); return n == null ? "" : n ? plural(n, "soir libre", "soirs libres") : `<b class="warn">aucun soir libre</b>`; };
const stubR = (lbl, d, urg) => `<span class="stub"><small class="fin${urg ? " urg" : ""}">${lbl}</small><b>${d.getDate()}</b><small>${MOIS[d.getMonth()]}</small></span>`;
function rowR(e, pre, stub, info) {
  const k = esc(pre + "-" + e.id), meta = court(e.lieuId);
  return `<article class="row g-${famille(e.categorie)}" data-id="${esc(e.id)}"><button class="rb" type="button" aria-expanded="false" aria-controls="d-${k}">${stub}
  <span class="mid">${l1(e, stars(e.note, e.pronostic))}<span class="tt nom">${esc(e.titre)}</span>${info ? `<span class="art">${info}</span>` : ""}${ligneMeta(esc(meta), badges(e).replace('<span class="b">Dernières dates</span>', "").replace('<span class="bds"></span>', ""))}</span></button>${PRIVE && ADMIN ? ADMIN.heart(e.id) : ""}<div class="det" id="d-${k}" hidden></div></article>`;
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
    h += rowR(e, "s", stubR(jTxt(n), v, n <= 2), [heureV(o) ? "Vente à " + heureV(o) + (o.venteApprox ? " (estimée)" : "") : "Vente" + (o.venteApprox ? " (date estimée)" : ", heure inconnue"), offreTxt(o)].join(" · "));
  }
  return `<div class="list">${h}</div>`;
}
let RF = "suivies"; // filtre des ouvertures suivantes (mémoire seulement)
const suivie = (e) => e.note === 4 || enviesIds().has(e.id);
function blocSuite(r) {
  const L = RF === "tout" ? r.suite : r.suite.filter((x) => suivie(x.e));
  let h = "", last = "";
  for (const { e, o, v } of L) {
    const m = v.getFullYear() * 12 + v.getMonth();
    if (m !== last) { h += `<li class="vm">${cap(MOIS_L[v.getMonth()])} ${v.getFullYear()}</li>`; last = m; }
    h += `<li><a href="#sortie-${esc(e.id)}"><span class="vd">${esc(venteTxt(o))}</span><span class="vt"><b>${esc(e.titre)}</b> <span>· ${offreTxt(o)}</span></span>${stars(e.note, e.pronostic)}</a></li>`;
  }
  return h ? `<ul class="vl">${h}</ul>` : `<p class="empty">${RF === "tout" ? "Aucune autre ouverture connue." : "Aucune ouverture suivie plus tard : essaie « Toutes »."}</p>`;
}
function renderRadar() {
  const r = radar(), adm = PRIVE && ADMIN;
  const nC = adm ? (PRIVE.aCompleter || []).length : 0;
  const go = (id, n, t) => `<button class="chip" type="button" data-rgo="${id}">${(n + " " + t).trim()}</button>`;
  const nSuivies = r.suite.filter((x) => suivie(x.e)).length;
  $("#main").innerHTML = `<section id="radar"><div class="ph"><h1>Radar</h1></div>
  <nav class="chips wrap-ok r-res" aria-label="Résumé du radar">${go("r-semaine", r.semaine.length, r.semaine.length > 1 ? "ventes cette semaine" : "vente cette semaine")}${go("r-reserver", r.aReserver.length, "à réserver")}${go("r-chances", r.chances.length, r.chances.length > 1 ? "dernières chances" : "dernière chance")}${go("r-liens", "", "Billetteries")}</nav>
  ${nC ? `<div class="msg">${plural(nC, "billet")} à compléter <a href="#admin?v=rapide">Traiter</a></div>` : ""}
  <div class="r-g"><div class="r-col">
    <section class="r-b r-reserver" id="r-reserver"><h2 class="mh">À réserver <small>notées 4</small></h2>
      ${r.aReserver.length ? `<div class="list">${r.aReserver.map((x) => rowR(x.e, "r", stubReserver(x), infoReserver(x))).join("")}</div>` : `<p class="empty">Tous les incontournables sont réservés.</p>`}</section>
    <section class="r-b r-chances" id="r-chances"><h2 class="mh">Dernières chances <small>notées 3 et +</small></h2>
      ${r.chances.length ? `<div class="list">${r.chances.map((e) => rowR(e, "c", stubR("fin", finDe(e), dansJ(finDe(e)) <= 7), [`Jusqu’au ${fmt(finDe(e), true)}`, libresTxt(e)].filter(Boolean).join(" · "))).join("")}</div>` : `<p class="empty">Rien de noté 3 ou plus ne s’arrête dans les ${R_FIN} jours.</p>`}</section>
  </div><div class="r-col r-lat2">
    <section class="r-b r-semaine" id="r-semaine"><h2 class="mh">Cette semaine</h2>${blocSemaine(r)}</section>
    <section class="r-b r-suite" id="r-suite"><h2 class="mh">Ouvertures suivantes</h2>
      <div class="seg" role="group" aria-label="Ouvertures affichées"><button type="button" data-rf="suivies" aria-pressed="${RF === "suivies"}" title="Notées 4 ou en envie">Suivies (${nSuivies})</button><button type="button" data-rf="tout" aria-pressed="${RF === "tout"}">Toutes (${r.suite.length})</button></div>
      <div id="rSuite">${blocSuite(r)}</div></section>
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
function radarLateral(r) {
  const sem = r.semaine.map(({ e, o, v }) => `<li><a href="#sortie-${esc(e.id)}"><span class="vd">${jTxt(dansJ(v))}${heureV(o) ? " " + heureV(o) : ""}</span><span class="vt"><b>${esc(e.titre)}</b> <span>· ${esc(o.type)}</span></span></a></li>`).join("");
  const res = r.aReserver.slice(0, 5).map((x) => {
    const f = finDe(x.e), j = (x.rang === 0 || x.rang === 3) && x.o ? "vente " + fmt(venteDate(x.o)) : x.rang === 4 ? "complet" : x.rang === 1 ? "fin " + fmt(f) : "en vente";
    return `<li><a href="#sortie-${esc(x.e.id)}"><span class="vd">${esc(j)}</span><span class="vt"><b>${esc(x.e.titre)}</b> <span>· ${esc(court(x.e.lieuId))}</span></span></a></li>`;
  }).join("");
  return `<aside class="r-lat" aria-label="Radar"><h2 class="mh">Cette semaine</h2>${sem ? `<ul class="vl">${sem}</ul>` : '<p class="cr">Aucune ouverture dans les 7 jours.</p>'}
  <h2 class="mh">À réserver <small>${r.aReserver.length}</small></h2>${res ? `<ul class="vl">${res}</ul>` : '<p class="cr">Tous les incontournables sont réservés.</p>'}
  <div class="acts"><a class="btn" href="#radar">Tout le Radar</a></div></aside>`;
}

/* ---------- Journal ---------- */
const saisonCourt = (cle) => saisonDe(new Date(+cle, 9, 1)).court, saisonLib = (cle) => "Saison " + saisonCourt(cle);
let JQ = ""; // recherche du journal (mémoire seulement)
function renderJournal(q) {
  const p = new URLSearchParams(q || ""), L = (k) => new Set((p.get(k) || "").split(",").filter(Boolean));
  const f = { cat: L("cat"), sa: L("sa"), mn: L("mn"), tri: p.get("tri") === "note" ? "note" : "date" };
  const all = JOURNAL.filter((e) => (e.vuLe || []).length);
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
  const nAct = f.cat.size + f.sa.size + f.mn.size;
  const accSel = PRIVE && ADMIN ? ADMIN.accSelectHTML(JAVEC) : "";
  const libS = f.sa.size === 1 ? saisonCourt([...f.sa][0]) : f.sa.size ? plural(f.sa.size, "saison") : "Toutes";
  $("#main").innerHTML = `<div class="ph"><h1>Journal</h1></div>
  ${PRIVE && ADMIN ? '<div class="acts acts-haut"><button class="btn pri" type="button" data-adm="journal">+ Entrée au journal</button></div>' : ""}
  <div class="tools">${rech("jq", "Rechercher dans le journal", JQ)}</div>
  <div class="chips" role="group" aria-label="Saison">${chip("sa", "*", "Toutes", !f.sa.size)}${saisons.map((y) => chip("sa", y, saisonCourt(y), f.sa.has(y), saisonLib(y))).join("")}</div>
  <details class="box stats"><summary>${ico("stats")}Statistiques · ${esc(libS)}</summary>${statsHTML(parSaison, !f.sa.size)}</details>
  <div class="fbar"><div class="chips defile" role="group" aria-label="Filtres du journal">${cats.map((c) => chip("cat", slug(c), ico(c) + esc(c)).replace('class="chip"', `class="chip g-${famille(c)}"`)).join("")}<span class="sep" aria-hidden="true"></span>${[4, 3, 2, 1].map((n) => chip("mn", String(n), carres(n), f.mn.has(String(n)), "Ma note " + n)).join("")}${chip("mn", "0", "Sans note")}</div>
  <div class="active"><span class="n" id="jn" aria-live="polite"></span>${nAct ? `<a class="chip effacer" href="#journal${f.tri === "note" ? "?tri=note" : ""}">Tout effacer</a>` : ""}<a class="linkbtn ml tri" href="#journal?${esc(jq(f, "tri", f.tri === "note" ? "date" : "note"))}" aria-label="Tri par ${f.tri === "note" ? "ma note" : "date"}, changer">${ico("tri")}${f.tri === "note" ? "Ma note" : "Date"}</a></div>${accSel}</div>
  <div class="list" id="jlist"></div>`;
  draw();
  $("#jq").oninput = (ev) => { JQ = ev.target.value; draw(); };
  const as = $("#jAvec"); if (as) as.onchange = () => { JAVEC = as.value; renderJournal(q); };
}
function jq(f, g, v) {
  const n = { cat: new Set(f.cat), sa: new Set(f.sa), mn: new Set(f.mn), tri: f.tri };
  if (g === "tri") n.tri = v; else if (v === "*") n[g].clear(); else n[g].has(v) ? n[g].delete(v) : n[g].add(v);
  const p = []; for (const k of ["sa", "cat", "mn"]) if (n[k].size) p.push(k + "=" + [...n[k]].map(encodeURIComponent).join(","));
  if (n.tri === "note") p.push("tri=note");
  return p.join("&");
}
function bars(rows) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return `<div class="bars">${rows.map(([l, n, href, cls]) => `<span class="bl">${href ? `<a href="${href}">${esc(l)}</a>` : esc(l)}</span><span class="bg${cls ? " " + cls : ""}" style="--v:${Math.round((n / max) * 100)}" aria-hidden="true"></span><span class="bn">${n}</span>`).join("")}</div>`;
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
function renderAL(which) {
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
  $("#alq").oninput = (ev) => { ALQ = ev.target.value; draw(); };
  draw();
}
const byStart = (a, b) => sortKey(a) - sortKey(b);
const byVu = (a, b) => (b.vuLe || []).at(-1).localeCompare((a.vuLe || []).at(-1));
function renderArtiste(k) {
  const a = artistes()[k];
  if (!a) { $("#main").innerHTML = `<a class="back" href="#artistes">Artistes et lieux</a><p class="empty">Artiste inconnu.</p>`; return; }
  const aff = a.aff.filter((e) => !ended(e)).sort(byStart), vus = a.vus.slice().sort(byVu);
  $("#main").innerHTML = `<a class="back" href="#artistes">Artistes et lieux</a><div class="ph"><h1>${esc(a.nom)}</h1><p>${esc(cap(ROLES.filter((r) => a.roles.has(r)).join(", ")))} · ${plural(aff.length, "sortie")} à l’affiche, ${plural(vus.length, "vue", "vues")}</p></div>
  <h2 class="mh">À l’affiche</h2><div class="list">${aff.map(rowA).join("") || '<p class="empty">Rien à l’affiche.</p>'}</div>
  <h2 class="mh">Vu</h2><div class="list">${vus.map(rowJ).join("") || '<p class="empty">Pas encore vu.</p>'}</div>`;
  document.title = a.nom + " – Factotum";
}
function renderLieu(id) {
  const L = LIEUX[id];
  if (!L) { $("#main").innerHTML = `<a class="back" href="#lieux">Artistes et lieux</a><p class="empty">Lieu inconnu.</p>`; return; }
  const aff = AFF.filter((e) => e.lieuId === id && e.statut === "a-voir" && !ended(e)).sort(byStart);
  const vus = (JOURNAL || []).filter((e) => e.lieuId === id).sort(byVu);
  const ext = (u, t) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>` : "";
  $("#main").innerHTML = `<a class="back" href="#lieux">Artistes et lieux</a><div class="ph"><h1>${esc(L.nom)}</h1><p>${esc([L.ville, L.zone !== L.ville ? L.zone : ""].filter(Boolean).join(", "))} · lieu ${L.statut === "Public" ? "public" : "privé"}</p></div>
  <dl class="dl inl">${L.tarifJeune ? `<dt>Tarif jeune</dt><dd>${esc(L.tarifJeune)}</dd>` : ""}${L.adresse ? `<dt>Adresse</dt><dd>${esc(L.adresse)}</dd>` : ""}${L.site ? `<dt>Site</dt><dd>${ext(L.site, esc(L.site.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")))}</dd>` : ""}${L.billetterie ? `<dt>Billetterie</dt><dd>${ext(L.billetterie, "Acheter des places")}</dd>` : ""}</dl>
  <h2 class="mh">À l’affiche <small>${aff.length}</small></h2><div class="list">${aff.map(rowA).join("") || '<p class="empty">Rien à l’affiche.</p>'}</div>
  <h2 class="mh">Vu ici <small>${vus.length}</small></h2><div class="list">${vus.map(rowJ).join("") || '<p class="empty">Aucune.</p>'}</div>`;
  document.title = L.nom + " – Factotum";
}

/* ---------- Liens utiles ---------- */
const icsURL = (k) => `webcal://${location.host}${location.pathname.replace(/[^/]*$/, "")}data/${k}-${PRIVE.icsToken}.ics`;
const ORDRE_LIENS = ["Cartes et tarifs jeunes", "Calendriers de vente", "Billetteries", "Outils"];
const hote = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (_) { return ""; } };
// Liens rangés par rubrique, dans l’ordre du fichier à l’intérieur de chaque rubrique.
const liensParRubrique = (L) => ORDRE_LIENS.map((c) => [c, L.filter((l) => l.categorie === c)]);
/* ---------- Envies (publiques) ---------- */
function renderCoeur() {
  const E = enviesIds();
  const items = AFF.filter((e) => e.statut === "a-voir" && !ended(e) && E.has(e.id)).sort((a, b) => sortKey(a) - sortKey(b) || a.titre.localeCompare(b.titre, "fr"));
  let html = "", last = null;
  for (const e of items) { const g = groupOf(e); if (g !== last) { html += `<h2 class="jour">${g}</h2>`; last = g; } html += rowA(e); }
  $("#main").innerHTML = `<div class="ph"><h1>Envies</h1><p>${plural(items.length, "sortie")}</p></div>
  <div class="list">${html || `<p class="empty">Aucune envie.</p>`}</div>`;
}
// Billetteries, cartes jeunes et calendriers de vente : section du Radar (l’ancienne page Liens, #liens y mène).
function liensHTML() {
  const groups = liensParRubrique(LIENS).filter(([, l]) => l.length);
  const item = (x) => `<li data-q="${esc(norm(x.titre + " " + hote(x.url) + " " + (x.note || "")))}"><a href="${esc(x.url)}" target="_blank" rel="noopener"><span class="lt"><b>${esc(x.titre)}</b><small>${esc(hote(x.url))}${x.note ? " · " + esc(x.note) : ""}</small></span><span class="vh"> (nouvel onglet)</span></a></li>`;
  const section = ([c, l]) => `<section class="lks" id="lk-${slug(c)}"><h3 class="sec">${esc(c)} <small>${l.length}</small></h3><ul class="lk${l.length > 6 ? " lk2" : ""}">${l.map(item).join("")}</ul></section>`;
  return `<div class="tools">${rech("lkq", "Rechercher un lien")}</div>
  <nav class="chips" aria-label="Rubriques" id="lkNav">${groups.map(([c]) => `<button class="chip" type="button" data-lkgo="lk-${slug(c)}">${esc(c)}</button>`).join("")}</nav>
  ${groups.map(section).join("")}<p class="empty" id="lkvide" hidden>Aucun lien ne correspond.</p>`;
}
function brancherLiensRecherche() {
  $("#lkNav").onclick = (ev) => { const b = ev.target.closest("[data-lkgo]"); if (b) document.getElementById(b.dataset.lkgo).scrollIntoView({ block: "start" }); };
  $("#lkq").oninput = (ev) => {
    const q = norm(ev.target.value).trim(); let n = 0;
    $$("#main .lks").forEach((sec) => {
      const lis = $$("li[data-q]", sec);
      let v = 0; lis.forEach((li) => { const ok = !q || li.dataset.q.includes(q); li.hidden = !ok; v += ok; });
      sec.hidden = !v; n += v;
    });
    $("#lkvide").hidden = !q || n > 0;
  };
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
  const s = document.createElement("script"); s.src = "assets/admin.js?v=4.13"; s.onload = () => ok(); s.onerror = () => { adP = null; s.remove(); ko(new Error("admin")); };
  document.head.appendChild(s);
}));
async function renderAdmin(q) {
  if (!ADMIN) { $("#main").innerHTML = '<p class="load">Chargement…</p>'; try { await loadAdmin(); } catch (_) { $("#main").innerHTML = '<p class="empty">Impossible de charger le mode admin. Vérifie la connexion puis recharge.</p>'; return; } }
  return ADMIN.render(q);
}

/* ---------- Routeur ---------- */
const TABS = { radar: "radar", affiche: "affiche", coeur: "coeur", journal: "journal", artistes: "artistes", lieux: "artistes", artiste: "artistes", lieu: "artistes", liens: "radar", admin: "admin" };
let BASE = null, RENDERED = null;
function setTab(t) {
  $$(".tab").forEach((b, i) => { const on = b.dataset.tab === t; b.setAttribute("aria-selected", String(on)); b.tabIndex = on || (!t && i === 0) ? 0 : -1; });
  if (t) $("#main").setAttribute("aria-labelledby", "t-" + t);
}
/* Page #charte : référence de la charte Factotum (assets/charte.js, chargé à la demande, non liée dans la navigation). */
let chP = null;
const loadCharte = () => chP || (chP = new Promise((ok, ko) => {
  const s = document.createElement("script"); s.src = "assets/charte.js?v=4.13"; s.onload = () => ok(); s.onerror = () => { chP = null; s.remove(); ko(new Error("charte")); };
  document.head.appendChild(s);
}));
function modeCharte(on) { $("#top").hidden = on; document.documentElement.classList.toggle("charte", on); }
const TITRES = { radar: "", affiche: "À l’affiche", coeur: "Envies", journal: "Journal", artistes: "Artistes et lieux", lieux: "Artistes et lieux", admin: "Admin" };
let TITRE_VUE = "Factotum";
async function renderView(h) {
  const [path, q = ""] = h.split("?");
  if (path === "charte") {
    modeCharte(true); setTab(null);
    try { await loadCharte(); } catch (_) { $("#main").innerHTML = '<p class="empty">Impossible de charger la charte. Vérifie la connexion puis recharge.</p>'; return; }
    window.CHARTE.render($("#main"), { esc, cleF, saisonTxt, saisonDe, themeBouton, ico, ICONES: ICO, CATS, famille });
    document.title = TITRE_VUE = "Charte – Factotum"; RENDERED = h; window.scrollTo(0, 0); return;
  }
  modeCharte(false);
  const view = path.startsWith("artiste-") ? "artiste" : path.startsWith("lieu-") ? "lieu" : path === "liens" ? "radar" : TABS[path] ? path : "radar";
  const samePath = RENDERED && RENDERED.split("?")[0] === path;
  const focusK = samePath && document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.k : null;
  setTab(TABS[view]);
  document.title = TITRE_VUE = TITRES[view] ? TITRES[view] + " – Factotum" : "Factotum";
  try {
    if (["journal", "artistes", "lieux", "artiste", "lieu"].includes(view) && !JOURNAL) { if (!samePath) $("#main").innerHTML = '<p class="load">Chargement…</p>'; await loadJournal(); }
  } catch (_) { $("#main").innerHTML = '<p class="empty">Impossible de charger ces données. Vérifie la connexion puis recharge.</p>'; return; }
  if (view === "radar") { if (!LIENS) { if (!samePath) $("#main").innerHTML = '<p class="load">Chargement…</p>'; await loadLiens().catch(() => {}); } renderRadar(); }
  else if (view === "affiche") renderAffiche(q);
  else if (view === "journal") renderJournal(q);
  else if (view === "artistes" || view === "lieux") renderAL(view);
  else if (view === "artiste") renderArtiste(decodeURIComponent(path.slice(8)));
  else if (view === "lieu") renderLieu(decodeURIComponent(path.slice(5)));
  else if (view === "coeur") renderCoeur();
  else if (view === "admin") await renderAdmin(q);
  RENDERED = h;
  if (path === "liens") { const l = $("#r-liens"); if (l) l.scrollIntoView({ block: "start" }); }
  else if (!samePath) window.scrollTo(0, 0);
  else if (focusK) { const el = $(`[data-k="${focusK}"]`); if (el) el.focus({ preventScroll: true }); }
}
const LEGACY = { calendrier: "affiche?vue=mois", vus: "journal", prive: "admin", ventes: "radar", catalogue: "affiche" };
async function route() {
  let h = location.hash.slice(1);
  if (h.startsWith("fiche-")) { history.replaceState(null, "", "#sortie-" + h.slice(6)); h = "sortie-" + h.slice(6); }
  else if (h.startsWith("vue-")) { h = LEGACY[h.slice(4)] || "affiche"; history.replaceState(null, "", "#" + h); }
  if (!h) h = "radar";
  if (h.startsWith("sortie-")) {
    FROM_APP = BASE !== null;
    if (BASE === null) BASE = "radar";
    if (RENDERED === null) await renderView(BASE);
    return openSheet(decodeURIComponent(h.slice(7)));
  }
  const wasOpen = !$("#sheet").hidden;
  closeSheet();
  BASE = h;
  if (wasOpen && RENDERED === h) return;
  await renderView(h);
}
window.addEventListener("hashchange", route);

/* ---------- Événements globaux ---------- */
$$(".tab").forEach((b) => {
  b.onclick = () => {
    const t = b.dataset.tab;
    const target = t === "affiche" ? LAST_AFF : t;
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
    if (open && !det.innerHTML) { det.innerHTML = detHTML(BYID.get(row.dataset.id)); const jf = det.querySelector("form.jin"); if (jf && ADMIN) ADMIN.brancherJournal(jf); }
    det.hidden = !open; row.classList.toggle("open", open); rb.setAttribute("aria-expanded", String(open));
    return;
  }
  const sh = ev.target.closest("[data-share]");
  if (sh) {
    const e = BYID.get(sh.dataset.share), url = shareURL(sh.dataset.share);
    try { if (navigator.share) { await navigator.share({ title: e ? e.titre : "Factotum", text: e ? `${e.titre}, ${court(e.lieuId)} : la fiche et les soirs où ${OWNER} est libre.` : "", url }); return; } } catch (err) { if (err && err.name === "AbortError") return; }
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
$("#saison").textContent = saisonTxt();
themePose(themeLu()); lockIcon();
document.addEventListener("keydown", (ev) => { const m = $(".tmenu"); if (ev.key === "Escape" && m) { const b = m.parentElement.querySelector("[data-theme-btn]"); themeFerme(); b.focus(); } });
if ("IntersectionObserver" in window) new IntersectionObserver(([x]) => document.body.classList.toggle("compact", !x.isIntersecting)).observe($("#top"));

/* ---------- Démarrage ---------- */
(async () => {
  try {
    const [a, l, d, ev] = await Promise.all([getJSON("data/affiche.json"), getJSON("data/lieux.json"), getJSON("data/dispo.json").catch(() => ({})), getJSON("data/envies.json").catch(() => ({}))]);
    ENVIES_PUB = Array.isArray(ev.ids) ? ev.ids : [];
    applyData({ affiche: a, lieux: l, dispo: d });
    await route();
    if (sessionVive()) loadAdmin().then(() => ADMIN.restaurer()).catch(() => {});
  } catch (err) {
    console.error(err);
    $("#main").innerHTML = '<p class="empty">Impossible de charger la saison. Vérifie la connexion puis recharge la page.</p>';
  }
})();
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost"))
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
