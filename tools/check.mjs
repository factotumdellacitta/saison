// node tools/check.mjs  –  bloque la publication si les données sont incohérentes.
import { readFileSync, existsSync } from "node:fs";

const erreurs = [];
const warn = [];
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const GENRES = ["Théâtre", "Opéra", "Danse", "Comédie musicale", "Récital", "Concert", "Cirque", "Cinéma", "Exposition", "Autre"];
const STATUTS = ["a-voir", "vu", "ecarte"];

for (const f of ["_prive.json", "_setup/prive-initial.json"]) {
  if (existsSync(f)) erreurs.push(`${f} est en clair : lance « node tools/prive.mjs fermer » (ou init) avant de publier.`);
}
if (!existsSync("data/prive.enc")) erreurs.push("data/prive.enc manquant.");

const { spectacles } = JSON.parse(readFileSync("data/spectacles.json", "utf8"));
const lieux = JSON.parse(readFileSync("data/lieux.json", "utf8"));
const ids = new Set();
for (const s of spectacles) {
  const ou = `[${s.id}]`;
  if (!s.id || !/^[a-z0-9-]+$/.test(s.id)) erreurs.push(`${ou} id invalide (minuscules, chiffres, tirets).`);
  if (ids.has(s.id)) erreurs.push(`${ou} id en double.`);
  ids.add(s.id);
  if (!s.titre) erreurs.push(`${ou} titre manquant.`);
  if (!GENRES.includes(s.genre)) erreurs.push(`${ou} genre inconnu : ${s.genre}.`);
  if (!STATUTS.includes(s.statut)) erreurs.push(`${ou} statut inconnu : ${s.statut}.`);
  if (!(Number.isInteger(s.note) && s.note >= 0 && s.note <= 4)) erreurs.push(`${ou} note hors de 0–4.`);
  for (const k of ["debut", "fin"]) if (s[k] && !ISO.test(s[k])) erreurs.push(`${ou} ${k} n'est pas au format AAAA-MM-JJ.`);
  if (s.debut && s.fin && s.fin < s.debut) erreurs.push(`${ou} fin avant début.`);
  if ("reserveLe" in s) erreurs.push(`${ou} reserveLe est privé : à mettre dans la zone privée, pas dans spectacles.json.`);
  if (typeof s.leonardYVa !== "boolean") erreurs.push(`${ou} leonardYVa doit être true ou false.`);
  if (s.statut === "vu" && !(Array.isArray(s.vuLe) && s.vuLe.length && s.vuLe.every((d) => ISO.test(d)))) erreurs.push(`${ou} vu sans date valide dans vuLe.`);
  for (const o of s.offres || []) {
    if (o.date && !ISO.test(o.date)) erreurs.push(`${ou} offre : date invalide.`);
    if (o.vente && !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(o.vente)) erreurs.push(`${ou} offre : vente invalide.`);
  }
  if (s.lieu && !lieux[s.lieu]) warn.push(`${ou} lieu absent de lieux.json : ${s.lieu}.`);
  if (s.statut === "a-voir" && !s.lien) warn.push(`${ou} pas de lien officiel.`);
}
const dispo = JSON.parse(readFileSync("data/dispo.json", "utf8"));
for (const k of ["reservations", "manuel", "calendrier"]) {
  if (!Array.isArray(dispo[k])) erreurs.push(`dispo.json : ${k} doit être une liste.`);
  else for (const d of dispo[k]) if (!ISO.test(d)) erreurs.push(`dispo.json : ${k} contient une date invalide (${d}).`);
}

if (warn.length) console.log(`${warn.length} avertissement(s) :\n- ` + warn.slice(0, 30).join("\n- ") + (warn.length > 30 ? "\n- …" : ""));
if (erreurs.length) {
  console.error(`\n${erreurs.length} erreur(s) bloquante(s) :\n- ` + erreurs.join("\n- "));
  process.exit(1);
}
console.log(`OK : ${spectacles.length} fiches valides.`);
