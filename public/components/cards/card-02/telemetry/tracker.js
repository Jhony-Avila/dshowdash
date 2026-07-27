import { CARD_EVENTS } from "/core/runtime/events/catalog/card.events.js";
const VERSION = "9.2.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-02.telemetry.tracker";
const NAMESPACE = "card";
class CardTelemetryTracker {
  cardId;
  config;
  initialized;
  metrics;
  sessionStart;
  constructor(cardId, config = {}) {
    this.cardId = cardId;
    this.config = config;
    this.initialized = false;
    this.metrics = { loads: 0, errors: 0, refreshes: 0 };
    this.sessionStart = Date.now();
  }
  init() {
    if (this.initialized) return this;
    this.initialized = true;
    return this;
  }
  track(event, data) {
    if (!this.initialized) this.init();
    const payload = { event: `${NAMESPACE}:${this.cardId}:${event}`, cardId: this.cardId, timestamp: Date.now(), ...data };
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CARD_EVENTS.TELEMETRY, { detail: payload }));
    return payload;
  }
  trackLoad(duration, success) {
    this.metrics.loads++;
    if (!success) this.metrics.errors++;
    return this.track("load", { duration, success, unit: "ms" });
  }
  trackError(error, context) {
    this.metrics.errors++;
    return this.track("error", { context, message: error?.message ?? String(error) });
  }
  trackRefresh(source, success) {
    this.metrics.refreshes++;
    return this.track("refresh", { source, success });
  }
  getMetrics() {
    return { ...this.metrics, sessionDuration: Date.now() - this.sessionStart };
  }
  destroy() {
    this.initialized = false;
  }
}
const createTracker = (cardId, config) => new CardTelemetryTracker(cardId, config);
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
const info = () => ({ moduleId: MODULE_ID, version: VERSION, exports: ["CardTelemetryTracker", "createTracker"], timestamp: Date.now() });
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
