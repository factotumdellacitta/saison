// node tools/check.mjs  –  bloque la publication si les données sont incohérentes ou si une donnée privée fuit.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { verifierContrastes } from "./contrast.mjs";

const erreurs = [];
const warn = [];
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const VENTE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;
const URL_RE = /^https?:\/\/[^\s]+$/;
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CATEGORIES = ["Théâtre", "Opéra", "Danse", "Comédie musicale", "Humour", "Récital", "Concert", "Festival", "Exposition", "Cinéma", "Événement", "Sur scène", "Autre"];
const ROLES = ["auteur", "compositeur", "mise en scène", "chorégraphie", "direction musicale", "interprète", "commissaire", "réalisation", "compagnie", "artiste"];
const ZONES = ["Paris", "Petite couronne", "Île-de-France", "Avignon", "Autre"];
const STATUTS_LIEU = ["Public", "Privé"];
const ETATS = ["dernieres-places", "attente", "complet"];
// Expositions (bloc « expo » d'une sortie de catégorie Exposition) : mêmes listes que dans assets/app.js.
const EXPO_TYPES = ["musee", "fondation", "galerie"];
const EXPO_JEUNES = ["gratuit-ue-18-25", "gratuit", "reduit"];
const JOURS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
// Barème (CLAUDE.md) : "C1 N3 H2 +Chef-d’œuvre" ; même lecture que calculDe() dans assets/app.js.
function calculDe(t) {
  const m = /^C([0-2]) N([0-3]) H([0-2])((?: \+(?:Chef-d’œuvre|Distinction))*)$/.exec(String(t || "").trim());
  if (!m) return null;
  const socle = { C: +m[1], N: +m[2], H: +m[3] }, bonus = m[4].trim().split(" ").filter(Boolean).map((x) => x.slice(1));
  if (new Set(bonus).size !== bonus.length) return null;
  const total = socle.C + socle.N + socle.H + bonus.length;
  return { socle, bonus, total, note: total >= 7 ? 4 : total >= 5 ? 3 : total >= 2 ? 2 : total >= 1 ? 1 : 0 };
}
// Clés interdites dans tout fichier public (données privées)
const PRIVEES = new Set(["prix", "accompagnants", "places", "siege", "heure", "reserveLe", "icsToken",
  "tarifPlein", "prixPlace", "pleinPlace", "billets", "categoriePlace", "spectateur", "paiement", "envies", "journalPrive", "aCompleter", "priorite", "blocages", "soirs", "motif", "jeton", "token"]);

const lire = (f) => {
  try { return JSON.parse(readFileSync(f, "utf8")); } catch (e) { erreurs.push(`${f} illisible : ${e.message}`); return null; }
};

// ---------- Fichiers en clair et zone privée ----------
for (const f of ["_prive.json", "data/_prive.json", "_setup/prive-initial.json"]) {
  if (existsSync(f)) erreurs.push(`${f} est en clair : lance « node tools/prive.mjs fermer » avant de publier.`);
}
if (!existsSync("data/prive.enc")) erreurs.push("data/prive.enc manquant.");
else {
  const p = lire("data/prive.enc");
  if (p && !(p.ct && p.iv && p.salt && p.kdf)) erreurs.push("data/prive.enc n'a pas la forme d'un fichier chiffré.");
  if (p && Object.keys(p).some((k) => !["v", "kdf", "iter", "salt", "iv", "ct"].includes(k))) erreurs.push("data/prive.enc contient des champs en clair.");
}
// Fichiers chiffrés : rien d'autre que le paquet (aucun champ en clair).
if (existsSync("data/calendrier.enc")) {
  const p = lire("data/calendrier.enc");
  if (p && (!(p.ct && p.iv && p.salt && p.kdf) || Object.keys(p).some((k) => !["v", "kdf", "iter", "salt", "iv", "ct"].includes(k)))) erreurs.push("data/calendrier.enc n'a pas la forme d'un fichier chiffré.");
}
// Le dépôt est public : les flux .ics (prix, accompagnants) ne sont jamais versionnés, ils sont générés à la publication.
try {
  const suivis = execSync("git ls-files", { encoding: "utf8" }).split("\n");
  for (const f of suivis) if (/\.(ics|pdf|pkpass)$/i.test(f) || /(^|\/)_prive\.json$/.test(f)) erreurs.push(`${f} est suivi par git dans un dépôt public : « git rm --cached ${f} ».`);
} catch (_) { /* hors d'un dépôt git : rien à vérifier */ }
if (existsSync("data/spectacles.json")) erreurs.push("data/spectacles.json ne doit plus exister (remplacé par affiche.json et journal.json).");

