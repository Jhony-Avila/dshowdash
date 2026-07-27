// screens/Alertas.tsx — alertas comerciais: negócios abertos que pedem atenção.
// @version 2.0.0  @created 2026-07-21
//
// v1.0.0: lista de cartões expansíveis, um por regra.
// v2.0.0 (Fase 4): vira uma tela de triagem —
//   • painel superior de risco (negócios afetados, valor em risco, alta severidade);
//   • distribuição por severidade (rosca) e agrupamento alternável (dono/funil/etapa);
//   • filtros rápidos por severidade e por regra, com contagem no próprio chip;
//   • cartões de regra com ordenação por valor e drawer do negócio.
//
// ⚠️ Somar o `count` das regras NÃO dá o total de negócios em risco: um negócio parado
// e sem previsão dispara duas regras. Por isso o painel usa `resumo.negocios_afetados`,
// que o backend calcula sobre a UNIÃO das condições (negócios distintos).
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BellRing, ChevronDown, ChevronUp } from 'lucide-react';
import { apiGet, ApiError } from '../lib/api';
import { fmtBRL, fmtNum, fmtData } from '../lib/format';
import { DealDrawer } from './DealDrawer';
import { PageHeader } from './PageHeader';
import { EstadoErro, SkeletonBloco } from './Estados';
import { BigNumber } from './BigNumber';
import { EChartCard } from '../viz/ChartCard';
import { usePaleta } from '../viz/tema';
import { optBarras, optDonut, type PontoXY } from '../viz/opts';
import type {
  PipeStatus, PipeAlertsData, PipeAlert, PipeAlertDeal, PipeSeveridade, PipeAlertsResumo,
} from '../shell/types';

const CORES: Record<PipeSeveridade, string> = {
  high: 'var(--pp-danger)', medium: 'var(--pp-warn)', low: 'var(--pp-neutral)',
};
const ROTULO_SEV: Record<PipeSeveridade, string> = { high: 'Alta', medium: 'Média', low: 'Baixa' };
const ORDEM_SEV: PipeSeveridade[] = ['high', 'medium', 'low'];

type Agrupamento = 'por_dono' | 'por_funil' | 'por_etapa';
const AGRUPAMENTOS: { v: Agrupamento; label: string }[] = [
  { v: 'por_dono', label: 'Dono' },
  { v: 'por_funil', label: 'Funil' },
  { v: 'por_etapa', label: 'Etapa' },
];

