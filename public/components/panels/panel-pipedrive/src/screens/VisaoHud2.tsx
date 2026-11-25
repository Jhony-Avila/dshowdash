// screens/VisaoHud2.tsx — Visão Geral do Pipedrive, 2º ciclo R2 (P17 · CIMA · 25/11/2026).
// @version 1.0.0  @created 2026-11-25
//
// Mesmo padrão APROVADO da P14 (VisaoHud.tsx): ECharts, 5 estados com motivo em texto, polaridade e painel lateral.
// Blocos: Valor em aberto por etapa · Ciclo de vendas (histograma) · Top produtos (tabela com indicador proporcional) ·
// Uso da API · Pede atenção (quantidade, significado e ação). Fonte: o contrato da ACIMA_ESQUERDA, GET /overview-blocks?periodo=
// (P17 431d2da5; docs/PIPEDRIVE/CONTRATO-VISAO-BLOCOS.md) — UMA consulta, a mesma fonte de datas do /summary.
// Reconciliação na própria tela: soma das etapas = "Em aberto agora"; ciclo medido em N = cobertura do KPI "Ciclo médio";
// "Fechamento vencido" abre exatamente os N negócios do número (status aberto + previsão até ontem).
import { useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Timer, Package, Activity, TriangleAlert, ArrowUpRight } from 'lucide-react';
import { apiGet } from '../lib/api';
import { fmtBRL, fmtNum } from '../lib/format';
import { EChart } from '../viz/EChart';
import { usePaleta, useTemaPipe } from '../viz/tema';
import type { Opcao } from '../viz/opts';
import { Selo, faixa, hhmm, semReducao, type Drill, type EstadoTela } from './VisaoHud';
import type { PipeSummary, PipePeriodoId, PipeEstadoDado } from '../shell/types';

/** Contrato GET /overview-blocks (ACIMA_ESQUERDA, P17). null = desconhecido ("—"), nunca 0. */
interface Etapa { stage_id: number; stage: string | null; pipeline_id: number | null; pipeline: string | null; abertos: number; valor: number; sem_valor: number; abertos_periodo: number; valor_periodo: number; sem_valor_periodo: number }
interface Ciclo { count: number; avg_dias: number | null; max_dias: number | null; buckets: { ate_7: number; d8_30: number; d31_90: number; mais_90: number } }
interface Produto { product_id: number | null; name: string | null; deals: number; qty: number; valor: number; sem_valor: number }
interface Hora { hour: string; api_calls: number; api_errors: number; token_cost: number; api_errors_404: number | null }
export interface PipeBlocos {
  leitura: { estado: PipeEstadoDado; atualizado_em: string | null; minutos: number | null; motivo: string | null };
  periodo: { id: string; de: string; ate: string; rotulo: string };
  gerado_em: string;
  valor_por_etapa: { recorte: string; fotografia_em: string; etapas: Etapa[] | null };
  ciclo: { recorte: string; regra: string; ciclo: Ciclo | null };
  top_produtos: { recorte: string; regra: string; cobertura: { ganhos: number | null; com_produtos: number | null }; itens: Produto[] | null };
  uso_api: { recorte: string; chamadas: number; erros: number; erros_404_registro_apagado: number | null; erros_outros: number | null; por_hora: Hora[] };
  pede_atencao: { recorte: string; fotografia_em: string; fechamento_vencido: number | null; atividades_atrasadas: number | null; sem_previsao: number | null };
}
/** Uma consulta para os 5 blocos (react-query divide a mesma chave entre eles). */
export function useBlocos(periodo: PipePeriodoId) {
  return useQuery<PipeBlocos>({
    queryKey: ['pipe', 'overview-blocks', periodo],
    queryFn: ({ signal }) => apiGet<PipeBlocos>('/overview-blocks', { periodo }, signal),
    refetchInterval: 120_000,
  });
}
/** Estado de um bloco de NEGÓCIOS pela leitura do próprio contrato. */
function estadoBloco(q: { isLoading: boolean; error: unknown; data?: PipeBlocos }): EstadoTela {
  if (q.isLoading) return 'carregando';
  if (q.error || !q.data) return 'indisponivel';
  const e = q.data.leitura.estado; return e === 'parcial' ? 'atualizado' : e;
}

const ontem = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const motivoLeitura = (r?: PipeSummary) => (r?.leitura?.estado === 'desatualizado' && r.leitura.atualizado_em ? `última leitura ${hhmm(r.leitura.atualizado_em)}` : null);

