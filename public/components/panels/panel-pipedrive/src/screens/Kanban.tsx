// screens/Kanban.tsx — quadro read-only de negócios abertos por etapa (funil selecionável).
// @version 2.2.0  @created 2026-07-21
//
// v1.0.0: três linhas por cartão (título, valor, organização) e cabeçalho com contagem.
// v2.0.0 (Fase 5 — Kanban):
//   • cabeçalho de coluna com contagem, valor, participação no funil, probabilidade da
//     etapa e CONVERSÃO para a próxima, com a etapa-gargalo marcada;
//   • cartões ricos: avatar do dono, tempo na etapa, próxima atividade, etiquetas e
//     sinais de atenção;
//   • densidade compacta/padrão/confortável — mesma preferência global dos grids;
//   • quadro em largura total, rolando por dentro;
//   • virtualização por coluna (@tanstack/react-virtual) a partir de 40 cartões.
// v2.1.0 (backlog #25): VALOR PONDERADO pela probabilidade, por etapa e no total do funil.
//
// A conversão, o gargalo e o valor ponderado NÃO são recalculados aqui: vêm de `GET /funnel`
// e `GET /forecast`, os mesmos que alimentam as telas de Funis e Previsão (cache compartilhado
// pelas chaves `chaves.funnel` / `chaves.forecast`). Dois lugares computando o mesmo número é
// como eles passam a divergir.
//
// ⚠️ Por que o ponderado NÃO é `col.valor * col.probability` (que já estava na tela):
// a probabilidade efetiva do backend é COALESCE(probabilidade DO NEGÓCIO, da etapa, 0) — o
// negócio pode sobrescrever a etapa. Medido nesta base: 253 abertos, 43 com probabilidade
// própria. A conta ingênua no front daria número diferente do da tela de Previsão para esses
// 43, e o usuário veria duas "previsões" discordando sem explicação.
import { useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Columns3, TriangleAlert, CalendarClock, CalendarX2, Clock, Hourglass, ChevronRight, Rows3, Scale,
  Filter,
} from 'lucide-react';
import { apiGet, chaves, ApiError } from '../lib/api';
import { fmtBRL, fmtNum } from '../lib/format';
import { DealDrawer } from './DealDrawer';
import { PageHeader } from './PageHeader';
import { EstadoErro, SkeletonBloco } from './Estados';
import { Avatar } from './Avatar';
import type {
  PipeStatus, PipeKanbanBoard, PipeKanbanCard, PipeKanbanColumn, PipeSinalKanban, PipeFunnelData,
  PipeForecast, PipePrazoKanban,
} from '../shell/types';

type Densidade = 'compacta' | 'padrao' | 'confortavel';
const DENS_KEY = 'pp:dens';          // preferência GLOBAL, compartilhada com os grids
const DENS_OPCOES: { v: Densidade; label: string }[] = [
  { v: 'compacta', label: 'Compacta' },
  { v: 'padrao', label: 'Padrão' },
  { v: 'confortavel', label: 'Confortável' },
];
// Altura estimada do cartão por densidade — o virtualizador mede a real depois (measureElement),
// isto é só o palpite inicial para a barra de rolagem não pular no primeiro quadro.
const ALTURA_EST: Record<Densidade, number> = { compacta: 86, padrao: 132, confortavel: 158 };
const VIRTUALIZAR_A_PARTIR_DE = 40;

// #26 — recortes por previsão de fechamento. "Sem previsão" é um deles de propósito:
// 117 dos 248 abertos deste funil não têm data, então um recorte por prazo esconde
// quase metade do quadro. Como balde visível, o que era sumiço vira pergunta útil
// ("quais negócios estão sem data?").
const PRAZOS: { v: PipePrazoKanban; label: string }[] = [
  { v: 'todos', label: 'Qualquer previsão' },
  { v: 'vencidos', label: 'Previsão vencida' },
  { v: 'mes', label: 'Fecha este mês' },
  { v: 'd30', label: 'Fecha em 30 dias' },
  { v: 'd90', label: 'Fecha em 90 dias' },
  { v: 'sem_previsao', label: 'Sem previsão' },
];

