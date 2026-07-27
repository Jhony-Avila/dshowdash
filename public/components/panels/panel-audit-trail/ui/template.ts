// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail-template-aggregator
// PURPOSE: Panel Audit Trail - Template Enterprise AAA (Modular Re-export)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, CSS_PREFIX, COLUMNS from ./template-constants.js
//   buildTemplate from ./template-main.js
//   buildTableHead, buildSkeletonRows from ./template-head.js
//   buildAuditRow, buildPermissionRow, buildFrontendRow, buildSecurityRow from ./...
//   buildExpandedRow, buildGroupHeader, buildEmptyRow, buildColumnsMenu from ./te...
//   updateTimestamp, updateRefreshBtn, updateHealthSummary, updateCountdown, setA...
//
// PROVIDES:
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   CSS_PREFIX — exported value
//   COLUMNS — exported value
//   TABS — exported value
//   TIME_PRESETS — exported value
//   formatTimestamp — exported value
//   escapeHtml — exported value
//   truncate — exported value
//   getToastIcon — exported value
//   buildTemplate — exported value
//   buildTableHead — exported value
//   ... and 21 more exports
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

export { VERSION, MODULE_ID, CSS_PREFIX, COLUMNS, TABS, TIME_PRESETS } from './template-constants.js';
export { formatTimestamp, escapeHtml, truncate, getToastIcon } from './template-utils.js';
export { buildTemplate } from './template-main.js';
export { buildTableHead, buildSkeletonRows } from './template-head.js';
export { buildAuditRow, buildPermissionRow, buildFrontendRow, buildSecurityRow } from './template-rows.js';
export { buildExpandedRow, buildGroupHeader, buildEmptyRow, buildColumnsMenu } from './template-expanded.js';
export { updateTimestamp, updateRefreshBtn, updateHealthSummary, updateCountdown, setAutoRefreshState, setDensity, updateBulkActions, toggleExportMenu, toggleFullscreen, showToast, showDetailModal, buildDetailModal } from './template-ui.js';

import { VERSION, MODULE_ID, CSS_PREFIX, COLUMNS } from './template-constants.js';
import { buildTemplate } from './template-main.js';
import { buildTableHead, buildSkeletonRows } from './template-head.js';
import { buildAuditRow, buildPermissionRow, buildFrontendRow, buildSecurityRow } from './template-rows.js';
import { buildExpandedRow, buildGroupHeader, buildEmptyRow, buildColumnsMenu } from './template-expanded.js';
import { updateTimestamp, updateRefreshBtn, updateHealthSummary, updateCountdown, setAutoRefreshState, setDensity, updateBulkActions, toggleExportMenu, toggleFullscreen, showToast, showDetailModal, buildDetailModal } from './template-ui.js';

const LOCAL_MODULE_ID = 'panel-audit-trail-template-aggregator';

export function getVersion() { return VERSION; }
export function info() { return { moduleId: LOCAL_MODULE_ID, version: VERSION, aggregates: ['template-constants', 'template-utils', 'template-main', 'template-head', 'template-rows', 'template-expanded', 'template-ui'], timestamp: Date.now() }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: LOCAL_MODULE_ID, version: VERSION, checks: { templateReady: true, exportsAvailable: typeof buildTemplate === 'function' }, timestamp: Date.now() }; }

export default { VERSION, MODULE_ID, CSS_PREFIX, COLUMNS, buildTemplate, buildTableHead, buildSkeletonRows, buildColumnsMenu, buildAuditRow, buildPermissionRow, buildFrontendRow, buildSecurityRow, buildEmptyRow, buildExpandedRow, buildGroupHeader, showDetailModal, buildDetailModal, updateTimestamp, updateRefreshBtn, updateHealthSummary, updateCountdown, setAutoRefreshState, setDensity, showToast, toggleFullscreen, updateBulkActions, toggleExportMenu, getVersion, info, healthCheck };
