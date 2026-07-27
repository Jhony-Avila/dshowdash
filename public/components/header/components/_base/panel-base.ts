
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-base
// PURPOSE: Panel Base - Enterprise AAA Foundation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   COMPONENT_EVENTS from /core/runtime/events/catalog/component.events.js
//   navigateToRoute from ./navigation-helper.js
//
// PROVIDES:
//   VERSION — module constant
//   PanelBase() — exported function
//   createPanelClass() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const MODULE_ID = 'header.components._base.panel-base';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';
import { navigateToRoute } from './navigation-helper.js';

export const VERSION = '1.1.0-ES6';

function createPanelPorts(moduleId: string) {
  const Ports = createUiPorts({ moduleId });
  let initialized = false;
  
  return {
    init() {
      if (initialized) return;
      Ports.init();
      initialized = true;
    },
    get(name: string) {
      return Ports.get(name);
    },
    inject(p: Record<string,unknown>) {
      return Ports.inject(p);
    },
    snapshot() {
      return Ports.snapshot();
    },
    isInitialized() {
      return Ports.isInitialized();
    }
  };
}

function loadPanelCSS(panelId: string) {
  const cssPath = `/components/header/components/${panelId}/component.css`;
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);
  }
}

function createEmitter(ports: unknown, moduleId: string) {
  return (event: string, data: Record<string,unknown>) => {
    data = data || {};
    // @ts-expect-error TS migration - TS2339
    const bus = ports.get('eventBus');
    if (bus && bus.emit) {
      bus.emit(event, Object.assign({ source: moduleId, timestamp: Date.now() }, data));
    }
  };
}

export function PanelBase(this: any, config: Record<string,unknown>, options: Record<string,unknown>) {
  options = options || {};
  
  this._config = {
    id: config.id,
    label: config.label,
    route: config.route,
    icon: config.icon,
    moduleId: config.moduleId || `header/components/${config.id}`
  };
  
  this._ports = createPanelPorts(this._config.moduleId);
  this._emit = createEmitter(this._ports, this._config.moduleId);
  
  this.container = options.container || null;
  this.element = null;
  this._isMounted = false;
  this._isDestroyed = false;
  this._clickHandler = null;
  
  this._metrics = {
    mountCount: 0,
    unmountCount: 0,
    clickCount: 0,
    errorCount: 0,
    lastMountAt: null,
    lastClickAt: null
  };
  
  loadPanelCSS(this._config.id);
}

PanelBase.VERSION = VERSION;
PanelBase.id = 'panel-base';
PanelBase.capabilities = { type: 'panel', reorderable: true, hideable: true, critical: false, rendersUI: true };

PanelBase.prototype.mount = function(container: HTMLElement|null) {
  const self = this;
  
  if (this._isDestroyed) {
    this._metrics.errorCount++;
    return Promise.resolve(this);
  }
  
  if (this._isMounted) {
    return Promise.resolve(this);
  }
  
  try {
    this._ports.init();
    this.container = container || this.container;
    
    if (!this.container) {
      throw new Error('Container required');
    }
    
    this._render();
    this._attachEvents();
    
    this._isMounted = true;
    this._metrics.mountCount++;
    this._metrics.lastMountAt = Date.now();
    
    this._emit(COMPONENT_EVENTS.MOUNTED, {
      componentId: this._config.id,
      moduleId: this._config.moduleId
    });
    
    return Promise.resolve(this);
  } catch (error: any) {
    this._metrics.errorCount++;
    this._emit(COMPONENT_EVENTS.ERROR, {
      componentId: this._config.id,
      moduleId: this._config.moduleId,
      error: error.message
    });
    return Promise.reject(error);
  }
};

PanelBase.prototype._render = function() {
  this.element = document.createElement('button');
  this.element.type = 'button';
  this.element.className = `header-panel-trigger ${this._config.id}-trigger`;
  this.element.title = this._config.label;
  this.element.setAttribute('aria-label', `Abrir ${this._config.label}`);
  this.element.setAttribute('aria-haspopup', 'dialog');
  this.element.setAttribute('data-panel-trigger', this._config.id);
  this.element.setAttribute('data-uarps-trigger', `trigger:header:open-${this._config.id}`);
  this.element.innerHTML = `<img src="${this._config.icon}" alt="${this._config.label}" class="trigger-icon" loading="lazy" />`;
  this.container.appendChild(this.element);
};

