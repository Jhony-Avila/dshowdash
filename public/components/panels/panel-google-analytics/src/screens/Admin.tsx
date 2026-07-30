// screens/Admin.tsx — §52 (Alertas), §13 (Propriedades), §57.1 (Quotas)
// @version 1.0.0  @created 2026-07-30
import type { PropsTela } from '../app/App';
import { usarDados } from './usarDados';
import { Card, Carregando, Erro, Procedencia, Badge, Vazio, AlertaItem, Grid } from '../components/UI';
import type { Coluna } from '../components/UI';
import { fmtDesde } from '../lib/fmt';

// ── Alertas (§52) ────────────────────────────────────────────────────────
export function Alertas(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => p.svc.getAlerts(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  type R = typeof dados.regras[number];
  const cols: Coluna<R>[] = [
    { chave: 'nome', rotulo: 'Regra', render: (l) => <b>{l.nome}</b> },
    { chave: 'metrica', rotulo: 'Métrica', render: (l) => <span className="ga-mono">{l.metrica}</span> },
    { chave: 'limite', rotulo: 'Limite', render: (l) => <span className="ga-mono">{l.limite}</span> },
    { chave: 'comp', rotulo: 'Comparação', render: (l) => l.comparacao },
    { chave: 'ativa', rotulo: 'Estado', larg: 100, render: (l) => <Badge tipo={l.ativa ? 'ok' : 'neutro'}>{l.ativa ? 'ativa' : 'inativa'}</Badge> },
  ];

  return (
    <>
      <Card titulo="Alertas abertos" nota={`${dados.alertas.length} ${dados.alertas.length === 1 ? 'alerta' : 'alertas'}`}>
        {dados.alertas.length === 0 ? (
          <div className="ga-card"><div className="ga-card__corpo"><Vazio titulo="Nenhum alerta aberto" detalhe="Nada fora do esperado no período selecionado." /></div></div>
        ) : (
          <div className="ga-atencao">
            {dados.alertas.map((a) => (
              <AlertaItem
                key={a.id}
                sev={a.severidade}
                titulo={`${a.titulo} · ${fmtDesde(a.quando)}`}
                impacto={a.impacto}
                causa={a.causa}
                recomendacao={a.recomendacao}
                onIr={() => p.onIrPara(a.tela)}
              />
            ))}
          </div>
        )}
      </Card>

      <Card titulo="Regras" nota="configuração de regra entra na Fase 3 — hoje as regras são fixas e avaliadas no backend">
        <Grid colunas={cols} linhas={dados.regras} chave={(l) => l.id} />
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}

// ── Propriedades (§13) ───────────────────────────────────────────────────
export function Propriedades(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => p.svc.getProperties(s),
    [p.recarga],
    p.onMeta,
  );
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  return (
    <>
      {dados.contas.map((c) => (
        <Card key={c.id} titulo={`Conta: ${c.nome}`} nota={c.id}>
          {c.propriedades.map((pr) => (
            <div key={pr.id} className="ga-card" style={{ marginBottom: 10 }}>
              <div className="ga-card__corpo">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <b style={{ fontSize: 13.5 }}>{pr.nome}</b>
                  <Badge tipo="marca">{pr.tipo}</Badge>
                  <span className="ga-mono" style={{ fontSize: 11.5, color: 'var(--ga-txt-3)' }}>{pr.property_id}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 10, fontSize: 12 }}>
                  <div><div style={{ fontSize: 10.5, color: 'var(--ga-txt-3)' }}>MEASUREMENT ID</div><span className="ga-mono">{pr.measurement_id}</span></div>
                  <div><div style={{ fontSize: 10.5, color: 'var(--ga-txt-3)' }}>MOEDA</div>{pr.moeda}</div>
                  <div><div style={{ fontSize: 10.5, color: 'var(--ga-txt-3)' }}>FUSO</div>{pr.timezone}</div>
                  <div><div style={{ fontSize: 10.5, color: 'var(--ga-txt-3)' }}>CRIADA EM</div>{pr.criada_em}</div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 650, marginTop: 12, marginBottom: 4, color: 'var(--ga-txt-2)' }}>STREAMS</div>
                {pr.streams.map((st) => (
                  <div key={st.id} className="ga-rt-lin">
                    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', minWidth: 0 }}>
                      <Badge tipo={st.ativo ? 'ok' : 'neutro'}>{st.tipo}</Badge>
                      <span className="ga-trunc">{st.nome}</span>
                      <span className="ga-mono" style={{ color: 'var(--ga-txt-3)', fontSize: 11 }}>{st.dominio}</span>
                    </span>
                    <span style={{ color: 'var(--ga-txt-3)', fontSize: 11.5 }}>coleta {fmtDesde(st.ultima_coleta)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      ))}

      {/* ⚠️ O aviso é parte da entrega, não rodapé decorativo: este inventário é FORMA, não
          inventário confirmado. Só a Admin API sabe quantas propriedades existem de verdade. */}
      <div className="ga-erro" style={{ borderColor: '#F59E0B55', background: '#F59E0B14' }}>
        <div className="ga-erro__t" style={{ color: 'var(--ga-alerta)' }}>Inventário não confirmado</div>
        <div className="ga-erro__d">{dados.aviso_inventario}</div>
      </div>
      <Procedencia meta={meta} />
    </>
  );
}

// ── Quotas (§57.1) ───────────────────────────────────────────────────────
export function Quotas(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarDados(
    (s) => p.svc.getQuotas(s),
    [p.recarga],
    p.onMeta,
  );
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  type C = typeof dados.categorias[number];
  const cols: Coluna<C>[] = [
    { chave: 'cat', rotulo: 'Categoria', render: (l) => <b>{l.rotulo}</b> },
    { chave: 'desc', rotulo: 'Métodos', render: (l) => <span className="ga-mono" style={{ fontSize: 11.5 }}>{l.descricao}</span> },
    { chave: 'cons', rotulo: 'Consumo', num: true, render: (l) => (l.consumo === null ? <span style={{ color: 'var(--ga-txt-3)' }}>não medido</span> : l.consumo) },
    { chave: 'lim', rotulo: 'Limite', num: true, render: (l) => (l.limite === null ? <span style={{ color: 'var(--ga-txt-3)' }}>—</span> : l.limite) },
  ];

  return (
    <>
      <Card titulo="Quotas da Data API" nota={dados.medindo ? 'medindo' : 'sem consumo real com o provedor mock'}>
        <Grid colunas={cols} linhas={dados.categorias} chave={(l) => l.categoria} />
        {dados.observacao && (
          <div style={{ fontSize: 11.5, color: 'var(--ga-txt-3)', marginTop: 8 }}>{dados.observacao}</div>
        )}
      </Card>

      <Card titulo="Política de consumo" nota="o que já está desenhado para não estourar quota">
        <div className="ga-card">
          <div className="ga-card__corpo">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--ga-txt-2)', lineHeight: 1.7 }}>
              {dados.politica.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
        </div>
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}
