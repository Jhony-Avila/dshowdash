// vc/VisualComposer.tsx — Avatar Studio Visual Composer (frente ux, flag as6.visual_composer).
// Experiência completa: Modo Visual (palco+hotspots+catálogo) + Criação Guiada + Mais (Looks/avançado).
// Reusa AvatarStore, catálogo, favoritos, presets, save (zero store novo, zero 2ª fonte, motor intocado).
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  ChevronLeft, Undo2, Redo2, Save, MoreHorizontal, Search, Heart, Lock, Check, X, Sparkles,
  PanelRightClose, PanelRightOpen, ArrowLeft, ArrowRight, SkipForward, Palette, Plus,
} from 'lucide-react';
import type { AvatarConfig, CategoriaId } from '../domain/types';
import { AvatarStore } from '../nucleo/estado';
import { deLegado2d, paraLegado2d } from '../nucleo/adaptadores';
import { validarConfig, itensDe, svgItemIsolado } from '../services/AvatarCatalog';
import { comItem } from '../components/GradeItens';
import { AvatarSvg } from '../components/AvatarSvg';
import { salvarAvatar } from '../services/AvatarService';
import { favoritos, alternarFavorito } from '../services/Progresso';
import { lerBloqueios } from '../shell/Equipados';
import MaisPainel from './MaisPainel';
import { slotsAtivos } from '../components/Cores';
import { CORES_SUGERIDAS } from '../services/AvatarCatalog';
import type { SlotCor } from '../domain/types';
import { GRUPOS, grupoPorId } from './grupos';
import type { GrupoVisual } from './grupos';
import '../styles/visual-composer.css';

const reduzido = (): boolean => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const ehMobile = (): boolean => { try { return window.matchMedia('(max-width: 768px)').matches; } catch { return false; } };

export interface PropsVisualComposer {
  store?: AvatarStore;            // §608: quando o App eleva o store canônico, ele é a fonte única
  configInicial: AvatarConfig;
  versaoBase: number;
  desbloqueados?: Set<string>;
  vida?: { iaDisponivel?: boolean } | null;
  aoVoltar?: () => void;
  aoModoClassico?: (cfg: AvatarConfig) => void;
}

interface ItemView { it: { id: string; nome: string; tema?: string; novo?: boolean; bloqueadoPor?: string; slot?: string }; cat: CategoriaId; }

// Resolutor único de itens por slot/categoria — usado pelo catálogo visual E pela guiada.
// Nunca mistura slots: honra grupo.slotsIn (só estes) e grupo.slotsOut (exclui estes).
function itensPorCats(cats: CategoriaId[], grupo: GrupoVisual): ItemView[] {
  let lista: ItemView[] = cats.flatMap((c) => itensDe(c).map((it) => ({ it: it as ItemView['it'], cat: c })));
  if (grupo.slotsIn && grupo.slotsIn.length) { const s = new Set(grupo.slotsIn); lista = lista.filter(({ it }) => !!it.slot && s.has(it.slot)); }
  if (grupo.slotsOut && grupo.slotsOut.length) { const s = new Set(grupo.slotsOut); lista = lista.filter(({ it }) => !it.slot || !s.has(it.slot)); }
  return lista;
}

