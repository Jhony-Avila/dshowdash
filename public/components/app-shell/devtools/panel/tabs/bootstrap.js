const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.panel.tabs.bootstrap";
import { icon, sanitizeAttr, statusClass, networkQualityClass, getBootstrap } from "../helpers.js";
function renderBootstrapTab() {
  const bs = getBootstrap();
  if (!bs) {
    return '<div class="dsd-ui-empty">BootstrapV2 not available. Ensure window.BootstrapV2 is accessible.</div>';
  }
  try {
    const health = bs.healthCheck ? bs.healthCheck() : { status: "UNKNOWN", version: "N/A" };
    const networkInfo = bs.getNetworkInfo ? bs.getNetworkInfo() : { quality: "unknown", effectiveType: "N/A", rtt: 0, downlink: 0 };
    const deferredStatus = bs.getLazyStats ? bs.getLazyStats() : { total: 0, loaded: 0 };
    const cancellationState = bs.isBootCancelled ? { cancelled: bs.isBootCancelled() } : { cancelled: false };
    let errorAnalysisHtml = "";
    if (bs.analyzeErrorPatterns) {
      const errSummary = bs.analyzeErrorPatterns();
      if (errSummary && errSummary.patterns) {
        errorAnalysisHtml = `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("alertTriangle")} Error Analysis</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Patterns Found</div><div class="dsd-ui-card__value">${errSummary.patterns.length || 0}</div></div></div></div>`;
      }
    }
    return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("zap")} Bootstrap-v2 Status</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Version</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${sanitizeAttr(bs.VERSION || "N/A")}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Health</div><div class="dsd-ui-card__value ${statusClass(health.status)}">${sanitizeAttr(health.status)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Cancelled</div><div class="dsd-ui-card__value ${cancellationState.cancelled ? "dsd-ui-status--unhealthy" : "dsd-ui-status--healthy"}">${cancellationState.cancelled ? "YES" : "NO"}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Enterprise</div><div class="dsd-ui-card__value ${bs.ENTERPRISE ? "dsd-ui-status--healthy" : ""}">${bs.ENTERPRISE ? "YES" : "NO"}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("globe")} Network Info</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Quality</div><div class="dsd-ui-card__value ${networkQualityClass(networkInfo.quality)}">${sanitizeAttr((networkInfo.quality || "N/A").toUpperCase())}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Type</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${sanitizeAttr(networkInfo.effectiveType || "N/A")}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">RTT</div><div class="dsd-ui-card__value">${networkInfo.rtt || 0}ms</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Online</div><div class="dsd-ui-card__value ${bs.isOnline && bs.isOnline() ? "dsd-ui-status--healthy" : "dsd-ui-status--unhealthy"}">${bs.isOnline && bs.isOnline() ? "YES" : "NO"}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("clock")} Lazy Loading</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Registered</div><div class="dsd-ui-card__value">${deferredStatus.registered || 0}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Loaded</div><div class="dsd-ui-card__value dsd-ui-status--healthy">${deferredStatus.loaded || 0}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("cpu")} OpenTelemetry</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Available</div><div class="dsd-ui-card__value ${bs.OpenTelemetry ? "dsd-ui-status--healthy" : ""}">${bs.OpenTelemetry ? "YES" : "NO"}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Observability</div><div class="dsd-ui-card__value">${bs.OBSERVABILITY ? "YES" : "NO"}</div></div></div><div class="dsd-ui-toolbar" style="margin-top:8px"><button class="dsd-ui-btn" id="btn-export-otel">${icon("fileText", 14)} Export Spans</button></div></div>${errorAnalysisHtml}<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon("tool")} Actions</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn" id="btn-validate-manifest">${icon("checkCircle", 14)} Validate Manifest</button><button class="dsd-ui-btn" id="btn-cancel-boot" ${cancellationState.cancelled ? "disabled" : ""}>${icon("xCircle", 14)} Cancel Boot</button></div></div>`;
  } catch (e) {
    return `<div class="dsd-ui-empty">Error rendering bootstrap: ${sanitizeAttr(e.message)}</div>`;
  }
}
export {
  MODULE_ID,
  VERSION,
  renderBootstrapTab
};
