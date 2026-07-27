// Migrado para TypeScript: 2026-02-25
'use strict';
// Panels - Central Registry
// @version 1.2.0-ENTERPRISE
// v1.2.0: _log migrado para Logger enterprise (remove console.*)

import { Logger } from '/assets/js/core/logger-global/index.js';

// --- Interfaces ---

interface PanelModule {
  default?: unknown;
  [key: string]: unknown;
}

interface PanelsByCategory {
  numeric: string[];
  special: string[];
  enterprise: string[];
}

interface PanelsInfo {
  version: string;
  moduleId: string;
  totalPanels: number;
  loadedPanels: number;
  categories: PanelsByCategory;
}

interface LoggerInterface {
  error?: (prefix: string, ...args: unknown[]) => void;
  warn?: (prefix: string, ...args: unknown[]) => void;
  debug?: (prefix: string, ...args: unknown[]) => void;
}

type PanelImporter = () => Promise<PanelModule>;
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const VERSION: string = '1.2.0-ENTERPRISE';
export const MODULE_ID: string = 'panels-registry';

const hasWindow: boolean = typeof window !== 'undefined';
const _debugEnabled = (): boolean => hasWindow && window.APP_CONFIG?.app?.debug === true;
const _log = (level: LogLevel, ...args: unknown[]): void => {
  if (!Logger) return;
  const typedLogger = Logger as unknown as LoggerInterface;
  if (level === 'error') { typedLogger.error?.(`[${MODULE_ID}]`, ...args); return; }
  if (level === 'warn') { typedLogger.warn?.(`[${MODULE_ID}]`, ...args); return; }
  if (_debugEnabled()) typedLogger.debug?.(`[${MODULE_ID}]`, ...args);
};

// Imports dinâmicos para lazy loading
const panelImports: Record<string, PanelImporter> = {
  // Panels numerados (01-19)
  'panel-01': () => import('./panel-01/index.js'),
  'panel-02': () => import('./panel-02/index.js'),
  'panel-03': () => import('./panel-03/index.js'),
  'panel-04': () => import('./panel-04/index.js'),
  'panel-05': () => import('./panel-05/index.js'),
  'panel-06': () => import('./panel-06/index.js'),
  'panel-07': () => import('./panel-07/index.js'),
  'panel-08': () => import('./panel-08/index.js'),
  'panel-09': () => import('./panel-09/index.js'),
  'panel-10': () => import('./panel-10/index.js'),
  'panel-11': () => import('./panel-11/index.js'),
  'panel-12': () => import('./panel-12/index.js'),
  'panel-13': () => import('./panel-13/index.js'),
  'panel-14': () => import('./panel-14/index.js'),
  'panel-15': () => import('./panel-15/index.js'),
  'panel-16': () => import('./panel-16/index.js'),
  'panel-17': () => import('./panel-17/index.js'),
  'panel-18': () => import('./panel-18/index.js'),
  'panel-19': () => import('./panel-19/index.js'),
  // Panels especiais
  'panel-cards': () => import('./panel-cards/index.js'),
  'panel-dashboard': () => import('./panel-dashboard/index.js'),
  'panel-orchestrator': () => import('./panel-orchestrator/index.js'),
  'panel-audit-trail': () => import('./panel-audit-trail/index.js'),
  // Panels enterprise (admin)
  'panel-permissions-admin': () => import('./panel-permissions-admin/index.js'),
  'panel-session-admin': () => import('./panel-session-admin/index.js'),
  'panel-user-management': () => import('./panel-user-management/index.js'),
  'panel-user-preferences': () => import('./panel-user-preferences/index.js')
};

// Cache de painéis carregados
const loadedPanels: Map<string, unknown> = new Map();

// Carregar painel por ID
export async function loadPanel(panelId: string): Promise<unknown> {
  if (loadedPanels.has(panelId)) return loadedPanels.get(panelId);

  const importer = panelImports[panelId];
  if (!importer) {
    _log('warn', `Painel não encontrado: ${panelId}`);
    return null;
  }

  try {
    const module: PanelModule = await importer();
    loadedPanels.set(panelId, module.default || module);
    _log('info', `Painel carregado: ${panelId}`);
    return loadedPanels.get(panelId);
  } catch (error) {
    _log('error', `Erro ao carregar ${panelId}:`, error);
    return null;
  }
}

// Listar painéis disponíveis
export function getAvailablePanels(): string[] {
  return Object.keys(panelImports);
}

// Listar por categoria
export function getPanelsByCategory(): PanelsByCategory {
  return {
    numeric: Object.keys(panelImports).filter(k => /^panel-\d+$/.test(k)),
    special: ['panel-cards', 'panel-dashboard', 'panel-orchestrator', 'panel-audit-trail'],
    enterprise: ['panel-permissions-admin', 'panel-session-admin', 'panel-user-management', 'panel-user-preferences']
  };
}

// Info
export function getInfo(): PanelsInfo {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    totalPanels: Object.keys(panelImports).length,
    loadedPanels: loadedPanels.size,
    categories: getPanelsByCategory()
  };
}

export default { loadPanel, getAvailablePanels, getPanelsByCategory, getInfo, VERSION, MODULE_ID };
