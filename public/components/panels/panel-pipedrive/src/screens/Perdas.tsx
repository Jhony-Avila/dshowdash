// screens/Perdas.tsx — análise dos motivos de perda (Backlog 06 #30 + taxa por motivo do #5).
// @version 1.0.0  @created 2026-07-27
//
// Lê GET /lost-reasons (100% base local). A tela responde três perguntas, nesta ordem:
//   1. quanto se perde e por quê — indicadores + ranking de motivos (quantidade e valor);
//   2. o que está mudando — tendência mensal dos motivos dominantes ("Outros" absorve a cauda);
//   3. onde se perde — recortes por etapa, dono e funil, cada um com o motivo predominante.
//
// ⚠️ HONESTIDADE DO DADO — três avisos que a tela REPETE, não esconde:
//   • Nem todo perdido tem motivo: 1.682 no histórico completo (a janela de 12 meses tem
//     cobertura de 99,9%). A participação usa como denominador TODOS os perdidos, então
//     o ranking nunca se apresenta como o total.
//   • O tempo mostrado é da criação até a perda, não tempo por etapa — não existe
//     histórico de transições (`pipe_deal_history` está vazia; ver Funis).
//   • A etapa de um perdido é a de FECHAMENTO. Etapa excluída no Pipedrive aparece como
//     "Etapa removida (#id)" em vez de sumir da conta.
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingDown, TriangleAlert } from 'lucide-react';
import { apiGet, chaves, ApiError } from '../lib/api';
import { fmtBRL, fmtNum } from '../lib/format';
import { PageHeader } from './PageHeader';
import { EstadoErro, SkeletonBloco } from './Estados';
import { BigNumber } from './BigNumber';
import { EChartCard } from '../viz/ChartCard';
import { usePaleta } from '../viz/tema';
import { optBarras, optColunasEmpilhadas, type PontoXY } from '../viz/opts';
import type { PipeStatus, PipeLostData, PipeLostRecorte, PipeLostMotivo } from '../shell/types';

/** Janelas oferecidas. 0 = tudo, e a base tem perdas desde 2016. */
const JANELAS: { meses: number; label: string }[] = [
  { meses: 6, label: '6 meses' },
  { meses: 12, label: '12 meses' },
  { meses: 24, label: '24 meses' },
  { meses: 0, label: 'Todo o histórico' },
];

export function Perdas({ status, onNegocios }: {
  status?: PipeStatus;
  /** Drill-down: leva ao grid de Negócios já filtrado (status=lost + motivo). */
  onNegocios?: (filtros?: Record<string, string>) => void;
}) {
  const [meses, setMeses] = useState(12);
  const [funil, setFunil] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useQuery<PipeLostData>({
    queryKey: [...chaves.lostReasons, meses, funil],
    queryFn: ({ signal }) => apiGet<PipeLostData>('/lost-reasons', {
      months: meses, ...(funil != null ? { pipeline_id: funil } : {}),
    }, signal),
    enabled: status?.status === 'connected',
    refetchInterval: 300_000,
  });

  if (status?.status !== 'connected') {
    return (
      <div>
        <PageHeader Icon={TrendingDown} titulo="Perdas" descricao="Por que os negócios são perdidos." />
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro titulo="Integração não conectada"
            detalhe="Conecte o token do Pipedrive na tela de Configurações para ver estes dados." />
        </div>
      </div>
    );
  }

  // Só oferece o recorte por funil quando ele separa alguma coisa: a base tem 99,9%
  // das perdas num funil só, e um seletor que não muda nada é ruído na tela.
  const funisRelevantes = (data?.por_funil.itens ?? []).filter(
    (f) => data && data.totais.perdidos > 0 && f.n / data.totais.perdidos >= 0.01,
  );

  const abrirMotivo = (motivo: string) =>
    onNegocios?.({ status: 'lost', lost_reason: motivo });

  return (
    <div>
      <PageHeader Icon={TrendingDown} titulo="Perdas"
        contagem={data?.totais.perdidos}
        descricao="Motivos de perda: ranking, tendência e onde acontecem." />

      <div className="pp-quick" style={{ margin: '0 0 16px' }}>
        {JANELAS.map((j) => (
          <button key={j.meses} type="button"
            className={`pp-quick-b${meses === j.meses ? ' is-active' : ''}`}
            onClick={() => setMeses(j.meses)}>
            {j.label}
          </button>
        ))}
        {funisRelevantes.length > 1 && (
          <>
            <button type="button" className={`pp-quick-b${funil == null ? ' is-active' : ''}`}
              onClick={() => setFunil(null)}>Todos os funis</button>
            {funisRelevantes.map((f) => (
              <button key={f.id} type="button" className={`pp-quick-b${funil === f.id ? ' is-active' : ''}`}
                onClick={() => setFunil(f.id)}>
                {f.nome}<span className="n">{fmtNum(f.n)}</span>
              </button>
            ))}
          </>
        )}
      </div>

      {error instanceof ApiError ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro detalhe={error.ehAuth
            ? 'Sua sessão expirou. Recarregue a página e entre novamente.'
            : 'Falha ao consultar a base local.'}
            onRetry={error.ehAuth ? undefined : () => void refetch()} />
        </div>
      ) : isLoading || !data ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}><SkeletonBloco linhas={6} /></div>
      ) : data.totais.perdidos === 0 ? (
        <div className="pp-card">
          <p className="pp-placeholder">Nenhum negócio perdido nesta janela.</p>
        </div>
      ) : (
        <>
          <Indicadores data={data} onNegocios={onNegocios} />
          <Ranking data={data} onMotivo={onNegocios ? abrirMotivo : undefined} />
          <Tendencia data={data} />
          <Recortes data={data} />

          <p className="pp-cc-rodape">{data.nota}</p>
        </>
      )}
    </div>
  );
}

