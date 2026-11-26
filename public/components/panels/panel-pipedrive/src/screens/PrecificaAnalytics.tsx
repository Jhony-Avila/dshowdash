// screens/PrecificaAnalytics.tsx — Precifica Analytics no desenho R2 (P20 · CIMA · 25/11/2026, modo noite).
// @version 0.1.0  @created 2026-11-25
//
// Reaproveita os componentes APROVADOS do Pipedrive R2 (VisaoHud: 8 KPIs com 5 estados, Ganhos ao longo do tempo,
// Desfecho, Ranking de vendedores). Contrato: ACIMA_DIREITA, CONTRATO-PRECIFICA-ANALYTICS.md (v1, aceito-provisório):
// GET /v1/precifica-analytics?from=&to=&seller= (app; flag PRECIFICA_ANALYTICS_ENABLED). Valores em centavos.
//
// P19 (26/11): lê o backend REAL do Dash (P29 4e35e5d3, ACIMA_DIREITA): GET /api/pipedrive/precifica-analytics?from=&to=
// (tabelas APP_DSHOW.pa_* pelo GRANT PRECIFICA-ANALYTICS-ACESSO; contrato v1.1). Sem acesso/sem dados → "—" com o motivo.
// O gerador `sintetico` abaixo só existe para capturas de homologação (resposta marcada `ilustrativo: true` → selo "Ilustrativo").
// A rota segue fora do menu até a decisão do Jhony (DUVIDAS-PARA-O-JHONY.md).
// Sem lista de registros no contrato v1 → sem painel lateral (os cartões não oferecem "Ver negócios").
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import { Calculator, TriangleAlert } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { HudKpis, BlocoGanhos, RankingVendedores, IlustrativoCtx, UnidadeCtx } from './VisaoHud';
import type { PipeSummary, PipeSummaryKpi, PipeMetrics, PipeEstadoDado } from '../shell/types';

// ── contrato v1 (ACIMA_DIREITA) ──────────────────────────────────────────────
interface Soma {
  criados: number; ganhos: number; perdidos: number; conversao: number | null; valor_ganho_cents: number | null;
  ganhos_com_valor: number; ganhos_valor_desconhecido: number; ganhos_sem_valor_financeiro: number; ganhos_garantia: number;
  ticket_cents: number | null; ciclo_medio_dias: number | null;
}
export interface PrecificaAnalytics {
  estado: 'ok' | 'parcial' | 'desatualizado' | 'indisponivel'; motivos: string[]; atualizado_em: string | null; cache_sincronizado_em: string | null;
  periodo: { from: string; to: string }; escopo: 'todos' | 'meus'; regras_versao: string; ilustrativo?: boolean;
  totais: Soma; por_dia: (Soma & { dia: string })[]; por_vendedor: (Soma & { vendedor: string; nome: string | null })[];
  motivos_perda: { motivo: string | null; rotulo: string; perdidos: number }[];
  em_aberto: { abertos: number; valor_cents: number | null; abertos_sem_valor_financeiro: number; idade_media_dias: number | null; por_vendedor: { vendedor: string; nome: string | null; abertos: number; valor_cents: number | null }[] };
}

