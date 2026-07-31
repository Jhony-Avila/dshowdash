// shell/ShellStudio.tsx — NOVO SHELL do Avatar Studio 5.0 (F2 S1, decisão #47).
// @version 0.1.0  @created 2026-07-31
//
// Layout de editor profissional (P1 §8): sidebar de categorias ajustável ·
// VIEWPORT DOMINANTE (P1 §9) · painel direito com scroll PRÓPRIO (P1 §20,
// §38 — o avatar nunca sai do foco). Vive atrás da flag as5.novo_shell;
// com a flag OFF o App atual segue intacto. O estado é o AvatarStore da F1
// (comandos + undo/redo); o catálogo reusa GradeItens (auditado MANTER).
import { Component, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { ArrowUp, ChevronsLeft, ChevronsRight, Clapperboard, Dices, Eye, Focus, LayoutGrid, Palette, Redo2, ShieldAlert, Undo2, X } from 'lucide-react';
import type { AvatarConfig, CategoriaId, SlotAcessorio } from '../domain/types';
import { CATEGORIAS, aleatorioInteligente, itemPorId, validarConfig } from '../services/AvatarCatalog';
import type { ModoAleatorio } from '../services/AvatarCatalog';
import { favoritos } from '../services/Progresso';
import { conectarTelemetria } from '../services/ObservarNucleo';
import { AvatarStore } from '../nucleo/estado';
import type { Comando } from '../nucleo/estado';
import { checksumEstado } from '../nucleo/contratos';
import { deLegado2d, paraLegado2d } from '../nucleo/adaptadores';
import { AvatarSvg } from '../components/AvatarSvg';
import { GradeItens } from '../components/GradeItens';
import type { AbaCatalogo } from '../components/GradeItens';
import { Cores } from '../components/Cores';
import { Equipados, alternarBloqueio, lerBloqueios } from './Equipados';
import { PropriedadesAsset } from './PropriedadesAsset';
import { PresetsShell } from './PresetsShell';
import { HistoricoSessao, useHistoricoSessao } from './HistoricoSessao';
import {
  CHAVE_RASCUNHO_STORAGE, gravarRascunho, idDaAba, lerRascunho, limparRascunho,
} from '../services/PresetsPessoais';
import type { Rascunho } from '../services/PresetsPessoais';
import { BarraSalvamento } from './BarraSalvamento';

/** §68.3: chips de navegação por slot na categoria Acessórios. */
const CHIPS_SLOT: Array<{ id: 'todos' | SlotAcessorio; nome: string }> = [
  { id: 'todos', nome: 'Todos' },
  { id: 'cabeca', nome: 'Cabeça' },
  { id: 'rosto', nome: 'Rosto' },
  { id: 'pescoco', nome: 'Pescoço' },
];

const CHAVE_LARGURAS = 'dshow.avst5.larguras.v1';
const CHAVE_FUNDO = 'dshow.avst5.fundo.v1';

/** R2 (P1 §9.4): enquadramento AUTOMÁTICO por categoria — retângulo do
 *  viewBox 240×240 que a câmera deve ocupar (FOCO_THUMB é a semente). */
const ENQUADRAMENTOS: Partial<Record<CategoriaId, [number, number, number, number]>> = {
  base: [45, 36, 150, 150],
  cabelo: [38, 6, 164, 164],
  olhos: [64, 56, 112, 112],
  boca: [66, 92, 108, 108],
  acessorio: [40, 28, 160, 160],
  roupa: [30, 70, 180, 170],
  emblema: [108, 162, 92, 92],
};

/** R1 (P1 §9.3): fundos do palco por MODO. */
const FUNDOS_PALCO = ['neutro', 'estudio', 'grade'] as const;
type FundoPalco = (typeof FUNDOS_PALCO)[number];
const ROTULO_FUNDO: Record<FundoPalco, string> = { neutro: 'Neutro', estudio: 'Estúdio', grade: 'Grade' };
const DEGRAUS_ESQ = [64, 84, 176, 220, 280];

function lerLarguras(): { esq: number; dir: number } {
  try {
    const l = JSON.parse(localStorage.getItem(CHAVE_LARGURAS) ?? '{}') as { esq?: number; dir?: number };
    return { esq: l.esq ?? 176, dir: l.dir ?? 380 };
  } catch { return { esq: 176, dir: 380 }; }
}

/** Error boundary do shell (R10) — falha aqui nunca derruba o painel. */
class LimiteShell extends Component<{ aoSair: () => void; children: ReactNode }, { erro: boolean }> {
  state = { erro: false };
  static getDerivedStateFromError() { return { erro: true }; }
  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="avst5-erro" role="alert">
        <ShieldAlert size={26} aria-hidden />
        <p>O novo estúdio encontrou um erro — voltando ao modo clássico.</p>
        <button type="button" className="avst-botao" onClick={this.props.aoSair}>Voltar agora</button>
      </div>
    );
  }
}

