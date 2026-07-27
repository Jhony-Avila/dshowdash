// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-07.telemetry.tracker
// PURPOSE: Telemetry tracking for Card 07 with metrics collection
// ───────────────────────────────────────────────────────────────
// @contract TRACK - track(event, data) emits telemetry via CustomEvent
// @contract METRICS - trackLoad/trackError/trackRefresh update counters
// @contract LIFECYCLE - init() and destroy() for tracker lifecycle
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: CARD_EVENTS from /core/runtime/events/index.js
// PROVIDES: CardTelemetryTracker, createTracker, VERSION, MODULE_ID, healthCheck(), info()
// @changelog v9.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v9.0.0-P18EC: EVENTS.X.Y migration - strings legacy eliminadas
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CARD_EVENTS } from '/core/runtime/events/catalog/card.events.js';

export const VERSION = '9.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-07.telemetry.tracker';

const NAMESPACE = 'card';

export function CardTelemetryTracker(this: any, cardId: string, config?: Record<string, unknown>) {
  this.cardId = cardId;
  this.config = config || {};
  this.initialized = false;
  this.metrics = { loads: 0, errors: 0, refreshes: 0 };
  this.sessionStart = Date.now();
}

CardTelemetryTracker.prototype.init = function() {
  if (this.initialized) return this;
  this.initialized = true;
  return this;
};

CardTelemetryTracker.prototype.track = function(event: string, data?: unknown) {
  if (!this.initialized) this.init();
  const payload = { event: `${NAMESPACE}:${this.cardId}:${event}`, cardId: this.cardId, timestamp: Date.now() };
  if (data) Object.assign(payload, data);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CARD_EVENTS.TELEMETRY, { detail: payload }));
  }
  return payload;
};

CardTelemetryTracker.prototype.trackLoad = function(duration: number, success: boolean) {
  this.metrics.loads++;
  if (!success) this.metrics.errors++;
  return this.track('load', { duration, success, unit: 'ms' });
};

CardTelemetryTracker.prototype.trackError = function(error: unknown, context: unknown) {
  this.metrics.errors++;
  return this.track('error', { context, message: error && (error as Record<string, unknown>).message ? (error as Record<string, unknown>).message : String(error) });
};

CardTelemetryTracker.prototype.trackRefresh = function(source: string, success: boolean) {
  this.metrics.refreshes++;
  return this.track('refresh', { source, success });
};

CardTelemetryTracker.prototype.getMetrics = function() {
  return { loads: this.metrics.loads, errors: this.metrics.errors, refreshes: this.metrics.refreshes, sessionDuration: Date.now() - this.sessionStart };
};

CardTelemetryTracker.prototype.destroy = function() { this.initialized = false; };

export function createTracker(cardId: string, config?: Record<string, unknown>) { return new (CardTelemetryTracker as any)(cardId, config); }

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, exports: ['CardTelemetryTracker', 'createTracker'], timestamp: Date.now() }; }

export default CardTelemetryTracker;
