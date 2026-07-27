const MODULE_ID = "panel-nav-admin.renderer.status";
const VERSION = "9.4.0-P18EC-ENTERPRISE";
function renderStatus(container, status) {
  const statusConfig = {
    active: { icon: "fa-check-circle", class: "status-active", label: "Ativo" },
    inactive: { icon: "fa-times-circle", class: "status-inactive", label: "Inativo" },
    pending: { icon: "fa-clock", class: "status-pending", label: "Pendente" },
    error: { icon: "fa-exclamation-circle", class: "status-error", label: "Erro" }
  };
  const config = statusConfig[status] || statusConfig.inactive;
  const html = '<span class="nav-item-status ' + config.class + '"><i class="fas ' + config.icon + '"></i><span class="status-label">' + config.label + "</span></span>";
  if (typeof container === "string") {
    const el = document.querySelector(container);
    if (el) el.innerHTML = html;
  } else if (container instanceof HTMLElement) {
    container.innerHTML = html;
  }
  return html;
}
function updateLoading(refs, isLoading) {
  if (!refs) return;
  const el = refs.loadingOverlay || refs.loading;
  if (el) el.style.display = isLoading ? "" : "none";
}
function updateError(refs, error) {
  if (!refs) return;
  const el = refs.errorMessage || refs.error;
  if (el) {
    el.style.display = error ? "" : "none";
    el.textContent = (error instanceof Error ? error.message : null) || (typeof error === "string" ? error : "");
  }
}
function hideStatus(refs) {
  if (!refs) return;
  const el = refs.loadingOverlay || refs.loading;
  if (el) el.style.display = "none";
  const err = refs.errorMessage || refs.error;
  if (err) err.style.display = "none";
}
function updateCountdown(refs, seconds) {
  if (!refs) return;
  const el = refs.countdownEl || refs.countdown || refs.refreshCountdown;
  if (!el) return;
  if (seconds <= 0) {
    el.textContent = "Atualizando...";
    return;
  }
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  el.textContent = min > 0 ? min + "m " + sec + "s" : sec + "s";
}
var status_default = { renderStatus, updateLoading, updateError, hideStatus, updateCountdown };
export {
  MODULE_ID,
  VERSION,
  status_default as default,
  hideStatus,
  renderStatus,
  updateCountdown,
  updateError,
  updateLoading
};
