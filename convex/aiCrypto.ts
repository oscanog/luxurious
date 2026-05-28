"use node";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const VERSION = "v1";

function getKey() {
  const secret = process.env.AI_SETTINGS_MASTER_KEY;
  if (!secret || secret.length < 24) {
    throw new Error("AI_SETTINGS_MASTER_KEY is missing or too short.");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plainText: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptSecret(payload: string) {
  const [version, ivText, tagText, encryptedText] = payload.split(":");
  if (version !== VERSION || !ivText || !tagText || !encryptedText) {
    throw new Error("Invalid encrypted secret payload.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivText, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
