// vc/MaisPainel.tsx — "Mais" do Visual Composer: superfícies NATIVAS das ferramentas do modo 2D,
// reutilizando serviços/componentes/stores existentes (fonte única = AvatarStore canônico).
// Painel direito no desktop, bottom-sheet no mobile; ferramentas imersivas (foto/3D/apresentar/contextos)
// abrem overlay sem trocar para a shell clássica. Clássico só via Diagnóstico (fallback técnico).
import { Suspense, lazy, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  X, ChevronRight, ArrowLeft, Sparkles, Dices, Wand2, Bot, Layers, History, Columns2, ListTree,
  Camera, Presentation, Users, Box, Upload, Download, Archive, Code2, Languages, Volume2, VolumeX,
  Accessibility, Stethoscope, Check, Lock, Heart,
} from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import type { AvatarStore } from '../nucleo/estado';
import { presetsAtivos, aleatorio, aleatorioInteligente, itemPorId, validarConfig, dataUriDe } from '../services/AvatarCatalog';
import { codigoDoLook, lerCodigoDoLook, exportarBackup, interpretarBackup } from '../services/Backup';
import { idiomaAtual, definirIdioma } from '../nucleo/i18n';
import { somAtivo, definirSom } from '../services/Som';
import { AvatarSvg } from '../components/AvatarSvg';

const Historico = lazy(() => import('../components/Historico').then((m) => ({ default: m.Historico })));
const Colecoes = lazy(() => import('../components/Colecoes').then((m) => ({ default: m.Colecoes })));
const Vitrine = lazy(() => import('../components/Vitrine').then((m) => ({ default: m.Vitrine })));
const CriarIA = lazy(() => import('../components/CriarIA').then((m) => ({ default: m.CriarIA })));
const Foto = lazy(() => import('../components/Foto').then((m) => ({ default: m.Foto })));
const Contextos = lazy(() => import('../components/Contextos').then((m) => ({ default: m.Contextos })));
const Estudio3D = lazy(() => import('../poc3d/Estudio3D'));

type Tool =
  | 'aleatorio' | 'looks' | 'colecoes' | 'ia' | 'vitrine'
  | 'historico' | 'comparar' | 'detalhes'
  | 'importar' | 'exportar' | 'backup' | 'codigo'
  | 'idioma' | 'som' | 'a11y' | 'diagnostico';
type Imersivo = 'foto' | '3d' | 'apresentar' | 'contextos';

export interface PropsMaisPainel {
  store: AvatarStore;
  config: AvatarConfig;
  aplicar: (novo: AvatarConfig) => void;
  versao: number;
  desbloqueados: Set<string>;
  vida?: { iaDisponivel?: boolean } | null;
  reduzido: boolean;
  aoGuiada: () => void;        // abre a Criação Guiada (modo do próprio VC)
  aoDiagnostico: () => void;   // abre a interface clássica (fallback técnico)
  aoFechar: () => void;
}

interface ItemMenu { id: string; nome: string; Icone: typeof Dices; imersivo?: boolean; oculto?: boolean; }
interface GrupoMenu { id: string; nome: string; itens: ItemMenu[]; }

const carregando = <div className="vc-mp-carregando" role="status">Carregando…</div>;

