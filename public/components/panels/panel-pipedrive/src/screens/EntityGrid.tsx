// screens/EntityGrid.tsx — DataGrid server-side: colunas selecionaveis/redimensionaveis,
// CSV, FILTROS AVANCADOS (multi-selecao, faixa de datas/valor — #8) e VISOES SALVAS (#9).
// @version 6.2.0  @created 2026-07-21
// v5.0.0 (Elevacao visual — Fase 1 fatia 3): TOOLBAR UNICA (busca + filtros a esquerda,
//        acoes a direita: atualizar / densidade / tela cheia / CSV / colunas / visoes),
//        CHIPS de filtro ativo (remocao individual) e ESTADOS padronizados (skeleton/vazio/erro).
// v6.0.0 (Elevacao visual — Fase 2 do grid): FIXAR COLUNAS (esq/dir, sticky), LINHAS EXPANSIVEIS
//        (master-detail), ZEBRA, SELECAO DE LINHAS (+exportar selecao), TOTALIZADORES (rodape),
//        ITENS-POR-PAGINA e TOOLTIP em conteudo truncado (Floating UI).
// v6.1.0 (Fase 3): prop `statsEntity` renderiza os CARDS-RESUMO da entidade acima da toolbar.
// v6.2.0 (Fase 3): prop `acoesExtras` (slot na toolbar) — usada pelo alternador Grade/Agenda.
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ArrowLeftToLine, ArrowRightToLine, ChevronDown, ChevronRight, Columns3, Download, Maximize2,
  Minimize2, PinOff, RotateCw, Rows3, SearchX, SlidersHorizontal, Star, X, type LucideIcon,
} from 'lucide-react';
import { apiGet, ApiError } from '../lib/api';
import { PageHeader } from './PageHeader';
import { EstadoErro, EstadoVazio, SkeletonLinhas } from './Estados';
import { useTooltipTruncado } from './TooltipTruncado';
import { KpiStrip } from './KpiStrip';
import type { PipePage, PipeStatus } from '../shell/types';

export interface GridColuna<T> {
  key: string;
  label: string;
  sortavel?: boolean;
  align?: 'right';
  fixa?: boolean;                                  // sempre visivel (nao pode ocultar)
  width?: number;                                  // largura padrao (px)
  render: (row: T) => ReactNode;
  csv?: (row: T) => string | number | null;        // valor para exportacao (default: row[key])
  total?: 'soma';                                  // totalizador no rodape (soma da pagina)
  valor?: (row: T) => number | null;               // numero p/ o totalizador (default: row[key])
  fmtTotal?: (n: number) => string;                // formatacao do total (default: pt-BR)
}
export interface GridFiltro {
  key: string;
  label: string;
  tipo?: 'select' | 'multi' | 'dateRange' | 'numRange';  // default: select
  options?: { value: string; label: string }[];
  facetKey?: string;
}

interface Props<T extends { id: number | string }> {
  titulo: string;
  Icon?: LucideIcon;
  entidadePlural: string;
  endpoint: string;
  colunas: GridColuna<T>[];
  filtros?: GridFiltro[];
  /** Filtros já aplicados ao abrir a tela (drill-down vindo de outro painel). */
  filtrosIniciais?: Record<string, string>;
  sortInicial: string;
  buscaPlaceholder: string;
  status?: PipeStatus;
  onRowClick?: (row: T) => void;
  statsEntity?: string;                            // liga os cards-resumo (/entity-stats?entity=…)
  acoesExtras?: ReactNode;                         // controles da tela (ex.: alternar grade/agenda)
  renderDetalhe?: (row: T) => ReactNode;           // master-detail (default: ficha com todas as colunas)
  semDetalhe?: boolean;                            // desliga a linha expansivel
}

type Pin = 'esq' | 'dir';
interface ColCfg { ordem: string[]; ocultas: string[]; larguras?: Record<string, number>; fixadas?: Record<string, Pin>; }
interface SavedView { nome: string; sort: string; dir: 'asc' | 'desc'; q: string; fVals: Record<string, string>; cols: ColCfg; }
interface Chip { id: string; texto: string; limpar: () => void; }
type Densidade = 'compacta' | 'padrao' | 'confortavel';

const EXPORT_MAX = 5000;
const DENS_KEY = 'pp:dens';        // preferencias GLOBAIS (valem para todos os grids)
const PERPAGE_KEY = 'pp:perpage';
const PERPAGE_OPCOES = [25, 50, 100, 200];
const L_SEL = 42;                  // largura da coluna de selecao
const L_EXP = 34;                  // largura da coluna do expansor
const DENS_OPCOES: { v: Densidade; label: string }[] = [
  { v: 'compacta', label: 'Compacta' },
  { v: 'padrao', label: 'Padrão' },
  { v: 'confortavel', label: 'Confortável' },
];

