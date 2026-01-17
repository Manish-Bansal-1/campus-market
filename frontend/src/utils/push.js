import API from "../api/axios";

export const registerPush = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;

    // register SW
    const reg = await navigator.serviceWorker.register("/sw.js");

    // get vapid public key
    const res = await API.get("/push/public-key");
    const publicKey = res.data.publicKey;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await API.post("/push/subscribe", sub);
    console.log("✅ Push subscription saved");
  } catch (err) {
    console.log("❌ Push register error:", err.message);
  }
};

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
