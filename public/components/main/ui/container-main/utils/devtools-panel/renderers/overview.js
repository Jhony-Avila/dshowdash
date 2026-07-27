import { formatStatus } from "../helpers.js";
const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:devtools-panel:renderers:overview";
function renderOverview(bootstrap) {
  if (!bootstrap) return "<p>Bootstrap not connected</p>";
  const info = bootstrap.info();
  const state = bootstrap.getState();
  return `
    <div class="cm-devtools-section">
      <div class="cm-devtools-section-title">System Status</div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Bootstrap State</span>
        <span class="cm-devtools-value">${formatStatus(state)}</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Version</span>
        <span class="cm-devtools-value">${info.version || "N/A"}</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Kernel State</span>
        <span class="cm-devtools-value">${info.kernelState || "N/A"}</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Managers Active</span>
        <span class="cm-devtools-value">${info.managersActive || 0}</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Plugins Active</span>
        <span class="cm-devtools-value">${info.pluginsActive || 0}</span>
      </div>
    </div>
    <div class="cm-devtools-section">
      <div class="cm-devtools-section-title">Boot Metrics</div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Total Time</span>
        <span class="cm-devtools-value">${info.bootMetrics?.totalTime ? info.bootMetrics.totalTime.toFixed(2) : "N/A"}ms</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Rating</span>
        <span class="cm-devtools-value">${info.bootMetrics?.rating || "N/A"}</span>
      </div>
    </div>
    <div class="cm-devtools-section">
      <button class="cm-devtools-btn" onclick="window.__cmDevTools.refresh()">Refresh</button>
      <button class="cm-devtools-btn" onclick="window.__cmDevTools.snapshot()">Snapshot</button>
      <button class="cm-devtools-btn danger" onclick="window.__cmDevTools.reboot()">Reboot</button>
    </div>
  `;
}
var overview_default = { VERSION, MODULE_ID, renderOverview };
export {
  MODULE_ID,
  VERSION,
  overview_default as default,
  renderOverview
};
