const MODULE_ID = "panel-user-management-validators";
const VERSION = "9.3.0-P2-ENTERPRISE";
function sanitizeString(str) {
  if (typeof str !== "string") return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").trim();
}
function truncate(str, maxLength) {
  maxLength = maxLength || 100;
  if (typeof str !== "string") return "";
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 3)}...`;
}
function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function validateUser(user) {
  const errors = [];
  const normalized = {};
  if (!user || typeof user !== "object") {
    return { valid: false, errors: ["Dados de usu\xE1rio inv\xE1lidos"], normalizedUser: null };
  }
  const u = user;
  if (u.id === void 0 || u.id === null) {
    errors.push("ID \xE9 obrigat\xF3rio");
  } else {
    normalized.id = Number(u.id);
  }
  if (!u.username || typeof u.username !== "string") {
    errors.push("Username \xE9 obrigat\xF3rio");
  } else {
    normalized.username = sanitizeString(u.username);
  }
  if (!u.email) {
    errors.push("Email \xE9 obrigat\xF3rio");
  } else if (!isValidEmail(u.email)) {
    errors.push("Email inv\xE1lido");
  } else {
    normalized.email = sanitizeString(u.email).toLowerCase();
  }
  normalized.nome = sanitizeString(u.nome || u.name || "");
  normalized.name = normalized.nome;
  normalized.nome_completo = sanitizeString(u.nome_completo || "");
  normalized.nome_resumido = sanitizeString(u.nome_resumido || "");
  const validStatus = ["active", "inactive", "disabled", "suspended", "pending"];
  normalized.status = validStatus.indexOf(u.status) !== -1 ? u.status : "active";
  normalized.roles = Array.isArray(u.roles) ? u.roles : [];
  normalized.role = typeof u.role === "string" ? sanitizeString(u.role) : "";
  normalized.userLevel = typeof u.userLevel === "number" ? u.userLevel : 1;
  normalized.createdAt = u.createdAt || u.created_at || null;
  normalized.created_at = u.created_at || u.createdAt || null;
  normalized.lastLoginAt = u.lastLoginAt || u.last_login_at || null;
  normalized.last_login_at = u.last_login_at || u.lastLoginAt || null;
  normalized.updatedAt = u.updatedAt || u.updated_at || null;
  normalized.updated_at = u.updated_at || u.updatedAt || null;
  normalized.avatar_url = u.avatar_url || u.avatar || null;
  normalized.avatar = u.avatar_url || u.avatar || null;
  normalized.funcao = sanitizeString(u.funcao || "");
  normalized.departamento = sanitizeString(u.departamento || "");
  normalized.id_cargo = u.id_cargo || null;
  normalized.id_matricula = u.id_matricula || null;
  normalized.locale = u.locale || "pt-BR";
  return { valid: errors.length === 0, errors, normalizedUser: errors.length === 0 ? normalized : null };
}
function validateRole(role) {
  const errors = [];
  const normalized = {};
  if (!role || typeof role !== "object") {
    return { valid: false, errors: ["Dados de role inv\xE1lidos"], normalizedRole: null };
  }
  const r = role;
  if (r.id === void 0) {
    errors.push("ID \xE9 obrigat\xF3rio");
  } else {
    normalized.id = Number(r.id);
  }
  if (!r.name && !r.role_name) {
    errors.push("Nome \xE9 obrigat\xF3rio");
  } else {
    normalized.name = sanitizeString(r.role_name || r.name || "");
  }
  normalized.role_name = normalized.name;
  normalized.role_key = sanitizeString(r.role_key || "");
  normalized.description = sanitizeString(r.description || "");
  normalized.level = typeof r.level === "number" ? r.level : 1;
  normalized.permissions = Array.isArray(r.permissions) ? r.permissions : [];
  return { valid: errors.length === 0, errors, normalizedRole: errors.length === 0 ? normalized : null };
}
function validateSession(session) {
  const errors = [];
  const normalized = {};
  if (!session || typeof session !== "object") {
    return { valid: false, errors: ["Dados de sess\xE3o inv\xE1lidos"], normalizedSession: null };
  }
  const s = session;
  if (!s.id) {
    errors.push("ID \xE9 obrigat\xF3rio");
  } else {
    normalized.id = String(s.id);
  }
  normalized.userId = Number(s.userId || s.user_id);
  normalized.deviceType = sanitizeString(s.deviceType || s.device_type || "Unknown");
  normalized.browser = sanitizeString(s.browser || "Unknown");
  normalized.ip = sanitizeString(s.ip || s.origin_ip || "");
  normalized.createdAt = s.createdAt || s.created_at || null;
  normalized.lastActivity = s.lastActivity || s.last_activity_at || s.last_activity || null;
  normalized.isActive = s.is_active === 1 || s.is_active === true;
  return { valid: errors.length === 0, errors, normalizedSession: errors.length === 0 ? normalized : null };
}
function validateFilters(filters) {
  const normalized = {
    search: sanitizeString(filters ? String(filters.search || "") : ""),
    status: ["", "active", "inactive", "disabled", "suspended", "all"].indexOf(filters ? String(filters.status) : "") !== -1 ? String(filters?.status || "") : "",
    role: sanitizeString(filters ? String(filters.role || "") : ""),
    limit: Math.min(Math.max(Number(filters ? filters.limit : 20) || 20, 1), 100),
    offset: Math.max(Number(filters ? filters.offset : 0) || 0, 0)
  };
  return { valid: true, errors: [], normalizedFilters: normalized };
}
function containsSensitiveData(obj) {
  const sensitiveKeys = ["password", "senha", "token", "secret", "hash", "salt", "apiKey", "api_key"];
  if (!obj || typeof obj !== "object") return false;
  const o = obj;
  const objKeys = Object.keys(o);
  for (let i = 0; i < objKeys.length; i++) {
    const key = objKeys[i];
    for (let j = 0; j < sensitiveKeys.length; j++) {
      if (key.toLowerCase().indexOf(sensitiveKeys[j].toLowerCase()) !== -1) return true;
    }
  }
  return false;
}
function removeSensitiveData(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const ro = obj;
  const sensitiveKeys = ["password", "senha", "token", "secret", "hash", "salt", "apiKey", "api_key"];
  const cleaned = {};
  for (const k in ro) {
    if (ro.hasOwnProperty(k)) cleaned[k] = ro[k];
  }
  for (let i = 0; i < sensitiveKeys.length; i++) {
    const sens = sensitiveKeys[i];
    const cleanedKeys = Object.keys(cleaned);
    for (let j = 0; j < cleanedKeys.length; j++) {
      if (cleanedKeys[j].toLowerCase().indexOf(sens.toLowerCase()) !== -1) {
        delete cleaned[cleanedKeys[j]];
      }
    }
  }
  return cleaned;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var validators_default = { MODULE_ID, VERSION, sanitizeString, truncate, isValidEmail, validateUser, validateRole, validateSession, validateFilters, containsSensitiveData, removeSensitiveData, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  containsSensitiveData,
  validators_default as default,
  healthCheck,
  info,
  isValidEmail,
  removeSensitiveData,
  sanitizeString,
  truncate,
  validateFilters,
  validateRole,
  validateSession,
  validateUser
};
