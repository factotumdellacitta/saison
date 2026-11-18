/* Factotum Expo – vues « À voir » et « Bientôt ». Chargé par app.js sur le site Expo seulement (coque expo/index.html).
   Utilise les variables et fonctions globales d’app.js (LIVE, rowA, expoEtat, arrdt, rech, ico, carres, esc…) :
   mêmes lignes, mêmes puces, même barre de filtres que l’Affiche. Filtres et recherche restent dans l’adresse. */
"use strict";
(() => {
  const VUES = { "a-voir": { titre: "À voir", vide: "Aucune exposition en cours." }, bientot: { titre: "Bientôt", vide: "Aucune exposition annoncée." } };
  let V = "a-voir", XF = null;

  // État des filtres : type, arrondissement (0 = hors Paris), gratuité, nocturne, note minimale, recherche.
  function lireF(q) {
    const p = new URLSearchParams(q || ""), L = (k) => new Set((p.get(k) || "").split(",").filter(Boolean));
    return { dom: L("dom"), type: L("type"), arr: L("arr"), gratuit: p.has("gratuit"), jeunes: p.has("jeunes"), nocturne: p.has("nocturne"), note: +p.get("note") || 0, q: p.get("q") || "" };
  }
  function ecrireF(f) {
    const p = [];
    for (const k of ["dom", "type", "arr"]) if (f[k].size) p.push(k + "=" + [...f[k]].map(encodeURIComponent).join(","));
    if (f.note) p.push("note=" + f.note);
    for (const k of ["gratuit", "jeunes", "nocturne"]) if (f[k]) p.push(k);
    if (f.q.trim()) p.push("q=" + encodeURIComponent(f.q.trim()));
    return p.join("&");
  }
  const gratuitJeunes = (e) => /^gratuit/.test(xp(e).jeunes || "");
  function garde(e, f) {
    const x = xp(e);
    if (f.q && !cherche(e, f.q)) return false;
    if (f.dom.size && !f.dom.has(domaineX(e))) return false;
    if (f.type.size && !f.type.has(x.type)) return false;
    if (f.arr.size && !f.arr.has(String(arrdt(e)))) return false;
    if (f.gratuit && !x.gratuit) return false;
    if (f.jeunes && !(x.gratuit || gratuitJeunes(e))) return false;
    if (f.nocturne && !(x.nocturnes || []).length) return false;
    if (f.note && e.note < f.note) return false;
    return true;
  }
  const base = () => LIVE.filter((e) => (expoEtat(e) === "bientot") === (V === "bientot"));
  const parTitre = (a, b) => a.titre.localeCompare(b.titre, "fr");
  const fin = (e) => +(span(e) || [0, 9e15])[1], debut = (e) => +(span(e) || [9e15])[0];
  // À voir : par urgence (derniers jours d’abord, la fermeture la plus proche en tête), puis par note.
  const urgence = (a, b) => (expoEtat(b) === "derniers") - (expoEtat(a) === "derniers") || (expoEtat(a) === "derniers" ? fin(a) - fin(b) : 0) || b.note - a.note || fin(a) - fin(b) || parTitre(a, b);
  const ouverture = (a, b) => debut(a) - debut(b) || b.note - a.note || parTitre(a, b);
  const libArr = (n) => (+n ? "Paris " + arrdtTxt(+n) : "Hors Paris");
  function actifs(f) {
    const a = [], l = (k, v, t) => a.push({ k, v, t });
    if (f.q.trim()) l("q", "", "« " + f.q.trim() + " »");
    f.dom.forEach((t) => l("dom", t, X_DOMAINES[t] || t));
    f.type.forEach((t) => l("type", t, EXPO_TYPES[t] || t));
    [...f.arr].sort((x, y) => x - y).forEach((n) => l("arr", n, libArr(n)));
    if (f.note) l("note", "", f.note === 4 ? "Note 4" : "Note " + f.note + " et +");
    if (f.gratuit) l("gratuit", "", "Gratuit");
    if (f.jeunes) l("jeunes", "", "Gratuit pour les jeunes");
    if (f.nocturne) l("nocturne", "", "Nocturne");
    return a;
  }
  function pose(mut) {
    mut(XF);
    const s = ecrireF(XF);
    history.replaceState(null, "", "#" + V + (s ? "?" + s : ""));
    BASE = RENDERED = location.hash.slice(1);
    if (V === ACCUEIL) LAST_AFF = BASE;
    maj();
  }
  function maj() {
    const m = $("#expos"), f = XF;
    m.querySelectorAll("[data-g]").forEach((b) => {
      const g = b.dataset.g, v = b.dataset.v;
      b.setAttribute("aria-pressed", String(g === "note" ? f.note === +v : typeof f[g] === "boolean" ? f[g] : f[g].has(v)));
    });
    const nF = f.type.size + f.arr.size + (f.note ? 1 : 0) + [f.gratuit, f.jeunes, f.nocturne].filter(Boolean).length;
    $("#xnF").textContent = nF ? " " + nF : ""; m.querySelector("[data-panel]").setAttribute("aria-label", "Filtres" + (nF ? `, ${nF} actif${nF > 1 ? "s" : ""}` : ""));
    const xq = $("#xq"); if (document.activeElement !== xq && xq.value !== f.q) xq.value = f.q;
    const items = base().filter((e) => garde(e, f)).sort(V === "bientot" ? ouverture : urgence);
    $("#xnres").textContent = plural(items.length, "exposition");
    const act = actifs(f);
    $("#xactive").innerHTML = `${act.map((a) => `<button class="chip on${a.k === "dom" ? " g-x" + a.v : ""}" type="button" data-rm="${a.k}" data-v="${esc(a.v)}" aria-label="Retirer le filtre ${esc(a.t)}">${esc(a.t)}<span class="x" aria-hidden="true">×</span></button>`).join("")}${act.length ? `<button class="chip effacer" type="button" data-clear>Tout effacer</button>` : ""}`;
    // Groupes comme les ouvertures de vente : titre en métadonnées, deux colonnes sur bureau.
    const html = groupesPar(items, (e) => (V === "bientot" ? groupOf(e) : expoEtat(e) === "derniers" ? "Derniers jours" : "En cours"), rowA);
    $("#xlist").innerHTML = html || `<p class="empty">${act.length ? "Aucune exposition ne correspond." : VUES[V].vide}</p>`;
  }
  function render(vue, q) {
    V = VUES[vue] ? vue : "a-voir"; XF = lireF(q);
    if (V === ACCUEIL) LAST_AFF = V + (q ? "?" + q : "");
    const B = base();
    const chip = (g, v, t, extra = "") => `<button class="chip" type="button" data-g="${g}" data-v="${esc(v)}" aria-pressed="false"${extra}>${t}</button>`;
    const types = Object.keys(EXPO_TYPES).filter((t) => B.some((e) => xp(e).type === t)), doms = Object.keys(X_DOMAINES).filter((d) => B.some((e) => domaineX(e) === d));
    const arrs = [...new Set(B.map((e) => arrdt(e)))].sort((a, b) => (a || 99) - (b || 99));
    $("#main").innerHTML = `<section id="expos"><h1 class="vh">${VUES[V].titre}</h1>
    <div class="tools barre-f">${rech("xq", "Rechercher une exposition", XF.q)}
      <button class="chip filtres" type="button" data-panel="xpF" aria-expanded="false" aria-controls="xpF">${ico("filtres")}<span class="lbf">Filtres</span><span class="nf" id="xnF"></span></button></div>
    <div class="fbar"><div class="chips defile gtabs" role="group" aria-label="Domaines">${doms.map((d) => chip("dom", d, ico("x" + d) + X_DOMAINES[d]).replace('class="chip"', `class="chip g-x${d}"`)).join("")}</div>
      <div class="fpanel" id="xpF" hidden>
        <div class="fgr" role="group" aria-labelledby="xgN"><span class="fl" id="xgN">Note</span><div class="chips">${chip("note", "2", carres(2, true), ' aria-label="Note 2 et plus"')}${chip("note", "3", carres(3, true), ' aria-label="Note 3 et plus"')}${chip("note", "4", carres(4), ' aria-label="Note 4"')}</div></div>
        <div class="fgr" role="group" aria-labelledby="xgL"><span class="fl" id="xgL">Lieu</span><div class="chips">${types.map((t) => chip("type", t, EXPO_TYPES[t])).join("")}</div></div>
        ${arrs.length ? `<div class="fgr" role="group" aria-labelledby="xgO"><span class="fl" id="xgO">Où</span><div class="chips">${arrs.map((n) => chip("arr", String(n), n ? arrdtTxt(n) : "Hors Paris", n ? ` aria-label="${libArr(n)}"` : "")).join("")}</div></div>` : ""}
        <div class="fgr" role="group" aria-labelledby="xgT"><span class="fl" id="xgT">Tarif</span><div class="chips">${chip("gratuit", "1", "Gratuit")}${chip("jeunes", "1", "Gratuit jeunes", ' aria-label="Gratuit pour les jeunes"')}</div></div>
        <div class="fgr" role="group" aria-labelledby="xgQ"><span class="fl" id="xgQ">Quand</span><div class="chips">${chip("nocturne", "1", "Nocturne")}</div></div>
      </div>
      <div class="resbar"><span class="n" id="xnres" aria-live="polite"></span><div class="active" id="xactive"></div></div></div>
    <div id="xlist"></div></section>`;
    const m = $("#expos"), pb = m.querySelector("[data-panel]");
    pb.onclick = () => { const p = $("#xpF"), open = p.hidden; p.hidden = !open; pb.setAttribute("aria-expanded", String(open)); };
    m.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-g]");
      if (b) return pose((f) => { const g = b.dataset.g, v = b.dataset.v; if (g === "note") f.note = f.note === +v ? 0 : +v; else if (typeof f[g] === "boolean") f[g] = !f[g]; else f[g].has(v) ? f[g].delete(v) : f[g].add(v); });
      const r = ev.target.closest("[data-rm]");
      if (r) return pose((f) => { const k = r.dataset.rm; if (f[k] instanceof Set) f[k].delete(r.dataset.v); else f[k] = typeof f[k] === "boolean" ? false : typeof f[k] === "number" ? 0 : ""; });
      if (ev.target.closest("[data-clear]")) pose((f) => Object.assign(f, lireF("")));
    });
    $("#xq").oninput = (ev) => pose((f) => { f.q = ev.target.value; });
    maj();
  }
  window.EXPOS = { render };
})();
