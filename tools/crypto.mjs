// Chiffrement de la zone privée : PBKDF2-SHA256 + AES-256-GCM.
// Mêmes paramètres que dans index.html (déchiffrement côté navigateur).
import { webcrypto as crypto } from "node:crypto";

const ITER = 310000;
const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (buf) => Buffer.from(buf).toString("base64");
const unb64 = (s) => new Uint8Array(Buffer.from(s, "base64"));

async function deriveKey(password, salt, iter = ITER) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: iter },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function chiffrer(objet, password) {
  if (!password) throw new Error("Mot de passe absent : définis SAISON_MDP dans l'environnement Claude Code.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(objet)));
  return { v: 1, kdf: "PBKDF2-SHA256", iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}

export async function dechiffrer(paquet, password) {
  if (!password) throw new Error("Mot de passe absent : définis SAISON_MDP dans l'environnement Claude Code.");
  const key = await deriveKey(password, unb64(paquet.salt), paquet.iter);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(paquet.iv) }, key, unb64(paquet.ct));
  return JSON.parse(dec.decode(pt));
}
