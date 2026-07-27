import { _state } from "../state.js";
import { urlBase64ToUint8Array } from "../helpers/base64.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.service-worker-manager.push.manager";
function requestPushPermission() {
  if (!("Notification" in window)) {
    return Promise.resolve({ ok: false, error: "Notifications not supported" });
  }
  return Notification.requestPermission().then((permission) => ({
    ok: permission === "granted",
    permission
  }));
}
function getPushSubscription() {
  if (!_state.registration || !_state.registration.pushManager) {
    return Promise.resolve(null);
  }
  return _state.registration.pushManager.getSubscription();
}
function subscribePush(vapidPublicKey) {
  if (!_state.registration || !_state.registration.pushManager) {
    return Promise.resolve({ ok: false, error: "Push not supported" });
  }
  const options = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  };
  return _state.registration.pushManager.subscribe(options).then((subscription) => ({
    ok: true,
    subscription
  })).catch((error) => ({
    ok: false,
    error: error.message
  }));
}
export {
  MODULE_ID,
  VERSION,
  getPushSubscription,
  requestPushPermission,
  subscribePush
};
