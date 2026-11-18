// node tools/partage.mjs <dossier du site>   (appelé par l'action « Publier le site », après la copie dans _site)
// Génère <dossier>/p/ : une petite page par fiche (affiche, journal, archive), rapport de veille, artiste, lieu, et pour les
// coups de cœur, avec titre, description et image de partage (Open Graph, Twitter) ; elle renvoie aussitôt vers la page du site.
// Les aperçus de lien (messageries, réseaux) ignorent la partie « #… » des adresses : sans ces pages, tout lien partagé
// montrerait l'aperçu générique du site. Rien de privé : uniquement des champs publics des fichiers publics.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const dest = process.argv[2];
if (!dest) { console.error("Usage : node tools/partage.mjs <dossier du site>"); process.exit(1); }
const lire = (f, def) => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : def);
const affiche = lire("data/affiche.json", { sorties: [] }).sorties;
const journal = lire("data/journal.json", { sorties: [] }).sorties;
const archive = lire("data/archive.json", { sorties: [] }).sorties;
const lieux = lire("data/lieux.json", {});
const rapports = lire("data/radar.json", { rapports: [] }).rapports || [];
const artistes = lire("data/index-artistes.json", {});
const BASE = (/<meta property="og:url" content="([^"]+)"/.exec(readFileSync("index.html", "utf8")) || [])[1] || "https://factotumdellacitta.github.io/saison/";

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const D = (s) => { const [y, m, j] = String(s).split("-").map(Number); return new Date(Date.UTC(y, m - 1, j)); };
const jj = (d) => d.getUTCDate() + (d.getUTCDate() === 1 ? "er" : "");
const fmtY = (d) => `${jj(d)} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const dates = (e) => {
  if (e.datesTexte) return e.datesTexte;
  if (!e.debut) return "";
  const a = D(e.debut), b = D(e.fin || e.debut);
  if (+a === +b) return fmtY(a);
  return a.getUTCFullYear() === b.getUTCFullYear() ? `${jj(a)} ${MOIS[a.getUTCMonth()]} – ${fmtY(b)}` : `${fmtY(a)} – ${fmtY(b)}`;
};
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const coupe = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s);
const court = (id) => (lieux[id] && lieux[id].nom) || "";
const estExpo = (e) => e.categorie === "Exposition";
const noms = (e, n = 3) => [...new Set((e.artistes || []).map((a) => a.nom))].slice(0, n).join(", ");
const note = (n) => (n ? `Note ${n}/4` : "");

function page({ fichier, titre, titreCourt, description, cible, expo, type = "article" }) {
  const site = expo ? "Factotum Expo" : "Factotum";
  const image = BASE + (expo ? "assets/expo/og.png" : "assets/og.png");
  const url = BASE + "p/" + fichier, vers = BASE + cible;
  const t = `${titre} – ${site}`, d = coupe(description.replace(/\s+/g, " ").trim(), 220);
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${esc(BASE)}; style-src 'none'">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex">
<title>${esc(t)}</title>
<meta name="description" content="${esc(d)}">
<link rel="canonical" href="${esc(vers)}">
<meta property="og:type" content="${type}">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="${site}">
<meta property="og:title" content="${esc(titreCourt || titre)}">
<meta property="og:description" content="${esc(d)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${site} : la clé F et le nom en blanc sur un aplat ${expo ? "vert" : "rouge"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titreCourt || titre)}">
<meta name="twitter:description" content="${esc(d)}">
<meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="0;url=${esc(vers)}">
</head>
<body><p><a href="${esc(vers)}">${esc(t)}</a></p></body>
</html>
`;
}

const pages = [];
// Fiches : à l'affiche, au journal (vues), à l'archive (liens déjà partagés).
for (const e of [...affiche, ...archive]) {
  if (e.statut === "ecarte") continue;
  const x = estExpo(e), l = court(e.lieuId);
  const desc = [[e.categorie === "Exposition" ? e.sousGenre || "Exposition" : e.categorie, l, dates(e)].filter(Boolean).join(" · "), [note(e.note), noms(e)].filter(Boolean).join(" · "), e.pourquoi || ""].filter(Boolean).join(". ");
  pages.push({ fichier: `${e.id}.html`, titre: e.titre, titreCourt: l ? `${e.titre} – ${l}` : e.titre, description: desc, cible: (x ? "expo/" : "") + "#sortie-" + e.id, expo: x });
}
for (const e of journal) {
  const x = estExpo(e), l = court(e.lieuId), vu = (e.vuLe || []).map((k) => fmtY(D(k))).join(", ");
  const desc = [[e.categorie, l].filter(Boolean).join(" · "), vu ? `Vu le ${vu}` : "", noms(e), e.avis ? `«\u00a0${e.avis}\u00a0»` : ""].filter(Boolean).join(". ");
  pages.push({ fichier: `${e.id}.html`, titre: e.titre, titreCourt: l ? `${e.titre} – ${l}` : e.titre, description: desc, cible: (x ? "expo/" : "") + "#sortie-" + e.id, expo: x });
}
// Rapports de veille.
for (const r of rapports) pages.push({ fichier: `rapport-${r.id}.html`, titre: r.titre, description: [`Rapport de veille du ${fmtY(D(r.date))}`, r.chapo || ""].filter(Boolean).join(". "), cible: "#rapport-" + r.id });
// Artistes et lieux.
const vivantes = affiche.filter((e) => e.statut === "a-voir");
for (const [k, a] of Object.entries(artistes)) {
  const ids = new Set(a.sorties || []), aff = vivantes.filter((e) => ids.has(e.id)), vus = journal.filter((e) => ids.has(e.id));
  const t = aff.slice(0, 3).map((e) => e.titre).join(", ");
  pages.push({ fichier: `artiste-${k}.html`, titre: a.nom, type: "profile", description: [`${aff.length} sortie${aff.length > 1 ? "s" : ""} à l’affiche, ${vus.length} vue${vus.length > 1 ? "s" : ""}`, t].filter(Boolean).join(" : "), cible: "#artiste-" + k });
}
for (const [id, L] of Object.entries(lieux)) {
  const aff = vivantes.filter((e) => e.lieuId === id), t = aff.slice(0, 3).map((e) => e.titre).join(", ");
  pages.push({ fichier: `lieu-${id}.html`, titre: L.nom, type: "place", description: [[L.ville, L.adresse].filter(Boolean).join(" · "), `${aff.length} sortie${aff.length > 1 ? "s" : ""} à l’affiche${t ? " : " + t : ""}`].filter(Boolean).join(". "), cible: "#lieu-" + id });
}
// Coups de cœur (les deux sites).
pages.push({ fichier: "coeur.html", titre: "Coups de cœur de Léonard", type: "website", description: "Les spectacles que Léonard aimerait aller voir cette saison.", cible: "#coeur" });
pages.push({ fichier: "coeur-expo.html", titre: "Coups de cœur de Léonard", type: "website", description: "Les expositions que Léonard aimerait aller voir.", cible: "expo/#coeur", expo: true });
pages.push({ fichier: "ventes.html", titre: "Ouvertures de vente", type: "website", description: "Toutes les ouvertures de vente à venir des spectacles et concerts notés par Factotum.", cible: "#ventes" });

mkdirSync(join(dest, "p"), { recursive: true });
for (const p of pages) if (/^[a-z0-9-]+\.html$/.test(p.fichier)) writeFileSync(join(dest, "p", p.fichier), page(p));
console.log(`Pages de partage : ${pages.length}.`);
