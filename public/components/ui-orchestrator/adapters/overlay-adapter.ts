// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.8.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: ui-orchestrator.adapters.overlay-adapter
// PURPOSE: P25-COMPLIANT: EventBus subscriptions have deterministic teardown in destroy()
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   TELEMETRY_INTENTS, UI_EVENTS, ORCHESTRATOR_EVENTS, OVERLAY_INTENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getOverlayAdapter() — exported function
//   createOverlayAdapter() — exported function
//   OverlayAdapter() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   OVERLAY_INTENTS.OPEN
//   TELEMETRY_INTENTS.TRACK
// LISTENS (eventos):
//   UI_EVENTS.MODAL_OPEN_REQUEST
//   OVERLAY_INTENTS.OPEN
//   ORCHESTRATOR_EVENTS.INTENT_RESOLVED
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { ORCHESTRATOR_EVENTS } from '/core/runtime/events/catalog/orchestrator.events.js';
import { OVERLAY_INTENTS } from '/core/runtime/events/catalog/overlay.events.js';
export const VERSION = '1.8.0-P18EC';
export const MODULE_ID = 'ui-orchestrator.adapters.overlay-adapter';
const LISTENED_EVENTS = [UI_EVENTS.MODAL_OPEN_REQUEST, OVERLAY_INTENTS.OPEN, ORCHESTRATOR_EVENTS.INTENT_RESOLVED];
const MODAL_CONFIGS: Record<string, { title: string; size: string; closable: boolean; position?: string }> = { 'help': { title: 'Central de Ajuda', size: 'lg', closable: true }, 'notifications': { title: 'Notificações', size: 'md', closable: true, position: 'right' }, 'user-menu': { title: 'Menu do Usuário', size: 'sm', closable: true, position: 'top-right' }, 'termos': { title: 'Termos de Uso', size: 'lg', closable: true }, 'privacidade': { title: 'Política de Privacidade', size: 'lg', closable: true }, 'lgpd': { title: 'LGPD', size: 'lg', closable: true } };
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts(): void { Ports.init(); }
function _getPort(name: string): Record<string, unknown> { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>): unknown { return Ports.inject(p); }
function getPorts(): Record<string, unknown> { return Ports.snapshot(); }

interface OverlayAdapterInstance {
  _initialized: boolean;
  _unsubs: (() => void)[];
  _metrics: { modalOpened: number; overlayOpened: number; delegated: number; errors: number };
  init(context?: Record<string, unknown>): OverlayAdapterInstance;
  _setupListeners(): void;
  _handleModalOpen(payload: Record<string, unknown>): void;
  _handleOverlayOpen(payload: Record<string, unknown>): void;
  _handleIntentResolved(payload: Record<string, unknown>): void;
  _openOverlay(descriptor: Record<string, unknown>): void;
  _getModalContent(modalId: string): string;
  _track(event: string, data?: Record<string, unknown>): void;
  getMetrics(): { modalOpened: number; overlayOpened: number; delegated: number; errors: number };
  info(): Record<string, unknown>;
  healthCheck(): Record<string, unknown>;
  destroy(): void;
  injectPorts(ports: Record<string, unknown>): void;
  getPorts(): Record<string, unknown>;
  connectOverlayLayer?: (layer: unknown) => void;
}

const MODAL_CONTENTS: Record<string, string> = { 'help': '<div class="modal-help"><h2>Central de Ajuda</h2><p>Selecione um tópico...</p></div>', 'notifications': '<div class="modal-notifications"><h2>Notificações</h2><p>Nenhuma notificação nova.</p></div>', 'user-menu': '<div class="modal-user-menu"><h2>Minha Conta</h2></div>', 'termos': '<div class="modal-termos"><h2>Termos de Uso</h2></div>', 'privacidade': '<div class="modal-privacidade"><h2>Política de Privacidade</h2></div>', 'lgpd': '<div class="modal-lgpd"><h2>LGPD</h2></div>' };

