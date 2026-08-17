export interface LineMessageResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}

/**
 * Send Push Message to a single LINE User
 */
export async function sendLinePushMessage(
  toLineUserId: string,
  messages: any[],
  customAccessToken?: string,
): Promise<LineMessageResult> {
  const token =
    customAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

  if (!token || !toLineUserId) {
    // In development / test mode without LINE credentials
    return {
      success: true,
      statusCode: 200,
      error: "Mock mode (No LINE Channel Token configured)",
    };
  }

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: toLineUserId,
        messages: Array.isArray(messages) ? messages : [messages],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("LINE Messaging API Error:", response.status, errorText);
      return {
        success: false,
        statusCode: response.status,
        error: errorText,
      };
    }

    return {
      success: true,
      statusCode: response.status,
    };
  } catch (err: unknown) {
    console.warn("LINE Push Exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown network error",
    };
  }
}

/**
 * Send Multicast Message to multiple LINE Users
 */
export async function sendLineMulticastMessage(
  toLineUserIds: string[],
  messages: any[],
  customAccessToken?: string,
): Promise<LineMessageResult> {
  const validUserIds = toLineUserIds.filter(Boolean);
  if (validUserIds.length === 0) {
    return { success: true, statusCode: 200 };
  }

  const token =
    customAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

  if (!token) {
    return {
      success: true,
      statusCode: 200,
      error: "Mock mode",
    };
  }

  try {
    const response = await fetch(
      "https://api.line.me/v2/bot/message/multicast",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: validUserIds,
          messages: Array.isArray(messages) ? messages : [messages],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("LINE Multicast API Error:", response.status, errorText);
      return {
        success: false,
        statusCode: response.status,
        error: errorText,
      };
    }

    return {
      success: true,
      statusCode: response.status,
    };
  } catch (err: unknown) {
    console.warn("LINE Multicast Exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown network error",
    };
  }
}
