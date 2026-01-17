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

export const enablePushNotifications = async (token) => {
  try {
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

    // ✅ Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("✅ SW registered:", registration);

    // ✅ Ask permission
    const permission = await Notification.requestPermission();
    console.log("🔔 Permission result:", permission);

    if (permission !== "granted") {
      return { success: false, message: "Permission denied" };
    }

    // ✅ Create / get subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });
    }

    console.log("✅ Subscription ready:", subscription);

    // ✅ Send subscription to backend
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/push/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription }),
      }
    );

    const data = await res.json();
    console.log("✅ Backend response:", data);

    // ✅ Mark as enabled once
    localStorage.setItem(PUSH_ENABLED_KEY, "true");

    return { success: true, message: "Subscribed" };
  } catch (err) {
    console.log("❌ Push error:", err);
    return { success: false, message: "Push setup failed" };
  }
};

// ✅ This function tells UI whether to show success popup or not
export const shouldShowPushSuccessPopup = () => {
  return localStorage.getItem(PUSH_ENABLED_KEY) !== "true";
};