function Cabeca({ Icon, titulo, estado, sub, acoes }: { Icon: typeof BarChart3; titulo: string; estado: EstadoTela; sub: React.ReactNode; acoes?: React.ReactNode }) {
  return (
    <div className="hud-panelhead">
      <div>
        <div className="hud-panelname"><Icon size={16} aria-hidden /> {titulo} <Selo estado={estado} /></div>
        <div className="hud-panelsub">{sub}</div>
      </div>
      {acoes && <div className="hud-panelbtns">{acoes}</div>}
    </div>
  );
}
const Vazio = ({ texto }: { texto: string }) => <div className="hud-vazio">{texto}</div>;

// ── Valor em aberto por etapa ────────────────────────────────────────────────

export function BlocoEtapas({ periodo, resumo, onDrill }: { periodo: PipePeriodoId; resumo?: PipeSummary; onDrill: (d: Drill) => void }) {
  const pal = usePaleta(); const escuro = useTemaPipe() === 'dark'; const animar = useMemo(semReducao, []);
  const q = useBlocos(periodo); const data = q.data;
  const etapas = useMemo(() => {
    const ag = data?.valor_por_etapa.etapas ?? [];
    const varios = new Set(ag.map((x) => x.pipeline_id)).size > 1;
    return ag.filter((x) => x.abertos > 0).map((x) => ({ ...x, count: x.abertos, rotulo: `${x.stage ?? '—'}${varios && x.pipeline ? ` · ${x.pipeline}` : ''}` }));
  }, [data]);
  const ref = useRef(etapas); ref.current = etapas;
  const semValor = etapas.reduce((a, x) => a + x.sem_valor, 0);
  const base = estadoBloco(q); const estado: EstadoTela = base === 'atualizado' && semValor > 0 ? 'parcial' : base === 'atualizado' && data?.valor_por_etapa.etapas == null ? 'indisponivel' : base;
  const soma = etapas.reduce((a, x) => a + x.valor, 0); const n = etapas.reduce((a, x) => a + x.count, 0);
  const agora = resumo?.estado?.valor_aberto ?? null; const nAgora = resumo?.estado?.abertos ?? null;
  const dif = agora != null ? Math.round((agora - soma) * 100) / 100 : null;
  const mint = escuro ? '#12e6a8' : '#05c994'; const azul = escuro ? '#76a9ff' : '#4a79fa';
  const opcao = {
    animation: animar, animationDuration: 550, animationDurationUpdate: 300,
    grid: { left: 8, right: 118, top: 6, bottom: 6, containLabel: true },
    tooltip: { trigger: 'item', transitionDuration: 0.1, confine: true, backgroundColor: escuro ? '#07121f' : '#12243a', borderWidth: 0, textStyle: { color: '#f5faff', fontSize: 12 },
      formatter: (p: unknown) => { const x = ref.current[(p as { dataIndex: number }).dataIndex]; if (!x) return '';
        return `<b style="font-weight:500">${x.rotulo}</b><br/>${fmtBRL(x.valor)} · ${fmtNum(x.count)} ${x.count === 1 ? 'negócio aberto' : 'negócios abertos'} agora${x.sem_valor ? ` · ${x.sem_valor} sem valor` : ''}<br/><span style="opacity:.75">entraram no período e seguem abertos: ${fmtNum(x.abertos_periodo)} · ${fmtBRL(x.valor_periodo)}</span><div style="color:${mint};margin-top:4px">Clique para ver os negócios →</div>`; } },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', inverse: true, data: etapas.map((x) => x.rotulo), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: pal.textDim, fontSize: 11, width: 130, overflow: 'truncate' } },
    series: [{ type: 'bar', data: etapas.map((x) => x.valor), barMaxWidth: 16, cursor: 'pointer',
      itemStyle: { borderRadius: [0, 6, 6, 0], color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: azul }, { offset: 1, color: mint }] } },
      label: { show: true, position: 'right', color: pal.text, fontSize: 11, formatter: (p: { dataIndex: number }) => { const x = ref.current[p.dataIndex]; return x ? `${fmtBRL(x.valor)} · ${fmtNum(x.count)}` : ''; } } }],
  } as unknown as Opcao;
  return (
    <section className="hud-card hud-graph" aria-label="Valor em aberto por etapa">
      <Cabeca Icon={BarChart3} titulo="Valor em aberto por etapa" estado={estado}
        sub={<>Negócios abertos agora, por etapa · fotografia de agora (não segue o período){motivoLeitura(resumo) ? ` · ${motivoLeitura(resumo)}` : ''}{estado === 'parcial' ? ` · parcial: ${fmtNum(semValor)} sem valor` : ''}{estado === 'indisponivel' && <> · <span className="hud-link-off">consulta indisponível</span></>}</>} />
      <div className="hud-chartwrap">
        {estado === 'carregando' ? <div className="hud-skelbox" /> : estado === 'indisponivel' ? <Vazio texto="— · Consulta indisponível: as etapas não retornaram." />
          : etapas.length === 0 ? <Vazio texto="Nenhum negócio aberto nas etapas sincronizadas." />
          : <EChart opcao={opcao} altura="100%" aria="Valor em aberto por etapa"
              eventos={{ click: (p) => { const x = ref.current[(p as { dataIndex?: number }).dataIndex ?? -1]; if (!x || x.stage_id == null) return;
                onDrill({ titulo: `Em aberto · ${x.rotulo}`, contexto: 'Mesmo filtro da origem · negócios abertos agora nesta etapa · Pipedrive', rotuloValor: 'Valor em aberto',
                  filtros: { status: 'open', stage_id: String(x.stage_id) }, esperado: { n: x.count, valor: x.valor } }); } }} />}
      </div>
      <div className="hud-chartfoot">
        <span>{estado === 'indisponivel' || estado === 'carregando' ? 'Soma das etapas —' : <>Soma das {etapas.length} etapas: <strong>{fmtBRL(soma)}</strong> · {fmtNum(n)} negócios</>}</span>
        <span>{estado === 'indisponivel' || estado === 'carregando' || agora == null ? '' : dif === 0 && n === nAgora ? <>= “Em aberto agora” ✓</> : <>“Em aberto agora”: {fmtBRL(agora)} · {fmtBRL(dif)} fora das etapas sincronizadas</>}</span>
      </div>
    </section>
  );
}

