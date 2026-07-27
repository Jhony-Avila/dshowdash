// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-user-preferences-ui-template-history
// PURPOSE: Panel User Preferences - History Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ../core/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderHistorySection() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { ICONS } from '../core/constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels-panel-user-preferences-ui-template-history';

interface HistoryItem {
  action_type: string;
  created_at?: string;
  timestamp?: string;
  description?: string;
  action_description?: string;
}

interface HistoryData {
  items?: HistoryItem[];
}

const _s = (str: string | null | undefined) => !str ? '' : String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const formatTimeAgo = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor(((now as any) - (date as any)) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const ACTION_CONFIG = {
  theme_changed: { icon: ICONS.sun, color: 'rgba(251,191,36,0.12)', textColor: '#fbbf24', label: 'Tema' },
  density_changed: { icon: ICONS.sliders, color: 'rgba(139,92,246,0.12)', textColor: '#a78bfa', label: 'Densidade' },
  layout_saved: { icon: ICONS.layout, color: 'rgba(52,211,153,0.12)', textColor: '#34d399', label: 'Layout' },
  layout_applied: { icon: ICONS.check, color: 'rgba(59,130,246,0.12)', textColor: '#60a5fa', label: 'Layout' },
  layout_deleted: { icon: ICONS.trash, color: 'rgba(239,68,68,0.12)', textColor: '#f87171', label: 'Layout' },
  view_applied: { icon: ICONS.eye, color: 'rgba(59,130,246,0.12)', textColor: '#60a5fa', label: 'View' },
  view_deleted: { icon: ICONS.trash, color: 'rgba(239,68,68,0.12)', textColor: '#f87171', label: 'View' },
  notification_changed: { icon: ICONS.bell, color: 'rgba(59,130,246,0.12)', textColor: '#60a5fa', label: 'Notificação' },
  preferences_exported: { icon: ICONS.download, color: 'rgba(16,185,129,0.12)', textColor: '#10b981', label: 'Export' },
  preferences_imported: { icon: ICONS.upload, color: 'rgba(139,92,246,0.12)', textColor: '#a78bfa', label: 'Import' },
  default: { icon: ICONS.settings, color: 'rgba(255,255,255,0.05)', textColor: 'rgba(255,255,255,0.5)', label: 'Alteração' }
};

export const renderHistorySection = (history: HistoryData | HistoryItem[]) => {
  const items: HistoryItem[] = Array.isArray(history) ? history : (history?.items ?? []);
  return `<section class="pup-section" aria-labelledby="history-title"><div class="pup-sec-hdr"><div class="pup-sec-left"><div class="pup-sec-icon orange">${ICONS.history}</div><h2 id="history-title" class="pup-sec-title">Histórico</h2></div><button type="button" class="pup-sec-action danger" data-action="clear-history" aria-label="Limpar histórico">${ICONS.trash} Limpar</button></div><div class="pup-card"><div class="pup-history-toolbar"><div class="pup-history-search">${ICONS.search}<input type="text" placeholder="Buscar no histórico..." data-input="history-search" aria-label="Buscar no histórico"></div><div class="pup-history-filters" role="group" aria-label="Filtrar histórico"><button type="button" class="pup-filter-btn active" data-filter="all">Todos</button><button type="button" class="pup-filter-btn" data-filter="theme">Tema</button><button type="button" class="pup-filter-btn" data-filter="layout">Layout</button><button type="button" class="pup-filter-btn" data-filter="view">View</button></div></div><div class="pup-history" role="list" aria-label="Lista de alterações">${renderHistoryItems(items)}</div></div></section>`;
};

const renderHistoryItems = (items: HistoryItem[]) => {
  if (!items?.length) return `<div class="pup-history-empty">${ICONS.history}<p>Nenhuma alteração registrada</p></div>`;
  return items.slice(0, 15).map((item: HistoryItem, i: number) => {
    const config = ACTION_CONFIG[item.action_type as keyof typeof ACTION_CONFIG] || ACTION_CONFIG.default;
    const timeAgo = formatTimeAgo(item.created_at || item.timestamp);
    const description = item.description || item.action_description || `${config.label} alterado`;
    return `<div class="pup-history-item" data-type="${_s(item.action_type)}" style="animation-delay:${i * 30}ms"><div class="pup-history-icon" style="background:${config.color};color:${config.textColor}">${config.icon}</div><div class="pup-history-content"><p class="pup-history-text">${_s(description)}</p><span class="pup-history-time">${timeAgo}</span></div></div>`;
  }).join('');
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, p25Compliant: true });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true }, p25Compliant: true });

export default { renderHistorySection, info, healthCheck };
