// Funções de assinatura/verificação de sessão usando Web Crypto API,
// compatíveis tanto com Node.js quanto com o Edge Runtime (usado pelo middleware).

const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 horas

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function importKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(signature);
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET não configurado. Defina essa variável de ambiente."
    );
  }
  return secret;
}

export async function createSessionToken(username: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const payload = `${username}.${expiresAt}`;
  const signature = await sign(payload, getSecret());
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [username, expiresAtStr, signature] = parts;
  const payload = `${username}.${expiresAtStr}`;

  let expectedSignature: string;
  try {
    expectedSignature = await sign(payload, getSecret());
  } catch {
    return false;
  }

  if (signature.length !== expectedSignature.length) return false;
  // Comparação simples: ambos são hex de tamanho fixo (SHA-256 = 64 chars)
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  if (mismatch !== 0) return false;

  const expiresAt = Number(expiresAtStr);
  if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

export const COOKIE_NAME = "biscoite_session";
export { SESSION_DURATION_SECONDS };
