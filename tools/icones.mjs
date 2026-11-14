// node tools/icones.mjs : génère, depuis la clé F (assets/logo.svg), toutes les images de l'identité Factotum.
//   assets/icon.svg                favicon : carré rouge, clé blanche centrée, marge de 18 %
//   assets/icon-180|192|512.png    icônes (iOS, PWA) ; assets/icon-maskable-512.png (zone sûre Android)
//   assets/og.png                  image de partage 1200×630
//   assets/github-social.png       aperçu du dépôt 1280×640 ; assets/avatar.png 500×500 (à téléverser à la main)
// Utilise le Chromium de Playwright. Les PNG sont pleins (sans transparence ni coins arrondis : iOS et Android découpent).
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROUGE = "#E30613", BLANC = "#FFFFFF";
const logo = readFileSync("assets/logo.svg", "utf8");
const groupe = /<g[\s\S]*<\/g>/.exec(logo)[0];
const police = (g) => `@font-face{font-family:F;font-weight:${g};src:url(data:font/woff2;base64,${readFileSync(`assets/fonts/schibsted-${g}.woff2`).toString("base64")}) format("woff2")}`;

const b = await chromium.launch();
const p = await b.newPage();

// Emprise réelle du dessin dans la boîte 48 × 48 (mesurée, pour centrer et respecter la marge exactement)
await p.setViewportSize({ width: 480, height: 480 });
await p.setContent(`<style>html,body{margin:0}</style><svg id="s" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="480" height="480">${groupe}</svg>`);
const box = await p.evaluate(() => {
  // Rectangles : leur rectangle client est exact. Anneau : centre mesuré, rayon extérieur (6,5 + 2,5) × 0,88 × 10 px.
  const r = [...document.querySelectorAll("#s rect")].map((e) => e.getBoundingClientRect());
  const cr = document.querySelector("#s circle").getBoundingClientRect(), cx = (cr.left + cr.right) / 2, cy = (cr.top + cr.bottom) / 2, R = 9 * 0.88 * 10;
  return { x0: Math.min(...r.map((x) => x.left), cx - R) / 10, y0: Math.min(...r.map((x) => x.top), cy - R) / 10, x1: Math.max(...r.map((x) => x.right), cx + R) / 10, y1: Math.max(...r.map((x) => x.bottom), cy + R) / 10 };
});
const W = box.x1 - box.x0, H = box.y1 - box.y0, CX = (box.x0 + box.x1) / 2, CY = (box.y0 + box.y1) / 2;
// Clé blanche dans un carré rouge de 100 : la plus grande dimension du dessin occupe (1 − 2 × marge)
const icone = (marge) => {
  const k = (100 * (1 - 2 * marge)) / Math.max(W, H), r = (n) => Math.round(n * 1000) / 1000;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${ROUGE}"/><g color="${BLANC}" fill="${BLANC}" transform="translate(${r(50 - CX * k)} ${r(50 - CY * k)}) scale(${r(k)})">${groupe}</g></svg>\n`;
};
writeFileSync("assets/icon.svg", icone(0.18));

const png = async (svg, n, out) => {
  await p.setViewportSize({ width: n, height: n });
  await p.setContent(`<style>html,body{margin:0}svg{display:block;width:${n}px;height:${n}px}</style>${svg}`);
  await p.screenshot({ path: out });
};
for (const n of [180, 192, 512]) await png(icone(0.18), n, `assets/icon-${n}.png`);
await png(icone(0.25), 512, "assets/icon-maskable-512.png"); // zone sûre : cercle de 80 %
await png(icone(0.18), 500, "assets/avatar.png");

// Image de partage : aplat rouge, clé F et FACTOTUM en blanc à gauche, une ligne de métadonnée dessous. Rien d'autre.
const partage = async (w, h, out) => {
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(`<style>${police(500)}${police(800)}
html,body{margin:0;width:${w}px;height:${h}px;background:${ROUGE};color:${BLANC};overflow:hidden;font-family:F}
.w{position:absolute;left:${Math.round(w * 0.08)}px;bottom:${Math.round(h * 0.16)}px}
.logo{display:block;font-size:${Math.round(w * 0.105)}px;font-weight:800;line-height:.9;letter-spacing:-.02em;text-transform:uppercase;white-space:nowrap}
.cle{display:inline-block;width:1.17em;height:1.17em;margin:-.197em 0 -.27em -.18em;vertical-align:baseline;fill:currentColor}
p{margin:${Math.round(w * 0.022)}px 0 0;font-size:${Math.round(w * 0.024)}px;font-weight:500;text-transform:uppercase;letter-spacing:.06em}
</style><div class="w"><span class="logo"><svg class="cle" viewBox="0 0 48 48">${groupe}</svg>Factotum</span><p>Spectacles, saison après saison</p></div>`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: out });
};
await partage(1200, 630, "assets/og.png");
await partage(1280, 640, "assets/github-social.png");
await b.close();
console.log(`Images générées (emprise de la clé : ${W.toFixed(1)} × ${H.toFixed(1)} sur 48).`);
