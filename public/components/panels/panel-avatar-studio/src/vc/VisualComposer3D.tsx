// vc/VisualComposer3D.tsx — MODO 3D do Visual Composer (rodada DESIGN OVERHAUL).
// Ferramenta visual: clicar no avatar → escolher visualmente (miniatura real) → aplicar.
// Reusa o MOTOR 3D existente (Canvas/Cena3D/Clima3D/Personagem3D/CameraRig3D/Poder3D) —
// nenhum renderer/câmera/histórico/save novo. Miniaturas dos assets são geradas pelo próprio
// renderer (forja offscreen + cache), com fallback de silhueta — nunca card de texto.
// Modularidade REAL (catalogo3d): outfit (config.roupa) e cabeça/cabelo (config.cabeca) são
// independentes e mixáveis. Looks completos = presets que definem os dois juntos.
// Acessórios procedurais removidos (decisão #55) → estado "Novos modelos em preparação".
import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import {
  ChevronLeft, ChevronRight, Undo2, Redo2, Save, MoreHorizontal, RotateCcw, Move, PersonStanding,
  Scissors, Smile, Shirt, Glasses, ShieldAlert, MonitorX, Check, X, Image as ImageIcon,
  History, Camera, Target, Trophy, Stethoscope, ArrowLeft, Download, PackageOpen,
  Film, PlayCircle, Gauge, PanelRightClose, PanelRightOpen,
} from 'lucide-react';
import { salvar3D } from '../services/AvatarService';
import type { AvatarStore } from '../nucleo/estado';
import type { AvatarConfig } from '../domain/types';
const Historico3D = lazy(() => import('../components/Historico').then((m) => ({ default: m.Historico })));
const Conquistas3D = lazy(() => import('../components/Conquistas').then((m) => ({ default: m.Conquistas })));
const Missoes3D = lazy(() => import('../shell/Missoes').then((m) => ({ default: m.Missoes })));
const carregando3d = <div className="vc3d-carregando" role="status">Carregando…</div>;
import {
  CAMERAS, CORES_3D, CONFIG3D_PADRAO,
} from '../poc3d/catalogo3d';
import type {
  ArquetipoId, CameraId, CenarioId, ClimaId, Config3D, HoraId, IluminacaoId, SlotMaterial, VarianteHumanoId,
} from '../poc3d/catalogo3d';
import { Personagem3D } from '../poc3d/Personagem3D';
import type { Gesto } from '../poc3d/Personagem3D';
import { Cena3D } from '../poc3d/Cena3D';
import { Clima3D } from '../poc3d/Clima3D';
import { Poder3D } from '../poc3d/Poder3D';
import type { FasePoder } from '../poc3d/Poder3D';
import { CameraRig3D } from '../poc3d/CameraRig3D';
import { Hud3D } from '../poc3d/Hud3D';
import type { Metricas } from '../poc3d/Hud3D';
import '../styles/visual-composer.css';

type Qualidade = 'alto' | 'medio' | 'economico';
const DPR: Record<Qualidade, number | [number, number]> = { alto: [1, 2], medio: 1, economico: 0.75 };
const VARIANTES: VarianteHumanoId[] = ['casual', 'terno', 'punk', 'aventureiro'];

// Rail unificado com o 2D (partes do corpo + Cenário). Cenário abre o subpainel Cena do "Mais".
type Cat3D = 'personagem' | 'cabelo' | 'rosto' | 'roupa' | 'acessorios' | 'cenario';
const CATS: { id: Cat3D; nome: string; Icone: typeof PersonStanding }[] = [
  { id: 'personagem', nome: 'Personagem', Icone: PersonStanding },
  { id: 'cabelo', nome: 'Cabelo', Icone: Scissors },
  { id: 'rosto', nome: 'Rosto', Icone: Smile },
  { id: 'roupa', nome: 'Roupa', Icone: Shirt },
  { id: 'acessorios', nome: 'Acessórios', Icone: Glasses },
  { id: 'cenario', nome: 'Cenário', Icone: ImageIcon },
];
const ICONE_CAT: Record<Cat3D, typeof PersonStanding> = {
  personagem: PersonStanding, cabelo: Scissors, rosto: Smile, roupa: Shirt, acessorios: Glasses, cenario: ImageIcon,
};
// auto-enquadramento por categoria (§4): o que edito domina o viewport.
const FOCO_CAT: Record<Cat3D, CameraId> = { personagem: 'corpo', cabelo: 'rosto', rosto: 'rosto', roupa: 'corpo', acessorios: 'busto', cenario: 'corpo' };

function categoriaDoMesh(nome: string): Cat3D {
  const n = nome.toLowerCase();
  if (/_head$|hair|eyebrow|face|head/.test(n)) return 'cabelo';
  if (/backpack|soc_|drone|pet|coroa|halo|colar|jetpack|asas|cetro|socket/.test(n)) return 'acessorios';
  if (/_body$|_legs$|_feet$|suit|shirt|belt|tie|purple|green|red|main|cloth/.test(n)) return 'roupa';
  return 'personagem';
}

