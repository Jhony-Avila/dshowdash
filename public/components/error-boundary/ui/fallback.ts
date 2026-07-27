// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.error-boundary.ui.fallback
// PURPOSE: Error fallback UI with modal display and user actions
// ───────────────────────────────────────────────────────────────
// @contract SHOW - show(context) displays error fallback UI
// @contract HIDE - hide() hides fallback UI
// @contract IS_VISIBLE - isVisible() returns visibility status
// @contract CONFIGURE - configure(options) configures fallback settings
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: errorStore from ../state/store.js
// IMPORTS: trackErrorEvent from ../telemetry/tracker.js
// IMPORTS: formatErrorForDisplay, isRecoverable from ../utils/helpers.js
// PROVIDES: FallbackUI, injectPorts, getPorts, healthCheck, info,
//           VERSION, MODULE_ID
// @changelog v3.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header,
//            added ports support
// @changelog v3.3.0-P14-TAGGED: Caractere unicode ⚠️ substituído por SVG enterprise
// @changelog CONTRACT_OK_P14: OwnerRecovery — reload action (owner=error-boundary-fallback)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { errorStore } from '../state/store.js';
import { trackErrorEvent } from '../telemetry/tracker.js';
import { formatErrorForDisplay, isRecoverable } from '../utils/helpers.js';

export const VERSION = '3.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.error-boundary.ui.fallback';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => Ports.init();
const _getPort = (name: string): unknown => Ports.get(name);

export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const FB_SVGS = {
  warning: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};

const CONFIG = {
  containerId: 'error-boundary-fallback',
  showStackInProduction: false,
  stylesInjected: false
};

interface FallbackContext {
  title: string;
  message: string;
  timestamp: string;
  code: string | number | null;
  severity: string | null;
  route: string | null;
  panel: string | null;
  canReload: boolean;
  canShowDetails: boolean;
  canDismiss: boolean;
}

let _visible = false;
let _currentContext: FallbackContext | null = null;

function _injectStyles(): void {
  if (CONFIG.stylesInjected || typeof document === 'undefined') return;

  const linkId = 'error-boundary-styles';
  if (document.getElementById(linkId)) {
    CONFIG.stylesInjected = true;
    return;
  }

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = '/components/error-boundary/styles.css';
  document.head.appendChild(link);
  CONFIG.stylesInjected = true;
}