const ROTULO_SINAL: Record<PipeSinalKanban, string> = {
  ativ_atrasada: 'Atividade atrasada',
  fechamento_vencido: 'Fechamento vencido',
  sem_atividade: 'Sem próxima atividade',
  parado: 'Parado há 30+ dias',
  sem_previsao: 'Sem previsão',
};
const PESO_SINAL: Record<PipeSinalKanban, 'alta' | 'media' | 'baixa'> = {
  ativ_atrasada: 'alta', fechamento_vencido: 'alta',
  sem_atividade: 'media', parado: 'media',
  sem_previsao: 'baixa',
};
// Só os de peso alto viram selo no cartão: cinco selos por cartão não é sinal, é ruído.
const SINAIS_VISIVEIS: PipeSinalKanban[] = ['ativ_atrasada', 'fechamento_vencido'];

function lerDensidade(): Densidade {
  try {
    const s = localStorage.getItem(DENS_KEY);
    if (s === 'compacta' || s === 'padrao' || s === 'confortavel') return s;
  } catch { /* ignora */ }
  return 'padrao';
}

/** Cor determinística da etiqueta: a cor do Pipedrive não é sincronizada (ver backend). */
function corEtiqueta(id: number): string {
  return `hsl(${(id * 47) % 360} 58% 52%)`;
}

function diasAte(iso: string | null): number | null {
  if (!iso) return null;
  const alvo = new Date(`${iso}T00:00:00`).getTime();
  if (Number.isNaN(alvo)) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo - hoje.getTime()) / 86_400_000);
}

/**
 * Tooltip do valor ponderado. Diz a fórmula (senão "≈" vira número mágico) e, se a
 * contagem do forecast não bater com a da coluna, ADMITE a diferença em vez de deixar o
 * usuário conferir na mão e achar que um dos dois está errado.
 */
function tituloPonderado(
  pond: { ponderado: number; efetiva: number; count: number },
  col: PipeKanbanColumn,
): string {
  const linhas = [
    `Soma de (valor × probabilidade) negócio a negócio, não ${fmtBRL(col.valor)} × ${pond.efetiva}%.`,
    'Probabilidade do próprio negócio quando existe; senão a da etapa.',
    `${pond.efetiva}% é a probabilidade média já ponderada pelo valor.`,
    'Mesma conta da tela Previsão.',
  ];
  if (pond.count !== col.count) {
    linhas.push(`⚠️ Previsão considera ${fmtNum(pond.count)} negócios nesta etapa e o quadro ${fmtNum(col.count)}.`);
  }
  return linhas.join('\n');
}

function textoPrazo(dias: number): string {
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  if (dias === -1) return 'ontem';
  return dias > 0 ? `em ${dias} d` : `há ${Math.abs(dias)} d`;
}