// ── Ciclo de vendas (histograma) ─────────────────────────────────────────────

const FAIXAS: { k: 'ate_7' | 'd8_30' | 'd31_90' | 'mais_90'; rot: string }[] = [
  { k: 'ate_7', rot: 'Até 7 dias' }, { k: 'd8_30', rot: '8–30 dias' }, { k: 'd31_90', rot: '31–90 dias' }, { k: 'mais_90', rot: 'Mais de 90' },
];
export function BlocoCiclo({ periodo, resumo, onDrill }: { periodo: PipePeriodoId; resumo?: PipeSummary; onDrill: (d: Drill) => void }) {
  const pal = usePaleta(); const escuro = useTemaPipe() === 'dark'; const animar = useMemo(semReducao, []);
  const q = useBlocos(periodo);
  const cy = q.data?.ciclo.ciclo ?? null; const kc = resumo?.kpis.find((x) => x.chave === 'ciclo_medio'); const per = resumo?.periodo;
  const b0 = estadoBloco(q); const base: EstadoTela = b0 !== 'carregando' && b0 !== 'indisponivel' && cy == null ? 'indisponivel' : b0;
  const estado: EstadoTela = base === 'atualizado' && (kc?.cobertura?.sem_data ?? 0) > 0 ? 'parcial' : base;
  // polaridade: ciclo curto é melhor (verde → azul → âmbar → vermelho)
  const cores = escuro ? ['#12e6a8', '#76a9ff', '#f2b45e', '#fc6173'] : ['#05c994', '#4a79fa', '#d78a25', '#fa606f'];
  const vals = FAIXAS.map((f) => cy?.buckets?.[f.k] ?? 0); const tot = vals.reduce((a, x) => a + x, 0);
  const opcao = {
    animation: animar, animationDuration: 550,
    grid: { left: 36, right: 12, top: 22, bottom: 26 },
    tooltip: { trigger: 'item', transitionDuration: 0.1, backgroundColor: escuro ? '#07121f' : '#12243a', borderWidth: 0, textStyle: { color: '#f5faff', fontSize: 12 },
      formatter: (p: unknown) => { const i = (p as { dataIndex: number }).dataIndex; return `${FAIXAS[i].rot}: <b style="font-weight:500">${fmtNum(vals[i])}</b> ${vals[i] === 1 ? 'ganho' : 'ganhos'}${tot ? ` (${Math.round((vals[i] / tot) * 100)}%)` : ''}`; } },
    xAxis: { type: 'category', data: FAIXAS.map((f) => f.rot), axisTick: { show: false }, axisLine: { lineStyle: { color: pal.border } }, axisLabel: { color: pal.textDim, fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: pal.border, opacity: 0.6 } }, axisLabel: { color: pal.textDim, fontSize: 11 } },
    series: [{ type: 'bar', barMaxWidth: 54, cursor: 'pointer', data: vals.map((v, i) => ({ value: v, itemStyle: { color: cores[i], borderRadius: [6, 6, 0, 0] } })),
      label: { show: true, position: 'top', color: pal.text, fontSize: 11 } }],
  } as unknown as Opcao;
  return (
    <section className="hud-card hud-donutcard" aria-label="Ciclo de vendas">
      <Cabeca Icon={Timer} titulo="Ciclo de vendas" estado={estado}
        sub={<>Dias entre criar e ganhar · ganhos de {faixa(per?.de, per?.ate)}{estado !== 'indisponivel' && estado !== 'carregando' && cy?.avg_dias != null ? <> · média <b>{cy.avg_dias} dias</b></> : ''}{estado === 'indisponivel' && <> · <span className="hud-link-off">consulta indisponível</span></>}</>}
        acoes={<button type="button" className="hud-smallbtn" title="Abrir os ganhos do período" aria-label="Abrir os ganhos do período" disabled={!per || estado === 'indisponivel' || estado === 'carregando'}
          onClick={() => per && onDrill({ titulo: 'Ganhos do ciclo', contexto: `Mesmo filtro da origem · Período: ${faixa(per.de, per.ate)} · Pipedrive`, rotuloValor: 'Valor ganho', filtros: { status: 'won', won_from: per.de, won_to: per.ate } })}><ArrowUpRight size={13} /></button>} />
      <div className="hud-chartwrap">
        {estado === 'carregando' ? <div className="hud-skelbox" /> : estado === 'indisponivel' ? <Vazio texto="— · Consulta indisponível: o ciclo do período não retornou." />
          : tot === 0 ? <Vazio texto="Nenhum ganho com datas completas no período para medir o ciclo." />
          : <EChart opcao={opcao} altura="100%" aria="Distribuição do ciclo de vendas"
              eventos={{ click: () => per && onDrill({ titulo: 'Ganhos do ciclo', contexto: `Mesmo filtro da origem · Período: ${faixa(per.de, per.ate)} · Pipedrive`, rotuloValor: 'Valor ganho', filtros: { status: 'won', won_from: per.de, won_to: per.ate } }) }} />}
      </div>
      <div className="hud-chartfoot">
        <span>{estado === 'indisponivel' || estado === 'carregando' ? 'Medido em —' : <>Medido em <strong>{fmtNum(tot)}</strong> ganhos{kc?.cobertura ? (kc.cobertura.com_data === tot ? ' = KPI “Ciclo médio” ✓' : ` · KPI: ${fmtNum(kc.cobertura.com_data)}`) : ''}</>}</span>
        <span>{estado === 'parcial' && kc?.cobertura ? `${fmtNum(kc.cobertura.sem_data)} sem data de criação` : ''}</span>
      </div>
    </section>
  );
}

