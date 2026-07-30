// screens/Inteligencia.tsx — §50 (Insights e anomalias) e §10.1 (Diretoria)
// @version 1.0.0  @created 2026-07-30
import type { PropsTela } from '../app/App';
import { usarDados } from './usarDados';
import { Card, Carregando, Erro, Procedencia, Badge, Vazio, Icone, KpiCard } from '../components/UI';
import { SerieTemporal } from '../components/Serie';
import type { Insight } from '../services/GoogleAnalyticsService';
import { fmtInt, fmtPct } from '../lib/fmt';

const SEV: Record<string, 'erro' | 'alerta' | 'info'> = { alta: 'erro', media: 'alerta', baixa: 'info' };
const ICO: Record<string, string> = {
  anomalia: 'TriangleAlert', tendencia: 'Route', oportunidade: 'Lightbulb', atribuicao: 'Share2',
};

// ── Insights (§50) ───────────────────────────────────────────────────────
export function Insights(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => p.svc.getInsights(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando linhas={5} />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const porTipo = (t: string) => dados.insights.filter((i) => i.tipo === t).length;

  return (
    <>
      <Card
        titulo="Insights"
        nota={`${dados.insights.length} ${dados.insights.length === 1 ? 'achado' : 'achados'} no período`}
      >
        {dados.insights.length === 0 ? (
          <div className="ga-card">
            <div className="ga-card__corpo">
              {/* ⚠️ Zero insight é RESULTADO, não falha: quer dizer que nenhuma regra encontrou
                  desvio. Dizer "sem dados" aqui daria a impressão de tela quebrada. */}
              <Vazio
                titulo="Nenhum desvio encontrado no período"
                detalhe="As regras rodaram e não acharam anomalia, tendência material nem desproporção. Troque o período ou o cenário para exercitar as regras."
              />
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, fontSize: 11.5 }}>
              {(['anomalia', 'tendencia', 'oportunidade', 'atribuicao'] as const).map((t) => (
                porTipo(t) > 0 && (
                  <Badge key={t} tipo="neutro">
                    <Icone nome={ICO[t]} tam={12} /> {porTipo(t)} {t}
                  </Badge>
                )
              ))}
            </div>
            <div className="ga-atencao">
              {dados.insights.map((i: Insight) => (
                <div key={i.id} className="ga-alerta-item" data-sev={i.severidade}>
                  <div className="ga-alerta-item__faixa" />
                  <div className="ga-alerta-item__corpo">
                    <div className="ga-alerta-item__tit" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Icone nome={ICO[i.tipo] ?? 'Info'} tam={14} />
                      {i.conclusao}
                      <Badge tipo={SEV[i.severidade] ?? 'info'}>{i.severidade}</Badge>
                      <Badge tipo="neutro">confiança {i.confianca}</Badge>
                    </div>
                    {/* A evidência é o que separa insight de opinião — vem primeiro, em mono. */}
                    <div className="ga-alerta-item__lin ga-mono" style={{ color: 'var(--ga-txt)' }}>
                      {i.evidencia}
                    </div>
                    <div className="ga-alerta-item__lin"><b>Impacto:</b> {i.impacto}</div>
                    <div className="ga-alerta-item__lin"><b>Possível causa:</b> {i.causa}</div>
                    <div className="ga-alerta-item__lin"><b>Recomendação:</b> {i.recomendacao}</div>
                    <div className="ga-alerta-item__lin" style={{ color: 'var(--ga-txt-3)' }}>{i.periodo}</div>
                  </div>
                  <div className="ga-alerta-item__acao">
                    <button className="ga-btn" onClick={() => p.onIrPara(i.tela as never)} title="Abrir a tela relacionada">
                      Analisar <Icone nome="ArrowRight" tam={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* §50 pede nível de confiança; mostrar o MÉTODO é o que torna a confiança verificável. */}
      <Card titulo="Como cada regra é calculada" nota="para você poder discordar da conclusão">
        <div className="ga-card">
          <div className="ga-card__corpo">
            {dados.metodo.map((m) => (
              <div key={m.regra} style={{ padding: '6px 0', borderBottom: '1px solid var(--ga-borda)' }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{m.regra}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ga-txt-2)', lineHeight: 1.5 }}>{m.como}</div>
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: 'var(--ga-txt-3)', marginTop: 10, lineHeight: 1.55 }}>
              ⚠️ Limitação conhecida do z-score: ele não é robusto a valores extremos. Um pico muito
              forte infla o desvio padrão do período e pode mascarar um vale no mesmo intervalo —
              foi o que aconteceu no cenário "dia atípico", onde o pico aparece e o vale não.
            </div>
          </div>
        </div>
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}

// ── Diretoria (§10.1) ────────────────────────────────────────────────────
// Recorte executivo: poucos números, comparação explícita e o que exige decisão.
// ⚠️ NÃO é a Visão Geral com fonte maior: aqui só entra o que sustenta uma decisão de
// diretoria, e cada número vem com a variação contra o período anterior.
export function Diretoria(p: PropsTela) {
  const ov = usarDados(
    (s) => p.svc.getOverview(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
  const ins = usarDados(
    (s) => p.svc.getInsights(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    undefined,
  );
  const cv = usarDados(
    (s) => p.svc.getConversions(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    undefined,
  );

  if (ov.erro) return <Erro erro={ov.erro} />;
  if (ov.carregando && !ov.dados) return <Carregando linhas={4} />;
  if (!ov.dados) return <Vazio titulo="Sem dados" />;

  const chaves = ['usuarios', 'sessoes', 'conversoes', 'taxa_conversao'];
  const principais = ov.dados.kpis.filter((k) => chaves.includes(k.chave));
  const altas = (ins.dados?.insights ?? []).filter((i) => i.severidade === 'alta');
  const crm = cv.dados?.conciliacao_crm;

  return (
    <>
      <Card titulo="O essencial do período" nota="variação contra o período imediatamente anterior">
        <div className="ga-kpis">
          {principais.map((k) => <KpiCard key={k.chave} kpi={k} />)}
        </div>
      </Card>

      <Card titulo="Tráfego e conversão" nota="linha tracejada = período anterior">
        <div className="ga-card">
          <div className="ga-card__corpo">
            <SerieTemporal
              datas={ov.dados.serie.map((s) => s.data)}
              series={[
                { nome: 'Sessões', dados: ov.dados.serie.map((s) => s.sessoes), cor: '#E8710A' },
                { nome: 'Sessões (anterior)', dados: ov.dados.serie_anterior.map((s) => s.sessoes), cor: '#E8710A', tracejada: true },
                { nome: 'Conversões', dados: ov.dados.serie.map((s) => s.conversoes), cor: '#FBBC04', eixo: 1 },
              ]}
              altura={260}
            />
          </div>
        </div>
      </Card>

      {/* O que a diretoria precisa saber que está errado. */}
      <Card titulo="Exige decisão" nota={`${altas.length} ${altas.length === 1 ? 'item' : 'itens'} de severidade alta`}>
        {altas.length === 0 ? (
          <div className="ga-card"><div className="ga-card__corpo">
            <Vazio titulo="Nada de severidade alta no período" />
          </div></div>
        ) : (
          <div className="ga-atencao">
            {altas.map((i) => (
              <div key={i.id} className="ga-alerta-item" data-sev="alta">
                <div className="ga-alerta-item__faixa" />
                <div className="ga-alerta-item__corpo">
                  <div className="ga-alerta-item__tit">{i.conclusao}</div>
                  <div className="ga-alerta-item__lin"><b>Impacto:</b> {i.impacto}</div>
                  <div className="ga-alerta-item__lin"><b>Recomendação:</b> {i.recomendacao}</div>
                </div>
                <div className="ga-alerta-item__acao">
                  <button className="ga-btn" onClick={() => p.onIrPara(i.tela as never)}>
                    Analisar <Icone nome="ArrowRight" tam={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Funil comercial, com a única ponta real que existe hoje. */}
      {crm && crm.crm.disponivel && (
        <Card titulo="Do site ao CRM" nota="lado do CRM é dado real do Pipedrive">
          <div className="ga-card">
            <div className="ga-card__corpo">
              <div className="ga-funil">
                <div className="ga-funil__et">
                  <span className="ga-funil__nome">Sessões no site</span>
                  <div className="ga-funil__barra"><i style={{ width: '100%' }} /></div>
                  <span className="ga-funil__n">{fmtInt(ov.dados.kpis.find((k) => k.chave === 'sessoes')?.valor ?? 0)}</span>
                  <span className="ga-funil__perda">—</span>
                </div>
                <div className="ga-funil__et">
                  <span className="ga-funil__nome">generate_lead (GA4 · {crm.ga4_fonte})</span>
                  <div className="ga-funil__barra"><i style={{ width: '32%' }} /></div>
                  <span className="ga-funil__n">{fmtInt(crm.ga4_generate_lead)}</span>
                  <span className="ga-funil__perda">—</span>
                </div>
                <div className="ga-funil__et">
                  <span className="ga-funil__nome">Leads no CRM (real)</span>
                  <div className="ga-funil__barra"><i style={{ width: '12%' }} /></div>
                  <span className="ga-funil__n">{fmtInt(crm.crm_leads ?? 0)}</span>
                  <span className="ga-funil__perda">—</span>
                </div>
                <div className="ga-funil__et">
                  <span className="ga-funil__nome">Viraram negócio</span>
                  <div className="ga-funil__barra"><i style={{ width: '2%' }} /></div>
                  <span className="ga-funil__n">{fmtInt(crm.crm.convertidos_em_negocio ?? 0)}</span>
                  <span className="ga-funil__perda">—</span>
                </div>
              </div>
              {/* ⚠️ As larguras acima são ILUSTRATIVAS e a tela diz isso: com um lado simulado e
                  outro real, proporção entre as etapas não é informação — é desenho. */}
              <div style={{ fontSize: 11.5, color: 'var(--ga-alerta)', marginTop: 10, lineHeight: 1.55 }}>
                As larguras das barras são ilustrativas. Enquanto o GA4 for simulado e o CRM real,
                a proporção entre as duas primeiras etapas e as duas últimas não é comparável —
                por isso nenhuma taxa de passagem é exibida aqui.
              </div>
              {crm.crm.pct_manual !== null && crm.crm.pct_manual !== undefined && (
                <div style={{ fontSize: 11.5, color: 'var(--ga-txt-2)', marginTop: 6 }}>
                  {fmtPct(crm.crm.pct_manual, 1)} dos leads do CRM foram criados à mão e não passaram pelo site.
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
      <Procedencia meta={ov.meta} />
    </>
  );
}
