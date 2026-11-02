// Mode Switcher Component
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 2.0.0-PORTSFACTORY
// @changelog v2.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.1.0-ENTERPRISE - Logger fallback pattern
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'core.ui-orchestrator.components.mode-switcher';
const VERSION = '2.0.0-P2-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger') as Record<string, ((...a: unknown[]) => void) | undefined> | null;
  const fn = logger?.[level];
  if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args);
};

const MODES = { LIGHT: 'light', DARK: 'dark', AUTO: 'auto' };

let currentMode = MODES.DARK;
let listeners: ((newMode: string, oldMode: string) => void)[] = [];
let _portsInitialized = false;

const getMode = () => currentMode;

const setMode = (mode: string) => {
  if (!Object.values(MODES).includes(mode)) {
    _log('warn', `Modo inválido: ${mode}`);
    return false;
  }
  const previousMode = currentMode;
  currentMode = mode;
  applyMode(mode);
  notifyListeners(mode, previousMode);
  return true;
};

const applyMode = (mode: string) => {
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-dark', 'theme-auto');
  root.classList.add(`theme-${mode}`);
  if (mode === MODES.AUTO) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', mode);
  }
};

const toggleMode = () => {
  const modes = Object.values(MODES);
  const currentIndex = modes.indexOf(currentMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  return setMode(modes[nextIndex]);
};

const onModeChange = (callback: (newMode: string, oldMode: string) => void) => {
  if (typeof callback === 'function') {
    listeners.push(callback);
    return () => { listeners = listeners.filter((cb) => cb !== callback); };
  }
  return () => {};
};

const notifyListeners = (newMode: string, oldMode: string) => {
  for (const listener of listeners) {
    try { listener(newMode, oldMode); }
    catch (err) { _log('error', 'Erro no listener:', err); }
  }
};

const init = () => {
  _initPorts();
  _portsInitialized = true;
  const savedMode = localStorage.getItem('ui-mode');
  if (savedMode && Object.values(MODES).includes(savedMode)) { setMode(savedMode); }
  else { applyMode(currentMode); }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (_e: MediaQueryListEvent) => {
    if (currentMode === MODES.AUTO) { applyMode(MODES.AUTO); }
  });
  return true;
};

const destroy = () => { listeners = []; };

const healthCheck = () => ({ status: _portsInitialized ? 'HEALTHY' : 'DEGRADED', mode: currentMode, listenersCount: listeners.length, version: VERSION, moduleId: MODULE_ID, portsInitialized: _portsInitialized });

const info = () => ({ moduleId: MODULE_ID, version: VERSION, mode: currentMode, availableModes: Object.values(MODES), portsInitialized: _portsInitialized });

export { MODES, getMode, setMode, toggleMode, applyMode, onModeChange, init, destroy, healthCheck, info, MODULE_ID, VERSION };
