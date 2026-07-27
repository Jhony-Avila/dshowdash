const VERSION = "1.0.1-P20-MODULE-ID";
const MODULE_ID = "icon-registry-charts";
const NAMESPACE = "charts";
const BASE = 'width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
const ICONS = {
  "bar": `<svg ${BASE}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  "bar-horizontal": `<svg ${BASE}><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><line x1="4" y1="6" x2="10" y2="6"/></svg>`,
  "bar-chart-2": `<svg ${BASE}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  "line": `<svg ${BASE}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  "trending-up": `<svg ${BASE}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  "trending-down": `<svg ${BASE}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`,
  "activity": `<svg ${BASE}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  "pie": `<svg ${BASE}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
  "donut": `<svg ${BASE}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>`,
  "area": `<svg ${BASE}><path d="M3 3v18h18"/><path d="M3 15l4-4 4 4 4-6 6 6"/><path d="M3 21l4-10 4 4 4-8 6 8v6H3z" fill="currentColor" opacity="0.1"/></svg>`,
  "scatter": `<svg ${BASE}><circle cx="7" cy="14" r="2"/><circle cx="11" cy="6" r="2"/><circle cx="16" cy="18" r="2"/><circle cx="18" cy="10" r="2"/><circle cx="4" cy="8" r="2"/></svg>`,
  "gauge": `<svg ${BASE}><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 2a10 10 0 0 0-10 10"/><line x1="12" y1="12" x2="12" y2="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  "sparkline": `<svg ${BASE}><polyline points="4 16 8 12 12 14 16 8 20 10"/></svg>`,
  "funnel": `<svg ${BASE}><path d="M22 3H2l8 9v6l4 3V12l8-9z"/></svg>`,
  "target": `<svg ${BASE}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  "zap": `<svg ${BASE}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  "percent": `<svg ${BASE}><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`
};
var charts_default = ICONS;
export {
  ICONS,
  MODULE_ID,
  NAMESPACE,
  VERSION,
  charts_default as default
};
