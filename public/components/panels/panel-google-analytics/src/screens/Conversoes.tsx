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
    { chave: 'cont', rotulo: 'Contagem', num: true, render: (l) => fmtInt(l.contagem), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.contagem, 0)) },
    { chave: 'usr', rotulo: 'Usuários', num: true, render: (l) => fmtInt(l.usuarios) },
    { chave: 'ps', rotulo: 'Por sessão', num: true, render: (l) => l.por_sessao.toFixed(4) },
    { chave: 'ult', rotulo: 'Última ocorrência', num: true, render: (l) => l.ultima_ocorrencia },
  ];

  const comAviso = dados.eventos.filter((e) => e.diagnosticos.length > 0);

  return (
    <>
      <Card titulo="Eventos recebidos" nota={`${dados.eventos.length} eventos · ${comAviso.length} com apontamento`}>
        <Grid colunas={cols} linhas={dados.eventos} chave={(l) => l.evento} />
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

      <Card titulo="Conciliação com o CRM" nota="GA4 × Pipedrive — a única integração com as duas pontas reais">
        <div className="ga-kpis" style={{ marginBottom: 10 }}>
          <KpiCard kpi={{ chave: 'ga', rotulo: 'generate_lead (GA4)', valor: c.ga4_generate_lead, unidade: 'int' }} />
          <KpiCard kpi={{ chave: 'crm', rotulo: 'Leads no CRM', valor: c.crm_leads, unidade: 'int' }} />
          <KpiCard kpi={{ chave: 'dif', rotulo: 'Diferença', valor: c.diferenca, unidade: 'int', variacao_pct: c.diferenca_pct, maior_melhor: false }} />
        </div>
        <div className="ga-card">
          <div className="ga-card__corpo">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <Badge tipo={c.status === 'conciliado' ? 'ok' : 'alerta'}>{c.status}</Badge>
              <span style={{ fontSize: 12, color: 'var(--ga-txt-2)' }}>
                {c.diferenca > 0
                  ? `${fmtInt(c.diferenca)} eventos no GA4 sem lead correspondente no CRM.`
                  : `${fmtInt(Math.abs(c.diferenca))} leads no CRM sem evento no GA4.`}
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Motivos possíveis</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--ga-txt-2)', lineHeight: 1.6 }}>
              {c.motivos_possiveis.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
            {/* §46.1: nenhuma fonte é verdade absoluta. Isto fica na tela, não escondido. */}
            <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--ga-txt-3)', borderTop: '1px solid var(--ga-borda)', paddingTop: 8 }}>
              {c.aviso}
            </div>
          </div>
        </div>
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
