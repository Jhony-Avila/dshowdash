// screens/Qualidade.tsx — qualidade de anúncios e páginas (§25).
// @version 2.0.0  @modified 2026-07-22 (Fase 2: ECharts — gauge/donut/colunas)
import { useQuery } from '@tanstack/react-query';
import { apiGet, chaves } from '../lib/api';
import type { QualityData, Period } from '../shell/types';
import { PageHeader, Loading, EmptyState, StrengthBadge, Meter } from '../components/ui';
import { EChartCard } from '../components/viz/EChartCard';
import { ChartCard } from '../components/viz/ChartCard';
import { optGauge, optDonut, optColunas } from '../components/viz/echarts-opts';
import { RadarComparativo } from '../components/viz/d3/RadarComparativo';
import { useTokensAds } from '../shell/useShellTheme';
import { moeda0, inteiro, decimal } from '../lib/format';

export function Qualidade({ accountId }: { accountId: number; period: Period }) {
  const pal = useTokensAds();
  const { data, isLoading, isError } = useQuery<QualityData>({
    queryKey: chaves.quality(accountId),
    queryFn: ({ signal }) => apiGet<QualityData>('/quality', { account_id: accountId }, signal),
  });
  if (isLoading) return <div className="ads-page"><Loading /></div>;
  if (isError || !data) return <div className="ads-page"><EmptyState icon="⚠️" title="Não foi possível carregar" /></div>;

  // Força dos anúncios: valores reais por classe (trata ausência com ?? 0).
  const strength = data.strength ?? {};
  const forca = [
    { name: 'Excelente', value: strength.EXCELLENT ?? 0, cor: pal.ok },
    { name: 'Boa', value: strength.GOOD ?? 0, cor: pal.primary },
    { name: 'Média', value: strength.AVERAGE ?? 0, cor: pal.warn },
    { name: 'Ruim', value: strength.POOR ?? 0, cor: pal.danger },
  ];
  const temForca = forca.some((f) => f.value > 0);
  const qsTotal = data.qs_buckets.baixo + data.qs_buckets.medio + data.qs_buckets.alto;

  return (
    <div className="ads-page">
      <PageHeader title="Qualidade" subtitle="Qualidade dos anúncios (força, aprovação) e das páginas (velocidade, correspondência). Base para melhorar relevância e conversão (§25)." />

      <div className="ads-grid2b">
        <EChartCard
          titulo="Quality Score médio"
          subtitulo={`${data.kw_total} palavras-chave`}
          altura={240}
          opcao={optGauge(pal, data.qs_avg, { min: 0, max: 10, titulo: 'QS médio', fmt: (v) => decimal(v, 1) })}
          aria="Quality Score médio das palavras-chave (0 a 10)"
        />
        <EChartCard
          titulo="Força dos anúncios"
          subtitulo={`${data.ads_total} anúncios`}
          altura={240}
          opcao={optDonut(pal, forca, inteiro, { titulo: 'Anúncios' })}
          vazio={!temForca}
          aria="Distribuição dos anúncios por força criativa"
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <ChartCard titulo="Perfil de qualidade" subtitulo="5 dimensões (0–100) · atual × meta" altura={320}>
          <RadarComparativo
            eixos={data.radar.eixos}
            series={[
              { nome: 'Atual', valores: data.radar.atual, cor: pal.primary },
              { nome: 'Meta', valores: data.radar.meta, cor: pal.textDim, tracejada: true },
            ]}
            max={100}
            fmt={(v) => `${v}`}
            altura={320}
          />
        </ChartCard>
      </div>

      <div style={{ marginBottom: 14 }}>
        <EChartCard
          titulo="Distribuição de Quality Score"
          subtitulo="palavras-chave por faixa"
          altura={240}
          opcao={optColunas(pal, ['Baixo (1–4)', 'Médio (5–7)', 'Alto (8–10)'],
            [data.qs_buckets.baixo, data.qs_buckets.medio, data.qs_buckets.alto], inteiro,
            { cores: [pal.danger, pal.warn, pal.ok] })}
          vazio={!qsTotal}
          aria="Distribuição de palavras-chave por faixa de Quality Score"
        />
      </div>

      {data.disapproved > 0 && <p className="ads-note" style={{ color: 'var(--ads-danger)' }}>⚠️ {data.disapproved} anúncio(s) reprovado(s) por política.</p>}

      <div className="ads-grid2b">
        <div className="ads-card">
          <div className="ads-card-tit">Anúncios a melhorar</div>
          {data.weak_ads.length === 0 ? <p className="ads-note">Nenhum anúncio fraco. 👏</p> : (
            <ul className="ads-minilist">
              {data.weak_ads.map((a, i) => (
                <li key={i} className="ads-mini">
                  <div className="ads-mini-body"><div className="ads-mini-nome">{a.label}</div><div className="ads-mini-sub">{a.group} · {moeda0(a.cost)}</div></div>
                  <StrengthBadge s={a.strength} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="ads-card">
          <div className="ads-card-tit">Páginas com atenção</div>
          {data.slow_pages.length === 0 ? <p className="ads-note">Páginas ok. 👏</p> : (
            <ul className="ads-minilist">
              {data.slow_pages.map((p, i) => (
                <li key={i} className="ads-mini">
                  <div className="ads-mini-body"><div className="ads-mini-nome">{p.url}</div><div className="ads-mini-sub">{p.match ? '' : 'baixa correspondência · '}mobile {p.mobile}/100</div></div>
                  <Meter value={p.speed} max={100} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
