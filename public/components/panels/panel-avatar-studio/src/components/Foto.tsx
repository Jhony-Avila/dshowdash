// components/Foto.tsx — foto de perfil: upload, CÂMERA e galeria (briefing §27).
// @version 1.1.0
// @changelog v1.1.0 (2026-07-29, pedido do Jhony) — captura pela câmera
//   (getUserMedia → frame → mesmo fluxo de recorte) e galeria "Suas fotos"
//   (todas as fotos ficam guardadas no servidor; um clique reativa).
// @created 2026-07-29
//
// Fluxo: arquivo OU câmera → recorte (arrastar + zoom) → canvas 480×480 →
// PNG data-url → salvarFoto(). O servidor re-encoda pixel a pixel (GD).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Aperture, Camera, Check, ImageUp, Images, LoaderCircle, RotateCcw, Video, X } from 'lucide-react';
import { carregarFotos, reativarVersao, salvarFoto } from '../services/AvatarService';
import type { FotoGuardada } from '../services/AvatarService';

const LADO_PALCO = 280;   // px na tela
const LADO_SAIDA = 480;   // px do PNG final

interface EstadoRecorte {
  img: HTMLImageElement;
  zoom: number;        // 1 = imagem cobre exatamente o palco
  x: number;           // deslocamento do centro (px de palco)
  y: number;
}

export function Foto({ versao, fotoAtiva, aoSalvar }: {
  versao: number;
  /** true quando o avatar ativo já é uma foto */
  fotoAtiva: boolean;
  aoSalvar: (novaVersao: number) => void;
}) {
  const [recorte, setRecorte] = useState<EstadoRecorte | null>(null);
  const [camera, setCamera] = useState<MediaStream | null>(null);
  const [galeria, setGaleria] = useState<FotoGuardada[] | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
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

  // ── Salvar / reativar ───────────────────────────────────────────────
  const usarFoto = useCallback(async () => {
    if (!recorte) return;
    setSalvando(true);
    setMensagem(null);
    const saida = document.createElement('canvas');
    saida.width = LADO_SAIDA;
    saida.height = LADO_SAIDA;
    const ctx = saida.getContext('2d');
    if (!ctx) { setSalvando(false); return; }
    ctx.imageSmoothingQuality = 'high';
    desenhar(ctx, recorte, LADO_SAIDA);
    const r = await salvarFoto(saida.toDataURL('image/png'), versao);
    setSalvando(false);
    if (r.ok) {
      setMensagem('Foto salva! O header já foi atualizado.');
      setRecorte(null);
      aoSalvar(r.versao ?? versao + 1);
    } else {
      setMensagem(r.mensagem ?? 'Não foi possível salvar a foto.');
    }
  }, [recorte, versao, desenhar, aoSalvar]);

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

      {!recorte && !camera && (
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
            <button type="button" className="avst-botao avst-botao-primario" onClick={() => void usarFoto()} disabled={salvando}>
              {salvando ? <LoaderCircle className="avst-girando" size={14} aria-hidden /> : <Check size={14} aria-hidden />}
              {salvando ? ' Enviando…' : ' Usar esta foto'}
            </button>
          </div>
        </>
      )}

      {mensagem && <p className="avst-foto-msg" role="status">{mensagem}</p>}

      {/* ── Suas fotos (guardadas no servidor, 1 clique p/ reativar) ── */}
      {galeria && galeria.length > 0 && (
        <div className="avst-foto-galeria">
          <h4 className="avst-cores-titulo"><Images size={14} aria-hidden /> Suas fotos</h4>
          <div className="avst-foto-grade" role="list" aria-label="Fotos guardadas">
            {galeria.map((f) => (
              <button key={f.id} type="button" role="listitem" className="avst-foto-item"
                title="Usar esta foto de novo" disabled={salvando}
                onClick={() => void reativar(f)}>
                <img src={f.url} alt="Foto guardada" loading="lazy" />
                <span className="avst-foto-item-usar"><RotateCcw size={13} aria-hidden /></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
