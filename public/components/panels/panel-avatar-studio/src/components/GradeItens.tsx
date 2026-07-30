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
  ArrowDownUp, Ban, Check, Grid2x2, LayoutGrid, List, Lock, LockOpen, Search, Star,
} from 'lucide-react';
import type { AvatarConfig, CategoriaId, Raridade } from '../domain/types';
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

/** Enquadramento do thumbnail por categoria (AS4 §39.19 — foco na diferença). */
const FOCO_THUMB: Partial<Record<CategoriaId, string>> = {
  base: '45 36 150 150',
  cabelo: '38 6 164 164',
  olhos: '64 56 112 112',
  boca: '66 92 108 108',
  acessorio: '40 28 160 160',
  roupa: '30 70 180 170',
  emblema: '108 162 92 92', // foco no peito — o pino aparece de verdade (§39.19)
};

/** Aplica um item (ou 'nenhum') ao config, imutável. */
export function comItem(config: AvatarConfig, categoria: CategoriaId, id: string | null): AvatarConfig {
  if (categoria === 'base') {
    return id ? { ...config, base: id } : config;
  }
  const camadas = { ...config.camadas };
  if (id) camadas[categoria] = id;
  else delete camadas[categoria];
  return { ...config, camadas };
}

function idEquipado(config: AvatarConfig, categoria: CategoriaId): string | null {
  return categoria === 'base' ? config.base : config.camadas[categoria] ?? null;
}

export function GradeItens({ config, categoria, desbloqueados, aoEscolher }: {
  config: AvatarConfig;
  categoria: CategoriaId;
  /** ids liberados por conquistas/eventos (vem do /api/avatar/vida.php) */
  desbloqueados: Set<string>;
  aoEscolher: (novo: AvatarConfig) => void;
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

  const bloqueado = (i: ParteDef) => Boolean(i.bloqueadoPor) && !desbloqueados.has(i.id);

  // esconde incompatíveis com a base (§35) e aplica busca/raridade/favoritos
  // (F2c) + bloqueados/ordenação (AS4 §23.2/§39.14)
  const itens = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const usados = itensUsados();
    const lista = itensDe(categoria)
      .filter((i) => !i.requerBase || i.requerBase.includes(config.base))
      .filter((i) => !tier || i.raridade === tier)
      .filter((i) => !soFavoritos || favs.has(i.id))
      .filter((i) => !ocultarBloqueados || !bloqueado(i))
      .filter((i) => !termo
        || i.nome.toLowerCase().includes(termo)
        || i.tema.toLowerCase().includes(termo)
        || (i.lore ?? i.descricao).toLowerCase().includes(termo));
    if (ordem === 'raridade') lista.sort((a, b) => nivelRaridade(b.raridade) - nivelRaridade(a.raridade));
    if (ordem === 'nome') lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
    if (ordem === 'recentes') lista.sort((a, b) => Number(usados.has(b.id)) - Number(usados.has(a.id)));
    return lista;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, config.base, busca, tier, soFavoritos, ocultarBloqueados, ordem, favs, desbloqueados]);

  const equipado = idEquipado(config, categoria);
  const equipadoItem = equipado ? itemPorId(equipado) : null;
  const filtrosAtivos = busca.trim() !== '' || tier !== null || soFavoritos || ocultarBloqueados;

  return (
    <div className="avst-biblioteca">
      {/* título contextual (AS4 §39.15) + modos de visualização (§23.1) */}
      <header className="avst-painel-titulo">
        <div>
          <h2>{meta?.nome ?? categoria}</h2>
          <p>
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
            {equipadoItem ? <> · equipado: <strong>{equipadoItem.nome}</strong></> : ' · nada equipado'}
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

      {/* barra de inventário: busca + tiers + favoritos + bloqueados + ordem */}
      <div className="avst-filtros">
        <label className="avst-busca">
          <Search size={13} aria-hidden />
          <input type="search" value={busca} placeholder="Buscar item, tema ou lore…"
            onChange={(e) => setBusca(e.target.value)} aria-label="Buscar itens" />
        </label>
        <div className="avst-tiers" role="radiogroup" aria-label="Filtrar por raridade">
          {TIERS.map(([id, r]) => (
            <button key={id} type="button" role="radio" aria-checked={tier === id}
              className={`avst-tier ${tier === id ? 'avst-tier-ativo' : ''}`}
              style={{ '--avst-rar': r.cor } as React.CSSProperties}
              title={r.nome}
              onClick={() => setTier((t) => (t === id ? null : id))} />
          ))}
          <button type="button"
            className={`avst-tier-fav ${soFavoritos ? 'avst-tier-fav-ativo' : ''}`}
            title="Só favoritos" aria-pressed={soFavoritos}
            onClick={() => setSoFavoritos((v) => !v)}>
            <Star size={13} aria-hidden />
          </button>
          <button type="button"
            className={`avst-tier-fav ${ocultarBloqueados ? 'avst-tier-fav-ativo' : ''}`}
            title={ocultarBloqueados ? 'Mostrando só os desbloqueados' : 'Ocultar itens bloqueados'}
            aria-pressed={ocultarBloqueados}
            onClick={() => setOcultarBloqueados((v) => !v)}>
            {ocultarBloqueados ? <LockOpen size={13} aria-hidden /> : <Lock size={13} aria-hidden />}
          </button>
        </div>
        <label className="avst-ordenar" title="Ordenar itens">
          <ArrowDownUp size={12} aria-hidden />
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar por">
            <option value="padrao">Padrão</option>
            <option value="raridade">Raridade</option>
            <option value="nome">Nome</option>
            <option value="recentes">Recentes</option>
          </select>
        </label>
      </div>

      <div className="avst-grade" data-modo={modo} role="listbox" aria-label={`Itens de ${meta?.nome ?? categoria}`}>
        {meta && !meta.obrigatoria && !filtrosAtivos && (
          <button type="button" role="option" aria-selected={equipado === null}
            className={`avst-card avst-card-nenhum ${equipado === null ? 'avst-card-ativo' : ''}`}
            onClick={() => aoEscolher(comItem(config, categoria, null))}>
            <span className="avst-card-vazio"><Ban size={26} aria-hidden /></span>
            <span className="avst-card-nome">Nenhum</span>
          </button>
        )}
        {itens.map((item) => (
          <CardItem key={item.id} item={item} config={config} modo={modo}
            ativo={equipado === item.id}
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

function CardItem({ item, config, modo, ativo, favorito, bloqueado, aoFavoritar, aoEscolher }: {
  item: ParteDef;
  config: AvatarConfig;
  modo: ModoGrade;
  ativo: boolean;
  favorito: boolean;
  bloqueado: boolean;
  aoFavoritar: () => void;
  aoEscolher: () => void;
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
            {ativo ? <><Check size={13} aria-hidden /> Equipado</> : 'Equipar'}
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
      {/* tooltip rica (nome + tier + lore) — por PORTAL, nunca cortada (AS4 §22) */}
      <Dica alvo={cardRef} id={`avst-tip-${item.id}`} cor={rar.cor}>
        <strong>{item.nome}</strong>
        <em style={{ color: rar.cor }}>{rar.nome}</em>
        <span>{item.lore ?? item.descricao}</span>
        {bloqueado && <span className="avst-tip-lock">🔒 {dica}</span>}
      </Dica>
    </div>
  );
}
