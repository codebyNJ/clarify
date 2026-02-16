"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Detect iOS Safari
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

// Detect if already in standalone mode (already installed)
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

// Detect mobile
function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

const DISMISS_KEY = "clarify-pwa-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return;

    // Don't show if recently dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISS_DURATION) return;

    // iOS doesn't support beforeinstallprompt — show manual guide (mobile only)
    if (isIOS() && isMobile()) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setShowIOSGuide(true), 2000);
      return () => clearTimeout(timer);
    }

    // Chrome / Edge / Android — listen for the install prompt (works on both mobile & desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay
      setTimeout(() => setShowBanner(true), 1500);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  // ── Android / Chrome install banner ──
  if (showBanner) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-up">
        <div className="mx-3 mb-3 rounded-2xl bg-[#1a1a1a] border border-white/10 p-4 shadow-2xl backdrop-blur-xl">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-white/60" />
          </button>

          <div className="flex items-center gap-3">
            {/* App icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center">
              <span className="text-white font-serif italic text-2xl">C</span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm">
                Install Clarify
              </h3>
              <p className="text-white/60 text-xs mt-0.5">
                Add to your home screen for a better experience
              </p>
            </div>
          </div>

          {/* Install button */}
          <button
            onClick={handleInstall}
            className="mt-3 w-full py-2.5 px-4 rounded-xl bg-white text-black font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Download className="h-4 w-4" />
            Install App
          </button>
        </div>
      </div>
    );
  }

  // ── iOS Safari guide ──
  if (showIOSGuide) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-up">
        <div className="mx-3 mb-3 rounded-2xl bg-[#1a1a1a] border border-white/10 p-4 shadow-2xl backdrop-blur-xl">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-white/60" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center">
              <span className="text-white font-serif italic text-2xl">C</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm">
                Install Clarify
              </h3>
              <p className="text-white/60 text-xs mt-0.5">
                Add to your home screen for a native app experience
              </p>
            </div>
          </div>

          {/* iOS steps */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                1
              </div>
              <span>
                Tap the <Share className="inline h-3.5 w-3.5 -mt-0.5" /> Share
                button in Safari
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                2
              </div>
              <span>Scroll down and tap &quot;Add to Home Screen&quot;</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                3
              </div>
              <span>Tap &quot;Add&quot; to install Clarify</span>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="mt-3 w-full py-2.5 px-4 rounded-xl bg-white/10 text-white font-medium text-sm active:scale-[0.98] transition-transform"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return null;
}
