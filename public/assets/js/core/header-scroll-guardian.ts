

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-EVENT-DRIVEN)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-scroll-guardian
// PURPOSE: Header Scroll Guardian
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   (none — internal module)
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   scroll (on header region element)
// WINDOW ACCESS:
//   document.addEventListener
//   global.APP_CONFIG
//   global.HeaderScrollGuardian
//   global.Logger
//
// @changelog
//   1.4.0-EVENT-DRIVEN: Replace 1Hz setInterval with scroll event listener.
//     Eliminates 86,400 unnecessary timer executions/day.
//     Uses passive scroll listener + CSS overflow:hidden as primary defense.
//     Scroll listener fires only when actual scroll happens (event-driven, not polling).
//   1.3.0-REGION-FALLBACK: Fallback chain for header region
// ═══════════════════════════════════════════════════════════════
'use strict';

var MODULE_ID = 'header-scroll-guardian';
var VERSION = '1.4.0-EVENT-DRIVEN';

(function (global: Record<string, unknown>) {
    let _scrollHandler: ((e: Event) => void) | null = null;
    let _region: Element | null = null;
    let _active = false;

    const _debug = () => (global.APP_CONFIG as Record<string, unknown>)?.app ? ((global.APP_CONFIG as Record<string, unknown>).app as Record<string, unknown>)?.debug ?? false : false;

    const Logger = global.Logger as Record<string, (...args: unknown[]) => void> | undefined;
    const _log = (level: string, ...args: unknown[]) => {
        if (!Logger) return;
        const prefix = '[' + MODULE_ID + ']';
        if (level === 'error') { Logger.error?.(prefix, ...args); return; }
        if (level === 'warn') { Logger.warn?.(prefix, ...args); return; }
        if (level === 'info') { Logger.info?.(prefix, ...args); return; }
        if (_debug()) Logger.debug?.(prefix, ...args);
    };

    // v1.3.0: Fallback chain enterprise para encontrar região header
    function _findHeaderRegion() {
        return document.querySelector('[data-region="header"]') ||
            document.getElementById('shell-header-region') ||
            document.getElementById('header');
    }

    function startGuardian() {
        if (_active) return;

        const region = _findHeaderRegion();
        if (!region) {
            _log('warn', 'Header region not found - guardian not started');
            return;
        }

        _region = region;

        // v1.4.0: CSS overflow:hidden as primary defense (prevents scroll entirely)
        const el = region as HTMLElement;
        if (el.style) {
            el.style.overflow = 'hidden';
        }

        // v1.4.0: Event-driven scroll listener as secondary defense
        // Only fires when scroll actually happens (e.g., programmatic scroll)
        _scrollHandler = function() {
            if (region.scrollTop !== 0) {
                _log('warn', 'Resetando scrollTop:', region.scrollTop, '→ 0');
                region.scrollTop = 0;
            }
        };

        region.addEventListener('scroll', _scrollHandler, { passive: true });
        _active = true;
        _log('info', 'Ativo (event-driven v1.4.0)');
    }

    function stopGuardian() {
        if (_region && _scrollHandler) {
            _region.removeEventListener('scroll', _scrollHandler);
            _scrollHandler = null;
        }
        _region = null;
        _active = false;
        _log('info', 'Desativado');
    }

    function info() {
        return { moduleId: MODULE_ID, version: VERSION, active: _active, mode: 'event-driven' };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startGuardian);
    } else {
        startGuardian();
    }

    global.HeaderScrollGuardian = { start: startGuardian, stop: stopGuardian, info, MODULE_ID, VERSION };
})(typeof window !== 'undefined' ? window : this);
