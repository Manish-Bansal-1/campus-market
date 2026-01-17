import API from "../api/axios";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const enablePushNotifications = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⛔ Please login first to enable notifications");
      return false;
    }

    if (!("serviceWorker" in navigator)) {
      alert("❌ Service Worker not supported");
      return false;
    }

    if (!("PushManager" in window)) {
      alert("❌ Push not supported in this browser");
      return false;
    }

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      alert("❌ Missing VITE_VAPID_PUBLIC_KEY");
      return false;
    }

    console.log("🔔 Notification.permission:", Notification.permission);

    if (Notification.permission === "denied") {
      alert(
        "❌ Notifications are BLOCKED.\n\nFix:\n🔒 Site settings → Notifications → Allow"
      );
      return false;
    }

    // ✅ register SW
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("✅ SW registered:", registration);

    // ✅ permission request
    const permission = await Notification.requestPermission();
    console.log("🔔 Permission result:", permission);

    if (permission !== "granted") {
      alert("❌ Permission not granted");
      return false;
    }

    // ✅ existing subscription
    const existingSub = await registration.pushManager.getSubscription();

    const subscription =
      existingSub ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      }));

    console.log("✅ Subscription ready:", subscription);

    console.log("📡 Sending subscription to backend...");

    const res = await API.post("/push/subscribe", subscription);

    console.log("✅ Backend response:", res.data);

    alert("✅ Notifications enabled successfully!");
    return true;
  } catch (err) {
    console.log("❌ PUSH ERROR FULL:", err);
    console.log("❌ PUSH ERROR MSG:", err.message);
    alert("❌ Push enable failed: " + (err.response?.status || err.message));
    return false;
  }
};
