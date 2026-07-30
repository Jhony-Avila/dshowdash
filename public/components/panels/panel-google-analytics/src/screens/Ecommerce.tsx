// screens/Ecommerce.tsx — §33 (E-commerce), §34 (Produtos), §35 (Checkout)
// @version 1.0.0  @created 2026-07-30
//
// ⚠️ ESTA TELA NASCE VAZIA NO CENÁRIO PADRÃO, E ISSO É O COMPORTAMENTO CORRETO.
// A auditoria da Fase 0 verificou o container GTM de produção e não há UM evento de
// e-commerce (`view_item`, `add_to_cart`, `purchase`: zero). Preencher com receita fabricada
// daria um painel bonito que mente sobre a operação. O estado vazio aqui é informativo e
// diz o que fazer (§69.2) — e o cenário `ecommerce` existe para exercitar o layout.
import type { PropsTela } from '../app/App';
import { usarDados } from './usarDados';
import { Card, Carregando, Erro, Procedencia, Grid, KpiCard, Vazio, Badge, BarraProp } from '../components/UI';
import type { Coluna } from '../components/UI';
import { fmtInt, fmtPct, fmtMoeda } from '../lib/fmt';

function usarEcom(p: PropsTela) {
  return usarDados(
    (s) => p.svc.getEcommerce(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.recarga],
    p.onMeta,
  );
}

function NaoInstrumentado({ dados }: { dados: { motivo?: string; eventos_necessarios?: string[]; acao_sugerida?: string; como_demonstrar?: string } }) {
  return (
    <div className="ga-card">
      <div className="ga-card__corpo">
        <Vazio
          titulo="E-commerce não instrumentado"
          detalhe={dados.motivo}
        />
        {dados.eventos_necessarios && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6, marginBottom: 6 }}>Eventos que precisam existir</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {dados.eventos_necessarios.map((e) => <Badge key={e} tipo="neutro">{e}</Badge>)}
            </div>
          </>
        )}
        {dados.acao_sugerida && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ga-txt-2)', lineHeight: 1.55 }}>
            <b style={{ color: 'var(--ga-txt)' }}>O que fazer:</b> {dados.acao_sugerida}
          </div>
        )}
        {dados.como_demonstrar && (
          <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--ga-txt-3)' }}>{dados.como_demonstrar}</div>
        )}
      </div>
    </div>
  );
}

export function Ecommerce(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarEcom(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  if (!dados.instrumentado) {
    return (
      <>
        <Card titulo="E-commerce"><NaoInstrumentado dados={dados} /></Card>
        <Procedencia meta={meta} />
      </>
    );
  }

  return (
    <>
      <Card titulo="Indicadores de e-commerce">
        <div className="ga-kpis">{dados.kpis.map((k) => <KpiCard key={k.chave} kpi={k} />)}</div>
      </Card>

      <Card titulo="Checkout" nota="perda entre etapas">
        <div className="ga-card">
          <div className="ga-card__corpo">
            <div className="ga-funil">
              {dados.checkout.map((c, i) => {
                const topo = dados.checkout[0]?.usuarios ?? 1;
                return (
                  <div key={c.etapa} className="ga-funil__et">
                    <span className="ga-funil__nome">{i + 1}. {c.etapa}</span>
                    <div className="ga-funil__barra"><i style={{ width: `${Math.max(0.6, (c.usuarios / topo) * 100)}%` }} /></div>
                    <span className="ga-funil__n">{fmtInt(c.usuarios)}</span>
                    <span className="ga-funil__perda">{i === 0 ? '—' : `-${fmtInt(c.perda)}`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}

export function Produtos(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarEcom(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  if (!dados.instrumentado) {
    return (
      <>
        <Card titulo="Produtos"><NaoInstrumentado dados={dados} /></Card>
        <Procedencia meta={meta} />
      </>
    );
  }

  type L = typeof dados.produtos[number];
  const maxRec = Math.max(1, ...dados.produtos.map((x) => x.receita));
  const cols: Coluna<L>[] = [
    { chave: 'item', rotulo: 'Produto', render: (l) => (
      <span style={{ display: 'grid', minWidth: 0 }}>
        <span className="ga-trunc" title={l.item}>{l.item}</span>
        <span className="ga-mono" style={{ color: 'var(--ga-txt-3)' }}>{l.item_id} · {l.categoria}</span>
      </span>
    ) },
    { chave: 'vi', rotulo: 'Visualizações', num: true, render: (l) => fmtInt(l.visualizacoes) },
    { chave: 'ac', rotulo: 'No carrinho', num: true, render: (l) => fmtInt(l.add_to_cart) },
    { chave: 'cp', rotulo: 'Compras', num: true, render: (l) => fmtInt(l.compras), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.compras, 0)) },
    { chave: 'tx', rotulo: 'Conversão', num: true, render: (l) => fmtPct(l.taxa_conversao) },
    { chave: 'ab', rotulo: 'Abandono', num: true, render: (l) => <span style={{ color: l.abandono > 70 ? 'var(--ga-ruim)' : undefined }}>{fmtPct(l.abandono, 1)}</span> },
    { chave: 'rec', rotulo: 'Receita', num: true, render: (l) => fmtMoeda(l.receita), total: (ls) => fmtMoeda(ls.reduce((a, b) => a + b.receita, 0)) },
    { chave: 'bar', rotulo: '', larg: 90, render: (l) => <BarraProp valor={l.receita} max={maxRec} /> },
  ];

  return (
    <>
      <Card titulo="Produtos" nota="ordenado por receita">
        <Grid colunas={cols} linhas={dados.produtos} chave={(l) => l.item_id} />
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}
