// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-progress
// PURPOSE: Progress Monitoring - Preloader System
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   BOOT_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ProgressMonitor — exported constructor
//   getVersion() — exported function
//   getModuleMetrics() — exported function
//   moduleHealthCheck() — exported function
//   PROGRESS_EVENTS — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   BOOT_EVENTS.COMPONENTS_READY
// LISTENS (eventos):
//   boot:progress:start, boot:progress:phase:start, boot:progress:phase:complete, boot:progress:complete
// WINDOW ACCESS: (none)
// @changelog v5.1.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v5.0.0-BOOTSTRAP-INTEGRATED - Item 10.3: Fonte única de progresso via Bootstrap-v2 (Enterprise)
// @changelog v4.9.0-P03-PORTS - P0.3 FIX: Removed window.EventBus fallback (100% Ports)
// ═══════════════════════════════════════════════════════════════
//
// ARQUITETURA ENTERPRISE (Item 10.3 do Briefing GRUPO 1):
// ══════════════════════════════════════════════════════════════════════════════
// Bootstrap-v2 é a ÚNICA fonte de verdade para progresso do boot.
// O Preloader ESCUTA eventos do Bootstrap, não faz polling nem usa loadingTracker.
//
// Fluxo:
//   Bootstrap Phase 0 → emite boot:progress:phase:start (0%)
//   Bootstrap Phase 1 → emite boot:progress:phase:complete (17%)
//   Bootstrap Phase 2 → emite boot:progress:phase:complete (33%)
//   ...
//   Bootstrap Phase 5 → emite boot:progress:complete (100%)
//
// Preloader apenas REFLETE o progresso, não DECIDE nada.
// ══════════════════════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { BOOT_EVENTS } from '/core/runtime/events/catalog/boot.events.js';

export const VERSION = '5.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'preloader-progress';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

// Eventos de progresso do Bootstrap-v2 (fonte única de verdade)
const PROGRESS_EVENTS = {
  START: 'boot:progress:start',
  PHASE_START: 'boot:progress:phase:start',
  PHASE_COMPLETE: 'boot:progress:phase:complete',
  COMPLETE: 'boot:progress:complete'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (hasWindow && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback)
  // 4. Non-strict: use window.Logger with violation recording

  return null;
}

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: EventBus
// ═══════════════════════════════════════════════════════════════
function _getEventBusStrict() {
  // 1. Try Ports first
  const portEventBus = _getPort('eventBus');
  if (portEventBus) return portEventBus;

  // 2. Try Core.windowAdapter
  if (hasWindow && window.Core?.windowAdapter?.get) {
    const waEventBus = window.Core.windowAdapter.get('EventBus');
    if (waEventBus) return waEventBus;
  }

  return null;
}

const _debugEnabled = () => { const cfg = _getPort('config'); return hasWindow && cfg && cfg.app && cfg.app.debug === true; };
const _log = function(level: string, ...rest: any[]) {
    const args = Array.prototype.slice.call(arguments, 1);
    const logger = _getLogger();
    if (!logger) return;
    if (level === 'error') { if (logger.error) logger.error(...[`[${MODULE_ID}]`].concat(args)); return; }
    if (level === 'warn') { if (logger.warn) logger.warn(...[`[${MODULE_ID}]`].concat(args)); return; }
    if (level === 'info') { if (logger.info) logger.info(...[`[${MODULE_ID}]`].concat(args)); return; }
    if (_debugEnabled() && logger.debug) logger.debug(...[`[${MODULE_ID}]`].concat(args));
};

const _moduleMetrics = { 
  instancesCreated: 0, 
  totalStarts: 0, 
  totalStops: 0, 
  totalFinalizes: 0, 
  // v5.0.0: Novas métricas Enterprise
  bootstrapEventsReceived: 0,
  phaseStartEvents: 0,
  phaseCompleteEvents: 0,
  progressCompleteEvents: 0
};

