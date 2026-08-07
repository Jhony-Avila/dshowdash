// shell/Palco3d.tsx — PRÉVIA 3D no viewport do shell (AS5 · megas 7–39).
// @version 3.0.0  @created 2026-08-03  @updated 2026-08-04 (lote 31–39:
// cenas salvas, captura transparente, turntable 360°, qualidade manual,
// vídeo na cascata §21.5, tela cheia)
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
import { Activity, BadgeCheck, BookmarkPlus, Box, Camera, CircleDot, Clapperboard, Columns2, Eraser, Grid3x3, LayoutPanelTop, Lightbulb, Maximize2, Minimize2, Pause, PersonStanding, Play, RefreshCcw, Rotate3d, RotateCw, Share2, SkipBack, SkipForward, SlidersHorizontal, Sparkles, UserRound, Wand2 } from 'lucide-react';
import type { EstadoAvatar } from '../nucleo/contratos';
import type { EstadoCamera, RenderizadorAvatar } from '../nucleo/renderizador';
import { criarRenderizador } from '../services/FabricaRenderizador';
import { compartilharBlob, compartilharPng, podeCompartilhar } from '../services/Compartilhar';
import { telemetria } from '../services/Telemetria';
import { carregarIndice3d, personagemParaBase } from '../services/Personagens3d';
import { carregarIndicePartes, categoriaDaParte } from '../services/Partes3d'; // lote 621-630 (§406)
import type { EntradaIndiceParte } from '../services/Partes3d';
import { flag } from '../nucleo/flags';
import type { EntradaIndice3d } from '../services/Personagens3d';
import { excluirCena, listarCenas, salvarCena } from '../services/Cenas3d';
import type { Cena3d } from '../services/Cenas3d';
import { detectarCapacidade3d } from '../services/Capacidade3d';
import { excluirPose, listarPoses, salvarPose } from '../services/Poses3d';
import { log } from '../services/Log';
import { paraLegado2d } from '../nucleo/adaptadores';
import { CORES_PADRAO } from '../engine/cores'; // lote 641-650 (§420)
import { tituloPorId, validarConfig } from '../services/AvatarCatalog';
import { AvatarSvg } from '../components/AvatarSvg';
// megas 226–227 (§175/§175.1): editor de showcase + modo automático
import {
  excluirRoteiro, listarRoteiros, montarRoteiroAutomatico, salvarRoteiro,
} from '../services/Roteiros';
import type { RascunhoRoteiro, RoteiroShowcase } from '../services/Roteiros';

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
const CHAVE_QUALIDADE = 'dshow.avst5.p3d.qualidade.v1';

type Qualidade3d = 'auto' | 'alto' | 'medio' | 'economico';

function overrideGuardado(): string | null {
  try { return localStorage.getItem(CHAVE_OVERRIDE); } catch { return null; }
}

/** mega 34: qualidade escolhida sobrevive à sessão (auto = adaptativa §528). */
function qualidadeGuardada(): Qualidade3d {
  try {
    const q = localStorage.getItem(CHAVE_QUALIDADE);
    return q === 'alto' || q === 'medio' || q === 'economico' ? q : 'auto';
  } catch { return 'auto'; }
}