// ── dados SINTÉTICOS no formato do contrato (ILUSTRATIVO; semente fixa) ─────
function rng(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const VEND = ['Marina Costa', 'Rafael Dias', 'Patrícia Gomes', 'Thiago Mendes', 'Luciana Rocha', 'Eduardo Silva', 'Camila Duarte', 'Vítor Barros'];
const PESO = [12, 9, 7, 5, 4, 3, 2, 1];
const iso = (d: Date) => d.toISOString().slice(0, 10);
function somaVazia(): Soma { return { criados: 0, ganhos: 0, perdidos: 0, conversao: null, valor_ganho_cents: 0, ganhos_com_valor: 0, ganhos_valor_desconhecido: 0, ganhos_sem_valor_financeiro: 0, ganhos_garantia: 0, ticket_cents: null, ciclo_medio_dias: null }; }
function fechar(s: Soma, ciclos: number[]): Soma {
  const fech = s.ganhos + s.perdidos;
  return { ...s, conversao: fech > 0 ? s.ganhos / fech : null, ticket_cents: s.valor_ganho_cents != null && s.ganhos_com_valor > 0 ? Math.round(s.valor_ganho_cents / s.ganhos_com_valor) : null,
    ciclo_medio_dias: ciclos.length ? Math.round(ciclos.reduce((a, x) => a + x, 0) / ciclos.length) : null };
}
export function sintetico(from: string, to: string, semente: number): PrecificaAnalytics {
  const r = rng(semente); const tot = somaVazia(); const cicTot: number[] = [];
  const pv = VEND.map(() => ({ s: somaVazia(), c: [] as number[] }));
  const por_dia: PrecificaAnalytics['por_dia'] = [];
  for (let t = new Date(`${from}T00:00:00Z`); iso(t) <= to; t.setUTCDate(t.getUTCDate() + 1)) {
    const dia = somaVazia(); const cic: number[] = [];
    dia.criados = Math.floor(r() * 9) + 3;
    const ganhos = Math.floor(r() * 5); const perdidos = Math.floor(r() * 7);
    for (let i = 0; i < ganhos; i++) {
      let v = 0; let k = 0; const a = r(); while (k < 7 && a > PESO.slice(0, k + 1).reduce((x, y) => x + y, 0) / 43) k++;
      v = Math.round((800 + r() * 38000) * 100); const c = Math.floor(r() * 30);
      dia.ganhos++; dia.ganhos_com_valor++; dia.valor_ganho_cents = (dia.valor_ganho_cents ?? 0) + v; cic.push(c);
      pv[k].s.ganhos++; pv[k].s.ganhos_com_valor++; pv[k].s.valor_ganho_cents = (pv[k].s.valor_ganho_cents ?? 0) + v; pv[k].c.push(c);
    }
    dia.perdidos = perdidos;
    for (let i = 0; i < perdidos; i++) { const k = Math.floor(r() * 8); pv[k].s.perdidos++; }
    for (const f of ['criados', 'ganhos', 'perdidos', 'ganhos_com_valor'] as const) tot[f] += dia[f];
    tot.valor_ganho_cents = (tot.valor_ganho_cents ?? 0) + (dia.valor_ganho_cents ?? 0); cicTot.push(...cic);
    por_dia.push({ dia: iso(t), ...fechar(dia, cic) });
  }
  const abertosPv = VEND.map((n, i) => ({ vendedor: String(101 + i), nome: n, abertos: Math.floor(r() * 14) + 2, valor_cents: Math.round((20000 + r() * 400000) * 100) }));
  return {
    estado: 'ok', motivos: [], atualizado_em: new Date().toISOString(), cache_sincronizado_em: new Date().toISOString(), ilustrativo: true,
    periodo: { from, to }, escopo: 'todos', regras_versao: 'v1-ilustrativo', totais: fechar(tot, cicTot), por_dia,
    por_vendedor: VEND.map((n, i) => ({ vendedor: String(101 + i), nome: n, ...fechar(pv[i].s, pv[i].c) })),
    motivos_perda: [{ motivo: 'preco', rotulo: 'Preço', perdidos: Math.round(tot.perdidos * 0.4) }, { motivo: null, rotulo: 'Sem motivo informado', perdidos: tot.perdidos - Math.round(tot.perdidos * 0.4) }],
    em_aberto: { abertos: abertosPv.reduce((a, x) => a + x.abertos, 0), valor_cents: abertosPv.reduce((a, x) => a + (x.valor_cents ?? 0), 0), abertos_sem_valor_financeiro: 0, idade_media_dias: 17, por_vendedor: abertosPv },
  };
}

// ── adaptador: contrato → formatos dos componentes R2 ───────────────────────
const ESTADO: Record<PrecificaAnalytics['estado'], PipeEstadoDado> = { ok: 'atualizado', parcial: 'parcial', desatualizado: 'desatualizado', indisponivel: 'indisponivel' };
const reais = (c: number | null | undefined) => (c == null ? null : c / 100);
const MOTIVO: Record<string, string> = {
  valor_em_carga: 'orçamentos ainda não relidos com o valor novo', cache_atrasado: 'leitura do Precifica com mais de 2 h',
  sem_dados: 'o Precifica ainda não foi agregado', sem_vinculo_vendedor: 'sua conta não tem vendedor vinculado no Precifica',
  sem_acesso: 'o Dash ainda não tem leitura do Precifica Analytics', fora_do_escopo: 'vendedor fora do seu escopo',
};
export function paraResumo(a0: PrecificaAnalytics, ant0: PrecificaAnalytics | null, rotulo: string): PipeSummary {
  // indisponível vem SEM totais/por_dia/por_vendedor: completa com vazios (os valores ficam null → "—", nunca 0)
  const vazio = { totais: somaVazia(), por_dia: [], por_vendedor: [], motivos_perda: [], em_aberto: { abertos: 0, valor_cents: null, abertos_sem_valor_financeiro: 0, idade_media_dias: null, por_vendedor: [] } };
  const a = { ...vazio, ...a0, motivos: a0.motivos ?? [] } as PrecificaAnalytics; const ant = ant0 && ant0.totais ? ant0 : null;
  const base = ESTADO[a.estado] ?? 'indisponivel'; const valorParcial = a.motivos.includes('valor_em_carga');
  const dias = a.por_dia.length; const diasAnt = ant?.por_dia.length ?? dias;
  const serie = (f: (x: Soma) => number | null) => a.por_dia.map((d) => f(d) ?? NaN);
  const k = (chave: string, rot: string, formato: PipeSummaryKpi['formato'], valor: number | null, anterior: number | null, s: number[], extra: Partial<PipeSummaryKpi> = {}): PipeSummaryKpi => ({
    chave, rotulo: rot, formato, cor: null, valor: base === 'indisponivel' ? null : valor, anterior: base === 'indisponivel' ? null : anterior,
    serie: base === 'indisponivel' ? [] : s, estado: base, ...extra,
  });
  const t = a.totais, p = ant?.totais;
  const kpis: PipeSummaryKpi[] = [
    k('ganhos', 'Orçamentos ganhos', 'num', t.ganhos, p?.ganhos ?? null, serie((x) => x.ganhos)),
    k('valor_ganho', 'Valor ganho', 'brl', reais(t.valor_ganho_cents), reais(p?.valor_ganho_cents), serie((x) => reais(x.valor_ganho_cents)), valorParcial && base === 'atualizado' ? { estado: 'parcial' } : {}),
    k('criados', 'Orçamentos criados', 'num', t.criados, p?.criados ?? null, serie((x) => x.criados)),
    k('perdidos', 'Orçamentos perdidos', 'num', t.perdidos, p?.perdidos ?? null, serie((x) => x.perdidos), { inverter: true }),
    k('taxa_conversao', 'Conversão do período', 'pct', t.conversao == null ? null : Math.round(t.conversao * 1000) / 10, p?.conversao == null ? null : Math.round(p.conversao * 1000) / 10, []),
    k('ticket_medio', 'Ticket médio', 'brl', reais(t.ticket_cents), reais(p?.ticket_cents), [], valorParcial && base === 'atualizado' ? { estado: 'parcial' } : {}),
    k('ciclo_medio', 'Ciclo médio', 'dias', t.ciclo_medio_dias, p?.ciclo_medio_dias ?? null, [], { inverter: true }),
  ];
  return {
    periodo: { dias, de: a.periodo.from, ate: a.periodo.to, de_anterior: ant?.periodo.from ?? '', ate_anterior: ant?.periodo.to ?? '', id: 'd30', rotulo,
      comparacao: ant ? `mesma janela imediatamente anterior (${ant.periodo.from.split('-').reverse().join('/')}–${ant.periodo.to.split('-').reverse().join('/')})` : 'sem período anterior',
      dias_atual: dias, dias_anterior: diasAnt },
    kpis,
    estado: { abertos: base === 'indisponivel' ? null : a.em_aberto.abertos, valor_aberto: base === 'indisponivel' ? null : reais(a.em_aberto.valor_cents),
      sem_previsao: 0, fechamento_vencido: 0, atividades_atrasadas: 0, estado: base },
    leitura: { estado: base, atualizado_em: a.atualizado_em ? a.atualizado_em.replace('T', ' ').slice(0, 19) : null, minutos: null,
      motivo: a.ilustrativo ? 'ILUSTRATIVO — dados sintéticos (backend não publicado)' : a.motivos.map((m) => MOTIVO[m] ?? m).join(' · ') || null },
  };
}
export function paraRanking(a: PrecificaAnalytics): Pick<PipeMetrics, 'owners' | 'owners_resumo' | 'owners_periodo'> | undefined {
  if (!a.por_vendedor || a.estado === 'indisponivel') return undefined;
  const com = a.por_vendedor.filter((v) => v.vendedor !== '-');
  const sem = a.por_vendedor.find((v) => v.vendedor === '-');
  return {
    owners: com.map((v, i) => ({ owner_id: Number(v.vendedor) || 900000 + i, name: v.nome ?? `Vendedor ${v.vendedor}`, ganhos: v.ganhos, valor_ganho: reais(v.valor_ganho_cents) ?? 0, valor_aberto: 0 })),
    owners_resumo: { vendedores: com.filter((v) => v.ganhos > 0).length, valor_total: reais(com.reduce((s, v) => s + (v.valor_ganho_cents ?? 0), 0)) ?? 0,
      ganhos_total: com.reduce((s, v) => s + v.ganhos, 0), sem_responsavel: { valor: reais(sem?.valor_ganho_cents) ?? 0, ganhos: sem?.ganhos ?? 0 } },
    owners_periodo: { id: null, de: a.periodo.from, ate: a.periodo.to, rotulo: '' },
  };
}

// ── tela ─────────────────────────────────────────────────────────────────────
const JANELAS = [{ d: 30, rot: 'Últimos 30 dias' }, { d: 90, rot: 'Últimos 90 dias' }];
function janela(dias: number, deslocar = 0) {
  const fim = new Date(); fim.setDate(fim.getDate() - deslocar * dias); const ini = new Date(fim); ini.setDate(ini.getDate() - (dias - 1));
  const f = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: f(ini), to: f(fim) };
}

