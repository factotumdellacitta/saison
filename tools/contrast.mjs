// node tools/contrast.mjs : vérifie les contrastes WCAG AA des paires texte/fond de la charte Factotum.
// Les couleurs sont lues dans assets/factotum.css (jetons des thèmes clair et sombre), jamais recopiées ici.
// Seuils : 4,5:1 pour le corps de texte, 3:1 pour les grands textes et les éléments graphiques (filets, aplats, focus).
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// [texte, fond, seuil, usage]
export const PAIRES = [
  ["encre", "fond", 4.5, "corps de texte"],
  ["encre", "surface", 4.5, "texte sur surface, champs"],
  ["encre-2", "fond", 4.5, "métadonnées"],
  ["encre-2", "surface", 4.5, "métadonnées sur surface, textes indicatifs"],
  ["rouge-texte", "fond", 4.5, "note, liens d’erreur, boutons destructifs"],
  ["rouge-texte", "surface", 4.5, "rouge sur surface"],
  ["sur-rouge", "rouge", 4.5, "texte blanc sur aplat rouge (en-tête, bandeaux, badges)"],
  ["fond", "encre", 4.5, "texte inversé (messages, en-tête admin, puce ouverte)"],
  ["fond", "rouge", 3, "grand texte : survol du bouton principal"],
  ["filet", "fond", 3, "filets de section"],
  ["rouge", "fond", 3, "aplats rouges et anneaux de focus sur fond"],
];

const hex = (h) => { const m = /^#([0-9a-f]{6})$/i.exec(h.trim()); if (!m) throw new Error(`couleur illisible : ${h}`); return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255); };
const lum = (h) => { const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const bloc = (css, entete) => {
  const i = css.indexOf(entete); if (i < 0) return null;
  const corps = css.slice(i + entete.length, css.indexOf("}", i));
  return Object.fromEntries([...corps.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
};

export function verifierContrastes(fichier = "assets/factotum.css") {
  const css = readFileSync(fichier, "utf8"), erreurs = [], lignes = [];
  const themes = {
    clair: bloc(css, ':root,[data-theme="light"]{'),
    sombre: bloc(css, ':root[data-theme="dark"],[data-theme="dark"]{'),
    "sombre (système)": bloc(css, ':root:not([data-theme="light"]){'),
  };
  for (const [nom, t] of Object.entries(themes)) {
    if (!t) { erreurs.push(`${fichier} : jetons du thème ${nom} introuvables.`); continue; }
    for (const [a, b, seuil, usage] of PAIRES) {
      if (!t[a] || !t[b]) { erreurs.push(`${fichier} : jeton --${t[a] ? b : a} absent du thème ${nom}.`); continue; }
      const r = ratio(t[a], t[b]);
      lignes.push(`${nom.padEnd(17)} --${a} sur --${b} : ${r.toFixed(2)} (seuil ${seuil})`);
      if (r < seuil) erreurs.push(`Contraste insuffisant (${nom}) : --${a} ${t[a]} sur --${b} ${t[b]} = ${r.toFixed(2)}:1, il faut ${seuil}:1 (${usage}).`);
    }
  }
  if (themes.sombre && themes["sombre (système)"] && JSON.stringify(themes.sombre) !== JSON.stringify(themes["sombre (système)"]))
    erreurs.push(`${fichier} : les jetons sombres diffèrent entre [data-theme="dark"] et prefers-color-scheme.`);
  return { erreurs, lignes };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { erreurs, lignes } = verifierContrastes();
  console.log(lignes.join("\n"));
  if (erreurs.length) { console.error("\n" + erreurs.join("\n")); process.exit(1); }
  console.log("Contrastes : OK");
}
