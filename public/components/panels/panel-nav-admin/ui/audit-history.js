var MODULE_ID = "panel-nav-admin.ui.audit-history";
var VERSION = "11.3.0-AUDIT-TRAIL";
var _panelEl = null;
var _isOpen = false;
var EVENT_LABELS = {
  "navigation.item.created": "Criou item",
  "navigation.item.updated": "Atualizou item",
  "navigation.item.deleted": "Excluiu item",
  "navigation.section.created": "Criou grupo",
  "navigation.section.updated": "Atualizou grupo",
  "navigation.section.deleted": "Excluiu grupo",
  "navigation.items.reordered": "Reordenou itens"
};
var EVENT_ICONS = {
  "navigation.item.created": '<svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  "navigation.item.updated": '<svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  "navigation.item.deleted": '<svg viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  "navigation.items.reordered": '<svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" width="16" height="16"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>'
};
function _escapeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function _formatDate(dateStr) {
  try {
    var d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch (_e) {
    return dateStr;
  }
}
function _renderDiff(before, after) {
  if (!before && !after) return "";
  var html = '<div class="pna-audit-diff">';
  if (after) {
    var keys = Object.keys(after);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key === "source_table" || key === "source_id") continue;
      var oldVal = before ? String(before[key] ?? "-") : "-";
      var newVal = String(after[key] ?? "-");
      if (oldVal !== newVal) {
        html += '<span class="pna-audit-field">' + _escapeHtml(key) + ": ";
        if (before) html += '<span class="pna-audit-old">' + _escapeHtml(oldVal) + "</span> \u2192 ";
        html += '<span class="pna-audit-new">' + _escapeHtml(newVal) + "</span>";
        html += "</span>";
      }
    }
  }
  html += "</div>";
  return html;
}
function _renderEntry(entry) {
  var eventType = entry.event_type || "";
  var label = EVENT_LABELS[eventType] || eventType;
  var icon = EVENT_ICONS[eventType] || EVENT_ICONS["navigation.item.updated"] || "";
  var actor = _escapeHtml(entry.actor_name || "Sistema");
  var resourceId = entry.resource_id ? _escapeHtml(String(entry.resource_id)) : "";
  var resourceType = _escapeHtml(entry.resource_type || "");
  var date = _formatDate(entry.created_at || "");
  var diff = _renderDiff(entry.before_state, entry.after_state);
  return '<div class="pna-audit-entry"><div class="pna-audit-icon">' + icon + '</div><div class="pna-audit-body"><div class="pna-audit-header"><strong>' + label + "</strong>" + (resourceId ? " <code>" + resourceId + "</code>" : "") + (resourceType ? ' <span class="pna-audit-table">(' + resourceType + ")</span>" : "") + '</div><div class="pna-audit-meta"><span class="pna-audit-actor">' + actor + '</span> \xB7 <span class="pna-audit-time">' + date + "</span></div>" + diff + "</div></div>";
}
function renderAuditPanel(entries) {
  if (!entries || entries.length === 0) {
    return '<div class="pna-audit-empty">Nenhuma altera\xE7\xE3o registrada.</div>';
  }
  var html = "";
  for (var i = 0; i < entries.length; i++) {
    html += _renderEntry(entries[i]);
  }
  return html;
}
function openAuditPanel(container, navAdapter, showToast) {
  if (_isOpen) {
    closeAuditPanel();
    return;
  }
  _panelEl = document.createElement("div");
  _panelEl.className = "pna-audit-overlay";
  _panelEl.innerHTML = '<div class="pna-audit-panel"><div class="pna-audit-panel-header"><h3>Hist\xF3rico de Altera\xE7\xF5es</h3><button class="pna-audit-close" aria-label="Fechar">&times;</button></div><div class="pna-audit-panel-body"><div class="pna-audit-loading"><div class="pna-spinner"></div><p>Carregando hist\xF3rico...</p></div></div></div>';
  container.appendChild(_panelEl);
  _isOpen = true;
  var closeBtn = _panelEl.querySelector(".pna-audit-close");
  if (closeBtn) closeBtn.addEventListener("click", function() {
    closeAuditPanel();
  }, { once: true });
  _panelEl.addEventListener("click", function(e) {
    if (e.target.classList.contains("pna-audit-overlay")) closeAuditPanel();
  });
  navAdapter.fetchAuditHistory(50).then(function(result) {
    if (!_panelEl) return;
    var body = _panelEl.querySelector(".pna-audit-panel-body");
    if (!body) return;
    if ((result.success || result.ok) && result.data) {
      body.innerHTML = renderAuditPanel(result.data);
    } else {
      body.innerHTML = '<div class="pna-audit-empty">Erro ao carregar hist\xF3rico: ' + _escapeHtml(result.error || "desconhecido") + "</div>";
    }
  }).catch(function(err) {
    if (!_panelEl) return;
    var body = _panelEl.querySelector(".pna-audit-panel-body");
    if (body) body.innerHTML = '<div class="pna-audit-empty">Erro: ' + _escapeHtml(err.message) + "</div>";
    showToast("Erro ao carregar hist\xF3rico", "error");
  });
}
function closeAuditPanel() {
  if (_panelEl && _panelEl.parentNode) {
    _panelEl.remove();
  }
  _panelEl = null;
  _isOpen = false;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
export {
  MODULE_ID,
  VERSION,
  closeAuditPanel,
  healthCheck,
  info,
  openAuditPanel,
  renderAuditPanel
};