export function PrecificaAnalyticsTela() {
  const [dias, setDias] = useState(90);
  // P19: o backend real do Dash (P29). Duas leituras: o período e a janela anterior (para a variação).
  const q = useQuery({
    queryKey: ['precifica', 'analytics', dias],
    queryFn: async ({ signal }) => {
      const j = janela(dias), ja = janela(dias, 1);
      const [atual, anterior] = await Promise.all([
        apiGet<PrecificaAnalytics>('/precifica-analytics', { from: j.from, to: j.to }, signal),
        apiGet<PrecificaAnalytics>('/precifica-analytics', { from: ja.from, to: ja.to }, signal).catch(() => null),
      ]);
      return { atual, anterior };
    },
    refetchInterval: 300_000,
  });
  const rot = JANELAS.find((x) => x.d === dias)?.rot ?? '';
  const resumo = useMemo(() => (q.data ? paraResumo(q.data.atual, q.data.anterior, rot) : undefined), [q.data, rot]);
  const ranking = useMemo(() => (q.data ? paraRanking(q.data.atual) : undefined), [q.data]);
  const nada = () => {};
  return (
    <div>
      <PageHeader Icon={Calculator} titulo="Precifica Analytics"
        descricao="Desempenho comercial dos orçamentos do Precifica — mesmo desenho do Pipedrive R2."
        acoes={
          <div className="pp-seg" role="group" aria-label="Período">
            {JANELAS.map((x) => <button key={x.d} type="button" className={`pp-seg-b${dias === x.d ? ' is-active' : ''}`} aria-pressed={dias === x.d} onClick={() => setDias(x.d)}>{x.rot}</button>)}
          </div>} />
      <div className="pp-periodo-nota" {...(q.data?.atual.ilustrativo ? { 'data-precifica-ilustrativo': '' } : {})}>
        {q.data?.atual.ilustrativo && <><span className="hud-status part" style={{ marginLeft: 0 }}>ILUSTRATIVO</span>
          <span><strong>Dados sintéticos</strong> no formato do contrato · nada aqui vem do Precifica</span></>}
        {resumo && <span><strong>{rot}</strong> · variação contra {resumo.periodo.comparacao}</span>}
        {q.data && q.data.atual.estado !== 'ok' && !q.data.atual.ilustrativo && (
          <span className="pp-periodo-alerta"><TriangleAlert size={11} aria-hidden />{q.data.atual.motivos.map((m) => MOTIVO[m] ?? m).join(' · ') || q.data.atual.estado}</span>)}
      </div>
      <IlustrativoCtx.Provider value={!!q.data?.atual.ilustrativo}><UnidadeCtx.Provider value={['orçamento', 'orçamentos']}>
      <HudKpis resumo={resumo} carregando={q.isLoading} falhou={!!q.error} onDrill={nada} semDrill rotuloAgora="Orçamentos em aberto" />
      <BlocoGanhos resumo={resumo} carregando={q.isLoading} falhou={!!q.error} onDrill={nada} semDrill />
      <RankingVendedores periodo="d30" resumo={resumo} onDrill={nada} fonte={{ data: ranking, isLoading: q.isLoading, error: q.error }} />
      </UnidadeCtx.Provider></IlustrativoCtx.Provider>
    </div>
  );
}
