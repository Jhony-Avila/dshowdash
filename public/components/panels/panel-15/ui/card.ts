// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-15:card
// PURPOSE: Painel-15 Card Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   Card — exported value
//   createCard() — exported function
//   createAllCards() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-15:card';
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => _getPort('config')?.app?.debug ?? false;
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (level === 'error') { (logger as Record<string, (...a: unknown[]) => void>)?.error?.(`[${MODULE_ID}]`, ...args); return; } if (level === 'warn') { (logger as Record<string, (...a: unknown[]) => void>)?.warn?.(`[${MODULE_ID}]`, ...args); return; } if (_debug()) (logger as Record<string, (...a: unknown[]) => void>)?.debug?.(`[${MODULE_ID}]`, ...args); };
const SVGS = { chart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>', check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>', play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>', target: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>', warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' };
const CARD_CONFIGS: Record<string, { label: string; icon: string; color: string; format: (v: unknown) => unknown }> = { 'total-jobs': { label: 'Total Jobs', icon: SVGS.chart, color: 'blue', format: (v: unknown) => v || 0 }, 'active-jobs': { label: 'Ativos', icon: SVGS.check, color: 'green', format: (v: unknown) => v || 0 }, 'running-jobs': { label: 'Rodando', icon: SVGS.play, color: 'orange', format: (v: unknown) => v || 0 }, 'success-rate': { label: 'Taxa Sucesso', icon: SVGS.target, color: 'purple', format: (v: unknown) => v ? `${parseFloat(String(v)).toFixed(1)}%` : '0.0%' } };
class Card {
  [key: string]: any;
  constructor(metricName: string) { this.metricName = metricName; this.config = CARD_CONFIGS[metricName]; this.element = null; this.valueElement = null; this.statusElement = null; _initPorts(); }
  render() { const card = document.createElement('div'); card.className = `p15-card p15-card-${this.config.color}`; card.dataset.metric = this.metricName; card.innerHTML = `<div class="p15-card-icon">${this.config.icon}</div><div class="p15-card-value" data-value>---</div><div class="p15-card-label">${this.config.label}</div><div class="p15-card-status" data-status></div>`; this.element = card; this.valueElement = card.querySelector('[data-value]'); this.statusElement = card.querySelector('[data-status]'); return card; }
  update(data: unknown, error: string | null) { if (!this.element || !this.valueElement) return; this.element.classList.remove('p15-card-loading', 'p15-card-error'); this.statusElement.textContent = ''; if (error) { this.showError(error); return; } if (!data) { this.valueElement.textContent = '---'; return; } const dataRec = data as Record<string, unknown>; const value = dataRec.value !== undefined ? dataRec.value : data; this.valueElement.textContent = this.config.format(value); this.element.classList.add('p15-card-updated'); setTimeout(() => this.element.classList.remove('p15-card-updated'), 300); }
  showLoading() { if (!this.element) return; this.element.classList.add('p15-card-loading'); this.valueElement.textContent = '---'; this.statusElement.innerHTML = '<span class="p15-spinner"></span>'; }
  showError(error: string) { if (!this.element) return; this.element.classList.add('p15-card-error'); this.valueElement.textContent = '---'; this.statusElement.innerHTML = `<span class="p15-error-icon">${SVGS.warning}</span>`; this.statusElement.title = this.getErrorMessage(error); }
  getErrorMessage(error: string) { const messages: Record<string, string> = { 'AUTH_REQUIRED': 'Autenticacao necessaria', 'REQUEST_ABORTED': 'Requisicao cancelada', 'NO_DATA': 'Sem dados disponiveis', 'HTTP_500': 'Erro no servidor', 'HTTP_404': 'Endpoint nao encontrado' }; return messages[error] || `Erro: ${error}`; }
  destroy() { this.element?.remove(); this.element = null; this.valueElement = null; this.statusElement = null; }
}
const createCard = (metricName: string) => { if (!CARD_CONFIGS[metricName]) { _log('error', `Metrica desconhecida: ${metricName}`); return null; } return new Card(metricName); };
const createAllCards = () => Object.keys(CARD_CONFIGS).map(createCard);
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const healthCheck = () => ({ status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { cardReady: true, loggerReady: !!_getPort('logger'), portsInitialized: Ports.snapshot()._initialized } });
export { Card, createCard, createAllCards, VERSION, MODULE_ID, info, healthCheck, injectPorts, getPorts };
