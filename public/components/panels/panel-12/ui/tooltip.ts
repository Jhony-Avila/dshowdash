// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-LIFECYCLE-CLEANUP)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-12/ui/tooltip
// PURPOSE: Panel 12 - Tooltip
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   show() — exported function
//   hide() — exported function
//   setup() — exported function
//   destroy() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'blur'
//   'focus'
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   (none)
// @changelog v9.4.0-LIFECYCLE-CLEANUP: AbortController cleanup for setup() listeners (BRF PARTE 3 compliance)
// @changelog v9.3.0-P2-ENTERPRISE: Enterprise P2 compliance
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panels/panel-12/ui/tooltip';
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => _getPort('config')?.app?.debug ?? false;
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (level === 'error') { logger?.error?.('[tooltip]', ...args); return; } if (level === 'warn') { logger?.warn?.('[tooltip]', ...args); return; } if (_debug()) logger?.debug?.('[tooltip]', ...args); };
let tooltipElement: HTMLElement | null = null;
let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;
let _hideTimeout: ReturnType<typeof setTimeout> | null = null;
let currentTooltipTarget: HTMLElement | null = null;
let _container: HTMLElement | null = null;
let _abortController: AbortController | null = null;
const _ensureContainer = () => { if (!_container) { _container = document.createElement('div'); (_container as HTMLElement).className = 'panel-tooltip-container'; (_container as HTMLElement).setAttribute('data-tooltip-owner', MODULE_ID); (_container as HTMLElement).style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:10000;pointer-events:none;'; const panel = document.querySelector('[data-panel="panel-12"]') || document.querySelector('.panel-12'); (panel || document.documentElement).appendChild(_container as HTMLElement); } return _container as HTMLElement; };
const show = (element: HTMLElement, text: string, tooltipId: string) => { hide(); currentTooltipTarget = element; tooltipElement = document.createElement('div'); tooltipElement.id = tooltipId; tooltipElement.className = 'painel-12-tooltip'; tooltipElement.setAttribute('role', 'tooltip'); tooltipElement.textContent = text; _ensureContainer().appendChild(tooltipElement); const rect = element.getBoundingClientRect(); const tooltipRect = tooltipElement.getBoundingClientRect(); const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2); const top = rect.top - tooltipRect.height - 8; tooltipElement.style.left = `${Math.max(8, left)}px`; tooltipElement.style.top = `${Math.max(8, top)}px`; tooltipTimeout = setTimeout(() => { tooltipElement?.classList.add('show'); }, 300); };
const hide = () => { if (tooltipTimeout) { clearTimeout(tooltipTimeout); tooltipTimeout = null; } if (_hideTimeout) { clearTimeout(_hideTimeout); _hideTimeout = null; } if (currentTooltipTarget?.hasAttribute('aria-describedby')) currentTooltipTarget.removeAttribute('aria-describedby'); currentTooltipTarget = null; if (tooltipElement) { tooltipElement.classList.remove('show'); const el = tooltipElement; _hideTimeout = setTimeout(() => { el?.parentNode?.removeChild(el); _hideTimeout = null; }, 200); tooltipElement = null; } };
const setup = (container: HTMLElement, id: string) => { _initPorts(); if (_abortController) (_abortController as AbortController).abort(); _abortController = new AbortController(); const signal = (_abortController as AbortController).signal; const badges = container.querySelectorAll('.painel-12-badge'); badges.forEach((badge: Element, index: number) => { const tooltipId = `tooltip-${id}-${index}`; let tooltipText = ''; const dataType = (badge as HTMLElement).getAttribute('data-type'); const dataStatus = (badge as HTMLElement).getAttribute('data-status'); if (dataType) { const typeLabels: Record<string, string> = { php: 'Tipo de execução: PHP', python: 'Tipo de execução: Python', shell: 'Tipo de execução: Shell Script', api: 'Tipo de execução: API', other: 'Tipo de execução: Outro' }; tooltipText = typeLabels[dataType] || (badge as HTMLElement).textContent || ''; } else if (dataStatus) { const statusLabels: Record<string, string> = { active: 'Job ativo e disponível para execução', inactive: 'Job inativo - não será executado', success: 'Taxa de sucesso excelente (≥90%)', warning: 'Taxa de sucesso moderada (70-89%)', error: 'Taxa de sucesso baixa (<70%) ou erros detectados' }; tooltipText = statusLabels[dataStatus] || (badge as HTMLElement).textContent || ''; } if (tooltipText) { (badge as HTMLElement).setAttribute('aria-describedby', tooltipId); (badge as HTMLElement).setAttribute('tabindex', '0'); badge.addEventListener('mouseenter', () => show(badge as HTMLElement, tooltipText, tooltipId), { signal }); badge.addEventListener('mouseleave', hide, { signal }); badge.addEventListener('focus', () => show(badge as HTMLElement, tooltipText, tooltipId), { signal }); badge.addEventListener('blur', hide, { signal }); } }); const deleteButtons = container.querySelectorAll('.painel-12-btn-delete'); deleteButtons.forEach((btn: Element, index: number) => { const tooltipId = `tooltip-delete-${id}-${index}`; const tooltipText = 'Remover definitivamente este job'; (btn as HTMLElement).setAttribute('aria-describedby', tooltipId); (btn as HTMLElement).setAttribute('tabindex', '0'); btn.addEventListener('mouseenter', () => show(btn as HTMLElement, tooltipText, tooltipId), { signal }); btn.addEventListener('mouseleave', hide, { signal }); btn.addEventListener('focus', () => show(btn as HTMLElement, tooltipText, tooltipId), { signal }); btn.addEventListener('blur', hide, { signal }); }); _log('debug', 'Setup completo', { badgeCount: badges.length }); };
const destroy = () => { if (_abortController) { (_abortController as AbortController).abort(); _abortController = null; } hide(); if (_hideTimeout) { clearTimeout(_hideTimeout as ReturnType<typeof setTimeout>); _hideTimeout = null; } if (_container) { (_container as HTMLElement).remove(); _container = null; tooltipElement = null; } };
const healthCheck = () => { const logger = _getPort('logger'); return { status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, noBodyAppend: true, loggerReady: !!logger, portsInitialized: Ports.snapshot()._initialized, checks: { cleanupAvailable: true, hasAbortController: (_abortController as AbortController | null) !== null } }; };
const info = () => ({ version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.snapshot()._initialized, hasAbortController: (_abortController as AbortController | null) !== null });
export { show, hide, setup, destroy, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
