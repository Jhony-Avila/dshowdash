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
import { Fragment, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, TriangleAlert } from 'lucide-react';
import { apiGet, chaves, ApiError } from '../lib/api';
import { fmtNum, fmtData } from '../lib/format';
import { PageHeader } from './PageHeader';
import { EstadoErro, SkeletonBloco } from './Estados';
import { HudKpisCompactos, BlocoGanhos, RankingVendedores, PainelDrill, useTooltipNosCortes, type Drill } from './VisaoHud';
import { BlocoEtapas, BlocoCiclo, TopProdutos, PedeAtencao, UsoApiHud } from './VisaoHud2';
import type {
  PipeStatus, PipeOverview, PipeSummary, PipePeriodoId,
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

export function VisaoGeral({ status, onConfig, onNegocios, onAlertas }: VisaoGeralProps) {
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
  const raiz = useRef<HTMLDivElement>(null); useTooltipNosCortes(raiz);   // P2 (P14): texto cortado → tooltip

  const ov = data?.overview;
  const d = ov?.deals;
  const semDados = !isLoading && (d?.total ?? 0) === 0;
  const ultimaRun = data?.runs?.[0];

  return (
    <div ref={raiz}>
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
            {/* 27/11 (VERDE): a faixa de KPI no cartão compacto do DES (uma linha de 56 px; a 390 rola para os lados) */}
            <HudKpisCompactos resumo={resumoQ.data} carregando={resumoQ.isLoading} falhou={!!resumoQ.error && !resumoQ.data}
              onDrill={setDrill} onDetalhes={onConfig} />
            <BlocoGanhos resumo={resumoQ.data} carregando={resumoQ.isLoading} falhou={!!resumoQ.error && !resumoQ.data} onDrill={setDrill} />
            <RankingVendedores periodo={periodo} resumo={resumoQ.data} onDrill={setDrill} />
            <div style={{ height: 15 }} />

            {/* P17 · 2º ciclo R2: etapas | ciclo → top produtos | pede atenção → uso da API (mesmo padrão da P14) */}
            <div className="hud-charts">
              <BlocoEtapas periodo={periodo} resumo={resumoQ.data} onDrill={setDrill} />
              <BlocoCiclo periodo={periodo} resumo={resumoQ.data} onDrill={setDrill} />
            </div>
            <div className="hud-charts">
              <TopProdutos periodo={periodo} />
              <PedeAtencao periodo={periodo} resumo={resumoQ.data} onDrill={setDrill} onAlertas={onAlertas} />
            </div>
            <UsoApiHud periodo={periodo} />
            <div style={{ height: 15 }} />

            {/* Base sincronizada + uso da API */}
            <div className="pp-g12">
              <div className="pp-card pp-c-12">
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

