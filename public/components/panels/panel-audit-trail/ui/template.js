import { VERSION, MODULE_ID, CSS_PREFIX, COLUMNS, TABS, TIME_PRESETS } from "./template-constants.js";
import { formatTimestamp, escapeHtml, truncate, getToastIcon } from "./template-utils.js";
import { buildTemplate } from "./template-main.js";
import { buildTableHead, buildSkeletonRows } from "./template-head.js";
import { buildAuditRow, buildPermissionRow, buildFrontendRow, buildSecurityRow } from "./template-rows.js";
import { buildExpandedRow, buildGroupHeader, buildEmptyRow, buildColumnsMenu } from "./template-expanded.js";
import { updateTimestamp, updateRefreshBtn, updateHealthSummary, updateCountdown, setAutoRefreshState, setDensity, updateBulkActions, toggleExportMenu, toggleFullscreen, showToast, showDetailModal, buildDetailModal } from "./template-ui.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, CSS_PREFIX as CSS_PREFIX2, COLUMNS as COLUMNS2 } from "./template-constants.js";
import { buildTemplate as buildTemplate2 } from "./template-main.js";
import { buildTableHead as buildTableHead2, buildSkeletonRows as buildSkeletonRows2 } from "./template-head.js";
import { buildAuditRow as buildAuditRow2, buildPermissionRow as buildPermissionRow2, buildFrontendRow as buildFrontendRow2, buildSecurityRow as buildSecurityRow2 } from "./template-rows.js";
import { buildExpandedRow as buildExpandedRow2, buildGroupHeader as buildGroupHeader2, buildEmptyRow as buildEmptyRow2, buildColumnsMenu as buildColumnsMenu2 } from "./template-expanded.js";
import { updateTimestamp as updateTimestamp2, updateRefreshBtn as updateRefreshBtn2, updateHealthSummary as updateHealthSummary2, updateCountdown as updateCountdown2, setAutoRefreshState as setAutoRefreshState2, setDensity as setDensity2, updateBulkActions as updateBulkActions2, toggleExportMenu as toggleExportMenu2, toggleFullscreen as toggleFullscreen2, showToast as showToast2, showDetailModal as showDetailModal2, buildDetailModal as buildDetailModal2 } from "./template-ui.js";
const LOCAL_MODULE_ID = "panel-audit-trail-template-aggregator";
function getVersion() {
  return VERSION2;
}
function info() {
  return { moduleId: LOCAL_MODULE_ID, version: VERSION2, aggregates: ["template-constants", "template-utils", "template-main", "template-head", "template-rows", "template-expanded", "template-ui"], timestamp: Date.now() };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: LOCAL_MODULE_ID, version: VERSION2, checks: { templateReady: true, exportsAvailable: typeof buildTemplate2 === "function" }, timestamp: Date.now() };
}
var template_default = { VERSION: VERSION2, MODULE_ID: MODULE_ID2, CSS_PREFIX: CSS_PREFIX2, COLUMNS: COLUMNS2, buildTemplate: buildTemplate2, buildTableHead: buildTableHead2, buildSkeletonRows: buildSkeletonRows2, buildColumnsMenu: buildColumnsMenu2, buildAuditRow: buildAuditRow2, buildPermissionRow: buildPermissionRow2, buildFrontendRow: buildFrontendRow2, buildSecurityRow: buildSecurityRow2, buildEmptyRow: buildEmptyRow2, buildExpandedRow: buildExpandedRow2, buildGroupHeader: buildGroupHeader2, showDetailModal: showDetailModal2, buildDetailModal: buildDetailModal2, updateTimestamp: updateTimestamp2, updateRefreshBtn: updateRefreshBtn2, updateHealthSummary: updateHealthSummary2, updateCountdown: updateCountdown2, setAutoRefreshState: setAutoRefreshState2, setDensity: setDensity2, showToast: showToast2, toggleFullscreen: toggleFullscreen2, updateBulkActions: updateBulkActions2, toggleExportMenu: toggleExportMenu2, getVersion, info, healthCheck };
export {
  COLUMNS,
  CSS_PREFIX,
  MODULE_ID,
  TABS,
  TIME_PRESETS,
  VERSION,
  buildAuditRow,
  buildColumnsMenu,
  buildDetailModal,
  buildEmptyRow,
  buildExpandedRow,
  buildFrontendRow,
  buildGroupHeader,
  buildPermissionRow,
  buildSecurityRow,
  buildSkeletonRows,
  buildTableHead,
  buildTemplate,
  template_default as default,
  escapeHtml,
  formatTimestamp,
  getToastIcon,
  getVersion,
  healthCheck,
  info,
  setAutoRefreshState,
  setDensity,
  showDetailModal,
  showToast,
  toggleExportMenu,
  toggleFullscreen,
  truncate,
  updateBulkActions,
  updateCountdown,
  updateHealthSummary,
  updateRefreshBtn,
  updateTimestamp
};
