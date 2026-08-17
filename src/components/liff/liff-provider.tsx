"use client";

import * as React from "react";
import type { Liff } from "@line/liff";

export interface LiffContextValue {
  liff: Liff | null;
  isReady: boolean;
  isInClient: boolean;
  isLoggedIn: boolean;
  idToken: string | null;
  profile: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  } | null;
  error: string | null;
  login: () => void;
  logout: () => void;
}

const LiffContext = React.createContext<LiffContextValue | null>(null);

export function LiffProvider({
  children,
  liffId,
}: {
  children: React.ReactNode;
  liffId?: string;
}) {
  const [liffObject, setLiffObject] = React.useState<Liff | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [isInClient, setIsInClient] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [idToken, setIdToken] = React.useState<string | null>(null);
  const [profile, setProfile] =
    React.useState<LiffContextValue["profile"]>(null);
  const [error, setError] = React.useState<string | null>(null);

  const targetLiffId = liffId || process.env.NEXT_PUBLIC_LIFF_ID || "";

  React.useEffect(() => {
    let isMounted = true;

    async function initLiff() {
      // If no LIFF ID configured, run in Web/Preview mode
      if (!targetLiffId || targetLiffId === "dummy-liff-id") {
        if (isMounted) {
          setIsReady(true);
        }
        return;
      }

      try {
        const liffModule = (await import("@line/liff")).default;
        await liffModule.init({ liffId: targetLiffId });

        if (!isMounted) return;

        setLiffObject(liffModule);
        setIsInClient(liffModule.isInClient());
        const loggedIn = liffModule.isLoggedIn();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          const token = liffModule.getIDToken();
          setIdToken(token || null);

          try {
            const userProfile = await liffModule.getProfile();
            if (isMounted) {
              setProfile({
                userId: userProfile.userId,
                displayName: userProfile.displayName,
                pictureUrl: userProfile.pictureUrl,
                statusMessage: userProfile.statusMessage,
              });
            }
          } catch (profileErr) {
            console.warn("Failed to get profile from LIFF:", profileErr);
          }
        }

        setIsReady(true);
      } catch (err: unknown) {
        console.warn("LIFF initialization note (Running in web mode):", err);
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    initLiff();

    return () => {
      isMounted = false;
    };
  }, [targetLiffId]);

  const login = React.useCallback(() => {
    if (liffObject && !liffObject.isLoggedIn()) {
      liffObject.login();
    }
  }, [liffObject]);

  const logout = React.useCallback(() => {
    if (liffObject && liffObject.isLoggedIn()) {
      liffObject.logout();
      setIsLoggedIn(false);
      setIdToken(null);
      setProfile(null);
    }
  }, [liffObject]);

  return (
    <LiffContext.Provider
      value={{
        liff: liffObject,
        isReady,
        isInClient,
        isLoggedIn,
        idToken,
        profile,
        error,
        login,
        logout,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
}

export function useLiff(): LiffContextValue {
  const context = React.useContext(LiffContext);
  if (!context) {
    throw new Error("useLiff must be used within a LiffProvider");
  }
  return context;
}