export function Alertas({ status }: { status?: PipeStatus }) {
  const { data, isLoading, error, refetch } = useQuery<PipeAlertsData>({
    queryKey: ['pipe', 'alerts'],
    queryFn: ({ signal }) => apiGet<PipeAlertsData>('/alerts', undefined, signal),
    enabled: status?.status === 'connected',
    refetchInterval: 120_000,
  });

  const [sevAtiva, setSevAtiva] = useState<PipeSeveridade | null>(null);
  const [regraAtiva, setRegraAtiva] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Record<string, boolean>>({});
  const [dealAberto, setDealAberto] = useState<number | null>(null);

  const alerts = useMemo(() => data?.alerts ?? [], [data]);
  const visiveis = useMemo(() => alerts.filter((a) =>
    (sevAtiva === null || a.severity === sevAtiva) && (regraAtiva === null || a.key === regraAtiva)
  ), [alerts, sevAtiva, regraAtiva]);

  if (status?.status !== 'connected') {
    return (
      <div>
        <PageHeader Icon={BellRing} titulo="Alertas comerciais" descricao="Negócios em aberto que pedem atenção." />
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro titulo="Integração não conectada"
            detalhe="Conecte o token do Pipedrive na tela de Configurações para ver estes dados." />
        </div>
      </div>
    );
  }

  const estaAberto = (a: PipeAlert) => aberto[a.key] ?? (a.severity === 'high');
  const limparFiltros = () => { setSevAtiva(null); setRegraAtiva(null); };

  return (
    <div>
      <PageHeader Icon={BellRing} titulo="Alertas comerciais"
        descricao={`Negócios em aberto que pedem atenção${data ? ` · ${fmtNum(data.total_abertos)} abertos no total` : ''}.`} />

      {error instanceof ApiError ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro detalhe={error.ehAuth ? 'Sua sessão expirou. Recarregue a página e entre novamente.' : 'Falha ao consultar a base local.'}
            onRetry={error.ehAuth ? undefined : () => void refetch()} />
        </div>
      ) : isLoading ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}><SkeletonBloco linhas={6} /></div>
      ) : (
        <>
          {data?.resumo && <PainelRisco resumo={data.resumo} totalAbertos={data.total_abertos} />}

          {/* Filtros rápidos: severidade primeiro (triagem), regra depois (recorte fino) */}
          <div className="pp-quick" style={{ marginBottom: 10 }}>
            <button type="button" className={`pp-quick-b${sevAtiva === null ? ' is-active' : ''}`}
              onClick={() => setSevAtiva(null)}>Todas as severidades</button>
            {ORDEM_SEV.map((s) => {
              const regras = alerts.filter((a) => a.severity === s);
              if (regras.length === 0) return null;
              return (
                <button key={s} type="button" className={`pp-quick-b${sevAtiva === s ? ' is-active' : ''}`}
                  onClick={() => { setSevAtiva(sevAtiva === s ? null : s); setRegraAtiva(null); }}
                  aria-pressed={sevAtiva === s}>
                  <span className="pp-dot" style={{ background: CORES[s] }} />
                  {ROTULO_SEV[s]}<span className="n">{regras.length}</span>
                </button>
              );
            })}
          </div>
          <div className="pp-quick" style={{ marginBottom: 18 }}>
            {alerts.filter((a) => sevAtiva === null || a.severity === sevAtiva).map((a) => (
              <button key={a.key} type="button" className={`pp-quick-b${regraAtiva === a.key ? ' is-active' : ''}`}
                onClick={() => setRegraAtiva(regraAtiva === a.key ? null : a.key)} aria-pressed={regraAtiva === a.key}>
                {a.label}<span className="n">{fmtNum(a.count)}</span>
              </button>
            ))}
            {(sevAtiva !== null || regraAtiva !== null) && (
              <button type="button" className="pp-quick-b" onClick={limparFiltros}>Limpar filtros ✕</button>
            )}
          </div>

          {visiveis.length === 0 ? (
            <div className="pp-card"><p className="pp-placeholder">Nenhum alerta com este recorte.</p></div>
          ) : visiveis.map((a) => (
            <div className="pp-card pp-alert" key={a.key} style={{ borderLeftColor: CORES[a.severity], maxWidth: 'none' }}>
              <div className="pp-alert-head" onClick={() => setAberto((s) => ({ ...s, [a.key]: !estaAberto(a) }))}
                role="button" tabIndex={0} aria-expanded={estaAberto(a)}
                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setAberto((s) => ({ ...s, [a.key]: !estaAberto(a) })); } }}>
                <span className="pp-dot" style={{ background: CORES[a.severity], width: 10, height: 10, borderRadius: '50%' }} />
                <span className="lbl">{a.label}</span>
                <span className="cnt">
                  {fmtNum(a.count)} negócios · {fmtBRL(a.valor)}
                  {estaAberto(a) ? <ChevronUp size={14} style={{ verticalAlign: -2, marginLeft: 6 }} aria-hidden />
                                 : <ChevronDown size={14} style={{ verticalAlign: -2, marginLeft: 6 }} aria-hidden />}
                </span>
              </div>
              <p className="pp-alert-desc">{a.description}</p>
              {estaAberto(a) && (
                a.deals.length === 0 ? (
                  <p className="pp-placeholder" style={{ marginTop: 10 }}>Nenhum negócio neste alerta. 🎉</p>
                ) : (
                  <div className="pp-alert-deals">
                    {a.deals.map((d) => (
                      <div className="pp-alert-deal" key={d.id} onClick={() => setDealAberto(d.id)}
                        role="button" tabIndex={0}
                        onKeyDown={(ev) => { if (ev.key === 'Enter') setDealAberto(d.id); }}>
                        <div style={{ minWidth: 0 }}>
                          <div className="dt" title={d.title ?? ''}>{d.title ?? '—'}</div>
                          <div className="dm">{contexto(a.key, d)}</div>
                        </div>
                        <div className="dv">{d.value != null ? fmtBRL(d.value, d.currency ?? 'BRL') : '—'}</div>
                      </div>
                    ))}
                    {a.count > a.deals.length && (
                      <div className="pp-kan-more">
                        + {fmtNum(a.count - a.deals.length)} não exibidos (a lista mostra os de maior valor)
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          ))}
        </>
      )}

      {dealAberto != null && <DealDrawer dealId={dealAberto} onClose={() => setDealAberto(null)} />}
    </div>
  );
}

