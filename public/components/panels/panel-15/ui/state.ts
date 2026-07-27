// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-15:ui:state
// PURPOSE: Panel-15 - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createInitialState() — exported function
//   parsePayload() — exported function
//   hasValidData() — exported function
//   toggleSort() — exported function
//   info() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-15:ui:state';

export const createInitialState = (): {
  mounted: boolean;
  hasData: boolean;
  overview: Record<string, unknown> | null;
  recentActivity: Record<string, unknown>[];
  topJobs: Record<string, unknown>[];
  alertsSummary: Record<string, unknown> | null;
  activityPage: number;
  activityPerPage: number;
  topJobsSort: { field: string; dir: string };
} => ({
  mounted: false,
  hasData: false,
  overview: null,
  recentActivity: [],
  topJobs: [],
  alertsSummary: null,
  activityPage: 1,
  activityPerPage: 10,
  topJobsSort: { field: 'total_executions', dir: 'desc' }
});

export const parsePayload = (data: Record<string, unknown>) => {
  const payload = (data?.data || data?.payload || data) as Record<string, unknown>;
  return {
    overview: payload?.overview || null,
    recentActivity: (payload?.recent_activity as unknown[] | undefined) || [],
    topJobs: (payload?.top_jobs as unknown[] | undefined) || [],
    alertsSummary: payload?.alerts_summary || null
  };
};

export const hasValidData = (overview: unknown, recentActivity: unknown[], topJobs: unknown[]) => overview || recentActivity.length > 0 || topJobs.length > 0;

export const toggleSort = (currentSort: { field: string; dir: string }, field: string) => {
  if (currentSort.field === field) {
    return { field, dir: currentSort.dir === 'desc' ? 'asc' : 'desc' };
  }
  return { field, dir: 'desc' };
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export default { createInitialState, parsePayload, hasValidData, toggleSort };
