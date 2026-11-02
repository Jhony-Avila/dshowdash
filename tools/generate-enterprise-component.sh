#!/usr/bin/env bash
# ============================================================================
# GERADOR DE COMPONENTE ENTERPRISE AAA
# Versão: 1.0.0
# Uso: ./generate-enterprise-component.sh <tipo> <nome> <titulo> [emoji]
# Tipos: panel | header | footer
# Exemplo: ./generate-enterprise-component.sh panel integration-adwords "Google Ads" "📢"
# ============================================================================
set -u

TYPE="${1:-}"
NAME="${2:-}"
TITLE="${3:-}"
EMOJI="${4:-🔧}"

# Validar argumentos
if [ -z "$TYPE" ] || [ -z "$NAME" ] || [ -z "$TITLE" ]; then
  echo "USO: $0 <tipo> <nome> <titulo> [emoji]"
  echo "Tipos: panel | header | footer"
  echo "Exemplo: $0 panel integration-adwords 'Google Ads' '📢'"
  exit 1
fi

# Definir diretório base
case "$TYPE" in
  panel)
    BASE_DIR="/var/www/dshowdash/public/components/panels/panel-$NAME"
    MODULE_ID="panels/panel-$NAME"
    ;;
  header)
    BASE_DIR="/var/www/dshowdash/public/components/header/components/$NAME"
    MODULE_ID="header/components/$NAME"
    ;;
  footer)
    BASE_DIR="/var/www/dshowdash/public/components/footer/components/icons/$NAME"
    MODULE_ID="footer/components/icons/$NAME"
    ;;
  *)
    echo "Tipo inválido: $TYPE (use: panel, header, footer)"
    exit 1
    ;;
esac

VERSION="1.0.0-ENTERPRISE-AAA"
TIMESTAMP=$(date -Iseconds)

echo "=== Criando componente enterprise: $NAME ==="
echo "Tipo: $TYPE"
echo "Diretório: $BASE_DIR"
echo "MODULE_ID: $MODULE_ID"

# Criar estrutura de diretórios
mkdir -p "$BASE_DIR"/{accessibility,api,core,state,telemetry,ui,utils,styles}

# ============================================================================
# 1. index.js - Orquestrador Principal
# ============================================================================
cat > "$BASE_DIR/index.js" << JSEOF
// $TITLE - Enterprise AAA Component
// @version $VERSION
// @created $TIMESTAMP
'use strict';

import { LifecycleManager } from './core/lifecycle.js';
import { CircuitBreaker } from './core/circuit-breaker.js';
import { StateStore } from './state/store.js';
import { Logger } from './telemetry/logger.js';
import { Tracker } from './telemetry/tracker.js';

export const MODULE_ID = '$MODULE_ID';
export const VERSION = '$VERSION';

const CONFIG = {
  id: '$NAME',
  area: '$TYPE',
  label: '$TITLE',
  icon: '$NAME',
  emoji: '$EMOJI',
  kind: '$TYPE-component'
};

