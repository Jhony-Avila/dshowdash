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
import { Box, Camera, CircleDot, Clapperboard, PersonStanding, Play, Share2, Sparkles, UserRound, Wand2 } from 'lucide-react';
import type { EstadoAvatar } from '../nucleo/contratos';
import type { EstadoCamera, RenderizadorAvatar } from '../nucleo/renderizador';
import { criarRenderizador } from '../services/FabricaRenderizador';
import { compartilharPng, podeCompartilhar } from '../services/Compartilhar';
import { telemetria } from '../services/Telemetria';
import { carregarIndice3d, personagemParaBase } from '../services/Personagens3d';
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

export function Palco3d({ estado, movReduzido, sinalApresentar = 0 }: {
  estado: EstadoAvatar;
  movReduzido: boolean;
  /** mega 10: incrementa a cada clique em Apresentar (o shell delega §174) */
  sinalApresentar?: number;
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
      const a = document.createElement('a');
      a.href = foto.dataUri;
      a.download = 'dshow-avatar-3d-960.png';
      a.click();
    } catch { /* captura é cosmética — nunca derruba o palco */ }
  }, []);

  const trocarCamera = useCallback((modo: EstadoCamera['modo']) => {
    setCameraModo(modo);
    refR.current?.definirCamera({ modo, distancia: 2.15 });
  }, []);

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
          <button type="button" title="Capturar PNG do palco 3D (§174.1)" data-teste="p3d-capturar"
            onClick={() => void capturar3d()}><Camera size={13} aria-hidden /></button>
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
        <div className="avst5-p3d-cameras" role="radiogroup" aria-label="Câmera (§453.1)">
          <button type="button" role="radio" aria-checked={cameraModo === 'corpo'} title="Corpo inteiro"
            onClick={() => trocarCamera('corpo')}><PersonStanding size={13} aria-hidden /></button>
          <button type="button" role="radio" aria-checked={cameraModo === 'retrato'} title="Retrato"
            onClick={() => trocarCamera('retrato')}><UserRound size={13} aria-hidden /></button>
          <button type="button" role="radio" aria-checked={cameraModo === 'cinematica'} title="Cinemática (órbita)"
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
