// screens/VisaoGeral.tsx — dashboard executivo da base local.
// @version 3.1.0  @created 2026-07-21
//
// Le GET /summary (KPIs da janela + janela anterior), /overview, /metrics, /conversion
// e /funnel. Tudo ja sincronizado no PIPE_DSHOW — nao chama a API do Pipedrive.
//
// v2.x: pilha de cartoes de 640px com mini-graficos SVG.
// v3.0.0 (Fase 4 — visuais gerenciais):
//   • grade de 12 colunas ocupando a largura toda (criterio §12/§23);
//   • big-numbers com VARIACAO vs. periodo anterior, sparkline e drill-down;
//   • seletor de periodo (janela deslizante + calendario) que governa a faixa;
//   • graficos ECharts (area com zoom, rosca, barras, colunas) no lugar dos SVG.
//
// Duas classes de numero, sinalizadas na UI: os KPIs da FAIXA sao fatos de janela
// (comparaveis); "em aberto agora" e foto do momento e por isso NAO tem variacao —
// a base nao guarda snapshot historico e inventar um seria fabricar dado.
import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, TriangleAlert } from 'lucide-react';
import { apiGet, chaves, ApiError } from '../lib/api';
import { fmtBRL, fmtNum, fmtData } from '../lib/format';
import { PageHeader } from './PageHeader';
import { EstadoErro, SkeletonBloco } from './Estados';
import { BigNumber, type FormatoBN } from './BigNumber';
import { EChartCard } from '../viz/ChartCard';
import { usePaleta } from '../viz/tema';
import { optArea, optBarras, optColunas, optDonut, type PontoXY } from '../viz/opts';
import type {
  PipeStatus, PipeOverview, PipeMetrics, PipeDailyMetric, PipeConversion,
  PipeSummary, PipeSummaryKpi, PipeFunnelData, PipePeriodoId,
} from '../shell/types';

// #3/#4 — janela deslizante E calendário. Os dois convivem porque respondem
// perguntas diferentes: "como foram os últimos 30 dias" (tendência, sem borda de mês)
// e "como está julho contra junho" (fechamento, que é como a área comercial cobra).
const PERIODOS: { v: PipePeriodoId; label: string; grupo: 'janela' | 'calendario' }[] = [
  { v: 'd7', label: '7 d', grupo: 'janela' },
  { v: 'd30', label: '30 d', grupo: 'janela' },
  { v: 'd90', label: '90 d', grupo: 'janela' },
  { v: 'd180', label: '180 d', grupo: 'janela' },
  { v: 'mes', label: 'Este mês', grupo: 'calendario' },
  { v: 'mes_ant', label: 'Mês passado', grupo: 'calendario' },
  { v: 'trim', label: 'Trimestre', grupo: 'calendario' },
  { v: 'ano', label: 'Este ano', grupo: 'calendario' },
];

// #4 — a escolha sobrevive à navegação e ao reabrir a tela, como as demais
// preferências locais que a aba Aparência já governa.
const PERIODO_KEY = 'pp:periodo';
function lerPeriodo(): PipePeriodoId {
  try {
    const s = localStorage.getItem(PERIODO_KEY);
    if (s && PERIODOS.some((p) => p.v === s)) return s as PipePeriodoId;
  } catch { /* ignora */ }
  return 'd30';
}

export interface VisaoGeralProps {
  status?: PipeStatus;
  onConfig: () => void;
  /** Drill-down: abre Negócios já filtrado (o filtro viaja no hash). */
  onNegocios?: (filtros?: Record<string, string>) => void;
  onFunis?: () => void;
  onAlertas?: () => void;
}

