import { ICONS } from "../../../_shared/icons.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-ui-template";
const getVersion = () => VERSION;
const createOrchestratorTemplate = (state = {}) => {
  const preset = state.preset || "default";
  const status = state.status || "INITIALIZING";
  const panelCount = state.panelCount || 0;
  return `<div class="orchestrator-panel" data-component="panel-orchestrator" data-version="${VERSION}"><div class="orchestrator-header"><h3 class="orchestrator-title"><span class="orchestrator-icon">${ICONS.sliders}</span>Core Orchestrator<span class="orchestrator-version">${VERSION}</span></h3><div class="orchestrator-status" data-status="${status}"><span class="status-indicator"></span><span class="status-text">${status}</span></div></div><div class="orchestrator-content"><div class="orchestrator-section"><h4>Preset Ativo</h4><div class="preset-selector" data-current="${preset}"><select id="orchestrator-preset-select" class="preset-dropdown"><option value="default"${preset === "default" ? " selected" : ""}>${ICONS.barChart} Dashboard Padr\xE3o</option><option value="monitoring"${preset === "monitoring" ? " selected" : ""}>${ICONS.monitor} Monitoramento</option><option value="serverHealth"${preset === "serverHealth" ? " selected" : ""}>${ICONS.settings} Sa\xFAde do Servidor</option><option value="pipedriveSales"${preset === "pipedriveSales" ? " selected" : ""}>${ICONS.dollarSign} Vendas Pipedrive</option><option value="financial"${preset === "financial" ? " selected" : ""}>${ICONS.dollarSign} Financeiro</option><option value="compact"${preset === "compact" ? " selected" : ""}>${ICONS.smartphone} Modo Compacto</option><option value="development"${preset === "development" ? " selected" : ""}>${ICONS.tool} Desenvolvimento</option></select><button id="orchestrator-apply-preset" class="btn-apply">Aplicar</button></div></div><div class="orchestrator-section"><h4>Pain\xE9is Ativos</h4><div class="active-panels-info"><span class="panel-count">${panelCount}</span><span class="panel-label">pain\xE9is carregados</span></div><div id="orchestrator-panel-list" class="panel-list"></div></div><div class="orchestrator-section"><h4>Controles</h4><div class="orchestrator-controls"><button id="orchestrator-refresh-all" class="btn-control" title="Atualizar todos"><span class="btn-icon">${ICONS.refresh}</span><span class="btn-text">Refresh All</span></button><button id="orchestrator-reset-layout" class="btn-control" title="Resetar layout"><span class="btn-icon">${ICONS.undo}</span><span class="btn-text">Reset</span></button><button id="orchestrator-pause" class="btn-control" title="Pausar/Retomar"><span class="btn-icon">${ICONS.pause}</span><span class="btn-text">Pause</span></button></div></div><div class="orchestrator-section"><h4>M\xE9tricas</h4><div class="orchestrator-metrics"><div class="metric-item"><span class="metric-label">Uptime</span><span class="metric-value" data-metric="uptime">0s</span></div><div class="metric-item"><span class="metric-label">Erros</span><span class="metric-value" data-metric="errors">0</span></div><div class="metric-item"><span class="metric-label">Scheduler</span><span class="metric-value" data-metric="scheduler">ACTIVE</span></div></div></div></div></div>`;
};
const createPanelListItem = (panel) => {
  const p = panel;
  const panelId = typeof panel === "string" ? panel : p.panelId;
  const title = typeof panel === "string" ? panel : p.title || p.panelId;
  const visible = typeof panel === "string" ? true : p.visible !== false;
  return `<div class="panel-list-item ${visible ? "visible" : "hidden"}" data-panel-id="${panelId}"><span class="panel-indicator ${visible ? "active" : "inactive"}"></span><span class="panel-name">${title}</span><button class="btn-toggle" data-action="toggle-panel" data-panel-id="${panelId}"><span class="btn-icon">${visible ? ICONS.eye : ICONS.eyeOff}</span></button></div>`;
};
const createStatusBadge = (status) => {
  const statusColors = { RUNNING: "success", READY: "success", INITIALIZING: "warning", PAUSED: "info", ERROR: "danger", DEGRADED: "warning" };
  const color = statusColors[status] || "secondary";
  return `<span class="status-badge status-${color}">${status}</span>`;
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { templateReady: true } });
var template_default = { VERSION, MODULE_ID, getVersion, createOrchestratorTemplate, createPanelListItem, createStatusBadge };
export {
  MODULE_ID,
  VERSION,
  createOrchestratorTemplate,
  createPanelListItem,
  createStatusBadge,
  template_default as default,
  getVersion,
  healthCheck,
  info
};
