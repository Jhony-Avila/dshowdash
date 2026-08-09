// components/Foto.tsx — foto de perfil: upload, CÂMERA, galeria e ESTILO.
// @version 2.0.0
// @changelog v2.0.0 (2026-07-30) — FOTO ESTILIZADA (4.6 §21, decisão #42):
//   modos Foto simples / Foto estilizada. Sobre a foto entram SÓ assets de
//   apresentação (fundo, banner, aura, efeito, moldura, emblema-badge,
//   título e cor de destaque) — nunca roupa/corpo. Composição determinística
//   no motor (engine/render-foto), rasterizada a PNG 480 no cliente e salva
//   com os PARÂMETROS (config_foto) — o servidor valida e re-encoda via GD.
// @changelog v1.1.0 (2026-07-29, pedido do Jhony) — captura pela câmera
//   (getUserMedia → frame → mesmo fluxo de recorte) e galeria "Suas fotos"
//   (todas as fotos ficam guardadas no servidor; um clique reativa).
// @created 2026-07-29
//
// Fluxo: arquivo OU câmera → recorte (arrastar + zoom) → canvas 480×480 →
// PNG data-url → salvarFoto(). O servidor re-encoda pixel a pixel (GD).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Aperture, BadgeCheck, BookmarkPlus, Box, Camera, Check, Crown, Download, FolderOpen, Grid3x3, ImageUp,
  Images, Layers, Lightbulb, LoaderCircle, Maximize, Move, Redo2, RefreshCw, RotateCcw, Share2, SlidersHorizontal, Sparkles, Star, Trash2, Undo2,
  Video, Wand2, X, ZoomIn, ZoomOut,
} from 'lucide-react';
import { carregarFotos, reativarVersao, salvarFoto } from '../services/AvatarService';
import type { FotoGuardada } from '../services/AvatarService';
import type { EstiloFoto } from '../domain/types';
import { dataUriDe, validarConfig,
  CATEGORIAS, CATEGORIAS_FOTO, CONFIG_PADRAO, CORES_SUGERIDAS, CORES_TEXTO_FOTO,
  FORMATOS_FOTO, RARIDADES, TEMPLATES_FOTO, TITULOS, dicasComposicao, itemPorId, itensDe,
  comporAutomatico, posPadraoElementoFoto, posSugeridasEmblema, svgFotoDe,
} from '../services/AvatarCatalog';
import type { DicaFoto, FormatoFotoId, TemplateFoto } from '../services/AvatarCatalog';
import { telemetria } from '../services/Telemetria';
import { criarRenderizador } from '../services/FabricaRenderizador';
import { BASE_PERSONAGENS_3D, carregarIndice3d } from '../services/Personagens3d';
// lote 721-730 (§329, flag as5.foto3d): captura 3D com o ESTADO do usuário
import { deLegado2d } from '../nucleo/adaptadores';
import { CORES_PADRAO } from '../engine/cores';
import type { EntradaIndice3d } from '../services/Personagens3d';
import { estadoVazio } from '../nucleo/contratos';
import { flag } from '../nucleo/flags';
import { t } from '../nucleo/i18n'; // lote 521-530 (§296)
import { semanaIso } from '../services/Missoes';
import { alternarFavoritoTemplate, favoritosTemplate } from '../services/FavoritosTemplate';
import { compartilharPng, podeCompartilhar } from '../services/Compartilhar';
import { atualizarFonteProjeto, excluirProjetoFoto, listarProjetosFoto, miniaturizarFoto, renomearProjetoFoto, salvarProjetoFoto } from '../services/ProjetosFoto';
import { encodarNoWorker } from '../services/WorkerPool'; // lote 1161-1170 (#118)
// megas 253+258 (§369/§349): presets de exportação + compor pra mim
import { excluirPresetExport, listarPresetsExport, salvarPresetExport } from '../services/PresetsExport';
import { listarPresets } from '../services/PresetsPessoais'; // lote 531-540 (§321.2)
import type { AvatarConfig } from '../domain/types';
import type { PresetExport } from '../services/PresetsExport';
import type { ProjetoFoto } from '../services/ProjetosFoto';
import type {
  AjustesFoto, BlendFoto, CamadaFotoCfg, CamadaFotoId, ElementoPosFoto, SeloCfgFoto, TipografiaFoto,
} from '../domain/types';

const LADO_PALCO = 280;   // px na tela
const LADO_SAIDA = 480;   // px do PNG final

interface EstadoRecorte {
  img: HTMLImageElement;
  zoom: number;        // 1 = imagem cobre exatamente o palco
  x: number;           // deslocamento do centro (px de palco)
  y: number;
}

/** Rasteriza um SVG (com a foto embutida como data-url) em PNG.
 *  Dimensões parametrizadas (§368: escala 1×/2×/4×; §325: formatos wide). */
