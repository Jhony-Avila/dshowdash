import { SIZE } from "../core/contracts.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "3.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.cache-manager.utils.helpers";
const getVersion = () => VERSION;
const isExpired = (entry) => {
  if (!entry?.expiresAt) return false;
  return Date.now() > entry.expiresAt;
};
const generateKey = (...parts) => parts.map((p) => String(p)).join(":");
const serializeValue = (value, maxSize = SIZE.MAX_VALUE_SIZE) => {
  try {
    const str = JSON.stringify(value);
    if (str.length > maxSize) return null;
    return str;
  } catch (e) {
    return null;
  }
};
const deserializeValue = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
};
const calculateSize = (value) => {
  try {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    return new Blob([str]).size;
  } catch (e) {
    return 0;
  }
};
const sanitizeValue = (value, depth = 0) => {
  if (depth > SIZE.MAX_DEPTH) return "[MAX_DEPTH_EXCEEDED]";
  if (value === null || value === void 0) return value;
  if (typeof value === "string") return value.length > SIZE.MAX_STRING_LENGTH ? `${value.substring(0, SIZE.MAX_STRING_LENGTH)}...[TRUNCATED]` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    const arr = value.length > SIZE.MAX_ARRAY_LENGTH ? value.slice(0, SIZE.MAX_ARRAY_LENGTH) : value;
    return arr.map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const sanitized = {};
    Object.keys(value).forEach((k) => {
      sanitized[k] = sanitizeValue(value[k], depth + 1);
    });
    return sanitized;
  }
  return String(value);
};
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
};
const hashKey = (key) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};
const formatDuration = (ms) => {
  if (ms < 1e3) return `${ms}ms`;
  if (ms < 6e4) return `${(ms / 1e3).toFixed(1)}s`;
  return `${Math.floor(ms / 6e4)}m ${Math.floor(ms % 6e4 / 1e3)}s`;
};
const isValueCacheable = (value) => {
  if (value === void 0) return false;
  try {
    const size = calculateSize(value);
    return size <= SIZE.MAX_VALUE_SIZE;
  } catch (e) {
    return false;
  }
};
const info = () => ({ version: VERSION, moduleId: MODULE_ID, strictMode: isStrict(), limits: { maxKeyLength: SIZE.MAX_KEY_LENGTH, maxValueSize: SIZE.MAX_VALUE_SIZE, maxDepth: SIZE.MAX_DEPTH, maxArrayLength: SIZE.MAX_ARRAY_LENGTH, maxStringLength: SIZE.MAX_STRING_LENGTH }, availableFunctions: ["isExpired", "generateKey", "serializeValue", "deserializeValue", "calculateSize", "sanitizeValue", "formatBytes", "hashKey", "formatTimestamp", "formatDuration", "isValueCacheable"], timestamp: Date.now() });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, strictMode: isStrict(), checks: { serializeReady: typeof serializeValue === "function", sanitizeReady: typeof sanitizeValue === "function" }, timestamp: Date.now() });
var helpers_default = { VERSION, MODULE_ID, getVersion, isExpired, generateKey, serializeValue, deserializeValue, calculateSize, sanitizeValue, formatBytes, hashKey, formatTimestamp, formatDuration, isValueCacheable, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  calculateSize,
  helpers_default as default,
  deserializeValue,
  formatBytes,
  formatDuration,
  formatTimestamp,
  generateKey,
  getVersion,
  hashKey,
  healthCheck,
  info,
  isExpired,
  isValueCacheable,
  sanitizeValue,
  serializeValue
};
