// screens/Criativos.tsx — criativos com score, fadiga e retenção de vídeo
// (briefing §11–§12) + Qualidade/diagnósticos (§28).
// @version 1.0.0  @created 2026-07-28
import { useState } from 'react';
import { Clapperboard, ShieldAlert } from 'lucide-react';
import { getService } from '../services/MetaAdsService';
import { useDados } from '../components/useDados';
import { MAChart } from '../components/MAChart';
import { MAGrid, type ColunaMA } from '../components/MAGrid';
import {
  Carregando, Drawer, EstadoVazio, Secao, StatusBadge,
  fmtDec, fmtMoeda, fmtNumero, fmtPct,
} from '../components/ui';
import type { Criativo, FiltrosGlobais } from '../domain/types';

const classeScore = (s: number) => (s >= 70 ? 'ok' : s >= 45 ? 'warn' : 'bad');

// ── Criativos (§11) ─────────────────────────────────────────────────
export function Criativos({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(
    () => getService().getCriativos(filtros),
    [filtros.contaId, filtros.periodo]
  );
  const [sel, setSel] = useState<Criativo | null>(null);

  const fatigados = (dados ?? []).filter((c) => c.fadiga === 'alta').length;
  const videos = (dados ?? []).filter((c) => c.formato === 'video').length;

  const colunas: ColunaMA<Criativo>[] = [
    { id: 'nome', titulo: 'Criativo', valor: (c) => c.nome, largura: 250 },
    { id: 'formato', titulo: 'Formato', valor: (c) => c.formato, render: (c) => <StatusBadge valor={c.formato} />, alinhar: 'centro' },
    { id: 'campanha', titulo: 'Campanha', valor: (c) => c.campanha, largura: 200 },
    { id: 'dias', titulo: 'Dias ativo', valor: (c) => c.diasAtivo, alinhar: 'direita' },
    { id: 'fadiga', titulo: 'Fadiga', valor: (c) => c.fadiga, render: (c) => <StatusBadge valor={c.fadiga} />, alinhar: 'centro' },
    {
      id: 'score', titulo: 'Score', valor: (c) => c.score, alinhar: 'centro',
      render: (c) => <span className={`mads-score mads-score-${classeScore(c.score)}`}>{c.score}</span>,
    },
    { id: 'ctr', titulo: 'CTR', valor: (c) => Math.round(c.ctr * 100) / 100, render: (c) => fmtPct(c.ctr), alinhar: 'direita' },
    { id: 'freq', titulo: 'Freq.', valor: (c) => Math.round(c.frequencia * 10) / 10, render: (c) => fmtDec(c.frequencia), alinhar: 'direita' },
    { id: 'inv', titulo: 'Investimento', valor: (c) => Math.round(c.investimento), render: (c) => fmtMoeda(c.investimento), alinhar: 'direita' },
    { id: 'leads', titulo: 'Leads', valor: (c) => c.leads, alinhar: 'direita' },
  ];

  return (
    <div className="mads-tela">
      <div className="mads-chips">
        <span className="mads-chip"><strong>{dados?.length ?? 0}</strong> criativos</span>
        <span className="mads-chip"><strong>{videos}</strong> em vídeo</span>
        {fatigados > 0 && <span className="mads-chip mads-chip-bad"><strong>{fatigados}</strong> com fadiga alta</span>}
      </div>

      <Secao titulo="Criativos" sub="score explicável + fadiga — clique para ver os fatores e a retenção de vídeo">
        <MAGrid dados={dados ?? []} colunas={colunas} carregando={carregando}
          exportarNome="meta-criativos" onLinha={setSel}
          vazio={{ titulo: 'Nenhum criativo no filtro' }} />
      </Secao>

      <Drawer titulo={sel?.nome ?? ''} aberto={!!sel} onFechar={() => setSel(null)}>
        {sel && (
          <div className="mads-det">
            <div className="mads-score-hero">
              <span className={`mads-score mads-score-big mads-score-${classeScore(sel.score)}`}>{sel.score}</span>
              <div>
                <strong>Score do criativo</strong>
                <p className="mads-det-nota">Composto pelos fatores abaixo — não é uma métrica da Meta, é o diagnóstico do painel.</p>
              </div>
            </div>

            <div className="mads-fatores">
              {sel.fatoresScore.map((f) => (
                <div key={f.fator} className="mads-fator">
                  <span className={`mads-fator-imp ${f.impacto >= 0 ? 'mads-pos' : 'mads-neg'}`}>
                    {f.impacto > 0 ? `+${f.impacto}` : f.impacto}
                  </span>
                  {f.fator}
                </div>
              ))}
            </div>

            <div className="mads-det-grid">
              <div><span className="mads-det-rotulo">Formato</span><StatusBadge valor={sel.formato} /></div>
              <div><span className="mads-det-rotulo">Fadiga</span><StatusBadge valor={sel.fadiga} /></div>
              <div><span className="mads-det-rotulo">Dias ativo</span>{sel.diasAtivo}</div>
              <div><span className="mads-det-rotulo">Frequência</span>{fmtDec(sel.frequencia)}</div>
              <div><span className="mads-det-rotulo">CTR</span>{fmtPct(sel.ctr)}</div>
              <div><span className="mads-det-rotulo">Investimento</span>{fmtMoeda(sel.investimento)}</div>
              <div><span className="mads-det-rotulo">Leads / CPL</span>{fmtNumero(sel.leads)} / {sel.leads > 0 ? fmtMoeda(sel.cpl) : '—'}</div>
              <div><span className="mads-det-rotulo">Alcance</span>{fmtNumero(sel.alcance)}</div>
            </div>

            {sel.retencao && (
              <>
                <h4 className="mads-det-h"><Clapperboard size={14} aria-hidden /> Retenção do vídeo</h4>
                <p className="mads-det-nota">
                  Tempo médio assistido: <strong>{fmtDec(sel.retencao.tempoMedio)}s</strong>.
                  Queda forte antes dos 3s indica problema de gancho; queda no meio, de ritmo.
                </p>
                <MAChart altura={190} deps={[sel.id]} montar={(_e, t) => ({
                  grid: { left: 44, right: 14, top: 14, bottom: 26 },
                  tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${v}%` },
                  xAxis: {
                    type: 'category', data: ['3s', '25%', '50%', '75%', '95%', '100%'],
                    axisLine: { lineStyle: { color: t.borda } }, axisTick: { show: false },
                    axisLabel: { color: t.textoDim, fontSize: 10 },
                  },
                  yAxis: {
                    type: 'value', max: 100,
                    axisLabel: { color: t.textoDim, fontSize: 10, formatter: '{value}%' },
                    splitLine: { lineStyle: { color: t.borda, opacity: 0.5 } },
                  },
                  series: [{
                    type: 'line', smooth: 0.3, symbolSize: 6,
                    data: [sel.retencao!.p3s, sel.retencao!.p25, sel.retencao!.p50, sel.retencao!.p75, sel.retencao!.p95, sel.retencao!.p100],
                    lineStyle: { width: 2, color: t.apoio },
                    itemStyle: { color: t.apoio },
                    areaStyle: { color: t.apoio, opacity: 0.12 },
                  }],
                })} />
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ── Qualidade / diagnósticos (§28) ──────────────────────────────────
export function Qualidade({ filtros }: { filtros: FiltrosGlobais }) {
  const { dados, carregando } = useDados(async () => {
    const svc = getService();
    const [campanhas, conjuntos, anuncios] = await Promise.all([
      svc.getCampanhas(filtros), svc.getConjuntos(filtros), svc.getAnuncios(filtros),
    ]);
    return { campanhas, conjuntos, anuncios };
  }, [filtros.contaId, filtros.periodo, filtros.objetivo]);

  if (carregando || !dados) return <Carregando altura={320} />;

  const reprovados = dados.anuncios.filter((a) => a.status === 'reprovada');
  const limitados = dados.conjuntos.filter((c) => c.status === 'aprendizado_limitado');
  const abaixo = dados.anuncios.filter((a) => a.qualidade === 'abaixo_media' && a.status === 'ativa');
  const diagnosticos = dados.campanhas.filter((c) => c.diagnostico);
  const nada = reprovados.length + limitados.length + abaixo.length + diagnosticos.length === 0;

  return (
    <div className="mads-tela">
      <div className="mads-chips">
        <span className={`mads-chip${reprovados.length ? ' mads-chip-bad' : ''}`}><strong>{reprovados.length}</strong> reprovados</span>
        <span className={`mads-chip${limitados.length ? ' mads-chip-bad' : ''}`}><strong>{limitados.length}</strong> aprendizado limitado</span>
        <span className="mads-chip"><strong>{abaixo.length}</strong> qualidade abaixo da média</span>
      </div>

      {nada && <EstadoVazio titulo="Nenhum problema de qualidade ou política"
        detalhe="Anúncios aprovados, conjuntos fora do aprendizado limitado e qualidade dentro da média." />}

      {reprovados.length > 0 && (
        <Secao titulo="Anúncios reprovados" sub="sem entrega até correção — prioridade máxima">
          <div className="mads-atencao">
            {reprovados.map((a) => (
              <div key={a.id} className="mads-atencao-item mads-prio-1">
                <ShieldAlert size={15} aria-hidden />
                <span className="mads-atencao-corpo">
                  <strong>{a.nome}</strong>
                  <span>{a.campanha} — {dados.campanhas.find((c) => c.id === a.campanhaId)?.diagnostico
                    ?? 'Reprovado pela política de publicidade — revisar texto e imagem e reenviar.'}</span>
                </span>
              </div>
            ))}
          </div>
        </Secao>
      )}

      {limitados.length > 0 && (
        <Secao titulo="Conjuntos em aprendizado limitado" sub="entrega instável por falta de volume de conversões">
          <div className="mads-atencao">
            {limitados.map((c) => (
              <div key={c.id} className="mads-atencao-item mads-prio-2">
                <ShieldAlert size={15} aria-hidden />
                <span className="mads-atencao-corpo">
                  <strong>{c.nome}</strong>
                  <span>{c.campanha} — consolidar conjuntos irmãos, ampliar o público ou otimizar para um evento mais frequente.</span>
                </span>
              </div>
            ))}
          </div>
        </Secao>
      )}

      {abaixo.length > 0 && (
        <Secao titulo="Qualidade abaixo da média" sub="ranking de qualidade da Meta — custo tende a subir nesses anúncios">
          <div className="mads-atencao">
            {abaixo.map((a) => (
              <div key={a.id} className="mads-atencao-item mads-prio-3">
                <ShieldAlert size={15} aria-hidden />
                <span className="mads-atencao-corpo">
                  <strong>{a.nome}</strong>
                  <span>{a.campanha} — CTR {fmtPct(a.ctr)}. Testar novo gancho/criativo costuma ser mais eficaz do que ajustar lance.</span>
                </span>
              </div>
            ))}
          </div>
        </Secao>
      )}
    </div>
  );
}