export function VisaoGeral({ status, onConfig, onNegocios, onFunis, onAlertas }: VisaoGeralProps) {
  const conectado = status?.status === 'connected';
  const [periodo, setPeriodoEstado] = useState<PipePeriodoId>(lerPeriodo);
  const trocarPeriodo = (p: PipePeriodoId) => {
    setPeriodoEstado(p);
    try { localStorage.setItem(PERIODO_KEY, p); } catch { /* ignora */ }
  };

  const { data, isLoading, error, refetch } = useQuery<PipeOverview>({
    queryKey: chaves.overview,
    queryFn: ({ signal }) => apiGet<PipeOverview>('/overview', undefined, signal),
    refetchInterval: 60_000,
  });

  const ov = data?.overview;
  const d = ov?.deals;
  const semDados = !isLoading && (d?.total ?? 0) === 0;
  const ultimaRun = data?.runs?.[0];

  return (
    <div>
      <PageHeader Icon={LayoutDashboard} titulo="Visão Geral"
        descricao="Painel executivo do Pipedrive — indicadores da base sincronizada."
        acoes={conectado && !semDados ? (
          <div className="pp-seg" role="group" aria-label="Período dos indicadores">
            {PERIODOS.map((p, i) => (
              <Fragment key={p.v}>
                {/* Separador entre janela deslizante e calendário: são naturezas
                    diferentes, e emendá-las faria "180 d" e "Este mês" parecerem
                    a mesma escala. */}
                {i > 0 && PERIODOS[i - 1].grupo !== p.grupo && <span className="pp-seg-sep" aria-hidden />}
                <button type="button" className={`pp-seg-b${periodo === p.v ? ' is-active' : ''}`}
                  onClick={() => trocarPeriodo(p.v)} aria-pressed={periodo === p.v}>{p.label}</button>
              </Fragment>
            ))}
          </div>
        ) : undefined} />

      {!conectado && (
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro titulo="Integração não conectada"
            detalhe="Conecte o token do Pipedrive para ver os indicadores da base sincronizada." />
          <div className="pp-actions" style={{ justifyContent: 'center' }}>
            <button className="pp-btn pp-primary" onClick={onConfig}>Ir para Configurações</button>
          </div>
        </div>
      )}

      {conectado && error instanceof ApiError && (
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro titulo="Não foi possível carregar os indicadores"
            detalhe={error.ehAuth ? 'Sua sessão expirou. Recarregue a página e entre novamente.' : 'Falha ao consultar a base local.'}
            onRetry={error.ehAuth ? undefined : () => void refetch()} />
        </div>
      )}

      {conectado && !error && (
        isLoading ? (
          <div className="pp-card" style={{ maxWidth: 'none' }}><SkeletonBloco linhas={5} /></div>
        ) : semDados ? (
          <div className="pp-card">
            <h3>Ainda sem dados sincronizados</h3>
            <p className="pp-placeholder">
              A conexão está pronta, mas a base local ainda não recebeu negócios. Um administrador pode
              disparar a sincronização na aba <strong>Configurações</strong> (seção Sincronização).
            </p>
            <div className="pp-actions"><button className="pp-btn" onClick={onConfig}>Abrir Configurações</button></div>
          </div>
        ) : (
          <>
            <FaixaIndicadores periodo={periodo} onNegocios={onNegocios} />

            <BlocoTendencia />

            <BlocoOperacao onNegocios={onNegocios} onFunis={onFunis} onAlertas={onAlertas} />

            <BlocoRankings />

            {/* Base sincronizada + uso da API */}
            <div className="pp-g12">
              <div className="pp-card pp-c-7">
                <h3>Base sincronizada</h3>
                <div className="pp-row"><span className="pp-k">Contatos</span><span className="pp-v">{fmtNum(ov?.contagens.persons)} pessoas · {fmtNum(ov?.contagens.organizations)} organizações</span></div>
                <div className="pp-row"><span className="pp-k">Catálogo & leads</span><span className="pp-v">{fmtNum(ov?.contagens.products)} produtos · {fmtNum(ov?.contagens.leads)} leads · {fmtNum(ov?.contagens.notes)} notas</span></div>
                <div className="pp-row"><span className="pp-k">Funis</span><span className="pp-v">{fmtNum(ov?.contagens.pipelines)} funis · {fmtNum(ov?.contagens.stages)} etapas · {fmtNum(ov?.contagens.users)} usuários</span></div>
                <div className="pp-row">
                  <span className="pp-k">Atividades</span>
                  <span className="pp-v">
                    {fmtNum(ov?.contagens.activities)} no total · {fmtNum(ov?.atividades?.pendentes)} pendentes
                    {ov?.atividades?.atrasadas ? <span style={{ color: 'var(--pp-danger)' }}> · {fmtNum(ov.atividades.atrasadas)} atrasadas</span> : null}
                  </span>
                </div>
                <div className="pp-row">
                  <span className="pp-k">Última sincronização</span>
                  <span className="pp-v">
                    {ultimaRun ? `${fmtData(ultimaRun.finished_at)} · ${ultimaRun.entity ?? '—'} (${ultimaRun.status ?? '—'})` : '—'}
                  </span>
                </div>
                {onNegocios && (
                  <div className="pp-actions"><button className="pp-btn pp-primary" onClick={() => onNegocios()}>Ver todos os negócios →</button></div>
                )}
              </div>

              <UsoApi />
            </div>
          </>
        )
      )}
    </div>
  );
}

