import { CARD_EVENTS } from "/core/runtime/events/catalog/card.events.js";
const VERSION = "9.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-07.telemetry.tracker";
const NAMESPACE = "card";
function CardTelemetryTracker(cardId, config) {
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
CardTelemetryTracker.prototype.track = function(event, data) {
  if (!this.initialized) this.init();
  const payload = { event: `${NAMESPACE}:${this.cardId}:${event}`, cardId: this.cardId, timestamp: Date.now() };
  if (data) Object.assign(payload, data);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CARD_EVENTS.TELEMETRY, { detail: payload }));
  }
  return payload;
};
CardTelemetryTracker.prototype.trackLoad = function(duration, success) {
  this.metrics.loads++;
  if (!success) this.metrics.errors++;
  return this.track("load", { duration, success, unit: "ms" });
};
CardTelemetryTracker.prototype.trackError = function(error, context) {
  this.metrics.errors++;
  return this.track("error", { context, message: error && error.message ? error.message : String(error) });
};
CardTelemetryTracker.prototype.trackRefresh = function(source, success) {
  this.metrics.refreshes++;
  return this.track("refresh", { source, success });
};
CardTelemetryTracker.prototype.getMetrics = function() {
  return { loads: this.metrics.loads, errors: this.metrics.errors, refreshes: this.metrics.refreshes, sessionDuration: Date.now() - this.sessionStart };
};
CardTelemetryTracker.prototype.destroy = function() {
  this.initialized = false;
};
function createTracker(cardId, config) {
  return new CardTelemetryTracker(cardId, config);
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ["CardTelemetryTracker", "createTracker"], timestamp: Date.now() };
}
var tracker_default = CardTelemetryTracker;
export {
  CardTelemetryTracker,
  MODULE_ID,
  VERSION,
  createTracker,
  tracker_default as default,
  healthCheck,
  info
};
