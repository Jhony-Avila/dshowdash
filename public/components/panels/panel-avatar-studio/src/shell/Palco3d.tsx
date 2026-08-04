// shell/Palco3d.tsx — PRÉVIA 3D no viewport do shell (AS5 · megas 7+9).
// @version 2.0.0  @created 2026-08-03  @updated 2026-08-03 (mega 9)
//
// Wrapper React fino do Renderizador3d (§401) via fábrica: o three só
// atravessa a rede quando o usuário LIGA o 3D (import dinâmico → motor3d).
// Mega 9: personagens vêm do ÍNDICE publicado (index.json derivado da
// publicação; fallback embutido), a BASE 2D escolhida decide o personagem
// (auto-mapeamento com OVERRIDE manual + chip "Auto"), e as ANIMAÇÕES
// REAIS do GLB viram seletor (Idle/Walk/Wave/Dance…). Pendências §481
// continuam honestas; flag as5.palco3d fail-safe OFF; erro nunca derruba
// o shell.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, BadgeCheck, Box, Camera, CircleDot, Clapperboard, Grid3x3, LayoutPanelTop, Lightbulb, Pause, PersonStanding, Play, Rotate3d, Share2, Sparkles, UserRound, Wand2 } from 'lucide-react';
import type { EstadoAvatar } from '../nucleo/contratos';
import type { EstadoCamera, RenderizadorAvatar } from '../nucleo/renderizador';
import { criarRenderizador } from '../services/FabricaRenderizador';
import { compartilharPng, podeCompartilhar } from '../services/Compartilhar';
import { telemetria } from '../services/Telemetria';
import { carregarIndice3d, personagemParaBase } from '../services/Personagens3d';
import { flag } from '../nucleo/flags';
import type { EntradaIndice3d } from '../services/Personagens3d';

/** Fallback embutido (índice indisponível — ex.: publicação parcial). */
const CURADOS_FALLBACK: EntradaIndice3d[] = [
  { slug: 'humano_casual', nome: 'Casual', thumb: '', animacoes: [] },
  { slug: 'humano_aventureiro', nome: 'Aventureiro', thumb: '', animacoes: [] },
  { slug: 'humano_terno', nome: 'Executivo', thumb: '', animacoes: [] },
  { slug: 'humano_punk', nome: 'Punk', thumb: '', animacoes: [] },
  { slug: 'androide', nome: 'Androide', thumb: '', animacoes: [] },
  { slug: 'animal_pug', nome: 'Pug', thumb: '', animacoes: [] },
];

/** Animações em destaque no seletor (ordem de preferência §174-friendly). */
const ANIMACOES_DESTAQUE = ['Idle', 'Walk', 'Walking', 'Running', 'Wave', 'Dance', 'Jump', 'Victory', 'ThumbsUp'];

const CHAVE_OVERRIDE = 'dshow.avst5.p3d.personagem.v1';

function overrideGuardado(): string | null {
  try { return localStorage.getItem(CHAVE_OVERRIDE); } catch { return null; }
}

