// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-state-compression
// PURPOSE: Container-Main State Compression
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   compress() — exported function
//   decompress() — exported function
//   compressForURL() — exported function
//   decompressFromURL() — exported function
//   compressToStorage() — exported function
//   decompressFromStorage() — exported function
//   getCompressionStats() — exported function
//   createDelta() — exported function
//   applyDelta() — exported function
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

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-state-compression';

// Simple LZW-based compression for JSON state
export function compress(data: Record<string, unknown>) {
  if (data === null || data === undefined) return '';
  
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  if (json.length < 100) return json; // Don't compress small data
  
  const dict = new Map();
  let dictSize = 256;
  for (let i = 0; i < 256; i++) dict.set(String.fromCharCode(i), i);
  
  let w = '';
  const result = [];
  
  for (const c of json) {
    const wc = w + c;
    if (dict.has(wc)) {
      w = wc;
    } else {
      result.push(dict.get(w));
      dict.set(wc, dictSize++);
      w = c;
    }
  }
  
  if (w !== '') result.push(dict.get(w));
  
  // Convert to base64-like string
  return `LZW:${result.map(n => String.fromCharCode(n + 32)).join('')}`;
}

export function decompress(compressed: unknown) {
  if (!compressed || typeof compressed !== 'string') return null;
  if (!compressed.startsWith('LZW:')) return compressed; // Not compressed
  
  const data = compressed.slice(4);
  const codes = [...data].map(c => c.charCodeAt(0) - 32);
  
  const dict = new Map();
  let dictSize = 256;
  for (let i = 0; i < 256; i++) dict.set(i, String.fromCharCode(i));
  
  let w = String.fromCharCode(codes[0]);
  let result = w;
  
  for (let i = 1; i < codes.length; i++) {
    const k = codes[i];
    let entry;
    
    if (dict.has(k)) {
      entry = dict.get(k);
    } else if (k === dictSize) {
      entry = w + w[0];
    } else {
      return null; // Invalid
    }
    
    result += entry;
    dict.set(dictSize++, w + entry[0]);
    w = entry;
  }
  
  return result;
}

// Compress and encode for URL
export function compressForURL(data: Record<string, unknown>) {
  const compressed = compress(data);
  return encodeURIComponent(compressed);
}

// Decompress from URL
export function decompressFromURL(urlString: unknown) {
  const decoded = decodeURIComponent((urlString as string));
  return decompress(decoded);
}

// Compress to localStorage with size check
export function compressToStorage(key: string, data: Record<string, unknown>, maxSizeKB = 100) {
  const compressed = compress(data);
  const sizeKB = new Blob([compressed]).size / 1024;
  
  if (sizeKB > maxSizeKB) {
    throw new Error(`Compressed size ${sizeKB.toFixed(2)}KB exceeds limit ${maxSizeKB}KB`);
  }
  
  localStorage.setItem(key, compressed);
  return { originalSize: JSON.stringify(data).length, compressedSize: compressed.length, ratio: `${(compressed.length / JSON.stringify(data).length * 100).toFixed(1)}%` };
}

// Decompress from localStorage
export function decompressFromStorage(key: string) {
  const compressed = localStorage.getItem(key);
  if (!compressed) return null;
  
  const decompressed = decompress(compressed);
  try {
    // @ts-expect-error strict migration — TS2345
    return JSON.parse(decompressed);
  } catch {
    return decompressed;
  }
}

// Get compression stats
export function getCompressionStats(data: Record<string, unknown>) {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  const compressed = compress(data);
  const originalSize = new Blob([json]).size;
  const compressedSize = new Blob([compressed]).size;
  
  return {
    originalSize,
    compressedSize,
    savedBytes: originalSize - compressedSize,
    ratio: `${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`,
    isWorthCompressing: compressedSize < originalSize * 0.9
  };
}

// Delta compression for state updates
export function createDelta(oldState: string, newState: string) {
  if (!oldState) return { type: 'full', data: newState };
  
  const delta = { type: 'delta', changes: {} };
  const oldKeys = Object.keys(oldState);
  const newKeys = Object.keys(newState);
  
  // Find changed/added keys
  newKeys.forEach(key => {
    // @ts-expect-error TS migration - TS2352
    if (JSON.stringify((oldState as unknown as Record<string, unknown>)[key]) !== JSON.stringify((newState as Record<string, unknown>)[key])) {
      // @ts-expect-error TS migration - TS2352
      (delta.changes as unknown as Record<string, unknown>)[key] = (newState as Record<string, unknown>)[key];
    }
  });
  
  // Find removed keys
  // @(ts as any)-ignore
  (delta as any).removed = oldKeys.filter(key => !newKeys.includes(key));
  
  // If delta is larger than full state, return full
  const deltaSize = JSON.stringify(delta).length;
  const fullSize = JSON.stringify(newState).length;
  
  if (deltaSize > fullSize * 0.8) {
    return { type: 'full', data: newState };
  }
  
  return delta;
}

// Apply delta to state
export function applyDelta(state: Record<string, unknown>, delta: number) {
  // @ts-expect-error TS migration - TS2339
  if (delta.type === 'full') return delta.data;
  
  // @ts-expect-error TS migration - TS2339
  const newState = { ...state, ...delta.changes };
  // @ts-expect-error TS migration - TS2339
  if (delta.removed) {
    // @ts-expect-error TS migration - TS2339
    delta.removed.forEach((key: string) => delete newState[key]);
  }
  return newState;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID };
}

export default {
  compress, decompress, compressForURL, decompressFromURL,
  compressToStorage, decompressFromStorage, getCompressionStats,
  createDelta, applyDelta,
  info, healthCheck, VERSION, MODULE_ID
};
