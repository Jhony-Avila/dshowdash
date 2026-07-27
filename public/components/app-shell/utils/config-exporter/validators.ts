/**
 * @file Config Exporter — Validators
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/utils/config-exporter/validators
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none
 * 
 * @provides validateChecksum, generateChecksum
 * 
 * @description
 * Checksum generation and validation for config export/import.
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.config-exporter.validators';

export function generateChecksum(data: DynObj) {
  const str = JSON.stringify(data);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16);
}

export function validateChecksum(data: DynObj, checksum: DynObj) {
  const computed = generateChecksum(data);
  return computed === checksum;
}