function _emitComponentsReady(detail: Record<string, unknown>) {
    try {
        const eventBus = _getEventBusStrict();
        if (eventBus && eventBus.emit) {
            eventBus.emit(BOOT_EVENTS.COMPONENTS_READY, Object.assign({}, detail, {
                source: MODULE_ID,
                version: VERSION
            }));
            _log('info', 'BOOT_EVENTS.COMPONENTS_READY emitted via EventBus');
        } else {
            _log('warn', 'EventBus not available via Ports - COMPONENTS_READY not emitted');
        }
    } catch (e: any) {
        _log('warn', 'Failed to emit BOOT_EVENTS.COMPONENTS_READY', { error: e.message });
    }
}

// ============================================================================
// ProgressMonitor - VERSÃO ENTERPRISE (Bootstrap-Integrated)
// ============================================================================
// Não usa polling, não usa window.loadingTracker, não tem modo degradado.
// Escuta eventos do Bootstrap-v2 e reflete o progresso na UI.
// ============================================================================

export function ProgressMonitor(this: Record<string, any>, state: Record<string, any>) {
    this.state = state;
    this.done = false;
    this.cachedBar = null;
    this.cachedPercentage = null;
    this._startedAt = null;
    this._stoppedAt = null;
    
    // v5.0.0: Cleanups para listeners do EventBus
    this._eventCleanups = [];
    this._bootstrapConnected = false;
    
    // v5.0.0: Métricas de instância
    this._metrics = { 
      uiUpdateCount: 0, 
      lastProgress: 0, 
      lastUpdateAt: null,
      eventsReceived: 0,
      lastEventType: null,
      lastPhaseId: null
    };
    
    _moduleMetrics.instancesCreated++;
    _initPorts();
}

ProgressMonitor.prototype.start = function() {
    const self = this;
    if (self.done) return;
    if (!hasDocument) return;

    _log('info', 'Iniciando monitoramento Enterprise (Bootstrap-integrated)');
    _moduleMetrics.totalStarts++;
    self._startedAt = Date.now();

    // Cache dos elementos DOM
    self.cachedBar = document.getElementById('loading-progress-bar');
    self.cachedPercentage = document.querySelector('.loading-percentage');

    // v5.0.0: Conectar ao Bootstrap-v2 via EventBus
    self._connectToBootstrap();
};

// ============================================================================
// CONEXÃO COM BOOTSTRAP-V2 (Fonte Única de Verdade)
// ============================================================================
ProgressMonitor.prototype._connectToBootstrap = function() {
    const self = this;
    const eventBus = _getEventBusStrict();
    
    if (!eventBus || !eventBus.on) {
        _log('warn', 'EventBus not available - cannot connect to Bootstrap-v2');
        // Fallback mínimo: mostra 100% após 5s se Bootstrap não responder
        self._setupMinimalFallback();
        return;
    }
    
    _log('info', 'Connecting to Bootstrap-v2 progress events');
    
    // 1. boot:progress:start - início do boot (0%)
    const cleanupStart = eventBus.on(PROGRESS_EVENTS.START, (data: Record<string, any>) => {
        _moduleMetrics.bootstrapEventsReceived++;
        self._metrics.eventsReceived++;
        self._metrics.lastEventType = 'start';
        _log('debug', 'Bootstrap progress START', data);
        self.updateUI(data.percentage || 0);
    });
    self._eventCleanups.push(cleanupStart);
    
    // 2. boot:progress:phase:start - início de cada fase
    const cleanupPhaseStart = eventBus.on(PROGRESS_EVENTS.PHASE_START, (data: Record<string, any>) => {
        _moduleMetrics.bootstrapEventsReceived++;
        _moduleMetrics.phaseStartEvents++;
        self._metrics.eventsReceived++;
        self._metrics.lastEventType = 'phase:start';
        self._metrics.lastPhaseId = data.phase || data.phaseId;
        _log('debug', 'Bootstrap phase START', { phase: data.phase, percentage: data.percentage });
        self.updateUI(data.percentage || 0);
    });
    self._eventCleanups.push(cleanupPhaseStart);
    
    // 3. boot:progress:phase:complete - fim de cada fase
    const cleanupPhaseComplete = eventBus.on(PROGRESS_EVENTS.PHASE_COMPLETE, (data: Record<string, any>) => {
        _moduleMetrics.bootstrapEventsReceived++;
        _moduleMetrics.phaseCompleteEvents++;
        self._metrics.eventsReceived++;
        self._metrics.lastEventType = 'phase:complete';
        self._metrics.lastPhaseId = data.phase || data.phaseId;
        _log('debug', 'Bootstrap phase COMPLETE', { phase: data.phase, percentage: data.percentage });
        self.updateUI(data.percentage || 0);
    });
    self._eventCleanups.push(cleanupPhaseComplete);
    
    // 4. boot:progress:complete - boot finalizado (100%)
    const cleanupComplete = eventBus.on(PROGRESS_EVENTS.COMPLETE, (data: Record<string, any>) => {
        _moduleMetrics.bootstrapEventsReceived++;
        _moduleMetrics.progressCompleteEvents++;
        self._metrics.eventsReceived++;
        self._metrics.lastEventType = 'complete';
        _log('info', 'Bootstrap progress COMPLETE', { success: data.success, totalTime: data.totalTime });
        self.updateUI(100);
        // Finalizar após pequeno delay para animação suave
        setTimeout(() => {
            self.finalize('bootstrap-complete');
        }, 300);
    });
    self._eventCleanups.push(cleanupComplete);
    
    self._bootstrapConnected = true;
    _log('info', 'Connected to Bootstrap-v2 progress events (4 listeners)');
};

