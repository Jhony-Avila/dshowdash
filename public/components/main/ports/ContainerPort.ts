

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.7.0-LED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-port
// PURPOSE: ContainerPort - Port for container operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createContainerPort() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '2.7.0-LED-GRADIENT';
export const MODULE_ID = 'container-port';

interface ContainerConfig {
  id?: string;
  variant?: string;
  title?: string;
  layoutPolicy?: { mode?: string; [key: string]: unknown };
  [key: string]: unknown;
}

interface ContainerStructure {
  rootEl: HTMLDivElement;
  headerEl: HTMLDivElement;
  bodyEl: HTMLDivElement;
  contentEl: HTMLDivElement;
  statusEl: HTMLSpanElement;
  titleEl: HTMLSpanElement;
  controlsEl: HTMLDivElement;
}

interface ContainerEntry {
  id: string;
  config: ContainerConfig;
  rootEl: HTMLDivElement;
  headerEl: HTMLDivElement;
  bodyEl: HTMLDivElement;
  contentEl: HTMLDivElement;
  statusEl: HTMLSpanElement;
  titleEl: HTMLSpanElement;
  controlsEl: HTMLDivElement;
  controls: unknown;
  enhancements: unknown;
  setTitle(title: string): ContainerEntry;
  setStatus(status: string): ContainerEntry;
  setContent(html: string): ContainerEntry;
  appendContent(element: HTMLElement): ContainerEntry;
  clearContent(): ContainerEntry;
  show(): ContainerEntry;
  hide(): ContainerEntry;
  destroy(): void;
}

interface ContainerAdapterParam {
  create?(container: ContainerEntry): void;
  [key: string]: unknown;
}

