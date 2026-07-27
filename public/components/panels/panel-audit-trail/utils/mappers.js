const MODULE_ID = "panel-audit-trail.utils.mappers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function mapAuditEntry(raw) {
  return {
    id: raw.id,
    action: raw.action,
    user: raw.user_name || raw.user,
    target: raw.target_type,
    targetId: raw.target_id,
    details: raw.details ? JSON.parse(raw.details) : {},
    ip: raw.ip_address,
    timestamp: new Date(raw.created_at)
  };
}
function mapAuditEntries(rawList) {
  return (rawList || []).map(mapAuditEntry);
}
function mapFilters(filters) {
  const mapped = {};
  if (filters.action) mapped.action = filters.action;
  if (filters.user) mapped.user_id = filters.user;
  if (filters.dateFrom) mapped.from_date = filters.dateFrom;
  if (filters.dateTo) mapped.to_date = filters.dateTo;
  return mapped;
}
var mappers_default = { mapAuditEntry, mapAuditEntries, mapFilters };
export {
  MODULE_ID,
  VERSION,
  mappers_default as default,
  mapAuditEntries,
  mapAuditEntry,
  mapFilters
};
