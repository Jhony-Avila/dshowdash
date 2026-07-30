// components/PalcoCinema.tsx — palco cinematográfico do Avatar Studio (AS3 F1).
// @version 1.0.0  @created 2026-07-29
//
// Dá VIDA ao personagem: respiração, piscada, olhos que seguem o cursor,
// inclinação sutil, parallax em 3 planos, iluminação (vinheta + luz + glow
// na cor de destaque + sombra de contato), zoom contextual por categoria e
// celebração ao equipar itens lendário+. Tudo via Web Animations API/CSS
// (critério nº 2: só transform/opacity/filter; pausa fora de vista/aba;
// prefers-reduced-motion desliga o movimento — critério nº 4).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Hand, PartyPopper, RotateCcw, User, UserRound, Zap, ZoomIn, ZoomOut } from 'lucide-react';
import type { AvatarConfig, CategoriaId, Raridade } from '../domain/types';
import { RARIDADES, svgDe } from '../services/AvatarCatalog';
import { tocarCelebracao, tocarEquipar } from '../services/Som';
import { telemetria } from '../services/Telemetria';

export interface Celebracao { raridade: Raridade; chave: number }

type Enquadramento = 'busto' | 'corpo';
const CHAVE_ENQ = 'dshow.avatar.palco.enq.v1';

/** Enquadramento automático por categoria (AS3 §5.3 — zoom contextual). */
const CAMERA_BUSTO: Partial<Record<CategoriaId, { escala: number; origem: string }>> = {
  base:      { escala: 1.5,  origem: '50% 42%' },
  olhos:     { escala: 1.62, origem: '50% 42%' },
  boca:      { escala: 1.62, origem: '50% 50%' },
  cabelo:    { escala: 1.45, origem: '50% 26%' },
  acessorio: { escala: 1.42, origem: '50% 36%' },
  roupa:     { escala: 1.4,  origem: '50% 80%' },
};
const CAMERA_CORPO: Partial<Record<CategoriaId, { escala: number; origem: string }>> = {
  base:      { escala: 2.1, origem: '50% 10%' },
  olhos:     { escala: 2.2, origem: '50% 10%' },
  boca:      { escala: 2.2, origem: '50% 14%' },
  cabelo:    { escala: 2.0, origem: '50% 4%' },
  acessorio: { escala: 1.9, origem: '50% 8%' },
  roupa:     { escala: 1.5, origem: '50% 44%' },
};

/** Rótulo do foco da câmera (AS4 §39.12 — orientação do zoom contextual). */
const ROTULO_FOCO: Partial<Record<CategoriaId, string>> = {
  base: 'Rosto', olhos: 'Olhos', boca: 'Boca',
  cabelo: 'Cabelo', acessorio: 'Acessório', roupa: 'Roupa',
};

/** Coreografias das PERFORMANCES (AS3 F2a — pedido do Jhony). */
type PerformanceId = 'acenar' | 'pose' | 'comemorar';

