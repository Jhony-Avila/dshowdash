// screens/OrigemLeads.tsx — de onde vêm os leads (Backlog 06 #31 + o "por origem" do #7).
// @version 1.0.0  @created 2026-07-28
//
// Lê GET /lead-sources (100% base local). A tela responde, nesta ordem:
//   1. dá para confiar? — cobertura da classificação e o desfecho da fatia SEM origem;
//   2. que origem vale o esforço — dispersão volume × conversão (o coração da tela);
//   3. quanto cada uma traz — ranking com conversão, valor ganho e ciclo até ganhar;
//   4. o que está mudando — tendência mensal, com "Sem origem" como série visível;
//   5. quem trabalha o quê — recortes por dono e por funil.
//
// ⚠️ HONESTIDADE DO DADO — o que a tela REPETE em vez de esconder:
//   • Nem todo negócio tem origem (hoje ~72% no histórico). A participação usa como
//     denominador os CLASSIFICADOS, e o cartão de cobertura é o termômetro de confiança.
//   • A fatia sem origem tem conversão PRÓPRIA na tela. Se ela destoa da geral, o ranking
//     está enviesado — e é melhor o usuário saber disso do que descobrir por acidente.
//   • O campo aceita MAIS DE UMA origem por negócio: a soma da coluna "Leads" passa do
//     total de classificados. A tela diz quantos são multi-origem em vez de deixar a
//     conta "não fechar" silenciosamente.
//   • A janela é por data de CRIAÇÃO (safra de leads). Uma safra recente ainda não
//     terminou de converter, então a conversão dos últimos meses tende a subir depois —
//     por isso os negócios ainda ABERTOS aparecem no rodapé do indicador.
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Waypoints, TriangleAlert } from 'lucide-react';
import { apiGet, chaves, ApiError } from '../lib/api';
import { fmtBRL, fmtNum } from '../lib/format';
import { PageHeader } from './PageHeader';
import { EstadoErro, SkeletonBloco } from './Estados';
import { BigNumber } from './BigNumber';
import { EChartCard } from '../viz/ChartCard';
import { usePaleta } from '../viz/tema';
import { optDispersao, optColunasEmpilhadas, type PontoBolha } from '../viz/opts';
import type { PipeStatus, PipeOrigemData, PipeOrigem, PipeOrigemRecorte } from '../shell/types';

/** Janelas oferecidas. 0 = tudo, e a base tem leads desde 2016. */
const JANELAS: { meses: number; label: string }[] = [
  { meses: 6, label: '6 meses' },
  { meses: 12, label: '12 meses' },
  { meses: 24, label: '24 meses' },
  { meses: 0, label: 'Todo o histórico' },
];

/** Diferença (em pontos percentuais) a partir da qual a fatia sem origem vira alerta. */
const VIES_PP = 5;

export function OrigemLeads({ status }: { status?: PipeStatus }) {
  const [meses, setMeses] = useState(12);
  const [funil, setFunil] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useQuery<PipeOrigemData>({
    queryKey: [...chaves.leadSources, meses, funil],
    queryFn: ({ signal }) => apiGet<PipeOrigemData>('/lead-sources', {
      months: meses, ...(funil != null ? { pipeline_id: funil } : {}),
    }, signal),
    enabled: status?.status === 'connected',
    refetchInterval: 300_000,
  });

  if (status?.status !== 'connected') {
    return (
      <div>
        <PageHeader Icon={Waypoints} titulo="Origem dos Leads" descricao="De onde vêm os negócios." />
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro titulo="Integração não conectada"
            detalhe="Conecte o token do Pipedrive na tela de Configurações para ver estes dados." />
        </div>
      </div>
    );
  }

  // Só oferece o recorte por funil quando ele separa alguma coisa — um seletor que não
  // muda nada é ruído (mesmo critério da tela de Perdas).
  const funisRelevantes = (data?.por_funil.itens ?? []).filter(
    (f) => data?.totais && data.totais.com_origem > 0 && f.n / data.totais.com_origem >= 0.01,
  );

  return (
    <div>
      <PageHeader Icon={Waypoints} titulo="Origem dos Leads"
        contagem={data?.totais?.com_origem}
        descricao="Volume, conversão e valor por origem — e o quanto dá para confiar nisso." />

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
      ) : !data.campo.existe || !data.totais ? (
        // Campo sumiu do Pipedrive: dizer isso é infinitamente melhor do que desenhar
        // zeros, que o usuário leria como "não veio lead nenhum".
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro titulo="Campo de origem não encontrado" detalhe={data.nota} />
        </div>
      ) : data.totais.negocios === 0 ? (
        <div className="pp-card">
          <p className="pp-placeholder">Nenhum negócio criado nesta janela.</p>
        </div>
      ) : data.origens.length === 0 ? (
        <div className="pp-card">
          <p className="pp-placeholder">
            Nenhum dos {fmtNum(data.totais.negocios)} negócios desta janela tem origem preenchida.
          </p>
        </div>
      ) : (
        <>
          <Indicadores data={data} />
          <VolumeXConversao data={data} />
          <Ranking data={data} />
          <Tendencia data={data} />
          <Recortes data={data} />

          <p className="pp-cc-rodape">{data.nota}</p>
        </>
      )}
    </div>
  );
}

