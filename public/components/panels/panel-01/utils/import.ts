

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01-utils-import
// PURPOSE: Panel 01 - Utils Import
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   validateFile() — exported function
//   createColumnMapping() — exported function
//   applyColumnMapping() — exported function
//   getImportProgress() — exported function
//   setImportProgress() — exported function
//   resetImportProgress() — exported function
//   setPendingImport() — exported function
//   getPendingImport() — exported function
//   clearPendingImport() — exported function
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

declare const XLSX: Record<string, any>;

export const MODULE_ID = 'panel-01-utils-import';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const SUPPORTED_FORMATS = ['csv', 'json', 'xlsx', 'xls'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 50000;

let _pendingImport: Record<string, unknown> | null = null;
let _importProgress = { current: 0, total: 0, status: 'idle' };

// ══════════════════════════════════════════════════════════════
// FILE VALIDATION
// ══════════════════════════════════════════════════════════════

export function validateFile(file: File) {
  const errors = [];
  
  if (!file) {
    errors.push('Nenhum arquivo selecionado');
    return { valid: false, errors };
  }
  
  const ext = _getFileExtension(file.name);
  if (!SUPPORTED_FORMATS.includes(ext)) {
    errors.push(`Formato não suportado: ${ext}. Use: ${SUPPORTED_FORMATS.join(', ')}`);
  }
  
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    errors.push(`Arquivo muito grande: ${sizeMB}MB. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  return { valid: errors.length === 0, errors };
}

function _getFileExtension(filename: string) {
  if (!filename) return '';
  const parts = filename.split('.');
  // @ts-expect-error strict migration — TS2532
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

// ══════════════════════════════════════════════════════════════
// CSV PARSING
// ══════════════════════════════════════════════════════════════

export async function parseCSV(file: File, options: Record<string, unknown> = {}) {
  const { delimiter = ',', hasHeader = true, encoding = 'utf-8' } = options;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target!.result as string;
        const result = _parseCSVText(text, { delimiter, hasHeader });
        resolve(result);
      } catch (err) {
        reject(new Error(`Erro ao processar CSV: ${(err as Error).message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file, String(encoding));
  });
}

function _parseCSVText(text: string, options: Record<string, unknown>) {
  const { delimiter = ',', hasHeader = true } = options;
  const lines = (text as string).split(/\r?\n/).filter((line: string) => line.trim());
  
  if (lines.length === 0) {
    return { headers: [] as string[], rows: [] as unknown[], rowCount: 0 };
  }

  const headers = hasHeader ? _parseCSVLine(lines[0], delimiter as string) : [] as string[];
  const dataLines = hasHeader ? lines.slice(1) : lines;
  
  const rows: unknown[] = [];
  for (let i = 0; i < Math.min(dataLines.length, MAX_ROWS); i++) {
    const values = _parseCSVLine(dataLines[i] as string, delimiter as string);
    if (hasHeader) {
      const row: Record<string, unknown> = {};
      for (let j = 0; j < (headers as string[]).length; j++) {
        row[(headers as string[])[j]] = values[j] || '';
      }
      rows.push(row);
    } else {
      rows.push(values);
    }
  }
  
  return { headers, rows, rowCount: rows.length, truncated: dataLines.length > MAX_ROWS };
}

function _parseCSVLine(line: string, delimiter: string) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

// ══════════════════════════════════════════════════════════════
// JSON PARSING
// ══════════════════════════════════════════════════════════════

