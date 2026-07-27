import { formatStatus } from "../helpers.js";
const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:devtools-panel:renderers:performance";
function renderPerformance(bootstrap) {
  const perfMonitor = bootstrap?.getPerformanceMonitor();
  if (!perfMonitor) return "<p>Performance monitor not available</p>";
  const snapshot = perfMonitor.collect?.() || {};
  const health = perfMonitor.healthCheck?.() || {};
  return `
    <div class="cm-devtools-section">
      <div class="cm-devtools-section-title">Memory</div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Used</span>
        <span class="cm-devtools-value">${snapshot.memory?.usedMB?.toFixed(2) || "N/A"} MB</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Leak Detected</span>
        <span class="cm-devtools-value">${snapshot.memory?.leak ? "Yes \u26A0\uFE0F" : "No \u2713"}</span>
      </div>
    </div>
    <div class="cm-devtools-section">
      <div class="cm-devtools-section-title">FPS</div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Current</span>
        <span class="cm-devtools-value">${snapshot.fps?.current || "N/A"}</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Status</span>
        ${formatStatus(health.status)}
      </div>
    </div>
  `;
}
var performance_default = { VERSION, MODULE_ID, renderPerformance };
export {
  MODULE_ID,
  VERSION,
  performance_default as default,
  renderPerformance
};
