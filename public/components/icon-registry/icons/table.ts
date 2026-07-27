// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-P20-MODULE-ID)
// ═══════════════════════════════════════════════════════════════
// MODULE: icon-registry-table
// PURPOSE: Icon Registry - Table Icons
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   NAMESPACE — exported value
//   ICONS — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.1-P20-MODULE-ID';
export const MODULE_ID = 'icon-registry-table';
export const NAMESPACE = 'table';

const BASE = 'width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';

export const ICONS = {
  'sort': `<svg ${BASE}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
  'sort-asc': `<svg ${BASE}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
  'sort-desc': `<svg ${BASE}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
  'sort-alpha': `<svg ${BASE}><path d="M4 6h7"/><path d="M4 12h5"/><path d="M4 18h3"/><path d="M15 6v12l5-6-5-6z"/></svg>`,
  'checkbox': `<svg ${BASE}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`,
  'checkbox-checked': `<svg ${BASE}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  'checkbox-indeterminate': `<svg ${BASE}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  'radio': `<svg ${BASE}><circle cx="12" cy="12" r="10"/></svg>`,
  'radio-checked': `<svg ${BASE}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>`,
  'table': `<svg ${BASE}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,
  'columns': `<svg ${BASE}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`,
  'rows': `<svg ${BASE}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
  'page-first': `<svg ${BASE}><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>`,
  'page-last': `<svg ${BASE}><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>`,
  'page-prev': `<svg ${BASE}><polyline points="15 18 9 12 15 6"/></svg>`,
  'page-next': `<svg ${BASE}><polyline points="9 18 15 12 9 6"/></svg>`,
  'density-compact': `<svg ${BASE}><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`,
  'density-normal': `<svg ${BASE}><line x1="4" y1="5" x2="20" y2="5"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="19" x2="20" y2="19"/></svg>`,
  'density-comfortable': `<svg ${BASE}><line x1="4" y1="4" x2="20" y2="4"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="20" x2="20" y2="20"/></svg>`,
  'expand': `<svg ${BASE}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  'collapse': `<svg ${BASE}><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  'drag': `<svg ${BASE}><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>`
};

export default ICONS;
