// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences:avatar-constants
// PURPOSE: Avatar System - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   AVATAR_TYPES — exported value
//   AVATAR_BASES — exported value
//   AVATAR_FRAMES — exported value
//   AVATAR_BACKGROUNDS — exported value
//   AVATAR_ICONS — exported value
//   AVATAR_BADGES — exported value
//   RARITY_ORDER — exported value
//   RARITY_COLORS — exported value
//   AVATAR_SIZES — exported value
//   DEFAULT_AVATAR_CONFIG — exported value
//   AVATAR_EVENTS — exported value
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-preferences:avatar-constants';

export const AVATAR_TYPES = { FALLBACK: 'fallback', IMAGE: 'image', GENERATED: 'generated' };
export const AVATAR_BASES = { ROUND: 'round', HEX: 'hex', SHIELD: 'shield', SQUARE: 'square', DIAMOND: 'diamond' };

export const AVATAR_FRAMES = {
  NONE: { id: 'none', name: 'Sem moldura', rarity: 'common', color: 'transparent' },
  SIMPLE: { id: 'simple', name: 'Simples', rarity: 'common', color: '#6b7280' },
  GLOW: { id: 'glow', name: 'Brilho', rarity: 'common', color: '#8b5cf6' },
  HEX_GLOW: { id: 'hex_glow', name: 'Hexágono Brilhante', rarity: 'rare', color: '#7c3aed' },
  NEON: { id: 'neon', name: 'Neon', rarity: 'rare', color: '#22d3ee' },
  GOLD: { id: 'gold', name: 'Dourado', rarity: 'epic', color: '#f59e0b' },
  PLATINUM: { id: 'platinum', name: 'Platina', rarity: 'epic', color: '#94a3b8' },
  RAINBOW: { id: 'rainbow', name: 'Arco-íris', rarity: 'legendary', color: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)' },
  CYBER: { id: 'cyber', name: 'Cyber', rarity: 'legendary', color: '#00ff88' }
};

