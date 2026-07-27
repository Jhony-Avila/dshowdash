// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:renderer:kpis
// PURPOSE: Panel-05 KPIs Renderer - AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   updateKPIs() — exported function
//   info() — exported function
//   healthCheck() — exported function
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
export const MODULE_ID = 'panel-05:renderer:kpis';

// Format helpers
function formatCurrency(v: unknown) {
    if (v == null || isNaN(Number(v))) return '—';
    const n = Number(v);
    if (n >= 1e6) return `R$ ${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `R$ ${(n / 1e3).toFixed(1)}K`;
    return `R$ ${n.toFixed(2)}`;
}

function formatNumber(v: unknown) {
    if (v == null || isNaN(Number(v))) return '—';
    const n = Number(v);
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
}

function formatPercent(v: unknown) {
    if (v == null || isNaN(Number(v))) return '—';
    return `${Number(v).toFixed(1)}%`;
}

// ═══════════════════════════════════════════════════════════════
// UPDATE KPIS (textContent only)
// ═══════════════════════════════════════════════════════════════
export function updateKPIs(refs: Record<string, unknown> | null, data: Record<string, unknown> | null) {
    if (!refs || !data) return;
    
    const updates = [
        { ref: refs.kpiReceita, value: formatCurrency(data.receita) },
        { ref: refs.kpiClientes, value: formatNumber(data.clientes) },
        { ref: refs.kpiConversao, value: formatPercent(data.conversao) },
        { ref: refs.kpiOrcamentos, value: formatNumber(data.orcamentos) },
        { ref: refs.kpiAReceber, value: formatCurrency(data.aReceber) },
        { ref: refs.kpiContatos, value: formatNumber(data.contatos) },
        { ref: refs.kpiCidades, value: formatNumber(data.cidades) }
    ];
    
    updates.forEach(({ ref, value }) => {
        const el = ref as HTMLElement | null;
        if (el && el.textContent !== value) {
            el.textContent = value;
        }
    });
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { kpisReady: true } }; }

export default { updateKPIs, info, healthCheck };
