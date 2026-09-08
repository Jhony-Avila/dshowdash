// vc/VisualComposer.tsx — Avatar Studio Visual Composer (frente ux, flag as6.visual_composer).
// Experiência completa: Modo Visual (palco+hotspots+catálogo) + Criação Guiada + Mais (Looks/avançado).
// Reusa AvatarStore, catálogo, favoritos, presets, save (zero store novo, zero 2ª fonte, motor intocado).
// VC-H (Briefing 1): trilho curto de 6 (§3), subs por contexto (Rosto/Roupa/Acessórios, Calçados),
//   hotspots diretos por sub (olhos/boca/nariz/sobrancelha/barba/pés — §2/§18) e dica descartável (§7).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  ChevronLeft, Undo2, Redo2, Save, MoreHorizontal, Search, Heart, Lock, Check, X, Sparkles,
  PanelRightClose, PanelRightOpen, ArrowLeft, ArrowRight, SkipForward, Palette, Plus, Maximize2,
} from 'lucide-react';
import type { AvatarConfig, CategoriaId } from '../domain/types';
import { AvatarStore } from '../nucleo/estado';
import { deLegado2d, paraLegado2d } from '../nucleo/adaptadores';
import { validarConfig, itensDe, itensVestuario, svgItemIsolado } from '../services/AvatarCatalog';
import { comItem } from '../components/GradeItens';
import { focoItemDe } from '../components/modoItem'; // #54 catalogo_v2: reuso do enquadramento medido
import { AvatarSvg } from '../components/AvatarSvg';
import { salvarAvatar } from '../services/AvatarService';
import { favoritos, alternarFavorito } from '../services/Progresso';
import { lerBloqueios } from '../shell/Equipados';
import MaisPainel from './MaisPainel';
import { slotsAtivos } from '../components/Cores';
import { CORES_SUGERIDAS } from '../services/AvatarCatalog';
import type { SlotCor } from '../domain/types';
import { gruposVisuais, grupoPorId, slotsCobertos, IconeMais } from './grupos';
import type { GrupoVisual, SubCat } from './grupos';
import { ehConjunto } from './conjuntos2d';
import { flag } from '../nucleo/flags';
import * as EnqDin from './enquadramentoDinamico';
import type { ParteId } from './enquadramentoDinamico';
import { CONFIG3D_PADRAO, validarConfig3d } from '../poc3d/catalogo3d';
import type { Config3D } from '../poc3d/catalogo3d';
import '../styles/visual-composer.css';

// Modo 3D (Briefing 2, flag as6.vc_3d) — chunk lazy: three/R3F/drei só carregam ao abrir.
const VisualComposer3DLazy = lazy(() => import('./VisualComposer3D'));

const reduzido = (): boolean => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const ehMobile = (): boolean => { try { return window.matchMedia('(max-width: 768px)').matches; } catch { return false; } };
const CHAVE_ONBOARD = 'avst.vc.onboarded';

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
  // decisão #51: categorias de vestuário separado listam via itensVestuario (inclui
  // a arte premium rin_*/ace_px_* + seed, sem ligar o trilho premium inteiro).
  const fonte = grupo.vestuario ? itensVestuario : itensDe;
  let lista: ItemView[] = cats.flatMap((c) => fonte(c).map((it) => ({ it: it as ItemView['it'], cat: c })));
  if (grupo.slotsIn && grupo.slotsIn.length) { const s = new Set(grupo.slotsIn); lista = lista.filter(({ it }) => !!it.slot && s.has(it.slot)); }
  if (grupo.slotsOut && grupo.slotsOut.length) { const s = new Set(grupo.slotsOut); lista = lista.filter(({ it }) => !it.slot || !s.has(it.slot)); }
  return lista;
}

