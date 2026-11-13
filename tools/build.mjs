// node tools/build.mjs
// À lancer après toute modification. Il :
//  1. génère data/index-artistes.json et data/index-lieux.json (toujours, même sans mot de passe) ;
//  2. lit la zone privée (déchiffrée avec SAISON_MDP, ou _prive.json si elle est ouverte) ;
//  3. met à jour data/dispo.json (champ "reservations" : dates seules, sans motif) ;
//  4. régénère data/agenda-<jeton>.ics (réservations) et data/ventes-<jeton>.ics (ouvertures de ventes).
// Sortie déterministe : rien ne change si les données n'ont pas changé (pas de commit inutile dans l'action).
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dechiffrer } from "./crypto.mjs";

const lire = (f) => JSON.parse(readFileSync(f, "utf8"));
const affiche = lire("data/affiche.json");
const journal = lire("data/journal.json");
const lieux = lire("data/lieux.json");
const toutes = [...affiche.sorties, ...journal.sorties];
const parId = Object.fromEntries(toutes.map((s) => [s.id, s]));

export const slug = (s) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[œ]/g, "oe").replace(/[æ]/g, "ae").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Écrit seulement si le contenu change ; renvoie true si écrit.
function ecrire(f, contenu) {
  if (existsSync(f) && readFileSync(f, "utf8") === contenu) return false;
  writeFileSync(f, contenu);
  return true;
}
const json = (o) => JSON.stringify(o, null, 1) + "\n";

// ---------- 1. Index ----------
const idxArt = {};
for (const s of toutes) {
  for (const a of s.artistes || []) {
    const k = slug(a.nom);
    if (!k) continue;
    idxArt[k] ??= { nom: a.nom, sorties: [] };
    if (!idxArt[k].sorties.includes(s.id)) idxArt[k].sorties.push(s.id);
  }
}
const idxLieux = {};
for (const id of Object.keys(lieux)) idxLieux[id] = { sorties: [] };
for (const s of toutes) if (s.lieuId && idxLieux[s.lieuId]) idxLieux[s.lieuId].sorties.push(s.id);
const trie = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, { ...o[k], sorties: [...o[k].sorties].sort() }]));
ecrire("data/index-artistes.json", json(trie(idxArt)));
ecrire("data/index-lieux.json", json(trie(idxLieux)));
console.log(`Index : ${Object.keys(idxArt).length} artistes, ${Object.keys(idxLieux).length} lieux.`);

// ---------- 2. Zone privée ----------
async function lirePrive() {
  if (existsSync("_prive.json")) return lire("_prive.json");
  if (!process.env.SAISON_MDP) {
    console.warn("SAISON_MDP absent : zone privée non lue, dispo.json et flux inchangés.");
    return null;
  }
  return dechiffrer(lire("data/prive.enc"), process.env.SAISON_MDP);
}

// ---------- outils iCalendar ----------
const pad = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function plie(ligne) {
  // RFC 5545 : lignes de 75 octets au plus
  const out = [];
  let cur = "", n = 0;
  for (const ch of ligne) {
    const b = Buffer.byteLength(ch);
    if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; n = 0; }
    cur += ch; n += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}
