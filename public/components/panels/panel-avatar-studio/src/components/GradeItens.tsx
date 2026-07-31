// components/GradeItens.tsx — grade de itens da categoria ativa.
// @version 2.0.0  @created 2026-07-29  @updated 2026-07-30 (AS4 Fase 0)
//
// Cada card mostra o item APLICADO ao avatar atual (thumbnail em contexto,
// com ENQUADRAMENTO por categoria — AS4 §39.19: a diferença real aparece).
// AS4 Fase 0: título contextual (§39.15), modos compacta/detalhada/lista
// (§23.1), ordenação + ocultar bloqueados (§23.2), raridade com pips além
// da cor (§39.20) e tooltip por PORTAL no Overlay Root (§22).
import { useMemo, useRef, useState } from 'react';
import {
  ArrowDownUp, Ban, Check, Grid2x2, LayoutGrid, List, Lock, Search, SlidersHorizontal, Star, X,
} from 'lucide-react';
import type { AvatarConfig, CategoriaId, Raridade, SlotAcessorio } from '../domain/types';
import { CATEGORIAS, RARIDADES, itemPorId, itensDe, nivelRaridade, validarConfig } from '../services/AvatarCatalog';
import { alternarFavorito, favoritos, itensUsados } from '../services/Progresso';
import type { ParteDef } from '../engine/base-api';
import { AvatarSvg } from './AvatarSvg';
import { Dica } from './Dica';

const TIERS = Object.entries(RARIDADES) as Array<[Raridade, (typeof RARIDADES)[Raridade]]>;

type ModoGrade = 'compacta' | 'detalhada' | 'lista';
const CHAVE_MODO = 'dshow.avatar.grade.modo.v1';
const MODOS: Array<{ id: ModoGrade; nome: string; Icone: typeof LayoutGrid }> = [
  { id: 'compacta', nome: 'Grade compacta', Icone: Grid2x2 },
  { id: 'detalhada', nome: 'Grade detalhada', Icone: LayoutGrid },
  { id: 'lista', nome: 'Lista', Icone: List },
];

type Ordem = 'padrao' | 'raridade' | 'nome' | 'recentes';

/** Enquadramento do thumbnail por categoria (AS4 §39.19 — foco na diferença).
 *  Exportado: a Vitrine (4.6 §23) usa o MESMO enquadramento nos cards. */
export const FOCO_THUMB: Partial<Record<CategoriaId, string>> = {
  base: '45 36 150 150',
  cabelo: '38 6 164 164',
  olhos: '64 56 112 112',
  boca: '66 92 108 108',
  acessorio: '40 28 160 160',
  roupa: '30 70 180 170',
  emblema: '108 162 92 92', // foco no peito — o pino aparece de verdade (§39.19)
};

const SLOTS_ACESSORIO = ['cabeca', 'rosto', 'pescoco'] as const;

/**
 * Aplica um item (ou 'nenhum') ao config, imutável.
 * Acessórios (decisão #41) são ADITIVOS por slot: equipar um chapéu não
 * derruba os óculos; clicar num acessório JÁ equipado desequipa só ele;
 * 'nenhum' limpa os três slots.
 */
export function comItem(config: AvatarConfig, categoria: CategoriaId, id: string | null): AvatarConfig {
  if (categoria === 'base') {
    return id ? { ...config, base: id } : config;
  }
  const camadas = { ...config.camadas };
  if (categoria === 'acessorio') {
    delete camadas.acessorio; // chave legada nunca persiste
    if (id) {
      const chave = `acessorio_${itemPorId(id)?.slot ?? 'cabeca'}` as const;
      if (camadas[chave] === id) delete camadas[chave]; // toggle no mesmo slot
      else camadas[chave] = id;
    } else {
      for (const s of SLOTS_ACESSORIO) delete camadas[`acessorio_${s}`];
    }
    return { ...config, camadas };
  }
  if (id) camadas[categoria] = id;
  else delete camadas[categoria];
  return { ...config, camadas };
}

/** Ids equipados na categoria (acessório pode ter até 3 — um por slot). */
function idsEquipados(config: AvatarConfig, categoria: CategoriaId): string[] {
  if (categoria === 'base') return [config.base];
  if (categoria === 'acessorio') {
    return [
      config.camadas.acessorio, config.camadas.acessorio_cabeca,
      config.camadas.acessorio_rosto, config.camadas.acessorio_pescoco,
    ].filter((x): x is string => typeof x === 'string');
  }
  const id = config.camadas[categoria];
  return id ? [id] : [];
}

