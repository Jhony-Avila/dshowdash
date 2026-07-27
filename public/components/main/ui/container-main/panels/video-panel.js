import { createPanel, PANEL_CATEGORIES, PANEL_CAPABILITIES } from "../contracts/panel-contract.js";
import { createVideoResource } from "../contracts/resource-contract.js";
const VERSION = "1.0.0-ADAPTIVE";
const MODULE_ID = "container-main:panels:video";
function createVideoPanel(config = {}) {
  const {
    id = `video-panel-${Date.now()}`,
    title = "Video Player",
    src = "",
    autoplay = false,
    controls = true,
    muted = false,
    loop = false,
    poster = "",
    onPlay,
    onPause,
    onEnded,
    onError
  } = config;
  let _videoEl = null;
  let _resource = null;
  let _containerEl = null;
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
    async render(element) {
      _containerEl = element;
      _containerEl.innerHTML = `
        <div class="dsd-video-panel">
          <div class="dsd-video-panel__player">
            <video 
              class="dsd-video-panel__video"
              ${controls ? "controls" : ""}
              ${muted ? "muted" : ""}
              ${loop ? "loop" : ""}
              ${poster ? `poster="${poster}"` : ""}
              ${autoplay ? "autoplay" : ""}
              playsinline
            >
              ${src ? `<source src="${src}" type="video/mp4">` : ""}
              Seu navegador n\xE3o suporta v\xEDdeo HTML5.
            </video>
          </div>
          <div class="dsd-video-panel__overlay dsd-video-panel__overlay--loading" hidden>
            <div class="dsd-video-panel__spinner"></div>
          </div>
          <div class="dsd-video-panel__overlay dsd-video-panel__overlay--error" hidden>
            <span class="dsd-video-panel__error-icon">\u26A0\uFE0F</span>
            <span class="dsd-video-panel__error-message">Erro ao carregar v\xEDdeo</span>
          </div>
        </div>
      `;
      _videoEl = _containerEl.querySelector(".dsd-video-panel__video");
      _resource = createVideoResource(_videoEl, {
        onDispose: () => {
          _videoEl = null;
        }
      });
      _videoEl.addEventListener("play", () => onPlay?.());
      _videoEl.addEventListener("pause", () => onPause?.());
      _videoEl.addEventListener("ended", () => onEnded?.());
      _videoEl.addEventListener("error", (e) => {
        _showError(e.message || "Erro ao carregar v\xEDdeo");
        onError?.(e);
      });
      _videoEl.addEventListener("waiting", () => _showLoading(true));
      _videoEl.addEventListener("canplay", () => _showLoading(false));
      await _resource.load(async () => ({
        memoryEstimate: 50 * 1024 * 1024
      }));
    },
    pause() {
      _videoEl?.pause();
      _resource?.pause?.();
    },
    resume() {
      _resource?.resume?.();
    },
    async destroy() {
      await _resource?.dispose?.();
      if (_containerEl) {
        _containerEl.innerHTML = "";
      }
      _videoEl = null;
      _containerEl = null;
    },
    resize(dimensions) {
      if (_videoEl && dimensions) {
        _videoEl.style.maxWidth = `${dimensions.width}px`;
        _videoEl.style.maxHeight = `${dimensions.height}px`;
      }
    },
    healthCheck() {
      return {
        status: _videoEl ? "HEALTHY" : "NOT_INITIALIZED",
        hasVideo: !!_videoEl,
        paused: _videoEl?.paused ?? true,
        currentTime: _videoEl?.currentTime ?? 0,
        duration: _videoEl?.duration ?? 0,
        resource: _resource?.healthCheck?.() || null
      };
    }
  };
  function _showLoading(show) {
    const el = _containerEl?.querySelector(".dsd-video-panel__overlay--loading");
    if (el) el.hidden = !show;
  }
  function _showError(message) {
    const el = _containerEl?.querySelector(".dsd-video-panel__overlay--error");
    const msgEl = _containerEl?.querySelector(".dsd-video-panel__error-message");
    if (el) el.hidden = false;
    if (msgEl) msgEl.textContent = message;
  }
  const panel = createPanel(panelConfig, implementation);
  return {
    ...panel.getComponent(),
    play() {
      _videoEl?.play();
      _resource?.activate?.();
    },
    pause() {
      _videoEl?.pause();
      _resource?.pause?.();
    },
    stop() {
      if (_videoEl) {
        _videoEl.pause();
        _videoEl.currentTime = 0;
      }
    },
    seek(time) {
      if (_videoEl) _videoEl.currentTime = time;
    },
    setVolume(volume) {
      if (_videoEl) _videoEl.volume = Math.max(0, Math.min(1, volume));
    },
    setSrc(newSrc) {
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
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    panelType: "video"
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID
  };
}
var video_panel_default = {
  VERSION,
  MODULE_ID,
  createVideoPanel,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  createVideoPanel,
  video_panel_default as default,
  healthCheck,
  info
};
