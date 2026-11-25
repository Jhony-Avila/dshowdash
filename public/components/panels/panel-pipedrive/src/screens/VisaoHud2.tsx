// screens/VisaoHud2.tsx — Visão Geral do Pipedrive, 2º ciclo R2 (P17 · CIMA · 25/11/2026).
// @version 1.0.0  @created 2026-11-25
//
// Mesmo padrão APROVADO da P14 (VisaoHud.tsx): ECharts, 5 estados com motivo em texto, polaridade e painel lateral.
// Blocos: Valor em aberto por etapa · Ciclo de vendas (histograma) · Top produtos (tabela com indicador proporcional) ·
// Uso da API · Pede atenção (quantidade, significado e ação). Endpoints atuais (/conversion, /metrics, /summary).
// Reconciliação na própria tela: soma das etapas = "Em aberto agora"; ciclo medido em N = cobertura do KPI "Ciclo médio";
// "Fechamento vencido" abre exatamente os N negócios do número (status aberto + previsão até ontem).
import { useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Timer, Package, Activity, TriangleAlert, ArrowUpRight } from 'lucide-react';
import { apiGet, chaves } from '../lib/api';
import { fmtBRL, fmtNum } from '../lib/format';
import { EChart } from '../viz/EChart';
import { usePaleta, useTemaPipe } from '../viz/tema';
import type { Opcao } from '../viz/opts';
import { Selo, faixa, hhmm, semReducao, type Drill, type EstadoTela } from './VisaoHud';
import type { PipeSummary, PipeConversion, PipeMetrics, PipePeriodoId } from '../shell/types';

