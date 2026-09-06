// vc/VisualComposer3D.tsx — MODO 3D do Visual Composer (Briefing 2, flag as6.vc_3d).
// Reusa o MOTOR 3D existente (Canvas/Cena3D/Clima3D/Personagem3D/CameraRig3D/Poder3D/Hud3D)
// — nenhum renderer novo — dentro do shell limpo do VC: palco dominante, barra reduzida,
// painel contextual à direita (gaveta no mobile), cards no lugar de chips, seleção direta
// de mesh por raycasting, câmera órbita/zoom/pan/reset e save canônico (salvar3D).
// O modelo 3D (Config3D, arquétipos/sockets) é DISJUNTO do avatar 2D em camadas (decisão #54):
// bridge apenas do que mapeia (cores). Assets classificados com honestidade (NATIVE/MISSING).
import { Component, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type * as THREE from 'three';
import {
  ChevronLeft, Undo2, Redo2, Save, MoreHorizontal, RotateCcw, Move, PersonStanding,
  Scissors, Smile, Shirt, Glasses, Image as ImageIcon, ShieldAlert, MonitorX, Check,
} from 'lucide-react';
import { salvar3D } from '../services/AvatarService';
import type { AvatarStore } from '../nucleo/estado';
import {
  CORES_3D, ITENS_SOCKET, ROTULOS_SOCKET, ROTULOS_VARIANTE, SOCKETS_LEVA1,
} from '../poc3d/catalogo3d';
import type {
  ArquetipoId, CameraId, CenarioId, ClimaId, Config3D, HoraId, IluminacaoId, SlotMaterial, Socket3D, VarianteHumanoId,
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

// Rail de categorias humanas (§3-equivalente do 3D) — sem termos técnicos.
type Cat3D = 'personagem' | 'cabelo' | 'rosto' | 'roupa' | 'acessorios' | 'cena';
const CATS: { id: Cat3D; nome: string; Icone: typeof PersonStanding }[] = [
  { id: 'personagem', nome: 'Personagem', Icone: PersonStanding },
  { id: 'cabelo', nome: 'Cabelo', Icone: Scissors },
  { id: 'rosto', nome: 'Rosto', Icone: Smile },
  { id: 'roupa', nome: 'Roupa', Icone: Shirt },
  { id: 'acessorios', nome: 'Acessórios', Icone: Glasses },
  { id: 'cena', nome: 'Cena', Icone: ImageIcon },
];

// mesh clicado → categoria (raycasting): nomes reais dos GLBs (prefixo_Head/_Body/_Legs/_Feet,
// materiais Hair/Skin/Suit…) e nós de socket. Best-effort determinístico (decisão #54).
function categoriaDoMesh(nome: string): Cat3D {
  const n = nome.toLowerCase();
  if (/_head$|hair|eyebrow|face|head/.test(n)) return 'cabelo';
  if (/backpack|soc_|drone|pet|coroa|halo|colar|jetpack|asas|cetro|socket/.test(n)) return 'acessorios';
  if (/_body$|_legs$|_feet$|suit|shirt|belt|tie|purple|green|red|main|cloth/.test(n)) return 'roupa';
  return 'personagem';
}

const ROTULO_ARQ: Record<ArquetipoId, string> = { humano: 'Humano', androide: 'Androide', animal: 'Animal' };
const ROTULO_CAM: Record<CameraId, string> = { corpo: 'Corpo', busto: 'Busto', rosto: 'Rosto', tresquartos: '¾' };
const ROTULO_ILUM: Record<IluminacaoId, string> = { estudio: 'Estúdio', dramatica: 'Dramática', neon: 'Neon' };
const ROTULO_CEN: Record<CenarioId, string> = { vazio: 'Palco vazio', grade: 'Grade neon', estrelas: 'Céu estrelado', dojo: 'Dojo' };
const ROTULO_HORA: Record<HoraId, string> = { estudio: 'Luz de estúdio', dia: 'Dia', entardecer: 'Entardecer', noite: 'Noite' };
const ROTULO_CLIMA: Record<ClimaId, string> = { limpo: 'Céu limpo', chuva: 'Chuva', neve: 'Neve', vagalumes: 'Vagalumes' };
const NOME_COR: Record<SlotMaterial, string> = { pele: 'Pele', cabelo: 'Cabelo', roupa: 'Roupa', detalhe: 'Detalhe' };

function temWebGL2(): boolean {
  try { const c = document.createElement('canvas'); return Boolean(c.getContext('webgl2')); } catch { return false; }
}

/** Falha de asset NÃO derruba o modo (§43). */
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
  aoMudar3d: (c: Config3D) => void;      // registra no histórico do pai (undo/redo do 3D)
  podeDesfazer: boolean; podeRefazer: boolean; desfazer: () => void; refazer: () => void;
  versaoBase: number;
  aoVoltar2D: () => void;                 // retorno ao 2D sem reload
  aoMais: () => void;
  reduzido: boolean;
}

function CardOpcao({ nome, ativo, onClick, cor }: { nome: string; ativo: boolean; onClick: () => void; cor?: string }) {
  return (
    <button type="button" className={`vc-card-btn vc3d-card ${ativo ? 'vc-card-on' : ''}`} aria-pressed={ativo} onClick={onClick} title={nome}>
      {cor && <span className="vc3d-swatch" style={{ background: cor }} aria-hidden />}
      {ativo && <span className="vc-badge vc-badge-eq" aria-hidden><Check size={13} /></span>}
      <span className="vc-card-nome">{nome}</span>
    </button>
  );
}

export default function VisualComposer3D({ store, config3d, aoMudar3d, podeDesfazer, podeRefazer, desfazer, refazer, versaoBase, aoVoltar2D, aoMais }: PropsVisualComposer3D) {
  const suportado = useRef(temWebGL2());
  const [cat, setCat] = useState<Cat3D>('personagem');
  const [gesto, setGesto] = useState<Gesto>(null);
  const [fasePoder, setFasePoder] = useState<FasePoder>('inativo');
  const [qualidade, setQualidade] = useState<Qualidade>('alto');
  const [autoQualidade, setAutoQualidade] = useState(true);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [chaveCena, setChaveCena] = useState(0);
  const [pan, setPan] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [salv, setSalv] = useState<'idle' | 'salvando' | 'salvo' | 'erro'>('idle');
  const [gaveta, setGaveta] = useState<'recolhida' | 'meio' | 'expandida'>('meio');
  const [avancado, setAvancado] = useState(false);
  const [anuncio, setAnuncio] = useState('');
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const quedas = useRef(0);

  const config = config3d;
  const mudar = useCallback((parcial: Partial<Config3D>) => { aoMudar3d({ ...config, ...parcial }); setSalv('idle'); }, [config, aoMudar3d]);
  const mudarSocket = useCallback((socket: Socket3D, id: string | null) => {
    const sockets = { ...(config.sockets ?? {}) };
    if (!id || sockets[socket] === id) delete sockets[socket]; else sockets[socket] = id;
    aoMudar3d({ ...config, sockets }); setSalv('idle');
  }, [config, aoMudar3d]);

  const aoMedir = useCallback((m: Metricas) => {
    setMetricas(m);
    if (!autoQualidade) return;
    quedas.current = m.fps < 28 ? quedas.current + 1 : 0;
    if (quedas.current >= 3) { quedas.current = 0; setQualidade((q) => (q === 'alto' ? 'medio' : 'economico')); }
  }, [autoQualidade]);

  // seleção direta de mesh (raycasting via R3F) → abre a categoria da região.
  const aoClicarMesh = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const nome = (e.object?.name || '');
    const c = categoriaDoMesh(nome);
    setCat(c); setAnuncio(`Editar ${CATS.find((x) => x.id === c)?.nome ?? c}`);
  }, []);

  // hook de teste determinístico (probe headless): roteia um nome de mesh sem depender do raycast.
  useEffect(() => {
    const w = window as unknown as { __vc3dRota?: (n: string) => Cat3D; __vc3dPronto?: boolean; __vc3dEstado?: () => Config3D };
    w.__vc3dRota = (n: string) => { const c = categoriaDoMesh(n); setCat(c); return c; };
    w.__vc3dEstado = () => config;
    w.__vc3dPronto = suportado.current;
    return () => { try { delete w.__vc3dRota; delete w.__vc3dEstado; } catch { /* ok */ } };
  }, [config]);

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

  const salvar = useCallback(async () => {
    if (salv === 'salvando') return;
    setSalv('salvando');
    const png = capturaQuadrada();
    if (!png) { setSalv('erro'); return; }
    try {
      const r = await salvar3D(config, png, versaoBase, config.cores.detalhe);
      if (r.ok) { setSalv('salvo'); if (typeof r.versao === 'number') { try { store.confirmarPersistencia(r.versao); } catch { /* ok */ } } }
      else setSalv('erro');
    } catch { setSalv('erro'); }
  }, [salv, capturaQuadrada, config, versaoBase, store]);

  const resetarCamera = useCallback(() => { setResetToken((t) => t + 1); mudar({ camera: 'corpo' }); }, [mudar]);

  // atalhos de teclado (mesma linguagem do VC 2D)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); if (e.shiftKey) refazer(); else desfazer(); }
      else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); refazer(); }
      else if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); void salvar(); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [desfazer, refazer, salvar]);

  if (!suportado.current) {
    return (
      <div className="vc-root" data-vc data-modo="3d">
        <header className="vc-barra">
          <button className="vc-acao" onClick={aoVoltar2D} aria-label="Voltar ao 2D"><ChevronLeft size={18} aria-hidden /><span className="vc-lbl">Voltar</span></button>
          <div className="vc-titulo">Modo 3D</div>
        </header>
        <div className="vc3d-erro vc3d-sem-webgl">
          <MonitorX size={30} aria-hidden />
          <p><strong>Este dispositivo não expõe WebGL2.</strong><br />O modo 3D fica indisponível aqui — seu avatar segue no modo 2D (fallback oficial).</p>
          <button type="button" className="vc-salvar" onClick={aoVoltar2D}>Voltar ao 2D</button>
        </div>
      </div>
    );
  }

  const arqueHumano = config.arquetipo === 'humano';
  const cardsCena = (
    <>
      <div className="vc3d-grupo-nome">Iluminação</div>
      <div className="vc3d-cards">{(['estudio', 'dramatica', 'neon'] as IluminacaoId[]).map((l) => <CardOpcao key={l} nome={ROTULO_ILUM[l]} ativo={config.iluminacao === l} onClick={() => mudar({ iluminacao: l })} />)}</div>
      <div className="vc3d-grupo-nome">Cenário</div>
      <div className="vc3d-cards">{(['vazio', 'grade', 'estrelas', 'dojo'] as CenarioId[]).map((c) => <CardOpcao key={c} nome={ROTULO_CEN[c]} ativo={config.cenario === c} onClick={() => mudar({ cenario: c })} />)}</div>
      <div className="vc3d-grupo-nome">Hora</div>
      <div className="vc3d-cards">{(['estudio', 'dia', 'entardecer', 'noite'] as HoraId[]).map((h) => <CardOpcao key={h} nome={ROTULO_HORA[h]} ativo={config.hora === h} onClick={() => mudar({ hora: h })} />)}</div>
      <div className="vc3d-grupo-nome">Clima</div>
      <div className="vc3d-cards">{(['limpo', 'chuva', 'neve', 'vagalumes'] as ClimaId[]).map((c) => <CardOpcao key={c} nome={ROTULO_CLIMA[c]} ativo={config.clima === c} onClick={() => mudar({ clima: c })} />)}</div>
    </>
  );

  const cardsCor = (slot: SlotMaterial) => (
    <div className="vc3d-cor-linha" role="radiogroup" aria-label={`Cor de ${NOME_COR[slot]}`}>
      {CORES_3D[slot].map((cor) => (
        <button key={cor} type="button" role="radio" aria-checked={config.cores[slot] === cor} aria-label={cor}
          className={`vc-cor-sw ${config.cores[slot] === cor ? 'vc-cor-sw-on' : ''}`} style={{ background: cor }}
          onClick={() => mudar({ cores: { ...config.cores, [slot]: cor } })}>{config.cores[slot] === cor && <Check size={12} aria-hidden />}</button>
      ))}
    </div>
  );

  return (
    <div className="vc-root" data-vc data-modo="3d" data-gaveta={gaveta}>
      <header className="vc-barra">
        <button className="vc-acao" onClick={aoVoltar2D} aria-label="Voltar ao 2D"><ChevronLeft size={18} aria-hidden /><span className="vc-lbl">Voltar</span></button>
        <div className="vc-titulo">Avatar Studio · 3D</div>
        <div className="vc-globais">
          <button className="vc-acao vc-icone" onClick={desfazer} disabled={!podeDesfazer} aria-label="Desfazer"><Undo2 size={18} aria-hidden /></button>
          <button className="vc-acao vc-icone" onClick={refazer} disabled={!podeRefazer} aria-label="Refazer"><Redo2 size={18} aria-hidden /></button>
          <button className="vc-salvar" onClick={() => void salvar()} data-estado={salv} aria-label="Salvar">
            <Save size={16} aria-hidden /><span className="vc-lbl">{salv === 'salvando' ? 'Salvando…' : salv === 'salvo' ? 'Salvo' : salv === 'erro' ? 'Repetir' : 'Salvar'}</span>
          </button>
          <button className="vc-acao vc-icone" onClick={aoMais} aria-label="Mais" aria-haspopup="menu"><MoreHorizontal size={18} aria-hidden /></button>
        </div>
      </header>

      <div className="vc-corpo">
        <nav className="vc-trilho" aria-label="Categorias 3D">
          {CATS.map((c) => { const Ic = c.Icone; const on = c.id === cat; return (
            <button key={c.id} type="button" title={c.nome} className={`vc-cat ${on ? 'vc-cat-ativa' : ''}`} aria-pressed={on} aria-label={c.nome} onClick={() => setCat(c.id)}>
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
                <group onPointerDown={aoClicarMesh}>
                  <Personagem3D config={config} corDestaque={config.cores.detalhe} gesto={gesto} aoTerminarGesto={() => setGesto(null)} />
                </group>
              </Suspense>
              <Poder3D fase={fasePoder} cor={config.cores.detalhe} aoAvancar={setFasePoder} />
              <CameraRig3D preset={config.camera} arquetipo={config.arquetipo} pan={pan} resetToken={resetToken} />
              <Hud3D aoMedir={aoMedir} />
            </Canvas>
          </GuardaErro>

          {/* controles de câmera sobre o palco (órbita = arraste; aqui: enquadramento, pan, reset) */}
          <div className="vc3d-camera" role="group" aria-label="Câmera">
            {(['corpo', 'busto', 'rosto', 'tresquartos'] as CameraId[]).map((c) => (
              <button key={c} type="button" className={`vc3d-cam-btn ${config.camera === c ? 'on' : ''}`} onClick={() => mudar({ camera: c })} aria-pressed={config.camera === c}>{ROTULO_CAM[c]}</button>
            ))}
            <button type="button" className={`vc3d-cam-btn ${pan ? 'on' : ''}`} onClick={() => setPan((v) => !v)} aria-pressed={pan} aria-label="Mover (pan)"><Move size={14} aria-hidden /></button>
            <button type="button" className="vc3d-cam-btn" onClick={resetarCamera} aria-label="Recentralizar câmera"><RotateCcw size={14} aria-hidden /></button>
          </div>
          <div className="vc3d-hud" role="status" aria-hidden>{metricas ? `${metricas.fps} fps · ${autoQualidade ? 'auto·' : ''}${qualidade}` : '…'}</div>
        </main>

        <aside className="vc-painel" id="vc3d-painel" aria-label={`Editar: ${CATS.find((c) => c.id === cat)?.nome}`}>
          <button className="vc-gaveta-alca" aria-label="Altura do painel" onClick={() => setGaveta((s) => s === 'expandida' ? 'meio' : s === 'meio' ? 'recolhida' : 'expandida')}><span /></button>
          <div className="vc3d-corpo-painel">
            {cat === 'personagem' && (<>
              <div className="vc3d-grupo-nome">Arquétipo</div>
              <div className="vc3d-cards">{(['humano', 'androide', 'animal'] as ArquetipoId[]).map((a) => <CardOpcao key={a} nome={ROTULO_ARQ[a]} ativo={config.arquetipo === a} onClick={() => { setGesto(null); setFasePoder('inativo'); mudar({ arquetipo: a }); }} />)}</div>
              <div className="vc3d-grupo-nome">Pele</div>{cardsCor('pele')}
              <div className="vc3d-grupo-nome">Detalhe</div>{cardsCor('detalhe')}
            </>)}
            {cat === 'cabelo' && (arqueHumano ? (<>
              <div className="vc3d-grupo-nome">Cabeça e cabelo</div>
              <div className="vc3d-cards">{VARIANTES.map((v) => <CardOpcao key={v} nome={ROTULOS_VARIANTE[v]} ativo={config.cabeca === v} onClick={() => mudar({ cabeca: v })} />)}</div>
              <div className="vc3d-grupo-nome">Cor do cabelo</div>{cardsCor('cabelo')}
            </>) : <p className="vc-vazio">Este arquétipo não tem cabelo editável.</p>)}
            {cat === 'rosto' && (config.arquetipo === 'androide' ? (<>
              <div className="vc3d-grupo-nome">Expressão</div>
              {(['bravo', 'surpreso', 'triste'] as Array<keyof Config3D['morfos']>).map((m) => (
                <label key={m} className="vc3d-slider"><span>{m === 'bravo' ? 'Bravo' : m === 'surpreso' ? 'Surpreso' : 'Triste'}</span>
                  <input type="range" min={0} max={1} step={0.01} value={config.morfos[m]} onChange={(e) => mudar({ morfos: { ...config.morfos, [m]: Number(e.target.value) } })} /></label>
              ))}
            </>) : <p className="vc-vazio">Edição fina de rosto disponível no arquétipo Androide.</p>)}
            {cat === 'roupa' && (arqueHumano ? (<>
              <div className="vc3d-grupo-nome">Traje</div>
              <div className="vc3d-cards">{VARIANTES.map((v) => <CardOpcao key={v} nome={ROTULOS_VARIANTE[v]} ativo={config.roupa === v} onClick={() => mudar({ roupa: v, mochila: v === 'aventureiro' ? config.mochila : false })} />)}</div>
              <div className="vc3d-grupo-nome">Cor da roupa</div>{cardsCor('roupa')}
              {config.roupa === 'aventureiro' && <label className="vc3d-toggle"><input type="checkbox" checked={config.mochila} onChange={(e) => mudar({ mochila: e.target.checked })} /> Mochila</label>}
            </>) : (<><div className="vc3d-grupo-nome">Cor</div>{cardsCor('roupa')}</>))}
            {cat === 'acessorios' && (<>
              {SOCKETS_LEVA1.map((socket) => { const itens = ITENS_SOCKET.filter((i) => i.socket === socket); return (
                <div key={socket}><div className="vc3d-grupo-nome">{ROTULOS_SOCKET[socket] ?? socket}</div>
                  <div className="vc3d-cards">
                    <CardOpcao nome="Nenhum" ativo={!config.sockets?.[socket]} onClick={() => mudarSocket(socket, null)} />
                    {itens.map((it) => <CardOpcao key={it.id} nome={it.nome} ativo={config.sockets?.[socket] === it.id} onClick={() => mudarSocket(socket, it.id)} />)}
                  </div>
                </div>); })}
            </>)}
            {cat === 'cena' && cardsCena}

            <button type="button" className="vc3d-avancado-cab" aria-expanded={avancado} onClick={() => setAvancado((v) => !v)}>Avançado</button>
            {avancado && (
              <div className="vc3d-avancado">
                <div className="vc3d-grupo-nome">Ações</div>
                <div className="vc3d-cards">
                  <CardOpcao nome="Acenar" ativo={false} onClick={() => setGesto('acenar')} />
                  <CardOpcao nome="Extra" ativo={false} onClick={() => setGesto('extra')} />
                  <CardOpcao nome="Poder" ativo={fasePoder !== 'inativo'} onClick={() => { if (fasePoder === 'inativo') { setFasePoder('carga'); setGesto('poder'); } }} />
                </div>
                <div className="vc3d-grupo-nome">Qualidade</div>
                <div className="vc3d-cards">
                  <CardOpcao nome="Auto" ativo={autoQualidade} onClick={() => setAutoQualidade((v) => !v)} />
                  {(['alto', 'medio', 'economico'] as Qualidade[]).map((q) => <CardOpcao key={q} nome={q === 'alto' ? 'Alto' : q === 'medio' ? 'Médio' : 'Econômico'} ativo={!autoQualidade && qualidade === q} onClick={() => { setAutoQualidade(false); setQualidade(q); }} />)}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
      <div className="vc-sr-live" role="status" aria-live="polite">{anuncio}</div>
    </div>
  );
}
