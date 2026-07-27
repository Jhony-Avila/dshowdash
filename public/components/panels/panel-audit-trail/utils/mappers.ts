// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: mappers
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   mapAuditEntry() — exported function
//   mapAuditEntries() — exported function
//   mapFilters() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-audit-trail.utils.mappers';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Audit Trail - Data Mappers
 * @module panel-audit-trail/utils/mappers
 * @version 1.1.0-AAA
 */

export function mapAuditEntry(raw: Record<string, unknown>) {
    return {
        id: raw.id,
        action: raw.action,
        user: raw.user_name || raw.user,
        target: raw.target_type,
        targetId: raw.target_id,
        details: raw.details ? JSON.parse(raw.details as string) : {},
        ip: raw.ip_address,
        timestamp: new Date(raw.created_at as string | number)
    };
}

export function mapAuditEntries(rawList: Record<string, unknown>[]) {
    return (rawList || []).map(mapAuditEntry);
}

export function mapFilters(filters: Record<string, string>) {
    const mapped: Record<string, string> = {};
    if (filters.action) mapped.action = filters.action;
    if (filters.user) mapped.user_id = filters.user;
    if (filters.dateFrom) mapped.from_date = filters.dateFrom;
    if (filters.dateTo) mapped.to_date = filters.dateTo;
    return mapped;
}

export default { mapAuditEntry, mapAuditEntries, mapFilters };