const ontem = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/** Estado dos blocos que leem os NEGÓCIOS sincronizados: o mesmo da leitura de `deals` (/summary.leitura). */
function estadoNegocios(carregando: boolean, falhou: boolean, resumo?: PipeSummary): EstadoTela {
  if (carregando) return 'carregando';
  if (falhou) return 'indisponivel';
  const e = resumo?.leitura?.estado ?? 'atualizado';
  return e === 'parcial' ? 'atualizado' : e;
}
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
  const { data, isLoading, error } = useQuery<PipeConversion>({
    queryKey: [...chaves.conversion, periodo],
    queryFn: ({ signal }) => apiGet<PipeConversion>('/conversion', { periodo }, signal),
    refetchInterval: 120_000,
  });
  const etapas = useMemo(() => {
    const ag = (data as unknown as { stage_aging?: { stage_id: number | null; stage: string | null; pipeline: string | null; count: number; valor: number; idade_media_dias: number | null }[] })?.stage_aging ?? [];
    const varios = new Set(ag.map((x) => x.pipeline)).size > 1;
    return ag.filter((x) => x.count > 0).map((x) => ({ ...x, rotulo: `${x.stage ?? '—'}${varios && x.pipeline ? ` · ${x.pipeline}` : ''}` }));
  }, [data]);
  const ref = useRef(etapas); ref.current = etapas;
  const estado: EstadoTela = isLoading ? 'carregando' : error || !data ? 'indisponivel' : estadoNegocios(false, false, resumo);
  const soma = etapas.reduce((a, x) => a + x.valor, 0); const n = etapas.reduce((a, x) => a + x.count, 0);
  const agora = resumo?.estado?.valor_aberto ?? null; const nAgora = resumo?.estado?.abertos ?? null;
  const dif = agora != null ? Math.round((agora - soma) * 100) / 100 : null;
  const mint = escuro ? '#12e6a8' : '#05c994'; const azul = escuro ? '#76a9ff' : '#4a79fa';
  const opcao = {
    animation: animar, animationDuration: 550, animationDurationUpdate: 300,
    grid: { left: 8, right: 118, top: 6, bottom: 6, containLabel: true },
    tooltip: { trigger: 'item', transitionDuration: 0.1, confine: true, backgroundColor: escuro ? '#07121f' : '#12243a', borderWidth: 0, textStyle: { color: '#f5faff', fontSize: 12 },
      formatter: (p: unknown) => { const x = ref.current[(p as { dataIndex: number }).dataIndex]; if (!x) return '';
        return `<b style="font-weight:500">${x.rotulo}</b><br/>${fmtBRL(x.valor)} · ${fmtNum(x.count)} ${x.count === 1 ? 'negócio' : 'negócios'}${x.idade_media_dias != null ? `<br/>parados há ${x.idade_media_dias} dias em média` : ''}<div style="color:${mint};margin-top:4px">Clique para ver os negócios →</div>`; } },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', inverse: true, data: etapas.map((x) => x.rotulo), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: pal.textDim, fontSize: 11, width: 130, overflow: 'truncate' } },
    series: [{ type: 'bar', data: etapas.map((x) => x.valor), barMaxWidth: 16, cursor: 'pointer',
      itemStyle: { borderRadius: [0, 6, 6, 0], color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: azul }, { offset: 1, color: mint }] } },
      label: { show: true, position: 'right', color: pal.text, fontSize: 11, formatter: (p: { dataIndex: number }) => { const x = ref.current[p.dataIndex]; return x ? `${fmtBRL(x.valor)} · ${fmtNum(x.count)}` : ''; } } }],
  } as unknown as Opcao;
  return (
    <section className="hud-card hud-graph" aria-label="Valor em aberto por etapa">
      <Cabeca Icon={BarChart3} titulo="Valor em aberto por etapa" estado={estado}
        sub={<>Negócios abertos agora, por etapa · foto do momento{motivoLeitura(resumo) ? ` · ${motivoLeitura(resumo)}` : ''}{estado === 'indisponivel' && <> · <span className="hud-link-off">consulta indisponível</span></>}</>} />
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
  const { data, isLoading, error } = useQuery<PipeConversion>({
    queryKey: [...chaves.conversion, periodo],
    queryFn: ({ signal }) => apiGet<PipeConversion>('/conversion', { periodo }, signal),
    refetchInterval: 120_000,
  });
  const cy = data?.cycle; const kc = resumo?.kpis.find((x) => x.chave === 'ciclo_medio'); const per = resumo?.periodo;
  const base = estadoNegocios(isLoading, !!error || (!isLoading && !data), resumo);
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
  const { data, isLoading, error } = useQuery<PipeMetrics>({
    queryKey: [...chaves.metrics, 'ranking', periodo],
    queryFn: ({ signal }) => apiGet<PipeMetrics>('/metrics', { days: 365, periodo }, signal),
    refetchInterval: 120_000,
  });
  const cob = data?.coverage; const lista = (data?.top_products ?? []).slice(0, 10);
  const estado: EstadoTela = isLoading ? 'carregando' : error || !data ? 'indisponivel'
    : !cob || cob.deals_com_produtos === 0 ? 'indisponivel' : cob.deals_com_produtos < cob.deals_ativos ? 'parcial' : 'atualizado';
  const max = Math.max(1, ...lista.map((p) => p.valor_total));
  return (
    <section className="hud-card hud-tabela-card" aria-label="Top produtos">
      <Cabeca Icon={Package} titulo="Top produtos por valor" estado={estado}
        sub={estado === 'carregando' ? 'Carregando…' : estado === 'indisponivel'
          ? <><span className="hud-link-off">{error ? 'consulta indisponível' : 'produtos dos negócios ainda não sincronizados'}</span></>
          : <>Todo o histórico (não segue o período) · só negócios com produtos lançados: <b>{fmtNum(cob?.deals_com_produtos)}</b> de {fmtNum(cob?.deals_ativos)} ativos · “Valor total” inclui abertos e perdidos</>} />
      {estado === 'carregando' ? <div className="hud-tabela-wrap"><div className="hud-skelbox" style={{ height: 220 }} /></div>
        : estado === 'indisponivel' || lista.length === 0 ? <Vazio texto={error ? '— · Consulta indisponível: os produtos não retornaram.' : '— · Nenhum produto de negócio sincronizado. Um administrador pode puxar os produtos em Configurações.'} />
        : (
          <div className="hud-tabela-wrap">
            <table className="hud-tabela">
              <thead><tr><th>Produto</th><th className="r">Negócios</th><th className="r">Qtd.</th><th>Valor total</th><th className="r">Ganho</th></tr></thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.product_id ?? p.name}>
                    <td className="hud-tabela-nome" title={String(p.name ?? '')}>{String(p.name ?? '—')}</td>
                    <td className="r">{fmtNum(p.deals)}</td>
                    <td className="r">{fmtNum(p.qty)}</td>
                    <td><div className="hud-prop"><span className="hud-prop-trilho"><span className="hud-prop-barra" style={{ width: `${(p.valor_total / max) * 100}%` }} /></span><span className="hud-prop-v">{fmtBRL(p.valor_total)}</span></div></td>
                    <td className="r">{fmtBRL(p.valor_ganho)}</td>
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

export function PedeAtencao({ resumo, carregando, falhou, onDrill, onAlertas }: {
  resumo?: PipeSummary; carregando: boolean; falhou: boolean; onDrill: (d: Drill) => void; onAlertas?: () => void;
}) {
  const e = resumo?.estado;
  const estado = estadoNegocios(carregando, falhou || (!carregando && (!e || e.estado === 'indisponivel')), resumo);
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
        sub={<>Foto do momento{motivoLeitura(resumo) ? ` · ${motivoLeitura(resumo)}` : ''}{estado === 'indisponivel' && <> · <span className="hud-link-off">consulta indisponível</span></>}</>} />
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
  const { data, isLoading, error } = useQuery<PipeMetrics>({
    queryKey: [...chaves.metrics, 'ranking', periodo],
    queryFn: ({ signal }) => apiGet<PipeMetrics>('/metrics', { days: 365, periodo }, signal),
    refetchInterval: 120_000,
  });
  const h = data?.hourly ?? [];
  const chamadas = h.reduce((a, x) => a + x.api_calls, 0); const erros = h.reduce((a, x) => a + x.api_errors, 0);
  const temSep = h.length > 0 && h.every((x) => typeof x.api_errors_404 === 'number');
  const e404 = temSep ? h.reduce((a, x) => a + (x.api_errors_404 as number), 0) : null;
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
