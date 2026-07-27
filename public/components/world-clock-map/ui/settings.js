/**
 * World Clock Map — engrenagem de personalização (fixar/remover cidades).
 * @version 0.2.0
 *
 * Botão de configurações que abre um popover listando as cidades exibidas
 * (com remover) e um campo para adicionar da base local. Alterações sobem via
 * onToggle(id, show); a persistência é responsabilidade do orquestrador (prefs).
 */
'use strict';

import { getCity, searchCities, LOCAL_CITY_ID } from '../data/cities.js';

export function createSettings(opts) {
  opts = opts || {};
  const getVisible = opts.getVisible || function () { return []; };
  const onToggle = opts.onToggle || function () {};

  const box = document.createElement('div');
  box.className = 'wcm-settings';
  box.innerHTML =
    '<button type="button" class="wcm-iconbtn wcm-settings__btn" title="Personalizar cidades" aria-label="Personalizar cidades" aria-expanded="false">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
    '</button>' +
    '<div class="wcm-settings__pop" hidden>' +
      '<div class="wcm-settings__head">Cidades exibidas</div>' +
      '<ul class="wcm-settings__list"></ul>' +
      '<div class="wcm-settings__add">' +
        '<input type="text" class="wcm-settings__input" placeholder="Adicionar cidade…" aria-label="Adicionar cidade" autocomplete="off" spellcheck="false" />' +
        '<ul class="wcm-settings__addresults" role="listbox" hidden></ul>' +
      '</div>' +
    '</div>';

  const btn = box.querySelector('.wcm-settings__btn');
  const pop = box.querySelector('.wcm-settings__pop');
  const list = box.querySelector('.wcm-settings__list');
  const input = box.querySelector('.wcm-settings__input');
  const addResults = box.querySelector('.wcm-settings__addresults');

  function renderList() {
    list.textContent = '';
    for (const id of getVisible()) {
      const c = getCity(id);
      if (!c) continue;
      const li = document.createElement('li');
      li.className = 'wcm-settings__item';
      li.innerHTML = '<span class="wcm-settings__cname"></span>' +
        '<button type="button" class="wcm-settings__remove" title="Remover">×</button>';
      li.querySelector('.wcm-settings__cname').textContent = c.name;
      const rm = li.querySelector('.wcm-settings__remove');
      rm.setAttribute('aria-label', 'Remover ' + c.name);
      // A cidade local não é removível (mantém sempre um horário de referência).
      if (id === LOCAL_CITY_ID) { rm.disabled = true; rm.title = 'Cidade local'; }
      else rm.addEventListener('click', () => { onToggle(id, false); renderList(); });
      list.appendChild(li);
    }
  }

  function renderAdd(list2) {
    addResults.textContent = '';
    const visible = getVisible();
    const filtered = list2.filter((c) => visible.indexOf(c.id) === -1);
    if (!filtered.length) { addResults.hidden = true; return; }
    for (const c of filtered) {
      const li = document.createElement('li');
      li.className = 'wcm-settings__additem';
      li.setAttribute('data-city-id', c.id);
      li.innerHTML = '<span></span>';
      li.querySelector('span').textContent = c.name + ' — ' + c.country;
      addResults.appendChild(li);
    }
    addResults.hidden = false;
  }

  function open() { pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); renderList(); }
  function close() { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); addResults.hidden = true; input.value = ''; }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (pop.hidden) open(); else close();
  });
  input.addEventListener('input', () => { renderAdd(searchCities(input.value, 8)); });
  addResults.addEventListener('click', (e) => {
    const item = e.target.closest('.wcm-settings__additem');
    if (!item) return;
    onToggle(item.getAttribute('data-city-id'), true);
    input.value = '';
    addResults.hidden = true;
    renderList();
  });
  // Fecha o popover ao clicar fora dele. Usa o signal do modal p/ auto-remoção
  // no fechamento (sem listener órfão em document entre aberturas).
  document.addEventListener('click', (e) => {
    if (!pop.hidden && !box.contains(e.target)) close();
  }, opts.signal ? { signal: opts.signal } : false);

  return { el: box, refresh: renderList };
}
