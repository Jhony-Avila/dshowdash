import { TIME_PERIODS } from "../../core/constants.js";
const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "panel-home.domain.contextual-message.placeholder-parser";
const PERIOD_LABELS = {
  [TIME_PERIODS.MORNING]: "manh\xE3",
  [TIME_PERIODS.AFTERNOON]: "tarde",
  [TIME_PERIODS.EVENING]: "noite",
  [TIME_PERIODS.NIGHT]: "madrugada"
};
const DAY_LABELS = [
  "domingo",
  "segunda-feira",
  "ter\xE7a-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "s\xE1bado"
];
const GREETINGS = {
  [TIME_PERIODS.MORNING]: "Bom dia",
  [TIME_PERIODS.AFTERNOON]: "Boa tarde",
  [TIME_PERIODS.EVENING]: "Boa noite",
  [TIME_PERIODS.NIGHT]: "Boa noite"
};
function getGreeting(period) {
  return GREETINGS[period] || "Ol\xE1";
}
function getPeriodLabel(period) {
  return PERIOD_LABELS[period] || "dia";
}
function getDayLabel(dayOfWeek) {
  return DAY_LABELS[dayOfWeek] || "";
}
function parsePlaceholders(text, context) {
  if (!text) return "";
  if (!context) return text;
  let result = text;
  if (context.user?.name) {
    result = result.replace(/\{nome\}/gi, context.user.name);
  } else {
    result = result.replace(/,?\s*\{nome\}/gi, "");
    result = result.replace(/\{nome\},?\s*/gi, "");
  }
  if (context.time?.period) {
    result = result.replace(/\{saudacao\}/gi, getGreeting(context.time.period));
  }
  if (context.time?.period) {
    result = result.replace(/\{periodo\}/gi, getPeriodLabel(context.time.period));
  }
  if (context.time?.dayOfWeek !== void 0) {
    result = result.replace(/\{dia\}/gi, getDayLabel(context.time.dayOfWeek));
  }
  if (context.time?.hour !== void 0) {
    result = result.replace(/\{hora\}/gi, context.time.hour.toString().padStart(2, "0"));
  }
  if (context.user?.role) {
    result = result.replace(/\{cargo\}/gi, context.user.role);
    result = result.replace(/\{role\}/gi, context.user.role);
  } else {
    result = result.replace(/,?\s*\{cargo\}/gi, "");
    result = result.replace(/,?\s*\{role\}/gi, "");
  }
  result = result.replace(/\s{2,}/g, " ").trim();
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result;
}
function requiresUserName(text) {
  if (!text) return false;
  return /\{nome\}/i.test(text);
}
function listPlaceholders(text) {
  if (!text) return [];
  const matches = text.match(/\{(\w+)\}/g) || [];
  return matches.map((m) => m.slice(1, -1).toLowerCase());
}
var placeholder_parser_default = {
  parsePlaceholders,
  requiresUserName,
  listPlaceholders,
  getGreeting,
  getPeriodLabel,
  getDayLabel
};
export {
  MODULE_ID,
  VERSION,
  placeholder_parser_default as default,
  getDayLabel,
  getGreeting,
  getPeriodLabel,
  listPlaceholders,
  parsePlaceholders,
  requiresUserName
};