// ── Indicadores + as ressalvas ───────────────────────────────────────────────

function Indicadores({ data }: { data: PipeOrigemData }) {
  const t = data.totais!;
  const cobertura = t.cobertura_pct;

  // Viés: a fatia SEM origem converte muito diferente da geral? Se sim, o ranking
  // descreve bem os classificados, mas não a operação inteira.
  const vies = t.sem_origem_conversao_pct != null && t.conversao_pct != null
    ? t.sem_origem_conversao_pct - t.conversao_pct
    : null;
  const viesRelevante = vies != null && Math.abs(vies) >= VIES_PP;

  return (
    <>
      <div className="pp-g12">
        <BigNumber className="pp-c-3" rotulo="Leads classificados" valor={t.com_origem} formato="num"
          nota={`de ${fmtNum(t.negocios)} negócios criados na janela`}
          dica="Negócios com o campo de origem preenchido." />

        {/* Termômetro de confiança da tela: se cair, todo o resto vale menos. */}
        <BigNumber className="pp-c-3" rotulo="Cobertura da origem" valor={cobertura} formato="pct"
          cor={cobertura != null && cobertura >= 90 ? 'var(--pp-ok)'
            : cobertura != null && cobertura >= 70 ? 'var(--pp-warn)' : 'var(--pp-danger)'}
          nota={t.sem_origem > 0 ? `${fmtNum(t.sem_origem)} sem origem` : 'todos classificados'}
          dica="Percentual dos negócios da janela com origem preenchida. O ranking abaixo só enxerga esses." />

        <BigNumber className="pp-c-3" rotulo="Conversão geral" valor={t.conversao_pct} formato="pct"
          cor="var(--pp-ok)"
          nota={`${fmtNum(t.ganhos)} ganhos de ${fmtNum(t.fechados)} fechados · ${fmtNum(t.abertos)} em aberto`}
          dica="Ganhos sobre o que já fechou (ganhos + perdidos). Negócio aberto não entra: ainda não foi decidido." />

        <BigNumber className="pp-c-3" rotulo="Valor ganho" valor={t.valor_ganho} formato="brl"
          cor="var(--pp-ok)"
          nota={`${fmtNum(t.origens_distintas)} ${t.origens_distintas === 1 ? 'origem distinta' : 'origens distintas'}`} />
      </div>

      {(t.sem_origem > 0 || t.multi_origem > 0) && (
        <p className="pp-cc-rodape" style={{ margin: '-8px 0 16px' }}>
          <TriangleAlert size={13} aria-hidden style={{ verticalAlign: '-2px', marginRight: 4 }} />
          {t.sem_origem > 0 && (
            <>
              {fmtNum(t.sem_origem)} {t.sem_origem === 1 ? 'negócio não tem' : 'negócios não têm'} origem
              preenchida e {t.sem_origem === 1 ? 'fica' : 'ficam'} de fora do ranking
              {t.sem_origem_fechados > 0 && t.sem_origem_conversao_pct != null && (
                <>
                  {' '}— {t.sem_origem === 1 ? 'ele converteu' : 'eles converteram'}{' '}
                  <strong>{t.sem_origem_conversao_pct.toLocaleString('pt-BR')}%</strong>
                  {' '}({fmtNum(t.sem_origem_fechados)} já {t.sem_origem_fechados === 1 ? 'fechado' : 'fechados'})
                  {viesRelevante && (
                    <>
                      , contra {t.conversao_pct?.toLocaleString('pt-BR')}% da janela inteira:
                      {' '}essa fatia se comporta de forma diferente, então trate o ranking como
                      {' '}retrato dos classificados, não da operação toda
                    </>
                  )}
                </>
              )}
              .{' '}
            </>
          )}
          {t.multi_origem > 0 && (
            <>
              {fmtNum(t.multi_origem)} {t.multi_origem === 1 ? 'negócio tem' : 'negócios têm'} mais de uma
              origem e {t.multi_origem === 1 ? 'é contado' : 'são contados'} em cada uma — por isso a soma
              da coluna “Leads” passa dos {fmtNum(t.com_origem)} classificados.
            </>
          )}
        </p>
      )}
    </>
  );
}