// ── Faixa de indicadores (GET /summary) ──────────────────────────────────────

/** Filtro de Negócios equivalente a cada KPI — sem correspondência, não é clicável. */
const DRILL: Record<string, Record<string, string> | undefined> = {
  ganhos:      { status: 'won' },
  valor_ganho: { status: 'won' },
  criados:     {},
  perdidos:    { status: 'lost' },
};

function FaixaIndicadores({ periodo, onNegocios }: {
  periodo: PipePeriodoId; onNegocios?: (f?: Record<string, string>) => void;
}) {
  const { data, isLoading } = useQuery<PipeSummary>({
    queryKey: [...chaves.summary, periodo],
    queryFn: ({ signal }) => apiGet<PipeSummary>('/summary', { periodo }, signal),
    refetchInterval: 120_000,
  });

  if (isLoading || !data) {
    return <div className="pp-card" style={{ maxWidth: 'none' }}><SkeletonBloco linhas={3} /></div>;
  }

  const corDe = (c: PipeSummaryKpi['cor']) =>
    c === 'ok' ? 'var(--pp-ok)' : c === 'danger' ? 'var(--pp-danger)' : c === 'primary' ? 'var(--pp-primary)' : undefined;
  // 'dias' não existe no formatador de números — vira num e a UI acrescenta o sufixo.
  const formatoDe = (f: PipeSummaryKpi['formato']): FormatoBN => (f === 'dias' ? 'num' : f);
  const e = data.estado;

  // #3 — o chip ▲/▼ compara com ALGO; qual algo muda conforme o período (janela
  // anterior, mesmo trecho do mês passado, ano a ano). Sem esta linha o usuário teria
  // de adivinhar, e a mesma seta significaria coisas diferentes em cada modo.
  const per = data.periodo;
  const tamanhosDiferem = per.dias_atual !== per.dias_anterior;

  return (
    <>
      <div className="pp-periodo-nota">
        <span><strong>{per.rotulo}</strong> · variação contra {per.comparacao}</span>
        {/* Fevereiro tem 28 dias e janeiro 31: sem este aviso, 10% a menos em
            fevereiro parece queda de desempenho quando é queda de calendário. */}
        {tamanhosDiferem && (
          <span className="pp-periodo-alerta" title="Períodos de tamanhos diferentes — a variação embute a diferença de dias.">
            <TriangleAlert size={11} aria-hidden />
            {per.dias_atual} d contra {per.dias_anterior} d
          </span>
        )}
      </div>

      <div className="pp-g12">
        {data.kpis.map((k) => {
          const drill = DRILL[k.chave];
          return (
            <BigNumber key={k.chave} className="pp-c-3"
              rotulo={k.formato === 'dias' ? `${k.rotulo} (dias)` : k.rotulo}
              valor={k.valor} anterior={k.anterior} formato={formatoDe(k.formato)}
              cor={corDe(k.cor)} serie={k.serie} inverterCor={k.inverter}
              dica={k.dica}
              onClick={drill && onNegocios ? () => onNegocios(drill) : undefined} />
          );
        })}

        {/* Foto do agora: sem variação de propósito (ver cabeçalho do arquivo). */}
        <BigNumber className="pp-c-3" rotulo="Em aberto agora" valor={e.abertos} formato="num"
          cor="var(--pp-sync)" nota={`${fmtBRL(e.valor_aberto)} em jogo`}
          dica="Situação atual da carteira — não tem período anterior para comparar."
          onClick={onNegocios ? () => onNegocios({ status: 'open' }) : undefined} />
      </div>

      <p className="pp-cc-rodape" style={{ margin: '-8px 0 16px' }}>
        Comparação com {data.periodo.dias} dias imediatamente anteriores
        ({fmtData(data.periodo.de_anterior).slice(0, 10)} a {fmtData(data.periodo.ate_anterior).slice(0, 10)}).
        “Em aberto agora” é a foto do momento e por isso não tem variação.
      </p>
    </>
  );
}

// ── Tendência (GET /metrics) ─────────────────────────────────────────────────