export function EntityGrid<T extends { id: number | string }>(p: Props<T>) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(p.sortInicial);
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [busca, setBusca] = useState('');
  const [q, setQ] = useState('');
  const [fVals, setFVals] = useState<Record<string, string>>(() => ({ ...(p.filtrosIniciais ?? {}) }));
  const [menuCols, setMenuCols] = useState(false);
  const [menuViews, setMenuViews] = useState(false);
  const [menuDens, setMenuDens] = useState(false);
  const [avancado, setAvancado] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [nomeVisao, setNomeVisao] = useState('');
  const [exportando, setExportando] = useState(false);
  const [sel, setSel] = useState<Map<T['id'], T>>(new Map());
  const [expandidas, setExpandidas] = useState<Set<T['id']>>(new Set());
  const tip = useTooltipTruncado();
  const temDetalhe = !p.semDetalhe;

  // Drill-down: quando a tela ja esta montada e chega OUTRO filtro inicial (o usuario
  // clicou num segundo indicador da Visao Geral), reaplica e volta para a pagina 1.
  // Comparacao por conteudo serializado: a prop chega como objeto novo a cada render.
  const drillKey = JSON.stringify(p.filtrosIniciais ?? {});
  const drillRef = useRef(drillKey);
  useEffect(() => {
    if (drillRef.current === drillKey) return;
    drillRef.current = drillKey;
    setFVals({ ...(p.filtrosIniciais ?? {}) });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillKey]);

  const [perPage, setPerPage] = useState<number>(() => {
    try { const n = Number(localStorage.getItem(PERPAGE_KEY)); if (PERPAGE_OPCOES.includes(n)) return n; } catch { /* ignora */ }
    return 25;
  });
  useEffect(() => { try { localStorage.setItem(PERPAGE_KEY, String(perPage)); } catch { /* ignora */ } }, [perPage]);

  const storageKey = `pp:cols:${p.endpoint}`;
  const [cfg, setCfg] = useState<ColCfg>(() => {
    try { const s = localStorage.getItem(storageKey); if (s) return JSON.parse(s) as ColCfg; } catch { /* ignora */ }
    return { ordem: p.colunas.map((c) => c.key), ocultas: [], larguras: {}, fixadas: {} };
  });
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(cfg)); } catch { /* ignora */ } }, [cfg, storageKey]);

  const viewsKey = `pp:views:${p.endpoint}`;
  const [views, setViews] = useState<SavedView[]>(() => {
    try { const s = localStorage.getItem(viewsKey); if (s) return JSON.parse(s) as SavedView[]; } catch { /* ignora */ }
    return [];
  });
  useEffect(() => { try { localStorage.setItem(viewsKey, JSON.stringify(views)); } catch { /* ignora */ } }, [views, viewsKey]);

  const [densidade, setDensidade] = useState<Densidade>(() => {
    try { const s = localStorage.getItem(DENS_KEY); if (s === 'compacta' || s === 'padrao' || s === 'confortavel') return s; } catch { /* ignora */ }
    return 'padrao';
  });
  useEffect(() => { try { localStorage.setItem(DENS_KEY, densidade); } catch { /* ignora */ } }, [densidade]);

  // Escape sai da tela cheia (mas NAO quando ha popover aberto — o popover fecha pelo backdrop).
  useEffect(() => {
    if (!telaCheia) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !menuCols && !menuViews && !menuDens) setTelaCheia(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [telaCheia, menuCols, menuViews, menuDens]);

  const colByKey = new Map(p.colunas.map((c) => [c.key, c]));
  const ordem = [
    ...cfg.ordem.filter((k) => colByKey.has(k)),
    ...p.colunas.map((c) => c.key).filter((k) => !cfg.ordem.includes(k)),
  ];
  const pinDe = (k: string): Pin | undefined => cfg.fixadas?.[k];
  const visiveis = ordem.map((k) => colByKey.get(k)!).filter((c) => !cfg.ocultas.includes(c.key));
  const colsEsq = visiveis.filter((c) => pinDe(c.key) === 'esq');
  const colsDir = visiveis.filter((c) => pinDe(c.key) === 'dir');
  const colsVisiveis = [...colsEsq, ...visiveis.filter((c) => !pinDe(c.key)), ...colsDir];
  const larguraDe = (c: GridColuna<T>): number => cfg.larguras?.[c.key] ?? c.width ?? (c.fixa ? 240 : c.align === 'right' ? 110 : 150);
  const larguraExtra = (temDetalhe ? L_EXP : 0) + L_SEL;
  const totalW = colsVisiveis.reduce((a, c) => a + larguraDe(c), 0) + larguraExtra;

  // Deslocamentos das colunas fixadas (sticky). Esquerda comeca depois das colunas utilitarias.
  const offEsq = new Map<string, number>();
  let accL = larguraExtra;
  for (const c of colsEsq) { offEsq.set(c.key, accL); accL += larguraDe(c); }
  const offDir = new Map<string, number>();
  let accR = 0;
  for (const c of [...colsDir].reverse()) { offDir.set(c.key, accR); accR += larguraDe(c); }

  function classeSticky(c: GridColuna<T>): string {
    const pin = pinDe(c.key);
    if (!pin) return '';
    const borda = pin === 'esq' ? (colsEsq[colsEsq.length - 1]?.key === c.key ? ' is-edge' : '')
                                : (colsDir[0]?.key === c.key ? ' is-edge' : '');
    return ` pp-stk pp-stk-${pin}${borda}`;
  }
  const estiloSticky = (c: GridColuna<T>): React.CSSProperties | undefined => {
    const pin = pinDe(c.key);
    if (!pin) return undefined;
    return pin === 'esq' ? { left: offEsq.get(c.key) } : { right: offDir.get(c.key) };
  };

  function toggleCol(k: string) {
    const c = colByKey.get(k); if (c?.fixa) return;
    setCfg((s) => ({ ...s, ocultas: s.ocultas.includes(k) ? s.ocultas.filter((x) => x !== k) : [...s.ocultas, k] }));
  }
  function fixarCol(k: string, pin: Pin | null) {
    setCfg((s) => {
      const f = { ...(s.fixadas ?? {}) };
      if (pin === null) delete f[k]; else f[k] = pin;
      return { ...s, fixadas: f };
    });
  }
  function moverCol(k: string, d2: -1 | 1) {
    setCfg((s) => { const arr = [...ordem]; const i = arr.indexOf(k); const j = i + d2;
      if (i < 0 || j < 0 || j >= arr.length) return s; [arr[i], arr[j]] = [arr[j], arr[i]]; return { ...s, ordem: arr }; });
  }
  function restaurarCols() { setCfg({ ordem: p.colunas.map((c) => c.key), ocultas: [], larguras: {}, fixadas: {} }); }

  function iniciarResize(e: React.MouseEvent, key: string) {
    e.preventDefault(); e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).closest('th') as HTMLElement;
    const startX = e.clientX; const startW = th.offsetWidth;
    const onMove = (ev: MouseEvent) => {
      const w = Math.max(60, Math.round(startW + ev.clientX - startX));
      setCfg((s) => ({ ...s, larguras: { ...(s.larguras ?? {}), [key]: w } }));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; };
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); document.body.style.cursor = 'col-resize';
  }

  const params: Record<string, string | number> = { page, per_page: perPage, sort, dir, q };
  for (const [k, v] of Object.entries(fVals)) { if (v) params[k] = v; }

  const { data, isLoading, isFetching, error, refetch } = useQuery<PipePage<T>>({
    queryKey: ['pipe', p.endpoint, params],
    queryFn: ({ signal }) => apiGet<PipePage<T>>(p.endpoint, params, signal),
    placeholderData: keepPreviousData,
    enabled: p.status?.status === 'connected',
  });

  const esc = (v: unknown) => { const s = v == null ? '' : String(v); return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const valorCsv = (c: GridColuna<T>, row: T) => c.csv ? c.csv(row) : (row as Record<string, unknown>)[c.key] ?? '';
  function baixarCsv(linhas: T[], sufixo = '') {
    const cols = colsVisiveis;
    const txt = [cols.map((c) => esc(c.label)).join(';'), ...linhas.map((row) => cols.map((c) => esc(valorCsv(c, row))).join(';'))];
    const blob = new Blob(['﻿' + txt.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pipedrive-${p.endpoint.replace(/\W/g, '')}${sufixo}.csv`;
    a.style.display = 'none'; document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  }

  async function exportarCsv() {
    setExportando(true);
    try {
      const base: Record<string, string | number> = { sort, dir, q, per_page: 500 };
      for (const [k, v] of Object.entries(fVals)) { if (v) base[k] = v; }
      let acc: T[] = []; let pg = 1; let totalPages = 1;
      do {
        const d = await apiGet<PipePage<T>>(p.endpoint, { ...base, page: pg });
        acc = acc.concat(d.rows ?? []); totalPages = d.pages || 1; pg++;
      } while (pg <= totalPages && acc.length < EXPORT_MAX);
      baixarCsv(acc);
    } catch { /* silencioso: a UI segue */ } finally { setExportando(false); }
  }

  function ordenar(key: string) {
    if (sort === key) setDir(dir === 'asc' ? 'desc' : 'asc');
    else { setSort(key); setDir('desc'); }
    setPage(1);
  }
  function setFiltro(key: string, value: string) { setFVals((s) => ({ ...s, [key]: value })); setPage(1); }
  function limparChaves(...keys: string[]) {
    setFVals((s) => { const n = { ...s }; for (const k of keys) delete n[k]; return n; });
    setPage(1);
  }
  function limpar() { setBusca(''); setQ(''); setFVals({}); setPage(1); }

  // ── Selecao de linhas ───────────────────────────────────────
  function toggleLinha(row: T) {
    setSel((s) => { const n = new Map(s); n.has(row.id) ? n.delete(row.id) : n.set(row.id, row); return n; });
  }
  function toggleTodasDaPagina(marcar: boolean) {
    setSel((s) => {
      const n = new Map(s);
      for (const r of (data?.rows ?? [])) { marcar ? n.set(r.id, r) : n.delete(r.id); }
      return n;
    });
  }
  // ── Linhas expansiveis ──────────────────────────────────────
  function toggleExpandir(id: T['id']) {
    setExpandidas((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  // ── Visoes salvas (#9) ──────────────────────────────────────
  function salvarVisao() {
    const nome = nomeVisao.trim(); if (!nome) return;
    const nova: SavedView = { nome, sort, dir, q, fVals, cols: cfg };
    setViews((s) => [...s.filter((v) => v.nome !== nome), nova]);
    setNomeVisao('');
  }
  function aplicarVisao(v: SavedView) {
    setSort(v.sort); setDir(v.dir); setQ(v.q); setBusca(v.q);
    setFVals(v.fVals ?? {}); if (v.cols) setCfg(v.cols); setPage(1); setMenuViews(false);
  }
  function excluirVisao(nome: string) { setViews((s) => s.filter((v) => v.nome !== nome)); }

  if (p.status?.status !== 'connected') {
    return (
      <div>
        <PageHeader Icon={p.Icon} titulo={p.titulo} descricao={`${p.entidadePlural} na base local`} />
        <div className="pp-card" style={{ maxWidth: 'none' }}>
          <EstadoErro titulo="Integração não conectada"
            detalhe="Conecte o token do Pipedrive na tela de Configurações para ver estes dados." />
        </div>
      </div>
    );
  }

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const temFiltroAtivo = q !== '' || Object.values(fVals).some(Boolean);
  const rangeFiltros = (p.filtros ?? []).filter((f) => f.tipo === 'dateRange' || f.tipo === 'numRange');
  const selNaPagina = rows.filter((r) => sel.has(r.id)).length;
  const colsTotalizadas = colsVisiveis.filter((c) => c.total === 'soma');
  const opcoesDe = (f: GridFiltro): { value: string; label: string }[] => {
    if (f.options) return f.options;
    if (f.facetKey) {
      const arr = (data?.facets?.[f.facetKey] as unknown[] | undefined) ?? [];
      return arr.map((v) => (typeof v === 'object' && v !== null)
        ? { value: String((v as { id?: unknown; value?: unknown }).id ?? (v as { value?: unknown }).value ?? ''), label: String((v as { name?: unknown; label?: unknown }).name ?? (v as { label?: unknown }).label ?? '') }
        : { value: String(v), label: String(v) });
    }
    return [];
  };
  const somaDe = (c: GridColuna<T>): number => rows.reduce((acc, r) => {
    const n = c.valor ? c.valor(r) : Number((r as Record<string, unknown>)[c.key]);
    return acc + (Number.isFinite(n) && n != null ? Number(n) : 0);
  }, 0);

  // Ficha padrao do master-detail: TODAS as colunas (inclusive as ocultas).
  const detalhePadrao = (row: T) => (
    <div className="pp-det">
      {ordem.map((k) => { const c = colByKey.get(k)!; return (
        <div className="pp-det-item" key={k}>
          <span className="pp-det-k">{c.label}</span>
          <span className="pp-det-v">{c.render(row)}</span>
        </div>
      ); })}
    </div>
  );

  // ── Chips de filtro ativo (toolbar unica) ───────────────────
  const chips: Chip[] = [];
  if (q) chips.push({ id: '__q', texto: `Busca: “${q}”`, limpar: () => { setQ(''); setBusca(''); setPage(1); } });
  for (const f of p.filtros ?? []) {
    const tipo = f.tipo ?? 'select';
    if (tipo === 'select' || tipo === 'multi') {
      const v = fVals[f.key]; if (!v) continue;
      const ops = opcoesDe(f);
      const rotulo = (val: string) => ops.find((o) => o.value === val)?.label ?? val;
      let texto: string;
      if (tipo === 'multi') {
        const selecionados = v.split(',').filter(Boolean).map(rotulo);
        texto = selecionados.length <= 2 ? selecionados.join(', ') : `${selecionados.slice(0, 2).join(', ')} +${selecionados.length - 2}`;
      } else texto = rotulo(v);
      chips.push({ id: f.key, texto: `${f.label}: ${texto}`, limpar: () => setFiltro(f.key, '') });
    } else {
      const [ka, kb] = tipo === 'numRange' ? [`${f.key}_min`, `${f.key}_max`] : [`${f.key}_from`, `${f.key}_to`];
      const va = fVals[ka]; const vb = fVals[kb];
      if (!va && !vb) continue;
      const fmt = (s: string) => {
        if (tipo === 'dateRange') { const d = new Date(`${s}T00:00:00`); return isNaN(d.getTime()) ? s : d.toLocaleDateString('pt-BR'); }
        const n = Number(s); return Number.isFinite(n) ? n.toLocaleString('pt-BR') : s;
      };
      const texto = va && vb ? `${fmt(va)} – ${fmt(vb)}` : va ? `≥ ${fmt(va)}` : `≤ ${fmt(vb)}`;
      chips.push({ id: f.key, texto: `${f.label}: ${texto}`, limpar: () => limparChaves(ka, kb) });
    }
  }

  const acoes = (
    <>
      <button className="pp-iconbtn" onClick={() => void refetch()} disabled={isFetching}
        title="Atualizar dados" aria-label="Atualizar dados">
        <RotateCw size={15} className={isFetching ? 'pp-spin' : undefined} />
      </button>
      <div style={{ position: 'relative' }}>
        <button className="pp-iconbtn" onClick={() => setMenuDens((v) => !v)} title="Densidade das linhas" aria-label="Densidade das linhas">
          <Rows3 size={15} />
        </button>
        {menuDens && (
          <>
            <div className="pp-colmenu-bg" onClick={() => setMenuDens(false)} />
            <div className="pp-colmenu" style={{ width: 190 }}>
              <div className="pp-colmenu-h">Densidade</div>
              {DENS_OPCOES.map((o) => (
                <div className="pp-colmenu-item" key={o.v}>
                  <label>
                    <input type="radio" name="pp-dens" checked={densidade === o.v}
                      onChange={() => { setDensidade(o.v); setMenuDens(false); }} />{o.label}
                  </label>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <button className="pp-iconbtn" onClick={() => setTelaCheia((v) => !v)}
        title={telaCheia ? 'Sair da tela cheia (Esc)' : 'Tela cheia'} aria-label={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}>
        {telaCheia ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </button>
      <span className="pp-toolbar-sep" aria-hidden />
      <button className="pp-iconbtn" disabled={exportando || total === 0} onClick={exportarCsv}
        title={total > EXPORT_MAX ? `Exporta os primeiros ${EXPORT_MAX.toLocaleString('pt-BR')} registros` : 'Exportar para CSV'}
        aria-label="Exportar para CSV">
        <Download size={15} />
      </button>
      <div style={{ position: 'relative' }}>
        <button className="pp-iconbtn" onClick={() => setMenuViews((v) => !v)}
          title="Visões salvas" aria-label="Visões salvas">
          <Star size={15} />{views.length > 0 && <span className="pp-iconbtn-n">{views.length}</span>}
        </button>
        {menuViews && (
          <>
            <div className="pp-colmenu-bg" onClick={() => setMenuViews(false)} />
            <div className="pp-colmenu" style={{ width: 264 }}>
              <div className="pp-colmenu-h">Visões salvas</div>
              {views.length === 0 ? (
                <div className="pp-colmenu-item" style={{ color: 'var(--pp-text-dim)', fontSize: 12.5 }}>Nenhuma visão salva ainda.</div>
              ) : views.map((v) => (
                <div className="pp-colmenu-item" key={v.nome}>
                  <button className="pp-view-apply" onClick={() => aplicarVisao(v)} title="Aplicar visão">{v.nome}</button>
                  <button className="pp-view-del" onClick={() => excluirVisao(v.nome)} title="Excluir">✕</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <input className="pp-input" style={{ fontFamily: 'inherit', padding: '7px 10px' }} placeholder="Salvar visão atual…"
                  value={nomeVisao} onChange={(e) => setNomeVisao(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') salvarVisao(); }} />
                <button className="pp-btn" disabled={!nomeVisao.trim()} onClick={salvarVisao}>Salvar</button>
              </div>
            </div>
          </>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <button className="pp-iconbtn" onClick={() => setMenuCols((v) => !v)} title="Escolher e fixar colunas" aria-label="Escolher e fixar colunas">
          <Columns3 size={15} />
        </button>
        {menuCols && (
          <>
            <div className="pp-colmenu-bg" onClick={() => setMenuCols(false)} />
            <div className="pp-colmenu" style={{ width: 296 }}>
              <div className="pp-colmenu-h">Colunas exibidas · fixar</div>
              {ordem.map((k, i) => { const c = colByKey.get(k)!; const pin = pinDe(k); return (
                <div className="pp-colmenu-item" key={k}>
                  <label className={c.fixa ? 'fixa' : ''}>
                    <input type="checkbox" checked={!cfg.ocultas.includes(k)} disabled={c.fixa} onChange={() => toggleCol(k)} />{c.label}
                  </label>
                  <span className="pp-colmenu-mv">
                    <button className={pin === 'esq' ? 'is-on' : ''} onClick={() => fixarCol(k, pin === 'esq' ? null : 'esq')}
                      title={pin === 'esq' ? 'Soltar coluna' : 'Fixar à esquerda'} aria-label="Fixar à esquerda">
                      {pin === 'esq' ? <PinOff size={11} /> : <ArrowLeftToLine size={11} />}
                    </button>
                    <button className={pin === 'dir' ? 'is-on' : ''} onClick={() => fixarCol(k, pin === 'dir' ? null : 'dir')}
                      title={pin === 'dir' ? 'Soltar coluna' : 'Fixar à direita'} aria-label="Fixar à direita">
                      {pin === 'dir' ? <PinOff size={11} /> : <ArrowRightToLine size={11} />}
                    </button>
                    <button disabled={i === 0} onClick={() => moverCol(k, -1)} title="Subir">▲</button>
                    <button disabled={i === ordem.length - 1} onClick={() => moverCol(k, 1)} title="Descer">▼</button>
                  </span>
                </div>
              ); })}
              <button className="pp-btn" style={{ width: '100%', marginTop: 8 }} onClick={restaurarCols}>Restaurar padrão</button>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className={telaCheia ? 'pp-gridwrap is-fs' : 'pp-gridwrap'}>
      <PageHeader Icon={p.Icon} titulo={p.titulo}
        contagem={total.toLocaleString('pt-BR')}
        descricao={`${p.entidadePlural} na base local`}
        atualizando={isFetching} />

      {p.statsEntity && <KpiStrip entity={p.statsEntity} />}

      {/* Toolbar unica: busca + filtros a esquerda, acoes a direita */}
      <div className="pp-toolbar">
        <div className="pp-toolbar-l">
          <form onSubmit={(e) => { e.preventDefault(); setQ(busca.trim()); setPage(1); }} style={{ display: 'contents' }}>
            <input className="pp-input" style={{ maxWidth: 280 }} placeholder={p.buscaPlaceholder} value={busca} onChange={(e) => setBusca(e.target.value)} />
          </form>
          {(p.filtros ?? []).map((f) => {
            const tipo = f.tipo ?? 'select';
            if (tipo === 'multi') return <MultiFiltro key={f.key} f={f} opcoes={opcoesDe(f)} valor={fVals[f.key] ?? ''} onChange={(v) => setFiltro(f.key, v)} />;
            if (tipo === 'select') return (
              <select key={f.key} className="pp-select" value={fVals[f.key] ?? ''} onChange={(e) => setFiltro(f.key, e.target.value)}>
                <option value="">{f.label}</option>
                {opcoesDe(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            );
            return null; // dateRange/numRange vao no painel Avançado
          })}
          {rangeFiltros.length > 0 && (
            <button className={`pp-btn${avancado ? ' pp-primary' : ''}`} onClick={() => setAvancado((v) => !v)}>
              <SlidersHorizontal size={14} /> Avançado{avancado ? ' ▴' : ' ▾'}
            </button>
          )}
        </div>
        <div className="pp-toolbar-r">{p.acoesExtras}{p.acoesExtras && <span className="pp-toolbar-sep" aria-hidden />}{acoes}</div>
      </div>

      {/* Chips do que esta filtrando agora (remocao individual) */}
      {chips.length > 0 && (
        <div className="pp-fchips">
          {chips.map((c) => (
            <span className="pp-fchip" key={c.id}>
              {c.texto}
              <button onClick={c.limpar} title="Remover filtro" aria-label={`Remover filtro ${c.texto}`}><X size={12} /></button>
            </span>
          ))}
          <button className="pp-fchip-limpar" onClick={limpar}>Limpar tudo</button>
        </div>
      )}

      {/* Barra da selecao (so aparece com linhas marcadas) */}
      {sel.size > 0 && (
        <div className="pp-selbar">
          <strong>{sel.size.toLocaleString('pt-BR')}</strong> {sel.size === 1 ? 'linha selecionada' : 'linhas selecionadas'}
          <button className="pp-btn" onClick={() => baixarCsv([...sel.values()], '-selecao')}>
            <Download size={14} /> Exportar seleção
          </button>
          <button className="pp-fchip-limpar" onClick={() => setSel(new Map())}>Limpar seleção</button>
        </div>
      )}

      {/* Painel de filtros avançados (faixas) */}
      {avancado && rangeFiltros.length > 0 && (
        <div className="pp-adv">
          {rangeFiltros.map((f) => f.tipo === 'numRange' ? (
            <div className="pp-adv-item" key={f.key}>
              <label className="pp-label" style={{ margin: 0 }}>{f.label}</label>
              <div className="pp-range">
                <input className="pp-input" type="number" placeholder="mín" value={fVals[`${f.key}_min`] ?? ''} onChange={(e) => setFiltro(`${f.key}_min`, e.target.value)} />
                <span>–</span>
                <input className="pp-input" type="number" placeholder="máx" value={fVals[`${f.key}_max`] ?? ''} onChange={(e) => setFiltro(`${f.key}_max`, e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="pp-adv-item" key={f.key}>
              <label className="pp-label" style={{ margin: 0 }}>{f.label}</label>
              <div className="pp-range">
                <input className="pp-input" type="date" value={fVals[`${f.key}_from`] ?? ''} onChange={(e) => setFiltro(`${f.key}_from`, e.target.value)} />
                <span>–</span>
                <input className="pp-input" type="date" value={fVals[`${f.key}_to`] ?? ''} onChange={(e) => setFiltro(`${f.key}_to`, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pp-card pp-gridcard" style={{ maxWidth: 'none', padding: 0, overflow: 'hidden' }}>
        {error instanceof ApiError ? (
          <EstadoErro
            detalhe={error.ehAuth ? 'Sua sessão expirou. Recarregue a página e entre novamente.' : 'Falha ao consultar a base local.'}
            onRetry={error.ehAuth ? undefined : () => void refetch()} />
        ) : (
          <div style={{ overflowX: 'auto' }} {...tip.handlers}>
            <table className={`pp-table pp-zebra pp-dens-${densidade}`} style={{ tableLayout: 'fixed', width: totalW }}>
              <colgroup>
                {temDetalhe && <col style={{ width: L_EXP }} />}
                <col style={{ width: L_SEL }} />
                {colsVisiveis.map((c) => <col key={c.key} style={{ width: larguraDe(c) }} />)}
              </colgroup>
              <thead>
                <tr>
                  {temDetalhe && <th className="pp-th pp-stk pp-stk-esq" style={{ left: 0 }} aria-label="Expandir" />}
                  <th className="pp-th pp-stk pp-stk-esq pp-th-sel" style={{ left: temDetalhe ? L_EXP : 0 }}>
                    <input type="checkbox" aria-label="Selecionar todas as linhas desta página"
                      checked={rows.length > 0 && selNaPagina === rows.length}
                      ref={(el) => { if (el) el.indeterminate = selNaPagina > 0 && selNaPagina < rows.length; }}
                      onChange={(e) => toggleTodasDaPagina(e.target.checked)} />
                  </th>
                  {colsVisiveis.map((c) => (
                    <th key={c.key} className={`${c.align === 'right' ? 'ta-r pp-th' : 'pp-th'}${classeSticky(c)}`}
                      style={{ ...estiloSticky(c), ...(c.sortavel ? { cursor: 'pointer' } : {}) }}
                      onClick={c.sortavel ? () => ordenar(c.key) : undefined}>
                      {c.label}{sort === c.key ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}
                      <span className="pp-th-resize" onMouseDown={(e) => iniciarResize(e, c.key)} onClick={(e) => e.stopPropagation()} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonLinhas colunas={colsVisiveis.length + 1 + (temDetalhe ? 1 : 0)} linhas={10} />
                ) : rows.length === 0 ? (
                  <tr><td colSpan={colsVisiveis.length + 1 + (temDetalhe ? 1 : 0)} style={{ whiteSpace: 'normal' }}>
                    <EstadoVazio
                      Icon={temFiltroAtivo ? SearchX : undefined}
                      titulo={temFiltroAtivo ? 'Nenhum resultado para estes filtros' : `Nenhum registro de ${p.entidadePlural.toLowerCase()}`}
                      descricao={temFiltroAtivo
                        ? 'Ajuste a busca ou remova filtros para ampliar o resultado.'
                        : 'Rode uma sincronização em Configurações para popular a base local.'}
                      acao={temFiltroAtivo ? <button className="pp-btn" onClick={limpar}>Limpar filtros</button> : undefined} />
                  </td></tr>
                ) : rows.map((row, i) => {
                  const marcada = sel.has(row.id);
                  const aberta = expandidas.has(row.id);
                  return (
                    <Fragment key={row.id}>
                      <tr className={`${i % 2 === 1 ? 'is-par ' : ''}${marcada ? 'is-sel ' : ''}${p.onRowClick ? 'pp-clik' : ''}`}
                        onClick={p.onRowClick ? () => p.onRowClick!(row) : undefined}>
                        {temDetalhe && (
                          <td className="pp-stk pp-stk-esq pp-td-exp" style={{ left: 0 }}>
                            <button className="pp-expbtn" aria-expanded={aberta} aria-label={aberta ? 'Recolher detalhes' : 'Ver detalhes'}
                              onClick={(e) => { e.stopPropagation(); toggleExpandir(row.id); }}>
                              {aberta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          </td>
                        )}
                        <td className="pp-stk pp-stk-esq pp-td-sel" style={{ left: temDetalhe ? L_EXP : 0 }}>
                          <input type="checkbox" checked={marcada} aria-label="Selecionar linha"
                            onClick={(e) => e.stopPropagation()} onChange={() => toggleLinha(row)} />
                        </td>
                        {colsVisiveis.map((c) => (
                          <td key={c.key} className={`${c.align === 'right' ? 'ta-r' : ''}${classeSticky(c)}`} style={estiloSticky(c)}>
                            {c.render(row)}
                          </td>
                        ))}
                      </tr>
                      {aberta && (
                        <tr className="pp-det-tr">
                          <td colSpan={colsVisiveis.length + 1 + (temDetalhe ? 1 : 0)} style={{ whiteSpace: 'normal' }}>
                            {p.renderDetalhe ? p.renderDetalhe(row) : detalhePadrao(row)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
              {colsTotalizadas.length > 0 && rows.length > 0 && !isLoading && (
                <tfoot>
                  <tr>
                    {temDetalhe && <td className="pp-stk pp-stk-esq" style={{ left: 0 }} />}
                    <td className="pp-stk pp-stk-esq" style={{ left: temDetalhe ? L_EXP : 0 }} />
                    {colsVisiveis.map((c, i) => {
                      const soma = c.total === 'soma' ? somaDe(c) : null;
                      return (
                        <td key={c.key} className={`${c.align === 'right' ? 'ta-r' : ''}${classeSticky(c)}`} style={estiloSticky(c)}>
                          {soma != null
                            ? <span className="pp-tot">{c.fmtTotal ? c.fmtTotal(soma) : soma.toLocaleString('pt-BR')}</span>
                            : (i === 0 ? <span className="pp-tot-lbl">Σ nesta página</span> : null)}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      <div className="pp-pager">
        <label className="pp-pager-info" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Itens por página
          <select className="pp-select" style={{ padding: '5px 8px' }} value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
            {PERPAGE_OPCOES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <span className="pp-pager-info">
          {total > 0 ? `${((page - 1) * perPage + 1).toLocaleString('pt-BR')}–${Math.min(page * perPage, total).toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')}` : '—'}
        </span>
        <button className="pp-btn" disabled={page <= 1} onClick={() => setPage((x) => Math.max(1, x - 1))}>‹ Anterior</button>
        <span className="pp-pager-info">Página {page} de {Math.max(1, pages)}</span>
        <button className="pp-btn" disabled={page >= pages} onClick={() => setPage((x) => x + 1)}>Próxima ›</button>
      </div>

      {tip.tooltip}
    </div>
  );
}

// Filtro de multi-selecao (checkboxes num popover). Valor = lista separada por virgula.
function MultiFiltro({ f, opcoes, valor, onChange }: { f: GridFiltro; opcoes: { value: string; label: string }[]; valor: string; onChange: (v: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const sel = valor ? valor.split(',').filter(Boolean) : [];
  const toggle = (v: string) => { const s = new Set(sel); s.has(v) ? s.delete(v) : s.add(v); onChange([...s].join(',')); };
  return (
    <div style={{ position: 'relative' }}>
      <button className={`pp-btn${sel.length ? ' pp-primary' : ''}`} onClick={() => setAberto((v) => !v)}>{f.label}{sel.length ? ` (${sel.length})` : ''} ▾</button>
      {aberto && (
        <>
          <div className="pp-colmenu-bg" onClick={() => setAberto(false)} />
          <div className="pp-colmenu pp-colmenu-esq">
            <div className="pp-colmenu-h">{f.label}</div>
            {opcoes.length === 0 ? (
              <div className="pp-colmenu-item" style={{ color: 'var(--pp-text-dim)', fontSize: 12.5 }}>Sem opções.</div>
            ) : opcoes.map((o) => (
              <div className="pp-colmenu-item" key={o.value}>
                <label><input type="checkbox" checked={sel.includes(o.value)} onChange={() => toggle(o.value)} />{o.label}</label>
              </div>
            ))}
            {sel.length > 0 && <button className="pp-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => onChange('')}>Limpar seleção</button>}
          </div>
        </>
      )}
    </div>
  );
}
