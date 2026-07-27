// screens/Emails.tsx — Central de E-mails (3 colunas: pastas / lista / leitura).
// @version 1.1.0  @created 2026-07-21
//
// v1.1.0: busca (§17.1), filtros rápidos (§17.3) e seleção em massa (§10.2).
// Corpo do e-mail renderizado em iframe SANDBOXED (sem allow-scripts). Estados §19.
import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiWrite, chaves, ApiError } from '../lib/api';
import type { OutlookStatus, OutlookAccount, MessagesPage, MessageResponse, MessageListItem, EmailTemplate, OutlookCategory, CategoriesResponse, AttachmentsResponse } from '../shell/types';
import { dataRelativa, dataCompleta, nomeEndereco, iniciais, corDeterministica } from '../lib/format';
import { Compositor, type ModoCompositor } from './Compositor';
import { ChipsCategorias, MenuCategorias, GerenciarCategorias } from './Categorias';
import { MassSend } from './MassSend';

const PASTAS: { key: string; label: string; icon: string }[] = [
  { key: 'inbox',        label: 'Caixa de Entrada', icon: '📥' },
  { key: 'drafts',       label: 'Rascunhos',        icon: '📝' },
  { key: 'scheduled',    label: 'Agendados',        icon: '🕐' },
  { key: 'sentitems',    label: 'Enviados',         icon: '📤' },
  { key: 'archive',      label: 'Arquivados',       icon: '🗄️' },
  { key: 'junkemail',    label: 'Spam',             icon: '⚠️' },
  { key: 'deleteditems', label: 'Lixeira',          icon: '🗑️' },
];

const CHIPS: { key: string; label: string }[] = [
  { key: 'unread',      label: 'Não lidos' },
  { key: 'today',       label: 'Hoje' },
  { key: 'attachments', label: 'Com anexo' },
  { key: 'important',   label: 'Importantes' },
  { key: 'flagged',     label: 'Sinalizados' },
];

interface EstadoComposer { modo: ModoCompositor; baseId?: string; modelo?: EmailTemplate | null; }
type BulkAction = 'read' | 'unread' | 'archive' | 'delete' | 'important';
type Layout = 'right' | 'bottom' | 'off';
type Density = 'comfortable' | 'compact';

function lerLayout(): Layout {
  try { const v = localStorage.getItem('ol_layout'); return v === 'bottom' || v === 'off' ? v : 'right'; } catch { return 'right'; }
}
function lerDensity(): Density {
  try { return localStorage.getItem('ol_density') === 'compact' ? 'compact' : 'comfortable'; } catch { return 'comfortable'; }
}

