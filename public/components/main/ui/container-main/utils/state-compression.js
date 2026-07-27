const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-state-compression";
function compress(data) {
  if (data === null || data === void 0) return "";
  const json = typeof data === "string" ? data : JSON.stringify(data);
  if (json.length < 100) return json;
  const dict = /* @__PURE__ */ new Map();
  let dictSize = 256;
  for (let i = 0; i < 256; i++) dict.set(String.fromCharCode(i), i);
  let w = "";
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
  if (w !== "") result.push(dict.get(w));
  return `LZW:${result.map((n) => String.fromCharCode(n + 32)).join("")}`;
}
function decompress(compressed) {
  if (!compressed || typeof compressed !== "string") return null;
  if (!compressed.startsWith("LZW:")) return compressed;
  const data = compressed.slice(4);
  const codes = [...data].map((c) => c.charCodeAt(0) - 32);
  const dict = /* @__PURE__ */ new Map();
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
      return null;
    }
    result += entry;
    dict.set(dictSize++, w + entry[0]);
    w = entry;
  }
  return result;
}
function compressForURL(data) {
  const compressed = compress(data);
  return encodeURIComponent(compressed);
}
function decompressFromURL(urlString) {
  const decoded = decodeURIComponent(urlString);
  return decompress(decoded);
}
function compressToStorage(key, data, maxSizeKB = 100) {
  const compressed = compress(data);
  const sizeKB = new Blob([compressed]).size / 1024;
  if (sizeKB > maxSizeKB) {
    throw new Error(`Compressed size ${sizeKB.toFixed(2)}KB exceeds limit ${maxSizeKB}KB`);
  }
  localStorage.setItem(key, compressed);
  return { originalSize: JSON.stringify(data).length, compressedSize: compressed.length, ratio: `${(compressed.length / JSON.stringify(data).length * 100).toFixed(1)}%` };
}
function decompressFromStorage(key) {
  const compressed = localStorage.getItem(key);
  if (!compressed) return null;
  const decompressed = decompress(compressed);
  try {
    return JSON.parse(decompressed);
  } catch {
    return decompressed;
  }
}
function getCompressionStats(data) {
  const json = typeof data === "string" ? data : JSON.stringify(data);
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
function createDelta(oldState, newState) {
  if (!oldState) return { type: "full", data: newState };
  const delta = { type: "delta", changes: {} };
  const oldKeys = Object.keys(oldState);
  const newKeys = Object.keys(newState);
  newKeys.forEach((key) => {
    if (JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
      delta.changes[key] = newState[key];
    }
  });
  delta.removed = oldKeys.filter((key) => !newKeys.includes(key));
  const deltaSize = JSON.stringify(delta).length;
  const fullSize = JSON.stringify(newState).length;
  if (deltaSize > fullSize * 0.8) {
    return { type: "full", data: newState };
  }
  return delta;
}
function applyDelta(state, delta) {
  if (delta.type === "full") return delta.data;
  const newState = { ...state, ...delta.changes };
  if (delta.removed) {
    delta.removed.forEach((key) => delete newState[key]);
  }
  return newState;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var state_compression_default = {
  compress,
  decompress,
  compressForURL,
  decompressFromURL,
  compressToStorage,
  decompressFromStorage,
  getCompressionStats,
  createDelta,
  applyDelta,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  applyDelta,
  compress,
  compressForURL,
  compressToStorage,
  createDelta,
  decompress,
  decompressFromStorage,
  decompressFromURL,
  state_compression_default as default,
  getCompressionStats,
  healthCheck,
  info
};
