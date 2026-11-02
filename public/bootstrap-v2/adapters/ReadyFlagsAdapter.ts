// Ready Flags Adapter
// @version 1.2.0-DOMAIN-PURE
// @changelog v1.2.0-DOMAIN-PURE: getReadyFlags() via windowAdapter → window fallback (cadeia AAA)
// @changelog v1.1.0: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0)
// ═══════════════════════════════════════════════════════════════
// RESOLVES ReadyFlags via getReadyFlags():
//   1. windowAdapter.get('ReadyFlags') — adapter layer
//   2. window.ReadyFlags               — último fallback
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'ready-flags-adapter';
const VERSION = '1.2.0-DOMAIN-PURE';

interface ReadyFlagsLike {
  setReady?: (flag: string, value: boolean) => void;
  isReady?: (flag: string) => boolean;
  waitFor?: (flag: string, timeout: number) => Promise<boolean>;
  getAll?: () => Record<string, boolean>;
}

function createReadyFlagsAdapter() {
  const internalFlags: Record<string, boolean> = {};
  const listeners: Record<string, Array<() => void>> = {};

  // v1.2.0: Resolver via windowAdapter → window fallback
  function getReadyFlags(): ReadyFlagsLike | null {
    if (typeof window === 'undefined') return null;
    if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      const resolved = window.Core.windowAdapter.get('ReadyFlags');
      if (resolved) return resolved as ReadyFlagsLike;
    }
    return (window.ReadyFlags as ReadyFlagsLike) || null;
  }

  return {
    setReady: function(flag: string, value: boolean) {
      if (value === undefined) value = true;
      const readyFlags = getReadyFlags();
      if (readyFlags && readyFlags.setReady) {
        readyFlags.setReady(flag, value);
      }
      const oldValue = internalFlags[flag];
      internalFlags[flag] = value;
      if (value && !oldValue) {
        const flagListeners = listeners[flag] || [];
        for (let i = 0; i < flagListeners.length; i++) {
          try { flagListeners[i](); } catch (e) {}
        }
        delete listeners[flag];
      }
      return true;
    },

    isReady: function(flag: string) {
      const readyFlags = getReadyFlags();
      if (readyFlags && readyFlags.isReady) {
        return readyFlags.isReady(flag);
      }
      return internalFlags[flag] === true;
    },

    waitFor: function(flag: string, timeout: number) {
      const self = this;
      if (timeout === undefined) timeout = 5000;
      return new Promise<boolean>(function(resolve) {
        if (self.isReady(flag)) {
          resolve(true);
          return;
        }
        const readyFlags = getReadyFlags();
        if (readyFlags && readyFlags.waitFor) {
          readyFlags.waitFor(flag, timeout).then(resolve);
          return;
        }
        let flagListeners = listeners[flag] || [];
        flagListeners.push(function() { resolve(true); });
        listeners[flag] = flagListeners;
        if (timeout > 0) {
          setTimeout(function() { resolve(false); }, timeout);
        }
      });
    },

    getAll: function() {
      const readyFlags = getReadyFlags();
      if (readyFlags && readyFlags.getAll) {
        return readyFlags.getAll();
      }
      return Object.assign({}, internalFlags);
    },

    hasReadyFlags: function() { return !!getReadyFlags(); },

    info: function() {
      return { moduleId: MODULE_ID, version: VERSION, hasGlobalReadyFlags: !!getReadyFlags(), internalFlagsCount: Object.keys(internalFlags).length };
    }
  };
}

export { createReadyFlagsAdapter, MODULE_ID, VERSION };
export default createReadyFlagsAdapter;
