import { EXPORT_FORMATS, EXPORT_SCOPES } from "./constants.js";
import { _state, incrementMetric } from "./state.js";
import { collectConfigByScope } from "./collectors.js";
import { validateChecksum, generateChecksum } from "./validators.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.config-exporter.operations";
function exportConfig(options) {
  options = options || {};
  const format = options.format || EXPORT_FORMATS.JSON;
  const scope = options.scope || EXPORT_SCOPES.ALL;
  try {
    const config = collectConfigByScope(scope);
    const exportData = {
      version: "1.0",
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
        params.set("config", btoa(JSON.stringify(exportData)));
        result = `${window.location.origin + window.location.pathname}?${params.toString()}`;
        break;
      default:
        result = JSON.stringify(exportData, null, 2);
    }
    _state.lastExport = Date.now();
    incrementMetric("exports");
    return { ok: true, data: result, format };
  } catch (e) {
    incrementMetric("exportErrors");
    return { ok: false, error: e.message };
  }
}
function exportToFile(options) {
  options = options || {};
  const result = exportConfig(options);
  if (!result.ok) return result;
  try {
    const filename = options.filename || `app-shell-config-${Date.now()}.json`;
    const blob = new Blob([result.data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { ok: true, filename };
  } catch (e) {
    incrementMetric("exportErrors");
    return { ok: false, error: e.message };
  }
}
function exportToClipboard(options) {
  const result = exportConfig(options);
  if (!result.ok) return Promise.resolve(result);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(result.data).then(() => ({
      ok: true
    })).catch((e) => {
      incrementMetric("exportErrors");
      return { ok: false, error: e.message };
    });
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = result.data;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return Promise.resolve({ ok: true });
  } catch (e) {
    incrementMetric("exportErrors");
    return Promise.resolve({ ok: false, error: e.message });
  }
}
function importConfig(data, options) {
  options = options || {};
  try {
    let parsed;
    if (typeof data === "string") {
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        try {
          parsed = JSON.parse(atob(data));
        } catch (e2) {
          return { ok: false, error: "Invalid format" };
        }
      }
    } else {
      parsed = data;
    }
    if (!parsed.data || !parsed.checksum) {
      return { ok: false, error: "Invalid config structure" };
    }
    if (!options.skipValidation && !validateChecksum(parsed.data, parsed.checksum)) {
      return { ok: false, error: "Checksum validation failed" };
    }
    applyImportedConfig(parsed.data, parsed.scope);
    _state.lastImport = Date.now();
    incrementMetric("imports");
    return { ok: true, scope: parsed.scope, timestamp: parsed.timestamp };
  } catch (e) {
    incrementMetric("importErrors");
    return { ok: false, error: e.message };
  }
}
function importFromFile(file, options) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = importConfig(e.target.result, options);
      resolve(result);
    };
    reader.onerror = () => {
      incrementMetric("importErrors");
      resolve({ ok: false, error: "Failed to read file" });
    };
    reader.readAsText(file);
  });
}
function importFromClipboard(options) {
  if (navigator.clipboard && navigator.clipboard.readText) {
    return navigator.clipboard.readText().then((text) => importConfig(text, options)).catch((e) => {
      incrementMetric("importErrors");
      return { ok: false, error: e.message };
    });
  }
  return Promise.resolve({ ok: false, error: "Clipboard API not available" });
}
function applyImportedConfig(config, scope) {
  const appShell = typeof window !== "undefined" ? window.AppShell : null;
  if (!appShell) return;
  if (config.layoutPrefs && appShell.layoutPrefs) {
    const keys = Object.keys(config.layoutPrefs);
    for (let i = 0; i < keys.length; i++) {
      if (typeof appShell.layoutPrefs.setPreference === "function") {
        appShell.layoutPrefs.setPreference(keys[i], config.layoutPrefs[keys[i]]);
      }
    }
  }
  if (config.layoutPreset && appShell.layoutPresets) {
    if (typeof appShell.layoutPresets.apply === "function") {
      appShell.layoutPresets.apply(config.layoutPreset);
    }
  }
  if (config.theme && appShell.theme) {
    if (typeof appShell.theme.setTheme === "function") {
      appShell.theme.setTheme(config.theme);
    }
  }
  if (config.a11yPresets && appShell.accessibilityPresets) {
    const presets = config.a11yPresets;
    for (let j = 0; j < presets.length; j++) {
      if (typeof appShell.accessibilityPresets.apply === "function") {
        appShell.accessibilityPresets.apply(presets[j]);
      }
    }
  }
  if (config.debugPreset && appShell.debugPresets) {
    if (typeof appShell.debugPresets.apply === "function") {
      appShell.debugPresets.apply(config.debugPreset);
    }
  }
}
export {
  MODULE_ID,
  VERSION,
  applyImportedConfig,
  exportConfig,
  exportToClipboard,
  exportToFile,
  importConfig,
  importFromClipboard,
  importFromFile
};