// ── Top produtos ─────────────────────────────────────────────────────────────

export function TopProdutos({ periodo }: { periodo: PipePeriodoId }) {
  const q = useBlocos(periodo); const { error } = q; const tp = q.data?.top_produtos; const per = q.data?.periodo;
  const cob = tp?.cobertura; const lista = (tp?.itens ?? []).slice(0, 10); const semValor = lista.reduce((a, x) => a + x.sem_valor, 0);
  const b0 = estadoBloco(q);
  const estado: EstadoTela = b0 === 'carregando' || b0 === 'indisponivel' ? b0 : tp?.itens == null || cob?.ganhos == null ? 'indisponivel'
    : (cob.com_produtos ?? 0) < cob.ganhos || semValor > 0 ? 'parcial' : b0;
  const max = Math.max(1, ...lista.map((p) => p.valor));
  return (
    <section className="hud-card hud-tabela-card" aria-label="Top produtos">
      <Cabeca Icon={Package} titulo="Top produtos por valor" estado={estado}
        sub={estado === 'carregando' ? 'Carregando…' : estado === 'indisponivel'
          ? <><span className="hud-link-off">{error || q.data?.leitura.estado === 'indisponivel' ? 'consulta indisponível' : 'produtos dos negócios ainda não sincronizados'}</span></>
          : <>Negócios ganhos de {faixa(per?.de, per?.ate)} · cobertura: <b>{fmtNum(cob?.com_produtos)}</b> de {fmtNum(cob?.ganhos)} ganhos com produtos lançados{semValor ? ` · ${fmtNum(semValor)} itens sem valor` : ''} · valor ganho, não é faturamento</>} />
      {estado === 'carregando' ? <div className="hud-tabela-wrap"><div className="hud-skelbox" style={{ height: 220 }} /></div>
        : estado === 'indisponivel' ? <Vazio texto="— · Consulta indisponível: os produtos não retornaram." />
        : lista.length === 0 ? <Vazio texto="Nenhum ganho do período com produtos lançados." />
        : (
          <div className="hud-tabela-wrap">
            <table className="hud-tabela">
              <thead><tr><th>Produto</th><th className="r">Negócios</th><th className="r">Qtd.</th><th>Valor ganho (itens)</th></tr></thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.product_id ?? p.name}>
                    <td className="hud-tabela-nome" title={String(p.name ?? '')}>{String(p.name ?? '—')}</td>
                    <td className="r">{fmtNum(p.deals)}</td>
                    <td className="r">{fmtNum(p.qty)}</td>
                    <td><div className="hud-prop"><span className="hud-prop-trilho"><span className="hud-prop-barra" style={{ width: `${(p.valor / max) * 100}%` }} /></span><span className="hud-prop-v" title={p.sem_valor ? `${p.sem_valor} itens sem valor (fora da soma)` : undefined}>{fmtBRL(p.valor)}{p.sem_valor ? '*' : ''}</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </section>
  );
}

// ── Pede atenção ─────────────────────────────────────────────────────────────

export function PedeAtencao({ periodo, resumo, onDrill, onAlertas }: {
  periodo: PipePeriodoId; resumo?: PipeSummary; onDrill: (d: Drill) => void; onAlertas?: () => void;
}) {
  const q = useBlocos(periodo); const e = q.data?.pede_atencao;
  const b0 = estadoBloco(q); const estado: EstadoTela = b0 !== 'carregando' && b0 !== 'indisponivel' && e?.fechamento_vencido == null ? 'indisponivel' : b0;
  const itens = [
    { k: 'venc', rot: 'Fechamento vencido', v: e?.fechamento_vencido, cor: 'bad',
      sig: 'Negócios abertos com a previsão de fechamento já passada.', acao: 'Ver negócios →',
      ir: () => onDrill({ titulo: 'Fechamento vencido', contexto: 'Mesmo filtro da origem · abertos com previsão de fechamento até ontem · Pipedrive', rotuloValor: 'Valor em aberto',
        filtros: { status: 'open', close_to: ontem() }, esperado: { n: e?.fechamento_vencido ?? null, valor: null } }) },
    { k: 'ativ', rot: 'Atividades atrasadas', v: e?.atividades_atrasadas, cor: 'bad',
      sig: 'Atividades não concluídas com prazo vencido.', acao: 'Abrir alertas →', ir: onAlertas },
    { k: 'prev', rot: 'Sem previsão de fechamento', v: e?.sem_previsao, cor: 'warn',
      sig: 'Negócios abertos sem data prevista: o funil não sabe quando entram.', acao: 'Abrir alertas →', ir: onAlertas },
  ];
  return (
    <section className="hud-card hud-atencao" aria-label="Pede atenção">
      <Cabeca Icon={TriangleAlert} titulo="Pede atenção" estado={estado}
        sub={<>Fotografia de agora (não segue o período){motivoLeitura(resumo) ? ` · ${motivoLeitura(resumo)}` : ''}{estado === 'indisponivel' && <> · <span className="hud-link-off">consulta indisponível</span></>}</>} />
      <div className="hud-atencao-lista">
        {itens.map((x) => {
          const mostrar = estado !== 'carregando' && estado !== 'indisponivel' && x.v != null;
          return (
            <div key={x.k} className="hud-atencao-item">
              <span className={`hud-atencao-n ${mostrar && (x.v as number) > 0 ? x.cor : ''}`}>{estado === 'carregando' ? <span className="hud-skel" style={{ width: 40 }} /> : mostrar ? fmtNum(x.v) : '—'}</span>
              <span className="hud-atencao-txt"><b>{x.rot}</b><small>{x.sig}</small></span>
              {x.ir && mostrar && (x.v as number) > 0
                ? <button type="button" className="hud-smallbtn hud-atencao-acao" onClick={x.ir}>{x.acao}</button>
                : <span className="hud-atencao-ok">{mostrar ? 'Nada pendente' : ''}</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Uso da API (72 h) ────────────────────────────────────────────────────────

export function UsoApiHud({ periodo }: { periodo: PipePeriodoId }) {
  const pal = usePaleta(); const escuro = useTemaPipe() === 'dark'; const animar = useMemo(semReducao, []);
  const { data, isLoading, error } = useBlocos(periodo);
  const u = data?.uso_api; const h = u?.por_hora ?? [];
  const chamadas = u?.chamadas ?? 0; const erros = u?.erros ?? 0; const e404 = u?.erros_404_registro_apagado ?? null;
  const ultima = h.length ? h[h.length - 1].hour : null;
  const idadeH = ultima ? (Date.now() - new Date(String(ultima).replace(' ', 'T')).getTime()) / 3_600_000 : null;
  const estado: EstadoTela = isLoading ? 'carregando' : error || !data || h.length === 0 ? 'indisponivel' : idadeH != null && idadeH > 2 ? 'desatualizado' : 'atualizado';
  const azul = escuro ? '#76a9ff' : '#4a79fa'; const red = escuro ? '#fc6173' : '#fa606f';
  const opcao = {
    animation: animar, animationDuration: 550,
    grid: { left: 44, right: 14, top: 14, bottom: 24 },
    tooltip: { trigger: 'axis', transitionDuration: 0.1, backgroundColor: escuro ? '#07121f' : '#12243a', borderWidth: 0, textStyle: { color: '#f5faff', fontSize: 12 } },
    legend: { show: false },
    xAxis: { type: 'category', data: h.map((x) => String(x.hour).slice(8, 13).replace(' ', ' ') + 'h'), axisTick: { show: false }, axisLine: { lineStyle: { color: pal.border } }, axisLabel: { color: pal.textDim, fontSize: 10, interval: 11 } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: pal.border, opacity: 0.6 } }, axisLabel: { color: pal.textDim, fontSize: 10 } },
    series: [
      { type: 'line', name: 'Chamadas', data: h.map((x) => x.api_calls), smooth: 0.3, smoothMonotone: 'x', showSymbol: false, lineStyle: { color: azul, width: 2 }, itemStyle: { color: azul },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: escuro ? 'rgba(118,169,255,.28)' : 'rgba(74,121,250,.18)' }, { offset: 1, color: 'rgba(74,121,250,0)' }] } } },
      { type: 'bar', name: 'Erros', data: h.map((x) => x.api_errors), barMaxWidth: 6, itemStyle: { color: red, borderRadius: [3, 3, 0, 0] } },
    ],
  } as unknown as Opcao;
  const pct = chamadas > 0 ? (erros / chamadas) * 100 : null;
  return (
    <section className="hud-card hud-api" aria-label="Uso da API">
      <Cabeca Icon={Activity} titulo="Uso da API — últimas 72 h" estado={estado}
        sub={estado === 'carregando' ? 'Carregando…' : estado === 'indisponivel' ? <span className="hud-link-off">{error ? 'consulta indisponível' : 'sem registro de chamadas nas últimas 72 h'}</span>
          : <>Chamadas ao Pipedrive por hora (azul) e erros (vermelho){estado === 'desatualizado' && ultima ? ` · última hora registrada ${String(ultima).slice(11, 16)}` : ''}</>} />
      <div className="hud-api-kpis">
        {[['Chamadas', estado === 'atualizado' || estado === 'desatualizado' ? fmtNum(chamadas) : '—', ''],
          ['Erros', estado === 'atualizado' || estado === 'desatualizado' ? fmtNum(erros) : '—', erros > 0 ? 'bad' : ''],
          ['404 de registro apagado (tratados)', e404 != null && (estado === 'atualizado' || estado === 'desatualizado') ? fmtNum(e404) : '—', ''],
          ['Outros erros', e404 != null && (estado === 'atualizado' || estado === 'desatualizado') ? fmtNum(erros - e404) : '—', e404 != null && erros - e404 > 0 ? 'bad' : ''],
          ['Taxa de erro', pct != null && (estado === 'atualizado' || estado === 'desatualizado') ? `${pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—', '']].map(([r, v, c]) => (
          <div key={r} className="hud-api-kpi"><small>{r}</small><b className={c}>{v}</b></div>
        ))}
      </div>
      <div className="hud-chartwrap hud-api-graf">
        {estado === 'carregando' ? <div className="hud-skelbox" /> : estado === 'indisponivel' ? <Vazio texto="— · Sem dados de uso da API para mostrar." /> : <EChart opcao={opcao} altura="100%" aria="Chamadas e erros da API por hora" />}
      </div>
    </section>
  );
}
