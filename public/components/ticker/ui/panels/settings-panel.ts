// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.7.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.ui.panels.settings-panel
// PURPOSE: Ticker Settings Panel (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   TICKER_EVENTS from /core/runtime/events/index.js
//   createPanelTemplate from ./settings-template.js
//   SettingsSectionsManager from ./settings-sections.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   TickerSettingsPanel() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TICKER_EVENTS.CONFIG_APPLY_SESSION
//   TICKER_EVENTS.CONFIG_CANCEL
//   TICKER_EVENTS.CONFIG_PRESET_APPLY
//   TICKER_EVENTS.CONFIG_RESET
//   TICKER_EVENTS.CONFIG_SAVE
//   TICKER_EVENTS.REFRESH_MANUAL
//   TICKER_EVENTS.SETTINGS_CLOSE
//   UI_INTENTS.REQUEST_LAYOUT
// LISTENS (eventos):
//   'click'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { TICKER_EVENTS } from '/core/runtime/events/catalog/ticker.events.js';
import { createPanelTemplate } from './settings-template.js';
import { SettingsSectionsManager } from './settings-sections.js';
declare const UI_INTENTS: Record<string, string>;
export const VERSION = '6.7.0-ES6';
export const MODULE_ID = 'ticker.ui.panels.settings-panel';
const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _debug = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug ? true : false; };
const _log = function(level: string, ...extraArgs: any[]) { const args = extraArgs; const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn.apply(logger, [`[${MODULE_ID}]`].concat(args)); };

function _emitLayoutRequest(mode: string) { const lm = _getPort('layoutManager'); if (lm && lm.setScrollLocked) { const lock = mode === 'scroll-lock'; lm.setScrollLocked(lock); _log('debug', 'LayoutManager.setScrollLocked called:', lock); return true; } const eb = _getPort('eventBus'); if (eb && eb.emit) { eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode, source: MODULE_ID, timestamp: Date.now() }); _log('debug', 'Emitted layout:request:', mode); return true; } _log('warn', 'No LayoutManager or EventBus available'); return false; }
export const TickerSettingsPanel = function(this: any, options: Record<string, any>) { if (options === undefined) options = {}; this.configStore = options.configStore; this.eventBus = options.eventBus; this.tickerComponent = options.tickerComponent; this.overlay = null; this.panel = null; this.sectionsManager = null; this.isOpen = false; this.isDestroyed = false; this.currentConfig = null; this.previewMode = false; this._metrics = { openCount: 0, saveCount: 0, resetCount: 0, lastOpenAt: null }; };
TickerSettingsPanel.prototype.mount = function() { return this; };

TickerSettingsPanel.prototype.open = function(initialConfig: unknown) { if (this.isOpen || this.isDestroyed) return; this.currentConfig = JSON.parse(JSON.stringify(initialConfig)); this.render(); this.attachEvents(); this.isOpen = true; _emitLayoutRequest('scroll-lock'); const self = this; setTimeout(() => { if (self.overlay) self.overlay.classList.add('active'); if (self.panel) self.panel.classList.add('active'); }, 10); this._metrics.openCount++; this._metrics.lastOpenAt = Date.now(); _log('debug', 'Settings panel opened'); };

TickerSettingsPanel.prototype.close = function() { const self = this; if (!self.isOpen) return; if (self.overlay) self.overlay.classList.remove('active'); if (self.panel) self.panel.classList.remove('active'); setTimeout(() => { self.unmount(); self.isOpen = false; _emitLayoutRequest('scroll-unlock'); if (self.eventBus) self.eventBus.emit(TICKER_EVENTS.SETTINGS_CLOSE, { timestamp: Date.now() }); _log('debug', 'Settings panel closed'); }, 300); };
TickerSettingsPanel.prototype.render = function() { if (!hasDocument) return; const template = createPanelTemplate(this.currentConfig); const tempDiv = document.createElement('div'); tempDiv.innerHTML = template; this.overlay = tempDiv.querySelector('.ticker-settings-overlay'); this.panel = tempDiv.querySelector('.ticker-settings-panel'); document.body.appendChild(this.overlay); document.body.appendChild(this.panel); this.sectionsManager = new SettingsSectionsManager(this.panel, this.currentConfig); this.sectionsManager.init(); };
TickerSettingsPanel.prototype.attachEvents = function() { const self = this; if (!self.overlay || !self.panel || !hasDocument) return; self._onOverlayClick = (e: MouseEvent) => { if (e.target === self.overlay) self.handleCancel(); }; self._onEscapeKey = (e: KeyboardEvent) => { if (e.key === 'Escape') self.handleCancel(); }; self.overlay.addEventListener('click', self._onOverlayClick); document.addEventListener('keydown', self._onEscapeKey); const cancelBtn = self.panel.querySelector('[data-action="cancel"]'); const saveBtn = self.panel.querySelector('[data-action="save"]'); const resetBtn = self.panel.querySelector('[data-action="reset"]'); const applySessionBtn = self.panel.querySelector('[data-action="apply-session"]'); const refreshNowBtn = self.panel.querySelector('[data-action="refresh-now"]'); const applyPresetBtn = self.panel.querySelector('[data-action="apply-preset"]'); if (cancelBtn) { self._onCancel = () => { self.handleCancel(); }; cancelBtn.addEventListener('click', self._onCancel); } if (saveBtn) { self._onSave = () => { self.handleSave(); }; saveBtn.addEventListener('click', self._onSave); } if (resetBtn) { self._onReset = () => { self.handleReset(); }; resetBtn.addEventListener('click', self._onReset); } if (applySessionBtn) { self._onApplySession = () => { self.handleApplySession(); }; applySessionBtn.addEventListener('click', self._onApplySession); } if (refreshNowBtn) { self._onRefreshNow = () => { self.handleRefreshNow(); }; refreshNowBtn.addEventListener('click', self._onRefreshNow); } if (applyPresetBtn) { self._onApplyPreset = () => { self.handleApplyPreset(); }; applyPresetBtn.addEventListener('click', self._onApplyPreset); } };
TickerSettingsPanel.prototype.handleCancel = function() { if (this.eventBus) this.eventBus.emit(TICKER_EVENTS.CONFIG_CANCEL, { timestamp: Date.now() }); this.close(); };

