// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:share-manager
// PURPOSE: Share Manager - Web Share API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SHARE_TARGETS — exported value
//   createShareManager() — exported function
//   getShareManager() — exported function
//   resetShareManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location
//   window.open
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE7';
export const MODULE_ID = 'container-main:share-manager';

export const SHARE_TARGETS = Object.freeze({
  NATIVE: 'native', CLIPBOARD: 'clipboard', TWITTER: 'twitter', FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin', WHATSAPP: 'whatsapp', TELEGRAM: 'telegram', EMAIL: 'email'
});

export function createShareManager(options: Record<string, any> = {}) {
  const { fallbackToClipboard = true, onShare = null, onError = null } = options;

  const _logger = createLogger(MODULE_ID);
  let _metrics = { shares: 0, nativeShares: 0, fallbackShares: 0, errors: 0 };

  function _buildShareUrl(target: HTMLElement, data: Record<string, unknown>) {
    const { url = window.location.href, title = document.title, text = '' } = data;
    // @ts-expect-error TS migration - TS2345
    const encodedUrl = encodeURIComponent(url);
    // @ts-expect-error TS migration - TS2345
    const encodedTitle = encodeURIComponent(title);
    // @ts-expect-error TS migration - TS2345
    const encodedText = encodeURIComponent(text);

    switch (target) {
      // @ts-expect-error TS migration - TS2678
      case SHARE_TARGETS.TWITTER:
        return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      // @ts-expect-error TS migration - TS2678
      case SHARE_TARGETS.FACEBOOK:
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      // @ts-expect-error TS migration - TS2678
      case SHARE_TARGETS.LINKEDIN:
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      // @ts-expect-error TS migration - TS2678
      case SHARE_TARGETS.WHATSAPP:
        return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
      // @ts-expect-error TS migration - TS2678
      case SHARE_TARGETS.TELEGRAM:
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
      // @ts-expect-error TS migration - TS2678
      case SHARE_TARGETS.EMAIL:
        return `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;
      default:
        return null;
    }
  }

  const manager = {
    isSupported() { return 'share' in navigator; },
    canShareFiles() { return 'canShare' in navigator; },

    canShare(data: Record<string, unknown>) {
      if (!navigator.canShare) return this.isSupported();
      try { return navigator.canShare(data); } catch { return false; }
    },

    async share(data: Record<string, any> = {}) {
      const { url = window.location.href, title = document.title, text = '', files = null } = data;
      _metrics.shares++;

      // Tentar Web Share API
      if (this.isSupported()) {
        try {
          const shareData = { url, title, text };

          // @ts-expect-error TS migration - TS2339
          if (files && this.canShare({ files })) shareData.files = files;

          await navigator.share(shareData);
          _metrics.nativeShares++;
          onShare?.({ target: SHARE_TARGETS.NATIVE, data: shareData });
          return { success: true, target: SHARE_TARGETS.NATIVE };
        } catch (e: any) {
          if (e.name === 'AbortError') {
            return { success: false, target: SHARE_TARGETS.NATIVE, cancelled: true };
          }
          _logger.warn('Native share failed:', e);
        }
      }

      // Fallback para clipboard
      if (fallbackToClipboard) {
        try {
          const shareText = text ? `${text}\n${url}` : url;
          await navigator.clipboard.writeText(shareText);
          _metrics.fallbackShares++;
          onShare?.({ target: SHARE_TARGETS.CLIPBOARD, data: { text: shareText } });
          return { success: true, target: SHARE_TARGETS.CLIPBOARD, copied: true };
        } catch (e: any) {
          _metrics.errors++;
          onError?.(e);
          return { success: false, error: e.message };
        }
      }

      _metrics.errors++;
      return { success: false, error: 'Share not supported' };
    },

    shareTo(target: HTMLElement, data: Record<string, any> = {}) {
      const { url = window.location.href, title = document.title, text = '' } = data;
      _metrics.shares++;

      // @ts-expect-error TS migration - TS2367
      if (target === SHARE_TARGETS.NATIVE) {
        return this.share(data);
      }

      // @ts-expect-error TS migration - TS2367
      if (target === SHARE_TARGETS.CLIPBOARD) {
        return navigator.clipboard.writeText(text ? `${text}\n${url}` : url)
          .then(() => { _metrics.fallbackShares++; onShare?.({ target, data }); return { success: true, target }; })
          .catch(e => { _metrics.errors++; onError?.(e); return { success: false, error: e.message }; });
      }

      const shareUrl = _buildShareUrl(target, data);
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
        onShare?.({ target, data, url: shareUrl });
        return Promise.resolve({ success: true, target, url: shareUrl });
      }

      _metrics.errors++;
      return Promise.resolve({ success: false, error: 'Unknown share target' });
    },

    async shareImage(imageBlob: unknown, data: Record<string, any> = {}) {
      if (!this.canShareFiles()) {
        return { success: false, error: 'File sharing not supported' };
      }

      // @ts-expect-error TS migration - TS2322
      const file = new File([imageBlob], data.filename || 'image.png', { type: (imageBlob as Record<string, unknown>).type || 'image/png' });
      return this.share({ ...data, files: [file] });
    },

    getShareUrl(target: HTMLElement, data: Record<string, any> = {}) {
      return _buildShareUrl(target, data);
    },

    getAvailableTargets() {
      const targets = [SHARE_TARGETS.CLIPBOARD, SHARE_TARGETS.TWITTER, SHARE_TARGETS.FACEBOOK, SHARE_TARGETS.LINKEDIN, SHARE_TARGETS.WHATSAPP, SHARE_TARGETS.TELEGRAM, SHARE_TARGETS.EMAIL];

      // @ts-expect-error TS migration - TS2345
      if (this.isSupported()) targets.unshift(SHARE_TARGETS.NATIVE);
      return targets;
    },

    getMetrics() { return { ..._metrics, supported: this.isSupported(), canShareFiles: this.canShareFiles() }; },
    resetMetrics() { _metrics = { shares: 0, nativeShares: 0, fallbackShares: 0, errors: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, supported: this.isSupported(), canShareFiles: this.canShareFiles(), metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, supported: this.isSupported(), targets: Object.keys(SHARE_TARGETS) }; },

    destroy() {}
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getShareManager(options: Record<string, any> = {}) { if (!_instance) _instance = createShareManager(options); return _instance; }
export function resetShareManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export async function share(data: Record<string, unknown>) { return (getShareManager().share as (...args: unknown[]) => unknown)(data); }
export async function shareTo(target: HTMLElement, data: Record<string, unknown>) { return (getShareManager().shareTo as (...args: unknown[]) => unknown)(target, data); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, targets: Object.keys(SHARE_TARGETS) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, SHARE_TARGETS, createShareManager, getShareManager, resetShareManager, share, shareTo, info, healthCheck };