export function Kanban({ status }: { status?: PipeStatus }) {
  const [pipelineId, setPipelineId] = useState<number | null>(null);
  const [dealAberto, setDealAberto] = useState<number | null>(null);
  const [densidade, setDensidade] = useState<Densidade>(lerDensidade);
  // #26 — recortes do quadro. Não persistem de propósito: filtro que sobrevive à
  // sessão faz o usuário voltar e ver um quadro "vazio" sem lembrar por quê.
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [prazo, setPrazo] = useState<PipePrazoKanban>('todos');

  const trocarDensidade = (d: Densidade) => {
    setDensidade(d);
    try { localStorage.setItem(DENS_KEY, d); } catch { /* ignora */ }
  };

  // Recorte em vigor, montado UMA vez e usado nas duas consultas (quadro e ponderado).
  // Duas listas de parâmetros seria a porta de entrada para elas divergirem.
  const recorte = useMemo(() => {
    const p: Record<string, string | number> = {};
    if (ownerId != null) p.owner_id = ownerId;
    if (prazo !== 'todos') p.prazo = prazo;
    return p;
  }, [ownerId, prazo]);
  const temFiltro = ownerId != null || prazo !== 'todos';

  const { data, isLoading, isFetching, error, refetch } = useQuery<PipeKanbanBoard>({
    queryKey: ['pipe', 'kanban', pipelineId, ownerId, prazo],
    queryFn: ({ signal }) => apiGet<PipeKanbanBoard>(
      '/kanban',
      { ...(pipelineId ? { pipeline_id: pipelineId } : {}), ...recorte },
      signal,
    ),
    placeholderData: keepPreviousData,
    enabled: status?.status === 'connected',
    refetchInterval: 120_000,
  });

  // Conversão/gargalo: mesma fonte da tela de Funis (cache compartilhado, custo zero quando
  // o usuário já passou por lá). Falha aqui não derruba o quadro — o cabeçalho só fica magro.
  const { data: funil } = useQuery<PipeFunnelData>({
    queryKey: chaves.funnel,
    queryFn: ({ signal }) => apiGet<PipeFunnelData>('/funnel', undefined, signal),
    enabled: status?.status === 'connected',
    staleTime: 120_000,
  });

  // Valor ponderado (#25): mesma fonte da tela de Previsão. Pedido SEM funil (`'all'`, igual
  // ao padrão daquela tela) de propósito — a chave de cache passa a ser a MESMA, então trocar
  // de funil aqui não gera consulta nova e o número não pode divergir do da Previsão.
  // `by_stage` vem com `stage_id` global, então cada coluna acha o seu.
  // Sem filtro, a chave é a MESMA da tela Previsão ('all') e o cache é compartilhado.
  // Com filtro (#26), a chave carrega o recorte: o ponderado precisa enxergar o mesmo
  // conjunto que o quadro desenha, senão a coluna mostra os negócios de um vendedor e o
  // ponderado o total da etapa inteira.
  const { data: previsao } = useQuery<PipeForecast>({
    queryKey: temFiltro ? [...chaves.forecast, 'kanban', ownerId, prazo] : [...chaves.forecast, 'all'],
    queryFn: ({ signal }) => apiGet<PipeForecast>('/forecast', temFiltro ? recorte : undefined, signal),
    enabled: status?.status === 'connected',
    staleTime: 120_000,
  });

  const plAtual = data?.pipeline_id ?? null;
  const infoEtapa = useMemo(() => {
    const mapa = new Map<number, { conversao: number | null; gargalo: boolean }>();
    const pl = funil?.pipelines.find((p) => p.id === plAtual);
    if (!pl) return mapa;
    for (const s of pl.stages) {
      mapa.set(s.stage_id, { conversao: s.conversao_prox, gargalo: pl.gargalo?.stage_id === s.stage_id });
    }
    return mapa;
  }, [funil, plAtual]);

  const rotulosEtiqueta = useMemo(
    () => new Map((data?.etiquetas ?? []).map((e) => [e.id, e.label])),
    [data],
  );

  const pondEtapa = useMemo(() => {
    const mapa = new Map<number, { ponderado: number; efetiva: number; count: number }>();
    for (const s of previsao?.by_stage ?? []) {
      if (s.stage_id == null) continue;
      mapa.set(s.stage_id, { ponderado: s.valor_ponderado, efetiva: s.prob_efetiva, count: s.count });
    }
    return mapa;
  }, [previsao]);

  if (status?.status !== 'connected') {
    return (
      <div>
        <PageHeader Icon={Columns3} titulo="Kanban" descricao="Negócios em aberto por etapa." />
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro titulo="Integração não conectada"
            detalhe="Conecte o token do Pipedrive na tela de Configurações para ver estes dados." />
        </div>
      </div>
    );
  }

  const cols = data?.columns ?? [];
  const totalAbertos = data?.totais.count ?? 0;
  const totalValor = data?.totais.valor ?? 0;

  // Total ponderado do funil = soma SÓ das etapas desenhadas no quadro. Usar o
  // `previsao.totals` seria somar todos os funis; usar as colunas mantém cabeçalho e
  // quadro falando do mesmo recorte.
  const colsComPond = cols.filter((c) => pondEtapa.has(c.stage_id));
  const temPonderado = colsComPond.length > 0;
  const totalPonderado = colsComPond.reduce((acc, c) => acc + (pondEtapa.get(c.stage_id)?.ponderado ?? 0), 0);
  // Quando toda etapa do funil está a 100%, ponderado == total e a linha vira ruído
  // (dois números iguais lado a lado). Aí some, e a legenda explica.
  const ponderadoInforma = temPonderado && Math.round(totalPonderado) !== Math.round(totalValor);

  return (
    <div>
      <PageHeader Icon={Columns3} titulo="Kanban" atualizando={isFetching}
        descricao={`Negócios em aberto por etapa${data?.pipeline_name ? ` · ${data.pipeline_name}` : ''}${cols.length ? ` · ${fmtNum(totalAbertos)} negócios · ${fmtBRL(totalValor)}` : ''}${ponderadoInforma ? ` · ≈ ${fmtBRL(totalPonderado)} ponderado` : ''}`}
        acoes={
          <div className="pp-quick">
            <select className="pp-select" aria-label="Funil"
              value={pipelineId ?? data?.pipeline_id ?? ''}
              onChange={(e) => { setPipelineId(Number(e.target.value)); setOwnerId(null); }}>
              {(data?.pipelines ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {/* #26 — o dono some ao trocar de funil (acima): um vendedor do funil A não
                costuma existir no B, e o quadro ficaria vazio sem explicação. */}
            <select className="pp-select" aria-label="Dono"
              value={ownerId ?? ''}
              onChange={(e) => setOwnerId(e.target.value === '' ? null : Number(e.target.value))}>
              <option value="">Todos os donos</option>
              {(data?.owners ?? []).map((o) => (
                <option key={o.id ?? 'sem'} value={o.id ?? ''}>{o.name} ({o.count})</option>
              ))}
            </select>
            <select className="pp-select" aria-label="Previsão de fechamento"
              value={prazo} onChange={(e) => setPrazo(e.target.value as PipePrazoKanban)}>
              {PRAZOS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
            <div className="pp-seg" role="group" aria-label="Densidade dos cartões">
              {DENS_OPCOES.map((d) => (
                <button key={d.v} type="button" className={`pp-seg-b${densidade === d.v ? ' is-active' : ''}`}
                  onClick={() => trocarDensidade(d.v)} aria-pressed={densidade === d.v}
                  title={`Densidade ${d.label.toLowerCase()}`}>
                  {d.v === 'padrao' ? <Rows3 size={13} aria-hidden /> : null}{d.label}
                </button>
              ))}
            </div>
          </div>
        } />

      {error instanceof ApiError ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro detalhe={error.ehAuth ? 'Sua sessão expirou. Recarregue a página e entre novamente.' : 'Falha ao consultar a base local.'}
            onRetry={error.ehAuth ? undefined : () => void refetch()} />
        </div>
      ) : isLoading && !data ? (
        <div className="pp-card" style={{ maxWidth: 'none' }}><SkeletonBloco linhas={5} /></div>
      ) : cols.length === 0 ? (
        <div className="pp-card"><p className="pp-placeholder">Nenhuma etapa ativa neste funil.</p></div>
      ) : (
        <>
          {/* #26 — recorte ativo declarado na tela. Um quadro filtrado que parece um
              quadro inteiro é a forma mais fácil de alguém concluir que o funil secou. */}
          {temFiltro && (
            <div className="pp-kan-recorte" role="status">
              <Filter size={13} aria-hidden />
              <span>
                Recorte ativo: <strong>{data?.owners.find((o) => o.id === ownerId)?.name ?? 'todos os donos'}</strong>
                {prazo !== 'todos' && <> · <strong>{PRAZOS.find((p) => p.v === prazo)?.label.toLowerCase()}</strong></>}
                {' — '}{fmtNum(totalAbertos)} {totalAbertos === 1 ? 'negócio' : 'negócios'}
              </span>
              {/* O número que evita a conclusão errada: com recorte por data, os sem
                  previsão não estão aqui — e são quase metade nesta base. */}
              {prazo !== 'todos' && prazo !== 'sem_previsao' && (data?.filtros.sem_previsao_no_funil ?? 0) > 0 && (
                <span className="pp-kan-fora">
                  {fmtNum(data!.filtros.sem_previsao_no_funil)} sem previsão ficam fora deste recorte
                </span>
              )}
              <button type="button" className="pp-kan-limpar"
                onClick={() => { setOwnerId(null); setPrazo('todos'); }}>
                Limpar filtros
              </button>
            </div>
          )}

          <div className={`pp-kanban dens-${densidade}`}>
            {cols.map((c) => (
              <Coluna key={c.stage_id} col={c} totalValor={totalValor} densidade={densidade}
                info={infoEtapa.get(c.stage_id)} pond={pondEtapa.get(c.stage_id)}
                rotulos={rotulosEtiqueta} onAbrir={setDealAberto} />
            ))}
          </div>

          <div className="pp-kan-legenda" style={{ marginTop: 12 }}>
            {(data?.etiquetas.length ?? 0) > 0 && (
              <>
                <span>Etiquetas:</span>
                {data?.etiquetas.map((e) => (
                  <span key={e.id} className="pp-kan-label" style={{ color: corEtiqueta(e.id) }}>{e.label}</span>
                ))}
                <span aria-hidden>·</span>
              </>
            )}
            {/* O asterisco aparece em muitos cartões; sem esta linha ele fica sendo um
                enigma que só o tooltip resolve. */}
            <span><strong>*</strong> tempo medido desde a criação — negócio sem marco de entrada na etapa</span>
            {/* Mesmo raciocínio para o "≈": um símbolo novo no cabeçalho sem explicação
                visível vira adivinhação. Só entra quando existe ponderado na tela. */}
            {temPonderado && (
              <>
                <span aria-hidden>·</span>
                <span>
                  <strong>≈</strong> valor ponderado pela probabilidade de fechamento (mesma conta da tela Previsão)
                  {!ponderadoInforma && ' — neste funil toda etapa está a 100%, então o ponderado é igual ao valor'}
                </span>
              </>
            )}
          </div>
        </>
      )}

      {dealAberto != null && <DealDrawer dealId={dealAberto} onClose={() => setDealAberto(null)} />}
    </div>
  );
}

// ── Coluna ───────────────────────────────────────────────────────────────────

function Coluna({ col, totalValor, densidade, info, pond, rotulos, onAbrir }: {
  col: PipeKanbanColumn;
  totalValor: number;
  densidade: Densidade;
  info?: { conversao: number | null; gargalo: boolean };
  pond?: { ponderado: number; efetiva: number; count: number };
  rotulos: Map<number, string>;
  onAbrir: (id: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizar = col.deals.length >= VIRTUALIZAR_A_PARTIR_DE;

  const virt = useVirtualizer({
    count: col.deals.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ALTURA_EST[densidade],
    overscan: 6,
    enabled: virtualizar,
  });

  const share = totalValor > 0 ? (col.valor / totalValor) * 100 : 0;
  const gargalo = info?.gargalo ?? false;

  return (
    <section className={`pp-kan-col${gargalo ? ' is-gargalo' : ''}`}
      aria-label={`${col.stage ?? 'Etapa'} — ${col.count} negócios`}>
      <header className="pp-kan-head">
        <div className="t">
          <span className="nm" title={col.stage ?? ''}>{col.stage ?? '—'}</span>
          {gargalo && (
            <span className="pp-kan-tag-gargalo" title="Maior queda para a etapa seguinte">
              <TriangleAlert size={10} aria-hidden />gargalo
            </span>
          )}
          <span className="qtd">{fmtNum(col.count)}</span>
        </div>
        <div className="m">
          <span className="v">{fmtBRL(col.valor)}</span>
          {totalValor > 0 && <span>· {share < 1 && share > 0 ? '<1' : Math.round(share)}% do funil</span>}
          {col.probability != null && <span>· prob. {col.probability}%</span>}
        </div>
        <div className="pp-kan-share" aria-hidden><span style={{ width: `${Math.max(share, share > 0 ? 2 : 0)}%` }} /></div>
        {/* #25 — só aparece quando INFORMA algo: numa etapa a 100% o ponderado é igual ao
            valor e repetir o mesmo número em duas linhas seria ruído. */}
        {pond != null && Math.round(pond.ponderado) !== Math.round(col.valor) && (
          <div className="pp-kan-pond" title={tituloPonderado(pond, col)}>
            <Scale size={11} aria-hidden />
            <span className="vp">≈ {fmtBRL(pond.ponderado)}</span>
            <span>ponderado · {pond.efetiva}%</span>
          </div>
        )}
        {info?.conversao != null && (
          <div className={`pp-kan-conv${gargalo ? ' is-gargalo' : ''}`}>
            <ChevronRight size={12} aria-hidden />
            <span className="pct">{info.conversao}%</span>
            <span>seguem para a próxima</span>
          </div>
        )}
      </header>

      <div className="pp-kan-body" ref={scrollRef}>
        {col.deals.length === 0 ? (
          <div className="pp-kan-empty">Nenhum negócio em aberto</div>
        ) : virtualizar ? (
          <div className="pp-kan-virt" style={{ height: virt.getTotalSize() }}>
            {virt.getVirtualItems().map((item) => (
              <div key={item.key} className="pp-kan-slot"
                ref={virt.measureElement} data-index={item.index}
                style={{ transform: `translateY(${item.start}px)` }}>
                <Cartao d={col.deals[item.index]} rotulos={rotulos} onAbrir={onAbrir} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pp-kan-gap, 8px)' }}>
            {col.deals.map((d) => <Cartao key={d.id} d={d} rotulos={rotulos} onAbrir={onAbrir} />)}
          </div>
        )}

        {col.count > col.exibidos && (
          <div className="pp-kan-more">
            + {fmtNum(col.count - col.exibidos)} não exibidos — o quadro mostra os de maior valor
          </div>
        )}
      </div>
    </section>
  );
}

// ── Cartão ───────────────────────────────────────────────────────────────────

function Cartao({ d, rotulos, onAbrir }: {
  d: PipeKanbanCard; rotulos: Map<number, string>; onAbrir: (id: number) => void;
}) {
  const sinais = d.alertas.filter((a) => SINAIS_VISIVEIS.includes(a));
  const outros = d.alertas.filter((a) => !SINAIS_VISIVEIS.includes(a));
  const prazo = diasAte(d.proxima_atividade);
  const dias = d.dias_na_etapa;
  // Faixas de estagnação alinhadas com a regra "parado" do backend (30 dias).
  const classeTempo = dias == null ? '' : dias >= 60 ? 'critico' : dias >= 30 ? 'quente' : '';

  const titulo = [
    d.title ?? 'Negócio sem título',
    d.person ? `Contato: ${d.person}` : null,
    d.owner ? `Dono: ${d.owner}` : null,
    // O que não coube em selo continua acessível pelo title, sem poluir o cartão.
    outros.length ? `Também: ${outros.map((a) => ROTULO_SINAL[a]).join(', ')}` : null,
  ].filter(Boolean).join('\n');

  return (
    <button type="button" className="pp-kan-card" onClick={() => onAbrir(d.id)} title={titulo}>
      <span className="ct">{d.title ?? '—'}</span>

      <span className="pp-kan-linha">
        <Avatar nome={d.owner} tamanho={20} />
        <span className="co">{d.org ?? d.person ?? d.owner ?? '—'}</span>
        {d.value != null && <span className="cv">{fmtBRL(d.value, d.currency ?? 'BRL')}</span>}
      </span>

      <span className="pp-kan-meta">
        {dias != null && (
          <span className={classeTempo}
            title={d.desde_criacao
              ? 'Sem marco de entrada na etapa neste negócio — tempo medido desde a criação.'
              : 'Dias desde a entrada nesta etapa.'}>
            <Hourglass size={11} aria-hidden />
            {dias} d{d.desde_criacao ? '*' : ''}
          </span>
        )}
        {prazo != null ? (
          <span className={prazo < 0 ? 'critico' : ''} title={`Próxima atividade em ${d.proxima_atividade}`}>
            <CalendarClock size={11} aria-hidden />{textoPrazo(prazo)}
          </span>
        ) : (
          <span title="Nenhuma atividade pendente futura — este negócio não tem próximo passo agendado.">
            <CalendarX2 size={11} aria-hidden />sem agenda
          </span>
        )}
        {d.atividades_atrasadas > 0 && (
          <span className="critico" title={`${d.atividades_atrasadas} atividade(s) pendente(s) vencida(s)`}>
            <Clock size={11} aria-hidden />{d.atividades_atrasadas}
          </span>
        )}
      </span>

      {d.labels.length > 0 && (
        <span className="pp-kan-labels">
          {d.labels.map((id) => (
            <span key={id} className="pp-kan-label" style={{ color: corEtiqueta(id) }}>
              {rotulos.get(id) ?? `#${id}`}
            </span>
          ))}
        </span>
      )}

      {sinais.length > 0 && (
        <span className="pp-kan-sinais">
          {sinais.map((a) => (
            <span key={a} className={`pp-kan-sinal ${PESO_SINAL[a]}`}>
              <TriangleAlert size={10} aria-hidden />{ROTULO_SINAL[a]}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
