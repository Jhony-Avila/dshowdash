const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap-integration.convenience-methods";
function createConvenienceMethods(context) {
  const managers = context.managers;
  const kernel = context.kernel;
  return {
    // Snapshots
    createSnapshot: (name, type, meta) => managers.get("stateSnapshots")?.create(name, type, meta),
    getSnapshot: (id) => managers.get("stateSnapshots")?.get(id),
    listSnapshots: () => managers.get("stateSnapshots")?.list(),
    // Sanitizer
    sanitize: (type, input) => managers.get("sanitizer")?.[type]?.(input) || input,
    escapeHtml: (input) => managers.get("sanitizer")?.escapeHtml(input) || input,
    isSafe: (input) => managers.get("sanitizer")?.isSafe(input) ?? true,
    // Rate Limiter
    checkRateLimit: (key) => managers.get("rateLimiter")?.check(key),
    withRateLimit: (fn, key) => managers.get("rateLimiter")?.attempt(fn, key),
    // Worker Manager
    runInWorker: (type, payload, fn, opts) => managers.get("workerManager")?.execute(type, payload, fn, opts),
    // Kernel - Slots
    registerSlot: (cfg, contentFactory) => kernel?.registerSlot(cfg, contentFactory),
    activateSlot: (slotId) => kernel?.activateSlot(slotId),
    getActiveSlot: () => kernel?.getActiveSlot(),
    // Kernel - Capabilities
    requestCapability: (panelId, capability) => kernel?.requestCapability(panelId, capability),
    hasCapability: (panelId, capability) => kernel?.hasCapability(panelId, capability),
    // Kernel - Layout
    registerLayout: (panelId, panel, element, opts) => kernel?.registerLayout(panelId, panel, element, opts),
    resizePanel: (panelId, width, height) => kernel?.resizePanel(panelId, width, height),
    togglePanelFullscreen: (panelId) => kernel?.toggleFullscreen(panelId),
    // Kernel - Metrics
    recordMetric: (panelId, name, value, opts) => kernel?.recordMetric(panelId, name, value, opts),
    virtualizeImage: (element, src, opts) => kernel?.virtualizeImage(element, src, opts),
    // Fallback System
    withFallback: (primaryFn, fallbackFn, opts) => managers.get("fallbackSystem")?.withFallback(primaryFn, fallbackFn, opts),
    registerFallbackChain: (operationId, chain) => managers.get("fallbackSystem")?.register(operationId, chain),
    executeFallback: (operationId, ctx) => managers.get("fallbackSystem")?.execute(operationId, ctx),
    // Slot Presets
    getPreset: (presetId) => managers.get("slotPresets")?.get(presetId),
    listPresets: (category) => managers.get("slotPresets")?.list(category),
    // @ts-expect-error strict migration — TS2345
    applyPreset: (presetId, overrides) => managers.get("slotPresets")?.apply(presetId, overrides),
    // Request Queue
    queueRequest: (url, options) => managers.get("requestQueue")?.add(url, options),
    // Cache Manager
    cacheGet: (key, defaultValue) => managers.get("cacheManager")?.get(key, defaultValue),
    cacheSet: (key, value, options) => managers.get("cacheManager")?.set(key, value, options),
    // Event Recorder
    startRecording: () => managers.get("eventRecorder")?.start(),
    stopRecording: () => managers.get("eventRecorder")?.stop(),
    // Notification Manager
    notify: (message, options) => managers.get("notificationManager")?.show({ message, ...options }),
    notifySuccess: (message, options) => managers.get("notificationManager")?.success(message, options),
    notifyError: (message, options) => managers.get("notificationManager")?.error(message, options),
    // Form Validator
    registerForm: (form, schema, options) => managers.get("formValidator")?.register(form, schema, options),
    validateForm: (formId) => managers.get("formValidator")?.validate(formId),
    // Storage Manager
    storageGet: (key, options) => managers.get("storageManager")?.get(key, options),
    storageSet: (key, value, options) => managers.get("storageManager")?.set(key, value, options),
    // Clipboard Manager
    copyToClipboard: (text, options) => managers.get("clipboardManager")?.copy(text, options),
    // Modal Manager
    openModal: (cfg) => managers.get("modalManager")?.open(cfg),
    closeModal: (id, result) => managers.get("modalManager")?.close(id, result),
    modalAlert: (message, options) => managers.get("modalManager")?.alert(message, options),
    modalConfirm: (message, options) => managers.get("modalManager")?.confirm(message, options),
    // Tooltip Manager
    registerTooltip: (element, content, options) => managers.get("tooltipManager")?.register(element, content, options),
    // Context Menu Manager
    registerContextMenu: (element, items, options) => managers.get("contextMenuManager")?.register(element, items, options),
    // Hotkey Manager
    registerHotkey: (combo, handler, options) => managers.get("hotkeyManager")?.register(combo, handler, options),
    // Scroll Manager
    scrollTo: (target, options) => managers.get("scrollManager")?.scrollTo(target, options),
    scrollToTop: (options) => managers.get("scrollManager")?.scrollToTop(options),
    // Focus Manager
    createFocusTrap: (container, options) => managers.get("focusManager")?.createTrap(container, options),
    // Undo Manager
    recordAction: (action) => managers.get("undoManager")?.record(action),
    undo: () => managers.get("undoManager")?.undo(),
    redo: () => managers.get("undoManager")?.redo(),
    canUndo: () => managers.get("undoManager")?.canUndo() ?? false,
    canRedo: () => managers.get("undoManager")?.canRedo() ?? false,
    // Theme Manager
    setTheme: (theme) => managers.get("themeManager")?.setTheme(theme),
    toggleTheme: () => managers.get("themeManager")?.toggle(),
    isDarkMode: () => managers.get("themeManager")?.isDark() ?? false,
    // Animation Manager
    animate: (element, props, options) => managers.get("animationManager")?.animate(element, props, options),
    fadeIn: (element, duration) => managers.get("animationManager")?.fadeIn(element, duration),
    fadeOut: (element, duration) => managers.get("animationManager")?.fadeOut(element, duration),
    // Media Query Manager
    getCurrentBreakpoint: () => managers.get("mediaQueryManager")?.getCurrentBreakpoint(),
    isMobileDevice: () => managers.get("mediaQueryManager")?.isMobile() ?? false,
    isDesktopDevice: () => managers.get("mediaQueryManager")?.isDesktop() ?? false,
    onBreakpointChange: (callback) => managers.get("mediaQueryManager")?.onBreakpointChange(callback),
    // Intersection Manager
    lazyLoad: (selector, options) => managers.get("intersectionManager")?.lazyLoad(selector, options),
    observeIntersection: (element, callbacks, options) => managers.get("intersectionManager")?.observe(element, callbacks, options),
    // Resize Manager
    observeResize: (element, callback, options) => managers.get("resizeManager")?.observe(element, callback, options),
    // Mutation Manager
    watchDOM: (element, callback, options) => managers.get("mutationManager")?.observe(element, callback, options),
    // Permission Manager
    queryPermission: (permission) => managers.get("permissionManager")?.query(permission),
    requestPermission: (permission) => managers.get("permissionManager")?.request(permission),
    // Network Manager
    isOnline: () => managers.get("networkManager")?.isOnline() ?? navigator.onLine,
    isOffline: () => managers.get("networkManager")?.isOffline() ?? !navigator.onLine,
    onOnline: (callback) => managers.get("networkManager")?.onOnline(callback),
    onOffline: (callback) => managers.get("networkManager")?.onOffline(callback),
    getNetworkInfo: () => managers.get("networkManager")?.getConnectionInfo(),
    // Geolocation Manager
    getCurrentPosition: (options) => managers.get("geolocationManager")?.getCurrentPosition(options),
    watchPosition: (callback, errorCallback, options) => managers.get("geolocationManager")?.watchPosition(callback, errorCallback, options),
    // Device Manager
    getDeviceType: () => managers.get("deviceManager")?.getDeviceType(),
    getDeviceInfo: () => managers.get("deviceManager")?.getFullInfo(),
    isMobile: () => managers.get("deviceManager")?.isMobile() ?? false,
    isTouch: () => managers.get("deviceManager")?.isTouch() ?? false,
    // Battery Manager
    getBatteryLevel: () => managers.get("batteryManager")?.getLevelPercent(),
    isBatteryCharging: () => managers.get("batteryManager")?.isCharging(),
    onBatteryLow: (callback) => managers.get("batteryManager")?.onLow(callback),
    // Fullscreen Manager
    enterFullscreen: (element) => managers.get("fullscreenManager")?.enter(element),
    exitFullscreen: () => managers.get("fullscreenManager")?.exit(),
    toggleFullscreen: (element) => managers.get("fullscreenManager")?.toggle(element),
    isFullscreen: () => managers.get("fullscreenManager")?.isFullscreen() ?? false,
    // Visibility Manager
    isPageVisible: () => managers.get("visibilityManager")?.isVisible() ?? true,
    onPageVisible: (callback) => managers.get("visibilityManager")?.onVisible(callback),
    onPageHidden: (callback) => managers.get("visibilityManager")?.onHidden(callback),
    // Wake Lock Manager
    acquireWakeLock: () => managers.get("wakeLockManager")?.acquire(),
    releaseWakeLock: () => managers.get("wakeLockManager")?.release(),
    // Share Manager
    share: (data) => managers.get("shareManager")?.share(data),
    shareTo: (target, data) => managers.get("shareManager")?.shareTo(target, data)
  };
}
var convenience_methods_default = { createConvenienceMethods };
export {
  MODULE_ID,
  VERSION,
  createConvenienceMethods,
  convenience_methods_default as default
};
