// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.9.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences.avatar.renderer
// PURPOSE: Avatar System - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   AVATAR_TYPES, AVATAR_BASES, AVATAR_FRAMES, AVATAR_BACKGROUNDS, AVATAR_ICONS, ...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   render() — exported function
//   renderFallback() — exported function
//   renderImage() — exported function
//   renderGenerated() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { AVATAR_TYPES, AVATAR_BASES, AVATAR_FRAMES, AVATAR_BACKGROUNDS, AVATAR_ICONS, AVATAR_BADGES, AVATAR_SIZES, DEFAULT_AVATAR_CONFIG } from './constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-preferences.avatar.renderer';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug; };
const _log = (level: string, msg: string, extra?: unknown) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn(`[${MODULE_ID}] ${msg}`, extra); };

let _metrics = { renders: 0, fallbacks: 0, errors: 0 };

const escapeHtml = (str: string) => !str ? '' : str.replace(/[&<>"']/g, (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);

const getHexagonPoints = (cx: number, cy: number, r: number) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(' ');
};

const getBasePath = (base: string, size: number) => {
  const half = size / 2;
  const r = half - 1;
  switch (base) {
    case AVATAR_BASES.ROUND: return `<circle cx="${half}" cy="${half}" r="${r}"/>`;
    case AVATAR_BASES.SQUARE: { const cornerRadius = size * 0.15; return `<rect x="1" y="1" width="${size-2}" height="${size-2}" rx="${cornerRadius}"/>`; }
    case AVATAR_BASES.HEX: return `<polygon points="${getHexagonPoints(half, half, r)}"/>`;
    case AVATAR_BASES.SHIELD: return `<path d="M${half} 2 L${size-2} ${size*0.25} L${size-2} ${size*0.6} Q${size-2} ${size-2} ${half} ${size-2} Q2 ${size-2} 2 ${size*0.6} L2 ${size*0.25} Z"/>`;
    case AVATAR_BASES.DIAMOND: return `<polygon points="${half},2 ${size-2},${half} ${half},${size-2} 2,${half}"/>`;
    default: return `<circle cx="${half}" cy="${half}" r="${r}"/>`;
  }
};

const getBackground = (bgId: string) => {
  if (!bgId) return AVATAR_BACKGROUNDS.GRADIENT_NEON_PURPLE;
  const bgKey = bgId.toUpperCase().replace(/-/g, '_');
  return (AVATAR_BACKGROUNDS as Record<string, typeof AVATAR_BACKGROUNDS.DARK>)[bgKey] || AVATAR_BACKGROUNDS.GRADIENT_NEON_PURPLE;
};

const createGradientDef = (background: { value: string; type: string }, size: number) => {
  const match = background.value.match(/linear-gradient\((\d+)deg,\s*([^,]+)\s+\d+%,\s*([^)]+)\s+\d+%\)/);
  if (!match) return '';
  const angle = parseInt(match[1]) || 135;
  const color1 = match[2].trim();
  const color2 = match[3].trim();
  const rad = (angle - 90) * Math.PI / 180;
  const x1 = 50 - 50 * Math.cos(rad);
  const y1 = 50 - 50 * Math.sin(rad);
  const x2 = 50 + 50 * Math.cos(rad);
  const y2 = 50 + 50 * Math.sin(rad);
  return `<linearGradient id="bg-gradient-${size}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%"><stop offset="0%" stop-color="${color1}"/><stop offset="100%" stop-color="${color2}"/></linearGradient>`;
};

const getIcon = (iconId: string) => {
  if (!iconId || iconId === 'none') return { id: 'none', svg: '' };
  const iconKey = iconId.toUpperCase();
  return (AVATAR_ICONS as Record<string, typeof AVATAR_ICONS.NONE>)[iconKey] || AVATAR_ICONS.NONE;
};

const getFrame = (frameId: string) => {
  if (!frameId || frameId === 'none') return AVATAR_FRAMES.NONE;
  const frameKey = frameId.toUpperCase().replace(/-/g, '_');
  return (AVATAR_FRAMES as Record<string, typeof AVATAR_FRAMES.NONE>)[frameKey] || AVATAR_FRAMES.NONE;
};

