// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:battery-manager
// PURPOSE: Battery Manager - Monitoramento de bateria
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BATTERY_STATES — exported value
//   createBatteryManager() — exported function
//   getBatteryManager() — exported function
//   resetBatteryManager() — exported function
//   getBatteryLevel() — exported function
//   isBatteryCharging() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'chargingchange'
//   'chargingtimechange'
//   'dischargingtimechange'
//   'levelchange'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE7';
export const MODULE_ID = 'container-main:battery-manager';

export const BATTERY_STATES = Object.freeze({ CHARGING: 'charging', DISCHARGING: 'discharging', FULL: 'full', UNKNOWN: 'unknown' });

export function createBatteryManager(options: Record<string, any> = {}) {
  const { lowThreshold = 0.2, criticalThreshold = 0.1, onLowBattery = null, onCriticalBattery = null, onChargingChange = null } = options;

  const _logger = createLogger(MODULE_ID);
  let _battery: { level: number; charging: boolean; chargingTime: number; dischargingTime: number; addEventListener: (type: string, handler: () => void) => void; removeEventListener: (type: string, handler: () => void) => void } | null = null;
  let _supported = false;
  let _lastLevel = 1;
  let _lastCharging = true;
  const _listeners = new Map<string, Record<string, unknown>>();
  let _counter = 0;
  let _metrics = { levelChanges: 0, chargingChanges: 0, lowAlerts: 0, criticalAlerts: 0 };

  function _getState() {
    if (!_battery) return BATTERY_STATES.UNKNOWN;
    if (_battery.charging && _battery.level === 1) return BATTERY_STATES.FULL;
    if (_battery.charging) return BATTERY_STATES.CHARGING;
    return BATTERY_STATES.DISCHARGING;
  }

  function _notifyListeners(event: string, data: Record<string, unknown>) {
    _listeners.forEach((config: Record<string, unknown>) => {
      if (config.event === event || config.event === 'all') {
        try { (config.callback as (...args: unknown[]) => void)(data); } catch (e) { _logger.error('Listener error:', e); }
      }
    });
  }

  function _handleLevelChange() {
    if (!_battery) return;
    _metrics.levelChanges++;
    const level = _battery.level;
    const data = { level, charging: _battery.charging, state: _getState(), chargingTime: _battery.chargingTime, dischargingTime: _battery.dischargingTime };

    _notifyListeners('levelchange', data);

    if (level <= criticalThreshold && _lastLevel > criticalThreshold) {
      _metrics.criticalAlerts++;
      _notifyListeners('critical', data);
      onCriticalBattery?.(data);
    } else if (level <= lowThreshold && _lastLevel > lowThreshold) {
      _metrics.lowAlerts++;
      _notifyListeners('low', data);
      onLowBattery?.(data);
    }

    _lastLevel = level;
  }

  function _handleChargingChange() {
    if (!_battery) return;
    _metrics.chargingChanges++;
    const data = { level: _battery.level, charging: _battery.charging, state: _getState(), chargingTime: _battery.chargingTime, dischargingTime: _battery.dischargingTime };
    _lastCharging = _battery.charging;
    _notifyListeners('chargingchange', data);
    onChargingChange?.(data);
  }

  async function _init() {
    if (!('getBattery' in navigator)) { _supported = false; return; }
    try {

      // @ts-expect-error TS migration - TS2349
      _battery = await navigator.getBattery();
      _supported = true;
      _lastLevel = _battery!.level;
      _lastCharging = _battery!.charging;
      _battery!.addEventListener('levelchange', _handleLevelChange);
      _battery!.addEventListener('chargingchange', _handleChargingChange);
      _battery!.addEventListener('chargingtimechange', () => _notifyListeners('chargingtimechange', { chargingTime: _battery!.chargingTime }));
      _battery!.addEventListener('dischargingtimechange', () => _notifyListeners('dischargingtimechange', { dischargingTime: _battery!.dischargingTime }));
    } catch (e) {
      _supported = false;
      // @ts-expect-error strict migration — TS2345
      _logger.warn('Battery API not available:', e);
    }
  }

  _init();

  const manager = {
    isSupported() { return _supported; },

    getLevel() { return _battery?.level ?? null; },
    getLevelPercent() { return _battery ? Math.round(_battery.level * 100) : null; },
    isCharging() { return _battery?.charging ?? null; },
    getState() { return _getState(); },
    getChargingTime() { return _battery?.chargingTime ?? null; },
    getDischargingTime() { return _battery?.dischargingTime ?? null; },

    getInfo() {
      if (!_battery) return null;
      return { level: _battery.level, levelPercent: Math.round(_battery.level * 100), charging: _battery.charging, state: _getState(), chargingTime: _battery.chargingTime, dischargingTime: _battery.dischargingTime };
    },

    isLow() { return _battery ? _battery.level <= lowThreshold : false; },
    isCritical() { return _battery ? _battery.level <= criticalThreshold : false; },

    onLevelChange(callback: (...args: unknown[]) => void) { const id = `level-${++_counter}`; _listeners.set(id, { event: 'levelchange', callback }); return id; },
    onChargingChange(callback: (...args: unknown[]) => void) { const id = `charge-${++_counter}`; _listeners.set(id, { event: 'chargingchange', callback }); return id; },
    onLow(callback: (...args: unknown[]) => void) { const id = `low-${++_counter}`; _listeners.set(id, { event: 'low', callback }); return id; },
    onCritical(callback: (...args: unknown[]) => void) { const id = `crit-${++_counter}`; _listeners.set(id, { event: 'critical', callback }); return id; },
    onChange(callback: (...args: unknown[]) => void) { const id = `all-${++_counter}`; _listeners.set(id, { event: 'all', callback }); return id; },
    off(id: string) { return _listeners.delete(id); },

    getMetrics() { return { ..._metrics, supported: _supported, listeners: _listeners.size }; },
    resetMetrics() { _metrics = { levelChanges: 0, chargingChanges: 0, lowAlerts: 0, criticalAlerts: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, supported: _supported, level: this.getLevelPercent(), charging: this.isCharging(), state: _getState() }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, supported: _supported, batteryInfo: this.getInfo() }; },

    destroy() {
      if (_battery) {
        _battery.removeEventListener('levelchange', _handleLevelChange);
        _battery.removeEventListener('chargingchange', _handleChargingChange);
      }
      _listeners.clear();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getBatteryManager(options: Record<string, any> = {}) { if (!_instance) _instance = createBatteryManager(options); return _instance; }
export function resetBatteryManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function getBatteryLevel() { return (getBatteryManager().getLevelPercent as (...args: unknown[]) => unknown)(); }
export function isBatteryCharging() { return (getBatteryManager().isCharging as (...args: unknown[]) => unknown)(); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, states: Object.keys(BATTERY_STATES) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, BATTERY_STATES, createBatteryManager, getBatteryManager, resetBatteryManager, getBatteryLevel, isBatteryCharging, info, healthCheck };