// ── Volume × conversão (o gráfico que responde "onde vale investir") ─────────

function VolumeXConversao({ data }: { data: PipeOrigemData }) {
  const pal = usePaleta();
  const t = data.totais!;

  // Só entra quem já FECHOU alguma coisa: sem negócio decidido não existe conversão, e
  // plotar essas origens no eixo Y as colocaria em "0%", que é uma afirmação falsa.
  const comConversao = data.origens.filter((o) => o.fechados > 0 && o.conversao_pct != null);
  const semConversao = data.origens.length - comConversao.length;

  const pontos: PontoBolha[] = comConversao.map((o) => ({
    label: o.origem, x: o.n, y: o.conversao_pct as number, tamanho: o.valor_ganho,
  }));
  const usaLog = pontos.length > 0 && pontos.every((p) => p.x > 0);

  return (
    <div className="pp-g12">
      <EChartCard className="pp-c-12" titulo="Volume × conversão por origem" altura={360}
        subtitulo="Cada bolha é uma origem · tamanho = valor ganho · linha tracejada = conversão geral"
        vazio={pontos.length === 0}
        vazioMsg="Nenhuma origem tem negócio fechado nesta janela."
        opcao={pontos.length ? optDispersao(pal, pontos, {
          formatoX: 'num', formatoY: 'pct', log: usaLog,
          refY: t.conversao_pct ?? undefined,
          refYRotulo: t.conversao_pct != null
            ? `conversão geral ${t.conversao_pct.toLocaleString('pt-BR')}%` : undefined,
          nomeX: 'Leads na janela', nomeY: 'Conversão',
        }) : null}
        rodape={
          <>
            Canto superior direito é o que se procura: muito lead e boa conversão. Bolha grande
            embaixo converte pouco, mas o pouco que fecha é caro — e vice-versa.
            {usaLog && ' Volume em escala logarítmica: as origens variam em ordens de grandeza e, em escala linear, todas menos a maior ficariam grudadas na margem.'}
            {semConversao > 0 && ` ${fmtNum(semConversao)} ${semConversao === 1 ? 'origem ficou' : 'origens ficaram'} de fora por ainda não ter negócio fechado.`}
          </>
        }
        aria="Dispersão de volume de leads contra taxa de conversão, por origem" />
    </div>
  );
}

// ── Ranking ─────────────────────────────────────────────────────────────────

