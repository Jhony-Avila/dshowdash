const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-management/ui/modal-events";
let _abortController = null;
let _listenerCount = 0;
function bindModalEvents(container, user, onAvatarToggle) {
  unbindModalEvents();
  _abortController = new AbortController();
  const signal = _abortController.signal;
  _listenerCount = 0;
  const modalRoot = container.querySelector("[data-modal-root]");
  if (!modalRoot) return;
  modalRoot.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset?.action;
    if (action === "toggle-avatars") {
      e.preventDefault();
      e.stopPropagation();
      if (typeof onAvatarToggle === "function") {
        onAvatarToggle();
      }
    }
  }, { signal });
  _listenerCount++;
  _bindAvatarGrid(container, user, signal);
  _bindFormEvents(container, signal);
}
function _bindAvatarGrid(container, user, signal) {
  const avatarGrid = container.querySelector(".avatar-grid");
  if (!avatarGrid) return;
  avatarGrid.addEventListener("click", (e) => {
    const option = e.target.closest("[data-avatar-url]");
    if (!option) return;
    e.preventDefault();
    e.stopPropagation();
    avatarGrid.querySelectorAll(".avatar-option").forEach((el) => el.classList.remove("selected"));
    option.classList.add("selected");
    const url = option.dataset.avatarUrl;
    const preview = container.querySelector("[data-avatar-preview]");
    if (preview) {
      preview.innerHTML = `<img src="${url}" alt="" class="avatar-img"><div class="avatar-overlay"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><span class="avatar-cta">Alterar</span></div>`;
    }
    const input = container.querySelector("[data-avatar-input]");
    if (input) {
      input.value = url || "";
    }
    user.avatar_url = url;
    user.avatar = url;
  }, { signal });
  _listenerCount++;
}
function _bindFormEvents(container, signal) {
  const form = container.querySelector('[data-form="edit-user"]');
  if (!form) return;
  form.addEventListener("input", (e) => {
    const input = e.target;
    if (!input.dataset.original) return;
    const isDirty = input.value !== input.dataset.original;
    input.closest(".form-group")?.classList.toggle("is-dirty", isDirty);
  }, { signal });
  _listenerCount++;
  form.addEventListener("change", (e) => {
    const select = e.target;
    if (select.name === "status") {
      select.className = `status-select status-${select.value}`;
    }
    if (!select.dataset.original) return;
    const isDirty = select.value !== select.dataset.original;
    select.closest(".form-group")?.classList.toggle("is-dirty", isDirty);
  }, { signal });
  _listenerCount++;
}
function unbindModalEvents() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _listenerCount = 0;
  }
}
function showDetails(detailsElement) {
  if (detailsElement) {
    detailsElement.style.display = "block";
  }
}
function hideDetails(detailsElement) {
  if (detailsElement) {
    detailsElement.style.display = "none";
    detailsElement.innerHTML = "";
  }
}
var modal_events_default = { bindModalEvents, unbindModalEvents, showDetails, hideDetails };
export {
  MODULE_ID,
  VERSION,
  bindModalEvents,
  modal_events_default as default,
  hideDetails,
  showDetails,
  unbindModalEvents
};
