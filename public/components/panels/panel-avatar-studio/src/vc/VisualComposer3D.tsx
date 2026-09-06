// vc/VisualComposer3D.tsx — MODO 3D do Visual Composer (Briefing 2 + consolidação visual).
// Reusa o MOTOR 3D existente (Canvas/Cena3D/Clima3D/Personagem3D/CameraRig3D/Poder3D/Hud3D) —
// nenhum renderer/câmera/histórico/save novo — no shell limpo: palco dominante SEM relatórios
// textuais, barra reduzida (Voltar/Desfazer/Refazer/Salvar/Mais), rail só de partes do corpo,
// catálogo contextual em cards (nomes amigáveis, sem slugs, sem "Equipar", classificação no card),
// seleção direta de mesh com auto-enquadramento, e secundários (Cena/Luz/Animação/Qualidade) em "Mais".
// Modelo 3D (arquétipos/sockets) é DISJUNTO do avatar 2D (decisão #54): bridge só de cores.
import { Component, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type * as THREE from 'three';
import {
  ChevronLeft, Undo2, Redo2, Save, MoreHorizontal, RotateCcw, Move, PersonStanding,
  Scissors, Smile, Shirt, Glasses, ShieldAlert, MonitorX, Check, X,
} from 'lucide-react';
import { salvar3D } from '../services/AvatarService';
import type { AvatarStore } from '../nucleo/estado';
import {
  CORES_3D, ITENS_SOCKET, ROTULOS_VARIANTE, SOCKETS_3D,
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

// Rail = SÓ partes do corpo (§3). Cena/Luz/Animação/Qualidade vão para "Mais".
type Cat3D = 'personagem' | 'cabelo' | 'rosto' | 'roupa' | 'acessorios';
const CATS: { id: Cat3D; nome: string; Icone: typeof PersonStanding }[] = [
  { id: 'personagem', nome: 'Personagem', Icone: PersonStanding },
  { id: 'cabelo', nome: 'Cabelo', Icone: Scissors },
  { id: 'rosto', nome: 'Rosto', Icone: Smile },
  { id: 'roupa', nome: 'Roupa', Icone: Shirt },
  { id: 'acessorios', nome: 'Acessórios', Icone: Glasses },
];
// auto-enquadramento por categoria (§4): o que edito domina o viewport.
const FOCO_CAT: Record<Cat3D, CameraId> = { personagem: 'corpo', cabelo: 'rosto', rosto: 'rosto', roupa: 'corpo', acessorios: 'busto' };

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
// nomes amigáveis dos 14 sockets (sem slugs)
const NOME_SOCKET: Record<Socket3D, string> = {
  head: 'Cabeça', face: 'Rosto', eyes: 'Olhos', ears: 'Orelhas', neck: 'Pescoço', shoulders: 'Ombros',
  back: 'Costas', waist: 'Cintura', wrist_l: 'Pulso esq.', wrist_r: 'Pulso dir.', hand_l: 'Mão esq.', hand_r: 'Mão dir.',
  companion: 'Companheiro', pet: 'Pet',
};
// classificação contextual dos assets (§5)
type Classe3D = 'nativo' | 'simplificado' | 'necessario' | 'so2d';
const ROTULO_CLASSE: Record<Classe3D, string> = { nativo: 'Disponível em 3D', simplificado: 'Representação simplificada', necessario: 'Modelo 3D necessário', so2d: 'Somente 2D' };

function temWebGL2(): boolean { try { const c = document.createElement('canvas'); return Boolean(c.getContext('webgl2')); } catch { return false; } }

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
  aoMais?: () => void;      // menu completo 2D (opcional; o 3D usa sheet próprio)
  reduzido?: boolean;
}

function CardOpcao({ nome, ativo, onClick, cor, classe, desativado }: { nome: string; ativo: boolean; onClick?: () => void; cor?: string; classe?: Classe3D; desativado?: boolean }) {
  return (
    <button type="button" className={`vc-card-btn vc3d-card ${ativo ? 'vc-card-on' : ''} ${desativado ? 'vc3d-card-off' : ''}`} aria-pressed={ativo} disabled={desativado} onClick={onClick} title={nome}>
      {cor && <span className="vc3d-swatch" style={{ background: cor }} aria-hidden />}
      {ativo && <span className="vc-badge vc-badge-eq" aria-hidden><Check size={13} /></span>}
      <span className="vc-card-nome">{nome}</span>
      {classe && <span className="vc3d-classe" data-c={classe}>{ROTULO_CLASSE[classe]}</span>}
    </button>
  );
}

export default function VisualComposer3D({ store, config3d, aoMudar3d, podeDesfazer, podeRefazer, desfazer, refazer, mudancas = 0, versaoBase, aoVoltar2D }: PropsVisualComposer3D) {
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
  const [cam, setCam] = useState<CameraId>(config3d.camera);   // enquadramento = VIEW (fora do histórico)
  const [salv, setSalv] = useState<'idle' | 'salvando' | 'salvo' | 'erro'>('idle');
  const [gaveta, setGaveta] = useState<'recolhida' | 'meio' | 'expandida'>('meio');
  const [mais3d, setMais3d] = useState(false);
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

  // troca de categoria (rail OU mesh) reenquadra a câmera automaticamente
  const irPara = useCallback((c: Cat3D) => { setCat(c); setCam(FOCO_CAT[c]); setAnuncio(`Editar ${CATS.find((x) => x.id === c)?.nome ?? c}`); if (window.matchMedia?.('(max-width: 768px)').matches) setGaveta('meio'); }, []);

  const aoMedir = useCallback((m: Metricas) => {
    setMetricas(m); if (!autoQualidade) return;
    quedas.current = m.fps < 28 ? quedas.current + 1 : 0;
    if (quedas.current >= 3) { quedas.current = 0; setQualidade((q) => (q === 'alto' ? 'medio' : 'economico')); }
  }, [autoQualidade]);

  const aoClicarMesh = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    irPara(categoriaDoMesh(e.object?.name || ''));
  }, [irPara]);

  // hooks de teste determinístico (probe headless)
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

  const salvar = useCallback(async () => {
    if (salv === 'salvando') return;
    setSalv('salvando');
    const png = capturaQuadrada();
    if (!png) { setSalv('erro'); return; }
    try {
      const r = await salvar3D({ ...config, camera: cam }, png, versaoBase, config.cores.detalhe);
      if (r.ok) { setSalv('salvo'); if (typeof r.versao === 'number') { try { store.confirmarPersistencia(r.versao); } catch { /* ok */ } } }
      else setSalv('erro');
    } catch { setSalv('erro'); }
  }, [salv, capturaQuadrada, config, cam, versaoBase, store]);

  const resetarCamera = useCallback(() => { setResetToken((t) => t + 1); setCam(FOCO_CAT[cat]); }, [cat]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); if (e.shiftKey) refazer(); else desfazer(); }
      else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); refazer(); }
      else if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); void salvar(); }
      else if (k === 'escape') setMais3d(false);
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
            {mudancas > 0 && salv !== 'salvo' && <span className="vc-ponto" aria-hidden title={`${mudancas} alterações`} />}
          </button>
          <button className="vc-acao vc-icone" onClick={() => setMais3d(true)} aria-label="Mais" aria-haspopup="menu" aria-expanded={mais3d}><MoreHorizontal size={18} aria-hidden /></button>
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
                <group onPointerDown={aoClicarMesh}>
                  <Personagem3D config={config} corDestaque={config.cores.detalhe} gesto={gesto} aoTerminarGesto={() => setGesto(null)} />
                </group>
              </Suspense>
              <Poder3D fase={fasePoder} cor={config.cores.detalhe} aoAvancar={setFasePoder} />
              <CameraRig3D preset={cam} arquetipo={config.arquetipo} pan={pan} resetToken={resetToken} />
              <Hud3D aoMedir={aoMedir} />
            </Canvas>
          </GuardaErro>
          {/* palco limpo: só controles icônicos de câmera (órbita/zoom = gesto; sem texto/relatório) */}
          <div className="vc3d-camera" role="group" aria-label="Câmera">
            <button type="button" className={`vc3d-cam-btn ${pan ? 'on' : ''}`} onClick={() => setPan((v) => !v)} aria-pressed={pan} aria-label="Mover a câmera (pan)"><Move size={15} aria-hidden /></button>
            <button type="button" className="vc3d-cam-btn" onClick={resetarCamera} aria-label="Recentralizar câmera"><RotateCcw size={15} aria-hidden /></button>
          </div>
        </main>

        <aside className="vc-painel" id="vc3d-painel" aria-label={`Editar: ${CATS.find((c) => c.id === cat)?.nome}`}>
          <button className="vc-gaveta-alca" aria-label="Altura do painel" onClick={() => setGaveta((s) => s === 'expandida' ? 'meio' : s === 'meio' ? 'recolhida' : 'expandida')}><span /></button>
          <div className="vc3d-corpo-painel">
            {cat === 'personagem' && (<>
              <div className="vc3d-grupo-nome">Arquétipo</div>
              <div className="vc3d-cards">{(['humano', 'androide', 'animal'] as ArquetipoId[]).map((a) => <CardOpcao key={a} nome={ROTULO_ARQ[a]} classe="nativo" ativo={config.arquetipo === a} onClick={() => { setGesto(null); setFasePoder('inativo'); mudar({ arquetipo: a }); }} />)}</div>
              <div className="vc3d-grupo-nome">Pele</div>{cardsCor('pele')}
              <div className="vc3d-grupo-nome">Detalhe</div>{cardsCor('detalhe')}
            </>)}
            {cat === 'cabelo' && (arqueHumano ? (<>
              <div className="vc3d-grupo-nome">Cabeça e cabelo</div>
              <div className="vc3d-cards">{VARIANTES.map((v) => <CardOpcao key={v} nome={ROTULOS_VARIANTE[v]} classe="nativo" ativo={config.cabeca === v} onClick={() => mudar({ cabeca: v })} />)}</div>
              <div className="vc3d-grupo-nome">Cor do cabelo</div>{cardsCor('cabelo')}
            </>) : <p className="vc-vazio">Este arquétipo não tem cabelo editável.</p>)}
            {cat === 'rosto' && (config.arquetipo === 'androide' ? (<>
              <div className="vc3d-grupo-nome">Expressão</div>
              {(['bravo', 'surpreso', 'triste'] as Array<keyof Config3D['morfos']>).map((m) => (
                <label key={String(m)} className="vc3d-slider"><span>{m === 'bravo' ? 'Bravo' : m === 'surpreso' ? 'Surpreso' : 'Triste'}</span>
                  <input type="range" min={0} max={1} step={0.01} value={config.morfos[m]} onChange={(e) => mudar({ morfos: { ...config.morfos, [m]: Number(e.target.value) } })} /></label>
              ))}
            </>) : <p className="vc-vazio">Edição fina de rosto disponível no arquétipo Androide.</p>)}
            {cat === 'roupa' && (arqueHumano ? (<>
              <div className="vc3d-grupo-nome">Traje</div>
              <div className="vc3d-cards">{VARIANTES.map((v) => <CardOpcao key={v} nome={ROTULOS_VARIANTE[v]} classe="nativo" ativo={config.roupa === v} onClick={() => mudar({ roupa: v, mochila: v === 'aventureiro' ? config.mochila : false })} />)}</div>
              <div className="vc3d-grupo-nome">Cor da roupa</div>{cardsCor('roupa')}
              {config.roupa === 'aventureiro' && <label className="vc3d-toggle"><input type="checkbox" checked={config.mochila} onChange={(e) => mudar({ mochila: e.target.checked })} /> Mochila</label>}
            </>) : (<><div className="vc3d-grupo-nome">Cor</div>{cardsCor('roupa')}</>))}
            {cat === 'acessorios' && (<>
              {SOCKETS_3D.map((socket) => {
                const itens = ITENS_SOCKET.filter((i) => i.socket === socket);
                if (itens.length === 0) return (
                  <div key={socket}><div className="vc3d-grupo-nome">{NOME_SOCKET[socket]}</div>
                    <div className="vc3d-cards"><CardOpcao nome="Sem modelo 3D" classe="necessario" ativo={false} desativado /></div></div>
                );
                return (
                  <div key={socket}><div className="vc3d-grupo-nome">{NOME_SOCKET[socket]}</div>
                    <div className="vc3d-cards">
                      <CardOpcao nome="Nenhum" ativo={!config.sockets?.[socket]} onClick={() => mudarSocket(socket, null)} />
                      {itens.map((it) => <CardOpcao key={it.id} nome={it.nome} classe="simplificado" ativo={config.sockets?.[socket] === it.id} onClick={() => mudarSocket(socket, it.id)} />)}
                    </div>
                  </div>
                );
              })}
            </>)}
          </div>
        </aside>
      </div>

      {/* "Mais" do 3D: secundários (Cena/Iluminação/Animação/Qualidade/Câmera) — nunca no palco */}
      {mais3d && (
        <div className="vc-back" onClick={() => setMais3d(false)}>
          <div className="vc-sheet vc3d-mais" role="dialog" aria-modal="true" aria-label="Mais" onClick={(e) => e.stopPropagation()}>
            <div className="vc-sheet-cab"><span>Mais</span><button onClick={() => setMais3d(false)} aria-label="Fechar"><X size={18} aria-hidden /></button></div>
            <div className="vc3d-mais-corpo">
              <div className="vc3d-grupo-nome">Câmera</div>
              <div className="vc3d-cards">{(['corpo', 'busto', 'rosto', 'tresquartos'] as CameraId[]).map((c) => <CardOpcao key={c} nome={ROTULO_CAM[c]} ativo={cam === c} onClick={() => setCam(c)} />)}</div>
              <div className="vc3d-grupo-nome">Cenário</div>
              <div className="vc3d-cards">{(['vazio', 'grade', 'estrelas', 'dojo'] as CenarioId[]).map((c) => <CardOpcao key={c} nome={ROTULO_CEN[c]} ativo={config.cenario === c} onClick={() => mudar({ cenario: c })} />)}</div>
              <div className="vc3d-grupo-nome">Iluminação</div>
              <div className="vc3d-cards">{(['estudio', 'dramatica', 'neon'] as IluminacaoId[]).map((l) => <CardOpcao key={l} nome={ROTULO_ILUM[l]} ativo={config.iluminacao === l} onClick={() => mudar({ iluminacao: l })} />)}</div>
              <div className="vc3d-grupo-nome">Hora e clima</div>
              <div className="vc3d-cards">{(['estudio', 'dia', 'entardecer', 'noite'] as HoraId[]).map((h) => <CardOpcao key={h} nome={ROTULO_HORA[h]} ativo={config.hora === h} onClick={() => mudar({ hora: h })} />)}</div>
              <div className="vc3d-cards">{(['limpo', 'chuva', 'neve', 'vagalumes'] as ClimaId[]).map((c) => <CardOpcao key={c} nome={ROTULO_CLIMA[c]} ativo={config.clima === c} onClick={() => mudar({ clima: c })} />)}</div>
              <div className="vc3d-grupo-nome">Animações</div>
              <div className="vc3d-cards">
                <CardOpcao nome="Acenar" ativo={false} onClick={() => { setGesto('acenar'); setMais3d(false); }} />
                <CardOpcao nome="Extra" ativo={false} onClick={() => { setGesto('extra'); setMais3d(false); }} />
                <CardOpcao nome="Poder" ativo={fasePoder !== 'inativo'} onClick={() => { if (fasePoder === 'inativo') { setFasePoder('carga'); setGesto('poder'); } setMais3d(false); }} />
              </div>
              <div className="vc3d-grupo-nome">Qualidade {metricas ? `· ${metricas.fps} fps` : ''}</div>
              <div className="vc3d-cards">
                <CardOpcao nome="Automática" ativo={autoQualidade} onClick={() => setAutoQualidade((v) => !v)} />
                {(['alto', 'medio', 'economico'] as Qualidade[]).map((q) => <CardOpcao key={q} nome={q === 'alto' ? 'Alto' : q === 'medio' ? 'Médio' : 'Econômico'} ativo={!autoQualidade && qualidade === q} onClick={() => { setAutoQualidade(false); setQualidade(q); }} />)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="vc-sr-live" role="status" aria-live="polite">{anuncio}</div>
    </div>
  );
}
