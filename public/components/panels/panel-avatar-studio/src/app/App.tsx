// app/App.tsx — Avatar Studio (Sistema de Avatares Gamer AAA).
// @version 2.0.0  @created 2026-07-29  @updated 2026-07-30 (AS4 Fase 0)
//
// Layout de estúdio em 3 colunas (briefing §8):
//   [categorias] [palco de preview + barra de salvar] [grade de itens / presets + cores]
// Estado central aqui; renderização no motor; persistência no AvatarService.
// Undo/redo (§14), comparação atual×salvo (§15), estados de salvar (§25).
// AS4 Fase 0: painel direito redimensionável 320/420/560 (§23.3), barra de
// salvar junto do personagem (§39.11) e toast de feedback ao equipar (§39.18).
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck, Bot, Box, Boxes, Brush, Camera, Check, ChevronDown, CircleUser, Columns2,
  Crown, Dices, Eye, Fingerprint, Flag, Frame, Glasses, History, Image as ImagemIcon,
  LoaderCircle, Orbit, Redo2, Save, Shirt, Smile, Sparkles, Trophy, Undo2, Users,
  Volume2, VolumeX, Wand2,
} from 'lucide-react';

// PoC 3D (AS4 Fase 1) — chunk separado: three/R3F só carregam nesta aba
const Estudio3D = lazy(() => import('../poc3d/Estudio3D'));
import type { AvatarConfig, CategoriaId, EstadoSalvar, GrupoId, Raridade, ShellConfig } from '../domain/types';
import {
  CATEGORIAS, CONFIG_PADRAO, GRUPOS, RARIDADES, aleatorio, itemPorId, nivelRaridade,
  validarConfig,
} from '../services/AvatarCatalog';
import { carregarAvatar, salvarAvatar } from '../services/AvatarService';
import type { OrigemDado, ResultadoCarga, TipoAtivo } from '../services/AvatarService';
import { definirSom, somAtivo, tocarCelebracao, tocarEquipar, tocarSalvar } from '../services/Som';
import { registrarUso, sincronizarFavoritos } from '../services/Progresso';
import { telemetria } from '../services/Telemetria';
import { carregarVida } from '../services/VidaService';
import type { Vida } from '../services/VidaService';
import { Colecoes } from '../components/Colecoes';
import { Vitrine } from '../components/Vitrine';
import { Conquistas } from '../components/Conquistas';
import { CriarIA } from '../components/CriarIA';
import { AvatarSvg } from '../components/AvatarSvg';
import { PalcoCinema } from '../components/PalcoCinema';
import type { Celebracao } from '../components/PalcoCinema';
import { GradeItens } from '../components/GradeItens';
import { Cores } from '../components/Cores';
import { Presets } from '../components/Presets';
import { Historico } from '../components/Historico';
import { Foto } from '../components/Foto';
import { Titulos } from '../components/Titulos';
import { Arquetipos } from '../components/Arquetipos';
import '../styles/estudio.css';

/** Itens que mudaram de a→b (comparação rica §21). */
function listarMudancas(a: AvatarConfig, b: AvatarConfig): Array<{ id: string; nome: string; raridade: Raridade }> {
  const ids = new Set<string>();
  if (a.base !== b.base) ids.add(b.base);
  for (const [cat, id] of Object.entries(b.camadas)) {
    if (id && a.camadas[cat as keyof AvatarConfig['camadas']] !== id) ids.add(id);
  }
  const saida: Array<{ id: string; nome: string; raridade: Raridade }> = [];
  for (const id of ids) {
    const item = itemPorId(id);
    if (item) saida.push({ id, nome: item.nome, raridade: item.raridade });
  }
  return saida;
}

/** Maior raridade entre os itens que MUDARAM de a→b (celebração/som). */
function raridadeDaMudanca(a: AvatarConfig, b: AvatarConfig): Raridade | null {
  const ids = new Set<string>();
  if (a.base !== b.base) ids.add(b.base);
  for (const [cat, id] of Object.entries(b.camadas)) {
    if (id && a.camadas[cat as keyof AvatarConfig['camadas']] !== id) ids.add(id);
  }
  let melhor: Raridade | null = null;
  for (const id of ids) {
    const item = itemPorId(id);
    if (item && (melhor === null || nivelRaridade(item.raridade) > nivelRaridade(melhor))) {
      melhor = item.raridade;
    }
  }
  return melhor;
}

