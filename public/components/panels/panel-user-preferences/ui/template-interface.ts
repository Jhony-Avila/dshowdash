// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences-ui-template-interface
// PURPOSE: Panel User Preferences - Interface Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ../core/constants.js
//
// PROVIDES:
//   renderInterfaceSection() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

interface PreferencesData {
  theme?: string;
  density?: string;
  notifications_enabled?: string | boolean;
  sound_enabled?: string | boolean;
  push_enabled?: string | boolean;
  accent_color?: string;
  bg_color?: string;
  card_color?: string;
  text_color?: string;
}

export const renderInterfaceSection = (prefs: PreferencesData | null | undefined) => {
  const theme = prefs?.theme || 'dark';
  const density = prefs?.density || 'comfortable';
  const notifEnabled = prefs?.notifications_enabled !== 'false' && prefs?.notifications_enabled !== false;
  const soundEnabled = prefs?.sound_enabled === 'true' || prefs?.sound_enabled === true;
  const pushEnabled = prefs?.push_enabled === 'true' || prefs?.push_enabled === true;
  return `<section class="pup-section" aria-labelledby="interface-title"><div class="pup-sec-hdr"><div class="pup-sec-left"><div class="pup-sec-icon purple">${ICONS.sliders}</div><h2 id="interface-title" class="pup-sec-title">Interface</h2></div></div><div class="pup-grid">${renderThemeCard(theme)}${renderNotificationsCard(notifEnabled, soundEnabled, pushEnabled)}</div>${renderDensityCard(density)}${renderCustomThemeCard(prefs)}</section>`;
};

const renderThemeCard = (theme: string) => `<div class="pup-card"><div class="pup-card-hdr"><div class="pup-card-icon theme">${ICONS.sun}</div><h3 class="pup-card-title">Tema</h3></div><div class="pup-theme-row" role="radiogroup" aria-label="Selecionar tema"><button type="button" class="pup-theme-opt ${theme === 'light' ? 'active' : ''}" data-theme="light" data-action="set-theme" role="radio" aria-checked="${theme === 'light'}" tabindex="${theme === 'light' ? '0' : '-1'}"><div class="pup-theme-preview"><div class="pup-theme-preview-inner"><div class="pup-theme-preview-sidebar"></div><div class="pup-theme-preview-main"><div class="pup-theme-preview-header"></div><div class="pup-theme-preview-content"><div class="pup-theme-preview-card"></div><div class="pup-theme-preview-card"></div></div></div></div></div><span class="pup-theme-label">${ICONS.sun} Claro</span></button><button type="button" class="pup-theme-opt ${theme === 'dark' ? 'active' : ''}" data-theme="dark" data-action="set-theme" role="radio" aria-checked="${theme === 'dark'}" tabindex="${theme === 'dark' ? '0' : '-1'}"><div class="pup-theme-preview"><div class="pup-theme-preview-inner"><div class="pup-theme-preview-sidebar"></div><div class="pup-theme-preview-main"><div class="pup-theme-preview-header"></div><div class="pup-theme-preview-content"><div class="pup-theme-preview-card"></div><div class="pup-theme-preview-card"></div></div></div></div></div><span class="pup-theme-label">${ICONS.moon} Escuro</span></button><button type="button" class="pup-theme-opt ${theme === 'auto' ? 'active' : ''}" data-theme="auto" data-action="set-theme" role="radio" aria-checked="${theme === 'auto'}" tabindex="${theme === 'auto' ? '0' : '-1'}"><div class="pup-theme-preview"><div class="pup-theme-preview-inner"><div class="pup-theme-preview-sidebar"></div><div class="pup-theme-preview-main"><div class="pup-theme-preview-header"></div><div class="pup-theme-preview-content"><div class="pup-theme-preview-card"></div><div class="pup-theme-preview-card"></div></div></div></div></div><span class="pup-theme-label">${ICONS.monitor} Auto</span></button></div></div>`;

