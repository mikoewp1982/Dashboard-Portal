import { createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { adminAuth } from "@/lib/firebase-admin";

type ServiceAccountKey = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function readServiceAccountKey(): ServiceAccountKey | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (raw) {
    try {
      return JSON.parse(raw) as ServiceAccountKey;
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
  }

  const localPath = path.join(process.cwd(), "service-account.json");
  if (existsSync(localPath)) {
    return JSON.parse(readFileSync(localPath, "utf8")) as ServiceAccountKey;
  }

  return null;
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

/** Mint Firebase custom token locally (no IAM signBlob) when private key is available. */
export function mintCustomTokenLocally(
  uid: string,
  claims: Record<string, unknown>
): string | null {
  const sa = readServiceAccountKey();
  if (!sa?.client_email || !sa.private_key) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
      iat: now,
      exp: now + 3600,
      uid,
      claims,
    })
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = signer.sign(sa.private_key, "base64url");
  return `${header}.${payload}.${signature}`;
}

export async function createTeacherCustomToken(
  uid: string,
  claims: Record<string, unknown>
): Promise<string | null> {
  const local = mintCustomTokenLocally(uid, claims);
  if (local) return local;

  try {
    return await adminAuth.createCustomToken(uid, claims);
  } catch {
    return null;
  }
}