export function ShellStudio({ configInicial, versaoBase, desbloqueados, aoSalvarLegado, aoSairDoShell }: {
  configInicial: AvatarConfig;
  versaoBase: number;
  desbloqueados: Set<string>;
  /** salva pelo caminho legado (studio.php) até o corte do §619 */
  aoSalvarLegado: (config: AvatarConfig) => Promise<{ ok: boolean; versao?: number }>;
  /** flag off / erro → App clássico */
  aoSairDoShell: () => void;
}) {
  const store = useMemo(() => {
    const s = new AvatarStore(deLegado2d(configInicial), versaoBase);
    return s;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => conectarTelemetria(store), [store]);

  // assinatura do estado visível (preview > draft) — §608
  const estado = useSyncExternalStore(store.assinar, () => store.estadoVisivel);
  const configVisivel = useMemo(() => validarConfig(paraLegado2d(estado)), [estado]);

  // estados locais de UI (§607.2/§607.3 — nunca entram no AvatarStore)
  const [categoria, setCategoria] = useState<CategoriaId>('base');
  const [larguras, setLarguras] = useState(lerLarguras);
  const [aba, setAba] = useState<AbaCatalogo | 'presets'>('todos');
  // §68.3: chip de slot ativo (só em Acessórios; troca de categoria zera)
  const [filtroSlot, setFiltroSlot] = useState<'todos' | SlotAcessorio>('todos');
  // R7/R8: modos do palco — edicao | foco (F/Esc) | studio (apresentação)
  const [modo, setModo] = useState<'edicao' | 'foco' | 'studio'>('edicao');
  const [painelLargo, setPainelLargo] = useState(false);
  const [painelFechado, setPainelFechado] = useState(false);
  const [mostrarTopo, setMostrarTopo] = useState(false);
  const [propriedades, setPropriedades] = useState(false);
  const [bloqueios, setBloqueios] = useState<Set<string>>(() => lerBloqueios());
  const [, setTicFavs] = useState(0); // re-render após favoritar no Equipados
  // §69.1: conflito pendente aguardando decisão do usuário
  const [conflito, setConflito] = useState<{ novo: AvatarConfig; slot: string; antes: string; depois: string } | null>(null);
  const refPainel = useRef<HTMLDivElement>(null);
  const [fundo, setFundo] = useState<FundoPalco>(() => {
    try {
      const f = localStorage.getItem(CHAVE_FUNDO) as FundoPalco | null;
      return f && (FUNDOS_PALCO as readonly string[]).includes(f) ? f : 'estudio';
    } catch { return 'estudio'; }
  });

  // R11: atalhos de undo/redo (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y)
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const alvo = e.target as HTMLElement | null;
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return;
      if (e.key.toLowerCase() === 'z' && e.shiftKey) { e.preventDefault(); store.refazer(); }
      else if (e.key.toLowerCase() === 'z') { e.preventDefault(); store.desfazer(); }
      else if (e.key.toLowerCase() === 'y') { e.preventDefault(); store.refazer(); }
    };
    const aoTeclarModo = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return;
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setModo((m) => (m === 'foco' ? 'edicao' : 'foco'));
      } else if (e.key === 'Escape') {
        setModo('edicao');
      }
    };
    window.addEventListener('keydown', aoTeclarModo);
    window.addEventListener('keydown', aoTeclar);
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      window.removeEventListener('keydown', aoTeclarModo);
    };
  }, [store]);

  // R2: câmera contextual — zoom suave via transform (viewBox não anima)
  const enquadramento = ENQUADRAMENTOS[categoria];
  const zoomEstilo = useMemo(() => {
    if (!enquadramento) return { transform: 'scale(1)', transformOrigin: '50% 50%' };
    const [x, y, w, h] = enquadramento;
    return {
      transform: `scale(${Math.min(2.4, 240 / Math.max(w, h))})`,
      transformOrigin: `${((x + w / 2) / 240) * 100}% ${((y + h / 2) / 240) * 100}%`,
    };
  }, [enquadramento]);

  const trocarFundo = (f: FundoPalco) => {
    setFundo(f);
    try { localStorage.setItem(CHAVE_FUNDO, f); } catch { /* sem storage */ }
  };

  // GradeItens fala AvatarConfig — cada escolha vira COMANDO com inverso
  const aplicarComando = useCallback((novo: AvatarConfig) => {
    const antes = store.estadoDraft;
    const depois = deLegado2d(novo);
    // no-op nunca entra na pilha (clique em slider parado, re-clique na base)
    if (checksumEstado(antes) === checksumEstado(depois)) return;
    const cmd: Comando = {
      nome: `equipar:${novoDiff(paraLegado2d(antes), novo)}`,
      executar: () => depois,
      desfazer: () => antes,
    };
    store.executar(cmd);
  }, [store]);

  // §69.1: SUBSTITUIÇÃO em slot (item A → item B) ou slot BLOQUEADO pede
  // confirmação explícita — nada de troca silenciosa
  const aoEscolher = useCallback((novo: AvatarConfig) => {
    const antes = paraLegado2d(store.estadoDraft);
    const chaves = new Set([...Object.keys(antes.camadas), ...Object.keys(novo.camadas)]);
    for (const slot of chaves) {
      const a = (antes.camadas as Record<string, string | undefined>)[slot];
      const b = (novo.camadas as Record<string, string | undefined>)[slot];
      if (a && b && a !== b && (bloqueios.has(slot) || slot.startsWith('acessorio'))) {
        setConflito({ novo, slot, antes: a, depois: b });
        return;
      }
      if (a && !b && bloqueios.has(slot)) { // remoção de slot bloqueado
        setConflito({ novo, slot, antes: a, depois: '' });
        return;
      }
    }
    aplicarComando(novo);
  }, [store, bloqueios, aplicarComando]);

  // §64: hover do card → preview no palco (nunca contamina o draft)
  const aoPrever = useCallback((cfg: AvatarConfig | null) => {
    if (cfg) store.visualizar(() => deLegado2d(cfg));
    else store.limparPreview();
  }, [store]);

  // §90: aleatório inteligente — bloqueios §70.1 NUNCA são trocados.
  // Aplica direto (sem modal §69.1): a proteção já aconteceu no sorteio.
  const [menuAleatorio, setMenuAleatorio] = useState(false);
  const rodarAleatorio = useCallback((modoAlea: ModoAleatorio) => {
    setMenuAleatorio(false);
    const novo = aleatorioInteligente(paraLegado2d(store.estadoDraft), {
      semente: Date.now() % 2147483647,
      modo: modoAlea,
      categoria,
      bloqueados: lerBloqueios(),
      favoritos: favoritos(),
    });
    aplicarComando(novo);
  }, [store, categoria, aplicarComando]);

  // §65.3: comparação por tecla — SEGURAR mostra a versão persistida
  const [comparando, setComparando] = useState(false);
  useEffect(() => {
    const baixo = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return;
      if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey && !e.altKey) setComparando(true);
    };
    const cima = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'v') setComparando(false);
    };
    window.addEventListener('keydown', baixo);
    window.addEventListener('keyup', cima);
    return () => { window.removeEventListener('keydown', baixo); window.removeEventListener('keyup', cima); };
  }, []);
  const configPalco = useMemo(
    () => (comparando ? validarConfig(paraLegado2d(store.estadoPersistido)) : configVisivel),
    [comparando, configVisivel, store],
  );

  // §138: registro da timeline vive AQUI (a sessão inteira, não só na aba)
  const historico = useHistoricoSessao(store);

  // §139: AUTOSAVE do rascunho (debounce) — limpa quando não há mudanças
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const parar = store.assinar(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (store.temMudancas) gravarRascunho(paraLegado2d(store.estadoDraft), store.versao);
        else limparRascunho();
      }, 800);
    });
    return () => { clearTimeout(timer); parar(); };
  }, [store]);

  // §139: recuperação — rascunho órfão diferente do estado carregado
  const [rascunho, setRascunho] = useState<Rascunho | null>(() => {
    const r = lerRascunho();
    if (!r) return null;
    return JSON.stringify(validarConfig(r.config)) !== JSON.stringify(validarConfig(configInicial)) ? r : null;
  });

  // §629 "conflito entre abas": outra aba gravou rascunho → avisa
  const [outraAba, setOutraAba] = useState(false);
  useEffect(() => {
    const aoStorage = (e: StorageEvent) => {
      if (e.key !== CHAVE_RASCUNHO_STORAGE || !e.newValue) return;
      try {
        const r = JSON.parse(e.newValue) as Rascunho;
        if (r.aba && r.aba !== idDaAba()) setOutraAba(true);
      } catch { /* rascunho ilegível — ignora */ }
    };
    window.addEventListener('storage', aoStorage);
    return () => window.removeEventListener('storage', aoStorage);
  }, []);

  // §68.2: resumo dos acessórios equipados no topo da categoria
  const resumoAcessorios = useMemo(() => {
    const nomes = (['acessorio_cabeca', 'acessorio_rosto', 'acessorio_pescoco'] as const)
      .map((s) => configVisivel.camadas[s])
      .filter((id): id is string => Boolean(id))
      .map((id) => itemPorId(id)?.nome ?? id);
    return nomes;
  }, [configVisivel]);

  // arraste das larguras (R3/R4) com persistência
  const arraste = useRef<{ lado: 'esq' | 'dir'; x0: number; w0: number } | null>(null);
  const aoMoverPonteiro = useCallback((e: PointerEvent) => {
    const a = arraste.current;
    if (!a) return;
    const delta = a.lado === 'esq' ? e.clientX - a.x0 : a.x0 - e.clientX;
    const bruto = a.w0 + delta;
    const novo = a.lado === 'esq'
      ? DEGRAUS_ESQ.reduce((m, d) => (Math.abs(d - bruto) < Math.abs(m - bruto) ? d : m), DEGRAUS_ESQ[2])
      : Math.min(520, Math.max(280, bruto));
    setLarguras((l) => {
      const prox = { ...l, [a.lado]: novo };
      try { localStorage.setItem(CHAVE_LARGURAS, JSON.stringify(prox)); } catch { /* sem storage */ }
      return prox;
    });
  }, [setLarguras]);
  useEffect(() => {
    const soltar = () => { arraste.current = null; };
    window.addEventListener('pointermove', aoMoverPonteiro);
    window.addEventListener('pointerup', soltar);
    return () => { window.removeEventListener('pointermove', aoMoverPonteiro); window.removeEventListener('pointerup', soltar); };
  }, [aoMoverPonteiro]);

  const compacta = larguras.esq <= 84;

  return (
    <LimiteShell aoSair={aoSairDoShell}>
      <div className="avst5-shell" data-avst5="1" data-modo={modo}
        style={{ '--avst5-esq': `${larguras.esq}px`,
          '--avst5-dir': painelFechado ? '36px' : painelLargo ? '560px' : `${larguras.dir}px` } as React.CSSProperties}>
        {/* header interno (§626) */}
        <header className="avst5-header">
          <strong>Avatar Studio</strong>
          <span className="avst5-header-sub">5.0 · novo estúdio (prévia)</span>
          <div className="avst5-header-acoes">
            <div className="avst5-alea">
              <button type="button" className="avst-botao" title="Aleatório inteligente (§90)"
                aria-expanded={menuAleatorio} aria-haspopup="menu"
                onClick={() => setMenuAleatorio((v) => !v)}>
                <Dices size={14} aria-hidden /> Aleatório
              </button>
              {menuAleatorio && (<>
                <button type="button" className="avst-fpop-fundo" aria-label="Fechar menu"
                  onClick={() => setMenuAleatorio(false)} />
                <div className="avst5-alea-menu" role="menu" aria-label="Modos de aleatório">
                  <button type="button" role="menuitem" onClick={() => rodarAleatorio('completo')}>Completo <small>respeita bloqueios</small></button>
                  <button type="button" role="menuitem" onClick={() => rodarAleatorio('categoria')}>Só esta categoria</button>
                  <button type="button" role="menuitem" onClick={() => rodarAleatorio('cores')}>Só cores</button>
                  <button type="button" role="menuitem" onClick={() => rodarAleatorio('favoritos')}>Dos favoritos</button>
                </div>
              </>)}
            </div>
            <button type="button" className="avst-botao" title="Modo foco (F)"
              aria-pressed={modo === 'foco'}
              onClick={() => setModo((m) => (m === 'foco' ? 'edicao' : 'foco'))}>
              <Focus size={14} aria-hidden /></button>
            <button type="button" className="avst-botao" title="Modo Studio (apresentação)"
              aria-pressed={modo === 'studio'}
              onClick={() => setModo((m) => (m === 'studio' ? 'edicao' : 'studio'))}>
              <Clapperboard size={14} aria-hidden /></button>
            <button type="button" className="avst-botao" disabled={!store.podeDesfazer}
              title="Desfazer (Ctrl+Z)" onClick={() => store.desfazer()}><Undo2 size={14} aria-hidden /></button>
            <button type="button" className="avst-botao" disabled={!store.podeRefazer}
              title="Refazer" onClick={() => store.refazer()}><Redo2 size={14} aria-hidden /></button>
            <button type="button" className="avst-botao" onClick={aoSairDoShell}>Modo clássico</button>
          </div>
        </header>

        <div className="avst5-corpo">
          {/* sidebar esquerda — scroll próprio (R5) */}
          <nav className={`avst5-sidebar${compacta ? ' avst5-sidebar-compacta' : ''}`} aria-label="Categorias">
            {CATEGORIAS.map((c) => (
              <button key={c.id} type="button"
                className={`avst5-cat${categoria === c.id ? ' avst5-cat-on' : ''}`}
                title={c.nome} onClick={() => { setCategoria(c.id); setFiltroSlot('todos'); }}>
                <span className="avst5-cat-inicial" aria-hidden>{c.nome.slice(0, 1)}</span>
                {!compacta && <span>{c.nome}</span>}
              </button>
            ))}
          </nav>
          <div className="avst5-alca" role="separator" aria-orientation="vertical" aria-label="Redimensionar navegação"
            onPointerDown={(e) => { arraste.current = { lado: 'esq', x0: e.clientX, w0: larguras.esq }; }} />

          {/* viewport dominante (R1) — SEM scroll de página (R5) */}
          <main className="avst5-viewport" aria-label="Palco do avatar" data-fundo={fundo}>
            <div className="avst5-palco">
              <div className="avst5-zoom" style={zoomEstilo}>
                <AvatarSvg config={configPalco} uid="avst5" />
              </div>
            </div>
            {comparando && (
              <div className="avst5-comparando" role="status">Original salvo · solte para voltar</div>
            )}
            {rascunho && (
              <div className="avst5-rascunho" role="alertdialog" aria-label="Rascunho recuperado" data-teste="rascunho">
                <span>
                  Recuperamos um rascunho de{' '}
                  {new Date(rascunho.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
                  Deseja continuar?
                </span>
                <button type="button" className="avst-botao avst-botao-primario"
                  onClick={() => { aplicarComando(validarConfig(rascunho.config)); setRascunho(null); }}>
                  Continuar
                </button>
                <button type="button" className="avst-botao"
                  onClick={() => { limparRascunho(); setRascunho(null); }}>
                  Descartar
                </button>
              </div>
            )}
            {outraAba && (
              <div className="avst5-outra-aba" role="status">
                Outra aba também está editando este avatar — a última que salvar prevalece.
                <button type="button" onClick={() => setOutraAba(false)} aria-label="Entendi">
                  <X size={12} aria-hidden />
                </button>
              </div>
            )}
            {store.temMudancas && modo === 'edicao' && (
              <button type="button" className="avst5-comparar" title="Segure para ver o original (V)"
                onPointerDown={() => setComparando(true)}
                onPointerUp={() => setComparando(false)}
                onPointerLeave={() => setComparando(false)}>
                <Eye size={13} aria-hidden /> Original
              </button>
            )}
            {modo !== 'edicao' && (
              <button type="button" className="avst5-sair-modo" title="Voltar à edição (Esc)"
                onClick={() => setModo('edicao')}><X size={14} aria-hidden /> Sair</button>
            )}
            <button type="button" className="avst5-drawer-abrir" title="Abrir catálogo"
              onClick={() => setPainelFechado(false)}><LayoutGrid size={16} aria-hidden /></button>
            {modo === 'studio' && configVisivel.titulo && (
              <div className="avst5-titulo-selo" role="note">{String(configVisivel.titulo).replace(/^tit_/, '').replace(/_/g, ' ')}</div>
            )}
            <div className="avst5-fundos" role="radiogroup" aria-label="Fundo do palco">
              {FUNDOS_PALCO.map((f) => (
                <button key={f} type="button" role="radio" aria-checked={fundo === f}
                  className={fundo === f ? 'avst5-fundo-on' : ''}
                  onClick={() => trocarFundo(f)}>{ROTULO_FUNDO[f]}</button>
              ))}
            </div>
            <BarraSalvamento store={store} aoSalvar={async () => {
              const r = await aoSalvarLegado(paraLegado2d(store.estadoDraft));
              if (r.ok) store.confirmarPersistencia(r.versao ?? store.versao + 1);
              return r.ok;
            }} />
          </main>

          <div className="avst5-alca" role="separator" aria-orientation="vertical" aria-label="Redimensionar catálogo"
            onPointerDown={(e) => { arraste.current = { lado: 'dir', x0: e.clientX, w0: larguras.dir }; }} />
          {/* painel direito — workspace com scroll INTERNO (R4/R5) */}
          <aside className={`avst5-painel${painelFechado ? ' avst5-painel-fechado' : ''}`} aria-label="Catálogo">
            {/* cabeçalho FIXO do workspace (P1 §20–§22) */}
            <div className="avst5-painel-topo">
              <button type="button" className="avst5-painel-btn" title={painelFechado ? 'Abrir catálogo' : 'Recolher catálogo'}
                onClick={() => setPainelFechado((v) => !v)}>
                {painelFechado ? <ChevronsLeft size={14} aria-hidden /> : <ChevronsRight size={14} aria-hidden />}
              </button>
              {!painelFechado && (<>
                <div className="avst5-abas" role="tablist" aria-label="Filtro do catálogo">
                  {(['todos', 'equipados', 'favoritos', 'novos', 'bloqueados', 'presets'] as Array<AbaCatalogo | 'presets'>).map((a) => (
                    <button key={a} type="button" role="tab" aria-selected={aba === a}
                      className={aba === a ? 'avst5-aba-on' : ''} onClick={() => setAba(a)}>
                      {a === 'todos' ? 'Todos' : a === 'equipados' ? 'Equipados' : a === 'favoritos' ? 'Favoritos' : a === 'novos' ? 'Novos' : a === 'bloqueados' ? 'Bloqueados' : 'Presets'}
                    </button>
                  ))}
                </div>
                <button type="button" className={`avst5-painel-btn${propriedades ? ' avst5-painel-btn-on' : ''}`}
                  title="Cores e propriedades" aria-pressed={propriedades}
                  onClick={() => setPropriedades((v) => !v)}><Palette size={14} aria-hidden /></button>
                <button type="button" className="avst5-painel-btn" title={painelLargo ? 'Largura normal' : 'Expandir painel'}
                  onClick={() => setPainelLargo((v) => !v)}>
                  {painelLargo ? <ChevronsRight size={14} aria-hidden /> : <ChevronsLeft size={14} aria-hidden />}
                </button>
              </>)}
            </div>
            {!painelFechado && (
              <div className="avst5-painel-scroll" ref={refPainel}
                onScroll={(e) => setMostrarTopo((e.target as HTMLElement).scrollTop > 400)}>
                {propriedades && (
                  <section className="avst5-propriedades" aria-label="Cores e propriedades">
                    <Cores config={configVisivel} aoMudar={aoEscolher} />
                    {/* §71: sliders das camadas equipadas com propriedades */}
                    <PropriedadesAsset config={configVisivel} aoAplicar={aoEscolher} aoPrever={aoPrever} />
                  </section>
                )}
                {aba !== 'equipados' && categoria === 'acessorio' && (<>
                  {/* §68.2/§68.3: resumo + navegação por slot */}
                  <div className="avst5-resumo-slots" data-teste="resumo-acessorios">
                    {resumoAcessorios.length
                      ? <><strong>{resumoAcessorios.length} equipado{resumoAcessorios.length > 1 ? 's' : ''}</strong> · {resumoAcessorios.join(' · ')}</>
                      : 'Nenhum acessório equipado'}
                  </div>
                  <div className="avst5-chips" role="radiogroup" aria-label="Filtrar por slot">
                    {CHIPS_SLOT.map((s) => (
                      <button key={s.id} type="button" role="radio" aria-checked={filtroSlot === s.id}
                        className={`avst5-chip${filtroSlot === s.id ? ' avst5-chip-on' : ''}`}
                        onClick={() => setFiltroSlot(s.id)}>{s.nome}</button>
                    ))}
                  </div>
                </>)}
                {aba === 'presets' ? (
                  <PresetsShell configAtual={paraLegado2d(store.estadoDraft)}
                    aoAplicar={(cfg) => aplicarComando(validarConfig(cfg))} />
                ) : aba === 'equipados' ? (<>
                  <Equipados config={paraLegado2d(store.estadoDraft)} bloqueios={bloqueios}
                    aoRemover={(slot) => {
                      const cfg = paraLegado2d(store.estadoDraft);
                      const camadas = { ...cfg.camadas } as Record<string, string>;
                      delete camadas[slot];
                      aoEscolher({ ...cfg, camadas });
                    }}
                    aoTrocar={(cat) => { setCategoria(cat); setAba('todos'); }}
                    aoBloquear={(slot) => setBloqueios(new Set(alternarBloqueio(slot)))}
                    aoMudarFavs={() => setTicFavs((t) => t + 1)} />
                  {/* §138: timeline granular da sessão junto da gestão do estado */}
                  <HistoricoSessao entradas={historico.entradas} posicao={historico.posicao} irPara={historico.irPara} />
                </>) : (
                  <GradeItens config={configVisivel} categoria={categoria}
                    desbloqueados={desbloqueados} aoEscolher={aoEscolher} filtroAba={aba as AbaCatalogo}
                    aoPrever={aoPrever} filtroSlot={filtroSlot} />
                )}
              </div>
            )}
            {!painelFechado && mostrarTopo && (
              <button type="button" className="avst5-topo" title="Voltar ao topo"
                onClick={() => refPainel.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
                <ArrowUp size={14} aria-hidden /> Topo
              </button>
            )}
          </aside>
        </div>
        {conflito && (
          <div className="avst5-modal-fundo" role="dialog" aria-modal="true" aria-label="Conflito de equipamento">
            <div className="avst5-modal">
              <p>
                {conflito.depois
                  ? <>Equipar este item vai <strong>substituir</strong> o que está no slot{bloqueios.has(conflito.slot) ? ' BLOQUEADO' : ''}.</>
                  : <>Este slot está <strong>bloqueado</strong> — remover mesmo assim?</>}
              </p>
              <div className="avst5-modal-acoes">
                <button type="button" className="avst-botao"
                  onClick={() => { store.limparPreview(); setConflito(null); }}>Cancelar</button>
                <button type="button" className="avst-botao avst-botao-primario"
                  onClick={() => { aplicarComando(conflito.novo); setConflito(null); }}>
                  {conflito.depois ? 'Equipar e substituir' : 'Remover'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LimiteShell>
  );
}

/** rótulo curto do comando: qual categoria mudou. */
function novoDiff(antes: AvatarConfig, depois: AvatarConfig): string {
  if (antes.base !== depois.base) return 'base';
  const chaves = new Set([...Object.keys(antes.camadas), ...Object.keys(depois.camadas)]);
  for (const k of chaves) {
    if ((antes.camadas as Record<string, string>)[k] !== (depois.camadas as Record<string, string>)[k]) return k;
  }
  return 'config';
}
