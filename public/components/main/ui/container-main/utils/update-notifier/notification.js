import { injectStyles } from "./styles.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.update-notifier.notification";
function createNotificationElement(config, onApply, onDismiss) {
  const notification = document.createElement("div");
  notification.className = "dsd-update-notification";
  notification.setAttribute("role", "alert");
  notification.setAttribute("aria-live", "polite");
  const positionClass = `dsd-update-notification--${config.position}`;
  notification.classList.add(positionClass);
  notification.innerHTML = `
    <div class="dsd-update-notification__content">
      <div class="dsd-update-notification__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
      <div class="dsd-update-notification__text">
        <strong>Atualiza\xE7\xE3o dispon\xEDvel</strong>
        <span class="dsd-update-notification__version"></span>
      </div>
      <div class="dsd-update-notification__actions">
        <button class="dsd-update-notification__btn dsd-update-notification__btn--primary" data-action="reload">
          Atualizar
        </button>
        ${config.dismissable ? `
          <button class="dsd-update-notification__btn dsd-update-notification__btn--secondary" data-action="dismiss">
            Depois
          </button>
        ` : ""}
      </div>
    </div>
  `;
  notification.querySelector('[data-action="reload"]')?.addEventListener("click", onApply);
  notification.querySelector('[data-action="dismiss"]')?.addEventListener("click", onDismiss);
  return notification;
}
function createNotificationController(config, notifyListeners) {
  let _element = null;
  let _latestVersion = null;
  return {
    show(version) {
      if (!config.showNotification) return;
      _latestVersion = version;
      injectStyles();
      if (!_element) {
        _element = createNotificationElement(
          config,
          // @ts-expect-error strict migration — TS2349
          () => this.onApplyRequested?.(),
          () => this.hide()
        );
        document.body.appendChild(_element);
      }
      const versionSpan = _element.querySelector(".dsd-update-notification__version");
      if (versionSpan && _latestVersion) {
        versionSpan.textContent = `Vers\xE3o ${_latestVersion} dispon\xEDvel`;
      }
      requestAnimationFrame(() => {
        _element.classList.add("dsd-update-notification--visible");
      });
      notifyListeners("notificationShown", { version: _latestVersion });
    },
    hide() {
      if (_element) {
        _element.classList.remove("dsd-update-notification--visible");
        setTimeout(() => {
          _element?.remove();
          _element = null;
        }, 300);
      }
      notifyListeners("notificationDismissed", {});
    },
    onApplyRequested: null
  };
}
export {
  MODULE_ID,
  VERSION,
  createNotificationController,
  createNotificationElement
};
