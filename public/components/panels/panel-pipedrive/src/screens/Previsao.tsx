// screens/Previsao.tsx — previsao de fechamento / forecast (backlog #29).
// @version 1.0.0  @created 2026-07-22
//
// Le GET /api/pipedrive/forecast (base local; nao chama a API do Pipedrive).
// Valor ponderado = valor do negocio x probabilidade efetiva (prob. do negocio ou, na
// ausencia, a probabilidade padrao da etapa). So negocios ABERTOS. Seletor de funil.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves, ApiError } from '../lib/api';
import { fmtBRL, fmtNum } from '../lib/format';
import { PageHeader } from './PageHeader';
import { EstadoErro, SkeletonBloco } from './Estados';
import { TrendingUp } from 'lucide-react';
import type { PipeStatus, PipeForecast, PipeForecastMonth } from '../shell/types';

function fmtMes(m: string | null): string {
  if (!m) return 'Sem previsão';
  const [y, mo] = m.split('-');
  const d = new Date(Number(y), Number(mo) - 1, 1);
  if (isNaN(d.getTime())) return m;
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
}

export function Previsao({ status }: { status?: PipeStatus }) {
  const [pipeline, setPipeline] = useState<number | 'all'>('all');
  const conectado = status?.status === 'connected';

  const { data, isLoading, error, refetch } = useQuery<PipeForecast>({
    queryKey: [...chaves.forecast, pipeline],
    queryFn: ({ signal }) => apiGet<PipeForecast>('/forecast', { pipeline_id: pipeline === 'all' ? undefined : pipeline }, signal),
    enabled: conectado,
    refetchInterval: 120_000,
  });

  if (!conectado) {
    return (
      <div>
        <h1 className="pp-h1">Previsão</h1>
        <div className="pp-card" style={{ maxWidth: 'none' }}><EstadoErro titulo="Integração não conectada" detalhe="Conecte o token do Pipedrive na tela de Configurações para ver estes dados." /></div>
      </div>
    );
  }

  const t = data?.totals;
  const pctPond = t && t.valor_total > 0 ? Math.round((t.valor_ponderado / t.valor_total) * 100) : 0;
  const stages = data?.by_stage ?? [];
  const months = data?.by_month ?? [];
  const pipelines = data?.pipelines ?? [];
  const semDados = !isLoading && (t?.open_count ?? 0) === 0;

  return (
    <div>
      <PageHeader Icon={TrendingUp} titulo="Previsão de fechamento"
        descricao="Negócios em aberto ponderados pela probabilidade (do negócio ou padrão da etapa)." />

      <div className="pp-filtros">
        <label className="pp-label" style={{ margin: 0 }}>Funil</label>
        <select
          className="pp-select"
          value={pipeline}
          onChange={(e) => setPipeline(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">Todos os funis</option>
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>{p.name ?? `#${p.id}`}</option>
          ))}
        </select>
      </div>

      {error instanceof ApiError ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro detalhe={error.ehAuth ? 'Sua sessão expirou. Recarregue a página e entre novamente.' : 'Falha ao consultar a base local.'}
            onRetry={error.ehAuth ? undefined : () => void refetch()} />
        </div>
      ) : isLoading ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}><SkeletonBloco linhas={5} /></div>
      ) : semDados ? (
        <div className="pp-card"><p className="pp-placeholder">Nenhum negócio em aberto neste funil.</p></div>
      ) : (
        <>
          {/* Big numbers */}
          <div className="pp-tiles">
            <Tile n={fmtNum(t?.open_count)} l="Negócios em aberto" />
            <Tile n={fmtBRL(t?.valor_total)} l="Valor total" cor="var(--pp-sync)" />
            <Tile n={fmtBRL(t?.valor_ponderado)} l="Previsão ponderada" cor="var(--pp-ok)" />
            <Tile n={`${pctPond}%`} l="Fator de conversão previsto" />
          </div>

          <p className="pp-note" style={{ maxWidth: 760 }}>
            A <strong>previsão ponderada</strong> multiplica o valor de cada negócio pela sua probabilidade.
            A barra clara mostra o valor total em aberto; a barra cheia, a parcela ponderada.
          </p>

          {/* Por etapa */}
          <div className="pp-card" style={{ maxWidth: 760 }}>
            <h3>Por etapa</h3>
            {stages.length === 0 ? (
              <p className="pp-placeholder">Sem etapas com negócios em aberto.</p>
            ) : (
              <BarrasForecast
                itens={stages.map((s) => ({
                  chave: `${s.stage_id}`,
                  rotulo: `${s.stage ?? '—'}${data && data.pipeline_id == null && s.pipeline ? ` · ${s.pipeline}` : ''}`,
                  sufixo: `${s.prob_efetiva}%`,
                  total: s.valor_total,
                  ponderado: s.valor_ponderado,
                  count: s.count,
                }))}
              />
            )}
          </div>

          {/* Por mes */}
          <div className="pp-card" style={{ maxWidth: 760 }}>
            <h3>Por mês de fechamento previsto</h3>
            {months.length === 0 ? (
              <p className="pp-placeholder">Sem negócios em aberto.</p>
            ) : (
              <BarrasForecast
                itens={months.map((m: PipeForecastMonth) => ({
                  chave: m.month ?? 'sem',
                  rotulo: fmtMes(m.month),
                  total: m.valor_total,
                  ponderado: m.valor_ponderado,
                  count: m.count,
                  dim: m.month == null,
                }))}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface BarraItem {
  chave: string; rotulo: string; sufixo?: string; total: number; ponderado: number; count: number; dim?: boolean;
}

function BarrasForecast({ itens }: { itens: BarraItem[] }) {
  const maxTotal = Math.max(1, ...itens.map((i) => i.total));
  return (
    <div className="pp-funil">
      {itens.map((it) => (
        <div key={it.chave} className="pp-funil-row">
          <span className="pp-funil-lbl" title={it.rotulo} style={it.dim ? { fontStyle: 'italic' } : undefined}>
            {it.rotulo}{it.sufixo ? ` · ${it.sufixo}` : ''}
          </span>
          <span className="pp-fc-bar">
            <span className="t" style={{ width: `${Math.max(2, (it.total / maxTotal) * 100)}%` }} />
            <span className="p" style={{ width: `${Math.max(1, (it.ponderado / maxTotal) * 100)}%` }} />
          </span>
          <span className="pp-funil-val">
            {fmtBRL(it.ponderado)}
            <span style={{ color: 'var(--pp-text-dim)', fontWeight: 400 }}> / {fmtBRL(it.total)} · {it.count}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Tile({ n, l, cor }: { n: string; l: string; cor?: string }) {
  return (
    <div className="pp-tile">
      <span className="pp-tile-n" style={cor ? { color: cor } : undefined}>{n}</span>
      <span className="pp-tile-l">{l}</span>
    </div>
  );
}