// Itens de UMA sub — aplica o filtro da sub (slots nomeados OU catch-all "Outros").
function itensDaSub(grupo: GrupoVisual, sub: SubCat): ItemView[] {
  let lista = itensPorCats([sub.cat], grupo);
  if (sub.outros) { const cob = slotsCobertos(grupo); lista = lista.filter(({ it }) => !it.slot || !cob.has(it.slot)); }
  else if (sub.slots && sub.slots.length) { const s = new Set(sub.slots); lista = lista.filter(({ it }) => !!it.slot && s.has(it.slot)); }
  // decisão #52: separa "Peças" (não-conjunto) de "Looks completos" (conjunto)
  if (sub.conjunto === 'apenas') lista = lista.filter(({ it }) => ehConjunto(it.id));
  else if (sub.conjunto === 'excluir') lista = lista.filter(({ it }) => !ehConjunto(it.id));
  return lista;
}

// Subs efetivas de um grupo: estáticas + "Outros" (coverage de acessórios) — só as NÃO vazias.
function subsEfetivasDe(grupo: GrupoVisual): SubCat[] | null {
  const base = grupo.subs ? grupo.subs.slice() : null;
  if (grupo.subsDerivadas === 'acessorio' && base) {
    const cobertos = slotsCobertos(grupo);
    const todos = itensPorCats(grupo.cats, grupo);
    const outros = Array.from(new Set(todos.map(({ it }) => it.slot).filter((s): s is string => !!s && !cobertos.has(s))));
    const temSemSlot = todos.some(({ it }) => !it.slot);
    if (outros.length || temSemSlot) base.push({ id: 'a_outros', nome: 'Outros', cat: 'acessorio', slots: outros.length ? outros : undefined, outros: true });
  }
  if (!base) return null;
  const visiveis = base.filter((s) => itensDaSub(grupo, s).length > 0);
  return visiveis.length ? visiveis : null;
}
function primeiraSubId(grupo: GrupoVisual): string | null { const s = subsEfetivasDe(grupo); return s && s.length ? s[0].id : null; }

