// components/GradeItens.tsx — grade de itens da categoria ativa.
// @version 1.0.0  @created 2026-07-29
//
// Cada card mostra o item APLICADO ao avatar atual (thumbnail em contexto,
// briefing §10) com selo de raridade. Categorias opcionais ganham o card
// "Nenhum". Thumbnails são estáticas (sem SMIL) por economia de GPU.
import { useMemo, useState } from 'react';
import { Ban, Check, Search, Star } from 'lucide-react';
import type { AvatarConfig, CategoriaId, Raridade } from '../domain/types';
import { CATEGORIAS, RARIDADES, itensDe, validarConfig } from '../services/AvatarCatalog';
import { alternarFavorito, favoritos } from '../services/Progresso';
import type { ParteDef } from '../engine/base-api';
import { AvatarSvg } from './AvatarSvg';

const TIERS = Object.entries(RARIDADES) as Array<[Raridade, (typeof RARIDADES)[Raridade]]>;

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

export function GradeItens({ config, categoria, aoEscolher }: {
  config: AvatarConfig;
  categoria: CategoriaId;
  aoEscolher: (novo: AvatarConfig) => void;
}) {
  const meta = CATEGORIAS.find((c) => c.id === categoria);
  const [busca, setBusca] = useState('');
  const [tier, setTier] = useState<Raridade | null>(null);
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(favoritos);

  // esconde incompatíveis com a base (§35) e aplica busca/raridade/favoritos (F2c)
  const itens = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itensDe(categoria)
      .filter((i) => !i.requerBase || i.requerBase.includes(config.base))
      .filter((i) => !tier || i.raridade === tier)
      .filter((i) => !soFavoritos || favs.has(i.id))
      .filter((i) => !termo
        || i.nome.toLowerCase().includes(termo)
        || i.tema.toLowerCase().includes(termo)
        || (i.lore ?? i.descricao).toLowerCase().includes(termo));
  }, [categoria, config.base, busca, tier, soFavoritos, favs]);
  const equipado = idEquipado(config, categoria);

  const filtrosAtivos = busca.trim() !== '' || tier !== null || soFavoritos;

  return (
    <div className="avst-biblioteca">
      {/* barra de inventário: busca + tiers + favoritos (F2c §16) */}
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
        </div>
      </div>

      <div className="avst-grade" role="listbox" aria-label={`Itens de ${meta?.nome ?? categoria}`}>
        {meta && !meta.obrigatoria && !filtrosAtivos && (
          <button type="button" role="option" aria-selected={equipado === null}
            className={`avst-card avst-card-nenhum ${equipado === null ? 'avst-card-ativo' : ''}`}
            onClick={() => aoEscolher(comItem(config, categoria, null))}>
            <span className="avst-card-vazio"><Ban size={26} aria-hidden /></span>
            <span className="avst-card-nome">Nenhum</span>
          </button>
        )}
        {itens.map((item) => (
          <CardItem key={item.id} item={item} config={config}
            ativo={equipado === item.id}
            favorito={favs.has(item.id)}
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

function CardItem({ item, config, ativo, favorito, aoFavoritar, aoEscolher }: {
  item: ParteDef;
  config: AvatarConfig;
  ativo: boolean;
  favorito: boolean;
  aoFavoritar: () => void;
  aoEscolher: () => void;
}) {
  const rar = RARIDADES[item.raridade];
  // valida o preview: trocar p/ uma espécie derruba o cabelo TAMBÉM no thumbnail
  const preview = useMemo(() => validarConfig(comItem(config, item.categoria, item.id)), [config, item]);

  return (
    <div role="option" aria-selected={ativo}
      className={`avst-card ${ativo ? 'avst-card-ativo' : ''}`}
      data-raridade={item.raridade}
      style={{ '--avst-rar': rar.cor } as React.CSSProperties}
      onClick={aoEscolher}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoEscolher(); } }}
      tabIndex={0}>
      <span className="avst-card-thumb">
        <AvatarSvg config={preview} estatico uid={`th-${item.id}`} />
      </span>
      <span className="avst-card-nome">{item.nome}</span>
      <span className="avst-card-raridade">{rar.nome}</span>
      {item.novo && <span className="avst-card-novo">NOVO</span>}
      {ativo && <span className="avst-card-check"><Check size={13} aria-hidden /></span>}
      <button type="button" className={`avst-card-fav ${favorito ? 'avst-card-fav-on' : ''}`}
        title={favorito ? 'Remover dos favoritos' : 'Favoritar'}
        aria-pressed={favorito}
        onClick={(e) => { e.stopPropagation(); aoFavoritar(); }}>
        <Star size={12} aria-hidden />
      </button>
      {/* tooltip rica (AS3 §9): nome, tier e lore */}
      <span className="avst-tip" role="tooltip">
        <strong>{item.nome}</strong>
        <em style={{ color: rar.cor }}>{rar.nome}</em>
        <span>{item.lore ?? item.descricao}</span>
      </span>
    </div>
  );
}
