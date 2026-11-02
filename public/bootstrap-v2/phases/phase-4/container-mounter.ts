// Phase 4 Container Mounter
// @version 4.4.1-CONTRACTS
// @changelog v4.4.1-CONTRACTS: Dependency Contract formalizado
// @changelog v4.4.0 - Added _setMounted for syncing with existing container state
// @changelog v4.3.0 - Fix: Não depende mais de createContainer/attachContainer (não existem)
//                     Usa container existente no DOM + boot() direto
// @description Montagem do container-main com attach-first pattern
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.4.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: detectExistingContainer from ./container-detector.js
// RECEIVES (via createContainerMounter options):
//   options.portsManager — Ports manager for DI (eventBus, sidebarRegistry)
// DYNAMIC IMPORTS:
//   /components/main/ui/container-main/index.js
// DOM QUERIES (legítimo — UI mounting):
//   document.querySelector('#shell-main-region'), getElementById
// WINDOW ACCESS: None (DOM only)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { detectExistingContainer } from './container-detector.js';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.phases.phase-4.container-mounter';

interface ContainerMountResult {
  container: Record<string, unknown> | null;
  bootFn: Function | null;
  getBootstrapFn: Function | null;
  ContainerMainAPI: Record<string, unknown> | null;
  existingContainer?: Record<string, unknown> | null;
}

export function createContainerMounter(options: { portsManager?: { get: (name: string) => unknown } | null }) {
  if (options === undefined) options = {};
  var portsManager = options.portsManager;

  var _mounted = false;

  return {
    isMounted: function() {
      return _mounted;
    },

    // v4.4.0: Permite sincronizar estado de montagem externamente
    _setMounted: function(value: boolean) {
      _mounted = !!value;
    },

    mount: function(logger: Record<string, Function> | null, windowAdapter: { expose?: (name: string, value: unknown) => void } | null): Promise<ContainerMountResult> {
      var self = this;
      
      if (_mounted) {
        if (logger) logger.info('[P14] container-main already mounted - skipping');
        // @ts-expect-error strict migration — TS2322
        return Promise.resolve(null);
      }
      
      // Detectar container existente no DOM (criado pelo shell)
      var existingContainer = detectExistingContainer();
      if (existingContainer) {
        if (logger) logger.info('[P14] Existing container detected', { 
          mode: existingContainer.mode,
          rootId: existingContainer.rootEl?.id,
          hasContent: !!existingContainer.contentEl
        });
      }
      
      return import('/components/main/ui/container-main/index.js').then(function(ContainerMainModule) {
        // Funções disponíveis no módulo
        var bootFn = ContainerMainModule.boot || (ContainerMainModule.default && ContainerMainModule.default.boot);
        var getBootstrapFn = ContainerMainModule.getBootstrap || (ContainerMainModule.default && ContainerMainModule.default.getBootstrap);
        var ContainerMainAPI = (ContainerMainModule as any).ContainerMain || ContainerMainModule.default;

        // DI: Inject EventBus and SidebarRegistry at module level (se disponível)
        var injectEventBus = (ContainerMainModule as any).injectEventBus || (ContainerMainModule.default && (ContainerMainModule.default as any).injectEventBus);
        var injectSidebarRegistry = (ContainerMainModule as any).injectSidebarRegistry || (ContainerMainModule.default && (ContainerMainModule.default as any).injectSidebarRegistry);
        
        var eventBus = portsManager ? portsManager.get('eventBus') : null;
        var sidebarRegistry = portsManager ? portsManager.get('sidebarRegistry') : null;
        
        if (injectEventBus && eventBus) {
          injectEventBus(eventBus);
          if (logger) logger.info('[P14] EventBus injected into container-main module');
        }
        if (injectSidebarRegistry && sidebarRegistry) {
          injectSidebarRegistry(sidebarRegistry);
          if (logger) logger.info('[P14] SidebarRegistry injected into container-main module');
        }
        
        // Verificar se temos o boot function
        if (!bootFn) {
          if (logger) logger.warn('[P14] container-main boot() not available');
          return { container: null, bootFn: null, getBootstrapFn: null, ContainerMainAPI: null } as ContainerMountResult;
        }

        // Usar o container existente no DOM ou criar referência ao elemento
        var container = null;
        
        if (existingContainer && existingContainer.rootEl) {
          // Container já existe no DOM - usar como referência
          container = {
            element: existingContainer.rootEl,
            contentElement: existingContainer.contentEl,
            id: existingContainer.rootEl.id || 'container-main',
            mode: 'existing',
            mount: function() { /* já montado no DOM */ },
            unmount: function() { /* gerenciado pelo shell */ },
            getElement: function() { return existingContainer!.rootEl; },
            getContentElement: function() { return existingContainer!.contentEl; }
          };
          
          if (logger) logger.info('[P14] Using existing container from DOM', { id: container.id });
        } else {
          // Tentar encontrar #shell-main-region como fallback
          var targetRegion = document.querySelector('#shell-main-region');
          if (targetRegion) {
            var containerEl = targetRegion.querySelector('#container-main') || 
                              targetRegion.querySelector('.dsd-container') ||
                              targetRegion.querySelector('[data-container-main="true"]');
            
            if (containerEl) {
              container = {
                element: containerEl,
                contentElement: containerEl.querySelector('.dsd-container__content') || containerEl,
                id: containerEl.id || 'container-main',
                mode: 'fallback',
                mount: function() {},
                unmount: function() {},
                getElement: function() { return containerEl; },
                getContentElement: function() { return this.contentElement; }
              };
              
              if (logger) logger.info('[P14] Using fallback container from shell-main-region', { id: container.id });
            }
          }
        }
        
        if (!container) {
          if (logger) logger.warn('[P14] No container found in DOM - bootstrap will create one');
          // Criar objeto container mínimo para o boot
          container = {
            element: null,
            contentElement: null,
            id: 'container-main',
            mode: 'virtual',
            mount: function() {},
            unmount: function() {},
            getElement: function() { return document.getElementById('container-main'); },
            getContentElement: function() { 
              var el = this.getElement();
              return el ? el.querySelector('.dsd-container__content') || el : null;
            }
          };
        }
        
        _mounted = true;
        
        return {
          container: container,
          bootFn: bootFn,
          getBootstrapFn: getBootstrapFn,
          ContainerMainAPI: ContainerMainAPI,
          existingContainer: existingContainer
        };
      }).catch(function(error) {
        if (logger) logger.warn('[P14] container-main mount failed (non-critical)', { error: error.message });
        return { container: null, bootFn: null, getBootstrapFn: null, ContainerMainAPI: null } as ContainerMountResult;
      });
    },

    reset: function() {
      _mounted = false;
    }
  };
}

export default { createContainerMounter };
