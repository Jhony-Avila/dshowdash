// screens/Aquisicao.tsx — §19, §20, §22 (Aquisição Geral, Canais, Campanhas)
// @version 1.0.0  @created 2026-07-30
import type { PropsTela } from '../app/App';
import { usarDados } from './usarDados';
import { Card, Carregando, Erro, Procedencia, Grid, BarraProp, Badge, Vazio, AlertaItem } from '../components/UI';
import type { Coluna } from '../components/UI';
import type { LinhaCanal, LinhaCampanha } from '../services/GoogleAnalyticsService';
import { fmtInt, fmtPct, fmtMoeda } from '../lib/fmt';

function usarAquisicao(p: PropsTela) {
  return usarDados(
    (s) => p.svc.getAcquisition(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.filtros.canal, p.filtros.campanha, p.recarga],
    p.onMeta,
  );
}

/** Célula de custo/CPA/ROAS — SEMPRE marcada quando o dado não é do GA4. */
function CelulaCusto({ valor, fonte }: { valor: number | null; fonte: string | null }) {
  if (valor === null) return <span style={{ color: 'var(--ga-txt-3)' }}>—</span>;
  return (
    <span title={fonte ? `Origem: ${fonte} — este número NÃO vem do Google Analytics` : undefined}>
      {fmtMoeda(valor)}
    </span>
  );
}

// ── Aquisição Geral ──────────────────────────────────────────────────────
export function AquisicaoGeral(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarAquisicao(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const max = Math.max(1, ...dados.por_canal.map((c) => c.sessoes));
  const cols: Coluna<LinhaCanal>[] = [
    { chave: 'canal', rotulo: 'Canal', render: (l) => <b>{l.canal}</b> },
    { chave: 'bar', rotulo: '', larg: 120, render: (l) => <BarraProp valor={l.sessoes} max={max} /> },
    { chave: 'sessoes', rotulo: 'Sessões', num: true, render: (l) => fmtInt(l.sessoes), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.sessoes, 0)) },
    { chave: 'usuarios', rotulo: 'Usuários', num: true, render: (l) => fmtInt(l.usuarios), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.usuarios, 0)) },
    { chave: 'conv', rotulo: 'Conversões', num: true, render: (l) => fmtInt(l.conversoes), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.conversoes, 0)) },
    { chave: 'tx', rotulo: 'Taxa conv.', num: true, render: (l) => fmtPct(l.taxa_conversao) },
    { chave: 'custo', rotulo: 'Custo', num: true, render: (l) => <CelulaCusto valor={l.custo} fonte={l.custo === null ? null : 'ads-mock'} /> },
    { chave: 'cpa', rotulo: 'CPA', num: true, render: (l) => <CelulaCusto valor={l.cpa} fonte={l.cpa === null ? null : 'ads-mock'} /> },
  ];

  return (
    <>
      <Card
        titulo="Canais"
        nota="clique numa linha para filtrar as outras telas"
      >
        <Grid
          colunas={cols}
          linhas={dados.por_canal}
          chave={(l) => l.canal}
          onLinha={(l) => p.onCorte({ canal: p.corte.canal === l.canal ? null : l.canal })}
          selecionada={(l) => p.corte.canal === l.canal}
        />
      </Card>

      {dados.diagnosticos.length > 0 && (
        <Card titulo="Governança de UTM" nota={`${dados.diagnosticos.length} apontamentos`}>
          <div className="ga-atencao">
            {dados.diagnosticos.map((d, i) => (
              <AlertaItem
                key={i}
                sev={d.severidade}
                titulo={`${d.problema} — ${d.campanha}`}
                impacto={`${fmtInt(d.sessoes)} sessões afetadas`}
                causa={d.detalhe}
                recomendacao="Padronizar a nomenclatura de UTM na origem (planilha de campanhas) e corrigir os links publicados."
              />
            ))}
          </div>
        </Card>
      )}
      <Procedencia meta={meta} />
    </>
  );
}

