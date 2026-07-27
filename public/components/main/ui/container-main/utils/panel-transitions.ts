
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:panel-transitions
// PURPOSE: Panel Transitions - Gerenciador de transições entre painéis
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//   getPerformanceAPI from ./performance-api/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TRANSITION_TYPES — exported value
//   NAVIGATION_DIRECTION — exported value
//   createPanelTransitions() — exported function
//   getPanelTransitions() — exported function
//   resetPanelTransitions() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'transitionend'
// WINDOW ACCESS:
//   window.matchMedia
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';
import { getPerformanceAPI } from './performance-api/index.js';

export const VERSION = '1.0.0';
export const MODULE_ID = 'container-main:panel-transitions';

// Tipos de transição disponíveis
export const TRANSITION_TYPES = Object.freeze({
  FADE: 'fade',
  SLIDE_LEFT: 'slide-left',
  SLIDE_RIGHT: 'slide-right',
  SLIDE_UP: 'slide-up',
  SCALE: 'scale',
  ZOOM: 'zoom',
  CROSSFADE: 'crossfade',
  MORPH: 'morph',
  NONE: 'none',
  AUTO: 'auto'
});

// Direções de navegação
export const NAVIGATION_DIRECTION = Object.freeze({
  FORWARD: 'forward',
  BACKWARD: 'backward',
  REPLACE: 'replace'
});

// Configuração padrão
const DEFAULT_CONFIG = Object.freeze({
  type: TRANSITION_TYPES.FADE,
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  stagger: false,
  staggerDelay: 50,
  respectReducedMotion: true
});

