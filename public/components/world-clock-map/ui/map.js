/**
 * World Clock Map — cena do mapa (SVG + pontos + chips + terminator + tooltip).
 * @version 0.2.0
 *
 * Constrói o mapa-múndi SVG (oceano + terra), pontos discretos de TODAS as cidades,
 * chips "Cidade HH:MM" para o conjunto visível e o overlay noturno (terminator).
 * Alinhamento perfeito: o wrap mantém proporção 2:1 (igual ao viewBox 1000x500),
 * então chips em % coincidem com o SVG. Sem re-render do mapa a cada segundo:
 * o mapa/pontos são desenhados uma vez; só chips (1min) e terminator (1min) mudam.
 */
'use strict';

import { WORLD_PATH, MAP_W, MAP_H } from '../data/worldmap.js';
import { CITIES, getCity } from '../data/cities.js';
import { projectPct, project } from '../core/projection.js';
import { nightPath } from '../core/astro.js';
import { fmtHM } from '../core/time.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Ajustes manuais anti-sobreposição p/ clusters densos (em pontos percentuais).
const LABEL_OFFSETS = {
  london: [-1, -5], paris: [1, 4], berlin: [3, -4], madrid: [-4, 4],
  rome: [2, 5], moscow: [4, -3], amsterdam: [-3, -6],
  beijing: [0, -6], shanghai: [4, 3], seoul: [5, -4], tokyo: [5, 2],
  'hong-kong': [3, 5], dubai: [0, 5], 'new-delhi': [-2, 5], singapore: [-2, 5]
};

function el(tag, cls, attrs) {
  const n = document.createElementNS(SVG_NS, tag);
  if (cls) n.setAttribute('class', cls);
  if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

export function createMap(opts) {
  opts = opts || {};
  const onSelect = opts.onSelectCity || function () {};

  const wrap = document.createElement('div');
  wrap.className = 'wcm-map-wrap';

  const svg = el('svg', 'wcm-map-svg', {
    viewBox: `0 0 ${MAP_W} ${MAP_H}`,
    preserveAspectRatio: 'xMidYMid meet'
  });
  svg.appendChild(el('rect', 'wcm-ocean', { x: 0, y: 0, width: MAP_W, height: MAP_H }));
  svg.appendChild(el('path', 'wcm-land', { d: WORLD_PATH }));

  const nightEl = el('path', 'wcm-night', { d: '' });
  svg.appendChild(nightEl);

  // Pontos discretos de TODAS as cidades (marcadores claros).
  const dotsG = el('g', 'wcm-dots');
  for (const c of CITIES) {
    const p = project(c.lat, c.lng);
    const dot = el('circle', 'wcm-dot', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 1.6 });
    dot.setAttribute('data-city-id', c.id);
    dotsG.appendChild(dot);
  }
  svg.appendChild(dotsG);
  wrap.appendChild(svg);

  // Camada HTML dos chips (posicionados em %).
  const chipsLayer = document.createElement('div');
  chipsLayer.className = 'wcm-chips';
  wrap.appendChild(chipsLayer);

  // Tooltip reutilizável.
  const tip = document.createElement('div');
  tip.className = 'wcm-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  wrap.appendChild(tip);

  let _visible = [];   // array de ids
  let _activeId = null;

  // ---- clique em ponto/chip -> seleciona cidade ----
  wrap.addEventListener('click', (e) => {
    const t = e.target.closest('[data-city-id]');
    if (!t) return;
    onSelect(t.getAttribute('data-city-id'));
  });

  // ---- hover em qualquer ponto -> tooltip com nome + hora atual ----
  wrap.addEventListener('mouseover', (e) => {
    const dot = e.target.closest('.wcm-dot');
    if (!dot) return;
    const c = getCity(dot.getAttribute('data-city-id'));
    if (!c) return;
    tip.textContent = `${c.name} · ${fmtHM(new Date(), c.tz)}`;
    tip.hidden = false;
    const pct = projectPct(c.lat, c.lng);
    tip.style.left = pct.left + '%';
    tip.style.top = pct.top + '%';
  });
  wrap.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest('.wcm-dot')) tip.hidden = true;
  });

  function renderChips(visibleIds, now) {
    _visible = visibleIds.slice();
    chipsLayer.textContent = '';
    for (const id of _visible) {
      const c = getCity(id);
      if (!c) continue;
      const pct = projectPct(c.lat, c.lng);
      const off = LABEL_OFFSETS[id] || [0, 0];
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'wcm-chip' + (id === opts.localId ? ' wcm-chip--local' : '') + (id === _activeId ? ' is-active' : '');
      chip.setAttribute('data-city-id', id);
      chip.style.left = (pct.left + off[0]) + '%';
      chip.style.top = (pct.top + off[1]) + '%';
      chip.innerHTML =
        '<span class="wcm-chip__dot"></span>' +
        '<span class="wcm-chip__name"></span>' +
        '<span class="wcm-chip__time"></span>';
      chip.querySelector('.wcm-chip__name').textContent = c.name;
      chip.querySelector('.wcm-chip__time').textContent = fmtHM(now || new Date(), c.tz);
      chipsLayer.appendChild(chip);
    }
  }

  function updateTimes(now) {
    const chips = chipsLayer.querySelectorAll('.wcm-chip');
    chips.forEach((chip) => {
      const c = getCity(chip.getAttribute('data-city-id'));
      if (c) chip.querySelector('.wcm-chip__time').textContent = fmtHM(now, c.tz);
    });
  }

  function updateNight(now) {
    nightEl.setAttribute('d', nightPath(now));
  }

  function setActive(id) {
    _activeId = id;
    chipsLayer.querySelectorAll('.wcm-chip').forEach((chip) => {
      chip.classList.toggle('is-active', chip.getAttribute('data-city-id') === id);
    });
    dotsG.querySelectorAll('.wcm-dot').forEach((d) => {
      d.classList.toggle('is-active', d.getAttribute('data-city-id') === id);
    });
  }

  return { el: wrap, renderChips, updateTimes, updateNight, setActive };
}