// ── Indicadores ──────────────────────────────────────────────────────────────

function Indicadores({ data, onNegocios }: {
  data: PipeLostData;
  onNegocios?: (f?: Record<string, string>) => void;
}) {
  const t = data.totais;
  const semMotivo = t.sem_motivo > 0;

  return (
    <>
      <div className="pp-g12">
        <BigNumber className="pp-c-3" rotulo="Negócios perdidos" valor={t.perdidos} formato="num"
          cor="var(--pp-danger)"
          nota={`${fmtBRL(t.valor_perdido)} não fechados`}
          dica="Ver os negócios perdidos desta janela"
          onClick={onNegocios ? () => onNegocios({ status: 'lost' }) : undefined} />

        <BigNumber className="pp-c-3" rotulo="Taxa de perda" valor={t.taxa_perda_pct} formato="pct"
          cor="var(--pp-danger)"
          nota={`${fmtNum(t.ganhos)} ganhos no mesmo período`}
          dica="Perdidos sobre tudo que fechou (ganhos + perdidos) na janela." />

        <BigNumber className="pp-c-3" rotulo="Motivos distintos" valor={t.motivos_distintos} formato="num"
          nota="lista controlada no Pipedrive" />

        {/* Cobertura é o indicador de CONFIANÇA da tela: se cair, o ranking vale menos. */}
        <BigNumber className="pp-c-3" rotulo="Com motivo informado" valor={t.cobertura_pct} formato="pct"
          cor={t.cobertura_pct != null && t.cobertura_pct >= 95 ? 'var(--pp-ok)' : 'var(--pp-warn)'}
          nota={semMotivo ? `${fmtNum(t.sem_motivo)} sem motivo` : 'todos classificados'}
          dica="Percentual dos perdidos que têm motivo preenchido. O ranking abaixo só enxerga esses." />
      </div>

      {semMotivo && (
        <p className="pp-cc-rodape" style={{ margin: '-8px 0 16px' }}>
          <TriangleAlert size={13} aria-hidden style={{ verticalAlign: '-2px', marginRight: 4 }} />
          {fmtNum(t.sem_motivo)} {t.sem_motivo === 1 ? 'negócio perdido não tem' : 'negócios perdidos não têm'} motivo
          preenchido e {t.sem_motivo === 1 ? 'fica' : 'ficam'} de fora do ranking — mas {t.sem_motivo === 1 ? 'continua' : 'continuam'} contados
          no total e no denominador da participação.
        </p>
      )}
    </>
  );
}

