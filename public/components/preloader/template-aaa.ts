// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader.template-aaa
// PURPOSE: Preloader Template v2.1.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getPreloaderTemplate() — exported function
//   getMinimalTemplate() — exported function
//   getFastTemplate() — exported function
//   getCorporateTemplate() — exported function
//   getKioskTemplate() — exported function
//   getRecoveryTemplate() — exported function
//   getTemplateForProfile() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '2.1.0-P17WI';
export const MODULE_ID = 'preloader.template-aaa';
const Ports = createUiPorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
let _metrics = { renders: 0 };
export function getPreloaderTemplate(options: Record<string, any> = {}) { _metrics.renders++; const { showVideo = true, showLogo = true, showProgress = true, showPercentage = true, showText = true, videoSrc = '/assets/videos/video_background_site_web.mp4', logoSrc = '/assets/icons/logo-square.png', logoAlt = 'DshowDash Logo', text = 'Carregando', customClass = '' } = options; return `<div class="preloader-container ${customClass}" data-preloader-container>${showVideo ? `<video data-preloader-video class="preloader-video" autoplay loop muted playsinline preload="metadata"><source src="${videoSrc}" type="video/mp4"></video>` : ''}${showLogo ? `<div class="preloader-logo-container" data-preloader-logo><img src="${logoSrc}" alt="${logoAlt}" class="preloader-logo" width="180" height="168" decoding="async" fetchpriority="high"></div>` : ''}${showText ? `<div class="preloader-text" data-preloader-text>${text}</div>` : ''}${showProgress ? `<div class="preloader-progress-wrapper" data-preloader-progress-wrapper><div class="preloader-progress"><div class="preloader-progress-bar" data-preloader-progress-bar></div></div>${showPercentage ? `<div class="preloader-percentage" data-preloader-percentage>0%</div>` : ''}</div>` : ''}</div>`; }
export function getMinimalTemplate(options: Record<string, any> = {}) { return getPreloaderTemplate({ showVideo: false, showText: false, showPercentage: false, customClass: 'preloader--minimal', ...options }); }
export function getFastTemplate(options: Record<string, any> = {}) { return getPreloaderTemplate({ showVideo: false, showLogo: false, showText: false, showPercentage: false, customClass: 'preloader--fast', ...options }); }
export function getCorporateTemplate(options: Record<string, any> = {}) { return getPreloaderTemplate({ customClass: 'preloader--corporate', ...options }); }
export function getKioskTemplate(options: Record<string, any> = {}) { return getPreloaderTemplate({ showPercentage: false, text: 'Iniciando sistema...', customClass: 'preloader--kiosk', ...options }); }
export function getRecoveryTemplate(options: Record<string, any> = {}) { return `<div class="preloader-container preloader--recovery" data-preloader-container><div class="preloader-recovery-icon" data-preloader-logo><svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg></div><div class="preloader-text" data-preloader-text>Recuperando sistema...</div><div class="preloader-progress-wrapper" data-preloader-progress-wrapper><div class="preloader-progress"><div class="preloader-progress-bar preloader-progress-bar--indeterminate" data-preloader-progress-bar></div></div></div></div>`; }
export function getTemplateForProfile(profile: string, options: Record<string, any> = {}) { switch (profile) { case 'minimal': return getMinimalTemplate(options); case 'fast': return getFastTemplate(options); case 'corporate': return getCorporateTemplate(options); case 'kiosk': return getKioskTemplate(options); case 'recovery': return getRecoveryTemplate(options); default: return getPreloaderTemplate(options); } }
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, templates: ['standard', 'minimal', 'fast', 'corporate', 'kiosk', 'recovery'], metrics: getMetrics(), portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { templatesReady: true }, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
export default { VERSION, MODULE_ID, getPreloaderTemplate, getMinimalTemplate, getFastTemplate, getCorporateTemplate, getKioskTemplate, getRecoveryTemplate, getTemplateForProfile, getMetrics, info, healthCheck, injectPorts, getPorts };
