// poc3d/Estudio3D.tsx — Prova de Conceito 3D do Avatar Studio 4.0 (Fase 1).
// @version 1.0.0  @created 2026-07-30
//
// Chunk CODE-SPLIT (decisão #30): three/R3F/drei só chegam ao navegador
// quando esta aba abre — o estúdio 2D continua instantâneo. Demonstra os
// pontos do briefing §46: 3 arquétipos, rotação/câmera, iluminação PBR,
// troca de roupa/cabelo, morph facial, idle, poder com partículas, cenário,
// render para o header e medição de FPS/memória/carga. Sem WebGL2 → recado
// de fallback (Camada 3 continua sendo o estúdio 2D).
import { Component, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import type * as THREE from 'three';
import {
  Aperture, Camera, Gauge, Gem, Hand, Lightbulb, LoaderCircle, MonitorX,
  PersonStanding, RotateCcw, Save, ShieldAlert, Sparkles, Zap,
} from 'lucide-react';
import { telemetria } from '../services/Telemetria';
import { salvar3D } from '../services/AvatarService';
import {
  CONFIG3D_PADRAO, CORES_3D, ITENS_SOCKET, ROTULOS_SOCKET, ROTULOS_VARIANTE,
  SOCKETS_LEVA1, validarConfig3d,
} from './catalogo3d';
import type {
  ArquetipoId, CameraId, CenarioId, ClimaId, Config3D, HoraId, IluminacaoId,
  SlotMaterial, Socket3D, VarianteHumanoId,
} from './catalogo3d';
import { Personagem3D } from './Personagem3D';
import type { Gesto } from './Personagem3D';
import { Cena3D } from './Cena3D';
import { Clima3D } from './Clima3D';
import { Poder3D } from './Poder3D';
import type { FasePoder } from './Poder3D';
import { CameraRig3D } from './CameraRig3D';
import { Hud3D } from './Hud3D';
import type { Metricas } from './Hud3D';

type Qualidade = 'alto' | 'medio' | 'economico';
const DPR: Record<Qualidade, number | [number, number]> = {
  alto: [1, 2], medio: 1, economico: 0.75,
};

const VARIANTES: VarianteHumanoId[] = ['casual', 'terno', 'punk', 'aventureiro'];
const ROTULO_EXTRA: Record<ArquetipoId, string> = { humano: 'Rolar', androide: 'Dançar', animal: 'Pular' };

/** Falha de um asset NÃO derruba o estúdio (§43). */
class GuardaErro extends Component<{ aoTentar: () => void; children: ReactNode }, { erro: boolean }> {
  state = { erro: false };
  static getDerivedStateFromError() { return { erro: true }; }
  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="avst-3d-erro">
        <ShieldAlert size={26} aria-hidden />
        <p>Um asset 3D falhou ao carregar — o personagem foi preservado.</p>
        <button type="button" className="avst-botao"
          onClick={() => { this.setState({ erro: false }); this.props.aoTentar(); }}>
          Tentar de novo
        </button>
      </div>
    );
  }
}

function temWebGL2(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2'));
  } catch { return false; }
}