// (Camada de clique direto por hotspots de % fixo REMOVIDA — o palco agora usa
//  hit-testing dinamico geometrico: ver enquadramentoDinamico.ts + efeito no palco.)

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

  // Vestuário separado (decisão #51): com a flag as6.vestuario_separado, o grupo único
  // "Roupa" vira 3 categorias de trilho (Camisetas e blusas / Calças / Calçados).
  const vestSep = flag('as6.vestuario_separado');
  const gruposAtivos = useMemo(() => gruposVisuais(vestSep), [vestSep]);
  // #54 catalogo_v2: thumbnail do card reusa o foco MEDIDO (focoItemDe / FOCO_CARD_CATEGORIA,
  // §12 ~78%). Flag OFF = svgItemIsolado cru (byte a byte). Sem hardcode de foco.
  const catalogoV2 = flag('as6.catalogo_v2');
  const thumbHtml = useCallback((id: string, cat: string): string => (
    catalogoV2
      ? svgItemIsolado(id, { foco: focoItemDe(id, cat), premium: flag('as6.classico_premium'), faceV2: flag('as6.face_v2') })
      : svgItemIsolado(id)
  ), [catalogoV2]);
  // Trilho curto (§3): categorias humanas no trilho; baixa frequência no overflow "Mais".
  const gruposRail = useMemo(() => gruposAtivos.filter((g) => !g.overflow), [gruposAtivos]);
  const gruposOverflow = useMemo(() => gruposAtivos.filter((g) => g.overflow), [gruposAtivos]);

  const [modo, setModo] = useState<'visual' | 'guiado' | '3d'>(() => {
    // preview de revisão pode pedir abertura direta em 3D (sessionStorage; nunca setado no produto)
    try { if (flag('as6.vc_3d') && sessionStorage.getItem('avst.vc.abrir3d') === '1') return '3d'; } catch { /* ok */ }
    return 'visual';
  });
  const [grupoId, setGrupoId] = useState('base');
  const grupo = grupoPorId(grupoId, gruposAtivos);
  const [subId, setSubId] = useState<string | null>(null);
  const [aba, setAba] = useState<'catalogo' | 'favoritos' | 'atual'>('catalogo');
  const [filtroNovos, setFiltroNovos] = useState(false);
  const [filtroDispon, setFiltroDispon] = useState(false);
  const [busca, setBusca] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [painelRecolhido, setPainelRecolhido] = useState(false);
  const [gaveta, setGaveta] = useState<'recolhida' | 'meio' | 'expandida'>('meio');
  const [mais, setMais] = useState(false);
  // Modo 3D (Briefing 2, flag as6.vc_3d) — histórico Config3D próprio (undo/redo do 3D),
  // levantado aqui para SOBREVIVER ao roundtrip 2D↔3D (decisão #54).
  const vc3dOn = flag('as6.vc_3d');
  const [c3dHist, setC3dHist] = useState<{ p: Config3D[]; atual: Config3D; f: Config3D[] }>(() => ({ p: [], atual: CONFIG3D_PADRAO, f: [] }));
  const semear3dRef = useRef(false);
  const mudar3d = useCallback((c: Config3D) => setC3dHist((h) => ({ p: [...h.p, h.atual].slice(-50), atual: c, f: [] })), []);
  const desfazer3d = useCallback(() => setC3dHist((h) => (h.p.length ? { p: h.p.slice(0, -1), atual: h.p[h.p.length - 1], f: [h.atual, ...h.f] } : h)), []);
  const refazer3d = useCallback(() => setC3dHist((h) => (h.f.length ? { p: [...h.p, h.atual], atual: h.f[0], f: h.f.slice(1) } : h)), []);
  const abrir3d = useCallback(() => {
    if (!semear3dRef.current) { // bridge de cores 2D→3D só na 1ª abertura (o que mapeia)
      semear3dRef.current = true;
      setC3dHist((h) => {
        const c2 = config.cores as Record<string, string | undefined>;
        const cores = { ...h.atual.cores, pele: c2.pele ?? h.atual.cores.pele, cabelo: c2.cabelo ?? h.atual.cores.cabelo, roupa: c2.roupa ?? h.atual.cores.roupa, detalhe: c2.destaque ?? h.atual.cores.detalhe };
        return { ...h, atual: validarConfig3d({ ...h.atual, cores }) };
      });
    }
    setMais(false); setModo('3d');
  }, [config]);
  const [maisCat, setMaisCat] = useState(false);   // overflow de categorias do trilho
  const [coresAberto, setCoresAberto] = useState(false);
  const focoAntesRef = useRef<HTMLElement | null>(null);
  const palcoWrapRef = useRef<HTMLDivElement | null>(null);
  const abrirComFoco = useCallback((abrir: () => void) => { focoAntesRef.current = (document.activeElement as HTMLElement) ?? null; abrir(); }, []);
  const fecharComFoco = useCallback((fechar: () => void) => { fechar(); const t = focoAntesRef.current; if (t && typeof t.focus === 'function') setTimeout(() => t.focus(), 0); }, []);
  const [salv, setSalv] = useState<'idle' | 'salvando' | 'salvo' | 'erro'>('idle');
  const [favs, setFavs] = useState<Set<string>>(() => { try { return favoritos(); } catch { return new Set(); } });
  const [avisoSaida, setAvisoSaida] = useState<null | (() => void)>(null);
  // Onboarding (§7): dica descartável na 1ª abertura + pulso único (respeita prefers-reduced-motion).
  const [onboard, setOnboard] = useState(() => { try { return !localStorage.getItem(CHAVE_ONBOARD); } catch { return false; } });
  const [pulso, setPulso] = useState(false);
  const [anuncio, setAnuncio] = useState('');

  const encerrarOnboarding = useCallback(() => {
    setOnboard(false); setPulso(false);
    try { localStorage.setItem(CHAVE_ONBOARD, '1'); } catch { /* ok */ }
  }, []);
  useEffect(() => {
    if (!onboard || reduzido()) return;
    setPulso(true);
    const t = setTimeout(() => setPulso(false), 2600);
    return () => clearTimeout(t);
  }, [onboard]);

  function bloqueado(it: { id: string; bloqueadoPor?: string; slot?: string }): boolean {
    const porSlot = !!it.slot && bloqSlots.has(it.slot);            // slot travado (lerBloqueios)
    const porConquista = !!it.bloqueadoPor && !desbloq.has(it.id);  // ainda não desbloqueado
    return porSlot || porConquista;
  }
  const camadas = config.camadas as Record<string, string | undefined>;
  function equipadoDe(cat: CategoriaId, id: string): boolean {
    if (cat === 'base') return config.base === id;
    // acessórios (inclui calçado/slot pes) são roteados por slot em camadas.acessorio_<slot>
    // (validarConfig §41): casa por VALOR em qualquer slot de acessório. Demais categorias
    // (roupa/roupa_inferior/…) usam a própria chave.
    if (cat === 'acessorio') return Object.entries(camadas).some(([k, v]) => k.startsWith('acessorio') && v === id);
    return camadas?.[cat] === id;
  }

  const aplicar = useCallback((novo: AvatarConfig) => {
    const antes = store.estadoDraft;
    const alvo = deLegado2d(validarConfig(novo));
    store.executar({ nome: 'vc:aplicar', executar: () => alvo, desfazer: () => antes });
    setSalv('idle');
  }, [store]);

  // decisão #52: aplica uma peça respeitando CONJUNTOS (looks de corpo inteiro).
  // Equipar um conjunto (superior) limpa a calça; equipar calça com conjunto ativo
  // limpa o conjunto. Atômico — o command pattern restaura tudo no desfazer.
  const aplicarPeca = useCallback((cat: CategoriaId, id: string) => {
    let novo = comItem(config, cat, id) as AvatarConfig;
    if (cat === 'roupa' && ehConjunto(id)) {
      const cam = { ...novo.camadas }; delete cam.roupa_inferior; novo = { ...novo, camadas: cam };
    } else if (cat === 'roupa_inferior' && ehConjunto(config.camadas.roupa)) {
      const cam = { ...novo.camadas }; delete cam.roupa; novo = { ...novo, camadas: cam };
    }
    aplicar(validarConfig(novo));
  }, [config, aplicar]);

  const salvar = useCallback(async () => {
    setSalv('salvando');
    try {
      const r = await salvarAvatar(config, store.versao);
      if (r.ok) { setSalv('salvo'); store.confirmarPersistencia(typeof r.versao === 'number' ? r.versao : store.versao); }
      else setSalv('erro');
    } catch { setSalv('erro'); }
  }, [config, store]);

  const selecionarGrupo = useCallback((g: GrupoVisual) => {
    setGrupoId(g.id); setSubId(primeiraSubId(g)); setAba('catalogo');
    setMaisCat(false); encerrarOnboarding();
    setAnuncio(`Categoria ${g.nome}`);
    if (ehMobile()) setGaveta('meio');
  }, [encerrarOnboarding]);

  // Clique direto numa sub com hotspot (olhos/boca/pés…): abre o grupo já no contexto da sub.
  const selecionarSub = useCallback((g: GrupoVisual, s: SubCat) => {
    setGrupoId(g.id); setSubId(s.id); setAba('catalogo');
    setMaisCat(false); encerrarOnboarding();
    setAnuncio(`Editar ${s.nome}`);
    if (ehMobile()) setGaveta('meio');
  }, [encerrarOnboarding]);

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
      else if (k === 'escape') { setBuscaAberta(false); setAvisoSaida(null); setMaisCat(false); if (coresAberto) fecharComFoco(() => setCoresAberto(false)); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [store, salvar, coresAberto, fecharComFoco]);

  // Subs efetivas do grupo atual (estáticas + Outros, só não-vazias) e sub ativa.
  const subsVisiveis = useMemo(() => subsEfetivasDe(grupo), [grupo]);
  const subAtiva = useMemo(() => subsVisiveis?.find((s) => s.id === subId) ?? null, [subsVisiveis, subId]);

  const cats: CategoriaId[] = useMemo(() => (subAtiva ? [subAtiva.cat] : grupo.cats), [subAtiva, grupo]);

  // Corpo: a sub tem prioridade sobre o grupo (roupa->calcados). O enquadramento NAO
  // usa mais preset fixo (foco): e dinamico pelos limites visuais reais (decisao #48/#49),
  // para que rosto/corpo NUNCA sejam cortados e o hit-testing use a MESMA transformacao.
  const corpoAtivo = useMemo(() => !!(subAtiva?.corpo ?? grupo.corpo), [subAtiva, grupo]);

  // ---------- ENQUADRAMENTO + HOTSPOTS DINAMICOS (decisao #48/#49) ----------
  const abrirParte = useCallback((pid: ParteId) => {
    const g = (id: string) => grupoPorId(id, gruposAtivos);
    const sub = (gid: string, sid: string) => (grupoPorId(gid, gruposAtivos).subs ?? []).find((s) => s.id === sid) ?? null;
    switch (pid) {
      case 'cabelo': selecionarGrupo(g('cabelo')); break;
      case 'rosto': selecionarGrupo(g('rosto')); break;
      case 'olhos': { const s = sub('rosto', 'olhos'); if (s) selecionarSub(g('rosto'), s); else selecionarGrupo(g('rosto')); break; }
      case 'boca': { const s = sub('rosto', 'boca'); if (s) selecionarSub(g('rosto'), s); else selecionarGrupo(g('rosto')); break; }
      // vestuário: com a flag, tronco/pernas/pés abrem categorias próprias; sem a
      // flag, caem no grupo "Roupa" (sub inferior/calçados) — comportamento clássico.
      case 'roupa': selecionarGrupo(g(vestSep ? 'superior' : 'roupa')); break;
      case 'calca': if (vestSep) { selecionarGrupo(g('calca')); } else { const s = sub('roupa', 'roupa_inferior'); if (s) selecionarSub(g('roupa'), s); else selecionarGrupo(g('roupa')); } break;
      case 'calcados': if (vestSep) { selecionarGrupo(g('calcado')); } else { const s = sub('roupa', 'calcados'); if (s) selecionarSub(g('roupa'), s); else selecionarGrupo(g('roupa')); } break;
      case 'acessorio_cabeca': { const s = sub('acessorios', 'a_cabeca'); if (s) selecionarSub(g('acessorios'), s); else selecionarGrupo(g('acessorios')); break; }
    }
  }, [selecionarGrupo, selecionarSub, gruposAtivos, vestSep]);

  const parteAtivaId = useCallback((): ParteId | null => {
    if (grupoId === 'cabelo') return 'cabelo';
    if (grupoId === 'rosto') return subId === 'olhos' ? 'olhos' : subId === 'boca' ? 'boca' : 'rosto';
    if (grupoId === 'superior') return 'roupa';
    if (grupoId === 'calca') return 'calca';
    if (grupoId === 'calcado') return 'calcados';
    if (grupoId === 'roupa') return subId === 'calcados' ? 'calcados' : subId === 'roupa_inferior' ? 'calca' : 'roupa';
    if (grupoId === 'acessorios' && subId === 'a_cabeca') return 'acessorio_cabeca';
    return null;
  }, [grupoId, subId]);

  const svgDoPalco = useCallback((): SVGSVGElement | null => {
    const wrap = palcoWrapRef.current; return wrap ? wrap.querySelector('svg') : null;
  }, []);

  const reenquadrar = useCallback(() => {
    const svg = svgDoPalco(); if (!svg) return;
    EnqDin.enquadrar(svg, { corpo: corpoAtivo });
    EnqDin.garantirRealce(svg);
    const pid = parteAtivaId();
    EnqDin.marcarRealce(svg, pid ? EnqDin.caixaDaParte(svg, pid, corpoAtivo) : null);
  }, [svgDoPalco, corpoAtivo, parteAtivaId]);

  useEffect(() => {
    const wrap = palcoWrapRef.current; if (!wrap) return;
    let raf = 0;
    const mo = new MutationObserver(() => agenda());
    const rodar = () => { mo.disconnect(); reenquadrar(); mo.observe(wrap, { childList: true, subtree: true }); };
    function agenda() { cancelAnimationFrame(raf); raf = requestAnimationFrame(rodar); }
    mo.observe(wrap, { childList: true, subtree: true });
    const ro = new ResizeObserver(() => agenda());
    ro.observe(wrap);
    agenda();
    const onMove = (ev: PointerEvent) => {
      const svg = svgDoPalco(); if (!svg) return;
      const pid = EnqDin.acertar(svg, ev.clientX, ev.clientY, corpoAtivo);
      wrap.style.cursor = pid ? 'pointer' : '';
      const alvo = pid ?? parteAtivaId();
      EnqDin.marcarRealce(svg, alvo ? EnqDin.caixaDaParte(svg, alvo, corpoAtivo) : null);
    };
    const onLeave = () => {
      const svg = svgDoPalco(); if (!svg) return;
      wrap.style.cursor = '';
      const pid = parteAtivaId();
      EnqDin.marcarRealce(svg, pid ? EnqDin.caixaDaParte(svg, pid, corpoAtivo) : null);
    };
    const onClick = (ev: MouseEvent) => {
      const svg = svgDoPalco(); if (!svg) return;
      const pid = EnqDin.acertar(svg, ev.clientX, ev.clientY, corpoAtivo);
      if (pid) { ev.preventDefault(); abrirParte(pid); encerrarOnboarding(); }
    };
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);
    wrap.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect(); ro.disconnect();
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
      wrap.removeEventListener('click', onClick);
    };
  }, [reenquadrar, svgDoPalco, corpoAtivo, parteAtivaId, abrirParte, encerrarOnboarding, modo]);

  const itens: ItemView[] = useMemo(() => {
    let lista: ItemView[] = itensPorCats(cats, grupo);
    if (subAtiva) {
      if (subAtiva.outros) { const cob = slotsCobertos(grupo); lista = lista.filter(({ it }) => !it.slot || !cob.has(it.slot)); }
      else if (subAtiva.slots && subAtiva.slots.length) { const s = new Set(subAtiva.slots); lista = lista.filter(({ it }) => !!it.slot && s.has(it.slot)); }
      // decisão #52: "Peças" (não-conjunto) vs "Looks completos" (conjunto)
      if (subAtiva.conjunto === 'apenas') lista = lista.filter(({ it }) => ehConjunto(it.id));
      else if (subAtiva.conjunto === 'excluir') lista = lista.filter(({ it }) => !ehConjunto(it.id));
    }
    if (aba === 'favoritos') lista = lista.filter(({ it }) => favs.has(it.id));
    if (aba === 'atual') lista = lista.filter(({ it, cat }) => equipadoDe(cat, it.id));
    if (filtroNovos) lista = lista.filter(({ it }) => !!it.novo);
    if (filtroDispon) lista = lista.filter(({ it }) => !bloqueado(it));
    const q = busca.trim().toLowerCase();
    if (q) lista = lista.filter(({ it }) => it.nome.toLowerCase().includes(q) || (it.tema ?? '').toLowerCase().includes(q));
    return lista;
  }, [grupo, cats, subAtiva, aba, favs, filtroNovos, filtroDispon, busca, config]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFav = useCallback((id: string) => { try { setFavs(new Set(alternarFavorito(id))); } catch { /* ok */ } }, []);

  // ---------- CRIAÇÃO GUIADA ----------
  const passos = useMemo(() => gruposAtivos.filter((g) => g.id !== 'estilo').concat(gruposAtivos.filter((g) => g.id === 'estilo')), [gruposAtivos]);
  const [passo, setPasso] = useState(0);
  const totalPassos = passos.length + 1; // +1 = revisar
  const emRevisao = passo >= passos.length;

  if (modo === '3d' && vc3dOn) {
    return (
      <Suspense fallback={<div className="vc-boot" />}>
        <VisualComposer3DLazy store={store} config3d={c3dHist.atual} aoMudar3d={mudar3d}
          podeDesfazer={c3dHist.p.length > 0} podeRefazer={c3dHist.f.length > 0} mudancas={c3dHist.p.length}
          desfazer={desfazer3d} refazer={refazer3d} versaoBase={store.versao}
          aoVoltar2D={() => setModo('visual')} aoMais={() => abrirComFoco(() => setMais(true))} reduzido={reduzido()}
          config2d={config} aplicar2d={aplicar} vida={vida} aoClassico={() => aoModoClassico?.(config)} />
      </Suspense>
    );
  }

  if (modo === 'guiado') {
    const g = passos[Math.min(passo, passos.length - 1)];
    // Guiada: cada etapa consulta SOMENTE os slots compatíveis do grupo (mesmo resolutor do visual).
    const itensPasso = emRevisao ? [] : itensPorCats(g.cats, g);
    return (
      <div className="vc-root" data-vc data-modo="guiado" data-catalogo-v2={catalogoV2 ? '' : undefined}>
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
                    onClick={() => { if (!bl) aplicarPeca(cat, it.id); }}>
                    <span className="vc-thumb" aria-hidden dangerouslySetInnerHTML={{ __html: thumbHtml(it.id, cat) }} />
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
  const overflowAtivo = gruposOverflow.some((g) => g.id === grupoId);
  return (
    <div className={`vc-root ${painelRecolhido ? 'vc-painel-off' : ''}`} data-vc data-modo="visual" data-gaveta={gaveta} data-catalogo-v2={catalogoV2 ? '' : undefined}>
      <header className="vc-barra">
        <button className="vc-acao" onClick={sair} aria-label="Voltar"><ChevronLeft size={18} aria-hidden /><span className="vc-lbl">Voltar</span></button>
        <div className="vc-titulo">Avatar Studio</div>
        {vc3dOn && (
          <div className="vc-modo-seg" role="group" aria-label="Modo de edição">
            <button type="button" className="vc-modo-op vc-modo-on" aria-pressed={true} title="Editor 2D">2D</button>
            <button type="button" className="vc-modo-op" aria-pressed={false} onClick={abrir3d} title="Abrir editor 3D">3D</button>
          </div>
        )}
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
          {gruposRail.map((g) => { const Ic = g.Icone; const on = g.id === grupoId; return (
            <button key={g.id} type="button" title={g.nome} className={`vc-cat ${on ? 'vc-cat-ativa' : ''}`} aria-pressed={on} aria-label={g.nome} onClick={() => selecionarGrupo(g)}>
              <Ic size={22} aria-hidden /><span>{g.nome}</span>
            </button>); })}
          {gruposOverflow.length > 0 && (
            <button type="button" title="Mais" className={`vc-cat ${overflowAtivo ? 'vc-cat-ativa' : ''}`} aria-pressed={overflowAtivo} aria-haspopup="menu" aria-expanded={maisCat} aria-label="Mais categorias" onClick={() => setMaisCat((v) => !v)}>
              <IconeMais size={22} aria-hidden /><span>Mais</span>
            </button>
          )}
        </nav>

        <main className="vc-palco">
          <div className={`vc-palco-wrap ${pulso ? 'vc-palco-pulso' : ''}`} ref={palcoWrapRef} data-vc-palco>
            {/* Palco SEM crop fixo: o enquadramento dinamico define o viewBox pelos
                limites visuais reais (rosto/corpo NUNCA cortados). foco={undefined}. */}
            <AvatarSvg config={config} uid="vc-palco" palco={!corpoAtivo} corpo={corpoAtivo} estatico={reduzido()} />
            {/* Hotspots dinamicos: clique direto + realce sutil tratados pelo efeito
                (getScreenCTM/getBBox) no proprio <svg>. Sem botoes de % fixo, sem retangulo tecnico. */}
            {onboard && (
              <div className="vc-onboard" role="status">
                <span>{ehMobile() ? 'Toque em uma parte do avatar para personalizar.' : 'Clique em uma parte do avatar para personalizar.'}</span>
                <button type="button" className="vc-onboard-x" aria-label="Entendi" onClick={encerrarOnboarding}><X size={14} aria-hidden /></button>
              </div>
            )}
          </div>
          {(() => { const GIcone = grupo.Icone; return (
            <div className="vc-catchip" aria-hidden><GIcone size={15} /><span>{grupo.nome}</span></div>
          ); })()}
          <button className="vc-reframe" onClick={reenquadrar} aria-label="Reenquadrar" title="Reenquadrar (mostrar tudo)"><Maximize2 size={16} aria-hidden /></button>
          <button className="vc-recolhe" onClick={() => setPainelRecolhido((v) => !v)} aria-expanded={!painelRecolhido} aria-controls="vc-painel-cat" aria-label={painelRecolhido ? 'Mostrar catálogo' : 'Ocultar catálogo'}>
            {painelRecolhido ? <PanelRightOpen size={18} aria-hidden /> : <PanelRightClose size={18} aria-hidden />}
          </button>
        </main>

        <aside className="vc-painel" id="vc-painel-cat" aria-label={`Catálogo: ${grupo.nome}`}>
          <button className="vc-gaveta-alca" aria-label={`Altura do catálogo: ${gaveta}. Toque para alternar (recolhida, meio, expandida).`} aria-expanded={gaveta === 'expandida'} onClick={() => setGaveta((s) => s === 'expandida' ? 'meio' : s === 'meio' ? 'recolhida' : 'expandida')}><span /></button>
          {subsVisiveis && subsVisiveis.length > 0 && (
            <div className="vc-subs" role="tablist" aria-label="Subcategorias">
              {subsVisiveis.map((s) => (
                <button key={s.id} role="tab" aria-selected={s.id === subId} className={`vc-sub ${s.id === subId ? 'vc-sub-on' : ''}`} onClick={() => { setSubId(s.id); setAnuncio(`Editar ${s.nome}`); }}>{s.nome}</button>
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
                  <button type="button" className="vc-card-btn" aria-pressed={eq} aria-selected={catalogoV2 ? eq : undefined} data-slot={it.slot || undefined} data-cat={cat} title={bl ? `${it.nome} — bloqueado` : it.nome}
                    onClick={() => { if (!bl) aplicarPeca(cat, it.id); }}>
                    <span className="vc-thumb" aria-hidden dangerouslySetInnerHTML={{ __html: thumbHtml(it.id, cat) }} />
                    {eq && <span className="vc-badge vc-badge-eq" aria-hidden><Check size={13} /></span>}
                    {bl && <span className="vc-badge vc-badge-bl" aria-hidden><Lock size={13} /></span>}
                    {it.novo && !eq && !bl && <span className="vc-badge vc-badge-novo">novo</span>}
                    {catalogoV2 && eq && <span className="vc-emuso" aria-hidden>Em uso</span>}
                    <span className="vc-card-nome">{it.nome}</span>
                  </button>
                  <button type="button" className={`vc-fav ${fav ? 'vc-fav-on' : ''}`} aria-label={fav ? 'Desfavoritar' : 'Favoritar'} aria-pressed={fav} onClick={(e) => { e.stopPropagation(); toggleFav(it.id); }}><Heart size={13} aria-hidden /></button>
                </div>
              );
            })}
            {itens.length === 0 && <div className="vc-vazio">{aba === 'favoritos' ? 'Nenhum favorito ainda. Explore o catálogo e toque no coração para salvar.' : aba === 'atual' ? 'Nada equipado nesta categoria.' : 'Sem itens nesta categoria.'}</div>}
          </div>
        </aside>
      </div>

      {/* overflow de categorias (§3): Estilo (Cenário foi promovido ao trilho na rodada unificada). */}
      {maisCat && (
        <div className="vc-back" onClick={() => setMaisCat(false)}>
          <div className="vc-sheet vc-mais-sheet" role="dialog" aria-modal="true" aria-label="Mais categorias" onClick={(e) => e.stopPropagation()}>
            <div className="vc-sheet-cab"><span>Mais categorias</span><button onClick={() => setMaisCat(false)} aria-label="Fechar"><X size={18} aria-hidden /></button></div>
            <div className="vc-sheet-lista">
              {gruposOverflow.map((g) => { const Ic = g.Icone; return (
                <button key={g.id} onClick={() => selecionarGrupo(g)}><Ic size={18} aria-hidden /><span>{g.nome}</span></button>
              ); })}
            </div>
          </div>
        </div>
      )}

      {mais && (
        <MaisPainel store={store} config={config} aplicar={aplicar} versao={store.versao}
          desbloqueados={desbloq} vida={vida} reduzido={reduzido()}
          aoGuiada={() => { setMais(false); setModo('guiado'); setPasso(0); }}
          aoDiagnostico={() => { setMais(false); aoModoClassico?.(config); }}
          ao3d={vc3dOn ? abrir3d : undefined}
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

      <div className="vc-sr-live" role="status" aria-live="polite">{anuncio}</div>
    </div>
  );
}
