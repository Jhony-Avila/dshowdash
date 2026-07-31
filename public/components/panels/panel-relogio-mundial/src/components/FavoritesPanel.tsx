/**
 * components/FavoritesPanel.tsx — favoritas com categorias e reordenação por arrasto.
 * @version 3.1.0
 *
 * O `Reorder` do motion faz o arrasto com animação de layout de verdade (os vizinhos
 * abrem espaço enquanto o item viaja). Escrever isso à mão custaria centenas de linhas
 * de medição de retângulo — foi por essa função específica que a dependência entrou.
 *
 * CATEGORIAS (briefing, seção "Favoritos": arrastar, organizar, fixar, categorias).
 * Cada favorita pode receber um rótulo livre e as cidades passam a aparecer agrupadas.
 * A ORDEM GLOBAL continua sendo uma lista só — arrastar dentro de um grupo reescreve
 * apenas as posições daquele grupo na lista global. Guardar uma lista por grupo
 * permitiria a mesma cidade em dois grupos; um mapa cidade→rótulo torna isso
 * impossível por construção.
 *
 * ARRASTAR NÃO PODE SER O ÚNICO CAMINHO: quem navega por teclado reordena com
 * Alt+↑/↓ nos mesmos itens, e a mudança é anunciada por uma região `aria-live`.
 * Uma lista que só se reordena com mouse é uma lista que exclui gente.
 */
'use strict';

import { useCallback, useMemo, useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { GripVertical, Star, Trash2, MapPin, Tag } from 'lucide-react';
import { flagOf, getCity, type City } from '@/data/cities';
import { fmtHM, offsetShort, tzDiffLabel, tzDiffMinutes, dayShift } from '@/lib/time';
import { timeState, TIME_STATE_LABEL, TIME_STATE_TOKEN } from '@/lib/business';

/** Sugestões oferecidas no campo livre — atalho, não camisa de força. */
const SUGESTOES = ['Operação', 'Mercados', 'Clientes', 'Equipe', 'Fornecedores'];
const SEM_CATEGORIA = 'Sem categoria';

export interface FavoritesPanelProps {
  favorites: string[];
  categories: Record<string, string>;
  activeId: string;
  baseTz: string;
  date: Date;
  onReorder: (ids: string[]) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onCategory: (id: string, label: string) => void;
}

export function FavoritesPanel({
  favorites, categories, activeId, baseTz, date, onReorder, onSelect, onRemove, onCategory,
}: FavoritesPanelProps) {
  const [announce, setAnnounce] = useState('');

  /** Grupos na ordem de primeira aparição; "Sem categoria" sempre por último. */
  const grupos = useMemo(() => {
    const mapa = new Map<string, string[]>();
    for (const id of favorites) {
      if (!getCity(id)) continue;
      const rot = categories[id] || SEM_CATEGORIA;
      if (!mapa.has(rot)) mapa.set(rot, []);
      mapa.get(rot)!.push(id);
    }
    const entradas = [...mapa.entries()];
    entradas.sort((a, b) => {
      if (a[0] === SEM_CATEGORIA) return 1;
      if (b[0] === SEM_CATEGORIA) return -1;
      return 0;
    });
    return entradas;
  }, [favorites, categories]);

  /**
   * Reordena DENTRO de um grupo preservando a lista global.
   * As posições que o grupo ocupava na lista completa recebem a nova sequência; o
   * resto não se move. Sem isso, arrastar em um grupo embaralharia os outros.
   */
  const reordenarGrupo = useCallback((idsDoGrupo: string[], novaOrdem: string[]) => {
    const posicoes = favorites
      .map((id, i) => (idsDoGrupo.includes(id) ? i : -1))
      .filter((i) => i >= 0);
    const proximo = favorites.slice();
    posicoes.forEach((pos, k) => { proximo[pos] = novaOrdem[k]; });
    onReorder(proximo);
  }, [favorites, onReorder]);

  const mover = useCallback((id: string, delta: number) => {
    const i = favorites.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= favorites.length) return;
    const next = favorites.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onReorder(next);
    setAnnounce(`${getCity(id)?.name} movida para a posição ${j + 1} de ${next.length}`);
  }, [favorites, onReorder]);

  if (!grupos.length) {
    return (
      <p className="wcm-empty">
        <Star size={14} aria-hidden="true" />
        Nenhuma cidade favorita. Clique na estrela de um cartão do mapa para fixá-la aqui.
      </p>
    );
  }

  return (
    <>
      <datalist id="wcm-cat-sugestoes">
        {SUGESTOES.map((s) => <option key={s} value={s} />)}
      </datalist>

      {grupos.map(([rotulo, ids]) => (
        <section key={rotulo} className="wcm-favgrupo">
          {grupos.length > 1 && (
            <h4 className="wcm-favgrupo__h">
              <Tag size={10} aria-hidden="true" />
              {rotulo}
              <span className="wcm-favgrupo__n">{ids.length}</span>
            </h4>
          )}
          <Reorder.Group
            axis="y"
            values={ids}
            onReorder={(nova: string[]) => reordenarGrupo(ids, nova)}
            className="wcm-favs"
            as="ul"
          >
            {ids.map((id) => {
              const city = getCity(id)!;
              return (
                <FavoriteRow
                  key={id}
                  city={city}
                  date={date}
                  baseTz={baseTz}
                  categoria={categories[id] || ''}
                  active={id === activeId}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  onMove={mover}
                  onCategory={onCategory}
                />
              );
            })}
          </Reorder.Group>
        </section>
      ))}

      <p className="wcm-sr" role="status" aria-live="polite">{announce}</p>
      <p className="wcm-hint">
        Arraste para reordenar, ou use Alt + ↑ / ↓ pelo teclado. O campo com a etiqueta
        agrupa a cidade numa categoria.
      </p>
    </>
  );
}

