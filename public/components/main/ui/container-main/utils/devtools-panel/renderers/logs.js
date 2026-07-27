const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:devtools-panel:renderers:logs";
function renderLogs(logs = []) {
  if (logs.length === 0) return "<p>No logs captured</p>";
  return `
    <div class="cm-devtools-section">
      <button class="cm-devtools-btn" onclick="window.__cmDevTools.clearLogs()">Clear Logs</button>
    </div>
    <div class="cm-devtools-section">
      ${logs.slice(-50).reverse().map((log) => `
        <div class="cm-devtools-log ${log.level}">
          <strong>[${log.timestamp}]</strong> ${log.message}
        </div>
      `).join("")}
    </div>
  `;
}
var logs_default = { VERSION, MODULE_ID, renderLogs };
export {
  MODULE_ID,
  VERSION,
  logs_default as default,
  renderLogs
};
