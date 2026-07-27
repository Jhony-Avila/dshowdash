const MODULE_ID = "panel-01-utils-import";
const VERSION = "9.3.0-P2-ENTERPRISE";
const SUPPORTED_FORMATS = ["csv", "json", "xlsx", "xls"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ROWS = 5e4;
let _pendingImport = null;
let _importProgress = { current: 0, total: 0, status: "idle" };
function validateFile(file) {
  const errors = [];
  if (!file) {
    errors.push("Nenhum arquivo selecionado");
    return { valid: false, errors };
  }
  const ext = _getFileExtension(file.name);
  if (!SUPPORTED_FORMATS.includes(ext)) {
    errors.push(`Formato n\xE3o suportado: ${ext}. Use: ${SUPPORTED_FORMATS.join(", ")}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    errors.push(`Arquivo muito grande: ${sizeMB}MB. M\xE1ximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  return { valid: errors.length === 0, errors };
}
function _getFileExtension(filename) {
  if (!filename) return "";
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}
async function parseCSV(file, options = {}) {
  const { delimiter = ",", hasHeader = true, encoding = "utf-8" } = options;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const result = _parseCSVText(text, { delimiter, hasHeader });
        resolve(result);
      } catch (err) {
        reject(new Error(`Erro ao processar CSV: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsText(file, String(encoding));
  });
}
function _parseCSVText(text, options) {
  const { delimiter = ",", hasHeader = true } = options;
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [], rowCount: 0 };
  }
  const headers = hasHeader ? _parseCSVLine(lines[0], delimiter) : [];
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const rows = [];
  for (let i = 0; i < Math.min(dataLines.length, MAX_ROWS); i++) {
    const values = _parseCSVLine(dataLines[i], delimiter);
    if (hasHeader) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] || "";
      }
      rows.push(row);
    } else {
      rows.push(values);
    }
  }
  return { headers, rows, rowCount: rows.length, truncated: dataLines.length > MAX_ROWS };
}
function _parseCSVLine(line, delimiter) {
  const values = [];
  let current = "";
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
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}
async function parseJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const result = _normalizeJSONData(data);
        resolve(result);
      } catch (err) {
        reject(new Error(`Erro ao processar JSON: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsText(file);
  });
}
function _normalizeJSONData(data) {
  if (Array.isArray(data)) {
    const rows = data.slice(0, MAX_ROWS);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { headers, rows, rowCount: rows.length, truncated: data.length > MAX_ROWS };
  }
  if (data && typeof data === "object") {
    const obj = data;
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
  throw new Error("Formato JSON inv\xE1lido");
}
async function parseExcel(file, options = {}) {
  const { sheetIndex = 0 } = options;
  if (typeof XLSX === "undefined") {
    throw new Error("Biblioteca SheetJS n\xE3o carregada");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[sheetIndex];
        if (!sheetName) {
          throw new Error("Planilha n\xE3o encontrada");
        }
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (jsonData.length === 0) {
          resolve({ headers: [], rows: [], rowCount: 0, truncated: false });
          return;
        }
        const headers = jsonData[0].map((h) => String(h || "").trim());
        const rows = [];
        for (let i = 1; i < Math.min(jsonData.length, MAX_ROWS + 1); i++) {
          const rowData = jsonData[i];
          const row = {};
          for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = rowData[j] !== void 0 ? rowData[j] : "";
          }
          rows.push(row);
        }
        resolve({ headers, rows, rowCount: rows.length, sheetName, truncated: jsonData.length > MAX_ROWS + 1 });
      } catch (err) {
        reject(new Error(`Erro ao processar Excel: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsArrayBuffer(file);
  });
}
async function parseFile(file, options = {}) {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }
  const ext = _getFileExtension(file.name);
  if (ext === "csv") {
    return parseCSV(file, options);
  }
  if (ext === "json") {
    return parseJSON(file);
  }
  if (ext === "xlsx" || ext === "xls") {
    return parseExcel(file, options);
  }
  throw new Error(`Formato n\xE3o suportado: ${ext}`);
}
function createColumnMapping(sourceHeaders, targetFields) {
  const mapping = {};
  for (const target of targetFields) {
    const match = _findBestMatch(target, sourceHeaders);
    if (match) {
      mapping[target.key] = match;
    }
  }
  return mapping;
}
function _findBestMatch(target, sourceHeaders) {
  const targetKey = target.key.toLowerCase();
  const targetLabel = (target.label || "").toLowerCase();
  const aliases = (target.aliases || []).map((a) => a.toLowerCase());
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
function applyColumnMapping(rows, mapping) {
  const mappedRows = [];
  for (const row of rows) {
    const mapped = {};
    for (const targetKey in mapping) {
      if (Object.prototype.hasOwnProperty.call(mapping, targetKey)) {
        const sourceKey = mapping[targetKey];
        mapped[targetKey] = sourceKey ? row[sourceKey] : "";
      }
    }
    mappedRows.push(mapped);
  }
  return mappedRows;
}
function getImportProgress() {
  return { ..._importProgress };
}
function setImportProgress(progress) {
  _importProgress = { ..._importProgress, ...progress };
}
function resetImportProgress() {
  _importProgress = { current: 0, total: 0, status: "idle" };
}
function setPendingImport(data) {
  _pendingImport = data;
}
function getPendingImport() {
  return _pendingImport;
}
function clearPendingImport() {
  _pendingImport = null;
}
function info() {
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
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      fileReaderSupported: typeof FileReader !== "undefined",
      xlsxAvailable: typeof XLSX !== "undefined"
    }
  };
}
var import_default = {
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
export {
  MODULE_ID,
  VERSION,
  applyColumnMapping,
  clearPendingImport,
  createColumnMapping,
  import_default as default,
  getImportProgress,
  getPendingImport,
  healthCheck,
  info,
  parseCSV,
  parseExcel,
  parseFile,
  parseJSON,
  resetImportProgress,
  setImportProgress,
  setPendingImport,
  validateFile
};
