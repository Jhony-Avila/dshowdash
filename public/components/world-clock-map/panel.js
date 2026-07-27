/**
 * World Clock Map — motor do painel (monta NO CONTAINER-MAIN, não em overlay).
 * @version 2.0.0
 *
 * createWorldClock() -> { mount(root), unmount, destroy, dispose, healthCheck, info }
 * Mesmo contrato de painel nativo do panel-cotacao-shared: o PanelLifecycleController
 * chama mount(root) passando o elemento de conteúdo do container-main, e unmount() ao sair.
 * Renderiza o mapa-múndi diretamente no container (sem backdrop/modal).
 *
 * Zero API externa: horários via IANA/Intl, terminator local (core/astro.js),
 * mapa SVG local (data/worldmap.js). Timers: 1s (destaque) + virada de minuto
 * (chips + terminator). Tudo limpo no unmount (clearInterval + AbortController).
 */
'use strict';

import { DEFAULT_CITY_IDS, LOCAL_CITY_ID, getCity } from './data/cities.js';
import { createMap } from './ui/map.js';
import { createSpotlight } from './ui/spotlight.js';
import { createSearch } from './ui/search.js';
import { createSettings } from './ui/settings.js';
import { readLocal, fetchServer, save } from './core/prefs.js';

const CSS_HREF = '/components/world-clock-map/world-clock-map.css';

function loadCSS() {
  if (!document.querySelector(`link[href="${CSS_HREF}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    document.head.appendChild(link);
  }
}

function fullscreenButton(target) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'wcm-iconbtn wcm-fsbtn';
  b.title = 'Tela cheia';
  b.setAttribute('aria-label', 'Tela cheia');
  b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3"/></svg>';
  b.addEventListener('click', () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (target.requestFullscreen) target.requestFullscreen();
    } catch (_e) { /* noop */ }
  });
  return b;
}

export function createWorldClock() {
  const MODULE_ID = 'panels/panel-relogio-mundial';
  const VERSION = '2.0.0';

  const S = {
    root: null, mounted: false, timerId: null, controller: null,
    map: null, spotlight: null, settings: null,
    visible: [], activeId: LOCAL_CITY_ID, lastMinute: -1
  };

  function selectCity(id) {
    const c = getCity(id);
    if (!c) return;
    S.activeId = id;
    S.map.setActive(id);
    S.spotlight.setCity(c);
  }
  function ensureVisible(id) {
    if (!getCity(id)) return;
    if (S.visible.indexOf(id) === -1) {
      S.visible.push(id);
      S.map.renderChips(S.visible, new Date());
      S.map.setActive(S.activeId);
      persist();
      S.settings.refresh();
    }
  }
  function removeCity(id) {
    if (id === LOCAL_CITY_ID) return; // cidade local não é removível
    const i = S.visible.indexOf(id);
    if (i > -1) {
      S.visible.splice(i, 1);
      if (S.activeId === id) selectCity(LOCAL_CITY_ID);
      S.map.renderChips(S.visible, new Date());
      S.map.setActive(S.activeId);
      persist();
      S.settings.refresh();
    }
  }
  function persist() { save(S.visible.slice()); }

  function mount(root) {
    loadCSS();
    S.root = root;
    S.mounted = true;
    S.controller = new AbortController();
    const signal = S.controller.signal;

    let visible = _sanitize(readLocal()) || DEFAULT_CITY_IDS.slice();
    visible = _ensureLocal(visible);
    S.visible = visible;
    S.activeId = LOCAL_CITY_ID;

    const panel = document.createElement('div');
    panel.className = 'wcm-panel';

    const map = createMap({
      localId: LOCAL_CITY_ID,
      onSelectCity: (id) => { ensureVisible(id); selectCity(id); }
    });
    const spotlight = createSpotlight();
    const search = createSearch({ onSelect: (id) => { ensureVisible(id); selectCity(id); } });
    const settings = createSettings({
      getVisible: () => S.visible.slice(),
      onToggle: (id, show) => { if (show) ensureVisible(id); else removeCity(id); },
      signal
    });

    S.map = map; S.spotlight = spotlight; S.settings = settings;

    const topbar = document.createElement('div');
    topbar.className = 'wcm-topbar';
    const right = document.createElement('div');
    right.className = 'wcm-topbar__right';
    right.appendChild(settings.el);
    right.appendChild(fullscreenButton(panel));
    topbar.appendChild(search.el);
    topbar.appendChild(right);

    map.el.appendChild(topbar);
    map.el.appendChild(spotlight.el);
    panel.appendChild(map.el);

    root.innerHTML = '';
    root.appendChild(panel);

    // Pintura inicial.
    const now = new Date();
    map.renderChips(S.visible, now);
    map.updateNight(now);
    selectCity(LOCAL_CITY_ID);
    spotlight.tick(now);
    S.lastMinute = now.getMinutes();

    // Timer único de 1s: destaque sempre; chips + terminator na virada de minuto.
    S.timerId = setInterval(() => {
      if (!S.mounted) return;
      const n = new Date();
      S.spotlight.tick(n);
      const m = n.getMinutes();
      if (m !== S.lastMinute) {
        S.lastMinute = m;
        S.map.updateTimes(n);
        S.map.updateNight(n);
      }
    }, 1000);

    // Reconciliação com o servidor (fonte da verdade). Não bloqueia a montagem.
    // IMPORTANTE: só reconcilia se o servidor REALMENTE tiver uma preferência
    // (array). null = sem preferência salva → mantém os defaults (não zera p/ local).
    fetchServer().then((server) => {
      if (!S.mounted || !Array.isArray(server)) return;
      const clean = _ensureLocal(_sanitize(server) || []);
      if (clean.length && clean.join(',') !== S.visible.join(',')) {
        S.visible = clean;
        S.map.renderChips(S.visible, new Date());
        S.map.setActive(S.activeId);
        S.settings.refresh();
      }
    });

    return Promise.resolve(true);
  }

  function unmount() {
    S.mounted = false;
    if (S.timerId) { clearInterval(S.timerId); S.timerId = null; }
    if (S.controller) { S.controller.abort(); S.controller = null; }
    if (S.root) { S.root.innerHTML = ''; S.root = null; }
    S.map = null; S.spotlight = null; S.settings = null;
    return Promise.resolve(true);
  }

  const destroy = () => unmount();
  const dispose = () => unmount();
  const healthCheck = () => ({ status: S.mounted ? 'HEALTHY' : 'IDLE', checks: { mounted: S.mounted }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() });
  const info = () => ({ moduleId: MODULE_ID, version: VERSION, mounted: S.mounted, visible: S.visible.length });

  return { mount, unmount, destroy, dispose, healthCheck, info, VERSION, MODULE_ID };
}

function _sanitize(arr) {
  if (!Array.isArray(arr)) return null;
  const out = [];
  for (const id of arr) { if (getCity(id) && out.indexOf(id) === -1) out.push(id); }
  return out.length ? out : null;
}
function _ensureLocal(arr) {
  const a = arr.slice();
  if (a.indexOf(LOCAL_CITY_ID) === -1) a.unshift(LOCAL_CITY_ID);
  return a;
}