// Editor de cores NATIVO do VC (reusa o contrato config.cores + slotsAtivos + CORES_SUGERIDAS).
// Sem HSL técnico na superfície principal: swatches alinhados + "Cor personalizada" (seletor nativo).
const NOMES_COR: Record<SlotCor, string> = { pele: 'Pele', cabelo: 'Cabelo', roupa: 'Roupa', destaque: 'Destaque' };
function EditorCores({ config, aplicar }: { config: AvatarConfig; aplicar: (c: AvatarConfig) => void }) {
  const slots = slotsAtivos(config);
  if (!slots.length) return <div className="vc-vazio">Este visual não tem cores editáveis.</div>;
  const trocar = (slot: SlotCor, hex: string) => aplicar(validarConfig({ ...config, cores: { ...config.cores, [slot]: hex } }));
  return (
    <div className="vc-cores">
      {slots.map((slot) => (
        <div key={slot} className="vc-cor-slot">
          <div className="vc-cor-nome">{NOMES_COR[slot]}</div>
          <div className="vc-cor-sws" role="radiogroup" aria-label={`Cor de ${NOMES_COR[slot]}`}>
            {CORES_SUGERIDAS[slot].map((hex) => { const sel = config.cores[slot] === hex; return (
              <button key={hex} type="button" role="radio" aria-checked={sel} aria-label={hex}
                className={`vc-cor-sw ${sel ? 'vc-cor-sw-on' : ''}`} style={{ background: hex }} onClick={() => trocar(slot, hex)}>
                {sel && <Check size={13} aria-hidden />}
              </button>
            ); })}
            <label className="vc-cor-custom" title="Cor personalizada">
              <input type="color" value={config.cores[slot]} onChange={(e) => trocar(slot, e.target.value)} aria-label={`Cor personalizada de ${NOMES_COR[slot]}`} />
              <Plus size={15} aria-hidden />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VisualComposer({ store: storeProp, configInicial, versaoBase, desbloqueados, vida, aoVoltar, aoModoClassico }: PropsVisualComposer) {
  // Store canônico: se o App injetou um (ponte Visual↔clássico), ele é a fonte única e SOBREVIVE à troca de modo.
  const storeLocal = useMemo(() => new AvatarStore(deLegado2d(validarConfig(configInicial)), versaoBase), [configInicial, versaoBase]);
  const store = storeProp ?? storeLocal;
  const estadoVisivel = useSyncExternalStore(store.assinar, () => store.estadoVisivel);
  const config = useMemo(() => validarConfig(paraLegado2d(estadoVisivel)), [estadoVisivel]);
  // Pendência e pilhas derivadas do store (não recriadas por comparação visual): persistem no round-trip.
  const pendente = useSyncExternalStore(store.assinar, () => store.temMudancas);
  const podeDesfazer = useSyncExternalStore(store.assinar, () => store.podeDesfazer);
  const podeRefazer = useSyncExternalStore(store.assinar, () => store.podeRefazer);
  const desbloq = desbloqueados ?? new Set<string>();
  // Bloqueio: fonte única = lerBloqueios() (slots travados, §70.1) + disponibilidade por conquista (bloqueadoPor).
  const bloqSlots = useMemo(() => { try { return lerBloqueios(); } catch { return new Set<string>(); } }, []);

  // Grupos dinâmicos: só entram no trilho os que têm conteúdo real (ex.: Companheiros só se houver itens com slot próprio).
  const gruposVisiveis = useMemo(() => GRUPOS.filter((g) => {
    if (!g.dinamico) return true;
    const inSet = g.slotsIn && g.slotsIn.length ? new Set(g.slotsIn) : null;
    return g.cats.some((c) => itensDe(c).some((it) => {
      const sl = (it as { slot?: string }).slot;
      return inSet ? (!!sl && inSet.has(sl)) : true;
    }));
  }), []);

  const [modo, setModo] = useState<'visual' | 'guiado'>('visual');
  const [grupoId, setGrupoId] = useState('base');
  const grupo = grupoPorId(grupoId, gruposVisiveis);
  const [subId, setSubId] = useState<string | null>(null);
  const [aba, setAba] = useState<'catalogo' | 'favoritos' | 'atual'>('catalogo');
  const [filtroNovos, setFiltroNovos] = useState(false);
  const [filtroDispon, setFiltroDispon] = useState(false);
  const [busca, setBusca] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [painelRecolhido, setPainelRecolhido] = useState(false);
  const [gaveta, setGaveta] = useState<'recolhida' | 'meio' | 'expandida'>('meio');
  const [mais, setMais] = useState(false);
  const [coresAberto, setCoresAberto] = useState(false);
  const focoAntesRef = useRef<HTMLElement | null>(null);
  const abrirComFoco = useCallback((abrir: () => void) => { focoAntesRef.current = (document.activeElement as HTMLElement) ?? null; abrir(); }, []);
  const fecharComFoco = useCallback((fechar: () => void) => { fechar(); const t = focoAntesRef.current; if (t && typeof t.focus === 'function') setTimeout(() => t.focus(), 0); }, []);
  const [salv, setSalv] = useState<'idle' | 'salvando' | 'salvo' | 'erro'>('idle');
  const [favs, setFavs] = useState<Set<string>>(() => { try { return favoritos(); } catch { return new Set(); } });
  const [avisoSaida, setAvisoSaida] = useState<null | (() => void)>(null);

  function bloqueado(it: { id: string; bloqueadoPor?: string; slot?: string }): boolean {
    const porSlot = !!it.slot && bloqSlots.has(it.slot);            // slot travado (lerBloqueios)
    const porConquista = !!it.bloqueadoPor && !desbloq.has(it.id);  // ainda não desbloqueado
    return porSlot || porConquista;
  }
  const camadas = config.camadas as Record<string, string | undefined>;
  function equipadoDe(cat: CategoriaId, id: string): boolean { return cat === 'base' ? config.base === id : camadas?.[cat] === id; }

  const aplicar = useCallback((novo: AvatarConfig) => {
    const antes = store.estadoDraft;
    const alvo = deLegado2d(validarConfig(novo));
    store.executar({ nome: 'vc:aplicar', executar: () => alvo, desfazer: () => antes });
    setSalv('idle');
  }, [store]);

  const salvar = useCallback(async () => {
    setSalv('salvando');
    try {
      const r = await salvarAvatar(config, store.versao);
      if (r.ok) { setSalv('salvo'); store.confirmarPersistencia(typeof r.versao === 'number' ? r.versao : store.versao); }
      else setSalv('erro');
    } catch { setSalv('erro'); }
  }, [config, store]);

  const selecionarGrupo = useCallback((g: GrupoVisual) => {
    setGrupoId(g.id); setSubId(g.subs && g.subs.length ? g.subs[0].id : null); setAba('catalogo');
    if (ehMobile()) setGaveta('meio');
  }, []);

  const sair = useCallback(() => { if (pendente) setAvisoSaida(() => () => aoVoltar?.()); else aoVoltar?.(); }, [pendente, aoVoltar]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (pendente) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h);
  }, [pendente]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); if (e.shiftKey) store.refazer(); else store.desfazer(); }
      else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); store.refazer(); }
      else if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); void salvar(); }
      else if (k === 'escape') { setBuscaAberta(false); setAvisoSaida(null); if (coresAberto) fecharComFoco(() => setCoresAberto(false)); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [store, salvar, coresAberto, fecharComFoco]);

  const cats: CategoriaId[] = useMemo(() => {
    if (grupo.subs && subId) { const s = grupo.subs.find((x) => x.id === subId); return s ? [s.cat] : grupo.cats; }
    return grupo.cats;
  }, [grupo, subId]);

  // Enquadramento: sub tem prioridade sobre o grupo (rosto->olhos, cabelo->barba, etc.).
  const focoAtivo = useMemo(() => {
    if (grupo.subs && subId) { const s = grupo.subs.find((x) => x.id === subId); if (s?.foco) return s.foco; }
    return grupo.foco;
  }, [grupo, subId]);

  const itens: ItemView[] = useMemo(() => {
    let lista: ItemView[] = itensPorCats(cats, grupo);
    if (aba === 'favoritos') lista = lista.filter(({ it }) => favs.has(it.id));
    if (aba === 'atual') lista = lista.filter(({ it, cat }) => equipadoDe(cat, it.id));
    if (filtroNovos) lista = lista.filter(({ it }) => !!it.novo);
    if (filtroDispon) lista = lista.filter(({ it }) => !bloqueado(it));
    const q = busca.trim().toLowerCase();
    if (q) lista = lista.filter(({ it }) => it.nome.toLowerCase().includes(q) || (it.tema ?? '').toLowerCase().includes(q));
    return lista;
  }, [grupo, cats, aba, favs, filtroNovos, filtroDispon, busca, config]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFav = useCallback((id: string) => { try { setFavs(new Set(alternarFavorito(id))); } catch { /* ok */ } }, []);

  // ---------- CRIAÇÃO GUIADA ----------
  const passos = useMemo(() => gruposVisiveis.filter((g) => g.id !== 'estilo').concat(gruposVisiveis.filter((g) => g.id === 'estilo')), [gruposVisiveis]);
  const [passo, setPasso] = useState(0);
  const totalPassos = passos.length + 1; // +1 = revisar
  const emRevisao = passo >= passos.length;

  if (modo === 'guiado') {
    const g = passos[Math.min(passo, passos.length - 1)];
    // Guiada: cada etapa consulta SOMENTE os slots compatíveis do grupo (mesmo resolutor do visual).
    const itensPasso = emRevisao ? [] : itensPorCats(g.cats, g);
    return (
      <div className="vc-root" data-vc data-modo="guiado">
        <header className="vc-barra">
          <button className="vc-acao" onClick={() => setModo('visual')} aria-label="Sair do passo a passo"><X size={18} aria-hidden /><span className="vc-lbl">Sair</span></button>
          <div className="vc-titulo">Criar passo a passo</div>
          <div className="vc-globais">
            <button className="vc-acao" onClick={() => setModo('visual')}><Sparkles size={16} aria-hidden /><span className="vc-lbl">Modo visual</span></button>
          </div>
        </header>
        <div className="vc-guia-prog" aria-hidden>
          {Array.from({ length: totalPassos }).map((_, i) => <span key={i} className={`vc-dot ${i === passo ? 'on' : i < passo ? 'ok' : ''}`} />)}
        </div>
        <div className="vc-guia-corpo">
          <main className="vc-palco"><div className="vc-palco-wrap">
            <AvatarSvg config={config} uid="vc-guia" palco={!(!emRevisao && g.corpo)} corpo={!emRevisao && g.corpo} foco={emRevisao ? undefined : g.foco} estatico={reduzido()} />
          </div></main>
          <aside className="vc-painel">
            <div className="vc-painel-cab">{emRevisao ? 'Revisar e salvar' : g.nome}</div>
            {emRevisao ? (
              <div className="vc-revisao">
                <p className="vc-ajuda">Tudo pronto? Você pode salvar agora ou seguir editando no modo visual.</p>
                <button className="vc-salvar vc-bloco" data-estado={salv} onClick={() => void salvar()}><Save size={16} aria-hidden /> {salv === 'salvo' ? 'Salvo' : salv === 'erro' ? 'Repetir' : 'Salvar'}</button>
                <button className="vc-acao vc-bloco" onClick={() => setModo('visual')}><Sparkles size={16} aria-hidden /> Abrir modo visual</button>
              </div>
            ) : (
              <div className="vc-grade">
                {itensPasso.map(({ it, cat }) => { const bl = bloqueado(it); return (
                  <button key={`${cat}:${it.id}`} type="button" disabled={bl} data-slot={it.slot || undefined} data-cat={cat}
                    className={`vc-card-btn ${equipadoDe(cat, it.id) ? 'vc-card-on' : ''} ${bl ? 'vc-card-bl' : ''}`}
                    title={bl ? `${it.nome} — bloqueado` : it.nome}
                    onClick={() => { if (!bl) aplicar(validarConfig(comItem(config, cat, it.id))); }}>
                    <span className="vc-thumb" aria-hidden dangerouslySetInnerHTML={{ __html: svgItemIsolado(it.id) }} />
                    {bl && <span className="vc-badge vc-badge-bl" aria-hidden><Lock size={13} /></span>}
                    <span className="vc-card-nome">{it.nome}</span>
                  </button>
                ); })}
                {itensPasso.length === 0 && <div className="vc-vazio">Nenhum item compatível nesta etapa.</div>}
              </div>
            )}
          </aside>
        </div>
        <footer className="vc-guia-nav">
          <button className="vc-acao" disabled={passo === 0} onClick={() => setPasso((p) => Math.max(0, p - 1))}><ArrowLeft size={16} aria-hidden /> Voltar</button>
          {!emRevisao && <button className="vc-acao" onClick={() => setPasso((p) => p + 1)}><SkipForward size={16} aria-hidden /> Pular</button>}
          {!emRevisao
            ? <button className="vc-salvar" onClick={() => setPasso((p) => p + 1)}>Avançar <ArrowRight size={16} aria-hidden /></button>
            : <button className="vc-acao" onClick={() => setPasso(0)}>Recomeçar</button>}
        </footer>
      </div>
    );
  }

  // ---------- MODO VISUAL ----------
  return (
    <div className={`vc-root ${painelRecolhido ? 'vc-painel-off' : ''}`} data-vc data-modo="visual" data-gaveta={gaveta}>
      <header className="vc-barra">
        <button className="vc-acao" onClick={sair} aria-label="Voltar"><ChevronLeft size={18} aria-hidden /><span className="vc-lbl">Voltar</span></button>
        <div className="vc-titulo">Avatar Studio</div>
        <div className="vc-globais">
          <button className="vc-acao vc-icone" onClick={() => store.desfazer()} disabled={!podeDesfazer} aria-label="Desfazer"><Undo2 size={18} aria-hidden /></button>
          <button className="vc-acao vc-icone" onClick={() => store.refazer()} disabled={!podeRefazer} aria-label="Refazer"><Redo2 size={18} aria-hidden /></button>
          <button className="vc-salvar" onClick={() => void salvar()} data-estado={salv} aria-label="Salvar">
            <Save size={16} aria-hidden /><span className="vc-lbl">{salv === 'salvando' ? 'Salvando…' : salv === 'salvo' ? 'Salvo' : salv === 'erro' ? 'Repetir' : 'Salvar'}</span>
            {pendente && salv !== 'salvo' && <span className="vc-ponto" aria-hidden />}
          </button>
          <button className="vc-acao vc-icone" onClick={() => abrirComFoco(() => setMais(true))} aria-label="Mais" aria-haspopup="menu" aria-expanded={mais}><MoreHorizontal size={18} aria-hidden /></button>
        </div>
      </header>

      <div className="vc-corpo">
        <nav className="vc-trilho" aria-label="Categorias">
          {gruposVisiveis.map((g) => { const Ic = g.Icone; return (
            <button key={g.id} type="button" title={g.nome} className={`vc-cat ${g.id === grupoId ? 'vc-cat-ativa' : ''}`} aria-pressed={g.id === grupoId} aria-label={g.nome} onClick={() => selecionarGrupo(g)}>
              <Ic size={22} aria-hidden /><span>{g.nome}</span>
            </button>); })}
        </nav>

        <main className="vc-palco">
          <div className="vc-palco-wrap">
            <AvatarSvg config={config} uid="vc-palco" palco={!grupo.corpo} corpo={grupo.corpo} foco={focoAtivo} estatico={reduzido()} />
            {gruposVisiveis.filter((g) => g.hot).map((g) => (
              <button key={g.id} type="button" className={`vc-hot ${g.id === grupoId ? 'vc-hot-on' : ''}`}
                style={{ top: g.hot!.top, left: g.hot!.left, width: g.hot!.width, height: g.hot!.height }}
                data-fundo={g.id === 'cenario' ? 'true' : undefined}
                onClick={() => selecionarGrupo(g)} aria-label={`Editar ${g.nome}`} title={g.nome} />
            ))}
          </div>
          <button className="vc-recolhe" onClick={() => setPainelRecolhido((v) => !v)} aria-expanded={!painelRecolhido} aria-controls="vc-painel-cat" aria-label={painelRecolhido ? 'Mostrar catálogo' : 'Ocultar catálogo'}>
            {painelRecolhido ? <PanelRightOpen size={18} aria-hidden /> : <PanelRightClose size={18} aria-hidden />}
          </button>
        </main>

        <aside className="vc-painel" id="vc-painel-cat" aria-label={`Catálogo: ${grupo.nome}`}>
          <button className="vc-gaveta-alca" aria-label={`Altura do catálogo: ${gaveta}. Toque para alternar (recolhida, meio, expandida).`} aria-expanded={gaveta === 'expandida'} onClick={() => setGaveta((s) => s === 'expandida' ? 'meio' : s === 'meio' ? 'recolhida' : 'expandida')}><span /></button>
          {grupo.subs && (
            <div className="vc-subs" role="tablist" aria-label="Subcategorias">
              {grupo.subs.map((s) => (
                <button key={s.id} role="tab" aria-selected={s.id === subId} className={`vc-sub ${s.id === subId ? 'vc-sub-on' : ''}`} onClick={() => setSubId(s.id)}>{s.nome}</button>
              ))}
            </div>
          )}
          <div className="vc-catnav" role="tablist" aria-label="Catálogo">
            <button role="tab" aria-selected={aba === 'catalogo'} className={aba === 'catalogo' ? 'on' : ''} onClick={() => setAba('catalogo')}>Catálogo</button>
            <button role="tab" aria-selected={aba === 'favoritos'} className={aba === 'favoritos' ? 'on' : ''} onClick={() => setAba('favoritos')}>Favoritos</button>
            <button role="tab" aria-selected={aba === 'atual'} className={aba === 'atual' ? 'on' : ''} onClick={() => setAba('atual')}>Visual atual</button>
            <button className="vc-filtro-btn" onClick={() => abrirComFoco(() => setCoresAberto(true))} aria-label="Cores" aria-expanded={coresAberto}><Palette size={16} aria-hidden /></button>
            <button className="vc-icone-nav" aria-pressed={buscaAberta} onClick={() => setBuscaAberta((v) => !v)} aria-label="Buscar e filtrar"><Search size={16} aria-hidden /></button>
          </div>
          {buscaAberta && (
            <div className="vc-buscabox">
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar…" aria-label="Buscar itens" />
              <label className="vc-chk"><input type="checkbox" checked={filtroNovos} onChange={(e) => setFiltroNovos(e.target.checked)} /> Novos</label>
              <label className="vc-chk"><input type="checkbox" checked={filtroDispon} onChange={(e) => setFiltroDispon(e.target.checked)} /> Disponíveis</label>
            </div>
          )}
          <div className="vc-grade">
            {itens.map(({ it, cat }) => {
              const eq = equipadoDe(cat, it.id); const bl = bloqueado(it); const fav = favs.has(it.id);
              return (
                <div key={`${cat}:${it.id}`} className={`vc-card ${eq ? 'vc-card-on' : ''} ${bl ? 'vc-card-bl' : ''}`}>
                  <button type="button" className="vc-card-btn" aria-pressed={eq} data-slot={it.slot || undefined} data-cat={cat} title={bl ? `${it.nome} — bloqueado` : it.nome}
                    onClick={() => { if (!bl) aplicar(validarConfig(comItem(config, cat, it.id))); }}>
                    <span className="vc-thumb" aria-hidden dangerouslySetInnerHTML={{ __html: svgItemIsolado(it.id) }} />
                    {eq && <span className="vc-badge vc-badge-eq" aria-hidden><Check size={13} /></span>}
                    {bl && <span className="vc-badge vc-badge-bl" aria-hidden><Lock size={13} /></span>}
                    {it.novo && !eq && !bl && <span className="vc-badge vc-badge-novo">novo</span>}
                    <span className="vc-card-nome">{it.nome}</span>
                  </button>
                  <button type="button" className={`vc-fav ${fav ? 'vc-fav-on' : ''}`} aria-label={fav ? 'Desfavoritar' : 'Favoritar'} aria-pressed={fav} onClick={() => toggleFav(it.id)}><Heart size={13} aria-hidden /></button>
                </div>
              );
            })}
            {itens.length === 0 && <div className="vc-vazio">{aba === 'favoritos' ? 'Nenhum favorito ainda. Explore o catálogo e toque no coração para salvar.' : aba === 'atual' ? 'Nada equipado nesta categoria.' : 'Sem itens nesta categoria.'}</div>}
          </div>
        </aside>
      </div>

      {mais && (
        <MaisPainel store={store} config={config} aplicar={aplicar} versao={store.versao}
          desbloqueados={desbloq} vida={vida} reduzido={reduzido()}
          aoGuiada={() => { setMais(false); setModo('guiado'); setPasso(0); }}
          aoDiagnostico={() => { setMais(false); aoModoClassico?.(config); }}
          aoFechar={() => fecharComFoco(() => setMais(false))} />
      )}

      {coresAberto && (
        <div className="vc-back" onClick={() => fecharComFoco(() => setCoresAberto(false))}>
          <div className="vc-sheet vc-cores-sheet" role="dialog" aria-modal="true" aria-label="Cores" onClick={(e) => e.stopPropagation()}>
            <div className="vc-sheet-cab"><span>Cores</span><button onClick={() => fecharComFoco(() => setCoresAberto(false))} aria-label="Fechar"><X size={18} aria-hidden /></button></div>
            <div className="vc-cores-corpo"><EditorCores config={config} aplicar={aplicar} /></div>
          </div>
        </div>
      )}

      {avisoSaida && (
        <div className="vc-back">
          <div className="vc-dialog" role="alertdialog" aria-modal="true" aria-label="Alterações não salvas">
            <p>Você tem alterações não salvas.</p>
            <div className="vc-dialog-acoes">
              <button className="vc-salvar" onClick={() => { setAvisoSaida(null); void salvar(); }}>Salvar</button>
              <button className="vc-acao" onClick={() => { const f = avisoSaida; setAvisoSaida(null); f(); }}>Descartar</button>
              <button className="vc-acao" onClick={() => setAvisoSaida(null)}>Continuar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