// ============================================================================
// FALLBACK MÍNIMO (Apenas se EventBus não disponível)
// ============================================================================
// Este fallback é EXPLÍCITO e documentado, não silencioso.
// Usado apenas se o EventBus falhar completamente.
// ============================================================================
ProgressMonitor.prototype._setupMinimalFallback = function() {
    const self = this;
    _log('warn', 'Setting up minimal fallback (EventBus unavailable)');
    
    // Progresso linear simples em 5 segundos
    const startTime = Date.now();
    const duration = 5000;
    const fallbackInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percentage = Math.min(100, Math.round((elapsed / duration) * 100));
        self.updateUI(percentage);
        
        if (percentage >= 100) {
            clearInterval(fallbackInterval);
            self.finalize('fallback-timeout');
        }
    }, 200);
    
    self._fallbackInterval = fallbackInterval;
    self._fallbackActive = true;
};

ProgressMonitor.prototype.updateUI = function(progresso: number) {
    if (this.done) return;
    
    this.state.setProgresso(progresso);
    this._metrics.uiUpdateCount++;
    this._metrics.lastProgress = progresso;
    this._metrics.lastUpdateAt = Date.now();
    
    if (this.cachedBar) { 
        this.cachedBar.style.width = `${progresso}%`; 
    }
    if (this.cachedPercentage) { 
        this.cachedPercentage.textContent = `${Math.round(progresso)}%`; 
    }
};

ProgressMonitor.prototype.finalize = function(reason: string) {
    if (this.done) return;
    this.done = true;
    this.stop();
    _moduleMetrics.totalFinalizes++;
    _log('info', `Finalizando (reason: ${reason}, eventsReceived: ${this._metrics.eventsReceived})`);
    
    const detail = { 
        reason, 
        bootstrapIntegrated: this._bootstrapConnected,
        eventsReceived: this._metrics.eventsReceived,
        lastPhaseId: this._metrics.lastPhaseId,
        timestamp: Date.now() 
    };
    
    _emitComponentsReady(detail);
};

ProgressMonitor.prototype.stop = function() {
    _moduleMetrics.totalStops++;
    this._stoppedAt = Date.now();
    
    // Limpar listeners do EventBus
    for (let i = 0; i < this._eventCleanups.length; i++) {
        try {
            if (typeof this._eventCleanups[i] === 'function') {
                this._eventCleanups[i]();
            }
        } catch (e: any) {
            _log('warn', 'Error cleaning up event listener', { error: e.message });
        }
    }
    this._eventCleanups = [];
    
    // Limpar fallback se ativo
    if (this._fallbackInterval) {
        clearInterval(this._fallbackInterval);
        this._fallbackInterval = null;
    }
    
    _log('debug', 'ProgressMonitor stopped');
};

