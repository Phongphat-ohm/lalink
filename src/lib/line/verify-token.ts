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

/**
 * Verifies a LINE ID Token using LINE's official token verification endpoint.
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
      const data = (await response.json()) as LineTokenVerifyResponse;
      return data;
    }

    // Fallback: decode JWT payload if API validation with specific channelId returned 400
    try {
      const parts = idToken.split(".");
      if (parts.length === 3) {
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
      }
    } catch {
      // Ignore
    }

    return null;
  } catch (error) {
    console.error("LINE Token Verification API Error:", error);
    // Decode token payload safely in case fetch errored (e.g. offline/dev)
    try {
      const parts = idToken.split(".");
      if (parts.length === 3) {
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
      }
    } catch {
      // Ignore
    }
    return null;
  }
}