// ── Painel de risco ──────────────────────────────────────────────────────────

function PainelRisco({ resumo, totalAbertos }: { resumo: PipeAlertsResumo; totalAbertos: number }) {
  const pal = usePaleta();
  const [agrup, setAgrup] = useState<Agrupamento>('por_dono');

  const alta = resumo.por_severidade.find((s) => s.severity === 'high');
  const pctAfetados = totalAbertos > 0 ? Math.round((resumo.negocios_afetados / totalAbertos) * 100) : null;

  // O ECharts desenha em canvas: precisa da cor RESOLVIDA, não do `var(--pp-*)` do CSS.
  // `pal.sev` já mapeia high/medium/low para os tokens do tema corrente.
  const comDados = resumo.por_severidade.filter((s) => s.count > 0);
  const donut: PontoXY[] = comDados.map((s) => ({ label: ROTULO_SEV[s.severity], valor: s.count }));
  const coresDonut = comDados.map((s) => pal.sev[s.severity]);

  const grupos = resumo[agrup] ?? [];
  const barras: PontoXY[] = grupos.slice(0, 10).map((g) => ({ label: g.nome, valor: g.count }));

  return (
    <>
      <div className="pp-g12">
        <BigNumber className="pp-c-3" rotulo="Negócios com alerta" valor={resumo.negocios_afetados}
          formato="num" cor="var(--pp-warn)"
          nota={pctAfetados != null ? `${pctAfetados}% da carteira aberta` : undefined}
          dica="Negócios distintos que disparam pelo menos uma regra — somar as regras contaria o mesmo negócio duas vezes." />
        <BigNumber className="pp-c-3" rotulo="Valor em risco" valor={resumo.valor_em_risco}
          formato="brl" cor="var(--pp-danger)"
          nota="Soma sem repetir negócio"
          dica="Soma do valor dos negócios distintos com pelo menos um alerta." />
        <BigNumber className="pp-c-3" rotulo="Alta severidade" valor={alta?.count ?? 0}
          formato="num" cor="var(--pp-danger)"
          nota={alta ? `${fmtBRL(alta.valor)} envolvidos` : undefined}
          dica="Negócios com atividade atrasada ou fechamento vencido." />
        <BigNumber className="pp-c-3" rotulo="Carteira em aberto" valor={totalAbertos}
          formato="num" cor="var(--pp-sync)"
          nota="Base de comparação"
          dica="Total de negócios em aberto na base sincronizada." />
      </div>

      <div className="pp-g12">
        <EChartCard className="pp-c-4" titulo="Negócios por severidade" altura={250}
          subtitulo="Um negócio pode aparecer em mais de uma severidade"
          vazio={donut.length === 0}
          opcao={donut.length ? optDonut(pal, donut, {
            formato: 'num', cores: coresDonut,
            rotuloCentro: 'com alerta', valorCentro: fmtNum(resumo.negocios_afetados),
          }) : null}
          aria="Distribuição de negócios por severidade de alerta" />

        <EChartCard className="pp-c-8" titulo="Onde estão os alertas" altura={250}
          subtitulo="Negócios distintos com pelo menos um alerta"
          vazio={barras.length === 0}
          acoes={
            <div className="pp-seg" role="group" aria-label="Agrupar alertas por">
              {AGRUPAMENTOS.map((g) => (
                <button key={g.v} type="button" className={`pp-seg-b${agrup === g.v ? ' is-active' : ''}`}
                  onClick={() => setAgrup(g.v)} aria-pressed={agrup === g.v}>{g.label}</button>
              ))}
            </div>
          }
          opcao={barras.length ? optBarras(pal, barras, { formato: 'num', cor: pal.warn, larguraRotulo: 170 }) : null}
          aria="Alertas agrupados" />
      </div>
    </>
  );
}

function contexto(alertKey: string, d: PipeAlertDeal): string {
  const partes: string[] = [];
  if (d.org) partes.push(d.org);
  else if (d.owner) partes.push(d.owner);
  if (d.stage) partes.push(d.stage.trim());
  if (alertKey === 'fechamento_vencido' && d.expected_close_date) {
    partes.push(`previsão ${fmtData(d.expected_close_date).slice(0, 10)}`);
  } else if (alertKey === 'parado' && d.update_time) {
    partes.push(`atualizado ${fmtData(d.update_time)}`);
  }
  return partes.length ? partes.join(' · ') : (d.owner ?? '—');
}