export default function MaisPainel({ store, config, aplicar, versao, desbloqueados, vida, reduzido, aoGuiada, aoDiagnostico, aoFechar }: PropsMaisPainel) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [imersivo, setImersivo] = useState<Imersivo | null>(null);
  const [grupoAberto, setGrupoAberto] = useState<string>('criar');
  const iaDisponivel = !!vida?.iaDisponivel;

  const grupos: GrupoMenu[] = useMemo(() => [
    { id: 'criar', nome: 'Criar', itens: [
      { id: 'guiada', nome: 'Passo a passo', Icone: Wand2 },
      { id: 'aleatorio', nome: 'Aleatório', Icone: Dices },
      { id: 'looks', nome: 'Looks', Icone: Sparkles },
      { id: 'colecoes', nome: 'Coleções', Icone: Layers },
      { id: 'vitrine', nome: 'Vitrine', Icone: Users },
      { id: 'ia', nome: 'Assistência por IA', Icone: Bot },
    ] },
    { id: 'revisar', nome: 'Revisar', itens: [
      { id: 'historico', nome: 'Histórico', Icone: History },
      { id: 'comparar', nome: 'Comparar com original', Icone: Columns2 },
      { id: 'detalhes', nome: 'Detalhes da composição', Icone: ListTree },
    ] },
    { id: 'apresentar', nome: 'Apresentar', itens: [
      { id: 'apresentar', nome: 'Apresentação', Icone: Presentation, imersivo: true },
      { id: 'foto', nome: 'Foto', Icone: Camera, imersivo: true },
      { id: 'contextos', nome: 'Showcase', Icone: Users, imersivo: true },
      { id: '3d', nome: 'Abrir modo 3D', Icone: Box, imersivo: true },
    ] },
    { id: 'gerenciar', nome: 'Gerenciar', itens: [
      { id: 'importar', nome: 'Importar', Icone: Upload },
      { id: 'exportar', nome: 'Exportar', Icone: Download },
      { id: 'backup', nome: 'Backup', Icone: Archive },
      { id: 'codigo', nome: 'Código do look', Icone: Code2 },
    ] },
    { id: 'preferencias', nome: 'Preferências', itens: [
      { id: 'idioma', nome: 'Idioma', Icone: Languages },
      { id: 'som', nome: 'Som', Icone: Volume2 },
      { id: 'a11y', nome: 'Acessibilidade', Icone: Accessibility },
      { id: 'diagnostico', nome: 'Diagnóstico', Icone: Stethoscope },
    ] },
  ], []);

  const abrir = useCallback((it: ItemMenu) => {
    if (it.id === 'guiada') { aoGuiada(); return; }
    if (it.imersivo) setImersivo(it.id as Imersivo);
    else setTool(it.id as Tool);
  }, [aoGuiada]);

  const tituloTool = useMemo(() => {
    for (const g of grupos) { const it = g.itens.find((x) => x.id === tool); if (it) return it.nome; }
    return 'Mais';
  }, [grupos, tool]);

  // Escape fecha (ferramenta -> menu -> painel)
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (imersivo) setImersivo(null); else if (tool) setTool(null); else aoFechar(); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [imersivo, tool, aoFechar]);

  // ---------- IMERSIVO ----------
  if (imersivo) {
    return (
      <div className="vc-imersivo" role="dialog" aria-modal="true" aria-label={imersivo === 'foto' ? 'Foto' : imersivo === '3d' ? 'Modo 3D' : imersivo === 'contextos' ? 'Showcase' : 'Apresentação'}>
        <div className="vc-imersivo-barra">
          <button className="vc-acao" onClick={() => setImersivo(null)} aria-label="Voltar ao estúdio"><ArrowLeft size={18} aria-hidden /><span className="vc-lbl">Voltar ao estúdio</span></button>
          <span className="vc-imersivo-tit">{imersivo === 'foto' ? 'Foto' : imersivo === '3d' ? 'Modo 3D' : imersivo === 'contextos' ? 'Showcase' : 'Apresentação'}</span>
        </div>
        <div className="vc-imersivo-corpo">
          {imersivo === 'apresentar' && (
            <div className="vc-apresentar"><div className="vc-apresentar-palco"><AvatarSvg config={config} uid="vc-apresentar" palco estatico={reduzido} /></div></div>
          )}
          {imersivo === 'contextos' && (
            <Suspense fallback={carregando}><Contextos config={config} aoFechar={() => setImersivo(null)} /></Suspense>
          )}
          {imersivo === 'foto' && (
            <Suspense fallback={carregando}>
              <Foto versao={versao} fotoAtiva={false} desbloqueados={desbloqueados}
                aoSalvar={(nv) => { try { store.confirmarPersistencia(nv); } catch { /* ok */ } }} configAtual={config} />
            </Suspense>
          )}
          {imersivo === '3d' && (
            <Suspense fallback={carregando}>
              <Estudio3D corDestaque={config.cores?.destaque} versaoBase={versao} config3dInicial={null}
                aoSalvar={(nv) => { try { store.confirmarPersistencia(nv); } catch { /* ok */ } }} />
            </Suspense>
          )}
        </div>
      </div>
    );
  }

  // ---------- PAINEL (menu ou ferramenta) ----------
  return (
    <div className="vc-back vc-mp-back" onClick={aoFechar}>
      <aside className="vc-mp" role="dialog" aria-modal="true" aria-label="Mais ferramentas" onClick={(e) => e.stopPropagation()}>
        <header className="vc-mp-cab">
          {tool ? (
            <button className="vc-acao vc-icone" onClick={() => setTool(null)} aria-label="Voltar"><ArrowLeft size={18} aria-hidden /></button>
          ) : <span className="vc-mp-marca"><Wand2 size={16} aria-hidden /></span>}
          <span className="vc-mp-tit">{tool ? tituloTool : 'Mais'}</span>
          <button className="vc-acao vc-icone" onClick={aoFechar} aria-label="Fechar"><X size={18} aria-hidden /></button>
        </header>

        <div className="vc-mp-corpo">
          {!tool && grupos.map((g) => {
            const aberto = grupoAberto === g.id;
            return (
              <section key={g.id} className="vc-mp-grupo">
                <button className="vc-mp-grupo-cab" aria-expanded={aberto} onClick={() => setGrupoAberto(aberto ? '' : g.id)}>
                  <span>{g.nome}</span><ChevronRight size={16} aria-hidden className={aberto ? 'vc-mp-rot' : ''} />
                </button>
                {aberto && (
                  <div className="vc-mp-itens">
                    {g.itens.filter((it) => !it.oculto).map((it) => { const Ic = it.Icone; return (
                      <button key={it.id} className="vc-mp-item" onClick={() => abrir(it)}>
                        <Ic size={18} aria-hidden /><span>{it.nome}</span>
                        {it.imersivo && <ChevronRight size={14} aria-hidden className="vc-mp-ext" />}
                      </button>
                    ); })}
                  </div>
                )}
              </section>
            );
          })}

          {tool && (
            <div className="vc-mp-tool">
              {tool === 'aleatorio' && <ToolAleatorio config={config} aplicar={aplicar} />}
              {tool === 'looks' && <ToolLooks config={config} aplicar={aplicar} />}
              {tool === 'codigo' && <ToolCodigo config={config} aplicar={aplicar} />}
              {tool === 'importar' && <ToolImportar aplicar={aplicar} />}
              {tool === 'exportar' && <ToolExportar config={config} />}
              {tool === 'backup' && <ToolBackup config={config} />}
              {tool === 'comparar' && <ToolComparar store={store} config={config} reduzido={reduzido} />}
              {tool === 'detalhes' && <ToolDetalhes config={config} />}
              {tool === 'idioma' && <ToolIdioma />}
              {tool === 'som' && <ToolSom />}
              {tool === 'a11y' && <ToolA11y reduzido={reduzido} />}
              {tool === 'diagnostico' && <ToolDiagnostico aoDiagnostico={aoDiagnostico} />}
              {tool === 'historico' && <Suspense fallback={carregando}><Historico versaoBase={versao} aoAplicar={aplicar} aoReativar={(nv) => { try { store.confirmarPersistencia(nv); } catch { /* ok */ } }} /></Suspense>}
              {tool === 'colecoes' && <Suspense fallback={carregando}><Colecoes config={config} aoAplicar={aplicar} /></Suspense>}
              {tool === 'vitrine' && <Suspense fallback={carregando}><Vitrine config={config} desbloqueados={desbloqueados} aoAplicar={aplicar} aoAbrirColecoes={() => setTool('colecoes')} /></Suspense>}
              {tool === 'ia' && <Suspense fallback={carregando}><CriarIA config={config} iaDisponivel={iaDisponivel} aoAplicar={aplicar} desbloqueados={desbloqueados} /></Suspense>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

// ---------------- superfícies nativas ----------------

function ToolAleatorio({ config, aplicar }: { config: AvatarConfig; aplicar: (c: AvatarConfig) => void }) {
  const semente = useRef(Date.now() % 2147483647);
  const sortear = (escopo: 'tudo' | 'rosto' | 'roupa' | 'personagem') => {
    semente.current = (semente.current * 48271) % 2147483647;
    let novo: AvatarConfig;
    try { novo = escopo === 'tudo' ? aleatorio(semente.current) : aleatorioInteligente(config, { escopo } as never); }
    catch { novo = aleatorio(semente.current); }
    aplicar(validarConfig(novo));
  };
  return (
    <div className="vc-mp-sec">
      <p className="vc-mp-ajuda">O resultado aparece no palco como alteração pendente — dá para desfazer.</p>
      <div className="vc-mp-botoes">
        <button className="vc-salvar vc-bloco" onClick={() => sortear('tudo')}><Dices size={16} aria-hidden /> Composição completa</button>
        <button className="vc-acao vc-bloco" onClick={() => sortear('personagem')}>Personagem</button>
        <button className="vc-acao vc-bloco" onClick={() => sortear('rosto')}>Rosto</button>
        <button className="vc-acao vc-bloco" onClick={() => sortear('roupa')}>Roupa</button>
      </div>
    </div>
  );
}

function ToolLooks({ config, aplicar }: { config: AvatarConfig; aplicar: (c: AvatarConfig) => void }) {
  const looks = useMemo(() => { try { return presetsAtivos(); } catch { return []; } }, []);
  return (
    <div className="vc-mp-sec">
      <p className="vc-mp-ajuda">Aplique um look inteiro — reversível pelo desfazer.</p>
      <div className="vc-looks">
        {looks.map((p) => (
          <button key={p.id} type="button" className="vc-look" title={p.nome}
            onClick={() => aplicar(validarConfig({ ...p.config, formato: 'camadas', versao: config.versao } as AvatarConfig))}>
            <img className="vc-look-img" alt="" src={dataUriDe(validarConfig({ ...p.config, formato: 'camadas', versao: 0 } as AvatarConfig))} />
            <span className="vc-card-nome">{p.nome}</span>
          </button>
        ))}
        {looks.length === 0 && <div className="vc-vazio">Sem looks disponíveis.</div>}
      </div>
      <details className="vc-mp-det"><summary>Importar/exportar look</summary>
        <p className="vc-mp-ajuda">Use a seção <strong>Código do look</strong> (em Gerenciar) para copiar ou colar um look.</p>
      </details>
    </div>
  );
}

function ToolCodigo({ config, aplicar }: { config: AvatarConfig; aplicar: (c: AvatarConfig) => void }) {
  const codigo = useMemo(() => { try { return codigoDoLook(config); } catch { return ''; } }, [config]);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => { try { await navigator.clipboard.writeText(codigo); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch { /* ok */ } };
  const aplicarCodigo = () => {
    setErro(null);
    const cfg = (() => { try { return lerCodigoDoLook(texto.trim()); } catch { return null; } })();
    if (!cfg) { setErro('Código inválido — nada foi alterado.'); return; }
    aplicar(validarConfig(cfg));
  };
  return (
    <div className="vc-mp-sec">
      <label className="vc-mp-lbl">Código deste look</label>
      <textarea className="vc-mp-ta" readOnly value={codigo} rows={3} />
      <button className="vc-acao vc-bloco" onClick={copiar}>{copiado ? 'Copiado!' : 'Copiar'}</button>
      <label className="vc-mp-lbl">Colar um código</label>
      <textarea className="vc-mp-ta" value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} placeholder="Cole aqui…" />
      {erro && <p className="vc-mp-erro">{erro}</p>}
      <button className="vc-salvar vc-bloco" onClick={aplicarCodigo} disabled={!texto.trim()}>Aplicar código</button>
    </div>
  );
}

function ToolImportar({ aplicar }: { aplicar: (c: AvatarConfig) => void }) {
  const [pendente, setPendente] = useState<AvatarConfig | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const lerTexto = (txt: string) => {
    setErro(null);
    let cfg: AvatarConfig | null = null;
    try { cfg = lerCodigoDoLook(txt.trim()); } catch { cfg = null; }
    if (!cfg) { try { const r = interpretarBackup(txt); cfg = (r as { config?: AvatarConfig } | null)?.config ?? null; } catch { cfg = null; } }
    if (!cfg) { setErro('Arquivo/código não reconhecido — nada foi alterado.'); return; }
    setPendente(cfg);
  };
  const arquivo = (f: File | undefined) => { if (!f) return; const fr = new FileReader(); fr.onload = () => lerTexto(String(fr.result || '')); fr.readAsText(f); };
  return (
    <div className="vc-mp-sec">
      <p className="vc-mp-ajuda">Selecione um arquivo ou cole um código. Nada é substituído sem sua confirmação.</p>
      <input type="file" accept=".txt,.json,application/json,text/plain" onChange={(e) => arquivo(e.target.files?.[0])} aria-label="Arquivo para importar" />
      <textarea className="vc-mp-ta" rows={3} placeholder="…ou cole aqui" onChange={(e) => lerTexto(e.target.value)} />
      {erro && <p className="vc-mp-erro">{erro}</p>}
      {pendente && (
        <div className="vc-mp-confirma">
          <span>Aplicar a composição importada?</span>
          <div className="vc-mp-botoes">
            <button className="vc-salvar" onClick={() => { aplicar(validarConfig(pendente)); setPendente(null); }}>Aplicar</button>
            <button className="vc-acao" onClick={() => setPendente(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolExportar({ config }: { config: AvatarConfig }) {
  const [feito, setFeito] = useState(false);
  const exportar = () => { try { exportarBackup(config); setFeito(true); setTimeout(() => setFeito(false), 1500); } catch { /* ok */ } };
  return (
    <div className="vc-mp-sec">
      <p className="vc-mp-ajuda">Baixe a composição atual como arquivo (mesmo formato do backup).</p>
      <button className="vc-salvar vc-bloco" onClick={exportar}><Download size={16} aria-hidden /> {feito ? 'Arquivo gerado' : 'Exportar composição'}</button>
      <p className="vc-mp-ajuda">Para exportar como imagem, use <strong>Foto</strong> (em Apresentar).</p>
    </div>
  );
}

function ToolBackup({ config }: { config: AvatarConfig }) {
  const [feito, setFeito] = useState(false);
  const backup = () => { try { exportarBackup(config); setFeito(true); setTimeout(() => setFeito(false), 1500); } catch { /* ok */ } };
  return (
    <div className="vc-mp-sec">
      <p className="vc-mp-ajuda">Gera um arquivo de backup da composição atual para restaurar depois (via Importar).</p>
      <button className="vc-salvar vc-bloco" onClick={backup}><Archive size={16} aria-hidden /> {feito ? 'Backup gerado' : 'Gerar backup'}</button>
    </div>
  );
}

function ToolComparar({ store, config, reduzido }: { store: AvatarStore; config: AvatarConfig; reduzido: boolean }) {
  // "Original" = estado persistido (fonte única); "Editando" = draft atual.
  const persistido = useMemo(() => { try { return store.estadoPersistido; } catch { return null; } }, [store]);
  const igual = useMemo(() => { try { return JSON.stringify(store.estadoPersistido) === JSON.stringify(store.estadoDraft); } catch { return true; } }, [store, config]);
  return (
    <div className="vc-mp-sec">
      <div className="vc-mp-comparar">
        <figure><div className="vc-mp-cmp"><AvatarSvg config={config} uid="cmp-atual-mp" palco estatico={reduzido} /></div><figcaption>Editando</figcaption></figure>
      </div>
      <p className="vc-mp-ajuda">{igual ? 'Sem alterações em relação ao salvo.' : 'Há alterações não salvas — use Desfazer para voltar passo a passo.'}</p>
      <p className="vc-mp-nota">{persistido ? '' : ''}</p>
    </div>
  );
}

function ToolDetalhes({ config }: { config: AvatarConfig }) {
  const itens = useMemo(() => {
    const ids: Array<{ cat: string; id: string }> = [];
    if (config.base) ids.push({ cat: 'base', id: config.base });
    for (const [cat, id] of Object.entries(config.camadas || {})) { if (id) ids.push({ cat, id: id as string }); }
    return ids.map(({ cat, id }) => { const it = itemPorId(id); return { cat, id, nome: it?.nome ?? id, raridade: it?.raridade }; });
  }, [config]);
  return (
    <div className="vc-mp-sec">
      <ul className="vc-mp-lista">
        {itens.map((x) => (<li key={`${x.cat}:${x.id}`}><span className="vc-mp-cat">{x.cat}</span><span className="vc-mp-nome">{x.nome}</span>{x.raridade && <span className="vc-mp-rar">{x.raridade}</span>}</li>))}
      </ul>
      {itens.length === 0 && <div className="vc-vazio">Composição vazia.</div>}
    </div>
  );
}

function ToolIdioma() {
  const [id, setId] = useState(() => { try { return idiomaAtual(); } catch { return 'pt'; } });
  const trocar = (novo: 'pt' | 'en') => { try { definirIdioma(novo as never); setId(novo as never); } catch { /* ok */ } };
  return (
    <div className="vc-mp-sec">
      <div className="vc-mp-botoes">
        <button className={`vc-acao vc-bloco ${id === 'pt' ? 'vc-mp-on' : ''}`} onClick={() => trocar('pt')}>Português</button>
        <button className={`vc-acao vc-bloco ${id === 'en' ? 'vc-mp-on' : ''}`} onClick={() => trocar('en')}>English</button>
      </div>
      <p className="vc-mp-ajuda">A troca de idioma vale para a interface do estúdio.</p>
    </div>
  );
}

function ToolSom() {
  const [on, setOn] = useState(() => { try { return somAtivo(); } catch { return true; } });
  const alternar = () => { const novo = !on; try { definirSom(novo); } catch { /* ok */ } setOn(novo); };
  return (
    <div className="vc-mp-sec">
      <button className="vc-acao vc-bloco" onClick={alternar} aria-pressed={on}>{on ? <Volume2 size={16} aria-hidden /> : <VolumeX size={16} aria-hidden />} {on ? 'Sons ligados' : 'Sons desligados'}</button>
    </div>
  );
}

function ToolA11y({ reduzido }: { reduzido: boolean }) {
  return (
    <div className="vc-mp-sec">
      <p className="vc-mp-ajuda">O estúdio respeita suas preferências do sistema.</p>
      <ul className="vc-mp-lista">
        <li><span className="vc-mp-nome">Animações reduzidas</span><span className="vc-mp-rar">{reduzido ? 'ativo (sistema)' : 'inativo'}</span></li>
        <li><span className="vc-mp-nome">Atalhos</span><span className="vc-mp-rar">Ctrl+Z / Ctrl+Shift+Z / Ctrl+S / Esc</span></li>
        <li><span className="vc-mp-nome">Navegação</span><span className="vc-mp-rar">Tab + foco visível</span></li>
      </ul>
    </div>
  );
}

function ToolDiagnostico({ aoDiagnostico }: { aoDiagnostico: () => void }) {
  return (
    <div className="vc-mp-sec">
      <p className="vc-mp-ajuda"><strong>Fallback técnico.</strong> A interface clássica existe apenas para diagnóstico e rollback. O caminho normal é o próprio Visual Composer.</p>
      <button className="vc-acao vc-bloco" onClick={aoDiagnostico}><Stethoscope size={16} aria-hidden /> Abrir interface clássica</button>
      <p className="vc-mp-nota">Você volta ao estúdio sem recarregar; a composição e o histórico são preservados.</p>
    </div>
  );
}
