// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/icons
// PURPOSE: Panel-02 - Icons (IconRegistry Adapter)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   IconRegistry from /components/icon-registry/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ICONS — exported value
//   getFileIcon() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { IconRegistry } from '/components/icon-registry/index.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-02/icons';

// Helper para buscar ícone com fallback multi-namespace
function getIcon(name: string, size = 16) {
  const namespaces = ['extended', 'ui', 'system', 'charts', 'business'];
  for (const ns of namespaces) {
    const svg = IconRegistry.get(`${ns}:${name}`);
    if (svg) {
      return svg.replace(/width="24"/g, `width="${size}"`).replace(/height="24"/g, `height="${size}"`);
    }
  }
  return '';
}

// Mapeamento de nomes para nomes do registry
const NAME_MAP = {
  'document': 'file-document',
  'folderOpen': 'folder-open',
  'cloudUpload': 'cloud-upload',
  'hdd': 'hard-drive',
  'checkCircle': 'check-circle',
  'alertCircle': 'alert-circle',
  'alertTriangle': 'alert-triangle',
  'recent': 'clock',
  'checkSquare': 'check-square',
  'sortAsc': 'sort-asc',
  'sortDesc': 'sort-desc',
  'zoomIn': 'zoom-in',
  'zoomOut': 'zoom-out',
  'fileInfo': 'file-info',
  'pieChart': 'pie',
  'barChart': 'bar'
};

// Proxy object para acesso dinâmico
export const ICONS = new Proxy({}, {
  get(target: Record<string, unknown>, prop: string | symbol) {
    if (prop === 'then') return undefined;
    const mappedName = (NAME_MAP as Record<string, string>)[prop as string] || (prop as string);
    return getIcon(mappedName, 16);
  },
  has(target: Record<string, unknown>, prop: string | symbol) {
    return true;
  }
});

export function getFileIcon(type: string) {
  const typeMap: Record<string, string> = {
    'image': 'image',
    'video': 'video',
    'audio': 'audio',
    'document': 'file-document',
    'other': 'archive'
  };
  return getIcon(typeMap[type] || 'file', 16);
}

export function healthCheck() {
  return {
    // @ts-expect-error strict migration — TS2774
    status: IconRegistry.get ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    source: 'IconRegistry'
  };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, source: 'IconRegistry' };
}

export default ICONS;
