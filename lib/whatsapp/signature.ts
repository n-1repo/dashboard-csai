import "server-only";
import crypto from "node:crypto";

export function isValidMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string) {
  if (!signatureHeader) return false;

  const [scheme, providedHex] = signatureHeader.split("=");
  if (scheme !== "sha256" || !providedHex) return false;

  const expectedHex = crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

  const provided = Buffer.from(providedHex, "hex");
  const expected = Buffer.from(expectedHex, "hex");

  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}
