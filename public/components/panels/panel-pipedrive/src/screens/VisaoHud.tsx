// screens/VisaoHud.tsx — Visão Geral do Pipedrive no desenho R2 (homologado em 25/11/2026).
// @version 1.0.0  @created 2026-11-25  (P13 · CIMA)
//
// Fidelidade ao mockup R2 (/srv/dshow-docs/mockups/pipedrive-r2-20261125): 8 KPIs em HUD (4 principais + 4 complementares),
// Ganhos ao longo do tempo, Desfecho dos fechados, Ranking de vendedores e o painel lateral de detalhamento.
// Regras (briefing R2):
//   • UMA base: KPI, série, desfecho e ranking leem o MESMO período global (/summary e /metrics?periodo=), e o painel
//     lateral pede ao /deals o MESMO recorte (won_from/won_to, lost_from/lost_to) — a contagem e a soma do painel vêm do
//     servidor e batem com o número clicado.
//   • 5 estados com motivo em texto: Carregando · Atualizado · Desatualizado · Parcial · Indisponível. Desconhecido = "—".
//   • ECharts é o motor dos gráficos; números animados por CSS (sem NumberFlow: não entra no bundle neste degrau);
//     prefers-reduced-motion desliga o que não é essencial; nada em loop.
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy, CircleDollarSign, Layers, CircleX, Percent, Ticket, Timer, Wallet, LineChart, PieChart, Medal, ArrowUpRight,
} from 'lucide-react';
import { apiGet, chaves } from '../lib/api';
import { fmtBRL, fmtNum } from '../lib/format';
import { EChart } from '../viz/EChart';
import { usePaleta, useTemaPipe } from '../viz/tema';
import type { Opcao } from '../viz/opts';
import { DealDrawer } from './DealDrawer';
import type {
  PipeSummary, PipeSummaryKpi, PipeMetrics, PipeDealsPage, PipePeriodoId, PipeEstadoDado, PipeOwnerRow,
} from '../shell/types';
import { DSKpiCardV2 } from '@shared/des/DSKpiCardV2';
import type { EstadoKpi, FormatoKpi } from '@shared/des/DSKpiCard';
import '../styles/visao-hud.css';

// ── utilitários ──────────────────────────────────────────────────────────────

export type EstadoTela = PipeEstadoDado | 'carregando';
export const ROTULO_ESTADO: Record<EstadoTela, string> = {
  carregando: 'Carregando', atualizado: 'Atualizado', desatualizado: 'Desatualizado', parcial: 'Parcial', indisponivel: 'Indisponível',
};
export const CLASSE_ESTADO: Record<EstadoTela, string> = {
  carregando: 'load', atualizado: 'ok', desatualizado: 'old', parcial: 'part', indisponivel: 'off',
};

