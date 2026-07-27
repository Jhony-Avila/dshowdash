// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Layout Persistence — Core Operations
 * @version 1.2.1-IMPORT-FIX
 * @module app-shell/state/layout-persistence/core
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires /core/runtime/early-boot-logger.js (createEarlyLogger)
 * @requires ./constants.js (STORAGE_KEY, STORAGE_VERSION)
 * 
 * @provides load, save, get, getPreference, setPreference, setPreferences
 * @provides reset, clear, getMetrics
 * 
 * @browserAPI localStorage
 * 
 * @description
 * Core CRUD operations for layout persistence.
 * Uses early logger for unified logging pipeline during boot.
 * 
 * @changelog v1.2.1-IMPORT-FIX - Fixed corrupted import (STORAGE_KEY, STORAGE_VERSION)
 * @changelog v1.2.0-EARLY-BOOT-LOGGER - Migrated to early boot logger
 * 
 * @example
 * import { load, save, getPreference, setPreference } from './core.js';
 * load();
 * setPreference('sidebar.collapsed', true);
 * save();
 * ============================================================================
 */
'use strict';

import { createEarlyLogger } from '/core/runtime/early-boot-logger.js';
import { STORAGE_KEY, STORAGE_VERSION } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.state.layout-persistence.core';

const logger = createEarlyLogger('layout-persistence');

let _data: DynObj = null;
const _metrics = { loads: 0, saves: 0, resets: 0, errors: 0 };

export function load(_proxy?: DynObj) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      _data = { version: STORAGE_VERSION, preferences: {}, timestamp: Date.now() };
      _metrics.loads++;
      return _data;
    }
    
    const parsed = JSON.parse(stored);
    
    if (parsed.version !== STORAGE_VERSION) {
      logger.warn('Schema version mismatch, resetting');
      _data = { version: STORAGE_VERSION, preferences: {}, timestamp: Date.now() };
    } else {
      _data = parsed;
    }
    
    _metrics.loads++;
    return _data;
  } catch (e: any) {
    _metrics.errors++;
    logger.error(`Load failed: ${e.message}`);
    _data = { version: STORAGE_VERSION, preferences: {}, timestamp: Date.now() };
    return _data;
  }
}

export function save(_proxy?: DynObj) {
  if (!_data) load();
  
  try {
    _data.timestamp = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
    _metrics.saves++;
    return true;
  } catch (e: any) {
    _metrics.errors++;
    logger.error(`Save failed: ${e.message}`);
    return false;
  }
}

export function get(path?: DynObj, _proxy?: DynObj) {
  if (!_data) load();
  
  if (!path) return _data;
  
  const parts = path.split('.');
  let current = _data;
  
  for (let i = 0; i < parts.length; i++) {
    if (current === null || current === undefined) return undefined;
    current = current[parts[i]];
  }
  
  return current;
}

export function getPreference(path: DynObj, defaultValue?: DynObj, _proxy?: DynObj) {
  if (!_data) load();
  
  const parts = path.split('.');
  let current = _data.preferences;
  
  for (let i = 0; i < parts.length; i++) {
    if (current === null || current === undefined) return defaultValue;
    current = current[parts[i]];
  }
  
  return current !== undefined ? current : defaultValue;
}

export function setPreference(path: DynObj, value: DynObj, options?: DynObj, _proxy?: DynObj) {
  options = options || {};
  if (!_data) load();
  
  const parts = path.split('.');
  let current = _data.preferences;
  
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  
  current[parts[parts.length - 1]] = value;
  
  if (options.persist !== false) {
    save();
  }
  
  return true;
}

export function setPreferences(preferences: DynObj, options?: DynObj, _proxy?: DynObj) {
  options = options || {};
  if (!_data) load();
  
  const keys = Object.keys(preferences);
  for (let i = 0; i < keys.length; i++) {
    setPreference(keys[i], preferences[keys[i]], { persist: false });
  }
  
  if (options.persist !== false) {
    save();
  }
  
  return true;
}

export function reset(_opts?: DynObj, _proxy?: DynObj) {
  _data = { version: STORAGE_VERSION, preferences: {}, timestamp: Date.now() };
  _metrics.resets++;
  save();
  return true;
}

export function clear(_proxy?: DynObj) {
  try {
    localStorage.removeItem(STORAGE_KEY);
    _data = null;
    return true;
  } catch (e: any) {
    _metrics.errors++;
    return false;
  }
}

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export default {
  load,
  save,
  get,
  getPreference,
  setPreference,
  setPreferences,
  reset,
  clear,
  getMetrics
};
