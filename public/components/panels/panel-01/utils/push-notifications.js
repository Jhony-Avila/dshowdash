const MODULE_ID = "panel-01.utils.push-notifications";
const VERSION = "9.3.0-P2-ENTERPRISE";
async function requestPermission() {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}
function isSupported() {
  return "Notification" in window;
}
function isPermissionGranted() {
  return Notification.permission === "granted";
}
function showNotification(title, options = {}) {
  if (!isPermissionGranted()) return null;
  return new Notification(title, {
    icon: "/assets/icons/notification-icon.png",
    badge: "/assets/icons/badge-icon.png",
    ...options
  });
}
var push_notifications_default = { requestPermission, isSupported, isPermissionGranted, showNotification };
export {
  MODULE_ID,
  VERSION,
  push_notifications_default as default,
  isPermissionGranted,
  isSupported,
  requestPermission,
  showNotification
};
