const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-management/ui/helpers";
const AVATAR_COLORS = ["#4F6D7A", "#5D6B7A", "#6B5D7A", "#5D7A6B", "#7A6B5D", "#5D6A7A", "#6A5D6B", "#5D7A7A"];
function sanitize(str) {
  if (typeof str !== "string") return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").trim();
}
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
function getAvatarColor(id) {
  return AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];
}
function formatDate(dateStr) {
  if (!dateStr) return "\u2014";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "\u2014";
    return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "\u2014";
  }
}
var helpers_default = { sanitize, getInitials, getAvatarColor, formatDate, AVATAR_COLORS };
export {
  AVATAR_COLORS,
  MODULE_ID,
  VERSION,
  helpers_default as default,
  formatDate,
  getAvatarColor,
  getInitials,
  sanitize
};
