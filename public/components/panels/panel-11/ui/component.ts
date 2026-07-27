// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: component
// PURPOSE: Panel-11 UIComponent - Resumo Geral Enterprise Modular
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   hashData from ./helpers.js
//   renderSkeleton from ./render/skeleton.js
//   renderConsole, renderError from ./render/index.js
//   bindEvents from ./events.js
//   DrawerComponent from ./drawer.js
//   ToastComponent from ./toast.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID } from './constants.js';
import { hashData } from './helpers.js';
import { renderSkeleton } from './render/skeleton.js';

// @ts-expect-error TS migration - TS2614
import { renderConsole, renderError } from './render/index.js';
import { bindEvents, unbindEvents } from './events.js';
import { DrawerComponent } from './drawer.js';
import { ToastComponent } from './toast.js';

export { VERSION, MODULE_ID };

export class UIComponent {
  [key: string]: any;
  constructor(container: HTMLElement, logger: Record<string, unknown>) {
    this.container = container;
    this.logger = logger || console;
    this.mounted = false;
    this.hasData = false;
    this._lastDataHash = null;
    this._data = null;
    this._isLoading = true;
    
    // State
    this._state = {
      exportMenuOpen: false,
      autoRefreshEnabled: true,
      countdownValue: 60
    };
    
    // Filters
    this._filters = {
      period: '30d',
      status: null
    };
    
    // Sub-components
    this.drawer = null;
    this.toast = null;
  }

  async init() {
    if (!this.container) {
      this.logger?.error?.('ui.no-container');
      return;
    }
    
    // Init sub-components
    this.drawer = new (DrawerComponent as unknown as new (logger: Record<string, unknown>) => Record<string, unknown>)(this.logger);
    this.drawer.init();
    
    this.toast = new ToastComponent(this.logger);
    this.toast.init();
    
    this.container.innerHTML = renderSkeleton();
    this.mounted = true;
    this.logger?.debug?.('ui.init', { version: VERSION });
  }

  showLoading() {
    if (this.hasData) return;
    this._isLoading = true;
  }

  hideLoading() {
    this._isLoading = false;
  }

  showError(message: string) {
    if (this.hasData) return;
    this.container.innerHTML = renderError(message);
    this._bindEvents();
  }

  update(payload: Record<string, unknown>) {
    if (!this.container) return;
    
    const newHash = hashData(payload);
    if (newHash === this._lastDataHash && this.hasData) return;
    this._lastDataHash = newHash;

    try {
      this._data = payload?.data || payload || {};
      this._isLoading = false;
      this._render();
      this.hasData = true;
      
      if (this.toast && this.hasData) {
        this.toast.success('Dados atualizados com sucesso');
      }
    } catch (error: any) {
      this.logger?.error?.('ui.update.error', { error: error.message });
      this.showError('Erro ao processar dados');
    }
  }

  _render() {
    this.container.innerHTML = renderConsole(this._data, this._filters, this._state);
    this._bindEvents();
  }

  _bindEvents() {
    const handlers = {
      closeExportMenu: () => {
        const dropdown = this.container.querySelector('[data-dropdown="export"]');
        if (dropdown) {
          dropdown.style.display = 'none';
          this._state.exportMenuOpen = false;
        }
      }
    };

    bindEvents(this.container, {
      data: this._data,
      filters: this._filters,
      toast: this.toast,
      drawer: this.drawer,
      ...this._state
    }, handlers);
  }

  healthCheck() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      mounted: this.mounted,
      hasData: this.hasData
    };
  }

  info() {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      features: ['modular-architecture', 'filters', 'drawer', 'toast', 'export-csv-json', 'auto-refresh', 'trend-chart', 'kpis', 'donut-chart'],
      mounted: this.mounted,
      hasData: this.hasData,
      filters: { ...this._filters },
      autoRefresh: this._state.autoRefreshEnabled
    };
  }
  
  async destroy() {
    unbindEvents();
    this.drawer?.destroy();
    this.toast?.destroy();
    if (this.container) this.container.innerHTML = '';
    this.mounted = false;
    this.hasData = false;
    this._data = null;
    this.logger?.debug?.('ui.destroy');
  }
}

export default UIComponent;
