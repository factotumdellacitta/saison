// node tools/visuels.mjs : génère une fois les icônes PNG (180, 192, 512) et l'image de partage assets/og.png (1200×630).
// Utilise le Chromium de Playwright. Les PNG sont pleins (sans transparence ni coins arrondis : iOS et Android les découpent).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const svg = readFileSync("assets/icon.svg", "utf8").replace(' rx="112"', "");
const font = readFileSync("assets/literata.woff2").toString("base64");
const b = await chromium.launch();
const p = await b.newPage();
for (const n of [180, 192, 512]) {
  await p.setViewportSize({ width: n, height: n });
  await p.setContent(`<style>html,body{margin:0}svg{display:block;width:${n}px;height:${n}px}</style>${svg}`);
  await p.screenshot({ path: `assets/icon-${n}.png` });
}
const ticket = (d, m, t, l, s) => `<div class="tk"><div class="stub"><b>${d}</b><small>${m}</small></div><div class="mid"><div class="t">${t}</div><div class="l">${l}</div></div><div class="s">${s}</div></div>`;
await p.setViewportSize({ width: 1200, height: 630 });
await p.setContent(`<style>
@font-face{font-family:L;src:url(data:font/woff2;base64,${font})}
html,body{margin:0;width:1200px;height:630px;background:#F5F6F1;font-family:system-ui,sans-serif;color:#1B2430;overflow:hidden}
.w{display:grid;grid-template-columns:560px 1fr;gap:40px;padding:72px 64px;height:100%;box-sizing:border-box;align-items:center}
h1{font:600 92px/1 L;margin:0;letter-spacing:-.02em}h1 span{color:#A8231B;display:block}
p{font-size:28px;line-height:1.35;color:#545E6B;margin:28px 0 0}
.tk{display:flex;background:#fff;border:2px solid #D5D9D2;border-radius:18px;overflow:hidden;margin:0 0 16px;height:96px}
.stub{width:96px;background:#DCEAE1;color:#1F4733;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:4px dashed #fff;position:relative}
.stub:before,.stub:after{content:"";position:absolute;right:-13px;width:22px;height:22px;border-radius:50%;background:#F5F6F1}.stub:before{top:-13px}.stub:after{bottom:-13px}
.stub b{font:600 36px/1 L}.stub small{font-size:17px;font-weight:600}
.mid{flex:1;padding:0 20px;display:flex;flex-direction:column;justify-content:center;min-width:0}
.t{font:600 28px/1.2 L;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.l{font-size:19px;color:#545E6B;margin-top:4px;white-space:nowrap}
.s{color:#A8231B;font-size:26px;display:flex;align-items:center;padding-right:22px;letter-spacing:2px}
</style><div class="w"><div><h1>Saison<span>2026–2027</span></h1><p>Théâtre, opéra, danse, concerts et expositions à Paris, notés et commentés.</p></div>
<div>${ticket("15", "oct.", "Ruy Blas", "Comédie-Française · Théâtre", "★★★")}${ticket("8", "févr.", "Werther", "Opéra Bastille · Opéra", "★★★★")}${ticket("21", "janv.", "Giselle", "Garnier · Danse", "★★★")}${ticket("4", "mars", "La Mouette", "Odéon · Théâtre", "★★")}</div></div>`);
await p.waitForTimeout(200);
await p.screenshot({ path: "assets/og.png" });
await b.close();
console.log("Icônes et image de partage générées.");
