// Usage :
//   node tools/prive.mjs ouvrir            -> déchiffre data/prive.enc vers _prive.json (ignoré par git)
//   node tools/prive.mjs fermer            -> chiffre _prive.json vers data/prive.enc, puis supprime _prive.json
//   node tools/prive.mjs init <fichier>    -> premier chiffrement depuis un fichier en clair (puis le supprime)
// Schéma v2 : { version:2, icsToken, reservations{}, envies{}, journalPrive{}, soirs[], blocages[], aCompleter[] } (voir CLAUDE.md).
// Le mot de passe est lu dans la variable d'environnement SAISON_MDP.
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { chiffrer, dechiffrer, ITER } from "./crypto.mjs";

const MDP = process.env.SAISON_MDP;
const ENC = "data/prive.enc";
const CLAIR = "_prive.json";
const [cmd, arg] = process.argv.slice(2);

async function main() {
  if (cmd === "ouvrir") {
    const objet = await dechiffrer(JSON.parse(readFileSync(ENC, "utf8")), MDP);
    writeFileSync(CLAIR, JSON.stringify(objet, null, 1));
    console.log(`Zone privée ouverte dans ${CLAIR}. Pense à lancer « node tools/prive.mjs fermer ».`);
  } else if (cmd === "fermer") {
    if (!existsSync(CLAIR)) throw new Error(`${CLAIR} introuvable.`);
    const objet = JSON.parse(readFileSync(CLAIR, "utf8"));
    if (objet.version !== 2) throw new Error("Zone privée : version 2 attendue (voir CLAUDE.md).");
    // Garde le sel actuel si le mot de passe n'a pas changé (le mode admin du site reste ainsi connecté).
    // Paquet à l'ancien nombre d'itérations : nouveau sel, le site redemandera le mot de passe une fois.
    let sel;
    try { const p = JSON.parse(readFileSync(ENC, "utf8")); await dechiffrer(p, MDP); if (p.iter === ITER) sel = p.salt; } catch (_) {}
    writeFileSync(ENC, JSON.stringify(await chiffrer(objet, MDP, sel)));
    rmSync(CLAIR);
    console.log(`Zone privée chiffrée dans ${ENC}, fichier en clair supprimé.`);
  } else if (cmd === "init") {
    const objet = { version: 2, reservations: {}, envies: {}, journalPrive: {}, soirs: [], blocages: [], aCompleter: [], ...JSON.parse(readFileSync(arg, "utf8")) };
    if (!objet.icsToken) objet.icsToken = randomBytes(12).toString("hex");
    writeFileSync(ENC, JSON.stringify(await chiffrer(objet, MDP)));
    rmSync(arg);
    console.log("Zone privée initialisée. Les adresses des flux se lisent dans le mode admin du site, onglet Abonnements.");
  } else {
    console.log("Commandes : ouvrir | fermer | init <fichier>");
    process.exit(1);
  }
}
main().catch((e) => { console.error("Erreur :", e.message); process.exit(1); });
