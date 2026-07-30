// screens/Comportamento.tsx — §23 (Páginas) e §24 (Landing Pages)
// @version 1.0.0  @created 2026-07-30
import type { PropsTela } from '../app/App';
import { usarDados } from './usarDados';
import { Card, Carregando, Erro, Procedencia, Grid, Badge, Vazio, BarraProp } from '../components/UI';
import type { Coluna } from '../components/UI';
import type { LinhaPagina } from '../services/GoogleAnalyticsService';
import { fmtInt, fmtPct, fmtSegundos } from '../lib/fmt';

function usarPaginas(p: PropsTela) {
  return usarDados(
    (s) => p.svc.getPages(p.filtros, s),
    [p.filtros.periodo, p.filtros.cenario, p.filtros.canal, p.filtros.campanha, p.recarga],
    p.onMeta,
  );
}

const TIPO_BADGE: Record<string, 'ok' | 'alerta' | 'erro' | 'info' | 'neutro' | 'marca'> = {
  home: 'marca', servico: 'info', instit: 'neutro', conversao: 'ok', obrigado: 'ok', blog: 'neutro', erro: 'erro',
};

export function Paginas(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarPaginas(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const max = Math.max(1, ...dados.paginas.map((l) => l.visualizacoes));
  const cols: Coluna<LinhaPagina>[] = [
    { chave: 'titulo', rotulo: 'Página', render: (l) => (
      <span style={{ display: 'grid', minWidth: 0 }}>
        <span className="ga-trunc" title={l.titulo}>{l.titulo}</span>
        <span className="ga-trunc ga-mono" style={{ color: 'var(--ga-txt-3)' }} title={l.path}>{l.path}</span>
      </span>
    ) },
    { chave: 'tipo', rotulo: 'Tipo', larg: 100, render: (l) => <Badge tipo={TIPO_BADGE[l.tipo] ?? 'neutro'}>{l.tipo}</Badge> },
    { chave: 'bar', rotulo: '', larg: 100, render: (l) => <BarraProp valor={l.visualizacoes} max={max} /> },
    { chave: 'views', rotulo: 'Visualizações', num: true, render: (l) => fmtInt(l.visualizacoes), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.visualizacoes, 0)) },
    { chave: 'ent', rotulo: 'Entradas', num: true, render: (l) => (l.e_entrada ? fmtInt(l.entradas) : <span style={{ color: 'var(--ga-txt-3)' }}>—</span>) },
    { chave: 'eng', rotulo: 'Engaj.', num: true, render: (l) => fmtPct(l.taxa_engajamento, 1) },
    { chave: 'tempo', rotulo: 'Tempo médio', num: true, render: (l) => fmtSegundos(l.tempo_medio_seg) },
    { chave: 'conv', rotulo: 'Conversões', num: true, render: (l) => fmtInt(l.conversoes), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.conversoes, 0)) },
  ];

  const semConversao = dados.paginas.filter((l) => l.visualizacoes > 200 && l.conversoes === 0 && l.tipo !== 'erro');
  const erro404 = dados.paginas.find((l) => l.tipo === 'erro');

  return (
    <>
      <Card titulo="Todas as páginas" nota="clique para filtrar as outras telas">
        <Grid
          colunas={cols}
          linhas={dados.paginas}
          chave={(l) => l.path}
          onLinha={(l) => p.onCorte({ pagina: p.corte.pagina === l.path ? null : l.path })}
          selecionada={(l) => p.corte.pagina === l.path}
        />
      </Card>

      <div className="ga-colunas--2">
        <Card titulo="Tráfego sem conversão" nota={`${semConversao.length} páginas`}>
          <div className="ga-card">
            <div className="ga-card__corpo">
              {semConversao.length === 0
                ? <Vazio titulo="Nenhuma página relevante sem conversão" />
                : semConversao.map((l) => (
                  <div key={l.path} className="ga-rt-lin">
                    <span className="ga-trunc ga-mono" title={l.titulo}>{l.path}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtInt(l.visualizacoes)} views</span>
                  </div>
                ))}
            </div>
          </div>
        </Card>

        <Card titulo="Páginas de erro">
          <div className="ga-card">
            <div className="ga-card__corpo">
              {erro404 && erro404.visualizacoes > 0 ? (
                <>
                  <div className="ga-rt-lin"><span className="ga-mono">{erro404.path}</span><span>{fmtInt(erro404.visualizacoes)} views</span></div>
                  <div style={{ fontSize: 11.5, color: 'var(--ga-txt-2)', marginTop: 8, lineHeight: 1.5 }}>
                    Toda visualização aqui é um usuário que não encontrou o que buscava. Vale cruzar com
                    as origens para descobrir de onde vêm os links quebrados.
                  </div>
                </>
              ) : <Vazio titulo="Nenhuma página de erro registrada" />}
            </div>
          </div>
        </Card>
      </div>
      <Procedencia meta={meta} />
    </>
  );
}

export function LandingPages(p: PropsTela) {
  const { dados, meta, carregando, erro } = usarPaginas(p);
  if (erro) return <Erro erro={erro} />;
  if (carregando && !dados) return <Carregando />;
  if (!dados) return <Vazio titulo="Sem dados" />;

  const cols: Coluna<LinhaPagina>[] = [
    { chave: 'titulo', rotulo: 'Landing page', render: (l) => (
      <span style={{ display: 'grid', minWidth: 0 }}>
        <span className="ga-trunc" title={l.titulo}>{l.titulo}</span>
        <span className="ga-trunc ga-mono" style={{ color: 'var(--ga-txt-3)' }}>{l.path}</span>
      </span>
    ) },
    { chave: 'ent', rotulo: 'Sessões de entrada', num: true, render: (l) => fmtInt(l.entradas), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.entradas, 0)) },
    { chave: 'eng', rotulo: 'Engajamento', num: true, render: (l) => fmtPct(l.taxa_engajamento, 1) },
    { chave: 'tempo', rotulo: 'Tempo médio', num: true, render: (l) => fmtSegundos(l.tempo_medio_seg) },
    { chave: 'conv', rotulo: 'Conversões', num: true, render: (l) => fmtInt(l.conversoes), total: (ls) => fmtInt(ls.reduce((a, b) => a + b.conversoes, 0)) },
    { chave: 'tx', rotulo: 'Taxa', num: true, render: (l) => fmtPct(l.entradas > 0 ? (l.conversoes / l.entradas) * 100 : 0) },
    {
      chave: 'score', rotulo: 'Score', num: true, larg: 110,
      render: (l) => (
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(l.score ?? 0).toFixed(1)}</span>
          <span className="ga-bar" style={{ width: 44 }}><i style={{ width: `${Math.min(100, l.score ?? 0)}%` }} /></span>
        </span>
      ),
    },
  ];

  return (
    <>
      <Card titulo="Landing pages" nota={dados.aviso_score}>
        <Grid colunas={cols} linhas={[...dados.landings].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))} chave={(l) => l.path} />
      </Card>
      <Procedencia meta={meta} />
    </>
  );
}