const renderNotificationsCard = (notifEnabled: boolean, soundEnabled: boolean, pushEnabled: boolean) => `<div class="pup-card"><div class="pup-card-hdr"><div class="pup-card-icon notif">${ICONS.bell}</div><h3 class="pup-card-title">Notificações</h3></div><div class="pup-notif-item"><div class="pup-notif-left"><div class="pup-notif-icon critical">${ICONS.bellRing}</div><div class="pup-notif-text"><div class="pup-notif-top"><span class="pup-notif-label">Sistema</span><span class="pup-notif-badge critical">Crítico</span></div><p class="pup-notif-desc">Alertas e erros importantes</p></div></div><label class="pup-switch"><input type="checkbox" data-pref="notifications_enabled" ${notifEnabled ? 'checked' : ''}><span class="pup-switch-track"></span></label></div><div class="pup-notif-item"><div class="pup-notif-left"><div class="pup-notif-icon optional">${ICONS.volume}</div><div class="pup-notif-text"><div class="pup-notif-top"><span class="pup-notif-label">Sons</span><span class="pup-notif-badge optional">Opcional</span></div><p class="pup-notif-desc">Feedback sonoro nas ações</p></div></div><label class="pup-switch"><input type="checkbox" data-pref="sound_enabled" ${soundEnabled ? 'checked' : ''}><span class="pup-switch-track"></span></label></div><div class="pup-notif-item"><div class="pup-notif-left"><div class="pup-notif-icon push">${ICONS.bellPlus}</div><div class="pup-notif-text"><div class="pup-notif-top"><span class="pup-notif-label">Push</span><span class="pup-notif-badge new">Novo</span></div><p class="pup-notif-desc">Notificações no navegador</p></div></div><label class="pup-switch"><input type="checkbox" data-pref="push_enabled" data-action="request-push" ${pushEnabled ? 'checked' : ''}><span class="pup-switch-track"></span></label></div></div>`;

const renderDensityCard = (density: string) => `<div class="pup-card" style="margin-top:12px"><div class="pup-card-hdr"><div class="pup-card-icon custom">${ICONS.sliders}</div><h3 class="pup-card-title">Densidade</h3></div><div class="pup-density-row" role="radiogroup" aria-label="Selecionar densidade"><button type="button" class="pup-density-opt ${density === 'compact' ? 'active' : ''}" data-density="compact" data-action="set-density" role="radio" aria-checked="${density === 'compact'}"><div class="pup-density-preview"><div class="pup-density-preview-line"></div><div class="pup-density-preview-line"></div><div class="pup-density-preview-line"></div></div><span class="pup-density-label">Compacto</span><p class="pup-density-desc">Menos espaço, mais conteúdo</p></button><button type="button" class="pup-density-opt ${density === 'comfortable' ? 'active' : ''}" data-density="comfortable" data-action="set-density" role="radio" aria-checked="${density === 'comfortable'}"><div class="pup-density-preview"><div class="pup-density-preview-line"></div><div class="pup-density-preview-line"></div><div class="pup-density-preview-line"></div></div><span class="pup-density-label">Confortável</span><p class="pup-density-desc">Equilíbrio ideal</p></button><button type="button" class="pup-density-opt ${density === 'spacious' ? 'active' : ''}" data-density="spacious" data-action="set-density" role="radio" aria-checked="${density === 'spacious'}"><div class="pup-density-preview"><div class="pup-density-preview-line"></div><div class="pup-density-preview-line"></div><div class="pup-density-preview-line"></div></div><span class="pup-density-label">Espaçoso</span><p class="pup-density-desc">Mais respiro visual</p></button></div></div>`;

const renderCustomThemeCard = (prefs: PreferencesData | null | undefined) => {
  const accentColor = prefs?.accent_color || '#8b5cf6';
  const bgColor = prefs?.bg_color || '#09090b';
  const cardColor = prefs?.card_color || '#131316';
  const textColor = prefs?.text_color || '#ffffff';
  return `<div class="pup-custom-theme"><div class="pup-custom-theme-hdr"><span class="pup-custom-theme-title">${ICONS.palette} Cores Personalizadas</span></div><div class="pup-color-grid"><div class="pup-color-item"><label class="pup-color-label">Destaque</label><input type="color" class="pup-color-input" value="${accentColor}" data-color="accent_color"></div><div class="pup-color-item"><label class="pup-color-label">Fundo</label><input type="color" class="pup-color-input" value="${bgColor}" data-color="bg_color"></div><div class="pup-color-item"><label class="pup-color-label">Cards</label><input type="color" class="pup-color-input" value="${cardColor}" data-color="card_color"></div><div class="pup-color-item"><label class="pup-color-label">Texto</label><input type="color" class="pup-color-input" value="${textColor}" data-color="text_color"></div></div></div>`;
};

export default { renderInterfaceSection };

export const MODULE_ID = 'panel-user-preferences-ui-template-interface';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templateInterfaceReady: true } });
