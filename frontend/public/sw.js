// frontend/public/sw.js

self.addEventListener("push", function (event) {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }

  const title = data.title || "Campus Market";
  const body = data.body || "You have a new notification";

  // ✅ URL to open when clicked
  const openUrl = data.url || "/";

  const options = {
    body,
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
    data: { url: openUrl },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // ✅ If app already open -> focus + navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      // ✅ Otherwise open new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
