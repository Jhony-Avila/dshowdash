import { MODULE_ID as CORE_MODULE_ID } from "../core/constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-sessions/ui/template";
function renderSkeleton() {
  return `    <div class="panel-user-sessions skeleton" data-module="${CORE_MODULE_ID}">      <div class="panel-header"><div class="skeleton-title"></div></div>      <div class="panel-content">        <div class="skeleton-card"></div>        <div class="skeleton-card"></div>        <div class="skeleton-card"></div>      </div>    </div>  `;
}
function renderAuthBlocked() {
  return `    <div class="panel-user-sessions auth-blocked" data-module="${CORE_MODULE_ID}">      <div class="panel-header"><h2>Sess\xF5es Ativas</h2></div>      <div class="panel-content">        <div class="auth-message">          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>            <line x1="8" y1="21" x2="16" y2="21"></line>            <line x1="12" y1="17" x2="12" y2="21"></line>          </svg>          <h3>Acesso Restrito</h3>          <p>Fa\xE7a login para ver suas sess\xF5es ativas</p>          <button class="btn-login" data-action="login">Entrar</button>        </div>      </div>    </div>  `;
}
function renderError(message) {
  return `    <div class="panel-user-sessions error" data-module="${CORE_MODULE_ID}">      <div class="panel-header"><h2>Sess\xF5es Ativas</h2></div>      <div class="panel-content">        <div class="error-message">          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">            <circle cx="12" cy="12" r="10"></circle>            <line x1="12" y1="8" x2="12" y2="12"></line>            <line x1="12" y1="16" x2="12.01" y2="16"></line>          </svg>          <h3>Erro ao Carregar</h3>          <p>${message}</p>          <button class="btn-retry" data-action="retry">Tentar Novamente</button>        </div>      </div>    </div>  `;
}
function renderSessions(sessions, currentSessionId, loginHistory, terminating) {
  const activeSessions = sessions.filter((s) => s.active !== false);
  const otherSessions = activeSessions.filter((s) => s.id !== currentSessionId);
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  let otherSessionsHtml = "";
  if (otherSessions.length > 0) {
    const sessionCards = otherSessions.map((session) => renderSessionCard(session, terminating)).join("");
    otherSessionsHtml = `<div class="sessions-list">${sessionCards}</div>`;
  } else {
    otherSessionsHtml = '<div class="empty-state"><p>Nenhuma outra sess\xE3o ativa</p></div>';
  }
  const terminateAllBtn = otherSessions.length > 0 ? '<button class="btn-danger-outline" data-action="terminate-all">Encerrar Todas</button>' : "";
  let historyHtml = "";
  if (loginHistory.length > 0) {
    const rows = loginHistory.slice(0, 10).map((entry) => {
      const rowClass = entry.success ? "" : "failed";
      const statusClass = entry.success ? "success" : "failed";
      const statusText = entry.success ? "Sucesso" : "Falhou";
      return `<tr class="${rowClass}"><td>${formatDate(entry.timestamp)}</td><td>${entry.device || "Desconhecido"}</td><td>${entry.ip || "N/A"}</td><td><span class="status-badge ${statusClass}">${statusText}</span></td></tr>`;
    }).join("");
    historyHtml = `<div class="login-history"><table class="history-table"><thead><tr><th>Data/Hora</th><th>Dispositivo</th><th>IP</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } else {
    historyHtml = '<div class="empty-state"><p>Nenhum hist\xF3rico dispon\xEDvel</p></div>';
  }
  return `    <div class="panel-user-sessions" data-module="${CORE_MODULE_ID}">      <div class="panel-header">        <h2>Sess\xF5es Ativas</h2>        <p class="panel-subtitle">Gerencie dispositivos conectados \xE0 sua conta</p>      </div>      <div class="panel-content">        <section class="sessions-section">          <h3>Sess\xE3o Atual</h3>          ${renderCurrentSession(currentSession)}        </section>        <section class="sessions-section">          <div class="section-header">            <h3>Outras Sess\xF5es (${otherSessions.length})</h3>            ${terminateAllBtn}          </div>          ${otherSessionsHtml}        </section>        <section class="sessions-section">          <h3>\xDAltimos Logins</h3>          ${historyHtml}        </section>      </div>    </div>  `;
}
function renderCurrentSession(session) {
  if (!session) return '<div class="empty-state"><p>Sess\xE3o atual n\xE3o identificada</p></div>';
  return `    <div class="session-card current">      <div class="session-icon">${getDeviceIcon(session.device_type)}</div>      <div class="session-info">        <div class="session-device">          <strong>${session.device || "Este dispositivo"}</strong>          <span class="current-badge">Atual</span>        </div>        <div class="session-details">          <span>${session.browser || "Navegador"} \u2022 ${session.os || "Sistema"}</span>          <span>${session.ip || "IP n\xE3o dispon\xEDvel"} \u2022 ${session.location || ""}</span>        </div>        <div class="session-activity">          \xDAltima atividade: ${formatDate(session.last_activity) || "Agora"}        </div>      </div>    </div>  `;
}
function renderSessionCard(session, terminating) {
  const isTerminating = terminating === session.id;
  const disabledAttr = isTerminating ? "disabled" : "";
  const btnText = isTerminating ? "Encerrando..." : "Encerrar";
  return `    <div class="session-card" data-session-id="${session.id}">      <div class="session-icon">${getDeviceIcon(session.device_type)}</div>      <div class="session-info">        <div class="session-device">          <strong>${session.device || "Dispositivo desconhecido"}</strong>        </div>        <div class="session-details">          <span>${session.browser || "Navegador"} \u2022 ${session.os || "Sistema"}</span>          <span>${session.ip || "IP n\xE3o dispon\xEDvel"} \u2022 ${session.location || ""}</span>        </div>        <div class="session-activity">          \xDAltima atividade: ${formatDate(session.last_activity) || "Desconhecido"}        </div>      </div>      <button class="btn-terminate" data-action="terminate" data-session-id="${session.id}" ${disabledAttr}>${btnText}</button>    </div>  `;
}
function getDeviceIcon(type) {
  const icons = {
    desktop: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
    mobile: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
    tablet: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'
  };
  return type && icons[type] || icons["desktop"];
}
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMs / 36e5);
    const diffDays = Math.floor(diffMs / 864e5);
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins} min atr\xE1s`;
    if (diffHours < 24) return `${diffHours}h atr\xE1s`;
    if (diffDays < 7) return `${diffDays}d atr\xE1s`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "N/A";
  }
}
var template_default = { renderSkeleton, renderAuthBlocked, renderError, renderSessions };
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { templateReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  template_default as default,
  healthCheck,
  info,
  renderAuthBlocked,
  renderError,
  renderSessions,
  renderSkeleton
};
