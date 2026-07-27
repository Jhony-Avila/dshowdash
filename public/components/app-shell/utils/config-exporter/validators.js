const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.config-exporter.validators";
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
function validateChecksum(data, checksum) {
  const computed = generateChecksum(data);
  return computed === checksum;
}
export {
  MODULE_ID,
  VERSION,
  generateChecksum,
  validateChecksum
};
