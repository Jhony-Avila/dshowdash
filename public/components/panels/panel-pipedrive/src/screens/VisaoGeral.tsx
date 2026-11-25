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
import { EChartCard } from '../viz/ChartCard';
import { usePaleta } from '../viz/tema';
import { optArea, optBarras, optColunas, type PontoXY } from '../viz/opts';
import { HudKpis, BlocoGanhos, RankingVendedores, PainelDrill, type Drill } from './VisaoHud';
import type {
  PipeStatus, PipeOverview, PipeMetrics, PipeConversion,
  PipeSummary, PipeFunnelData, PipePeriodoId,
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

  // P13 (R2): UMA consulta do período para KPIs, série e desfecho; o ranking lê o MESMO período no /metrics.
  const resumoQ = useQuery<PipeSummary>({
    queryKey: [...chaves.summary, periodo],
    queryFn: ({ signal }) => apiGet<PipeSummary>('/summary', { periodo }, signal),
    refetchInterval: 120_000,
    enabled: conectado,
  });
  const [drill, setDrill] = useState<Drill | null>(null);

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
            <NotaPeriodo resumo={resumoQ.data} />

            {/* P13 · desenho R2: 8 KPIs em HUD → Ganhos | Desfecho → Ranking. Os demais blocos seguem como estavam. */}
            <HudKpis resumo={resumoQ.data} carregando={resumoQ.isLoading} falhou={!!resumoQ.error && !resumoQ.data}
              onDrill={setDrill} onDetalhes={onConfig} />
            <BlocoGanhos resumo={resumoQ.data} carregando={resumoQ.isLoading} falhou={!!resumoQ.error && !resumoQ.data} onDrill={setDrill} />
            <RankingVendedores periodo={periodo} resumo={resumoQ.data} onDrill={setDrill} />
            <div style={{ height: 15 }} />

            <BlocoOperacao periodo={periodo} onNegocios={onNegocios} onFunis={onFunis} onAlertas={onAlertas} />

            <BlocoRankings periodo={periodo} />

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

      {/* Painel lateral: o MESMO recorte do número clicado; "Abrir lista completa" leva o filtro para Negócios
          (e a volta mantém o período, que fica no estado/armazenamento local desta tela). */}
      {drill && <PainelDrill drill={drill} onClose={() => setDrill(null)}
        onLista={onNegocios ? (f) => { setDrill(null); onNegocios(f); } : undefined} />}
    </div>
  );
}

/** Período e comparação do servidor (uma fonte de datas), com o aviso de janelas de tamanhos diferentes. */
function NotaPeriodo({ resumo }: { resumo?: PipeSummary }) {
  const per = resumo?.periodo;
  if (!per) return null;
  return (
    <div className="pp-periodo-nota">
      <span><strong>{per.rotulo}</strong> · variação contra {per.comparacao}</span>
      {per.dias_atual !== per.dias_anterior && (
        <span className="pp-periodo-alerta" title="Períodos de tamanhos diferentes — a variação embute a diferença de dias.">
          <TriangleAlert size={11} aria-hidden />{per.dias_atual} d contra {per.dias_anterior} d
        </span>
      )}
    </div>
  );
}

// ── Operação: etapas, ciclo e o que pede atenção ─────────────────────────────

function BlocoOperacao({ periodo, onNegocios, onFunis, onAlertas }: {
  periodo: PipePeriodoId; onNegocios?: (f?: Record<string, string>) => void; onFunis?: () => void; onAlertas?: () => void;
}) {
  const pal = usePaleta();

  const { data: funil, isLoading: carregandoFunil } = useQuery<PipeFunnelData>({
    queryKey: chaves.funnel,
    queryFn: ({ signal }) => apiGet<PipeFunnelData>('/funnel', undefined, signal),
    refetchInterval: 120_000,
  });
  const { data: conv, isLoading: carregandoConv } = useQuery<PipeConversion>({
    // Fase 0: o ciclo segue o período GLOBAL, com a MESMA regra do KPI "Ciclo médio" (ganhos na janela).
    queryKey: [...chaves.conversion, periodo],
    queryFn: ({ signal }) => apiGet<PipeConversion>('/conversion', { periodo }, signal),
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
        subtitulo={`${conv?.cycle.avg_dias != null ? `Média de ${conv.cycle.avg_dias} dias entre criar e ganhar` : 'Dias entre criar e ganhar'}${conv?.periodo_ciclo ? ` · ganhos em ${conv.periodo_ciclo.rotulo}` : ''}`}
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

function BlocoRankings({ periodo }: { periodo: PipePeriodoId }) {
  const { data } = useQuery<PipeMetrics>({
    queryKey: [...chaves.metrics, 365, periodo],
    queryFn: ({ signal }) => apiGet<PipeMetrics>('/metrics', { days: 365, periodo }, signal),
    refetchInterval: 120_000,
  });

  const produtos = data?.top_products ?? [];

  return (
    <div className="pp-g12">
      {/* P13: o ranking de vendedores passou para o desenho R2 (RankingVendedores); Top produtos segue como estava. */}
      <div className="pp-card pp-c-12">
        <h3>Top produtos por valor</h3>
        {/* Fase 0: o ranking soma os itens de produto dos negócios (pipe_deal_products) — SÓ os negócios com produtos
            sincronizados, histórico inteiro; "Valor total" inclui abertos e perdidos, "Ganho" só os ganhos. */}
        <p className="pp-cc-rodape" style={{ margin: '0 0 8px' }}>
          Todo o histórico · só negócios com produtos lançados ({fmtNum(data?.coverage?.deals_com_produtos)} de {fmtNum(data?.coverage?.deals_ativos)} ativos) · “Valor total” inclui abertos e perdidos
        </p>
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
                    {/* um item por linha: nome com vários itens (quebras de linha, ";" ou " + ") vira uma lista */}
                    <td className="pp-td-title" style={{ whiteSpace: 'normal' }}>
                      {String(p.name ?? '').split(/\r?\n|;\s*|\s\+\s/).map((x) => x.trim()).filter(Boolean)
                        .map((x, i) => <div key={i}>{x}</div>)}
                    </td>
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
  // Fase 0: 404/410 = registro apagado no Pipedrive (tratado como exclusão local). Só mostra a separação se TODAS as
  // horas já têm a contagem (null = hora ainda não recalculada; ausência não vira zero).
  const temSep = hourly.length > 0 && hourly.every((h) => typeof h.api_errors_404 === 'number');
  const e404 = temSep ? hourly.reduce((a, h) => a + (h.api_errors_404 as number), 0) : null;

  return (
    <EChartCard className="pp-c-5" titulo="Uso da API — últimas 72h" altura={220}
      subtitulo={`${fmtNum(chamadas)} chamadas · ${fmtNum(erros)} erros${e404 !== null ? ` (${fmtNum(e404)} são 404 de registro apagado no Pipedrive, já tratados; ${fmtNum(erros - e404)} outros)` : ''}`}
      carregando={isLoading} vazio={pontos.length === 0}
      vazioMsg="Sem chamadas registradas nas últimas 72 horas."
      opcao={pontos.length ? optArea(pal, pontos, { formato: 'num', cor: erros > 0 ? pal.warn : pal.primary, nomeSerie: 'Chamadas' }) : null}
      aria="Chamadas à API do Pipedrive por hora" />
  );
}