function OverlayAdapterConstructor(this: OverlayAdapterInstance): void { this._initialized = false; this._unsubs = []; this._metrics = { modalOpened: 0, overlayOpened: 0, delegated: 0, errors: 0 }; }
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype.init = function(this: OverlayAdapterInstance, context: Record<string, unknown> = {}): OverlayAdapterInstance { const self = this; if (context === undefined) context = {}; if (self._initialized) return self; self._setupListeners(); self._initialized = true; self._track('overlay-adapter:init', { version: VERSION }); return self; };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype._setupListeners = function(this: OverlayAdapterInstance): void { const self = this; const eb = _getPort('eventBus') as { on?: (e: string, cb: (p: Record<string, unknown>) => void) => (() => void) } | null; if (!eb || !eb.on) return; const unsubModal = eb.on(UI_EVENTS.MODAL_OPEN_REQUEST, (payload: Record<string, unknown>) => { self._handleModalOpen(payload); }); if (typeof unsubModal === 'function') self._unsubs.push(unsubModal); const unsubOverlay = eb.on(OVERLAY_INTENTS.OPEN, (payload: Record<string, unknown>) => { self._handleOverlayOpen(payload); }); if (typeof unsubOverlay === 'function') self._unsubs.push(unsubOverlay); const unsubResolved = eb.on(ORCHESTRATOR_EVENTS.INTENT_RESOLVED, (payload: Record<string, unknown>) => { self._handleIntentResolved(payload); }); if (typeof unsubResolved === 'function') self._unsubs.push(unsubResolved); };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype._handleModalOpen = function(this: OverlayAdapterInstance, payload: Record<string, unknown>): void { const p = payload || {}; const modalId = p.modalId as string | undefined; const source = p.source; const content = p.content; const config = p.config; if (!modalId) { this._metrics.errors++; return; } this._metrics.modalOpened++; const modalConfig = MODAL_CONFIGS[modalId] || { title: modalId, size: 'md', closable: true }; const finalConfig = Object.assign({}, modalConfig, config); this._openOverlay({ id: `modal-${modalId}`, type: 'modal', content: content || this._getModalContent(modalId), config: finalConfig, source: source || MODULE_ID }); };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype._handleOverlayOpen = function(this: OverlayAdapterInstance, payload: Record<string, unknown>): void { const p = payload || {}; const overlayId = p.overlayId; const type = p.type; const content = p.content; const config = p.config; const source = p.source; if (!overlayId) { this._metrics.errors++; return; } this._metrics.overlayOpened++; this._openOverlay({ id: `overlay-${overlayId}`, type: type || 'drawer', content: content || null, config: config || {}, source: source || MODULE_ID }); };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype._handleIntentResolved = function(this: OverlayAdapterInstance, payload: Record<string, unknown>): void { const p = payload || {}; const resolution = p.resolution as Record<string, unknown> | undefined; if (!resolution || !resolution.success) return; if (resolution.action === 'openModal') { this._handleModalOpen({ modalId: (resolution.target as Record<string, unknown> | null)?.id ?? null, source: p.source }); } else if (resolution.action === 'openOverlay') { this._handleOverlayOpen({ overlayId: (resolution.target as Record<string, unknown> | null)?.id ?? null, source: p.source }); } };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype._openOverlay = function(this: OverlayAdapterInstance, descriptor: Record<string, unknown>): void { this._metrics.delegated++; const eb = _getPort('eventBus') as { emit?: (e: string, d: unknown) => void } | null; if (eb && eb.emit) eb.emit(OVERLAY_INTENTS.OPEN, descriptor); this._track('overlay-adapter:delegated', { id: descriptor.id as string }); };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype._getModalContent = function(modalId: string): string { return MODAL_CONTENTS[modalId] || `<div class="modal-generic"><h2>${modalId}</h2></div>`; };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype._track = function(event: string, data: Record<string, unknown> = {}): void { if (data === undefined) data = {}; const eb = _getPort('eventBus') as { emit?: (e: string, d: unknown) => void } | null; if (eb && eb.emit) eb.emit(TELEMETRY_INTENTS.TRACK, Object.assign({ event, source: MODULE_ID, timestamp: Date.now() }, data)); };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype.getMetrics = function(this: OverlayAdapterInstance): { modalOpened: number; overlayOpened: number; delegated: number; errors: number } { return Object.assign({}, this._metrics); };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype.info = function(this: OverlayAdapterInstance): Record<string, unknown> { return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, hasEvents: !!_getPort('eventBus'), listenedEvents: LISTENED_EVENTS, modalConfigs: Object.keys(MODAL_CONFIGS), metrics: this.getMetrics(), portsInitialized: Ports.isInitialized(), usingP18Intents: true, usingCatalogOverlayIntents: true }; };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype.healthCheck = function(this: OverlayAdapterInstance): Record<string, unknown> { const totalOps = this._metrics.modalOpened + this._metrics.overlayOpened; const checks = { initialized: this._initialized, hasEvents: !!_getPort('eventBus'), lowErrorRate: totalOps > 0 ? (this._metrics.errors / totalOps) < 0.1 : true, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true, catalogOverlayIntents: true }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed >= 5 ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/6`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype.destroy = function(this: OverlayAdapterInstance): void { const self = this; self._unsubs.forEach((u: () => void) => { try { if (typeof u === 'function') u(); } catch(e) {} }); self._unsubs = []; self._initialized = false; };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype.injectPorts = function(ports: Record<string, unknown>): void { injectPorts(ports); };
(OverlayAdapterConstructor as unknown as { prototype: OverlayAdapterInstance }).prototype.getPorts = function(): Record<string, unknown> { return getPorts(); };

const OverlayAdapter = OverlayAdapterConstructor as unknown as new () => OverlayAdapterInstance;

let _instance: OverlayAdapterInstance | null = null;
export function getOverlayAdapter(): OverlayAdapterInstance { if (!_instance) _instance = new OverlayAdapter(); return _instance; }
export function createOverlayAdapter(context: Record<string, unknown> = {}): OverlayAdapterInstance { if (context === undefined) context = {}; const adapter = new OverlayAdapter(); adapter.init(context); return adapter; }
export { OverlayAdapter, injectPorts, getPorts };
export default { OverlayAdapter, getOverlayAdapter, createOverlayAdapter, injectPorts, getPorts, VERSION, MODULE_ID };