export type AbaCatalogo = 'todos' | 'equipados' | 'favoritos' | 'novos' | 'bloqueados';

export function GradeItens({ config, categoria, desbloqueados, aoEscolher, filtroAba = 'todos', aoPrever, filtroSlot = 'todos' }: {
  config: AvatarConfig;
  categoria: CategoriaId;
  /** ids liberados por conquistas/eventos (vem do /api/avatar/vida.php) */
  desbloqueados: Set<string>;
  aoEscolher: (novo: AvatarConfig) => void;
  /** AS5 F2 S3 (P1 §22): aba externa do shell novo — 'todos' preserva o comportamento clássico */
  filtroAba?: AbaCatalogo;
  /** AS5 F3 C1 (P2 §64): hover no card → preview no PALCO (null = sair) */
  aoPrever?: (novo: AvatarConfig | null) => void;
  /** AS5 F3 C2 (P2 §68.3): chips de navegação por slot — só age em 'acessorio' */
  filtroSlot?: 'todos' | SlotAcessorio;
}) {
  const meta = CATEGORIAS.find((c) => c.id === categoria);
  const [busca, setBusca] = useState('');
  const [tier, setTier] = useState<Raridade | null>(null);
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [ocultarBloqueados, setOcultarBloqueados] = useState(false);
  const [ordem, setOrdem] = useState<Ordem>('padrao');
  const [favs, setFavs] = useState<Set<string>>(favoritos);
  const [modo, setModo] = useState<ModoGrade>(() => {
    try {
      const m = localStorage.getItem(CHAVE_MODO);
      return m === 'compacta' || m === 'lista' ? m : 'detalhada';
    } catch { return 'detalhada'; }
  });

  const trocarModo = (novo: ModoGrade) => {
    setModo(novo);
    try { localStorage.setItem(CHAVE_MODO, novo); } catch { /* sem storage */ }
  };

  // §56: popover de filtros secundários + contagem de ativos p/ o badge
  const [popoverAberto, setPopoverAberto] = useState(false);
  const nFiltros = (tier ? 1 : 0) + (soFavoritos ? 1 : 0) + (ocultarBloqueados ? 1 : 0);
  const limparFiltros = () => {
    setTier(null); setSoFavoritos(false); setOcultarBloqueados(false);
    setOrdem('padrao'); setPopoverAberto(false);
  };

  const bloqueado = (i: ParteDef) => Boolean(i.bloqueadoPor) && !desbloqueados.has(i.id);

  // esconde incompatíveis com a base (§35) e aplica busca/aba/slot — a BASE
  // dos filtros secundários (§56.2: os contadores do popover contam AQUI,
  // antes de raridade/favoritos/bloqueados serem aplicados)
  const equipadosAba = new Set(idsEquipados(config, categoria));
  const listaBase = useMemo(() => {
    const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const termos = normalizar(busca.trim()).split(/\s+/).filter(Boolean);
    return itensDe(categoria)
      .filter((i) => !i.requerBase || i.requerBase.includes(config.base))
      .filter((i) => {
        switch (filtroAba) {
          case 'equipados': return equipadosAba.has(i.id);
          case 'favoritos': return favs.has(i.id);
          case 'novos': return !!i.novo;
          case 'bloqueados': return bloqueado(i);
          default: return true;
        }
      })
      .filter((i) => categoria !== 'acessorio' || filtroSlot === 'todos'
        || (i.slot ?? 'cabeca') === filtroSlot) // §68.3
      .filter((i) => {
        if (!termos.length) return true;
        const alvo = normalizar(`${i.nome} ${i.tema} ${i.lore ?? i.descricao}`);
        return termos.every((t) => alvo.includes(t)); // AND (§57)
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, config.base, busca, favs, desbloqueados, filtroAba, filtroSlot]);

  // §56.2: contagem por raridade no CONTEXTO atual (mostrada no popover)
  const contagem = useMemo(() => {
    const c = new Map<Raridade, number>();
    for (const i of listaBase) c.set(i.raridade, (c.get(i.raridade) ?? 0) + 1);
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaBase, desbloqueados]);

  const itens = useMemo(() => {
    const usados = itensUsados();
    const lista = listaBase
      .filter((i) => !tier || i.raridade === tier)
      .filter((i) => !soFavoritos || favs.has(i.id))
      .filter((i) => !ocultarBloqueados || !bloqueado(i));
    if (ordem === 'raridade') lista.sort((a, b) => nivelRaridade(b.raridade) - nivelRaridade(a.raridade));
    if (ordem === 'nome') lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
    if (ordem === 'recentes') lista.sort((a, b) => Number(usados.has(b.id)) - Number(usados.has(a.id)));
    return lista;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaBase, tier, soFavoritos, ocultarBloqueados, ordem, favs]);

  const equipados = new Set(idsEquipados(config, categoria));
  const nomesEquipados = [...equipados].map((id) => itemPorId(id)?.nome).filter(Boolean).join(' + ');
  const filtrosAtivos = busca.trim() !== '' || tier !== null || soFavoritos || ocultarBloqueados;

  return (
    <div className="avst-biblioteca">
      {/* título contextual (AS4 §39.15) + modos de visualização (§23.1) */}
      <header className="avst-painel-titulo">
        <div>
          <h2>{meta?.nome ?? categoria}</h2>
          <p>
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
            {nomesEquipados ? <> · equipado: <strong>{nomesEquipados}</strong></> : ' · nada equipado'}
            {categoria === 'acessorio' && <> · até 3 ao mesmo tempo (cabeça, rosto, pescoço)</>}
          </p>
        </div>
        <div className="avst-modos" role="radiogroup" aria-label="Modo de visualização">
          {MODOS.map(({ id, nome, Icone }) => (
            <button key={id} type="button" role="radio" aria-checked={modo === id}
              title={nome} onClick={() => trocarModo(id)}>
              <Icone size={14} aria-hidden />
            </button>
          ))}
        </div>
      </header>

      {/* §56: busca sempre visível; filtros secundários no POPOVER "Filtros" */}
      <div className="avst-filtros">
        <label className="avst-busca">
          <Search size={13} aria-hidden />
          <input type="search" value={busca} placeholder="Buscar item, tema ou lore…"
            onChange={(e) => setBusca(e.target.value)} aria-label="Buscar itens" />
        </label>
        <div className="avst-fpop-ancora">
          <button type="button" className={`avst-botao avst-fpop-abrir${nFiltros ? ' avst-fpop-abrir-on' : ''}`}
            aria-expanded={popoverAberto} aria-haspopup="dialog"
            onClick={() => setPopoverAberto((v) => !v)}>
            <SlidersHorizontal size={13} aria-hidden /> Filtros{nFiltros ? <em>{nFiltros}</em> : null}
          </button>
          {popoverAberto && (<>
            <button type="button" className="avst-fpop-fundo" aria-label="Fechar filtros"
              onClick={() => setPopoverAberto(false)} />
            <div className="avst-fpop" role="dialog" aria-label="Filtros avançados">
              <h5>Raridade</h5>
              <div className="avst-fpop-raridades" role="radiogroup" aria-label="Filtrar por raridade">
                {TIERS.map(([id, r]) => (
                  <button key={id} type="button" role="radio" aria-checked={tier === id}
                    className={`avst-fpop-rar${tier === id ? ' avst-fpop-rar-on' : ''}`}
                    style={{ '--avst-rar': r.cor } as React.CSSProperties}
                    disabled={!contagem.get(id)}
                    onClick={() => setTier((t) => (t === id ? null : id))}>
                    <i aria-hidden /> {r.nome} <span>({contagem.get(id) ?? 0})</span>
                  </button>
                ))}
              </div>
              <h5>Exibição</h5>
              <label className="avst-fpop-opcao">
                <input type="checkbox" checked={soFavoritos}
                  onChange={(e) => setSoFavoritos(e.target.checked)} />
                <Star size={12} aria-hidden /> Só favoritos
              </label>
              <label className="avst-fpop-opcao">
                <input type="checkbox" checked={ocultarBloqueados}
                  onChange={(e) => setOcultarBloqueados(e.target.checked)} />
                <Lock size={12} aria-hidden /> Ocultar bloqueados
              </label>
              <label className="avst-fpop-opcao avst-ordenar" title="Ordenar itens">
                <ArrowDownUp size={12} aria-hidden />
                <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar por">
                  <option value="padrao">Padrão</option>
                  <option value="raridade">Raridade</option>
                  <option value="nome">Nome</option>
                  <option value="recentes">Recentes</option>
                </select>
              </label>
              {nFiltros > 0 && (
                <button type="button" className="avst-fpop-limpar" onClick={limparFiltros}>
                  Limpar tudo
                </button>
              )}
            </div>
          </>)}
        </div>
      </div>
      {/* §56.1: filtros aplicados viram chips removíveis */}
      {nFiltros > 0 && (
        <div className="avst-fchips" data-teste="chips-filtros">
          {tier && (
            <button type="button" className="avst-fchip" onClick={() => setTier(null)}
              style={{ '--avst-rar': RARIDADES[tier].cor } as React.CSSProperties}>
              <i aria-hidden /> {RARIDADES[tier].nome} <X size={11} aria-hidden />
            </button>
          )}
          {soFavoritos && (
            <button type="button" className="avst-fchip" onClick={() => setSoFavoritos(false)}>
              Só favoritos <X size={11} aria-hidden />
            </button>
          )}
          {ocultarBloqueados && (
            <button type="button" className="avst-fchip" onClick={() => setOcultarBloqueados(false)}>
              Só desbloqueados <X size={11} aria-hidden />
            </button>
          )}
          <button type="button" className="avst-fchip avst-fchip-limpar" onClick={limparFiltros}>
            Limpar tudo
          </button>
        </div>
      )}

      <div className="avst-grade" data-modo={modo} role="listbox" aria-label={`Itens de ${meta?.nome ?? categoria}`}>
        {meta && !meta.obrigatoria && !filtrosAtivos && (
          <button type="button" role="option" aria-selected={equipados.size === 0}
            className={`avst-card avst-card-nenhum ${equipados.size === 0 ? 'avst-card-ativo' : ''}`}
            onClick={() => aoEscolher(comItem(config, categoria, null))}>
            <span className="avst-card-vazio"><Ban size={26} aria-hidden /></span>
            <span className="avst-card-nome">Nenhum</span>
          </button>
        )}
        {itens.map((item) => (
          <CardItem key={item.id} item={item} config={config} modo={modo} aoPrever={aoPrever}
            ativo={equipados.has(item.id)}
            favorito={favs.has(item.id)}
            bloqueado={bloqueado(item)}
            aoFavoritar={() => setFavs(new Set(alternarFavorito(item.id)))}
            aoEscolher={() => aoEscolher(comItem(config, categoria, item.id))} />
        ))}
        {itens.length === 0 && (
          <p className="avst-grade-vazia">Nenhum item bate com o filtro — limpe a busca ou os tiers.</p>
        )}
      </div>
    </div>
  );
}

/** Pips de raridade — sinal ALÉM da cor (AS4 §39.20). */
function Pips({ raridade }: { raridade: Raridade }) {
  return (
    <span className="avst-card-pips" aria-hidden>
      {Array.from({ length: nivelRaridade(raridade) + 1 }, (_, i) => <i key={i} />)}
    </span>
  );
}

function CardItem({ item, config, modo, ativo, favorito, bloqueado, aoFavoritar, aoEscolher, aoPrever }: {
  item: ParteDef;
  config: AvatarConfig;
  modo: ModoGrade;
  ativo: boolean;
  favorito: boolean;
  bloqueado: boolean;
  aoFavoritar: () => void;
  aoEscolher: () => void;
  aoPrever?: (novo: AvatarConfig | null) => void;
}) {
  const rar = RARIDADES[item.raridade];
  const cardRef = useRef<HTMLDivElement>(null);
  // valida o preview: trocar p/ uma espécie derruba o cabelo TAMBÉM no thumbnail
  const preview = useMemo(() => validarConfig(comItem(config, item.categoria, item.id)), [config, item]);
  const escolher = bloqueado ? undefined : aoEscolher;
  const dica = item.bloqueadoPor?.startsWith('evento:')
    ? 'Item de evento — volta a ficar disponível na próxima janela.'
    : 'Recompensa de conquista — veja a aba Conquistas.';

  return (
    <div ref={cardRef} role="option" aria-selected={ativo} aria-disabled={bloqueado}
      className={`avst-card ${modo === 'lista' ? 'avst-card-lista' : ''} ${ativo ? 'avst-card-ativo' : ''} ${bloqueado ? 'avst-card-bloqueado' : ''}`}
      data-raridade={item.raridade}
      style={{ '--avst-rar': rar.cor } as React.CSSProperties}
      onClick={escolher}
      onMouseEnter={aoPrever && !bloqueado ? () => aoPrever(preview) : undefined}
      onMouseLeave={aoPrever ? () => aoPrever(null) : undefined}
      onKeyDown={(e) => { if (escolher && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); escolher(); } }}
      tabIndex={0}>
      <span className="avst-card-thumb">
        <AvatarSvg config={preview} estatico uid={`th-${item.id}`} foco={FOCO_THUMB[item.categoria]} />
      </span>
      {modo === 'lista' ? (
        <>
          <span className="avst-card-info">
            <span className="avst-card-nome">{item.nome}</span>
            <span className="avst-card-raridade">{rar.nome} <Pips raridade={item.raridade} /> · {item.tema}</span>
          </span>
          <button type="button" className={`avst-botao avst-btn-equipar ${ativo ? 'avst-botao-ativo' : ''}`}
            disabled={bloqueado}
            onClick={(e) => { e.stopPropagation(); escolher?.(); }}>
            {ativo
              ? (item.categoria === 'acessorio' ? <><Check size={13} aria-hidden /> Remover</> : <><Check size={13} aria-hidden /> Equipado</>)
              : 'Equipar'}
          </button>
        </>
      ) : (
        <>
          <span className="avst-card-nome">{item.nome}</span>
          {modo === 'detalhada' && (
            <>
              <span className="avst-card-raridade">{rar.nome} <Pips raridade={item.raridade} /></span>
              <span className="avst-card-desc">{item.lore ?? item.descricao}</span>
            </>
          )}
          {modo === 'compacta' && <span className="avst-card-raridade"><Pips raridade={item.raridade} /></span>}
        </>
      )}
      {item.novo && <span className="avst-card-novo">NOVO</span>}
      {ativo && <span className="avst-card-check"><Check size={13} aria-hidden /></span>}
      {bloqueado && <span className="avst-card-lock"><Lock size={15} aria-hidden /></span>}
      <button type="button" className={`avst-card-fav ${favorito ? 'avst-card-fav-on' : ''}`}
        title={favorito ? 'Remover dos favoritos' : 'Favoritar'}
        aria-pressed={favorito}
        onClick={(e) => { e.stopPropagation(); aoFavoritar(); }}>
        <Star size={12} aria-hidden />
      </button>
      {/* CARD RICO (4.6, decisão #42): tooltip por PORTAL com lore completo,
          origem, dependências e slots de cor — sem truncamento */}
      <Dica alvo={cardRef} id={`avst-tip-${item.id}`} cor={rar.cor}>
        <strong>{item.nome}</strong>
        <em style={{ color: rar.cor }}>{rar.nome} · {item.tema}</em>
        <span>{item.lore ?? item.descricao}</span>
        <span className="avst-tip-meta">
          Origem: {item.biblioteca === undefined || item.biblioteca === 'dshow' ? 'Dshow Original' : item.biblioteca}
        </span>
        {item.requerBase && item.requerBase.length > 0 && (
          <span className="avst-tip-meta">
            Só para: {item.requerBase.map((b) => itemPorId(b)?.nome ?? b).join(', ')}
          </span>
        )}
        {item.incompativelCom && item.incompativelCom.length > 0 && (
          <span className="avst-tip-meta">
            Não combina com: {item.incompativelCom.map((i) => itemPorId(i)?.nome ?? i).join(', ')}
          </span>
        )}
        {item.usaCores && item.usaCores.length > 0 && (
          <span className="avst-tip-meta">Recolorível: {item.usaCores.join(', ')}</span>
        )}
        {item.categoria === 'acessorio' && (
          <span className="avst-tip-meta">
            Slot: {item.slot === 'rosto' ? 'rosto' : item.slot === 'pescoco' ? 'pescoço/costas' : 'cabeça'} — combina com os outros slots
          </span>
        )}
        {bloqueado && <span className="avst-tip-lock">🔒 {dica}</span>}
      </Dica>
    </div>
  );
}
