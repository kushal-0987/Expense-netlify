/**
 * Browser-level Web Notification helper.
 * Triggers OS desktop / mobile push notifications if permission is granted.
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.warn("Failed to request notification permission:", err);
    return "denied";
  }
}

export function showBrowserNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
  } catch (err) {
    console.warn("Failed to show browser notification:", err);
  }
}
