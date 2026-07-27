const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "table-engine-worker";
self.VERSION = VERSION;
self.MODULE_ID = MODULE_ID;
self.onmessage = (e) => {
  const data = e.data;
  const type = data.type;
  const payload = data.payload;
  const requestId = data.requestId;
  try {
    let result;
    switch (type) {
      case "sort":
        result = handleSort(payload);
        break;
      case "filter":
        result = handleFilter(payload);
        break;
      case "search":
        result = handleSearch(payload);
        break;
      case "aggregate":
        result = handleAggregate(payload);
        break;
      case "transform":
        result = handleTransform(payload);
        break;
      case "info":
        result = { moduleId: MODULE_ID, version: VERSION };
        break;
      case "healthCheck":
        result = { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { sortReady: typeof handleSort === "function", filterReady: typeof handleFilter === "function", searchReady: typeof handleSearch === "function" } };
        break;
      case "getVersion":
        result = { version: VERSION, moduleId: MODULE_ID };
        break;
      default:
        throw new Error(`Unknown operation: ${type}`);
    }
    self.postMessage({ requestId, success: true, result });
  } catch (error) {
    self.postMessage({ requestId, success: false, error: error.message });
  }
};
function handleSort(payload) {
  const data = payload.data;
  const column = payload.column;
  const direction = payload.direction;
  const type = payload.type;
  const dir = direction === "desc" ? -1 : 1;
  const sorted = data.slice().sort((a, b) => {
    let valA = a[column];
    let valB = b[column];
    if (valA == null) return 1;
    if (valB == null) return -1;
    if (type === "number" || type === "currency") {
      valA = parseFloat(String(valA)) || 0;
      valB = parseFloat(String(valB)) || 0;
    } else if (type === "date" || type === "datetime") {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else if (type === "boolean") {
      valA = valA ? 1 : 0;
      valB = valB ? 1 : 0;
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }
    if (valA < valB) return -1 * dir;
    if (valA > valB) return 1 * dir;
    return 0;
  });
  return sorted;
}
function handleFilter(payload) {
  const data = payload.data;
  const filters = payload.filters;
  return data.filter((row) => filters.every((filter) => {
    const value = row[filter.column];
    const filterValue = filter.value;
    const op = filter.operator;
    if (op === "eq" || op === "equals") return value == filterValue;
    if (op === "neq" || op === "not_equals") return value != filterValue;
    if (op === "contains") return String(value).toLowerCase().indexOf(String(filterValue).toLowerCase()) !== -1;
    if (op === "not_contains") return String(value).toLowerCase().indexOf(String(filterValue).toLowerCase()) === -1;
    if (op === "starts_with") return String(value).toLowerCase().indexOf(String(filterValue).toLowerCase()) === 0;
    if (op === "ends_with") {
      const s = String(value).toLowerCase();
      const f = String(filterValue).toLowerCase();
      return s.indexOf(f, s.length - f.length) !== -1;
    }
    if (op === "gt" || op === "greater_than") return parseFloat(value) > parseFloat(filterValue);
    if (op === "gte" || op === "greater_or_equal") return parseFloat(value) >= parseFloat(filterValue);
    if (op === "lt" || op === "less_than") return parseFloat(value) < parseFloat(filterValue);
    if (op === "lte" || op === "less_or_equal") return parseFloat(value) <= parseFloat(filterValue);
    if (op === "between") {
      const num = parseFloat(value);
      return num >= parseFloat(filter.min) && num <= parseFloat(filter.max);
    }
    if (op === "in") return Array.isArray(filterValue) && filterValue.indexOf(value) !== -1;
    if (op === "not_in") return !Array.isArray(filterValue) || filterValue.indexOf(value) === -1;
    if (op === "is_empty") return value == null || value === "";
    if (op === "is_not_empty") return value != null && value !== "";
    return true;
  }));
}
function handleSearch(payload) {
  const data = payload.data;
  const query = payload.query;
  const columns = payload.columns;
  if (!query || !query.trim()) return data;
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const searchColumns = columns || Object.keys(data[0] || {});
  return data.filter((row) => {
    const rowText = searchColumns.map((col) => String(row[col] || "").toLowerCase()).join(" ");
    return searchTerms.every((term) => rowText.indexOf(term) !== -1);
  });
}
function handleAggregate(payload) {
  const data = payload.data;
  const aggregations = payload.aggregations;
  const results = {};
  aggregations.forEach((agg) => {
    const column = agg.column;
    const operation = agg.operation;
    const alias = agg.alias;
    const values = data.map((row) => parseFloat(row[column]) || 0);
    const key = alias || `${column}_${operation}`;
    if (operation === "sum") results[key] = values.reduce((a, b) => a + b, 0);
    else if (operation === "avg") results[key] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    else if (operation === "min") results[key] = Math.min(...values);
    else if (operation === "max") results[key] = Math.max(...values);
    else if (operation === "count") results[key] = values.length;
    else if (operation === "distinct") {
      const unique = {};
      data.forEach((row) => {
        unique[row[column]] = true;
      });
      results[key] = Object.keys(unique).length;
    }
  });
  return results;
}
function handleTransform(payload) {
  const data = payload.data;
  const transforms = payload.transforms;
  return data.map((row) => {
    const newRow = Object.assign({}, row);
    transforms.forEach((transform) => {
      const targetColumn = transform.targetColumn;
      const sourceColumns = transform.sourceColumns;
      const operation = transform.operation;
      if (operation === "concat") newRow[targetColumn] = sourceColumns.map((col) => row[col]).join(transform.separator || " ");
      else if (operation === "sum") newRow[targetColumn] = sourceColumns.reduce((sum, col) => sum + (parseFloat(row[col]) || 0), 0);
      else if (operation === "multiply") newRow[targetColumn] = sourceColumns.reduce((prod, col) => prod * (parseFloat(row[col]) || 1), 1);
      else if (operation === "uppercase") newRow[targetColumn] = String(row[sourceColumns[0]] || "").toUpperCase();
      else if (operation === "lowercase") newRow[targetColumn] = String(row[sourceColumns[0]] || "").toLowerCase();
    });
    return newRow;
  });
}
export {
  MODULE_ID,
  VERSION
};
