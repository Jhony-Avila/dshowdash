// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.1.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: convenience-methods
// PURPOSE: Bootstrap Convenience Methods
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createConvenienceMethods() — exported function
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

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap-integration.convenience-methods';

export function createConvenienceMethods(context: Record<string, unknown>) {
  const managers = context.managers as import("./types.js").ManagerRef;
  const kernel = context.kernel as import("./types.js").ManagerRef | null;

  return {
    // Snapshots
    createSnapshot: (name: string, type: string, meta: Record<string, unknown>) => managers.get('stateSnapshots')?.create(name, type, meta),
    getSnapshot: (id: string) => managers.get('stateSnapshots')?.get(id),
    listSnapshots: () => managers.get('stateSnapshots')?.list(),

    // Sanitizer
    sanitize: (type: string, input: HTMLInputElement) => managers.get('sanitizer')?.[type]?.(input) || input,
    escapeHtml: (input: HTMLInputElement) => managers.get('sanitizer')?.escapeHtml(input) || input,
    isSafe: (input: HTMLInputElement) => managers.get('sanitizer')?.isSafe(input) ?? true,

    // Rate Limiter
    checkRateLimit: (key: string) => managers.get('rateLimiter')?.check(key),
    withRateLimit: (fn: (...args: unknown[]) => void, key: string) => managers.get('rateLimiter')?.attempt(fn, key),

    // Worker Manager
    runInWorker: (type: string, payload: Record<string, unknown>, fn: (...args: unknown[]) => void, opts: Record<string, unknown>) => managers.get('workerManager')?.execute(type, payload, fn, opts),

    // Kernel - Slots
    registerSlot: (cfg: Record<string, unknown>, contentFactory: unknown) => kernel?.registerSlot(cfg, contentFactory),
    activateSlot: (slotId: string) => kernel?.activateSlot(slotId),
    getActiveSlot: () => kernel?.getActiveSlot(),

    // Kernel - Capabilities
    requestCapability: (panelId: string, capability: string) => kernel?.requestCapability(panelId, capability),
    hasCapability: (panelId: string, capability: string) => kernel?.hasCapability(panelId, capability),

    // Kernel - Layout
    registerLayout: (panelId: string, panel: HTMLElement, element: HTMLElement, opts: Record<string, unknown>) => kernel?.registerLayout(panelId, panel, element, opts),
    resizePanel: (panelId: string, width: number, height: number) => kernel?.resizePanel(panelId, width, height),
    togglePanelFullscreen: (panelId: string) => kernel?.toggleFullscreen(panelId),

    // Kernel - Metrics
    recordMetric: (panelId: string, name: string, value: unknown, opts: Record<string, unknown>) => kernel?.recordMetric(panelId, name, value, opts),
    virtualizeImage: (element: HTMLElement, src: string, opts: Record<string, unknown>) => kernel?.virtualizeImage(element, src, opts),

    // Fallback System
    withFallback: (primaryFn: unknown, fallbackFn: unknown, opts: Record<string, unknown>) => managers.get('fallbackSystem')?.withFallback(primaryFn, fallbackFn, opts),
    registerFallbackChain: (operationId: unknown, chain: unknown) => managers.get('fallbackSystem')?.register(operationId, chain),
    executeFallback: (operationId: unknown, ctx: Record<string, unknown>) => managers.get('fallbackSystem')?.execute(operationId, ctx),

    // Slot Presets
    getPreset: (presetId: unknown) => managers.get('slotPresets')?.get(presetId),
    listPresets: (category: string) => managers.get('slotPresets')?.list(category),
    // @ts-expect-error strict migration — TS2345
    applyPreset: (presetId: unknown, overrides: Record<string, unknown>) => managers.get('slotPresets')?.apply(presetId, overrides),

    // Request Queue
    queueRequest: (url: string, options: Record<string, unknown>) => managers.get('requestQueue')?.add(url, options),

    // Cache Manager
    cacheGet: (key: string, defaultValue: string) => managers.get('cacheManager')?.get(key, defaultValue),
    cacheSet: (key: string, value: unknown, options: Record<string, unknown>) => managers.get('cacheManager')?.set(key, value, options),

    // Event Recorder
    startRecording: () => managers.get('eventRecorder')?.start(),
    stopRecording: () => managers.get('eventRecorder')?.stop(),

    // Notification Manager
    notify: (message: string, options: Record<string, unknown>) => managers.get('notificationManager')?.show({ message, ...options }),
    notifySuccess: (message: string, options: Record<string, unknown>) => managers.get('notificationManager')?.success(message, options),
    notifyError: (message: string, options: Record<string, unknown>) => managers.get('notificationManager')?.error(message, options),

    // Form Validator
    registerForm: (form: Record<string, unknown>, schema: Record<string, unknown>, options: Record<string, unknown>) => managers.get('formValidator')?.register(form, schema, options),
    validateForm: (formId: unknown) => managers.get('formValidator')?.validate(formId),

    // Storage Manager
    storageGet: (key: string, options: Record<string, unknown>) => managers.get('storageManager')?.get(key, options),
    storageSet: (key: string, value: unknown, options: Record<string, unknown>) => managers.get('storageManager')?.set(key, value, options),

    // Clipboard Manager
    copyToClipboard: (text: string, options: Record<string, unknown>) => managers.get('clipboardManager')?.copy(text, options),

    // Modal Manager
    openModal: (cfg: Record<string, unknown>) => managers.get('modalManager')?.open(cfg),
    closeModal: (id: string, result: Record<string, unknown>) => managers.get('modalManager')?.close(id, result),
    modalAlert: (message: string, options: Record<string, unknown>) => managers.get('modalManager')?.alert(message, options),
    modalConfirm: (message: string, options: Record<string, unknown>) => managers.get('modalManager')?.confirm(message, options),

    // Tooltip Manager
    registerTooltip: (element: HTMLElement, content: string, options: Record<string, unknown>) => managers.get('tooltipManager')?.register(element, content, options),

    // Context Menu Manager
    registerContextMenu: (element: HTMLElement, items: unknown, options: Record<string, unknown>) => managers.get('contextMenuManager')?.register(element, items, options),

    // Hotkey Manager
    registerHotkey: (combo: unknown, handler: (...args: unknown[]) => void, options: Record<string, unknown>) => managers.get('hotkeyManager')?.register(combo, handler, options),

    // Scroll Manager
    scrollTo: (target: HTMLElement, options: Record<string, unknown>) => managers.get('scrollManager')?.scrollTo(target, options),
    scrollToTop: (options: Record<string, unknown>) => managers.get('scrollManager')?.scrollToTop(options),

    // Focus Manager
    createFocusTrap: (container: HTMLElement, options: Record<string, unknown>) => managers.get('focusManager')?.createTrap(container, options),

    // Undo Manager
    recordAction: (action: string) => managers.get('undoManager')?.record(action),
    undo: () => managers.get('undoManager')?.undo(),
    redo: () => managers.get('undoManager')?.redo(),
    canUndo: () => managers.get('undoManager')?.canUndo() ?? false,
    canRedo: () => managers.get('undoManager')?.canRedo() ?? false,

    // Theme Manager
    setTheme: (theme: string) => managers.get('themeManager')?.setTheme(theme),
    toggleTheme: () => managers.get('themeManager')?.toggle(),
    isDarkMode: () => managers.get('themeManager')?.isDark() ?? false,

    // Animation Manager
    animate: (element: HTMLElement, props: Record<string, unknown>, options: Record<string, unknown>) => managers.get('animationManager')?.animate(element, props, options),
    fadeIn: (element: HTMLElement, duration: number) => managers.get('animationManager')?.fadeIn(element, duration),
    fadeOut: (element: HTMLElement, duration: number) => managers.get('animationManager')?.fadeOut(element, duration),

    // Media Query Manager
    getCurrentBreakpoint: () => managers.get('mediaQueryManager')?.getCurrentBreakpoint(),
    isMobileDevice: () => managers.get('mediaQueryManager')?.isMobile() ?? false,
    isDesktopDevice: () => managers.get('mediaQueryManager')?.isDesktop() ?? false,
    onBreakpointChange: (callback: (...args: unknown[]) => void) => managers.get('mediaQueryManager')?.onBreakpointChange(callback),

    // Intersection Manager
    lazyLoad: (selector: string, options: Record<string, unknown>) => managers.get('intersectionManager')?.lazyLoad(selector, options),
    observeIntersection: (element: HTMLElement, callbacks: unknown, options: Record<string, unknown>) => managers.get('intersectionManager')?.observe(element, callbacks, options),

    // Resize Manager
    observeResize: (element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown>) => managers.get('resizeManager')?.observe(element, callback, options),

    // Mutation Manager
    watchDOM: (element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown>) => managers.get('mutationManager')?.observe(element, callback, options),

    // Permission Manager
    queryPermission: (permission: string) => managers.get('permissionManager')?.query(permission),
    requestPermission: (permission: string) => managers.get('permissionManager')?.request(permission),

    // Network Manager
    isOnline: () => managers.get('networkManager')?.isOnline() ?? navigator.onLine,
    isOffline: () => managers.get('networkManager')?.isOffline() ?? !navigator.onLine,
    onOnline: (callback: (...args: unknown[]) => void) => managers.get('networkManager')?.onOnline(callback),
    onOffline: (callback: (...args: unknown[]) => void) => managers.get('networkManager')?.onOffline(callback),
    getNetworkInfo: () => managers.get('networkManager')?.getConnectionInfo(),

    // Geolocation Manager
    getCurrentPosition: (options: Record<string, unknown>) => managers.get('geolocationManager')?.getCurrentPosition(options),
    watchPosition: (callback: (...args: unknown[]) => void, errorCallback: unknown, options: Record<string, unknown>) => managers.get('geolocationManager')?.watchPosition(callback, errorCallback, options),

    // Device Manager
    getDeviceType: () => managers.get('deviceManager')?.getDeviceType(),
    getDeviceInfo: () => managers.get('deviceManager')?.getFullInfo(),
    isMobile: () => managers.get('deviceManager')?.isMobile() ?? false,
    isTouch: () => managers.get('deviceManager')?.isTouch() ?? false,

    // Battery Manager
    getBatteryLevel: () => managers.get('batteryManager')?.getLevelPercent(),
    isBatteryCharging: () => managers.get('batteryManager')?.isCharging(),
    onBatteryLow: (callback: (...args: unknown[]) => void) => managers.get('batteryManager')?.onLow(callback),

    // Fullscreen Manager
    enterFullscreen: (element: HTMLElement) => managers.get('fullscreenManager')?.enter(element),
    exitFullscreen: () => managers.get('fullscreenManager')?.exit(),
    toggleFullscreen: (element: HTMLElement) => managers.get('fullscreenManager')?.toggle(element),
    isFullscreen: () => managers.get('fullscreenManager')?.isFullscreen() ?? false,

    // Visibility Manager
    isPageVisible: () => managers.get('visibilityManager')?.isVisible() ?? true,
    onPageVisible: (callback: (...args: unknown[]) => void) => managers.get('visibilityManager')?.onVisible(callback),
    onPageHidden: (callback: (...args: unknown[]) => void) => managers.get('visibilityManager')?.onHidden(callback),

    // Wake Lock Manager
    acquireWakeLock: () => managers.get('wakeLockManager')?.acquire(),
    releaseWakeLock: () => managers.get('wakeLockManager')?.release(),

    // Share Manager
    share: (data: Record<string, unknown>) => managers.get('shareManager')?.share(data),
    shareTo: (target: HTMLElement, data: Record<string, unknown>) => managers.get('shareManager')?.shareTo(target, data)
  };
}

export default { createConvenienceMethods };