export const FallbackUI = {
  show(context: { error?: Record<string, unknown>; skipIfRecoverable?: boolean; title?: string; message?: string; code?: string; severity?: string; route?: string; panel?: string; canReload?: boolean; canShowDetails?: boolean; canDismiss?: boolean } = {}): boolean {
    if (typeof document === 'undefined') return false;

    _injectStyles();

    if (context.error && isRecoverable(context.error) && context.skipIfRecoverable) {
      trackErrorEvent('error:fallback:skipped-recoverable');
      return false;
    }

    let container = document.getElementById(CONFIG.containerId);
    if (!container) container = this._createContainer();

    const errorInfo = context.error
      ? formatErrorForDisplay(context.error)
      : {
          title: context.title || 'Application Error',
          message: context.message || 'Something went wrong. Please try refreshing the page.',
          timestamp: new Date().toLocaleString(),
          code: context.code || null,
          severity: context.severity || 'error',
          route: context.route || null,
          panel: context.panel || null,
          actionable: context.canReload !== false
        };

    _currentContext = {
      title: errorInfo.title as string,
      message: errorInfo.message as string,
      timestamp: errorInfo.timestamp as string,
      code: (errorInfo.code as string | number | null) ?? null,
      severity: (errorInfo.severity as string) || null,
      route: (errorInfo.route as string) || null,
      panel: (errorInfo.panel as string) || null,
      canReload: context.canReload !== false,
      canShowDetails: context.canShowDetails !== false,
      canDismiss: context.canDismiss !== false
    };

    container.innerHTML = this._getTemplate(_currentContext);
    container.setAttribute('data-visible', 'true');
    container.style.display = 'flex';
    _visible = true;

    this._attachEventListeners(container);

    trackErrorEvent('error:fallback:shown', {
      severity: errorInfo.severity,
      route: errorInfo.route,
      panel: errorInfo.panel
    });

    return true;
  },

  hide(): boolean {
    if (typeof document === 'undefined') return false;

    const container = document.getElementById(CONFIG.containerId);
    if (container) {
      container.setAttribute('data-visible', 'false');
      container.style.display = 'none';
      _visible = false;
      _currentContext = null;
      trackErrorEvent('error:fallback:hidden');
      return true;
    }

    return false;
  },

  isVisible(): boolean {
    return _visible;
  },

  _createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = CONFIG.containerId;
    container.className = 'error-boundary-fallback';
    container.setAttribute('role', 'alertdialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-labelledby', 'eb-fallback-title');
    container.setAttribute('aria-describedby', 'eb-fallback-message');
    document.body.appendChild(container);
    return container;
  },

  _getTemplate(ctx: FallbackContext): string {
    const lastError = errorStore.getLastError();
    const detailsJson = lastError ? JSON.stringify(lastError, null, 2) : '{}';

    return `<div class="error-fallback-content">
      <div class="error-fallback-icon" aria-hidden="true">${FB_SVGS.warning}</div>
      <h2 id="eb-fallback-title" class="error-fallback-title">${this._escapeHtml(ctx.title)}</h2>
      <p id="eb-fallback-message" class="error-fallback-message">${this._escapeHtml(ctx.message)}</p>
      ${ctx.code ? `<p class="error-fallback-code">Code: ${this._escapeHtml(String(ctx.code))}</p>` : ''}
      ${ctx.route ? `<p class="error-fallback-route">Route: ${this._escapeHtml(ctx.route)}</p>` : ''}
      ${ctx.panel ? `<p class="error-fallback-panel">Panel: ${this._escapeHtml(ctx.panel)}</p>` : ''}
      <p class="error-fallback-timestamp">${ctx.timestamp}</p>
      <div class="error-fallback-actions">
        ${ctx.canReload ? '<button class="error-fallback-btn primary" data-action="reload">Recarregar Página</button>' : ''}
        ${ctx.canShowDetails ? '<button class="error-fallback-btn secondary" data-action="details">Ver Detalhes</button>' : ''}
        ${ctx.canDismiss ? '<button class="error-fallback-btn tertiary" data-action="dismiss">Continuar</button>' : ''}
      </div>
      <div class="error-fallback-details" data-expanded="false">
        <pre>${this._escapeHtml(detailsJson)}</pre>
      </div>
    </div>`;
  },

  _escapeHtml(str: string): string {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  _attachEventListeners(container: HTMLElement): void {
    const self = this;

    const handler = (e: MouseEvent): void => {
      const target = e.target as HTMLElement;
      const action = target.dataset ? target.dataset.action : null;
      if (!action) return;

      if (action === 'reload') {
        trackErrorEvent('error:fallback:action:reload');
        window.location.reload();
      } else if (action === 'details') {
        const details = container.querySelector('.error-fallback-details');
        if (details) {
          const isExpanded = details.getAttribute('data-expanded') === 'true';
          details.setAttribute('data-expanded', String(!isExpanded));
          trackErrorEvent('error:fallback:action:details', { shown: !isExpanded });
        }
      } else if (action === 'dismiss') {
        self.hide();
        errorStore.setFatalError(false);
        trackErrorEvent('error:fallback:action:dismiss');
      }
    };

    container.onclick = handler;
  },

  configure(options: { containerId?: string; showStackInProduction?: boolean } = {}) {
    if (options.containerId) CONFIG.containerId = options.containerId;
    if (typeof options.showStackInProduction === 'boolean') {
      CONFIG.showStackInProduction = options.showStackInProduction;
    }

    return {
      containerId: CONFIG.containerId,
      showStackInProduction: CONFIG.showStackInProduction,
      stylesInjected: CONFIG.stylesInjected
    };
  },

  healthCheck() {
    const portsSnapshot = Ports.snapshot();

    const checks = {
      documentAvailable: typeof document !== 'undefined',
      stylesInjected: CONFIG.stylesInjected,
      notVisible: !_visible,
      portsInitialized: portsSnapshot._initialized
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const issues = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);

    return {
      status: passed === total ? 'HEALTHY' : 'DEGRADED',
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      issues: issues.length > 0 ? issues : null,
      visible: _visible,
      version: VERSION,
      moduleId: MODULE_ID,
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },

  info() {
    const portsSnapshot = Ports.snapshot();

    return {
      moduleId: MODULE_ID,
      version: VERSION,
      visible: _visible,
      currentContext: _currentContext,
      config: {
        containerId: CONFIG.containerId,
        showStackInProduction: CONFIG.showStackInProduction,
        stylesInjected: CONFIG.stylesInjected
      },
      healthCheck: this.healthCheck(),
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },

  injectPorts,
  getPorts
};

export function healthCheck() {
  return FallbackUI.healthCheck();
}

export function info() {
  return FallbackUI.info();
}

export default FallbackUI;
