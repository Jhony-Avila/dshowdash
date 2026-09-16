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
    
    // 2026-09-16: a API (action=kpis) sempre devolveu receita_total/clientes_ativos/taxa_conversao/orcamentos_total/
    // a_receber_aberto/contatos_ativos; este renderer lia só os nomes curtos → 6 de 7 KPIs mostravam "—". Aceita ambos.
    const pick = (...keys: string[]) => { for (const k of keys) { if (data[k] !== undefined && data[k] !== null) return data[k]; } return undefined; };
    const updates = [
        { ref: refs.kpiReceita, value: formatCurrency(pick('receita', 'receita_total')) },
        { ref: refs.kpiClientes, value: formatNumber(pick('clientes', 'clientes_ativos')) },
        { ref: refs.kpiConversao, value: formatPercent(pick('conversao', 'taxa_conversao')) },
        { ref: refs.kpiOrcamentos, value: formatNumber(pick('orcamentos', 'orcamentos_total')) },
        { ref: refs.kpiAReceber, value: formatCurrency(pick('aReceber', 'a_receber_aberto')) },
        { ref: refs.kpiContatos, value: formatNumber(pick('contatos', 'contatos_ativos')) },
        { ref: refs.kpiCidades, value: formatNumber(pick('cidades')) }
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
