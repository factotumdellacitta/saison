// node tools/build.mjs
// À lancer après toute modification. Il :
//  1. génère data/index-artistes.json, data/index-lieux.json et data/deja-vu.json (toujours, même sans mot de passe) ;
//  2. lit la zone privée (déchiffrée avec SAISON_MDP, ou _prive.json si elle est ouverte) ;
//  3. met à jour data/dispo.json ({maj, horizon, pris} : une seule liste de soirs pris, sans raison, sur six mois glissants)
//     et data/envies.json (identifiants seuls) ; l'agenda Apple (dates seules) est gardé chiffré dans data/calendrier.enc ;
//  4. régénère data/agenda-<jeton>.ics (réservations) et data/ventes-<jeton>.ics (ouvertures de ventes) :
//     fichiers ignorés par git (le dépôt est public), copiés dans le site seulement au moment de la publication.
// Sortie déterministe : rien ne change si les données n'ont pas changé (pas de commit inutile dans l'action).
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { chiffrer, dechiffrer, ITER } from "./crypto.mjs";

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
// Musiques actuelles et jazz : concerts et festivals sans compositeur ni chef crédités (le classique en a toujours).
const actuelle = (s) => (s.categorie === "Concert" || s.categorie === "Festival") && !(s.artistes || []).some((a) => a.role === "compositeur" || a.role === "direction musicale");

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

// ---------- 1a. Flux Atom des rapports de veille ----------
// data/radar.json (écrit par /veille) -> data/radar.atom. Public et déterministe : la date d'un rapport fait foi (midi UTC).
if (existsSync("data/radar.json")) {
  const SITE = "https://factotumdellacitta.github.io/saison/";
  const x = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const rapports = JSON.parse(readFileSync("data/radar.json", "utf8")).rapports || [];
  const connues = new Set(toutes.map((s) => s.id));
  const corps = (r) => (r.chapo ? `<p><strong>${x(r.chapo)}</strong></p>` : "") + (r.sections || []).map((s) => `<h2>${x(s.titre)}</h2>` + (s.texte || []).map((p) => `<p>${x(p)}</p>`).join("")
    + ((s.lignes || []).length ? `<ul>${s.lignes.map((l) => `<li>${l.id && connues.has(l.id) ? `<a href="${SITE}#sortie-${x(l.id)}">${x(l.titre)}</a>` : x(l.titre)}${l.texte ? ` : ${x(l.texte)}` : ""}</li>`).join("")}</ul>` : "")).join("");
  const quand = (r) => `${r.date}T12:00:00Z`;
  const atom = [`<?xml version="1.0" encoding="utf-8"?>`, `<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="fr">`,
    `<title>Factotum – Radar</title>`, `<subtitle>Rapports de veille : spectacles, concerts, expositions à Paris</subtitle>`,
    `<id>${SITE}data/radar.atom</id>`, `<link rel="self" type="application/atom+xml" href="${SITE}data/radar.atom"/>`, `<link rel="alternate" type="text/html" href="${SITE}#rapports"/>`,
    `<updated>${rapports.length ? quand(rapports[0]) : "2026-11-16T12:00:00Z"}</updated>`, `<author><name>Factotum</name></author>`,
    ...rapports.map((r) => [`<entry>`, `<title>${x(r.titre)}</title>`, `<id>tag:factotumdellacitta.github.io,2026:saison/rapport-${x(r.id)}</id>`,
      `<link rel="alternate" type="text/html" href="${SITE}#rapport-${x(r.id)}"/>`, `<updated>${quand(r)}</updated>`, `<published>${quand(r)}</published>`,
      r.chapo ? `<summary>${x(r.chapo)}</summary>` : "", `<content type="html">${x(corps(r))}</content>`, `</entry>`].filter(Boolean).join("\n")),
    `</feed>`, ""].join("\n");
  ecrire("data/radar.atom", atom);
}

