// @ts-nocheck
// Service Worker for Push Notifications
// This file must be in the public directory to be accessible at /sw.js

self.addEventListener("push", (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error("Error parsing push data:", e);
      data = {
        title: "Nueva notificación",
        body: event.data.text() || "Tienes una nueva notificación",
      };
    }
  }

  const options = {
    body: data.body || "Tienes una nueva notificación",
    icon: data.icon || "/apple-icon.png",
    badge: data.badge || "/apple-icon.png",
    data: data.data || {},
    tag: data.tag || data.data?.notificationId?.toString() || undefined,
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
    actions: data.actions || [
      { action: "open", title: "Abrir" },
      { action: "dismiss", title: "Descartar" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Vesta CRM", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === "dismiss") {
    // User dismissed the notification
    // Optionally mark as dismissed in the database
    if (data.notificationId) {
      fetch("/api/notifications/dismiss", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: data.notificationId,
        }),
      }).catch((err) => {
        console.error("Error dismissing notification:", err);
      });
    }
    return;
  }

  // Default action: open the app to the notification's URL
  const urlToOpen = data.url || data.actionUrl || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window open to this URL
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .then((client) => {
        // Mark notification as read if we have a notificationId
        if (data.notificationId && client) {
          fetch("/api/notifications/mark-read", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              notificationId: data.notificationId,
            }),
          }).catch((err) => {
            console.error("Error marking notification as read:", err);
          });
        }
      })
  );
});

self.addEventListener("notificationclose", (event) => {
  // Optional: Track when user closes notification without clicking
  const data = event.notification.data;
  console.log("Notification closed:", data);
  // You could send analytics here if needed
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    clients.claim().then(() => {
      console.log("Service Worker activated");
    })
  );
});