const ICONES: Record<CategoriaId, React.ComponentType<{ size?: number }>> = {
  base: CircleUser, cabelo: Brush, olhos: Eye, boca: Smile, roupa: Shirt,
  acessorio: Glasses, fundo: ImagemIcon, moldura: Frame, efeito: Sparkles,
  aura: Orbit, banner: Flag, emblema: BadgeCheck,
};

const ROTULO_ESTADO: Record<EstadoSalvar, string> = {
  sem_alteracoes: 'Tudo salvo',
  alteracoes_pendentes: 'Alterações não salvas',
  salvando: 'Salvando…',
  salvo: 'Salvo!',
  erro: 'Erro ao salvar',
  conflito: 'Conflito de versão',
};

/** Grupos colapsáveis da sidebar (Expansão) — estado persistido. */
const CHAVE_GRUPOS = 'dshow.avatar.grupos.v1';

function gruposGuardados(): Set<GrupoId> {
  try {
    const bruto = localStorage.getItem(CHAVE_GRUPOS);
    if (!bruto) return new Set(GRUPOS.map((g) => g.id)); // 1ª visita: tudo aberto
    const lista = JSON.parse(bruto);
    return new Set(Array.isArray(lista) ? lista : []);
  } catch { return new Set(GRUPOS.map((g) => g.id)); }
}

/** Painel direito redimensionável (AS4 §23.3): compacto/padrão/expandido. */
const CHAVE_LARG = 'dshow.avatar.painel.larg.v1';
const LARGURAS = [320, 420, 560];
const LARG_MIN = 320;
const LARG_MAX = 560;

function largGuardada(): number {
  try {
    const v = parseInt(localStorage.getItem(CHAVE_LARG) ?? '', 10);
    return v >= LARG_MIN && v <= LARG_MAX ? v : 420;
  } catch { return 420; }
}

