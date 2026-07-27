// screens/Contas.tsx — seletor/gestão de contas + visão de portfólio (§6).
// @version 2.0.0  @modified 2026-07-24 (Fase 2: resumo do portfólio + comparativo de contas)
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, chaves } from '../lib/api';
import type { AdsAccount } from '../shell/types';
import { PageHeader, Loading, EmptyState } from '../components/ui';
import { EChartCard } from '../components/viz/EChartCard';
import { optDonut, optColunas } from '../components/viz/echarts-opts';
import { useTokensAds } from '../shell/useShellTheme';
import { corDeterministica, moeda0, decimal, inteiro, dataHora } from '../lib/format';

export function Contas({ onIr }: { onIr: (id: string) => void }) {
  const pal = useTokensAds();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data, isLoading, isError } = useQuery<{ accounts: AdsAccount[] }>({
    queryKey: chaves.accounts,
    queryFn: ({ signal }) => apiGet<{ accounts: AdsAccount[] }>('/accounts', undefined, signal),
  });

  // agregações de portfólio (somam todas as contas conectadas)
  const resumo = useMemo(() => {
    const accs = data?.accounts ?? [];
    const custo = accs.reduce((s, a) => s + (a.cost || 0), 0);
    const conv = accs.reduce((s, a) => s + (a.conversions || 0), 0);
    const camps = accs.reduce((s, a) => s + (a.active_campaigns || 0), 0);
    const cpa = conv > 0 ? custo / conv : 0;
    const donut = accs.map((a) => ({ name: a.descriptive_name, value: a.cost || 0, cor: corDeterministica(a.descriptive_name) }));
    // rótulo curto p/ o eixo do gráfico de colunas (nomes completos são longos e se sobrepõem)
    const nomes = accs.map((a) => a.descriptive_name.split('—').pop()?.trim() || a.descriptive_name);
    const convs = accs.map((a) => a.conversions || 0);
    const coresConta = accs.map((a) => corDeterministica(a.descriptive_name));
    return { custo, conv, camps, cpa, donut, nomes, convs, coresConta };
  }, [data]);

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: chaves.accounts });
    qc.invalidateQueries({ queryKey: chaves.status });
  };

  const definirPadrao = async (id: number) => {
    setBusy(true);
    try { await apiWrite(`/accounts/${id}/default`, 'POST'); recarregar(); } finally { setBusy(false); }
  };
  const favoritar = async (a: AdsAccount) => {
    setBusy(true);
    try { await apiWrite(`/accounts/${a.id}/favorite`, 'POST', { favorite: !a.is_favorite }); recarregar(); } finally { setBusy(false); }
  };
  const conectar = async () => {
    setBusy(true);
    try {
      const { data: res } = await apiWrite<{ authorize_url: string }>('/accounts/connect', 'POST', { return_to: '#/panel-ads/contas' });
      if (res.authorize_url) window.location.href = res.authorize_url;
    } finally { setBusy(false); }
  };

  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar as contas" /></div>;

  const varias = data.accounts.length > 1;

  return (
    <div className="ads-page">
      <PageHeader title="Contas" subtitle="Contas do Google Ads conectadas. Alterne no seletor do topo. Marque favoritas e defina a conta padrão."
        actions={<button className="ads-btn ads-btn-primary" onClick={conectar} disabled={busy}>+ Conectar conta</button>} />

      {data.accounts.length === 0 ? (
        <EmptyState icon="🔌" title="Nenhuma conta conectada" desc="Conecte uma conta do Google Ads para começar." />
      ) : (
        <>
          {/* Resumo do portfólio: totais somando todas as contas (30 dias) */}
          <div className="ads-bignum-grid">
            <div className="ads-bignum"><div className="ads-bignum-lbl">Investimento total (30d)</div><div className="ads-bignum-val">{moeda0(resumo.custo)}</div><div className="ads-bignum-foot"><span className="ads-bignum-prev">{data.accounts.length} conta(s)</span></div></div>
            <div className="ads-bignum"><div className="ads-bignum-lbl">Conversões (30d)</div><div className="ads-bignum-val">{decimal(resumo.conv)}</div><div className="ads-bignum-foot"><span className="ads-bignum-prev">soma do portfólio</span></div></div>
            <div className="ads-bignum"><div className="ads-bignum-lbl">Campanhas ativas</div><div className="ads-bignum-val">{inteiro(resumo.camps)}</div><div className="ads-bignum-foot"><span className="ads-bignum-prev">em todas as contas</span></div></div>
            <div className="ads-bignum"><div className="ads-bignum-lbl">CPA médio</div><div className="ads-bignum-val">{resumo.conv > 0 ? moeda0(resumo.cpa) : '—'}</div><div className="ads-bignum-foot"><span className="ads-bignum-prev">custo ÷ conversões</span></div></div>
          </div>

          {/* Comparativo entre contas (aparece com 2+ contas conectadas) */}
          {varias && (
            <div className="ads-grid2" style={{ marginBottom: 16 }}>
              <EChartCard
                titulo="Participação no investimento"
                subtitulo="fatia de cada conta no custo total (30d)"
                altura={260}
                opcao={optDonut(pal, resumo.donut, moeda0, { titulo: 'Investido' })}
                aria="Participação de cada conta no investimento"
              />
              <EChartCard
                titulo="Conversões por conta"
                subtitulo="volume de conversões (30d)"
                altura={260}
                opcao={optColunas(pal, resumo.nomes, resumo.convs, decimal, { cores: resumo.coresConta })}
                aria="Conversões por conta"
              />
            </div>
          )}

          <div className="ads-acc-grid">
            {data.accounts.map((a) => (
              <div key={a.id} className={`ads-acc-card${a.is_default ? ' is-default' : ''}`}>
                <div className="ads-acc-top">
                  <span className="ads-acc-av" style={{ background: corDeterministica(a.descriptive_name) }}>{a.descriptive_name.slice(0, 1)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="ads-acc-name">{a.descriptive_name}</div>
                    <div className="ads-acc-id">{a.customer_id} · {a.currency_code} · {a.time_zone}</div>
                  </div>
                  <button className={`ads-star${a.is_favorite ? ' is-on' : ''}`} onClick={() => favoritar(a)} disabled={busy}
                    title={a.is_favorite ? 'Remover dos favoritos' : 'Favoritar'} aria-label="Favoritar">{a.is_favorite ? '★' : '☆'}</button>
                </div>
                <div className="ads-acc-stats">
                  <div><div className="ads-acc-stat-v">{a.active_campaigns}</div><div className="ads-acc-stat-l">campanhas ativas</div></div>
                  <div><div className="ads-acc-stat-v">{moeda0(a.cost)}</div><div className="ads-acc-stat-l">custo (30d)</div></div>
                  <div><div className="ads-acc-stat-v">{decimal(a.conversions)}</div><div className="ads-acc-stat-l">conversões</div></div>
                </div>
                <div className="ads-cell-sub">Última sincronização: {dataHora(a.last_synced_at)}</div>
                <div className="ads-acc-acts">
                  {a.is_default
                    ? <span className="ads-pill ads-pill-primary">Conta padrão</span>
                    : <button className="ads-btn ads-btn-sm" onClick={() => definirPadrao(a.id)} disabled={busy}>Tornar padrão</button>}
                  <button className="ads-btn ads-btn-sm ads-btn-ghost" onClick={() => onIr('visao-geral')}>Ver dashboard</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
