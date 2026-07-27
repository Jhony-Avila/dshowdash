/**
 * World Clock Map — relógio em destaque (canto inferior esquerdo).
 * @version 0.2.0
 *
 * HH:MM:SS grande + cidade/país + offset + dia da semana + data completa (pt-BR).
 * Atualiza a cada segundo (o chamador invoca tick()); nenhum timer próprio aqui.
 */
'use strict';

import { fmtSpotlight } from '../core/time.js';

export function createSpotlight() {
  const box = document.createElement('div');
  box.className = 'wcm-spotlight';
  box.innerHTML =
    '<div class="wcm-spotlight__time" aria-live="off">--:--:--</div>' +
    '<div class="wcm-spotlight__place">' +
      '<span class="wcm-spotlight__city"></span>' +
      '<span class="wcm-spotlight__country"></span>' +
      '<span class="wcm-spotlight__offset"></span>' +
    '</div>' +
    '<div class="wcm-spotlight__date">' +
      '<span class="wcm-spotlight__weekday"></span>' +
      '<span class="wcm-spotlight__datelong"></span>' +
    '</div>';

  const timeEl = box.querySelector('.wcm-spotlight__time');
  const cityEl = box.querySelector('.wcm-spotlight__city');
  const countryEl = box.querySelector('.wcm-spotlight__country');
  const offsetEl = box.querySelector('.wcm-spotlight__offset');
  const weekdayEl = box.querySelector('.wcm-spotlight__weekday');
  const dateEl = box.querySelector('.wcm-spotlight__datelong');

  let _city = null;

  function setCity(city) {
    _city = city;
    if (!city) return;
    cityEl.textContent = city.name;
    countryEl.textContent = city.country;
    tick(new Date());
  }

  function tick(now) {
    if (!_city) return;
    const s = fmtSpotlight(now || new Date(), _city.tz);
    timeEl.textContent = s.time;
    offsetEl.textContent = s.offset;
    // Capitaliza a primeira letra do dia da semana (pt-BR vem minúsculo).
    weekdayEl.textContent = s.weekday ? s.weekday.charAt(0).toUpperCase() + s.weekday.slice(1) : '';
    dateEl.textContent = s.dateLong;
  }

  return { el: box, setCity, tick };
}
