const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:renderer:status";
function updateLoading(refs, isLoading) {
  if (!refs?.statusOverlay) return;
  const statusOverlay = refs.statusOverlay;
  const spinner = refs.spinner;
  const statusMessage = refs.statusMessage;
  const retryBtn = refs.retryBtn;
  if (isLoading) {
    statusOverlay.style.display = "flex";
    statusOverlay.classList.add("p05-loading");
    statusOverlay.classList.remove("p05-error");
    if (spinner) spinner.style.display = "block";
    if (statusMessage) statusMessage.textContent = "Carregando...";
    if (retryBtn) retryBtn.style.display = "none";
  } else {
    statusOverlay.classList.remove("p05-loading");
  }
}
function updateError(refs, error) {
  if (!refs?.statusOverlay) return;
  const statusOverlay = refs.statusOverlay;
  const spinner = refs.spinner;
  const statusMessage = refs.statusMessage;
  const retryBtn = refs.retryBtn;
  if (error) {
    statusOverlay.style.display = "flex";
    statusOverlay.classList.remove("p05-loading");
    statusOverlay.classList.add("p05-error");
    if (spinner) spinner.style.display = "none";
    if (statusMessage) {
      const msg = typeof error === "string" ? error : "Erro ao carregar dados";
      statusMessage.textContent = msg;
    }
    if (retryBtn) retryBtn.style.display = "inline-block";
  } else {
    statusOverlay.classList.remove("p05-error");
    if (!statusOverlay.classList.contains("p05-loading")) {
      statusOverlay.style.display = "none";
    }
  }
}
function updateCountdown(refs, seconds) {
  if (!refs?.countdown) return;
  const countdown = refs.countdown;
  if (seconds === null || seconds === void 0) {
    countdown.textContent = "--";
    countdown.className = "p05-countdown p05-paused";
  } else if (seconds <= 5) {
    countdown.textContent = `${seconds}s`;
    countdown.className = "p05-countdown p05-warning";
  } else {
    countdown.textContent = `${seconds}s`;
    countdown.className = "p05-countdown p05-active";
  }
}
function hideStatus(refs) {
  if (!refs?.statusOverlay) return;
  const statusOverlay = refs.statusOverlay;
  statusOverlay.style.display = "none";
  statusOverlay.classList.remove("p05-loading", "p05-error");
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { statusReady: true } };
}
var status_default = { updateLoading, updateError, updateCountdown, hideStatus, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  status_default as default,
  healthCheck,
  hideStatus,
  info,
  updateCountdown,
  updateError,
  updateLoading
};
