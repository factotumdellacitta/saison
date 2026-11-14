/* Saison – mode admin (lot 3). Chargé par app.js à la première visite de l’onglet Admin.
   Utilise les variables et fonctions globales d’app.js (AFF, JOURNAL, LIEUX, PRIVE, BYID, esc, fmt…).
   Sécurité : le mot de passe ne quitte jamais cette page et n’est pas conservé ; seule une clé AES non extractible
   reste en mémoire tant que l’admin est déverrouillé. Le jeton GitHub est rangé dans localStorage, chiffré avec une
   clé dérivée du mot de passe. Rien n’est jamais écrit dans la console, l’URL ou un fichier. */
"use strict";
(() => {
  const REPO = "factotumdellacitta/saison", API = "https://api.github.com", BRANCHE = "main", WF = "publier.yml";
  const ITER = 310000, LS_JETON = "saison.jeton", INACTIF = 30 * 60e3, POLL = 6000;
  const FICHIERS = { affiche: "data/affiche.json", journal: "data/journal.json", lieux: "data/lieux.json", liens: "data/liens.json", dispo: "data/dispo.json", prive: "data/prive.enc" };
  const ZONES_L = ["Paris", "Petite couronne", "Île-de-France", "Avignon", "Autre"];
  const PRI = { 1: "forte", 2: "normale", 3: "faible" };
  const TARIFS = ["Carte Jeune", "Moins de 28 ans", "Moins de 30 ans", "Avant-première jeunes", "Tarif réduit", "Plein tarif", "Invitation"];
  const TYPES_OFFRE = ["Avant-première jeunes", "Carte Jeunes", "Moins de 28 ans", "Moins de 30 ans", "Gratuit moins de 26 ans", "Dernière minute"];
  const enc = new TextEncoder(), dec = new TextDecoder();

  /* ---------- État ---------- */
  let ITERP = ITER, KEY = null, SALT = null, TOK = null, LAST = Date.now(), OCCUPE = false, PUB = null, SOIRS = null, LIENS_W = null, RAPIDE = null;
  let VUE_SOIRS = null, BUDGET_P = "saison";
  const BLOBS = new Map();

  /* ---------- Outils ---------- */
  const todayISO = () => iso(new Date());
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const titreDe = (id) => (BYID.get(id) || { titre: id }).titre;
  const dCourt = (k) => (k ? fmt(D(k)) : "date à préciser");
  const euros = (n) => (n == null || n === "" || isNaN(n) ? "" : (Math.round(n * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €");
  const num = (v) => { if (v == null || v === "") return null; if (typeof v === "number") return v; const m = String(v).replace(/\s/g, "").replace(",", ".").match(/-?\d+(\.\d+)?/); return m ? +m[0] : null; };
  /* Prix : places × prix par place, ou détail place par place (billets) quand les prix diffèrent.
     L’ancien champ « prix » (total) est encore lu s’il existe. */
  const nbPlaces = (r) => (r && r.billets && r.billets.length) || (r && r.places) || 1;
  function totalPrix(r) {
    if (!r) return null;
    if (r.billets && r.billets.length) { const l = r.billets.map((b) => num(b.prix)).filter((x) => x != null); return l.length ? l.reduce((a, b) => a + b, 0) : null; }
    if (num(r.prixPlace) != null) return num(r.prixPlace) * (r.places || 1);
    return num(r.prix);
  }
  const pleinTotal = (r) => (r && num(r.pleinPlace) != null ? num(r.pleinPlace) * nbPlaces(r) : r ? num(r.tarifPlein) : null);
  function resumePrix(r) {
    if (!r) return "";
    const t = totalPrix(r), tarif = [r.tarif, r.categoriePlace].filter(Boolean).join(", ");
    let p = "";
    if (r.billets && r.billets.length && t != null) p = r.billets.map((b) => (num(b.prix) != null ? euros(num(b.prix)) : "?") + (b.pour ? ` (${b.pour})` : "")).join(" + ") + (r.billets.length > 1 ? " = " + euros(t) : "");
    else if (num(r.prixPlace) != null) p = ((r.places || 1) > 1 ? `${r.places} × ${euros(num(r.prixPlace))} = ` : "") + euros(t);
    else if (t != null) p = euros(t);
    return [p, tarif].filter(Boolean).join(" · ");
  }
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const b64 = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = (s) => Uint8Array.from(atob(s.replace(/\s/g, "")), (c) => c.charCodeAt(0));
  const deB64txt = (s) => dec.decode(unb64(s));
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch (_) {} };
  class Annule extends Error {}

  /* ---------- Chiffrement (mêmes paramètres que tools/crypto.mjs) ---------- */
  async function derive(pw, salt, iter = ITER) {
    const base = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function ouvrirPaquet(key, p) { return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(p.iv) }, key, unb64(p.ct)))); }
  async function fermerPaquet(key, salt, iter, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj))));
    return { v: 1, kdf: "PBKDF2-SHA256", iter, salt, iv: b64(iv), ct: b64(ct) };
  }
  async function ranger(pw, jeton) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const k = await derive(pw, salt);
    return lsSet(LS_JETON, JSON.stringify(await fermerPaquet(k, b64(salt), ITER, { jeton })));
  }

  /* ---------- API GitHub ---------- */
  class ErrGH extends Error { constructor(status, m) { super(m); this.status = status; } }
  async function gh(path, { method = "GET", body } = {}, tok = TOK) {
    if (!tok) throw new ErrGH(0, "jeton");
    let r;
    try {
      r = await fetch(API + path, { method, cache: "no-store", headers: { Accept: "application/vnd.github+json", Authorization: "Bearer " + tok, "X-GitHub-Api-Version": "2022-11-28", ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    } catch (_) { throw new ErrGH(-1, "réseau"); }
    if (!r.ok) { let m = ""; try { m = (await r.json()).message || ""; } catch (_) {} throw new ErrGH(r.status, m); }
    return r.status === 204 ? null : r.json();
  }
  function msgGH(e) {
    if (e instanceof Annule) return "Annulé.";
    if (!(e instanceof ErrGH)) return e && e.message ? e.message : "Erreur inattendue.";
    if (e.status === -1) return "Pas de connexion à GitHub. Vérifie le réseau puis réessaie.";
    if (e.status === 0) return "Aucun jeton GitHub sur cet appareil : saisis-le dans l’espace admin.";
    if (e.status === 401) return "GitHub refuse le jeton (expiré ou révoqué). Crée-en un nouveau, puis « Oublier cet appareil » et reconnecte-toi.";
    if (e.status === 403 && /rate limit/i.test(e.message)) return "Trop de requêtes vers GitHub : réessaie dans quelques minutes.";
    if (e.status === 403 || e.status === 404) return "Le jeton n’a pas les droits nécessaires sur le dépôt saison (Contents : lecture et écriture).";
    return `GitHub a répondu ${e.status}${e.message ? " (" + e.message + ")" : ""}.`;
  }
  async function testerJeton(tok) {
    try { await gh(`/repos/${REPO}`, {}, tok); }
    catch (e) { throw new Error(e.status === 401 ? "Jeton invalide ou expiré." : e.status === -1 ? msgGH(e) : "Ce jeton n’a pas accès au dépôt saison."); }
    try { await gh(`/repos/${REPO}/git/blobs`, { method: "POST", body: { content: "Test d’écriture du mode admin Saison.", encoding: "utf-8" } }, tok); }
    catch (e) { throw new Error(e.status === -1 ? msgGH(e) : "Ce jeton ne peut pas écrire dans le dépôt saison : il faut « Contents : Read and write »."); }
    try { await gh(`/repos/${REPO}/actions/workflows/${WF}/runs?per_page=1`, {}, tok); return ""; }
    catch (_) { return "Jeton accepté, mais sans accès « Actions : lecture » : le suivi de publication ne sera pas affiché."; }
  }

  /* ---------- Lecture du dépôt (main) ---------- */
  async function lireDistant(pw) {
    const ref = await gh(`/repos/${REPO}/git/ref/heads/${BRANCHE}`);
    const sha = ref.object.sha;
    const c = await gh(`/repos/${REPO}/git/commits/${sha}`);
    const t = await gh(`/repos/${REPO}/git/trees/${c.tree.sha}?recursive=1`);
    const shas = Object.fromEntries(t.tree.filter((x) => x.type === "blob").map((x) => [x.path, x.sha]));
    const textes = {};
    await Promise.all(Object.values(FICHIERS).map(async (p) => {
      const s = shas[p]; if (!s) throw new Error(`${p} introuvable dans le dépôt.`);
      if (!BLOBS.has(s)) { const b = await gh(`/repos/${REPO}/git/blobs/${s}`); BLOBS.set(s, deB64txt(b.content)); }
      textes[p] = BLOBS.get(s);
    }));
    const d = {};
    for (const k of ["affiche", "journal", "lieux", "liens", "dispo"]) d[k] = JSON.parse(textes[FICHIERS[k]]);
    const paquet = JSON.parse(textes[FICHIERS.prive]);
    if (paquet.salt !== SALT || !KEY) {
      // Zone privée rechiffrée avec un autre sel (mot de passe changé ?) : il faut le mot de passe.
      const mdp = pw || (await demanderMdp());
      KEY = await derive(mdp, unb64(paquet.salt), paquet.iter); SALT = paquet.salt; ITERP = paquet.iter;
    }
    try { d.prive = await ouvrirPaquet(KEY, paquet); }
    catch (_) { KEY = null; throw new Error("La zone privée du dépôt ne s’ouvre pas avec ce mot de passe."); }
    normPrive(d.prive);
    return { sha, tree: c.tree.sha, textes, d };
  }
  function normPrive(p) {
    p.reservations ??= {}; p.envies ??= {}; p.journalPrive ??= {}; p.blocages ??= []; p.aCompleter ??= [];
    return p;
  }

  /* ---------- Contrôles (reprise de tools/check.mjs) ---------- */
  const ISO_RE = /^\d{4}-\d{2}-\d{2}$/, VENTE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/, URL_RE = /^https?:\/\/[^\s]+$/, ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const CLES_PRIVEES = new Set(["prix", "accompagnants", "places", "siege", "heure", "reserveLe", "icsToken", "tarifPlein", "prixPlace", "pleinPlace", "billets", "categoriePlace", "envies", "journalPrive", "aCompleter", "priorite", "jeton", "token"]);
  function valider(d) {
    const err = [];
    const fouille = (o, f, ch) => {
      if (Array.isArray(o)) o.forEach((v, i) => fouille(v, f, ch + "[" + i + "]"));
      else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) { if (CLES_PRIVEES.has(k)) err.push(`Donnée privée « ${k} » dans ${f}.`); fouille(v, f, ch + "." + k); }
    };
    for (const k of ["affiche", "journal", "lieux", "liens", "dispo"]) fouille(d[k], k, "");
    const ids = new Set();
    const sortie = (s, f) => {
      const ou = `« ${s.titre || s.id} »`;
      if (!s.id || !ID_RE.test(s.id)) err.push(`${ou} : identifiant invalide.`);
      if (ids.has(s.id)) err.push(`${ou} : identifiant en double.`); ids.add(s.id);
      if (!s.titre) err.push(`${ou} : titre manquant.`);
      if (!CATS.includes(s.categorie)) err.push(`${ou} : catégorie inconnue.`);
      if (!Array.isArray(s.artistes) || s.artistes.some((a) => !a.nom || !ROLES.includes(a.role))) err.push(`${ou} : artiste sans nom ou rôle inconnu.`);
      if (s.lieuId == null) { if (f === "affiche") err.push(`${ou} : lieu manquant.`); }
      else if (!d.lieux[s.lieuId]) err.push(`${ou} : lieu inconnu (${s.lieuId}).`);
      if (!(Number.isInteger(s.note) && s.note >= 0 && s.note <= 4)) err.push(`${ou} : note hors de 0–4.`);
      for (const k of ["pronostic", "publicJeune", "leonardYVa"]) if (typeof s[k] !== "boolean") err.push(`${ou} : ${k} doit être vrai ou faux.`);
      for (const k of ["debut", "fin"]) if (s[k] && !ISO_RE.test(s[k])) err.push(`${ou} : ${k} invalide.`);
      if (s.debut && s.fin && s.fin < s.debut) err.push(`${ou} : fin avant le début.`);
      for (const k of ["lien", "billetterie"]) if (s[k] != null && s[k] !== "" && !URL_RE.test(s[k])) err.push(`${ou} : ${k} n’est pas une adresse web (https://…).`);
      if (!Array.isArray(s.offres)) err.push(`${ou} : offres doit être une liste.`);
      else for (const o of s.offres) {
        if (!o.type) err.push(`${ou} : offre sans type.`);
        if (o.date && !ISO_RE.test(o.date)) err.push(`${ou} : date d’offre invalide.`);
        if (o.vente && !VENTE_RE.test(o.vente)) err.push(`${ou} : date de vente invalide.`);
      }
    };
    for (const s of d.affiche.sorties) { sortie(s, "affiche"); if (!["a-voir", "ecarte"].includes(s.statut)) err.push(`« ${s.titre} » : statut ${s.statut} interdit à l’affiche.`); }
    for (const s of d.journal.sorties) {
      sortie(s, "journal");
      if (s.statut !== "vu") err.push(`« ${s.titre} » : statut ${s.statut} interdit au journal.`);
      if (!(Array.isArray(s.vuLe) && s.vuLe.length && s.vuLe.every((x) => ISO_RE.test(x)))) err.push(`« ${s.titre} » : date de vue invalide.`);
      if (!(s.noteLeonard == null || (Number.isInteger(s.noteLeonard) && s.noteLeonard >= 1 && s.noteLeonard <= 4))) err.push(`« ${s.titre} » : ma note hors de 1–4.`);
    }
    for (const [id, l] of Object.entries(d.lieux)) {
      if (!ID_RE.test(id) || !l.nom) err.push(`Lieu ${id} : identifiant ou nom invalide.`);
      if (!ZONES_L.includes(l.zone) || !["Public", "Privé"].includes(l.statut)) err.push(`Lieu ${l.nom || id} : zone ou statut inconnu.`);
      for (const k of ["site", "billetterie"]) if (l[k] != null && !URL_RE.test(l[k])) err.push(`Lieu ${l.nom || id} : ${k} n’est pas une adresse web.`);
    }
    if (!Array.isArray(d.liens)) err.push("Liens : liste attendue.");
    else for (const l of d.liens) if (!CAT_LIENS.includes(l.categorie) || !l.titre || !URL_RE.test(l.url || "")) err.push(`Lien « ${l.titre || "?"} » : catégorie, titre ou adresse invalide.`);
    for (const k of ["reservations", "manuel", "calendrier"]) if (!Array.isArray(d.dispo[k]) || d.dispo[k].some((x) => !ISO_RE.test(x))) err.push(`Soirs pris : liste ${k} invalide.`);
    for (const [id, r] of Object.entries(d.prive.reservations)) if (r.date && !ISO_RE.test(r.date)) err.push(`Réservation ${titreDe(id)} : date invalide.`);
    for (const b of d.prive.blocages) if (b && typeof b === "object" && (!ISO_RE.test(b.debut || "") || !ISO_RE.test(b.fin || "") || b.fin < b.debut)) err.push("Période bloquée : dates invalides.");
    return err;
  }

  /* ---------- Écriture : un commit atomique par action ---------- */
  // fn(d, essai) modifie d (copie fraîche du dépôt). Elle peut lever Annule. Rejouée telle quelle si main a bougé.
  async function ecrire(message, fn) {
    if (!TOK) { formJeton(); throw new Annule(); }
    if (OCCUPE) throw new Error("Une écriture est déjà en cours, attends quelques secondes.");
    OCCUPE = true; bandeau("Enregistrement…", "run");
    try {
      for (let essai = 0; essai < 4; essai++) {
        const base = await lireDistant();
        const d = base.d, privAvant = JSON.stringify(d.prive);
        await fn(d, essai);
        const erreurs = valider(d);
        if (erreurs.length) throw new Error("Données refusées : " + erreurs.slice(0, 4).join(" "));
        const ser = (k) => (k === "dispo" ? JSON.stringify(d.dispo, null, 1) : JSON.stringify(d[k], null, 1) + "\n");
        for (const k of ["affiche", "journal"]) if (ser(k) !== base.textes[FICHIERS[k]]) d[k].maj = todayISO();
        const changes = [];
        for (const k of ["affiche", "journal", "lieux", "liens", "dispo"]) { const t = ser(k); if (t !== base.textes[FICHIERS[k]]) changes.push({ path: FICHIERS[k], content: t }); }
        if (JSON.stringify(d.prive) !== privAvant) changes.push({ path: FICHIERS.prive, content: JSON.stringify(await fermerPaquet(KEY, SALT, ITERP, d.prive)) });
        if (!changes.length) { bandeau(""); toast("Rien à enregistrer"); return true; }
        if (changes.some((c) => c.path !== FICHIERS.prive && TOK && c.content.includes(TOK))) throw new Error("Écriture bloquée : le jeton apparaîtrait dans un fichier public.");
        const tree = await gh(`/repos/${REPO}/git/trees`, { method: "POST", body: { base_tree: base.tree, tree: changes.map((c) => ({ path: c.path, mode: "100644", type: "blob", content: c.content })) } });
        const commit = await gh(`/repos/${REPO}/git/commits`, { method: "POST", body: { message, tree: tree.sha, parents: [base.sha] } });
        try { await gh(`/repos/${REPO}/git/refs/heads/${BRANCHE}`, { method: "PATCH", body: { sha: commit.sha, force: false } }); }
        catch (e) { if (e.status === 422 || e.status === 409) { await pause(400 + essai * 600); continue; } throw e; }
        appliquer(d);
        suivrePublication(commit.sha);
        return true;
      }
      throw new Error("Le dépôt a changé plusieurs fois pendant l’enregistrement : réessaie dans une minute.");
    } catch (e) {
      bandeau(e instanceof Annule ? "" : msgGH(e), e instanceof Annule ? "" : "ko");
      throw e;
    } finally { OCCUPE = false; }
  }
  // En cas de modification concurrente du même objet : on demande.
  function garde(avant, maintenant, quoi) {
    if (avant === undefined) return;
    if (JSON.stringify(avant ?? null) !== JSON.stringify(maintenant ?? null) && !confirm(`${quoi} a été modifié ailleurs (Claude Code ou un autre appareil) depuis l’ouverture du formulaire. Remplacer par ta version ?`)) throw new Annule();
  }
  // Applique des données fraîches à l’interface.
  function appliquer(d) {
    PRIVE = d.prive;
    const dispo = { ...d.dispo, reservations: [...new Set(Object.values(d.prive.reservations).map((r) => r.date).filter(Boolean))].sort() };
    applyData({ affiche: d.affiche, journal: d.journal, lieux: d.lieux, liens: d.liens, dispo });
    rafraichir();
  }
  async function rafraichir() {
    const h = location.hash.slice(1) || "affiche";
    if (h.startsWith("sortie-")) { await renderView(BASE || "affiche"); openSheet(decodeURIComponent(h.slice(7))); }
    else await renderView(h);
  }
  async function recharger(pw) { const b = await lireDistant(pw); appliquer(b.d); }

  /* ---------- Bandeau de publication ---------- */
  function bandeau(t, cls = "", lien) {
    let el = $("#pub");
    if (!el) { el = document.createElement("div"); el.id = "pub"; el.className = "pub"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); document.body.appendChild(el); }
    el.hidden = !t; el.className = "pub " + cls;
    el.innerHTML = t ? esc(t) + (lien ? ` <a href="${esc(lien)}" target="_blank" rel="noopener">Voir le détail</a>` : "") + (cls === "ko" || cls === "ok" ? ' <button type="button" aria-label="Fermer le bandeau">×</button>' : "") : "";
    const b = el.querySelector("button"); if (b) b.onclick = () => (el.hidden = true);
  }
  async function suivrePublication(sha) {
    PUB = sha; bandeau("Publication en cours…", "run");
    const t0 = Date.now();
    let runId = null;
    while (PUB === sha && TOK && Date.now() - t0 < 15 * 60e3) {
      await pause(POLL);
      if (PUB !== sha || !TOK) return;
      let r;
      try {
        if (runId) r = await gh(`/repos/${REPO}/actions/runs/${runId}`);
        else r = ((await gh(`/repos/${REPO}/actions/workflows/${WF}/runs?head_sha=${sha}&per_page=5`)).workflow_runs || [])[0];
      } catch (e) { if (e.status === -1) continue; bandeau("Enregistré. Publication lancée (suivi indisponible avec ce jeton).", "ok"); return; }
      if (!r) { bandeau("Publication en attente de lancement…", "run"); continue; }
      runId = r.id;
      if (r.status !== "completed") { bandeau(r.status === "queued" || r.status === "pending" || r.status === "waiting" ? "Publication en file d’attente…" : "Publication en cours…", "run"); continue; }
      if (r.conclusion === "cancelled" || r.conclusion === "skipped") {
        // GitHub regroupe les publications rapprochées : on suit la plus récente, qui contient aussi ce changement.
        try { const d = (await gh(`/repos/${REPO}/actions/workflows/${WF}/runs?per_page=1`)).workflow_runs[0]; if (d && d.id !== runId) { runId = d.id; bandeau("Publication regroupée avec la suivante…", "run"); continue; } } catch (_) {}
      }
      if (r.conclusion === "success") {
        bandeau("En ligne", "ok");
        try { await recharger(); } catch (_) {}
        setTimeout(() => { if (PUB === sha) bandeau(""); }, 5000);
      } else bandeau("Échec de la publication : les données sont enregistrées mais le site n’est pas à jour.", "ko", r.html_url);
      return;
    }
  }

  /* ---------- Verrouillage ---------- */
  const actif = () => { LAST = Date.now(); };
  ["pointerdown", "keydown", "input"].forEach((t) => document.addEventListener(t, actif, { passive: true, capture: true }));
  const verifInactif = () => { if (PRIVE && Date.now() - LAST > INACTIF) verrouiller("Verrouillé après 30 min d’inactivité"); };
  setInterval(verifInactif, 20e3);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) verifInactif(); });
  function verrouiller(msg) {
    PRIVE = null; TOK = null; KEY = null; SALT = null; PUB = null; JAVEC = ""; SOIRS = null; LIENS_W = null; RAPIDE = null;
    BLOBS.clear(); fermerDlg(); bandeau(""); document.body.classList.remove("adm"); lockIcon();
    if ($("#sheet").hidden) $("#sheetIn").innerHTML = ""; // fiche fermée : aucun reste du bloc admin dans la page
    rafraichir(); if (msg) toast(msg);
  }

  /* ---------- Dialogue (formulaires) ---------- */
  function fermerDlg() { const d = $("#dlg"); if (d) d.remove(); document.documentElement.style.overflow = $("#sheet").hidden ? "" : "hidden"; }
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && $("#dlg")) { ev.stopImmediatePropagation(); ev.preventDefault(); fermerDlg(); } }, true);
  function dlg(titre, corps, onSubmit, { valider: lbl = "Enregistrer", danger } = {}) {
    fermerDlg();
    const el = document.createElement("div"); el.className = "sheet"; el.id = "dlg";
    el.innerHTML = `<div class="sheet-in" role="dialog" aria-modal="true" aria-labelledby="dlgT" tabindex="-1"><div class="shtop"><button class="btn ico" type="button" data-dlgclose aria-label="Fermer">×</button><h2 class="k" id="dlgT">${esc(titre)}</h2></div>
    <form class="frm" novalidate autocomplete="off">${corps}<p class="err" role="alert" hidden></p><div class="acts"><button class="btn pri" type="submit">${esc(lbl)}</button>${danger || ""}<button class="btn" type="button" data-dlgclose>Annuler</button></div></form></div>`;
    document.body.appendChild(el); document.documentElement.style.overflow = "hidden";
    const form = el.querySelector("form"), errEl = form.querySelector(".err"), sub = form.querySelector('[type="submit"]');
    el.addEventListener("click", (ev) => { if (ev.target === el || ev.target.closest("[data-dlgclose]")) fermerDlg(); });
    form.onsubmit = async (ev) => {
      ev.preventDefault(); errEl.hidden = true; sub.disabled = true;
      try { const r = await onSubmit(form); if (r !== false) fermerDlg(); }
      catch (e) { if (!(e instanceof Annule)) { errEl.textContent = msgGH(e); errEl.hidden = false; } }
      finally { sub.disabled = false; }
    };
    branchAcc(form); brancherPrix(form);
    el.querySelector(".sheet-in").focus();
    return form;
  }
  const val = (f, n) => { const e = f.elements[n]; return e ? String(e.value ?? "").trim() : ""; };
  const champ = (lab, html, cls = "") => `<label class="f ${cls}"><span>${lab}</span>${html}</label>`;
  const inp = (name, v, attrs = "") => `<input name="${name}" value="${esc(v ?? "")}" ${attrs}>`;
  const sel = (name, opts, v) => `<select name="${name}">${opts.map((o) => { const [k, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(k)}"${String(k) === String(v ?? "") ? " selected" : ""}>${esc(t)}</option>`; }).join("")}</select>`;
  const ck = (name, on, lab) => `<label class="f ck"><input type="checkbox" name="${name}"${on ? " checked" : ""}> <span>${lab}</span></label>`;
  const dl = (id, items) => `<datalist id="${id}">${[...new Set(items)].map((x) => `<option value="${esc(x)}"></option>`).join("")}</datalist>`;

  /* ---------- Accompagnants (saisie avec autocomplétion) ---------- */
  function nomsConnus() {
    const s = new Set();
    Object.values(PRIVE.reservations).forEach((r) => (r.accompagnants || []).forEach((n) => s.add(n)));
    Object.values(PRIVE.journalPrive).forEach((r) => (r.accompagnants || []).forEach((n) => s.add(n)));
    return [...s].sort((a, b) => a.localeCompare(b, "fr"));
  }
  const accChip = (n) => `<span class="chip on">${esc(n)}<input type="hidden" name="acc" value="${esc(n)}"><button type="button" class="x" data-accdel aria-label="Retirer ${esc(n)}">×</button></span>`;
  const accHTML = (liste) => champ("Accompagnants", `<span class="accs">${(liste || []).map(accChip).join("")}<input data-accin list="dl-acc" placeholder="Nom, puis Entrée" enterkeyhint="done"><button type="button" class="btn" data-accadd>Ajouter</button></span>${dl("dl-acc", nomsConnus())}`);
  function branchAcc(form) {
    const box = form.querySelector(".accs"); if (!box) return;
    const input = box.querySelector("[data-accin]");
    const ajoute = () => { const v = input.value.trim().replace(/,$/, ""); if (v && !lireAcc(form, true).includes(v)) input.insertAdjacentHTML("beforebegin", accChip(v)); input.value = ""; };
    box.addEventListener("click", (ev) => { if (ev.target.closest("[data-accadd]")) ajoute(); const d = ev.target.closest("[data-accdel]"); if (d) d.parentElement.remove(); });
    input.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === ",") { ev.preventDefault(); ajoute(); } });
  }
  function lireAcc(form, seul) {
    const l = [...form.querySelectorAll('input[name="acc"]')].map((x) => x.value);
    const p = !seul && form.querySelector("[data-accin]") ? form.querySelector("[data-accin]").value.trim() : "";
    if (p && !l.includes(p)) l.push(p);
    return l;
  }

  /* ---------- Places et prix (formulaire) ---------- */
  const tarifsConnus = () => [...new Set([...TARIFS, ...[...Object.values(PRIVE.reservations), ...Object.values(PRIVE.journalPrive)].flatMap((x) => [x.tarif, ...(x.billets || []).map((b) => b.tarif)]).filter(Boolean)])];
  const billetRow = (b = {}) => `<div class="bl3"><div class="grid2">${champ("Pour", inp("b_pour", b.pour, 'list="dl-pour" placeholder="Moi"'))}${champ("Prix (€)", inp("b_prix", b.prix ?? "", 'inputmode="decimal"'))}</div><div class="grid2">${champ("Tarif", inp("b_tarif", b.tarif, 'list="dl-tarifs"'))}${champ("Catégorie", inp("b_cat", b.categoriePlace, 'placeholder="cat. 1"'))}</div><button type="button" class="linkbtn" data-delbillet>Retirer cette place</button></div>`;
  function prixHTML(r = {}) {
    const det = !!(r.billets && r.billets.length);
    const unit = num(r.prixPlace) != null ? num(r.prixPlace) : num(r.prix) != null && !det ? Math.round((num(r.prix) / (r.places || 1)) * 100) / 100 : "";
    return `<fieldset class="fs" data-prix><legend>Places et prix</legend>
      <div class="grid2">${champ("Places", inp("places", nbPlaces(r), 'type="number" min="1" max="30" inputmode="numeric"'))}${champ("Catégorie de place", inp("categoriePlace", r.categoriePlace, 'placeholder="cat. 1, placement libre…"'))}</div>
      ${champ("Tarif", inp("tarif", r.tarif, 'list="dl-tarifs" placeholder="Abonné jeune moins de 28 ans…"') + dl("dl-tarifs", tarifsConnus()))}
      <div class="grid2"><div data-unit${det ? " hidden" : ""}>${champ("Prix par place (€)", inp("prixPlace", unit, 'inputmode="decimal"'))}</div>${champ("Plein tarif par place (€)", inp("pleinPlace", r.pleinPlace ?? (num(r.tarifPlein) != null ? Math.round((num(r.tarifPlein) / nbPlaces(r)) * 100) / 100 : ""), 'inputmode="decimal" placeholder="facultatif"'))}</div>
      ${ck("detail", det, "Prix différents selon les places")}
      <div data-billets${det ? "" : " hidden"}>${(det ? r.billets : []).map(billetRow).join("")}<button type="button" class="btn" data-addbillet>+ Place</button></div>
      ${dl("dl-pour", ["Moi", ...nomsConnus()])}
      <p class="total" data-total aria-live="polite"></p></fieldset>`;
  }
  function lirePrix(f) {
    const out = { places: Math.max(1, Math.round(num(val(f, "places")) || 1)) };
    const t = val(f, "tarif"), c = val(f, "categoriePlace"), pl = num(val(f, "pleinPlace"));
    if (t) out.tarif = t;
    if (c) out.categoriePlace = c;
    if (f.elements.detail && f.elements.detail.checked) {
      const l = [...f.querySelectorAll("[data-billets] .bl3")].map((x) => {
        const q = (n) => x.querySelector(`[name="${n}"]`).value.trim(), b = { pour: q("b_pour"), prix: num(q("b_prix")) };
        if (q("b_tarif")) b.tarif = q("b_tarif"); if (q("b_cat")) b.categoriePlace = q("b_cat");
        return b;
      });
      if (l.length) { out.billets = l; out.places = l.length; }
    }
    if (!out.billets) out.prixPlace = num(val(f, "prixPlace"));
    if (pl != null) out.pleinPlace = pl;
    return out;
  }
  function brancherPrix(form) {
    const box = form.querySelector("[data-prix]"); if (!box) return;
    const E = form.elements, rows = box.querySelector("[data-billets]"), plus = rows.querySelector("[data-addbillet]");
    const lignes = () => [...rows.querySelectorAll(".bl3")];
    const ajoute = (b) => plus.insertAdjacentHTML("beforebegin", billetRow(b));
    const maj = () => { const r = lirePrix(form), t = totalPrix(r); box.querySelector("[data-total]").textContent = t == null ? "Total : prix à préciser" : "Total : " + resumePrix({ ...r, tarif: "", categoriePlace: "" }); };
    E.detail.addEventListener("change", () => {
      const on = E.detail.checked; box.querySelector("[data-unit]").hidden = on; rows.hidden = !on;
      if (on && !lignes().length) { const n = Math.max(1, num(E.places.value) || 1), acc = lireAcc(form); for (let i = 0; i < n; i++) ajoute({ pour: i === 0 ? "Moi" : acc[i - 1] || "", prix: num(E.prixPlace.value), tarif: E.tarif.value.trim(), categoriePlace: E.categoriePlace.value.trim() }); }
      maj();
    });
    E.places.addEventListener("change", () => { if (!E.detail.checked) return maj(); const n = Math.max(1, num(E.places.value) || 1); while (lignes().length < n) ajoute({ tarif: E.tarif.value.trim(), categoriePlace: E.categoriePlace.value.trim() }); while (lignes().length > n) lignes().at(-1).remove(); maj(); });
    box.addEventListener("click", (ev) => {
      if (ev.target.closest("[data-addbillet]")) { ajoute({ tarif: E.tarif.value.trim(), categoriePlace: E.categoriePlace.value.trim() }); E.places.value = lignes().length; maj(); }
      const d = ev.target.closest("[data-delbillet]"); if (d) { d.closest(".bl3").remove(); E.places.value = Math.max(1, lignes().length); if (!lignes().length) { E.detail.checked = false; E.detail.dispatchEvent(new Event("change")); } maj(); }
    });
    box.addEventListener("input", maj);
    maj();
  }

  /* ---------- Conflits ---------- */
  function conflits(d, date, sansId) {
    if (!date) return [];
    const out = [];
    if ((d.dispo.manuel || []).includes(date)) out.push("soir déclaré pris");
    if ((d.dispo.calendrier || []).includes(date)) out.push("événement dans Apple Calendar");
    for (const [id, r] of Object.entries(d.prive.reservations)) if (id !== sansId && r.date === date) out.push("réservation : " + titreDe(id));
    for (const b of d.prive.blocages || []) {
      const deb = typeof b === "string" ? b : b.date || b.debut, fin = typeof b === "string" ? b : b.fin || b.date || b.debut;
      if (deb && date >= deb && date <= fin) out.push("blocage" + (b.motif ? " : " + b.motif : ""));
    }
    return out;
  }
  const etatLocal = () => ({ dispo: BUSY_SRC, prive: PRIVE });
  function confirmeConflits(d, date, sansId, deja) {
    const c = conflits(d, date, sansId).filter((x) => !(deja || []).includes(x));
    if (c.length && !confirm(`Le ${fmtY(D(date), true)} est déjà pris :\n– ${c.join("\n– ")}\n\nConfirmer quand même ?`)) throw new Annule();
    return c;
  }

  /* ---------- Envies ---------- */
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-8.6C1.3 8.5 3 5 6.4 5c2 0 3.3 1.1 4.1 2.4h3C14.3 6.1 15.6 5 17.6 5 21 5 22.7 8.5 21.2 11.4 19 15.6 12 20 12 20z"/></svg>';
  function heart(id) {
    if (!PRIVE) return "";
    const on = !!PRIVE.envies[id];
    return `<button class="heart" type="button" data-envie="${esc(id)}" aria-pressed="${on}" aria-label="Ça m’intéresse : ${esc(titreDe(id))}">${HEART}</button>`;
  }
  async function basculerEnvie(id, prio) {
    const on = !!PRIVE.envies[id] && prio == null;
    await ecrire("Admin : envies mises à jour", (d) => {
      if (on) delete d.prive.envies[id];
      else d.prive.envies[id] = { ajouteLe: d.prive.envies[id]?.ajouteLe || todayISO(), priorite: prio ?? d.prive.envies[id]?.priorite ?? 2, note: d.prive.envies[id]?.note || "" };
    });
  }

  function formEnvie(id) {
    const v = PRIVE.envies[id] || {};
    const form = dlg(`Envie : ${titreDe(id)}`, `${champ("Priorité", sel("priorite", [[1, "Forte"], [2, "Normale"], [3, "Faible"]], v.priorite || 2))}${champ("Note (privée)", `<textarea name="note" rows="3" placeholder="Avec qui, quel soir, quel tarif viser…">${esc(v.note || "")}</textarea>`)}`, async (f) => {
      const priorite = +val(f, "priorite"), note = val(f, "note");
      return ecrire("Admin : envies mises à jour", (d) => { const old = d.prive.envies[id] || {}; d.prive.envies[id] = { ajouteLe: old.ajouteLe || todayISO(), priorite, note }; });
    }, { danger: PRIVE.envies[id] ? '<button class="btn" type="button" data-envdel>Retirer des envies</button>' : "" });
    const del = form.querySelector("[data-envdel]"); if (del) del.onclick = () => { fermerDlg(); act(() => basculerEnvie(id)); };
  }

  /* ---------- Fiche : bloc admin ---------- */
  function ficheHTML(e) {
    if (!PRIVE) return "";
    const vu = e.statut === "vu", r = PRIVE.reservations[e.id], env = PRIVE.envies[e.id], jp = PRIVE.journalPrive[e.id];
    const b = (act, t, cls = "") => `<button class="btn ${cls}" type="button" data-adm="${act}" data-id="${esc(e.id)}">${t}</button>`;
    let etat = "";
    if (r) etat = `<p><b>Réservé</b> : ${r.date ? esc(fmtY(D(r.date), true)) : "date à préciser"}${r.heure ? " à " + esc(r.heure) : ""}${detRes(r)}</p>`;
    if (vu && jp) etat += `<p>${esc([jp.places || (jp.billets && jp.billets.length) ? plural(nbPlaces(jp), "place") : "", resumePrix(jp), (jp.accompagnants || []).length ? "avec " + jp.accompagnants.join(", ") : ""].filter(Boolean).join(" · "))}</p>`;
    if (env) etat += `<p><b>Dans mes envies</b> · priorité ${PRI[env.priorite || 2]}${env.note ? " · « " + esc(env.note) + " »" : ""}</p>`;
    const prio = env ? `<div class="chips wrap-ok" role="group" aria-label="Priorité">${[1, 2, 3].map((p) => `<button class="chip" type="button" data-adm="prio" data-p="${p}" data-id="${esc(e.id)}" aria-pressed="${(env.priorite || 2) === p}">Priorité ${PRI[p]}</button>`).join("")}<button class="chip" type="button" data-adm="envie" data-id="${esc(e.id)}">Note</button></div>` : "";
    const acts = vu
      ? b("revu", "Vu à nouveau") + b("notes", "Mes notes, prix, avec qui") + b("editer", "Modifier la fiche") + b("supprimer", "Supprimer")
      : (r ? b("reserver", "Modifier la réservation", "pri") + b("annuler", "Annuler la réservation") : b("reserver", "Réserver", "pri")) +
        b("vu", "Marquer vu") + `<button class="btn" type="button" data-envie="${esc(e.id)}" aria-pressed="${!!env}">${env ? "♥ Dans mes envies" : "♡ Ça m’intéresse"}</button>` +
        b("editer", "Modifier la fiche") + (e.statut === "ecarte" ? b("remettre", "Remettre à l’affiche") : b("ecarter", "Écarter")) + b("supprimer", "Supprimer");
    return `<section class="admbox" aria-label="Admin"><h3 class="sec">Admin${e.statut === "ecarte" ? " · écartée (masquée du public)" : ""}</h3>${etat}${prio}<div class="acts">${acts}</div></section>`;
  }
  const detRes = (r) => {
    const t = [r.salle, r.places || (r.billets && r.billets.length) ? plural(nbPlaces(r), "place") : "", r.siege, resumePrix(r), (r.accompagnants || []).length ? "avec " + r.accompagnants.join(", ") : "", r.note].filter(Boolean).join(" · ");
    return t ? " · " + esc(t) : "";
  };

  /* ---------- Réserver ---------- */
  function joursJoues(e) {
    const p = span(e); if (!p) return [];
    const out = []; for (let d = new Date(Math.max(+p[0], +TODAY)); d <= p[1] && out.length < 400; d = add(d, 1)) out.push(iso(d));
    return out;
  }
  function formReserver(id) {
    const e = BYID.get(id); if (!e) return;
    const r0 = PRIVE.reservations[id], r = r0 || {};
    const jours = joursJoues(e); if (r.date && !jours.includes(r.date)) jours.unshift(r.date);
    const loc = etatLocal();
    const opts = jours.map((k) => [k, `${fmtY(D(k), true)}${conflits(loc, k, id).length ? " · pris" : ""}`]);
    const mh = /\b(\d{1,2})\s*h\s*(\d{2})?/i.exec(e.horaires || "");
    const hDef = r.heure || (mh && +mh[1] >= 10 ? String(mh[1]).padStart(2, "0") + ":" + (mh[2] || "00") : "");
    const form = dlg(r0 ? `Modifier la réservation : ${e.titre}` : `Réserver : ${e.titre}`, `
      ${jours.length ? champ("Date", sel("date", [...opts, ["autre", "Autre date…"]], r.date || "")) + `<div data-autre hidden>${champ("Autre date", inp("date_autre", r.date || "", 'type="date"'))}</div>` : champ("Date", inp("date_autre", r.date || "", 'type="date"'))}
      <p class="warn" data-conf hidden></p>
      <div class="grid2">${champ("Heure", inp("heure", hDef, 'type="time"'))}${champ("Salle", inp("salle", r.salle ?? e.salle ?? ""))}</div>
      ${champ("Siège(s)", inp("siege", r.siege, 'placeholder="Rang D, 12-13"'))}
      ${prixHTML(r)}
      ${accHTML(r.accompagnants)}
      ${champ("Billetterie (où acheté)", inp("billetterie", r.billetterie))}
      ${champ("Note", inp("note", r.note))}`, async (f) => {
      const date = val(f, "date") && val(f, "date") !== "autre" ? val(f, "date") : val(f, "date_autre");
      if (!date) throw new Error("Choisis une date.");
      const res = { date, heure: val(f, "heure"), salle: val(f, "salle"), siege: val(f, "siege"), ...lirePrix(f), accompagnants: lireAcc(f), billetterie: val(f, "billetterie"), note: val(f, "note") };
      const vus = confirmeConflits(etatLocal(), date, id);
      return ecrire(`Admin : ${r0 ? "réservation modifiée" : "réservé"} ${e.titre} le ${fmt(D(date))}`, (d) => {
        garde(r0, d.prive.reservations[id], "La réservation");
        confirmeConflits(d, date, id, vus);
        d.prive.reservations[id] = res;
        delete d.prive.envies[id];
        const s = d.affiche.sorties.find((x) => x.id === id); if (s) s.leonardYVa = true;
      });
    }, { valider: r0 ? "Enregistrer" : "Réserver" });
    const s = f_sel(form, "date"), autre = form.querySelector("[data-autre]"), conf = form.querySelector("[data-conf]");
    const maj = () => {
      if (autre) autre.hidden = s.value !== "autre";
      const k = s && s.value !== "autre" ? s.value : val(form, "date_autre");
      const c = conflits(etatLocal(), k, id); conf.hidden = !c.length; conf.textContent = c.length ? "Déjà pris ce soir-là : " + c.join(", ") + "." : "";
    };
    if (s) s.onchange = maj; if (form.elements.date_autre) form.elements.date_autre.onchange = maj; maj();
  }
  const f_sel = (form, n) => form.elements[n] && form.elements[n].tagName === "SELECT" ? form.elements[n] : null;

  async function annulerRes(id) {
    const r = PRIVE.reservations[id]; if (!r) return;
    if (!confirm(`Annuler la réservation de « ${titreDe(id)} » (${dCourt(r.date)}) ? Le soir sera libéré.`)) return;
    await ecrire(`Admin : annulé ${titreDe(id)} (${dCourt(r.date)})`, (d) => {
      delete d.prive.reservations[id];
      const s = d.affiche.sorties.find((x) => x.id === id); if (s) s.leonardYVa = false;
    });
    toast("Réservation annulée");
  }

  /* ---------- Vu ---------- */
  function formVu(id, mode) {
    const e = BYID.get(id); if (!e) return;
    const r = PRIVE.reservations[id] || {}, jp = PRIVE.journalPrive[id] || {};
    const edit = mode === "notes", revu = mode === "revu";
    const src = edit ? jp : { ...jp, ...r };
    const dDef = edit ? (e.vuLe || []).at(-1) : r.date && D(r.date) <= TODAY ? r.date : revu || !r.date ? todayISO() : r.date;
    dlg(edit ? `Mes notes : ${e.titre}` : `Vu : ${e.titre}`, `
      ${champ(edit ? "Dates vues (AAAA-MM-JJ, séparées par des virgules)" : "Vu le", edit ? inp("vuLe", (e.vuLe || []).join(", ")) : inp("date", dDef, 'type="date"'))}
      ${champ("Ma note", sel("noteLeonard", [["", "Pas de note"], [4, "★★★★"], [3, "★★★"], [2, "★★"], [1, "★"]], e.noteLeonard ?? ""))}
      ${champ("Mon avis (public)", `<textarea name="avis" rows="3">${esc(e.avis || "")}</textarea>`)}
      ${revu ? '<p class="cr">Places et prix de cette nouvelle fois : ils s’ajoutent aux précédents.</p>' : ""}${prixHTML(revu ? { places: nbPlaces(jp), tarif: jp.tarif, categoriePlace: jp.categoriePlace } : src)}
      ${accHTML(src.accompagnants)}`, async (f) => {
      const note = val(f, "noteLeonard") ? +val(f, "noteLeonard") : null, avis = val(f, "avis");
      let priv = { ...lirePrix(f), accompagnants: lireAcc(f) };
      let dates;
      if (edit) { dates = val(f, "vuLe").split(/[,;\s]+/).filter(Boolean); if (!dates.length || dates.some((x) => !ISO_RE.test(x))) throw new Error("Dates au format AAAA-MM-JJ, séparées par des virgules."); }
      else { const x = val(f, "date"); if (!ISO_RE.test(x)) throw new Error("Choisis la date."); dates = [x]; }
      const etoiles = note ? ", " + "★".repeat(note) : "";
      return ecrire(edit ? `Admin : notes modifiées pour ${e.titre}` : `Admin : vu ${e.titre} le ${fmt(D(dates[0]))}${etoiles}`, (d) => {
        let s = d.journal.sorties.find((x) => x.id === id);
        const i = d.affiche.sorties.findIndex((x) => x.id === id);
        if (!s && i < 0) throw new Error("Cette sortie n’existe plus dans le dépôt.");
        if (!s) { s = { ...d.affiche.sorties[i] }; d.affiche.sorties.splice(i, 1); d.journal.sorties.unshift(s); s.vuLe = []; }
        else if (i >= 0) d.affiche.sorties.splice(i, 1);
        s.statut = "vu"; s.leonardYVa = false;
        s.vuLe = edit ? [...new Set(dates)].sort() : [...new Set([...(s.vuLe || []), ...dates])].sort();
        s.noteLeonard = note; s.avis = avis;
        const old = d.prive.journalPrive[id];
        if (revu && old) priv = cumuler(old, priv);
        d.prive.journalPrive[id] = priv;
        if (!edit) { delete d.prive.reservations[id]; delete d.prive.envies[id]; }
      });
    }, { valider: edit ? "Enregistrer" : "Archiver au journal" });
  }

  // Vu à nouveau : les places s’ajoutent, détaillées place par place.
  function enBillets(r) {
    if (r.billets && r.billets.length) return r.billets.map((b) => ({ ...b }));
    const n = r.places || 1, u = num(r.prixPlace) != null ? num(r.prixPlace) : num(r.prix) != null ? num(r.prix) / n : null;
    return Array.from({ length: n }, () => ({ pour: "", prix: u, ...(r.tarif ? { tarif: r.tarif } : {}), ...(r.categoriePlace ? { categoriePlace: r.categoriePlace } : {}) }));
  }
  function cumuler(a, b) {
    const billets = [...enBillets(a), ...enBillets(b)];
    const out = { places: billets.length, billets, accompagnants: [...new Set([...(a.accompagnants || []), ...(b.accompagnants || [])])] };
    if (a.tarif || b.tarif) out.tarif = b.tarif || a.tarif;
    return out;
  }

  /* ---------- Ajouter / modifier une sortie ---------- */
  const nomLieu = (id) => (LIEUX[id] ? LIEUX[id].nom : "");
  function lieuDepuisNom(v) {
    const n = norm(v).trim(); if (!n) return null;
    return Object.keys(LIEUX).find((id) => norm(LIEUX[id].nom) === n || norm(court(id)) === n || id === n) || null;
  }
  const artRow = (a = {}) => `<div class="ar">${inp("a_nom", a.nom, 'list="dl-art" placeholder="Nom complet" aria-label="Nom de l’artiste"')}${sel("a_role", ROLES, a.role || "artiste")}<button type="button" class="btn ico" data-del aria-label="Retirer">×</button></div>`;
  const offreRow = (o = {}) => { const [vd, vh] = (o.vente || "").split("T"); return `<fieldset class="fs of"><div class="grid2">${champ("Type", inp("o_type", o.type, 'list="dl-off"'))}${champ("Tarif", inp("o_tarif", o.tarif, 'placeholder="10 €"'))}</div><div class="grid2">${champ("Date du spectacle", inp("o_date", o.date, 'type="date"'))}${champ("Condition", inp("o_cond", o.condition, 'placeholder="Moins de 28 ans"'))}</div><div class="grid2">${champ("Ouverture de la vente", inp("o_vd", vd, 'type="date"'))}${champ("Heure", inp("o_vh", vh, 'type="time"'))}</div>${ck("o_approx", o.venteApprox, "Date de vente estimée")}<button type="button" class="linkbtn" data-del>Retirer cette offre</button></fieldset>`; };
  function formSortie(id) {
    const e0 = id ? BYID.get(id) : null, e = e0 || { categorie: "Théâtre", artistes: [], offres: [], note: 2, pronostic: false, publicJeune: false };
    const vu = e.statut === "vu";
    const arts = [...new Set([...AFF, ...(JOURNAL || [])].flatMap((x) => (x.artistes || []).map((a) => a.nom)))].sort((a, b) => a.localeCompare(b, "fr"));
    const lieuxNoms = Object.keys(LIEUX).map((k) => LIEUX[k].nom).sort((a, b) => a.localeCompare(b, "fr"));
    const form = dlg(e0 ? `Modifier : ${e0.titre}` : "Ajouter une sortie", `
      <div class="grid2">${champ("Catégorie", sel("categorie", CATS, e.categorie))}${champ("Sous-genre", inp("sousGenre", e.sousGenre, 'placeholder="Cirque, Version de concert…"'))}</div>
      ${champ("Titre", inp("titre", e.titre, "required"))}
      <fieldset class="fs"><legend>Artistes</legend><div data-arts>${(e.artistes.length ? e.artistes : [{}]).map(artRow).join("")}</div><button type="button" class="btn" data-addart>+ Artiste</button>${dl("dl-art", arts)}</fieldset>
      ${champ("Lieu", inp("lieu", nomLieu(e.lieuId), 'list="dl-lieux" placeholder="Commence à taper…"') + dl("dl-lieux", lieuxNoms))}
      <fieldset class="fs" data-nl hidden><legend>Nouveau lieu</legend>
        <div class="grid2">${champ("Ville", inp("nl_ville", "Paris"))}${champ("Zone", sel("nl_zone", ZONES_L, "Paris"))}</div>
        <div class="grid2">${champ("Statut", sel("nl_statut", ["Public", "Privé"], "Public"))}${champ("Tarif jeune du lieu", inp("nl_tj", ""))}</div>
        ${champ("Adresse", inp("nl_adr", ""))}${champ("Site", inp("nl_site", "", 'type="url" placeholder="https://…"'))}${champ("Billetterie", inp("nl_bil", "", 'type="url" placeholder="https://…"'))}</fieldset>
      ${champ("Salle", inp("salle", e.salle))}
      <div class="grid2">${champ("Début", inp("debut", e.debut, 'type="date"'))}${champ("Fin", inp("fin", e.fin, 'type="date"'))}</div>
      ${champ("Dates en clair (facultatif)", inp("datesTexte", e.datesTexte, 'placeholder="15 oct. 2026 – 27 janv. 2027"'))}
      ${champ("Horaires (facultatif)", inp("horaires", e.horaires, 'placeholder="20h, dim. 15h · 2h45"'))}
      <div class="grid2">${champ("Note (grille)", sel("note", [[4, "4 · incontournable"], [3, "3 · fortement recommandé"], [2, "2 · bon choix"], [1, "1 · curiosité"], ...(vu ? [[0, "0 · sans note"]] : [])], e.note))}<div>${ck("pronostic", e.pronostic, "Pronostic (pas encore critiqué)")}${ck("publicJeune", e.publicJeune, "Adapté à un public jeune")}</div></div>
      ${champ("Pourquoi (une phrase factuelle)", `<textarea name="pourquoi" rows="2">${esc(e.pourquoi || "")}</textarea>`)}
      ${champ("Lien officiel", inp("lien", e.lien, 'type="url" placeholder="https://…"'))}
      ${champ("Billetterie directe (facultatif)", inp("billetterie", e.billetterie, 'type="url" placeholder="https://…"'))}
      <fieldset class="fs"><legend>Offres jeunes et ventes</legend><div data-offres>${(e.offres || []).map(offreRow).join("")}</div><button type="button" class="btn" data-addoff>+ Offre</button>${dl("dl-off", TYPES_OFFRE)}</fieldset>`, async (f) => {
      const titre = val(f, "titre"); if (!titre) throw new Error("Le titre est obligatoire.");
      let lieuId = lieuDepuisNom(val(f, "lieu")), nouveauLieu = null;
      if (!lieuId && val(f, "lieu")) {
        const nom = val(f, "lieu"); let k = slug(nom), i = 2; while (LIEUX[k]) k = slug(nom) + "-" + i++;
        nouveauLieu = { id: k, l: { nom, ville: val(f, "nl_ville") || "Paris", zone: val(f, "nl_zone"), statut: val(f, "nl_statut"), site: val(f, "nl_site") || null, billetterie: val(f, "nl_bil") || null, tarifJeune: val(f, "nl_tj"), ...(val(f, "nl_adr") ? { adresse: val(f, "nl_adr") } : {}) } };
        lieuId = k;
      }
      if (!lieuId && !vu) throw new Error("Indique le lieu.");
      const artistes = [...f.querySelectorAll("[data-arts] .ar")].map((r) => ({ nom: r.querySelector('[name="a_nom"]').value.trim().replace(/'/g, "’"), role: r.querySelector('[name="a_role"]').value })).filter((a) => a.nom);
      const offres = [...f.querySelectorAll("[data-offres] .of")].map((r) => {
        const q = (n) => r.querySelector(`[name="${n}"]`); const o = { type: q("o_type").value.trim() };
        if (q("o_date").value) o.date = q("o_date").value; if (q("o_tarif").value.trim()) o.tarif = q("o_tarif").value.trim();
        if (q("o_vd").value) { o.vente = q("o_vd").value + (q("o_vh").value ? "T" + q("o_vh").value : ""); o.venteApprox = q("o_approx").checked; }
        if (q("o_cond").value.trim()) o.condition = q("o_cond").value.trim();
        return o;
      }).filter((o) => o.type);
      const champs = { titre, categorie: val(f, "categorie"), sousGenre: val(f, "sousGenre"), artistes, lieuId: lieuId || null, salle: val(f, "salle"), debut: val(f, "debut"), fin: val(f, "fin") || val(f, "debut"),
        datesTexte: val(f, "datesTexte"), horaires: val(f, "horaires"), note: +val(f, "note"), pronostic: f.elements.pronostic.checked, pourquoi: val(f, "pourquoi"), lien: val(f, "lien") || null, billetterie: val(f, "billetterie") || null, publicJeune: f.elements.publicJeune.checked, offres };
      for (const k of ["datesTexte", "horaires"]) if (!champs[k]) delete champs[k];
      if (!e0) {
        const memes = [...AFF, ...(JOURNAL || [])].filter((x) => norm(x.titre) === norm(titre));
        if (memes.length && !confirm(`« ${titre} » existe déjà (${memes.map((x) => [court(x.lieuId), range(x), x.statut === "vu" ? "vu" : ""].filter(Boolean).join(", ")).join(" ; ")}). Ajouter quand même ?`)) return false;
      }
      const snap = e0 ? clone(e0) : undefined;
      return ecrire(e0 ? `Admin : fiche modifiée ${titre}` : `Admin : ajouté ${titre}${lieuId ? " (" + (nouveauLieu ? nouveauLieu.l.nom : court(lieuId)) + ")" : ""}`, (d) => {
        if (nouveauLieu && !d.lieux[nouveauLieu.id]) { d.lieux[nouveauLieu.id] = nouveauLieu.l; d.lieux = Object.fromEntries(Object.entries(d.lieux).sort(([a], [b]) => a.localeCompare(b))); }
        if (e0) {
          const s = d.affiche.sorties.find((x) => x.id === id) || d.journal.sorties.find((x) => x.id === id);
          if (!s) throw new Error("Cette sortie n’existe plus dans le dépôt.");
          garde(snap, s, "La fiche");
          for (const k of ["datesTexte", "horaires"]) if (!(k in champs)) delete s[k];
          Object.assign(s, champs);
        } else {
          const tous = new Set([...d.affiche.sorties, ...d.journal.sorties].map((x) => x.id));
          let nid = slug(titre) || "sortie", i = 2; if (tous.has(nid) && lieuId) nid = slug(titre) + "-" + lieuId; while (tous.has(nid)) nid = slug(titre) + "-" + i++;
          const { titre: t, categorie, sousGenre, artistes: ar, lieuId: li, salle, debut, fin, ...reste } = champs;
          d.affiche.sorties.push({ id: nid, titre: t, categorie, sousGenre, artistes: ar, lieuId: li, salle, debut, fin, ...reste, leonardYVa: false, statut: "a-voir" });
          ajoutId = nid;
        }
      });
    }, { valider: e0 ? "Enregistrer" : "Ajouter" });
    let ajoutId = null;
    const nl = form.querySelector("[data-nl]"), lieuIn = form.elements.lieu;
    const majLieu = () => { nl.hidden = !lieuIn.value.trim() || !!lieuDepuisNom(lieuIn.value); };
    lieuIn.addEventListener("input", majLieu); majLieu();
    form.addEventListener("click", (ev) => {
      if (ev.target.closest("[data-addart]")) form.querySelector("[data-arts]").insertAdjacentHTML("beforeend", artRow());
      if (ev.target.closest("[data-addoff]")) form.querySelector("[data-offres]").insertAdjacentHTML("beforeend", offreRow());
      const del = ev.target.closest("[data-del]"); if (del) del.closest(".ar,.of").remove();
    });
    const sub = form.onsubmit;
    form.onsubmit = async (ev) => { ajoutId = null; await sub(ev); if (ajoutId && !$("#dlg")) location.hash = "#sortie-" + ajoutId; };
  }

  async function ecarter(id, statut) {
    const t = titreDe(id);
    if (statut === "ecarte" && !confirm(`Écarter « ${t} » ? Elle sera masquée du public (réversible).`)) return;
    await ecrire(statut === "ecarte" ? `Admin : écarté ${t}` : `Admin : remis à l’affiche ${t}`, (d) => {
      const s = d.affiche.sorties.find((x) => x.id === id); if (!s) throw new Error("Cette sortie n’est plus à l’affiche.");
      s.statut = statut;
    });
  }
  async function supprimer(id) {
    const t = titreDe(id), r = PRIVE.reservations[id];
    if (!confirm(`Supprimer définitivement « ${t} » ?${r ? "\nSa réservation sera aussi supprimée." : ""}\nPour la masquer seulement, utilise plutôt « Écarter ».`)) return;
    await ecrire(`Admin : supprimé ${t}`, (d) => {
      d.affiche.sorties = d.affiche.sorties.filter((x) => x.id !== id);
      d.journal.sorties = d.journal.sorties.filter((x) => x.id !== id);
      delete d.prive.reservations[id]; delete d.prive.envies[id]; delete d.prive.journalPrive[id];
    });
    if (location.hash === "#sortie-" + id) location.hash = "#admin";
    toast("Sortie supprimée");
  }

  /* ---------- Saisie rapide ---------- */
  const MOIS_N = { janvier: 1, janv: 1, jan: 1, fevrier: 2, fevr: 2, fev: 2, mars: 3, avril: 4, avr: 4, mai: 5, juin: 6, juillet: 7, juil: 7, aout: 8, septembre: 9, sept: 9, sep: 9, octobre: 10, oct: 10, novembre: 11, nov: 11, decembre: 12, dec: 12 };
  const RE_DATE_L = new RegExp(`\\b(\\d{1,2})(?:er)?\\s+(${Object.keys(MOIS_N).sort((a, b) => b.length - a.length).join("|")})(?![a-z])\\.?(?:\\s+(\\d{4}))?`, "g");
  const RE_DATE_N = /\b(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\b/g, RE_DATE_I = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  const RE_HEURE = /\b([01]?\d|2[0-3])\s*(?:h|:)\s*([0-5]\d)?\b(?!\s*(?:min|€))/g;
  const RE_EXCLU = /command|achat|emis|emission|paiement|paye le|facture|order|transaction|date de reservation|reserve le|envoye|imprime/;
  const reEsc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function annee(j, m) { for (const y of [TODAY.getFullYear(), TODAY.getFullYear() + 1]) { const d = new Date(y, m - 1, j); if (d >= add(TODAY, -60)) return y; } return TODAY.getFullYear() + 1; }
  function analyser(texte) {
    const blocs = texte.split(/^\s*(?:-{3,}|={3,}|\*{3,}|_{3,})\s*$/m).map((b) => b.trim()).filter(Boolean);
    const candidats = AFF.filter((e) => e.statut !== "vu");
    const salles = [...new Set(["Salle Richelieu", "Vieux-Colombier", "Studio-Théâtre", "Grande salle", "Petite salle", "Salle Gémier", "Salle Jean Vilar", "Ateliers Berthier", "Grande Halle", ...AFF.map((e) => e.salle).filter(Boolean)])];
    return blocs.map((brut) => {
      const lignes = brut.split(/\r?\n/), N = lignes.map((l) => norm(l));
      const out = { texte: brut, sortieId: "", date: "", heure: "", salle: "", places: 1, siege: "", prix: null, tarif: "" };
      // Dates
      const dates = [];
      N.forEach((l, i) => {
        const push = (y, m, j) => { if (m < 1 || m > 12 || j < 1 || j > 31) return; const k = `${y}-${String(m).padStart(2, "0")}-${String(j).padStart(2, "0")}`; let sc = 0; if (RE_HEURE.test(l)) sc += 3; RE_HEURE.lastIndex = 0; if (RE_EXCLU.test(l)) sc -= 6; if (D(k) < TODAY) sc -= 2; dates.push({ k, sc, i }); };
        for (const m of l.matchAll(RE_DATE_L)) push(m[3] ? +m[3] : annee(+m[1], MOIS_N[m[2]]), MOIS_N[m[2]], +m[1]);
        for (const m of l.matchAll(RE_DATE_N)) push(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
        for (const m of l.matchAll(RE_DATE_I)) push(+m[1], +m[2], +m[3]);
      });
      dates.sort((a, b) => b.sc - a.sc || a.i - b.i);
      const best = dates[0]; if (best) out.date = best.k;
      // Heure : d’abord sur la ligne de la date, sinon première heure hors lignes d’achat
      const heureDe = (l) => { RE_HEURE.lastIndex = 0; for (const m of l.matchAll(RE_HEURE)) { if (/\d[/.]\s*$/.test(l.slice(0, m.index))) continue; return String(m[1]).padStart(2, "0") + ":" + (m[2] || "00"); } return ""; };
      if (best) out.heure = heureDe(N[best.i]);
      if (!out.heure) for (const l of N) if (!RE_EXCLU.test(l) && !/porte/.test(l)) { const h = heureDe(l.replace(RE_DATE_N, " ").replace(RE_DATE_I, " ")); if (h && /h|heure|debut|seance|representation|:/.test(l)) { out.heure = h; break; } }
      // Prix
      const montants = [];
      N.forEach((l) => { for (const m of l.matchAll(/(?:€|eur)\s*(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur\b|euros?\b)/g)) montants.push({ v: num(m[1] || m[2]), total: /total|montant|regle|paye|a payer|prix total/.test(l) }); });
      const tot = montants.filter((m) => m.total); out.prix = tot.length ? tot.at(-1).v : montants.length ? Math.max(...montants.map((m) => m.v)) : null;
      // Places et sièges
      const T = N.join("\n");
      const mp = /\b(\d{1,2})\s*(?:x\s*)?(?:e-?)?(?:billets?|places?|tickets?)\b/.exec(T) || /quantite\s*:?\s*(\d{1,2})/.exec(T) || /\b(\d{1,2})\s*x\s/.exec(T);
      const sieges = [];
      lignes.forEach((l) => { const n = norm(l); const m = /rang\s*:?\s*([a-z0-9]{1,3})\b.*?(?:siege|place|fauteuil)\s*:?\s*(\d{1,4})/.exec(n); if (m) sieges.push(`Rang ${m[1].toUpperCase()}, ${m[2]}`); else { const s = /(?:siege|fauteuil)\s*(?:n[°o]\s*)?:?\s*([a-z]?\d{1,4})\b/.exec(n); if (s) sieges.push(s[1].toUpperCase()); } });
      out.places = mp ? +mp[1] : Math.max(1, sieges.length);
      out.prixPlace = out.prix == null ? null : Math.round((out.prix / out.places) * 100) / 100;
      out.siege = [...new Set(sieges)].join(" ; ");
      // Salle et tarif
      out.salle = salles.find((s) => new RegExp(`(^|[^a-z0-9])${reEsc(norm(s)).replace(/-/g, "[- ]")}([^a-z0-9]|$)`).test(T)) || ((/\bsalle\s+([A-ZÀ-Ü][\wÀ-ÿ’'-]+(?:\s+[A-ZÀ-Ü][\wÀ-ÿ’'-]+)?)/.exec(brut) || [])[0] || "");
      const age = /moins de (\d{2}) ans|-\s?(\d{2}) ans/.exec(T);
      out.tarif = /carte jeunes?/.test(T) ? "Carte Jeune" : age ? `Moins de ${age[1] || age[2]} ans` : /avant[- ]premiere/.test(T) ? "Avant-première jeunes" : /tarif reduit/.test(T) ? "Tarif réduit" : /plein tarif|tarif plein/.test(T) ? "Plein tarif" : "";
      // Sortie : titre le plus probable
      let bestS = null, bestSc = 0;
      for (const e of candidats) {
        const t = norm(e.titre).replace(/[’']/g, " ").trim(); if (!t) continue;
        let sc = 0;
        if (t.length >= 3 && new RegExp(`(^|[^a-z0-9])${reEsc(t).replace(/\s+/g, "\\s+")}([^a-z0-9]|$)`).test(T.replace(/[’']/g, " "))) sc = 10 + t.length / 10;
        else { const mots = t.split(/[^a-z0-9]+/).filter((w) => w.length >= 4); if (mots.length) { const r = mots.filter((w) => new RegExp(`\\b${w}\\b`).test(T)).length / mots.length; if (r >= 0.6) sc = 5 * r; } }
        if (!sc) continue;
        if (e.lieuId && (T.includes(norm(court(e.lieuId))) || T.includes(norm(nomLieu(e.lieuId))))) sc += 2;
        if (out.date && playsOn(e, D(out.date))) sc += 2;
        if (sc > bestSc) { bestSc = sc; bestS = e; }
      }
      if (bestS && bestSc >= 3) out.sortieId = bestS.id;
      if (bestS && !out.salle && bestS.salle) out.salle = bestS.salle;
      return out;
    });
  }
  function vueRapide() {
    const opts = [["", "Non reconnu : à compléter par Claude Code"], ...AFF.filter((e) => e.statut !== "vu").slice().sort((a, b) => a.titre.localeCompare(b.titre, "fr")).map((e) => [e.id, `${e.titre} · ${court(e.lieuId)}`])];
    const ligne = (r, i) => {
      const c = r.sortieId && r.date ? conflits(etatLocal(), r.date, r.sortieId) : [];
      const deja = r.sortieId && PRIVE.reservations[r.sortieId];
      return `<fieldset class="fs rq" data-i="${i}"><legend>Billet ${i + 1}</legend>
      ${champ("Sortie", sel("q_sortie", opts, r.sortieId))}
      <div class="grid2">${champ("Date", inp("q_date", r.date, 'type="date"'))}${champ("Heure", inp("q_heure", r.heure, 'type="time"'))}</div>
      <div class="grid2">${champ("Salle", inp("q_salle", r.salle))}${champ("Places", inp("q_places", r.places, 'type="number" min="1" inputmode="numeric"'))}</div>
      <div class="grid2">${champ("Siège", inp("q_siege", r.siege))}${champ("Prix par place (€)", inp("q_prix", r.prixPlace ?? "", 'inputmode="decimal"'))}</div>
      ${champ("Tarif", inp("q_tarif", r.tarif))}
      ${c.length ? `<p class="warn">Déjà pris ce soir-là : ${esc(c.join(", "))}.</p>` : ""}${deja ? `<p class="warn">Une réservation existe déjà pour cette sortie (${esc(dCourt(deja.date))}) : elle sera remplacée.</p>` : ""}
      <details><summary class="cr">Texte d’origine</summary><pre class="code">${esc(r.texte.slice(0, 1500))}</pre></details>
      ${ck("q_ok", true, "Enregistrer ce billet")}</fieldset>`;
    };
    const file = PRIVE.aCompleter || [];
    return `<p class="cr">Colle une ou plusieurs confirmations (texte d’e-mail ou de PDF). Sépare plusieurs billets par une ligne <code>---</code>. Rien n’est envoyé avant « Enregistrer tout ».</p>
    <form id="qf" class="frm"><textarea id="qt" rows="8" placeholder="Colle ici le texte de la confirmation…">${esc(RAPIDE ? RAPIDE.texte : "")}</textarea><div class="acts"><button class="btn pri" type="submit">Analyser</button>${RAPIDE ? '<button class="btn" type="button" id="qraz">Effacer</button>' : ""}</div></form>
    ${RAPIDE ? `<form id="qr" class="frm">${RAPIDE.lignes.map(ligne).join("") || '<p class="empty">Rien trouvé.</p>'}<p class="err" role="alert" hidden></p><div class="acts"><button class="btn pri" type="submit">Enregistrer tout (un seul envoi)</button></div></form>` : ""}
    <h2 class="mh">À compléter par Claude Code <small>${file.length}</small></h2>
    ${file.length ? `<div class="list">${file.map((x, i) => `<div class="ad"><p class="cr">Ajouté le ${esc(fmtY(D(x.ajouteLe)))}${x.extrait && x.extrait.date ? " · " + esc(dCourt(x.extrait.date)) : ""}</p><pre class="code">${esc(String(x.texte || "").slice(0, 400))}</pre><button class="btn" type="button" data-qdel="${i}">Retirer</button></div>`).join("")}</div><p class="cr">Lance <code>/veille</code> (ou demande à Claude Code « traite la file à compléter ») pour qu’il les enregistre.</p>` : '<p class="empty">File vide.</p>'}`;
  }
  function brancherRapide() {
    const qf = $("#qf"); if (!qf) return;
    qf.onsubmit = (ev) => { ev.preventDefault(); const t = $("#qt").value; if (!t.trim()) return; RAPIDE = { texte: t, lignes: analyser(t) }; renderAdminVue("rapide"); };
    const raz = $("#qraz"); if (raz) raz.onclick = () => { RAPIDE = null; renderAdminVue("rapide"); };
    const qr = $("#qr");
    if (qr) qr.onsubmit = async (ev) => {
      ev.preventDefault();
      const err = qr.querySelector(".err"); err.hidden = true;
      const lignes = [...qr.querySelectorAll(".rq")].filter((f) => f.querySelector('[name="q_ok"]').checked).map((f) => {
        const q = (n) => f.querySelector(`[name="${n}"]`).value.trim(), r = RAPIDE.lignes[+f.dataset.i];
        return { id: q("q_sortie"), date: q("q_date"), heure: q("q_heure"), salle: q("q_salle"), places: num(q("q_places")) || 1, siege: q("q_siege"), prixPlace: num(q("q_prix")), tarif: q("q_tarif"), texte: r.texte };
      });
      if (!lignes.length) return;
      const ok = lignes.filter((l) => l.id && l.date), reste = lignes.filter((l) => !(l.id && l.date));
      const vus = {};
      try {
        for (const l of ok) vus[l.id] = confirmeConflits(etatLocal(), l.date, l.id);
        const msg = "Admin : saisie rapide" + (ok.length ? ", réservé " + ok.map((l) => `${titreDe(l.id)} le ${fmt(D(l.date))}`).join(", ") : "") + (reste.length ? ` ; ${reste.length} à compléter` : "");
        await ecrire(msg, (d) => {
          for (const l of ok) {
            confirmeConflits(d, l.date, l.id, vus[l.id]);
            const prev = d.prive.reservations[l.id] || {};
            d.prive.reservations[l.id] = { date: l.date, heure: l.heure, salle: l.salle, siege: l.siege, places: l.places, prixPlace: l.prixPlace, ...(l.tarif ? { tarif: l.tarif } : {}), accompagnants: prev.accompagnants || [], billetterie: prev.billetterie || "", note: prev.note || "" };
            delete d.prive.envies[l.id];
            const s = d.affiche.sorties.find((x) => x.id === l.id); if (s) s.leonardYVa = true;
          }
          for (const l of reste) d.prive.aCompleter.push({ ajouteLe: todayISO(), texte: l.texte.slice(0, 4000), extrait: { sortieId: l.id || null, date: l.date || null, heure: l.heure, salle: l.salle, places: l.places, siege: l.siege, prixPlace: l.prixPlace, tarif: l.tarif } });
        });
        RAPIDE = null; renderAdminVue("rapide"); toast(`${plural(ok.length, "billet")} enregistré${ok.length > 1 ? "s" : ""}${reste.length ? `, ${reste.length} à compléter` : ""}`);
      } catch (e) { if (!(e instanceof Annule)) { err.textContent = msgGH(e); err.hidden = false; } }
    };
    $$("[data-qdel]").forEach((b) => b.onclick = () => act(async () => {
      const i = +b.dataset.qdel, x = PRIVE.aCompleter[i]; if (!confirm("Retirer cet élément de la file ?")) return;
      await ecrire("Admin : file à compléter, un élément retiré", (d) => { const j = d.prive.aCompleter.findIndex((y) => y.ajouteLe === x.ajouteLe && y.texte === x.texte); if (j >= 0) d.prive.aCompleter.splice(j, 1); });
    }));
  }

  /* ---------- Soirs pris ---------- */
  function vueSoirs() {
    if (!SOIRS) SOIRS = { base: [...(BUSY_SRC.manuel || [])], set: new Set(BUSY_SRC.manuel || []) };
    const c = VUE_SOIRS || new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    VUE_SOIRS = c;
    const resPar = {}; Object.entries(PRIVE.reservations).forEach(([id, r]) => r.date && (resPar[r.date] = titreDe(id)));
    const cal = new Set(BUSY_SRC.calendrier || []);
    const add_ = [...SOIRS.set].filter((x) => !SOIRS.base.includes(x)), rm = SOIRS.base.filter((x) => !SOIRS.set.has(x));
    const y = c.getFullYear(), m = c.getMonth();
    const bl = blocages(), dansBloc = (k) => bl.some((x) => k >= x.debut && k <= x.fin);
    return `<p class="cr">Touche un jour pour le bloquer ou le libérer, puis enregistre. Les soirs réservés et ceux d’Apple Calendar se gèrent ailleurs.</p>
    <div class="cal"><div class="calh"><button class="btn" type="button" data-snav="-1" aria-label="Mois précédent">‹</button><h2>${MOIS_L[m]} ${y}</h2><button class="btn" type="button" data-snav="1" aria-label="Mois suivant">›</button></div>` +
      monthGrid(y, m, (d) => {
        const k = iso(d), on = SOIRS.set.has(k), r = resPar[k], ic = cal.has(k), past = d < TODAY;
        if (r || ic) return `<div class="cell ${r ? "res" : "icl"}${past ? " past" : ""}" role="img" aria-label="${fmt(d, true)} : ${r ? "réservé, " + esc(r) : "Apple Calendar"}"><span class="n">${d.getDate()}</span><small class="lbl2">${r ? "résa" : "agenda"}</small></div>`;
        return `<button type="button" class="cell${on ? " busy" : ""}${past ? " past" : ""}${+d === +TODAY ? " today" : ""}${dansBloc(k) ? " blq" : ""}" data-soir="${k}" aria-pressed="${on}" aria-label="${fmt(d, true)}${on ? ", pris" : ", libre"}${dansBloc(k) ? ", période bloquée" : ""}"><span class="n">${d.getDate()}</span></button>`;
      }) + `<div class="legend"><span style="--sw:var(--chip-on)">Pris (déclaré, public)</span><span style="--sw:var(--accent)">Réservation</span><span style="--sw:var(--warn-bg)">Apple Calendar</span><span class="blq-l">Période bloquée (privée)</span></div></div>
    <div class="acts"><button class="btn pri" type="button" id="sSave"${add_.length || rm.length ? "" : " disabled"}>Enregistrer${add_.length || rm.length ? ` (${add_.length ? "+" + add_.length : ""}${add_.length && rm.length ? " " : ""}${rm.length ? "−" + rm.length : ""})` : ""}</button>${add_.length || rm.length ? '<button class="btn" type="button" id="sRaz">Annuler les changements</button>' : ""}</div>
    <h2 class="mh">Périodes bloquées <small>privées</small></h2>
    <p class="cr">Comptées dans le contrôle des conflits quand tu réserves, mais jamais publiées : le site public ne les montre pas comme « pris », contrairement aux soirs ci-dessus.</p>
    <div class="list">${bl.map((x) => `<div class="ad"><p><b>${x.debut === x.fin ? esc(cap(fmtY(D(x.debut), true))) : `Du ${esc(fmt(D(x.debut)))} au ${esc(fmtY(D(x.fin)))}`}</b>${x.motif ? " · " + esc(x.motif) : ""}</p><button class="btn" type="button" data-bdel="${x.i}">Supprimer</button></div>`).join("") || '<p class="empty">Aucune période bloquée.</p>'}</div>
    <form id="bf" class="frm admbox" novalidate><div class="grid2">${champ("Du", '<input type="date" name="bdeb">')}${champ("Au (inclus)", '<input type="date" name="bfin">')}</div>${champ("Motif (privé)", '<input name="bmotif" placeholder="Vacances, examens…">')}<div class="acts"><button class="btn pri" type="submit">Bloquer cette période</button></div></form>`;
  }
  function blocages() {
    return (PRIVE.blocages || []).map((b, i) => typeof b === "string" ? { i, debut: b, fin: b, motif: "" } : { i, debut: b.debut || b.date, fin: b.fin || b.debut || b.date, motif: b.motif || "" }).filter((x) => x.debut).sort((a, b) => a.debut.localeCompare(b.debut));
  }
  function brancherSoirs() {
    const m = $("#av"); if (!m) return;
    m.onclick = (ev) => {
      const n = ev.target.closest("[data-snav]"); if (n) { VUE_SOIRS = new Date(VUE_SOIRS.getFullYear(), VUE_SOIRS.getMonth() + +n.dataset.snav, 1); return renderAdminVue("soirs"); }
      const c = ev.target.closest("[data-soir]"); if (c) { const k = c.dataset.soir; SOIRS.set.has(k) ? SOIRS.set.delete(k) : SOIRS.set.add(k); return renderAdminVue("soirs"); }
      if (ev.target.id === "sRaz") { SOIRS = null; return renderAdminVue("soirs"); }
      const bd = ev.target.closest("[data-bdel]");
      if (bd) return act(async () => {
        const x = PRIVE.blocages[+bd.dataset.bdel]; if (!confirm("Supprimer cette période bloquée ?")) return;
        await ecrire("Admin : périodes bloquées mises à jour", (d) => { const j = d.prive.blocages.findIndex((y) => JSON.stringify(y) === JSON.stringify(x)); if (j >= 0) d.prive.blocages.splice(j, 1); });
        renderAdminVue("soirs"); toast("Période supprimée");
      });
      if (ev.target.id === "sSave") act(async () => {
        const plus = [...SOIRS.set].filter((x) => !SOIRS.base.includes(x)).sort(), moins = SOIRS.base.filter((x) => !SOIRS.set.has(x)).sort();
        const liste = (l) => (l.length > 4 ? `${l.length} soirs entre le ${fmt(D(l[0]))} et le ${fmt(D(l.at(-1)))}` : l.map((k) => fmt(D(k))).join(", "));
        await ecrire(`Admin : soirs pris${plus.length ? ", bloqué " + liste(plus) : ""}${moins.length ? (plus.length ? " ;" : ",") + " libéré " + liste(moins) : ""}`, (d) => {
          const s = new Set(d.dispo.manuel || []); plus.forEach((k) => s.add(k)); moins.forEach((k) => s.delete(k));
          d.dispo.manuel = [...s].sort(); d.dispo.maj = todayISO();
        });
        SOIRS = null; renderAdminVue("soirs"); toast("Soirs pris enregistrés");
      });
    };
    const bf = $("#bf");
    if (bf) bf.onsubmit = (ev) => { ev.preventDefault(); act(async () => {
      const debut = val(bf, "bdeb"), fin = val(bf, "bfin") || debut, motif = val(bf, "bmotif");
      if (!ISO_RE.test(debut) || fin < debut) throw new Error("Indique une date de début, et une fin postérieure.");
      await ecrire("Admin : périodes bloquées mises à jour", (d) => { d.prive.blocages.push({ debut, fin, motif }); });
      renderAdminVue("soirs"); toast("Période bloquée");
    }); };
  }

  /* ---------- Budget ---------- */
  function depenses() {
    const out = [];
    for (const [id, r] of Object.entries(PRIVE.reservations)) out.push({ id, date: r.date, prix: totalPrix(r), plein: pleinTotal(r), places: nbPlaces(r), avenir: true });
    for (const [id, j] of Object.entries(PRIVE.journalPrive)) { const e = BYID.get(id); out.push({ id, date: e && (e.vuLe || []).at(-1), prix: totalPrix(j), plein: pleinTotal(j), places: nbPlaces(j), avenir: false }); }
    return out.map((x) => ({ ...x, cat: (BYID.get(x.id) || {}).categorie || "Autre" }));
  }
  function periode(p) {
    const y = TODAY.getMonth() >= 8 ? TODAY.getFullYear() : TODAY.getFullYear() - 1;
    if (p === "saison") return [`${y}-09-01`, `${y + 1}-08-31`, `Saison ${y}–${y + 1}`];
    if (p === "prec") return [`${y - 1}-09-01`, `${y}-08-31`, `Saison ${y - 1}–${y}`];
    if (p === "annee") return [`${TODAY.getFullYear()}-01-01`, `${TODAY.getFullYear()}-12-31`, `Année ${TODAY.getFullYear()}`];
    if (p === "12m") return [iso(add(TODAY, -365)), todayISO(), "12 derniers mois"];
    return ["0000", "9999", "Depuis le début"];
  }
  function vueBudget() {
    const [a, b] = periode(BUDGET_P);
    const vus = (JOURNAL || []).filter((e) => (e.vuLe || []).some((x) => x >= a && x <= b)).length;
    const res = Object.values(PRIVE.reservations).filter((r) => r.date && r.date >= a && r.date <= b).length;
    const L = depenses().filter((x) => x.date && x.date >= a && x.date <= b);
    const P = L.filter((x) => x.prix != null);
    const tot = P.reduce((s, x) => s + x.prix, 0), eco = P.filter((x) => x.plein != null).reduce((s, x) => s + (x.plein - x.prix), 0);
    const parMois = {}, parCat = {};
    P.forEach((x) => { const k = x.date.slice(0, 7); parMois[k] = (parMois[k] || 0) + x.prix; parCat[x.cat] = (parCat[x.cat] || 0) + x.prix; });
    const barres = (rows) => { const mx = Math.max(1, ...rows.map((r) => r[1])); return `<div class="bars bars-e">${rows.map(([l, n]) => `<span class="bl">${esc(l)}</span><span class="bg" style="width:${Math.round((n / mx) * 100)}%" aria-hidden="true"></span><span class="bn">${esc(euros(n))}</span>`).join("")}</div>`; };
    const mois = Object.keys(parMois).sort().map((k) => [MOIS[+k.slice(5) - 1] + " " + k.slice(2, 4), parMois[k]]);
    const cats = Object.entries(parCat).sort((x, y) => y[1] - x[1]);
    const opts = [["saison", "Saison en cours"], ["prec", "Saison précédente"], ["annee", "Année civile"], ["12m", "12 derniers mois"], ["tout", "Tout"]];
    return `<div class="tools"><label class="f" style="flex:1;margin:0"><span>Période</span>${sel("bp", opts, BUDGET_P).replace("<select", '<select id="bp"')}</label></div>
    <div class="kpis"><div><b>${esc(euros(tot) || "0 €")}</b><span>dépensés</span></div><div><b>${P.length ? esc(euros(tot / P.reduce((s, x) => s + x.places, 0))) : "–"}</b><span>prix moyen par place</span></div><div><b>${vus + res}</b><span>sorties (${vus} vues, ${res} réservées)</span></div><div><b>${eco ? esc(euros(eco)) : "–"}</b><span>économies estimées</span></div></div>
    <p class="cr">${plural(P.length, "sortie")} avec un prix connu sur ${L.length} (${plural(P.reduce((s, x) => s + x.places, 0), "place")}, y compris celles des accompagnants). Économies : seulement quand un plein tarif est saisi.</p>
    <details class="box stats" open><summary>Par mois</summary>${mois.length ? barres(mois) : '<p class="cr" style="padding:0 12px">Aucune dépense sur la période.</p>'}</details>
    <details class="box stats" open><summary>Par catégorie</summary>${cats.length ? barres(cats) : '<p class="cr" style="padding:0 12px">Aucune dépense sur la période.</p>'}</details>`;
  }

  /* ---------- Accompagnants ---------- */
  function personnes() {
    const P = {};
    const put = (n, id, date, avenir) => { const p = (P[n] ??= { nom: n, ids: new Set(), n: 0, dernier: null, prochain: null }); if (!p.ids.has(id)) { p.ids.add(id); p.n++; } if (date) { if (avenir && date >= todayISO()) { if (!p.prochain || date < p.prochain.date) p.prochain = { date, id }; } else if (!p.dernier || date > p.dernier.date) p.dernier = { date, id }; } };
    for (const [id, r] of Object.entries(PRIVE.reservations)) (r.accompagnants || []).forEach((n) => put(n, id, r.date, true));
    for (const [id, j] of Object.entries(PRIVE.journalPrive)) (j.accompagnants || []).forEach((n) => put(n, id, ((BYID.get(id) || {}).vuLe || []).at(-1), false));
    return Object.values(P).sort((a, b) => b.n - a.n || a.nom.localeCompare(b.nom, "fr"));
  }
  function idsAvec(nom) { const s = new Set(); if (!PRIVE) return s; for (const [id, j] of Object.entries(PRIVE.journalPrive)) if ((j.accompagnants || []).includes(nom)) s.add(id); return s; }
  function accSelectHTML(v) {
    if (!PRIVE) return "";
    const p = personnes().filter((x) => x.dernier); if (!p.length) return "";
    return `<div class="tools"><label class="f" style="flex:1;margin:0"><span>Avec (admin)</span><select id="jAvec"><option value="">Tout le monde</option>${p.map((x) => `<option${x.nom === v ? " selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></label></div>`;
  }
  function vueAcc() {
    const p = personnes();
    if (!p.length) return '<p class="empty">Aucun accompagnant enregistré pour l’instant.</p>';
    return `<div class="list">${p.map((x) => `<div class="ad"><h3>${esc(x.nom)} <small class="cr">${plural(x.n, "sortie")}</small></h3>
      <p class="cr">${x.dernier ? `Dernière : <a href="#sortie-${esc(x.dernier.id)}">${esc(titreDe(x.dernier.id))}</a>, ${esc(fmtY(D(x.dernier.date)))}` : "Pas encore de sortie vue ensemble"}${x.prochain ? ` · Prochaine : <a href="#sortie-${esc(x.prochain.id)}">${esc(titreDe(x.prochain.id))}</a>, ${esc(fmt(D(x.prochain.date), true))}` : ""}</p>
      ${x.dernier ? `<button class="btn" type="button" data-javec="${esc(x.nom)}">Voir dans le journal</button>` : ""}</div>`).join("")}</div>`;
  }

  /* ---------- Liens utiles ---------- */
  function vueLiens() {
    if (!LIENS_W) LIENS_W = { base: clone(LIENS || []), w: clone(LIENS || []) };
    const modif = JSON.stringify(LIENS_W.base) !== JSON.stringify(LIENS_W.w);
    return `<p class="cr">Modifie, réordonne, puis enregistre (un seul envoi).</p>
    <div class="list">${LIENS_W.w.map((l, i) => `<div class="ad lnk"><div><b>${esc(l.titre)}</b><small class="cr">${esc(l.categorie)}${l.note ? " · " + esc(l.note) : ""}</small><small class="cr url">${esc(l.url)}</small></div>
      <div class="acts"><button class="btn ico" type="button" data-lk="up" data-i="${i}" aria-label="Monter ${esc(l.titre)}"${i ? "" : " disabled"}>↑</button><button class="btn ico" type="button" data-lk="down" data-i="${i}" aria-label="Descendre ${esc(l.titre)}"${i < LIENS_W.w.length - 1 ? "" : " disabled"}>↓</button><button class="btn" type="button" data-lk="edit" data-i="${i}">Modifier</button><button class="btn" type="button" data-lk="del" data-i="${i}">Supprimer</button></div></div>`).join("")}</div>
    <div class="acts"><button class="btn" type="button" data-lk="new">+ Ajouter un lien</button><button class="btn pri" type="button" data-lk="save"${modif ? "" : " disabled"}>Enregistrer les liens</button>${modif ? '<button class="btn" type="button" data-lk="raz">Annuler les changements</button>' : ""}</div>`;
  }
  function formLien(i) {
    const l = i == null ? { categorie: CAT_LIENS[0] } : LIENS_W.w[i];
    dlg(i == null ? "Ajouter un lien" : "Modifier le lien", `${champ("Catégorie", sel("categorie", CAT_LIENS, l.categorie))}${champ("Titre", inp("titre", l.titre))}${champ("Adresse", inp("url", l.url, 'type="url" placeholder="https://…"'))}${champ("Note", inp("note", l.note))}`, async (f) => {
      const n = { categorie: val(f, "categorie"), titre: val(f, "titre"), url: val(f, "url"), note: val(f, "note") };
      if (!n.titre || !URL_RE.test(n.url)) throw new Error("Titre et adresse (https://…) obligatoires.");
      if (i == null) LIENS_W.w.push(n); else LIENS_W.w[i] = n;
      renderAdminVue("liens");
    }, { valider: "Valider" });
  }
  function brancherLiens() {
    const m = $("#av"); if (!m) return;
    m.onclick = (ev) => {
      const b = ev.target.closest("[data-lk]"); if (!b) return;
      const k = b.dataset.lk, i = +b.dataset.i, w = LIENS_W.w;
      if (k === "up" && i > 0) [w[i - 1], w[i]] = [w[i], w[i - 1]];
      else if (k === "down" && i < w.length - 1) [w[i + 1], w[i]] = [w[i], w[i + 1]];
      else if (k === "del") { if (!confirm(`Supprimer « ${w[i].titre} » ?`)) return; w.splice(i, 1); }
      else if (k === "edit") return formLien(i);
      else if (k === "new") return formLien(null);
      else if (k === "raz") LIENS_W = null;
      else if (k === "save") return act(async () => {
        const base = LIENS_W.base, nv = clone(LIENS_W.w);
        await ecrire("Admin : liens utiles mis à jour", (d) => { garde(base, d.liens, "La liste des liens"); d.liens = nv; });
        LIENS_W = null; renderAdminVue("liens"); toast("Liens enregistrés");
      });
      renderAdminVue("liens");
    };
  }

  /* ---------- Lieux ---------- */
  const usages = (id) => [...AFF, ...(JOURNAL || [])].filter((e) => e.lieuId === id).length;
  function vueLieux() {
    const ids = Object.keys(LIEUX).sort((a, b) => norm(LIEUX[a].nom).localeCompare(norm(LIEUX[b].nom)));
    return `<div class="tools"><input type="search" id="lq" placeholder="Rechercher un lieu" aria-label="Rechercher un lieu" style="flex:1"><button class="btn pri" type="button" data-lieu="new">+ Lieu</button></div>
    <div class="list" id="ll">${ids.map((id) => { const L = LIEUX[id], n = usages(id); return `<div class="ad" data-q="${esc(norm([L.nom, court(id), L.ville, id].join(" ")))}"><h3>${esc(L.nom)}</h3><p class="cr">${esc([L.ville, L.zone !== L.ville ? L.zone : "", "lieu " + (L.statut === "Privé" ? "privé" : "public")].filter(Boolean).join(" · "))} · ${plural(n, "sortie")}</p>${L.tarifJeune ? `<p class="cr">Tarif jeune : ${esc(L.tarifJeune)}</p>` : ""}
      <div class="acts"><button class="btn" type="button" data-lieu="edit" data-id="${esc(id)}">Modifier</button>${n ? "" : `<button class="btn" type="button" data-lieu="del" data-id="${esc(id)}">Supprimer</button>`}<a class="btn" href="#lieu-${esc(id)}">Voir</a></div></div>`; }).join("")}</div>
    <p class="cr">Un lieu utilisé par une sortie ne peut pas être supprimé. Son identifiant ne change jamais, même si tu le renommes.</p>`;
  }
  function brancherLieux() {
    const q = $("#lq"); if (q) q.oninput = () => { const t = norm(q.value).trim(); $$("#ll .ad").forEach((x) => (x.hidden = !!t && !x.dataset.q.includes(t))); };
    $("#av").onclick = (ev) => {
      const b = ev.target.closest("[data-lieu]"); if (!b) return;
      if (!TOK) return formJeton("Cet appareil est en lecture seule.");
      if (b.dataset.lieu === "new") formLieu(null);
      else if (b.dataset.lieu === "edit") formLieu(b.dataset.id);
      else if (b.dataset.lieu === "del") act(() => supprimerLieu(b.dataset.id));
    };
  }
  function formLieu(id) {
    const L0 = id ? LIEUX[id] : null, L = L0 || { ville: "Paris", zone: "Paris", statut: "Public" };
    dlg(L0 ? `Lieu : ${L0.nom}` : "Nouveau lieu", `${champ("Nom", inp("nom", L.nom))}
      <div class="grid2">${champ("Ville", inp("ville", L.ville))}${champ("Zone", sel("zone", ZONES_L, L.zone))}</div>
      <div class="grid2">${champ("Statut", sel("statut", ["Public", "Privé"], L.statut))}${champ("Tarif jeune", inp("tarifJeune", L.tarifJeune, 'placeholder="Moins de 28 ans : 10 €"'))}</div>
      ${champ("Adresse", inp("adresse", L.adresse, 'placeholder="Place de l’Odéon, 75006 Paris"'))}
      ${champ("Site", inp("site", L.site, 'type="url" placeholder="https://…"'))}
      ${champ("Billetterie", inp("billetterie", L.billetterie, 'type="url" placeholder="https://…"'))}`, async (f) => {
      const nom = val(f, "nom"); if (!nom) throw new Error("Le nom est obligatoire.");
      const champs = { nom, ville: val(f, "ville"), zone: val(f, "zone"), statut: val(f, "statut"), site: val(f, "site") || null, billetterie: val(f, "billetterie") || null, tarifJeune: val(f, "tarifJeune") };
      const adresse = val(f, "adresse"), snap = L0 ? clone(L0) : undefined;
      return ecrire(L0 ? `Admin : lieu modifié ${nom}` : `Admin : lieu ajouté ${nom}`, (d) => {
        if (L0) {
          if (!d.lieux[id]) throw new Error("Ce lieu n’existe plus dans le dépôt.");
          garde(snap, d.lieux[id], "Le lieu");
          Object.assign(d.lieux[id], champs);
          if (adresse) d.lieux[id].adresse = adresse; else delete d.lieux[id].adresse;
        } else {
          let k = slug(nom) || "lieu", i = 2; while (d.lieux[k]) k = (slug(nom) || "lieu") + "-" + i++;
          d.lieux[k] = { ...champs, ...(adresse ? { adresse } : {}) };
          d.lieux = Object.fromEntries(Object.entries(d.lieux).sort(([a], [b]) => a.localeCompare(b)));
        }
      });
    }, { valider: L0 ? "Enregistrer" : "Ajouter" });
  }
  async function supprimerLieu(id) {
    const L = LIEUX[id]; if (!L || !confirm(`Supprimer le lieu « ${L.nom} » ?`)) return;
    await ecrire(`Admin : lieu supprimé ${L.nom}`, (d) => {
      if ([...d.affiche.sorties, ...d.journal.sorties].some((s) => s.lieuId === id)) throw new Error("Ce lieu est utilisé par une sortie : impossible de le supprimer.");
      delete d.lieux[id];
    });
    toast("Lieu supprimé");
  }

  /* ---------- Réservations et envies ---------- */
  function prochaineVente(e) {
    const v = (e.offres || []).filter((o) => o.vente && venteDate(o) >= NOW).sort((a, b) => venteDate(a) - venteDate(b))[0];
    return v || null;
  }
  function vueRes() {
    const res = Object.entries(PRIVE.reservations).sort((a, b) => (a[1].date || "9").localeCompare(b[1].date || "9"));
    const fut = res.filter(([, r]) => !r.date || D(r.date) >= TODAY), past = res.filter(([, r]) => r.date && D(r.date) < TODAY);
    const locD = etatLocal();
    const carte = ([id, r], passe) => {
      const c = conflits(locD, r.date, id);
      return `<div class="ad"><h3><a href="#sortie-${esc(id)}">${esc(titreDe(id))}</a></h3><p><b>${r.date ? esc(cap(fmtY(D(r.date), true))) : "Date à préciser"}</b>${r.heure ? " · " + esc(r.heure) : ""}${detRes(r)}</p>${c.length ? `<p class="warn">Conflit : ${esc(c.join(", "))}</p>` : ""}
      ${passe ? `<p class="warn">C’est passé : tu l’as vu ?</p>` : ""}<div class="acts">${passe ? `<button class="btn pri" type="button" data-adm="vu" data-id="${esc(id)}">Oui, marquer vu</button>` : `<button class="btn" type="button" data-adm="reserver" data-id="${esc(id)}">Modifier</button><button class="btn" type="button" data-adm="vu" data-id="${esc(id)}">Vu</button>`}<button class="btn" type="button" data-adm="annuler" data-id="${esc(id)}">${passe ? "Non, supprimer" : "Annuler"}</button></div></div>`;
    };
    const ec = AFF.filter((e) => e.statut === "ecarte");
    return `${past.length ? `<h2 class="mh">À confirmer <small>${past.length}</small></h2><div class="list">${past.map((x) => carte(x, true)).join("")}</div>` : ""}
    <h2 class="mh">À venir <small>${fut.length}</small></h2><div class="list">${fut.map((x) => carte(x, false)).join("") || '<p class="empty">Aucune réservation. Ouvre une fiche et touche « Réserver ».</p>'}</div>
    ${ec.length ? `<details class="box"><summary>Sorties écartées <span class="ml">${ec.length}, masquées du public</span></summary><ul class="vl">${ec.map((e) => `<li><a href="#sortie-${esc(e.id)}"><span class="vt"><b>${esc(e.titre)}</b> <span>· ${esc(court(e.lieuId))}</span></span></a></li>`).join("")}</ul></details>` : ""}`;
  }
  function vueEnvies() {
    const L = Object.entries(PRIVE.envies).map(([id, v]) => ({ id, v, e: BYID.get(id) })).filter((x) => x.e);
    const k = (x) => { const pv = prochaineVente(x.e); return [pv ? +venteDate(pv) : 9e15, sortKey(x.e)]; };
    L.sort((a, b) => { const [a1, a2] = k(a), [b1, b2] = k(b); return a1 - b1 || a2 - b2; });
    if (!L.length) return '<p class="empty">Aucune envie. Touche le cœur d’une sortie pour l’ajouter.</p>';
    return `<div class="list">${L.map(({ id, v, e }) => { const pv = prochaineVente(e); return `<div class="ad"><h3><a href="#sortie-${esc(id)}">${esc(e.titre)}</a> ${stars(e.note, e.pronostic)}</h3>
      <p class="cr">${esc(court(e.lieuId))} · ${esc(range(e))}${pv ? ` · <b class="warn">Vente ${esc(venteTxt(pv))}</b> (${esc(pv.type)})` : ""}</p>${v.note ? `<p>« ${esc(v.note)} »</p>` : ""}
      <div class="chips wrap-ok" role="group" aria-label="Priorité">${[1, 2, 3].map((p) => `<button class="chip" type="button" data-adm="prio" data-p="${p}" data-id="${esc(id)}" aria-pressed="${(v.priorite || 2) === p}">${PRI[p]}</button>`).join("")}<button class="chip" type="button" data-adm="envie" data-id="${esc(id)}">Note</button><button class="chip" type="button" data-envie="${esc(id)}" aria-pressed="true">Retirer ♥</button><button class="chip" type="button" data-adm="reserver" data-id="${esc(id)}">Réserver</button></div></div>`; }).join("")}</div>`;
  }

  /* ---------- Formulaires de connexion ---------- */
  function formJeton(msg) {
    return new Promise((ok) => {
      dlg("Jeton GitHub de cet appareil", `<p class="cr">${msg ? esc(msg) + " " : ""}Pour enregistrer depuis ce site, colle le jeton « fine-grained » limité au dépôt saison (Contents : lecture et écriture ; Actions : lecture). Il sera rangé sur cet appareil, chiffré avec ton mot de passe.</p>
        ${champ("Mot de passe (pour chiffrer le jeton)", '<input type="password" name="pw" autocomplete="current-password" required>')}
        ${champ("Jeton GitHub", '<input type="password" name="tok" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="github_pat_…" required>')}`, async (f) => {
        const pw = f.elements.pw.value, tok = f.elements.tok.value.trim();
        f.elements.pw.value = ""; f.elements.tok.value = "";
        if (!tok) throw new Error("Colle le jeton.");
        const p = await getJSON("data/prive.enc?t=" + Date.now(), { cache: "no-store" });
        try { await ouvrirPaquet(await derive(pw, unb64(p.salt), p.iter), p); } catch (_) { throw new Error("Mot de passe incorrect."); }
        const avert = await testerJeton(tok);
        TOK = tok; await ranger(pw, tok);
        toast(avert || "Jeton vérifié et enregistré sur cet appareil");
        ok(true); recharger().catch(() => rafraichir());
      }, { valider: "Tester et enregistrer" });
    });
  }
  function demanderMdp() {
    return new Promise((ok, ko) => {
      const form = dlg("Mot de passe", `<p class="cr">La zone privée a été rechiffrée (nouveau mot de passe ?). Saisis le mot de passe actuel.</p>${champ("Mot de passe", '<input type="password" name="pw" autocomplete="current-password">')}`, async (f) => { const v = f.elements.pw.value; f.elements.pw.value = ""; ok(v); }, { valider: "Continuer" });
      const obs = new MutationObserver(() => { if (!document.contains(form)) { obs.disconnect(); ko(new Annule()); } });
      obs.observe(document.body, { childList: true });
    });
  }
  function vueConnexion() {
    const aJeton = !!lsGet(LS_JETON);
    $("#main").innerHTML = `<div class="ph"><h1>Admin</h1><p>Réservé à ${OWNER}. Le déchiffrement se fait dans le navigateur ; le mot de passe n’est jamais envoyé.</p></div>
    <form id="pf" class="frm loginbox" autocomplete="on">
      ${champ("Mot de passe", '<input type="password" id="pw" name="pw" autocomplete="current-password" required>')}
      ${aJeton ? '<p class="cr">Cet appareil est enregistré : le mot de passe suffit.</p>' : `${champ("Jeton GitHub (première connexion sur cet appareil)", '<input type="password" id="tok" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="github_pat_…">')}<p class="cr">Laisse vide pour consulter seulement (lecture seule). Le jeton sera rangé sur cet appareil, chiffré avec ton mot de passe.</p>`}
      <p class="err" role="alert" id="pErr" hidden></p>
      <div class="acts"><button class="btn pri" type="submit" id="pGo">Déverrouiller</button></div></form>`;
    $("#pf").onsubmit = async (ev) => {
      ev.preventDefault();
      const err = $("#pErr"), go = $("#pGo"), pw = $("#pw").value, tok = $("#tok") ? $("#tok").value.trim() : "";
      const dire = (t) => { err.textContent = t; err.hidden = false; go.disabled = false; go.textContent = "Déverrouiller"; };
      err.hidden = true; go.disabled = true; go.textContent = "Vérification…";
      let p; try { p = await getJSON("data/prive.enc?t=" + Date.now(), { cache: "no-store" }); } catch (_) { return dire("Impossible de lire la zone privée : vérifie la connexion."); }
      let key, prive;
      try { key = await derive(pw, unb64(p.salt), p.iter); prive = await ouvrirPaquet(key, p); } catch (_) { return dire("Mot de passe incorrect."); }
      let tk = null, avert = "";
      const st = lsGet(LS_JETON);
      if (st) {
        try { const s = JSON.parse(st); tk = (await ouvrirPaquet(await derive(pw, unb64(s.salt), s.iter), s)).jeton; }
        catch (_) { lsDel(LS_JETON); return vueConnexion(), toast("Le jeton rangé sur cet appareil ne s’ouvre plus : saisis-le à nouveau."); }
      } else if (tok) {
        go.textContent = "Test du jeton…";
        try { avert = await testerJeton(tok); } catch (e) { return dire(e.message); }
        tk = tok;
        if (!(await ranger(pw, tok))) avert = "Jeton valable, mais impossible de le ranger sur cet appareil (navigation privée ?) : il faudra le ressaisir.";
      }
      KEY = key; SALT = p.salt; ITERP = p.iter; PRIVE = normPrive(prive); TOK = tk; LAST = Date.now();
      document.body.classList.add("adm"); lockIcon();
      let fait = false;
      if (TOK) { go.textContent = "Lecture du dépôt…"; try { await recharger(pw); fait = true; } catch (e) { avert = "Lecture du dépôt impossible (" + msgGH(e) + ") : données du site affichées."; } }
      if (!fait) await rafraichir();
      if (avert) toast(avert);
    };
    $("#pw").focus();
  }

  /* ---------- Espace admin ---------- */
  const ONGLETS = [["res", "Réservations"], ["envies", "Mes envies"], ["rapide", "Saisie rapide"], ["soirs", "Soirs pris"], ["budget", "Budget"], ["acc", "Accompagnants"], ["lieux", "Lieux"], ["liens", "Liens"], ["abo", "Abonnements"]];
  let VUE = "res";
  function renderAdminVue(v) {
    if (v) VUE = v;
    if (!PRIVE) return vueConnexion();
    if (location.hash.slice(1).split("?")[0] !== "admin") return;
    const nE = Object.keys(PRIVE.envies).length, nC = (PRIVE.aCompleter || []).length;
    const corps = { res: vueRes, envies: vueEnvies, rapide: vueRapide, soirs: vueSoirs, budget: vueBudget, acc: vueAcc, lieux: vueLieux, liens: vueLiens, abo: () => `<p class="cr">Deux agendas à ajouter une fois sur l’iPhone : Réglages › Apps › Calendrier › Comptes › Ajouter un compte › Autre › S’abonner à un calendrier, colle l’adresse, puis Suivant et Enregistrer. Mise à jour automatique (à peu près toutes les heures).</p>${subsHTML()}<p class="cr">Ces adresses sont secrètes : elles contiennent prix et accompagnants. Ne les partage pas.</p>` }[VUE] || vueRes;
    $("#main").innerHTML = `<div class="ph"><h1>Admin</h1><p>${TOK ? "Connecté · chaque enregistrement publie le site" : '<span class="warn">Lecture seule sur cet appareil</span>'} · verrouillage après 30 min d’inactivité.</p></div>
    <div class="acts" style="margin-top:0"><button class="btn pri" type="button" data-adm="ajouter">+ Ajouter une sortie</button>${TOK ? "" : '<button class="btn" type="button" id="aTok">Saisir le jeton</button>'}<button class="btn" type="button" id="aLock">Verrouiller</button></div>
    <nav class="chips" aria-label="Espace admin" style="margin-top:6px">${ONGLETS.map(([k, t]) => `<a class="chip" href="#admin?v=${k}"${k === VUE ? ' aria-current="page"' : ""}>${t}${k === "envies" && nE ? ` (${nE})` : ""}${k === "rapide" && nC ? ` (${nC})` : ""}</a>`).join("")}</nav>
    <div id="av">${corps()}</div>
    <p style="margin-top:24px"><button class="linkbtn" type="button" id="aForget">Oublier cet appareil (efface le jeton)</button></p>`;
    $("#aLock").onclick = () => verrouiller("Verrouillé");
    $("#aForget").onclick = () => { if (confirm("Effacer le jeton GitHub de cet appareil et verrouiller ? Il faudra le ressaisir à la prochaine connexion.")) { lsDel(LS_JETON); verrouiller("Appareil oublié : jeton effacé"); } };
    if ($("#aTok")) $("#aTok").onclick = () => formJeton();
    const bp = $("#bp"); if (bp) bp.onchange = () => { BUDGET_P = bp.value; renderAdminVue(); };
    if (VUE === "rapide") brancherRapide();
    if (VUE === "soirs") brancherSoirs();
    if (VUE === "liens") brancherLiens();
    if (VUE === "lieux") brancherLieux();
  }
  function render(q) {
    const v = new URLSearchParams(q || "").get("v");
    if (v && ONGLETS.some(([k]) => k === v)) VUE = v;
    renderAdminVue();
  }

  /* ---------- Actions (délégation) ---------- */
  async function act(fn) { try { await fn(); } catch (e) { if (!(e instanceof Annule)) toast(msgGH(e)); } }
  document.addEventListener("click", (ev) => {
    if (!PRIVE) return;
    const h = ev.target.closest("[data-envie]");
    if (h) { ev.preventDefault(); return act(() => basculerEnvie(h.dataset.envie)); }
    const j = ev.target.closest("[data-javec]");
    if (j) { JAVEC = j.dataset.javec; location.hash = "#journal"; return; }
    const b = ev.target.closest("[data-adm]"); if (!b) return;
    const id = b.dataset.id, a = b.dataset.adm;
    if (!TOK && a !== "noop") { formJeton("Cet appareil est en lecture seule."); return; }
    if (a === "reserver") formReserver(id);
    else if (a === "annuler") act(() => annulerRes(id));
    else if (a === "vu" || a === "revu" || a === "notes") formVu(id, a);
    else if (a === "editer") formSortie(id);
    else if (a === "ajouter") formSortie(null);
    else if (a === "ecarter") act(() => ecarter(id, "ecarte"));
    else if (a === "remettre") act(() => ecarter(id, "a-voir"));
    else if (a === "supprimer") act(() => supprimer(id));
    else if (a === "prio") act(() => basculerEnvie(id, +b.dataset.p));
    else if (a === "envie") formEnvie(id);
  });

  ADMIN = { render, heart, ficheHTML, idsAvec, accSelectHTML };
})();
