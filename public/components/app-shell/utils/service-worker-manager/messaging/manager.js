import { incrementMetric } from "../state.js";
import { isSupported } from "../registration/manager.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.service-worker-manager.messaging.manager";
function postMessage(message) {
  if (!navigator.serviceWorker.controller) {
    return Promise.resolve({ ok: false, error: "No controller" });
  }
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      incrementMetric("messagesReceived");
      resolve({ ok: true, response: event.data });
    };
    navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
    incrementMetric("messagesSent");
  });
}
function onMessage(handler) {
  if (!isSupported()) return () => {
  };
  const listener = (event) => {
    incrementMetric("messagesReceived");
    handler(event.data, event);
  };
  navigator.serviceWorker.addEventListener("message", listener);
  return () => {
    navigator.serviceWorker.removeEventListener("message", listener);
  };
}
export {
  MODULE_ID,
  VERSION,
  onMessage,
  postMessage
};
