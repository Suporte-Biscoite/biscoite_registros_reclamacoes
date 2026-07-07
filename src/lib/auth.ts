// Helpers de autenticação para uso em Server Components e Route Handlers.
// Para o middleware (Edge Runtime), use diretamente src/lib/session.ts.

import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

export function checkCredentials(username: string, password: string): boolean {
  const validUser = process.env.APP_USERNAME;
  const validPass = process.env.APP_PASSWORD;
  if (!validUser || !validPass) {
    throw new Error(
      "APP_USERNAME / APP_PASSWORD não configurados nas variáveis de ambiente."
    );
  }
  return username === validUser && password === validPass;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export { COOKIE_NAME };
