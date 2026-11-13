// node tools/build.mjs
// À lancer après toute modification. Il :
//  1. lit la zone privée (déchiffrée avec SAISON_MDP, ou _prive.json si elle est ouverte) ;
//  2. met à jour data/dispo.json (champ "reservations" : dates seules, sans motif) ;
//  3. régénère le flux agenda data/agenda-<jeton>.ics pour Apple Calendar.
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dechiffrer } from "./crypto.mjs";

const spectacles = JSON.parse(readFileSync("data/spectacles.json", "utf8")).spectacles;
const parId = Object.fromEntries(spectacles.map((s) => [s.id, s]));

async function lirePrive() {
  if (existsSync("_prive.json")) return JSON.parse(readFileSync("_prive.json", "utf8"));
  if (!process.env.SAISON_MDP) {
    console.warn("SAISON_MDP absent : zone privée non lue, flux agenda et réservations inchangés.");
    return null;
  }
  return dechiffrer(JSON.parse(readFileSync("data/prive.enc", "utf8")), process.env.SAISON_MDP);
}

const pad = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
function stamp(d, h) {
  const [y, m, j] = d.split("-");
  const [hh, mm] = (h || "20:00").split(":");
  return `${y}${m}${j}T${hh}${mm}00`;
}
function fin(d, h, minutes = 150) {
  const [y, m, j] = d.split("-").map(Number);
  const [hh, mm] = (h || "20:00").split(":").map(Number);
  const t = new Date(Date.UTC(y, m - 1, j, hh, mm) + minutes * 60000);
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00`;
}
const VTZ = [
  "BEGIN:VTIMEZONE", "TZID:Europe/Paris",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
  "END:VTIMEZONE",
];

async function main() {
  const prive = await lirePrive();
  if (!prive) return;
  const res = prive.reservations || {};

  // 1. Soirs réservés (publics, sans motif)
  const dispo = JSON.parse(readFileSync("data/dispo.json", "utf8"));
  dispo.reservations = [...new Set(Object.values(res).map((r) => r.date).filter(Boolean))].sort();
  dispo.maj = new Date().toISOString().slice(0, 10);
  writeFileSync("data/dispo.json", JSON.stringify(dispo, null, 1));

  // 2. Flux agenda
  if (!prive.icsToken) throw new Error("icsToken absent de la zone privée.");
  for (const f of readdirSync("data")) if (/^agenda-.*\.ics$/.test(f)) rmSync(`data/${f}`);
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lignes = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//saison//FR", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Saison – réservations", "X-WR-TIMEZONE:Europe/Paris", ...VTZ];
  for (const [id, r] of Object.entries(res)) {
    if (!r.date) continue;
    const s = parId[id] || { titre: id };
    const lieu = [r.salle || s.salle, s.lieu].filter(Boolean).join(", ");
    const desc = [s.credits, r.places ? `Places : ${r.places}` : "", r.heure ? "" : "Heure à préciser", r.note, s.lien].filter(Boolean).join("\n");
    lignes.push(
      "BEGIN:VEVENT", `UID:${id}-${r.date}@saison`, `DTSTAMP:${now}`,
      `DTSTART;TZID=Europe/Paris:${stamp(r.date, r.heure)}`, `DTEND;TZID=Europe/Paris:${fin(r.date, r.heure)}`,
      `SUMMARY:${esc(s.titre)}`, `LOCATION:${esc(lieu)}`, `DESCRIPTION:${esc(desc)}`,
      ...(s.lien ? [`URL:${s.lien}`] : []), "END:VEVENT"
    );
  }
  lignes.push("END:VCALENDAR");
  writeFileSync(`data/agenda-${prive.icsToken}.ics`, lignes.join("\r\n") + "\r\n");
  console.log(`dispo.json et data/agenda-${prive.icsToken}.ics à jour (${Object.keys(res).length} réservations).`);
}
main().catch((e) => { console.error("Erreur :", e.message); process.exit(1); });