// ── Canais (comparação, §20) ─────────────────────────────────────────────
export function Canais(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarAquisicao(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const maxSes = Math.max(1, ...dados.por_canal.map((c) => c.sessoes));
  const maxTx = Math.max(0.01, ...dados.por_canal.map((c) => c.taxa_conversao));

  return (
    <>
      <Card titulo="Volume × qualidade" nota="barra = sessões · ponto = taxa de conversão">
        <div className="ga-card">
          <div className="ga-card__corpo">
            {dados.por_canal.map((c) => (
              <div key={c.canal} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 90px 90px', gap: 10, alignItems: 'center', padding: '5px 0' }}>
                <span className="ga-trunc" title={c.canal}>{c.canal}</span>
                <div className="ga-bar" style={{ height: 14 }}>
                  <i style={{ width: `${Math.max(2, (c.sessoes / maxSes) * 100)}%` }} />
                  {/* Ponto de taxa: mostra qualidade na MESMA linha do volume. Um canal com barra
                      longa e ponto à esquerda é volume sem qualidade — a leitura que a §20 quer. */}
                  <span
                    title={`Taxa de conversão: ${fmtPct(c.taxa_conversao)}`}
                    style={{
                      position: 'absolute', top: -2, width: 8, height: 18, borderRadius: 2,
                      background: 'var(--ga-roxo)',
                      left: `calc(${Math.min(99, (c.taxa_conversao / maxTx) * 100)}% - 4px)`,
                    }}
                  />
                </div>
                <span className="ga-num" style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{fmtInt(c.sessoes)}</span>
                <span className="ga-num" style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: 'var(--ga-roxo)' }}>{fmtPct(c.taxa_conversao)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}

// ── Campanhas (§22) ──────────────────────────────────────────────────────
export function Campanhas(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarAquisicao(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const cols: Coluna<LinhaCampanha>[] = [
    {
      chave: 'campanha', rotulo: 'Campanha',
      render: (l) => (
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
          <span className="ga-trunc" title={l.campanha}>{l.campanha}</span>
          {!l.utm_ok && <Badge tipo="alerta">UTM</Badge>}
        </span>
      ),
    },
    { chave: 'canal', rotulo: 'Canal', render: (l) => l.canal },
    { chave: 'om', rotulo: 'Origem / mídia', render: (l) => <span className="ga-mono">{l.origem} / {l.midia || '(none)'}</span> },
    { chave: 'ses', rotulo: 'Sessões', num: true, render: (l) => fmtInt(l.sessoes), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.sessoes, 0)) },
    { chave: 'eng', rotulo: 'Engaj.', num: true, render: (l) => fmtPct(l.taxa_engajamento, 1) },
    { chave: 'conv', rotulo: 'Conversões', num: true, render: (l) => fmtInt(l.conversoes), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.conversoes, 0)) },
    { chave: 'tx', rotulo: 'Taxa', num: true, render: (l) => fmtPct(l.taxa_conversao) },
    { chave: 'custo', rotulo: 'Custo', num: true, render: (l) => <CelulaCusto valor={l.custo} fonte={l.custo_fonte} /> },
    { chave: 'cpa', rotulo: 'CPA', num: true, render: (l) => <CelulaCusto valor={l.cpa} fonte={l.custo_fonte} /> },
    { chave: 'roas', rotulo: 'ROAS', num: true, render: (l) => (l.roas === null ? <span style={{ color: 'var(--ga-txt-3)' }}>—</span> : `${l.roas.toFixed(2)}×`) },
  ];

  return (
    <>
      <Card
        titulo="Campanhas"
        nota="custo, CPA e ROAS não vêm do GA4 — origem marcada na célula"
      >
        <Grid
          colunas={cols}
          linhas={dados.campanhas}
          chave={(l) => l.campanha + l.canal}
          onLinha={(l) => p.onCorte({ campanha: p.corte.campanha === l.campanha ? null : l.campanha })}
          selecionada={(l) => p.corte.campanha === l.campanha}
        />
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}