const ROTULO_ARQ: Record<ArquetipoId, string> = { humano: 'Humano', androide: 'Androide', animal: 'Pug' };
// nomes amigáveis dos looks/trajes (sem slugs internos): terno → "Social"
const ROTULO_LOOK: Record<VarianteHumanoId, string> = { casual: 'Casual', terno: 'Social', punk: 'Punk', aventureiro: 'Aventureiro' };
const ROTULO_CAM: Record<CameraId, string> = { corpo: 'Corpo', busto: 'Busto', rosto: 'Rosto', tresquartos: '¾' };
const ROTULO_ILUM: Record<IluminacaoId, string> = { estudio: 'Estúdio', dramatica: 'Dramática', neon: 'Neon' };
const ROTULO_CEN: Record<CenarioId, string> = { vazio: 'Palco vazio', grade: 'Grade neon', estrelas: 'Céu estrelado', dojo: 'Dojo' };
const ROTULO_HORA: Record<HoraId, string> = { estudio: 'Estúdio', dia: 'Dia', entardecer: 'Entardecer', noite: 'Noite' };
const ROTULO_CLIMA: Record<ClimaId, string> = { limpo: 'Limpo', chuva: 'Chuva', neve: 'Neve', vagalumes: 'Vagalumes' };
const NOME_COR: Record<SlotMaterial, string> = { pele: 'Pele', cabelo: 'Cabelo', roupa: 'Roupa', detalhe: 'Detalhe' };
// prévia representativa (procedural) de cada cenário — gradiente, sem download
const GRAD_CEN: Record<CenarioId, string> = {
  vazio: 'linear-gradient(180deg,#12141b,#0a0c12)',
  grade: 'linear-gradient(180deg,#131a2e,#0a0d16 60%),repeating-linear-gradient(90deg,#0000,#0000 14px,#22d3ee22 14px,#22d3ee22 15px)',
  estrelas: 'radial-gradient(circle at 30% 30%,#20306a,#05070f 70%)',
  dojo: 'linear-gradient(180deg,#3a1f22,#160b10)',
};

type Classe3D = 'nativo' | 'necessario' | 'so2d';
const ROTULO_CLASSE: Record<Classe3D, string> = { nativo: 'Disponível', necessario: 'Modelo 3D necessário', so2d: 'Somente 2D' };

function temWebGL2(): boolean { try { const c = document.createElement('canvas'); return Boolean(c.getContext('webgl2')); } catch { return false; } }

// ───────────────────────── FORJA DE MINIATURAS 3D ─────────────────────────
// Renderiza cada asset uma vez, offscreen, no PRÓPRIO renderer; guarda o PNG em
// cache (chave estável, paleta neutra → não re-render por cor). Sequencial: 1 job
// por vez em um único Canvas oculto (2 contextos WebGL no total). Falha/timeout →
// cache '' e o card cai para silhueta (nunca card de texto).
const thumbCache = new Map<string, string>();
interface JobThumb { chave: string; config: Config3D; preset: CameraId }

function configLook(v: VarianteHumanoId): Config3D { return { ...CONFIG3D_PADRAO, arquetipo: 'humano', roupa: v, cabeca: v, mochila: v === 'aventureiro' }; }
function configCabeca(v: VarianteHumanoId): Config3D { return { ...CONFIG3D_PADRAO, arquetipo: 'humano', cabeca: v, roupa: 'casual' }; }
function configRoupa(v: VarianteHumanoId): Config3D { return { ...CONFIG3D_PADRAO, arquetipo: 'humano', roupa: v, cabeca: 'casual', mochila: v === 'aventureiro' }; }
function configArq(a: ArquetipoId): Config3D { return { ...CONFIG3D_PADRAO, arquetipo: a, roupa: 'casual', cabeca: 'casual' }; }

function CamFixaThumb({ arquetipo, preset }: { arquetipo: ArquetipoId; preset: CameraId }) {
  const cam = useThree((s) => s.camera);
  useEffect(() => {
    const c = CAMERAS[arquetipo]?.[preset] ?? CAMERAS.humano.corpo;
    cam.position.set(c.pos[0], c.pos[1], c.pos[2]);
    cam.lookAt(new THREE.Vector3(c.alvo[0], c.alvo[1], c.alvo[2]));
  }, [arquetipo, preset, cam]);
  return null;
}

function CapturaThumb({ chave, aoCapturar }: { chave: string; aoCapturar: (chave: string, url: string) => void }) {
  const gl = useThree((s) => s.gl);
  const n = useRef(0);
  const feito = useRef(false);
  useEffect(() => { n.current = 0; feito.current = false; }, [chave]);
  useFrame(() => {
    if (feito.current) return;
    n.current += 1;
    if (n.current >= 34) {
      feito.current = true;
      let url = '';
      try { url = gl.domElement.toDataURL('image/png'); } catch { url = ''; }
      aoCapturar(chave, url);
    }
  });
  return null;
}

function ForjaThumbs({ jobs, aoConcluir }: { jobs: JobThumb[]; aoConcluir: (chave: string, url: string) => void }) {
  const atual = jobs.find((j) => !thumbCache.has(j.chave));
  // timeout de segurança: se um job não capturar em ~6s, marca falho e segue
  useEffect(() => {
    if (!atual) return undefined;
    const t = setTimeout(() => { if (!thumbCache.has(atual.chave)) aoConcluir(atual.chave, ''); }, 6000);
    return () => clearTimeout(t);
  }, [atual, aoConcluir]);
  if (!atual) return null;
  return (
    <div className="vc3d-forja" aria-hidden>
      <Canvas dpr={1} gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' }}
        camera={{ fov: 32, near: 0.1, far: 40, position: [0, 1.35, 3.6] }}>
        <Cena3D iluminacao="estudio" cenario="vazio" hora="estudio" corDestaque="#7c5cff" sombras={false} />
        <Suspense fallback={null}>
          <group key={atual.chave}>
            <Personagem3D config={atual.config} corDestaque={atual.config.cores.detalhe} gesto={null} aoTerminarGesto={() => {}} />
          </group>
        </Suspense>
        <CamFixaThumb arquetipo={atual.config.arquetipo} preset={atual.preset} />
        <CapturaThumb key={atual.chave} chave={atual.chave} aoCapturar={aoConcluir} />
      </Canvas>
    </div>
  );
}