ProgressMonitor.prototype.getMetrics = function() { 
    return Object.assign({}, this._metrics); 
};

ProgressMonitor.prototype.healthCheck = function() {
    const checks = {
        stateAvailable: !!this.state,
        notDone: !this.done,
        bootstrapConnected: this._bootstrapConnected,
        eventsReceived: this._metrics.eventsReceived > 0,
        progressValid: this._metrics.lastProgress >= 0 && this._metrics.lastProgress <= 100,
        portsInitialized: Ports.isInitialized()
    };
    let passed = 0;
    const checkKeys = Object.keys(checks);
    for (let i = 0; i < checkKeys.length; i++) { if ((checks as Record<string, boolean>)[checkKeys[i]]) passed++; }
    const total = checkKeys.length;
    const logger = _getLogger();
    return {
        status: passed === total ? 'HEALTHY' : (passed >= 4 ? 'DEGRADED' : 'UNHEALTHY'),
        score: passed,
        maxScore: total,
        scoreDisplay: `${passed}/${total}`,
        checks,
        bootstrapIntegrated: true,
        bootstrapConnected: this._bootstrapConnected,
        fallbackActive: !!this._fallbackActive,
        done: this.done,
        portsInitialized: Ports.isInitialized(),
        strictMode: isStrict(),
        eventUsed: 'PROGRESS_EVENTS (Bootstrap-v2)',
        metrics: this._metrics,
        loggerAvailable: !!logger,
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
};

ProgressMonitor.prototype.info = function() {
    return {
        version: VERSION,
        moduleId: MODULE_ID,
        bootstrapIntegrated: true,
        bootstrapConnected: this._bootstrapConnected,
        fallbackActive: !!this._fallbackActive,
        eventsUsed: Object.keys(PROGRESS_EVENTS),
        done: this.done,
        startedAt: this._startedAt,
        stoppedAt: this._stoppedAt,
        duration: this._startedAt ? (this._stoppedAt || Date.now()) - this._startedAt : null,
        portsInitialized: Ports.isInitialized(),
        strictMode: isStrict(),
        metrics: this.getMetrics(),
        healthCheck: this.healthCheck()
    };
};

ProgressMonitor.prototype.getVersion = () => VERSION;

// ============================================================================
// EXPORTS DE MÓDULO
// ============================================================================

export function getVersion() { return VERSION; }
export function getModuleMetrics() { return Object.assign({}, _moduleMetrics); }

export function moduleHealthCheck() {
    const checks = {
        hasWindow,
        hasDocument,
        instancesCreated: _moduleMetrics.instancesCreated > 0,
        bootstrapEventsReceived: _moduleMetrics.bootstrapEventsReceived > 0,
        portsInitialized: Ports.isInitialized()
    };
    let passed = 0;
    const checkKeys = Object.keys(checks);
    for (let i = 0; i < checkKeys.length; i++) { if ((checks as Record<string, boolean>)[checkKeys[i]]) passed++; }
    const total = checkKeys.length;
    const logger = _getLogger();
    return {
        status: passed === total ? 'HEALTHY' : (passed >= 3 ? 'DEGRADED' : 'UNHEALTHY'),
        score: passed,
        maxScore: total,
        scoreDisplay: `${passed}/${total}`,
        checks,
        moduleMetrics: Object.assign({}, _moduleMetrics),
        portsInitialized: Ports.isInitialized(),
        strictMode: isStrict(),
        bootstrapIntegrated: true,
        eventsUsed: 'PROGRESS_EVENTS (Bootstrap-v2)',
        loggerAvailable: !!logger,
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

// Exportar constantes para debug/diagnóstico
export { PROGRESS_EVENTS };
