// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cache-manager.utils.helpers
// PURPOSE: Cache utility functions for serialization, formatting, hashing
// ───────────────────────────────────────────────────────────────
// @contract EXPIRATION - isExpired() for entry expiration check
// @contract SERIALIZATION - serializeValue(), deserializeValue(), sanitizeValue()
// @contract FORMATTING - formatBytes(), formatTimestamp(), formatDuration()
// @contract HASHING - hashKey(), generateKey()
// ───────────────────────────────────────────────────────────────
// IMPORTS: SIZE from ../core/contracts.js
// PROVIDES: isExpired(), generateKey(), serializeValue(), deserializeValue(),
//   calculateSize(), sanitizeValue(), formatBytes(), hashKey(),
//   formatTimestamp(), formatDuration(), isValueCacheable(),
//   healthCheck(), info()
// @changelog v3.4.0-STRICT-MODE: Strict mode integration in healthCheck/info
// @changelog v3.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v3.2.0-ENTERPRISE: ES6 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIZE } from '../core/contracts.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '3.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cache-manager.utils.helpers';

export const getVersion = () => VERSION;

export const isExpired = (entry: { expiresAt?: number }): boolean => { if (!entry?.expiresAt) return false; return Date.now() > entry.expiresAt; };

export const generateKey = (...parts: unknown[]): string => parts.map(p => String(p)).join(':');

export const serializeValue = (value: unknown, maxSize: number = SIZE.MAX_VALUE_SIZE): string | null => {
  try { const str = JSON.stringify(value); if (str.length > maxSize) return null; return str; }
  catch (e) { return null; }
};

export const deserializeValue = (str: string): unknown => { try { return JSON.parse(str); } catch (e) { return str; } };

export const calculateSize = (value: unknown): number => { try { const str = typeof value === 'string' ? value : JSON.stringify(value); return new Blob([str]).size; } catch (e) { return 0; } };

export const sanitizeValue = (value: unknown, depth: number = 0): unknown => {
  if (depth > SIZE.MAX_DEPTH) return '[MAX_DEPTH_EXCEEDED]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.length > SIZE.MAX_STRING_LENGTH ? `${value.substring(0, SIZE.MAX_STRING_LENGTH)}...[TRUNCATED]` : value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    const arr = value.length > SIZE.MAX_ARRAY_LENGTH ? value.slice(0, SIZE.MAX_ARRAY_LENGTH) : value;
    return arr.map((item: unknown) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    Object.keys(value as Record<string, unknown>).forEach(k => { sanitized[k] = sanitizeValue((value as Record<string, unknown>)[k], depth + 1); });
    return sanitized;
  }
  return String(value);
};

export const formatBytes = (bytes: number): string => { if (bytes === 0) return '0 B'; const units = ['B', 'KB', 'MB']; const k = 1024; const i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`; };

export const hashKey = (key: string): string => { let hash = 0; for (let i = 0; i < key.length; i++) { hash = ((hash << 5) - hash) + key.charCodeAt(i); hash = hash & hash; } return Math.abs(hash).toString(36); };

export const formatTimestamp = (timestamp: number): string => { if (!timestamp) return ''; return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); };

export const formatDuration = (ms: number): string => { if (ms < 1000) return `${ms}ms`; if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`; return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`; };

export const isValueCacheable = (value: unknown): boolean => { if (value === undefined) return false; try { const size = calculateSize(value); return size <= SIZE.MAX_VALUE_SIZE; } catch (e) { return false; } };

export const info = () => ({ version: VERSION, moduleId: MODULE_ID, strictMode: isStrict(), limits: { maxKeyLength: SIZE.MAX_KEY_LENGTH, maxValueSize: SIZE.MAX_VALUE_SIZE, maxDepth: SIZE.MAX_DEPTH, maxArrayLength: SIZE.MAX_ARRAY_LENGTH, maxStringLength: SIZE.MAX_STRING_LENGTH }, availableFunctions: ['isExpired', 'generateKey', 'serializeValue', 'deserializeValue', 'calculateSize', 'sanitizeValue', 'formatBytes', 'hashKey', 'formatTimestamp', 'formatDuration', 'isValueCacheable'], timestamp: Date.now() });

export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, strictMode: isStrict(), checks: { serializeReady: typeof serializeValue === 'function', sanitizeReady: typeof sanitizeValue === 'function' }, timestamp: Date.now() });

export default { VERSION, MODULE_ID, getVersion, isExpired, generateKey, serializeValue, deserializeValue, calculateSize, sanitizeValue, formatBytes, hashKey, formatTimestamp, formatDuration, isValueCacheable, info, healthCheck };