export const ddmm = (iso: string) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };
export const ddmmaaaa = (iso: string) => { const [a, m, d] = iso.split('-'); return `${d}/${m}/${a}`; };
export const faixa = (de?: string, ate?: string) => (de && ate ? `${ddmm(de)}–${ddmmaaaa(ate)}` : '');
export const hhmm = (s?: string | null) => (s ? s.replace('T', ' ').slice(11, 16) : '');
const pct = (v: number, casas = 1) => `${v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
export function semReducao(): boolean {
  try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; }
}
/** Dias Y-m-d de [de, ate] (aritmética em UTC: 'AAAA-MM-DD' é dia civil). */
function dias(de: string, ate: string): string[] {
  const out: string[] = []; const t = new Date(`${de}T00:00:00Z`); const f = new Date(`${ate}T00:00:00Z`);
  while (t <= f && out.length < 400) { out.push(t.toISOString().slice(0, 10)); t.setUTCDate(t.getUTCDate() + 1); }
  return out;
}

/** O que o painel lateral precisa: título, contexto e o filtro do /deals (o mesmo que vai para a lista de Negócios). */
export interface Drill {
  titulo: string;
  contexto: string;
  filtros: Record<string, string>;
  rotuloValor: string;
  /** O número da origem (para conferir na tela que o painel abriu o mesmo recorte). */
  esperado?: { n: number | null; valor: number | null };
}

/** Selo de estado: sempre com o texto, nunca só a cor. */
/** Dados ILUSTRATIVOS (Precifica sem backend, P20): o selo diz "Ilustrativo" em vez de afirmar frescor que não existe. */
export const IlustrativoCtx = createContext(false);
/** Palavra da contagem (Pipedrive: negócio/negócios; Precifica P20: orçamento/orçamentos). */
export const UnidadeCtx = createContext<[string, string]>(['negócio', 'negócios']);
const contar = (n: number | null | undefined, u: [string, string]) => `${fmtNum(n)} ${n === 1 ? u[0] : u[1]}`;
export function Selo({ estado, titulo }: { estado: EstadoTela; titulo?: string }) {
  const ilustr = useContext(IlustrativoCtx);
  if (ilustr && estado !== 'carregando') return <span className="hud-status part" title="Dados sintéticos: não vêm da fonte real">Ilustrativo</span>;
  return <span className={`hud-status ${CLASSE_ESTADO[estado]}`} title={titulo}>{ROTULO_ESTADO[estado]}</span>;
}

/** Número com troca suave (CSS, 320 ms) quando o VALOR muda — "—" não anima como zero. */
export function Num({ texto }: { texto: string }) {
  return <span key={texto} className={texto === '—' ? 'hud-num is-vazio' : 'hud-num'}>{texto}</span>;
}

function Sparkline({ serie, cor }: { serie: number[]; cor: string }) {
  const pts = serie.filter((v) => Number.isFinite(v));
  if (pts.length < 2) return null;
  const max = Math.max(...pts), min = Math.min(...pts), amp = max - min || 1;
  const d = pts.map((v, i) => `${(i / (pts.length - 1)) * 100},${34 - ((v - min) / amp) * 30}`).join(' ');
  return (
    <svg className="hud-spark" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden>
      <polyline points={d} fill="none" stroke={cor} strokeWidth={1.6} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

// ── P2 do mockup (P14): todo texto cortado com reticências ganha o texto inteiro como tooltip ──
const CORTAVEIS = '.hud-label, .hud-delta, .hud-delta small, .hud-panelsub, .hud-rankname, .hud-drawerrowtitle, .hud-drawerrowowner, .hud-api-kpi small, .hud-tabela-nome, .hud-legendrow em';
/** Observa a raiz da Visão Geral: em cada mudança de conteúdo/tamanho, quem não cabe recebe `title` com o texto completo
 *  (e perde o title automático quando volta a caber). Títulos escritos à mão (data-titulo-fixo) não são tocados. */
export function useTooltipNosCortes(raiz: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = raiz.current; if (!el) return;
    let quadro = 0;
    const aplicar = () => { cancelAnimationFrame(quadro); quadro = requestAnimationFrame(() => {
      el.querySelectorAll<HTMLElement>(CORTAVEIS).forEach((x) => {
        if (x.dataset.tituloFixo !== undefined) return;
        const cortado = x.scrollWidth > x.clientWidth + 1;
        const texto = (x.textContent || '').replace(/\s+/g, ' ').trim();
        if (cortado && texto) { if (x.title !== texto) { x.title = texto; x.dataset.tituloAuto = '1'; } }
        else if (x.dataset.tituloAuto) { x.removeAttribute('title'); delete x.dataset.tituloAuto; }
      }); }); };
    const mo = new MutationObserver(aplicar); mo.observe(el, { childList: true, subtree: true, characterData: true });
    const ro = new ResizeObserver(aplicar); ro.observe(el);
    aplicar();
    return () => { mo.disconnect(); ro.disconnect(); cancelAnimationFrame(quadro); };
  }, [raiz]);
}

// ── KPIs em HUD ──────────────────────────────────────────────────────────────

type Polaridade = 'sobe_bom' | 'sobe_ruim' | 'neutra';
interface DefKpi {
  chave: string; rotulo: string; Icon: typeof Trophy; major: boolean; polaridade: Polaridade;
  drill?: (de: string, ate: string, ctx: string) => Drill;
}
const ganhosDrill = (titulo: string) => (de: string, ate: string, ctx: string): Drill => ({
  titulo, contexto: ctx, rotuloValor: 'Valor ganho', filtros: { status: 'won', won_from: de, won_to: ate },
});
const DEFS: DefKpi[] = [
  { chave: 'ganhos', rotulo: 'Negócios ganhos', Icon: Trophy, major: true, polaridade: 'sobe_bom', drill: ganhosDrill('Negócios ganhos') },
  { chave: 'valor_ganho', rotulo: 'Valor ganho', Icon: CircleDollarSign, major: true, polaridade: 'sobe_bom', drill: ganhosDrill('Valor ganho') },
  { chave: 'criados', rotulo: 'Negócios criados', Icon: Layers, major: true, polaridade: 'neutra',
    drill: (de, ate, ctx) => ({ titulo: 'Negócios criados', contexto: ctx, rotuloValor: 'Valor dos criados', filtros: { created_from: de, created_to: ate } }) },
  { chave: 'perdidos', rotulo: 'Negócios perdidos', Icon: CircleX, major: true, polaridade: 'sobe_ruim',
    drill: (de, ate, ctx) => ({ titulo: 'Negócios perdidos', contexto: ctx, rotuloValor: 'Valor perdido', filtros: { status: 'lost', lost_from: de, lost_to: ate } }) },
  { chave: 'taxa_conversao', rotulo: 'Conversão do período', Icon: Percent, major: false, polaridade: 'sobe_bom', drill: ganhosDrill('Ganhos da conversão') },
  { chave: 'ticket_medio', rotulo: 'Ticket médio', Icon: Ticket, major: false, polaridade: 'sobe_bom', drill: ganhosDrill('Ganhos do ticket médio') },
  { chave: 'ciclo_medio', rotulo: 'Ciclo médio', Icon: Timer, major: false, polaridade: 'sobe_ruim', drill: ganhosDrill('Ganhos do ciclo médio') },
];

function fmtKpi(k: PipeSummaryKpi | undefined): string {
  if (!k || k.valor == null) return '—';
  if (k.formato === 'brl') return fmtBRL(k.valor);
  if (k.formato === 'pct') return `${Math.round(k.valor)}%`;
  if (k.formato === 'dias') return `${fmtNum(k.valor)} ${k.valor === 1 ? 'dia' : 'dias'}`;
  return fmtNum(k.valor);
}

/** Variação contra o período anterior: % (p.p. na conversão), com a polaridade de cada métrica. */
function variacao(k: PipeSummaryKpi, pol: Polaridade): { texto: string; classe: string; adj: string } | null {
  if (k.valor == null || k.anterior == null) return null;
  const pp = k.formato === 'pct';
  let delta: number;
  if (pp) delta = k.valor - k.anterior;
  else if (k.anterior === 0) return null;            // sem base: não inventa %
  else delta = ((k.valor - k.anterior) / Math.abs(k.anterior)) * 100;
  const sinal = delta > 0 ? '+' : delta < 0 ? '−' : '±';
  const abs = Math.abs(delta);
  const texto = pp ? `${sinal}${abs.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p.` : `${sinal}${pct(abs)}`;
  if (pol === 'neutra' || delta === 0) return { texto, classe: 'neutral', adj: '' };
  const bom = (delta > 0) === (pol === 'sobe_bom');
  return { texto, classe: bom ? 'good' : 'bad', adj: pol === 'sobe_ruim' ? (bom ? 'queda favorável' : 'aumento desfavorável') : '' };
}

/** Séries derivadas SÓ do que é real: conversão e ticket por dia saem das séries diárias de ganhos/perdidos/valor. */
function serieDerivada(chave: string, s: PipeSummary): number[] {
  const por = (c: string) => s.kpis.find((x) => x.chave === c)?.serie ?? [];
  const g = por('ganhos'), p = por('perdidos'), v = por('valor_ganho');
  if (chave === 'taxa_conversao') return g.map((x, i) => (x + (p[i] ?? 0) > 0 ? x / (x + (p[i] ?? 0)) : NaN));
  if (chave === 'ticket_medio') return g.map((x, i) => (x > 0 ? (v[i] ?? 0) / x : NaN));
  return por(chave);
}

export function HudKpis({ resumo, carregando, falhou, onDrill, onDetalhes, semDrill = false, rotuloAgora = 'Em aberto agora' }: {
  resumo?: PipeSummary; carregando: boolean; falhou: boolean;
  onDrill: (d: Drill) => void; onDetalhes?: () => void;
  /** Precifica (P20): ainda sem lista de registros no contrato → sem "Ver negócios". */
  semDrill?: boolean; rotuloAgora?: string;
}) {
  const pal = usePaleta(); const unidade = useContext(UnidadeCtx);
  const per = resumo?.periodo;
  const ctx = per ? `Mesmo filtro da origem · Período: ${faixa(per.de, per.ate)} · Pipedrive` : '';
  const leitura = resumo?.leitura;

  const cartoes: ReactNode[] = DEFS.map((def) => {
    const k = resumo?.kpis.find((x) => x.chave === def.chave);
    const estado: EstadoTela = carregando ? 'carregando' : falhou || !k ? 'indisponivel' : (k.estado ?? 'atualizado');
    const v = !carregando && !falhou && k ? variacao(k, def.polaridade) : null;
    const serie = resumo && k && estado !== 'indisponivel' ? serieDerivada(def.chave, resumo) : [];
    const cor = def.chave === 'perdidos' ? pal.danger : def.chave === 'criados' ? pal.primary : pal.ok;
    const clicavel = !semDrill && estado !== 'carregando' && estado !== 'indisponivel' && !!def.drill && !!per && k?.valor != null;
    const abrir = () => { if (clicavel && def.drill && per) onDrill({ ...def.drill(per.de, per.ate, ctx), esperado: { n: def.chave === 'ganhos' || def.chave === 'perdidos' || def.chave === 'criados' ? k?.valor ?? null : null, valor: def.chave === 'valor_ganho' ? k?.valor ?? null : null } }); };
    // motivo em texto de cada estado (nunca só a cor)
    let motivo: ReactNode = null;
    if (estado === 'carregando') motivo = <small>lendo a base sincronizada…</small>;
    else if (estado === 'indisponivel') motivo = <small title={`Consulta indisponível: ${falhou ? 'a consulta não retornou' : (leitura?.motivo ?? 'sem leitura de negócios')}`}><span className="hud-link-off">Consulta indisponível</span></small>;
    else if (estado === 'desatualizado') motivo = <small>{v ? <b className={v.classe}>{v.texto} </b> : null}última leitura {leitura?.atualizado_em ? hhmm(leitura.atualizado_em) : '—'}</small>;
    else if (estado === 'parcial' && k?.cobertura) motivo = <small>{v ? <b className={v.classe}>{v.texto} </b> : null}{v?.adj ? `${v.adj} · ` : ''}{fmtNum(k.cobertura.sem_data)} sem data</small>;
    else if (v) motivo = <small title={`${v.texto} ${v.adj ? `${v.adj} ` : ''}vs. ${per ? `${per.dias_anterior} dias anteriores` : 'período anterior'}`}><b className={v.classe}>{v.texto}</b> {v.adj ? `${v.classe === 'good' ? 'favorável' : 'desfavorável'} · ` : ''}vs. {per ? `${per.dias_anterior} d anteriores` : 'período anterior'}</small>;
    else motivo = <small>sem base de comparação</small>;

    return (
      <div key={def.chave} className={`hud-stat ${def.major ? 'major' : 'minor'}${clicavel ? ' click' : ''} est-${CLASSE_ESTADO[estado]}`}
        role={clicavel ? 'button' : undefined} tabIndex={clicavel ? 0 : undefined}
        onClick={abrir} onKeyDown={(e) => { if (clicavel && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrir(); } }}
        title={k?.dica}>
        <div className="hud-statline">
          <span className="hud-icon"><def.Icon size={15} aria-hidden /></span>
          <span className="hud-label">{k?.rotulo ?? def.rotulo}</span>
          <Selo estado={estado} titulo={estado === 'desatualizado' ? (leitura?.motivo ?? undefined) : undefined} />
        </div>
        <div className="hud-value">{estado === 'carregando' ? <span className="hud-skel" /> : <Num texto={estado === 'indisponivel' ? '—' : fmtKpi(k)} />}</div>
        <div className="hud-delta">{motivo}</div>
        {estado !== 'carregando' && <Sparkline serie={serie} cor={estado === 'desatualizado' || estado === 'parcial' ? pal.warn : cor} />}
        {clicavel && <span className="hud-action">Ver negócios →</span>}
      </div>
    );
  });

  // 8º: foto do agora (sem variação: a base não guarda snapshot)
  const e = resumo?.estado;
  const estAgora: EstadoTela = carregando ? 'carregando' : falhou || !e || e.valor_aberto == null ? 'indisponivel' : (e.estado ?? 'atualizado');
  const clicAgora = !semDrill && estAgora !== 'carregando' && estAgora !== 'indisponivel';
  const abrirAgora = () => {
    if (clicAgora) onDrill({ titulo: 'Em aberto agora', contexto: 'Situação atual da carteira · sem período · Pipedrive', rotuloValor: 'Valor em aberto', filtros: { status: 'open' }, esperado: { n: e?.abertos ?? null, valor: e?.valor_aberto ?? null } });
    else if (estAgora === 'indisponivel') onDetalhes?.();
  };
  cartoes.push(
    <div key="agora" className={`hud-stat minor${semDrill ? '' : ' click'} est-${CLASSE_ESTADO[estAgora]}`} role={semDrill ? undefined : 'button'} tabIndex={semDrill ? undefined : 0}
      onClick={abrirAgora} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrirAgora(); } }}
      title="Situação atual da carteira — não tem período anterior para comparar.">
      <div className="hud-statline">
        <span className="hud-icon"><Wallet size={15} aria-hidden /></span>
        <span className="hud-label">{rotuloAgora}</span>
        <Selo estado={estAgora} />
      </div>
      <div className="hud-value">{estAgora === 'carregando' ? <span className="hud-skel" /> : <Num texto={estAgora === 'indisponivel' ? '—' : fmtBRL(e?.valor_aberto)} />}</div>
      <div className="hud-delta">
        {estAgora === 'carregando' ? <small>lendo a base sincronizada…</small>
          : estAgora === 'indisponivel' ? <small title="Consulta indisponível: a foto da carteira (funil aberto) não retornou"><span className="hud-link-off">Consulta indisponível</span></small>
          : <small>{contar(e?.abertos, unidade)} · {estAgora === 'desatualizado' && leitura?.atualizado_em ? `última leitura ${hhmm(leitura.atualizado_em)}` : 'foto do agora'}</small>}
      </div>
      {estAgora !== 'carregando' && !semDrill && <span className="hud-action">{estAgora === 'indisponivel' ? 'Ver detalhes →' : 'Ver negócios →'}</span>}
    </div>,
  );

  return <div className="hud-grid" aria-busy={carregando}>{cartoes}</div>;
}

// ── Faixa de KPI compacta (27/11, VERDE · ordem do arquiteto) ──────────────────
// Os MESMOS 8 indicadores, os mesmos dados, estados, variação e clique do HudKpis, no cartão compacto do pacote DES (DSKpiCardV2 compacto,
// o das Vencidas): faixa de UMA linha travada em 56 px (contrato espacial de 26/11). Sem micrográfico (o compacto não tem; a série segue nos
// gráficos abaixo). Tela estreita: rolagem horizontal com encaixe (a região recebe foco pelo teclado); nada se esconde atrás de "ver mais".
const ESTADO_KPI: Record<EstadoTela, EstadoKpi> = { carregando: 'carregando', atualizado: 'ok', desatualizado: 'desatualizado', parcial: 'parcial', indisponivel: 'erro' };
const FORMATO_KPI: Record<string, FormatoKpi> = { brl: 'moeda-inteira', pct: 'percentual', dias: 'inteiro' };
/** rótulo curto no cartão compacto (cabe a 1440 sem cortar); o nome completo vai na dica e no texto do leitor de tela */
const ROTULO_CURTO: Record<string, string> = { ganhos: 'Ganhos', criados: 'Criados', perdidos: 'Perdidos', taxa_conversao: 'Conversão', ciclo_medio: 'Ciclo médio (dias)' };

export function HudKpisCompactos({ resumo, carregando, falhou, onDrill, onDetalhes }: {
  resumo?: PipeSummary; carregando: boolean; falhou: boolean; onDrill: (d: Drill) => void; onDetalhes?: () => void;
}) {
  const unidade = useContext(UnidadeCtx);
  const per = resumo?.periodo; const leitura = resumo?.leitura;
  const ctx = per ? `Mesmo filtro da origem · Período: ${faixa(per.de, per.ate)} · Pipedrive` : '';
  const base = per ? `vs. ${per.dias_anterior} dias anteriores` : 'vs. período anterior';
  const baseCurta = per ? `${per.dias_anterior} d` : 'ant.';
  // QI 27/11 (recorte): a 1440 o cartão compacto tem ~96 px úteis → a linha de contexto leva SÓ o essencial; fora de 'ok' o estado é o selo
  // (Desatualizado / Dados parciais / Indisponível) e o motivo por extenso vai na dica (title + texto do leitor de tela).
  const motivoDe = (estado: EstadoTela, extra?: string | null): string | undefined =>
    estado === 'indisponivel' ? 'Consulta indisponível' : estado === 'desatualizado' ? `Desatualizado: última leitura ${leitura?.atualizado_em ? hhmm(leitura.atualizado_em) : '—'}` : extra ?? undefined;
  const seloDe = (estado: EstadoTela) => (estado === 'indisponivel' ? { texto: 'Indisponível', tom: 'erro' as const } : undefined);
  const envolver = (chave: string, clicavel: boolean, abrir: () => void, card: ReactNode) => (
    <div key={chave} className={`hud-kc${clicavel ? ' click' : ''}`} data-hud-kc={chave} role={clicavel ? 'button' : undefined} tabIndex={clicavel ? 0 : undefined}
      onClick={clicavel ? abrir : undefined} onKeyDown={(e) => { if (clicavel && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrir(); } }}
      >{card}</div>);   // a dica vai no cartão (title + texto do leitor de tela: DSKpiCardV2 `dica`)

  const cartoes: ReactNode[] = DEFS.map((def) => {
    const k = resumo?.kpis.find((x) => x.chave === def.chave);
    const estado: EstadoTela = carregando ? 'carregando' : falhou || !k ? 'indisponivel' : (k.estado ?? 'atualizado');
    const v = !carregando && !falhou && k ? variacao(k, def.polaridade) : null;
    const clicavel = estado !== 'carregando' && estado !== 'indisponivel' && !!def.drill && !!per && k?.valor != null;
    const abrir = () => { if (clicavel && def.drill && per) onDrill({ ...def.drill(per.de, per.ate, ctx), esperado: { n: def.chave === 'ganhos' || def.chave === 'perdidos' || def.chave === 'criados' ? k?.valor ?? null : null, valor: def.chave === 'valor_ganho' ? k?.valor ?? null : null } }); };
    const dias = k?.formato === 'dias';
    const sub = v ? <><b className={v.classe}>{v.texto}</b> · {baseCurta}</> : <>sem comparação</>;
    const extra = estado === 'parcial' && k?.cobertura ? `${fmtNum(k.cobertura.sem_data)} sem data` : null;
    const nome = k?.rotulo ?? def.rotulo;
    const dica = [nome, motivoDe(estado, extra), k?.dica, v ? `${v.texto} ${v.adj ? `(${v.adj}) ` : ''}${base}` : null, clicavel ? 'Clique para ver os negócios' : null].filter(Boolean).join(' · ') || undefined;
    return envolver(def.chave, clicavel, abrir,
      <DSKpiCardV2 compacto rotulo={ROTULO_CURTO[def.chave] ?? `${nome}${dias ? ' (dias)' : ''}`} valor={estado === 'indisponivel' ? null : k?.valor ?? null}
        formato={FORMATO_KPI[k?.formato ?? ''] ?? 'inteiro'} estado={ESTADO_KPI[estado]} sub={sub} selo={seloDe(estado)} dica={dica} fonte="Pipedrive" dominio="comercial" />);
  });

  const e = resumo?.estado;
  const estAgora: EstadoTela = carregando ? 'carregando' : falhou || !e || e.valor_aberto == null ? 'indisponivel' : (e.estado ?? 'atualizado');
  const clicAgora = estAgora !== 'carregando';
  const abrirAgora = () => {
    if (estAgora === 'indisponivel') { onDetalhes?.(); return; }
    onDrill({ titulo: 'Em aberto agora', contexto: 'Situação atual da carteira · sem período · Pipedrive', rotuloValor: 'Valor em aberto', filtros: { status: 'open' }, esperado: { n: e?.abertos ?? null, valor: e?.valor_aberto ?? null } });
  };
  const dicaAgora = [`Em aberto agora: ${contar(e?.abertos, unidade)}`, motivoDe(estAgora), estAgora === 'indisponivel' ? 'Clique para ver os detalhes da leitura' : 'Situação atual da carteira (sem período anterior) · Clique para ver os negócios'].filter(Boolean).join(' · ');
  cartoes.push(envolver('agora', clicAgora, abrirAgora,
    <DSKpiCardV2 compacto rotulo="Em aberto agora" valor={estAgora === 'indisponivel' ? null : e?.valor_aberto ?? null} formato="moeda-inteira" estado={ESTADO_KPI[estAgora]}
      sub={<>{contar(e?.abertos, unidade)}</>} selo={seloDe(estAgora)} dica={dicaAgora} fonte="Pipedrive" dominio="comercial" />));

  return (
    <div className="des-escopo hud-kfaixa" data-hud-kfaixa role="region" aria-label="Indicadores do período (em tela estreita, role para os lados)" tabIndex={0} aria-busy={carregando}>
      {cartoes}
    </div>
  );
}

// ── Ganhos ao longo do tempo + Desfecho ──────────────────────────────────────

type Gran = 'dia' | 'semana' | 'mes';
interface Ponto { rotulo: string; de: string; ate: string; valor: number; n: number }

function agrupar(diasJ: string[], valor: number[], n: number[], gran: Gran): Ponto[] {
  if (gran === 'dia') return diasJ.map((d, i) => ({ rotulo: ddmm(d), de: d, ate: d, valor: valor[i] ?? 0, n: n[i] ?? 0 }));
  const out: Ponto[] = []; let cur: Ponto | null = null;
  for (let i = 0; i < diasJ.length; i++) {
    const d = diasJ[i];
    const dt = new Date(`${d}T00:00:00Z`);
    const chave = gran === 'mes' ? d.slice(0, 7) : (() => { const x = new Date(dt); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); })();
    if (!cur || (gran === 'mes' ? cur.de.slice(0, 7) !== chave : (() => { const x = new Date(`${cur!.de}T00:00:00Z`); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); })() !== chave)) {
      cur = { rotulo: gran === 'mes' ? `${d.slice(5, 7)}/${d.slice(0, 4)}` : ddmm(d), de: d, ate: d, valor: 0, n: 0 }; out.push(cur);
    }
    cur.ate = d; cur.valor += valor[i] ?? 0; cur.n += n[i] ?? 0;
  }
  return out;
}

function optGanhos(pal: ReturnType<typeof usePaleta>, escuro: boolean, pts: Ponto[], gran: Gran, animar: boolean, unidade: [string, string] = ['negócio', 'negócios']): Opcao {
  const mint = escuro ? '#12e6a8' : '#05c994';
  return {
    animation: animar, animationDuration: 550, animationDurationUpdate: 360, animationEasing: 'cubicOut',
    grid: { left: 64, right: 18, top: 14, bottom: 52 },
    tooltip: {
      trigger: 'axis', transitionDuration: 0.1, confine: true,
      backgroundColor: escuro ? '#07121f' : '#12243a', borderWidth: 0, padding: [10, 13],
      textStyle: { color: '#f5faff', fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { color: pal.textDim, type: 'dashed' } },
      formatter: (ps: unknown) => {
        const p = (ps as { dataIndex: number }[])[0]; const x = pts[p?.dataIndex ?? 0]; if (!x) return '';
        const quando = gran === 'dia' ? ddmmaaaa(x.de) : `${ddmm(x.de)}–${ddmmaaaa(x.ate)}`;
        return `<div style="opacity:.8">${quando}</div><div style="font-size:14px;font-weight:500;margin-top:6px">${fmtBRL(x.valor)} · ${contar(x.n, unidade)}</div>`
          + `<div style="color:${mint};margin-top:4px">Clique no ponto para ver negócios →</div>`;
      },
    },
    xAxis: { type: 'category', boundaryGap: false, data: pts.map((x) => x.rotulo),
      axisLine: { lineStyle: { color: pal.border } }, axisTick: { show: false }, axisLabel: { color: pal.textDim, fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: pal.border, opacity: 0.6 } }, axisLabel: { color: pal.textDim, fontSize: 11,
      formatter: (v: number) => (v >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil` : `R$ ${v}`) } },
    dataZoom: [
      { type: 'inside', throttle: 50 },
      { type: 'slider', height: 14, bottom: 8, borderColor: 'transparent', backgroundColor: escuro ? '#102d43' : '#eaf0f8',
        fillerColor: escuro ? 'rgba(18,230,168,.14)' : 'rgba(5,201,148,.12)', handleStyle: { color: mint, borderColor: mint },
        moveHandleSize: 0, showDetail: false, dataBackground: { lineStyle: { opacity: 0 }, areaStyle: { opacity: 0 } } },
    ],
    series: [{
      type: 'line', name: 'Valor ganho', data: pts.map((x) => x.valor), smooth: 0.3, smoothMonotone: 'x', symbol: 'circle', symbolSize: 6, showSymbol: false,
      lineStyle: { color: mint, width: 2.4 }, itemStyle: { color: mint },
      emphasis: { focus: 'none', scale: 1.6 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: escuro ? 'rgba(18,230,168,.30)' : 'rgba(5,201,148,.22)' }, { offset: 1, color: 'rgba(5,201,148,0)' }] } },
    }],
  } as unknown as Opcao;
}

