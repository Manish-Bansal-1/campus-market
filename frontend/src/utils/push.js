// frontend/src/utils/push.js

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// ✅ LocalStorage key (so we don't annoy user again and again)
const PUSH_ENABLED_KEY = "pushEnabledOnce";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// ✅ Get existing SW registration OR register new one (stable)
async function getOrRegisterServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;

  // If already registered, use it
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;

  // Register fresh
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
  });

  // wait until ready
  await navigator.serviceWorker.ready;

  return registration;
}

export const enablePushNotifications = async (token) => {
  try {
    if (!token) {
      console.log("❌ Missing token (user not logged in)");
      return { success: false, message: "Not logged in" };
    }

    if (!("serviceWorker" in navigator)) {
      console.log("❌ Service Worker not supported");
      return { success: false, message: "Service Worker not supported" };
    }

    if (!("PushManager" in window)) {
      console.log("❌ PushManager not supported");
      return { success: false, message: "Push not supported" };
    }

    if (!PUBLIC_VAPID_KEY) {
      console.log("❌ Missing VITE_VAPID_PUBLIC_KEY");
      return { success: false, message: "Missing VAPID key" };
    }

    // ✅ Register / reuse SW
    const registration = await getOrRegisterServiceWorker();
    if (!registration) {
      return { success: false, message: "SW registration failed" };
    }

    console.log("✅ SW ready:", registration);

    // ✅ If user already blocked notifications, don't spam
    if (Notification.permission === "denied") {
      console.log("🚫 Notifications blocked by user");
      return { success: false, message: "Notifications blocked" };
    }

    // ✅ Ask permission ONLY if default
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    console.log("🔔 Permission:", permission);

    if (permission !== "granted") {
      return { success: false, message: "Permission not granted" };
    }

    // ✅ Get or create subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });
    }

    console.log("✅ Subscription:", subscription);

    // ✅ Send subscription to backend
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.log("❌ Missing VITE_API_URL");
      return { success: false, message: "Missing API URL" };
    }

    const res = await fetch(`${apiUrl}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription }),
    });

    const text = await res.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      console.log("❌ Backend subscribe failed:", res.status, data);
      return { success: false, message: "Subscribe API failed" };
    }

    console.log("✅ Backend subscribe OK:", data);

    // ✅ Mark as enabled once (stop annoying)
    localStorage.setItem(PUSH_ENABLED_KEY, "true");

    return { success: true, message: "Subscribed" };
  } catch (err) {
    console.log("❌ Push error:", err);
    return { success: false, message: "Push setup failed" };
  }
};

// ✅ UI should show popup only once
export const shouldShowPushSuccessPopup = () => {
  return localStorage.getItem(PUSH_ENABLED_KEY) !== "true";
};

// ✅ Optional helper: force reset popup flag (debug)
export const resetPushPopupFlag = () => {
  localStorage.removeItem(PUSH_ENABLED_KEY);
};
