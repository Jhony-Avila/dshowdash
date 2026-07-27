// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-LED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-header
// PURPOSE: Container Header Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createHeader() — exported function
//   createHeaderWithStatus() — exported function
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

export const VERSION = '10.0.0-LED-FIX';
export const MODULE_ID = 'container-header';

const DEFAULT_CONFIG = {
  title: 'Container',
  icon: '',
  showStatus: true,
  showBadge: false,
  badgeCount: 0,
  collapsible: true,
  draggable: true,
  breadcrumb: null as Record<string, unknown> | null
};

export function createHeader(container: HTMLElement, config: Record<string, unknown> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let _headerEl: HTMLElement | null = null;
  let _titleEl: HTMLElement | null = null;
  let _statusEl: HTMLElement | null = null;
  let _badgeEl: HTMLElement | null = null;
  let _iconEl: HTMLElement | null = null;
  let _initialized = false;

  function _buildHeader() {
    _headerEl = document.createElement('div');
    _headerEl.className = 'dsd-container__header';
    if (cfg.draggable) {
      _headerEl.setAttribute('data-draggable', 'true');
    }

    // Left section (icon + status + title + badge)
    const leftSection = document.createElement('div');
    leftSection.className = 'dsd-container__header-left';

    // Icon
    if (cfg.icon) {
      _iconEl = document.createElement('span');
      (_iconEl as HTMLElement).className = 'dsd-container__icon';
      (_iconEl as HTMLElement).textContent = String(cfg.icon);
      leftSection.appendChild(_iconEl as Node);
    }

    // Status LED - CORRIGIDO: usar .dsd-container__status
    if (cfg.showStatus) {
      _statusEl = document.createElement('span');
      _statusEl.className = 'dsd-container__status';
      _statusEl.setAttribute('data-status', 'ready');
      _statusEl.setAttribute('aria-label', 'Status: pronto');
      leftSection.appendChild(_statusEl);
    }

    // Title
    _titleEl = document.createElement('span');
    (_titleEl as HTMLElement).className = 'dsd-container__title';
    (_titleEl as HTMLElement).textContent = String(cfg.title);
    leftSection.appendChild(_titleEl as Node);

    // Badge
    if (cfg.showBadge) {
      _badgeEl = document.createElement('span');
      (_badgeEl as HTMLElement).className = 'dsd-container__badge';
      (_badgeEl as HTMLElement).textContent = (cfg.badgeCount as number) > 99 ? '99+' : String(cfg.badgeCount);
      if (cfg.badgeCount === 0) {
        (_badgeEl as HTMLElement).style.display = 'none';
      }
      leftSection.appendChild(_badgeEl as Node);
    }

    _headerEl.appendChild(leftSection);

    // Breadcrumb (if provided)
    if (cfg.breadcrumb) {
      const breadcrumbEl = document.createElement('nav');
      breadcrumbEl.className = 'dsd-breadcrumb';
      breadcrumbEl.innerHTML = String(cfg.breadcrumb);
      _headerEl.appendChild(breadcrumbEl);
    }

    // Controls placeholder (will be populated by controls.js)
    const controlsSection = document.createElement('div');
    controlsSection.className = 'dsd-container__controls';
    _headerEl.appendChild(controlsSection);

    return _headerEl;
  }

  return {
    init() {
      if (_initialized) return this;
      
      _headerEl = _buildHeader();
      
      // Insert as first child
      if (container && container.firstChild) {
        container.insertBefore(_headerEl, container.firstChild);
      } else if (container) {
        container.appendChild(_headerEl);
      }
      
      _initialized = true;
      return this;
    },

    getElement() {
      return _headerEl;
    },

    getControlsContainer() {
      return _headerEl?.querySelector('.dsd-container__controls');
    },

    setTitle(title: string) {
      if (_titleEl) {
        (_titleEl as HTMLElement).textContent = title;
      }
      return this;
    },

    setIcon(icon: string) {
      if (_iconEl) {
        (_iconEl as HTMLElement).textContent = icon;
      }
      return this;
    },

    setStatus(status: string) {
      if (_statusEl) {
        _statusEl.setAttribute('data-status', status);
        const labels = {
          ready: 'Status: pronto',
          loading: 'Status: carregando',
          error: 'Status: erro',
          success: 'Status: sucesso',
          warning: 'Status: atenção',
          inactive: 'Status: inativo'
        };
        _statusEl.setAttribute('aria-label', (labels as Record<string, string>)[status] || `Status: ${status}`);
      }
      // Also update container data-state for gradient
      if (container) {
        container.setAttribute('data-state', status);
      }
      return this;
    },

    setBadge(count: number) {
      if (_badgeEl) {
        (_badgeEl as HTMLElement).textContent = count > 99 ? '99+' : String(count);
        (_badgeEl as HTMLElement).style.display = count > 0 ? '' : 'none';
      }
      return this;
    },

    setBreadcrumb(html: string) {
      let breadcrumbEl = _headerEl?.querySelector('.dsd-breadcrumb');
      if (!breadcrumbEl && html) {
        breadcrumbEl = document.createElement('nav');
        breadcrumbEl.className = 'dsd-breadcrumb';
        const controlsEl = _headerEl?.querySelector('.dsd-container__controls');
        if (controlsEl) {
          _headerEl!.insertBefore(breadcrumbEl, controlsEl);
        }
      }
      if (breadcrumbEl) {
        breadcrumbEl.innerHTML = html || '';
        (breadcrumbEl as HTMLElement).style.display = html ? '' : 'none';
      }
      return this;
    },

    destroy() {
      if (_headerEl && _headerEl.parentNode) {
        _headerEl.parentNode.removeChild(_headerEl);
      }
      _headerEl = null;
      _titleEl = null;
      _statusEl = null;
      _badgeEl = null;
      _iconEl = null;
      _initialized = false;
    },

    isInitialized() {
      return _initialized;
    },

    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        initialized: _initialized,
        hasStatus: !!_statusEl,
        hasBadge: !!_badgeEl
      };
    },

    healthCheck() {
      return {
        status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED',
        version: VERSION,
        moduleId: MODULE_ID
      };
    }
  };
}

// Factory for creating header with status LED correctly
export function createHeaderWithStatus(container: HTMLElement, title: string, options: Record<string, unknown> = {}) {
  return createHeader(container, {
    title,
    showStatus: true,
    ...options
  });
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID };
}

export default { createHeader, createHeaderWithStatus, info, healthCheck, VERSION, MODULE_ID };
