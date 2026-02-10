// Notification Helper - Push Notifications Support

interface CreateNotificationParams {
  userAlias: string;
  type: "message" | "like" | "comment" | "follow" | "mention" | "dm" | "system";
  title: string;
  content: string;
  from?: string;
  actionUrl?: string;
}

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    if (import.meta.env.DEV) console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

// Show browser notification
const showBrowserNotification = (
  title: string,
  options: NotificationOptions
) => {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      ...options,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      requireInteraction: false,
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }
};

// Create and save notification
export const createNotification = async (
  params: CreateNotificationParams
): Promise<void> => {
  const { userAlias, type, title, content, from, actionUrl } = params;

  // Create notification object
  const notification = {
    id: Math.random().toString(36).substr(2, 9),
    type,
    title,
    content,
    from,
    timestamp: new Date(),
    read: false,
    actionUrl,
  };

  // Save to localStorage
  const stored = localStorage.getItem(`notifications_${userAlias}`);
  const notifications = stored ? JSON.parse(stored) : [];
  notifications.unshift(notification); // Add to beginning

  // Keep only last 100 notifications
  const trimmed = notifications.slice(0, 100);
  localStorage.setItem(`notifications_${userAlias}`, JSON.stringify(trimmed));

  // Update unread count
  const unreadCount = trimmed.filter((n: any) => !n.read).length;
  localStorage.setItem(
    `notification_count_${userAlias}`,
    unreadCount.toString()
  );

  // Show browser notification if app is in background or not focused
  if (document.hidden || !document.hasFocus()) {
    const hasPermission = await requestNotificationPermission();

    if (hasPermission) {
      let notifTitle = title;
      let notifBody = content;
      let notifIcon = "🔔";

      switch (type) {
        case "message":
          notifIcon = "💬";
          break;
        case "like":
          notifIcon = "❤️";
          break;
        case "comment":
          notifIcon = "💭";
          break;
        case "follow":
          notifIcon = "👥";
          break;
        case "mention":
          notifIcon = "@";
          break;
        case "dm":
          notifIcon = "📧";
          break;
        case "system":
          notifIcon = "⚙️";
          break;
      }

      showBrowserNotification(`${notifIcon} ${notifTitle}`, {
        body: notifBody,
        tag: type,
        vibrate: [200, 100, 200],
      });
    }
  }

  // Trigger custom event for real-time updates
  window.dispatchEvent(
    new CustomEvent("newNotification", { detail: notification })
  );
};

// Get unread count
export const getUnreadCount = (userAlias: string): number => {
  const count = localStorage.getItem(`notification_count_${userAlias}`);
  return count ? parseInt(count, 10) : 0;
};

// Mark notification as read
export const markNotificationAsRead = (
  userAlias: string,
  notificationId: string
): void => {
  const stored = localStorage.getItem(`notifications_${userAlias}`);
  if (!stored) return;

  const notifications = JSON.parse(stored);
  const updated = notifications.map((n: any) =>
    n.id === notificationId ? { ...n, read: true } : n
  );

  localStorage.setItem(`notifications_${userAlias}`, JSON.stringify(updated));

  // Update unread count
  const unreadCount = updated.filter((n: any) => !n.read).length;
  localStorage.setItem(
    `notification_count_${userAlias}`,
    unreadCount.toString()
  );
};

// Mark all as read
export const markAllAsRead = (userAlias: string): void => {
  const stored = localStorage.getItem(`notifications_${userAlias}`);
  if (!stored) return;

  const notifications = JSON.parse(stored);
  const updated = notifications.map((n: any) => ({ ...n, read: true }));

  localStorage.setItem(`notifications_${userAlias}`, JSON.stringify(updated));
  localStorage.setItem(`notification_count_${userAlias}`, "0");
};

// Example usage in your app:
/*
import { createNotification } from './notificationHelper';

// When someone likes your post
await createNotification({
  userAlias: 'recipient_alias',
  type: 'like',
  title: 'New Like',
  content: '@username liked your post',
  from: 'username'
});

// When someone sends a DM
await createNotification({
  userAlias: 'recipient_alias',
  type: 'dm',
  title: 'New Message',
  content: '@username sent you a message',
  from: 'username'
});

// When someone follows you
await createNotification({
  userAlias: 'recipient_alias',
  type: 'follow',
  title: 'New Follower',
  content: '@username started following you',
  from: 'username'
});
*/