const renderFrame = (frame: { id: string; color: string }, size: number, base: string) => {
  const half = size / 2;
  const strokeWidth = Math.max(2, size * 0.04);
  const r = half - strokeWidth / 2;
  let framePath = '';
  switch (base) {
    case AVATAR_BASES.ROUND: framePath = `<circle cx="${half}" cy="${half}" r="${r}" fill="none" stroke="${frame.color}" stroke-width="${strokeWidth}"/>`; break;
    case AVATAR_BASES.HEX: framePath = `<polygon points="${getHexagonPoints(half, half, r)}" fill="none" stroke="${frame.color}" stroke-width="${strokeWidth}"/>`; break;
    default: framePath = `<circle cx="${half}" cy="${half}" r="${r}" fill="none" stroke="${frame.color}" stroke-width="${strokeWidth}"/>`;
  }
  if (frame.id === 'glow' || frame.id === 'hex_glow' || frame.id === 'neon') {
    return `<g filter="url(#glow-filter-${size})"><defs><filter id="glow-filter-${size}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${framePath}</g>`;
  }
  return framePath;
};

const getBadgeIcon = (iconName: string) => {
  const icons: Record<string, string> = { shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>', bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>', star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', check: '<polyline points="20 6 9 17 4 12"/>', crown: '<path d="M2 17l3-8 5 4 2-9 2 9 5-4 3 8z"/><path d="M2 17h20v4H2z"/>', code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>' };
  return icons[iconName] || icons.check;
};

const renderBadges = (badges: string[], avatarSize: number) => {
  if (!badges?.length) return '';
  const badgeSize = Math.max(12, avatarSize * 0.25);
  return badges.slice(0, 2).map((badgeId: string, index: number) => {
    const badge = (AVATAR_BADGES as Record<string, typeof AVATAR_BADGES.ADMIN>)[badgeId.toUpperCase()] || (AVATAR_BADGES as Record<string, typeof AVATAR_BADGES.ADMIN>)[badgeId];
    if (!badge) return '';
    return `<div class="pup-avatar__badge" style="position: absolute; bottom: -2px; right: ${index * (badgeSize + 2)}px; width: ${badgeSize}px; height: ${badgeSize}px; background: ${badge.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--pup-bg, #09090b);" title="${badge.name}"><svg width="${badgeSize * 0.6}" height="${badgeSize * 0.6}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">${getBadgeIcon(badge.icon)}</svg></div>`;
  }).join('');
};

const renderFallback = (data: Record<string, unknown>, options: Record<string, unknown> = {}) => {
  const size = options.size || 'MD';
  const className = options.className || '';
  const interactive = options.interactive || false;
  const sizeValue = AVATAR_SIZES[size as keyof typeof AVATAR_SIZES] || AVATAR_SIZES.MD;
  const initials = data.initials || '??';
  const bgColor = data.backgroundColor || '#7c3aed';
  const fontSize = Math.round(sizeValue * 0.4);
  _metrics.fallbacks++;
  return `<div class="pup-avatar pup-avatar--fallback ${className}" style="width: ${sizeValue}px; height: ${sizeValue}px;" ${interactive ? 'tabindex="0" role="button"' : ''} data-avatar-type="fallback"><svg width="${sizeValue}" height="${sizeValue}" viewBox="0 0 ${sizeValue} ${sizeValue}"><circle cx="${sizeValue/2}" cy="${sizeValue/2}" r="${sizeValue/2}" fill="${bgColor}"/><text x="50%" y="50%" dy="0.35em" text-anchor="middle" fill="white" font-size="${fontSize}px" font-weight="600" font-family="system-ui, sans-serif">${initials}</text></svg></div>`;
};

