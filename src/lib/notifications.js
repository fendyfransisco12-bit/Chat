/**
 * Request browser notification permission
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("Browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  return false;
}

/**
 * Send browser notification
 */
export function sendNotification(title, options = {}) {
  if (!("Notification" in window)) {
    console.log("Notifications not supported");
    return;
  }

  if (Notification.permission === "granted") {
    try {
      const defaultOptions = {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "chat-notification",
        requireInteraction: false,
        ...options,
      };

      const notification = new Notification(title, defaultOptions);

      // Close notification after 5 seconds if not interacted
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }
}

/**
 * Update browser tab title with unread count
 */
export function updateBrowserTitle(unreadCount, originalTitle = "Chat App") {
  if (typeof document === "undefined") return;

  if (unreadCount > 0) {
    document.title = `(${unreadCount}) ${originalTitle}`;
    // Add red badge to favicon
    updateFaviconBadge(unreadCount);
  } else {
    document.title = originalTitle;
    updateFaviconBadge(0);
  }
}

/**
 * Update favicon with badge
 */
function updateFaviconBadge(count) {
  if (typeof document === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Load original favicon
  const img = new Image();
  const favicon = document.querySelector('link[rel="icon"]');
  const faviconUrl = favicon?.href || "/favicon.ico";

  img.onload = function () {
    ctx.drawImage(img, 0, 0, 32, 32);

    // Draw badge only if count > 0
    if (count > 0) {
      // Draw red circle
      ctx.fillStyle = "#FF4444";
      ctx.beginPath();
      ctx.arc(25, 7, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw white border
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(25, 7, 8, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw count text
      ctx.fillStyle = "white";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const countText = count > 9 ? "9+" : count.toString();
      ctx.fillText(countText, 25, 7);
    }

    // Update favicon
    const link =
      document.querySelector('link[rel="icon"]') ||
      document.createElement("link");
    link.rel = "icon";
    link.href = canvas.toDataURL();
    if (!favicon) {
      document.head.appendChild(link);
    }
  };

  img.src = faviconUrl;
}
