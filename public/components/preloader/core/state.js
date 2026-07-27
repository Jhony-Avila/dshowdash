import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { PRELOADER_EVENTS } from "/core/runtime/events/catalog/preloader.events.js";
const VERSION = "5.6.0-P18EC";
const MODULE_ID = "preloader-state";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return hasWindow && cfg && cfg.app && cfg.app.debug === true;
};
const _log = function(level, ...rest) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    if (logger.error) logger.error(`[${MODULE_ID}]`, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(`[${MODULE_ID}]`, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(`[${MODULE_ID}]`, args.join(" "));
};
const PHASES = { INIT: "inicializacao", WAIT_AUTH: "aguardando-login", LOADING: "carregando-dashboard", FINALIZING: "finalizando", VISIBLE: "dashboard-visivel" };
const VALID_TRANSITIONS = {};
VALID_TRANSITIONS[PHASES.INIT] = [PHASES.WAIT_AUTH, PHASES.LOADING, PHASES.FINALIZING];
VALID_TRANSITIONS[PHASES.WAIT_AUTH] = [PHASES.LOADING, PHASES.FINALIZING];
VALID_TRANSITIONS[PHASES.LOADING] = [PHASES.FINALIZING];
VALID_TRANSITIONS[PHASES.FINALIZING] = [PHASES.VISIBLE];
VALID_TRANSITIONS[PHASES.VISIBLE] = [];
function PreloaderState() {
  this.fase = PHASES.INIT;
  this.videoCarregado = false;
  this.sessaoVerificada = false;
  this.temSessaoValida = false;
  this.sessaoMeta = null;
  this.progressoAtual = 0;
  this.hits100 = 0;
  this.hits100Threshold = 3;
  this.bootStartTime = Date.now();
  this.eventBus = null;
  this.forceMode = false;
  this._transitionCount = 0;
  this._lastTransitionAt = null;
}
PreloaderState.prototype.setEventBus = function(eventBus) {
  this.eventBus = eventBus;
};
PreloaderState.prototype.setFase = function(novaFase, force) {
  if (this.fase === novaFase) return;
  const validTransitions = VALID_TRANSITIONS[this.fase] || [];
  if (!force && validTransitions.indexOf(novaFase) === -1) {
    _log("warn", `Transicao invalida: ${this.fase} -> ${novaFase}`);
    return;
  }
  _log("info", `Fase: ${this.fase} -> ${novaFase}${force ? " (FORCADO)" : ""}`);
  const oldFase = this.fase;
  this.fase = novaFase;
  this._transitionCount++;
  this._lastTransitionAt = Date.now();
  if (this.eventBus) {
    this.eventBus.emit(PRELOADER_EVENTS.PHASE_CHANGE, { from: oldFase, to: novaFase, forced: force, timestamp: Date.now() });
  }
};
PreloaderState.prototype.enableForceMode = function() {
  this.forceMode = true;
  _log("info", "Force mode ativado");
};
PreloaderState.prototype.setVideoCarregado = function(carregado) {
  this.videoCarregado = carregado;
};
PreloaderState.prototype.setSessao = function(verificada, valida, meta) {
  this.sessaoVerificada = verificada;
  this.temSessaoValida = valida;
  this.sessaoMeta = meta || null;
};
PreloaderState.prototype.setProgresso = function(progresso) {
  const clamped = Math.max(0, Math.min(100, progresso));
  if (clamped === 100 && this.progressoAtual === 100) {
    this.hits100++;
  } else if (clamped !== 100) {
    this.resetHits100();
  }
  this.progressoAtual = Math.max(this.progressoAtual, clamped);
};
PreloaderState.prototype.incrementHits100 = function() {
  this.hits100++;
};
PreloaderState.prototype.resetHits100 = function() {
  this.hits100 = 0;
};
PreloaderState.prototype.shouldFinalize = function() {
  return this.progressoAtual === 100 && this.hits100 >= this.hits100Threshold;
};
PreloaderState.prototype.resetBootStart = function() {
  this.bootStartTime = Date.now();
};
PreloaderState.prototype.getBootDuration = function() {
  return Date.now() - this.bootStartTime;
};
PreloaderState.prototype.resetAll = function() {
  this.fase = PHASES.INIT;
  this.videoCarregado = false;
  this.sessaoVerificada = false;
  this.temSessaoValida = false;
  this.sessaoMeta = null;
  this.progressoAtual = 0;
  this.hits100 = 0;
  this.bootStartTime = Date.now();
  this.forceMode = false;
  this._transitionCount = 0;
  this._lastTransitionAt = null;
};
PreloaderState.prototype.getStatus = function() {
  return Object.freeze({ fase: this.fase, videoCarregado: this.videoCarregado, sessaoVerificada: this.sessaoVerificada, temSessaoValida: this.temSessaoValida, sessaoMeta: this.sessaoMeta ? Object.assign({}, this.sessaoMeta) : null, progressoAtual: this.progressoAtual, hits100: this.hits100, bootDuration: this.getBootDuration(), forceMode: this.forceMode, portsInitialized: Ports.isInitialized() });
};
PreloaderState.prototype.healthCheck = function() {
  const self = this;
  const phaseValues = Object.keys(PHASES).map((k) => PHASES[k]);
  const isValidPhase = phaseValues.indexOf(self.fase) !== -1;
  const progressInRange = self.progressoAtual >= 0 && self.progressoAtual <= 100;
  const noStaleState = self.getBootDuration() < 12e4;
  const checks = { isValidPhase, progressInRange, noStaleState, hasLogger: !!_getPort("logger"), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, fase: self.fase, progress: self.progressoAtual, bootDuration: self.getBootDuration(), forceMode: self.forceMode, transitionCount: self._transitionCount, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
PreloaderState.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, status: this.getStatus(), healthCheck: this.healthCheck(), phases: Object.keys(PHASES).length, validTransitions: Object.keys(VALID_TRANSITIONS).length, transitionCount: this._transitionCount, lastTransitionAt: this._lastTransitionAt, portsInitialized: Ports.isInitialized() };
};
PreloaderState.prototype.getVersion = () => VERSION;
function getVersion() {
  return VERSION;
}
export {
  MODULE_ID,
  PHASES,
  PreloaderState,
  VALID_TRANSITIONS,
  VERSION,
  getPorts,
  getVersion,
  injectPorts
};
