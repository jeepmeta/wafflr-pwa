"use client";

import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "wafflr_install_dismissed_v1";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Soft install banner — shows when beforeinstallprompt fires and user hasn't dismissed.
 * Hidden when already standalone / installed.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS
      ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone);
    if (standalone) return;

    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    function onBip(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    if (choice.outcome === "dismissed") {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md card !p-3 flex items-center gap-3 shadow-[0_-4px_24px_rgba(15,23,42,0.12)]">
        <div
          className="char-frame shrink-0"
          style={{
            width: 48,
            height: 48,
            backgroundImage: "url(/characters/butters/nav-head.svg)",
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm leading-tight">Install Wafflr</p>
          <p className="text-[11px] text-muted truncate">Home screen · faster rooms · offline shell</p>
        </div>
        <button type="button" className="btn-primary !py-2 !px-3 text-sm shrink-0" onClick={() => void install()}>
          Install
        </button>
        <button
          type="button"
          className="text-muted text-lg leading-none px-1"
          aria-label="Dismiss"
          onClick={dismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}
