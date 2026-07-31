/**
 * components/SearchPanel.tsx — busca inteligente com autocomplete agrupado.
 * @version 3.0.0
 *
 * A busca da v2 era uma lista plana. Aqui os resultados vêm AGRUPADOS (Cidades,
 * Países, Aeroportos) como o briefing pede, com prefixo pesando mais que ocorrência
 * no meio e desempate por população — digitar "san" tem que trazer Santiago antes de
 * um vilarejo homônimo.
 *
 * TECLADO COMPLETO: ↑/↓ percorrem os resultados atravessando os grupos, Enter escolhe,
 * Esc limpa. É `combobox` + `listbox` com `aria-activedescendant`, o padrão APG — sem
 * isso um leitor de tela não anuncia o item destacado.
 */
'use strict';

import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { flagOf, searchGrouped, type City } from '@/data/cities';
import { fmtHM, offsetShort } from '@/lib/time';

export interface SearchPanelProps {
  date: Date;
  onSelect: (id: string) => void;
}

export function SearchPanel({ date, onSelect }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = useId();

  // useDeferredValue no lugar de debounce manual: o React mantém o campo respondendo
  // e recalcula a lista em prioridade baixa. Menos código e sem timer para limpar.
  const deferred = useDeferredValue(query);

  const groups = useMemo(() => searchGrouped(deferred, 6), [deferred]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => { setCursor(0); }, [deferred]);

  const choose = useCallback((city: City | undefined) => {
    if (!city) return;
    onSelect(city.id);
    setQuery('');
    setCursor(0);
    inputRef.current?.focus();
  }, [onSelect]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (flat.length ? (c + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (flat.length ? (c - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(flat[cursor]);
    } else if (e.key === 'Escape') {
      // stopPropagation: sem isso o Esc sobe e o app-shell fecha o painel inteiro
      // quando o usuário só queria limpar a busca.
      e.stopPropagation();
      setQuery('');
    }
  }, [flat, cursor, choose]);

  const activeId = flat[cursor] ? `${listId}-${flat[cursor].id}` : undefined;

  // aria-controls só quando o listbox EXISTE no DOM. Apontar para um id ausente é
  // referência quebrada: o leitor de tela anuncia um alvo que não está lá, e a
  // auditoria ARIA reprova — com razão.
  const ariaControls = flat.length > 0 ? { 'aria-controls': listId } : {};

  return (
    <div className="wcm-search">
      <div className="wcm-search__field">
        <Search size={14} className="wcm-search__icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          className="wcm-search__input"
          placeholder="Cidade, país ou código IATA…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={flat.length > 0}
          {...ariaControls}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-label="Buscar cidade, país ou aeroporto"
        />
        {query && (
          <button type="button" className="wcm-search__clear" onClick={() => setQuery('')} aria-label="Limpar busca">
            <X size={13} aria-hidden="true" />
          </button>
        )}
      </div>

      {query && !flat.length && (
        <p className="wcm-search__empty" role="status">Nenhum resultado para “{query}”.</p>
      )}

      {flat.length > 0 && (
        <ul className="wcm-search__results" id={listId} role="listbox" aria-label="Resultados da busca">
          {groups.map((group) => (
            <li key={group.label} role="presentation">
              <p className="wcm-search__group" role="presentation">{group.label}</p>
              <ul role="presentation">
                {group.items.map((city) => {
                  const index = flat.indexOf(city);
                  return (
                    <li
                      key={city.id}
                      id={`${listId}-${city.id}`}
                      role="option"
                      aria-selected={index === cursor}
                      className={`wcm-search__item${index === cursor ? ' is-cursor' : ''}`}
                      onMouseEnter={() => setCursor(index)}
                      onMouseDown={(e) => { e.preventDefault(); choose(city); }}
                    >
                      <span className="wcm-search__flag" aria-hidden="true">{flagOf(city.cc)}</span>
                      <span className="wcm-search__name">{city.name}</span>
                      <span className="wcm-search__country">{city.country}</span>
                      <span className="wcm-search__time">{fmtHM(date, city.tz)}</span>
                      <span className="wcm-search__utc">UTC{offsetShort(date, city.tz)}</span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
