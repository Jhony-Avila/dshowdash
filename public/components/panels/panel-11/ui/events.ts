// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.1.0-LIFECYCLE-CLEANUP)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-11-ui-events
// PURPOSE: Panel-11 UI Events
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   PANEL_INTENTS, emitPanelIntent from /core/runtime/events/catalog/panels.events.js
//   exportCSV, exportJSON from ./export.js
//
// PROVIDES:
//   bindEvents() — exported function
//   unbindEvents() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   PANEL_INTENTS.FILTER_CHANGE
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// @changelog v9.1.0-LIFECYCLE-CLEANUP: AbortController cleanup (BRF PARTE 3 compliance)
// @changelog v9.0.0-P18EC-AAA: Enterprise AAA compliance
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { PANEL_INTENTS, emitPanelIntent } from '/core/runtime/events/catalog/panels.events.js';
import { exportCSV, exportJSON } from './export.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panels-panel-11-ui-events';
const PANEL_ID = 'panel-11';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

let _abortController: AbortController | null = null;
let _listenerCount = 0;

function bindEvents(container: HTMLElement, state: Record<string, unknown>, handlers: Record<string, () => void>) {
    // Cleanup previous listeners if any (idempotent re-bind)
    unbindEvents();

    _abortController = new AbortController();
    const signal = _abortController.signal;
    _listenerCount = 0;

    _initPorts();
    const data = state.data as Record<string, unknown>;
    const filters = state.filters as Record<string, unknown>;
    const toast = state.toast as Record<string, (...args: unknown[]) => void> | null;
    const drawer = state.drawer as Record<string, (...args: unknown[]) => void> | null;
    const eventBus = _getPort('eventBus');

    const refreshBtn = container.querySelector('[data-action="refresh"]');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            emitPanelIntent('REFRESH', PANEL_ID);
            if (toast && toast['info']) toast['info']('Atualizando dados...');
        }, { signal });
        _listenerCount++;
    }

    const retryBtn = container.querySelector('[data-action="retry"]');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            emitPanelIntent('REFRESH', PANEL_ID);
        }, { signal });
        _listenerCount++;
    }

    const exportToggle = container.querySelector('[data-action="export-toggle"]');
    if (exportToggle) {
        exportToggle.addEventListener('click', (e: Event) => {
            e.stopPropagation();
            const dropdown = container.querySelector('[data-dropdown="export"]') as HTMLElement | null;
            if (dropdown) {
                state.exportMenuOpen = !state.exportMenuOpen;
                dropdown.style.display = state.exportMenuOpen ? 'block' : 'none';
            }
        }, { signal });
        _listenerCount++;
    }

    const csvExport = container.querySelector('[data-export="csv"]');
    if (csvExport) {
        csvExport.addEventListener('click', () => {
            exportCSV(data as Record<string, unknown>);
            if (toast && toast['success']) toast['success']('CSV exportado');
            handlers.closeExportMenu();
        }, { signal });
        _listenerCount++;
    }

    const jsonExport = container.querySelector('[data-export="json"]');
    if (jsonExport) {
        jsonExport.addEventListener('click', () => {
            exportJSON(data as Record<string, unknown>);
            if (toast && toast['success']) toast['success']('JSON exportado');
            handlers.closeExportMenu();
        }, { signal });
        _listenerCount++;
    }

    const autoRefreshToggle = container.querySelector('[data-action="toggle-auto-refresh"]');
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('click', () => {
            state.autoRefreshEnabled = !state.autoRefreshEnabled;
            const toggle = container.querySelector('[data-action="toggle-auto-refresh"]');
            const countdown = container.querySelector('[data-countdown]');
            if (toggle) toggle.classList.toggle('active', !!state.autoRefreshEnabled);
            if (countdown) countdown.classList.toggle('active', !!state.autoRefreshEnabled);
            if (toast && toast['info']) toast['info'](state.autoRefreshEnabled ? 'Auto-refresh ativado' : 'Auto-refresh desativado');
        }, { signal });
        _listenerCount++;
    }

    const periodBtns = container.querySelectorAll('[data-period]');
    const eventBusTyped = eventBus as { emit?: (...args: unknown[]) => void } | null;
    periodBtns.forEach((btn: Element) => {
        btn.addEventListener('click', () => {
            filters.period = (btn as HTMLElement).dataset.period;
            container.querySelectorAll('[data-period]').forEach((b: Element) => { b.classList.remove('active'); });
            btn.classList.add('active');
            if (toast && toast['info']) toast['info'](`Per\u00edodo alterado para ${(btn as HTMLElement).textContent}`);
            if (eventBusTyped?.emit) eventBusTyped.emit(PANEL_INTENTS.FILTER_CHANGE, { panelId: PANEL_ID, period: filters.period });
        }, { signal });
        _listenerCount++;
    });

    const statusFilters = container.querySelectorAll('[data-filter="status"]');
    statusFilters.forEach((chip: Element) => {
        chip.addEventListener('click', () => {
            filters.status = (chip as HTMLElement).dataset.value || null;
            container.querySelectorAll('[data-filter="status"]').forEach((c: Element) => { c.classList.remove('active'); });
            chip.classList.add('active');
            if (eventBusTyped?.emit) eventBusTyped.emit(PANEL_INTENTS.FILTER_CHANGE, { panelId: PANEL_ID, status: filters.status });
        }, { signal });
        _listenerCount++;
    });

    const viewAlerts = container.querySelector('[data-action="view-alerts"]');
    if (viewAlerts) {
        viewAlerts.addEventListener('click', () => {
            const topErrors = (data.top_errors as unknown[]) || [];
            if (drawer && drawer['open']) drawer['open']({ type: 'errors', errors: topErrors });
        }, { signal });
        _listenerCount++;
    }

    const errorRows = container.querySelectorAll('[data-error-job]');
    errorRows.forEach((row: Element) => {
        row.addEventListener('click', () => {
            const jobName = (row as HTMLElement).dataset.errorJob;
            const topErrors = (data.top_errors as Record<string, unknown>[]) || [];
            const errors = topErrors.filter((e: Record<string, unknown>) => ((e.job_name as string) || '') === jobName);
            if (drawer && drawer['open']) drawer['open']({ type: 'errors', errors: errors.length ? errors : topErrors });
        }, { signal });
        _listenerCount++;
    });

    document.addEventListener('click', () => { handlers.closeExportMenu(); }, { once: true, signal });
    _listenerCount++;
}

function unbindEvents() {
    if (_abortController) {
        _abortController.abort();
        _abortController = null;
        _listenerCount = 0;
    }
}

function info() {
    const portsSnapshot = Ports.snapshot();
    return { moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized, listenersBound: _listenerCount, hasAbortController: _abortController !== null };
}

function healthCheck() {
    const portsSnapshot = Ports.snapshot();
    return {
        status: 'HEALTHY',
        moduleId: MODULE_ID,
        version: VERSION,
        checks: {
            eventsReady: true,
            portsInitialized: portsSnapshot._initialized,
            cleanupAvailable: typeof unbindEvents === 'function',
            listenersTracked: _abortController !== null || _listenerCount === 0
        }
    };
}

export { bindEvents, unbindEvents, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export default { bindEvents, unbindEvents };