interface RowProps {
  city: City;
  date: Date;
  baseTz: string;
  categoria: string;
  active: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, delta: number) => void;
  onCategory: (id: string, label: string) => void;
}

function FavoriteRow({
  city, date, baseTz, categoria, active, onSelect, onRemove, onMove, onCategory,
}: RowProps) {
  const controls = useDragControls();
  const [editando, setEditando] = useState(false);
  const ts = timeState(city, date);
  const diff = tzDiffMinutes(date, baseTz, city.tz);
  const shift = dayShift(date, baseTz, city.tz);

  return (
    <Reorder.Item
      value={city.id}
      dragListener={false}
      dragControls={controls}
      className={`wcm-fav${active ? ' is-active' : ''}`}
      as="li"
      style={{ ['--wcm-marker-state' as string]: TIME_STATE_TOKEN[ts] }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!e.altKey) return;
        if (e.key === 'ArrowUp') { e.preventDefault(); onMove(city.id, -1); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); onMove(city.id, 1); }
      }}
    >
      <button
        type="button"
        className="wcm-fav__grip"
        onPointerDown={(e) => controls.start(e)}
        aria-label={`Arrastar ${city.name} para reordenar`}
        title="Arrastar para reordenar"
      >
        <GripVertical size={13} aria-hidden="true" />
      </button>

      <button
        type="button"
        className="wcm-fav__main"
        onClick={() => onSelect(city.id)}
        aria-pressed={active}
        aria-label={`${city.name}, ${fmtHM(date, city.tz)}, ${TIME_STATE_LABEL[ts]}`}
      >
        <span className="wcm-fav__flag" aria-hidden="true">{flagOf(city.cc)}</span>
        <span className="wcm-fav__name">{city.name}</span>
        <span className="wcm-fav__time">
          {fmtHM(date, city.tz)}
          {shift !== 0 && <sup className="wcm-fav__shift">{shift > 0 ? '+1' : '−1'}</sup>}
        </span>
        <span className="wcm-fav__diff" title={`UTC${offsetShort(date, city.tz)}`}>
          {tzDiffLabel(diff)}
        </span>
      </button>

      <button
        type="button"
        className={`wcm-fav__tag${categoria ? ' is-set' : ''}`}
        onClick={() => setEditando((v) => !v)}
        aria-expanded={editando}
        aria-label={categoria ? `Categoria de ${city.name}: ${categoria}. Alterar.` : `Definir categoria de ${city.name}`}
        title={categoria || 'Definir categoria'}
      >
        <Tag size={12} aria-hidden="true" />
      </button>

      <button
        type="button"
        className="wcm-fav__remove"
        onClick={() => onRemove(city.id)}
        aria-label={`Remover ${city.name} dos favoritos`}
        title="Remover dos favoritos"
      >
        <Trash2 size={12} aria-hidden="true" />
      </button>

      {editando && (
        <form
          className="wcm-fav__cat"
          onSubmit={(e) => {
            e.preventDefault();
            const campo = e.currentTarget.elements.namedItem('cat') as HTMLInputElement;
            onCategory(city.id, campo.value);
            setEditando(false);
          }}
        >
          <input
            name="cat"
            type="text"
            list="wcm-cat-sugestoes"
            defaultValue={categoria}
            placeholder="Categoria…"
            maxLength={32}
            autoFocus
            aria-label={`Categoria de ${city.name}`}
            onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setEditando(false); } }}
          />
          <button type="submit" className="wcm-fav__catok">OK</button>
        </form>
      )}
    </Reorder.Item>
  );
}

/** Lista compacta das cidades visíveis, com ação de fixar/desafixar. */
export function VisibleCitiesList({
  cities, activeId, favorites, date, onSelect, onToggleFav, onRemove,
}: {
  cities: City[];
  activeId: string;
  favorites: string[];
  date: Date;
  onSelect: (id: string) => void;
  onToggleFav: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <ul className="wcm-vis">
      {cities.map((city) => (
        <li key={city.id} className={`wcm-vis__row${city.id === activeId ? ' is-active' : ''}`}>
          <button type="button" className="wcm-vis__main" onClick={() => onSelect(city.id)}>
            <MapPin size={11} aria-hidden="true" />
            <span className="wcm-vis__name">{city.name}</span>
            <span className="wcm-vis__time">{fmtHM(date, city.tz)}</span>
          </button>
          <button
            type="button"
            className={`wcm-vis__fav${favorites.includes(city.id) ? ' is-on' : ''}`}
            onClick={() => onToggleFav(city.id)}
            aria-pressed={favorites.includes(city.id)}
            aria-label={`${favorites.includes(city.id) ? 'Remover' : 'Adicionar'} ${city.name} ${favorites.includes(city.id) ? 'dos' : 'aos'} favoritos`}
          >
            <Star size={12} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="wcm-vis__del"
            onClick={() => onRemove(city.id)}
            aria-label={`Tirar ${city.name} do mapa`}
          >
            <Trash2 size={11} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
