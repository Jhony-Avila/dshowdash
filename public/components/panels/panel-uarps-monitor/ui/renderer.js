import { formatDate, timeAgo } from "../utils/formatters.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-uarps-monitor:ui/renderer";
function renderSkeleton() {
  return `
    <div class="pum-container">
      <div class="pum-header">
        <div class="pum-skeleton pum-skeleton-title"></div>
        <div class="pum-skeleton pum-skeleton-btn"></div>
      </div>
      <div class="pum-cards">
        <div class="pum-card pum-skeleton-card"></div>
        <div class="pum-card pum-skeleton-card"></div>
        <div class="pum-card pum-skeleton-card"></div>
        <div class="pum-card pum-skeleton-card"></div>
      </div>
      <div class="pum-table-container">
        <div class="pum-skeleton pum-skeleton-table"></div>
      </div>
    </div>
  `;
}
function renderError(message) {
  return `
    <div class="pum-container">
      <div class="pum-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
        </svg>
        <h3>Erro ao carregar UARPS Monitor</h3>
        <p>${message}</p>
        <button class="pum-btn pum-btn-primary" data-action="refresh">Tentar novamente</button>
      </div>
    </div>
  `;
}
function renderDivergencesTable(state) {
  if (state.divergences.length === 0) {
    return `
      <div class="pum-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p>Nenhuma diverg\xEAncia encontrada</p>
        <span>O sistema UARPS est\xE1 consistente com o ACL legacy</span>
      </div>
    `;
  }
  const rows = state.divergences.slice(0, 50).map((d) => {
    const legacyClass = d.legacy_result === "allow" ? "pum-result-allow" : "pum-result-deny";
    const uarpsClass = d.uarps_result === "allow" ? "pum-result-allow" : "pum-result-deny";
    const endpoint = d.endpoint || "-";
    return `
      <tr>
        <td class="pum-td-user">${d.username || `User #${d.user_id}`}</td>
        <td class="pum-td-endpoint" title="${endpoint}">${endpoint.substring(0, 40)}</td>
        <td class="pum-td-entity">${d.trigger_id || d.region_id || "-"}</td>
        <td class="pum-td-result"><span class="pum-result ${legacyClass}">${d.legacy_result}</span></td>
        <td class="pum-td-result"><span class="pum-result ${uarpsClass}">${d.uarps_result}</span></td>
        <td class="pum-td-level">${d.user_level || 0} / ${d.required_level || "-"}</td>
        <td class="pum-td-date" title="${formatDate(d.created_at)}">${timeAgo(d.created_at)}</td>
      </tr>
    `;
  }).join("");
  return `
    <div class="pum-table-wrapper">
      <table class="pum-table">
        <thead>
          <tr>
            <th>Usu\xE1rio</th>
            <th>Endpoint</th>
            <th>Trigger/Region</th>
            <th>Legacy</th>
            <th>UARPS</th>
            <th>Level</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
function renderDashboard(state) {
  const s = state.status || {};
  const inv = state.inventory || {};
  const stats = state.stats || {};
  const uarpsConfig = s.uarps_config || {};
  const uarpsGate = s.uarps_gate || {};
  const uarpsShadow = s.uarps_shadow || {};
  const mode = uarpsConfig.mode || "unknown";
  const modeClass = mode === "shadow" ? "pum-badge-warning" : mode === "enforced" ? "pum-badge-success" : "pum-badge-secondary";
  const modeLabel = mode === "shadow" ? "Shadow Mode" : mode === "enforced" ? "Enforced" : mode === "legacy" ? "Legacy" : mode;
  const gateStatus = uarpsGate.status || "UNKNOWN";
  const gateClass = gateStatus === "HEALTHY" ? "pum-status-healthy" : gateStatus === "DEGRADED" ? "pum-status-degraded" : "pum-status-unhealthy";
  const shadowStatus = uarpsShadow.status || "INACTIVE";
  const shadowClass = shadowStatus === "ACTIVE" ? "pum-status-healthy" : "pum-status-inactive";
  const totals = inv.totals || {};
  const divergenceCount = parseInt(String(stats.total || 0));
  const divergenceClass = divergenceCount === 0 ? "pum-card-success" : divergenceCount < 10 ? "pum-card-warning" : "pum-card-danger";
  return `
    <div class="pum-container">
      <div class="pum-header">
        <div class="pum-header-left">
          <h2 class="pum-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            UARPS Monitor
          </h2>
          <span class="pum-badge ${modeClass}">${modeLabel}</span>
          <span class="pum-phase">${s.phase || "P1"}</span>
        </div>
        <div class="pum-header-right">
          <span class="pum-last-update">${state.lastRefresh ? timeAgo(state.lastRefresh) : "-"}</span>
          <button class="pum-btn pum-btn-icon ${state.loading ? "pum-loading" : ""}" data-action="refresh" title="Atualizar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="pum-cards">
        <div class="pum-card">
          <div class="pum-card-icon pum-card-icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div class="pum-card-content">
            <div class="pum-card-value">${totals.triggers || 0}</div>
            <div class="pum-card-label">Triggers</div>
          </div>
        </div>

        <div class="pum-card">
          <div class="pum-card-icon pum-card-icon-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <div class="pum-card-content">
            <div class="pum-card-value">${totals.regions || 0}</div>
            <div class="pum-card-label">Regions</div>
          </div>
        </div>

        <div class="pum-card">
          <div class="pum-card-icon pum-card-icon-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="pum-card-content">
            <div class="pum-card-value">${totals.user_trigger_perms || 0}</div>
            <div class="pum-card-label">User Permissions</div>
          </div>
        </div>

        <div class="pum-card ${divergenceClass}">
          <div class="pum-card-icon pum-card-icon-orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="pum-card-content">
            <div class="pum-card-value">${divergenceCount}</div>
            <div class="pum-card-label">Diverg\xEAncias</div>
          </div>
        </div>
      </div>

      <div class="pum-status-row">
        <div class="pum-status-item">
          <span class="pum-status-dot ${gateClass}"></span>
          <span class="pum-status-label">UARPSGate</span>
          <span class="pum-status-value">${gateStatus}</span>
        </div>
        <div class="pum-status-item">
          <span class="pum-status-dot ${shadowClass}"></span>
          <span class="pum-status-label">Shadow Observer</span>
          <span class="pum-status-value">${shadowStatus}</span>
        </div>
        <div class="pum-status-item">
          <span class="pum-status-label">Unique Users</span>
          <span class="pum-status-value">${stats.unique_users || 0}</span>
        </div>
        <div class="pum-status-item">
          <span class="pum-status-label">Unique Endpoints</span>
          <span class="pum-status-value">${stats.unique_endpoints || 0}</span>
        </div>
      </div>

      <div class="pum-section">
        <div class="pum-section-header">
          <h3 class="pum-section-title">Diverg\xEAncias Recentes</h3>
          <span class="pum-section-count">${state.divergences.length} registros</span>
        </div>
        ${renderDivergencesTable(state)}
      </div>
    </div>
  `;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
export {
  MODULE_ID,
  VERSION,
  info,
  renderDashboard,
  renderError,
  renderSkeleton
};