const renderImage = (data: Record<string, unknown>, options: Record<string, unknown> = {}) => {
  const size = options.size || 'MD';
  const className = options.className || '';
  const interactive = options.interactive || false;
  const showBadges = options.showBadges !== false;
  const sizeValue = AVATAR_SIZES[size as keyof typeof AVATAR_SIZES] || AVATAR_SIZES.MD;
  const imageUrl = (data.imageUrl || data.avatar_image_url) as string | undefined;
  const badges = (showBadges && data.badges ? data.badges : []) as string[];
  if (!imageUrl) return renderFallback(data, options);
  const fallbackHtml = renderFallback(data, options).replace(/'/g, "\\'");
  return `<div class="pup-avatar pup-avatar--image ${className}" style="width: ${sizeValue}px; height: ${sizeValue}px;" ${interactive ? 'tabindex="0" role="button"' : ''} data-avatar-type="image"><img src="${escapeHtml(imageUrl)}" alt="Avatar" class="pup-avatar__img" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.parentElement.innerHTML='${fallbackHtml}'" />${badges.length > 0 ? renderBadges(badges, sizeValue) : ''}</div>`;
};

const renderGenerated = (config: Record<string, unknown>, options: Record<string, unknown> = {}) => {
  const size = options.size || 'MD';
  const className = options.className || '';
  const interactive = options.interactive || false;
  const showBadges = options.showBadges !== false;
  const sizeValue = AVATAR_SIZES[size as keyof typeof AVATAR_SIZES] || AVATAR_SIZES.MD;
  const cfg = { ...DEFAULT_AVATAR_CONFIG, ...config };
  const base = cfg.base || AVATAR_BASES.ROUND;
  const background = getBackground(cfg.background);
  const icon = getIcon(cfg.icon);
  const frame = getFrame(cfg.frame);
  const badges = showBadges && cfg.badges ? cfg.badges : [];
  const basePath = getBasePath(base, sizeValue);
  const iconSize = Math.round(sizeValue * 0.5);
  const iconOffset = (sizeValue - iconSize) / 2;
  const bgFill = background.type === 'gradient' ? `url(#bg-gradient-${sizeValue})` : background.value;
  const gradientDef = background.type === 'gradient' ? createGradientDef(background, sizeValue) : '';
  const iconSvg = icon.svg ? `<g transform="translate(${iconOffset}, ${iconOffset})"><svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icon.svg}</svg></g>` : '';
  const frameSvg = frame.id !== 'none' ? renderFrame(frame, sizeValue, base) : '';
  return `<div class="pup-avatar pup-avatar--generated ${className}" style="width: ${sizeValue}px; height: ${sizeValue}px; position: relative;" ${interactive ? 'tabindex="0" role="button"' : ''} data-avatar-type="generated"><svg width="${sizeValue}" height="${sizeValue}" viewBox="0 0 ${sizeValue} ${sizeValue}"><defs><clipPath id="avatar-clip-${sizeValue}">${basePath}</clipPath>${gradientDef}</defs><g clip-path="url(#avatar-clip-${sizeValue})"><rect x="0" y="0" width="${sizeValue}" height="${sizeValue}" fill="${bgFill}"/></g>${iconSvg}${frameSvg}</svg>${badges.length > 0 ? renderBadges(badges, sizeValue) : ''}</div>`;
};

const render = (avatarData: Record<string, unknown> | null, options: Record<string, unknown> = {}) => {
  _metrics.renders++;
  try {
    if (!avatarData) return renderFallback({ initials: '??', backgroundColor: '#7c3aed' }, options);
    const type = avatarData.type || AVATAR_TYPES.FALLBACK;
    switch (type) {
      case AVATAR_TYPES.IMAGE: return renderImage(avatarData, options);
      case AVATAR_TYPES.GENERATED: return renderGenerated((avatarData.config as Record<string, unknown>) || DEFAULT_AVATAR_CONFIG, options);
      case AVATAR_TYPES.FALLBACK:
      default: return renderFallback(avatarData, options);
    }
  } catch (error) {
    _metrics.errors++;

    _log('warn', `Render error: ${(error as Error).message}`);
    return renderFallback({ initials: '??', backgroundColor: '#ef4444' }, options);
  }
};

const getMetrics = () => ({ ..._metrics });
const resetMetrics = () => { _metrics = { renders: 0, fallbacks: 0, errors: 0 }; };

const healthCheck = () => {
  const logger = _getPort('logger');
  const checks = { rendererReady: true, hasConstants: !!AVATAR_TYPES, loggerReady: !!logger };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, portsInitialized: Ports.isInitialized(), moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
};

const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), availableSizes: Object.keys(AVATAR_SIZES), metrics: getMetrics(), healthCheck: healthCheck() });

export { render, renderFallback, renderImage, renderGenerated, getMetrics, resetMetrics, info, healthCheck };
export default { render, renderFallback, renderImage, renderGenerated, getMetrics, resetMetrics, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