let _debug = false;
function _log(level, ...args) {
  if (!_debug && level === 'debug') return;
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'debug'](\`[\${MODULE_ID}]\`, ...args);
}

// Emite ui:action P3 AAA
function emitUIAction(eventBus, data = {}) {
  if (!eventBus?.emit) return;
  eventBus.emit('ui:action', {
    actionId: \`$TYPE:\${CONFIG.id}\`,
    source: MODULE_ID,
    timestamp: Date.now(),
    meta: { label: CONFIG.label, icon: CONFIG.icon, kind: CONFIG.kind, ...data }
  });
}

export class ${NAME//-/}Component {
  constructor(options = {}) {
    this.container = options.container || null;
    this.config = { ...CONFIG, ...options.config };
    this.eventBus = options.eventBus || window.EventBusGlobal || window.EventBus;
    
    // Core
    this.store = new StateStore({ mounted: false, loading: false, error: null, data: null });
    this.lifecycle = new LifecycleManager(this);
    this.circuitBreaker = new CircuitBreaker({ threshold: 3, timeout: 30000 });
    
    // Telemetry
    this.logger = new Logger({ prefix: \`[\${MODULE_ID}]\` });
    this.tracker = new Tracker({ moduleId: MODULE_ID });
    
    // State
    this._mounted = false;
    this._initialized = false;
    this._element = null;
    this._abortController = null;
    this._metrics = { mountCount: 0, errorCount: 0, lastMountAt: null };
  }

  // === LIFECYCLE ===
  
  init(ctx = {}) {
    if (this._initialized) return this;
    this._ctx = ctx;
    this._initialized = true;
    this.logger.info('Initialized');
    this.tracker.track('init', { config: this.config });
    return this;
  }

  async mount(container) {
    if (this._mounted) {
      this.logger.warn('Already mounted');
      return this;
    }
    
    this.container = container || this.container;
    if (!this.container) {
      this.logger.error('No container provided');
      return this;
    }
    
    try {
      this._abortController = new AbortController();
      await this.lifecycle.mount();
      this.render();
      this.attachEvents();
      
      this._mounted = true;
      this.store.setState({ mounted: true });
      this._metrics.mountCount++;
      this._metrics.lastMountAt = Date.now();
      
      this.eventBus?.emit(\`\${CONFIG.id}:mounted\`, { moduleId: MODULE_ID });
      emitUIAction(this.eventBus, { action: 'mount' });
      this.logger.info('Mounted successfully');
      this.tracker.track('mount', { success: true });
      
    } catch (error) {
      this._metrics.errorCount++;
      this.logger.error('Mount failed:', error);
      this.tracker.track('mount', { success: false, error: error.message });
      this.store.setState({ error: error.message });
    }
    
    return this;
  }

  async unmount() {
    if (!this._mounted) return this;
    
    try {
      this._abortController?.abort();
      this.detachEvents();
      await this.lifecycle.unmount();
      
      if (this.container) {
        this.container.innerHTML = '';
      }
      
      this._mounted = false;
      this._element = null;
      this.store.setState({ mounted: false });
      
      this.eventBus?.emit(\`\${CONFIG.id}:unmounted\`, { moduleId: MODULE_ID });
      this.logger.info('Unmounted');
      this.tracker.track('unmount', { success: true });
      
    } catch (error) {
      this.logger.error('Unmount failed:', error);
    }
    
    return this;
  }

  // === RENDER ===
  
  render() {
    this._element = document.createElement('div');
    this._element.className = \`enterprise-component \${CONFIG.id}\`;
    this._element.setAttribute('data-module-id', MODULE_ID);
    this._element.setAttribute('data-version', VERSION);
    
    this._element.innerHTML = \`
      <div class="panel-enterprise panel-\${CONFIG.id}">
        <div class="panel-enterprise__header">
          <h1 class="panel-enterprise__title">\${CONFIG.emoji} \${CONFIG.label}</h1>
          <span class="panel-enterprise__version">v\${VERSION}</span>
        </div>
        <div class="panel-enterprise__content">
          <p class="panel-enterprise__subtitle">Este módulo está em desenvolvimento</p>
          <p class="panel-enterprise__desc">Componente enterprise com arquitetura AAA completa.</p>
        </div>
        <div class="panel-enterprise__footer">
          <span class="panel-enterprise__status" data-status="ready">Ready</span>
        </div>
      </div>
    \`;
    
    this.container.innerHTML = '';
    this.container.appendChild(this._element);
  }

  // === EVENTS ===
  
  attachEvents() {
    // Subscriber para mudanças de estado
    this._unsubscribe = this.store.subscribe((state, prev) => {
      this._onStateChange(state, prev);
    });
  }

  detachEvents() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
  }

  _onStateChange(state, prev) {
    if (state.loading !== prev.loading) {
      this._updateLoadingUI(state.loading);
    }
    if (state.error !== prev.error && state.error) {
      this._showError(state.error);
    }
  }

  _updateLoadingUI(loading) {
    const statusEl = this._element?.querySelector('[data-status]');
    if (statusEl) {
      statusEl.setAttribute('data-status', loading ? 'loading' : 'ready');
      statusEl.textContent = loading ? 'Loading...' : 'Ready';
    }
  }

  _showError(error) {
    this.logger.error('Component error:', error);
  }

  // === PUBLIC API ===
  
  healthCheck() {
    const checks = {
      initialized: this._initialized,
      mounted: this._mounted,
      hasContainer: !!this.container,
      storeHealthy: this.store.healthCheck().status === 'healthy',
      lifecycleHealthy: this.lifecycle.healthCheck().status === 'healthy'
    };
    
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    
    return {
      status: passed === total ? 'healthy' : passed > total / 2 ? 'degraded' : 'unhealthy',
      score: passed,
      maxScore: total,
      scoreDisplay: \`\${passed}/\${total}\`,
      checks,
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: new Date().toISOString()
    };
  }

  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      config: this.config,
      mounted: this._mounted,
      initialized: this._initialized,
      metrics: this._metrics,
      state: this.store.getState(),
      healthCheck: this.healthCheck()
    };
  }

  getState() {
    return this.store.getState();
  }

  setDebug(enabled) {
    _debug = !!enabled;
    this._debug = !!enabled;
    this.logger.setLevel(enabled ? 'debug' : 'info');
  }

  getMetrics() {
    return { ...this._metrics };
  }

  resetMetrics() {
    this._metrics = { mountCount: 0, errorCount: 0, lastMountAt: null };
  }
}

// === FACTORY ===

export function create${NAME//-/}(options = {}) {
  return new ${NAME//-/}Component(options);
}

// === STANDALONE MOUNT FUNCTIONS ===

export function mount(container, config = {}) {
  const instance = new ${NAME//-/}Component({ container, config });
  instance.init();
  instance.mount(container);
  return { success: true, moduleId: MODULE_ID, instance };
}

export function unmount() {
  // Para unmount standalone, precisaria de referência global
  return { success: true, moduleId: MODULE_ID };
}

export default {
  ${NAME//-/}Component,
  create${NAME//-/},
  mount,
  unmount,
  MODULE_ID,
  VERSION
};
JSEOF

# ============================================================================
# 2. component.css - Estilos
# ============================================================================
cat > "$BASE_DIR/component.css" << CSSEOF
/* $TITLE - Enterprise AAA Styles */
/* @version $VERSION */

.panel-$NAME {
  padding: 2rem;
  font-family: var(--font-family-base, system-ui, sans-serif);
}

.panel-enterprise {
  background: var(--surface-primary, #ffffff);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  overflow: hidden;
}

.panel-enterprise__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-secondary, #f9fafb);
}

.panel-enterprise__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.panel-enterprise__version {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: var(--surface-tertiary, #e5e7eb);
  border-radius: var(--radius-full, 9999px);
  color: var(--text-secondary, #6b7280);
  font-family: var(--font-family-mono, monospace);
}

.panel-enterprise__content {
  padding: 2rem;
}

.panel-enterprise__subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary, #6b7280);
  margin: 0 0 1rem 0;
}

.panel-enterprise__desc {
  font-size: 0.875rem;
  color: var(--text-tertiary, #9ca3af);
  margin: 0;
}

.panel-enterprise__footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 2rem;
  border-top: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-secondary, #f9fafb);
}

.panel-enterprise__status {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full, 9999px);
  font-weight: 500;
}

.panel-enterprise__status[data-status="ready"] {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success, #16a34a);
}

.panel-enterprise__status[data-status="loading"] {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning, #d97706);
}

.panel-enterprise__status[data-status="error"] {
  background: var(--color-error-bg, #fee2e2);
  color: var(--color-error, #dc2626);
}
CSSEOF

# ============================================================================
# 3. schema.json - Configuração
# ============================================================================
cat > "$BASE_DIR/schema.json" << JSONEOF
{
  "id": "$NAME",
  "version": "$VERSION",
  "type": "$TYPE",
  "title": "$TITLE",
  "emoji": "$EMOJI",
  "moduleId": "$MODULE_ID",
  "created": "$TIMESTAMP",
  "enterprise": true,
  "aaa": true,
  "structure": {
    "accessibility": ["announce.js", "shortcuts.js"],
    "api": ["fetch.js", "health.js", "alerts.js"],
    "core": ["lifecycle.js", "circuit-breaker.js", "polling.js"],
    "state": ["store.js", "updaters.js", "validators.js"],
    "telemetry": ["logger.js", "tracker.js"],
    "ui": ["notifications.js", "ripple.js", "tooltips.js"],
    "utils": ["dom.js", "formatters.js", "helpers.js", "timers.js"]
  },
  "dependencies": [],
  "exports": ["mount", "unmount", "healthCheck", "info"]
}
JSONEOF

# ============================================================================
# 4. accessibility/announce.js
# ============================================================================
cat > "$BASE_DIR/accessibility/announce.js" << JSEOF
// $TITLE - Accessibility Announcer
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/accessibility/announce';

let _liveRegion = null;

export function announce(message, priority = 'polite') {
  if (!_liveRegion) {
    _liveRegion = document.createElement('div');
    _liveRegion.setAttribute('role', 'status');
    _liveRegion.setAttribute('aria-live', 'polite');
    _liveRegion.setAttribute('aria-atomic', 'true');
    _liveRegion.className = 'sr-only';
    _liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;';
    document.body.appendChild(_liveRegion);
  }
  
  _liveRegion.setAttribute('aria-live', priority);
  _liveRegion.textContent = '';
  setTimeout(() => { _liveRegion.textContent = message; }, 100);
}

export function announcePolite(message) { announce(message, 'polite'); }
export function announceAssertive(message) { announce(message, 'assertive'); }

export function healthCheck() {
  return { status: 'healthy', version: VERSION, moduleId: MODULE_ID, hasLiveRegion: !!_liveRegion };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() };
}

export default { announce, announcePolite, announceAssertive, healthCheck, info, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 5. accessibility/shortcuts.js
# ============================================================================
cat > "$BASE_DIR/accessibility/shortcuts.js" << JSEOF
// $TITLE - Keyboard Shortcuts
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/accessibility/shortcuts';

const _shortcuts = new Map();
let _enabled = true;

export function register(key, callback, description = '') {
  _shortcuts.set(key.toLowerCase(), { callback, description });
}

export function unregister(key) {
  _shortcuts.delete(key.toLowerCase());
}

export function handleKeydown(event) {
  if (!_enabled) return;
  
  const key = [];
  if (event.ctrlKey) key.push('ctrl');
  if (event.altKey) key.push('alt');
  if (event.shiftKey) key.push('shift');
  key.push(event.key.toLowerCase());
  
  const combo = key.join('+');
  const shortcut = _shortcuts.get(combo);
  
  if (shortcut) {
    event.preventDefault();
    shortcut.callback(event);
  }
}

export function enable() { _enabled = true; }
export function disable() { _enabled = false; }
export function isEnabled() { return _enabled; }
export function getShortcuts() { return Array.from(_shortcuts.entries()); }

export function healthCheck() {
  return { status: 'healthy', version: VERSION, moduleId: MODULE_ID, enabled: _enabled, shortcutCount: _shortcuts.size };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, enabled: _enabled, shortcuts: getShortcuts(), healthCheck: healthCheck() };
}

export default { register, unregister, handleKeydown, enable, disable, isEnabled, getShortcuts, healthCheck, info, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 6. api/fetch.js
# ============================================================================
cat > "$BASE_DIR/api/fetch.js" << JSEOF
// $TITLE - API Fetch
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/api/fetch';

const _config = {
  baseUrl: '',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000
};

let _metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };

export async function request(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || _config.timeout);
  
  _metrics.requestCount++;
  _metrics.lastRequestAt = Date.now();
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    
    _metrics.successCount++;
    return await response.json();
    
  } catch (error) {
    clearTimeout(timeout);
    _metrics.errorCount++;
    throw error;
  }
}

export async function get(url, options = {}) {
  return request(url, { ...options, method: 'GET' });
}

export async function post(url, data, options = {}) {
  return request(url, { ...options, method: 'POST', body: JSON.stringify(data) });
}

export function configure(config) {
  Object.assign(_config, config);
}

export function healthCheck() {
  return { status: 'healthy', version: VERSION, moduleId: MODULE_ID, config: _config, metrics: _metrics };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, config: _config, metrics: _metrics, healthCheck: healthCheck() };
}

export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null }; }

export default { request, get, post, configure, healthCheck, info, getMetrics, resetMetrics, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 7. api/health.js
# ============================================================================
cat > "$BASE_DIR/api/health.js" << JSEOF
// $TITLE - API Health Check
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/api/health';

let _lastCheck = null;
let _status = 'unknown';

export async function check(endpoint = '/api/health') {
  try {
    const start = Date.now();
    const response = await fetch(endpoint, { method: 'HEAD', cache: 'no-store' });
    const latency = Date.now() - start;
    
    _lastCheck = { timestamp: Date.now(), latency, status: response.ok ? 'healthy' : 'unhealthy' };
    _status = _lastCheck.status;
    
    return _lastCheck;
  } catch (error) {
    _lastCheck = { timestamp: Date.now(), latency: -1, status: 'error', error: error.message };
    _status = 'error';
    return _lastCheck;
  }
}

export function getLastCheck() { return _lastCheck; }
export function getStatus() { return _status; }

export function healthCheck() {
  return { status: _status, version: VERSION, moduleId: MODULE_ID, lastCheck: _lastCheck };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, status: _status, lastCheck: _lastCheck, healthCheck: healthCheck() };
}

export default { check, getLastCheck, getStatus, healthCheck, info, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 8. api/alerts.js
# ============================================================================
cat > "$BASE_DIR/api/alerts.js" << JSEOF
// $TITLE - API Alerts
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/api/alerts';

const _alerts = [];
let _maxAlerts = 100;

export function add(alert) {
  const entry = { id: Date.now(), timestamp: new Date().toISOString(), ...alert };
  _alerts.unshift(entry);
  if (_alerts.length > _maxAlerts) _alerts.pop();
  return entry;
}

export function remove(id) {
  const index = _alerts.findIndex(a => a.id === id);
  if (index > -1) return _alerts.splice(index, 1)[0];
  return null;
}

export function getAll() { return [..._alerts]; }
export function getByType(type) { return _alerts.filter(a => a.type === type); }
export function clear() { _alerts.length = 0; }
export function setMaxAlerts(max) { _maxAlerts = max; }

export function healthCheck() {
  return { status: 'healthy', version: VERSION, moduleId: MODULE_ID, alertCount: _alerts.length };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, alertCount: _alerts.length, maxAlerts: _maxAlerts, healthCheck: healthCheck() };
}

export default { add, remove, getAll, getByType, clear, setMaxAlerts, healthCheck, info, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 9. core/lifecycle.js
# ============================================================================
cat > "$BASE_DIR/core/lifecycle.js" << JSEOF
// $TITLE - Lifecycle Manager
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/core/lifecycle';

export class LifecycleManager {
  constructor(component) {
    this.component = component;
    this.state = 'unmounted';
    this.hooks = { beforeMount: [], mounted: [], beforeUnmount: [], unmounted: [] };
    this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null };
  }

  async mount() {
    this.state = 'mounting';
    await this._runHooks('beforeMount');
    this.state = 'mounted';
    await this._runHooks('mounted');
    this._metrics.mountCount++;
    this._metrics.lastTransitionAt = Date.now();
  }

  async unmount() {
    this.state = 'unmounting';
    await this._runHooks('beforeUnmount');
    this.state = 'unmounted';
    await this._runHooks('unmounted');
    this._metrics.unmountCount++;
    this._metrics.lastTransitionAt = Date.now();
  }

  async _runHooks(name) {
    for (const hook of this.hooks[name] || []) {
      try { await hook(this.component); }
      catch (e) { this._metrics.errorCount++; console.error(\`[\${MODULE_ID}] Hook \${name} error:\`, e); }
    }
  }

  onBeforeMount(h) { this.hooks.beforeMount.push(h); }
  onMounted(h) { this.hooks.mounted.push(h); }
  onBeforeUnmount(h) { this.hooks.beforeUnmount.push(h); }
  onUnmounted(h) { this.hooks.unmounted.push(h); }
  getState() { return this.state; }

  healthCheck() {
    const checks = { validState: ['unmounted', 'mounting', 'mounted', 'unmounting'].includes(this.state), hasComponent: !!this.component };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? 'healthy' : 'degraded', score: passed, maxScore: 2, checks, version: VERSION, moduleId: MODULE_ID };
  }

  info() { return { version: VERSION, moduleId: MODULE_ID, state: this.state, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { mountCount: 0, unmountCount: 0, errorCount: 0, lastTransitionAt: null }; }
}

export default LifecycleManager;
JSEOF

# ============================================================================
# 10. core/circuit-breaker.js
# ============================================================================
cat > "$BASE_DIR/core/circuit-breaker.js" << JSEOF
// $TITLE - Circuit Breaker
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/core/circuit-breaker';

export class CircuitBreaker {
  constructor(options = {}) {
    this.threshold = options.threshold || 5;
    this.timeout = options.timeout || 60000;
    this.state = 'closed';
    this.failures = 0;
    this.lastFailure = null;
    this.successCount = 0;
  }

  async execute(fn) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  _onSuccess() {
    this.failures = 0;
    this.successCount++;
    if (this.state === 'half-open') this.state = 'closed';
  }

  _onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) this.state = 'open';
  }

  reset() { this.state = 'closed'; this.failures = 0; this.lastFailure = null; }
  getState() { return this.state; }

  healthCheck() {
    return { status: this.state === 'closed' ? 'healthy' : 'degraded', state: this.state, failures: this.failures, version: VERSION, moduleId: MODULE_ID };
  }

  info() { return { version: VERSION, moduleId: MODULE_ID, state: this.state, failures: this.failures, threshold: this.threshold, successCount: this.successCount, healthCheck: this.healthCheck() }; }
}

export default CircuitBreaker;
JSEOF

# ============================================================================
# 11. core/polling.js
# ============================================================================
cat > "$BASE_DIR/core/polling.js" << JSEOF
// $TITLE - Polling Manager
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/core/polling';

export class PollingManager {
  constructor(options = {}) {
    this.interval = options.interval || 30000;
    this.callback = options.callback || (() => {});
    this._timer = null;
    this._running = false;
    this._metrics = { pollCount: 0, errorCount: 0, lastPollAt: null };
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._poll();
    this._timer = setInterval(() => this._poll(), this.interval);
  }

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._running = false;
  }

  async _poll() {
    this._metrics.pollCount++;
    this._metrics.lastPollAt = Date.now();
    try { await this.callback(); }
    catch (e) { this._metrics.errorCount++; console.error(\`[\${MODULE_ID}] Poll error:\`, e); }
  }

  setInterval(ms) { this.interval = ms; if (this._running) { this.stop(); this.start(); } }
  isRunning() { return this._running; }

  healthCheck() {
    return { status: 'healthy', running: this._running, version: VERSION, moduleId: MODULE_ID };
  }

  info() { return { version: VERSION, moduleId: MODULE_ID, running: this._running, interval: this.interval, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  getMetrics() { return { ...this._metrics }; }
}

export default PollingManager;
JSEOF

# ============================================================================
# 12. state/store.js
# ============================================================================
cat > "$BASE_DIR/state/store.js" << JSEOF
// $TITLE - State Store
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/state/store';

export class StateStore {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.subscribers = [];
    this._metrics = { updateCount: 0, notifyCount: 0, lastUpdateAt: null };
  }

  getState() { return { ...this.state }; }

  setState(updates) {
    const prev = this.getState();
    this.state = { ...this.state, ...updates };
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    this.subscribers.forEach(s => {
      try { s(this.state, prev); this._metrics.notifyCount++; }
      catch (e) { console.error(\`[\${MODULE_ID}] Subscriber error:\`, e); }
    });
  }

  subscribe(s) {
    this.subscribers.push(s);
    return () => { const i = this.subscribers.indexOf(s); if (i > -1) this.subscribers.splice(i, 1); };
  }

  reset(initialState = {}) { this.state = { ...initialState }; }

  healthCheck() {
    const checks = { hasState: !!this.state, subscribersReady: Array.isArray(this.subscribers) };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? 'healthy' : 'degraded', score: passed, maxScore: 2, checks, version: VERSION, moduleId: MODULE_ID };
  }

  info() { return { version: VERSION, moduleId: MODULE_ID, subscriberCount: this.subscribers.length, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  getMetrics() { return { ...this._metrics }; }
}

export default StateStore;
JSEOF

# ============================================================================
# 13. state/updaters.js
# ============================================================================
cat > "$BASE_DIR/state/updaters.js" << JSEOF
// $TITLE - State Updaters
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/state/updaters';

export function setLoading(store, loading) { store.setState({ loading }); }
export function setError(store, error) { store.setState({ error, loading: false }); }
export function setData(store, data) { store.setState({ data, loading: false, error: null }); }
export function clearError(store) { store.setState({ error: null }); }
export function reset(store) { store.setState({ loading: false, error: null, data: null }); }

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { setLoading, setError, setData, clearError, reset, healthCheck, info, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 14. state/validators.js
# ============================================================================
cat > "$BASE_DIR/state/validators.js" << JSEOF
// $TITLE - State Validators
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/state/validators';

export function isValidState(state) { return state !== null && typeof state === 'object'; }
export function hasRequiredFields(state, fields) { return fields.every(f => state.hasOwnProperty(f)); }
export function isLoading(state) { return state?.loading === true; }
export function hasError(state) { return !!state?.error; }
export function hasData(state) { return state?.data !== null && state?.data !== undefined; }

export function validate(state, rules = {}) {
  const errors = [];
  if (rules.required && !hasRequiredFields(state, rules.required)) errors.push('Missing required fields');
  if (rules.custom) { const customError = rules.custom(state); if (customError) errors.push(customError); }
  return { valid: errors.length === 0, errors };
}

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { isValidState, hasRequiredFields, isLoading, hasError, hasData, validate, healthCheck, info, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 15. telemetry/logger.js
# ============================================================================
cat > "$BASE_DIR/telemetry/logger.js" << JSEOF
// $TITLE - Logger
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/telemetry/logger';

export class Logger {
  constructor(options = {}) {
    this.prefix = options.prefix || '[$NAME]';
    this.level = options.level || 'info';
    this.enabled = options.enabled !== false;
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    this._metrics = { debugCount: 0, infoCount: 0, warnCount: 0, errorCount: 0, lastLogAt: null };
  }

  debug(...args) { this._log('debug', ...args); }
  info(...args) { this._log('info', ...args); }
  warn(...args) { this._log('warn', ...args); }
  error(...args) { this._log('error', ...args); }

  _log(level, ...args) {
    if (!this.enabled || this.levels[level] < this.levels[this.level]) return;
    console[level](this.prefix, ...args);
    this._metrics[\`\${level}Count\`]++;
    this._metrics.lastLogAt = Date.now();
  }

  setLevel(level) { if (this.levels[level] !== undefined) this.level = level; }
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }

  healthCheck() {
    const checks = { enabled: this.enabled, validLevel: this.levels[this.level] !== undefined };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? 'healthy' : 'degraded', checks, version: VERSION, moduleId: MODULE_ID };
  }

  info2() { return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, level: this.level, metrics: this._metrics, healthCheck: this.healthCheck() }; }
  getMetrics() { return { ...this._metrics }; }
}

export default Logger;
JSEOF

# ============================================================================
# 16. telemetry/tracker.js
# ============================================================================
cat > "$BASE_DIR/telemetry/tracker.js" << JSEOF
// $TITLE - Event Tracker
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/telemetry/tracker';

export class Tracker {
  constructor(options = {}) {
    this.moduleId = options.moduleId || '$MODULE_ID';
    this.enabled = options.enabled !== false;
    this._events = [];
    this._maxEvents = options.maxEvents || 1000;
  }

  track(event, data = {}) {
    if (!this.enabled) return;
    const entry = { event, data, moduleId: this.moduleId, timestamp: Date.now() };
    this._events.push(entry);
    if (this._events.length > this._maxEvents) this._events.shift();
    
    // Emit to global telemetry if available
    const eventBus = window.EventBusGlobal || window.EventBus;
    eventBus?.emit('telemetry:track', entry);
  }

  getEvents() { return [...this._events]; }
  getEventsByType(event) { return this._events.filter(e => e.event === event); }
  clear() { this._events.length = 0; }
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }

  healthCheck() { return { status: 'healthy', enabled: this.enabled, eventCount: this._events.length, version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, eventCount: this._events.length, healthCheck: this.healthCheck() }; }
}

export default Tracker;
JSEOF

# ============================================================================
# 17. ui/notifications.js
# ============================================================================
cat > "$BASE_DIR/ui/notifications.js" << JSEOF
// $TITLE - Notifications
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/ui/notifications';

let _container = null;

function _ensureContainer() {
  if (!_container) {
    _container = document.createElement('div');
    _container.className = 'notifications-container';
    _container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;';
    document.body.appendChild(_container);
  }
  return _container;
}

export function show(message, type = 'info', duration = 3000) {
  const container = _ensureContainer();
  const notification = document.createElement('div');
  notification.className = \`notification notification--\${type}\`;
  notification.textContent = message;
  notification.style.cssText = 'padding:0.75rem 1rem;border-radius:0.5rem;background:#333;color:#fff;font-size:0.875rem;animation:slideIn 0.3s ease;';
  
  container.appendChild(notification);
  
  if (duration > 0) {
    setTimeout(() => { notification.remove(); }, duration);
  }
  
  return notification;
}

export function success(message, duration) { return show(message, 'success', duration); }
export function error(message, duration) { return show(message, 'error', duration); }
export function warning(message, duration) { return show(message, 'warning', duration); }
export function info(message, duration) { return show(message, 'info', duration); }

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info2() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { show, success, error, warning, info, healthCheck, info: info2, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 18. ui/ripple.js
# ============================================================================
cat > "$BASE_DIR/ui/ripple.js" << JSEOF
// $TITLE - Ripple Effect
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/ui/ripple';

export function create(event, element) {
  const rect = element.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.cssText = \`position:absolute;width:\${size}px;height:\${size}px;left:\${x}px;top:\${y}px;background:rgba(255,255,255,0.3);border-radius:50%;transform:scale(0);animation:ripple 0.6s ease-out;\`;
  ripple.className = 'ripple-effect';
  
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

export function attach(element) {
  element.addEventListener('click', (e) => create(e, element));
}

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { create, attach, healthCheck, info, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 19. ui/tooltips.js
# ============================================================================
cat > "$BASE_DIR/ui/tooltips.js" << JSEOF
// $TITLE - Tooltips
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/ui/tooltips';

let _tooltip = null;

function _ensureTooltip() {
  if (!_tooltip) {
    _tooltip = document.createElement('div');
    _tooltip.className = 'tooltip';
    _tooltip.style.cssText = 'position:fixed;padding:0.5rem 0.75rem;background:#333;color:#fff;font-size:0.75rem;border-radius:0.25rem;z-index:10000;pointer-events:none;opacity:0;transition:opacity 0.2s;';
    document.body.appendChild(_tooltip);
  }
  return _tooltip;
}

export function show(element, text, position = 'top') {
  const tooltip = _ensureTooltip();
  tooltip.textContent = text;
  tooltip.style.opacity = '1';
  
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  let top, left;
  switch (position) {
    case 'bottom': top = rect.bottom + 8; left = rect.left + (rect.width - tooltipRect.width) / 2; break;
    case 'left': top = rect.top + (rect.height - tooltipRect.height) / 2; left = rect.left - tooltipRect.width - 8; break;
    case 'right': top = rect.top + (rect.height - tooltipRect.height) / 2; left = rect.right + 8; break;
    default: top = rect.top - tooltipRect.height - 8; left = rect.left + (rect.width - tooltipRect.width) / 2;
  }
  
  tooltip.style.top = \`\${top}px\`;
  tooltip.style.left = \`\${left}px\`;
}

export function hide() {
  if (_tooltip) _tooltip.style.opacity = '0';
}

export function attach(element, text, position) {
  element.addEventListener('mouseenter', () => show(element, text, position));
  element.addEventListener('mouseleave', hide);
}

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { show, hide, attach, healthCheck, info, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 20. utils/dom.js
# ============================================================================
cat > "$BASE_DIR/utils/dom.js" << JSEOF
// $TITLE - DOM Utilities
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/utils/dom';

export function qs(selector, context = document) { return context.querySelector(selector); }
export function qsa(selector, context = document) { return Array.from(context.querySelectorAll(selector)); }

export function create(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  });
  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  });
  return el;
}

export function remove(el) { el?.parentNode?.removeChild(el); }
export function empty(el) { if (el) el.innerHTML = ''; }
export function show(el) { if (el) el.style.display = ''; }
export function hide(el) { if (el) el.style.display = 'none'; }
export function toggle(el, visible) { if (el) el.style.display = visible ? '' : 'none'; }

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { qs, qsa, create, remove, empty, show, hide, toggle, healthCheck, info, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 21. utils/formatters.js
# ============================================================================
cat > "$BASE_DIR/utils/formatters.js" << JSEOF
// $TITLE - Formatters
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/utils/formatters';

export function date(d, locale = 'pt-BR') { return new Date(d).toLocaleDateString(locale); }
export function time(d, locale = 'pt-BR') { return new Date(d).toLocaleTimeString(locale); }
export function datetime(d, locale = 'pt-BR') { return new Date(d).toLocaleString(locale); }
export function relative(d) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return \`\${mins}m atrás\`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return \`\${hours}h atrás\`;
  const days = Math.floor(hours / 24);
  return \`\${days}d atrás\`;
}

export function number(n, locale = 'pt-BR') { return new Intl.NumberFormat(locale).format(n); }
export function currency(n, currency = 'BRL', locale = 'pt-BR') { return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n); }
export function percent(n, decimals = 0) { return \`\${(n * 100).toFixed(decimals)}%\`; }
export function bytes(n) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return \`\${n.toFixed(1)} \${units[i]}\`;
}

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { date, time, datetime, relative, number, currency, percent, bytes, healthCheck, info, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 22. utils/helpers.js
# ============================================================================
cat > "$BASE_DIR/utils/helpers.js" << JSEOF
// $TITLE - Helper Functions
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/utils/helpers';

export function uuid() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }); }
export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
export function clamp(n, min, max) { return Math.min(Math.max(n, min), max); }
export function pick(obj, keys) { return keys.reduce((r, k) => { if (k in obj) r[k] = obj[k]; return r; }, {}); }
export function omit(obj, keys) { return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k))); }
export function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
export function isEmpty(obj) { return obj == null || (typeof obj === 'object' && Object.keys(obj).length === 0); }
export function isEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
export function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
export function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { uuid, sleep, clamp, pick, omit, deepClone, isEmpty, isEqual, capitalize, slugify, healthCheck, info, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# 23. utils/timers.js
# ============================================================================
cat > "$BASE_DIR/utils/timers.js" << JSEOF
// $TITLE - Timer Utilities
// @version $VERSION
'use strict';

export const VERSION = '$VERSION';
export const MODULE_ID = '$MODULE_ID/utils/timers';

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

export function throttle(fn, limit = 300) {
  let inThrottle;
  return (...args) => { if (!inThrottle) { fn(...args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } };
}

export function delay(fn, ms) { return setTimeout(fn, ms); }
export function interval(fn, ms) { return setInterval(fn, ms); }
export function cancelDelay(id) { clearTimeout(id); }
export function cancelInterval(id) { clearInterval(id); }

export function retry(fn, retries = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      fn().then(resolve).catch(err => {
        if (n <= 1) reject(err);
        else setTimeout(() => attempt(n - 1), delay);
      });
    };
    attempt(retries);
  });
}

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { debounce, throttle, delay, interval, cancelDelay, cancelInterval, retry, healthCheck, info, VERSION, MODULE_ID };
JSEOF

# ============================================================================
# Criar arquivos de estilo adicionais
# ============================================================================
cat > "$BASE_DIR/styles/base.css" << CSSEOF
/* $TITLE - Base Styles */
/* @version $VERSION */
.panel-$NAME { box-sizing: border-box; }
.panel-$NAME *, .panel-$NAME *::before, .panel-$NAME *::after { box-sizing: inherit; }
CSSEOF

cat > "$BASE_DIR/styles/tokens.css" << CSSEOF
/* $TITLE - Design Tokens */
/* @version $VERSION */
.panel-$NAME {
  --component-spacing: 1rem;
  --component-radius: 0.5rem;
  --component-transition: 0.2s ease;
}
CSSEOF

cat > "$BASE_DIR/styles/states.css" << CSSEOF
/* $TITLE - State Styles */
/* @version $VERSION */
.panel-$NAME[data-loading="true"] { opacity: 0.7; pointer-events: none; }
.panel-$NAME[data-error="true"] { border-color: var(--color-error, #dc2626); }
CSSEOF

cat > "$BASE_DIR/styles/responsive.css" << CSSEOF
/* $TITLE - Responsive Styles */
/* @version $VERSION */
@media (max-width: 768px) {
  .panel-$NAME { padding: 1rem; }
  .panel-enterprise__header { padding: 1rem; }
  .panel-enterprise__content { padding: 1rem; }
}
CSSEOF

# ============================================================================
# Definir permissões
# ============================================================================
sudo chown -R www-data:www-data "$BASE_DIR"

# ============================================================================
# Validar
# ============================================================================
echo ""
echo "=== Componente criado com sucesso! ==="
echo "Diretório: $BASE_DIR"
echo ""
echo "=== Estrutura ==="
find "$BASE_DIR" -type f | sort

echo ""
echo "=== Contagem de arquivos ==="
find "$BASE_DIR" -type f | wc -l

echo ""
echo "=== Validar sintaxe ==="
node --check "$BASE_DIR/index.js" 2>/dev/null && echo "✅ index.js OK" || echo "❌ index.js ERRO"

