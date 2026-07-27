import { formatStatus } from "../helpers.js";
const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:devtools-panel:renderers:plugins";
function renderPlugins(bootstrap) {
  const pluginSystem = bootstrap?.getPluginSystem();
  if (!pluginSystem) return "<p>Plugin system not available</p>";
  const plugins = pluginSystem.list?.() || [];
  if (plugins.length === 0) return "<p>No plugins registered</p>";
  return `
    <div class="cm-devtools-section">
      <div class="cm-devtools-section-title">Registered Plugins (${plugins.length})</div>
      ${plugins.map((p) => `
        <div class="cm-devtools-row">
          <span class="cm-devtools-label">${p.name}</span>
          <span class="cm-devtools-value">${formatStatus(p.state)}</span>
        </div>
      `).join("")}
    </div>
  `;
}
var plugins_default = { VERSION, MODULE_ID, renderPlugins };
export {
  MODULE_ID,
  VERSION,
  plugins_default as default,
  renderPlugins
};