// ---------- Fichiers publics : aucune clé privée ----------
const PUBLICS_ATTENDUS = new Set(["affiche.json", "journal.json", "lieux.json", "liens.json", "dispo.json", "index-artistes.json", "index-lieux.json", "envies.json", "deja-vu.json", "archive.json", "radar.json", "radar.atom", "versions.json", "prive.enc", "calendrier.enc"]);
function fouille(o, chemin, f) {
  if (Array.isArray(o)) o.forEach((v, i) => fouille(v, `${chemin}[${i}]`, f));
  else if (o && typeof o === "object")
    for (const [k, v] of Object.entries(o)) {
      if (PRIVEES.has(k)) erreurs.push(`DONNÉE PRIVÉE dans ${f} : clé « ${k} » en ${chemin || "racine"}.`);
      fouille(v, chemin ? `${chemin}.${k}` : k, f);
    }
}
for (const f of readdirSync("data")) {
  if (f.endsWith(".ics")) {
    if (!/^(agenda|ventes)-[a-f0-9]{16,}\.ics$/.test(f)) erreurs.push(`data/${f} : flux au nom devinable ou inattendu.`);
    continue;
  }
  if (!PUBLICS_ATTENDUS.has(f)) { erreurs.push(`data/${f} : fichier inattendu dans le dossier publié.`); continue; }
  if (f.endsWith(".enc") || f.endsWith(".atom")) continue;
  const o = lire(`data/${f}`);
  if (o) fouille(o, "", `data/${f}`);
}

// Envies publiques : identifiants seuls, rien d'autre
if (existsSync("data/envies.json")) {
  const e = lire("data/envies.json");
  if (e && (Object.keys(e).join() !== "ids" || !Array.isArray(e.ids) || e.ids.some((x) => typeof x !== "string"))) erreurs.push("data/envies.json : seule une liste « ids » d'identifiants est permise.");
}

// ---------- Jetons et secrets : jamais dans un fichier publié ----------
const SECRET = /\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/;
const publies = ["index.html", "sw.js", ...["assets", "data", "expo"].flatMap((d) => existsSync(d) ? readdirSync(d).map((f) => `${d}/${f}`) : [])].filter((f) => statSync(f).isFile());
for (const f of publies) {
  if (!/\.(html|js|json|enc|ics|atom|webmanifest|svg|txt|md)$/.test(f)) continue;
  if (SECRET.test(readFileSync(f, "utf8"))) erreurs.push(`${f} contient ce qui ressemble à un jeton GitHub : retire-le et révoque le jeton.`);
}