const reduzMovimento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function PalcoCinema({ config, categoria, celebracao, aoFimCelebracao }: {
  config: AvatarConfig;
  /** categoria ativa (zoom contextual) — null = quadro inteiro */
  categoria: CategoriaId | null;
  celebracao: Celebracao | null;
  aoFimCelebracao: () => void;
}) {
  const [enquadramento, setEnquadramento] = useState<Enquadramento>(() => {
    try { return localStorage.getItem(CHAVE_ENQ) === 'busto' ? 'busto' : 'corpo'; }
    catch { return 'corpo'; }
  });
  const svg = useMemo(
    () => svgDe(config, { palco: true, uid: 'cine', enquadramento }),
    [config, enquadramento],
  );
  const palcoRef = useRef<HTMLDivElement>(null);
  const svgHostRef = useRef<HTMLDivElement>(null);
  const animacoes = useRef<Animation[]>([]);
  const alvo = useRef({ x: 0, y: 0 });     // cursor normalizado (-1..1)
  const suave = useRef({ x: 0, y: 0 });    // posição interpolada
  const [zoomManual, setZoomManual] = useState(1);
  const [performando, setPerformando] = useState(false);
  const [festa, setFesta] = useState<Celebracao | null>(null);
  const primeiraPintura = useRef(true);

  const trocarEnquadramento = useCallback(() => {
    setEnquadramento((e) => {
      const novo = e === 'corpo' ? 'busto' : 'corpo';
      try { localStorage.setItem(CHAVE_ENQ, novo); } catch { /* sem storage */ }
      telemetria('enquadramento', { modo: novo });
      return novo;
    });
    setZoomManual(1);
  }, []);

  // ── Performances (AS3 F2a): coreografias nos braços/personagem ─────
  const performar = useCallback((id: PerformanceId) => {
    if (performando || reduzMovimento()) return;
    const q = (nome: string): SVGGElement | null =>
      svgHostRef.current?.querySelector(`[data-anim="${nome}"]`) ?? null;
    const personagem = q('personagem');
    const bracoEsq = q('braco-esq');
    const bracoDir = q('braco-dir');
    if (!personagem) return;
    setPerformando(true);
    telemetria('performance', { id });
    const fim = () => setPerformando(false);

    if (id === 'acenar' && bracoEsq) {
      tocarEquipar(2);
      bracoEsq.animate(
        [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(-135deg)', offset: 0.25 },
          { transform: 'rotate(-110deg)', offset: 0.45 },
          { transform: 'rotate(-140deg)', offset: 0.65 },
          { transform: 'rotate(-110deg)', offset: 0.82 },
          { transform: 'rotate(0deg)' },
        ],
        { duration: 1500, easing: 'ease-in-out' },
      ).finished.then(fim, fim);
    } else if (id === 'pose' && bracoEsq && bracoDir) {
      tocarEquipar(4);
      bracoEsq.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-52deg)', offset: 0.3 }, { transform: 'rotate(-52deg)', offset: 0.75 }, { transform: 'rotate(0deg)' }],
        { duration: 1400, easing: 'ease-in-out' },
      );
      bracoDir.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(52deg)', offset: 0.3 }, { transform: 'rotate(52deg)', offset: 0.75 }, { transform: 'rotate(0deg)' }],
        { duration: 1400, easing: 'ease-in-out' },
      );
      personagem.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.05)', offset: 0.35 }, { transform: 'scale(1.05)', offset: 0.7 }, { transform: 'scale(1)' }],
        { duration: 1400, easing: 'ease-in-out', composite: 'add' },
      ).finished.then(fim, fim);
    } else if (id === 'comemorar') {
      tocarCelebracao('lendario');
      setFesta({ raridade: 'lendario', chave: Date.now() });
      bracoEsq?.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-150deg)', offset: 0.3 }, { transform: 'rotate(-150deg)', offset: 0.75 }, { transform: 'rotate(0deg)' }],
        { duration: 1600, easing: 'ease-in-out' },
      );
      bracoDir?.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(150deg)', offset: 0.3 }, { transform: 'rotate(150deg)', offset: 0.75 }, { transform: 'rotate(0deg)' }],
        { duration: 1600, easing: 'ease-in-out' },
      );
      personagem.animate(
        [
          { transform: 'translateY(0px)' },
          { transform: 'translateY(-12px)', offset: 0.25 },
          { transform: 'translateY(0px)', offset: 0.45 },
          { transform: 'translateY(-9px)', offset: 0.65 },
          { transform: 'translateY(0px)' },
        ],
        { duration: 1600, easing: 'ease-in-out', composite: 'add' },
      ).finished.then(fim, fim);
    } else {
      fim();
    }
  }, [performando]);

  const buscar = useCallback((nome: string): SVGGElement | null =>
    svgHostRef.current?.querySelector(`[data-anim="${nome}"]`) ?? null, []);

  // ── Vida (idle) — recriada a cada troca de visual ──────────────────
  useEffect(() => {
    if (reduzMovimento()) return;
    const anims: Animation[] = [];
    const cronometros: number[] = [];

    const personagem = buscar('personagem');
    if (personagem) {
      personagem.style.transformBox = 'view-box';
      personagem.style.transformOrigin = enquadramento === 'corpo' ? '120px 250px' : '120px 170px';
      anims.push(personagem.animate(
        [
          { transform: 'translateY(0px) rotate(-0.5deg) scale(1)' },
          { transform: 'translateY(-1.8px) rotate(0.5deg) scale(1.006)' },
        ],
        { duration: 4200, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' },
      ));
      // pop sutil na troca de item (nunca repaint seco — critério nº 1)
      if (!primeiraPintura.current) {
        personagem.animate(
          [
            { transform: 'scale(0.985)' },
            { transform: 'scale(1.012)', offset: 0.55 },
            { transform: 'scale(1)' },
          ],
          { duration: 260, easing: 'ease-out', composite: 'add' },
        );
      }
    }

    const cabelo = buscar('cabelo');
    if (cabelo && cabelo.childNodes.length > 0) {
      cabelo.style.transformBox = 'view-box';
      cabelo.style.transformOrigin = '120px 64px';
      anims.push(cabelo.animate(
        [{ transform: 'rotate(-0.7deg)' }, { transform: 'rotate(0.7deg)' }],
        { duration: 3400, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' },
      ));
    }

    // piscada natural (2,8s–7s) — pálpebras sintéticas do motor
    const palpebras = buscar('palpebras');
    const piscar = () => {
      palpebras?.animate(
        [
          { opacity: 0 },
          { opacity: 1, offset: 0.4 },
          { opacity: 1, offset: 0.62 },
          { opacity: 0 },
        ],
        { duration: 170, easing: 'ease-in-out' },
      );
      cronometros.push(window.setTimeout(piscar, 2800 + Math.random() * 4200));
    };
    if (palpebras) cronometros.push(window.setTimeout(piscar, 1200 + Math.random() * 2000));

    animacoes.current = anims;
    primeiraPintura.current = false;
    return () => {
      anims.forEach((a) => a.cancel());
      cronometros.forEach((t) => window.clearTimeout(t));
      animacoes.current = [];
    };
  }, [svg, buscar, enquadramento]);

  // ── Parallax + olhos seguindo o cursor (rAF com lerp) ──────────────
  useEffect(() => {
    if (reduzMovimento()) return;
    const palco = palcoRef.current;
    if (!palco) return;
    let vivo = true;
    let raf = 0;

    const aoMover = (e: PointerEvent) => {
      const r = palco.getBoundingClientRect();
      alvo.current = {
        x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
        y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)),
      };
    };
    const aoSair = () => { alvo.current = { x: 0, y: 0 }; };

    const passo = () => {
      if (!vivo) return;
      const s = suave.current;
      s.x += (alvo.current.x - s.x) * 0.07;
      s.y += (alvo.current.y - s.y) * 0.07;
      const fundo = buscar('plano-fundo');
      const pessoa = buscar('plano-personagem');
      const frente = buscar('plano-frente');
      const olhos = buscar('olhos');
      if (fundo) fundo.style.transform = `translate(${(-s.x * 6).toFixed(2)}px, ${(-s.y * 4).toFixed(2)}px)`;
      if (pessoa) pessoa.style.transform = `translate(${(s.x * 3).toFixed(2)}px, ${(s.y * 2).toFixed(2)}px)`;
      if (frente) frente.style.transform = `translate(${(s.x * 9).toFixed(2)}px, ${(s.y * 6).toFixed(2)}px)`;
      if (olhos) olhos.style.transform = `translate(${(s.x * 2).toFixed(2)}px, ${(s.y * 1.6).toFixed(2)}px)`;
      raf = window.requestAnimationFrame(passo);
    };

    palco.addEventListener('pointermove', aoMover);
    palco.addEventListener('pointerleave', aoSair);
    raf = window.requestAnimationFrame(passo);
    return () => {
      vivo = false;
      window.cancelAnimationFrame(raf);
      palco.removeEventListener('pointermove', aoMover);
      palco.removeEventListener('pointerleave', aoSair);
    };
  }, [svg, buscar]);

  // ── Pausa fora de vista / aba oculta (critério nº 2) ───────────────
  useEffect(() => {
    const pausar = (sim: boolean) =>
      animacoes.current.forEach((a) => (sim ? a.pause() : a.play()));
    const aoVisibilidade = () => pausar(document.hidden);
    document.addEventListener('visibilitychange', aoVisibilidade);
    let io: IntersectionObserver | undefined;
    if (palcoRef.current && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => pausar(!es[0]?.isIntersecting), { threshold: 0.05 });
      io.observe(palcoRef.current);
    }
    return () => {
      document.removeEventListener('visibilitychange', aoVisibilidade);
      io?.disconnect();
    };
  }, []);

  // ── Celebração (lendário/mítico/exclusivo) ─────────────────────────
  useEffect(() => {
    if (!celebracao) return;
    const t = window.setTimeout(aoFimCelebracao, 1200);
    return () => window.clearTimeout(t);
  }, [celebracao, aoFimCelebracao]);

  useEffect(() => {
    if (!festa) return;
    const t = window.setTimeout(() => setFesta(null), 1200);
    return () => window.clearTimeout(t);
  }, [festa]);

  // ── Câmera (zoom contextual × manual) ──────────────────────────────
  const mapaCamera = enquadramento === 'corpo' ? CAMERA_CORPO : CAMERA_BUSTO;
  const cam = (categoria && mapaCamera[categoria]) || { escala: 1, origem: '50% 50%' };
  const escala = Math.max(0.8, Math.min(2.8, cam.escala * zoomManual));
  const corGlow = config.cores.destaque;
  const celebraAtiva = celebracao ?? festa;
  const corCelebra = celebraAtiva ? RARIDADES[celebraAtiva.raridade].cor : '';

  return (
    <div ref={palcoRef} className={`avst-cine ${enquadramento === 'corpo' ? 'avst-cine-corpo' : ''}`}
      style={{ '--avst-glow': corGlow } as React.CSSProperties}>
      {/* iluminação de fundo do palco */}
      <span className="avst-cine-luz" aria-hidden />
      <span className="avst-cine-glow" aria-hidden />

      {/* nível de zoom + foco da câmera (AS4 §39.12/§39.13) */}
      <span className="avst-cine-zoom" role="status"
        title="Câmera do palco — ajuste com os botões abaixo">
        {categoria && ROTULO_FOCO[categoria] ? `${ROTULO_FOCO[categoria]} · ` : ''}{Math.round(escala * 100)}%
      </span>

      <div className="avst-cine-cam"
        style={{ transform: `scale(${escala})`, transformOrigin: cam.origem }}>
        <div ref={svgHostRef} className="avst-cine-svg"
          dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      {/* sombra de contato + vinheta por cima */}
      <span className="avst-cine-sombra" aria-hidden />
      <span className="avst-cine-vinheta" aria-hidden />

      {/* celebração (equipar lendário+ OU performance de comemorar) */}
      {celebraAtiva && (
        <div key={celebraAtiva.chave} className="avst-celebra" aria-hidden
          style={{ '--avst-celebra': corCelebra } as React.CSSProperties}>
          <span className="avst-celebra-flash" />
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className="avst-celebra-pt"
              style={{ '--pt-ang': `${(i * 360) / 14}deg`, '--pt-atraso': `${(i % 5) * 40}ms` } as React.CSSProperties} />
          ))}
        </div>
      )}

      {/* enquadramento + performances (AS3 F2a) */}
      <div className="avst-cine-acoes">
        <button type="button" title={enquadramento === 'corpo' ? 'Ver busto' : 'Ver corpo inteiro'}
          onClick={trocarEnquadramento}>
          {enquadramento === 'corpo' ? <UserRound size={14} aria-hidden /> : <User size={14} aria-hidden />}
        </button>
        {enquadramento === 'corpo' && !reduzMovimento() && (
          <>
            <button type="button" title="Acenar" disabled={performando} onClick={() => performar('acenar')}>
              <Hand size={14} aria-hidden />
            </button>
            <button type="button" title="Pose de poder" disabled={performando} onClick={() => performar('pose')}>
              <Zap size={14} aria-hidden />
            </button>
            <button type="button" title="Comemorar" disabled={performando} onClick={() => performar('comemorar')}>
              <PartyPopper size={14} aria-hidden />
            </button>
          </>
        )}
      </div>

      {/* controles de câmera */}
      <div className="avst-cine-controles">
        <button type="button" title="Aproximar" onClick={() => setZoomManual((z) => Math.min(1.8, z * 1.18))}>
          <ZoomIn size={14} aria-hidden />
        </button>
        <button type="button" title="Afastar" onClick={() => setZoomManual((z) => Math.max(0.7, z / 1.18))}>
          <ZoomOut size={14} aria-hidden />
        </button>
        <button type="button" title="Enquadrar" onClick={() => setZoomManual(1)}>
          <RotateCcw size={14} aria-hidden />
        </button>
      </div>
    </div>
  );
}