export function Palco3d({ estado, movReduzido, sinalApresentar = 0, aoUsarComoAvatar }: {
  estado: EstadoAvatar;
  movReduzido: boolean;
  /** mega 10: incrementa a cada clique em Apresentar (o shell delega §174) */
  sinalApresentar?: number;
  /** mega 24: captura vira o AVATAR OFICIAL (pipeline salvarFoto do App) */
  aoUsarComoAvatar?: (png960: string) => Promise<boolean>;
}) {
  const refAlvo = useRef<HTMLDivElement>(null);
  const refR = useRef<RenderizadorAvatar | null>(null);
  // mega 9: override manual (null = AUTO — segue a base 2D do estado)
  const [override, setOverride] = useState<string | null>(overrideGuardado);
  const [indice, setIndice] = useState<EntradaIndice3d[]>(CURADOS_FALLBACK);
  const [fase, setFase] = useState<'carregando' | 'pronto' | 'indisponivel'>('carregando');
  const [pendencias, setPendencias] = useState(0);
  const [cameraModo, setCameraModo] = useState<EstadoCamera['modo']>('corpo');
  const [animacao, setAnimacao] = useState('Idle');
  // mega 10: SHOWCASE 3D (§174) — coreografia com clipes reais + órbita
  const [apresentando, setApresentando] = useState(false);
  // mega 16 (§528): tier efetivo anunciado pelo renderer adaptativo
  const [tierAtual, setTierAtual] = useState<'medio' | 'economico' | 'alto' | null>(null);
  // mega 18: anúncio p/ leitores de tela (aria-live)
  const [anuncio, setAnuncio] = useState('');
  // megas 21/22: fundo e luz do palco 3D
  const [fundo3d, setFundo3d] = useState<'neutro' | 'estudio' | 'grade'>('estudio');
  const [luz3d, setLuz3d] = useState<'estudio' | 'quente' | 'fria' | 'neon'>('estudio');
  // mega 26: marca d'água nas capturas/ficha
  const [marca, setMarca] = useState(true);
  // mega 29: pose congelada (freeze frame)
  const [congelado, setCongelado] = useState(false);
  // mega 24: feedback do salvar avatar
  const [salvandoAvatar, setSalvandoAvatar] = useState(false);
  // mega 28: HUD de performance (flag dev)
  const hudLigado = flag('as5.hud3d');
  const [hud, setHud] = useState<{ fps: number; tier: string; triangulos: number } | null>(null);
  const [sinalLocal, setSinalLocal] = useState(0);
  const sinalShowcase = sinalApresentar + sinalLocal;
  // mega 13 (§174.2): GRAVAÇÃO do showcase — MediaRecorder no canvas
  const [gravando, setGravando] = useState(false);
  const refGravador = useRef<MediaRecorder | null>(null);
  const podeGravar = typeof MediaRecorder !== 'undefined';

  const personagem = override ?? personagemParaBase(estado.body.base);
  const refPersonagem = useRef(personagem);
  refPersonagem.current = personagem;

  // índice publicado (derivado) — fallback embutido se indisponível
  useEffect(() => {
    let vivo = true;
    void carregarIndice3d().then((i) => { if (vivo && i) setIndice(i.personagens); });
    return () => { vivo = false; };
  }, []);

  // monta o renderer UMA vez; descarta ao sair do modo 3D
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await criarRenderizador('3d', {
          resolverPersonagem: () => refPersonagem.current,
          aoMudarQualidade: (tier, motivo) => {
            setTierAtual(tier);
            setAnuncio(`Qualidade ajustada para ${tier === 'economico' ? 'econômica' : 'média'}`);
            telemetria('p3d_qualidade', { tier, motivo }); // §290
          },
        });
        if (!vivo) { void r.descartar(); return; }
        refR.current = r;
        await r.inicializar({ qualidade: 'auto', pixelRatioMax: 2 });
        if (!refAlvo.current) throw new Error('alvo desmontado');
        await r.montar(refAlvo.current as unknown as { innerHTML: string });
        if (vivo) setFase('pronto');
      } catch {
        if (vivo) setFase('indisponivel');
      }
    })();
    return () => {
      vivo = false;
      void refR.current?.descartar();
      refR.current = null;
    };
  }, []);

  // estado do DRAFT + personagem (auto ou override) → renderer
  useEffect(() => {
    const r = refR.current;
    if (!r || fase !== 'pronto') return;
    const t0 = performance.now();
    void r.aplicarEstado(estado).then((res) => {
      if (!res.ok) { setFase('indisponivel'); return; }
      setPendencias(res.pendencias.length);
      telemetria('p3d_aplicou', { personagem, ms: Math.round(performance.now() - t0) }); // §290
      if (apresentando) return; // coreografia §174 no comando
      r.definirCamera({ modo: cameraModo, distancia: 2.15 });
      // personagem novo pode não ter a animação atual → volta ao Idle
      void r.tocarAnimacao({ id: movReduzido ? 'nenhum' : animacao });
    });
  }, [estado, personagem, fase, cameraModo, animacao, movReduzido, apresentando]);

  const animacoesDoAtual = useMemo(() => {
    const doIndice = indice.find((p) => p.slug === personagem)?.animacoes ?? [];
    const destaque = ANIMACOES_DESTAQUE.filter((a) => doIndice.includes(a));
    return destaque.length ? destaque.slice(0, 6) : doIndice.slice(0, 6);
  }, [indice, personagem]);

  // mega 17: prefetch oportunista no hover do chip
  const precarregar = useCallback((slug: string) => {
    (refR.current as unknown as { precarregar?: (s: string) => void })?.precarregar?.(slug);
  }, []);

  const trocarPersonagem = useCallback((slug: string | null) => {
    setOverride(slug);
    setAnimacao('Idle');
    setAnuncio(slug ? `Personagem: ${slug}` : 'Personagem automático pela espécie 2D');
    telemetria('p3d_personagem', { escolha: slug ?? 'auto' }); // §290
    try {
      if (slug) localStorage.setItem(CHAVE_OVERRIDE, slug);
      else localStorage.removeItem(CHAVE_OVERRIDE);
    } catch { /* sem storage */ }
  }, []);

  // mega 10 §174: roteiro com os clipes REAIS do personagem — Wave e um
  // número musical (Dance/Victory/Running/Walk, o que existir); órbita
  // cinemática durante; volta ao Idle + câmera anterior. §297 pula tudo.
  useEffect(() => {
    if (sinalShowcase === 0 || fase !== 'pronto' || movReduzido || apresentando) return;
    const r = refR.current;
    if (!r) return;
    let vivo = true;
    const espera = (ms: number) => new Promise((res) => { setTimeout(res, ms); });
    void (async () => {
      setApresentando(true);
      telemetria('p3d_showcase', { personagem: refPersonagem.current }); // §290
      const todas = indice.find((x) => x.slug === refPersonagem.current)?.animacoes ?? [];
      const roteiro = ['Wave', 'Dance', 'Victory', 'Running', 'Walk'].filter((x) => todas.includes(x)).slice(0, 2);
      r.definirCamera({ modo: 'cinematica' });
      for (const clipe of roteiro.length ? roteiro : ['Idle']) {
        await r.tocarAnimacao({ id: clipe, transicaoMs: 350 });
        await espera(2600);
        if (!vivo) return;
      }
      await r.tocarAnimacao({ id: 'Idle', transicaoMs: 400 });
      r.definirCamera({ modo: cameraModo, distancia: 2.15 });
      setAnimacao('Idle');
      setApresentando(false);
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sinalShowcase]);

  // mega 13 §174.2: grava a COREOGRAFIA em WebM (vp9→vp8→padrão do
  // navegador) direto do canvas; para sozinha quando o showcase termina.
  // Falha de codec/stream nunca derruba o palco — só desiste da gravação.
  const gravarShowcase = useCallback(() => {
    if (!podeGravar || gravando || apresentando) return;
    const canvas = refAlvo.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas || typeof canvas.captureStream !== 'function') return;
    try {
      const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .find((m) => MediaRecorder.isTypeSupported(m));
      const gravador = new MediaRecorder(canvas.captureStream(30), mime ? { mimeType: mime } : undefined);
      const pedacos: Blob[] = [];
      gravador.ondataavailable = (e) => { if (e.data.size) pedacos.push(e.data); };
      gravador.onstop = () => {
        setGravando(false);
        refGravador.current = null;
        if (!pedacos.length) return;
        const url = URL.createObjectURL(new Blob(pedacos, { type: mime ?? 'video/webm' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dshow-showcase.webm';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      };
      refGravador.current = gravador;
      gravador.start(250);
      setGravando(true);
      telemetria('p3d_gravou', { personagem: refPersonagem.current }); // §290
      setSinalLocal((n) => n + 1); // dispara a coreografia junto
    } catch { setGravando(false); refGravador.current = null; }
  }, [podeGravar, gravando, apresentando]);

  // fim do showcase (ou desmontagem) encerra a gravação
  useEffect(() => {
    if (!apresentando && refGravador.current?.state === 'recording') {
      refGravador.current.stop();
    }
  }, [apresentando]);
  useEffect(() => () => {
    if (refGravador.current?.state === 'recording') refGravador.current.stop();
  }, []);

  // mega 15: compartilhar a captura (share→clipboard→download)
  const compartilhar3d = useCallback(async () => {
    const r = refR.current;
    if (!r) return;
    try {
      const foto = await r.capturar({ largura: 960, altura: 960, deterministica: true });
      await compartilharPng(foto.dataUri, 'dshow-avatar-3d.png', 'Meu avatar 3D Dshow');
    } catch { /* cosmético */ }
  }, []);

  // mega 10 §174.1: captura PNG 960 determinística do palco 3D
  const capturar3d = useCallback(async () => {
    const r = refR.current;
    if (!r) return;
    try {
      const foto = await r.capturar({ largura: 960, altura: 960, deterministica: true });
      telemetria('p3d_capturou', { personagem: refPersonagem.current }); // §290
      const comM = await comMarca(foto.dataUri, 960);
      const a = document.createElement('a');
      a.href = comM;
      a.download = 'dshow-avatar-3d-960.png';
      a.click();
    } catch { /* captura é cosmética — nunca derruba o palco */ }
  }, []);

  const trocarCamera = useCallback((modo: EstadoCamera['modo']) => {
    setCameraModo(modo);
    refR.current?.definirCamera({ modo, distancia: 2.15 });
  }, []);

  // megas 21/22: fundo e luz refletem no renderer
  useEffect(() => {
    if (fase !== 'pronto') return;
    (refR.current as unknown as { definirFundo?: (f: string) => void })?.definirFundo?.(fundo3d);
  }, [fundo3d, fase, personagem]);
  useEffect(() => {
    if (fase !== 'pronto') return;
    (refR.current as unknown as { definirLuz?: (l: string) => void })?.definirLuz?.(luz3d);
  }, [luz3d, fase]);

  // mega 29: pose congelada — pausa/retoma o renderer
  useEffect(() => {
    const r = refR.current;
    if (!r || fase !== 'pronto') return;
    if (congelado) r.pausar(); else r.retomar();
  }, [congelado, fase]);

  // mega 28: HUD (flag as5.hud3d) — amostra o diagnostico() a cada 1s
  useEffect(() => {
    if (!hudLigado || fase !== 'pronto') return;
    const timer = setInterval(() => {
      const d = (refR.current as unknown as { diagnostico?: () => { fps: number; tier: string; triangulos: number } })?.diagnostico?.();
      if (d) setHud(d);
    }, 1000);
    return () => clearInterval(timer);
  }, [hudLigado, fase]);

  // mega 27: VIDA no idle — alterna Idle↔Idle_Neutral a cada 12s quando
  // o personagem tem os dois (nunca em showcase/pose/animação escolhida ≠ Idle)
  useEffect(() => {
    if (fase !== 'pronto' || movReduzido) return;
    const timer = setInterval(() => {
      if (apresentando || congelado || animacao !== 'Idle') return;
      const todas = indice.find((x) => x.slug === refPersonagem.current)?.animacoes ?? [];
      if (!todas.includes('Idle_Neutral')) return;
      const r = refR.current;
      if (!r) return;
      void (async () => {
        await r.tocarAnimacao({ id: 'Idle_Neutral', transicaoMs: 600 });
        setTimeout(() => { void refR.current?.tocarAnimacao({ id: 'Idle', transicaoMs: 600 }); }, 4000);
      })();
    }, 12000);
    return () => clearInterval(timer);
  }, [fase, movReduzido, apresentando, congelado, animacao, indice]);

  // mega 26: marca d'água discreta num dataURI (canvas overlay)
  const comMarca = useCallback(async (dataUri: string, lado: number): Promise<string> => {
    if (!marca) return dataUri;
    const img = new Image();
    await new Promise((res) => { img.onload = res; img.src = dataUri; });
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    if (!g) return dataUri;
    g.drawImage(img, 0, 0);
    const fs = Math.round(lado * 0.024);
    g.font = `700 ${fs}px system-ui, sans-serif`;
    g.fillStyle = 'rgba(230, 234, 242, 0.5)';
    g.textAlign = 'right';
    g.fillText('DSHOW', c.width - fs, c.height - fs);
    return c.toDataURL('image/png');
  }, [marca]);

  // mega 25: FICHA do personagem — 4 ângulos §508 num contact sheet 2×2
  const gerarFicha = useCallback(async () => {
    const r = refR.current;
    if (!r) return;
    try {
      const angulos: Array<{ rotulo: string; azimute: number }> = [
        { rotulo: 'frente', azimute: 0 },
        { rotulo: 'três quartos', azimute: 0.65 },
        { rotulo: 'perfil', azimute: Math.PI / 2 },
        { rotulo: 'costas', azimute: Math.PI },
      ];
      const lados = 960;
      const c = document.createElement('canvas');
      c.width = lados * 2; c.height = lados * 2;
      const g = c.getContext('2d');
      if (!g) return;
      for (let i = 0; i < angulos.length; i += 1) {
        r.definirCamera({ modo: 'corpo', distancia: 2.15, azimute: angulos[i].azimute, elevacao: 0.3 });
        const foto = await r.capturar({ largura: lados, altura: lados, deterministica: true });
        const img = new Image();
        await new Promise((res) => { img.onload = res; img.src = foto.dataUri; });
        g.drawImage(img, (i % 2) * lados, Math.floor(i / 2) * lados);
      }
      r.definirCamera({ modo: cameraModo, distancia: 2.15 }); // restaura
      const pronto = await comMarca(c.toDataURL('image/png'), lados * 2);
      const a = document.createElement('a');
      a.href = pronto;
      a.download = `dshow-ficha-${refPersonagem.current}.png`;
      a.click();
      telemetria('p3d_ficha', { personagem: refPersonagem.current }); // §290
    } catch { /* cosmético */ }
  }, [cameraModo, comMarca]);

  // mega 24: a captura vira o AVATAR OFICIAL (pipeline legado salvarFoto)
  const usarComoAvatar = useCallback(async () => {
    const r = refR.current;
    if (!r || !aoUsarComoAvatar || salvandoAvatar) return;
    setSalvandoAvatar(true);
    try {
      const foto = await r.capturar({ largura: 960, altura: 960, deterministica: true });
      const okSalvo = await aoUsarComoAvatar(foto.dataUri);
      setAnuncio(okSalvo ? 'Personagem 3D agora é seu avatar' : 'Não consegui salvar o avatar');
      telemetria('p3d_virou_avatar', { personagem: refPersonagem.current, ok: okSalvo }); // §290
    } catch { setAnuncio('Não consegui salvar o avatar'); } finally { setSalvandoAvatar(false); }
  }, [aoUsarComoAvatar, salvandoAvatar]);

  // mega 18 (§583): atalhos do palco 3D — P apresenta, R grava, C captura
  useEffect(() => {
    const aoTecla = (ev: KeyboardEvent) => {
      const alvo = ev.target as HTMLElement | null;
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key.toLowerCase();
      if (k === 'p' && !movReduzido && !apresentando) setSinalLocal((n) => n + 1);
      else if (k === 'r' && podeGravar && !gravando && !apresentando && !movReduzido) gravarShowcase();
      else if (k === 'c') void capturar3d();
      else if (k === ' ') { ev.preventDefault(); setCongelado((v) => !v); } // mega 29
    };
    window.addEventListener('keydown', aoTecla);
    return () => window.removeEventListener('keydown', aoTecla);
  }, [movReduzido, apresentando, gravando, podeGravar, gravarShowcase, capturar3d]);

  if (fase === 'indisponivel') {
    return (
      <div className="avst5-p3d-vazio" role="status" data-teste="p3d-indisponivel">
        <Box size={26} aria-hidden />
        <p>
          Prévia 3D indisponível neste ambiente — os personagens publicados não
          foram encontrados (ou o WebGL está desligado).
        </p>
      </div>
    );
  }

  return (
    <div className="avst5-p3d" data-teste="palco-3d" data-apresentando={apresentando || undefined}>
      <div ref={refAlvo} className="avst5-p3d-tela" aria-label="Palco 3D (prévia)" />
      {fase === 'pronto' && (<>
        <div className="avst5-p3d-personagens" role="radiogroup" aria-label="Personagem da prévia 3D">
          <button type="button" role="radio" aria-checked={override === null}
            className={`avst5-p3d-chip${override === null ? ' avst5-p3d-chip-on' : ''}`}
            title="Segue a espécie escolhida no 2D" data-teste="p3d-auto"
            onClick={() => trocarPersonagem(null)}>
            <Wand2 size={11} aria-hidden /> Auto
          </button>
          {indice.map((p) => (
            <button key={p.slug} type="button" role="radio"
              aria-checked={override === p.slug || (override === null && personagem === p.slug)}
              className={`avst5-p3d-chip${personagem === p.slug ? ' avst5-p3d-chip-on' : ''}`}
              onMouseEnter={() => precarregar(p.slug)} onFocus={() => precarregar(p.slug)}
              onClick={() => trocarPersonagem(p.slug)}>
              {p.nome}
            </button>
          ))}
        </div>
        {animacoesDoAtual.length > 0 && (
          <div className="avst5-p3d-animacoes" role="radiogroup" aria-label="Animação"
            data-teste="p3d-animacoes">
            <Sparkles size={11} aria-hidden />
            {animacoesDoAtual.map((a) => (
              <button key={a} type="button" role="radio" aria-checked={animacao === a}
                className={`avst5-p3d-chip${animacao === a ? ' avst5-p3d-chip-on' : ''}`}
                onClick={() => setAnimacao(a)}>
                {a}
              </button>
            ))}
          </div>
        )}
        <div className="avst5-p3d-acoes">
          <button type="button" title={congelado ? 'Retomar (espaço)' : 'Congelar pose (espaço)'}
            aria-pressed={congelado} data-teste="p3d-pose"
            onClick={() => setCongelado((v) => !v)}>
            {congelado ? <Play size={13} aria-hidden /> : <Pause size={13} aria-hidden />}</button>
          <button type="button" title="Capturar PNG do palco 3D (§174.1)" data-teste="p3d-capturar"
            onClick={() => void capturar3d()}><Camera size={13} aria-hidden /></button>
          <button type="button" title="Ficha do personagem — 4 ângulos (§508)" data-teste="p3d-ficha"
            onClick={() => void gerarFicha()}><LayoutPanelTop size={13} aria-hidden /></button>
          <button type="button" title={marca ? 'Marca Dshow LIGADA nas capturas' : 'Marca Dshow desligada'}
            aria-pressed={marca} data-teste="p3d-marca"
            onClick={() => setMarca((v) => !v)}><Grid3x3 size={13} aria-hidden /></button>
          {aoUsarComoAvatar && (
            <button type="button" title="Usar como meu AVATAR (header/perfil)" data-teste="p3d-usar-avatar"
              disabled={salvandoAvatar}
              onClick={() => void usarComoAvatar()}><BadgeCheck size={13} aria-hidden /></button>
          )}
          {podeCompartilhar() && (
            <button type="button" title="Compartilhar a captura" data-teste="p3d-compartilhar"
              onClick={() => void compartilhar3d()}><Share2 size={13} aria-hidden /></button>
          )}
          <button type="button" title="Showcase 3D (§174)" data-teste="p3d-apresentar"
            disabled={apresentando || movReduzido}
            onClick={() => setSinalLocal((n) => n + 1)}><Play size={13} aria-hidden /></button>
          {podeGravar && (
            <button type="button" title="Gravar o showcase em WebM (§174.2)" data-teste="p3d-gravar"
              disabled={apresentando || gravando || movReduzido}
              className={gravando ? 'avst5-p3d-rec' : ''}
              onClick={gravarShowcase}><CircleDot size={13} aria-hidden /></button>
          )}
        </div>
        <div className="avst5-p3d-cenario">
          <span role="radiogroup" aria-label="Fundo do palco 3D" data-teste="p3d-fundos">
            {(['neutro', 'estudio', 'grade'] as const).map((f2) => (
              <button key={f2} type="button" role="radio" aria-checked={fundo3d === f2}
                className={`avst5-p3d-chip${fundo3d === f2 ? ' avst5-p3d-chip-on' : ''}`}
                onClick={() => setFundo3d(f2)}>
                {f2 === 'neutro' ? 'Neutro' : f2 === 'estudio' ? 'Estúdio' : 'Grade'}
              </button>
            ))}
          </span>
          <span role="radiogroup" aria-label="Iluminação (§163)" data-teste="p3d-luzes">
            <Lightbulb size={11} aria-hidden />
            {(['estudio', 'quente', 'fria', 'neon'] as const).map((l2) => (
              <button key={l2} type="button" role="radio" aria-checked={luz3d === l2}
                className={`avst5-p3d-chip${luz3d === l2 ? ' avst5-p3d-chip-on' : ''}`}
                onClick={() => setLuz3d(l2)}>
                {l2 === 'estudio' ? 'Estúdio' : l2 === 'quente' ? 'Quente' : l2 === 'fria' ? 'Fria' : 'Neon'}
              </button>
            ))}
          </span>
        </div>
        {hudLigado && hud && (
          <div className="avst5-p3d-hud" data-teste="p3d-hud" role="note">
            <Activity size={10} aria-hidden /> {hud.fps}fps · {hud.tier} · {hud.triangulos.toLocaleString('pt-BR')}△
          </div>
        )}
        {congelado && (
          <div className="avst5-p3d-congelado" role="status" data-teste="p3d-congelado">Pose congelada (espaço retoma)</div>
        )}
        <div className="avst5-p3d-cameras" role="radiogroup" aria-label="Câmera (§453.1)">
          <button type="button" role="radio" aria-checked={cameraModo === 'corpo'} title="Corpo inteiro"
            onClick={() => trocarCamera('corpo')}><PersonStanding size={13} aria-hidden /></button>
          <button type="button" role="radio" aria-checked={cameraModo === 'retrato'} title="Retrato"
            onClick={() => trocarCamera('retrato')}><UserRound size={13} aria-hidden /></button>
          <button type="button" role="radio" aria-checked={cameraModo === 'orbita'} title="Órbita livre — arraste p/ girar, roda p/ zoom (mega 23)"
            data-teste="p3d-orbita" onClick={() => trocarCamera('orbita')}><Rotate3d size={13} aria-hidden /></button>
          <button type="button" role="radio" aria-checked={cameraModo === 'cinematica'} title="Cinemática (órbita automática)"
            onClick={() => trocarCamera('cinematica')}><Clapperboard size={13} aria-hidden /></button>
        </div>
        <span className="avst5-sr-only" role="status" aria-live="polite">{anuncio}</span>
        <div className="avst5-p3d-nota" role="note" data-teste="p3d-pendencias">
          {override === null ? 'Auto pela espécie 2D' : 'Personagem fixado'}
          {tierAtual ? ` · qualidade ${tierAtual === 'economico' ? 'econômica (auto)' : tierAtual}` : ''}
          {pendencias > 0 ? ` · ${pendencias} item(ns) equipados seguem no 2D` : ''}
        </div>
      </>)}
      {fase === 'carregando' && (
        <div className="avst5-p3d-carregando" role="status">
          <span className="avst-esqueleto" style={{ width: 180, height: 180, borderRadius: '50%' }} />
        </div>
      )}
    </div>
  );
}