export async function parseJSON(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // @ts-expect-error strict migration — TS18047
        const data = JSON.parse(e.target.result as string);
        const result = _normalizeJSONData(data);
        resolve(result);
      } catch (err) {
        reject(new Error(`Erro ao processar JSON: ${(err as Error).message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}

function _normalizeJSONData(data: unknown) {
  if (Array.isArray(data)) {
    const rows = data.slice(0, MAX_ROWS);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { headers, rows, rowCount: rows.length, truncated: data.length > MAX_ROWS };
  }
  
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (obj.data && Array.isArray(obj.data)) {
      return _normalizeJSONData(obj.data);
    }
    if (obj.rows && Array.isArray(obj.rows)) {
      return _normalizeJSONData(obj.rows);
    }
    if (obj.items && Array.isArray(obj.items)) {
      return _normalizeJSONData(obj.items);
    }
    return { headers: Object.keys(obj), rows: [obj], rowCount: 1, truncated: false };
  }
  
  throw new Error('Formato JSON inválido');
}

// ══════════════════════════════════════════════════════════════
// EXCEL PARSING (Basic - requires SheetJS)
// ══════════════════════════════════════════════════════════════

export async function parseExcel(file: File, options: Record<string, unknown> = {}) {
  const { sheetIndex = 0 } = options;
  
  if (typeof XLSX === 'undefined') {
    throw new Error('Biblioteca SheetJS não carregada');
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // @ts-expect-error strict migration — TS18047
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[sheetIndex as number];
        
        if (!sheetName) {
          throw new Error('Planilha não encontrada');
        }
        
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve({ headers: [], rows: [], rowCount: 0, truncated: false });
          return;
        }
        
        const headers = (jsonData[0] as unknown[]).map((h: unknown) => String(h || '').trim());
        const rows: Record<string, unknown>[] = [];

        for (let i = 1; i < Math.min(jsonData.length, MAX_ROWS + 1); i++) {
          const rowData = jsonData[i] as unknown[];
          const row: Record<string, unknown> = {};
          for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = rowData[j] !== undefined ? rowData[j] : '';
          }
          rows.push(row);
        }
        
        resolve({ headers, rows, rowCount: rows.length, sheetName, truncated: jsonData.length > MAX_ROWS + 1 });
      } catch (err) {
        reject(new Error(`Erro ao processar Excel: ${(err as Error).message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

// ══════════════════════════════════════════════════════════════
// AUTO PARSE
// ══════════════════════════════════════════════════════════════

export async function parseFile(file: File, options: Record<string, unknown> = {}) {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }
  
  const ext = _getFileExtension(file.name);
  
  if (ext === 'csv') {
    return parseCSV(file, options);
  }
  if (ext === 'json') {
    return parseJSON(file);
  }
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file, options);
  }
  
  throw new Error(`Formato não suportado: ${ext}`);
}

// ══════════════════════════════════════════════════════════════
// COLUMN MAPPING
// ══════════════════════════════════════════════════════════════

export function createColumnMapping(sourceHeaders: string[], targetFields: Record<string, unknown>[]) {
  const mapping: Record<string, unknown> = {};
  
  for (const target of targetFields) {
    const match = _findBestMatch(target, sourceHeaders);
    if (match) {
      mapping[target.key as string] = match;
    }
  }
  
  return mapping;
}

function _findBestMatch(target: Record<string, unknown>, sourceHeaders: string[]) {
  const targetKey = (target.key as string).toLowerCase();
  const targetLabel = ((target.label as string) || '').toLowerCase();
  const aliases = ((target.aliases || []) as string[]).map((a: string) => a.toLowerCase());
  
  for (const header of sourceHeaders) {
    const h = header.toLowerCase();
    if (h === targetKey || h === targetLabel || aliases.includes(h)) {
      return header;
    }
  }
  
  for (const header of sourceHeaders) {
    const h = header.toLowerCase();
    if (h.includes(targetKey) || targetKey.includes(h)) {
      return header;
    }
  }
  
  return null;
}

export function applyColumnMapping(rows: Record<string, unknown>[], mapping: Record<string, unknown>) {
  const mappedRows: Record<string, unknown>[] = [];

  for (const row of rows) {
    const mapped: Record<string, unknown> = {};
    for (const targetKey in mapping) {
      if (Object.prototype.hasOwnProperty.call(mapping, targetKey)) {
        const sourceKey = mapping[targetKey] as string | null;
        mapped[targetKey] = sourceKey ? row[sourceKey] : '';
      }
    }
    mappedRows.push(mapped);
  }
  
  return mappedRows;
}

// ══════════════════════════════════════════════════════════════
// IMPORT PROGRESS
// ══════════════════════════════════════════════════════════════

export function getImportProgress() {
  return { ..._importProgress };
}

export function setImportProgress(progress: Record<string, unknown>) {
  _importProgress = { ..._importProgress, ...progress };
}

export function resetImportProgress() {
  _importProgress = { current: 0, total: 0, status: 'idle' };
}

// ══════════════════════════════════════════════════════════════
// PENDING IMPORT
// ══════════════════════════════════════════════════════════════

export function setPendingImport(data: Record<string, unknown>) {
  _pendingImport = data;
}

export function getPendingImport() {
  return _pendingImport;
}

export function clearPendingImport() {
  _pendingImport = null;
}

// ══════════════════════════════════════════════════════════════
// INFO / HEALTH
// ══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    supportedFormats: SUPPORTED_FORMATS,
    maxFileSize: MAX_FILE_SIZE,
    maxRows: MAX_ROWS,
    hasPendingImport: _pendingImport !== null,
    progress: { ..._importProgress }
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      fileReaderSupported: typeof FileReader !== 'undefined',
      xlsxAvailable: typeof XLSX !== 'undefined'
    }
  };
}

export default {
  MODULE_ID,
  VERSION,
  validateFile,
  parseCSV,
  parseJSON,
  parseExcel,
  parseFile,
  createColumnMapping,
  applyColumnMapping,
  getImportProgress,
  setImportProgress,
  resetImportProgress,
  setPendingImport,
  getPendingImport,
  clearPendingImport,
  info,
  healthCheck
};
