"use client";

import * as React from "react";
import type { Liff } from "@line/liff";
import { Button } from "@/components/ui/button";
import { LogIn, ShieldAlert, RefreshCw, Smartphone } from "lucide-react";

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

const LOGIN_COUNT_KEY = "lalink_liff_login_count";
const LOGIN_TIMESTAMP_KEY = "lalink_liff_login_ts";
const MAX_AUTO_LOGIN_ATTEMPTS = 2;
const LOGIN_COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown window

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
  const [requiresManualLogin, setRequiresManualLogin] = React.useState(false);

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
        const inClient = liffModule.isInClient();
        setIsInClient(inClient);

        const loggedIn = liffModule.isLoggedIn();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          // Reset loop protection counters upon successful login
          try {
            sessionStorage.removeItem(LOGIN_COUNT_KEY);
            sessionStorage.removeItem(LOGIN_TIMESTAMP_KEY);
          } catch {
            // Ignore sessionStorage errors in restricted environments
          }

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

          setIsReady(true);
        } else {
          // If not logged in and opened in external browser (not in LINE Client)
          if (!inClient) {
            // Check if current URL contains OAuth callback parameters (e.g. ?code= or ?state=)
            const searchParams =
              typeof window !== "undefined" ? window.location.search : "";
            const isOAuthCallback =
              searchParams.includes("code=") ||
              searchParams.includes("state=") ||
              searchParams.includes("liff.state=");

            // Check login loop prevention in sessionStorage
            let loginCount = 0;
            let lastLoginTime = 0;

            try {
              loginCount = parseInt(
                sessionStorage.getItem(LOGIN_COUNT_KEY) || "0",
                10,
              );
              lastLoginTime = parseInt(
                sessionStorage.getItem(LOGIN_TIMESTAMP_KEY) || "0",
                10,
              );
            } catch {
              // Ignore
            }

            const now = Date.now();
            const isWithinCooldown = now - lastLoginTime < LOGIN_COOLDOWN_MS;

            if (isWithinCooldown && loginCount >= MAX_AUTO_LOGIN_ATTEMPTS) {
              // Loop detected! Halt auto-redirect and ask user for manual login
              console.warn(
                `LIFF login loop prevented (${loginCount} attempts in ${LOGIN_COOLDOWN_MS / 1000}s). Requiring manual click.`,
              );
              setRequiresManualLogin(true);
              setIsReady(true);
              return;
            }

            if (!isOAuthCallback) {
              // Increment login redirect attempt
              try {
                sessionStorage.setItem(
                  LOGIN_COUNT_KEY,
                  String(isWithinCooldown ? loginCount + 1 : 1),
                );
                sessionStorage.setItem(LOGIN_TIMESTAMP_KEY, String(now));
              } catch {
                // Ignore
              }

              // Trigger automatic LINE Login redirect with current URL as redirectUri
              liffModule.login({ redirectUri: window.location.href });
              return;
            }
          }

          setIsReady(true);
        }
      } catch (err: unknown) {
        console.warn("LIFF initialization note (Running in web mode):", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE",
          );
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
      try {
        sessionStorage.removeItem(LOGIN_COUNT_KEY);
        sessionStorage.removeItem(LOGIN_TIMESTAMP_KEY);
      } catch {
        // Ignore
      }
      liffObject.login({
        redirectUri:
          typeof window !== "undefined" ? window.location.href : undefined,
      });
    }
  }, [liffObject]);

  const logout = React.useCallback(() => {
    if (liffObject && liffObject.isLoggedIn()) {
      liffObject.logout();
      setIsLoggedIn(false);
      setIdToken(null);
      setProfile(null);
      try {
        sessionStorage.removeItem(LOGIN_COUNT_KEY);
        sessionStorage.removeItem(LOGIN_TIMESTAMP_KEY);
      } catch {
        // Ignore
      }
    }
  }, [liffObject]);

  // If auto-redirect loop is detected on external browser, render safe manual login prompt
  if (requiresManualLogin && !isLoggedIn && !isInClient) {
    return (
      <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-[#e3e8ee] rounded-3xl p-6 shadow-lg text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06c755]/10 text-[#06c755]">
            <Smartphone className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#0d253d]">
              เข้าสู่ระบบด้วย LINE
            </h2>
            <p className="text-xs text-[#64748d]">
              คุณกำลังเปิดผ่านเบราว์เซอร์ภายนอก
              กรุณากดปุ่มด้านล่างเพื่อเข้าสู่ระบบ LINE
            </p>
          </div>

          <Button
            onClick={login}
            className="w-full h-11 rounded-full bg-[#06c755] hover:bg-[#05b34c] text-white text-xs font-semibold shadow-md flex items-center justify-center"
          >
            <LogIn className="h-4 w-4 mr-2" />
            เข้าสู่ระบบด้วย LINE (LINE Login)
          </Button>

          <p className="text-[10px] text-[#64748d]">
            ระบบป้องกันการวนรอบล็อกอินอัตโนมัติ (Anti-Loop Protection Active)
          </p>
        </div>
      </div>
    );
  }

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