function stamp(d, h) {
  const [y, m, j] = d.split("-");
  const [hh, mm] = (h || "20:00").split(":");
  return `${y}${m}${j}T${hh}${mm}00`;
}
function plus(d, h, minutes) {
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
// DTSTAMP fixe (dérivé de la date de mise à jour des données) pour un fichier stable
const DTSTAMP = (affiche.maj || "2026-01-01").replace(/-/g, "") + "T000000Z";
const entete = (nom) => ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//saison//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${nom}`, "X-WR-TIMEZONE:Europe/Paris", ...VTZ];
const fichierIcs = (lignes) => lignes.map(plie).join("\r\n") + "\r\n";
const credits = (s) => (s.artistes || []).map((a) => a.nom).filter((n, i, t) => t.indexOf(n) === i).join(", ");
const nomLieu = (s) => (s.lieuId && lieux[s.lieuId] ? lieux[s.lieuId].nom : "");

async function main() {
  const prive = await lirePrive();
  if (!prive) return;
  if (!prive.icsToken) throw new Error("icsToken absent de la zone privée.");
  const res = prive.reservations || {};
  const envies = prive.envies || {};

  // 3. Soirs réservés (publics, sans motif)
  const dispo = lire("data/dispo.json");
  const dates = [...new Set(Object.values(res).map((r) => r.date).filter(Boolean))].sort();
  if (JSON.stringify(dates) !== JSON.stringify(dispo.reservations)) {
    dispo.reservations = dates;
    dispo.maj = new Date().toISOString().slice(0, 10);
    ecrire("data/dispo.json", JSON.stringify(dispo, null, 1));
  }

  // 4a. Flux des réservations
  const tok = prive.icsToken;
  for (const f of readdirSync("data"))
    if (/^(agenda|ventes)-.*\.ics$/.test(f) && f !== `agenda-${tok}.ics` && f !== `ventes-${tok}.ics`) rmSync(`data/${f}`);
  const ag = entete("Saison – réservations");
  let nRes = 0;
  for (const [id, r] of Object.entries(res).sort((a, b) => (a[1].date || "").localeCompare(b[1].date || "") || a[0].localeCompare(b[0]))) {
    if (!r.date) continue;
    nRes++;
    const s = parId[id] || { titre: id };
    const lieu = [r.salle || s.salle, nomLieu(s)].filter(Boolean).join(", ");
    const desc = [
      credits(s),
      r.places ? `Places : ${r.places}` : "",
      r.siege ? `Siège : ${r.siege}` : "",
      r.prix != null && r.prix !== "" ? `Prix : ${typeof r.prix === "number" ? r.prix + " €" : r.prix}${r.tarif ? ` (${r.tarif})` : ""}` : r.tarif ? `Tarif : ${r.tarif}` : "",
      r.accompagnants?.length ? `Avec : ${r.accompagnants.join(", ")}` : "",
      r.heure ? "" : "Heure à préciser",
      r.note,
      r.billetterie ? `Billetterie : ${r.billetterie}` : "",
      s.lien,
    ].filter(Boolean).join("\n");
    ag.push(
      "BEGIN:VEVENT", `UID:${id}-${r.date}@saison`, `DTSTAMP:${DTSTAMP}`,
      `DTSTART;TZID=Europe/Paris:${stamp(r.date, r.heure)}`, `DTEND;TZID=Europe/Paris:${plus(r.date, r.heure, 150)}`,
      `SUMMARY:${esc(s.titre)}`, `LOCATION:${esc(lieu)}`, `DESCRIPTION:${esc(desc)}`,
      ...(s.lien ? [`URL:${s.lien}`] : []), "END:VEVENT"
    );
  }
  ag.push("END:VCALENDAR");
  ecrire(`data/agenda-${tok}.ics`, fichierIcs(ag));

  // 4b. Flux des ouvertures de ventes
  const ve = entete("Saison – ouvertures de ventes");
  let nVe = 0;
  for (const s of [...affiche.sorties].sort((a, b) => a.id.localeCompare(b.id))) {
    const suivie = envies[s.id] || res[s.id] || s.note === 4;
    (s.offres || []).forEach((o, i) => {
      if (!o.vente) return;
      if (!(suivie || /avant[- ]premi/i.test(o.type || ""))) return;
      const [d, h] = o.vente.split("T");
      const approx = o.venteApprox || !h;
      const desc = [
        o.tarif ? `Tarif : ${o.tarif}` : "",
        o.date ? `Représentation : ${o.date}` : "",
        o.condition ? `Condition : ${o.condition}` : "",
        h ? "" : "Heure d’ouverture inconnue (10h par défaut)",
        `Billetterie : ${s.billetterie || lieux[s.lieuId]?.billetterie || s.lien || ""}`,
      ].filter(Boolean).join("\n");
      nVe++;
      ve.push(
        "BEGIN:VEVENT", `UID:vente-${s.id}-${i}-${slug(o.type || "offre")}@saison`, `DTSTAMP:${DTSTAMP}`,
        `DTSTART;TZID=Europe/Paris:${stamp(d, h || "10:00")}`, `DTEND;TZID=Europe/Paris:${plus(d, h || "10:00", 15)}`,
        `SUMMARY:${esc(`${approx ? "~ " : ""}Vente : ${o.type || "offre"} – ${s.titre}`)}`,
        `DESCRIPTION:${esc(desc)}`,
        ...(s.billetterie || s.lien ? [`URL:${s.billetterie || s.lien}`] : []),
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(`Vente : ${s.titre}`)}`, "TRIGGER:-PT15M", "END:VALARM",
        "END:VEVENT"
      );
    });
  }
  ve.push("END:VCALENDAR");
  ecrire(`data/ventes-${tok}.ics`, fichierIcs(ve));
  console.log(`dispo.json, agenda (${nRes} réservations datées) et ventes (${nVe} ouvertures) à jour.`);
}
main().catch((e) => { console.error("Erreur :", e.message); process.exit(1); });
