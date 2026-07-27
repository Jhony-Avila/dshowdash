/**
 * World Clock Map — busca de cidades (canto superior esquerdo).
 * @version 0.2.0
 *
 * Busca na base local (data/cities.js). Ao selecionar, dispara onSelect(id):
 * o orquestrador centraliza/destaca a cidade, garante o chip e a põe no destaque.
 */
'use strict';

import { searchCities } from '../data/cities.js';

export function createSearch(opts) {
  opts = opts || {};
  const onSelect = opts.onSelect || function () {};

  const box = document.createElement('div');
  box.className = 'wcm-search';
  box.innerHTML =
    '<div class="wcm-search__field">' +
      '<svg class="wcm-search__icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
      '<input type="text" class="wcm-search__input" placeholder="Buscar cidade…" aria-label="Buscar cidade" autocomplete="off" spellcheck="false" />' +
    '</div>' +
    '<ul class="wcm-search__results" role="listbox" hidden></ul>';

  const input = box.querySelector('.wcm-search__input');
  const results = box.querySelector('.wcm-search__results');

  function render(list) {
    results.textContent = '';
    if (!list.length) { results.hidden = true; return; }
    for (const c of list) {
      const li = document.createElement('li');
      li.className = 'wcm-search__item';
      li.setAttribute('role', 'option');
      li.setAttribute('data-city-id', c.id);
      li.innerHTML = '<span class="wcm-search__name"></span><span class="wcm-search__country"></span>';
      li.querySelector('.wcm-search__name').textContent = c.name;
      li.querySelector('.wcm-search__country').textContent = c.country;
      results.appendChild(li);
    }
    results.hidden = false;
  }

  function choose(id) {
    if (!id) return;
    onSelect(id);
    input.value = '';
    results.hidden = true;
  }

  input.addEventListener('input', () => {
    render(searchCities(input.value, 10));
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { input.value = ''; results.hidden = true; e.stopPropagation(); }
    else if (e.key === 'Enter') {
      const first = results.querySelector('.wcm-search__item');
      if (first) choose(first.getAttribute('data-city-id'));
    }
  });
  results.addEventListener('click', (e) => {
    const item = e.target.closest('.wcm-search__item');
    if (item) choose(item.getAttribute('data-city-id'));
  });
  // Fecha resultados ao perder foco (com atraso p/ permitir o clique).
  input.addEventListener('blur', () => { setTimeout(() => { results.hidden = true; }, 150); });

  return { el: box };
}