function Ranking({ data }: { data: PipeOrigemData }) {
  const [porValor, setPorValor] = useState(false);

  const linhas = useMemo(() => {
    const arr = [...data.origens];
    arr.sort((a, b) => (porValor ? b.valor_ganho - a.valor_ganho : b.n - a.n));
    return arr;
  }, [data.origens, porValor]);

  const maior = Math.max(1, ...linhas.map((o) => (porValor ? o.valor_ganho : o.n)));

  return (
    <div className="pp-g12">
      <div className="pp-card pp-c-12">
        {/* Sem classe própria: o painel não tem um "cabeçalho de card com ação" e criar
            uma para um caso só seria dívida de CSS. Flex local resolve. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '0 0 14px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>
            Todas as origens<span className="pp-badge">{data.origens.length}</span>
          </h3>
          <div className="pp-seg" role="group" aria-label="Ordenação do ranking">
            <button type="button" className={`pp-seg-b${!porValor ? ' is-active' : ''}`}
              onClick={() => setPorValor(false)} aria-pressed={!porValor}>Por volume</button>
            <button type="button" className={`pp-seg-b${porValor ? ' is-active' : ''}`}
              onClick={() => setPorValor(true)} aria-pressed={porValor}>Por valor</button>
          </div>
        </div>

        <div className="pp-tabela-rolavel">
          <table className="pp-table pp-zebra">
            <thead>
              <tr>
                <th>Origem</th>
                <th className="ta-r">Leads</th>
                <th className="ta-r">Participação</th>
                <th className="ta-r">Conversão</th>
                <th className="ta-r">Valor ganho</th>
                <th className="ta-r">Ticket médio</th>
                <th className="ta-r">Ciclo</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((o) => <LinhaOrigem key={o.option_id} o={o} maior={maior} porValor={porValor} />)}
            </tbody>
          </table>
        </div>
        <p className="pp-cc-rodape" style={{ marginBottom: 0 }}>
          Conversão é sobre o que já fechou; “—” significa que ainda não há negócio decidido
          nessa origem, o que não é o mesmo que 0%. Ciclo é a média de dias da criação até o ganho.
        </p>
      </div>
    </div>
  );
}

function LinhaOrigem({ o, maior, porValor }: { o: PipeOrigem; maior: number; porValor: boolean }) {
  const base = porValor ? o.valor_ganho : o.n;
  return (
    <tr>
      <td className="pp-comparar"
        title={`${fmtNum(o.ganhos)} ganhos · ${fmtNum(o.perdas)} perdidos · ${fmtNum(o.abertos)} em aberto`}>
        {/* Barra proporcional: compara as origens sem custar um gráfico. */}
        <span className="pp-minibar neutra" aria-hidden
          style={{ ['--w' as string]: `${Math.round((base / maior) * 100)}%` }} />
        <div className="pp-td-title">{o.origem}</div>
      </td>
      <td className="ta-r">{fmtNum(o.n)}</td>
      <td className="ta-r">{o.share_qtd != null ? `${o.share_qtd.toLocaleString('pt-BR')}%` : '—'}</td>
      <td className="ta-r">
        {o.conversao_pct != null
          ? <strong>{o.conversao_pct.toLocaleString('pt-BR')}%</strong>
          : '—'}
        {o.fechados > 0 && (
          <div className="pp-td-sub">{fmtNum(o.ganhos)}/{fmtNum(o.fechados)}</div>
        )}
      </td>
      <td className="ta-r">{fmtBRL(o.valor_ganho)}</td>
      <td className="ta-r">{o.ticket_medio != null ? fmtBRL(o.ticket_medio) : '—'}</td>
      <td className="ta-r">{o.ciclo_medio_dias != null ? `${fmtNum(o.ciclo_medio_dias)} d` : '—'}</td>
    </tr>
  );
}

// ── Tendência ───────────────────────────────────────────────────────────────

