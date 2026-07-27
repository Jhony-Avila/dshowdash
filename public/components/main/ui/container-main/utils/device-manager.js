import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE7";
const MODULE_ID = "container-main:device-manager";
const DEVICE_TYPES = Object.freeze({ MOBILE: "mobile", TABLET: "tablet", DESKTOP: "desktop", TV: "tv", UNKNOWN: "unknown" });
const OS_TYPES = Object.freeze({ WINDOWS: "windows", MACOS: "macos", LINUX: "linux", IOS: "ios", ANDROID: "android", UNKNOWN: "unknown" });
const BROWSER_TYPES = Object.freeze({ CHROME: "chrome", FIREFOX: "firefox", SAFARI: "safari", EDGE: "edge", OPERA: "opera", IE: "ie", UNKNOWN: "unknown" });
function createDeviceManager(options = {}) {
  const _logger = createLogger(MODULE_ID);
  let _deviceInfo = null;
  function _detectDevice() {
    const ua = navigator.userAgent.toLowerCase();
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const screenWidth = window.screen.width;
    if (/tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast/i.test(ua)) return DEVICE_TYPES.TV;
    if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) return DEVICE_TYPES.MOBILE;
    if (/ipad|android(?!.*mobile)|tablet/i.test(ua) || hasTouch && screenWidth >= 768 && screenWidth < 1200) return DEVICE_TYPES.TABLET;
    if (screenWidth >= 1200 || !hasTouch) return DEVICE_TYPES.DESKTOP;
    return DEVICE_TYPES.UNKNOWN;
  }
  function _detectOS() {
    const ua = navigator.userAgent;
    const platform = navigator.platform?.toLowerCase() || "";
    if (/iphone|ipad|ipod/i.test(ua)) return OS_TYPES.IOS;
    if (/android/i.test(ua)) return OS_TYPES.ANDROID;
    if (/win/i.test(platform)) return OS_TYPES.WINDOWS;
    if (/mac/i.test(platform)) return OS_TYPES.MACOS;
    if (/linux/i.test(platform)) return OS_TYPES.LINUX;
    return OS_TYPES.UNKNOWN;
  }
  function _detectBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("edg/")) return BROWSER_TYPES.EDGE;
    if (ua.includes("opr/") || ua.includes("opera")) return BROWSER_TYPES.OPERA;
    if (ua.includes("chrome") && !ua.includes("edg/")) return BROWSER_TYPES.CHROME;
    if (ua.includes("safari") && !ua.includes("chrome")) return BROWSER_TYPES.SAFARI;
    if (ua.includes("firefox")) return BROWSER_TYPES.FIREFOX;
    if (ua.includes("msie") || ua.includes("trident/")) return BROWSER_TYPES.IE;
    return BROWSER_TYPES.UNKNOWN;
  }
  function _getBrowserVersion() {
    const ua = navigator.userAgent;
    const browser = _detectBrowser();
    let match;
    switch (browser) {
      case BROWSER_TYPES.CHROME:
        match = ua.match(/Chrome\/(\d+)/);
        break;
      case BROWSER_TYPES.FIREFOX:
        match = ua.match(/Firefox\/(\d+)/);
        break;
      case BROWSER_TYPES.SAFARI:
        match = ua.match(/Version\/(\d+)/);
        break;
      case BROWSER_TYPES.EDGE:
        match = ua.match(/Edg\/(\d+)/);
        break;
      case BROWSER_TYPES.OPERA:
        match = ua.match(/OPR\/(\d+)/);
        break;
      default:
        return "unknown";
    }
    return match ? match[1] : "unknown";
  }
  function _getCapabilities() {
    return {
      touch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      webgl: (() => {
        try {
          return !!document.createElement("canvas").getContext("webgl");
        } catch {
          return false;
        }
      })(),
      webgl2: (() => {
        try {
          return !!document.createElement("canvas").getContext("webgl2");
        } catch {
          return false;
        }
      })(),
      webp: document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0,
      avif: false,
      // Requires async check
      serviceWorker: "serviceWorker" in navigator,
      pushNotifications: "PushManager" in window,
      webSocket: "WebSocket" in window,
      indexedDB: "indexedDB" in window,
      localStorage: (() => {
        try {
          localStorage.setItem("test", "test");
          localStorage.removeItem("test");
          return true;
        } catch {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          sessionStorage.setItem("test", "test");
          sessionStorage.removeItem("test");
          return true;
        } catch {
          return false;
        }
      })(),
      geolocation: "geolocation" in navigator,
      notifications: "Notification" in window,
      vibration: "vibrate" in navigator,
      bluetooth: "bluetooth" in navigator,
      usb: "usb" in navigator,
      midi: "requestMIDIAccess" in navigator,
      share: "share" in navigator,
      clipboard: "clipboard" in navigator,
      speechRecognition: "webkitSpeechRecognition" in window || "SpeechRecognition" in window,
      speechSynthesis: "speechSynthesis" in window,
      mediaDevices: "mediaDevices" in navigator,
      getBattery: "getBattery" in navigator,
      connection: "connection" in navigator || "mozConnection" in navigator || "webkitConnection" in navigator,
      wakeLock: "wakeLock" in navigator,
      // @ts-expect-error TS migration - TS2551
      fullscreen: document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled,
      pointerLock: "pointerLockElement" in document,
      pictureInPicture: "pictureInPictureEnabled" in document,
      webXR: "xr" in navigator,
      webGPU: "gpu" in navigator
    };
  }
  function _getScreenInfo() {
    return {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: window.screen.orientation?.type || (window.innerWidth > window.innerHeight ? "landscape" : "portrait")
    };
  }
  function _getHardwareInfo() {
    return {
      cores: navigator.hardwareConcurrency || "unknown",
      // @ts-expect-error TS migration - TS2339
      memory: navigator.deviceMemory || "unknown",
      maxTouchPoints: navigator.maxTouchPoints || 0,
      language: navigator.language,
      languages: navigator.languages ? [...navigator.languages] : [navigator.language],
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === "1" || navigator.doNotTrack === "yes"
    };
  }
  function _buildDeviceInfo() {
    return {
      deviceType: _detectDevice(),
      os: _detectOS(),
      browser: _detectBrowser(),
      browserVersion: _getBrowserVersion(),
      capabilities: _getCapabilities(),
      screen: _getScreenInfo(),
      hardware: _getHardwareInfo(),
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };
  }
  _deviceInfo = _buildDeviceInfo();
  const manager = {
    getDeviceType() {
      return _deviceInfo.deviceType;
    },
    getOS() {
      return _deviceInfo.os;
    },
    getBrowser() {
      return _deviceInfo.browser;
    },
    getBrowserVersion() {
      return _deviceInfo.browserVersion;
    },
    // @ts-expect-error TS migration - TS2698
    getCapabilities() {
      return { ..._deviceInfo.capabilities };
    },
    // @ts-expect-error TS migration - TS2698
    getScreenInfo() {
      return { ..._deviceInfo.screen };
    },
    // @ts-expect-error TS migration - TS2698
    getHardwareInfo() {
      return { ..._deviceInfo.hardware };
    },
    getFullInfo() {
      return { ..._deviceInfo };
    },
    isMobile() {
      return _deviceInfo.deviceType === DEVICE_TYPES.MOBILE;
    },
    isTablet() {
      return _deviceInfo.deviceType === DEVICE_TYPES.TABLET;
    },
    isDesktop() {
      return _deviceInfo.deviceType === DEVICE_TYPES.DESKTOP;
    },
    isTouch() {
      return _deviceInfo.capabilities.touch;
    },
    isIOS() {
      return _deviceInfo.os === OS_TYPES.IOS;
    },
    isAndroid() {
      return _deviceInfo.os === OS_TYPES.ANDROID;
    },
    isChrome() {
      return _deviceInfo.browser === BROWSER_TYPES.CHROME;
    },
    isSafari() {
      return _deviceInfo.browser === BROWSER_TYPES.SAFARI;
    },
    isFirefox() {
      return _deviceInfo.browser === BROWSER_TYPES.FIREFOX;
    },
    // @ts-expect-error strict migration — TS2571
    hasCapability(name) {
      return _deviceInfo.capabilities[name] === true;
    },
    refresh() {
      _deviceInfo = _buildDeviceInfo();
      return _deviceInfo;
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, deviceType: _deviceInfo.deviceType, os: _deviceInfo.os, browser: _deviceInfo.browser };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, deviceType: _deviceInfo.deviceType, os: _deviceInfo.os, browser: _deviceInfo.browser, browserVersion: _deviceInfo.browserVersion };
    },
    destroy() {
      _deviceInfo = null;
    }
  };
  return manager;
}
let _instance = null;
function getDeviceManager(options = {}) {
  if (!_instance) _instance = createDeviceManager(options);
  return _instance;
}
function resetDeviceManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function isMobile() {
  return getDeviceManager().isMobile();
}
function isTouch() {
  return getDeviceManager().isTouch();
}
function getDeviceType() {
  return getDeviceManager().getDeviceType();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, deviceTypes: Object.keys(DEVICE_TYPES), osTypes: Object.keys(OS_TYPES), browserTypes: Object.keys(BROWSER_TYPES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var device_manager_default = { VERSION, MODULE_ID, DEVICE_TYPES, OS_TYPES, BROWSER_TYPES, createDeviceManager, getDeviceManager, resetDeviceManager, isMobile, isTouch, getDeviceType, info, healthCheck };
export {
  BROWSER_TYPES,
  DEVICE_TYPES,
  MODULE_ID,
  OS_TYPES,
  VERSION,
  createDeviceManager,
  device_manager_default as default,
  getDeviceManager,
  getDeviceType,
  healthCheck,
  info,
  isMobile,
  isTouch,
  resetDeviceManager
};
