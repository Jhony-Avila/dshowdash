import { CATEGORIES } from "../state/state.js";
import { IconRegistry } from "/components/icon-registry/index.js";
const MODULE_ID = "panels-panel-06-ui-render";
const VERSION = "9.3.0-P2-ENTERPRISE";
const icon = (name, size = 18) => {
  const svg = IconRegistry.get(`extended:${name}`) || IconRegistry.get(`system:${name}`) || IconRegistry.get(`charts:${name}`) || IconRegistry.get(`ui:${name}`) || IconRegistry.get(`business:${name}`) || "";
  if (!svg) return "";
  return svg.replace('width="24"', `width="${size}"`).replace('height="24"', `height="${size}"`);
};
function renderCategoryTabs(activeCategory) {
  return `<div class="settings-tabs">
    ${CATEGORIES.map((c) => `
      <button class="tab ${activeCategory === c.key ? "active" : ""}" data-category="${c.key}">
        <span class="tab-icon">${icon(c.icon, 16)}</span>
        <span class="tab-label">${c.label}</span>
      </button>
    `).join("")}
  </div>`;
}
function renderSearchBar(searchTerm) {
  return `<div class="settings-search">
    <input type="text" placeholder="Buscar configura\xE7\xF5es..." value="${searchTerm || ""}" data-input="search">
    <button data-action="clear-search" class="btn-icon" title="Limpar">${icon("x", 16)}</button>
  </div>`;
}
function renderSettingInput(setting) {
  const key = setting.setting_key;
  const value = setting.setting_value;
  const type = setting.setting_type;
  const isSystem = setting.is_system;
  let inputHtml = "";
  switch (type) {
    case "boolean":
      inputHtml = `<label class="toggle">
        <input type="checkbox" data-setting="${key}" data-type="boolean" ${value ? "checked" : ""} ${isSystem ? "disabled" : ""}>
        <span class="toggle-slider"></span>
      </label>`;
      break;
    case "number":
      inputHtml = `<input type="number" data-setting="${key}" data-type="number" value="${value}" ${isSystem ? "disabled" : ""}>`;
      break;
    case "json":
      inputHtml = `<textarea data-setting="${key}" data-type="json" rows="3" ${isSystem ? "disabled" : ""}>${typeof value === "object" ? JSON.stringify(value, null, 2) : value}</textarea>`;
      break;
    default:
      if (key.includes("theme")) {
        inputHtml = `<select data-setting="${key}" data-type="string" ${isSystem ? "disabled" : ""}>
          <option value="dark" ${value === "dark" ? "selected" : ""}>Escuro</option>
          <option value="light" ${value === "light" ? "selected" : ""}>Claro</option>
          <option value="auto" ${value === "auto" ? "selected" : ""}>Autom\xE1tico</option>
        </select>`;
      } else if (key.includes("density")) {
        inputHtml = `<select data-setting="${key}" data-type="string" ${isSystem ? "disabled" : ""}>
          <option value="comfortable" ${value === "comfortable" ? "selected" : ""}>Confort\xE1vel</option>
          <option value="compact" ${value === "compact" ? "selected" : ""}>Compacto</option>
          <option value="spacious" ${value === "spacious" ? "selected" : ""}>Espa\xE7oso</option>
        </select>`;
      } else if (key.includes("level")) {
        inputHtml = `<select data-setting="${key}" data-type="string" ${isSystem ? "disabled" : ""}>
          <option value="debug" ${value === "debug" ? "selected" : ""}>Debug</option>
          <option value="info" ${value === "info" ? "selected" : ""}>Info</option>
          <option value="warn" ${value === "warn" ? "selected" : ""}>Warning</option>
          <option value="error" ${value === "error" ? "selected" : ""}>Error</option>
        </select>`;
      } else if (key.includes("position")) {
        inputHtml = `<select data-setting="${key}" data-type="string" ${isSystem ? "disabled" : ""}>
          <option value="top-right" ${value === "top-right" ? "selected" : ""}>Superior Direita</option>
          <option value="top-left" ${value === "top-left" ? "selected" : ""}>Superior Esquerda</option>
          <option value="bottom-right" ${value === "bottom-right" ? "selected" : ""}>Inferior Direita</option>
          <option value="bottom-left" ${value === "bottom-left" ? "selected" : ""}>Inferior Esquerda</option>
        </select>`;
      } else {
        inputHtml = `<input type="text" data-setting="${key}" data-type="string" value="${value || ""}" ${isSystem ? "disabled" : ""}>`;
      }
  }
  return inputHtml;
}
function renderSettingCard(setting, hasChanges = false) {
  const key = setting.setting_key;
  const isSystem = setting.is_system;
  return `<div class="setting-card ${hasChanges ? "has-changes" : ""} ${isSystem ? "is-system" : ""}" data-key="${key}">
    <div class="setting-header">
      <div class="setting-info">
        <span class="setting-key">${key}</span>
        ${isSystem ? '<span class="badge badge-system">Sistema</span>' : ""}
        ${hasChanges ? '<span class="badge badge-warning">Alterado</span>' : ""}
      </div>
      <span class="setting-type badge">${setting.setting_type}</span>
    </div>
    ${setting.description ? `<p class="setting-description">${setting.description}</p>` : ""}
    <div class="setting-input">
      ${renderSettingInput(setting)}
    </div>
    <div class="setting-meta">
      <span>Atualizado: ${new Date(setting.updated_at).toLocaleString("pt-BR")}</span>
    </div>
  </div>`;
}
function renderSettingsGrid(settings, changes = {}, searchTerm = "") {
  let filtered = settings;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = settings.filter(
      (s) => s.setting_key.toLowerCase().includes(term) || s.description && s.description.toLowerCase().includes(term)
    );
  }
  if (filtered.length === 0) {
    return `<div class="settings-empty">
      <p>Nenhuma configura\xE7\xE3o encontrada${searchTerm ? ` para "${searchTerm}"` : ""}.</p>
    </div>`;
  }
  return `<div class="settings-grid">
    ${filtered.map((s) => renderSettingCard(s, !!changes[s.setting_key])).join("")}
  </div>`;
}
function renderActions(hasChanges, changesCount) {
  return `<div class="settings-actions">
    <div class="actions-info">
      ${hasChanges ? `<span class="changes-count">${changesCount} altera\xE7\xE3o(\xF5es) pendente(s)</span>` : ""}
    </div>
    <div class="actions-buttons">
      <button data-action="discard" class="btn btn-secondary" ${!hasChanges ? "disabled" : ""}>${icon("rotate-ccw", 16)} Descartar</button>
      <button data-action="save-all" class="btn btn-primary" ${!hasChanges ? "disabled" : ""}>${icon("save", 16)} Salvar Altera\xE7\xF5es</button>
    </div>
  </div>`;
}
function render(container, state, handlers) {
  if (!container) return;
  const categorySettings = state.settings.filter((s) => s.category === state.activeCategory);
  const changesCount = Object.keys(state.changes).length;
  const hasChanges = changesCount > 0;
  container.innerHTML = `<div class="panel-settings">
    <div class="panel-header">
      <h2>${icon("settings", 22)} Configura\xE7\xF5es do Sistema</h2>
      <span class="panel-version">v4.0.0</span>
    </div>
    
    ${renderSearchBar(state.searchTerm)}
    ${renderCategoryTabs(state.activeCategory)}
    
    ${state.loading ? '<div class="loading"><div class="spinner"></div> Carregando...</div>' : ""}
    ${state.error ? `<div class="error-message">${state.error}</div>` : ""}
    ${state.saving ? '<div class="saving-overlay"><div class="spinner"></div> Salvando...</div>' : ""}
    
    <div class="panel-content">
      <div class="category-header">
        <h3>${CATEGORIES.find((c) => c.key === state.activeCategory)?.label || "Configura\xE7\xF5es"}</h3>
        <span class="category-count">${categorySettings.length} configura\xE7\xF5es</span>
      </div>
      ${renderSettingsGrid(categorySettings, state.changes, state.searchTerm)}
    </div>
    
    ${renderActions(hasChanges, changesCount)}
  </div>`;
  handlers.setupEventHandlers(container);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { renderReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  healthCheck,
  info,
  render,
  renderActions,
  renderCategoryTabs,
  renderSearchBar,
  renderSettingCard,
  renderSettingInput,
  renderSettingsGrid
};