export const AVATAR_BACKGROUNDS = {
  DARK: { id: 'dark', name: 'Escuro', type: 'solid', value: '#09090b' },
  LIGHT: { id: 'light', name: 'Claro', type: 'solid', value: '#f4f4f5' },
  PURPLE: { id: 'purple', name: 'Roxo', type: 'solid', value: '#7c3aed' },
  BLUE: { id: 'blue', name: 'Azul', type: 'solid', value: '#3b82f6' },
  GREEN: { id: 'green', name: 'Verde', type: 'solid', value: '#22c55e' },
  RED: { id: 'red', name: 'Vermelho', type: 'solid', value: '#ef4444' },
  ORANGE: { id: 'orange', name: 'Laranja', type: 'solid', value: '#f97316' },
  CYAN: { id: 'cyan', name: 'Ciano', type: 'solid', value: '#06b6d4' },
  GRADIENT_PURPLE: { id: 'gradient_purple', name: 'Gradiente Roxo', type: 'gradient', value: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)' },
  GRADIENT_NEON_PURPLE: { id: 'gradient_neon_purple', name: 'Neon Roxo', type: 'gradient', value: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' },
  GRADIENT_BLUE: { id: 'gradient_blue', name: 'Gradiente Azul', type: 'gradient', value: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' },
  GRADIENT_CYBER: { id: 'gradient_cyber', name: 'Cyber', type: 'gradient', value: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)' },
  GRADIENT_SUNSET: { id: 'gradient_sunset', name: 'Pôr do Sol', type: 'gradient', value: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)' },
  GRADIENT_FOREST: { id: 'gradient_forest', name: 'Floresta', type: 'gradient', value: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' },
  GRADIENT_GOLD: { id: 'gradient_gold', name: 'Dourado', type: 'gradient', value: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' },
  GRADIENT_DARK: { id: 'gradient_dark', name: 'Dark Mode', type: 'gradient', value: 'linear-gradient(135deg, #27272a 0%, #09090b 100%)' }
};

export const AVATAR_ICONS = {
  NONE: { id: 'none', name: 'Nenhum', svg: '' },
  TERMINAL: { id: 'terminal', name: 'Terminal', svg: '<path d="M4 17l6-6-6-6M12 19h8"/>' },
  BOLT: { id: 'bolt', name: 'Raio', svg: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>' },
  CPU: { id: 'cpu', name: 'CPU', svg: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>' },
  CODE: { id: 'code', name: 'Código', svg: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>' },
  SHIELD: { id: 'shield', name: 'Escudo', svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>' },
  STAR: { id: 'star', name: 'Estrela', svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
  CROWN: { id: 'crown', name: 'Coroa', svg: '<path d="M2 17l3-8 5 4 2-9 2 9 5-4 3 8z"/><path d="M2 17h20v4H2z"/>' },
  ROCKET: { id: 'rocket', name: 'Foguete', svg: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>' },
  DIAMOND: { id: 'diamond', name: 'Diamante', svg: '<path d="M2.7 10.3a2.41 2.41 0 000 3.41l7.59 7.59a2.41 2.41 0 003.41 0l7.59-7.59a2.41 2.41 0 000-3.41l-7.59-7.59a2.41 2.41 0 00-3.41 0z"/>' },
  HEART: { id: 'heart', name: 'Coração', svg: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>' },
  FIRE: { id: 'fire', name: 'Fogo', svg: '<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>' },
  ZAP: { id: 'zap', name: 'Zap', svg: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
  LOCK: { id: 'lock', name: 'Cadeado', svg: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>' },
  USER: { id: 'user', name: 'Usuário', svg: '<path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>' }
};

export const AVATAR_BADGES = {
  ADMIN: { id: 'admin', name: 'Administrador', icon: 'shield', color: '#ef4444' },
  POWER_USER: { id: 'power_user', name: 'Power User', icon: 'bolt', color: '#f59e0b' },
  FOUNDER: { id: 'founder', name: 'Fundador', icon: 'star', color: '#8b5cf6' },
  VERIFIED: { id: 'verified', name: 'Verificado', icon: 'check', color: '#22c55e' },
  PREMIUM: { id: 'premium', name: 'Premium', icon: 'crown', color: '#fbbf24' },
  DEVELOPER: { id: 'developer', name: 'Desenvolvedor', icon: 'code', color: '#3b82f6' }
};

export const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];
export const RARITY_COLORS = { common: '#6b7280', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b' };
export const AVATAR_SIZES = { XS: 24, SM: 32, MD: 40, LG: 56, XL: 80, XXL: 120 };
export const DEFAULT_AVATAR_CONFIG: { base: string; background: string; accentColor: string; icon: string; frame: string; badges: string[]; version: number } = { base: AVATAR_BASES.ROUND, background: 'gradient_neon_purple', accentColor: '#7c3aed', icon: 'none', frame: 'none', badges: [], version: 1 };
export const AVATAR_EVENTS = { LOADED: 'avatar:loaded', UPDATED: 'avatar:updated', SAVED: 'avatar:saved', ERROR: 'avatar:error', EDIT_OPENED: 'avatar:edit:opened', EDIT_CLOSED: 'avatar:edit:closed', OPTION_SELECTED: 'avatar:option:selected', PREVIEW_CHANGED: 'avatar:preview:changed' };

export function info() { return { moduleId: MODULE_ID, version: VERSION, counts: { types: Object.keys(AVATAR_TYPES).length, bases: Object.keys(AVATAR_BASES).length, frames: Object.keys(AVATAR_FRAMES).length, backgrounds: Object.keys(AVATAR_BACKGROUNDS).length, icons: Object.keys(AVATAR_ICONS).length, badges: Object.keys(AVATAR_BADGES).length } }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } }; }

export default { AVATAR_TYPES, AVATAR_BASES, AVATAR_FRAMES, AVATAR_BACKGROUNDS, AVATAR_ICONS, AVATAR_BADGES, RARITY_ORDER, RARITY_COLORS, AVATAR_SIZES, DEFAULT_AVATAR_CONFIG, AVATAR_EVENTS, info, healthCheck, VERSION, MODULE_ID };
