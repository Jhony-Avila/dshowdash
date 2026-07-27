// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:panels:video
// PURPOSE: Video Panel - Painel adaptativo para vídeo
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanel, PANEL_CATEGORIES, PANEL_CAPABILITIES from ../contracts/panel-con...
//   createVideoResource from ../contracts/resource-contract.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createVideoPanel() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'canplay'
//   'ended'
//   'error'
//   'pause'
//   'play'
//   'waiting'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanel, PANEL_CATEGORIES, PANEL_CAPABILITIES } from '../contracts/panel-contract.js';
import { createVideoResource } from '../contracts/resource-contract.js';

export const VERSION = '1.0.0-ADAPTIVE';
export const MODULE_ID = 'container-main:panels:video';

// Cria um painel de vídeo
export function createVideoPanel(config: Record<string, any> = {}) {
  const {
    id = `video-panel-${Date.now()}`,
    title = 'Video Player',
    src = '',
    autoplay = false,
    controls = true,
    muted = false,
    loop = false,
    poster = '',
    onPlay,
    onPause,
    onEnded,
    onError
  } = config;

  let _videoEl: HTMLVideoElement | null = null;
  let _resource: Record<string, (...args: unknown[]) => unknown> | null = null;
  let _containerEl: HTMLElement | null = null;

  const panelConfig = {
    id,
    title,
    category: PANEL_CATEGORIES.MEDIA,
    capabilities: [
      PANEL_CAPABILITIES.RESIZABLE,
      PANEL_CAPABILITIES.FULLSCREEN,
      PANEL_CAPABILITIES.CLOSABLE
    ],
    priority: 1
  };

  const implementation = {
    async render(element: HTMLElement) {
      _containerEl = element;
      
      // Cria estrutura
      _containerEl.innerHTML = `
        <div class="dsd-video-panel">
          <div class="dsd-video-panel__player">
            <video 
              class="dsd-video-panel__video"
              ${controls ? 'controls' : ''}
              ${muted ? 'muted' : ''}
              ${loop ? 'loop' : ''}
              ${poster ? `poster="${poster}"` : ''}
              ${autoplay ? 'autoplay' : ''}
              playsinline
            >
              ${src ? `<source src="${src}" type="video/mp4">` : ''}
              Seu navegador não suporta vídeo HTML5.
            </video>
          </div>
          <div class="dsd-video-panel__overlay dsd-video-panel__overlay--loading" hidden>
            <div class="dsd-video-panel__spinner"></div>
          </div>
          <div class="dsd-video-panel__overlay dsd-video-panel__overlay--error" hidden>
            <span class="dsd-video-panel__error-icon">⚠️</span>
            <span class="dsd-video-panel__error-message">Erro ao carregar vídeo</span>
          </div>
        </div>
      `;

      _videoEl = _containerEl!.querySelector('.dsd-video-panel__video') as HTMLVideoElement;
      
      // Cria resource para gerenciamento
      // @ts-expect-error strict migration — TS2322
      _resource = createVideoResource(_videoEl, {
        onDispose: () => {
          _videoEl = null;
        }
      });

      // Event listeners
      _videoEl.addEventListener('play', () => onPlay?.());
      _videoEl.addEventListener('pause', () => onPause?.());
      _videoEl.addEventListener('ended', () => onEnded?.());
      _videoEl.addEventListener('error', (e: Event) => {
        _showError((e as ErrorEvent).message || 'Erro ao carregar vídeo');
        onError?.(e);
      });
      _videoEl.addEventListener('waiting', () => _showLoading(true));
      _videoEl.addEventListener('canplay', () => _showLoading(false));

      // Carrega o recurso
      await (_resource!.load as (...args: unknown[]) => Promise<unknown>)(async () => ({
        memoryEstimate: 50 * 1024 * 1024
      }));
    },

    pause() {
      _videoEl?.pause();
      (_resource?.pause as (() => void) | undefined)?.();
    },

    resume() {
      (_resource?.resume as (() => void) | undefined)?.();
    },

    async destroy() {
      await (_resource?.dispose as (() => Promise<void>) | undefined)?.();
      if (_containerEl) {
        _containerEl.innerHTML = '';
      }
      _videoEl = null;
      _containerEl = null;
    },

    resize(dimensions: Record<string, unknown>) {
      if (_videoEl && dimensions) {
        _videoEl.style.maxWidth = `${dimensions.width}px`;
        _videoEl.style.maxHeight = `${dimensions.height}px`;
      }
    },

    healthCheck() {
      return {
        status: _videoEl ? 'HEALTHY' : 'NOT_INITIALIZED',
        hasVideo: !!_videoEl,
        paused: _videoEl?.paused ?? true,
        currentTime: _videoEl?.currentTime ?? 0,
        duration: _videoEl?.duration ?? 0,
        resource: (_resource?.healthCheck as (() => Record<string, unknown>) | undefined)?.() || null
      };
    }
  };

  // Helpers internos
  function _showLoading(show: boolean) {
    const el = _containerEl?.querySelector('.dsd-video-panel__overlay--loading') as HTMLElement | null;
    if (el) el.hidden = !show;
  }

  function _showError(message: string) {
    const el = _containerEl?.querySelector('.dsd-video-panel__overlay--error') as HTMLElement | null;
    const msgEl = _containerEl?.querySelector('.dsd-video-panel__error-message') as HTMLElement | null;
    if (el) el.hidden = false;
    if (msgEl) msgEl.textContent = message;
  }

  // Cria painel usando contract
  const panel = createPanel(panelConfig, implementation);

  // Adiciona métodos específicos de vídeo
  return {
    ...panel.getComponent(),
    
    play() {
      _videoEl?.play();
      (_resource?.activate as (() => void) | undefined)?.();
    },

    pause() {
      _videoEl?.pause();
      (_resource?.pause as (() => void) | undefined)?.();
    },
    
    stop() {
      if (_videoEl) {
        _videoEl.pause();
        _videoEl.currentTime = 0;
      }
    },
    
    seek(time: number) {
      if (_videoEl) _videoEl.currentTime = time;
    },
    
    setVolume(volume: number) {
      if (_videoEl) _videoEl.volume = Math.max(0, Math.min(1, volume));
    },
    
    setSrc(newSrc: string) {
      if (_videoEl) {
        _videoEl.src = newSrc;
        _videoEl.load();
      }
    },
    
    getCurrentTime() {
      return _videoEl?.currentTime || 0;
    },
    
    getDuration() {
      return _videoEl?.duration || 0;
    },
    
    isPaused() {
      return _videoEl?.paused ?? true;
    },

    getVideoElement() {
      return _videoEl;
    }
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    panelType: 'video'
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID
  };
}

export default {
  VERSION, MODULE_ID,
  createVideoPanel,
  info, healthCheck
};