// ---------- 1b. Déjà vu ----------
// Sorties à l'affiche dont l'œuvre figure au journal (même catégorie, même titre sans accents, ponctuation ni précision entre parenthèses) :
// { idAffiche: [dates vues] }. Données publiques (le journal l'est déjà) ; la marque « Déjà vu » du site s'en sert.
const cleTitre = (t) => slug(String(t).replace(/\s*\([^)]*\)\s*$/, ""));
const vus = new Map();
for (const s of journal.sorties) {
  const k = s.categorie + "|" + cleTitre(s.titre);
  vus.set(k, [...(vus.get(k) || []), ...(s.vuLe || [])]);
}
// Concerts de musiques actuelles : l'artiste en tête (premier interprète) déjà vu en concert, en festival ou en showcase.
const vusArt = new Map();
for (const s of journal.sorties) if (actuelle(s) || s.categorie === "Événement")
  for (const a of s.artistes || []) if (a.role === "interprète") vusArt.set(slug(a.nom), [...(vusArt.get(slug(a.nom)) || []), ...(s.vuLe || [])]);
const dejaVu = {};
for (const s of affiche.sorties) {
  const tete = s.categorie === "Concert" && actuelle(s) && (s.artistes || []).find((a) => a.role === "interprète");
  const d = [...(vus.get(s.categorie + "|" + cleTitre(s.titre)) || []), ...(tete ? vusArt.get(slug(tete.nom)) || [] : [])];
  if (d.length) dejaVu[s.id] = [...new Set(d)].sort();
}
ecrire("data/deja-vu.json", json(Object.fromEntries(Object.keys(dejaVu).sort().map((k) => [k, dejaVu[k]]))));
console.log(`Déjà vu : ${Object.keys(dejaVu).length} sorties à l'affiche.`);

// ---------- 2. Zone privée ----------
const MDP = process.env.SAISON_MDP;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
async function lirePrive() {
  if (existsSync("_prive.json")) return { prive: lire("_prive.json"), ouvert: true };
  if (!MDP) {
    console.warn("SAISON_MDP absent : zone privée non lue, dispo.json et flux inchangés.");
    return null;
  }
  const paquet = lire("data/prive.enc");
  return { prive: await dechiffrer(paquet, MDP), paquet };
}
// Aujourd'hui à Paris (l'action tourne en UTC), et la même date n jours plus tard.
const aujourdhui = () => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const plusJours = (d, n) => new Date(Date.parse(d + "T12:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const HORIZON_JOURS = 183;

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
const entete = (nom) => ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//factotum//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${nom}`, "X-WR-TIMEZONE:Europe/Paris", ...VTZ];
const fichierIcs = (lignes) => lignes.map(plie).join("\r\n") + "\r\n";
// Places et prix : prix par place × places, ou détail place par place (billets). Ancien champ « prix » = total.
const num = (v) => (v == null || v === "" ? null : typeof v === "number" ? v : (() => { const m = String(v).replace(",", ".").match(/-?\d+(\.\d+)?/); return m ? +m[0] : null; })());
const eur = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",")) + " €";
function lignesPlaces(r) {
  if (r.billets?.length) return r.billets.map((b) => ({ ...b, spectateur: b.spectateur ?? b.pour ?? "", prix: num(b.prix), paiement: b.paiement === "offert" ? "moi" : b.paiement === "inconnu" ? "" : b.paiement || (num(b.prix) == null ? "" : "moi") }));
  const n = r.places || 1, u = num(r.prixPlace) != null ? num(r.prixPlace) : num(r.prix) != null ? num(r.prix) / n : null;
  if (u == null) return [];
  return Array.from({ length: n }, (_, i) => ({ spectateur: i ? (r.accompagnants || [])[i - 1] || "" : "Moi", prix: u, paiement: "moi", tarif: r.tarif, categoriePlace: r.categoriePlace }));
}
// Ma place : « autrui » = offerte par quelqu’un (prix = valeur). Place d’un tiers : « moi » = je l’offre.
const marque = (b) => (/^moi$/i.test(b.spectateur) ? { autrui: "offerte à moi", gratuit: "gratuite" } : { moi: "offerte par moi", spectateur: "sa part", gratuit: "gratuite" })[b.paiement] || "";
function prixTexte(r) {
  const L = lignesPlaces(r);
  if (!L.some((b) => b.prix != null)) return r.tarif ? `Tarif : ${r.tarif}` : "";
  const t = L.map((b) => {
    const pr = [marque(b), b.tarif, b.categoriePlace].filter(Boolean);
    return `${b.spectateur || "?"} ${b.prix != null ? eur(b.prix) : "?"}${pr.length ? ` (${pr.join(", ")})` : ""}`;
  }).join(" + ");
  return `Prix : ${t}${L.length > 1 ? " = " + eur(L.reduce((s, b) => s + (b.prix || 0), 0)) : ""}`;
}
const credits = (s) => (s.artistes || []).map((a) => a.nom).filter((n, i, t) => t.indexOf(n) === i).join(", ");
// Visite d'exposition en journée (créneau avant 17 h) : une demi-journée, pas un soir pris (elle reste dans le flux agenda).
const enJournee = (id, r) => parId[id]?.categorie === "Exposition" && !!r.heure && r.heure < "17:00";
const nomLieu = (s) => (s.lieuId && lieux[s.lieuId] ? lieux[s.lieuId].nom : "");