// mega 42: capacidade reportada UMA vez por sessão (§290)
let capacidadeReportada = false;

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
  // mega 226: leitura fresca dentro do showcase (restauro pós-roteiro)
  const refCena3d = useRef({ fundo: fundo3d, luz: luz3d });
  refCena3d.current = { fundo: fundo3d, luz: luz3d };
  // mega 26: marca d'água nas capturas/ficha
  const [marca, setMarca] = useState(true);
  // mega 29: pose congelada (freeze frame)
  const [congelado, setCongelado] = useState(false);
  // mega 24: feedback do salvar avatar
  const [salvandoAvatar, setSalvandoAvatar] = useState(false);
  // mega 31: cenas salvas do palco (setup completo nomeado)
  const [cenas, setCenas] = useState<Cena3d[]>(listarCenas);
  // mega 32: captura com fundo TRANSPARENTE (compor no Photo Studio)
  const [transparente, setTransparente] = useState(false);
  // mega 34: qualidade manual (auto = adaptativa §528) — persistida
  const [qualidade, setQualidade] = useState<Qualidade3d>(qualidadeGuardada);
  // mega 39: modo apresentação (fullscreen no contêiner do palco)
  const [telaCheia, setTelaCheia] = useState(false);
  const refWrap = useRef<HTMLDivElement>(null);
  // mega 41: contexto WebGL em recuperação (watchdog)
  const [recuperando, setRecuperando] = useState(false);
  // mega 42: diagnóstico de capacidade (§605-lite) — 1 sondagem por sessão
  const capacidade = useMemo(detectarCapacidade3d, []);
  // mega 43: retry com backoff + remontagem manual ("Tentar de novo")
  const refTentativa = useRef(0);
  const [sinalRetry, setSinalRetry] = useState(0);
  const [remontagens, setRemontagens] = useState(0);
  // mega 48: ajuste fino de câmera (zoom/altura sobre o Box3)
  const [ajusteAberto, setAjusteAberto] = useState(false);
  const [camDist, setCamDist] = useState(2.15);
  const [camElev, setCamElev] = useState(0.35);
  const refCam = useRef({ dist: 2.15, elev: 0.35 });
  refCam.current = { dist: camDist, elev: camElev };
  // mega 49: comparar 2D×3D lado a lado
  const [comparando2d, setComparando2d] = useState(false);
  const config2d = useMemo(() => validarConfig(paraLegado2d(estado)), [estado]);
  // lote 641–650 (§420): só canais §73 PERSONALIZADOS viajam ao renderer —
  // cor no padrão = arte original do asset (byte-stability do visual)
  const coresPersonalizadas = useMemo(() => {
    const d: Record<string, string> = {};
    for (const [canal, cor] of Object.entries(config2d.cores)) {
      if (cor && cor.toLowerCase() !== CORES_PADRAO[canal as keyof typeof CORES_PADRAO]?.toLowerCase()) d[canal] = cor;
    }
    return d;
  }, [config2d]);
  // mega 78 (§458): exposição do tone mapping
  const [exposicao, setExposicao] = useState(1);
  // ── lote 261–270 (§440–§458, flag as5.palco3d_v2): CINEMA do palco ──
  const cinemaLigado = flag('as5.palco3d_v2');
  const [cinemaAberto, setCinemaAberto] = useState(false);
  const [toneMapa, setToneMapa] = useState<'aces' | 'agx' | 'neutro' | 'reinhard'>('aces');
  const [vida, setVida] = useState(true); // §440: o palco nasce VIVO
  const [particulas, setParticulas] = useState(false);
  const [rim, setRim] = useState(false);
  const [ambiente, setAmbiente] = useState(0.55); // = padrão do renderer (mega 77) — flag ON não muda o visual
  // ── lote 331–340 (§176/§457, flag as5.palco3d_cine) ──
  const cineLigado = flag('as5.palco3d_cine');
  const [movCam, setMovCam] = useState<'nenhum' | 'dolly' | 'panoramica' | 'orbita' | 'composto'>('nenhum');
  const [posFx, setPosFx] = useState(false);
  // mega 80 (§442): biblioteca de poses
  const [poses, setPoses] = useState(listarPoses);
  // mega 81 (§419): tinta de destaque nos materiais
  const [tinta, setTinta] = useState(false);
  // mega 101: galeria LOCAL das últimas capturas (memória da sessão)
  const [capturas, setCapturas] = useState<string[]>([]);
  // mega 102 (§372): texto da marca d'água configurável
  const [marcaTexto, setMarcaTexto] = useState<string>(() => {
    try { return localStorage.getItem('dshow.avst5.p3d.marca.v1') ?? 'DSHOW'; } catch { return 'DSHOW'; }
  });
  // mega 28: HUD de performance (flag dev)
  const hudLigado = flag('as5.hud3d');
  const [hud, setHud] = useState<{ fps: number; tier: string; triangulos: number } | null>(null);
  const [sinalLocal, setSinalLocal] = useState(0);
  const sinalShowcase = sinalApresentar + sinalLocal;
  // megas 226–227 (§175): EDITOR DE SHOWCASE — roteiro ativo comanda a
  // apresentação; luz/fundo do roteiro valem SÓ durante ela (restaura)
  const editorLigado = flag('as5.showcase_editor');
  const [editorAberto, setEditorAberto] = useState(false);
  const [roteiros, setRoteiros] = useState<RoteiroShowcase[]>(listarRoteiros);
  const [roteiroAtivo, setRoteiroAtivo] = useState<RoteiroShowcase | null>(null);
  const refRoteiro = useRef<RoteiroShowcase | null>(null);
  refRoteiro.current = roteiroAtivo;
  const [rascunho, setRascunho] = useState<RascunhoRoteiro>({
    clipes: [], duracaoClipeMs: 2600, camera: 'cinematica', encerramento: 'Idle',
  });
  // mega 13 (§174.2): GRAVAÇÃO do showcase — MediaRecorder no canvas
  const [gravando, setGravando] = useState(false);
  const refGravador = useRef<MediaRecorder | null>(null);
  const podeGravar = typeof MediaRecorder !== 'undefined';

  const personagem = override ?? personagemParaBase(estado.body.base);
  // ── lote 621–630 (§406/§423, flag as5.assembler3d): PARTES 3D ──────
  const [partesCabelo, setPartesCabelo] = useState<EntradaIndiceParte[]>([]);
  const [cabelo3d, setCabelo3d] = useState<string | null>(null);
  // ── lote 631–640 (§415–§417, flag as5.roupas3d): ROUPAS por look ───
  const [partesRoupa, setPartesRoupa] = useState<EntradaIndiceParte[]>([]);
  const [roupa3d, setRoupa3d] = useState<'ranger' | 'peasant' | null>(null);
  // ── lote 651–660 (§425, flag as5.cabelo3d): BARBA como slot PRÓPRIO —
  // combinações cabelo+barba montam JUNTAS no mesmo esqueleto §406
  const [partesBarba, setPartesBarba] = useState<EntradaIndiceParte[]>([]);
  const [barba3d, setBarba3d] = useState<string | null>(null);
  const rigAtualEhUbc = useMemo(
    () => indice.find((x) => x.slug === personagem)?.rig === 'ubc-v1',
    [indice, personagem],
  );
  const genero3d = personagem?.endsWith('_f') ? 'f' : 'm';
  useEffect(() => {
    if (!flag('as5.assembler3d')) return;
    // §425 (lote 651–660): com as5.cabelo3d a barba vira slot próprio;
    // rollback §651 = barba volta para a lista de cabelos (comportamento
    // do lote 621–630, byte a byte)
    const barbaSeparada = flag('as5.cabelo3d');
    void carregarIndicePartes().then((lista) => {
      if (!lista) return;
      setPartesCabelo(lista.filter((p) => {
        const c = categoriaDaParte(p.tipo);
        return c === 'cabelo' || (!barbaSeparada && c === 'barba');
      }));
      setPartesBarba(barbaSeparada ? lista.filter((p) => categoriaDaParte(p.tipo) === 'barba') : []);
      setPartesRoupa(lista.filter((p) => categoriaDaParte(p.tipo) === 'roupa'));
    });
  }, []);
  useEffect(() => {
    if (!flag('as5.assembler3d')) return;
    const slugs: string[] = [];
    if (cabelo3d && rigAtualEhUbc) slugs.push(cabelo3d);
    // §425: barba COMBINA com o cabelo (mesmo esqueleto pós-rebind §406)
    if (flag('as5.cabelo3d') && barba3d && rigAtualEhUbc) slugs.push(barba3d);
    // §416: o look veste TODAS as peças do gênero da base atual
    if (flag('as5.roupas3d') && roupa3d && rigAtualEhUbc) {
      slugs.push(...partesRoupa
        .filter((p) => p.slug.startsWith(`rou3d_${roupa3d}_${genero3d}_`))
        .map((p) => p.slug));
    }
    (refR.current as unknown as { definirPartes3d?: (s: string[]) => Promise<void> })
      ?.definirPartes3d?.(slugs);
  }, [cabelo3d, barba3d, roupa3d, partesRoupa, genero3d, rigAtualEhUbc, fase, personagem]);
  const refPersonagem = useRef(personagem);
  refPersonagem.current = personagem;

  // índice publicado (derivado) — fallback embutido se indisponível
  useEffect(() => {
    let vivo = true;
    void carregarIndice3d().then((i) => { if (vivo && i) setIndice(i.personagens); });
    return () => { vivo = false; };
  }, []);

  // monta o renderer (remontagens > 0 = "Tentar de novo" da mega 43);
  // descarta ao sair do modo 3D
  useEffect(() => {
    let vivo = true;
    setFase('carregando');
    (async () => {
      try {
        // mega 42: capacidade → telemetria 1×/sessão + dica de tier
        if (!capacidadeReportada) {
          capacidadeReportada = true;
          telemetria('p3d_capacidade', {
            software: capacidade.software, webgl2: capacidade.webgl2,
            dica: capacidade.dicaTier, renderizador: capacidade.renderizador.slice(0, 60),
          }); // §290
        }
        const r = await criarRenderizador('3d', {
          resolverPersonagem: () => refPersonagem.current,
          aoMudarQualidade: (tier, motivo) => {
            setTierAtual(tier);
            setAnuncio(`Qualidade ajustada para ${tier === 'economico' ? 'econômica' : 'média'}`);
            telemetria('p3d_qualidade', { tier, motivo }); // §290
          },
          // mega 41: watchdog — GPU reset/aba de fundo não mata o palco
          aoContexto: (fase2) => {
            setRecuperando(fase2 === 'perdido');
            setAnuncio(fase2 === 'perdido' ? 'Recuperando o 3D…' : 'Palco 3D recuperado');
            telemetria('p3d_contexto', { fase: fase2 }); // §290
          },
        });
        if (!vivo) { void r.descartar(); return; }
        refR.current = r;
        await r.inicializar({
          qualidade: qualidadeGuardada(), pixelRatioMax: 2,
          dicaTier: capacidade.dicaTier, // mega 42 (§605-lite)
        }); // mega 34
        if (!refAlvo.current) throw new Error('alvo desmontado');
        await r.montar(refAlvo.current as unknown as { innerHTML: string });
        if (vivo) setFase('pronto');
      } catch (e) {
        log.erro('p3d_montagem_falhou', { motivo: String((e as Error)?.message ?? e).slice(0, 80) }); // §291
        if (vivo) setFase('indisponivel');
      }
    })();
    return () => {
      vivo = false;
      void refR.current?.descartar();
      refR.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remontagens]);

  // estado do DRAFT + personagem (auto ou override) → renderer
  useEffect(() => {
    const r = refR.current;
    if (!r || fase !== 'pronto') return;
    const t0 = performance.now();
    void r.aplicarEstado(estado).then((res) => {
      if (!res.ok) {
        // mega 43: RETRY com backoff (1×) antes de declarar indisponível —
        // rede piscando não pode derrubar o palco
        if (refTentativa.current < 1) {
          refTentativa.current += 1;
          telemetria('p3d_retry', { personagem }); // §290
          log.aviso('p3d_aplicar_falhou_retry', { personagem }); // §291
          setTimeout(() => setSinalRetry((n) => n + 1), 800);
        } else {
          log.critico('p3d_indisponivel', { personagem }); // §291 v2: retries esgotados = fluxo quebrado
          setFase('indisponivel');
        }
        return;
      }
      refTentativa.current = 0;
      setPendencias(res.pendencias.length);
      telemetria('p3d_aplicou', { personagem, ms: Math.round(performance.now() - t0) }); // §290
      if (apresentando) return; // coreografia §174 no comando
      r.definirCamera({ modo: cameraModo, distancia: refCam.current.dist, elevacao: refCam.current.elev });
      // personagem novo pode não ter a animação atual → volta ao Idle
      void r.tocarAnimacao({ id: movReduzido ? 'nenhum' : animacao });
    });
  }, [estado, personagem, fase, cameraModo, animacao, movReduzido, apresentando, sinalRetry]);

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
  // megas 226–227 (§175): quando há ROTEIRO ativo, ele comanda clipes/
  // duração/câmera/encerramento e a luz/fundo valem SÓ durante (restaura).
  useEffect(() => {
    if (sinalShowcase === 0 || fase !== 'pronto' || movReduzido || apresentando) return;
    const r = refR.current;
    if (!r) return;
    let vivo = true;
    const espera = (ms: number) => new Promise((res) => { setTimeout(res, ms); });
    void (async () => {
      setApresentando(true);
      const rot = refRoteiro.current; // §175
      telemetria('p3d_showcase', { personagem: refPersonagem.current, roteiro: rot ? rot.id : 'padrao' }); // §290
      const todas = indice.find((x) => x.slug === refPersonagem.current)?.animacoes ?? [];
      const roteiro = rot
        ? rot.clipes.filter((x) => todas.includes(x)).slice(0, 4)
        : ['Wave', 'Dance', 'Victory', 'Running', 'Walk'].filter((x) => todas.includes(x)).slice(0, 2);
      const dur = rot?.duracaoClipeMs ?? 2600;
      const cenaAntes = { ...refCena3d.current };
      if (rot?.luz) setLuz3d(rot.luz);
      if (rot?.fundo) setFundo3d(rot.fundo);
      r.definirCamera({ modo: rot?.camera ?? 'cinematica' });
      for (const clipe of roteiro.length ? roteiro : ['Idle']) {
        await r.tocarAnimacao({ id: clipe, transicaoMs: 350 });
        await espera(dur);
        if (!vivo) return;
      }
      // §175: encerramento (se o personagem tiver o clipe)
      if (rot && rot.encerramento !== 'Idle' && todas.includes(rot.encerramento)
        && !roteiro.includes(rot.encerramento)) {
        await r.tocarAnimacao({ id: rot.encerramento, transicaoMs: 350 });
        await espera(1400);
        if (!vivo) return;
      }
      await r.tocarAnimacao({ id: 'Idle', transicaoMs: 400 });
      if (rot?.luz) setLuz3d(cenaAntes.luz);
      if (rot?.fundo) setFundo3d(cenaAntes.fundo);
      r.definirCamera({ modo: cameraModo, distancia: refCam.current.dist, elevacao: refCam.current.elev });
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
        // mega 36 (§21.5): o vídeo entra na MESMA cascata da imagem —
        // share(File) no mobile; desktop degrada p/ download (idêntico ao antigo)
        const blob = new Blob(pedacos, { type: mime ?? 'video/webm' });
        void compartilharBlob(blob, 'dshow-showcase.webm', 'Showcase 3D Dshow')
          .then((canal) => telemetria('p3d_gravou_canal', { canal })); // §290
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

  // mega 26: marca d'água discreta num dataURI (canvas overlay) —
  // declarada ANTES de quem a usa nos deps (TDZ)
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
    // mega 102 (§372): texto configurável (sanitizado; vazio volta ao padrão)
    g.fillText((marcaTexto.trim() || 'DSHOW').slice(0, 16), c.width - fs, c.height - fs);
    return c.toDataURL('image/png');
  }, [marca, marcaTexto]);

  // mega 15: compartilhar a captura (share→clipboard→download) — mesma
  // composição da captura (marca + transparente, megas 26/32)
  const compartilhar3d = useCallback(async () => {
    const r = refR.current;
    if (!r) return;
    try {
      const foto = await r.capturar({ largura: 960, altura: 960, deterministica: true, transparente });
      await compartilharPng(await comMarca(foto.dataUri, 960), 'dshow-avatar-3d.png', 'Meu avatar 3D Dshow');
    } catch { /* cosmético */ }
  }, [transparente, comMarca]);

  // mega 10 §174.1: captura PNG 960 determinística do palco 3D
  // (mega 32: honra o toggle transparente; mega 26: marca — deps CORRETAS,
  // a closure antiga congelava a primeira versão do comMarca)
  const capturar3d = useCallback(async () => {
    const r = refR.current;
    if (!r) return;
    try {
      const foto = await r.capturar({ largura: 960, altura: 960, deterministica: true, transparente });
      telemetria('p3d_capturou', { personagem: refPersonagem.current, transparente }); // §290
      const comM = await comMarca(foto.dataUri, 960);
      setCapturas((c2) => [comM, ...c2].slice(0, 6)); // mega 101: galeria local
      const a = document.createElement('a');
      a.href = comM;
      a.download = 'dshow-avatar-3d-960.png';
      a.click();
    } catch { /* captura é cosmética — nunca derruba o palco */ }
  }, [transparente, comMarca]);

  // mega 33: TURNTABLE 360° — 8 azimutes §508 numa folha 4×2 (1920×960)
  const gerarTurntable = useCallback(async () => {
    const r = refR.current;
    if (!r) return;
    try {
      const lado = 480;
      const c = document.createElement('canvas');
      c.width = lado * 4; c.height = lado * 2;
      const g = c.getContext('2d');
      if (!g) return;
      for (let i = 0; i < 8; i += 1) {
        r.definirCamera({ modo: 'corpo', distancia: 2.15, azimute: i * (Math.PI / 4), elevacao: 0.3 });
        const foto = await r.capturar({ largura: lado, altura: lado, deterministica: true });
        const img = new Image();
        await new Promise((res) => { img.onload = res; img.src = foto.dataUri; });
        g.drawImage(img, (i % 4) * lado, Math.floor(i / 4) * lado);
      }
      r.definirCamera({ modo: cameraModo, distancia: refCam.current.dist, elevacao: refCam.current.elev }); // restaura
      const pronto = await comMarca(c.toDataURL('image/png'), c.width);
      const a = document.createElement('a');
      a.href = pronto;
      a.download = `dshow-turntable-${refPersonagem.current}.png`;
      a.click();
      telemetria('p3d_turntable', { personagem: refPersonagem.current }); // §290
    } catch { /* cosmético */ }
  }, [cameraModo, comMarca]);

  const trocarCamera = useCallback((modo: EstadoCamera['modo']) => {
    setCameraModo(modo);
    refR.current?.definirCamera({ modo, distancia: refCam.current.dist, elevacao: refCam.current.elev });
  }, []);

  // mega 48: sliders de AJUSTE FINO → câmera (sobre o enquadramento Box3)
  useEffect(() => {
    if (fase !== 'pronto') return;
    refR.current?.definirCamera({ modo: cameraModo, distancia: camDist, elevacao: camElev });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camDist, camElev]);

  // mega 78: exposição do tone mapping → renderer
  useEffect(() => {
    if (fase !== 'pronto') return;
    (refR.current as unknown as { definirExposicao?: (v: number) => void })?.definirExposicao?.(exposicao);
  }, [exposicao, fase]);

  // lote 261–270: CINEMA → renderer (tone §457, ambiente §449, vida §440,
  // rim §452, partículas §444) — tudo condicionado à flag as5.palco3d_v2
  useEffect(() => {
    if (fase !== 'pronto' || !cinemaLigado) return;
    const r = refR.current as unknown as {
      definirTonemapping?: (m: string) => void; definirAmbiente?: (v: number) => void;
    };
    r?.definirTonemapping?.(toneMapa);
    r?.definirAmbiente?.(ambiente);
  }, [toneMapa, ambiente, fase, cinemaLigado]);
  useEffect(() => {
    if (fase !== 'pronto' || !cinemaLigado) return;
    // mega 645 (§297×§440): movimento reduzido também DESLIGA a vida —
    // idle e câmera já respeitavam; a respiração ficara de fora (gap a11y)
    (refR.current as unknown as { definirVida?: (v: number | null) => void })
      ?.definirVida?.(vida && !movReduzido ? 0.8 : null);
  }, [vida, fase, cinemaLigado, personagem, movReduzido]);
  useEffect(() => {
    if (fase !== 'pronto' || !cinemaLigado) return;
    const r = refR.current as unknown as {
      definirRim?: (c: string | null) => void; definirParticulas3d?: (c: string | null) => void;
    };
    r?.definirRim?.(rim ? config2d.cores.destaque : null);
    r?.definirParticulas3d?.(particulas ? config2d.cores.destaque : null);
  }, [rim, particulas, config2d, fase, cinemaLigado, personagem]);

  // lote 331–340: movimento §176 + pós §457 → renderer (flag própria)
  useEffect(() => {
    if (fase !== 'pronto' || !cineLigado) return;
    (refR.current as unknown as { definirMovimentoCamera?: (m: string) => void })
      ?.definirMovimentoCamera?.(movReduzido ? 'nenhum' : movCam); // §297
  }, [movCam, fase, cineLigado, movReduzido, personagem]);
  useEffect(() => {
    if (fase !== 'pronto' || !cineLigado) return;
    // lote 451-460 (§457, flag as5.pos3d_real): composer REAL quando a
    // flag está ligada; senão o filter leve do lote 331-340
    (refR.current as unknown as { definirPos?: (v: boolean, real?: boolean) => void })
      ?.definirPos?.(posFx, flag('as5.pos3d_real'));
  }, [posFx, fase, cineLigado, personagem]);

  // mega 81: tinta de destaque (cor do avatar 2D) nos materiais 3D
  useEffect(() => {
    if (fase !== 'pronto') return;
    (refR.current as unknown as { definirTinta?: (c: string | null) => void })
      ?.definirTinta?.(tinta ? config2d.cores.destaque : null);
  }, [tinta, config2d, fase, personagem]);

  // lote 641–650 (§418–§421, flag as5.materiais3d): canais de cor §73 do
  // 2D recolorem os materiais 3D (cabelo/roupa/destaque — §420: a UI fala
  // canais; o renderer converte). Vazio/flag off = arte original.
  useEffect(() => {
    if (fase !== 'pronto') return;
    const tem = flag('as5.materiais3d') && Object.keys(coresPersonalizadas).length > 0;
    (refR.current as unknown as { definirCores3d?: (c: Record<string, string> | null) => void })
      ?.definirCores3d?.(tem ? coresPersonalizadas : null);
  }, [coresPersonalizadas, fase, personagem]);

  // lote 651–660 (§412–§414, flag as5.morfos3d): tipo corporal §102 e
  // ajuste fino §102.2 do 2D moldam o personagem 3D (tabela única §102)
  useEffect(() => {
    if (fase !== 'pronto') return;
    const corpo = flag('as5.morfos3d') && (estado.body.tipo || estado.body.fino)
      ? { tipo: estado.body.tipo ?? null, fino: estado.body.fino ?? null }
      : null;
    (refR.current as unknown as { definirCorpo3d?: (c: typeof corpo) => void })
      ?.definirCorpo3d?.(corpo);
  }, [estado, fase, personagem]);

  // mega 82: aura equipada no 2D vira ANEL 3D na cor de destaque (§444)
  useEffect(() => {
    if (fase !== 'pronto') return;
    (refR.current as unknown as { definirAura3d?: (c: string | null) => void })
      ?.definirAura3d?.(estado.equipment.aura ? config2d.cores.destaque : null);
  }, [estado, config2d, fase, personagem]);

  // lote 131–140 (§426–§431): acessórios 2D viram PROPS aproximadas nos
  // sockets 3D (a mesma API recebe as malhas reais quando o UBC chegar)
  const aproximados = useMemo(() => {
    let n = 0;
    if (estado.equipment.acessorio_cabeca) n += 1;
    if (estado.equipment.acessorio_rosto) n += 1;
    if (estado.equipment.pet) n += 1;
    return n;
  }, [estado]);
  useEffect(() => {
    if (fase !== 'pronto') return;
    const r = refR.current as unknown as { definirProp3d?: (s: string, t: string | null, c?: string) => void };
    if (!r?.definirProp3d) return;
    const cor = config2d.cores.destaque;
    const cabeca = estado.equipment.acessorio_cabeca; // legado migra p/ cá no deLegado2d
    r.definirProp3d('cabeca', cabeca ? (String(cabeca).includes('coroa') ? 'coroa' : 'chapeu') : null, cor);
    r.definirProp3d('rosto', estado.equipment.acessorio_rosto ? 'oculos' : null, cor);
    r.definirProp3d('pet', estado.equipment.pet ? 'pet' : null, cor);
  }, [estado, config2d, fase, personagem]);

  // mega 80: salvar/aplicar/excluir POSES (clipe + tempo do scrub)
  const salvarPoseAtual = useCallback(() => {
    const r = refR.current as unknown as {
      tempoDaPose?: () => { clipe: string | null; tempo: number };
      capturar?: (o: { largura: number; altura: number }) => Promise<{ dataUri: string }>;
    };
    const t = r?.tempoDaPose?.();
    if (!t?.clipe) { setAnuncio('Este personagem não tem clipes p/ pose'); return; }
    const clipe = t.clipe; // estreitado p/ o TS dentro dos callbacks
    // mega 335 (§443 v2): thumb 96px do palco no momento do salvamento
    const salvarCom = (thumb?: string) => {
      const p = salvarPose(refPersonagem.current, clipe, t.tempo, thumb);
      setPoses(listarPoses());
      setAnuncio(p ? `Pose "${p.nome}" salva` : 'Limite de 8 poses');
      if (p) telemetria('p3d_pose_salvou', { clipe }); // §290
    };
    if (flag('as5.palco3d_cine') && r?.capturar) {
      r.capturar({ largura: 96, altura: 96 })
        .then((c) => salvarCom(c.dataUri))
        .catch(() => salvarCom());
    } else salvarCom();
  }, []);
  const aplicarPose = useCallback((id: string) => {
    const p = listarPoses().find((x) => x.id === id);
    if (!p) return;
    setCongelado(true);
    setAnimacao(p.clipe);
    (refR.current as unknown as { poseNoTempo?: (c: string, t: number) => void })?.poseNoTempo?.(p.clipe, p.tempo);
    telemetria('p3d_pose_aplicou', { clipe: p.clipe }); // §290
  }, []);

  // mega 44: SCRUB — um passo de pose por clique (funciona congelado)
  const avancarQuadroUi = useCallback((delta: number) => {
    (refR.current as unknown as { avancarQuadro?: (d: number) => void })?.avancarQuadro?.(delta);
  }, []);

  // mega 34: qualidade manual → renderer (auto volta ao adaptativo §528)
  useEffect(() => {
    if (fase !== 'pronto') return;
    refR.current?.definirQualidade(qualidade);
    if (qualidade !== 'auto') setTierAtual(qualidade);
    try { localStorage.setItem(CHAVE_QUALIDADE, qualidade); } catch { /* sem storage */ }
  }, [qualidade, fase]);

  // mega 31: CENAS do palco — salvar/aplicar/excluir o setup completo
  const salvarCenaAtual = useCallback(() => {
    const cena = salvarCena({
      personagem: override, fundo: fundo3d, luz: luz3d,
      camera: cameraModo, animacao, marca, qualidade,
    });
    setCenas(listarCenas());
    setAnuncio(cena ? `Cena "${cena.nome}" salva` : 'Limite de 8 cenas atingido');
    if (cena) telemetria('p3d_cena_salvou', { nome: cena.nome }); // §290
  }, [override, fundo3d, luz3d, cameraModo, animacao, marca, qualidade]);

  const aplicarCena = useCallback((c: Cena3d) => {
    trocarPersonagem(c.personagem);
    setFundo3d(c.fundo);
    setLuz3d(c.luz);
    trocarCamera(c.camera);
    setAnimacao(c.animacao);
    setMarca(c.marca);
    setQualidade(c.qualidade);
    setAnuncio(`Cena "${c.nome}" aplicada`);
    telemetria('p3d_cena_aplicou', { nome: c.nome }); // §290
  }, [trocarPersonagem, trocarCamera]);

  const removerCena = useCallback((id: string) => {
    excluirCena(id);
    setCenas(listarCenas());
  }, []);

  // ── megas 226–227 (§175/§175.1): handlers do EDITOR DE SHOWCASE ─────
  /** todos os clipes do personagem atual (o seletor de destaque corta em 6) */
  const todasAnimacoes = useMemo(
    () => indice.find((x) => x.slug === personagem)?.animacoes ?? [],
    [indice, personagem],
  );

  const alternarClipeRoteiro = useCallback((clipe: string) => {
    setRascunho((ra) => ({
      ...ra,
      clipes: ra.clipes.includes(clipe)
        ? ra.clipes.filter((c) => c !== clipe)
        : [...ra.clipes, clipe].slice(0, 4),
    }));
  }, []);

  const tocarRoteiro = useCallback((rot: RoteiroShowcase) => {
    if (apresentando || movReduzido) return;
    setRoteiroAtivo(rot);
    setSinalLocal((n) => n + 1);
    telemetria('p3d_roteiro_tocou', { id: rot.id, clipes: rot.clipes.length }); // §290
  }, [apresentando, movReduzido]);

  const tocarRascunho = useCallback(() => {
    if (!rascunho.clipes.length) { setAnuncio('Escolha ao menos um clipe para o roteiro'); return; }
    tocarRoteiro({ ...rascunho, id: 'rascunho', nome: 'Rascunho', criadoEm: '' });
  }, [rascunho, tocarRoteiro]);

  const guardarRoteiro = useCallback(() => {
    if (!rascunho.clipes.length) { setAnuncio('Escolha ao menos um clipe para salvar'); return; }
    const r2 = salvarRoteiro(rascunho);
    setRoteiros(listarRoteiros());
    setAnuncio(r2 ? `Roteiro "${r2.nome}" salvo` : 'Limite de 6 roteiros atingido');
    if (r2) telemetria('p3d_roteiro_salvou', { clipes: r2.clipes.length }); // §290
  }, [rascunho]);

  const removerRoteiro = useCallback((id: string) => {
    excluirRoteiro(id);
    setRoteiros(listarRoteiros());
    setRoteiroAtivo((ra) => (ra?.id === id ? null : ra));
  }, []);

  /** §175.1: montagem AUTOMÁTICA determinística (regras — nunca IA) */
  const montarAutomatico = useCallback(() => {
    const titulo = tituloPorId(config2d.titulo);
    const auto = montarRoteiroAutomatico({
      raridadeTitulo: titulo?.raridade ?? null,
      temAura: !!estado.equipment.aura,
      animacoes: todasAnimacoes,
    });
    setRascunho(auto);
    setAnuncio('Roteiro montado por regras — coerente com seu avatar (§175.1)');
    telemetria('p3d_roteiro_auto', { clipes: auto.clipes.length }); // §290
  }, [config2d, estado, todasAnimacoes]);

  // mega 39: MODO APRESENTAÇÃO — fullscreen no contêiner (fail-safe sem API)
  const alternarTelaCheia = useCallback(() => {
    const el = refWrap.current;
    if (!el) return;
    if (document.fullscreenElement) { void document.exitFullscreen().catch(() => { /* já saiu */ }); return; }
    if (typeof el.requestFullscreen !== 'function') { setAnuncio('Tela cheia indisponível neste navegador'); return; }
    void el.requestFullscreen()
      .then(() => telemetria('p3d_tela_cheia', { personagem: refPersonagem.current })) // §290
      .catch(() => setAnuncio('Tela cheia bloqueada pelo navegador'));
  }, []);
  useEffect(() => {
    const ao = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', ao);
    return () => document.removeEventListener('fullscreenchange', ao);
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
      r.definirCamera({ modo: cameraModo, distancia: refCam.current.dist, elevacao: refCam.current.elev }); // restaura
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
        <button type="button" className="avst-botao" data-teste="p3d-tentar"
          onClick={() => { refTentativa.current = 0; setRemontagens((n) => n + 1); }}>
          <RefreshCcw size={13} aria-hidden /> Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div ref={refWrap} className="avst5-p3d" data-teste="palco-3d"
      data-apresentando={apresentando || undefined} data-tela-cheia={telaCheia || undefined}>
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
        {/* megas 625-626 (§406/§423, flag as5.assembler3d): CABELO montado
            no esqueleto da base pelo Character Assembler — só aparece
            quando há partes publicadas E a base atual é do rig ubc-v1 */}
        {flag('as5.assembler3d') && partesCabelo.length > 0 && rigAtualEhUbc && (
          <div className="avst5-p3d-personagens avst5-p3d-partes" role="radiogroup"
            aria-label="Cabelo (§423 — assembler §406)" data-teste="p3d-cabelos">
            <button type="button" role="radio" aria-checked={cabelo3d === null}
              className={`avst5-p3d-chip${cabelo3d === null ? ' avst5-p3d-chip-on' : ''}`}
              data-teste="p3d-cabelo-nenhum"
              onClick={() => setCabelo3d(null)}>Sem cabelo</button>
            {partesCabelo.map((pc) => (
              <button key={pc.slug} type="button" role="radio" aria-checked={cabelo3d === pc.slug}
                className={`avst5-p3d-chip${cabelo3d === pc.slug ? ' avst5-p3d-chip-on' : ''}`}
                data-teste={`p3d-cabelo-${pc.slug}`}
                onClick={() => setCabelo3d(pc.slug)}>
                {pc.nome}
              </button>
            ))}
          </div>
        )}
        {/* lote 651–660 (§425, flag as5.cabelo3d): BARBA como slot próprio —
            combina com o cabelo no mesmo esqueleto; material = canal cabelo */}
        {flag('as5.cabelo3d') && partesBarba.length > 0 && rigAtualEhUbc && (
          <div className="avst5-p3d-personagens avst5-p3d-partes" role="radiogroup"
            aria-label="Barba (§425 — combina com o cabelo)" data-teste="p3d-barbas">
            <button type="button" role="radio" aria-checked={barba3d === null}
              className={`avst5-p3d-chip${barba3d === null ? ' avst5-p3d-chip-on' : ''}`}
              data-teste="p3d-barba-nenhuma"
              onClick={() => setBarba3d(null)}>Sem barba</button>
            {partesBarba.map((pb) => (
              <button key={pb.slug} type="button" role="radio" aria-checked={barba3d === pb.slug}
                className={`avst5-p3d-chip${barba3d === pb.slug ? ' avst5-p3d-chip-on' : ''}`}
                data-teste={`p3d-barba-${pb.slug}`}
                onClick={() => setBarba3d(pb.slug)}>
                {pb.nome}
              </button>
            ))}
          </div>
        )}
        {/* megas 637-638 (§415–§417, flag as5.roupas3d): ROUPA por look —
            veste todas as peças do gênero; §415.2 mascara a base coberta */}
        {flag('as5.roupas3d') && partesRoupa.length > 0 && rigAtualEhUbc && (
          <div className="avst5-p3d-personagens avst5-p3d-partes" role="radiogroup"
            aria-label="Roupa (§415–§417 — body masking §415.2)" data-teste="p3d-roupas">
            <button type="button" role="radio" aria-checked={roupa3d === null}
              className={`avst5-p3d-chip${roupa3d === null ? ' avst5-p3d-chip-on' : ''}`}
              data-teste="p3d-roupa-nenhuma"
              onClick={() => setRoupa3d(null)}>Sem roupa</button>
            {([['ranger', 'Ranger'], ['peasant', 'Camponês']] as const).map(([id2, nome]) => (
              <button key={id2} type="button" role="radio" aria-checked={roupa3d === id2}
                className={`avst5-p3d-chip${roupa3d === id2 ? ' avst5-p3d-chip-on' : ''}`}
                data-teste={`p3d-roupa-${id2}`}
                onClick={() => setRoupa3d(id2)}>
                {nome}
              </button>
            ))}
          </div>
        )}
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
          <button type="button" title={transparente ? 'Captura com fundo TRANSPARENTE (PNG alpha)' : 'Captura com o fundo do palco'}
            aria-pressed={transparente} data-teste="p3d-transparente"
            onClick={() => setTransparente((v) => !v)}><Eraser size={13} aria-hidden /></button>
          <button type="button" title="Turntable 360° — 8 ângulos (§508)" data-teste="p3d-turntable"
            onClick={() => void gerarTurntable()}><RotateCw size={13} aria-hidden /></button>
          <button type="button" title="Ficha do personagem — 4 ângulos (§508)" data-teste="p3d-ficha"
            onClick={() => void gerarFicha()}><LayoutPanelTop size={13} aria-hidden /></button>
          <button type="button" title={marca ? 'Marca Dshow LIGADA nas capturas' : 'Marca Dshow desligada'}
            aria-pressed={marca} data-teste="p3d-marca"
            onClick={() => setMarca((v) => !v)}><Grid3x3 size={13} aria-hidden /></button>
          <button type="button" title="Cores do avatar nos materiais 3D (§419)"
            aria-pressed={tinta} data-teste="p3d-tinta"
            onClick={() => setTinta((v) => !v)}><Sparkles size={13} aria-hidden /></button>
          {aoUsarComoAvatar && (
            <button type="button" title="Usar como meu AVATAR (header/perfil)" data-teste="p3d-usar-avatar"
              disabled={salvandoAvatar}
              onClick={() => void usarComoAvatar()}><BadgeCheck size={13} aria-hidden /></button>
          )}
          {podeCompartilhar() && (
            <button type="button" title="Compartilhar a captura" data-teste="p3d-compartilhar"
              onClick={() => void compartilhar3d()}><Share2 size={13} aria-hidden /></button>
          )}
          <button type="button" title="Comparar com o 2D lado a lado" aria-pressed={comparando2d}
            data-teste="p3d-comparar" onClick={() => setComparando2d((v) => !v)}>
            <Columns2 size={13} aria-hidden /></button>
          <button type="button" title={telaCheia ? 'Sair da tela cheia (Esc)' : 'Modo apresentação — tela cheia'}
            aria-pressed={telaCheia} data-teste="p3d-tela-cheia"
            onClick={alternarTelaCheia}>
            {telaCheia ? <Minimize2 size={13} aria-hidden /> : <Maximize2 size={13} aria-hidden />}</button>
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
          <span role="radiogroup" aria-label="Qualidade (§423)" data-teste="p3d-qualidade">
            {(['auto', 'alto', 'medio', 'economico'] as const).map((q2) => (
              <button key={q2} type="button" role="radio" aria-checked={qualidade === q2}
                className={`avst5-p3d-chip${qualidade === q2 ? ' avst5-p3d-chip-on' : ''}`}
                onClick={() => setQualidade(q2)}>
                {q2 === 'auto' ? 'Auto' : q2 === 'alto' ? 'Alta' : q2 === 'medio' ? 'Média' : 'Econ.'}
              </button>
            ))}
          </span>
          <span role="group" aria-label="Ajuste fino da câmera" data-teste="p3d-ajuste-grupo">
            <button type="button" className="avst5-p3d-chip" aria-pressed={ajusteAberto}
              data-teste="p3d-ajuste" title="Zoom e altura da câmera (§453)"
              onClick={() => setAjusteAberto((v) => !v)}>
              <SlidersHorizontal size={11} aria-hidden /> Ajuste
            </button>
            {ajusteAberto && (<>
              <label className="avst5-p3d-slider">Zoom
                <input type="range" min="1.2" max="4" step="0.05" value={camDist} data-teste="p3d-dist"
                  aria-label="Distância da câmera"
                  onChange={(e) => setCamDist(Number(e.target.value))} />
              </label>
              <label className="avst5-p3d-slider">Altura
                <input type="range" min="0.05" max="0.9" step="0.05" value={camElev} data-teste="p3d-elev"
                  aria-label="Elevação da câmera"
                  onChange={(e) => setCamElev(Number(e.target.value))} />
              </label>
              <label className="avst5-p3d-slider">Exposição
                <input type="range" min="0.6" max="1.6" step="0.05" value={exposicao} data-teste="p3d-exp"
                  aria-label="Exposição (tone mapping §458)"
                  onChange={(e) => setExposicao(Number(e.target.value))} />
              </label>
              <label className="avst5-p3d-slider">Marca
                <input type="text" maxLength={16} value={marcaTexto} data-teste="p3d-marca-texto"
                  aria-label="Texto da marca d'água (§372)"
                  onChange={(e) => {
                    setMarcaTexto(e.target.value);
                    try { localStorage.setItem('dshow.avst5.p3d.marca.v1', e.target.value); } catch { /* sem storage */ }
                  }} />
              </label>
            </>)}
          </span>
          {cinemaLigado && (
            <span role="group" aria-label="Cinema do palco (§440–§458)" data-teste="p3d-cinema-grupo">
              <button type="button" className={`avst5-p3d-chip${cinemaAberto ? ' avst5-p3d-chip-on' : ''}`}
                aria-pressed={cinemaAberto} data-teste="p3d-cinema"
                title="Vida, luz de aro, partículas e tone mapping (§440–§458)"
                onClick={() => setCinemaAberto((v) => !v)}>
                <Sparkles size={11} aria-hidden /> Cinema
              </button>
              {cinemaAberto && (<>
                <button type="button" className={`avst5-p3d-chip${vida ? ' avst5-p3d-chip-on' : ''}`}
                  aria-pressed={vida} data-teste="p3d-vida"
                  title="Respiração e micro-movimentos aditivos (§440–§441)"
                  onClick={() => setVida((v) => !v)}>Vida</button>
                <button type="button" className={`avst5-p3d-chip${rim ? ' avst5-p3d-chip-on' : ''}`}
                  aria-pressed={rim} data-teste="p3d-rim"
                  title="Luz de aro na cor de destaque (§452)"
                  onClick={() => setRim((v) => !v)}>Aro</button>
                <button type="button" className={`avst5-p3d-chip${particulas ? ' avst5-p3d-chip-on' : ''}`}
                  aria-pressed={particulas} data-teste="p3d-part"
                  title="Partículas na cor de destaque (§444–§446)"
                  onClick={() => setParticulas((v) => !v)}>Partículas</button>
                <span role="group" aria-label="Tone mapping (§457)" data-teste="p3d-tone">
                  {(['aces', 'agx', 'neutro', 'reinhard'] as const).map((m) => (
                    <button key={m} type="button" data-teste={`p3d-tone-${m}`}
                      className={`avst5-p3d-chip${toneMapa === m ? ' avst5-p3d-chip-on' : ''}`}
                      aria-pressed={toneMapa === m} onClick={() => setToneMapa(m)}>
                      {m === 'aces' ? 'ACES' : m === 'agx' ? 'AgX' : m === 'neutro' ? 'Neutro' : 'Reinhard'}
                    </button>
                  ))}
                </span>
                <label className="avst5-p3d-slider">Ambiente
                  <input type="range" min="0" max="1.2" step="0.05" value={ambiente} data-teste="p3d-amb"
                    aria-label="Intensidade da luz ambiente (§449)"
                    onChange={(e) => setAmbiente(Number(e.target.value))} />
                </label>
                <button type="button" className="avst5-p3d-chip" data-teste="p3d-enq-rosto"
                  title="Aproximar a câmera do rosto (§454)"
                  onClick={() => (refR.current as unknown as { enquadrar?: (a: string) => void })?.enquadrar?.('rosto')}>
                  Rosto
                </button>
                <button type="button" className="avst5-p3d-chip" data-teste="p3d-enq-auto"
                  title="Reenquadrar o personagem inteiro (§454)"
                  onClick={() => (refR.current as unknown as { enquadrar?: (a: string) => void })?.enquadrar?.('auto')}>
                  Enquadrar
                </button>
                {/* lote 331–340 (§176/§457, flag as5.palco3d_cine) */}
                {cineLigado && (<>
                  <span role="group" aria-label="Movimento de câmera (§176)" data-teste="p3d-mov">
                    {/* megas 571–573 (§176.1, flag as5.palco_v3): órbita + composto */}
                    {([['nenhum', 'Fixa'], ['dolly', 'Dolly'], ['panoramica', 'Panorâmica'],
                      ...(flag('as5.palco_v3') ? [['orbita', 'Órbita'], ['composto', 'Composto']] as const : [])] as ReadonlyArray<readonly [typeof movCam, string]>).map(([m, nome]) => (
                      <button key={m} type="button" data-teste={`p3d-mov-${m}`}
                        className={`avst5-p3d-chip${movCam === m ? ' avst5-p3d-chip-on' : ''}`}
                        aria-pressed={movCam === m}
                        title={movReduzido ? 'Indisponível com redução de movimento (§297)' : `Movimento ${nome} (§176)`}
                        disabled={movReduzido && m !== 'nenhum'}
                        onClick={() => setMovCam(m)}>{nome}</button>
                    ))}
                  </span>
                  <button type="button" className={`avst5-p3d-chip${posFx ? ' avst5-p3d-chip-on' : ''}`}
                    aria-pressed={posFx} data-teste="p3d-pos"
                    title="Pós-processamento leve: vinheta + saturação (§457; sai no tier econômico §177.1)"
                    onClick={() => setPosFx((v) => !v)}>Pós</button>
                </>)}
              </>)}
            </span>
          )}
          {poses.filter((p3) => p3.personagem === personagem).length > 0 && (
            <span role="group" aria-label="Poses salvas (§442)" data-teste="p3d-poses">
              {poses.filter((p3) => p3.personagem === personagem).map((p3) => (
                <span key={p3.id} className="avst5-p3d-cena">
                  <button type="button" className="avst5-p3d-chip" title={`${p3.clipe} @ ${p3.tempo.toFixed(2)}s`}
                    onClick={() => aplicarPose(p3.id)}>
                    {/* mega 335 (§443 v2): thumb capturado ao salvar */}
                    {p3.thumb && <img src={p3.thumb} alt="" width={18} height={18} data-teste="pose-thumb"
                      style={{ borderRadius: 4, marginRight: 4, verticalAlign: 'middle' }} />}
                    {p3.nome}
                  </button>
                  <button type="button" className="avst5-p3d-cena-x" aria-label={`Excluir ${p3.nome}`}
                    onClick={() => { excluirPose(p3.id); setPoses(listarPoses()); }}>×</button>
                </span>
              ))}
            </span>
          )}
          <span role="group" aria-label="Cenas salvas do palco" data-teste="p3d-cenas">
            <button type="button" className="avst5-p3d-chip" data-teste="p3d-cena-salvar"
              title="Salvar o setup atual (personagem, fundo, luz, câmera, animação)"
              disabled={cenas.length >= 8} onClick={salvarCenaAtual}>
              <BookmarkPlus size={11} aria-hidden /> Cena
            </button>
            {cenas.map((c2) => (
              <span key={c2.id} className="avst5-p3d-cena">
                <button type="button" className="avst5-p3d-chip" title={`Aplicar a cena ${c2.nome}`}
                  onClick={() => aplicarCena(c2)}>{c2.nome}</button>
                <button type="button" className="avst5-p3d-cena-x" aria-label={`Excluir a cena ${c2.nome}`}
                  onClick={() => removerCena(c2.id)}>×</button>
              </span>
            ))}
          </span>
          {editorLigado && (
            <span role="group" aria-label="Editor de showcase (§175)">
              <button type="button" className={`avst5-p3d-chip${editorAberto ? ' avst5-p3d-chip-on' : ''}`}
                aria-pressed={editorAberto} data-teste="p3d-editor"
                title="Editor de showcase — monte sua apresentação (§175)"
                onClick={() => setEditorAberto((v) => !v)}>
                <Clapperboard size={11} aria-hidden /> Showcase
              </button>
            </span>
          )}
        </div>
        {editorLigado && editorAberto && (
          <div className="avst5-p3d-editor" data-teste="p3d-editor-painel"
            role="group" aria-label="Editor de showcase (§175)">
            <span className="avst5-p3d-editor-rotulo">Clipes (na ordem · até 4)</span>
            <span role="group" aria-label="Clipes do roteiro" data-teste="p3d-rot-clipes">
              {(todasAnimacoes.length ? todasAnimacoes : ['Idle']).map((a2) => {
                const idx = rascunho.clipes.indexOf(a2);
                return (
                  <button key={a2} type="button" aria-pressed={idx >= 0}
                    className={`avst5-p3d-chip${idx >= 0 ? ' avst5-p3d-chip-on' : ''}`}
                    data-teste={`p3d-rot-clipe-${a2}`}
                    onClick={() => alternarClipeRoteiro(a2)}>
                    {idx >= 0 ? `${idx + 1}· ` : ''}{a2}
                  </button>
                );
              })}
            </span>
            <label className="avst5-p3d-slider">Duração/clipe
              <input type="range" min="1200" max="5000" step="200" value={rascunho.duracaoClipeMs}
                aria-label="Duração por clipe (ms)" data-teste="p3d-rot-duracao"
                onChange={(e) => setRascunho((ra) => ({ ...ra, duracaoClipeMs: Number(e.target.value) }))} />
              <em>{(rascunho.duracaoClipeMs / 1000).toFixed(1)}s</em>
            </label>
            <span role="radiogroup" aria-label="Câmera do showcase" data-teste="p3d-rot-camera">
              {(['cinematica', 'orbita'] as const).map((cm) => (
                <button key={cm} type="button" role="radio" aria-checked={rascunho.camera === cm}
                  className={`avst5-p3d-chip${rascunho.camera === cm ? ' avst5-p3d-chip-on' : ''}`}
                  onClick={() => setRascunho((ra) => ({ ...ra, camera: cm }))}>
                  {cm === 'cinematica' ? 'Cinemática' : 'Órbita'}
                </button>
              ))}
            </span>
            <span role="radiogroup" aria-label="Luz durante o showcase" data-teste="p3d-rot-luz">
              <Lightbulb size={11} aria-hidden />
              {([['', 'Do palco'], ['estudio', 'Estúdio'], ['quente', 'Quente'], ['fria', 'Fria'], ['neon', 'Neon']] as const).map(([lz, nome]) => (
                <button key={lz || 'palco'} type="button" role="radio"
                  aria-checked={(rascunho.luz ?? '') === lz}
                  className={`avst5-p3d-chip${(rascunho.luz ?? '') === lz ? ' avst5-p3d-chip-on' : ''}`}
                  onClick={() => setRascunho((ra) => {
                    const { luz: _l, ...resto } = ra;
                    return lz === '' ? resto : { ...resto, luz: lz };
                  })}>{nome}</button>
              ))}
            </span>
            <span role="radiogroup" aria-label="Cenário durante o showcase" data-teste="p3d-rot-fundo">
              {([['', 'Do palco'], ['neutro', 'Neutro'], ['estudio', 'Estúdio'], ['grade', 'Grade']] as const).map(([fd, nome]) => (
                <button key={fd || 'palco'} type="button" role="radio"
                  aria-checked={(rascunho.fundo ?? '') === fd}
                  className={`avst5-p3d-chip${(rascunho.fundo ?? '') === fd ? ' avst5-p3d-chip-on' : ''}`}
                  onClick={() => setRascunho((ra) => {
                    const { fundo: _f, ...resto } = ra;
                    return fd === '' ? resto : { ...resto, fundo: fd };
                  })}>{nome}</button>
              ))}
            </span>
            <span role="radiogroup" aria-label="Encerramento" data-teste="p3d-rot-fim">
              {(['Idle', 'Wave'] as const).map((fim) => (
                <button key={fim} type="button" role="radio" aria-checked={rascunho.encerramento === fim}
                  className={`avst5-p3d-chip${rascunho.encerramento === fim ? ' avst5-p3d-chip-on' : ''}`}
                  onClick={() => setRascunho((ra) => ({ ...ra, encerramento: fim }))}>
                  {fim === 'Idle' ? 'Fim neutro' : 'Fim com aceno'}
                </button>
              ))}
            </span>
            <span role="group" aria-label="Ações do roteiro">
              <button type="button" className="avst5-p3d-chip" data-teste="p3d-rot-auto"
                title="Montagem por REGRAS, coerente com raridade/aura (§175.1) — nunca IA"
                onClick={montarAutomatico}>
                <Wand2 size={11} aria-hidden /> Montar pra mim
              </button>
              <button type="button" className="avst5-p3d-chip" data-teste="p3d-rot-tocar"
                disabled={apresentando || movReduzido || rascunho.clipes.length === 0}
                onClick={tocarRascunho}>
                <Play size={11} aria-hidden /> Tocar
              </button>
              <button type="button" className="avst5-p3d-chip" data-teste="p3d-rot-salvar"
                disabled={roteiros.length >= 6 || rascunho.clipes.length === 0}
                onClick={guardarRoteiro}>
                <BookmarkPlus size={11} aria-hidden /> Salvar
              </button>
            </span>
            {roteiros.length > 0 && (
              <span role="group" aria-label="Roteiros salvos" data-teste="p3d-rot-salvos">
                {roteiros.map((r3) => (
                  <span key={r3.id} className="avst5-p3d-cena">
                    <button type="button"
                      className={`avst5-p3d-chip${roteiroAtivo?.id === r3.id ? ' avst5-p3d-chip-on' : ''}`}
                      title={`${r3.clipes.join(' → ')} · ${(r3.duracaoClipeMs / 1000).toFixed(1)}s/clipe`}
                      disabled={apresentando || movReduzido}
                      onClick={() => tocarRoteiro(r3)}>{r3.nome}</button>
                    <button type="button" className="avst5-p3d-cena-x" aria-label={`Excluir ${r3.nome}`}
                      onClick={() => removerRoteiro(r3.id)}>×</button>
                  </span>
                ))}
              </span>
            )}
          </div>
        )}
        {hudLigado && hud && (
          <div className="avst5-p3d-hud" data-teste="p3d-hud" role="note">
            <Activity size={10} aria-hidden /> {hud.fps}fps · {hud.tier} · {hud.triangulos.toLocaleString('pt-BR')}△
          </div>
        )}
        {congelado && (
          <div className="avst5-p3d-congelado" role="status" data-teste="p3d-congelado">Pose congelada (espaço retoma)</div>
        )}
        {congelado && (
          <div className="avst5-p3d-quadros" data-teste="p3d-quadros" role="group" aria-label="Passo a passo da pose">
            <button type="button" title="Quadro anterior (mega 44)" data-teste="p3d-quadro-tras"
              onClick={() => avancarQuadroUi(-0.15)}><SkipBack size={13} aria-hidden /></button>
            <button type="button" title="Próximo quadro (mega 44)" data-teste="p3d-quadro-frente"
              onClick={() => avancarQuadroUi(0.15)}><SkipForward size={13} aria-hidden /></button>
            <button type="button" title="Salvar esta pose (§443)" data-teste="p3d-pose-salvar"
              onClick={salvarPoseAtual}><BookmarkPlus size={13} aria-hidden /></button>
          </div>
        )}
        {recuperando && (
          <div className="avst5-p3d-congelado avst5-p3d-recuperando" role="status" data-teste="p3d-recuperando">
            Recuperando o 3D…
          </div>
        )}
        {comparando2d && (
          <div className="avst5-p3d-cmp" data-teste="p3d-comparar-painel" aria-label="Comparação com o 2D">
            <AvatarSvg config={config2d} uid="p3dcmp" estatico />
            <span>2D</span>
          </div>
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
        {capturas.length > 0 && (
          <div className="avst5-p3d-capturas" data-teste="p3d-capturas" role="list"
            aria-label="Últimas capturas desta sessão">
            {capturas.map((c3, i) => (
              <button key={`${i}-${c3.slice(-16)}`} type="button" role="listitem"
                title="Baixar esta captura de novo"
                onClick={() => { const a = document.createElement('a'); a.href = c3; a.download = `dshow-captura-${i + 1}.png`; a.click(); }}>
                <img src={c3} alt={`Captura ${i + 1}`} width={40} height={40} />
              </button>
            ))}
          </div>
        )}
        <span className="avst5-sr-only" role="status" aria-live="polite">{anuncio}</span>
        <div className="avst5-p3d-nota" role="note" data-teste="p3d-pendencias">
          {override === null ? 'Auto pela espécie 2D' : 'Personagem fixado'}
          {capacidade.software ? ' · render por software' : ''}
          {qualidade !== 'auto'
            ? ` · qualidade ${qualidade === 'economico' ? 'econômica' : qualidade === 'medio' ? 'média' : 'alta'}`
            : tierAtual ? ` · qualidade ${tierAtual === 'economico' ? 'econômica (auto)' : `${tierAtual} (auto)`}` : ''}
          {pendencias > 0 ? ` · ${Math.max(0, pendencias - aproximados)} item(ns) só no 2D` : ''}
          {aproximados > 0 ? ` · ${aproximados} aproximado(s) no 3D` : ''}
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
