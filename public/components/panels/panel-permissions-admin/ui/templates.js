import * as Helpers from "./templates-helpers.js";
import * as Skeletons from "./templates-skeletons.js";
import * as Layout from "./templates-layout.js";
import * as Users from "./templates-users.js";
import * as Regions from "./templates-regions.js";
import * as Stats from "./templates-stats.js";
import * as Compare from "./templates-compare.js";
import * as Matrix from "./templates-matrix.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-templates";
const { getInitials, getLevelClass, groupByArea, formatArea, formatTimeAgo, calculatePercentage } = Helpers;
const { skeletonUserGrid, skeletonUserFocus, skeletonMatrix } = Skeletons;
const { layout } = Layout;
const { userCard, userFocus, userFocusEmpty } = Users;
const { regionMatrix, matrixEmpty } = Regions;
const { triggerMatrix, estadoCelula } = Matrix;
const { stats, statsExpanded, activityTimeline, coverageBar, lastEditBadge, modalPreview } = Stats;
const { compareLegend, compareUsers, compareStats, triggerMatrixCompare, keyboardNavHint } = Compare;
const Templates = {
  // Layout
  layout,
  // Skeletons
  skeletonUserGrid,
  skeletonUserFocus,
  skeletonMatrix,
  // Users
  userCard,
  userFocus,
  userFocusEmpty,
  // Regions
  regionMatrix,
  matrixEmpty,
  // Matrix
  triggerMatrix,
  estadoCelula,
  // Stats
  stats,
  statsExpanded,
  activityTimeline,
  coverageBar,
  lastEditBadge,
  modalPreview,
  // Compare
  compareLegend,
  compareUsers,
  compareStats,
  triggerMatrixCompare,
  keyboardNavHint,
  // Meta
  VERSION,
  MODULE_ID
};
var templates_default = Templates;
export {
  MODULE_ID,
  Templates,
  VERSION,
  activityTimeline,
  calculatePercentage,
  compareLegend,
  compareStats,
  compareUsers,
  coverageBar,
  templates_default as default,
  estadoCelula,
  formatArea,
  formatTimeAgo,
  getInitials,
  getLevelClass,
  groupByArea,
  keyboardNavHint,
  lastEditBadge,
  layout,
  matrixEmpty,
  modalPreview,
  regionMatrix,
  skeletonMatrix,
  skeletonUserFocus,
  skeletonUserGrid,
  stats,
  statsExpanded,
  triggerMatrix,
  triggerMatrixCompare,
  userCard,
  userFocus,
  userFocusEmpty
};