async function main() {
  const lu = await lirePrive();
  if (!lu) return;
  const { prive, ouvert } = lu;
  let paquet = lu.paquet;
  if (!prive.icsToken) throw new Error("icsToken absent de la zone privée.");
  const res = prive.reservations || {};
  const envies = prive.envies || {};
  const dispo = lire("data/dispo.json");

  // 3. Soirs pris. Sources privées : réservations, soirs déclarés (prive.soirs) et agenda Apple (calendrier.enc).
  // Public : une seule liste fusionnée, sans raison, d'aujourd'hui à six mois.
  // Migration (une fois, avec le mot de passe) : les anciens soirs déclarés de dispo.json passent dans la zone privée,
  // et un paquet à l'ancien nombre d'itérations est rechiffré avec un nouveau sel.
  let rechiffrer = false;
  if (!Array.isArray(prive.soirs)) { prive.soirs = (dispo.manuel || []).filter((d) => ISO.test(d)).sort(); rechiffrer = true; }
  if (paquet && paquet.iter !== ITER) rechiffrer = true;
  if (rechiffrer && !ouvert && MDP) {
    paquet = await chiffrer(prive, MDP, paquet.iter === ITER ? paquet.salt : undefined);
    writeFileSync("data/prive.enc", JSON.stringify(paquet));
    console.log("Zone privée rechiffrée (migration).");
  }
  // Agenda Apple : dates fraîches données par l'action (CAL_DATES, liste JSON), sinon dernière version chiffrée connue.
  let cal = null, calPaquet = null;
  if (existsSync("data/calendrier.enc") && MDP) { try { calPaquet = lire("data/calendrier.enc"); cal = (await dechiffrer(calPaquet, MDP)).dates; } catch (_) { cal = null; calPaquet = null; } }
  const ancien = cal;
  if (process.env.CAL_DATES) {
    let d = null; try { d = JSON.parse(process.env.CAL_DATES); } catch (_) {}
    if (Array.isArray(d) && d.every((x) => typeof x === "string" && ISO.test(x))) cal = [...new Set(d)].sort();
    else console.warn("Agenda : liste de dates illisible, dernière version connue gardée.");
  }
  if (!cal) cal = (dispo.calendrier || []).filter((d) => ISO.test(d)).sort();
  if (paquet && MDP && (JSON.stringify(cal) !== JSON.stringify(ancien) || !calPaquet || calPaquet.salt !== paquet.salt))
    writeFileSync("data/calendrier.enc", JSON.stringify(await chiffrer({ dates: cal }, MDP, paquet.salt)));
  const jour = aujourdhui(), horizon = plusJours(jour, HORIZON_JOURS);
  const pris = [...new Set([...Object.entries(res).filter(([id, r]) => !enJournee(id, r)).map(([, r]) => r.date), ...prive.soirs, ...cal])].filter((d) => d && ISO.test(d) && d >= jour && d <= horizon).sort();
  if (JSON.stringify(pris) !== JSON.stringify(dispo.pris) || dispo.horizon !== horizon || "manuel" in dispo || "calendrier" in dispo || "reservations" in dispo)
    ecrire("data/dispo.json", json({ maj: jour, horizon, pris }));
  // 3b. Envies publiques : identifiants des sorties à l'affiche seulement (ni priorité, ni note, ni date d'ajout)
  const aVoir = new Set(affiche.sorties.filter((s) => s.statut === "a-voir").map((s) => s.id));
  const pub = json({ ids: Object.keys(envies).filter((id) => aVoir.has(id)).sort() });
  if (!existsSync("data/envies.json") || readFileSync("data/envies.json", "utf8") !== pub) ecrire("data/envies.json", pub);

  // 4a. Flux des réservations
  const tok = prive.icsToken;
  for (const f of readdirSync("data"))
    if (/^(agenda|ventes)-.*\.ics$/.test(f) && f !== `agenda-${tok}.ics` && f !== `ventes-${tok}.ics`) rmSync(`data/${f}`);
  const ag = entete("Factotum – réservations");
  let nRes = 0;
  for (const [id, r] of Object.entries(res).sort((a, b) => (a[1].date || "").localeCompare(b[1].date || "") || a[0].localeCompare(b[0]))) {
    if (!r.date) continue;
    nRes++;
    const s = parId[id] || { titre: id };
    const expo = s.categorie === "Exposition"; // visite : 1 h 30, titre préfixé
    const lieu = [r.salle || s.salle, nomLieu(s)].filter(Boolean).join(", ");
    const desc = [
      credits(s),
      r.places ? `Places : ${r.places}` : "",
      r.siege ? `Siège : ${r.siege}` : "",
      prixTexte(r),
      r.accompagnants?.length ? `Avec : ${r.accompagnants.join(", ")}` : "",
      r.heure ? "" : "Heure à préciser",
      r.note,
      r.billetterie ? `Billetterie : ${r.billetterie}` : "",
      s.lien,
    ].filter(Boolean).join("\n");
    ag.push(
      "BEGIN:VEVENT", `UID:${id}-${r.date}@saison`, `DTSTAMP:${DTSTAMP}`,
      `DTSTART;TZID=Europe/Paris:${stamp(r.date, r.heure)}`, `DTEND;TZID=Europe/Paris:${plus(r.date, r.heure, expo ? 90 : 150)}`,
      `SUMMARY:${esc((expo ? "Expo : " : "") + s.titre)}`, `LOCATION:${esc(lieu)}`, `DESCRIPTION:${esc(desc)}`,
      ...(s.lien ? [`URL:${s.lien}`] : []), "END:VEVENT"
    );
  }
  ag.push("END:VCALENDAR");
  ecrire(`data/agenda-${tok}.ics`, fichierIcs(ag));

  // 4b. Flux des ouvertures de ventes
  const ve = entete("Factotum – ouvertures de ventes");
  let nVe = 0;
  for (const s of [...affiche.sorties].sort((a, b) => a.id.localeCompare(b.id))) {
    // Suivies : envies, réservations, notes 4, et tous les concerts et festivals de musiques actuelles notés (annonce puis mise en vente).
    const suivie = envies[s.id] || res[s.id] || s.note === 4 || (actuelle(s) && s.note >= 2);
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
  void nRes; void nVe;
  console.log("Soirs pris et flux à jour.");
}
main().catch((e) => { console.error("Erreur :", e.message); process.exit(1); });