PanelBase.prototype._attachEvents = function() {
  const self = this;
  
  if (!this.element) return;
  
  this._clickHandler = (e: Event) => {
    e.preventDefault();
    self._metrics.clickCount++;
    self._metrics.lastClickAt = Date.now();
    navigateToRoute(self._config.route, self._config.moduleId);
  };
  
  this.element.addEventListener('click', this._clickHandler);
};

PanelBase.prototype._detachEvents = function() {
  if (this.element && this._clickHandler) {
    this.element.removeEventListener('click', this._clickHandler);
    this._clickHandler = null;
  }
};

PanelBase.prototype.unmount = function() {
  if (!this._isMounted || this._isDestroyed) {
    return Promise.resolve(this);
  }
  
  this._detachEvents();
  
  if (this.element) {
    this.element.remove();
    this.element = null;
  }
  
  this._isMounted = false;
  this._metrics.unmountCount++;
  
  this._emit(COMPONENT_EVENTS.UNMOUNTED, {
    componentId: this._config.id,
    moduleId: this._config.moduleId
  });
  
  return Promise.resolve(this);
};

PanelBase.prototype.destroy = function() {
  if (this._isDestroyed) return;
  this.unmount();
  this._isDestroyed = true;
  this.container = null;
};

PanelBase.prototype.healthCheck = function() {
  const checks = {
    notDestroyed: !this._isDestroyed,
    isMounted: this._isMounted,
    hasElement: !!this.element,
    hasContainer: !!this.container,
    lowErrorRate: this._metrics.errorCount < 5,
    portsInitialized: this._ports.isInitialized()
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : passed >= 4 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    portsInitialized: this._ports.isInitialized(),
    version: this.constructor.VERSION || VERSION,
    moduleId: this._config.moduleId,
    timestamp: new Date().toISOString()
  };
};

PanelBase.prototype.info = function() {
  return {
    version: this.constructor.VERSION || VERSION,
    moduleId: this._config.moduleId,
    id: this._config.id,
    capabilities: this.constructor.capabilities || PanelBase.capabilities,
    config: Object.assign({}, this._config),
    mounted: this._isMounted,
    destroyed: this._isDestroyed,
    portsInitialized: this._ports.isInitialized(),
    metrics: Object.assign({}, this._metrics),
    healthCheck: this.healthCheck()
  };
};

PanelBase.prototype.getMetrics = function() { return Object.assign({}, this._metrics); };
PanelBase.prototype.isMounted = function() { return this._isMounted; };
PanelBase.prototype.isDestroyed = function() { return this._isDestroyed; };
PanelBase.prototype.getElement = function() { return this.element; };
PanelBase.prototype.getConfig = function() { return Object.assign({}, this._config); };

PanelBase.prototype.injectPorts = function(p: Record<string,unknown>) { return this._ports.inject(p); };
PanelBase.prototype.getPorts = function() { return this._ports.snapshot(); };

export function createPanelClass(config: Record<string,unknown>) {
  const panelConfig = {
    id: config.id,
    label: config.label,
    route: config.route,
    icon: config.icon,
    moduleId: config.moduleId || `header/components/${config.id}`
  };
  
  function PanelComponent(this: any, options: Record<string,unknown>) {
    PanelBase.call(this, panelConfig, options);
  }
  
  PanelComponent.prototype = Object.create(PanelBase.prototype);
  PanelComponent.prototype.constructor = PanelComponent;
  
  PanelComponent.VERSION = config.version || VERSION;
  PanelComponent.id = config.id;
  PanelComponent.capabilities = config.capabilities || PanelBase.capabilities;
  
  return PanelComponent;
}

export default {
  VERSION,
  PanelBase,
  createPanelClass,
  loadPanelCSS
};
