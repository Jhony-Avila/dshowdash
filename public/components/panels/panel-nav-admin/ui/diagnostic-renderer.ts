// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.diagnostic-renderer
// PURPOSE: Panel Nav Admin - Diagnostic Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   renderDiagnostics() — exported function
//   renderDiagnosticTab() — exported function
//   renderValidationResult() — exported function
//
// @changelog
//   9.4.0-P18EC - Add renderDiagnosticTab() and renderValidationResult() consumed by index.js
//   8.4.0-P17WI-AAA - Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-nav-admin.ui.diagnostic-renderer';
export const VERSION = '9.4.0-P18EC-ENTERPRISE';

export function renderDiagnostics(container: HTMLElement, results: Record<string, unknown>) {
  if (!container) return;

  const itemCount = results.itemCount;
  const hasErrors = results.hasErrors;
  const errors = (results.errors as string[]) || [];
  const warnings = (results.warnings as string[]) || [];
  const statusClass = hasErrors ? 'status-error' : warnings.length ? 'status-warning' : 'status-ok';

  let html = '<div class="diagnostic-panel ' + statusClass + '">';
  html += '<div class="diagnostic-header"><h4>Diagnóstico</h4><span class="item-count">' + itemCount + ' itens</span></div>';

  if (errors.length) {
    html += '<div class="diagnostic-section errors"><h5><i class="fas fa-times-circle"></i> Erros (' + errors.length + ')</h5><ul>';
    for (let i = 0; i < errors.length; i++) html += '<li>' + errors[i] + '</li>';
    html += '</ul></div>';
  }

  if (warnings.length) {
    html += '<div class="diagnostic-section warnings"><h5><i class="fas fa-exclamation-triangle"></i> Avisos (' + warnings.length + ')</h5><ul>';
    for (let i = 0; i < warnings.length; i++) html += '<li>' + warnings[i] + '</li>';
    html += '</ul></div>';
  }

  if (!errors.length && !warnings.length) {
    html += '<div class="diagnostic-section success"><i class="fas fa-check-circle"></i> Nenhum problema encontrado</div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

// v9.4.0-P18EC: renderDiagnosticTab - Renders full diagnostic tab content, consumed by index.js
// @param {HTMLElement} container - Target container element
// @param {Object} diagnosticData - Diagnostic results object with checks, summary, etc.
export function renderDiagnosticTab(container: HTMLElement, diagnosticData: Record<string, unknown>) {
  if (!container) return;
  diagnosticData = diagnosticData || {};

  const checks = (diagnosticData.checks as Record<string, unknown>[]) || [];
  const summary = (diagnosticData.summary as Record<string, number>) || {};
  const passed = summary.passed || 0;
  const failed = summary.failed || 0;
  const warnings = summary.warnings || 0;
  const total = passed + failed + warnings;
  const healthPct = total > 0 ? Math.round((passed / total) * 100) : 100;

  let html = '<div class="pna-diagnostic-tab">';
  html += '<div class="pna-diagnostic-summary" style="display:flex;gap:1rem;margin-bottom:1rem;">';
  html += '<div class="pna-diag-stat" style="flex:1;text-align:center;padding:0.75rem;background:rgba(74,222,128,0.1);border-radius:0.5rem;"><div style="font-size:1.5rem;font-weight:700;color:#4ade80;">' + passed + '</div><div style="font-size:0.75rem;opacity:0.7;">Passed</div></div>';
  html += '<div class="pna-diag-stat" style="flex:1;text-align:center;padding:0.75rem;background:rgba(248,113,113,0.1);border-radius:0.5rem;"><div style="font-size:1.5rem;font-weight:700;color:#f87171;">' + failed + '</div><div style="font-size:0.75rem;opacity:0.7;">Failed</div></div>';
  html += '<div class="pna-diag-stat" style="flex:1;text-align:center;padding:0.75rem;background:rgba(251,191,36,0.1);border-radius:0.5rem;"><div style="font-size:1.5rem;font-weight:700;color:#fbbf24;">' + warnings + '</div><div style="font-size:0.75rem;opacity:0.7;">Warnings</div></div>';
  html += '<div class="pna-diag-stat" style="flex:1;text-align:center;padding:0.75rem;background:rgba(99,102,241,0.1);border-radius:0.5rem;"><div style="font-size:1.5rem;font-weight:700;color:#6366f1;">' + healthPct + '%</div><div style="font-size:0.75rem;opacity:0.7;">Health</div></div>';
  html += '</div>';

  if (checks.length > 0) {
    html += '<div class="pna-diagnostic-checks" style="display:flex;flex-direction:column;gap:0.5rem;">';
    for (let i = 0; i < checks.length; i++) {
      const check = checks[i];
      const status = check.status || 'unknown';
      const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
      const bgColor = status === 'pass' ? 'rgba(74,222,128,0.05)' : status === 'fail' ? 'rgba(248,113,113,0.05)' : 'rgba(251,191,36,0.05)';
      html += '<div style="padding:0.5rem 0.75rem;background:' + bgColor + ';border-radius:0.25rem;display:flex;align-items:center;gap:0.5rem;">';
      html += '<span>' + icon + '</span>';
      html += '<span style="flex:1;">' + (check.label || check.name || 'Check ' + (i + 1)) + '</span>';
      if (check.detail) html += '<span style="font-size:0.75rem;opacity:0.6;">' + check.detail + '</span>';
      html += '</div>';
    }
    html += '</div>';
  } else {
    html += '<div style="text-align:center;padding:2rem;opacity:0.5;">Nenhum diagnóstico executado</div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

// v9.4.0-P18EC: renderValidationResult - Renders a single validation result, consumed by index.js
// @param {HTMLElement} container - Target container element
// @param {Object} result - Validation result with status, message, details
export function renderValidationResult(container: HTMLElement, result: Record<string, unknown>) {
  if (!container) return;
  result = result || {};

  const status = (result.status as string) || 'info';
  const colors: Record<string, string> = { success: '#4ade80', error: '#f87171', warning: '#fbbf24', info: '#60a5fa' };
  const icons: Record<string, string> = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const color = colors[status] || colors.info;
  const icon = icons[status] || icons.info;

  let html = '<div class="pna-validation-result" style="padding:0.75rem;border-left:3px solid ' + color + ';background:rgba(255,255,255,0.03);border-radius:0 0.25rem 0.25rem 0;margin-bottom:0.5rem;">';
  html += '<div style="display:flex;align-items:center;gap:0.5rem;">';
  html += '<span>' + icon + '</span>';
  html += '<span style="font-weight:600;">' + (result.message || 'Validação') + '</span>';
  html += '</div>';
  if (result.details) {
    html += '<div style="margin-top:0.5rem;font-size:0.85rem;opacity:0.7;padding-left:1.5rem;">' + result.details + '</div>';
  }
  html += '</div>';

  container.insertAdjacentHTML('beforeend', html);
}

export default { renderDiagnostics, renderDiagnosticTab, renderValidationResult };
