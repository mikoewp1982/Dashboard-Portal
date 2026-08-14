type PasswordSignInResult = {
  localId: string;
  email: string;
  displayName?: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
};

/**
 * Server-side Identity Toolkit password sign-in.
 * Avoids App Hosting browser → identitytoolkit network failures (Safari ITP /
 * missing /__/auth handler on *.hosted.app) by completing Auth on the server.
 */
export async function signInTeacherWithPassword(
  email: string,
  password: string
): Promise<PasswordSignInResult> {
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ||
    process.env.FIREBASE_WEB_API_KEY?.trim() ||
    "AIzaSyDu0-azn8PV7dNEnXC2HHsf2_gxSd7dzcs";

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const payload = (await response.json().catch(() => ({}))) as {
    localId?: string;
    email?: string;
    displayName?: string;
    idToken?: string;
    refreshToken?: string;
    expiresIn?: string;
    error?: { message?: string };
  };

  if (
    !response.ok ||
    !payload.localId ||
    !payload.email ||
    !payload.idToken ||
    !payload.refreshToken ||
    !payload.expiresIn
  ) {
    const code = String(payload.error?.message || "LOGIN_FAILED");
    if (/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND/i.test(code)) {
      throw new Error("NUPTK tidak cocok dengan data guru terdaftar.");
    }
    throw new Error("Gagal membuat sesi login guru. Coba lagi.");
  }

  return {
    localId: payload.localId,
    email: payload.email,
    displayName: payload.displayName,
    idToken: payload.idToken,
    refreshToken: payload.refreshToken,
    expiresIn: payload.expiresIn,
  };
}