class GuardaErro extends Component<{ aoTentar: () => void; children: ReactNode }, { erro: boolean }> {
  state = { erro: false };
  static getDerivedStateFromError() { return { erro: true }; }
  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="vc3d-erro">
        <ShieldAlert size={26} aria-hidden />
        <p>Um asset 3D falhou ao carregar — o personagem foi preservado.</p>
        <button type="button" className="vc-acao" onClick={() => { this.setState({ erro: false }); this.props.aoTentar(); }}>Tentar de novo</button>
      </div>
    );
  }
}

export interface PropsVisualComposer3D {
  store: AvatarStore;
  config3d: Config3D;
  aoMudar3d: (c: Config3D) => void;
  podeDesfazer: boolean; podeRefazer: boolean; desfazer: () => void; refazer: () => void;
  mudancas?: number;
  versaoBase: number;
  aoVoltar2D: () => void;
  aoMais?: () => void;
  reduzido?: boolean;
  config2d?: AvatarConfig;
  aplicar2d?: (c: AvatarConfig) => void;
  vida?: unknown;
  aoClassico?: () => void;
}

// ───────────────────────────── CARD VISUAL ─────────────────────────────
function CardAsset({ nome, thumb, ativo, onClick, classe, Placeholder }: {
  nome: string; thumb?: string; ativo: boolean; onClick?: () => void; classe?: Classe3D; Placeholder?: typeof PersonStanding;
}) {
  const Icone = Placeholder ?? PersonStanding;
  return (
    <button type="button" className={`vc-card-btn vc3d-card ${ativo ? 'vc-card-on' : ''}`} data-classe={classe ?? 'nativo'} aria-pressed={ativo} onClick={onClick} title={nome}>
      <span className="vc3d-thumb" style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}>
        {!thumb && <span className="vc3d-thumb-vazio"><Icone size={26} aria-hidden /></span>}
        {ativo && <span className="vc-badge vc-badge-eq" aria-hidden><Check size={13} /></span>}
      </span>
      <span className="vc-card-nome">{nome}</span>
      {classe && classe !== 'nativo' && <span className="vc3d-classe" data-c={classe}>{ROTULO_CLASSE[classe]}</span>}
    </button>
  );
}

// card simples (câmera/movimento/qualidade) — ícone + rótulo, não é asset
function CardControle({ nome, ativo, onClick, Icone, val }: { nome: string; ativo: boolean; onClick?: () => void; Icone?: typeof Camera; val?: string }) {
  return (
    <button type="button" className={`vc-card-btn vc3d-card vc3d-card-ctrl ${ativo ? 'vc-card-on' : ''}`} aria-pressed={ativo} onClick={onClick} title={nome}>
      {Icone && <span className="vc3d-thumb vc3d-thumb-ctrl"><Icone size={24} aria-hidden />{ativo && <span className="vc-badge vc-badge-eq" aria-hidden><Check size={13} /></span>}</span>}
      <span className="vc-card-nome">{nome}</span>
      {val && <span className="vc3d-classe">{val}</span>}
    </button>
  );
}

function VazioPreparo({ texto }: { texto: string }) {
  return (
    <div className="vc3d-vazio">
      <PackageOpen aria-hidden />
      <strong>Novos modelos em preparação</strong>
      <span>{texto}</span>
    </div>
  );
}

// aplica/limpa destaque de região (emissivo) por categoria — reversível
function aplicarDestaque(root: THREE.Object3D | null, catAlvo: Cat3D | null) {
  if (!root) return;
  root.traverse((o) => {
    const malha = o as THREE.Mesh;
    if (!malha.isMesh) return;
    const mats = Array.isArray(malha.material) ? malha.material : [malha.material];
    const alvo = catAlvo != null && categoriaDoMesh(malha.name) === catAlvo;
    for (const mat of mats) {
      const s = mat as THREE.MeshStandardMaterial;
      if (!s || !s.emissive) continue;
      s.emissive.set(alvo ? '#7c3aed' : '#000000');
      if ('emissiveIntensity' in s) s.emissiveIntensity = alvo ? 0.4 : 0;
    }
  });
}

