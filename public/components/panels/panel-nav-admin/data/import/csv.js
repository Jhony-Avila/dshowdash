const VERSION = "10.2.0-MIGRATION-PHASE6";
const MODULE_ID = "panel-nav-admin.data.import.csv";
const REQUIRED_FIELDS = ["label"];
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
  "order": "order"
});
function parseCSV(csvText, options = {}) {
  if (!csvText || typeof csvText !== "string") {
    return { rows: [], headers: [], errors: ["CSV text is empty or invalid"] };
  }
  let text = csvText;
  if (text.charCodeAt(0) === 65279) text = text.substring(1);
  const delimiter = options.delimiter || _detectDelimiter(text);
  const fieldMap = options.fieldMap || FIELD_MAP;
  const lines = _splitLines(text);
  if (lines.length < 2) {
    return { rows: [], headers: [], errors: ["CSV must have at least a header row and one data row"] };
  }
  const rawHeaders = _parseLine(lines[0], delimiter);
  const headers = rawHeaders.map((h) => h.trim());
  const mappedHeaders = headers.map((h) => {
    const lower = h.toLowerCase().trim();
    return fieldMap[lower] || lower;
  });
  const rows = [];
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = _parseLine(line, delimiter);
    const row = {};
    for (let j = 0; j < mappedHeaders.length; j++) {
      const field = mappedHeaders[j];
      let strVal = j < values.length ? values[j].trim() : "";
      let val = strVal;
      if (field === "minLevel" || field === "order") {
        const num = strVal !== "" ? parseInt(strVal, 10) : 0;
        val = isNaN(num) ? 0 : num;
      } else if (field === "isActive") {
        val = _parseBool(strVal, true);
      } else if (field === "isDivider") {
        val = _parseBool(strVal, false);
      }
      row[field] = val;
    }
    rows.push(row);
  }
  return { rows, headers, errors };
}
function readCSVFile(file, options = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve({ rows: [], headers: [], errors: ["No file provided"] });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = parseCSV(e.target.result, options);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read CSV file"));
    reader.readAsText(file, "UTF-8");
  });
}
function validateCSVRow(row) {
  const errors = [];
  if (!row) {
    return { valid: false, errors: ["Row is null or undefined"] };
  }
  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || typeof row[field] === "string" && row[field].trim() === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }
  if (row.minLevel !== void 0 && row.minLevel !== null) {
    const level = Number(row.minLevel);
    if (isNaN(level) || level < 0 || level > 99) {
      errors.push("minLevel must be between 0 and 99");
    }
  }
  if (row.context && !["sidebar", "navrail", "header", "footer"].includes(row.context)) {
    errors.push(`Invalid context: ${row.context}. Must be sidebar, navrail, header, or footer`);
  }
  return { valid: errors.length === 0, errors };
}
function _detectDelimiter(text) {
  const firstLine = text.split("\n")[0] || "";
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons >= commas ? ";" : ",";
}
function _splitLines(text) {
  const lines = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);
  return lines;
}
function _parseLine(line, delimiter) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}
function _parseBool(val, defaultValue) {
  if (val == null || val === "") return defaultValue;
  const lower = String(val).toLowerCase().trim();
  if (["sim", "true", "1", "yes", "s"].includes(lower)) return true;
  if (["n\xE3o", "nao", "false", "0", "no", "n"].includes(lower)) return false;
  return defaultValue;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, requiredFields: REQUIRED_FIELDS };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var csv_default = { parseCSV, readCSVFile, validateCSVRow, REQUIRED_FIELDS, FIELD_MAP, info, healthCheck, VERSION, MODULE_ID };
export {
  FIELD_MAP,
  MODULE_ID,
  REQUIRED_FIELDS,
  VERSION,
  csv_default as default,
  healthCheck,
  info,
  parseCSV,
  readCSVFile,
  validateCSVRow
};