export function createContainerPort(adapter: ContainerAdapterParam | null) {
  const _containers = new Map<string, ContainerEntry>();
  let _primaryId: string | null = null;
  
  function _generateId() {
    return `container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function _createContainerStructure(config: ContainerConfig): ContainerStructure {
    const rootEl = document.createElement('div');
    rootEl.className = 'dsd-container';
    // @ts-expect-error strict migration — TS2345
    rootEl.setAttribute('data-container-id', config.id);
    rootEl.setAttribute('data-variant', config.variant || 'default');
    rootEl.setAttribute('data-state', 'ready');
    rootEl.setAttribute('tabindex', '0');
    rootEl.setAttribute('role', 'region');
    rootEl.setAttribute('aria-label', config.title || 'Container');

    // Header with LED status
    const headerEl = document.createElement('div');
    headerEl.className = 'dsd-container__header';
    headerEl.setAttribute('data-draggable', 'true');
    
    // Header left section
    const headerLeft = document.createElement('div');
    headerLeft.className = 'dsd-container__header-left';
    
    // Status LED - IMPORTANTE para indicador visual
    const statusEl = document.createElement('span');
    statusEl.className = 'dsd-container__status';
    statusEl.setAttribute('data-status', 'ready');
    statusEl.setAttribute('aria-label', 'Status: pronto');
    headerLeft.appendChild(statusEl);
    
    // Title
    const titleEl = document.createElement('span');
    titleEl.className = 'dsd-container__title';
    titleEl.textContent = config.title || 'Container';
    headerLeft.appendChild(titleEl);
    
    headerEl.appendChild(headerLeft);
    
    // Controls container (populated by controls.js)
    const controlsEl = document.createElement('div');
    controlsEl.className = 'dsd-container__controls';
    headerEl.appendChild(controlsEl);
    
    rootEl.appendChild(headerEl);

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'dsd-container__body';
    
    // Content area
    const contentEl = document.createElement('div');
    contentEl.className = 'dsd-container__content';
    contentEl.setAttribute('data-state', 'ready');
    bodyEl.appendChild(contentEl);
    
    rootEl.appendChild(bodyEl);

    return {
      rootEl,
      headerEl,
      bodyEl,
      contentEl,
      statusEl,
      titleEl,
      controlsEl
    };
  }
  
  return {
    create(config: ContainerConfig) {
      config = config || {};
      const id = config.id || _generateId();
      
      if (_containers.has(id)) {
        return _containers.get(id);
      }
      
      const structure = _createContainerStructure(Object.assign({ id }, config));
      
      const container = {
        id,
        config,
        rootEl: structure.rootEl,
        headerEl: structure.headerEl,
        bodyEl: structure.bodyEl,
        contentEl: structure.contentEl,
        statusEl: structure.statusEl,
        titleEl: structure.titleEl,
        controlsEl: structure.controlsEl,
        controls: null as unknown,
        enhancements: null as unknown,

        setTitle(title: string) {
          if (structure.titleEl) {
            structure.titleEl.textContent = title;
          }
          return this;
        },
        
        setStatus(status: string) {
          if (structure.statusEl) {
            structure.statusEl.setAttribute('data-status', status);
          }
          if (structure.rootEl) {
            structure.rootEl.setAttribute('data-state', status);
          }
          return this;
        },
        
        setContent(html: string) {
          if (structure.contentEl) {
            structure.contentEl.innerHTML = html;
          }
          return this;
        },
        
        appendContent(element: HTMLElement) {
          if (structure.contentEl && element) {
            structure.contentEl.appendChild(element);
          }
          return this;
        },
        
        clearContent() {
          if (structure.contentEl) {
            structure.contentEl.innerHTML = '';
          }
          return this;
        },
        
        show() {
          if (structure.rootEl) {
            structure.rootEl.style.display = '';
          }
          return this;
        },
        
        hide() {
          if (structure.rootEl) {
            structure.rootEl.style.display = 'none';
          }
          return this;
        },
        
        destroy() {
          if (structure.rootEl && structure.rootEl.parentNode) {
            structure.rootEl.parentNode.removeChild(structure.rootEl);
          }
          _containers.delete(id);
        }
      };
      
      _containers.set(id, container);
      
      if (adapter && adapter.create) {
        adapter.create(container);
      }
      
      return container;
    },
    
    get(id: string) {
      return _containers.get(id) || null;
    },
    
    getOrCreate(config: ContainerConfig) {
      config = config || {};
      const id = config.id || 'default';
      
      if (_containers.has(id)) {
        return _containers.get(id);
      }
      
      const container = this.create(config);
      
      if (config.id === 'primary' || id === 'primary') {
        _primaryId = id;
      }
      
      return container;
    },
    
    getPrimary() {
      if (_primaryId && _containers.has(_primaryId)) {
        return _containers.get(_primaryId);
      }
      return null;
    },
    
    setPrimary(id: string) {
      if (_containers.has(id)) {
        _primaryId = id;
        return true;
      }
      return false;
    },
    
    resolvePrimaryHandle() {
      const primary = this.getPrimary();
      if (!primary) return null;
      
      return {
        containerId: primary.id,
        rootEl: primary.rootEl,
        contentEl: primary.contentEl,
        mode: primary.config.layoutPolicy?.mode || 'default',
        setContent: primary.setContent.bind(primary),
        appendContent: primary.appendContent.bind(primary),
        clearContent: primary.clearContent.bind(primary),
        setStatus: primary.setStatus.bind(primary),
        setTitle: primary.setTitle.bind(primary)
      };
    },
    
    destroy(id: string) {
      const container = _containers.get(id);
      if (container) {
        container.destroy();
        return true;
      }
      return false;
    },
    
    destroyAll() {
      _containers.forEach(container => {
        container.destroy();
      });
      _containers.clear();
      _primaryId = null;
    },
    
    list() {
      return Array.from(_containers.keys());
    },
    
    count() {
      return _containers.size;
    },
    
    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        containerCount: _containers.size,
        primaryId: _primaryId,
        containers: Array.from(_containers.keys())
      };
    },
    
    healthCheck() {
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        containerCount: _containers.size,
        hasPrimary: !!_primaryId
      };
    }
  };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID };
}

export default { createContainerPort, info, healthCheck, VERSION, MODULE_ID };
