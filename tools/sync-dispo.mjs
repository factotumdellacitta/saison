// Lancé par GitHub Actions toutes les heures.
// Lit le calendrier Apple publié (secret ICLOUD_ICS_URL) et met à jour data/dispo.json, champ "calendrier" :
// uniquement les dates des soirs occupés, jamais les titres ni les détails.
// Règle : un jour est « pris » si un événement chevauche 18h–23h (heure de Paris), ou s'il s'agit d'un événement
// sur la journée entière qui dure au moins 2 jours (voyage, séjour). Un titre commençant par « [libre] » est ignoré.
import { readFileSync, writeFileSync } from "node:fs";
import ical from "node-ical";

const URL_ICS = (process.env.ICLOUD_ICS_URL || "").replace(/^webcal:/, "https:");
if (!URL_ICS) { console.log("ICLOUD_ICS_URL absent : rien à synchroniser."); process.exit(0); }

const TZ = "Europe/Paris";
const fmt = new Intl.DateTimeFormat("fr-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
function local(d) {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: (+p.hour % 24) * 60 + +p.minute };
}
const debutFenetre = new Date(Date.now() - 86400000);
const finFenetre = new Date(Date.now() + 400 * 86400000);
const pris = new Set();

function ajouter(start, end, journee) {
  if (journee) {
    const jours = Math.round((end - start) / 86400000);
    if (jours < 2) return;
    for (let t = +start; t < +end; t += 86400000) pris.add(new Date(t).toISOString().slice(0, 10));
    return;
  }
  for (let t = +start; t < +end; t += 30 * 60000) {
    const l = local(new Date(t));
    if (l.min >= 18 * 60 && l.min < 23 * 60) pris.add(l.date);
  }
  const l = local(start);
  if (l.min >= 18 * 60 && l.min < 23 * 60) pris.add(l.date);
}

const data = await ical.async.fromURL(URL_ICS);
for (const ev of Object.values(data)) {
  if (ev.type !== "VEVENT" || !ev.start) continue;
  if (String(ev.summary || "").trim().toLowerCase().startsWith("[libre]")) continue;
  const journee = ev.datetype === "date";
  const duree = (ev.end ? +ev.end : +ev.start + 3600000) - +ev.start;
  if (ev.rrule) {
    const exclus = new Set(Object.values(ev.exdate || {}).map((d) => new Date(d).toISOString().slice(0, 10)));
    for (const occ of ev.rrule.between(debutFenetre, finFenetre, true)) {
      if (exclus.has(occ.toISOString().slice(0, 10))) continue;
      ajouter(occ, new Date(+occ + duree), journee);
    }
  } else if (+ev.start < +finFenetre && +ev.start + duree > +debutFenetre) {
    ajouter(ev.start, new Date(+ev.start + duree), journee);
  }
}

const dispo = JSON.parse(readFileSync("data/dispo.json", "utf8"));
const avant = JSON.stringify(dispo.calendrier);
dispo.calendrier = [...pris].sort();
if (JSON.stringify(dispo.calendrier) !== avant) {
  dispo.maj = new Date().toISOString().slice(0, 10);
  writeFileSync("data/dispo.json", JSON.stringify(dispo, null, 1));
  console.log(`dispo.json : ${dispo.calendrier.length} soirs pris depuis le calendrier.`);
} else {
  console.log("Aucun changement.");
}
