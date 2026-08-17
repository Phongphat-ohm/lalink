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

  const targetChannelId =
    channelId || process.env.LINE_CHANNEL_ID || process.env.NEXT_PUBLIC_LIFF_ID;

  try {
    const params = new URLSearchParams();
    params.append("id_token", idToken);
    if (targetChannelId) {
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

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as LineTokenVerifyResponse;
    return data;
  } catch (error) {
    console.error("LINE Token Verification API Error:", error);
    return null;
  }
}