async function rasterizarSvg(svg: string, largura: number = LADO_SAIDA, altura: number = largura, tipo: 'png' | 'jpeg' = 'png'): Promise<string> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolver, rejeitar) => {
      const i = new Image();
      i.onload = () => resolver(i);
      i.onerror = () => rejeitar(new Error('SVG_RASTER'));
      i.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('SEM_CANVAS');
    ctx.imageSmoothingQuality = 'high';
    if (tipo === 'jpeg') { ctx.fillStyle = '#0d1017'; ctx.fillRect(0, 0, largura, altura); } // JPEG sem alfa (§369)
    ctx.drawImage(img, 0, 0, largura, altura);
    // lote 1161-1170 (#118, as6.workers_v2): o ENCODE (parte pesada em
    // PNG grande) vai ao worker via bitmap transferido; qualquer falha
    // cai no toDataURL síncrono de sempre (aceleração, nunca dependência)
    try {
      const bmp = await createImageBitmap(canvas);
      const doWorker = await encodarNoWorker(bmp, tipo === 'jpeg' ? 'image/jpeg' : 'image/png', tipo === 'jpeg' ? 0.9 : undefined);
      if (doWorker) return doWorker;
    } catch { /* segue síncrono */ }
    return canvas.toDataURL(tipo === 'jpeg' ? 'image/jpeg' : 'image/png', tipo === 'jpeg' ? 0.9 : undefined);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** §362: rascunho do ESTILO (só parâmetros — a foto nunca vai ao storage). */
const CHAVE_ESTILO = 'dshow.avst.foto.estilo.v1';
function lerEstiloSalvo(): EstiloFoto | null {
  try {
    const e = JSON.parse(localStorage.getItem(CHAVE_ESTILO) ?? 'null') as EstiloFoto | null;
    return e && e.camadas && e.cores ? e : null;
  } catch { return null; }
}
function gravarEstilo(e: EstiloFoto): void {
  try { localStorage.setItem(CHAVE_ESTILO, JSON.stringify(e)); } catch { /* sem storage */ }
}
function limparEstiloSalvo(): void {
  try { localStorage.removeItem(CHAVE_ESTILO); } catch { /* sem storage */ }
}

// lote 211–220: o rascunho §362 tem CONTEÚDO se houver qualquer campo do
// estilo além da cor de destaque (que ESTILO_VAZIO já traz). Antes o gate só
// olhava camadas/título e descartava rascunhos só-subtítulo/legenda/ajustes/
// luz/tipografia/camadasFoto — campos que aplicarTemplate agora carrega.
function estiloTemConteudo(e: EstiloFoto): boolean {
  const temObj = (o?: object | null) => !!o && Object.keys(o).length > 0;
  return temObj(e.camadas) || !!e.titulo || !!e.legenda || !!e.subtitulo
    || temObj(e.ajustes) || !!e.luzLocal || temObj(e.tipografia) || temObj(e.camadasFoto)
    || temObj(e.pos) || temObj(e.seloCfg); // lote 221–224
}

const ESTILO_VAZIO: EstiloFoto = { camadas: {}, cores: { destaque: CONFIG_PADRAO.cores.destaque } };

// lote 161–164 (§338/§342): rótulos do painel de camadas
const NOMES_CAMADA_FOTO: Record<CamadaFotoId, string> = {
  fundo: 'Fundo', banner: 'Banner', aura: 'Aura',
  efeito: 'Efeito', moldura: 'Moldura', emblema: 'Emblema',
};
const NOMES_BLEND: Record<BlendFoto, string> = {
  normal: 'Normal', multiply: 'Escurecer', screen: 'Clarear',
  overlay: 'Contraste', 'soft-light': 'Luz suave',
};

export function Foto({ versao, fotoAtiva, desbloqueados, aoSalvar, configAtual }: {
  versao: number;
  /** true quando o avatar ativo já é uma foto */
  fotoAtiva: boolean;
  /** ids liberados por conquistas/eventos (mesma fonte da grade) */
  desbloqueados: Set<string>;
  aoSalvar: (novaVersao: number) => void;
  /** lote 531-540 (§321.1-.2, flag as5.foto_entrada): entrada pelo AVATAR */
  configAtual?: AvatarConfig;
}) {
  const [recorte, setRecorte] = useState<EstadoRecorte | null>(null);
  const [camera, setCamera] = useState<MediaStream | null>(null);
  const [galeria, setGaleria] = useState<FotoGuardada[] | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  // 4.6 §21 — modo estilizada: foto base (data-url 480) + parâmetros
  const [fotoEstilo, setFotoEstilo] = useState<string | null>(null);
  // lote 971-980 (AS6 §1226, as6.foto_projeto): SNAPSHOT do avatar
  // quando ele é a FONTE da foto (entrada §321.1-.2); câmera/arquivo
  // zeram — projeto salvo carrega o config p/ re-editar §1225/§1227
  const [fonteAvatar, setFonteAvatar] = useState<AvatarConfig | null>(null);
  // mega 12 (§21×§174.1): TERCEIRA origem — captura do personagem 3D
  const [galeria3d, setGaleria3d] = useState<EntradaIndice3d[] | null>(null);
  const [capturando3d, setCapturando3d] = useState(false);
  // lote 721-730 (§329.3, flag as5.foto3d): fase amigável da captura 3D
  const [fase329, setFase329] = useState<string | null>(null);
  // mega 47: captura 3D com fundo TRANSPARENTE (compõe limpa nos templates)
  const [transparente3d, setTransparente3d] = useState(false);
  const [estilo, setEstilo] = useState<EstiloFoto>(ESTILO_VAZIO);
  // lote 981-990 (AS6 §1219, as6.foto_camadas): SOLO — só a camada
  // escolhida aparece no PREVIEW; export/salvar usam o estilo real
  const [soloCamada, setSoloCamada] = useState<CamadaFotoId | null>(null);
  // §325: formato de saída — 'perfil' vai ao servidor; wide sai por download
  const [formato, setFormato] = useState<FormatoFotoId>('perfil');
  // §368: escala do export local (declarada AQUI — validação/lote usam)
  const [escala, setEscala] = useState<1 | 2 | 4>(1);
  // mega 96 (§350): lado do medalhão nos formatos wide
  const [ladoWide, setLadoWide] = useState<'esquerda' | 'direita'>('esquerda');
  // mega 103 (§372): wide com fundo TRANSPARENTE (PNG alpha)
  const [wideTransp, setWideTransp] = useState(false);

  // mega 56 (§360): HISTÓRICO não destrutivo do estilo — undo/redo de
  // camadas/título/cores/templates (ajustes têm o "Zerar" próprio; sliders
  // não poluem a pilha). Abrir/fechar o modo estilizada zera as pilhas.
  const refPassado = useRef<EstiloFoto[]>([]);
  const refFuturo = useRef<EstiloFoto[]>([]);
  const [ticHist, setTicHist] = useState(0);
  void ticHist;
  // lote 211–220 (§326/§229): galeria de templates — filtro por categoria,
  // favoritos (local-first) e destaque determinístico da semana (§251).
  const galeriaTpl = flag('as5.foto_galeria');
  const [filtroTpl, setFiltroTpl] = useState<string>('todos');
  const [favsTpl, setFavsTpl] = useState<string[]>(favoritosTemplate);

  // ── lote 221–223 (§323/§324): CANVAS PRO — estado de VISTA (nunca vai
  // ao estilo/servidor: zoom/pan/grade/safe/fundo são só do editor) ──
  const canvasPro = flag('as5.foto_canvas_pro');
  const [vista, setVista] = useState({ zoom: 1, x: 0, y: 0 });
  const [gradeCv, setGradeCv] = useState(false);
  const [safeCv, setSafeCv] = useState(false);
  const [fundoPrev, setFundoPrev] = useState<'padrao' | 'claro' | 'escuro' | 'xadrez'>('padrao');
  // §323.2: elemento SELECIONADO para manipulação direta
  const [selEl, setSelEl] = useState<ElementoPosFoto | null>(null);
  // §324.2: linhas-guia temporárias do snapping (coords do viewBox)
  const [guias, setGuias] = useState<{ v?: number; h?: number } | null>(null);
  const refViewport = useRef<HTMLDivElement>(null);
  const refCaixaPrev = useRef<HTMLDivElement>(null);
  const refArrCv = useRef<{ modo: 'pan' | 'el'; px: number; py: number; hist?: boolean } | null>(null);
  const refEspaco = useRef(false); // §324.1: espaço+arraste = mover a vista
  const mudarEstilo = useCallback((fn: (e: EstiloFoto) => EstiloFoto) => {
    setEstilo((e) => {
      refPassado.current = [...refPassado.current.slice(-29), e];
      refFuturo.current = [];
      return fn(e);
    });
    setTicHist((t) => t + 1);
  }, []);
  const desfazerEstilo = useCallback(() => {
    const anterior = refPassado.current.pop();
    if (!anterior) return;
    setEstilo((e) => { refFuturo.current.push(e); return anterior; });
    setTicHist((t) => t + 1);
  }, []);
  const refazerEstilo = useCallback(() => {
    const proximo = refFuturo.current.pop();
    if (!proximo) return;
    setEstilo((e) => { refPassado.current.push(e); return proximo; });
    setTicHist((t) => t + 1);
  }, []);
  const zerarHistorico = useCallback(() => {
    refPassado.current = [];
    refFuturo.current = [];
    setTicHist((t) => t + 1);
  }, []);

  // megas 51–54: AJUSTES da foto — neutro é REMOVIDO (estilo limpo; sem
  // ajustes o SVG é byte a byte o legado)
  const NEUTROS: Record<string, number | string> = {
    brilho: 1, contraste: 1, saturacao: 1, temperatura: 0, vinheta: 0, rotacao: 0,
    // lote 111 (§332–§341)
    desfoqueFundo: 0, granulacao: 0, zoomFoto: 1, anel: 3,
    forma: 'circulo', filtroCor: 'nenhum',
    nitidez: 0, marca: '', // lote 311-320 (§333/§372)
    particulas: 'nenhum', // lote 541-550 (§348.1)
    borda: 0, // megas 565-567 (§340-341): pluma da borda do medalhão
  };
  const mudarAjuste = useCallback((campo: keyof AjustesFoto, valor: number | boolean | string) => {
    setEstilo((e) => {
      const aj: AjustesFoto = { ...e.ajustes };
      const neutro = typeof valor === 'boolean'
        ? valor === false
        : valor === NEUTROS[campo];
      if (neutro) delete aj[campo];
      else (aj as Record<string, number | boolean | string>)[campo] = valor;
      if (Object.keys(aj).length === 0) { const { ajustes: _a, ...resto } = e; return resto as EstiloFoto; }
      return { ...e, ajustes: aj };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // lote 161–164 (§338/§339/§342): config POR CAMADA (neutro = chave some)
  const mudarCamadaFoto = useCallback((cat: CamadaFotoId, patch: Partial<CamadaFotoCfg>) => {
    mudarEstilo((e) => {
      const atual: CamadaFotoCfg = { ...(e.camadasFoto?.[cat] ?? {}), ...patch };
      if (atual.oculta !== true) delete atual.oculta;
      if (typeof atual.opacidade !== 'number' || atual.opacidade >= 1) delete atual.opacidade;
      if (!atual.blend || atual.blend === 'normal') delete atual.blend;
      if (cat !== 'efeito' || (atual.plano !== 'atras' && atual.plano !== 'frente')) delete atual.plano;
      if (atual.travada !== true) delete atual.travada; // §1217 (lote 981-990)
      const cfg = { ...(e.camadasFoto ?? {}) };
      if (Object.keys(atual).length) cfg[cat] = atual; else delete cfg[cat];
      if (!Object.keys(cfg).length) { const { camadasFoto: _c, ...resto } = e; return resto as EstiloFoto; }
      return { ...e, camadasFoto: cfg };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // lote 165 (§334): luz local — slider não polui a pilha (como ajustes)
  const mudarLuz = useCallback((tipo: 'radial' | 'linear' | null, intensidade?: number) => {
    setEstilo((e) => {
      if (!tipo || intensidade === 0) { const { luzLocal: _l, ...resto } = e; return resto as EstiloFoto; }
      return { ...e, luzLocal: { tipo, intensidade: intensidade ?? e.luzLocal?.intensidade ?? 0.4 } };
    });
  }, []);

  // lote 166 (§343): tipografia aprovada (padrões = chave some)
  const mudarTipografia = useCallback((patch: Partial<TipografiaFoto>) => {
    setEstilo((e) => {
      const t: TipografiaFoto = { ...(e.tipografia ?? {}), ...patch };
      if (!t.fonte || t.fonte === 'sistema') delete t.fonte;
      if (!t.peso || t.peso === 600) delete t.peso;
      if (!t.tamanho || t.tamanho === 'm') delete t.tamanho;
      if (!t.cor || t.cor === CORES_TEXTO_FOTO[0]) delete t.cor;
      if (t.contorno !== true) delete t.contorno;
      if (t.caixaAlta !== true) delete t.caixaAlta;
      if (!Object.keys(t).length) { const { tipografia: _t, ...resto } = e; return resto as EstiloFoto; }
      return { ...e, tipografia: t };
    });
  }, []);

  // ── lote 221–224: helpers do canvas PRO ─────────────────────────────
  /** caixa do viewBox no formato atual (240-base; wide até 960 de largura) */
  const caixaAtual = FORMATOS_FOTO[formato].caixa;

  /** mega 224 (§344): título-componente (neutro = chave some) */
  const mudarSeloCfg = useCallback((patch: Partial<SeloCfgFoto>) => {
    mudarEstilo((e) => {
      const s: SeloCfgFoto = { ...(e.seloCfg ?? {}), ...patch };
      if (!s.escala || s.escala === 'm') delete s.escala;
      if (s.compacto !== true) delete s.compacto;
      if (!Object.keys(s).length) { const { seloCfg: _s, ...resto } = e; return resto as EstiloFoto; }
      return { ...e, seloCfg: s };
    });
  }, [mudarEstilo]);

  /** mega 223: posição de um elemento (null = volta ao layout legado).
   *  comHistorico=false durante o arraste (como os sliders — §360). */
  const definirPos = useCallback((el: ElementoPosFoto, p: { x: number; y: number } | null, comHistorico = true) => {
    const fn = (e: EstiloFoto): EstiloFoto => {
      const pos = { ...(e.pos ?? {}) };
      if (p) pos[el] = { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
      else delete pos[el];
      if (!Object.keys(pos).length) { const { pos: _p, ...resto } = e; return resto as EstiloFoto; }
      return { ...e, pos };
    };
    if (comHistorico) mudarEstilo(fn); else setEstilo(fn);
  }, [mudarEstilo]);

  /** posição EFETIVA do elemento (manual ou o padrão do layout legado) */
  const posAtualEl = useCallback((el: ElementoPosFoto): { x: number; y: number } => (
    estilo.pos?.[el] ?? posPadraoElementoFoto(el, formato, ladoWide, !!estilo.subtitulo)
  ), [estilo.pos, estilo.subtitulo, formato, ladoWide]);

  /** §323.2: só elementos PRESENTES na composição são selecionáveis */
  const elementosPos = useMemo(() => {
    const lista: Array<{ id: ElementoPosFoto; nome: string }> = [];
    if (estilo.legenda) lista.push({ id: 'legenda', nome: 'Legenda' });
    if (estilo.subtitulo && formato !== 'perfil') lista.push({ id: 'subtitulo', nome: 'Subtítulo' });
    if (estilo.titulo) lista.push({ id: 'selo', nome: 'Título' });
    if (estilo.camadas.emblema && estilo.camadas.emblema !== 'nenhum') lista.push({ id: 'emblema', nome: 'Emblema' });
    return lista;
  }, [estilo.legenda, estilo.subtitulo, estilo.titulo, estilo.camadas.emblema, formato]);

  // seleção morre junto com o elemento (ex.: legenda apagada)
  useEffect(() => {
    if (selEl && !elementosPos.some((e) => e.id === selEl)) setSelEl(null);
  }, [selEl, elementosPos]);

  /** §324.2: snapping — centro/margens/grade; devolve pos + linhas-guia */
  const encaixar = useCallback((p: { x: number; y: number }): { x: number; y: number; v?: number; h?: number } => {
    const [W, H] = caixaAtual;
    const tol = 5;
    let { x, y } = p;
    let v: number | undefined;
    let h: number | undefined;
    const alvosX = [W / 2, 12, W - 12, ...(formato !== 'perfil' ? [120, (240 + W) / 2] : [])];
    const alvosY = [H / 2, 12, H - 12];
    for (const a of alvosX) if (Math.abs(x - a) <= tol) { x = a; v = a; break; }
    for (const a of alvosY) if (Math.abs(y - a) <= tol) { y = a; h = a; break; }
    if (gradeCv && v === undefined) x = Math.round(x / 8) * 8;
    if (gradeCv && h === undefined) y = Math.round(y / 8) * 8;
    return { x: Math.max(-20, Math.min(980, x)), y: Math.max(-20, Math.min(260, y)), v, h };
  }, [caixaAtual, formato, gradeCv]);

  // §324.1: scroll = zoom (listener nativo — precisa de preventDefault)
  useEffect(() => {
    const alvo = refViewport.current;
    if (!alvo || !canvasPro || !fotoEstilo) return;
    const aoRoda = (e: WheelEvent) => {
      e.preventDefault();
      setVista((z) => ({ ...z, zoom: Math.max(0.25, Math.min(4, z.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))) }));
    };
    alvo.addEventListener('wheel', aoRoda, { passive: false });
    return () => alvo.removeEventListener('wheel', aoRoda);
  }, [canvasPro, fotoEstilo]);

  // §324.1: ESPAÇO+arraste move a vista mesmo com elemento selecionado
  useEffect(() => {
    if (!canvasPro || !fotoEstilo) return;
    const baixo = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return;
      if (e.key === ' ') refEspaco.current = true;
    };
    const cima = (e: KeyboardEvent) => { if (e.key === ' ') refEspaco.current = false; };
    window.addEventListener('keydown', baixo);
    window.addEventListener('keyup', cima);
    return () => { window.removeEventListener('keydown', baixo); window.removeEventListener('keyup', cima); };
  }, [canvasPro, fotoEstilo]);

  const aoPressionarCv = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const modo = selEl && !refEspaco.current ? 'el' : 'pan';
    refArrCv.current = { modo, px: e.clientX, py: e.clientY };
  }, [selEl]);

  const aoMoverCv = useCallback((e: React.PointerEvent) => {
    const arr = refArrCv.current;
    if (!arr) return;
    const dx = e.clientX - arr.px;
    const dy = e.clientY - arr.py;
    arr.px = e.clientX;
    arr.py = e.clientY;
    if (arr.modo === 'pan') {
      setVista((z) => ({ ...z, x: z.x + dx, y: z.y + dy }));
      return;
    }
    if (!selEl) return;
    const rect = refCaixaPrev.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    if (!arr.hist) { arr.hist = true; mudarEstilo((es) => ({ ...es })); } // 1 passo/arraste (§360)
    const k = rect.width / caixaAtual[0]; // px de tela por unidade do viewBox
    const atual = posAtualEl(selEl);
    const enc = encaixar({ x: atual.x + dx / k, y: atual.y + dy / k });
    definirPos(selEl, { x: enc.x, y: enc.y }, false);
    setGuias(enc.v !== undefined || enc.h !== undefined ? { v: enc.v, h: enc.h } : null);
  }, [selEl, caixaAtual, posAtualEl, encaixar, definirPos, mudarEstilo]);

  const aoSoltarCv = useCallback(() => {
    refArrCv.current = null;
    setGuias(null);
  }, []);

  /** §324.1: duplo clique alterna foco 1× ⇄ 2× */
  const aoDuploCliqueCv = useCallback(() => {
    setVista((z) => (z.zoom === 1 ? { ...z, zoom: 2 } : { zoom: 1, x: 0, y: 0 }));
  }, []);

  /** §324: fit (reset) e 100% (1 px do PNG final = 1 px de tela) */
  const ajustarVista = useCallback((modo: 'fit' | '100' | 'mais' | 'menos') => {
    if (modo === 'fit') { setVista({ zoom: 1, x: 0, y: 0 }); return; }
    if (modo === '100') {
      const rect = refCaixaPrev.current?.getBoundingClientRect();
      setVista((z) => {
        if (!rect || rect.width === 0) return { zoom: 1, x: 0, y: 0 };
        const base = rect.width / z.zoom; // largura CSS sem zoom
        const alvo = formato === 'perfil' ? LADO_SAIDA : FORMATOS_FOTO[formato].saida[0];
        return { zoom: Math.max(0.25, Math.min(4, alvo / base)), x: 0, y: 0 };
      });
      return;
    }
    setVista((z) => ({ ...z, zoom: Math.max(0.25, Math.min(4, z.zoom * (modo === 'mais' ? 1.25 : 0.8))) }));
  }, [formato]);

  /** setas movem o elemento selecionado (2 un.; Shift = 8) — §323.2 */
  const aoTeclaCv = useCallback((e: React.KeyboardEvent) => {
    if (!selEl) return;
    const passo = e.shiftKey ? 8 : 2;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo],
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    const atual = posAtualEl(selEl);
    definirPos(selEl, { x: Math.max(-20, Math.min(980, atual.x + d[0])), y: Math.max(-20, Math.min(260, atual.y + d[1])) });
  }, [selEl, posAtualEl, definirPos]);

  // lote 168 (§349): dicas determinísticas de composição (§239: só sugere)
  const dicas = useMemo(() => (fotoEstilo ? dicasComposicao(estilo, formato) : []), [fotoEstilo, estilo, formato]);
  const aplicarDica = useCallback((d: DicaFoto) => {
    if (d.formatoSugerido) setFormato(d.formatoSugerido);
    if (d.correcao) mudarEstilo((e) => ({ ...e, ...d.correcao }));
    telemetria('foto_dica_aplicada', { id: d.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const camadasAtivasFoto = useMemo(
    () => CATEGORIAS_FOTO.filter((c) => estilo.camadas[c] && estilo.camadas[c] !== 'nenhum'),
    [estilo.camadas],
  );

  // mega 57 (§364): PROJETOS do Photo Studio (localStorage v1)
  const [projetos, setProjetos] = useState<ProjetoFoto[]>(listarProjetosFoto);
  // mega 252 (§364 v2): renomear projeto inline
  const [renomeandoProj, setRenomeandoProj] = useState<{ id: string; nome: string } | null>(null);
  // mega 251 (§361): HISTÓRICO VISUAL — thumbs clicáveis da pilha de undo
  const [histVisual, setHistVisual] = useState(false);
  const saltarParaPasso = useCallback((idx: number) => {
    setEstilo((atual) => {
      const passado = refPassado.current;
      if (idx < 0 || idx >= passado.length) return atual;
      const alvo = passado[idx];
      refFuturo.current = [...refFuturo.current, atual, ...passado.slice(idx + 1).reverse()];
      refPassado.current = passado.slice(0, idx);
      return alvo;
    });
    setTicHist((t) => t + 1);
    telemetria('foto_hist_saltou', { idx });
  }, []);
  // mega 253 (§369): PRESETS DE EXPORTAÇÃO nomeados
  const [presetsExp, setPresetsExp] = useState<PresetExport[]>(listarPresetsExport);
  const aplicarPresetExport = useCallback((pe: PresetExport) => {
    setFormato(pe.formato);
    setEscala(pe.escala);
    setWideTransp(pe.transparente);
    setLadoWide(pe.lado);
    telemetria('foto_export_preset', { id: pe.id });
  }, []);
  // mega 258 (§349): COMPOR PRA MIM — regras determinísticas, com undo
  const comporPraMim = useCallback(() => {
    mudarEstilo((e) => ({ ...e, ...comporAutomatico(e, formato) }));
    setMensagem('Composição montada por regras (§349) — desfazer volta como estava.');
    telemetria('foto_compos_auto', { formato });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formato]);
  const guardarProjeto = useCallback(async () => {
    if (!fotoEstilo) return;
    const p = await salvarProjetoFoto(fotoEstilo, estilo, formato, '',
      flag('as6.foto_projeto') && fonteAvatar ? fonteAvatar : undefined); // §1226
    setProjetos(listarProjetosFoto());
    setMensagem(p ? `Projeto "${p.nome}" guardado — reabra quando quiser.` : 'Limite de 6 projetos atingido.');
    if (p) telemetria('foto_projeto_salvou');
  }, [fotoEstilo, estilo, formato, fonteAvatar]);
  const abrirProjeto = useCallback((p: ProjetoFoto) => {
    setFotoEstilo(p.foto);
    setEstilo(p.estilo);
    setFormato(p.formato);
    setFonteAvatar(p.avatarFonte ?? null); // §1226 (v1 sem snapshot = null)
    zerarHistorico();
    setMensagem(`Projeto "${p.nome}" reaberto.`);
    telemetria('foto_projeto_abriu');
  }, [zerarHistorico]);

  // mega 58 (§370): VALIDAÇÃO pré-export — rasteriza e reporta sem baixar
  const [validando, setValidando] = useState(false);
  const validarExport = useCallback(async () => {
    if (!fotoEstilo) return;
    setValidando(true);
    try {
      const wide = formato !== 'perfil';
      const [lw, lh] = wide ? FORMATOS_FOTO[formato].saida : [LADO_SAIDA * escala, LADO_SAIDA * escala];
      const svg = svgFotoDe(fotoEstilo, estilo, { estatico: true, uid: 'ftval', ...(wide ? { formato } : { tamanho: lw }) });
      const png = await rasterizarSvg(svg, lw, lh);
      const kb = Math.round((png.length * 3) / 4 / 1024); // base64 → bytes
      const camadas = Object.keys(estilo.camadas).length;
      const avisos: string[] = [];
      if (wide && estilo.camadas.moldura) avisos.push('moldura fica de fora no wide');
      if (kb > 1500) avisos.push('arquivo pesado p/ web');
      setMensagem(`Validação: ${lw}×${lh}px · ~${kb}KB · ${camadas} camada(s)`
        + (estilo.ajustes ? ' · ajustes ativos' : '') + (avisos.length ? ` · ⚠ ${avisos.join('; ')}` : ' · tudo certo.'));
      telemetria('foto_validou', { kb, formato });
    } catch { setMensagem('Não consegui validar — tente de novo.'); }
    finally { setValidando(false); }
  }, [fotoEstilo, estilo, formato, escala]);

  // mega 118 (§369+): exporta o VETOR (.svg) da composição
  const baixarSvg = useCallback(() => {
    if (!fotoEstilo) return;
    const wide = formato !== 'perfil';
    const svg = svgFotoDe(fotoEstilo, estilo, {
      estatico: true, uid: 'ftsvg',
      ...(wide ? { formato, lado: ladoWide, semFundo: wideTransp } : { tamanho: LADO_SAIDA }),
    });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `dshow-foto-${formato}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    telemetria('foto_exportou_svg', { formato });
  }, [fotoEstilo, estilo, formato, ladoWide, wideTransp]);

  // mega 119 (§373): copia o PNG direto p/ a área de transferência
  const copiarPng = useCallback(async () => {
    if (!fotoEstilo) return;
    try {
      const wide = formato !== 'perfil';
      const [lw, lh] = wide ? FORMATOS_FOTO[formato].saida : [LADO_SAIDA, LADO_SAIDA];
      const svg = svgFotoDe(fotoEstilo, estilo, {
        estatico: true, uid: 'ftcopy',
        ...(wide ? { formato, lado: ladoWide, semFundo: wideTransp } : { tamanho: lw }),
      });
      const png = await rasterizarSvg(svg, lw, lh);
      const blob = await (await fetch(png)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setMensagem('Imagem copiada — cole onde quiser.');
      telemetria('foto_copiou', { formato });
    } catch { setMensagem('Copiar não funcionou neste navegador — use Baixar PNG.'); }
  }, [fotoEstilo, estilo, formato, ladoWide, wideTransp]);

  // mega 59 (§371): EXPORTAÇÃO EM LOTE — todos os formatos numa ação
  const [exportandoLote, setExportandoLote] = useState(false);
  const exportarLote = useCallback(async () => {
    if (!fotoEstilo || exportandoLote) return;
    setExportandoLote(true);
    try {
      const ids = Object.keys(FORMATOS_FOTO) as FormatoFotoId[];
      for (const id of ids) {
        const wide = id !== 'perfil';
        const [lw, lh] = wide ? FORMATOS_FOTO[id].saida : [960, 960];
        const svg = svgFotoDe(fotoEstilo, estilo, { estatico: true, uid: `ftlote${id}`, ...(wide ? { formato: id } : { tamanho: lw }) });
        const png = await rasterizarSvg(svg, lw, lh);
        const a = document.createElement('a');
        a.href = png;
        a.download = `dshow-${id}-${lw}x${lh}.png`;
        a.click();
        await new Promise((r) => setTimeout(r, 350)); // navegador respira
      }
      setMensagem(`Lote exportado: ${ids.length} formatos (§371).`);
      telemetria('foto_exportou_lote', { formatos: ids.length });
    } catch { setMensagem('O lote parou no meio — tente de novo.'); }
    finally { setExportandoLote(false); }
  }, [fotoEstilo, estilo, exportandoLote]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const arrasto = useRef<{ ativo: boolean; px: number; py: number }>({ ativo: false, px: 0, py: 0 });

  // ── Galeria "Suas fotos" (recarrega a cada versão nova) ────────────
  useEffect(() => {
    let vivo = true;
    void carregarFotos().then((f) => { if (vivo) setGaleria(f); });
    return () => { vivo = false; };
  }, [versao]);

  // ── Câmera ──────────────────────────────────────────────────────────
  const fecharCamera = useCallback(() => {
    setCamera((s) => { s?.getTracks().forEach((t) => t.stop()); return null; });
  }, []);

  useEffect(() => () => { camera?.getTracks().forEach((t) => t.stop()); }, [camera]);

  useEffect(() => {
    if (camera && videoRef.current) {
      videoRef.current.srcObject = camera;
      void videoRef.current.play().catch(() => { /* autoplay bloqueado */ });
    }
  }, [camera]);

  const abrirCamera = useCallback(async () => {
    setMensagem(null);
    setRecorte(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 960 }, height: { ideal: 960 }, facingMode: 'user' },
        audio: false,
      });
      setCamera(stream);
    } catch {
      setMensagem('Não consegui acessar a câmera — verifique a permissão do navegador.');
    }
  }, []);

  const capturar = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const quadro = document.createElement('canvas');
    quadro.width = video.videoWidth;
    quadro.height = video.videoHeight;
    const ctx = quadro.getContext('2d');
    if (!ctx) return;
    // espelha (selfie natural, como o preview)
    ctx.translate(quadro.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const img = new Image();
    img.onload = () => { setFonteAvatar(null); setRecorte({ img, zoom: 1, x: 0, y: 0 }); fecharCamera(); }; // câmera ≠ avatar (§1226)
    img.src = quadro.toDataURL('image/png');
  }, [fecharCamera]);

  // ── Arquivo ─────────────────────────────────────────────────────────
  const escolherArquivo = useCallback((arquivo: File | undefined) => {
    setMensagem(null);
    if (!arquivo) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(arquivo.type)) {
      setMensagem('Formato não suportado — use PNG, JPG ou WebP.');
      return;
    }
    if (arquivo.size > 12 * 1024 * 1024) {
      setMensagem('Arquivo muito grande (máx. 12 MB).');
      return;
    }
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth < 64 || img.naturalHeight < 64) {
        setMensagem('Imagem muito pequena — mínimo 64×64.');
        URL.revokeObjectURL(url);
        return;
      }
      fecharCamera();
      setFonteAvatar(null); // arquivo ≠ avatar (§1226)
      setRecorte({ img, zoom: 1, x: 0, y: 0 });
    };
    img.onerror = () => { setMensagem('Não consegui ler esta imagem.'); URL.revokeObjectURL(url); };
    img.src = url;
  }, [fecharCamera]);

  // megas 531-534 (§321.1-.2, flag as5.foto_entrada): AVATAR (ou preset)
  // vira a FONTE da foto — renderiza o SVG e entra no MESMO funil do
  // recorte/estilização (nada novo depois daqui)
  const usarConfigComoFoto = useCallback((cfg: AvatarConfig) => {
    try {
      const limpo = validarConfig(cfg);
      const uri = dataUriDe(limpo, { estatico: true, tamanho: 480 });
      const img = new Image();
      img.onload = () => { setFonteAvatar(limpo); setRecorte({ img, zoom: 1, x: 0, y: 0 }); }; // §1226
      img.onerror = () => setMensagem('Não consegui renderizar o avatar como foto.');
      img.src = uri;
    } catch { setMensagem('Não consegui renderizar o avatar como foto.'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Recorte ─────────────────────────────────────────────────────────
  /** Desenha a imagem no palco respeitando zoom/pan (cover). */
  const desenhar = useCallback((ctx: CanvasRenderingContext2D, r: EstadoRecorte, lado: number) => {
    const { img, zoom, x, y } = r;
    const escalaBase = lado / Math.min(img.naturalWidth, img.naturalHeight);
    const escala = escalaBase * zoom;
    const w = img.naturalWidth * escala;
    const h = img.naturalHeight * escala;
    const fator = lado / LADO_PALCO; // converte pan da tela p/ este canvas
    ctx.clearRect(0, 0, lado, lado);
    ctx.drawImage(img, (lado - w) / 2 + x * fator, (lado - h) / 2 + y * fator, w, h);
  }, []);

  // limita o pan para a imagem nunca descolar da borda do palco
  const limitar = useCallback((r: EstadoRecorte): EstadoRecorte => {
    const escalaBase = LADO_PALCO / Math.min(r.img.naturalWidth, r.img.naturalHeight);
    const w = r.img.naturalWidth * escalaBase * r.zoom;
    const h = r.img.naturalHeight * escalaBase * r.zoom;
    const maxX = Math.max(0, (w - LADO_PALCO) / 2);
    const maxY = Math.max(0, (h - LADO_PALCO) / 2);
    return { ...r, x: Math.min(maxX, Math.max(-maxX, r.x)), y: Math.min(maxY, Math.max(-maxY, r.y)) };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !recorte) return;
    const ctx = canvas.getContext('2d');
    if (ctx) desenhar(ctx, recorte, LADO_PALCO);
  }, [recorte, desenhar]);

  const aoPressionar = useCallback((e: React.PointerEvent) => {
    if (!recorte) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    arrasto.current = { ativo: true, px: e.clientX, py: e.clientY };
  }, [recorte]);

  const aoMover = useCallback((e: React.PointerEvent) => {
    if (!arrasto.current.ativo || !recorte) return;
    const dx = e.clientX - arrasto.current.px;
    const dy = e.clientY - arrasto.current.py;
    arrasto.current.px = e.clientX;
    arrasto.current.py = e.clientY;
    setRecorte((r) => (r ? limitar({ ...r, x: r.x + dx, y: r.y + dy }) : r));
  }, [recorte, limitar]);

  const aoSoltar = useCallback(() => { arrasto.current.ativo = false; }, []);

  // ── Salvar / reativar / estilizar ───────────────────────────────────
  /** PNG 480 do recorte atual (base da foto simples E da estilizada). */
  const recorteParaPng = useCallback((): string | null => {
    if (!recorte) return null;
    const saida = document.createElement('canvas');
    saida.width = LADO_SAIDA;
    saida.height = LADO_SAIDA;
    const ctx = saida.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingQuality = 'high';
    desenhar(ctx, recorte, LADO_SAIDA);
    return saida.toDataURL('image/png');
  }, [recorte, desenhar]);

  const usarFoto = useCallback(async () => {
    const png = recorteParaPng();
    if (!png) return;
    setSalvando(true);
    setMensagem(null);
    const r = await salvarFoto(png, versao);
    setSalvando(false);
    if (r.ok) {
      setMensagem('Foto salva! O header já foi atualizado.');
      setRecorte(null);
      aoSalvar(r.versao ?? versao + 1);
    } else {
      setMensagem(r.mensagem ?? 'Não foi possível salvar a foto.');
    }
  }, [recorteParaPng, versao, aoSalvar]);

  /** Entra no modo ESTILIZADA a partir do recorte atual (4.6 §21). */
  const abrirEstilo = useCallback(() => {
    const png = recorteParaPng();
    if (!png) return;
    setFotoEstilo(png);
    setRecorte(null);
    // §362: retoma o estilo da última sessão (a foto é sempre a nova)
    const salvo = lerEstiloSalvo();
    if (salvo) { setEstilo(salvo); setMensagem('Retomamos seu estilo anterior — use Limpar para começar do zero.'); }
    else setMensagem(null);
    telemetria('foto_estilo_abriu', { origem: 'recorte' });
  }, [recorteParaPng]);

  // mega 12: abre a galeria de personagens 3D (cadeia registry→índice)
  const abrirGaleria3d = useCallback(async () => {
    setMensagem(null);
    const i = await carregarIndice3d();
    if (!i) { setMensagem('Personagens 3D indisponíveis neste ambiente.'); return; }
    setGaleria3d(i.personagens);
  }, []);

  // mega 12: captura HEADLESS 960 do personagem (renderer §401 efêmero:
  // monta oculto → capturar determinístico §508 → descartar) e cai
  // DIRETO no fluxo Estilizar — sem recorte (a captura já é quadrada)
  const escolher3d = useCallback(async (slug: string) => {
    setCapturando3d(true);
    setMensagem(null);
    const palco = document.createElement('div');
    palco.style.cssText = 'position:fixed;left:-99999px;top:0;width:960px;height:960px';
    document.body.appendChild(palco);
    let r: Awaited<ReturnType<typeof criarRenderizador>> | null = null;
    // lote 721-730 (§329, flag as5.foto3d): a captura vira ALTA de verdade
    // — estado do USUÁRIO (cores §420 + corpo §414), pose Idle do pacote
    // UAL (§329.2 passo 4), DPR 2 + supersampling §506 e fases §329.3.
    // Flag off = comportamento anterior byte a byte (mega 12/47).
    const alta = flag('as5.foto3d');
    try {
      r = await criarRenderizador('3d', {
        resolverPersonagem: () => slug,
        ...(alta ? {
          aoCarregamento: (f: string) => setFase329(
            f === 'metadados' ? 'Preparando personagem…'
              : f === 'baixando' || f === 'modelo_rapido' ? 'Carregando materiais…'
                : f === 'montando' ? 'Ajustando iluminação…' : null),
        } : {}),
      } as Parameters<typeof criarRenderizador>[1]);
      await r.inicializar({ qualidade: 'alto', pixelRatioMax: alta ? 2 : 1 });
      await r.montar(palco as unknown as { innerHTML: string });
      const rx = r as unknown as {
        definirCores3d?: (c: Record<string, string> | null) => void;
        definirCorpo3d?: (c: { tipo?: string | null; fino?: { largura?: number; altura?: number } | null } | null) => void;
        definirPacoteAnimacoes?: (u: string | null) => Promise<void>;
      };
      if (alta && configAtual) {
        const estado = deLegado2d(validarConfig(configAtual));
        // cores §420: só canais personalizados (mesma regra do palco)
        if (flag('as5.materiais3d')) {
          const cores: Record<string, string> = {};
          for (const [canal, cor] of Object.entries(validarConfig(configAtual).cores)) {
            if (cor && cor.toLowerCase() !== CORES_PADRAO[canal as keyof typeof CORES_PADRAO]?.toLowerCase()) cores[canal] = cor;
          }
          rx.definirCores3d?.(Object.keys(cores).length ? cores : null);
        }
        // corpo §414: tipo §102 + fino §102.2 do avatar
        if (flag('as5.morfos3d') && (estado.body.tipo || estado.body.fino)) {
          rx.definirCorpo3d?.({ tipo: estado.body.tipo ?? null, fino: estado.body.fino ?? null });
        }
        const aplicado = await r.aplicarEstado(estado);
        if (!aplicado.ok) throw new Error('personagem indisponível');
        // pose §329.2: Idle do pacote UAL tira o UBC do T-pose (404 degrada)
        if (flag('as5.animacao3d')) {
          await rx.definirPacoteAnimacoes?.('/assets/avatars/3d/animacoes/ual_basico/pacote.glb')?.catch(() => { /* §481 */ });
          // §508 "estabilizar": alguns quadros p/ a pose Idle assentar
          await new Promise((res) => setTimeout(res, 450));
        }
      } else {
        const aplicado = await r.aplicarEstado(estadoVazio());
        if (!aplicado.ok) throw new Error('personagem indisponível');
      }
      if (alta) setFase329('Renderizando…');
      // mega 47: transparente §21×§325 — o template compõe sem fundo escuro
      const foto = await r.capturar({
        largura: 960, altura: 960, deterministica: true, transparente: transparente3d,
        ...(alta ? { superAmostra: 2 as const } : {}),
      });
      if (alta) setFase329('Finalizando imagem…');
      setFotoEstilo(foto.dataUri);
      setGaleria3d(null);
      const salvo = lerEstiloSalvo();
      if (salvo) setEstilo(salvo);
      telemetria('foto_estilo_abriu', { origem: '3d', personagem: slug, transparente: transparente3d, alta });
    } catch {
      setMensagem('Não consegui capturar o personagem 3D — tente outro.');
    } finally {
      await r?.descartar().catch(() => { /* efêmero */ });
      palco.remove();
      setCapturando3d(false);
      setFase329(null);
    }
  }, [transparente3d, configAtual]);

  // §362: autosave do ESTILO enquanto o modo estilizada está aberto
  useEffect(() => {
    if (!fotoEstilo) return;
    const t = setTimeout(() => {
      if (estiloTemConteudo(estilo)) gravarEstilo(estilo);
      else limparEstiloSalvo();
    }, 500);
    return () => clearTimeout(t);
  }, [fotoEstilo, estilo]);

  // §326.3: aplicar template PRESERVANDO o que está bloqueado (fica de fora)
  const aplicarTemplate = useCallback((tpl: TemplateFoto) => {
    const camadas: EstiloFoto['camadas'] = {};
    let pulados = 0;
    for (const [cat, id] of Object.entries(tpl.estilo.camadas)) {
      if (!id) continue;
      const item = itemPorId(id);
      // fora se INEXISTENTE (id inválido) ou BLOQUEADO — mesma simetria do título
      if (!item || (item.bloqueadoPor && !desbloqueados.has(id))) { pulados += 1; continue; }
      camadas[cat as keyof EstiloFoto['camadas']] = id;
    }
    let titulo = tpl.estilo.titulo;
    if (titulo && !TITULOS.some((x) => x.id === titulo)) { titulo = undefined; pulados += 1; }
    // lote 211–220: o template define a DECORAÇÃO por inteiro (substitui, não
    // acumula — troca de template não deixa resíduo). Os ajustes/legenda do
    // USUÁRIO (enquadramento da foto dele) são preservados. Campos novos da
    // onda 161–200 (camadasFoto/luz/tipografia/subtítulo) entram sanitizados
    // no svgFotoDe; camadasFoto só p/ camadas que de fato entraram.
    mudarEstilo((e) => {
      const est: EstiloFoto = {
        camadas,
        cores: { destaque: tpl.estilo.cores.destaque },
        ...(e.ajustes ? { ajustes: e.ajustes } : {}),
        ...(e.legenda ? { legenda: e.legenda } : {}),
        ...(titulo ? { titulo } : {}),
      };
      if (tpl.estilo.camadasFoto) {
        const cf: NonNullable<EstiloFoto['camadasFoto']> = {};
        for (const [cat, cfg] of Object.entries(tpl.estilo.camadasFoto)) {
          if (cfg && camadas[cat as keyof EstiloFoto['camadas']]) cf[cat as CamadaFotoId] = cfg;
        }
        if (Object.keys(cf).length) est.camadasFoto = cf;
      }
      if (tpl.estilo.luzLocal) est.luzLocal = tpl.estilo.luzLocal;
      if (tpl.estilo.tipografia) est.tipografia = tpl.estilo.tipografia;
      if (tpl.estilo.subtitulo) est.subtitulo = tpl.estilo.subtitulo;
      // lote 221–225 (§344/§345): posições/título-componente do template —
      // só entram se o alvo ainda existe após o filtro de bloqueados
      if (tpl.estilo.pos) {
        const pv: NonNullable<EstiloFoto['pos']> = {};
        for (const [el, p] of Object.entries(tpl.estilo.pos)) {
          if (!p) continue;
          if (el === 'selo' && !est.titulo) continue;
          if (el === 'emblema' && !camadas.emblema) continue;
          pv[el as ElementoPosFoto] = p;
        }
        if (Object.keys(pv).length) est.pos = pv;
      }
      if (tpl.estilo.seloCfg && est.titulo) est.seloCfg = tpl.estilo.seloCfg;
      return est;
    });
    setMensagem(pulados
      ? `Template "${tpl.nome}" aplicado — ${pulados} item(ns) indisponível(is) ficaram de fora.`
      : `Template "${tpl.nome}" aplicado.`);
    telemetria('foto_template', { id: tpl.id, pulados });
  }, [desbloqueados, mudarEstilo]);

  // lote 211–220 (§326/§229): derivados da galeria de templates.
  const categoriasTpl = useMemo(
    () => ['todos', ...Array.from(new Set(TEMPLATES_FOTO.map((t) => t.categoria)))],
    [],
  );
  const destaqueTplId = useMemo(() => TEMPLATES_FOTO[semanaIso() % TEMPLATES_FOTO.length].id, []);
  const templatesVisiveis = useMemo(() => {
    const base = filtroTpl === 'favoritos'
      ? TEMPLATES_FOTO.filter((t) => favsTpl.includes(t.id))
      : filtroTpl === 'todos'
        ? TEMPLATES_FOTO
        : TEMPLATES_FOTO.filter((t) => t.categoria === filtroTpl);
    // favoritos primeiro (estável), preservando a ordem do catálogo dentro de cada grupo
    return [...base].sort((a, b) => Number(favsTpl.includes(b.id)) - Number(favsTpl.includes(a.id)));
  }, [filtroTpl, favsTpl]);
  const alternarFavTpl = useCallback((tpl: TemplateFoto) => {
    const prox = alternarFavoritoTemplate(tpl.id);
    setFavsTpl(prox);
    telemetria('foto_template_favorito', { id: tpl.id, ativo: prox.includes(tpl.id) });
  }, []);
  const mudarFiltroTpl = useCallback((cat: string) => {
    setFiltroTpl(cat);
    telemetria('foto_template_filtro', { categoria: cat });
  }, []);

  // §368: exportação local em escala (1×/2×/4× do PNG 480)
  // §325: formatos wide exportam nas dimensões NATIVAS do formato
  const baixarPng = useCallback(async (tipo: 'png' | 'jpeg' = 'png') => {
    if (!fotoEstilo) return;
    setMensagem(null);
    try {
      const wide = formato !== 'perfil';
      const [lw, lh] = wide ? FORMATOS_FOTO[formato].saida : [LADO_SAIDA * escala, LADO_SAIDA * escala];
      const svg = svgFotoDe(fotoEstilo, estilo, {
        estatico: true, uid: 'ftexp',
        ...(wide ? { formato, lado: ladoWide, semFundo: wideTransp } : { tamanho: lw }),
      });
      // mega 314 (§369, flag as5.foto_fina): JPEG qualidade 0.9 opcional
      const img = await rasterizarSvg(svg, lw, lh, tipo);
      const a = document.createElement('a');
      a.href = img;
      const ext = tipo === 'jpeg' ? 'jpg' : 'png';
      a.download = wide ? `dshow-${formato}-${lw}x${lh}.${ext}` : `dshow-foto-${lw}px.${ext}`;
      a.click();
      telemetria('foto_exportou', { lado: lw, formato, tipo });
    } catch {
      setMensagem('Não consegui gerar a imagem para download — tente de novo.');
    }
  }, [fotoEstilo, estilo, escala, formato, ladoWide, wideTransp]);

  /** Entra no modo ESTILIZADA a partir de uma foto guardada. */
  // mega 15 (§21.5): compartilhar a composição atual (share→clipboard→download)
  const compartilharFoto = useCallback(async () => {
    if (!fotoEstilo) return;
    setMensagem(null);
    try {
      const wide = formato !== 'perfil';
      const [lw, lh] = wide ? FORMATOS_FOTO[formato].saida : [LADO_SAIDA, LADO_SAIDA];
      const svg = svgFotoDe(fotoEstilo, estilo, {
        estatico: true, uid: 'ftshare',
        ...(wide ? { formato, lado: ladoWide, semFundo: wideTransp } : { tamanho: lw }),
      });
      const png = await rasterizarSvg(svg, lw, lh);
      const canal = await compartilharPng(png, wide ? `dshow-${formato}.png` : 'dshow-foto.png', 'Minha foto Dshow');
      telemetria('foto_compartilhou', { canal, formato });
      if (canal === 'clipboard') setMensagem('Imagem copiada — cole onde quiser.');
      if (canal === 'download') setMensagem('Sem compartilhamento neste navegador — baixei o PNG.');
    } catch { setMensagem('Não consegui compartilhar — tente Baixar PNG.'); }
  }, [fotoEstilo, estilo, formato, ladoWide, wideTransp]);

  const estilizarGuardada = useCallback(async (foto: FotoGuardada) => {
    setMensagem(null);
    try {
      const r = await fetch(foto.url, { credentials: 'include' });
      if (!r.ok) throw new Error(String(r.status));
      const blob = await r.blob();
      const dataUrl = await new Promise<string>((resolver, rejeitar) => {
        const fr = new FileReader();
        fr.onload = () => resolver(String(fr.result));
        fr.onerror = () => rejeitar(new Error('LEITURA'));
        fr.readAsDataURL(blob);
      });
      setFotoEstilo(dataUrl);
      telemetria('foto_estilo_abriu', { origem: 'galeria' });
    } catch {
      setMensagem('Não consegui carregar esta foto para estilizar.');
    }
  }, []);

  const salvarEstilizada = useCallback(async () => {
    if (!fotoEstilo) return;
    setSalvando(true);
    setMensagem(null);
    try {
      const svg = svgFotoDe(fotoEstilo, estilo, { estatico: true, tamanho: LADO_SAIDA, uid: 'ftsalva' });
      const png = await rasterizarSvg(svg);
      const r = await salvarFoto(png, versao, estilo);
      if (r.ok) {
        setMensagem('Foto estilizada salva! O header já foi atualizado.');
        setFotoEstilo(null);
        setEstilo(ESTILO_VAZIO);
        limparEstiloSalvo(); // §362: trabalho concluído — rascunho fecha
        telemetria('foto_estilo_salvou');
        aoSalvar(r.versao ?? versao + 1);
      } else {
        setMensagem(r.mensagem ?? 'Não foi possível salvar a foto estilizada.');
      }
    } catch {
      setMensagem('Não consegui compor a imagem final — tente de novo.');
    } finally {
      setSalvando(false);
    }
  }, [fotoEstilo, estilo, versao, aoSalvar]);

  // preview vivo da estilização (animações ligadas — o PNG sai estático);
  // §325: o preview segue o FORMATO selecionado
  // lote 981-990 (§1215, as6.foto_camadas): reordenar a pilha de fundo
  const mudarOrdemFundo = useCallback((cat: 'fundo' | 'banner' | 'aura', direcao: -1 | 1) => {
    mudarEstilo((e) => {
      const atual: Array<'fundo' | 'banner' | 'aura'> = e.ordemFundo ?? ['fundo', 'banner', 'aura'];
      const i = atual.indexOf(cat);
      const j = i + direcao;
      if (i < 0 || j < 0 || j >= atual.length) return e;
      const nova = [...atual];
      [nova[i], nova[j]] = [nova[j], nova[i]];
      if (nova.join(',') === 'fundo,banner,aura') { const { ordemFundo: _o, ...resto } = e; return resto as EstiloFoto; }
      return { ...e, ordemFundo: nova };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // §1219: preview com SOLO aplicado (nunca persiste; export usa `estilo`)
  const estiloPreview = useMemo(() => {
    if (!flag('as6.foto_camadas') || !soloCamada) return estilo;
    const cfg = { ...(estilo.camadasFoto ?? {}) };
    for (const cat of ['fundo', 'banner', 'aura', 'efeito', 'moldura', 'emblema'] as const) {
      if (cat !== soloCamada) cfg[cat] = { ...(cfg[cat] ?? {}), oculta: true };
      else if (cfg[cat]?.oculta) cfg[cat] = { ...cfg[cat], oculta: false };
    }
    return { ...estilo, camadasFoto: cfg };
  }, [estilo, soloCamada]);

  const previewEstilo = useMemo(
    () => (fotoEstilo
      ? svgFotoDe(fotoEstilo, estiloPreview, {
        uid: 'ftprev', formato,
        ...(formato !== 'perfil' ? { lado: ladoWide, semFundo: wideTransp } : {}),
      })
      : ''),
    [fotoEstilo, estiloPreview, formato, ladoWide, wideTransp]
  );

  const mudarCamada = (cat: (typeof CATEGORIAS_FOTO)[number], id: string | null) => {
    mudarEstilo((e) => {           // mega 56: vira passo do histórico
      const camadas = { ...e.camadas };
      if (id) camadas[cat] = id;
      else delete camadas[cat];
      return { ...e, camadas };
    });
  };

  const reativar = useCallback(async (foto: FotoGuardada) => {
    setSalvando(true);
    setMensagem(null);
    const r = await reativarVersao(foto.id, versao);
    setSalvando(false);
    if (r.ok) {
      setMensagem('Foto reativada! O header já foi atualizado.');
      aoSalvar(r.versao ?? versao + 1);
    } else {
      setMensagem(r.mensagem ?? 'Não foi possível reativar a foto.');
    }
  }, [versao, aoSalvar]);

  // ── UI ──────────────────────────────────────────────────────────────
  return (
    <section className="avst-foto" aria-label="Foto de perfil">
      <h3 className="avst-cores-titulo"><Camera size={14} aria-hidden /> Foto de perfil</h3>
      <p className="avst-foto-nota">
        {fotoAtiva
          ? 'Sua foto está ativa agora. Salvar um avatar em camadas substitui a foto (ela fica guardada aqui).'
          : 'Envie um arquivo ou tire uma foto na hora — o avatar em camadas fica guardado no histórico.'}
      </p>

      {!recorte && !camera && !fotoEstilo && (
        <div className="avst-foto-origem">
          <label className="avst-foto-escolher">
            <ImageUp size={22} aria-hidden />
            <span>Escolher imagem…</span>
            {/* megas 531-534 (§321.1-.2, flag as5.foto_entrada) */}
            {flag('as5.foto_entrada') && configAtual && (
              <button type="button" className="avst-botao" data-teste="foto-do-avatar"
                title="Usa o seu avatar ATUAL como a foto (§321.1)"
                onClick={() => usarConfigComoFoto(configAtual)}>
                Usar meu avatar
              </button>
            )}
            {flag('as5.foto_entrada') && listarPresets().length > 0 && (
              <select className="avst-botao" data-teste="foto-de-preset" defaultValue=""
                aria-label="Usar um preset como foto (§321.2)"
                onChange={(e) => {
                  const pz = listarPresets().find((x) => x.id === e.target.value);
                  if (pz) usarConfigComoFoto(pz.config);
                  e.target.value = '';
                }}>
                <option value="" disabled>De um preset…</option>
                {listarPresets().map((pz) => (
                  <option key={pz.id} value={pz.id}>{pz.nome}</option>
                ))}
              </select>
            )}
            <input type="file" accept="image/png,image/jpeg,image/webp"
              onChange={(e) => escolherArquivo(e.target.files?.[0])} />
          </label>
          <button type="button" className="avst-foto-escolher" onClick={() => void abrirCamera()}>
            <Video size={22} aria-hidden />
            <span>Tirar foto agora</span>
          </button>
          <button type="button" className="avst-foto-escolher" data-teste="origem-3d"
            onClick={() => void abrirGaleria3d()}>
            <Box size={22} aria-hidden />
            <span>Personagem 3D</span>
          </button>
        </div>
      )}

      {/* mega 57 (§364): PROJETOS guardados — reabrir o trabalho onde parou */}
      {!recorte && !camera && !fotoEstilo && !galeria3d && projetos.length > 0 && (
        <div className="avst-foto-galeria" data-teste="projetos-foto">
          <h4 className="avst-cores-titulo"><FolderOpen size={14} aria-hidden /> Projetos guardados</h4>
          <div className="avst-foto-grade" role="list" aria-label="Projetos do Photo Studio">
            {projetos.map((p2) => (
              <div key={p2.id} role="listitem" className="avst-foto-item">
                <button type="button" className="avst-foto-item-img" title={`Reabrir ${p2.nome}`}
                  onClick={() => abrirProjeto(p2)}>
                  <img src={p2.foto} alt={p2.nome} loading="lazy" />
                  <span className="avst-foto-item-usar"><FolderOpen size={13} aria-hidden /></span>
                </button>
                <button type="button" className="avst-foto-item-estilo" title={`Excluir ${p2.nome}`}
                  onClick={() => { excluirProjetoFoto(p2.id); setProjetos(listarProjetosFoto()); }}>
                  <Trash2 size={12} aria-hidden />
                </button>
                {/* lote 971-980 (§1227, as6.foto_projeto): a fonte era o
                    avatar → dá p/ trocar pela versão ATUAL sem perder a
                    estilização (snapshot §1226 continua no projeto) */}
                {flag('as6.foto_projeto') && p2.avatarFonte && configAtual && (
                  <button type="button" className="avst-foto-item-estilo avst6-fp-atualizar"
                    data-teste="projeto-atualizar-fonte"
                    title={`Atualizar ${p2.nome} para o avatar atual (§1227)`}
                    onClick={() => {
                      void (async () => {
                        try {
                          const uri = dataUriDe(validarConfig(configAtual), { estatico: true, tamanho: 480 });
                          const jpeg = await miniaturizarFoto(uri);
                          const novo = atualizarFonteProjeto(p2.id, jpeg, validarConfig(configAtual));
                          setProjetos(listarProjetosFoto());
                          setMensagem(novo ? `Projeto "${novo.nome}" atualizado para o avatar atual.` : 'Não consegui atualizar o projeto.');
                          telemetria('foto_projeto_atualizou_fonte');
                        } catch { setMensagem('Não consegui atualizar o projeto.'); }
                      })();
                    }}>
                    <RefreshCw size={12} aria-hidden />
                  </button>
                )}
                {/* mega 252 (§364 v2): nome visível + renomear inline */}
                {renomeandoProj?.id === p2.id ? (
                  <input className="avst-foto-item-nome" autoFocus value={renomeandoProj.nome} maxLength={24}
                    aria-label={`Novo nome de ${p2.nome}`} data-teste="projeto-renomear-input"
                    onChange={(ev) => setRenomeandoProj({ id: p2.id, nome: ev.target.value })}
                    onBlur={() => { renomearProjetoFoto(p2.id, renomeandoProj.nome); setRenomeandoProj(null); setProjetos(listarProjetosFoto()); }}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter') { renomearProjetoFoto(p2.id, renomeandoProj.nome); setRenomeandoProj(null); setProjetos(listarProjetosFoto()); }
                      if (ev.key === 'Escape') setRenomeandoProj(null);
                    }} />
                ) : (
                  <button type="button" className="avst-foto-item-nome" data-teste="projeto-nome"
                    title={`${p2.nome} · ${new Date(p2.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — clique para renomear (§364)`}
                    onClick={() => setRenomeandoProj({ id: p2.id, nome: p2.nome })}>
                    {p2.nome}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* mega 12: galeria de personagens 3D (thumbs §508 publicados) */}
      {galeria3d && !fotoEstilo && (
        <div className="avst-foto-3d" data-teste="galeria-3d">
          <p className="avst-foto-nota">
            Escolha o personagem — a captura entra direto no estúdio de estilo.
          </p>
          <label className="avst-foto-3d-transp" data-teste="foto-3d-transparente">
            <input type="checkbox" checked={transparente3d}
              onChange={(e) => setTransparente3d(e.target.checked)} />
            Fundo transparente (compõe melhor nos templates)
          </label>
          <div className="avst-foto-3d-grade" role="list">
            {galeria3d.map((p3) => (
              <button key={p3.slug} type="button" role="listitem" disabled={capturando3d}
                className="avst-foto-3d-item" title={p3.nome}
                onClick={() => void escolher3d(p3.slug)}>
                <img src={`${BASE_PERSONAGENS_3D}/${p3.thumb || `${p3.slug}/thumb.webp`}`} alt={p3.nome}
                  width={72} height={72} loading="lazy" />
                <span>{p3.nome}</span>
              </button>
            ))}
          </div>
          <div className="avst-foto-acoes">
            <button type="button" className="avst-botao" disabled={capturando3d}
              onClick={() => setGaleria3d(null)}>
              <X size={14} aria-hidden /> Cancelar
            </button>
            {capturando3d && (
              <span className="avst-foto-nota" data-teste="foto-329-fase">
                <LoaderCircle className="avst-girando" size={13} aria-hidden />{' '}
                {/* §329.3: fases reais quando a captura ALTA está ligada */}
                {fase329 ?? 'Capturando personagem…'}
              </span>
            )}
          </div>
        </div>
      )}

      {camera && (
        <>
          <div className="avst-foto-palco" style={{ width: LADO_PALCO, height: LADO_PALCO }}>
            <video ref={videoRef} playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            <span className="avst-foto-mascara" aria-hidden />
          </div>
          <div className="avst-foto-acoes">
            <button type="button" className="avst-botao" onClick={fecharCamera}>
              <X size={14} aria-hidden /> Cancelar
            </button>
            <button type="button" className="avst-botao avst-botao-primario" onClick={capturar}>
              <Aperture size={14} aria-hidden /> Capturar
            </button>
          </div>
        </>
      )}

      {recorte && (
        <>
          <div className="avst-foto-palco" style={{ width: LADO_PALCO, height: LADO_PALCO }}>
            <canvas ref={canvasRef} width={LADO_PALCO} height={LADO_PALCO}
              onPointerDown={aoPressionar} onPointerMove={aoMover}
              onPointerUp={aoSoltar} onPointerCancel={aoSoltar} />
            <span className="avst-foto-mascara" aria-hidden />
          </div>
          <label className="avst-foto-zoom">
            Zoom
            <input type="range" min={1} max={3} step={0.01} value={recorte.zoom}
              onChange={(e) => setRecorte((r) => (r ? limitar({ ...r, zoom: Number(e.target.value) }) : r))} />
          </label>
          <div className="avst-foto-acoes">
            <button type="button" className="avst-botao" onClick={() => setRecorte(null)} disabled={salvando}>
              <X size={14} aria-hidden /> Cancelar
            </button>
            <button type="button" className="avst-botao" onClick={abrirEstilo} disabled={salvando}
              title="Fundo, moldura, aura, título e mais — por cima da sua foto">
              <Wand2 size={14} aria-hidden /> Estilizar…
            </button>
            <button type="button" className="avst-botao avst-botao-primario" onClick={() => void usarFoto()} disabled={salvando}>
              {salvando ? <LoaderCircle className="avst-girando" size={14} aria-hidden /> : <Check size={14} aria-hidden />}
              {salvando ? ' Enviando…' : ' Usar esta foto'}
            </button>
          </div>
        </>
      )}

      {/* ── Modo FOTO ESTILIZADA (4.6 §21) ─────────────────────────────
          lote 221 (§323): com a flag as5.foto_canvas_pro o MESMO conteúdo
          se reorganiza em 3 regiões (ferramentas ▏canvas ▏propriedades) via
          wrappers + grid; flag OFF = wrappers com display:contents (fluxo
          idêntico ao clássico, byte a byte no render). */}
      {fotoEstilo && (
        <div className={canvasPro ? 'avst-foto-estilo avst-ft-pro' : 'avst-foto-estilo'}
          {...(canvasPro ? { 'data-teste': 'ftpro' } : {})}>
          <div className="avst-ftp-centroa">
            {canvasPro ? (
              /* megas 222–223 (§324): canvas profissional — zoom/pan/grade/
                 safe/guias; arraste move o elemento SELECIONADO (§323.2) */
              <div className="avst-ft-grupo" data-teste="ftp-canvas">
                <div className="avst-ftp-viewport" ref={refViewport} tabIndex={0} role="application"
                  aria-label="Canvas da composição — setas movem o elemento selecionado"
                  data-arrastando={selEl ? 'el' : 'pan'}
                  onPointerDown={aoPressionarCv} onPointerMove={aoMoverCv} onPointerUp={aoSoltarCv}
                  onPointerCancel={aoSoltarCv} onDoubleClick={aoDuploCliqueCv} onKeyDown={aoTeclaCv}>
                  <div className="avst-ftp-mundo"
                    style={{ transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.zoom})` }}>
                    <div className="avst-ftp-caixa" ref={refCaixaPrev} data-fundo={fundoPrev}>
                      <div className="avst-ft-preview" data-formato={formato} aria-label="Prévia da foto estilizada"
                        dangerouslySetInnerHTML={{ __html: previewEstilo }} />
                      <svg className="avst-ftp-overlay" viewBox={`0 0 ${caixaAtual[0]} ${caixaAtual[1]}`} aria-hidden>
                        {gradeCv && (
                          <>
                            <defs>
                              <pattern id="ftpgrade" width="8" height="8" patternUnits="userSpaceOnUse">
                                <path d="M8 0H0V8" fill="none" stroke="#4c9de8" strokeOpacity="0.3" strokeWidth="0.4" />
                              </pattern>
                            </defs>
                            <rect width={caixaAtual[0]} height={caixaAtual[1]} fill="url(#ftpgrade)" data-teste="ftp-grade" />
                          </>
                        )}
                        {safeCv && (
                          <g data-teste="ftp-safe">
                            <rect x="12" y="12" width={caixaAtual[0] - 24} height={caixaAtual[1] - 24} fill="none"
                              stroke="#39d98a" strokeOpacity="0.55" strokeWidth="0.8" strokeDasharray="4 3" rx="4" />
                            {formato === 'perfil' && (
                              <circle cx="120" cy="118" r="92" fill="none" stroke="#39d98a" strokeOpacity="0.35"
                                strokeWidth="0.8" strokeDasharray="2 3" />
                            )}
                          </g>
                        )}
                        {guias?.v !== undefined && (
                          <line x1={guias.v} y1={-20} x2={guias.v} y2={caixaAtual[1] + 20}
                            stroke="#ffd75e" strokeWidth="0.7" data-teste="ftp-guia-v" />
                        )}
                        {guias?.h !== undefined && (
                          <line x1={-20} y1={guias.h} x2={caixaAtual[0] + 20} y2={guias.h}
                            stroke="#ffd75e" strokeWidth="0.7" data-teste="ftp-guia-h" />
                        )}
                        {selEl && (() => {
                          const pSel = posAtualEl(selEl);
                          return (
                            <g data-teste="ftp-marcador">
                              <circle cx={pSel.x} cy={pSel.y} r="4" fill="none" stroke="#ffd75e" strokeWidth="0.9" />
                              <line x1={pSel.x - 7} y1={pSel.y} x2={pSel.x + 7} y2={pSel.y} stroke="#ffd75e" strokeWidth="0.5" />
                              <line x1={pSel.x} y1={pSel.y - 7} x2={pSel.x} y2={pSel.y + 7} stroke="#ffd75e" strokeWidth="0.5" />
                            </g>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="avst-ftp-controles" data-teste="ftp-controles">
                  <button type="button" className="avst-ft-chip" title="Diminuir zoom (§324.1)" data-teste="ftp-menos"
                    onClick={() => ajustarVista('menos')}><ZoomOut size={12} aria-hidden /></button>
                  <span className="avst-ftp-pct" data-teste="ftp-pct">{Math.round(vista.zoom * 100)}%</span>
                  <button type="button" className="avst-ft-chip" title="Aumentar zoom" data-teste="ftp-mais"
                    onClick={() => ajustarVista('mais')}><ZoomIn size={12} aria-hidden /></button>
                  <button type="button" className="avst-ft-chip" title="Ajustar à tela" data-teste="ftp-fit"
                    onClick={() => ajustarVista('fit')}><Maximize size={12} aria-hidden /> Fit</button>
                  <button type="button" className="avst-ft-chip" title="Pixels reais do PNG exportado" data-teste="ftp-100"
                    onClick={() => ajustarVista('100')}>100%</button>
                  <button type="button" className="avst-ft-chip" aria-pressed={gradeCv} title="Grade (§324)"
                    data-teste="ftp-grade-toggle" onClick={() => setGradeCv((v) => !v)}>
                    <Grid3x3 size={12} aria-hidden /></button>
                  <button type="button" className="avst-ft-chip" aria-pressed={safeCv} title="Safe areas (§324)"
                    data-teste="ftp-safe-toggle" onClick={() => setSafeCv((v) => !v)}>Safe</button>
                  <select className="avst-ft-select" value={fundoPrev} aria-label="Fundo do preview (§324)"
                    data-teste="ftp-fundo" onChange={(e2) => setFundoPrev(e2.target.value as typeof fundoPrev)}>
                    <option value="padrao">Fundo padrão</option>
                    <option value="claro">Fundo claro</option>
                    <option value="escuro">Fundo escuro</option>
                    <option value="xadrez">Transparência</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="avst-ft-preview" data-formato={formato} aria-label="Prévia da foto estilizada"
                dangerouslySetInnerHTML={{ __html: previewEstilo }} />
            )}
            <p className="avst-foto-nota">
              Só assets de <strong>apresentação</strong> entram na foto — roupa e corpo ficam no avatar em camadas.
            </p>
          </div>
          <div className="avst-ftp-esq">

          {/* §325: FORMATO de saída — perfil 1:1 + wide (header/banner/wallpaper) */}
          {/* lote 1051-1060 (#107, as6.derivados): DERIVADOS ao vivo —
              os 4 formatos renderizados JUNTOS com o reflow §Parte 11
              aplicado; clicar troca o formato de trabalho */}
          {flag('as6.derivados') && fotoEstilo && (
            <div className="avst-ft-grupo" data-teste="derivados-foto">
              <span className="avst-ft-rotulo"><Images size={11} aria-hidden /> Derivados (ao vivo)</span>
              <div className="avst6-derivados">
                {(Object.keys(FORMATOS_FOTO) as FormatoFotoId[]).map((id) => (
                  <button key={id} type="button" className={`avst6-derivado${formato === id ? ' avst6-derivado-on' : ''}`}
                    aria-pressed={formato === id}
                    data-teste={`derivado-${id}`}
                    title={`${FORMATOS_FOTO[id].nome} · ${FORMATOS_FOTO[id].proporcao} — clique para editar neste formato`}
                    onClick={() => setFormato(id)}>
                    <span className="avst6-derivado-thumb" aria-hidden
                      dangerouslySetInnerHTML={{ __html: svgFotoDe(fotoEstilo, estilo, { estatico: true, uid: `ftder${id}`, ...(id !== 'perfil' ? { formato: id } : { tamanho: 96 }) }) }} />
                    <span className="avst6-derivado-nome">{FORMATOS_FOTO[id].nome}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="avst-ft-grupo">
            <span className="avst-ft-rotulo"><Images size={11} aria-hidden /> Formato</span>
            <div className="avst-ft-chips" role="radiogroup" aria-label="Formato de saída" data-teste="formatos-foto">
              {(Object.keys(FORMATOS_FOTO) as FormatoFotoId[]).map((id) => (
                <button key={id} type="button" role="radio" aria-checked={formato === id}
                  className={`avst-ft-chip ${formato === id ? 'avst-ft-chip-ativo' : ''}`}
                  title={`${FORMATOS_FOTO[id].proporcao} · ${FORMATOS_FOTO[id].saida[0]}×${FORMATOS_FOTO[id].saida[1]}px`}
                  onClick={() => setFormato(id)}>
                  {FORMATOS_FOTO[id].nome} <small>{FORMATOS_FOTO[id].proporcao}</small>
                </button>
              ))}
            </div>
            {/* mega 253 (§369): PRESETS DE EXPORTAÇÃO nomeados */}
            <div className="avst-ft-chips" data-teste="export-presets">
              {presetsExp.map((pe) => (
                <span key={pe.id} className="avst5-lista-chip-grupo">
                  <button type="button" className="avst-ft-chip" data-teste={`export-preset-${pe.id}`}
                    title={`${FORMATOS_FOTO[pe.formato].nome} · ${pe.escala}× · ${pe.transparente ? 'transparente' : 'com fundo'} (§369)`}
                    onClick={() => aplicarPresetExport(pe)}>{pe.nome}</button>
                  <button type="button" className="avst5-painel-btn" aria-label={`Excluir ${pe.nome}`}
                    onClick={() => { excluirPresetExport(pe.id); setPresetsExp(listarPresetsExport()); }}>×</button>
                </span>
              ))}
              {presetsExp.length < 4 && (
                <button type="button" className="avst-ft-chip" data-teste="export-preset-salvar"
                  title="Guardar formato+escala+transparência atuais como preset (§369)"
                  onClick={() => {
                    const novo9 = salvarPresetExport({ formato, escala, transparente: wideTransp, lado: ladoWide });
                    setPresetsExp(listarPresetsExport());
                    setMensagem(novo9 ? `Preset de exportação "${novo9.nome}" salvo (§369).` : 'Limite de 4 presets de exportação.');
                  }}>+ exportação</button>
              )}
            </div>
            {formato !== 'perfil' && (
              <p className="avst-foto-nota" data-teste="nota-wide">
                Formato wide sai pelo <strong>Baixar PNG</strong> ({FORMATOS_FOTO[formato].saida[0]}×{FORMATOS_FOTO[formato].saida[1]}px).
                “Salvar” grava sempre a foto de perfil 1:1 · moldura só entra no Perfil.
              </p>
            )}
            {formato !== 'perfil' && (
              <div className="avst-ft-chips" data-teste="opcoes-wide">
                {/* mega 96 (§350): lado do medalhão */}
                {(['esquerda', 'direita'] as const).map((l) => (
                  <button key={l} type="button" role="radio" aria-checked={ladoWide === l}
                    className={`avst-ft-chip ${ladoWide === l ? 'avst-ft-chip-ativo' : ''}`}
                    data-teste={`foto-lado-${l}`}
                    onClick={() => setLadoWide(l)}>
                    Medalhão à {l}
                  </button>
                ))}
                {/* mega 103 (§372): wide com alpha */}
                <button type="button" aria-pressed={wideTransp}
                  className={`avst-ft-chip ${wideTransp ? 'avst-ft-chip-ativo' : ''}`}
                  data-teste="foto-wide-transp" title="PNG com fundo transparente (§372)"
                  onClick={() => setWideTransp((v) => !v)}>
                  Fundo transparente
                </button>
                {/* lote 169 (§170.1): preset de composição — foco no título */}
                <button type="button" className="avst-ft-chip" data-teste="preset-foco-titulo"
                  title="Texto maior com contorno — foco no título (§170.1)"
                  onClick={() => mudarTipografia({ tamanho: 'g', contorno: true })}>
                  Foco no título
                </button>
              </div>
            )}
            {/* lote 167 (§343.1): SUBTÍTULO nos formatos wide */}
            {formato !== 'perfil' && (
              <label className="avst-ft-ajuste avst-ft-legenda">
                <span>Subtítulo</span>
                <input type="text" maxLength={48} value={estilo.subtitulo ?? ''}
                  placeholder="Cargo, contexto, data…" data-teste="subtitulo-foto"
                  onChange={(e2) => setEstilo((es) => {
                    const v = e2.target.value;
                    if (!v.trim()) { const { subtitulo: _s, ...resto } = es; return resto as EstiloFoto; }
                    return { ...es, subtitulo: v };
                  })} />
              </label>
            )}
          </div>

          {/* §326/§327: templates prioritários — composição em 1 clique.
              lote 211–220 (§326/§229): galeria com filtro/favoritos/destaque
              (flag as5.foto_galeria; §651 desligada = lista simples). */}
          <div className="avst-ft-grupo">
            <span className="avst-ft-rotulo"><Wand2 size={11} aria-hidden /> Templates</span>
            {galeriaTpl && (
              <div className="avst-ft-tpl-filtros" role="tablist" aria-label="Filtrar templates" data-teste="tpl-filtros">
                <button type="button" role="tab" aria-selected={filtroTpl === 'favoritos'}
                  className={`avst-ft-tpl-filtro ${filtroTpl === 'favoritos' ? 'ativo' : ''}`}
                  data-teste="tpl-filtro-favoritos"
                  onClick={() => mudarFiltroTpl('favoritos')}>
                  <Star size={10} aria-hidden /> Favoritos{favsTpl.length ? ` (${favsTpl.length})` : ''}
                </button>
                {categoriasTpl.map((cat) => (
                  <button key={cat} type="button" role="tab" aria-selected={filtroTpl === cat}
                    className={`avst-ft-tpl-filtro ${filtroTpl === cat ? 'ativo' : ''}`}
                    data-teste={`tpl-filtro-${cat}`}
                    onClick={() => mudarFiltroTpl(cat)}>
                    {cat === 'todos' ? 'Todos' : cat}
                    {/* mega 316 (§326 v2): contagem honesta por categoria */}
                    {flag('as5.foto_fina') && (
                      <em className="avst-ft-tpl-n" data-teste="tpl-contagem">
                        {cat === 'todos' ? TEMPLATES_FOTO.length : TEMPLATES_FOTO.filter((t) => t.categoria === cat).length}
                      </em>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="avst-ft-templates" data-teste="templates-foto">
              {(galeriaTpl ? templatesVisiveis : TEMPLATES_FOTO).map((tpl) => {
                const fav = favsTpl.includes(tpl.id);
                const destaque = galeriaTpl && tpl.id === destaqueTplId;
                return (
                  <span key={tpl.id} className={`avst-ft-template-wrap ${destaque ? 'destaque' : ''}`} data-teste={`tpl-${tpl.id}`}>
                    <button type="button" className="avst-ft-template"
                      title={tpl.descricao}
                      onClick={() => aplicarTemplate(tpl)}>
                      <i style={{ background: tpl.estilo.cores.destaque }} aria-hidden />
                      <span>{tpl.nome}</span>
                      <small>{destaque ? '★ da semana' : tpl.categoria}</small>
                    </button>
                    {galeriaTpl && (
                      <button type="button"
                        className={`avst-ft-tpl-fav ${fav ? 'ativo' : ''}`}
                        aria-label={fav ? `Desfavoritar ${tpl.nome}` : `Favoritar ${tpl.nome}`}
                        aria-pressed={fav}
                        data-teste={`tpl-fav-${tpl.id}`}
                        onClick={() => alternarFavTpl(tpl)}>
                        <Star size={12} aria-hidden fill={fav ? 'currentColor' : 'none'} />
                      </button>
                    )}
                  </span>
                );
              })}
              {galeriaTpl && templatesVisiveis.length === 0 && (
                <span className="avst-ft-tpl-vazio" data-teste="tpl-vazio">
                  {filtroTpl === 'favoritos' ? 'Nenhum favorito ainda — toque na ★ de um template.' : 'Nenhum template nesta categoria.'}
                </span>
              )}
              <button type="button" className="avst-ft-template avst-ft-template-limpar"
                title="Remover tudo e começar do zero"
                onClick={() => { mudarEstilo(() => ESTILO_VAZIO); limparEstiloSalvo(); setMensagem(null); }}>
                <span>Limpar</span>
              </button>
              {/* mega 258 (§349): assistente de layout por REGRAS (nunca IA) */}
              <button type="button" className="avst-ft-template avst-ft-template-compor" data-teste="compor-auto"
                title="Compor pra mim — posições/selo/tipografia por regras determinísticas (§349); desfazer reverte"
                onClick={comporPraMim}>
                <span>✦ Compor pra mim</span>
              </button>
            </div>
          </div>

          {CATEGORIAS_FOTO.map((cat) => {
            const meta = CATEGORIAS.find((c) => c.id === cat);
            const itens = itensDe(cat).filter((i) => !i.bloqueadoPor || desbloqueados.has(i.id));
            const atual = estilo.camadas[cat] ?? null;
            // §325: moldura é desenhada para 1:1 — nos formatos wide os
            // chips ficam desabilitados (a composição já a omite)
            const foraDoFormato = cat === 'moldura' && formato !== 'perfil';
            return (
              <div key={cat} className="avst-ft-grupo">
                <span className="avst-ft-rotulo">
                  {meta?.nome ?? cat}{foraDoFormato ? ' · só no formato Perfil' : ''}
                </span>
                <div className="avst-ft-chips" role="radiogroup" aria-label={meta?.nome ?? cat}>
                  <button type="button" role="radio" aria-checked={atual === null} disabled={foraDoFormato}
                    className={`avst-ft-chip ${atual === null ? 'avst-ft-chip-ativo' : ''}`}
                    onClick={() => mudarCamada(cat, null)}>
                    Nenhum
                  </button>
                  {itens.map((i) => (
                    <button key={i.id} type="button" role="radio" aria-checked={atual === i.id}
                      className={`avst-ft-chip ${atual === i.id ? 'avst-ft-chip-ativo' : ''}`}
                      style={{ '--avst-rar': RARIDADES[i.raridade].cor } as React.CSSProperties}
                      title={`${i.nome} · ${RARIDADES[i.raridade].nome}`}
                      disabled={foraDoFormato}
                      onClick={() => mudarCamada(cat, i.id)}>
                      {i.nome}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="avst-ft-grupo">
            <span className="avst-ft-rotulo"><Crown size={11} aria-hidden /> Título</span>
            <div className="avst-ft-chips" role="radiogroup" aria-label="Título">
              <button type="button" role="radio" aria-checked={!estilo.titulo}
                className={`avst-ft-chip ${!estilo.titulo ? 'avst-ft-chip-ativo' : ''}`}
                onClick={() => mudarEstilo((e) => { const { titulo: _t, ...resto } = e; return resto as EstiloFoto; })}>
                Nenhum
              </button>
              {TITULOS.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={estilo.titulo === t.id}
                  className={`avst-ft-chip ${estilo.titulo === t.id ? 'avst-ft-chip-ativo' : ''}`}
                  style={{ '--avst-rar': RARIDADES[t.raridade].cor } as React.CSSProperties}
                  title={`${t.nome} · ${RARIDADES[t.raridade].nome}`}
                  onClick={() => mudarEstilo((e) => ({ ...e, titulo: t.id }))}>
                  {t.nome}
                </button>
              ))}
            </div>
            {/* mega 224 (§344): TÍTULO-COMPONENTE — escala com limites +
                versão compacta (neutro = omitido; selo legado intocado) */}
            {canvasPro && estilo.titulo && (
              <div className="avst-ft-chips" data-teste="selo-cfg" role="group" aria-label="Selo do título (§344)">
                {([['p', 'Selo P'], ['m', 'Selo M'], ['g', 'Selo G']] as const).map(([esc2, nome2]) => (
                  <button key={esc2} type="button" role="radio"
                    aria-checked={(estilo.seloCfg?.escala ?? 'm') === esc2}
                    className={`avst-ft-chip ${(estilo.seloCfg?.escala ?? 'm') === esc2 ? 'avst-ft-chip-ativo' : ''}`}
                    data-teste={`selo-esc-${esc2}`} title="Escala do selo dentro de limites (§344)"
                    onClick={() => mudarSeloCfg({ escala: esc2 })}>{nome2}</button>
                ))}
                <button type="button" className="avst-ft-chip" aria-pressed={!!estilo.seloCfg?.compacto}
                  data-teste="selo-compacto" title="Versão compacta do selo (§344)"
                  onClick={() => mudarSeloCfg({ compacto: !estilo.seloCfg?.compacto })}>Compacto</button>
              </div>
            )}
          </div>

          <div className="avst-ft-grupo">
            <span className="avst-ft-rotulo">Cor de destaque</span>
            <div className="avst-ft-cores" role="radiogroup" aria-label="Cor de destaque">
              {CORES_SUGERIDAS.destaque.map((cor) => (
                <button key={cor} type="button" role="radio"
                  aria-checked={estilo.cores.destaque === cor}
                  className={`avst-ft-cor ${estilo.cores.destaque === cor ? 'avst-ft-cor-ativa' : ''}`}
                  style={{ background: cor }} title={cor}
                  onClick={() => mudarEstilo((e) => ({ ...e, cores: { destaque: cor } }))} />
              ))}
            </div>
          </div>
          </div>
          <div className="avst-ftp-dir">
          {/* mega 223 (§323.2): SELEÇÃO direta + nudge + presets do emblema
              (§345.1) — só no canvas PRO (posições ficam no estilo.pos) */}
          {canvasPro && elementosPos.length > 0 && (
            <div className="avst-ft-grupo" data-teste="ftp-posicao">
              <span className="avst-ft-rotulo"><Move size={11} aria-hidden /> Posição dos elementos</span>
              <div className="avst-ft-chips">
                {elementosPos.map((el2) => (
                  <button key={el2.id} type="button" role="radio" aria-checked={selEl === el2.id}
                    className={`avst-ft-chip ${selEl === el2.id ? 'avst-ft-chip-ativo' : ''}`}
                    data-teste={`ftp-el-${el2.id}`}
                    onClick={() => setSelEl((s) => (s === el2.id ? null : el2.id))}>{el2.nome}</button>
                ))}
              </div>
              {selEl && (
                <div className="avst-ft-chips" data-teste="ftp-nudge">
                  <button type="button" className="avst-ft-chip" aria-label="Mover à esquerda"
                    onClick={() => { const p2 = posAtualEl(selEl); definirPos(selEl, { x: p2.x - 2, y: p2.y }); }}>◀</button>
                  <button type="button" className="avst-ft-chip" aria-label="Mover acima"
                    onClick={() => { const p2 = posAtualEl(selEl); definirPos(selEl, { x: p2.x, y: p2.y - 2 }); }}>▲</button>
                  <button type="button" className="avst-ft-chip" aria-label="Mover abaixo"
                    onClick={() => { const p2 = posAtualEl(selEl); definirPos(selEl, { x: p2.x, y: p2.y + 2 }); }}>▼</button>
                  <button type="button" className="avst-ft-chip" aria-label="Mover à direita"
                    onClick={() => { const p2 = posAtualEl(selEl); definirPos(selEl, { x: p2.x + 2, y: p2.y }); }}>▶</button>
                  <button type="button" className="avst-ft-chip" data-teste="ftp-centralizar"
                    title="Encaixar no centro horizontal (§324.2)"
                    onClick={() => { const p2 = posAtualEl(selEl); definirPos(selEl, { x: caixaAtual[0] / 2, y: p2.y }); }}>
                    Centralizar</button>
                  <button type="button" className="avst-ft-chip" data-teste="ftp-restaurar" disabled={!estilo.pos?.[selEl]}
                    title="Voltar ao layout automático"
                    onClick={() => definirPos(selEl, null)}>Restaurar</button>
                </div>
              )}
              {estilo.camadas.emblema && estilo.camadas.emblema !== 'nenhum' && (
                <div className="avst-ft-chips" data-teste="ftp-emblema-presets" role="radiogroup"
                  aria-label="Posição do emblema (§345.1)">
                  {posSugeridasEmblema(formato, ladoWide).map((s2) => {
                    const ativo = s2.pos === null ? !estilo.pos?.emblema
                      : estilo.pos?.emblema?.x === s2.pos.x && estilo.pos?.emblema?.y === s2.pos.y;
                    return (
                      <button key={s2.id} type="button" role="radio" aria-checked={ativo}
                        className={`avst-ft-chip ${ativo ? 'avst-ft-chip-ativo' : ''}`}
                        data-teste={`ftp-emb-${s2.id}`}
                        onClick={() => definirPos('emblema', s2.pos)}>{s2.nome}</button>
                    );
                  })}
                </div>
              )}
              <p className="avst-foto-nota">
                Arraste no canvas move o elemento selecionado · espaço+arraste move a vista · setas ajustam fino.
              </p>
            </div>
          )}

          {/* megas 51–54: AJUSTES não destrutivos (§333/§334/§337/§340) */}
          <div className="avst-ft-grupo" data-teste="ajustes-foto">
            <span className="avst-ft-rotulo"><SlidersHorizontal size={11} aria-hidden /> Ajustes da foto</span>
            <div className="avst-ft-ajustes">
              {([
                ['brilho', 'Brilho', 0.5, 1.5, 0.01],
                ['contraste', 'Contraste', 0.5, 1.5, 0.01],
                ['saturacao', 'Saturação', 0, 2, 0.01],
                ['temperatura', 'Temperatura', -1, 1, 0.01],
                ['vinheta', 'Vinheta', 0, 1, 0.01],
                ['rotacao', 'Rotação', -180, 180, 1],
                ['zoomFoto', 'Zoom da foto', 1, 1.6, 0.01],
                ['desfoqueFundo', 'Desfoque fundo', 0, 1, 0.01],
                ['granulacao', 'Granulação', 0, 1, 0.01],
                ['anel', 'Anel', 1, 6, 0.5],
                // mega 311 (§333, flag as5.foto_fina): nitidez por convolução
                ...(flag('as5.foto_fina') ? [['nitidez', 'Nitidez', 0, 1, 0.01]] : []),
                // megas 565-567 (§340-341, flag as5.criacao_fina): borda suave
                ...(flag('as5.criacao_fina') ? [['borda', 'Borda suave', 0, 1, 0.01]] : []),
              ] as Array<[keyof AjustesFoto, string, number, number, number]>).map(([campo, rotulo, min, max, passo]) => (
                <label key={campo} className="avst-ft-ajuste">
                  <span>{rotulo}</span>
                  <input type="range" min={min} max={max} step={passo}
                    value={Number(estilo.ajustes?.[campo] ?? (NEUTROS as Record<string, number>)[campo])}
                    aria-label={rotulo} data-teste={`ajuste-${campo}`}
                    onChange={(e) => mudarAjuste(campo, Number(e.target.value))} />
                </label>
              ))}
              <button type="button" className="avst-ft-chip" aria-pressed={estilo.ajustes?.espelhar === true}
                data-teste="ajuste-espelhar"
                onClick={() => mudarAjuste('espelhar', !(estilo.ajustes?.espelhar === true))}>Espelhar</button>
              <button type="button" className="avst-ft-chip" aria-pressed={estilo.ajustes?.sombra === true}
                data-teste="ajuste-sombra" title="Sombra de contato sob o medalhão (§337)"
                onClick={() => mudarAjuste('sombra', !(estilo.ajustes?.sombra === true))}>Sombra</button>
              {/* megas 541-543 (§348.1, flag as5.foto_pro2): partículas estáticas */}
              {flag('as5.foto_pro2') && (
                <span role="radiogroup" aria-label="Partículas estáticas (§348.1)" data-teste="foto-particulas">
                  {([['nenhum', 'Sem partículas'], ['pontos', 'Pontos'], ['estrelas', 'Estrelas'], ['pixels', 'Pixels']] as const).map(([id, nome]) => (
                    <button key={id} type="button" role="radio" data-teste={`fpart-${id}`}
                      aria-checked={(estilo.ajustes?.particulas ?? 'nenhum') === id}
                      className={`avst-ft-chip ${(estilo.ajustes?.particulas ?? 'nenhum') === id ? 'avst-ft-chip-ativo' : ''}`}
                      onClick={() => mudarAjuste('particulas', id)}>{nome}</button>
                  ))}
                </span>
              )}
              {/* mega 315 (§372, flag as5.foto_fina): marca d'água opcional */}
              {flag('as5.foto_fina') && (
                <label className="avst-ft-ajuste" title="Marca d'água discreta no canto (§372)">
                  <span>Marca</span>
                  <input type="text" maxLength={16} data-teste="ajuste-marca"
                    value={String(estilo.ajustes?.marca ?? '')}
                    aria-label="Texto da marca d'água (vazio = sem marca)"
                    onChange={(e) => mudarAjuste('marca', e.target.value.replace(/[^\p{L}\p{N} .\-]/gu, '').slice(0, 16))} />
                </label>
              )}
              <button type="button" className="avst-ft-chip" disabled={!estilo.ajustes}
                data-teste="ajuste-zerar"
                onClick={() => setEstilo((e) => { const { ajustes: _a, ...resto } = e; return resto as EstiloFoto; })}>
                Zerar ajustes</button>
            </div>
            {/* mega 111 (§341): FORMA do medalhão */}
            <div className="avst-ft-chips" role="radiogroup" aria-label="Forma do medalhão" data-teste="formas-medalhao">
              {([['circulo', 'Círculo'], ['hexagono', 'Hexágono'], ['losango', 'Losango'], ['squircle', 'Squircle'],
                // megas 312-313 (§340-341, flag as5.foto_fina)
                ...(flag('as5.foto_fina') ? [['estrela', 'Estrela'], ['escudo', 'Escudo']] as const : [])] as const).map(([f2, nome]) => (
                <button key={f2} type="button" role="radio" data-teste={`forma-${f2}`}
                  aria-checked={(estilo.ajustes?.forma ?? 'circulo') === f2}
                  className={`avst-ft-chip ${(estilo.ajustes?.forma ?? 'circulo') === f2 ? 'avst-ft-chip-ativo' : ''}`}
                  onClick={() => mudarAjuste('forma', f2)}>{nome}</button>
              ))}
            </div>
            {/* mega 114 (§333): filtro de cor */}
            <div className="avst-ft-chips" role="radiogroup" aria-label="Filtro de cor" data-teste="filtros-cor">
              {([['nenhum', 'Sem filtro'], ['pb', 'P&B'], ['sepia', 'Sépia']] as const).map(([f3, nome]) => (
                <button key={f3} type="button" role="radio"
                  aria-checked={(estilo.ajustes?.filtroCor ?? 'nenhum') === f3}
                  className={`avst-ft-chip ${(estilo.ajustes?.filtroCor ?? 'nenhum') === f3 ? 'avst-ft-chip-ativo' : ''}`}
                  onClick={() => mudarAjuste('filtroCor', f3)}>{nome}</button>
              ))}
            </div>
            {/* mega 115 (§344): legenda livre (sanitizada aqui e no PHP) */}
            <label className="avst-ft-ajuste avst-ft-legenda">
              <span>Legenda</span>
              <input type="text" maxLength={40} value={estilo.legenda ?? ''}
                placeholder="Um toque seu na foto…" data-teste="legenda-foto"
                onChange={(e) => setEstilo((es) => {
                  const v = e.target.value;
                  if (!v.trim()) { const { legenda: _l, ...resto } = es; return resto as EstiloFoto; }
                  return { ...es, legenda: v };
                })} />
            </label>
          </div>

          {/* lote 161–165 (§338/§339/§342/§334): PAINEL DE CAMADAS + luz local */}
          {camadasAtivasFoto.length > 0 && (
            <div className="avst-ft-grupo" data-teste="camadas-foto">
              <span className="avst-ft-rotulo"><Layers size={11} aria-hidden /> Camadas da composição</span>
              {camadasAtivasFoto.map((cat) => {
                const c = estilo.camadasFoto?.[cat];
                return (
                  <div key={cat} className="avst-ft-camada" data-teste={`cf-${cat}`}>
                    <button type="button" className="avst-ft-chip avst-ft-olho" aria-pressed={!c?.oculta}
                      title={c?.oculta ? 'Mostrar camada' : 'Ocultar camada (não destrutivo — §338)'}
                      data-teste={`cf-olho-${cat}`} disabled={flag('as6.foto_camadas') && c?.travada}
                      onClick={() => mudarCamadaFoto(cat, { oculta: !c?.oculta })}>
                      {c?.oculta ? '◌' : '●'}
                    </button>
                    <span className="avst-ft-camada-nome">{NOMES_CAMADA_FOTO[cat]}</span>
                    {/* lote 981-990 (§1215, as6.foto_camadas): a pilha de
                        fundo reordena; ▲ sobe na pilha (desenha depois) */}
                    {flag('as6.foto_camadas') && (cat === 'fundo' || cat === 'banner' || cat === 'aura') && (() => {
                      const ordem = estilo.ordemFundo ?? ['fundo', 'banner', 'aura'];
                      const i = ordem.indexOf(cat);
                      return (
                        <span className="avst6-fc-ordem">
                          <button type="button" className="avst-ft-chip" data-teste={`cf-sobe-${cat}`}
                            title="Subir na pilha (§1215)" disabled={i >= ordem.length - 1 || c?.travada}
                            onClick={() => mudarOrdemFundo(cat, 1)}>▲</button>
                          <button type="button" className="avst-ft-chip" data-teste={`cf-desce-${cat}`}
                            title="Descer na pilha (§1215)" disabled={i <= 0 || c?.travada}
                            onClick={() => mudarOrdemFundo(cat, -1)}>▼</button>
                        </span>
                      );
                    })()}
                    <input type="range" min={0.2} max={1} step={0.05} value={c?.opacidade ?? 1}
                      aria-label={`Opacidade de ${NOMES_CAMADA_FOTO[cat]}`} data-teste={`cf-op-${cat}`}
                      disabled={flag('as6.foto_camadas') && c?.travada}
                      onChange={(ev) => mudarCamadaFoto(cat, { opacidade: Number(ev.target.value) })} />
                    <select className="avst-ft-select" value={c?.blend ?? 'normal'} data-teste={`cf-blend-${cat}`}
                      aria-label={`Blend de ${NOMES_CAMADA_FOTO[cat]} (§342)`}
                      disabled={flag('as6.foto_camadas') && c?.travada}
                      onChange={(ev) => mudarCamadaFoto(cat, { blend: ev.target.value as BlendFoto })}>
                      {(Object.keys(NOMES_BLEND) as BlendFoto[]).map((b) => (
                        <option key={b} value={b}>{NOMES_BLEND[b]}</option>
                      ))}
                    </select>
                    {cat === 'efeito' && (
                      <button type="button" className="avst-ft-chip" data-teste="cf-plano-efeito"
                        title="§339: trocar o plano do efeito (atrás ⇄ frente)"
                        disabled={flag('as6.foto_camadas') && c?.travada}
                        onClick={() => mudarCamadaFoto('efeito', { plano: c?.plano === 'frente' ? 'atras' : 'frente' })}>
                        {c?.plano === 'frente' ? 'Frente' : c?.plano === 'atras' ? 'Atrás' : 'Plano auto'}
                      </button>
                    )}
                    {/* lote 981-990 (as6.foto_camadas): LOCK §1217 + SOLO §1219 */}
                    {flag('as6.foto_camadas') && (<>
                      <button type="button" className="avst-ft-chip" data-teste={`cf-lock-${cat}`}
                        aria-pressed={!!c?.travada}
                        title={c?.travada ? 'Destravar camada (§1217)' : 'Travar camada — evita mudança acidental (§1217)'}
                        onClick={() => mudarCamadaFoto(cat, { travada: !c?.travada })}>
                        {c?.travada ? '🔒' : '🔓'}
                      </button>
                      <button type="button" className="avst-ft-chip" data-teste={`cf-solo-${cat}`}
                        aria-pressed={soloCamada === cat}
                        title="Solo — só esta camada no preview (§1219; nada persiste)"
                        onClick={() => setSoloCamada((v) => (v === cat ? null : cat))}>
                        S
                      </button>
                    </>)}
                  </div>
                );
              })}
              <div className="avst-ft-camada" data-teste="luz-local">
                <Lightbulb size={12} aria-hidden />
                {([['nenhuma', 'Sem luz'], ['radial', 'Radial'], ['linear', 'Linear']] as const).map(([t2, nome]) => (
                  <button key={t2} type="button" role="radio"
                    aria-checked={t2 === 'nenhuma' ? !estilo.luzLocal : estilo.luzLocal?.tipo === t2}
                    className={`avst-ft-chip ${(t2 === 'nenhuma' ? !estilo.luzLocal : estilo.luzLocal?.tipo === t2) ? 'avst-ft-chip-ativo' : ''}`}
                    onClick={() => mudarLuz(t2 === 'nenhuma' ? null : t2)}>{nome}</button>
                ))}
                <input type="range" min={-1} max={1} step={0.05} value={estilo.luzLocal?.intensidade ?? 0}
                  disabled={!estilo.luzLocal} aria-label="Intensidade da luz local (§334)" data-teste="luz-intensidade"
                  onChange={(ev) => mudarLuz(estilo.luzLocal?.tipo ?? 'radial', Number(ev.target.value))} />
              </div>
            </div>
          )}

          {/* lote 166 (§343): TIPOGRAFIA controlada da legenda/subtítulo */}
          {(estilo.legenda || estilo.subtitulo) && (
            <div className="avst-ft-grupo" data-teste="tipografia-foto">
              <span className="avst-ft-rotulo">Aa Tipografia</span>
              <div className="avst-ft-chips">
                {([['sistema', 'Sistema'], ['mono', 'Mono'], ['serif', 'Serif']] as const).map(([f2, nome]) => (
                  <button key={f2} type="button" role="radio" aria-checked={(estilo.tipografia?.fonte ?? 'sistema') === f2}
                    className={`avst-ft-chip ${(estilo.tipografia?.fonte ?? 'sistema') === f2 ? 'avst-ft-chip-ativo' : ''}`}
                    data-teste={`tf-fonte-${f2}`}
                    onClick={() => mudarTipografia({ fonte: f2 })}>{nome}</button>
                ))}
                {([[400, 'Leve'], [600, 'Média'], [800, 'Forte']] as const).map(([w, nome]) => (
                  <button key={w} type="button" role="radio" aria-checked={(estilo.tipografia?.peso ?? 600) === w}
                    className={`avst-ft-chip ${(estilo.tipografia?.peso ?? 600) === w ? 'avst-ft-chip-ativo' : ''}`}
                    onClick={() => mudarTipografia({ peso: w })}>{nome}</button>
                ))}
              </div>
              <div className="avst-ft-chips">
                {(['p', 'm', 'g'] as const).map((t3) => (
                  <button key={t3} type="button" role="radio" aria-checked={(estilo.tipografia?.tamanho ?? 'm') === t3}
                    className={`avst-ft-chip ${(estilo.tipografia?.tamanho ?? 'm') === t3 ? 'avst-ft-chip-ativo' : ''}`}
                    data-teste={`tf-tam-${t3}`}
                    onClick={() => mudarTipografia({ tamanho: t3 })}>{t3.toUpperCase()}</button>
                ))}
                {CORES_TEXTO_FOTO.map((cor) => (
                  <button key={cor} type="button"
                    className={`avst-ft-cor ${(estilo.tipografia?.cor ?? CORES_TEXTO_FOTO[0]) === cor ? 'avst-ft-cor-ativa' : ''}`}
                    style={{ background: cor }} aria-label={`Cor do texto ${cor}`} title={cor}
                    onClick={() => mudarTipografia({ cor })} />
                ))}
                <button type="button" className="avst-ft-chip" aria-pressed={!!estilo.tipografia?.contorno}
                  data-teste="tf-contorno" title="Contorno escuro p/ legibilidade sobre qualquer fundo"
                  onClick={() => mudarTipografia({ contorno: !estilo.tipografia?.contorno })}>Contorno</button>
                <button type="button" className="avst-ft-chip" aria-pressed={!!estilo.tipografia?.caixaAlta}
                  data-teste="tf-caixa"
                  onClick={() => mudarTipografia({ caixaAlta: !estilo.tipografia?.caixaAlta })}>CAIXA ALTA</button>
              </div>
            </div>
          )}

          {/* lote 168 (§349): DICAS de composição — determinísticas */}
          {dicas.length > 0 && (
            <div className="avst-ft-grupo" data-teste="dicas-foto">
              <span className="avst-ft-rotulo"><Sparkles size={11} aria-hidden /> Dicas de composição</span>
              {dicas.map((d) => (
                <div key={d.id} className="avst-ft-dica">
                  <p>{d.texto}</p>
                  <button type="button" className="avst-ft-chip" data-teste="dica-aplicar"
                    onClick={() => aplicarDica(d)}>Aplicar</button>
                </div>
              ))}
            </div>
          )}

          {/* mega 56 (§360): histórico visível do estilo */}
          <div className="avst-ft-grupo" data-teste="historico-estilo">
            <span className="avst-ft-rotulo">Histórico · {refPassado.current.length} passo(s)</span>
            <div className="avst-ft-chips">
              <button type="button" className="avst-ft-chip" disabled={refPassado.current.length === 0}
                data-teste="ft-desfazer" onClick={desfazerEstilo}>
                <Undo2 size={11} aria-hidden /> Desfazer</button>
              <button type="button" className="avst-ft-chip" disabled={refFuturo.current.length === 0}
                data-teste="ft-refazer" onClick={refazerEstilo}>
                <Redo2 size={11} aria-hidden /> Refazer</button>
              {/* mega 251 (§361): histórico VISUAL — thumbs clicáveis */}
              <button type="button" className="avst-ft-chip" aria-pressed={histVisual}
                disabled={refPassado.current.length === 0 && !histVisual}
                data-teste="hist-visual-toggle" title="Ver os passos como miniaturas (§361)"
                onClick={() => setHistVisual((v) => !v)}>Ver passos</button>
            </div>
            {histVisual && fotoEstilo && (
              <div className="avst-ft-histvisual" data-teste="hist-visual" role="list"
                aria-label="Passos do histórico (§361)">
                {refPassado.current.slice(-6).map((passo, i, arr) => {
                  const idx = refPassado.current.length - arr.length + i;
                  return (
                    <button key={idx} type="button" role="listitem" className="avst-ft-histpasso"
                      title={`Voltar ao passo ${idx + 1} (§361)`} data-teste={`hist-passo-${idx}`}
                      onClick={() => saltarParaPasso(idx)}
                      dangerouslySetInnerHTML={{ __html: svgFotoDe(fotoEstilo, passo, { estatico: true, uid: `hv${idx}`, tamanho: 44 }) }} />
                  );
                })}
                <span className="avst-ft-histpasso avst-ft-histpasso-atual" aria-current="step"
                  title="Estado atual"
                  dangerouslySetInnerHTML={{ __html: svgFotoDe(fotoEstilo, estilo, { estatico: true, uid: 'hvatual', tamanho: 44 }) }} />
              </div>
            )}
          </div>
          </div>
          <div className="avst-ftp-centrob">

          <div className="avst-foto-acoes">
            <button type="button" className="avst-botao" disabled={salvando}
              onClick={() => { setFotoEstilo(null); setEstilo(ESTILO_VAZIO); zerarHistorico(); }}>
              <X size={14} aria-hidden /> Cancelar
            </button>
            {/* §368: download local em escala — não passa pelo servidor.
                §325: wide tem dimensão fixa do formato (escala oculta) */}
            {formato === 'perfil' && (
              <label className="avst-ft-escala" title="Resolução do PNG exportado">
                <select value={escala} aria-label="Escala de exportação"
                  onChange={(e) => setEscala(Number(e.target.value) as 1 | 2 | 4)}>
                  <option value={1}>480px</option>
                  <option value={2}>960px</option>
                  <option value={4}>1920px</option>
                </select>
              </label>
            )}
            {/* megas 544-545 (§370, flag as5.foto_pro2): validação visível
                ANTES de exportar — resolução/proporção/transparência */}
            {flag('as5.foto_pro2') && (
              <span className="avst-ft-tpl-n" data-teste="export-specs" role="status">
                {formato === 'perfil'
                  ? `${LADO_SAIDA * escala}×${LADO_SAIDA * escala}px · 1:1 · fundo opaco`
                  : `${FORMATOS_FOTO[formato].saida[0]}×${FORMATOS_FOTO[formato].saida[1]}px · ${wideTransp ? 'FUNDO TRANSPARENTE' : 'fundo opaco'}`}
              </span>
            )}
            <button type="button" className="avst-botao" disabled={salvando}
              title="Baixar o PNG desta composição no seu computador"
              onClick={() => void baixarPng()}>
              <Download size={14} aria-hidden /> {t('Baixar PNG')}
            </button>
            {/* mega 314 (§369, flag as5.foto_fina): JPEG 0.9 p/ e-mail/docs */}
            {flag('as5.foto_fina') && (
              <button type="button" className="avst-botao" disabled={salvando}
                title="Baixar em JPEG (qualidade 0,9 — arquivos menores, §369)" data-teste="baixar-jpeg"
                onClick={() => void baixarPng('jpeg')}>
                <Download size={14} aria-hidden /> JPEG
              </button>
            )}
            <button type="button" className="avst-botao" disabled={salvando}
              title="Baixar o VETOR (.svg) desta composição (§369)" data-teste="baixar-svg"
              onClick={baixarSvg}>
              <Download size={14} aria-hidden /> SVG
            </button>
            {typeof ClipboardItem !== 'undefined' && (
              <button type="button" className="avst-botao" disabled={salvando}
                title="Copiar o PNG p/ a área de transferência (§373)" data-teste="copiar-png"
                onClick={() => void copiarPng()}>
                <Share2 size={14} aria-hidden /> Copiar
              </button>
            )}
            <button type="button" className="avst-botao" disabled={salvando || exportandoLote}
              title="Baixar TODOS os formatos de uma vez (§371)" data-teste="exportar-lote"
              onClick={() => void exportarLote()}>
              {exportandoLote ? <LoaderCircle className="avst-girando" size={14} aria-hidden /> : <Layers size={14} aria-hidden />}
              {exportandoLote ? ' Exportando…' : ' Todos os formatos'}
            </button>
            <button type="button" className="avst-botao" disabled={salvando || validando}
              title="Conferir dimensões e peso antes de exportar (§370)" data-teste="validar-foto"
              onClick={() => void validarExport()}>
              <BadgeCheck size={14} aria-hidden /> Validar
            </button>
            <button type="button" className="avst-botao" disabled={salvando}
              title="Guardar este trabalho como projeto (reabra depois — §364)" data-teste="guardar-projeto"
              onClick={() => void guardarProjeto()}>
              <BookmarkPlus size={14} aria-hidden /> Projeto
            </button>
            {podeCompartilhar() && (
              <button type="button" className="avst-botao" disabled={salvando}
                title="Compartilhar (sistema, área de transferência ou download)"
                data-teste="compartilhar-foto"
                onClick={() => void compartilharFoto()}>
                <Share2 size={14} aria-hidden /> Compartilhar
              </button>
            )}
            <button type="button" className="avst-botao avst-botao-primario"
              onClick={() => void salvarEstilizada()} disabled={salvando}>
              {salvando ? <LoaderCircle className="avst-girando" size={14} aria-hidden /> : <Wand2 size={14} aria-hidden />}
              {salvando ? ' Compondo…' : ' Salvar foto estilizada'}
            </button>
          </div>
          </div>
        </div>
      )}

      {mensagem && <p className="avst-foto-msg" role="status">{mensagem}</p>}

      {/* §557: galeria ainda carregando → skeleton (4 quadrados) */}
      {galeria === null && (
        <div className="avst-foto-galeria" role="status" aria-label="Carregando suas fotos"
          data-teste="esqueleto-galeria">
          <h4 className="avst-cores-titulo"><Images size={14} aria-hidden /> Suas fotos</h4>
          <div className="avst-foto-grade">
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} className="avst-esqueleto" style={{ aspectRatio: '1', width: '100%' }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Suas fotos (guardadas no servidor, 1 clique p/ reativar) ── */}
      {galeria && galeria.length > 0 && (
        <div className="avst-foto-galeria">
          <h4 className="avst-cores-titulo"><Images size={14} aria-hidden /> Suas fotos</h4>
          <div className="avst-foto-grade" role="list" aria-label="Fotos guardadas">
            {galeria.map((f) => (
              <div key={f.id} role="listitem" className="avst-foto-item">
                <button type="button" className="avst-foto-item-img"
                  title="Usar esta foto de novo" disabled={salvando}
                  onClick={() => void reativar(f)}>
                  <img src={f.url} alt="Foto guardada" loading="lazy" />
                  <span className="avst-foto-item-usar"><RotateCcw size={13} aria-hidden /></span>
                </button>
                <button type="button" className="avst-foto-item-estilo"
                  title="Estilizar esta foto (fundo, moldura, título…)" disabled={salvando}
                  onClick={() => void estilizarGuardada(f)}>
                  <Wand2 size={12} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
