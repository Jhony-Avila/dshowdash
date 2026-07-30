// components/GradeItens.tsx — grade de itens da categoria ativa.
// @version 1.0.0  @created 2026-07-29
//
// Cada card mostra o item APLICADO ao avatar atual (thumbnail em contexto,
// briefing §10) com selo de raridade. Categorias opcionais ganham o card
// "Nenhum". Thumbnails são estáticas (sem SMIL) por economia de GPU.
import { useMemo } from 'react';
import { Ban, Check } from 'lucide-react';
import type { AvatarConfig, CategoriaId } from '../domain/types';
import { CATEGORIAS, RARIDADES, itensDe, validarConfig } from '../services/AvatarCatalog';
import type { ParteDef } from '../engine/base-api';
import { AvatarSvg } from './AvatarSvg';

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
  // esconde itens incompatíveis com a base equipada (§35 — ex.: cabelos em espécies)
  const itens = useMemo(
    () => itensDe(categoria).filter((i) => !i.requerBase || i.requerBase.includes(config.base)),
    [categoria, config.base],
  );
  const equipado = idEquipado(config, categoria);

  return (
    <div className="avst-grade" role="listbox" aria-label={`Itens de ${meta?.nome ?? categoria}`}>
      {meta && !meta.obrigatoria && (
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
          aoEscolher={() => aoEscolher(comItem(config, categoria, item.id))} />
      ))}
    </div>
  );
}

function CardItem({ item, config, ativo, aoEscolher }: {
  item: ParteDef;
  config: AvatarConfig;
  ativo: boolean;
  aoEscolher: () => void;
}) {
  const rar = RARIDADES[item.raridade];
  // valida o preview: trocar p/ uma espécie derruba o cabelo TAMBÉM no thumbnail
  const preview = useMemo(() => validarConfig(comItem(config, item.categoria, item.id)), [config, item]);

  return (
    <button type="button" role="option" aria-selected={ativo}
      className={`avst-card ${ativo ? 'avst-card-ativo' : ''}`}
      data-raridade={item.raridade}
      style={{ '--avst-rar': rar.cor } as React.CSSProperties}
      onClick={aoEscolher}>
      <span className="avst-card-thumb">
        <AvatarSvg config={preview} estatico uid={`th-${item.id}`} />
      </span>
      <span className="avst-card-nome">{item.nome}</span>
      <span className="avst-card-raridade">{rar.nome}</span>
      {item.novo && <span className="avst-card-novo">NOVO</span>}
      {ativo && <span className="avst-card-check"><Check size={13} aria-hidden /></span>}
      {/* tooltip rica (AS3 §9): nome, tier e lore */}
      <span className="avst-tip" role="tooltip">
        <strong>{item.nome}</strong>
        <em style={{ color: rar.cor }}>{rar.nome}</em>
        <span>{item.lore ?? item.descricao}</span>
      </span>
    </button>
  );
}