// ── Ranking de motivos ───────────────────────────────────────────────────────

function Ranking({ data, onMotivo }: { data: PipeLostData; onMotivo?: (m: string) => void }) {
  const pal = usePaleta();
  const [porValor, setPorValor] = useState(false);

  // Gráfico com os 10 maiores; a tabela abaixo lista todos.
  const top = useMemo(() => {
    const arr = [...data.motivos];
    if (porValor) arr.sort((a, b) => b.valor - a.valor);
    return arr.slice(0, 10);
  }, [data.motivos, porValor]);

  const pontos: PontoXY[] = top.map((m) => ({ label: m.motivo, valor: porValor ? m.valor : m.n }));

  return (
    <div className="pp-g12">
      <EChartCard className="pp-c-6" titulo="Motivos de perda" altura={320}
        subtitulo={porValor ? 'Os 10 maiores por valor não fechado' : 'Os 10 maiores por quantidade'}
        acoes={
          <div className="pp-seg" role="group" aria-label="Medida do ranking">
            <button type="button" className={`pp-seg-b${!porValor ? ' is-active' : ''}`}
              onClick={() => setPorValor(false)} aria-pressed={!porValor}>Quantidade</button>
            <button type="button" className={`pp-seg-b${porValor ? ' is-active' : ''}`}
              onClick={() => setPorValor(true)} aria-pressed={porValor}>Valor</button>
          </div>
        }
        vazio={pontos.length === 0}
        vazioMsg="Nenhum motivo informado nesta janela."
        opcao={pontos.length ? optBarras(pal, pontos, {
          formato: porValor ? 'brl' : 'num', cor: pal.danger, larguraRotulo: 150,
        }) : null}
        aria="Motivos de perda por volume" />

      <div className="pp-card pp-c-6">
        <h3>Todos os motivos<span className="pp-badge">{data.motivos.length}</span></h3>
        <div className="pp-tabela-rolavel" style={{ maxHeight: 320, overflowY: 'auto' }}>
          <table className="pp-table pp-zebra">
            <thead>
              <tr>
                <th>Motivo</th>
                <th className="ta-r">Perdas</th>
                <th className="ta-r">Participação</th>
              </tr>
            </thead>
            <tbody>
              {data.motivos.map((m) => (
                <LinhaMotivo key={m.motivo} m={m} onMotivo={onMotivo} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="pp-cc-rodape" style={{ marginBottom: 0 }}>
          {onMotivo ? 'Clique num motivo para ver os negócios. ' : ''}
          Passe o mouse para ver o valor e o tempo médio até a perda.
        </p>
      </div>
    </div>
  );
}

function LinhaMotivo({ m, onMotivo }: { m: PipeLostMotivo; onMotivo?: (m: string) => void }) {
  const conteudo = (
    <>
      {/* Valor e tempo até perder no title: cinco colunas não cabem em meia grade,
          e a prioridade da tabela é ranquear (quantidade + participação). */}
      <td title={`${fmtBRL(m.valor)} não fechados${m.ciclo_medio_dias != null ? ` · ${fmtNum(m.ciclo_medio_dias)} dias até perder, em média` : ''}`}>
        {m.motivo}
      </td>
      <td className="ta-r">{fmtNum(m.n)}</td>
      <td className="ta-r">{m.share_qtd != null ? `${m.share_qtd.toLocaleString('pt-BR')}%` : '—'}</td>
    </>
  );
  if (!onMotivo) return <tr>{conteudo}</tr>;
  return (
    <tr className="pp-clik" tabIndex={0} role="button"
      aria-label={`Ver os ${m.n} negócios perdidos por ${m.motivo}`}
      onClick={() => onMotivo(m.motivo)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onMotivo(m.motivo); } }}>
      {conteudo}
    </tr>
  );
}

// ── Tendência mensal ─────────────────────────────────────────────────────────

function Tendencia({ data }: { data: PipeLostData }) {
  const pal = usePaleta();
  const [percentual, setPercentual] = useState(false);
  const { meses, series, top } = data.tendencia;

  // Um mês só não é tendência — o gráfico seria uma coluna solitária.
  if (meses.length < 2 || series.length === 0) return null;

  const rotulos = meses.map((m) => {
    const [ano, mes] = m.split('-');
    return `${mes}/${ano.slice(2)}`;
  });
  // Cauda ("Outros") sempre em cinza; os dominantes usam a paleta sequencial.
  const cores = series.map((s, i) => (s.motivo === 'Outros' ? pal.textDim : pal.seq[i % pal.seq.length]));

  return (
    <div className="pp-g12">
      <EChartCard className="pp-c-12" titulo="Como os motivos evoluem" altura={300}
        subtitulo={`Perdas por mês — os ${top} motivos dominantes; o resto vai em “Outros”`}
        acoes={
          <div className="pp-seg" role="group" aria-label="Escala da tendência">
            <button type="button" className={`pp-seg-b${!percentual ? ' is-active' : ''}`}
              onClick={() => setPercentual(false)} aria-pressed={!percentual}>Absoluto</button>
            <button type="button" className={`pp-seg-b${percentual ? ' is-active' : ''}`}
              onClick={() => setPercentual(true)} aria-pressed={percentual}>Composição</button>
          </div>
        }
        opcao={optColunasEmpilhadas(pal, rotulos,
          series.map((s, i) => ({ nome: s.motivo, dados: s.n, cor: cores[i] })),
          { formato: 'num', rotacionar: rotulos.length > 14, percentual })}
        aria="Evolução mensal dos motivos de perda" />
    </div>
  );
}

// ── Onde se perde ────────────────────────────────────────────────────────────

function Recortes({ data }: { data: PipeLostData }) {
  return (
    <div className="pp-g12">
      <CardRecorte titulo="Por etapa de fechamento" recorte={data.por_etapa} className="pp-c-6"
        rodape="A etapa é a do momento em que o negócio foi perdido." />
      <CardRecorte titulo="Por dono" recorte={data.por_dono} className="pp-c-6" />
    </div>
  );
}

function CardRecorte({ titulo, recorte, className, rodape }: {
  titulo: string; recorte: PipeLostRecorte; className: string; rodape?: string;
}) {
  const { total, itens } = recorte;
  if (itens.length === 0) return null;
  const maior = Math.max(...itens.map((g) => g.n));

  return (
    <div className={`pp-card ${className}`}>
      <h3>{titulo}<span className="pp-badge">{fmtNum(total)}</span></h3>
      <div className="pp-tabela-rolavel">
        <table className="pp-table pp-zebra">
          <thead>
            <tr>
              <th>Nome</th>
              <th className="ta-r">Perdas</th>
              <th>Motivo principal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((g) => (
              <tr key={`${g.id ?? g.nome}`}>
                <td className="pp-comparar" title={`${fmtBRL(g.valor)} não fechados`}>
                  {/* Barra proporcional: compara os grupos sem custar um gráfico. */}
                  <span className="pp-minibar" aria-hidden
                    style={{ ['--w' as string]: `${Math.round((g.n / maior) * 100)}%` }} />
                  <div className="pp-td-title">{g.nome}</div>
                  {/* Duas etapas podem ter o MESMO nome em funis diferentes ("Propostas"
                      existe no Principal e no Prospecção) — sem o funil viram linhas gêmeas. */}
                  {g.contexto && <div className="pp-td-sub">{g.contexto}</div>}
                </td>
                <td className="ta-r">{fmtNum(g.n)}</td>
                <td className="pp-wrap">
                  {g.principal_motivo ?? '—'}
                  {g.principal_share != null && <span style={{ color: 'var(--pp-text-dim)' }}> · {g.principal_share.toLocaleString('pt-BR')}%</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Sem corte silencioso: se algum dia houver mais grupos que o teto, a tela diz. */}
      {total > itens.length && (
        <p className="pp-cc-rodape" style={{ marginBottom: 0 }}>
          Mostrando os {itens.length} maiores de {fmtNum(total)}.
        </p>
      )}
      {rodape && <p className="pp-cc-rodape" style={{ marginBottom: 0 }}>{rodape}</p>}
    </div>
  );
}