TickerSettingsPanel.prototype.handleSave = function() { const updatedConfig = this.sectionsManager.getConfig(); if (this.eventBus) this.eventBus.emit(TICKER_EVENTS.CONFIG_SAVE, { config: updatedConfig, timestamp: Date.now() }); this._metrics.saveCount++; _log('debug', 'Config saved'); this.close(); };
TickerSettingsPanel.prototype.handleApplySession = function() { const updatedConfig = this.sectionsManager.getConfig(); if (this.eventBus) this.eventBus.emit(TICKER_EVENTS.CONFIG_APPLY_SESSION, { config: updatedConfig, timestamp: Date.now() }); this.close(); };

TickerSettingsPanel.prototype.handleReset = function() { const self = this; if (confirm('Deseja realmente restaurar as configuracoes padrao?')) { if (self.eventBus) self.eventBus.emit(TICKER_EVENTS.CONFIG_RESET, { timestamp: Date.now() }); self._metrics.resetCount++; _log('debug', 'Config reset'); self.close(); } };
TickerSettingsPanel.prototype.handleRefreshNow = function() { const self = this; if (self.eventBus) self.eventBus.emit(TICKER_EVENTS.REFRESH_MANUAL, { timestamp: Date.now() }); const btn = self.panel.querySelector('[data-action="refresh-now"]'); if (btn) { btn.disabled = true; btn.textContent = 'Atualizando...'; setTimeout(() => { btn.disabled = false; btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/></svg>Atualizar Agora'; }, 2000); } };
TickerSettingsPanel.prototype.handleApplyPreset = function() { const self = this; const presetSelector = self.panel.querySelector('[data-preset-selector]'); if (!presetSelector) return; const presetName = presetSelector.value; if (self.eventBus) self.eventBus.emit(TICKER_EVENTS.CONFIG_PRESET_APPLY, { preset: presetName, timestamp: Date.now() }); self.configStore.applyPreset(presetName); self.currentConfig = self.configStore.getConfig(); self.close(); setTimeout(() => { self.open(self.currentConfig); }, 350); };
TickerSettingsPanel.prototype.unmount = function() { const self = this; if (!hasDocument) return; if (self.overlay) { self.overlay.removeEventListener('click', self._onOverlayClick); if (self.overlay.parentNode) self.overlay.parentNode.removeChild(self.overlay); } document.removeEventListener('keydown', self._onEscapeKey); if (self.panel && self.panel.parentNode) self.panel.parentNode.removeChild(self.panel); if (self.sectionsManager) { self.sectionsManager.destroy(); self.sectionsManager = null; } self.overlay = null; self.panel = null; };
TickerSettingsPanel.prototype.destroy = function() { this.isDestroyed = true; if (this.isOpen) this.close(); this.configStore = null; this.eventBus = null; this.tickerComponent = null; };
TickerSettingsPanel.prototype.healthCheck = function() { const eb = _getPort('eventBus'); const lm = _getPort('layoutManager'); const logger = _getPort('logger'); const checks = { hasConfigStore: !!this.configStore, hasEventBus: !!this.eventBus, layoutManagerAvailable: !!lm, loggerReady: !!logger, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed >= 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/6`, checks, compliance: 'P1A-AAA', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; };
TickerSettingsPanel.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, compliance: 'P1A-AAA', isOpen: this.isOpen, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; };
TickerSettingsPanel.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
TickerSettingsPanel.prototype.resetMetrics = function() { this._metrics = { openCount: 0, saveCount: 0, resetCount: 0, lastOpenAt: null }; };
TickerSettingsPanel.prototype.injectPorts = (ports: Record<string, unknown>) => { injectPorts(ports); };
TickerSettingsPanel.prototype.getPorts = () => getPorts();
export function getVersion() { return VERSION; }
export default TickerSettingsPanel;