export function App({ config: shellConfig }: { config: ShellConfig }) {
  const [carregando, setCarregando] = useState(true);
  const [atual, setAtual] = useState<AvatarConfig>(CONFIG_PADRAO);
  const [salvo, setSalvo] = useState<AvatarConfig | null>(null);
  const [estado, setEstado] = useState<EstadoSalvar>('sem_alteracoes');
  const [origem, setOrigem] = useState<OrigemDado>('padrao');
  const [versao, setVersao] = useState(0);
  const [tipoAtivo, setTipoAtivo] = useState<TipoAtivo>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<CategoriaId>('base');
  const [aba, setAba] = useState<'itens' | 'arquetipo' | 'titulo' | 'presets' | 'colecoes' | 'conquistas' | 'ia' | 'vitrine' | 'historico' | 'foto' | '3d'>('itens');
  const [vida, setVida] = useState<Vida | null>(null);
  const [comparando, setComparando] = useState(false);
  const [celebracao, setCelebracao] = useState<Celebracao | null>(null);
  const [somLigado, setSomLigado] = useState(somAtivo);
  const [largPainel, setLargPainel] = useState(largGuardada);
  const [toastEquipar, setToastEquipar] = useState<{ nome: string; cor: string; chave: number } | null>(null);
  const [gruposAbertos, setGruposAbertos] = useState<Set<GrupoId>>(gruposGuardados);

  const alternarGrupo = useCallback((g: GrupoId) => {
    setGruposAbertos((atuais) => {
      const novo = new Set(atuais);
      if (novo.has(g)) novo.delete(g);
      else novo.add(g);
      try { localStorage.setItem(CHAVE_GRUPOS, JSON.stringify([...novo])); } catch { /* sem storage */ }
      return novo;
    });
  }, []);

  const desfazerPilha = useRef<AvatarConfig[]>([]);
  const refazerPilha = useRef<AvatarConfig[]>([]);
  const sementeRef = useRef(Date.now() % 2147483647);
  const corpoRef = useRef<HTMLDivElement>(null);

  // ── Painel direito redimensionável (AS4 §23.3) ────────────────────
  const guardarLargura = useCallback((v: number) => {
    try { localStorage.setItem(CHAVE_LARG, String(v)); } catch { /* sem storage */ }
  }, []);

  const iniciarArrasto = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const direita = corpoRef.current?.getBoundingClientRect().right ?? window.innerWidth;
    const mover = (ev: PointerEvent) => {
      setLargPainel(Math.max(LARG_MIN, Math.min(LARG_MAX, Math.round(direita - ev.clientX))));
    };
    const soltar = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      setLargPainel((v) => { guardarLargura(v); telemetria('painel_largura', { largura: v }); return v; });
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  }, [guardarLargura]);

  const ciclarLargura = useCallback(() => {
    setLargPainel((v) => {
      const atual = LARGURAS.findIndex((l) => v <= l);
      const prox = LARGURAS[(atual + 1) % LARGURAS.length] ?? 420;
      guardarLargura(prox);
      return prox;
    });
  }, [guardarLargura]);

  // toast de equipar some sozinho (AS4 §39.18)
  useEffect(() => {
    if (!toastEquipar) return;
    const t = window.setTimeout(() => setToastEquipar(null), 1700);
    return () => window.clearTimeout(t);
  }, [toastEquipar]);

  // ── Carga inicial ─────────────────────────────────────────────────
  const aplicarCarga = useCallback((r: ResultadoCarga) => {
    // com foto/legado ativo, recupera o último trabalho em CAMADAS no editor
    setAtual(r.config ?? r.configCamadasRecente ?? CONFIG_PADRAO);
    setSalvo(r.config); // null quando foto/legado ativo → salvar volta às camadas
    setOrigem(r.origem);
    setVersao(r.versao);
    setTipoAtivo(r.tipoAtivo);
    if (r.tipoAtivo === 'foto' || r.tipoAtivo === '3d') {
      setEstado('sem_alteracoes');
      setMensagem(r.tipoAtivo === '3d'
        ? 'Seu avatar 3D está ativo — salvar aqui volta para o avatar em camadas.'
        : 'Sua foto está ativa — salvar aqui volta para o avatar em camadas.');
    } else if (!r.config) {
      // primeira visita (nada salvo ainda) → deixa claro que precisa salvar
      setEstado('alteracoes_pendentes');
      setMensagem(null);
    } else {
      setEstado('sem_alteracoes');
      setMensagem(null);
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const r = await carregarAvatar(shellConfig.signal);
      if (!vivo) return;
      aplicarCarga(r);
      setCarregando(false);
      telemetria('abriu', { tipoAtivo: r.tipoAtivo ?? 'nenhum' });
      void sincronizarFavoritos(); // espelho multi-device (melhor esforço)
    })();
    // Vida (conquistas/eventos/desbloqueios) em paralelo — F3
    void carregarVida(shellConfig.signal).then((v) => {
      if (!vivo || !v) return;
      setVida(v);
      // celebra conquistas NOVAS desde a última visita (reação do personagem)
      try {
        const chave = 'dshow.avatar.conquistas.v1';
        const vistas = new Set<string>(JSON.parse(localStorage.getItem(chave) ?? '[]'));
        const feitas = v.conquistas.filter((c) => c.conquistada);
        const nova = feitas.find((c) => !vistas.has(c.id));
        if (nova && vistas.size > 0) { // 1ª visita não comemora retroativo
          setCelebracao({ raridade: 'lendario', chave: Date.now() });
          tocarCelebracao('lendario');
          setMensagem(`🏆 Conquista desbloqueada: ${nova.nome}!`);
          telemetria('conquista', { id: nova.id });
        }
        localStorage.setItem(chave, JSON.stringify(feitas.map((c) => c.id)));
      } catch { /* sem storage */ }
    });
    return () => { vivo = false; };
  }, [shellConfig.signal, aplicarCarga]);

  // ── Mutações (toda mudança passa por aqui: alimenta o undo) ───────
  const aplicar = useCallback((novo: AvatarConfig) => {
    setAtual((anterior) => {
      desfazerPilha.current.push(anterior);
      if (desfazerPilha.current.length > 40) desfazerPilha.current.shift();
      refazerPilha.current = [];
      const validado = validarConfig(novo);
      // som + celebração pela raridade do que acabou de ser equipado (AS3 F1)
      const raridade = raridadeDaMudanca(anterior, validado);
      if (raridade) {
        tocarEquipar(nivelRaridade(raridade));
        telemetria('equipou', { raridade });
        // feedback claro ao equipar (AS4 §39.18): toast junto do personagem
        const mudou = listarMudancas(anterior, validado)[0];
        if (mudou) {
          setToastEquipar({ nome: mudou.nome, cor: RARIDADES[mudou.raridade].cor, chave: Date.now() });
        }
        if (nivelRaridade(raridade) >= nivelRaridade('lendario')) {
          setCelebracao({ raridade, chave: Date.now() });
          tocarCelebracao(raridade);
          telemetria('celebracao', { raridade });
        }
      }
      registrarUso(validado); // progresso das coleções (F2c)
      return validado;
    });
    setEstado('alteracoes_pendentes');
    setMensagem(null);
  }, []);

  const desfazer = useCallback(() => {
    const anterior = desfazerPilha.current.pop();
    if (!anterior) return;
    setAtual((agora) => { refazerPilha.current.push(agora); return anterior; });
    setEstado('alteracoes_pendentes');
  }, []);

  const refazer = useCallback(() => {
    const proximo = refazerPilha.current.pop();
    if (!proximo) return;
    setAtual((agora) => { desfazerPilha.current.push(agora); return proximo; });
    setEstado('alteracoes_pendentes');
  }, []);

  const sortear = useCallback(() => {
    sementeRef.current = (sementeRef.current * 48271) % 2147483647;
    aplicar(aleatorio(sementeRef.current));
  }, [aplicar]);

  // Ctrl+Z / Ctrl+Shift+Z / Ctrl+S
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z') { e.preventDefault(); e.shiftKey ? refazer() : desfazer(); }
      if (k === 's') { e.preventDefault(); void salvar(); }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desfazer, refazer, atual]);

  // ── Salvamento ────────────────────────────────────────────────────
  const salvar = useCallback(async () => {
    setEstado('salvando');
    const r = await salvarAvatar(atual, versao);
    if (r.ok) {
      setSalvo(atual);
      setOrigem(r.origem);
      if (r.versao !== undefined) setVersao(r.versao);
      if (r.origem === 'api') setTipoAtivo('camadas');
      tocarSalvar();
      telemetria('salvou', { origem: r.origem });
      setMensagem(r.mensagem ?? null);
      setEstado('salvo');
      window.setTimeout(() => setEstado((e) => (e === 'salvo' ? 'sem_alteracoes' : e)), 2200);
    } else {
      setMensagem(r.mensagem ?? 'Falha inesperada.');
      setEstado(r.conflito ? 'conflito' : 'erro');
    }
  }, [atual, versao]);

  /** Conflito entre abas: recarrega a versão mais recente do servidor. */
  const recarregarDoServidor = useCallback(async () => {
    setCarregando(true);
    const r = await carregarAvatar(shellConfig.signal);
    aplicarCarga(r);
    desfazerPilha.current = [];
    refazerPilha.current = [];
    setCarregando(false);
  }, [shellConfig.signal, aplicarCarga]);

  /** Foto salva na aba Foto: sincroniza versão/estado do editor. */
  const aoSalvarFoto = useCallback((novaVersao: number) => {
    setVersao(novaVersao);
    setTipoAtivo('foto');
    setSalvo(null); // o "Salvar avatar" volta a valer p/ reativar as camadas
    setEstado('sem_alteracoes');
    setMensagem('Sua foto está ativa — salvar aqui volta para o avatar em camadas.');
  }, []);

  /** Versão reativada pelo Histórico (4.6 §22): sincroniza versão/tipo. */
  const aoReativarHistorico = useCallback((novaVersao: number, tipo: 'camadas' | 'foto' | '3d') => {
    setVersao(novaVersao);
    setTipoAtivo(tipo);
    if (tipo !== 'camadas') {
      setSalvo(null); // salvar no editor volta a valer p/ reativar as camadas
      setMensagem(tipo === 'foto'
        ? 'Sua foto voltou a ficar ativa — o header já trocou.'
        : 'Seu avatar 3D voltou a ficar ativo — o header já trocou.');
    }
    setEstado('sem_alteracoes');
  }, []);

  const sujo = useMemo(
    () => JSON.stringify(atual) !== JSON.stringify(salvo ?? {}),
    [atual, salvo],
  );

  if (carregando) {
    return (
      <div className="avst-shell avst-carregando">
        <LoaderCircle className="avst-girando" size={34} aria-hidden />
        <p>Abrindo o Avatar Studio…</p>
      </div>
    );
  }

  return (
    <div className="avst-shell">
      {/* ── Topo ── */}
      <header className="avst-topo">
        <div className="avst-topo-titulo">
          <Wand2 size={20} aria-hidden />
          <div>
            <h1>Avatar Studio</h1>
            <p>Monte seu personagem — cada mudança aparece na hora no palco.</p>
          </div>
        </div>
        <div className="avst-topo-acoes">
          <button type="button" className={`avst-botao ${somLigado ? 'avst-botao-ativo' : ''}`}
            onClick={() => {
              const novo = !somLigado;
              definirSom(novo);
              setSomLigado(novo);
              telemetria('som', { ligado: novo });
            }}
            title={somLigado ? 'Desligar sons do estúdio' : 'Ligar sons do estúdio'}>
            {somLigado ? <Volume2 size={15} aria-hidden /> : <VolumeX size={15} aria-hidden />}
          </button>
          <button type="button" className="avst-botao" onClick={desfazer}
            disabled={desfazerPilha.current.length === 0} title="Desfazer (Ctrl+Z)">
            <Undo2 size={15} aria-hidden /> Desfazer
          </button>
          <button type="button" className="avst-botao" onClick={refazer}
            disabled={refazerPilha.current.length === 0} title="Refazer (Ctrl+Shift+Z)">
            <Redo2 size={15} aria-hidden /> Refazer
          </button>
          <button type="button" className="avst-botao" onClick={sortear} title="Sortear um visual aleatório">
            <Dices size={15} aria-hidden /> Aleatório
          </button>
          <button type="button" className={`avst-botao ${comparando ? 'avst-botao-ativo' : ''}`}
            onClick={() => setComparando((v) => !v)} disabled={!salvo}
            title={salvo ? 'Comparar com o avatar salvo' : 'Salve uma vez para poder comparar'}>
            <Columns2 size={15} aria-hidden /> Comparar
          </button>
        </div>
      </header>

      <div className="avst-corpo" ref={corpoRef}
        style={{ '--avst-larg-painel': `${largPainel}px` } as React.CSSProperties}>
        {/* ── Coluna 1: categorias ── */}
        <nav className="avst-categorias" aria-label="Categorias">
          {/* grupos colapsáveis dirigidos pela taxonomia (Expansão) */}
          {GRUPOS.map((g) => {
            const cats = CATEGORIAS.filter((c) => c.grupo === g.id);
            const temTitulo = g.id === 'personalidade';
            if (cats.length === 0 && !temTitulo) return null;
            const aberto = gruposAbertos.has(g.id);
            const contemAtiva = (aba === 'itens' && cats.some((c) => c.id === categoria))
              || (aba === 'titulo' && temTitulo)
              || (aba === 'arquetipo' && g.id === 'identidade');
            return (
              <div key={g.id} className="avst-grupo">
                <button type="button" aria-expanded={aberto}
                  className={`avst-grupo-cab ${!aberto && contemAtiva ? 'avst-grupo-cab-ativa' : ''}`}
                  onClick={() => alternarGrupo(g.id)}>
                  <span>{g.nome}</span>
                  <ChevronDown size={13} aria-hidden
                    className={`avst-grupo-seta ${aberto ? 'avst-grupo-seta-aberta' : ''}`} />
                </button>
                {/* sempre no DOM: o modo mobile (grupos achatados) reexibe via CSS */}
                <div className="avst-grupo-itens" data-aberto={aberto ? 'sim' : 'nao'}>
                    {g.id === 'identidade' && (
                      <button type="button"
                        className={`avst-cat ${aba === 'arquetipo' ? 'avst-cat-ativa' : ''}`}
                        onClick={() => setAba('arquetipo')}>
                        <Fingerprint size={17} aria-hidden />
                        <span>Arquétipo</span>
                      </button>
                    )}
                    {cats.map((c) => {
                      const Icone = ICONES[c.id];
                      return (
                        <button key={c.id} type="button"
                          className={`avst-cat ${categoria === c.id && aba === 'itens' ? 'avst-cat-ativa' : ''}`}
                          onClick={() => { setCategoria(c.id); setAba('itens'); }}>
                          <Icone size={17} aria-hidden />
                          <span>{c.nome}</span>
                        </button>
                      );
                    })}
                    {temTitulo && (
                      <button type="button"
                        className={`avst-cat ${aba === 'titulo' ? 'avst-cat-ativa' : ''}`}
                        onClick={() => setAba('titulo')}>
                        <Crown size={17} aria-hidden />
                        <span>Título</span>
                      </button>
                    )}
                </div>
              </div>
            );
          })}
          <div className="avst-cat-separador" />
          <button type="button"
            className={`avst-cat avst-cat-3d ${aba === '3d' ? 'avst-cat-ativa' : ''}`}
            onClick={() => setAba('3d')}>
            <Box size={17} aria-hidden />
            <span>Estúdio 3D</span>
            <em className="avst-cat-poc">PoC</em>
          </button>
          <button type="button"
            className={`avst-cat ${aba === 'presets' ? 'avst-cat-ativa' : ''}`}
            onClick={() => setAba('presets')}>
            <Sparkles size={17} aria-hidden />
            <span>Presets</span>
          </button>
          <button type="button"
            className={`avst-cat ${aba === 'colecoes' ? 'avst-cat-ativa' : ''}`}
            onClick={() => setAba('colecoes')}>
            <Boxes size={17} aria-hidden />
            <span>Coleções</span>
          </button>
          <button type="button"
            className={`avst-cat ${aba === 'conquistas' ? 'avst-cat-ativa' : ''}`}
            onClick={() => setAba('conquistas')}>
            <Trophy size={17} aria-hidden />
            <span>Conquistas</span>
          </button>
          <button type="button"
            className={`avst-cat ${aba === 'ia' ? 'avst-cat-ativa' : ''}`}
            onClick={() => setAba('ia')}>
            <Bot size={17} aria-hidden />
            <span>Criar com IA</span>
          </button>
          <button type="button"
            className={`avst-cat ${aba === 'vitrine' ? 'avst-cat-ativa' : ''}`}
            onClick={() => setAba('vitrine')}>
            <Users size={17} aria-hidden />
            <span>Vitrine</span>
          </button>
          <button type="button"
            className={`avst-cat ${aba === 'historico' ? 'avst-cat-ativa' : ''}`}
            onClick={() => setAba('historico')}>
            <History size={17} aria-hidden />
            <span>Histórico</span>
          </button>
          <button type="button"
            className={`avst-cat ${aba === 'foto' ? 'avst-cat-ativa' : ''}`}
            onClick={() => setAba('foto')}>
            <Camera size={17} aria-hidden />
            <span>Foto</span>
          </button>
        </nav>

        {aba === '3d' ? (
          /* ── PoC 3D (AS4 Fase 1): ocupa palco + painel ── */
          <section className="avst-area3d" aria-label="Estúdio 3D — prova de conceito">
            <Suspense fallback={(
              <div className="avst-vazio avst-3d-carregando">
                <LoaderCircle className="avst-girando" size={26} aria-hidden />
                <p>Carregando o motor 3D… (baixa uma única vez, só nesta aba)</p>
              </div>
            )}>
              <Estudio3D corDestaque={atual.cores.destaque} versaoBase={versao}
                aoSalvar={(v) => {
                  setVersao(v);
                  setTipoAtivo('3d');
                  setSalvo(null); // salvar no 2D volta a valer p/ reativar camadas
                  setEstado('sem_alteracoes');
                  setMensagem('Seu avatar 3D está ativo — salvar aqui volta para o avatar em camadas.');
                }} />
            </Suspense>
          </section>
        ) : (
          <>
        {/* ── Coluna 2: palco ── */}
        <main className="avst-palco">
          {comparando && salvo ? (
            <div className="avst-comparacao-area">
              <div className="avst-comparacao">
                <figure>
                  <AvatarSvg config={salvo} uid="cmp-salvo" />
                  <figcaption>Salvo</figcaption>
                </figure>
                <figure>
                  <AvatarSvg config={atual} uid="cmp-atual" />
                  <figcaption>Editando</figcaption>
                </figure>
              </div>
              {/* diff de itens (AS3 §21 — comparação rica) */}
              <div className="avst-diff" aria-label="Itens alterados">
                {listarMudancas(salvo, atual).map((m) => (
                  <span key={m.id} className="avst-diff-chip"
                    style={{ '--avst-rar': RARIDADES[m.raridade].cor } as React.CSSProperties}>
                    {m.nome}
                  </span>
                ))}
                {listarMudancas(salvo, atual).length === 0 && (
                  <span className="avst-diff-nada">Nenhum item alterado — só cores ou nada.</span>
                )}
              </div>
            </div>
          ) : (
            <div className="avst-palco-principal">
              <PalcoCinema config={atual}
                categoria={aba === 'itens' ? categoria : null}
                celebracao={celebracao}
                aoFimCelebracao={() => setCelebracao(null)} />
              {/* feedback claro ao equipar (AS4 §39.18) */}
              {toastEquipar && (
                <div key={toastEquipar.chave} className="avst-toast-equipar" role="status"
                  style={{ '--avst-rar': toastEquipar.cor } as React.CSSProperties}>
                  <Check size={13} aria-hidden /> Equipado: <strong>{toastEquipar.nome}</strong>
                </div>
              )}
            </div>
          )}

          {/* barra de salvar JUNTO do personagem (AS4 §39.11) */}
          <footer className={`avst-barra avst-barra-${estado}`}>
            <span className="avst-barra-estado" role="status">
              {estado === 'salvando' && <LoaderCircle className="avst-girando" size={14} aria-hidden />}
              {ROTULO_ESTADO[estado]}
              {origem === 'local' && estado !== 'salvando' && (
                <em className="avst-barra-origem"> · armazenado neste navegador</em>
              )}
            </span>
            {mensagem && <span className="avst-barra-mensagem">{mensagem}</span>}
            {estado === 'conflito' && (
              <button type="button" className="avst-botao" onClick={() => void recarregarDoServidor()}>
                Recarregar do servidor
              </button>
            )}
            <button type="button" className="avst-botao avst-botao-primario"
              onClick={() => void salvar()} disabled={!sujo || estado === 'salvando'}
              title="Salvar (Ctrl+S)">
              <Save size={15} aria-hidden /> Salvar avatar
            </button>
          </footer>

          {/* previews por contexto (header/menu) */}
          <div className="avst-previas">
            <figure><AvatarSvg config={atual} forma="circulo" uid="mini-h" /><figcaption>Header</figcaption></figure>
            <figure className="avst-previa-menor"><AvatarSvg config={atual} forma="circulo" uid="mini-m" /><figcaption>Menu</figcaption></figure>
          </div>
        </main>

        {/* ── Coluna 3: itens/presets/histórico/foto + cores ── */}
        <aside className="avst-lateral">
          {/* alça de redimensionamento (AS4 §23.3): arraste ou duplo clique */}
          <div className="avst-redim" role="separator" aria-orientation="vertical"
            title="Arraste para redimensionar · duplo clique alterna 320/420/560"
            onPointerDown={iniciarArrasto} onDoubleClick={ciclarLargura} />
          {aba === 'arquetipo' && <Arquetipos config={atual} aoAplicar={aplicar} />}
          {aba === 'titulo' && <Titulos config={atual} aoAplicar={aplicar} />}
          {aba === 'presets' && <Presets aoAplicar={aplicar} />}
          {aba === 'colecoes' && <Colecoes config={atual} aoAplicar={aplicar} />}
          {aba === 'conquistas' && <Conquistas vida={vida} />}
          {aba === 'vitrine' && (
            <Vitrine config={atual} desbloqueados={vida?.desbloqueados ?? new Set()}
              aoAplicar={aplicar} aoAbrirColecoes={() => setAba('colecoes')} />
          )}
          {aba === 'ia' && <CriarIA config={atual} iaDisponivel={vida?.iaDisponivel ?? false} aoAplicar={aplicar} />}
          {aba === 'historico' && (
            <Historico key={`h-${versao}`} versaoBase={versao}
              aoAplicar={aplicar} aoReativar={aoReativarHistorico} />
          )}
          {aba === 'foto' && <Foto versao={versao} fotoAtiva={tipoAtivo === 'foto'} aoSalvar={aoSalvarFoto} />}
          {aba === 'itens' && (
            <>
              <GradeItens config={atual} categoria={categoria}
                desbloqueados={vida?.desbloqueados ?? new Set()} aoEscolher={aplicar} />
              <Cores config={atual} aoMudar={aplicar} />
            </>
          )}
        </aside>
          </>
        )}
      </div>
    </div>
  );
}
