// screens/Conversoes.tsx — §28 (Eventos), §29/§32 (Eventos importantes) e §30/§31 (Funis)
// @version 1.0.0  @created 2026-07-30
import type { PropsTela } from '../app/App';
import { usarDados } from './usarDados';
import { Card, Carregando, Erro, Procedencia, Grid, Badge, Vazio, Icone, KpiCard } from '../components/UI';
import type { Coluna } from '../components/UI';
import type { LinhaEvento } from '../services/GoogleAnalyticsService';
import { fmtInt, fmtPct, fmtSegundos } from '../lib/fmt';

const CLASSE_BADGE: Record<string, 'ok' | 'alerta' | 'erro' | 'info' | 'neutro' | 'marca'> = {
  automatico: 'neutro', recomendado: 'ok', customizado: 'info', 'server-side': 'marca', legado: 'alerta',
};

// ── Eventos (§28) ────────────────────────────────────────────────────────
export function Eventos(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => p.svc.getEvents(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const cols: Coluna<LinhaEvento>[] = [
    {
      chave: 'evento', rotulo: 'Evento',
      csv: (l) => l.evento,
      render: (l) => (
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
          <span className="ga-mono ga-trunc">{l.evento}</span>
          {l.importante && <Badge tipo="marca">importante</Badge>}
          {l.diagnosticos.some((d) => d.nivel === 'aviso') && (
            <span title={l.diagnosticos.filter((d) => d.nivel === 'aviso').map((d) => d.texto).join(' ')}>
              <Badge tipo="alerta">grafia</Badge>
            </span>
          )}
          {l.diagnosticos.some((d) => d.nivel === 'erro') && <Badge tipo="erro">sem registros</Badge>}
        </span>
      ),
    },
    { chave: 'classe', rotulo: 'Classe', larg: 120, render: (l) => <Badge tipo={CLASSE_BADGE[l.classe] ?? 'neutro'}>{l.classe}</Badge> },
    { chave: 'cont', rotulo: 'Contagem', num: true, render: (l) => fmtInt(l.contagem), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.contagem, 0)), csv: (l) => l.contagem },
    { chave: 'usr', rotulo: 'Usuários', num: true, render: (l) => fmtInt(l.usuarios), csv: (l) => l.usuarios },
    { chave: 'ps', rotulo: 'Por sessão', num: true, render: (l) => l.por_sessao.toFixed(4), csv: (l) => l.por_sessao },
    { chave: 'ult', rotulo: 'Última ocorrência', num: true, render: (l) => l.ultima_ocorrencia },
  ];

  const comAviso = dados.eventos.filter((e) => e.diagnosticos.length > 0);

  return (
    <>
      <Card titulo="Eventos recebidos" nota={`${dados.eventos.length} eventos · ${comAviso.length} com apontamento`}>
        <Grid colunas={cols} linhas={dados.eventos} chave={(l) => l.evento} exportarComo="ga-eventos" />
      </Card>

      {dados.ausentes.length > 0 && (
        <Card titulo="Eventos esperados e ausentes" nota={`${dados.ausentes.length} eventos`}>
          <div className="ga-card">
            <div className="ga-card__corpo">
              <div style={{ fontSize: 12, color: 'var(--ga-txt-2)', marginBottom: 8, lineHeight: 1.55 }}>
                Estes são eventos recomendados pelo Google que <b>não existem</b> no container.
                Enquanto não forem instrumentados, as telas que dependem deles ficam sem base.
              </div>
              {dados.ausentes.map((a) => (
                <div key={a.evento} className="ga-rt-lin">
                  <span className="ga-mono">{a.evento}</span>
                  <Badge tipo="erro">ausente</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {comAviso.length > 0 && (
        <Card titulo="Diagnóstico de instrumentação">
          <div className="ga-card">
            <div className="ga-card__corpo">
              {comAviso.map((e) => (
                <div key={e.evento} style={{ padding: '6px 0', borderBottom: '1px solid var(--ga-borda)' }}>
                  <div className="ga-mono" style={{ fontSize: 12 }}>{e.evento}</div>
                  {e.diagnosticos.map((d, i) => (
                    <div key={i} style={{ fontSize: 11.5, color: 'var(--ga-txt-2)', display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 3 }}>
                      <Icone nome={d.nivel === 'erro' ? 'CircleAlert' : d.nivel === 'aviso' ? 'TriangleAlert' : 'Info'} tam={13} />
                      <span>{d.texto}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
      <Procedencia meta={meta} />
    </>
  );
}

// ── Eventos importantes + conciliação com CRM (§29, §32) ─────────────────
export function Conversoes(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => p.svc.getConversions(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const c = dados.conciliacao_crm;
  const cols: Coluna<LinhaEvento>[] = [
    { chave: 'evento', rotulo: 'Evento importante', render: (l) => <span className="ga-mono">{l.evento}</span> },
    { chave: 'cont', rotulo: 'Conversões', num: true, render: (l) => fmtInt(l.contagem), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.contagem, 0)) },
    { chave: 'usr', rotulo: 'Usuários', num: true, render: (l) => fmtInt(l.usuarios) },
    { chave: 'tx', rotulo: 'Taxa por sessão', num: true, render: (l) => fmtPct(l.taxa ?? 0, 2) },
    { chave: 'valor', rotulo: 'Valor', num: true, render: (l) => (l.valor === null || l.valor === undefined ? <span style={{ color: 'var(--ga-txt-3)' }}>—</span> : fmtInt(l.valor)) },
  ];

  return (
    <>
      <Card titulo="Eventos importantes">
        <Grid colunas={cols} linhas={dados.importantes} chave={(l) => l.evento} />
      </Card>

      <Card
        titulo="Conciliação com o CRM"
        nota="GA4 × Pipedrive — a única conciliação com uma ponta real hoje"
      >
        <div className="ga-kpis" style={{ marginBottom: 10 }}>
          <KpiCard kpi={{ chave: 'ga', rotulo: `generate_lead (GA4 · ${c.ga4_fonte})`, valor: c.ga4_generate_lead, unidade: 'int' }} />
          {c.crm.disponivel ? (
            <KpiCard kpi={{ chave: 'crm', rotulo: 'Leads no CRM (Pipedrive · real)', valor: c.crm_leads ?? 0, unidade: 'int' }} />
          ) : null}
          {c.crm.disponivel && (
            <KpiCard kpi={{ chave: 'conv', rotulo: 'Viraram negócio', valor: c.crm.convertidos_em_negocio ?? 0, unidade: 'int' }} />
          )}
          {/* ⚠️ O card de diferença SÓ aparece quando os dois lados são reais. Ver abaixo. */}
          {c.comparavel && (
            <KpiCard kpi={{ chave: 'dif', rotulo: 'Diferença', valor: c.diferenca ?? 0, unidade: 'int', variacao_pct: c.diferenca_pct, maior_melhor: false }} />
          )}
        </div>

        {/* ⚠️ ESTE BLOCO É O PONTO DA TELA. Com o GA4 em mock, comparar os dois lados daria
            "−97%" (1.426 simulados contra 43 reais) — um alarme que não significa nada. Em vez
            de exibir esse número, a tela diz por que a comparação está suspensa. */}
        {!c.comparavel && (
          <div className="ga-erro" style={{ borderColor: '#F59E0B55', background: '#F59E0B14', marginBottom: 10 }}>
            <div className="ga-erro__t" style={{ color: 'var(--ga-alerta)' }}>
              <Icone nome="TriangleAlert" tam={14} /> Comparação suspensa
            </div>
            <div className="ga-erro__d">{c.motivo_nao_comparavel}</div>
          </div>
        )}

        {c.crm.disponivel ? (
          <div className="ga-card">
            <div className="ga-card__corpo">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                <Badge tipo={c.comparavel ? (c.status === 'conciliado' ? 'ok' : 'alerta') : 'neutro'}>{c.status}</Badge>
                <Badge tipo="info">CRM: {c.crm.banco}</Badge>
                <span style={{ fontSize: 11.5, color: 'var(--ga-txt-3)' }}>
                  {c.crm.por_dia.length} dias com lead no período
                </span>
              </div>

              {/* Achado de negócio, não detalhe técnico. */}
              {c.crm.pct_manual !== null && c.crm.pct_manual !== undefined && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>De onde vêm os leads do CRM</div>
                  {(c.crm.por_origem ?? []).map((o) => (
                    <div key={o.origem} className="ga-rt-lin">
                      <span>{o.rotulo}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtInt(o.total)}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 11.5, color: 'var(--ga-txt-2)', marginTop: 8, lineHeight: 1.55 }}>
                    <b style={{ color: 'var(--ga-txt)' }}>{fmtPct(c.crm.pct_manual, 1)}</b> dos leads foram criados à mão
                    no CRM e <b>nunca passaram pelo site</b> — nenhum evento de GA4 corresponde a eles.
                    É a primeira coisa a olhar antes de suspeitar da instrumentação.
                  </div>
                </div>
              )}

              {c.crm.convertidos_em_negocio === 0 && (c.crm.total ?? 0) > 0 && (
                <div style={{ fontSize: 11.5, color: 'var(--ga-alerta)', marginBottom: 10 }}>
                  Nenhum dos {fmtInt(c.crm.total ?? 0)} leads do período virou negócio ainda.
                </div>
              )}

              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Motivos possíveis para a diferença</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--ga-txt-2)', lineHeight: 1.6 }}>
                {c.motivos_possiveis.map((m, i) => <li key={i}>{m}</li>)}
              </ul>

              <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--ga-txt-3)', borderTop: '1px solid var(--ga-borda)', paddingTop: 8 }}>
                {c.aviso}
                {c.crm.aviso_origem && <><br />{c.crm.aviso_origem}</>}
              </div>
            </div>
          </div>
        ) : (
          <Erro erro={{ message: c.crm.motivo ?? 'O CRM não respondeu.' }} />
        )}
      </Card>

      <Procedencia meta={meta} />
    </>
  );
}

// ── Funis (§30, §31) ─────────────────────────────────────────────────────
export function Funis(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => p.svc.getFunnel(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const topo = dados.etapas[0]?.usuarios ?? 1;

  return (
    <>
      <Card titulo="Funis disponíveis">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {dados.funis_disponiveis.map((f) => (
            <button
              key={f.id}
              className={`ga-btn${f.id === dados.funil_ativo ? ' ga-btn--primario' : ''}`}
              disabled={!f.disponivel}
              title={f.motivo ?? f.nome}
            >
              {f.nome}{!f.disponivel && ' — indisponível'}
            </button>
          ))}
        </div>
        {dados.funis_disponiveis.some((f) => !f.disponivel) && (
          <div style={{ fontSize: 11.5, color: 'var(--ga-txt-3)', marginTop: 8 }}>
            {dados.funis_disponiveis.filter((f) => !f.disponivel).map((f) => `${f.nome}: ${f.motivo}`).join(' · ')}
          </div>
        )}
      </Card>

      <Card titulo="Funil de lead" nota="da sessão até o lead no CRM">
        <div className="ga-card">
          <div className="ga-card__corpo">
            <div className="ga-funil">
              {dados.etapas.map((e, i) => (
                <div key={e.etapa} className="ga-funil__et">
                  <span className="ga-funil__nome" title={`${e.etapa} (${e.evento})`}>
                    {i + 1}. {e.etapa}
                    <span className="ga-mono" style={{ color: 'var(--ga-txt-3)', marginLeft: 6, fontSize: 10.5 }}>{e.evento}</span>
                  </span>
                  <div className="ga-funil__barra" title={`${fmtPct(e.taxa_do_topo)} do topo`}>
                    <i style={{ width: `${Math.max(0.6, (e.usuarios / topo) * 100)}%` }} />
                  </div>
                  <span className="ga-funil__n">{fmtInt(e.usuarios)}</span>
                  <span className="ga-funil__perda" title="Abandono em relação à etapa anterior">
                    {i === 0 ? '—' : `-${fmtInt(e.abandono)}`}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, borderTop: '1px solid var(--ga-borda)', paddingTop: 8, fontSize: 11.5, color: 'var(--ga-txt-2)' }}>
              {dados.etapas.slice(1).map((e) => (
                <span key={e.etapa} style={{ marginRight: 14 }}>
                  {e.etapa}: <b style={{ color: 'var(--ga-txt)' }}>{fmtPct(e.taxa_da_anterior, 1)}</b> da anterior
                  {e.tempo_medio_seg > 0 && <span style={{ color: 'var(--ga-txt-3)' }}> · {fmtSegundos(e.tempo_medio_seg)}</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}