export default function VisualComposer3D({ store, config3d, aoMudar3d, podeDesfazer, podeRefazer, desfazer, refazer, mudancas = 0, versaoBase, aoVoltar2D, config2d, aplicar2d, vida, aoClassico }: PropsVisualComposer3D) {
  const suportado = useRef(temWebGL2());
  const [cat, setCat] = useState<Cat3D>('personagem');
  const [gesto, setGesto] = useState<Gesto>(null);
  const [fasePoder, setFasePoder] = useState<FasePoder>('inativo');
  const [qualidade, setQualidade] = useState<Qualidade>('alto');
  const [autoQualidade, setAutoQualidade] = useState(true);
  const [chaveCena, setChaveCena] = useState(0);
  const [pan, setPan] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [cam, setCam] = useState<CameraId>(config3d.camera);
  const [salv, setSalv] = useState<'idle' | 'salvando' | 'salvo' | 'erro'>('idle');
  const [gaveta, setGaveta] = useState<'recolhida' | 'meio' | 'expandida'>('meio');
  const [painelOff, setPainelOff] = useState(false);
  const [mais3d, setMais3d] = useState(false);
  const [maisSub, setMaisSub] = useState<null | 'cena' | 'movimento' | 'camera' | 'qualidade' | 'historico' | 'progresso' | 'missoes' | 'evolucao'>(null);
  const [capturando, setCapturando] = useState(false);
  const [capturaImg, setCapturaImg] = useState<string | null>(null);
  const [hoverCat, setHoverCat] = useState<Cat3D | null>(null);
  const [thumbVer, setThumbVer] = useState(0);            // incrementa quando a forja conclui
  const [anuncio, setAnuncio] = useState('');
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const grupoRef = useRef<THREE.Group | null>(null);
  const quedas = useRef(0);
  const focoRef = useRef<HTMLElement | null>(null);

  const abrirMais = useCallback((sub: typeof maisSub = null) => { focoRef.current = (document.activeElement as HTMLElement) ?? null; setMaisSub(sub); setMais3d(true); }, []);
  const fecharMais = useCallback(() => { setMais3d(false); setMaisSub(null); const t = focoRef.current; if (t && typeof t.focus === 'function') setTimeout(() => t.focus(), 0); }, []);

  const config = config3d;
  const arqueHumano = config.arquetipo === 'humano';
  const mudar = useCallback((parcial: Partial<Config3D>) => { aoMudar3d({ ...config, ...parcial }); setSalv('idle'); }, [config, aoMudar3d]);

  const aoConcluirThumb = useCallback((chave: string, url: string) => { thumbCache.set(chave, url); setThumbVer((v) => v + 1); }, []);
  const thumb = useCallback((chave: string): string | undefined => { const u = thumbCache.get(chave); return u || undefined; }, []);

  // jobs de miniatura só da categoria ativa (lazy) — evita renderizar tudo de uma vez
  const jobs = useMemo<JobThumb[]>(() => {
    void thumbVer;
    const list: JobThumb[] = [];
    if (cat === 'personagem') {
      (['humano', 'androide', 'animal'] as ArquetipoId[]).forEach((a) => list.push({ chave: `arq:${a}`, config: configArq(a), preset: 'corpo' }));
      if (arqueHumano) VARIANTES.forEach((v) => list.push({ chave: `look:${v}`, config: configLook(v), preset: 'corpo' }));
    } else if (cat === 'cabelo' && arqueHumano) {
      VARIANTES.forEach((v) => list.push({ chave: `cab:${v}`, config: configCabeca(v), preset: 'busto' }));
    } else if (cat === 'roupa' && arqueHumano) {
      VARIANTES.forEach((v) => list.push({ chave: `rou:${v}`, config: configRoupa(v), preset: 'corpo' }));
    }
    return list.filter((j) => !thumbCache.has(j.chave));
  }, [cat, arqueHumano, thumbVer]);

  const irPara = useCallback((c: Cat3D) => {
    if (c === 'cenario') { abrirMais('cena'); setAnuncio('Cena e ambiente'); return; }
    setCat(c); setCam(FOCO_CAT[c]); setPainelOff(false);
    setAnuncio(`Editar ${CATS.find((x) => x.id === c)?.nome ?? c}`);
    if (window.matchMedia?.('(max-width: 768px)').matches) setGaveta('meio');
  }, [abrirMais]);

  const aoMedir = useCallback((m: Metricas) => {
    if (!autoQualidade) return;
    quedas.current = m.fps < 28 ? quedas.current + 1 : 0;
    if (quedas.current >= 3) { quedas.current = 0; setQualidade((q) => (q === 'alto' ? 'medio' : 'economico')); }
  }, [autoQualidade]);

  const aoClicarMesh = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    irPara(categoriaDoMesh(e.object?.name || ''));
  }, [irPara]);
  const aoMoverMesh = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const c = categoriaDoMesh(e.object?.name || '');
    setHoverCat((prev) => (prev === c ? prev : c));
    try { document.body.style.cursor = 'pointer'; } catch { /* ok */ }
  }, []);
  const aoSairMesh = useCallback(() => { setHoverCat(null); try { document.body.style.cursor = ''; } catch { /* ok */ } }, []);

  // destaque persistente da categoria selecionada; hover sobrepõe. Reaplica ao trocar config.
  useEffect(() => {
    const alvo = hoverCat ?? (cat === 'cenario' || cat === 'acessorios' ? null : cat);
    const id = window.setTimeout(() => aplicarDestaque(grupoRef.current, alvo), 60);
    return () => window.clearTimeout(id);
  }, [hoverCat, cat, config, chaveCena]);

  useEffect(() => {
    const w = window as unknown as { __vc3dRota?: (n: string) => Cat3D; __vc3dPronto?: boolean; __vc3dEstado?: () => Config3D & { camera: CameraId } };
    w.__vc3dRota = (n: string) => { const c = categoriaDoMesh(n); irPara(c); return c; };
    w.__vc3dEstado = () => ({ ...config, camera: cam });
    w.__vc3dPronto = suportado.current;
    return () => { try { delete w.__vc3dRota; delete w.__vc3dEstado; } catch { /* ok */ } };
  }, [config, cam, irPara]);

  const capturaQuadrada = useCallback((): string | null => {
    const gl = glRef.current; if (!gl) return null;
    try {
      const fonte = gl.domElement; const lado = Math.min(fonte.width, fonte.height);
      const alvo = document.createElement('canvas'); alvo.width = 480; alvo.height = 480;
      const ctx = alvo.getContext('2d'); if (!ctx) return null;
      ctx.drawImage(fonte, (fonte.width - lado) / 2, (fonte.height - lado) / 2, lado, lado, 0, 0, 480, 480);
      return alvo.toDataURL('image/png');
    } catch { return null; }
  }, []);

  // captura LIMPA: sem glow de seleção baked no PNG salvo
  const capturaLimpa = useCallback(async (): Promise<string | null> => {
    aplicarDestaque(grupoRef.current, null);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const png = capturaQuadrada();
    aplicarDestaque(grupoRef.current, hoverCat ?? (cat === 'cenario' || cat === 'acessorios' ? null : cat));
    return png;
  }, [capturaQuadrada, hoverCat, cat]);

  const salvar = useCallback(async () => {
    if (salv === 'salvando') return;
    setSalv('salvando');
    const png = await capturaLimpa();
    if (!png) { setSalv('erro'); return; }
    try {
      const r = await salvar3D({ ...config, camera: cam }, png, versaoBase, config.cores.detalhe);
      if (r.ok) { setSalv('salvo'); if (typeof r.versao === 'number') { try { store.confirmarPersistencia(r.versao); } catch { /* ok */ } } }
      else setSalv('erro');
    } catch { setSalv('erro'); }
  }, [salv, capturaLimpa, config, cam, versaoBase, store]);

  const resetarCamera = useCallback(() => { setResetToken((t) => t + 1); setCam(FOCO_CAT[cat === 'cenario' ? 'personagem' : cat]); }, [cat]);

  const capturarPalco = useCallback(async () => {
    setMais3d(false); setMaisSub(null); setCapturando(true);
    aplicarDestaque(grupoRef.current, null);
    await new Promise((r) => setTimeout(r, 360));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const png = capturaQuadrada();
    setCapturando(false);
    setCapturaImg(png);
  }, [capturaQuadrada]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); if (e.shiftKey) refazer(); else desfazer(); }
      else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); refazer(); }
      else if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); void salvar(); }
      else if (k === 'escape') { if (capturaImg) setCapturaImg(null); else if (maisSub) setMaisSub(null); else if (mais3d) fecharMais(); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [desfazer, refazer, salvar, capturaImg, maisSub, mais3d, fecharMais]);

  if (!suportado.current) {
    return (
      <div className="vc-root" data-vc data-modo="3d">
        <header className="vc-barra">
          <button className="vc-acao" onClick={aoVoltar2D} aria-label="Voltar ao 2D"><ChevronLeft size={18} aria-hidden /><span className="vc-lbl">Voltar</span></button>
          <div className="vc-titulo">Avatar Studio</div>
        </header>
        <div className="vc3d-erro vc3d-sem-webgl">
          <MonitorX size={30} aria-hidden />
          <p><strong>Este dispositivo não expõe WebGL2.</strong><br />O modo 3D fica indisponível aqui — seu avatar segue no modo 2D (fallback oficial).</p>
          <button type="button" className="vc-salvar" onClick={aoVoltar2D}>Voltar ao 2D</button>
        </div>
      </div>
    );
  }

  const cardsCor = (slot: SlotMaterial) => (
    <div className="vc3d-cor-linha" role="radiogroup" aria-label={`Cor de ${NOME_COR[slot]}`}>
      {CORES_3D[slot].map((cor) => (
        <button key={cor} type="button" role="radio" aria-checked={config.cores[slot] === cor} aria-label={cor}
          className={`vc-cor-sw ${config.cores[slot] === cor ? 'vc-cor-sw-on' : ''}`} style={{ background: cor }}
          onClick={() => mudar({ cores: { ...config.cores, [slot]: cor } })}>{config.cores[slot] === cor && <Check size={12} aria-hidden />}</button>
      ))}
    </div>
  );

  const catAtual = CATS.find((c) => c.id === cat);
  const chipCat = hoverCat ?? cat;
  const ChipIcone = ICONE_CAT[chipCat];

  return (
    <div className={`vc-root ${painelOff ? 'vc-painel-off' : ''}`} data-vc data-modo="3d" data-gaveta={gaveta} data-capturando={capturando ? '' : undefined}>
      <header className="vc-barra">
        <button className="vc-acao vc-icone" onClick={aoVoltar2D} aria-label="Voltar ao 2D"><ChevronLeft size={18} aria-hidden /></button>
        <div className="vc-titulo">Avatar Studio</div>
        <div className="vc-globais">
          <button className="vc-acao vc-icone" onClick={desfazer} disabled={!podeDesfazer} aria-label="Desfazer"><Undo2 size={18} aria-hidden /></button>
          <button className="vc-acao vc-icone" onClick={refazer} disabled={!podeRefazer} aria-label="Refazer"><Redo2 size={18} aria-hidden /></button>
          <button className="vc-salvar" onClick={() => void salvar()} data-estado={salv} aria-label="Salvar">
            {salv === 'salvo' ? <Check size={16} aria-hidden /> : <Save size={16} aria-hidden />}
            {mudancas > 0 && salv !== 'salvo' && <span className="vc-ponto" aria-hidden title={`${mudancas} alterações`} />}
          </button>
          <button className="vc-acao vc-icone" onClick={() => abrirMais(null)} aria-label="Mais" aria-haspopup="menu" aria-expanded={mais3d}><MoreHorizontal size={18} aria-hidden /></button>
        </div>
      </header>

      <div className="vc-corpo">
        <nav className="vc-trilho" aria-label="Partes do avatar">
          {CATS.map((c) => { const Ic = c.Icone; const on = c.id === cat; return (
            <button key={c.id} type="button" title={c.nome} className={`vc-cat ${on ? 'vc-cat-ativa' : ''}`} aria-pressed={on} aria-label={c.nome} onClick={() => irPara(c.id)}>
              <Ic size={22} aria-hidden /><span>{c.nome}</span>
            </button>); })}
        </nav>

        <main className="vc-palco vc3d-palco">
          <GuardaErro aoTentar={() => setChaveCena((k) => k + 1)}>
            <Canvas key={chaveCena} shadows={qualidade !== 'economico'} dpr={DPR[qualidade]}
              gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
              camera={{ fov: 34, near: 0.1, far: 40, position: [0, 1.35, 3.6] }}
              onCreated={(estado) => { glRef.current = estado.gl; }}>
              <Cena3D iluminacao={config.iluminacao} cenario={config.cenario} hora={config.hora} corDestaque={config.cores.detalhe} sombras={qualidade !== 'economico'} />
              <Clima3D clima={config.clima} />
              <Suspense fallback={null}>
                <group ref={grupoRef} onPointerDown={aoClicarMesh} onPointerMove={aoMoverMesh} onPointerOut={aoSairMesh}>
                  <Personagem3D config={config} corDestaque={config.cores.detalhe} gesto={gesto} aoTerminarGesto={() => setGesto(null)} />
                </group>
              </Suspense>
              <Poder3D fase={fasePoder} cor={config.cores.detalhe} aoAvancar={setFasePoder} />
              <CameraRig3D preset={cam} arquetipo={config.arquetipo} pan={pan} resetToken={resetToken} />
              <Hud3D aoMedir={aoMedir} />
            </Canvas>
          </GuardaErro>

          {/* chip da categoria selecionada, junto ao modelo (§3) */}
          {!capturando && <div className="vc-catchip" aria-hidden><ChipIcone /><span>{CATS.find((c) => c.id === chipCat)?.nome}</span></div>}

          {/* controles icônicos de câmera (sem texto no palco) */}
          <div className="vc3d-camera" role="group" aria-label="Câmera">
            <button type="button" className={`vc3d-cam-btn ${pan ? 'on' : ''}`} onClick={() => setPan((v) => !v)} aria-pressed={pan} aria-label="Mover a câmera (pan)"><Move size={15} aria-hidden /></button>
            <button type="button" className="vc3d-cam-btn" onClick={resetarCamera} aria-label="Recentralizar câmera"><RotateCcw size={15} aria-hidden /></button>
          </div>

          {/* recolher/expandir painel (desktop) */}
          <button type="button" className="vc-recolhe-painel" onClick={() => setPainelOff((v) => !v)} aria-label={painelOff ? 'Mostrar painel' : 'Recolher painel'}>
            {painelOff ? <PanelRightOpen size={18} aria-hidden /> : <PanelRightClose size={18} aria-hidden />}
          </button>

          {/* forja de miniaturas (offscreen) */}
          <ForjaThumbs jobs={jobs} aoConcluir={aoConcluirThumb} />
        </main>

        <aside className="vc-painel" id="vc3d-painel" aria-label={`Editar: ${catAtual?.nome}`}>
          <button className="vc-gaveta-alca" aria-label="Altura do painel" onClick={() => setGaveta((s) => s === 'expandida' ? 'meio' : s === 'meio' ? 'recolhida' : 'expandida')}><span /></button>
          <div className="vc-painel-cab">
            <span>{catAtual?.nome}</span>
            <button type="button" className="vc-painel-x" onClick={() => setPainelOff(true)} aria-label="Recolher painel"><ChevronRight size={18} aria-hidden /></button>
          </div>
          <div className="vc3d-corpo-painel">
            {cat === 'personagem' && (<>
              <div className="vc3d-grupo-nome">Arquétipo</div>
              <div className="vc3d-cards">{(['humano', 'androide', 'animal'] as ArquetipoId[]).map((a) => (
                <CardAsset key={a} nome={ROTULO_ARQ[a]} thumb={thumb(`arq:${a}`)} Placeholder={PersonStanding} ativo={config.arquetipo === a} onClick={() => { setGesto(null); setFasePoder('inativo'); mudar({ arquetipo: a }); }} />
              ))}</div>
              {arqueHumano && (<>
                <div className="vc3d-grupo-nome">Looks completos</div>
                <div className="vc3d-cards">{VARIANTES.map((v) => (
                  <CardAsset key={v} nome={ROTULO_LOOK[v]} thumb={thumb(`look:${v}`)} ativo={config.roupa === v && config.cabeca === v}
                    onClick={() => mudar({ roupa: v, cabeca: v, mochila: v === 'aventureiro' ? config.mochila : false })} />
                ))}</div>
              </>)}
              <div className="vc3d-grupo-nome">Pele</div>{cardsCor('pele')}
              <div className="vc3d-grupo-nome">Detalhe</div>{cardsCor('detalhe')}
            </>)}

            {cat === 'cabelo' && (arqueHumano ? (<>
              <div className="vc3d-grupo-nome">Cabeça e cabelo</div>
              <div className="vc3d-cards">{VARIANTES.map((v) => (
                <CardAsset key={v} nome={ROTULO_LOOK[v]} thumb={thumb(`cab:${v}`)} Placeholder={Scissors} ativo={config.cabeca === v} onClick={() => mudar({ cabeca: v })} />
              ))}</div>
              <div className="vc3d-grupo-nome">Cor do cabelo</div>{cardsCor('cabelo')}
            </>) : <VazioPreparo texto="Cabelos e penteados 3D para este arquétipo estão em curadoria. As cores seguem disponíveis no Personagem." />)}

            {cat === 'rosto' && (config.arquetipo === 'androide' ? (<>
              <div className="vc3d-grupo-nome">Expressão</div>
              {(['bravo', 'surpreso', 'triste'] as Array<keyof Config3D['morfos']>).map((m) => (
                <label key={String(m)} className="vc3d-slider"><span>{m === 'bravo' ? 'Bravo' : m === 'surpreso' ? 'Surpreso' : 'Triste'}</span>
                  <input type="range" min={0} max={1} step={0.01} value={config.morfos[m]} onChange={(e) => mudar({ morfos: { ...config.morfos, [m]: Number(e.target.value) } })} /></label>
              ))}
            </>) : <VazioPreparo texto="Edição fina de rosto (expressões) chega com o arquétipo Androide. Escolha um look em Personagem." />)}

            {cat === 'roupa' && (arqueHumano ? (<>
              <div className="vc3d-grupo-nome">Traje</div>
              <div className="vc3d-cards">{VARIANTES.map((v) => (
                <CardAsset key={v} nome={ROTULO_LOOK[v]} thumb={thumb(`rou:${v}`)} Placeholder={Shirt} ativo={config.roupa === v}
                  onClick={() => mudar({ roupa: v, mochila: v === 'aventureiro' ? config.mochila : false })} />
              ))}</div>
              <div className="vc3d-grupo-nome">Cor da roupa</div>{cardsCor('roupa')}
              {config.roupa === 'aventureiro' && <label className="vc3d-toggle"><input type="checkbox" checked={config.mochila} onChange={(e) => mudar({ mochila: e.target.checked })} /> Mochila</label>}
            </>) : (<><VazioPreparo texto="Trajes 3D modulares para este arquétipo estão em preparação. A cor segue editável abaixo." /><div className="vc3d-grupo-nome">Cor</div>{cardsCor('roupa')}</>))}

            {cat === 'acessorios' && (
              <VazioPreparo texto="Os acessórios 3D exigem modelos alinhados aos ossos e ainda estão em curadoria. Enquanto isso, ficam disponíveis no modo 2D." />
            )}
          </div>
        </aside>
      </div>

      {/* "MAIS": menu → subpainel (nunca tudo de uma vez) */}
      {mais3d && (
        <div className="vc-back" onClick={fecharMais}>
          <div className="vc-sheet vc3d-mais" role="dialog" aria-modal="true" aria-label="Mais" onClick={(e) => e.stopPropagation()}>
            <div className="vc-sheet-cab">
              {maisSub ? <button className="vc-acao vc-icone" onClick={() => setMaisSub(null)} aria-label="Voltar"><ArrowLeft size={18} aria-hidden /></button> : <span />}
              <span>{maisSub === 'cena' ? 'Cena' : maisSub === 'movimento' ? 'Movimento' : maisSub === 'camera' ? 'Câmera' : maisSub === 'qualidade' ? 'Qualidade' : maisSub === 'historico' ? 'Histórico' : maisSub === 'missoes' ? 'Missões' : maisSub === 'evolucao' ? 'Evolução' : maisSub === 'progresso' ? 'Progresso e ferramentas' : 'Mais'}</span>
              <button onClick={fecharMais} aria-label="Fechar"><X size={18} aria-hidden /></button>
            </div>

            {!maisSub && (
              <div className="vc3d-mais-menu">
                <button type="button" className="vc3d-mais-mi" onClick={() => setMaisSub('cena')}><ImageIcon size={20} aria-hidden /><span className="vc3d-mais-mi-tit">Cena</span><span className="vc3d-mais-mi-val">{ROTULO_CEN[config.cenario]}</span><ChevronRight size={16} aria-hidden /></button>
                <button type="button" className="vc3d-mais-mi" onClick={() => setMaisSub('movimento')}><PlayCircle size={20} aria-hidden /><span className="vc3d-mais-mi-tit">Movimento</span><ChevronRight size={16} aria-hidden /></button>
                <button type="button" className="vc3d-mais-mi" onClick={() => setMaisSub('camera')}><Camera size={20} aria-hidden /><span className="vc3d-mais-mi-tit">Câmera</span><span className="vc3d-mais-mi-val">{ROTULO_CAM[cam]}</span><ChevronRight size={16} aria-hidden /></button>
                <button type="button" className="vc3d-mais-mi" onClick={() => setMaisSub('qualidade')}><Gauge size={20} aria-hidden /><span className="vc3d-mais-mi-tit">Qualidade</span><span className="vc3d-mais-mi-val">{autoQualidade ? 'Automática' : qualidade === 'alto' ? 'Alto' : qualidade === 'medio' ? 'Médio' : 'Econômico'}</span><ChevronRight size={16} aria-hidden /></button>
                <button type="button" className="vc3d-mais-mi" onClick={() => setMaisSub('historico')}><History size={20} aria-hidden /><span className="vc3d-mais-mi-tit">Histórico</span><ChevronRight size={16} aria-hidden /></button>
                <button type="button" className="vc3d-mais-mi" onClick={() => setMaisSub('progresso')}><Trophy size={20} aria-hidden /><span className="vc3d-mais-mi-tit">Progresso e ferramentas</span><ChevronRight size={16} aria-hidden /></button>
              </div>
            )}

            {maisSub === 'cena' && (
              <div className="vc3d-sub">
                <div className="vc3d-grupo-nome">Cenário</div>
                <div className="vc3d-sub-grade">{(['vazio', 'grade', 'estrelas', 'dojo'] as CenarioId[]).map((c) => (
                  <button key={c} type="button" className={`vc-card-btn vc3d-card ${config.cenario === c ? 'vc-card-on' : ''}`} aria-pressed={config.cenario === c} onClick={() => mudar({ cenario: c })} title={ROTULO_CEN[c]}>
                    <span className="vc3d-cena-thumb" style={{ background: GRAD_CEN[c] }} aria-hidden>{config.cenario === c && <span className="vc-badge vc-badge-eq" aria-hidden><Check size={13} /></span>}</span>
                    <span className="vc-card-nome">{ROTULO_CEN[c]}</span>
                  </button>
                ))}</div>
                <div className="vc3d-grupo-nome">Iluminação</div>
                <div className="vc3d-cam4">{(['estudio', 'dramatica', 'neon'] as IluminacaoId[]).map((l) => <CardControle key={l} nome={ROTULO_ILUM[l]} Icone={Film} ativo={config.iluminacao === l} onClick={() => mudar({ iluminacao: l })} />)}</div>
                <div className="vc3d-grupo-nome">Hora</div>
                <div className="vc3d-cam4">{(['estudio', 'dia', 'entardecer', 'noite'] as HoraId[]).map((h) => <CardControle key={h} nome={ROTULO_HORA[h]} ativo={config.hora === h} onClick={() => mudar({ hora: h })} />)}</div>
                <div className="vc3d-grupo-nome">Clima</div>
                <div className="vc3d-cam4">{(['limpo', 'chuva', 'neve', 'vagalumes'] as ClimaId[]).map((c) => <CardControle key={c} nome={ROTULO_CLIMA[c]} ativo={config.clima === c} onClick={() => mudar({ clima: c })} />)}</div>
              </div>
            )}

            {maisSub === 'movimento' && (
              <div className="vc3d-sub">
                <div className="vc3d-cam4">
                  <CardControle nome="Acenar" Icone={PlayCircle} ativo={false} onClick={() => { setGesto('acenar'); fecharMais(); }} />
                  <CardControle nome="Girar" Icone={PlayCircle} ativo={false} onClick={() => { setGesto('extra'); fecharMais(); }} />
                  <CardControle nome="Poder" Icone={PlayCircle} ativo={fasePoder !== 'inativo'} onClick={() => { if (fasePoder === 'inativo') { setFasePoder('carga'); setGesto('poder'); } fecharMais(); }} />
                </div>
                <p className="vc-mp-ajuda">A animação toca uma vez sobre a pose neutra.</p>
              </div>
            )}

            {maisSub === 'camera' && (
              <div className="vc3d-sub">
                <div className="vc3d-cam4">{(['corpo', 'busto', 'rosto', 'tresquartos'] as CameraId[]).map((c) => <CardControle key={c} nome={ROTULO_CAM[c]} Icone={Camera} ativo={cam === c} onClick={() => { setCam(c); }} />)}</div>
                <p className="vc-mp-ajuda">Arraste no palco para orbitar; o preset apenas re-enquadra.</p>
              </div>
            )}

            {maisSub === 'qualidade' && (
              <div className="vc3d-sub">
                <div className="vc3d-cam4">
                  <CardControle nome="Automática" Icone={Gauge} ativo={autoQualidade} onClick={() => setAutoQualidade(true)} />
                  <CardControle nome="Alto" Icone={Gauge} ativo={!autoQualidade && qualidade === 'alto'} onClick={() => { setAutoQualidade(false); setQualidade('alto'); }} />
                  <CardControle nome="Médio" Icone={Gauge} ativo={!autoQualidade && qualidade === 'medio'} onClick={() => { setAutoQualidade(false); setQualidade('medio'); }} />
                  <CardControle nome="Econômico" Icone={Gauge} ativo={!autoQualidade && qualidade === 'economico'} onClick={() => { setAutoQualidade(false); setQualidade('economico'); }} />
                </div>
                <p className="vc-mp-ajuda">A qualidade automática reduz efeitos se o desempenho cair.</p>
              </div>
            )}

            {maisSub === 'historico' && (
              <div className="vc3d-sub"><Suspense fallback={carregando3d}><Historico3D versaoBase={versaoBase} aoAplicar={aplicar2d ?? (() => {})} aoReativar={(nv: number) => { try { store.confirmarPersistencia(nv); } catch { /* ok */ } }} /></Suspense></div>
            )}

            {maisSub === 'progresso' && (
              <div className="vc3d-mais-menu">
                <button type="button" className="vc3d-mais-mi" onClick={() => void capturarPalco()}><Camera size={20} aria-hidden /><span className="vc3d-mais-mi-tit">Capturar cena</span><ChevronRight size={16} aria-hidden /></button>
                <button type="button" className="vc3d-mais-mi" onClick={() => setMaisSub('missoes')}><Target size={20} aria-hidden /><span className="vc3d-mais-mi-tit">Missões</span><ChevronRight size={16} aria-hidden /></button>
                <button type="button" className="vc3d-mais-mi" onClick={() => setMaisSub('evolucao')}><Trophy size={20} aria-hidden /><span className="vc3d-mais-mi-tit">Evolução</span><ChevronRight size={16} aria-hidden /></button>
                <button type="button" className="vc3d-mais-mi" onClick={() => { fecharMais(); aoClassico?.(); }}><Stethoscope size={20} aria-hidden /><span className="vc3d-mais-mi-tit">Interface clássica</span><ChevronRight size={16} aria-hidden /></button>
              </div>
            )}
            {maisSub === 'missoes' && config2d && <div className="vc3d-sub"><Suspense fallback={carregando3d}><Missoes3D config={config2d} aoFechar={() => setMaisSub('progresso')} /></Suspense></div>}
            {maisSub === 'evolucao' && <div className="vc3d-sub"><Suspense fallback={carregando3d}><Conquistas3D vida={(vida as never) ?? null} carregando={!vida} config={config2d} /></Suspense></div>}
          </div>
        </div>
      )}

      {capturaImg && (
        <div className="vc-back" onClick={() => setCapturaImg(null)}>
          <div className="vc-sheet vc3d-captura" role="dialog" aria-modal="true" aria-label="Captura" onClick={(e) => e.stopPropagation()}>
            <div className="vc-sheet-cab"><span>Captura</span><button onClick={() => setCapturaImg(null)} aria-label="Fechar"><X size={18} aria-hidden /></button></div>
            <div className="vc3d-captura-corpo">
              <img src={capturaImg} alt="Captura do palco 3D" />
              <div className="vc3d-captura-acoes">
                <button className="vc-salvar" onClick={() => { void salvar(); setCapturaImg(null); }}><Save size={15} aria-hidden /> Salvar como avatar</button>
                <a className="vc-acao" href={capturaImg} download="avatar-3d.png"><Download size={15} aria-hidden /> Baixar</a>
                <button className="vc-acao" onClick={() => void capturarPalco()}>Nova captura</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="vc-sr-live" role="status" aria-live="polite">{anuncio}</div>
    </div>
  );
}
