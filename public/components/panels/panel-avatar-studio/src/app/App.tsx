// app/App.tsx — Avatar Studio (Sistema de Avatares Gamer AAA).
// @version 1.0.0  @created 2026-07-29
//
// Layout de estúdio em 3 colunas (briefing §8):
//   [categorias] [palco de preview + barra de salvar] [grade de itens / presets + cores]
// Estado central aqui; renderização no motor; persistência no AvatarService.
// Undo/redo (§14), comparação atual×salvo (§15), estados de salvar (§25).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Brush, Camera, CircleUser, Columns2, Dices, Eye, Frame, Glasses, History,
  Image as ImagemIcon, LoaderCircle, Redo2, Save, Shirt, Smile, Sparkles, Undo2,
  Volume2, VolumeX, Wand2,
} from 'lucide-react';
import type { AvatarConfig, CategoriaId, EstadoSalvar, Raridade, ShellConfig } from '../domain/types';
import {
  CATEGORIAS, CONFIG_PADRAO, aleatorio, itemPorId, nivelRaridade, validarConfig,
} from '../services/AvatarCatalog';
import { carregarAvatar, salvarAvatar } from '../services/AvatarService';
import type { OrigemDado, ResultadoCarga, TipoAtivo } from '../services/AvatarService';
import { definirSom, somAtivo, tocarCelebracao, tocarEquipar, tocarSalvar } from '../services/Som';
import { telemetria } from '../services/Telemetria';
import { AvatarSvg } from '../components/AvatarSvg';
import { PalcoCinema } from '../components/PalcoCinema';
import type { Celebracao } from '../components/PalcoCinema';
import { GradeItens } from '../components/GradeItens';
import { Cores } from '../components/Cores';
import { Presets } from '../components/Presets';
import { Historico } from '../components/Historico';
import { Foto } from '../components/Foto';
import '../styles/estudio.css';

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
};

const ROTULO_ESTADO: Record<EstadoSalvar, string> = {
  sem_alteracoes: 'Tudo salvo',
  alteracoes_pendentes: 'Alterações não salvas',
  salvando: 'Salvando…',
  salvo: 'Salvo!',
  erro: 'Erro ao salvar',
  conflito: 'Conflito de versão',
};

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
  const [aba, setAba] = useState<'itens' | 'presets' | 'historico' | 'foto'>('itens');
  const [comparando, setComparando] = useState(false);
  const [celebracao, setCelebracao] = useState<Celebracao | null>(null);
  const [somLigado, setSomLigado] = useState(somAtivo);

  const desfazerPilha = useRef<AvatarConfig[]>([]);
  const refazerPilha = useRef<AvatarConfig[]>([]);
  const sementeRef = useRef(Date.now() % 2147483647);

  // ── Carga inicial ─────────────────────────────────────────────────
  const aplicarCarga = useCallback((r: ResultadoCarga) => {
    // com foto/legado ativo, recupera o último trabalho em CAMADAS no editor
    setAtual(r.config ?? r.configCamadasRecente ?? CONFIG_PADRAO);
    setSalvo(r.config); // null quando foto/legado ativo → salvar volta às camadas
    setOrigem(r.origem);
    setVersao(r.versao);
    setTipoAtivo(r.tipoAtivo);
    if (r.tipoAtivo === 'foto') {
      setEstado('sem_alteracoes');
      setMensagem('Sua foto está ativa — salvar aqui volta para o avatar em camadas.');
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
    })();
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
        if (nivelRaridade(raridade) >= nivelRaridade('lendario')) {
          setCelebracao({ raridade, chave: Date.now() });
          tocarCelebracao(raridade);
          telemetria('celebracao', { raridade });
        }
      }
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

      <div className="avst-corpo">
        {/* ── Coluna 1: categorias ── */}
        <nav className="avst-categorias" aria-label="Categorias">
          {CATEGORIAS.map((c) => {
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
          <div className="avst-cat-separador" />
          <button type="button"
            className={`avst-cat ${aba === 'presets' ? 'avst-cat-ativa' : ''}`}
            onClick={() => setAba('presets')}>
            <Sparkles size={17} aria-hidden />
            <span>Presets</span>
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

        {/* ── Coluna 2: palco ── */}
        <main className="avst-palco">
          {comparando && salvo ? (
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
          ) : (
            <div className="avst-palco-principal">
              <PalcoCinema config={atual}
                categoria={aba === 'itens' ? categoria : null}
                celebracao={celebracao}
                aoFimCelebracao={() => setCelebracao(null)} />
            </div>
          )}

          <div className="avst-previas">
            <figure><AvatarSvg config={atual} forma="circulo" uid="mini-h" /><figcaption>Header</figcaption></figure>
            <figure className="avst-previa-menor"><AvatarSvg config={atual} forma="circulo" uid="mini-m" /><figcaption>Menu</figcaption></figure>
          </div>

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
        </main>

        {/* ── Coluna 3: itens/presets/histórico/foto + cores ── */}
        <aside className="avst-lateral">
          {aba === 'presets' && <Presets aoAplicar={aplicar} />}
          {aba === 'historico' && <Historico key={`h-${versao}`} aoAplicar={aplicar} />}
          {aba === 'foto' && <Foto versao={versao} fotoAtiva={tipoAtivo === 'foto'} aoSalvar={aoSalvarFoto} />}
          {aba === 'itens' && (
            <>
              <GradeItens config={atual} categoria={categoria} aoEscolher={aplicar} />
              <Cores config={atual} aoMudar={aplicar} />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