export default function Estudio3D({ corDestaque, versaoBase = 0, config3dInicial, aoSalvar }: {
  corDestaque?: string;
  /** versão atual do avatar (concorrência otimista — 409 entre abas) */
  versaoBase?: number;
  /** último trabalho 3D salvo (retomada — fila #37); bruto, validado aqui */
  config3dInicial?: unknown | null;
  /** avisa o App quando o 3D vira o avatar oficial (nova versão) */
  aoSalvar?: (novaVersao: number) => void;
}) {
  // retomada: reabre exatamente onde o usuário parou (sockets, palco vivo,
  // cores, morfos) — fail-closed via validarConfig3d; sem salvo → padrão
  const [config, setConfig] = useState<Config3D>(
    () => (config3dInicial ? validarConfig3d(config3dInicial) : CONFIG3D_PADRAO),
  );
  const [gesto, setGesto] = useState<Gesto>(null);
  const [fasePoder, setFasePoder] = useState<FasePoder>('inativo');
  const [qualidade, setQualidade] = useState<Qualidade>('alto');
  const [autoQualidade, setAutoQualidade] = useState(true);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [chaveCena, setChaveCena] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [msgSalvar, setMsgSalvar] = useState<string | null>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const destaqueRef = useRef<string>('#7c5cff');
  const quedasSeguidas = useRef(0);
  const suportado = useRef(temWebGL2());

  useEffect(() => { telemetria('3d_abriu', { suportado: suportado.current }); }, []);

  const mudar = useCallback((parcial: Partial<Config3D>) => {
    setConfig((c) => ({ ...c, ...parcial }));
  }, []);

  // sockets (decisão #41): equipar troca o item do socket; clicar no ativo
  // ou em "—" desequipa só aquele socket — os outros ficam (aditivo)
  const mudarSocket = useCallback((socket: Socket3D, id: string | null) => {
    setConfig((c) => {
      const sockets = { ...(c.sockets ?? {}) };
      if (!id || sockets[socket] === id) delete sockets[socket];
      else sockets[socket] = id;
      return { ...c, sockets };
    });
  }, []);

  // qualidade ADAPTATIVA: 3 medições seguidas < 28 fps → desce um degrau
  const aoMedir = useCallback((m: Metricas) => {
    setMetricas(m);
    if (!autoQualidade) return;
    quedasSeguidas.current = m.fps < 28 ? quedasSeguidas.current + 1 : 0;
    if (quedasSeguidas.current >= 3) {
      quedasSeguidas.current = 0;
      setQualidade((q) => {
        const proxima = q === 'alto' ? 'medio' : 'economico';
        if (proxima !== q) telemetria('3d_degradou', { de: q, para: proxima });
        return proxima;
      });
    }
  }, [autoQualidade]);

  const dispararPoder = useCallback(() => {
    if (fasePoder !== 'inativo') return;
    setFasePoder('carga');
    setGesto('poder');
    telemetria('3d_poder', { arquetipo: config.arquetipo });
  }, [fasePoder, config.arquetipo]);

  const capturar = useCallback(() => {
    const gl = glRef.current;
    if (!gl) return;
    try {
      setPrevia(gl.domElement.toDataURL('image/png'));
      telemetria('3d_previa', { camera: config.camera });
    } catch { /* toDataURL bloqueado */ }
  }, [config.camera]);

  /** Frame canônico 480×480 (corte central) — a Camada 2 nasce aqui. */
  const capturaQuadrada = useCallback((): string | null => {
    const gl = glRef.current;
    if (!gl) return null;
    try {
      const fonte = gl.domElement;
      const lado = Math.min(fonte.width, fonte.height);
      const alvo = document.createElement('canvas');
      alvo.width = 480;
      alvo.height = 480;
      const ctx = alvo.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(fonte, (fonte.width - lado) / 2, (fonte.height - lado) / 2, lado, lado, 0, 0, 480, 480);
      return alvo.toDataURL('image/png');
    } catch { return null; }
  }, []);

  const salvarComoAvatar = useCallback(async () => {
    if (salvando) return;
    const png = capturaQuadrada();
    if (!png) { setMsgSalvar('Não consegui capturar o quadro — tente de novo.'); return; }
    setSalvando(true);
    setMsgSalvar(null);
    const r = await salvar3D(config, png, versaoBase, destaqueRef.current);
    setSalvando(false);
    setMsgSalvar(r.mensagem ?? (r.ok ? 'Avatar 3D salvo!' : 'Falha ao salvar.'));
    if (r.ok && r.versao !== undefined) {
      telemetria('3d_salvou', { versao: r.versao });
      aoSalvar?.(r.versao);
    }
  }, [salvando, capturaQuadrada, config, versaoBase, aoSalvar]);

  if (!suportado.current) {
    return (
      <div className="avst-3d-erro avst-3d-sem-webgl">
        <MonitorX size={30} aria-hidden />
        <p><strong>Este dispositivo não expõe WebGL2.</strong><br />
          O modo 3D fica indisponível aqui — seu avatar continua funcionando no
          modo clássico (2D), que segue como fallback oficial.</p>
      </div>
    );
  }

  const destaque = corDestaque ?? config.cores.roupa;
  destaqueRef.current = destaque;

  return (
    <div className="avst-3d">
      {/* ── palco 3D ── */}
      <div className="avst-3d-palco">
        <GuardaErro aoTentar={() => setChaveCena((k) => k + 1)}>
          <Canvas
            key={chaveCena}
            shadows={qualidade !== 'economico'}
            dpr={DPR[qualidade]}
            gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
            camera={{ fov: 34, near: 0.1, far: 40, position: [0, 1.35, 3.6] }}
            onCreated={(estado) => { glRef.current = estado.gl; }}>
            <Cena3D iluminacao={config.iluminacao} cenario={config.cenario}
              hora={config.hora} corDestaque={destaque} sombras={qualidade !== 'economico'} />
            <Clima3D clima={config.clima} />
            <Suspense fallback={null}>
              <Personagem3D config={config} corDestaque={destaque} gesto={gesto} aoTerminarGesto={() => setGesto(null)} />
            </Suspense>
            <Poder3D fase={fasePoder} cor={destaque} aoAvancar={setFasePoder} />
            <CameraRig3D preset={config.camera} arquetipo={config.arquetipo} />
            <Hud3D aoMedir={aoMedir} />
          </Canvas>
        </GuardaErro>

        {/* métricas (§46: FPS, memória, tempo de carga) */}
        <div className="avst-3d-hud" role="status">
          <span><Gauge size={11} aria-hidden /> {metricas?.fps ?? '–'} fps</span>
          <span>{metricas ? `${(metricas.triangulos / 1000).toFixed(1)}k tris · ${metricas.chamadas} draws` : '–'}</span>
          {metricas?.memoriaMB !== null && metricas?.memoriaMB !== undefined && <span>{metricas.memoriaMB} MB</span>}
          {metricas?.cargaMs !== null && metricas?.cargaMs !== undefined && <span>1º quadro {metricas.cargaMs} ms</span>}
          <span className="avst-3d-hud-q">{autoQualidade ? 'auto·' : ''}{qualidade}</span>
        </div>

        {/* prévias derivadas (Camada 2: header/menu nascem do frame 3D) */}
        {previa && (
          <div className="avst-3d-previas" aria-label="Prévias derivadas do render 3D">
            <figure><img src={previa} alt="Prévia do header" /><figcaption>Header</figcaption></figure>
            <figure className="avst-3d-previa-menor"><img src={previa} alt="Prévia do menu" /><figcaption>Menu</figcaption></figure>
          </div>
        )}
      </div>

      {/* ── controles ── */}
      <aside className="avst-3d-controles">
        {aoSalvar && (
          <section className="avst-3d-salvar">
            <button type="button" className="avst-botao avst-botao-primario" disabled={salvando}
              onClick={() => void salvarComoAvatar()}>
              {salvando ? <LoaderCircle size={15} className="avst-girando" aria-hidden /> : <Save size={15} aria-hidden />}
              {salvando ? ' Salvando…' : ' Salvar como meu avatar'}
            </button>
            {msgSalvar && <p className="avst-3d-nota" role="status">{msgSalvar}</p>}
            <p className="avst-3d-nota">Enquadre como quiser — o quadro atual vira seu avatar no header, menu e perfil.</p>
          </section>
        )}
        <p className="avst-3d-poc">FASE 2 · PoC aprovada — persistência 3D ativa; conteúdo em expansão contínua.</p>

        <section>
          <h3><PersonStanding size={13} aria-hidden /> Arquétipo</h3>
          <div className="avst-3d-chips">
            {(['humano', 'androide', 'animal'] as ArquetipoId[]).map((a) => (
              <button key={a} type="button" className={config.arquetipo === a ? 'avst-3d-chip-on' : ''}
                onClick={() => { setGesto(null); setFasePoder('inativo'); mudar({ arquetipo: a }); }}>
                {a === 'humano' ? 'Humano' : a === 'androide' ? 'Androide' : 'Animal'}
              </button>
            ))}
          </div>
        </section>

        {config.arquetipo === 'humano' && (
          <>
            <section>
              <h3>Roupa (corpo + pernas + pés)</h3>
              <div className="avst-3d-chips">
                {VARIANTES.map((v) => (
                  <button key={v} type="button" className={config.roupa === v ? 'avst-3d-chip-on' : ''}
                    onClick={() => mudar({ roupa: v, mochila: v === 'aventureiro' ? config.mochila : false })}>
                    {ROTULOS_VARIANTE[v]}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h3>Cabeça e cabelo</h3>
              <div className="avst-3d-chips">
                {VARIANTES.map((v) => (
                  <button key={v} type="button" className={config.cabeca === v ? 'avst-3d-chip-on' : ''}
                    onClick={() => mudar({ cabeca: v })}>
                    {ROTULOS_VARIANTE[v]}
                  </button>
                ))}
              </div>
              {config.roupa === 'aventureiro' && (
                <label className="avst-3d-toggle">
                  <input type="checkbox" checked={config.mochila}
                    onChange={(e) => mudar({ mochila: e.target.checked })} />
                  Mochila (acessório do asset)
                </label>
              )}
            </section>
          </>
        )}

        {config.arquetipo === 'androide' && (
          <section>
            <h3>Expressão facial (morph targets)</h3>
            {(['bravo', 'surpreso', 'triste'] as Array<keyof Config3D['morfos']>).map((m) => (
              <label key={m} className="avst-3d-slider">
                <span>{m === 'bravo' ? 'Bravo' : m === 'surpreso' ? 'Surpreso' : 'Triste'}</span>
                <input type="range" min={0} max={1} step={0.01} value={config.morfos[m]}
                  onChange={(e) => mudar({ morfos: { ...config.morfos, [m]: Number(e.target.value) } })} />
              </label>
            ))}
          </section>
        )}

        {/* LEVA 1 dos sockets (fila #37 item 2, decisão #41): itens
            procedurais em 7 dos 14 sockets — aditivos, um item por socket */}
        <section>
          <h3><Gem size={13} aria-hidden /> Acessórios · sockets</h3>
          {SOCKETS_LEVA1.map((socket) => {
            const itens = ITENS_SOCKET.filter((i) => i.socket === socket);
            return (
              <div key={socket} className="avst-3d-socket">
                <span className="avst-3d-socket-nome">{ROTULOS_SOCKET[socket] ?? socket}</span>
                <div className="avst-3d-chips">
                  <button type="button" className={!config.sockets?.[socket] ? 'avst-3d-chip-on' : ''}
                    title="Nada neste socket" onClick={() => mudarSocket(socket, null)}>—</button>
                  {itens.map((item) => (
                    <button key={item.id} type="button"
                      className={config.sockets?.[socket] === item.id ? 'avst-3d-chip-on' : ''}
                      onClick={() => mudarSocket(socket, item.id)}>
                      {item.nome}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <p className="avst-3d-nota">Combine vários sockets ao mesmo tempo — os 14 pontos de encaixe já valem para o corpo premium que vem aí.</p>
        </section>

        <section>
          <h3>Cores e materiais</h3>
          {(Object.keys(CORES_3D) as SlotMaterial[]).map((slot) => (
            <div key={slot} className="avst-3d-cores">
              <span>{slot === 'pele' ? (config.arquetipo === 'animal' ? 'Pelagem' : 'Pele') : slot === 'cabelo' ? 'Cabelo' : slot === 'roupa' ? (config.arquetipo === 'androide' ? 'Carcaça' : 'Roupa') : 'Detalhe'}</span>
              <div>
                {CORES_3D[slot].map((cor) => (
                  <button key={cor} type="button" title={cor}
                    className={config.cores[slot] === cor ? 'avst-3d-swatch-on' : ''}
                    style={{ background: cor }}
                    onClick={() => mudar({ cores: { ...config.cores, [slot]: cor } })} />
                ))}
              </div>
            </div>
          ))}
          <label className="avst-3d-slider">
            <span>Metal</span>
            <input type="range" min={0} max={1} step={0.01} value={config.material.metal}
              onChange={(e) => mudar({ material: { ...config.material, metal: Number(e.target.value) } })} />
          </label>
          <label className="avst-3d-slider">
            <span>Brilho</span>
            <input type="range" min={0} max={1} step={0.01} value={config.material.brilho}
              onChange={(e) => mudar({ material: { ...config.material, brilho: Number(e.target.value) } })} />
          </label>
        </section>

        <section>
          <h3><Sparkles size={13} aria-hidden /> Ações</h3>
          <div className="avst-3d-chips">
            <button type="button" disabled={gesto !== null} onClick={() => setGesto('acenar')}>
              <Hand size={13} aria-hidden /> Acenar
            </button>
            <button type="button" disabled={gesto !== null} onClick={() => setGesto('extra')}>
              <RotateCcw size={13} aria-hidden /> {ROTULO_EXTRA[config.arquetipo]}
            </button>
            <button type="button" className="avst-3d-poder" disabled={fasePoder !== 'inativo'}
              onClick={dispararPoder}>
              <Zap size={13} aria-hidden /> PODER
            </button>
          </div>
        </section>

        <section>
          <h3><Camera size={13} aria-hidden /> Câmera (ou arraste para orbitar)</h3>
          <div className="avst-3d-chips">
            {(['corpo', 'busto', 'rosto', 'tresquartos'] as CameraId[]).map((c) => (
              <button key={c} type="button" className={config.camera === c ? 'avst-3d-chip-on' : ''}
                onClick={() => mudar({ camera: c })}>
                {c === 'corpo' ? 'Corpo' : c === 'busto' ? 'Busto' : c === 'rosto' ? 'Rosto' : '¾'}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3><Lightbulb size={13} aria-hidden /> Iluminação e cenário</h3>
          <div className="avst-3d-chips">
            {(['estudio', 'dramatica', 'neon'] as IluminacaoId[]).map((l) => (
              <button key={l} type="button" className={config.iluminacao === l ? 'avst-3d-chip-on' : ''}
                onClick={() => mudar({ iluminacao: l })}>
                {l === 'estudio' ? 'Estúdio' : l === 'dramatica' ? 'Dramática' : 'Neon'}
              </button>
            ))}
          </div>
          <div className="avst-3d-chips">
            {(['vazio', 'grade', 'estrelas', 'dojo'] as CenarioId[]).map((c) => (
              <button key={c} type="button" className={config.cenario === c ? 'avst-3d-chip-on' : ''}
                onClick={() => mudar({ cenario: c })}>
                {c === 'vazio' ? 'Palco vazio' : c === 'grade' ? 'Grade neon' : c === 'estrelas' ? 'Céu estrelado' : 'Dojo'}
              </button>
            ))}
          </div>
          {/* PALCO VIVO (fila #37 item 4): hora do dia + clima */}
          <div className="avst-3d-chips">
            {(['estudio', 'dia', 'entardecer', 'noite'] as HoraId[]).map((horaOp) => (
              <button key={horaOp} type="button" className={config.hora === horaOp ? 'avst-3d-chip-on' : ''}
                onClick={() => mudar({ hora: horaOp })}>
                {horaOp === 'estudio' ? 'Luz de estúdio' : horaOp === 'dia' ? 'Dia' : horaOp === 'entardecer' ? 'Entardecer' : 'Noite'}
              </button>
            ))}
          </div>
          <div className="avst-3d-chips">
            {(['limpo', 'chuva', 'neve', 'vagalumes'] as ClimaId[]).map((cl) => (
              <button key={cl} type="button" className={config.clima === cl ? 'avst-3d-chip-on' : ''}
                onClick={() => mudar({ clima: cl })}>
                {cl === 'limpo' ? 'Céu limpo' : cl === 'chuva' ? 'Chuva' : cl === 'neve' ? 'Neve' : 'Vagalumes'}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3><Gauge size={13} aria-hidden /> Qualidade</h3>
          <div className="avst-3d-chips">
            <button type="button" className={autoQualidade ? 'avst-3d-chip-on' : ''}
              onClick={() => setAutoQualidade((v) => !v)}>Auto</button>
            {(['alto', 'medio', 'economico'] as Qualidade[]).map((q) => (
              <button key={q} type="button" className={!autoQualidade && qualidade === q ? 'avst-3d-chip-on' : ''}
                onClick={() => { setAutoQualidade(false); setQualidade(q); }}>
                {q === 'alto' ? 'Alto' : q === 'medio' ? 'Médio' : 'Econômico'}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3><Aperture size={13} aria-hidden /> Renders derivados</h3>
          <button type="button" className="avst-botao" onClick={capturar}>
            Gerar prévia do header
          </button>
          <p className="avst-3d-nota">É assim que a Camada 2 nasce: o frame canônico vira o avatar do header/menu — o backend só guarda parâmetros.</p>
        </section>

        <p className="avst-3d-licenca">
          Bases CC0 (Quaternius · RobotExpressive) retrabalhadas pelo pipeline Dshow — licenças em <code>assets/avatars/3d/LICENCAS.md</code>.
        </p>
      </aside>
    </div>
  );
}
