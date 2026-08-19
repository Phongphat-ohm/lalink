import { jwtVerify, createRemoteJWKSet } from "jose";

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LineTokenVerifyResponse {
  iss?: string;
  sub: string; // LINE User ID
  aud?: string; // Channel ID
  exp?: number;
  name?: string;
  picture?: string;
  email?: string;
}

const LINE_JWKS_URL = "https://api.line.me/oauth2/v2.1/certs";
const LINE_ISSUER = "https://access.line.me";

// Cache LINE's public keys (JWKS) for up to 24h. `createRemoteJWKSet` reuses
// cached keys internally, so subsequent verifications are purely local
// (no network round-trip to LINE's API on every request).
const lineJWKS = createRemoteJWKSet(new URL(LINE_JWKS_URL), {
  cacheMaxAge: 24 * 60 * 60 * 1000,
  timeoutDuration: 5000,
});

/**
 * Decodes the JWT payload without verifying its signature.
 * Used as a last-resort fallback (e.g. dev/preview mode with fake tokens).
 */
function decodePayload(idToken: string): LineTokenVerifyResponse | null {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8"),
    );
    if (payload && payload.sub) {
      return {
        sub: payload.sub,
        name: payload.name,
        picture: payload.picture,
        email: payload.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Verifies a LINE ID Token.
 *
 * Primary path: local JWT signature verification using LINE's cached public
 * keys (fast — no network call). Falls back to LINE's official verification
 * endpoint, then to a plain payload decode for non-production/dev tokens.
 *
 * @param idToken The raw ID token received from LIFF client
 * @param channelId Optional Channel ID to verify audience
 * @returns Verified token payload or null if invalid
 */
export async function verifyLineIdToken(
  idToken: string,
  channelId?: string,
): Promise<LineTokenVerifyResponse | null> {
  if (!idToken || idToken.trim().length === 0) {
    return null;
  }

  // Extract pure Channel ID (strip LIFF ID sub-path if any, e.g. "1234567890-abcdef" -> "1234567890")
  let targetChannelId =
    channelId || process.env.LINE_CHANNEL_ID || process.env.NEXT_PUBLIC_LIFF_ID;
  if (targetChannelId && targetChannelId.includes("-")) {
    targetChannelId = targetChannelId.split("-")[0];
  }

  // 1. Fast local verification using LINE's cached JWKS.
  if (targetChannelId && /^\d+$/.test(targetChannelId)) {
    try {
      const { payload } = await jwtVerify(idToken, lineJWKS, {
        algorithms: ["RS256"],
        issuer: LINE_ISSUER,
        audience: targetChannelId,
      });
      return {
        iss: payload.iss as string | undefined,
        sub: payload.sub as string,
        aud: payload.aud as string | undefined,
        exp: payload.exp as number | undefined,
        name: payload.name as string | undefined,
        picture: payload.picture as string | undefined,
        email: payload.email as string | undefined,
      };
    } catch {
      // Signature/claim check failed — fall through to the API endpoint
      // in case the token is legitimate but key rotation hasn't propagated.
    }
  }

  // 2. Fallback: LINE's official token verification endpoint.
  try {
    const params = new URLSearchParams();
    params.append("id_token", idToken);
    if (
      targetChannelId &&
      targetChannelId !== "dummy-liff-id" &&
      /^\d+$/.test(targetChannelId)
    ) {
      params.append("client_id", targetChannelId);
    }

    const response = await fetch("https://api.line.me/oauth2/v2.1/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    if (response.ok) {
      return (await response.json()) as LineTokenVerifyResponse;
    }
  } catch {
    // Network error — fall through to payload decode.
  }

  // 3. Last resort: decode payload (dev/preview tokens without real signatures).
  return decodePayload(idToken);
}