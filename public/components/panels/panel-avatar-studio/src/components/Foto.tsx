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
  Aperture, Camera, Check, Crown, Download, ImageUp, Images, LoaderCircle,
  RotateCcw, Video, Wand2, X,
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
  const [estilo, setEstilo] = useState<EstiloFoto>(ESTILO_VAZIO);
  // §325: formato de saída — 'perfil' vai ao servidor; wide sai por download
  const [formato, setFormato] = useState<FormatoFotoId>('perfil');
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
    setEstilo({ camadas, cores: { destaque: tpl.estilo.cores.destaque }, ...(titulo ? { titulo } : {}) });
    setMensagem(pulados
      ? `Template "${tpl.nome}" aplicado — ${pulados} item(ns) ainda bloqueado(s) ficaram de fora.`
      : `Template "${tpl.nome}" aplicado.`);
    telemetria('foto_template', { id: tpl.id, pulados });
  }, [desbloqueados]);

  // §368: exportação local em escala (1×/2×/4× do PNG 480)
  // §325: formatos wide exportam nas dimensões NATIVAS do formato
  const [escala, setEscala] = useState<1 | 2 | 4>(1);
  const baixarPng = useCallback(async () => {
    if (!fotoEstilo) return;
    setMensagem(null);
    try {
      const wide = formato !== 'perfil';
      const [lw, lh] = wide ? FORMATOS_FOTO[formato].saida : [LADO_SAIDA * escala, LADO_SAIDA * escala];
      const svg = svgFotoDe(fotoEstilo, estilo, {
        estatico: true, uid: 'ftexp', ...(wide ? { formato } : { tamanho: lw }),
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
  }, [fotoEstilo, estilo, escala, formato]);

  /** Entra no modo ESTILIZADA a partir de uma foto guardada. */
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
    () => (fotoEstilo ? svgFotoDe(fotoEstilo, estilo, { uid: 'ftprev', formato }) : ''),
    [fotoEstilo, estilo, formato]
  );

  const mudarCamada = (cat: (typeof CATEGORIAS_FOTO)[number], id: string | null) => {
    setEstilo((e) => {
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
                onClick={() => { setEstilo(ESTILO_VAZIO); limparEstiloSalvo(); setMensagem(null); }}>
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
                onClick={() => setEstilo((e) => { const { titulo: _t, ...resto } = e; return resto as EstiloFoto; })}>
                Nenhum
              </button>
              {TITULOS.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={estilo.titulo === t.id}
                  className={`avst-ft-chip ${estilo.titulo === t.id ? 'avst-ft-chip-ativo' : ''}`}
                  style={{ '--avst-rar': RARIDADES[t.raridade].cor } as React.CSSProperties}
                  title={`${t.nome} · ${RARIDADES[t.raridade].nome}`}
                  onClick={() => setEstilo((e) => ({ ...e, titulo: t.id }))}>
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
                  onClick={() => setEstilo((e) => ({ ...e, cores: { destaque: cor } }))} />
              ))}
            </div>
          </div>

          <div className="avst-foto-acoes">
            <button type="button" className="avst-botao" disabled={salvando}
              onClick={() => { setFotoEstilo(null); setEstilo(ESTILO_VAZIO); }}>
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
            <button type="button" className="avst-botao avst-botao-primario"
              onClick={() => void salvarEstilizada()} disabled={salvando}>
              {salvando ? <LoaderCircle className="avst-girando" size={14} aria-hidden /> : <Wand2 size={14} aria-hidden />}
              {salvando ? ' Compondo…' : ' Salvar foto estilizada'}
            </button>
          </div>
        </div>
      )}

      {mensagem && <p className="avst-foto-msg" role="status">{mensagem}</p>}

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
