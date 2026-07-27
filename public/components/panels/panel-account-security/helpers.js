const MODULE_ID = "panel-account-security.helpers";
const VERSION = "9.3.0-P2-ENTERPRISE";
import { SECURITY_LEVELS, MAX_LOGIN_ATTEMPTS } from "./constants.js";
function calculatePasswordStrength(password) {
  if (!password) return { level: SECURITY_LEVELS.LOW, score: 0 };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  let level = SECURITY_LEVELS.LOW;
  if (score >= 5) level = SECURITY_LEVELS.HIGH;
  else if (score >= 3) level = SECURITY_LEVELS.MEDIUM;
  return { level, score };
}
function isAccountLocked(attempts, lockoutTime) {
  return attempts >= MAX_LOGIN_ATTEMPTS && Date.now() < lockoutTime;
}
function formatLastLogin(timestamp) {
  if (!timestamp) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(timestamp));
}
function timeAgo(timestamp) {
  if (!timestamp) return "Nunca";
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 6e4);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes} min atr\xE1s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atr\xE1s`;
  const days = Math.floor(hours / 24);
  return `${days}d atr\xE1s`;
}
function getSecurityScore(password) {
  return calculatePasswordStrength(password).score;
}
function getPasswordStrengthLabel(password) {
  const { level } = calculatePasswordStrength(password);
  const labels = {
    [SECURITY_LEVELS.LOW]: "Fraca",
    [SECURITY_LEVELS.MEDIUM]: "M\xE9dia",
    [SECURITY_LEVELS.HIGH]: "Forte",
    [SECURITY_LEVELS.CRITICAL]: "Cr\xEDtica"
  };
  return labels[level] ?? "Desconhecida";
}
function isAuthenticated() {
  return true;
}
export {
  MODULE_ID,
  VERSION,
  calculatePasswordStrength,
  formatLastLogin,
  getPasswordStrengthLabel,
  getSecurityScore,
  isAccountLocked,
  isAuthenticated,
  timeAgo
};