export function Emails({ status, onContas, modeloInicial, onModeloConsumido }: {
  status?: OutlookStatus; onContas: () => void;
  modeloInicial?: EmailTemplate | null; onModeloConsumido?: () => void;
}) {
  const qc = useQueryClient();
  const ativas = useMemo(() => (status?.accounts ?? []).filter((a) => a.is_active), [status]);
  const padrao = ativas.find((a) => a.is_default) ?? ativas[0];

  const [contaId, setContaId] = useState<number | null>(padrao?.id ?? null);
  const contaAtual: OutlookAccount | undefined = ativas.find((a) => a.id === contaId) ?? padrao;
  const accountId = contaAtual?.id ?? null;

  const [pasta, setPasta] = useState('inbox');
  const [selId, setSelId] = useState<string | null>(null);
  const [composer, setComposer] = useState<EstadoComposer | null>(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<string | null>(null);
  const [selec, setSelec] = useState<Set<string>>(new Set());
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [gerenciarCat, setGerenciarCat] = useState(false);
  const [massSend, setMassSend] = useState(false);
  const [layout, setLayout] = useState<Layout>(lerLayout);
  const [density, setDensity] = useState<Density>(lerDensity);
  const mudarLayout = (l: Layout) => { setLayout(l); try { localStorage.setItem('ol_layout', l); } catch { /* */ } };
  const mudarDensity = (d: Density) => { setDensity(d); try { localStorage.setItem('ol_density', d); } catch { /* */ } };

  const catQ = useQuery<CategoriesResponse>({
    queryKey: chaves.categories,
    queryFn: ({ signal }) => apiGet<CategoriesResponse>('/categories', undefined, signal),
  });
  const categorias: OutlookCategory[] = catQ.data?.categories ?? [];
  const catDisponivel = catQ.data?.available ?? false;
  const colorMap = useMemo(() => {
    const m: Record<string, string> = {};
    (catQ.data?.categories ?? []).forEach((c) => { m[c.name] = c.color; });
    return m;
  }, [catQ.data]);

  const trocarPasta = (p: string) => {
    setPasta(p); setSelId(null); setSelec(new Set()); setFiltro(null); setBusca(''); setCategoriaFiltro(null);
  };

  useEffect(() => {
    if (modeloInicial) {
      setComposer({ modo: 'new', modelo: modeloInicial });
      onModeloConsumido?.();
    }
  }, [modeloInicial]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!accountId) {
    return (
      <div className="ol-empty">
        <div className="ol-empty-icon" aria-hidden>✉️</div>
        <h2 className="ol-empty-title">Nenhuma conta conectada</h2>
        <p className="ol-empty-desc">Conecte uma conta Microsoft para ver e enviar e-mails.</p>
        <button className="ol-btn ol-btn-primary" onClick={onContas}>Ir para Contas</button>
      </div>
    );
  }

  const invalidarLista = () => {
    qc.invalidateQueries({ queryKey: chaves.messages(accountId, pasta) });
    qc.invalidateQueries({ queryKey: chaves.status });
  };

  const toggleSel = (id: string) => setSelec((prev) => {
    const n = new Set(prev);
    if (n.has(id)) { n.delete(id); } else { n.add(id); }
    return n;
  });

  async function executarBulk(action: BulkAction) {
    if (selec.size === 0) return;
    if (action === 'delete' && !window.confirm(`Excluir ${selec.size} mensagem(ns)? Elas vão para a Lixeira do Outlook.`)) return;
    const ids = Array.from(selec);
    try {
      await apiWrite('/messages/bulk-action', 'POST', {
        account_id: accountId, ids,
        action: action === 'important' ? 'important' : action,
      });
    } catch { /* toast futuro */ }
    setSelec(new Set());
    invalidarLista();
  }

  return (
    <div className={`ol-central layout-${layout}${density === 'compact' ? ' dense' : ''}`}>
      <aside className="ol-col-pastas">
        <button className="ol-btn ol-btn-primary ol-novo" onClick={() => setComposer({ modo: 'new' })}>
          ✏️ Novo e-mail
        </button>
        <button className="ol-btn ol-btn-ghost ol-massbtn" onClick={() => setMassSend(true)}>📢 Envio em massa</button>

        <ViewOptions layout={layout} density={density} onLayout={mudarLayout} onDensity={mudarDensity} />

        {ativas.length > 1 && (
          <select className="ol-conta-sel" value={accountId}
            onChange={(e) => { setContaId(Number(e.target.value)); setSelId(null); setSelec(new Set()); }}>
            {ativas.map((a) => (
              <option key={a.id} value={a.id}>{a.email ?? a.display_name ?? `Conta ${a.id}`}</option>
            ))}
          </select>
        )}

        <nav className="ol-pastas">
          {PASTAS.map((p) => (
            <button key={p.key}
              className={`ol-pasta${pasta === p.key ? ' is-active' : ''}`}
              onClick={() => trocarPasta(p.key)}>
              <span aria-hidden>{p.icon}</span> {p.label}
            </button>
          ))}
        </nav>

        {(categorias.length > 0 || catDisponivel) && (
          <div className="ol-catsec">
            <div className="ol-catsec-head">
              <span>Categorias</span>
              {catDisponivel && <button className="ol-icon-btn" title="Gerenciar categorias" onClick={() => setGerenciarCat(true)}>⚙️</button>}
            </div>
            {categorias.map((c) => (
              <button key={c.name} className={`ol-catfilter${categoriaFiltro === c.name ? ' is-on' : ''}`}
                onClick={() => { setCategoriaFiltro(categoriaFiltro === c.name ? null : c.name); setSelId(null); }}>
                <span className="ol-cat-dot" style={{ background: c.color }} /> {c.name}
              </button>
            ))}
          </div>
        )}
      </aside>

      <div className="ol-conteudo">
        <ListaMensagens
          accountId={accountId}
          pasta={pasta}
          busca={busca}
          filtro={filtro}
          categoria={categoriaFiltro}
          colorMap={colorMap}
          selId={selId}
          selec={selec}
          setBusca={setBusca}
          setFiltro={setFiltro}
          onSelecionar={setSelId}
          onToggleSel={toggleSel}
          onLimparSel={() => setSelec(new Set())}
          onBulk={executarBulk}
          onAcao={invalidarLista}
        />

        {(layout !== 'off' || selId) && (
          <Leitura
            accountId={accountId}
            messageId={selId}
            colorMap={colorMap}
            categorias={categorias}
            catDisponivel={catDisponivel}
            onResponder={(modo, baseId) => setComposer({ modo, baseId })}
            onAposAcao={invalidarLista}
            onFechar={() => setSelId(null)}
          />
        )}
      </div>

      {gerenciarCat && (
        <GerenciarCategorias categorias={categorias} disponivel={catDisponivel} onFechar={() => setGerenciarCat(false)} />
      )}

      {massSend && <MassSend accountId={accountId} onFechar={() => setMassSend(false)} />}

      {composer && (
        <CompositorLoader
          accountId={accountId}
          modo={composer.modo}
          baseId={composer.baseId}
          modelo={composer.modelo}
          onFechar={() => setComposer(null)}
          onEnviado={() => { setComposer(null); invalidarLista(); }}
        />
      )}
    </div>
  );
}

// ── Opções de visualização (§6.2) ─────────────────────────────────────────
function ViewOptions({ layout, density, onLayout, onDensity }: {
  layout: Layout; density: Density; onLayout: (l: Layout) => void; onDensity: (d: Density) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const layouts: { id: Layout; icon: string; label: string }[] = [
    { id: 'right', icon: '▐', label: 'À direita' },
    { id: 'bottom', icon: '▄', label: 'Abaixo' },
    { id: 'off', icon: '☰', label: 'Oculto' },
  ];
  return (
    <div className="ol-viewopt">
      <button className="ol-viewopt-btn" onClick={() => setAberto((v) => !v)} title="Modo de visualização">
        🖥️ Exibição <span aria-hidden>▾</span>
      </button>
      {aberto && (
        <div className="ol-viewopt-menu">
          <div className="ol-viewopt-grp">Painel de leitura</div>
          {layouts.map((l) => (
            <button key={l.id} className={`ol-viewopt-item${layout === l.id ? ' is-on' : ''}`} onClick={() => { onLayout(l.id); setAberto(false); }}>
              <span className="ol-viewopt-ic" aria-hidden>{l.icon}</span> {l.label}
            </button>
          ))}
          <div className="ol-viewopt-grp">Densidade</div>
          <button className={`ol-viewopt-item${density === 'comfortable' ? ' is-on' : ''}`} onClick={() => { onDensity('comfortable'); setAberto(false); }}>Confortável</button>
          <button className={`ol-viewopt-item${density === 'compact' ? ' is-on' : ''}`} onClick={() => { onDensity('compact'); setAberto(false); }}>Compacto</button>
        </div>
      )}
    </div>
  );
}

// ── Barra de busca + chips OU ações de seleção ────────────────────────────
function BarraLista({ busca, filtro, selCount, setBusca, setFiltro, onLimparSel, onBulk }: {
  busca: string; filtro: string | null; selCount: number;
  setBusca: (v: string) => void; setFiltro: (v: string | null) => void;
  onLimparSel: () => void; onBulk: (a: BulkAction) => void;
}) {
  const [texto, setTexto] = useState(busca);
  useEffect(() => { setTexto(busca); }, [busca]);
  useEffect(() => {
    const t = setTimeout(() => { if (texto !== busca) setBusca(texto); }, 350);
    return () => clearTimeout(t);
  }, [texto]); // eslint-disable-line react-hooks/exhaustive-deps

  if (selCount > 0) {
    return (
      <div className="ol-lista-topo ol-selbar">
        <button className="ol-icon-btn" title="Limpar seleção" onClick={onLimparSel}>✕</button>
        <span className="ol-sel-count">{selCount} selecionada{selCount > 1 ? 's' : ''}</span>
        <div className="ol-sel-actions">
          <button className="ol-btn ol-btn-ghost" onClick={() => onBulk('read')}>Marcar lida</button>
          <button className="ol-btn ol-btn-ghost" onClick={() => onBulk('unread')}>Não lida</button>
          <button className="ol-btn ol-btn-ghost" onClick={() => onBulk('important')}>Importante</button>
          <button className="ol-btn ol-btn-ghost" onClick={() => onBulk('archive')}>Arquivar</button>
          <button className="ol-btn ol-btn-ghost ol-btn-danger" onClick={() => onBulk('delete')}>Excluir</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ol-lista-topo">
      <div className="ol-busca">
        <span className="ol-busca-ic" aria-hidden>🔍</span>
        <input className="ol-busca-inp" placeholder="Buscar em assunto, remetente…"
          value={texto} onChange={(e) => setTexto(e.target.value)} />
        {texto && <button className="ol-icon-btn" title="Limpar" onClick={() => { setTexto(''); setBusca(''); }}>✕</button>}
      </div>
      <div className="ol-chips">
        {CHIPS.map((c) => (
          <button key={c.key}
            className={`ol-chip${filtro === c.key ? ' is-on' : ''}`}
            onClick={() => setFiltro(filtro === c.key ? null : c.key)}>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Lista de mensagens ───────────────────────────────────────────────────
function ListaMensagens(props: {
  accountId: number; pasta: string; busca: string; filtro: string | null;
  categoria: string | null; colorMap: Record<string, string>;
  selId: string | null; selec: Set<string>;
  setBusca: (v: string) => void; setFiltro: (v: string | null) => void;
  onSelecionar: (id: string) => void; onToggleSel: (id: string) => void;
  onLimparSel: () => void; onBulk: (a: BulkAction) => void; onAcao: () => void;
}) {
  const { accountId, pasta, busca, filtro, categoria, colorMap, selId, selec } = props;

  const q = useInfiniteQuery({
    queryKey: [...chaves.messages(accountId, pasta), busca, filtro, categoria],
    queryFn: ({ pageParam, signal }) =>
      apiGet<MessagesPage>('/messages', {
        account_id: accountId, folder: pasta, top: 25,
        skiptoken: pageParam ?? undefined,
        q: busca || undefined, filter: filtro ?? undefined, category: categoria ?? undefined,
      }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next ?? undefined,
  });

  const itens = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);

  const barra = (
    <BarraLista busca={busca} filtro={filtro} selCount={selec.size}
      setBusca={props.setBusca} setFiltro={props.setFiltro}
      onLimparSel={props.onLimparSel} onBulk={props.onBulk} />
  );

  let corpo: React.ReactNode;
  if (q.isLoading) {
    corpo = <ListaSkeleton />;
  } else if (q.isError) {
    corpo = <Indisponivel erro={q.error} onTentar={() => q.refetch()} />;
  } else if (itens.length === 0) {
    corpo = (
      <div className="ol-empty ol-empty-sm">
        <div className="ol-empty-icon" aria-hidden>{busca || filtro ? '🔎' : '🗂️'}</div>
        <p className="ol-empty-desc">{busca || filtro ? 'Nenhuma mensagem corresponde ao filtro.' : 'Nenhuma mensagem nesta pasta.'}</p>
      </div>
    );
  } else {
    corpo = (<>
      <ul className="ol-msglist">
        {itens.map((m) => (
          <ItemLista key={m.id} m={m} ativo={m.id === selId} selecionado={selec.has(m.id)}
            selMode={selec.size > 0} colorMap={colorMap} agendado={pasta === 'scheduled'}
            onClick={() => props.onSelecionar(m.id)}
            onToggleSel={() => props.onToggleSel(m.id)}
            accountId={accountId} onAcao={props.onAcao} />
        ))}
      </ul>
      {q.hasNextPage && (
        <button className="ol-btn ol-btn-ghost ol-carregar" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
          {q.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
        </button>
      )}
    </>);
  }

  return (
    <div className="ol-col-lista">
      {barra}
      {corpo}
    </div>
  );
}

const SCHED_STATUS: Record<string, { txt: string; cls: string }> = {
  scheduled: { txt: 'Agendado', cls: 'warn' }, sent: { txt: 'Enviado', cls: 'ok' },
  cancelled: { txt: 'Cancelado', cls: 'dim' }, failed: { txt: 'Falhou', cls: 'danger' },
};

function ItemLista({ m, ativo, selecionado, selMode, colorMap, agendado, onClick, onToggleSel, accountId, onAcao }: {
  m: MessageListItem; ativo: boolean; selecionado: boolean; selMode: boolean;
  colorMap: Record<string, string>; agendado: boolean;
  onClick: () => void; onToggleSel: () => void; accountId: number; onAcao: () => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  async function acao(tipo: 'read' | 'unread' | 'archive' | 'delete', ev: React.MouseEvent) {
    ev.stopPropagation();
    setOcupado(true);
    try {
      if (tipo === 'delete') await apiWrite('/messages/delete', 'POST', { account_id: accountId, id: m.id });
      else if (tipo === 'archive') await apiWrite('/messages/archive', 'POST', { account_id: accountId, id: m.id });
      else await apiWrite('/messages/mark-read', 'POST', { account_id: accountId, id: m.id, is_read: tipo === 'read' });
      onAcao();
    } catch { /* silencioso na lista */ }
    finally { setOcupado(false); }
  }
  async function acaoAg(tipo: 'cancel' | 'sendnow', ev: React.MouseEvent) {
    ev.stopPropagation();
    setOcupado(true);
    try {
      await apiWrite(tipo === 'cancel' ? '/messages/schedule-cancel' : '/messages/schedule-sendnow', 'POST', { account_id: accountId, id: m.id });
      onAcao();
    } catch { /* silencioso */ }
    finally { setOcupado(false); }
  }
  const st = m.sched_status ? (SCHED_STATUS[m.sched_status] ?? SCHED_STATUS.scheduled) : null;

  return (
    <li className={`ol-msg${ativo ? ' is-active' : ''}${m.is_read ? '' : ' is-unread'}${selecionado ? ' is-selected' : ''}${selMode ? ' sel-mode' : ''}`}
      onClick={onClick}>
      <label className="ol-msg-check" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={selecionado} onChange={onToggleSel} aria-label="Selecionar" />
      </label>
      <span className="ol-msg-avatar" style={{ background: corDeterministica(m.from?.address) }}>
        {iniciais(m.from)}
      </span>
      <div className="ol-msg-main">
        <div className="ol-msg-l1">
          <span className="ol-msg-de">{agendado ? `Para: ${m.to?.[0]?.address ?? '—'}` : nomeEndereco(m.from)}</span>
          {agendado && st
            ? <span className={`ol-pill ol-pill-${st.cls}`}>{st.txt}</span>
            : <span className="ol-msg-data">{dataRelativa(m.received ?? m.sent)}</span>}
        </div>
        <div className="ol-msg-l2">
          <span className="ol-msg-assunto">{m.subject}</span>
          <span className="ol-msg-icons">
            {m.importance === 'high' && <span title="Importante">❗</span>}
            {m.has_attachments && <span title="Anexo">📎</span>}
            {m.is_flagged && <span title="Sinalizada">🚩</span>}
          </span>
        </div>
        <div className="ol-msg-prev">{m.preview}</div>
        {m.categories.length > 0 && <ChipsCategorias nomes={m.categories} colorMap={colorMap} />}
        {agendado && m.scheduled_at && <div className="ol-msg-sched">🕐 {dataCompleta(m.scheduled_at)}</div>}
      </div>
      <div className="ol-msg-quick" onClick={(e) => e.stopPropagation()}>
        {agendado ? (
          m.sched_status === 'scheduled' && (<>
            <button className="ol-icon-btn" title="Enviar agora" disabled={ocupado} onClick={(e) => acaoAg('sendnow', e)}>📤</button>
            <button className="ol-icon-btn ol-icon-danger" title="Cancelar agendamento" disabled={ocupado} onClick={(e) => acaoAg('cancel', e)}>🚫</button>
          </>)
        ) : (<>
          <button className="ol-icon-btn" title={m.is_read ? 'Marcar não lida' : 'Marcar lida'}
            disabled={ocupado} onClick={(e) => acao(m.is_read ? 'unread' : 'read', e)}>{m.is_read ? '📩' : '📖'}</button>
          <button className="ol-icon-btn" title="Arquivar" disabled={ocupado} onClick={(e) => acao('archive', e)}>🗄️</button>
          <button className="ol-icon-btn" title="Excluir" disabled={ocupado} onClick={(e) => acao('delete', e)}>🗑️</button>
        </>)}
      </div>
    </li>
  );
}

// ── Painel de leitura ────────────────────────────────────────────────────
function Leitura({ accountId, messageId, colorMap, categorias, catDisponivel, onResponder, onAposAcao, onFechar }: {
  accountId: number; messageId: string | null;
  colorMap: Record<string, string>; categorias: OutlookCategory[]; catDisponivel: boolean;
  onResponder: (modo: ModoCompositor, baseId: string) => void;
  onAposAcao: () => void; onFechar: () => void;
}) {
  void catDisponivel;
  const [ocupado, setOcupado] = useState(false);
  const [menuCat, setMenuCat] = useState(false);

  const q = useQuery<MessageResponse>({
    queryKey: messageId ? chaves.message(accountId, messageId) : ['outlook', 'message', 'none'],
    queryFn: ({ signal }) => apiGet<MessageResponse>('/messages/item', { account_id: accountId, id: messageId as string }, signal),
    enabled: !!messageId,
  });
  const attQ = useQuery<AttachmentsResponse>({
    queryKey: ['outlook', 'attachments', accountId, messageId ?? 'none'],
    queryFn: ({ signal }) => apiGet<AttachmentsResponse>('/messages/attachments', { account_id: accountId, id: messageId as string }, signal),
    enabled: !!messageId && q.data?.message?.hasAttachments === true,
  });

  if (!messageId) {
    return (
      <section className="ol-col-leitura ol-leitura-vazia">
        <div className="ol-empty ol-empty-sm">
          <div className="ol-empty-icon" aria-hidden>📨</div>
          <p className="ol-empty-desc">Selecione uma mensagem para ler.</p>
        </div>
      </section>
    );
  }
  if (q.isLoading) {
    return <section className="ol-col-leitura"><div className="ol-skel-page"><div className="ol-spinner" /> Abrindo…</div></section>;
  }
  if (q.isError || !q.data?.message) {
    return <section className="ol-col-leitura"><Indisponivel erro={q.error} onTentar={() => q.refetch()} /></section>;
  }

  const m = q.data.message;
  const html = m.body?.contentType?.toLowerCase() === 'text'
    ? `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(m.body?.content ?? '')}</pre>`
    : (m.body?.content ?? m.bodyPreview ?? '');

  async function acao(fn: () => Promise<unknown>) {
    setOcupado(true);
    try { await fn(); onAposAcao(); } catch { /* toast futuro */ } finally { setOcupado(false); }
  }
  const act = (rota: string, extra?: object) => apiWrite('/messages/' + rota, 'POST', { account_id: accountId, id: m.id, ...(extra ?? {}) });
  const aplicarCats = async (cats: string[]) => {
    try { await apiWrite('/messages/categories', 'POST', { account_id: accountId, id: m.id, categories: cats }); q.refetch(); onAposAcao(); } catch { /* toast futuro */ }
  };

  return (
    <section className="ol-col-leitura">
      <header className="ol-leitura-head">
        <div className="ol-leitura-acoes">
          <button className="ol-btn ol-btn-ghost" disabled={ocupado} onClick={() => onResponder('reply', m.id)}>↩︎ Responder</button>
          <button className="ol-btn ol-btn-ghost" disabled={ocupado} onClick={() => onResponder('replyAll', m.id)}>↩︎ Todos</button>
          <button className="ol-btn ol-btn-ghost" disabled={ocupado} onClick={() => onResponder('forward', m.id)}>➡︎ Encaminhar</button>
          <span className="ol-sep-v" />
          <button className="ol-icon-btn" title="Arquivar" disabled={ocupado}
            onClick={() => acao(() => act('archive'))}>🗄️</button>
          <button className="ol-icon-btn" title="Marcar não lida" disabled={ocupado}
            onClick={() => acao(() => act('mark-read', { is_read: false }))}>📩</button>
          <button className="ol-icon-btn" title="Sinalizar" disabled={ocupado}
            onClick={() => acao(() => act('flag', { flagged: true }))}>🚩</button>
          <button className="ol-icon-btn ol-icon-danger" title="Excluir" disabled={ocupado}
            onClick={() => acao(() => apiWrite('/messages/delete', 'POST', { account_id: accountId, id: m.id }))}>🗑️</button>
          {categorias.length > 0 && (
            <div className="ol-catbtn-wrap">
              <button className="ol-icon-btn" title="Categorias" disabled={ocupado} onClick={() => setMenuCat((v) => !v)}>🏷️</button>
              {menuCat && <MenuCategorias atuais={m.categories ?? []} categorias={categorias} onAplicar={aplicarCats} onFechar={() => setMenuCat(false)} />}
            </div>
          )}
        </div>
        <button className="ol-icon-btn ol-leitura-x" title="Fechar" onClick={onFechar}>✕</button>
      </header>

      <div className="ol-leitura-meta">
        <h2 className="ol-leitura-assunto">{m.subject || '(sem assunto)'}</h2>
        {(m.categories ?? []).length > 0 && (
          <div className="ol-leitura-cats"><ChipsCategorias nomes={m.categories ?? []} colorMap={colorMap} /></div>
        )}
        <div className="ol-leitura-de">
          <span className="ol-msg-avatar" style={{ background: corDeterministica(m.from?.emailAddress?.address) }}>
            {iniciais(m.from?.emailAddress)}
          </span>
          <div>
            <div><strong>{nomeEndereco(m.from?.emailAddress)}</strong> <span className="ol-dim">&lt;{m.from?.emailAddress?.address}&gt;</span></div>
            <div className="ol-dim ol-small">
              para {(m.toRecipients ?? []).map((r) => r.emailAddress?.address).filter(Boolean).join(', ') || '—'}
              {' · '}{dataCompleta(m.receivedDateTime ?? m.sentDateTime)}
            </div>
          </div>
        </div>
      </div>

      {(attQ.data?.items ?? []).length > 0 && (
        <div className="ol-leitura-anexos">
          <div className="ol-anexos-tit">📎 {attQ.data!.items.length} anexo{attQ.data!.items.length > 1 ? 's' : ''}</div>
          <div className="ol-anexo-grid">
            {attQ.data!.items.map((a) => {
              const url = `/api/outlook/messages/attachment?account_id=${accountId}&id=${encodeURIComponent(m.id)}&aid=${encodeURIComponent(a.id)}`;
              const isImg = a.contentType.startsWith('image/');
              return (
                <a key={a.id} className="ol-anexo-card" href={url} target="_blank" rel="noreferrer" title={`${a.name} (${fmtBytes(a.size)})`}>
                  {isImg
                    ? <img className="ol-anexo-thumb" src={url} alt={a.name} />
                    : <span className="ol-anexo-card-ic" aria-hidden>{iconeAnexo(a.contentType)}</span>}
                  <span className="ol-anexo-card-nome">{a.name}</span>
                  <span className="ol-anexo-card-tam">{fmtBytes(a.size)}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      <iframe
        className="ol-leitura-corpo"
        title="Conteúdo do e-mail"
        sandbox=""
        srcDoc={`<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>body{font-family:system-ui,Segoe UI,Roboto,sans-serif;font-size:14px;color:#1b1f2a;margin:14px;line-height:1.5}img{max-width:100%;height:auto}a{color:#2f6fed}blockquote{border-left:2px solid #ccc;padding-left:12px;color:#666}</style></head><body>${html}</body></html>`}
      />
    </section>
  );
}

// ── Loader do compositor (busca a msg base p/ reply/forward) ──────────────
function CompositorLoader({ accountId, modo, baseId, modelo, onFechar, onEnviado }: {
  accountId: number; modo: ModoCompositor; baseId?: string; modelo?: EmailTemplate | null;
  onFechar: () => void; onEnviado: () => void;
}) {
  const precisaBase = modo !== 'new' && !!baseId;
  const q = useQuery<MessageResponse>({
    queryKey: baseId ? chaves.message(accountId, baseId) : ['outlook', 'message', 'compose'],
    queryFn: ({ signal }) => apiGet<MessageResponse>('/messages/item', { account_id: accountId, id: baseId as string }, signal),
    enabled: precisaBase,
  });
  if (precisaBase && q.isLoading) {
    return <div className="ol-composer-overlay"><div className="ol-composer"><div className="ol-skel-page"><div className="ol-spinner" /> Preparando…</div></div></div>;
  }
  return (
    <Compositor accountId={accountId} modo={modo}
      base={precisaBase ? (q.data?.message ?? null) : null}
      modelo={modelo}
      onFechar={onFechar} onEnviado={onEnviado} />
  );
}

// ── Auxiliares ────────────────────────────────────────────────────────────
function Indisponivel({ erro, onTentar }: { erro: unknown; onTentar: () => void }) {
  const precisaAuth = erro instanceof ApiError && (erro.precisaReconectar || erro.code === 'NEEDS_AUTH');
  return (
    <div className="ol-indisp">
      <div className="ol-empty-icon" aria-hidden>{precisaAuth ? '🔑' : '☁️'}</div>
      <h3 className="ol-empty-title">
        {precisaAuth ? 'Conta precisa reconectar' : 'Não foi possível acessar seus e-mails'}
      </h3>
      <p className="ol-empty-desc">
        {precisaAuth
          ? 'A autorização com a Microsoft expirou ou foi revogada. Reconecte a conta em Contas.'
          : 'No momento não conseguimos falar com a Microsoft. Verifique sua conexão e tente novamente.'}
      </p>
      <button className="ol-btn ol-btn-ghost" onClick={onTentar}>Tentar novamente</button>
    </div>
  );
}

function ListaSkeleton() {
  return (
    <ul className="ol-msglist">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="ol-msg ol-msg-skel">
          <span className="ol-skel-circle" />
          <div className="ol-msg-main">
            <div className="ol-skel-bar" style={{ width: '60%' }} />
            <div className="ol-skel-bar" style={{ width: '85%' }} />
            <div className="ol-skel-bar" style={{ width: '40%' }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}
function iconeAnexo(ct: string): string {
  if (ct.startsWith('image/')) return '🖼️';
  if (ct === 'application/pdf') return '📄';
  if (ct.startsWith('text/')) return '📃';
  if (ct.includes('word') || ct.includes('document')) return '📝';
  if (ct.includes('sheet') || ct.includes('excel')) return '📊';
  if (ct.includes('zip') || ct.includes('compress')) return '🗜️';
  return '📎';
}