type Gran = 'dia' | 'semana' | 'mes';
const rotuloGran = (g: Gran) => (g === 'dia' ? 'Dia' : g === 'semana' ? 'Semana' : 'Mês');

function fmtDiaCurto(iso: string): string { const [, m, dd] = iso.split('-'); return `${dd}/${m}`; }
function fmtMesCurto(ym: string): string {
  const [y, m] = ym.split('-');
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
}
function semanaKey(iso: string): string {
  const dt = new Date(`${iso}T00:00:00`);
  const off = (dt.getDay() + 6) % 7; // segunda = 0
  dt.setDate(dt.getDate() - off);
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${mm}-${dd}`;
}
function agrupar(daily: PipeDailyMetric[], gran: Gran, campo: 'value_won' | 'deals_won'): PontoXY[] {
  if (gran === 'dia') return daily.map((x) => ({ label: fmtDiaCurto(x.date), valor: x[campo] }));
  const acc = new Map<string, number>();
  const ordem: string[] = [];
  for (const x of daily) {
    const key = gran === 'mes' ? x.date.slice(0, 7) : semanaKey(x.date);
    if (!acc.has(key)) { acc.set(key, 0); ordem.push(key); }
    acc.set(key, (acc.get(key) as number) + x[campo]);
  }
  return ordem.map((k) => ({ label: gran === 'mes' ? fmtMesCurto(k) : fmtDiaCurto(k), valor: acc.get(k) as number }));
}

function BlocoTendencia() {
  const pal = usePaleta();
  const [gran, setGran] = useState<Gran>('dia');
  const { data, isLoading } = useQuery<PipeMetrics>({
    queryKey: [...chaves.metrics, 365],
    queryFn: ({ signal }) => apiGet<PipeMetrics>('/metrics', { days: 365 }, signal),
    refetchInterval: 120_000,
  });

  const hoje = new Date().toISOString().slice(0, 10);
  const daily = useMemo(() => (data?.daily ?? []).filter((x) => x.date <= hoje), [data, hoje]);
  const pontos = useMemo(() => agrupar(daily, gran, 'value_won'), [daily, gran]);
  const totalValor = daily.reduce((a, x) => a + x.value_won, 0);
  const totalGanhos = daily.reduce((a, x) => a + x.deals_won, 0);

  // Desfecho do ano: ganhos x perdidos, os dois medidos na mesma janela da série.
  const desfecho: PontoXY[] = [
    { label: 'Ganhos', valor: daily.reduce((a, x) => a + x.deals_won, 0) },
    { label: 'Perdidos', valor: daily.reduce((a, x) => a + x.deals_lost, 0) },
  ];
  const totalDesfecho = desfecho[0].valor + desfecho[1].valor;

  return (
    <div className="pp-g12">
      <EChartCard className="pp-c-8" titulo="Ganhos ao longo do tempo" altura={300}
        subtitulo={`${fmtNum(totalGanhos)} ganhos · ${fmtBRL(totalValor)} nos últimos 12 meses`}
        carregando={isLoading} vazio={pontos.length === 0}
        vazioMsg="Sem valor ganho registrado. A série se preenche conforme negócios são marcados como ganhos."
        acoes={
          <div className="pp-seg" role="group" aria-label="Granularidade da série">
            {(['dia', 'semana', 'mes'] as Gran[]).map((g) => (
              <button key={g} type="button" className={`pp-seg-b${gran === g ? ' is-active' : ''}`}
                onClick={() => setGran(g)} aria-pressed={gran === g}>{rotuloGran(g)}</button>
            ))}
          </div>
        }
        opcao={pontos.length ? optArea(pal, pontos, { formato: 'brl', zoom: pontos.length > 30, nomeSerie: 'Valor ganho' }) : null}
        aria={`Valor ganho por ${rotuloGran(gran).toLowerCase()}`} />

      <EChartCard className="pp-c-4" titulo="Desfecho dos fechados" altura={300}
        subtitulo="Últimos 12 meses"
        carregando={isLoading} vazio={totalDesfecho === 0}
        opcao={totalDesfecho > 0 ? optDonut(pal, desfecho, {
          formato: 'num', cores: [pal.ok, pal.danger],
          rotuloCentro: 'fechados', valorCentro: fmtNum(totalDesfecho),
        }) : null}
        aria="Proporção de negócios ganhos e perdidos" />
    </div>
  );
}

// ── Operação: etapas, ciclo e o que pede atenção ─────────────────────────────

function BlocoOperacao({ onNegocios, onFunis, onAlertas }: {
  onNegocios?: (f?: Record<string, string>) => void; onFunis?: () => void; onAlertas?: () => void;
}) {
  const pal = usePaleta();

  const { data: funil, isLoading: carregandoFunil } = useQuery<PipeFunnelData>({
    queryKey: chaves.funnel,
    queryFn: ({ signal }) => apiGet<PipeFunnelData>('/funnel', undefined, signal),
    refetchInterval: 120_000,
  });
  const { data: conv, isLoading: carregandoConv } = useQuery<PipeConversion>({
    queryKey: chaves.conversion,
    queryFn: ({ signal }) => apiGet<PipeConversion>('/conversion', undefined, signal),
    refetchInterval: 120_000,
  });
  const { data: resumo } = useQuery<PipeSummary>({
    queryKey: [...chaves.summary, 30],
    queryFn: ({ signal }) => apiGet<PipeSummary>('/summary', { days: 30 }, signal),
    refetchInterval: 120_000,
  });

  // Etapas com negócio em aberto, de todos os funis (o nome do funil desambigua homônimos).
  const etapas = useMemo(() => {
    const out: { label: string; valor: number; stageId: number }[] = [];
    for (const pl of funil?.pipelines ?? []) {
      for (const s of pl.stages) {
        if (s.abertos > 0) {
          out.push({ label: (pl.name && (funil?.pipelines.length ?? 0) > 1) ? `${s.stage} · ${pl.name}` : (s.stage ?? '—'), valor: s.valor_aberto, stageId: s.stage_id });
        }
      }
    }
    return out.sort((a, b) => b.valor - a.valor).slice(0, 10);
  }, [funil]);

  const b = conv?.cycle.buckets;
  const ciclo: PontoXY[] = b ? [
    { label: 'Até 7 d', valor: b.ate_7 },
    { label: '8–30 d', valor: b.d8_30 },
    { label: '31–90 d', valor: b.d31_90 },
    { label: '+90 d', valor: b.mais_90 },
  ] : [];
  const e = resumo?.estado;

  return (
    <div className="pp-g12">
      <EChartCard className="pp-c-5" titulo="Valor em aberto por etapa" altura={270}
        subtitulo={onFunis ? 'Clique numa barra para abrir os negócios da etapa' : undefined}
        carregando={carregandoFunil} vazio={etapas.length === 0}
        vazioMsg="Nenhum negócio em aberto nas etapas ativas."
        opcao={etapas.length ? optBarras(pal, etapas, { formato: 'brl', cor: pal.sync }) : null}
        eventos={onNegocios ? {
          click: (params) => {
            const p = params as { name?: string };
            // optBarras reordena para desenhar de baixo p/ cima — casa pelo rótulo, não pelo índice.
            const alvo = etapas.find((x) => x.label === p.name);
            if (alvo) onNegocios({ status: 'open', stage_id: String(alvo.stageId) });
          },
        } : undefined}
        aria="Valor em aberto por etapa do funil" />

      <EChartCard className="pp-c-4" titulo="Ciclo de vendas" altura={270}
        subtitulo={conv?.cycle.avg_dias != null ? `Média de ${conv.cycle.avg_dias} dias entre criar e ganhar` : 'Dias entre criar e ganhar'}
        carregando={carregandoConv} vazio={(conv?.cycle.count ?? 0) === 0}
        vazioMsg="Nenhum negócio ganho com datas completas para medir o ciclo."
        opcao={ciclo.length ? optColunas(pal, ciclo, { formato: 'num', cores: [pal.ok, pal.primary, pal.warn, pal.danger] }) : null}
        aria="Distribuição do ciclo de vendas" />

      <div className="pp-card pp-c-3">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TriangleAlert size={16} style={{ color: 'var(--pp-warn)' }} aria-hidden /> Pede atenção
        </h3>
        {!e ? <SkeletonBloco linhas={3} /> : (
          <>
            <ItemAtencao rotulo="Fechamento vencido" valor={e.fechamento_vencido} cor="var(--pp-danger)"
              onClick={onAlertas} />
            <ItemAtencao rotulo="Atividades atrasadas" valor={e.atividades_atrasadas} cor="var(--pp-danger)"
              onClick={onAlertas} />
            <ItemAtencao rotulo="Sem previsão de fechamento" valor={e.sem_previsao} cor="var(--pp-warn)"
              onClick={onAlertas} />
            {onAlertas && (
              <div className="pp-actions"><button className="pp-btn" onClick={onAlertas}>Abrir alertas →</button></div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ItemAtencao({ rotulo, valor, cor, onClick }: { rotulo: string; valor: number; cor: string; onClick?: () => void }) {
  return (
    <div className="pp-row" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <span className="pp-k">{rotulo}</span>
      <span className="pp-v" style={{ color: valor > 0 ? cor : undefined }}>{fmtNum(valor)}</span>
    </div>
  );
}

// ── Rankings (GET /metrics) ──────────────────────────────────────────────────

function BlocoRankings() {
  const pal = usePaleta();
  const { data, isLoading } = useQuery<PipeMetrics>({
    queryKey: [...chaves.metrics, 365],
    queryFn: ({ signal }) => apiGet<PipeMetrics>('/metrics', { days: 365 }, signal),
    refetchInterval: 120_000,
  });

  const owners = (data?.owners ?? []).filter((o) => o.valor_ganho > 0);
  const produtos = data?.top_products ?? [];

  return (
    <div className="pp-g12">
      <EChartCard className="pp-c-6" titulo="Ranking de vendedores" altura={280}
        subtitulo="Valor ganho acumulado"
        carregando={isLoading} vazio={owners.length === 0}
        vazioMsg="Nenhum vendedor com valor ganho registrado."
        opcao={owners.length ? optBarras(pal, owners.map((o) => ({ label: o.name, valor: o.valor_ganho })), { formato: 'brl', cor: pal.ok }) : null}
        aria="Ranking de vendedores por valor ganho" />

      <div className="pp-card pp-c-6">
        <h3>Top produtos por valor</h3>
        {produtos.length === 0 ? (
          <p className="pp-placeholder">
            Nenhum produto de negócio sincronizado ainda ({fmtNum(data?.coverage?.deals_com_produtos)} de {fmtNum(data?.coverage?.deals_ativos)} negócios ativos).
            Um administrador pode puxar os produtos dos negócios na aba <strong>Configurações</strong>.
          </p>
        ) : (
          // 5 colunas num cartão de 6/12: rola a tabela, nunca a página (§23).
          <div className="pp-tabela-rolavel">
            <table className="pp-table">
              <thead><tr><th>Produto</th><th className="ta-r">Negócios</th><th className="ta-r">Qtd.</th><th className="ta-r">Valor total</th><th className="ta-r">Ganho</th></tr></thead>
              <tbody>
                {produtos.map((p) => (
                  <tr key={p.product_id ?? p.name}>
                    <td className="pp-td-title">{p.name}</td>
                    <td className="ta-r">{fmtNum(p.deals)}</td>
                    <td className="ta-r">{fmtNum(p.qty)}</td>
                    <td className="ta-r">{fmtBRL(p.valor_total)}</td>
                    <td className="ta-r">{fmtBRL(p.valor_ganho)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Uso da API (GET /metrics — hourly) ───────────────────────────────────────

function UsoApi() {
  const pal = usePaleta();
  const { data, isLoading } = useQuery<PipeMetrics>({
    queryKey: [...chaves.metrics, 365],
    queryFn: ({ signal }) => apiGet<PipeMetrics>('/metrics', { days: 365 }, signal),
    refetchInterval: 120_000,
  });

  const hourly = data?.hourly ?? [];
  const pontos: PontoXY[] = hourly.map((h) => ({ label: (h.hour ?? '').slice(5, 16), valor: h.api_calls }));
  const chamadas = hourly.reduce((a, h) => a + h.api_calls, 0);
  const erros = hourly.reduce((a, h) => a + h.api_errors, 0);

  return (
    <EChartCard className="pp-c-5" titulo="Uso da API — últimas 72h" altura={220}
      subtitulo={`${fmtNum(chamadas)} chamadas · ${fmtNum(erros)} erros`}
      carregando={isLoading} vazio={pontos.length === 0}
      vazioMsg="Sem chamadas registradas nas últimas 72 horas."
      opcao={pontos.length ? optArea(pal, pontos, { formato: 'num', cor: erros > 0 ? pal.warn : pal.primary, nomeSerie: 'Chamadas' }) : null}
      aria="Chamadas à API do Pipedrive por hora" />
  );
}
