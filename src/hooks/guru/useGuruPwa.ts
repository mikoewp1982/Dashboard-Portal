"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function useGuruPwa() {
  const [swReady, setSwReady] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pushNote, setPushNote] = useState("");

  useEffect(() => {
    setInstalled(isStandalone());
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }

    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    navigator.serviceWorker
      .register("/sw-guru.js", { scope: "/guru" })
      .then((registration) => {
        if (cancelled) return;
        (window as Window & { __guruSwReg?: ServiceWorkerRegistration }).__guruSwReg = registration;
        setSwReady(true);
      })
      .catch((error) => {
        console.warn("Gagal register SW guru:", error);
      });

    const onBip = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onBip);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setCanInstall(false);
    if (choice.outcome === "accepted") {
      setInstalled(true);
      return true;
    }
    return false;
  }, [installPrompt]);

  const requestNotifyPermission = useCallback(async () => {
    if (typeof Notification === "undefined") {
      setPushNote("Browser ini tidak mendukung Notification API.");
      return false;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") {
      setPushNote("Izin notifikasi ditolak. Inbox in-app tetap aktif.");
      return false;
    }

    // Scaffold FCM/Web Push bila VAPID tersedia
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
    if (!vapidKey) {
      setPushNote(
        "Notifikasi lokal aktif saat PWA/tab terbuka. Web Push background menunggu VAPID key (NEXT_PUBLIC_FIREBASE_VAPID_KEY)."
      );
      return true;
    }

    try {
      const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
      const supported = await isSupported();
      if (!supported) {
        setPushNote("Web Push tidak didukung di perangkat ini.");
        return true;
      }
      const messaging = getMessaging();
      const registration =
        (window as Window & { __guruSwReg?: ServiceWorkerRegistration }).__guruSwReg ||
        (await navigator.serviceWorker.ready);
      const fcmToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      const currentUser = auth.currentUser;
      if (fcmToken && currentUser) {
        const idToken = await currentUser.getIdToken();
        await fetch("/api/teacher/push-subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            fcmToken,
            userAgent: navigator.userAgent,
            platform: isIos() ? "ios-safari" : "web",
          }),
        });
        setPushNote(
          isIos()
            ? "Push iOS: butuh iOS 16.4+, Add to Home Screen, dan izin notifikasi."
            : "Token Web Push tersimpan."
        );
      }
      return true;
    } catch (error) {
      console.warn("FCM subscribe gagal:", error);
      setPushNote("Izin notifikasi aktif; token FCM gagal diambil. Inbox + notifikasi lokal tetap jalan.");
      return true;
    }
  }, []);

  return {
    swReady,
    canInstall,
    installed,
    isIos: isIos(),
    permission,
    pushNote,
    promptInstall,
    requestNotifyPermission,
  };
}
