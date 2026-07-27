/**
 * @file Config Exporter — Operations
 * @version 1.1.0-P2-ENTERPRISE
 * @module app-shell/utils/config-exporter/operations
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./constants.js (EXPORT_FORMATS, EXPORT_SCOPES)
 * @requires ./state.js (_state, incrementMetric)
 * @requires ./collectors.js (collectConfigByScope)
 * @requires ./validators.js (validateChecksum, generateChecksum)
 * 
 * @provides exportConfig, exportToFile, exportToClipboard
 * @provides importConfig, importFromFile, importFromClipboard
 * @provides applyImportedConfig
 * 
 * @browserAPI Blob, URL.createObjectURL, navigator.clipboard, FileReader
 * 
 * @description
 * Export and import operations for configuration data.
 * Supports JSON, Base64, and URL formats with checksum validation.
 * 
 * @example
 * import { exportToFile, importFromClipboard } from './operations.js';
 * await exportToFile({ format: 'json', scope: 'all' });
 * const config = await importFromClipboard();
 * ============================================================================
 */
'use strict';

import { EXPORT_FORMATS, EXPORT_SCOPES } from './constants.js';
import { _state, incrementMetric } from './state.js';
import { collectConfigByScope } from './collectors.js';
import { validateChecksum, generateChecksum } from './validators.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.config-exporter.operations';

export function exportConfig(options: DynObj) {
  options = options || {};
  const format = options.format || EXPORT_FORMATS.JSON;
  const scope = options.scope || EXPORT_SCOPES.ALL;
  
  try {
    const config = collectConfigByScope(scope);
    
    const exportData = {
      version: '1.0',
      scope,
      timestamp: Date.now(),
      checksum: generateChecksum(config),
      data: config
    };
    
    let result;
    
    switch (format) {
      case EXPORT_FORMATS.BASE64:
        result = btoa(JSON.stringify(exportData));
        break;
      case EXPORT_FORMATS.URL:
        const params = new URLSearchParams();
        params.set('config', btoa(JSON.stringify(exportData)));
        result = `${window.location.origin + window.location.pathname}?${params.toString()}`;
        break;
      default:
        result = JSON.stringify(exportData, null, 2);
    }
    
    _state.lastExport = Date.now();
    incrementMetric('exports');
    
    return { ok: true, data: result, format };
  } catch (e: any) {
    incrementMetric('exportErrors');
    return { ok: false, error: e.message };
  }
}

export function exportToFile(options: DynObj) {
  options = options || {};
  const result = exportConfig(options);
  
  if (!result.ok) return result;
  
  try {
    const filename = options.filename || `app-shell-config-${Date.now()}.json`;
    // @ts-expect-error strict migration — TS2322
    const blob = new Blob([result.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return { ok: true, filename };
  } catch (e: any) {
    incrementMetric('exportErrors');
    return { ok: false, error: e.message };
  }
}

export function exportToClipboard(options: DynObj) {
  const result = exportConfig(options);
  
  if (!result.ok) return Promise.resolve(result);
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    // @ts-expect-error strict migration — TS2345
    return navigator.clipboard.writeText(result.data)
      .then(() => ({
      ok: true
    }))
      .catch(e => {
        incrementMetric('exportErrors');
        return { ok: false, error: e.message };
      });
  }
  
  try {
    const ta = document.createElement('textarea');
    // @ts-expect-error strict migration — TS2322
    ta.value = result.data;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve({ ok: true });
  } catch (e: any) {
    incrementMetric('exportErrors');
    return Promise.resolve({ ok: false, error: e.message });
  }
}

export function importConfig(data: DynObj, options: DynObj) {
  options = options || {};
  
  try {
    let parsed;
    
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data);
      } catch (e: any) {
        try {
          parsed = JSON.parse(atob(data));
        } catch (e2) {
          return { ok: false, error: 'Invalid format' };
        }
      }
    } else {
      parsed = data;
    }
    
    if (!parsed.data || !parsed.checksum) {
      return { ok: false, error: 'Invalid config structure' };
    }
    
    if (!options.skipValidation && !validateChecksum(parsed.data, parsed.checksum)) {
      return { ok: false, error: 'Checksum validation failed' };
    }
    
    applyImportedConfig(parsed.data, parsed.scope);
    
    _state.lastImport = Date.now();
    incrementMetric('imports');
    
    return { ok: true, scope: parsed.scope, timestamp: parsed.timestamp };
  } catch (e: any) {
    incrementMetric('importErrors');
    return { ok: false, error: e.message };
  }
}

export function importFromFile(file: DynObj, options: DynObj) {
  return new Promise(resolve => {
    const reader = new FileReader();
    
    reader.onload = e => {
      // @ts-expect-error strict migration — TS18047
      const result = importConfig(e.target.result, options);
      resolve(result);
    };
    
    reader.onerror = () => {
      incrementMetric('importErrors');
      resolve({ ok: false, error: 'Failed to read file' });
    };
    
    reader.readAsText(file);
  });
}

export function importFromClipboard(options: DynObj) {
  if (navigator.clipboard && navigator.clipboard.readText) {
    return navigator.clipboard.readText()
      .then(text => importConfig(text, options))
      .catch(e => {
        incrementMetric('importErrors');
        return { ok: false, error: e.message };
      });
  }
  
  return Promise.resolve({ ok: false, error: 'Clipboard API not available' });
}

export function applyImportedConfig(config: DynObj, scope: DynObj) {
  const appShell = typeof window !== 'undefined' ? (window as any).AppShell : null;
  if (!appShell) return;
  
  if (config.layoutPrefs && appShell.layoutPrefs) {
    const keys = Object.keys(config.layoutPrefs);
    for (let i = 0; i < keys.length; i++) {
      if (typeof appShell.layoutPrefs.setPreference === 'function') {
        appShell.layoutPrefs.setPreference(keys[i], config.layoutPrefs[keys[i]]);
      }
    }
  }
  
  if (config.layoutPreset && appShell.layoutPresets) {
    if (typeof appShell.layoutPresets.apply === 'function') {
      appShell.layoutPresets.apply(config.layoutPreset);
    }
  }
  
  if (config.theme && appShell.theme) {
    if (typeof appShell.theme.setTheme === 'function') {
      appShell.theme.setTheme(config.theme);
    }
  }
  
  if (config.a11yPresets && appShell.accessibilityPresets) {
    const presets = config.a11yPresets;
    for (let j = 0; j < presets.length; j++) {
      if (typeof appShell.accessibilityPresets.apply === 'function') {
        appShell.accessibilityPresets.apply(presets[j]);
      }
    }
  }
  
  if (config.debugPreset && appShell.debugPresets) {
    if (typeof appShell.debugPresets.apply === 'function') {
      appShell.debugPresets.apply(config.debugPreset);
    }
  }
}
