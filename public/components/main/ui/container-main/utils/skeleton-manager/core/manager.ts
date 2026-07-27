
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: manager
// PURPOSE: Skeleton Manager - Core Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, SKELETON_TYPES, DELAY_VARIANTS from ../constants.js
//   SKELETON_TEMPLATES, generateSkeletonHTML from ../templates/skeleton-templates.js
//   PANEL_TYPE_MAP, getTypeForPanel from ../mappings/panel-map.js
//   createLogger from ../../logger.js
//
// PROVIDES:
//   createSkeletonManager() — exported function
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

import { VERSION, MODULE_ID, SKELETON_TYPES, DELAY_VARIANTS } from '../constants.js';
import { SKELETON_TEMPLATES, generateSkeletonHTML } from '../templates/skeleton-templates.js';
import { PANEL_TYPE_MAP, getTypeForPanel } from '../mappings/panel-map.js';
import { createLogger } from '../../logger.js';

// ============================================================================
// MANAGER FACTORY
// ============================================================================

/**
 * Cria o gerenciador de skeletons
 * @param {Object} options
 * @returns {Object}
 */
export function createSkeletonManager(options: Record<string, unknown>) {
  options = options || {};
  
  const defaultType = options.defaultType || SKELETON_TYPES.GENERIC;
  const defaultDelay = options.defaultDelay || DELAY_VARIANTS.NORMAL;
  const customTemplates = options.customTemplates || {};
  const customPanelMap = options.panelTypeMap || {};
  
  const _logger: ReturnType<typeof createLogger> = createLogger(MODULE_ID);
  const _templates = Object.assign({}, SKELETON_TEMPLATES, customTemplates);
  const _panelMap = Object.assign({}, PANEL_TYPE_MAP, customPanelMap);
  const _activeSkeletons = new Map();
  const _listeners: Array<(...args: unknown[]) => void> = [];
  
  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================
  
  function _notifyListeners(event: string, data: Record<string, unknown>) {
    for (let i = 0; i < _listeners.length; i++) {
      try {
        const payload = Object.assign({ event, timestamp: Date.now() }, data);
        _listeners[i](payload);
      } catch (e) {
        // @ts-expect-error strict migration — TS2345
        _logger.warn('Listener error:', e);
      }
    }
  }
  
  function _applyDelayClass(element: HTMLElement, delay: number) {
    element.classList.remove('dsd-container__skeleton--instant', 'dsd-container__skeleton--slow');
    
    // @ts-expect-error TS migration - TS2367
    if (delay === DELAY_VARIANTS.INSTANT) {
      element.classList.add('dsd-container__skeleton--instant');
    // @ts-expect-error TS migration - TS2367
    } else if (delay === DELAY_VARIANTS.SLOW) {
      element.classList.add('dsd-container__skeleton--slow');
    }
  }
  
  function _generateId() {
    return `skeleton-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // ============================================================================
  // MANAGER OBJECT
  // ============================================================================
  
  const manager = {
    // Mostra skeleton em um container
    show(container: HTMLElement, options: Record<string, unknown>) {
      options = options || {};
      
      if (!container) {
        _logger.warn('No container provided');
        return null;
      }
      
      const type = options.type || defaultType;
      const panelId = options.panelId || null;
      const delay = options.delay || defaultDelay;
      const params = options.params || {};
      const replace = options.replace !== false;
      
      // Determina tipo final
      const finalType = panelId ? getTypeForPanel((panelId as string), _panelMap, defaultType) : type;
      
      // Gera HTML
      const html = generateSkeletonHTML((finalType as string), (params as Record<string, unknown>), _templates);
      
      // Cria elemento
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html.trim();
      const skeleton = wrapper.firstElementChild;
      
      // Aplica delay
      // @ts-expect-error TS migration - TS2345
      _applyDelayClass(skeleton, delay);
      
      // Adiciona identificador
      const skeletonId = _generateId();
      skeleton!.setAttribute('data-skeleton-id', skeletonId);
      skeleton!.setAttribute('data-skeleton-type', (finalType as string));
      
      // Insere no container
      if (replace) {
        container.innerHTML = '';
      }
      // @ts-expect-error strict migration — TS2345
      container.appendChild(skeleton);
      
      // Registra skeleton ativo
      _activeSkeletons.set(skeletonId, {
        element: skeleton,
        container,
        type: finalType,
        panelId,
        createdAt: Date.now()
      });
      
      _logger.debug(`Skeleton shown: ${finalType}`, { skeletonId, panelId });
      _notifyListeners('shown', { skeletonId, type: finalType, panelId });
      
      return skeletonId;
    },
    
    // Mostra skeleton contextual baseado no painel
    showForPanel(container: HTMLElement, panelId: string, options: Record<string, unknown>) {
      options = options || {};
      options.panelId = panelId;
      options.type = getTypeForPanel(panelId, _panelMap, defaultType);
      return this.show(container, options);
    },
    
    // Oculta skeleton
    hide(skeletonIdOrContainer: unknown, options: Record<string, unknown>) {
      options = options || {};
      const animate = options.animate !== false;
      const delay = options.delay || 0;
      
      let skeleton = null;
      let skeletonId = null;
      
      // Encontra skeleton
      if (typeof skeletonIdOrContainer === 'string') {
        skeletonId = skeletonIdOrContainer;
        const record = _activeSkeletons.get(skeletonId);
        skeleton = record ? record.element : null;
      } else if (skeletonIdOrContainer instanceof HTMLElement) {
        skeleton = skeletonIdOrContainer.querySelector('[data-skeleton-id]');
        skeletonId = skeleton ? skeleton.getAttribute('data-skeleton-id') : null;
      }
      
      if (!skeleton) {
        _logger.debug('No skeleton found to hide');
        return false;
      }
      
      const doHide = () => {
        if (animate) {
          skeleton.style.transition = 'opacity 0.2s ease-out';
          skeleton.style.opacity = '0';
          
          setTimeout(() => {
            skeleton.remove();
            _activeSkeletons.delete(skeletonId);
            _notifyListeners('hidden', { skeletonId });
          }, 200);
        } else {
          skeleton.remove();
          _activeSkeletons.delete(skeletonId);
          _notifyListeners('hidden', { skeletonId });
        }
        
        _logger.debug(`Skeleton hidden: ${skeletonId}`);
      };
      
      if ((delay as number) > 0) {
        // @ts-expect-error TS migration - TS2769
        setTimeout(doHide, delay);
      } else {
        doHide();
      }
      
      return true;
    },
    
    // Oculta todos os skeletons
    hideAll(options: Record<string, unknown>) {
      options = options || {};
      const animate = options.animate !== false;
      const self = this;
      
      _activeSkeletons.forEach((data, skeletonId) => {
        self.hide(skeletonId, { animate });
      });
    },
    
    // Substitui skeleton por conteúdo
    replace(skeletonIdOrContainer: unknown, content: string, options: Record<string, unknown>) {
      options = options || {};
      const animate = options.animate !== false;
      const self = this;
      
      let container = null;
      let skeletonId = null;
      
      if (typeof skeletonIdOrContainer === 'string') {
        skeletonId = skeletonIdOrContainer;
        const record = _activeSkeletons.get(skeletonId);
        container = record ? record.container : null;
      } else {
        container = skeletonIdOrContainer;
        const skeleton = (container as HTMLElement).querySelector('[data-skeleton-id]');
        skeletonId = skeleton ? skeleton.getAttribute('data-skeleton-id') : null;
      }
      
      if (!container) {
        _logger.warn('No container found for replacement');
        return false;
      }
      
      // Oculta skeleton
      this.hide(skeletonId, { animate, delay: 0 });
      
      // Aguarda animação e insere conteúdo
      setTimeout(() => {
        if (typeof content === 'string') {
          container.innerHTML = content;
        // @ts-expect-error TS migration - TS2358
        } else if (content instanceof HTMLElement) {
          container.innerHTML = '';
          container.appendChild(content);
        // @ts-expect-error TS migration - TS2358
        } else if (content instanceof DocumentFragment) {
          container.innerHTML = '';
          container.appendChild(content);
        }
        
        // Anima entrada do conteúdo
        if (animate) {
          const newContent = container.firstElementChild;
          if (newContent) {
            newContent.style.opacity = '0';
            newContent.style.transform = 'translateY(8px)';
            newContent.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            
            requestAnimationFrame(() => {
              newContent.style.opacity = '1';
              newContent.style.transform = 'translateY(0)';
            });
          }
        }
        
        _notifyListeners('replaced', { skeletonId, container });
      }, animate ? 200 : 0);
      
      return true;
    },
    
    // Registra template customizado
    registerTemplate(type: string, template: string) {
      _templates[type] = template;
      _logger.debug(`Template registered: ${type}`);
      return this;
    },
    
    // Mapeia painel para tipo
    mapPanelType(panelId: string, type: string) {
      (_panelMap as Record<string, unknown>)[panelId] = type;
      return this;
    },
    
    // Getters
    getActiveSkeletons() {
      const result: unknown[] = [];
      _activeSkeletons.forEach((data, id) => {
        result.push(Object.assign({ id }, data));
      });
      return result;
    },
    
    getActiveCount() {
      return _activeSkeletons.size;
    },
    
    isActive(skeletonId: unknown) {
      return _activeSkeletons.has(skeletonId);
    },
    
    getTypeForPanel(panelId: string) {
      return getTypeForPanel(panelId, _panelMap, defaultType);
    },
    
    // Preview de skeleton
    preview(type: string, container: HTMLElement) {
      return this.show(container, { type, delay: DELAY_VARIANTS.INSTANT });
    },
    
    // Event listeners
    subscribe(listener: (...args: unknown[]) => void) {
      if (typeof listener === 'function') {
        _listeners.push(listener);
        return () => {
          const idx = _listeners.indexOf(listener);
          if (idx >= 0) _listeners.splice(idx, 1);
        };
      }
      return () => {};
    },
    
    // Health check
    healthCheck() {
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        activeCount: _activeSkeletons.size,
        registeredTypes: Object.keys(_templates).length,
        panelMappings: Object.keys(_panelMap).length
      };
    },
    
    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        types: Object.keys(SKELETON_TYPES).map(k => (SKELETON_TYPES as Record<string, unknown>)[k]),
        delays: Object.keys(DELAY_VARIANTS).map(k => (DELAY_VARIANTS as Record<string, unknown>)[k]),
        registeredTypes: Object.keys(_templates),
        panelMappings: Object.keys(_panelMap)
      };
    },
    
    // Reset
    reset() {
      this.hideAll({ animate: false });
      _activeSkeletons.clear();
    }
  };
  
  return manager;
}

export default {
  createSkeletonManager
};
