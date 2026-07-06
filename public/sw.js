/* Ride Access Admin — push service worker.
 * Shows a notification when the server pushes an alert, and focuses (or
 * opens) the admin dashboard when the notification is tapped. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: "Ride Access NYC", body: event.data && event.data.text() };
  }

  const title = data.title || "Ride Access NYC";
  const options = {
    body: data.body || "",
    icon: "/api/admin/pwa-icon/192",
    badge: "/api/admin/pwa-icon/192",
    data: { url: data.url || "/admin" },
    tag: data.tag || undefined,
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/admin";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/admin") && "focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(target);
        }
      }),
  );
});
