import orchestratorBus from "../bus/event-bus-adapter.js";
import { ORCHESTRATOR_EVENTS, SCHEDULER_MODES } from "../bus/events-map.js";
import orchestratorStore from "../state/store.js";
import logger from "../utils/logger.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-scheduler";
function OrchestratorScheduler() {
  this.mode = SCHEDULER_MODES.ACTIVE;
  this.timers = /* @__PURE__ */ new Map();
  this.intervals = /* @__PURE__ */ new Map();
  this.tasks = /* @__PURE__ */ new Map();
  this.tickCount = 0;
  this.lastTick = null;
  this.globalInterval = null;
  this.paused = false;
  this.initialized = false;
  this.destroyed = false;
  this.initTimestamp = null;
  this.tickInterval = 1e3;
}
OrchestratorScheduler.prototype.getVersion = () => VERSION;
OrchestratorScheduler.prototype.isInitialized = function() {
  return this.initialized && !this.destroyed;
};
OrchestratorScheduler.prototype.init = function(config = {}) {
  if (this.initialized) return this;
  this.mode = config.mode || SCHEDULER_MODES.ACTIVE;
  this.tickInterval = config.tickInterval || 1e3;
  this._startGlobalTick();
  orchestratorStore.setSchedulerMode(this.mode);
  this.initialized = true;
  this.destroyed = false;
  this.initTimestamp = Date.now();
  logger.info(`Scheduler inicializado (${VERSION})`, { mode: this.mode });
  return this;
};
OrchestratorScheduler.prototype._startGlobalTick = function() {
  const self = this;
  if (this.globalInterval) clearInterval(this.globalInterval);
  this.globalInterval = setInterval(() => {
    if (self.paused) return;
    self.tickCount++;
    self.lastTick = Date.now();
    self._processTasks();
    if (self.tickCount % 60 === 0) {
      orchestratorBus.emit(ORCHESTRATOR_EVENTS.SCHEDULER_TICK, { tickCount: self.tickCount, mode: self.mode, activeTasks: self.tasks.size, activeTimers: self.timers.size, activeIntervals: self.intervals.size, moduleId: MODULE_ID });
    }
  }, this.tickInterval);
};
OrchestratorScheduler.prototype._processTasks = function() {
  const self = this;
  const now = Date.now();
  this.tasks.forEach((task, id) => {
    if (task.nextRun <= now) self._executeTask(id, task);
  });
};
OrchestratorScheduler.prototype._executeTask = function(id, task) {
  if (this.mode === SCHEDULER_MODES.PAUSED) return;
  if (this.mode === SCHEDULER_MODES.DEGRADED && !task.critical) return;
  try {
    task.fn();
    task.runCount++;
    task.lastRun = Date.now();
    task.nextRun = task.lastRun + task.interval;
    if (task.maxRuns && task.runCount >= task.maxRuns) this.removeTask(id);
  } catch (error) {
    logger.error(`Task error: ${id}`, { error: error.message });
    task.errorCount++;
    if (task.errorCount >= 3) {
      logger.warn(`Task ${id} removida ap\xF3s 3 erros`);
      this.removeTask(id);
    }
  }
};
OrchestratorScheduler.prototype.addTask = function(id, fn, intervalMs, options = {}) {
  const self = this;
  if (this.tasks.has(id)) logger.warn(`Task ${id} j\xE1 existe, sobrescrevendo`);
  this.tasks.set(id, { fn, interval: intervalMs, critical: options.critical || false, maxRuns: options.maxRuns || null, runCount: 0, errorCount: 0, lastRun: null, nextRun: Date.now() + (options.delay || 0), createdAt: Date.now() });
  logger.debug(`Task adicionada: ${id}`, { interval: intervalMs });
  return () => self.removeTask(id);
};
OrchestratorScheduler.prototype.removeTask = function(id) {
  const removed = this.tasks.delete(id);
  if (removed) logger.debug(`Task removida: ${id}`);
  return removed;
};
OrchestratorScheduler.prototype.setTimeout = function(id, fn, delayMs) {
  const self = this;
  if (this.timers.has(id)) clearTimeout(this.timers.get(id).timerId);
  const timerId = setTimeout(() => {
    try {
      fn();
    } catch (error) {
      logger.error(`Timer error: ${id}`, { error: error.message });
    }
    self.timers.delete(id);
  }, delayMs);
  this.timers.set(id, { timerId, delay: delayMs, createdAt: Date.now() });
  return () => self.clearTimeout(id);
};
OrchestratorScheduler.prototype.clearTimeout = function(id) {
  const timer = this.timers.get(id);
  if (timer) {
    clearTimeout(timer.timerId);
    this.timers.delete(id);
    return true;
  }
  return false;
};
OrchestratorScheduler.prototype.setInterval = function(id, fn, intervalMs) {
  const self = this;
  if (this.intervals.has(id)) clearInterval(this.intervals.get(id).intervalId);
  const intervalId = setInterval(() => {
    if (self.paused || self.mode === SCHEDULER_MODES.PAUSED) return;
    try {
      fn();
    } catch (error) {
      logger.error(`Interval error: ${id}`, { error: error.message });
    }
  }, intervalMs);
  this.intervals.set(id, { intervalId, interval: intervalMs, createdAt: Date.now() });
  return () => self.clearInterval(id);
};
OrchestratorScheduler.prototype.clearInterval = function(id) {
  const interval = this.intervals.get(id);
  if (interval) {
    clearInterval(interval.intervalId);
    this.intervals.delete(id);
    return true;
  }
  return false;
};
OrchestratorScheduler.prototype.setMode = function(mode) {
  if (Object.values(SCHEDULER_MODES).indexOf(mode) === -1) {
    logger.error("Modo inv\xE1lido", { mode });
    return false;
  }
  const previousMode = this.mode;
  this.mode = mode;
  orchestratorStore.setSchedulerMode(mode);
  orchestratorBus.emit(ORCHESTRATOR_EVENTS.SCHEDULER_MODE_CHANGED, { previousMode, newMode: mode, moduleId: MODULE_ID });
  logger.info(`Modo alterado: ${previousMode} -> ${mode}`);
  return true;
};
OrchestratorScheduler.prototype.pause = function() {
  this.paused = true;
  logger.info("Scheduler pausado");
};
OrchestratorScheduler.prototype.resume = function() {
  this.paused = false;
  logger.info("Scheduler retomado");
};
OrchestratorScheduler.prototype.getStats = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, mode: this.mode, paused: this.paused, tickCount: this.tickCount, lastTick: this.lastTick, tasks: this.tasks.size, timers: this.timers.size, intervals: this.intervals.size, uptime: this.initTimestamp ? Date.now() - this.initTimestamp : 0 };
};
OrchestratorScheduler.prototype.reset = function() {
  this.tickCount = 0;
  this.paused = false;
  this.mode = SCHEDULER_MODES.ACTIVE;
  this.destroyed = false;
};
OrchestratorScheduler.prototype.destroy = function() {
  const self = this;
  if (this.globalInterval) {
    clearInterval(this.globalInterval);
    this.globalInterval = null;
  }
  this.timers.forEach((timer) => {
    clearTimeout(timer.timerId);
  });
  this.timers.clear();
  this.intervals.forEach((interval) => {
    clearInterval(interval.intervalId);
  });
  this.intervals.clear();
  this.tasks.clear();
  this.initialized = false;
  this.destroyed = true;
  logger.info("Scheduler destru\xEDdo");
};
const orchestratorScheduler = new OrchestratorScheduler();
var scheduler_default = orchestratorScheduler;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { schedulerReady: true } };
}
export {
  MODULE_ID,
  OrchestratorScheduler,
  VERSION,
  scheduler_default as default,
  healthCheck,
  info,
  orchestratorScheduler
};