function Tendencia({ data }: { data: PipeOrigemData }) {
  const pal = usePaleta();
  const [percentual, setPercentual] = useState(false);
  const { meses, series, top } = data.tendencia;

  // Um mês só não é tendência.
  if (meses.length < 2 || series.length === 0) return null;

  const rotulos = meses.map((m) => {
    const [ano, mes] = m.split('-');
    return `${mes}/${ano.slice(2)}`;
  });

  // Regra de cor desta tela: CINZA = AUSÊNCIA DE DADO, e nada mais.
  //   • "Sem origem" não é uma origem — é o buraco na classificação. Fica cinza.
  //   • "Outras" é a cauda de origens REAIS, então ganha cor real. Na primeira versão as
  //     duas eram cinza (uma `neutral`, outra `textDim`) e ficaram indistinguíveis na
  //     legenda: o usuário não sabia se o bloco enorme de junho era cauda ou buraco.
  // O contador próprio impede que essas duas consumam matizes da sequência categórica.
  let iSeq = 0;
  const cores = series.map((s) => {
    if (s.origem === 'Sem origem') return pal.textDim;
    if (s.origem === 'Outras') return pal.pink;
    return pal.seq[iSeq++ % pal.seq.length];
  });

  return (
    <div className="pp-g12">
      <EChartCard className="pp-c-12" titulo="Como a origem dos leads muda" altura={320}
        subtitulo={`Leads criados por mês — as ${top} maiores origens; o resto vai em “Outras”`}
        acoes={
          <div className="pp-seg" role="group" aria-label="Escala da tendência">
            <button type="button" className={`pp-seg-b${!percentual ? ' is-active' : ''}`}
              onClick={() => setPercentual(false)} aria-pressed={!percentual}>Absoluto</button>
            <button type="button" className={`pp-seg-b${percentual ? ' is-active' : ''}`}
              onClick={() => setPercentual(true)} aria-pressed={percentual}>Composição</button>
          </div>
        }
        opcao={optColunasEmpilhadas(pal, rotulos,
          series.map((s, i) => ({ nome: s.origem, dados: s.n, cor: cores[i] })),
          { formato: 'num', rotacionar: rotulos.length > 14, percentual })}
        rodape="A série “Sem origem” está no gráfico de propósito: ela mostra se a classificação
                está melhorando ou piorando, que é o que diz o quanto confiar em cada período."
        aria="Evolução mensal dos leads por origem" />
    </div>
  );
}

// ── Recortes ────────────────────────────────────────────────────────────────

function Recortes({ data }: { data: PipeOrigemData }) {
  return (
    <div className="pp-g12">
      <CardRecorte titulo="Por dono" recorte={data.por_dono} className="pp-c-6" />
      <CardRecorte titulo="Por funil" recorte={data.por_funil} className="pp-c-6" />
    </div>
  );
}

function CardRecorte({ titulo, recorte, className }: {
  titulo: string; recorte: PipeOrigemRecorte; className: string;
}) {
  const { total, itens } = recorte;
  if (itens.length === 0) return null;
  const maior = Math.max(1, ...itens.map((g) => g.n));

  return (
    <div className={`pp-card ${className}`}>
      <h3>{titulo}<span className="pp-badge">{fmtNum(total)}</span></h3>
      <div className="pp-tabela-rolavel">
        <table className="pp-table pp-zebra">
          <thead>
            <tr>
              <th>Nome · origem principal</th>
              <th className="ta-r">Leads</th>
              <th className="ta-r">Conversão</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((g) => (
              <tr key={`${g.id ?? g.nome}`}>
                {/* A origem principal vive na SUB-LINHA, não numa 4ª coluna: em meia grade
                    (pp-c-6) a quarta coluna era cortada no meio do nome da origem — e um
                    rótulo truncado em "Clie…" não informa nada. */}
                <td className="pp-comparar" title={`${fmtBRL(g.valor)} ganhos`}>
                  <span className="pp-minibar neutra" aria-hidden
                    style={{ ['--w' as string]: `${Math.round((g.n / maior) * 100)}%` }} />
                  <div className="pp-td-title">{g.nome}</div>
                  <div className="pp-td-sub">
                    {g.principal_origem ?? 'sem origem predominante'}
                    {g.principal_share != null && ` · ${g.principal_share.toLocaleString('pt-BR')}%`}
                  </div>
                </td>
                <td className="ta-r">{fmtNum(g.n)}</td>
                <td className="ta-r">{g.conversao_pct != null ? `${g.conversao_pct.toLocaleString('pt-BR')}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Sem corte silencioso: se houver mais grupos que o teto, a tela diz. */}
      {total > itens.length && (
        <p className="pp-cc-rodape" style={{ marginBottom: 0 }}>
          Mostrando os {itens.length} maiores de {fmtNum(total)}.
        </p>
      )}
    </div>
  );
}