// ---------- Charte Factotum : typographie et feuille de style ----------
// Fichiers publiés, sous-dossiers compris (assets/fonts…)
const arbo = (d) => readdirSync(d).flatMap((f) => statSync(`${d}/${f}`).isDirectory() ? arbo(`${d}/${f}`) : [`${d}/${f}`]);
const textes = ["index.html", "sw.js", ...["assets", "data", "expo"].flatMap((d) => existsSync(d) ? arbo(d) : [])].filter((f) => /\.(html|js|css|json|ics|atom|webmanifest|svg|txt|md)$/.test(f));
for (const f of textes) {
  const t = readFileSync(f, "utf8");
  t.split("\n").forEach((l, i) => {
    if (l.includes("—")) erreurs.push(`${f}:${i + 1} contient un tiret cadratin (—) : utilise « – » ou une virgule.`);
    if (l.includes(" ")) erreurs.push(`${f}:${i + 1} contient une espace fine insécable : utilise une espace insécable normale.`);
  });
}
// Feuilles : aucune couleur ni taille de police en dur hors des jetons, rien de la liste des interdits.
// (La feuille <style id="ancien"> d'index.html est l'ancienne charte, retirée quand Factotum s'applique à tout le site.)
const feuilles = [...textes.filter((f) => f.endsWith(".css")).map((f) => [f, readFileSync(f, "utf8")]),
  ...[...readFileSync("index.html", "utf8").matchAll(/<style(?![^>]*id="ancien")[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ["index.html <style>", m[1]])];
for (const [f, css] of feuilles) {
  const decl = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@font-face\s*\{[^}]*\}/g, "")
    .split(/[;{}]/).map((d) => d.trim()).filter((d) => /^[a-z][a-z-]*\s*:/.test(d));
  for (const d of decl) {
    const [prop, ...v] = d.split(":"), val = v.join(":");
    if (/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklch|color-mix)\(|\b(white|black|red|blue|purple|indigo|violet|slateblue|gray|grey)\b/i.test(val)) erreurs.push(`${f} : couleur en dur hors des jetons (${d}).`);
    if (/^font(-size)?$/.test(prop.trim()) && /\d(px|pt|rem|em)\b/.test(val) && !/var\(--t-/.test(val)) erreurs.push(`${f} : taille de police en dur hors des jetons (${d}).`);
    if (/^border(-[a-z-]+)?-radius$/.test(prop.trim()) && val.match(/(\d+(\.\d+)?)px/g)?.some((x) => parseFloat(x) > 2)) erreurs.push(`${f} : angle arrondi au-delà de 2 px (${d}).`);
    if (/^(box-shadow|text-shadow|backdrop-filter)$/.test(prop.trim()) || /\bblur\(|(?<!repeating-)linear-gradient|radial-gradient|conic-gradient/.test(val)) erreurs.push(`${f} : effet interdit par la charte (${d}).`);
    if (/\b(Inter|Roboto|Poppins|Montserrat|Space Grotesk|system-ui|-apple-system|Segoe UI)\b/.test(val)) erreurs.push(`${f} : police interdite par la charte (${d}).`);
  }
}
if (existsSync("assets/factotum.css")) erreurs.push(...verifierContrastes("assets/factotum.css").erreurs);

// ---------- Lieux ----------
const lieux = lire("data/lieux.json") || {};
for (const [id, l] of Object.entries(lieux)) {
  const ou = `lieux[${id}]`;
  if (!ID.test(id)) erreurs.push(`${ou} identifiant invalide (minuscules, chiffres, tirets).`);
  if (!l.nom) erreurs.push(`${ou} nom manquant.`);
  if (!ZONES.includes(l.zone)) erreurs.push(`${ou} zone inconnue : ${l.zone}.`);
  if (!STATUTS_LIEU.includes(l.statut)) erreurs.push(`${ou} statut inconnu : ${l.statut}.`);
  for (const k of ["site", "billetterie"]) if (l[k] != null && !URL_RE.test(l[k])) erreurs.push(`${ou} ${k} n'est pas une URL.`);
  if (!l.ville) warn.push(`${ou} ville manquante.`);
}

// ---------- Sorties ----------
const ids = new Map();
let sansCalcul = 0;
const verifierSortie = (s, fichier) => {
  const ou = `[${s.id}]`;
  if (!s.id || !ID.test(s.id)) erreurs.push(`${ou} id invalide (minuscules, chiffres, tirets).`);
  // Archive : un id y reste réservé, mais une collision n'est qu'un avertissement (le mode admin du site ne lit pas l'archive).
  if (ids.has(s.id)) (fichier === "archive" || ids.get(s.id) === "archive" ? warn : erreurs).push(`${ou} id en double (${ids.get(s.id)} et ${fichier}).`);
  if (!(fichier === "archive" && ids.has(s.id))) ids.set(s.id, fichier);
  if ("nouveau" in s && typeof s.nouveau !== "boolean") erreurs.push(`${ou} nouveau doit être true ou false.`);
  if ("nouveau" in s && fichier !== "affiche") erreurs.push(`${ou} nouveau n'a de sens qu'à l'affiche.`);
  if ("source" in s && s.source !== "" && !URL_RE.test(s.source)) erreurs.push(`${ou} source n'est pas une URL.`);
  if (!s.titre) erreurs.push(`${ou} titre manquant.`);
  if (!CATEGORIES.includes(s.categorie)) erreurs.push(`${ou} catégorie inconnue : ${s.categorie}.`);
  if ("genre" in s || "credits" in s || "lieu" in s) erreurs.push(`${ou} ancien champ (genre, credits ou lieu) : utiliser categorie, artistes, lieuId.`);
  if (!Array.isArray(s.artistes)) erreurs.push(`${ou} artistes doit être une liste.`);
  else for (const a of s.artistes) {
    if (!a || !a.nom) erreurs.push(`${ou} artiste sans nom.`);
    else if (!ROLES.includes(a.role)) erreurs.push(`${ou} rôle inconnu pour ${a.nom} : ${a.role}.`);
  }
  if (s.lieuId == null) {
    if (fichier === "affiche") erreurs.push(`${ou} lieuId manquant.`);
    else warn.push(`${ou} lieu inconnu (lieuId null).`);
  } else if (!lieux[s.lieuId]) erreurs.push(`${ou} lieuId absent de lieux.json : ${s.lieuId}.`);
  if (!(Number.isInteger(s.note) && s.note >= 0 && s.note <= 4)) erreurs.push(`${ou} note hors de 0–4.`);
  if (typeof s.pronostic !== "boolean") erreurs.push(`${ou} pronostic doit être true ou false.`);
  if ("calcul" in s) {
    const k = calculDe(s.calcul);
    if (!k) erreurs.push(`${ou} calcul illisible : « ${s.calcul} » (ex. C1 N3 H2 +Chef-d’œuvre).`);
    else {
      if (s.pronostic && (k.socle.C > 1 || k.bonus.includes("Distinction"))) erreurs.push(`${ou} pronostic : critique 1 au plus et pas de Distinction.`);
      if (fichier === "affiche" && k.note !== s.note && !(s.note === 3 && k.note === 4)) warn.push(`${ou} note ${s.note} mais calcul ${s.calcul} = ${k.total} (note ${k.note}).`);
    }
  } else if (fichier === "affiche" && s.statut === "a-voir") sansCalcul++;
  if (typeof s.publicJeune !== "boolean") erreurs.push(`${ou} publicJeune doit être true ou false.`);
  if (typeof s.leonardYVa !== "boolean") erreurs.push(`${ou} leonardYVa doit être true ou false.`);
  for (const k of ["debut", "fin"]) if (s[k] && !ISO.test(s[k])) erreurs.push(`${ou} ${k} n'est pas au format AAAA-MM-JJ.`);
  if (s.debut && s.fin && s.fin < s.debut) erreurs.push(`${ou} fin avant début.`);
  for (const k of ["lien", "billetterie"]) if (s[k] != null && s[k] !== "" && !URL_RE.test(s[k])) erreurs.push(`${ou} ${k} n'est pas une URL.`);
  if ("relaches" in s && (!Array.isArray(s.relaches) || s.relaches.some((r) => !["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].includes(r) && !ISO.test(r)))) erreurs.push(`${ou} relaches : liste de jours (lun … dim) ou de dates AAAA-MM-JJ.`);
  if (!Array.isArray(s.offres)) erreurs.push(`${ou} offres doit être une liste.`);
  else for (const o of s.offres) {
    if (!o.type) erreurs.push(`${ou} offre sans type.`);
    if (o.date && !ISO.test(o.date)) erreurs.push(`${ou} offre « ${o.type} » : date invalide.`);
    if (o.vente && !VENTE.test(o.vente)) erreurs.push(`${ou} offre « ${o.type} » : vente invalide (AAAA-MM-JJ ou AAAA-MM-JJTHH:MM).`);
    if ("venteApprox" in o && typeof o.venteApprox !== "boolean") erreurs.push(`${ou} offre « ${o.type} » : venteApprox doit être true ou false.`);
    if ("etat" in o && !ETATS.includes(o.etat)) erreurs.push(`${ou} offre « ${o.type} » : etat inconnu (${ETATS.join(", ")}).`);
  }
  if ("etat" in s && !ETATS.includes(s.etat)) erreurs.push(`${ou} etat inconnu : ${s.etat} (${ETATS.join(", ")}).`);
  // Expositions : bloc « expo » obligatoire à l'affiche (type, source), lien officiel obligatoire.
  if ("expo" in s && s.categorie !== "Exposition") erreurs.push(`${ou} bloc expo réservé à la catégorie Exposition.`);
  if (s.categorie === "Exposition" && (fichier === "affiche" || "expo" in s)) {
    const x = s.expo;
    if (!x || typeof x !== "object" || Array.isArray(x)) erreurs.push(`${ou} exposition sans bloc expo (type, tarif, source… voir CLAUDE.md).`);
    else {
      const connues = ["type", "nocturnes", "tarif", "gratuit", "jeunes", "jeunesTexte", "creneau", "source", "ajouteLe"];
      for (const k of Object.keys(x)) if (!connues.includes(k)) erreurs.push(`${ou} expo.${k} : champ inconnu.`);
      if (!EXPO_TYPES.includes(x.type)) erreurs.push(`${ou} expo.type inconnu : ${x.type} (${EXPO_TYPES.join(", ")}).`);
      if (x.jeunes != null && !EXPO_JEUNES.includes(x.jeunes)) erreurs.push(`${ou} expo.jeunes inconnu : ${x.jeunes} (${EXPO_JEUNES.join(", ")} ou null).`);
      for (const k of ["gratuit", "creneau"]) if (k in x && typeof x[k] !== "boolean") erreurs.push(`${ou} expo.${k} doit être true ou false.`);
      if ("nocturnes" in x && (!Array.isArray(x.nocturnes) || x.nocturnes.some((j) => !JOURS.includes(j)))) erreurs.push(`${ou} expo.nocturnes : liste de jours (lun … dim).`);
      if (fichier === "affiche" && !URL_RE.test(x.source || "")) erreurs.push(`${ou} expo.source manquante (URL de la source de l'information).`);
      if (x.source && !URL_RE.test(x.source)) erreurs.push(`${ou} expo.source n'est pas une URL.`);
      if (x.ajouteLe && !ISO.test(x.ajouteLe)) erreurs.push(`${ou} expo.ajouteLe n'est pas au format AAAA-MM-JJ.`);
      if (fichier === "affiche" && !x.gratuit && !x.tarif) warn.push(`${ou} exposition sans tarif.`);
    }
    if (fichier === "affiche" && s.statut === "a-voir" && !URL_RE.test(s.lien || "")) erreurs.push(`${ou} lien officiel obligatoire pour une exposition.`);
    const L = lieux[s.lieuId];
    if (fichier === "affiche" && L && L.zone === "Paris" && !/\b75\d{3}\b/.test(L.adresse || "")) warn.push(`${ou} lieu d'exposition sans adresse (code postal) : arrondissement inconnu.`);
  }
};

const affiche = lire("data/affiche.json");
const journal = lire("data/journal.json");
for (const s of affiche?.sorties || []) {
  verifierSortie(s, "affiche");
  if (!["a-voir", "ecarte"].includes(s.statut)) erreurs.push(`[${s.id}] statut « ${s.statut} » interdit dans affiche.json (a-voir ou ecarte).`);
  if (s.statut === "a-voir" && !s.lien) warn.push(`[${s.id}] pas de lien officiel.`);
}
for (const s of journal?.sorties || []) {
  verifierSortie(s, "journal");
  if (s.statut !== "vu") erreurs.push(`[${s.id}] statut « ${s.statut} » interdit dans journal.json (vu).`);
  if (!(Array.isArray(s.vuLe) && s.vuLe.length && s.vuLe.every((d) => ISO.test(d)))) erreurs.push(`[${s.id}] vu sans date valide dans vuLe.`);
  if (!(s.noteLeonard == null || (Number.isInteger(s.noteLeonard) && s.noteLeonard >= 1 && s.noteLeonard <= 4))) erreurs.push(`[${s.id}] noteLeonard hors de 1–4.`);
}
// Archive : sorties terminées ni vues ni réservées, déplacées par la veille (jamais supprimées).
const archive = existsSync("data/archive.json") ? lire("data/archive.json") : { sorties: [] };
for (const s of archive?.sorties || []) {
  verifierSortie(s, "archive");
  if (s.statut !== "passe") erreurs.push(`[${s.id}] statut « ${s.statut} » interdit dans archive.json (passe).`);
  if (s.leonardYVa) erreurs.push(`[${s.id}] une sortie réservée ne va pas à l'archive.`);
}
if (archive && archive.maj && !ISO.test(archive.maj)) erreurs.push("maj invalide dans archive.json.");

// ---------- Rapports de veille (Radar) ----------
// Publics : structure stricte, aucune clé inconnue (donc aucune donnée privée), sorties citées connues.
const DOMAINES = ["complete", "spectacles", "concerts", "expo", "ventes"];
const radar = existsSync("data/radar.json") ? lire("data/radar.json") : null;
if (radar) {
  const cles = (o, permis, ou) => { for (const k of Object.keys(o || {})) if (!permis.includes(k)) erreurs.push(`radar.json ${ou} : champ inconnu « ${k} ».`); };
  cles(radar, ["maj", "rapports"], "racine");
  if (!Array.isArray(radar.rapports)) erreurs.push("radar.json : rapports doit être une liste.");
  else {
    const vusR = new Set();
    radar.rapports.forEach((r, i) => {
      const ou = `[${r.id || i}]`;
      cles(r, ["id", "date", "domaine", "titre", "chapo", "sections", "bilan"], ou);
      if (!/^\d{4}-\d{2}-\d{2}(-\d+)?$/.test(r.id || "") || vusR.has(r.id)) erreurs.push(`radar.json ${ou} : id invalide ou en double (AAAA-MM-JJ, suffixe -2 pour un second rapport du jour).`);
      vusR.add(r.id);
      if (!ISO.test(r.date || "") || !String(r.id).startsWith(r.date)) erreurs.push(`radar.json ${ou} : date invalide ou différente de l'id.`);
      if (i && radar.rapports[i - 1].id < r.id) erreurs.push(`radar.json ${ou} : rapports à ranger du plus récent au plus ancien.`);
      if (!DOMAINES.includes(r.domaine)) erreurs.push(`radar.json ${ou} : domaine inconnu (${DOMAINES.join(", ")}).`);
      if (!r.titre || typeof r.titre !== "string") erreurs.push(`radar.json ${ou} : titre manquant.`);
      if ("chapo" in r && typeof r.chapo !== "string") erreurs.push(`radar.json ${ou} : chapo doit être un texte.`);
      if ("bilan" in r) { cles(r.bilan, ["ajoutees", "archivees", "revisees", "ventes"], ou + " bilan"); for (const v of Object.values(r.bilan || {})) if (!Number.isInteger(v) || v < 0) erreurs.push(`radar.json ${ou} : bilan en nombres entiers.`); }
      if (!Array.isArray(r.sections) || !r.sections.length) erreurs.push(`radar.json ${ou} : sections manquantes.`);
      else for (const s of r.sections) {
        cles(s, ["titre", "texte", "lignes"], ou + " section");
        if (!s.titre) erreurs.push(`radar.json ${ou} : section sans titre.`);
        if ("texte" in s && (!Array.isArray(s.texte) || s.texte.some((p) => typeof p !== "string"))) erreurs.push(`radar.json ${ou} : texte = liste de paragraphes.`);
        for (const l of s.lignes || []) {
          cles(l, ["id", "titre", "texte"], ou + " ligne");
          if (!l.titre) erreurs.push(`radar.json ${ou} : ligne sans titre.`);
          if (l.id && !ids.has(l.id)) warn.push(`radar.json ${ou} : sortie inconnue ${l.id}.`);
        }
      }
    });
    if (radar.rapports.length && !existsSync("data/radar.atom")) erreurs.push("data/radar.atom manquant : relance build.");
  }
}

for (const f of [affiche, journal]) if (f && f.maj && !ISO.test(f.maj)) erreurs.push("maj invalide dans affiche.json ou journal.json.");

// ---------- Liens ----------
const CAT_LIENS = ["Billetteries", "Cartes et tarifs jeunes", "Calendriers de vente", "Outils"];
const liens = lire("data/liens.json") || [];
if (!Array.isArray(liens)) erreurs.push("liens.json doit être une liste.");
else for (const l of liens) {
  if (!CAT_LIENS.includes(l.categorie)) erreurs.push(`liens.json : catégorie inconnue « ${l.categorie} » (${l.titre}).`);
  if (!l.titre) erreurs.push("liens.json : lien sans titre.");
  if (!URL_RE.test(l.url || "")) erreurs.push(`liens.json : URL invalide (${l.titre}).`);
}

// ---------- Index générés ----------
const idxA = lire("data/index-artistes.json") || {};
for (const [k, v] of Object.entries(idxA)) for (const id of v.sorties || []) if (!ids.has(id)) erreurs.push(`index-artistes[${k}] : sortie inconnue ${id} (relance build).`);
const idxL = lire("data/index-lieux.json") || {};
for (const [k, v] of Object.entries(idxL)) for (const id of v.sorties || []) if (!ids.has(id)) erreurs.push(`index-lieux[${k}] : sortie inconnue ${id} (relance build).`);

// ---------- Dispo ----------
// Public : { maj, horizon, pris } : une seule liste de dates, sans raison. L'ancien format (trois listes) est toléré
// jusqu'à la migration faite par l'action « Publier le site ».
const dispo = lire("data/dispo.json") || {};
if (Array.isArray(dispo.pris)) {
  if (Object.keys(dispo).some((k) => !["maj", "horizon", "pris"].includes(k))) erreurs.push("dispo.json : seuls maj, horizon et pris sont permis.");
  for (const d of dispo.pris) if (!ISO.test(d)) erreurs.push(`dispo.json : date invalide (${d}).`);
  if (dispo.horizon && !ISO.test(dispo.horizon)) erreurs.push("dispo.json : horizon invalide.");
} else {
  warn.push("dispo.json à l'ancien format (trois listes) : la prochaine publication le fusionnera.");
  for (const k of ["reservations", "manuel", "calendrier"]) {
    if (!Array.isArray(dispo[k])) erreurs.push(`dispo.json : ${k} doit être une liste.`);
    else for (const d of dispo[k]) if (!ISO.test(d)) erreurs.push(`dispo.json : ${k} contient une date invalide (${d}).`);
  }
}

// ---------- Site : politique de sécurité ----------
// Deux coques (Factotum et Factotum Expo) : même politique, même script de thème, même version des fichiers partagés.
const csp = (h) => (/http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(h) || [])[1];
const versions = (t) => [...new Set([...t.matchAll(/\?v=([0-9.]+)/g)].map((m) => m[1]))];
const coques = ["index.html", "expo/index.html"].filter((f) => existsSync(f));
for (const f of coques) {
  const html = readFileSync(f, "utf8");
  if (!csp(html)) erreurs.push(`${f} : Content-Security-Policy manquante.`);
  if (/'unsafe-inline'|'unsafe-eval'/.test(html)) erreurs.push(`${f} : la politique de sécurité ne doit autoriser ni 'unsafe-inline' ni 'unsafe-eval'.`);
  if (!/<meta name="referrer" content="no-referrer">/.test(html)) erreurs.push(`${f} : <meta name="referrer" content="no-referrer"> manquant.`);
  if (/\sstyle="|\son[a-z]+="/.test(html)) erreurs.push(`${f} : attribut style ou gestionnaire d'événement en ligne.`);
  if (csp(html) !== csp(readFileSync("index.html", "utf8"))) erreurs.push(`${f} : politique de sécurité différente de celle d'index.html.`);
}
const vs = versions(["index.html", "expo/index.html", "sw.js", "assets/app.js"].filter((f) => existsSync(f)).map((f) => readFileSync(f, "utf8")).join("\n"));
if (vs.length > 1) erreurs.push(`Versions « ?v= » différentes entre les coques, sw.js et app.js : ${vs.join(", ")}.`);
for (const f of ["assets/app.js", "assets/admin.js", "assets/charte.js", "assets/expo.js"]) {
  const t = readFileSync(f, "utf8");
  if (/\sstyle="|\son[a-z]+="/.test(t)) erreurs.push(`${f} : attribut style ou gestionnaire d'événement en ligne (bloqué par la politique de sécurité).`);
  if (/target="_blank"(?! rel="noopener noreferrer")/.test(t)) erreurs.push(`${f} : lien externe sans rel="noopener noreferrer".`);
  if (/\beval\(|new Function\(|document\.write\(/.test(t)) erreurs.push(`${f} : eval, new Function ou document.write interdits.`);
}
for (const f of readdirSync(".github/workflows")) {
  const t = readFileSync(`.github/workflows/${f}`, "utf8");
  for (const m of t.matchAll(/uses:\s*(\S+)/g)) if (!/@[0-9a-f]{40}$/.test(m[1])) erreurs.push(`.github/workflows/${f} : action non épinglée par SHA (${m[1]}).`);
  if (/pull_request_target/.test(t)) erreurs.push(`.github/workflows/${f} : pull_request_target interdit.`);
}

if (sansCalcul) warn.push(`${sansCalcul} sortie(s) à l'affiche sans calcul du barème.`);
if (warn.length) console.log(`${warn.length} avertissement(s) :\n- ` + warn.slice(0, 30).join("\n- ") + (warn.length > 30 ? "\n- …" : ""));
if (erreurs.length) {
  console.error(`\n${erreurs.length} erreur(s) bloquante(s) :\n- ` + erreurs.join("\n- "));
  process.exit(1);
}
console.log(`OK : ${affiche.sorties.length} sorties à l'affiche, ${journal.sorties.length} au journal, ${Object.keys(lieux).length} lieux, ${liens.length} liens.`);

// Versions du site : data/versions.json porte en tête la version servie (V de sw.js), avec date, titre et points.
{
  const V = (/const V = "factotum-([\d.]+)"/.exec(readFileSync("sw.js", "utf8")) || [])[1];
  let vs = null; try { vs = JSON.parse(readFileSync("data/versions.json", "utf8")).versions; } catch (_) { console.error("ERREUR : data/versions.json illisible."); process.exitCode = 1; }
  if (vs) {
    if (!vs.length || vs[0].version !== V) { console.error(`ERREUR : data/versions.json doit commencer par la version ${V} (sw.js).`); process.exitCode = 1; }
    for (const v of vs) if (!/^\d+\.\d+$/.test(v.version || "") || !/^\d{4}-\d{2}-\d{2}$/.test(v.date || "") || !v.titre || !Array.isArray(v.points)) { console.error(`ERREUR : version mal formée dans data/versions.json (${v.version}).`); process.exitCode = 1; }
  }
}