function optDesfecho(escuro: boolean, ganhos: number, perdidos: number, animar: boolean): Opcao {
  const mint = escuro ? '#12e6a8' : '#05c994'; const red = escuro ? '#fc6173' : '#fa606f';
  return {
    animation: animar, animationDuration: 480, animationEasing: 'cubicOut',
    tooltip: { show: false },
    series: [{
      type: 'pie', radius: ['64%', '84%'], center: ['50%', '50%'], startAngle: 90, clockwise: true,
      avoidLabelOverlap: false, label: { show: false }, labelLine: { show: false },
      itemStyle: { borderColor: escuro ? '#0b2133' : '#ffffff', borderWidth: 2 },
      emphasis: { scale: true, scaleSize: 6 },
      data: [{ name: 'Ganhos', value: ganhos, itemStyle: { color: mint } }, { name: 'Perdidos', value: perdidos, itemStyle: { color: red } }],
    }],
  } as unknown as Opcao;
}

export function BlocoGanhos({ resumo, carregando, falhou, onDrill, semDrill = false }: {
  resumo?: PipeSummary; carregando: boolean; falhou: boolean; onDrill: (d: Drill) => void; semDrill?: boolean;
}) {
  const pal = usePaleta(); const escuro = useTemaPipe() === 'dark'; const unidade = useContext(UnidadeCtx);
  const [gran, setGran] = useState<Gran>('dia');
  const animar = useMemo(semReducao, []);
  const per = resumo?.periodo;
  const kpi = (c: string) => resumo?.kpis.find((x) => x.chave === c);
  const diasJ = useMemo(() => (per ? dias(per.de, per.ate) : []), [per?.de, per?.ate]);
  const pts = useMemo(() => agrupar(diasJ, kpi('valor_ganho')?.serie ?? [], kpi('ganhos')?.serie ?? [], gran),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [diasJ, resumo, gran]);
  const estado: EstadoTela = carregando ? 'carregando' : falhou || !resumo || kpi('valor_ganho')?.valor == null ? 'indisponivel' : (kpi('valor_ganho')?.estado ?? 'atualizado');
  const ctx = per ? `Mesmo filtro da origem · Período: ${faixa(per.de, per.ate)} · Pipedrive` : '';
  const ptsRef = useRef(pts); ptsRef.current = pts;
  const granRef = useRef(gran); granRef.current = gran;
  const total = kpi('valor_ganho')?.valor;

  const g = kpi('ganhos')?.valor, p = kpi('perdidos')?.valor;
  const estDesf: EstadoTela = carregando ? 'carregando' : falhou || g == null || p == null ? 'indisponivel' : (kpi('ganhos')?.estado ?? 'atualizado');
  const fechados = g != null && p != null ? g + p : null;
  const abrirDesf = (qual: 'won' | 'lost') => {
    if (semDrill || !per || estDesf === 'indisponivel' || estDesf === 'carregando') return;
    onDrill(qual === 'won'
      ? { titulo: 'Negócios ganhos', contexto: ctx, rotuloValor: 'Valor ganho', filtros: { status: 'won', won_from: per.de, won_to: per.ate }, esperado: { n: g ?? null, valor: total ?? null } }
      : { titulo: 'Negócios perdidos', contexto: ctx, rotuloValor: 'Valor perdido', filtros: { status: 'lost', lost_from: per.de, lost_to: per.ate }, esperado: { n: p ?? null, valor: null } });
  };

  return (
    <div className="hud-charts">
      <section className="hud-card hud-graph" aria-label="Ganhos ao longo do tempo">
        <div className="hud-panelhead">
          <div>
            <div className="hud-panelname"><LineChart size={16} aria-hidden /> Ganhos ao longo do tempo <Selo estado={estado} /></div>
            <div className="hud-panelsub">
              Valor ganho por {gran === 'dia' ? 'dia' : gran === 'semana' ? 'semana' : 'mês'} · {faixa(per?.de, per?.ate)} · Total do período: <b>{estado === 'indisponivel' || estado === 'carregando' ? '—' : fmtBRL(total)}</b> · Comparação: {per ? `${per.dias_anterior} dias anteriores` : '—'}
              {estado === 'indisponivel' && <> · <span className="hud-link-off">consulta indisponível</span></>}
            </div>
          </div>
          <div className="hud-panelbtns" role="group" aria-label="Granularidade">
            {(['dia', 'semana', 'mes'] as Gran[]).map((x) => (
              <button key={x} type="button" className={`hud-smallbtn${gran === x ? ' active' : ''}`} aria-pressed={gran === x} onClick={() => setGran(x)}>
                {x === 'dia' ? 'Dia' : x === 'semana' ? 'Semana' : 'Mês'}
              </button>
            ))}
            {!semDrill && <button type="button" className="hud-smallbtn" title="Abrir os negócios ganhos do período" aria-label="Abrir os negócios ganhos do período"
              onClick={() => abrirDesf('won')} disabled={estado === 'indisponivel' || estado === 'carregando'}><ArrowUpRight size={13} /></button>}
          </div>
        </div>
        <div className="hud-chartwrap">
          {estado === 'carregando' ? <div className="hud-skelbox" /> : estado === 'indisponivel' ? (
            <div className="hud-vazio">— · Consulta indisponível: a série do período não retornou.</div>
          ) : (
            <EChart opcao={optGanhos(pal, escuro, pts, gran, animar, unidade)} altura="100%" aria={`Valor ganho por ${gran}`}
              eventos={semDrill ? undefined : { 'zr:click': (params, inst) => {
                // clique em qualquer lugar da área de plotagem → o ponto (dia/semana/mês) daquela coluna do eixo
                const ev = params as { offsetX: number; offsetY: number };
                if (!inst.containPixel({ gridIndex: 0 }, [ev.offsetX, ev.offsetY])) return;
                const conv = inst.convertFromPixel({ gridIndex: 0 }, [ev.offsetX, ev.offsetY]) as number[];
                const i = Math.round(conv?.[0] ?? -1); const x = i >= 0 ? ptsRef.current[i] : undefined; if (!x) return;
                const quando = x.de === x.ate ? ddmmaaaa(x.de) : `${ddmm(x.de)}–${ddmmaaaa(x.ate)}`;
                onDrill({ titulo: `Ganhos de ${quando}`, contexto: `Mesmo filtro da origem · ${granRef.current === 'dia' ? 'Dia' : granRef.current === 'semana' ? 'Semana' : 'Mês'}: ${quando} · Pipedrive`,
                  rotuloValor: 'Valor ganho', filtros: { status: 'won', won_from: x.de, won_to: x.ate }, esperado: { n: x.n, valor: x.valor } });
              } }} />
          )}
        </div>
        <div className="hud-chartfoot"><span>⠿ Zoom horizontal <strong>{estado === 'indisponivel' || estado === 'carregando' ? '—' : `${diasJ.length} dias`}</strong></span><span>{semDrill ? '' : '◉ Clique em um ponto para abrir a lista filtrada'}</span></div>
      </section>

      <section className="hud-card hud-donutcard" aria-label="Desfecho dos fechados">
        <div className="hud-panelhead">
          <div>
            <div className="hud-panelname"><PieChart size={16} aria-hidden /> Desfecho dos fechados <Selo estado={estDesf} /></div>
            <div className="hud-panelsub">Negócios finalizados · {faixa(per?.de, per?.ate)}</div>
          </div>
          {!semDrill && <div className="hud-panelbtns">
            <button type="button" className="hud-smallbtn" title="Abrir os ganhos do período" aria-label="Abrir os ganhos do período"
              onClick={() => abrirDesf('won')} disabled={estDesf === 'indisponivel' || estDesf === 'carregando'}><ArrowUpRight size={13} /></button>
          </div>}
        </div>
        <div className="hud-donutinner">
          <div className="hud-donut">
            {estDesf === 'carregando' ? <div className="hud-skelbox redondo" /> : fechados != null && fechados > 0 ? (
              <>
                <EChart opcao={optDesfecho(escuro, g as number, p as number, animar)} altura="100%" aria="Proporção de ganhos e perdidos"
                  eventos={{ click: (params) => abrirDesf((params as { name?: string }).name === 'Perdidos' ? 'lost' : 'won') }} />
                <div className="hud-donutnum"><Num texto={fmtNum(fechados)} /><small>fechados</small></div>
              </>
            ) : <div className="hud-donutnum"><span>{fechados === 0 ? '0' : '—'}</span><small>{fechados === 0 ? 'nenhum fechado' : 'indisponível'}</small></div>}
          </div>
          <div className="hud-donutlegend">
            {([['won', 'Ganhos', g, 'mint'], ['lost', 'Perdidos', p, 'red']] as const).map(([q, rot, v, cor]) => (
              <button key={q} type="button" className="hud-legendrow" onClick={() => abrirDesf(q)} disabled={estDesf === 'indisponivel' || estDesf === 'carregando'}>
                <span className={`hud-bullet ${cor}`} />
                <span>{rot}<em>{v != null ? contar(v, unidade) : '—'}</em></span>
                <strong>{v != null && fechados ? `${Math.round((v / fechados) * 100)}%` : '—'}</strong><span aria-hidden>›</span>
              </button>
            ))}
            {!semDrill && <p className="hud-hint">Clique no segmento para abrir os respectivos negócios.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Ranking de vendedores ────────────────────────────────────────────────────

export function RankingVendedores({ periodo, resumo, onDrill, fonte }: {
  periodo: PipePeriodoId; resumo?: PipeSummary; onDrill: (d: Drill) => void;
  /** Precifica (P20): ranking vindo de fora (contrato próprio), sem consulta ao /metrics e sem drill-down. */
  fonte?: { data?: Pick<PipeMetrics, 'owners' | 'owners_resumo' | 'owners_periodo'>; isLoading: boolean; error: unknown };
}) {
  const [modo, setModo] = useState<'valor' | 'qtd'>('valor');
  const [todos, setTodos] = useState(false);
  const q = useQuery<PipeMetrics>({
    queryKey: [...chaves.metrics, 'ranking', periodo],
    queryFn: ({ signal }) => apiGet<PipeMetrics>('/metrics', { days: 365, periodo }, signal),
    refetchInterval: 120_000,
    enabled: !fonte,
  });
  const { data, isLoading, error } = (fonte ?? q) as { data?: Pick<PipeMetrics, 'owners' | 'owners_resumo' | 'owners_periodo'>; isLoading: boolean; error: unknown };
  const per = data?.owners_periodo; const rs = data?.owners_resumo;
  const lista: PipeOwnerRow[] = useMemo(() => (data?.owners ?? []).filter((o) => o.ganhos > 0), [data]);
  const ordenada = useMemo(() => [...lista].sort((a, b) => (modo === 'valor' ? b.valor_ganho - a.valor_ganho || b.ganhos - a.ganhos : b.ganhos - a.ganhos || b.valor_ganho - a.valor_ganho)), [lista, modo]);
  const pos = new Map(ordenada.map((o, i) => [o.owner_id ?? o.name, i]));
  const visiveis = todos ? lista.length : Math.min(5, lista.length);
  const max = Math.max(1, ...lista.map((o) => (modo === 'valor' ? o.valor_ganho : o.ganhos)));
  const kEstado = resumo?.kpis.find((x) => x.chave === 'valor_ganho')?.estado ?? 'atualizado';
  const estado: EstadoTela = isLoading ? 'carregando' : error || !data || !rs ? 'indisponivel' : kEstado === 'parcial' ? 'atualizado' : kEstado;
  const top5 = ordenada.slice(0, 5); const outros = ordenada.slice(5);
  const somaTop = top5.reduce((a, o) => a + (modo === 'valor' ? o.valor_ganho : o.ganhos), 0);
  const somaOutros = outros.reduce((a, o) => a + (modo === 'valor' ? o.valor_ganho : o.ganhos), 0);
  const unidade = useContext(UnidadeCtx);
  const fmt = (v: number) => (modo === 'valor' ? fmtBRL(v) : contar(v, unidade));
  const total = modo === 'valor' ? rs?.valor_total : rs?.ganhos_total;
  const ALT = 39;
  const abrir = (o: PipeOwnerRow) => {
    if (fonte || !per?.de || !per.ate || o.owner_id == null) return;
    onDrill({ titulo: `Ganhos de ${o.name}`, contexto: `Mesmo filtro da origem · Período: ${faixa(per.de, per.ate)} · Responsável: ${o.name} · Pipedrive`,
      rotuloValor: 'Valor ganho', filtros: { status: 'won', won_from: per.de, won_to: per.ate, owner_id: String(o.owner_id) }, esperado: { n: o.ganhos, valor: o.valor_ganho } });
  };

  return (
    <section className="hud-card hud-ranking" aria-label="Ranking de vendedores">
      <div className="hud-panelhead">
        <div>
          <div className="hud-panelname"><Medal size={16} aria-hidden /> Ranking de vendedores <Selo estado={estado} /></div>
          <div className="hud-panelsub">
            {modo === 'valor' ? 'Valor ganho por vendedor' : 'Negócios ganhos por vendedor'} · {faixa(per?.de ?? undefined, per?.ate ?? undefined)} · {rs && estado !== 'indisponivel' && estado !== 'carregando' ? `${rs.vendedores} vendedores` : '— vendedores'} · Total: <b>{total != null && estado !== 'indisponivel' && estado !== 'carregando' ? fmt(total) : '—'}</b>
            {estado === 'indisponivel' && <> · <span className="hud-link-off">consulta indisponível</span></>}
          </div>
        </div>
        <div className="hud-panelbtns" role="group" aria-label="Ordenar por">
          <button type="button" className={`hud-smallbtn${modo === 'valor' ? ' active' : ''}`} aria-pressed={modo === 'valor'} onClick={() => setModo('valor')}>Valor</button>
          <button type="button" className={`hud-smallbtn${modo === 'qtd' ? ' active' : ''}`} aria-pressed={modo === 'qtd'} onClick={() => setModo('qtd')}>Quantidade</button>
        </div>
      </div>
      {estado === 'carregando' ? <div className="hud-rankinglist"><div className="hud-skelbox" style={{ height: ALT * 5 }} /></div>
        : estado === 'indisponivel' ? <div className="hud-vazio">— · Consulta indisponível: o ranking do período não retornou.</div>
        : lista.length === 0 ? <div className="hud-vazio">Nenhum vendedor com negócio ganho no período.</div> : (
        <div className="hud-rankinglist" style={{ height: visiveis * ALT }}>
          {lista.map((o) => {
            const i = pos.get(o.owner_id ?? o.name) ?? 0; const v = modo === 'valor' ? o.valor_ganho : o.ganhos;
            const oculto = i >= visiveis;
            return (
              <div key={o.owner_id ?? o.name} className={`hud-rankrow p${i + 1}${oculto ? ' is-oculto' : ''}`} style={{ transform: `translateY(${i * ALT}px)` }}
                role="button" tabIndex={oculto ? -1 : 0} aria-hidden={oculto} onClick={() => abrir(o)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(o); } }}>
                <span className="hud-rankbadge">{i + 1}</span>
                <span className="hud-rankname" title={o.name}>{o.name}</span>
                <span className="hud-ranktrack"><span className="hud-rankfill" style={{ width: `${(v / max) * 100}%` }} /></span>
                <span className="hud-rankmoney">{fmt(v)}</span>
                <span className="hud-ranklink">{fonte ? "" : "Ver →"}</span>
              </div>
            );
          })}
        </div>
      )}
      {estado !== 'carregando' && estado !== 'indisponivel' && lista.length > 0 && (
        <div className="hud-rankingfoot">
          {lista.length > 5
            ? <button type="button" className="hud-cta" onClick={() => setTodos((t) => !t)}>{todos ? 'Mostrar os 5 primeiros' : `Ver todos (${lista.length}) →`}</button>
            : <span />}
          <span>
            {outros.length > 0 ? `Os 5 primeiros: ${fmt(somaTop)} · outros ${outros.length} vendedores: ${fmt(somaOutros)} · ` : ''}
            A soma dos {rs?.vendedores ?? lista.length} vendedores é <b>{total != null ? fmt(total) : '—'}</b>
            {rs && (modo === 'valor' ? rs.sem_responsavel.valor : rs.sem_responsavel.ganhos) > 0
              ? ` · sem responsável: ${fmt(modo === 'valor' ? rs.sem_responsavel.valor : rs.sem_responsavel.ganhos)}` : ''}
          </span>
        </div>
      )}
    </section>
  );
}

// ── Painel lateral de detalhamento ───────────────────────────────────────────

export function PainelDrill({ drill, onClose, onLista }: { drill: Drill; onClose: () => void; onLista?: (f: Record<string, string>) => void }) {
  const [ficha, setFicha] = useState<number | null>(null);
  const { data, isLoading, error } = useQuery<PipeDealsPage>({
    queryKey: ['pipe', 'drill', drill.filtros],
    queryFn: ({ signal }) => apiGet<PipeDealsPage>('/deals', {
      ...drill.filtros, per_page: 5, page: 1, facets: 0,
      sort: drill.filtros.won_from ? 'value' : 'update_time', dir: 'desc',
    }, signal),
  });
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && ficha == null) onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose, ficha]);
  const data_ = (r: { won_time?: string | null; lost_time?: string | null; add_time: string | null; update_time: string | null }) => {
    const s = drill.filtros.won_from ? r.won_time : drill.filtros.lost_from ? r.lost_time : drill.filtros.created_from ? r.add_time : r.update_time;
    return s ? ddmmaaaa(s.slice(0, 10)) : '—';
  };
  return (
    <div className="hud-drawerbackdrop" onClick={onClose}>
      <aside className="hud-drawer" role="dialog" aria-modal="true" aria-label={drill.titulo} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="hud-closedrawer" onClick={onClose}>✕ Fechar</button>
        <div className="hud-drawerkicker">PIPELINE · DETALHAMENTO</div>
        <h2>{drill.titulo}</h2>
        <p>{drill.contexto}</p>
        <div className="hud-drawersummary">
          <div className="hud-drawersummitem"><b>{isLoading ? '…' : error ? '—' : fmtNum(data?.total)}</b><small>Negócios no filtro</small></div>
          <div className="hud-drawersummitem"><b>{isLoading ? '…' : error || data?.soma_valor == null ? '—' : fmtBRL(data.soma_valor)}</b><small>{drill.rotuloValor}{data?.sem_valor ? ` · ${fmtNum(data.sem_valor)} sem valor` : ''}</small></div>
        </div>
        <div className="hud-drawerlisttitle">Registros do resultado</div>
        <p className="hud-shown">{isLoading ? 'Carregando…' : error ? 'Consulta indisponível: a lista não retornou.' : `Primeiros ${Math.min(5, data?.rows.length ?? 0)} de ${fmtNum(data?.total)} registros da lista filtrada`}</p>
        <div>
          {(data?.rows ?? []).map((r) => (
            <button key={r.id} type="button" className="hud-drawerrow" onClick={() => setFicha(r.id)} title="Abrir a ficha do negócio">
              <span className="hud-drawerrowtitle">{r.title ?? `#${r.id}`}</span>
              <span className="hud-drawerrowowner">{r.owner ?? '—'}</span>
              <span className="hud-drawerrowval">{fmtBRL(r.value)}</span>
              <span>{data_(r)}</span>
            </button>
          ))}
        </div>
        <div className="hud-drawerbtns">
          <button type="button" className="hud-drawerreturn" onClick={onClose}>← Voltar ao painel</button>
          {onLista && <button type="button" className="hud-drawerreturn primary" onClick={() => onLista(drill.filtros)} disabled={!data?.total}>
            Abrir lista completa{data?.total != null ? ` (${fmtNum(data.total)})` : ''} →</button>}
        </div>
      </aside>
      {ficha != null && <div onClick={(e) => e.stopPropagation()}><DealDrawer dealId={ficha} onClose={() => setFicha(null)} /></div>}
    </div>
  );
}
