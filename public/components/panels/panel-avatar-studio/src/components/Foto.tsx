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
  Aperture, BadgeCheck, BookmarkPlus, Box, Camera, Check, Crown, Download, FolderOpen, ImageUp,
  Images, Layers, LoaderCircle, Redo2, RotateCcw, Share2, SlidersHorizontal, Trash2, Undo2,
  Video, Wand2, X,
} from 'lucide-react';
import { carregarFotos, reativarVersao, salvarFoto } from '../services/AvatarService';
import type { FotoGuardada } from '../services/AvatarService';
import type { EstiloFoto } from '../domain/types';
import {
  CATEGORIAS, CATEGORIAS_FOTO, CONFIG_PADRAO, CORES_SUGERIDAS, FORMATOS_FOTO,
  RARIDADES, TEMPLATES_FOTO, TITULOS, itemPorId, itensDe, svgFotoDe,
} from '../services/AvatarCatalog';
import type { FormatoFotoId, TemplateFoto } from '../services/AvatarCatalog';
import { telemetria } from '../services/Telemetria';
import { criarRenderizador } from '../services/FabricaRenderizador';
import { BASE_PERSONAGENS_3D, carregarIndice3d } from '../services/Personagens3d';
import type { EntradaIndice3d } from '../services/Personagens3d';
import { estadoVazio } from '../nucleo/contratos';
import { compartilharPng, podeCompartilhar } from '../services/Compartilhar';
import { excluirProjetoFoto, listarProjetosFoto, salvarProjetoFoto } from '../services/ProjetosFoto';
import type { ProjetoFoto } from '../services/ProjetosFoto';
import type { AjustesFoto } from '../domain/types';

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
async function rasterizarSvg(svg: string, largura: number = LADO_SAIDA, altura: number = largura): Promise<string> {
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
    ctx.drawImage(img, 0, 0, largura, altura);
    return canvas.toDataURL('image/png');
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

const ESTILO_VAZIO: EstiloFoto = { camadas: {}, cores: { destaque: CONFIG_PADRAO.cores.destaque } };

export function Foto({ versao, fotoAtiva, desbloqueados, aoSalvar }: {
  versao: number;
  /** true quando o avatar ativo já é uma foto */
  fotoAtiva: boolean;
  /** ids liberados por conquistas/eventos (mesma fonte da grade) */
  desbloqueados: Set<string>;
  aoSalvar: (novaVersao: number) => void;
}) {
  const [recorte, setRecorte] = useState<EstadoRecorte | null>(null);
  const [camera, setCamera] = useState<MediaStream | null>(null);
  const [galeria, setGaleria] = useState<FotoGuardada[] | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  // 4.6 §21 — modo estilizada: foto base (data-url 480) + parâmetros
  const [fotoEstilo, setFotoEstilo] = useState<string | null>(null);
  // mega 12 (§21×§174.1): TERCEIRA origem — captura do personagem 3D
  const [galeria3d, setGaleria3d] = useState<EntradaIndice3d[] | null>(null);
  const [capturando3d, setCapturando3d] = useState(false);
  // mega 47: captura 3D com fundo TRANSPARENTE (compõe limpa nos templates)
  const [transparente3d, setTransparente3d] = useState(false);
  const [estilo, setEstilo] = useState<EstiloFoto>(ESTILO_VAZIO);
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
  const NEUTROS: Required<Omit<AjustesFoto, 'espelhar' | 'sombra'>> = {
    brilho: 1, contraste: 1, saturacao: 1, temperatura: 0, vinheta: 0, rotacao: 0,
  };
  const mudarAjuste = useCallback((campo: keyof AjustesFoto, valor: number | boolean) => {
    setEstilo((e) => {
      const aj: AjustesFoto = { ...e.ajustes };
      const neutro = typeof valor === 'boolean'
        ? valor === false
        : valor === (NEUTROS as Record<string, number>)[campo];
      if (neutro) delete aj[campo];
      else (aj as Record<string, number | boolean>)[campo] = valor;
      if (Object.keys(aj).length === 0) { const { ajustes: _a, ...resto } = e; return resto as EstiloFoto; }
      return { ...e, ajustes: aj };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mega 57 (§364): PROJETOS do Photo Studio (localStorage v1)
  const [projetos, setProjetos] = useState<ProjetoFoto[]>(listarProjetosFoto);
  const guardarProjeto = useCallback(async () => {
    if (!fotoEstilo) return;
    const p = await salvarProjetoFoto(fotoEstilo, estilo, formato);
    setProjetos(listarProjetosFoto());
    setMensagem(p ? `Projeto "${p.nome}" guardado — reabra quando quiser.` : 'Limite de 6 projetos atingido.');
    if (p) telemetria('foto_projeto_salvou');
  }, [fotoEstilo, estilo, formato]);
  const abrirProjeto = useCallback((p: ProjetoFoto) => {
    setFotoEstilo(p.foto);
    setEstilo(p.estilo);
    setFormato(p.formato);
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
    img.onload = () => { setRecorte({ img, zoom: 1, x: 0, y: 0 }); fecharCamera(); };
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
      setRecorte({ img, zoom: 1, x: 0, y: 0 });
    };
    img.onerror = () => { setMensagem('Não consegui ler esta imagem.'); URL.revokeObjectURL(url); };
    img.src = url;
  }, [fecharCamera]);

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
    try {
      r = await criarRenderizador('3d', { resolverPersonagem: () => slug });
      await r.inicializar({ qualidade: 'alto', pixelRatioMax: 1 });
      await r.montar(palco as unknown as { innerHTML: string });
      const aplicado = await r.aplicarEstado(estadoVazio());
      if (!aplicado.ok) throw new Error('personagem indisponível');
      // mega 47: transparente §21×§325 — o template compõe sem fundo escuro
      const foto = await r.capturar({
        largura: 960, altura: 960, deterministica: true, transparente: transparente3d,
      });
      setFotoEstilo(foto.dataUri);
      setGaleria3d(null);
      const salvo = lerEstiloSalvo();
      if (salvo) setEstilo(salvo);
      telemetria('foto_estilo_abriu', { origem: '3d', personagem: slug, transparente: transparente3d });
    } catch {
      setMensagem('Não consegui capturar o personagem 3D — tente outro.');
    } finally {
      await r?.descartar().catch(() => { /* efêmero */ });
      palco.remove();
      setCapturando3d(false);
    }
  }, [transparente3d]);

  // §362: autosave do ESTILO enquanto o modo estilizada está aberto
  useEffect(() => {
    if (!fotoEstilo) return;
    const t = setTimeout(() => {
      if (Object.keys(estilo.camadas).length || estilo.titulo) gravarEstilo(estilo);
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
      if (item?.bloqueadoPor && !desbloqueados.has(id)) { pulados += 1; continue; }
      camadas[cat as keyof EstiloFoto['camadas']] = id;
    }
    let titulo = tpl.estilo.titulo;
    if (titulo && !TITULOS.some((x) => x.id === titulo)) { titulo = undefined; pulados += 1; }
    mudarEstilo((e) => ({ ...e, camadas, cores: { destaque: tpl.estilo.cores.destaque }, ...(titulo ? { titulo } : { titulo: undefined }) }));
    setMensagem(pulados
      ? `Template "${tpl.nome}" aplicado — ${pulados} item(ns) ainda bloqueado(s) ficaram de fora.`
      : `Template "${tpl.nome}" aplicado.`);
    telemetria('foto_template', { id: tpl.id, pulados });
  }, [desbloqueados, mudarEstilo]);

  // §368: exportação local em escala (1×/2×/4× do PNG 480)
  // §325: formatos wide exportam nas dimensões NATIVAS do formato
  const baixarPng = useCallback(async () => {
    if (!fotoEstilo) return;
    setMensagem(null);
    try {
      const wide = formato !== 'perfil';
      const [lw, lh] = wide ? FORMATOS_FOTO[formato].saida : [LADO_SAIDA * escala, LADO_SAIDA * escala];
      const svg = svgFotoDe(fotoEstilo, estilo, {
        estatico: true, uid: 'ftexp',
        ...(wide ? { formato, lado: ladoWide, semFundo: wideTransp } : { tamanho: lw }),
      });
      const png = await rasterizarSvg(svg, lw, lh);
      const a = document.createElement('a');
      a.href = png;
      a.download = wide ? `dshow-${formato}-${lw}x${lh}.png` : `dshow-foto-${lw}px.png`;
      a.click();
      telemetria('foto_exportou', { lado: lw, formato });
    } catch {
      setMensagem('Não consegui gerar o PNG para download — tente de novo.');
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
  const previewEstilo = useMemo(
    () => (fotoEstilo
      ? svgFotoDe(fotoEstilo, estilo, {
        uid: 'ftprev', formato,
        ...(formato !== 'perfil' ? { lado: ladoWide, semFundo: wideTransp } : {}),
      })
      : ''),
    [fotoEstilo, estilo, formato, ladoWide, wideTransp]
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
              <span className="avst-foto-nota"><LoaderCircle className="avst-girando" size={13} aria-hidden /> Capturando personagem…</span>
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

      {/* ── Modo FOTO ESTILIZADA (4.6 §21) ─────────────────────────── */}
      {fotoEstilo && (
        <div className="avst-foto-estilo">
          <div className="avst-ft-preview" data-formato={formato} aria-label="Prévia da foto estilizada"
            dangerouslySetInnerHTML={{ __html: previewEstilo }} />
          <p className="avst-foto-nota">
            Só assets de <strong>apresentação</strong> entram na foto — roupa e corpo ficam no avatar em camadas.
          </p>

          {/* §325: FORMATO de saída — perfil 1:1 + wide (header/banner/wallpaper) */}
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
              </div>
            )}
          </div>

          {/* §326/§327: templates prioritários — composição em 1 clique */}
          <div className="avst-ft-grupo">
            <span className="avst-ft-rotulo"><Wand2 size={11} aria-hidden /> Templates</span>
            <div className="avst-ft-templates" data-teste="templates-foto">
              {TEMPLATES_FOTO.map((tpl) => (
                <button key={tpl.id} type="button" className="avst-ft-template"
                  title={tpl.descricao}
                  onClick={() => aplicarTemplate(tpl)}>
                  <i style={{ background: tpl.estilo.cores.destaque }} aria-hidden />
                  <span>{tpl.nome}</span>
                  <small>{tpl.categoria}</small>
                </button>
              ))}
              <button type="button" className="avst-ft-template avst-ft-template-limpar"
                title="Remover tudo e começar do zero"
                onClick={() => { mudarEstilo(() => ESTILO_VAZIO); limparEstiloSalvo(); setMensagem(null); }}>
                <span>Limpar</span>
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
              <button type="button" className="avst-ft-chip" disabled={!estilo.ajustes}
                data-teste="ajuste-zerar"
                onClick={() => setEstilo((e) => { const { ajustes: _a, ...resto } = e; return resto as EstiloFoto; })}>
                Zerar ajustes</button>
            </div>
          </div>

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
            </div>
          </div>

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
            <button type="button" className="avst-botao" disabled={salvando}
              title="Baixar o PNG desta composição no seu computador"
              onClick={() => void baixarPng()}>
              <Download size={14} aria-hidden /> Baixar PNG
            </button>
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
