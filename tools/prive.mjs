// Usage :
//   node tools/prive.mjs ouvrir            -> déchiffre data/prive.enc vers _prive.json (ignoré par git)
//   node tools/prive.mjs fermer            -> chiffre _prive.json vers data/prive.enc, puis supprime _prive.json
//   node tools/prive.mjs init <fichier>    -> premier chiffrement depuis un fichier en clair (puis le supprime)
// Le mot de passe est lu dans la variable d'environnement SAISON_MDP.
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { chiffrer, dechiffrer } from "./crypto.mjs";

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
    writeFileSync(ENC, JSON.stringify(await chiffrer(objet, MDP)));
    rmSync(CLAIR);
    console.log(`Zone privée chiffrée dans ${ENC}, fichier en clair supprimé.`);
  } else if (cmd === "init") {
    const objet = JSON.parse(readFileSync(arg, "utf8"));
    if (!objet.icsToken) objet.icsToken = randomBytes(12).toString("hex");
    writeFileSync(ENC, JSON.stringify(await chiffrer(objet, MDP)));
    rmSync(arg);
    console.log(`Zone privée initialisée. Jeton du flux agenda : ${objet.icsToken}`);
  } else {
    console.log("Commandes : ouvrir | fermer | init <fichier>");
    process.exit(1);
  }
}
main().catch((e) => { console.error("Erreur :", e.message); process.exit(1); });