// Cria o gerenciador de transições
export function createPanelTransitions(options: Record<string, any> = {}) {
  const config: any = { ...DEFAULT_CONFIG, ...options };
  const _logger = createLogger(MODULE_ID);
  const _perfAPI = getPerformanceAPI();
  
  let _currentTransition: unknown = null;
  let _transitionQueue: unknown[] = [];
  let _navigationStack: unknown[] = [];
  let _listeners: Set<any> = new Set();

  // Verifica preferência de movimento reduzido
  function _prefersReducedMotion() {
    return config.respectReducedMotion && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Determina tipo de transição baseado na direção
  function _getAutoTransitionType(direction: string) {
    if (_prefersReducedMotion()) return TRANSITION_TYPES.NONE;
    
    switch (direction) {
      case NAVIGATION_DIRECTION.FORWARD:
        return TRANSITION_TYPES.SLIDE_LEFT;
      case NAVIGATION_DIRECTION.BACKWARD:
        return TRANSITION_TYPES.SLIDE_RIGHT;
      case NAVIGATION_DIRECTION.REPLACE:
        return TRANSITION_TYPES.FADE;
      default:
        return TRANSITION_TYPES.FADE;
    }
  }

  // Resolve tipo de transição
  function _resolveTransitionType(type: string, direction: string) {
    if (_prefersReducedMotion()) return TRANSITION_TYPES.NONE;
    if (type === TRANSITION_TYPES.AUTO) return _getAutoTransitionType(direction);
    return type;
  }

  // Aplica classes de transição
  function _applyTransitionClasses(element: HTMLElement, type: string, phase: string) {
    const prefix = `dsd-panel-transition--${type}`;
    
    // Remove todas as classes de transição anteriores
    element.className = element.className
      .split(' ')
      .filter((c: unknown) => !(c as string).startsWith('dsd-panel-transition--'))
      .join(' ');
    
    // Adiciona classe base
    element.classList.add('dsd-panel-transition');
    
    // Adiciona classe da fase
    element.classList.add(`${prefix}-${phase}`);
  }

  // Executa transição de saída
  function _exitTransition(element: HTMLElement, type: string, duration: number) {
    return new Promise<void>((resolve) => {
      if (type === TRANSITION_TYPES.NONE || !element) {
        if (element) element.style.display = 'none';
        resolve();
        return;
      }

      _applyTransitionClasses(element, type, 'exit');
      
      // Force reflow
      element.offsetHeight;
      
      _applyTransitionClasses(element, type, 'exit-active');

      const onEnd = () => {
        element.removeEventListener('transitionend', onEnd);
        element.style.display = 'none';
        resolve();
      };

      element.addEventListener('transitionend', onEnd, { once: true });
      
      // Fallback timeout
      setTimeout(() => {
        element.removeEventListener('transitionend', onEnd);
        element.style.display = 'none';
        resolve();
      }, duration + 50);
    });
  }

  // Executa transição de entrada
  function _enterTransition(element: HTMLElement, type: string, duration: number) {
    return new Promise<void>((resolve) => {
      if (type === TRANSITION_TYPES.NONE || !element) {
        if (element) element.style.display = '';
        resolve();
        return;
      }

      element.style.display = '';
      _applyTransitionClasses(element, type, 'enter');
      
      // Force reflow
      element.offsetHeight;
      
      _applyTransitionClasses(element, type, 'enter-active');

      const onEnd = () => {
        element.removeEventListener('transitionend', onEnd);
        // Limpa classes de transição
        element.className = element.className
          .split(' ')
          .filter((c: unknown) => !(c as string).startsWith('dsd-panel-transition'))
          .join(' ');
        resolve();
      };

      element.addEventListener('transitionend', onEnd, { once: true });
      
      // Fallback timeout
      setTimeout(() => {
        element.removeEventListener('transitionend', onEnd);
        element.className = element.className
          .split(' ')
          .filter((c: unknown) => !(c as string).startsWith('dsd-panel-transition'))
          .join(' ');
        resolve();
      }, duration + 50);
    });
  }

  // Notifica listeners
  function _notifyListeners(event: string, data: Record<string, unknown>) {
    _listeners.forEach(listener => {
      try {
        listener({ event, ...data, timestamp: Date.now() });
      } catch (e) {
        // @ts-expect-error strict migration — TS2345
        _logger.warn('Listener error:', e);
      }
    });
  }

  const manager = {
    // Executa transição entre painéis
    async transition(container: HTMLElement, oldContent: unknown, newContent: unknown, options: Record<string, any> = {}) {
      const {
        type = config.type,
        direction = NAVIGATION_DIRECTION.FORWARD,
        duration = config.duration,
        onStart,
        onComplete
      } = options;

      // Se já há transição em andamento, enfileira
      if (_currentTransition) {
        return new Promise<void>((resolve) => {
          _transitionQueue.push({ container, oldContent, newContent, options, resolve });
        });
      }

      _currentTransition = { container, oldContent, newContent };
      const resolvedType = _resolveTransitionType(type, direction);
      const startTime = performance.now();

      _logger.debug(`Transition: ${resolvedType} (${direction})`);
      _notifyListeners('start', { type: resolvedType, direction });

      // Marca container como em transição
      container.classList.add('dsd-container__content--transitioning');
      container.setAttribute('data-transition-direction', direction);

      if (onStart) onStart();

      try {
        // Crossfade é especial - ambos visíveis simultaneamente
        if (resolvedType === TRANSITION_TYPES.CROSSFADE) {
          if (oldContent) (oldContent as HTMLElement).style.position = 'absolute';
          if (newContent) {
            (newContent as HTMLElement).style.position = 'absolute';
            // @ts-expect-error TS migration - TS2345
            container.appendChild(newContent);
          }
          
          await Promise.all([
            _exitTransition((oldContent as HTMLElement), resolvedType, duration),
            _enterTransition((newContent as HTMLElement), resolvedType, duration)
          ]);

          if (oldContent) (oldContent as HTMLElement).remove();
          if (newContent) (newContent as HTMLElement).style.position = '';
        } else {
          // Transição sequencial
          await _exitTransition((oldContent as HTMLElement), resolvedType, duration);
          
          if (oldContent) (oldContent as HTMLElement).remove();
          // @ts-expect-error TS migration - TS2345
          if (newContent) container.appendChild(newContent);
          
          await _enterTransition((newContent as HTMLElement), resolvedType, duration);
        }

        // Registra métricas
        const transitionTime = performance.now() - startTime;
        (_perfAPI.recordRender as (...args: unknown[]) => unknown)(transitionTime, 'panel-transition');

        _notifyListeners('complete', { type: resolvedType, direction, duration: transitionTime });

      } catch (error: any) {
        _logger.error('Transition error:', error);
        _notifyListeners('error', { error: error.message });
      } finally {
        // Remove marcação de transição
        container.classList.remove('dsd-container__content--transitioning');
        container.removeAttribute('data-transition-direction');
        
        if (onComplete) onComplete();
        _currentTransition = null;

        // Processa fila
        if (_transitionQueue.length > 0) {
          const next = _transitionQueue.shift();
          // @ts-expect-error TS migration - TS2339
          this.transition((next as Record<string, unknown>).container, next.oldContent, next.newContent, next.options)
            // @ts-expect-error strict migration — TS2345
            .then((next as Record<string, unknown>).resolve);
        }
      }
    },

    // Transição simplificada - substitui conteúdo
    async replaceContent(container: HTMLElement, newContent: unknown, options: Record<string, any> = {}) {
      const oldContent = container.firstElementChild;
      return this.transition(container, oldContent, newContent, options);
    },

    // Navegação com histórico
    async navigateTo(container: HTMLElement, newContent: unknown, panelId: string, options: Record<string, any> = {}) {
      const direction = options.direction || NAVIGATION_DIRECTION.FORWARD;
      
      if (direction === NAVIGATION_DIRECTION.FORWARD) {
        _navigationStack.push(panelId);
      } else if (direction === NAVIGATION_DIRECTION.BACKWARD) {
        _navigationStack.pop();
      }

      return this.replaceContent(container, newContent, {
        ...options,
        direction,
        type: options.type || TRANSITION_TYPES.AUTO
      });
    },

    // Navega para trás
    async goBack(container: HTMLElement, getContentFn: unknown) {
      if (_navigationStack.length <= 1) {
        _logger.warn('Cannot go back - no history');
        return false;
      }

      _navigationStack.pop();
      const previousPanelId = _navigationStack[_navigationStack.length - 1];
      
      const newContent = await (getContentFn as (...args: unknown[]) => unknown)(previousPanelId);
      if (!newContent) return false;

      await this.replaceContent(container, newContent, {
        direction: NAVIGATION_DIRECTION.BACKWARD,
        type: TRANSITION_TYPES.AUTO
      });

      return true;
    },

    // Getters
    isTransitioning() {
      return _currentTransition !== null;
    },

    getQueueLength() {
      return _transitionQueue.length;
    },

    getNavigationStack() {
      return [..._navigationStack];
    },

    canGoBack() {
      return _navigationStack.length > 1;
    },

    // Configuração
    setDefaultType(type: string) {
      if ((TRANSITION_TYPES as Record<string, unknown>)[type.toUpperCase().replace('-', '_')]) {
        config.type = type;
      }
      return this;
    },

    setDuration(duration: number) {
      config.duration = Math.max(0, Math.min(1000, duration));
      return this;
    },

    // Event listeners
    subscribe(listener: (...args: unknown[]) => void) {
      if (typeof listener === 'function') {
        _listeners.add(listener);
        return () => _listeners.delete(listener);
      }
      return () => {};
    },

    // Reset
    reset() {
      _transitionQueue = [];
      _navigationStack = [];
      _currentTransition = null;
    },

    // Clear history
    clearHistory() {
      _navigationStack = [];
    },

    // Health check
    healthCheck() {
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        isTransitioning: this.isTransitioning(),
        queueLength: this.getQueueLength(),
        historyLength: _navigationStack.length,
        prefersReducedMotion: _prefersReducedMotion()
      };
    },

    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        types: Object.values(TRANSITION_TYPES),
        directions: Object.values(NAVIGATION_DIRECTION),
        config: { ...config }
      };
    }
  };

  return manager;
}

// Singleton
let _instance: Record<string, unknown> | null = null;

export function getPanelTransitions(options: Record<string, any> = {}) {
  if (!_instance) {
    _instance = createPanelTransitions(options);
  }
  return _instance;
}

export function resetPanelTransitions() {
  if (_instance) {
    (_instance.reset as (...args: unknown[]) => unknown)();
    _instance = null;
  }
}

// Exports
export function info() { return { moduleId: MODULE_ID, version: VERSION, types: Object.values(TRANSITION_TYPES) }; }
export function healthCheck() { 
  if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID,
  TRANSITION_TYPES, NAVIGATION_DIRECTION,
  createPanelTransitions, getPanelTransitions, resetPanelTransitions,
  info, healthCheck
};
