const VERSION = "1.1.0-AAA";
const MODULE_ID = "app-shell-config-exporter";
const EXPORT_FORMATS = Object.freeze({
  JSON: "json",
  BASE64: "base64",
  URL: "url"
});
const EXPORT_SCOPES = Object.freeze({
  ALL: "all",
  LAYOUT: "layout",
  THEME: "theme",
  PREFERENCES: "preferences",
  DEBUG: "debug",
  CUSTOM: "custom"
});
function base64Encode(str) {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));
  } catch (e) {
    return btoa(str);
  }
}
function base64Decode(str) {
  try {
    return decodeURIComponent(atob(str).split("").map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`).join(""));
  } catch (e) {
    return atob(str);
  }
}
function generateChecksum(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
export {
  EXPORT_FORMATS,
  EXPORT_SCOPES,
  MODULE_ID,
  VERSION,
  base64Decode,
  base64Encode,
  generateChecksum
};
