const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.update-notifier.checker";
async function checkViaEndpoint(versionEndpoint, logger) {
  try {
    const response = await fetch(versionEndpoint, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return {
      version: data.version,
      releaseDate: data.releaseDate,
      changelog: data.changelog,
      features: data.features,
      critical: data.critical || false
    };
  } catch (error) {
    logger.debug("Version endpoint check failed:", error.message);
    return null;
  }
}
async function checkViaServiceWorker(logger) {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    await registration.update();
    if (registration.waiting) {
      return {
        version: "new",
        type: "service-worker",
        worker: registration.waiting,
        registration
      };
    }
    return { registration };
  } catch (error) {
    logger.debug("Service Worker check failed:", error.message);
    return null;
  }
}
function applyUpdate(swRegistration, logger) {
  logger.info("Applying update...");
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
  }
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    }).finally(() => {
      window.location.reload(true);
    });
  } else {
    window.location.reload(true);
  }
}
export {
  MODULE_ID,
  VERSION,
  applyUpdate,
  checkViaEndpoint,
  checkViaServiceWorker
};
