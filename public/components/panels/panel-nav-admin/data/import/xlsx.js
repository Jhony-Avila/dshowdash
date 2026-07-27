const VERSION = "10.2.0-MIGRATION-PHASE6";
const MODULE_ID = "panel-nav-admin.data.import.xlsx";
const SHEETJS_CDN = "https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js";
let _sheetJSLoaded = false;
async function _loadSheetJS() {
  if (_sheetJSLoaded || typeof window !== "undefined" && window.XLSX) {
    _sheetJSLoaded = true;
    return;
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SHEETJS_CDN;
    script.onload = () => {
      _sheetJSLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load SheetJS from CDN"));
    document.head.appendChild(script);
  });
}
const FIELD_MAP = Object.freeze({
  "id": "id",
  "label": "label",
  "rota/painel": "href",
  "rota": "href",
  "href": "href",
  "icone": "icon",
  "\xEDcone": "icon",
  "icon": "icon",
  "secao": "section",
  "se\xE7\xE3o": "section",
  "section": "section",
  "contexto": "context",
  "context": "context",
  "nivel minimo": "minLevel",
  "n\xEDvel m\xEDnimo": "minLevel",
  "minlevel": "minLevel",
  "ativo": "isActive",
  "isactive": "isActive",
  "divisor": "isDivider",
  "isdivider": "isDivider",
  "ordem": "order",
  "order": "order",
  "roles": "roles"
});
async function readXLSXFile(file, options = {}) {
  if (!file) {
    return { rows: [], headers: [], sheetNames: [], errors: ["No file provided"] };
  }
  await _loadSheetJS();
  const XLSX = window.XLSX;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetNames = workbook.SheetNames;
        const targetSheet = options.sheetName || sheetNames[0];
        if (!workbook.Sheets[targetSheet]) {
          resolve({ rows: [], headers: [], sheetNames, errors: [`Sheet "${targetSheet}" not found`] });
          return;
        }
        const result = parseXLSXSheet(workbook.Sheets[targetSheet], options);
        resolve({ ...result, sheetNames });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read XLSX file"));
    reader.readAsArrayBuffer(file);
  });
}
function parseXLSXSheet(sheet, options = {}) {
  const XLSX = window.XLSX;
  const fieldMap = options.fieldMap || FIELD_MAP;
  const errors = [];
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (!aoa || aoa.length < 2) {
    return { rows: [], headers: [], errors: ["Sheet must have at least a header row and one data row"] };
  }
  const rawHeaders = aoa[0].map((h) => String(h || "").trim());
  const mappedHeaders = rawHeaders.map((h) => {
    const lower = h.toLowerCase().trim();
    return fieldMap[lower] || lower;
  });
  const rows = [];
  for (let i = 1; i < aoa.length; i++) {
    const rowData = aoa[i];
    if (!rowData || rowData.every((cell) => cell == null || cell === "")) continue;
    const row = {};
    for (let j = 0; j < mappedHeaders.length; j++) {
      const field = mappedHeaders[j];
      let val = j < rowData.length ? rowData[j] : "";
      if (field === "minLevel" || field === "order") {
        val = val !== "" && val != null ? parseInt(String(val), 10) : 0;
        if (isNaN(val)) val = 0;
      } else if (field === "isActive") {
        val = _parseBool(val, true);
      } else if (field === "isDivider") {
        val = _parseBool(val, false);
      } else if (field === "roles") {
        if (typeof val === "string") {
          val = val.split(",").map((r) => r.trim()).filter(Boolean);
        } else if (!Array.isArray(val)) {
          val = [];
        }
      } else {
        val = val != null ? String(val) : "";
      }
      row[field] = val;
    }
    rows.push(row);
  }
  return { rows, headers: rawHeaders, errors };
}
async function getSheetNames(file) {
  if (!file) return [];
  await _loadSheetJS();
  const XLSX = window.XLSX;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        resolve(workbook.SheetNames);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read XLSX file"));
    reader.readAsArrayBuffer(file);
  });
}
function _parseBool(val, defaultValue) {
  if (val == null || val === "") return defaultValue;
  const lower = String(val).toLowerCase().trim();
  if (["sim", "true", "1", "yes", "s"].includes(lower)) return true;
  if (["n\xE3o", "nao", "false", "0", "no", "n"].includes(lower)) return false;
  return defaultValue;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, sheetJSLoaded: _sheetJSLoaded };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, sheetJSLoaded: _sheetJSLoaded };
}
var xlsx_default = { readXLSXFile, parseXLSXSheet, getSheetNames, FIELD_MAP, info, healthCheck, VERSION, MODULE_ID };
export {
  FIELD_MAP,
  MODULE_ID,
  VERSION,
  xlsx_default as default,
  getSheetNames,
  healthCheck,
  info,
  parseXLSXSheet,
  readXLSXFile
};
