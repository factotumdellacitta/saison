// node tools/check.mjs  –  bloque la publication si les données sont incohérentes ou si une donnée privée fuit.
import { readFileSync, existsSync, readdirSync } from "node:fs";

const erreurs = [];
const warn = [];
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const VENTE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;
const URL_RE = /^https?:\/\/[^\s]+$/;
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CATEGORIES = ["Théâtre", "Opéra", "Danse", "Comédie musicale", "Récital", "Concert", "Festival", "Exposition", "Cinéma", "Événement", "Sur scène", "Autre"];
const ROLES = ["auteur", "compositeur", "mise en scène", "chorégraphie", "direction musicale", "interprète", "commissaire", "réalisation", "compagnie", "artiste"];
const ZONES = ["Paris", "Petite couronne", "Île-de-France", "Avignon", "Autre"];
const STATUTS_LIEU = ["Public", "Privé"];
// Clés interdites dans tout fichier public (données privées)
const PRIVEES = new Set(["prix", "accompagnants", "places", "siege", "heure", "reserveLe", "icsToken",
  "tarifPlein", "prixPlace", "pleinPlace", "billets", "categoriePlace", "envies", "journalPrive", "aCompleter", "priorite", "blocages", "jeton", "token"]);

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
if (existsSync("data/spectacles.json")) erreurs.push("data/spectacles.json ne doit plus exister (remplacé par affiche.json et journal.json).");

// ---------- Fichiers publics : aucune clé privée ----------
const PUBLICS_ATTENDUS = new Set(["affiche.json", "journal.json", "lieux.json", "liens.json", "dispo.json", "index-artistes.json", "index-lieux.json", "prive.enc"]);
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
  if (f === "prive.enc") continue;
  const o = lire(`data/${f}`);
  if (o) fouille(o, "", `data/${f}`);
}

// ---------- Jetons et secrets : jamais dans un fichier publié ----------
const SECRET = /\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/;
const publies = ["index.html", "sw.js", ...["assets", "data"].flatMap((d) => existsSync(d) ? readdirSync(d).map((f) => `${d}/${f}`) : [])];
for (const f of publies) {
  if (!/\.(html|js|json|enc|ics|webmanifest|svg|txt|md)$/.test(f)) continue;
  if (SECRET.test(readFileSync(f, "utf8"))) erreurs.push(`${f} contient ce qui ressemble à un jeton GitHub : retire-le et révoque le jeton.`);
}

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
const verifierSortie = (s, fichier) => {
  const ou = `[${s.id}]`;
  if (!s.id || !ID.test(s.id)) erreurs.push(`${ou} id invalide (minuscules, chiffres, tirets).`);
  if (ids.has(s.id)) erreurs.push(`${ou} id en double (${ids.get(s.id)} et ${fichier}).`);
  ids.set(s.id, fichier);
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
  if (typeof s.publicJeune !== "boolean") erreurs.push(`${ou} publicJeune doit être true ou false.`);
  if (typeof s.leonardYVa !== "boolean") erreurs.push(`${ou} leonardYVa doit être true ou false.`);
  for (const k of ["debut", "fin"]) if (s[k] && !ISO.test(s[k])) erreurs.push(`${ou} ${k} n'est pas au format AAAA-MM-JJ.`);
  if (s.debut && s.fin && s.fin < s.debut) erreurs.push(`${ou} fin avant début.`);
  for (const k of ["lien", "billetterie"]) if (s[k] != null && s[k] !== "" && !URL_RE.test(s[k])) erreurs.push(`${ou} ${k} n'est pas une URL.`);
  if (!Array.isArray(s.offres)) erreurs.push(`${ou} offres doit être une liste.`);
  else for (const o of s.offres) {
    if (!o.type) erreurs.push(`${ou} offre sans type.`);
    if (o.date && !ISO.test(o.date)) erreurs.push(`${ou} offre « ${o.type} » : date invalide.`);
    if (o.vente && !VENTE.test(o.vente)) erreurs.push(`${ou} offre « ${o.type} » : vente invalide (AAAA-MM-JJ ou AAAA-MM-JJTHH:MM).`);
    if ("venteApprox" in o && typeof o.venteApprox !== "boolean") erreurs.push(`${ou} offre « ${o.type} » : venteApprox doit être true ou false.`);
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
const dispo = lire("data/dispo.json") || {};
for (const k of ["reservations", "manuel", "calendrier"]) {
  if (!Array.isArray(dispo[k])) erreurs.push(`dispo.json : ${k} doit être une liste.`);
  else for (const d of dispo[k]) if (!ISO.test(d)) erreurs.push(`dispo.json : ${k} contient une date invalide (${d}).`);
}

if (warn.length) console.log(`${warn.length} avertissement(s) :\n- ` + warn.slice(0, 30).join("\n- ") + (warn.length > 30 ? "\n- …" : ""));
if (erreurs.length) {
  console.error(`\n${erreurs.length} erreur(s) bloquante(s) :\n- ` + erreurs.join("\n- "));
  process.exit(1);
}
console.log(`OK : ${affiche.sorties.length} sorties à l'affiche, ${journal.sorties.length} au journal, ${Object.keys(lieux).length} lieux, ${liens.length} liens.`);
