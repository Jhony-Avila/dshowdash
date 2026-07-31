'use strict';
// gcal-header-popover — estado do ícone (§8.3) + popover de próximos (§9).
// @module  components/gcal-header-popover
// @version 1.0.0
// @created 2026-07-30
//
// POR QUE UM MÓDULO STANDALONE, E NÃO DENTRO DO BOTÃO DO HEADER:
// o botão `panel-calendar` é servido pelo `header-components.bundle.js`, e
// rebuildar esse bundle está desaconselhado no projeto (drift conhecido em
// email-integration/Outlook). O precedente para acrescentar comportamento ao
// header sem tocá-lo é o `traffic-monitor/header-indicator.js`: um <script
// type="module"> no index.html, que é `no-store` — então o `?v=` propaga na
// hora, sem depender do SW nem do cache do Cloudflare.
//
// CONTRATO COM O BOTÃO EXISTENTE:
//   · clique      → NÃO interceptado. Continua navegando para o painel.
//   · hover/foco  → abre o popover.
// Sequestrar o clique quebraria o caminho que já funciona e foi provado.

const SELETOR = '[data-panel-trigger="panel-calendar"]';
const API = '/api/google-calendar';
const INTERVALO = 180000;        // 3 min — o header não precisa de mais
const ATRASO_ABRIR = 320;        // evita popover piscando ao cruzar o mouse

let _btn = null;
let _pop = null;
let _timerAbrir = null;
let _timerPoll = null;
let _carregando = false;
let _ultimo = null;

/* ── util ─────────────────────────────────────────────────────────── */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function pegar(caminho) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch(API + caminho, {
      credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const b = await r.json();
    // Envelope do projeto é {ok,data,error} — nunca `success`.
    return b && b.ok ? b.data : null;
  } catch (_) {
    clearTimeout(t);
    return null;
  }
}

function horaLocal(iso) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso));
  } catch (_) { return '--:--'; }
}

/* ── estado do ícone (§8.3) ───────────────────────────────────────── */

const ROTULO_ESTADO = {
  connected: 'Google Calendar',
  mock: 'Google Calendar — ambiente de demonstração',
  stale: 'Google Calendar — dados desatualizados',
  attention: 'Google Calendar — há conflitos na agenda',
  error: 'Google Calendar — conta precisa reconectar',
  upcoming: 'Google Calendar — reunião começando',
  not_connected: 'Google Calendar — nenhuma conta conectada',
};

function aplicarEstado(d) {
  if (!_btn || !d) return;
  _ultimo = d;

  _btn.setAttribute('data-gcal-estado', d.estado || 'connected');
  _btn.title = ROTULO_ESTADO[d.estado] || ROTULO_ESTADO.connected;

  // Badge só quando há algo ACIONÁVEL (§7.3: nunca o total de eventos).
  const n = (d.convites_pendentes || 0) + (d.conflitos || 0);
  let badge = _btn.querySelector('.gcal-badge');
  if (n > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'gcal-badge';
      _btn.appendChild(badge);
    }
    badge.textContent = n > 9 ? '9+' : String(n);
    badge.setAttribute('aria-label', n + ' item(ns) precisando de atenção na agenda');
  } else if (badge) {
    badge.remove();
  }
}

/* ── popover (§9) ─────────────────────────────────────────────────── */

function fechar() {
  if (_timerAbrir) { clearTimeout(_timerAbrir); _timerAbrir = null; }
  if (_pop) { _pop.remove(); _pop = null; }
  document.removeEventListener('keydown', aoTeclar, true);
}

function aoTeclar(e) {
  if (e.key === 'Escape') fechar();
}

function posicionar() {
  if (!_pop || !_btn) return;
  const r = _btn.getBoundingClientRect();
  const larg = _pop.offsetWidth || 300;
  // Prende dentro da viewport: o ícone fica perto da borda direita do header.
  let esquerda = r.left + r.width / 2 - larg / 2;
  esquerda = Math.max(10, Math.min(esquerda, window.innerWidth - larg - 10));
  _pop.style.left = esquerda + 'px';
  _pop.style.top = (r.bottom + 8) + 'px';
}

function corpoCarregando() {
  return '<div class="gcal-pop-skel"><i></i><i></i><i></i></div>';
}

function corpoLista(d, prox) {
  if (!d || d.estado === 'not_connected') {
    return '<p class="gcal-pop-vazio">Nenhuma conta Google conectada.</p>';
  }

  const linhas = (prox || []).map(function (e) {
    const titulo = e.redacted ? 'Ocupado' : e.summary;
    const meta = [];
    if (e.attendees_count) meta.push(e.attendees_count + ' participante(s)');
    if (e.my_response === 'needsAction') meta.push('sem resposta');
    return ''
      + '<li class="gcal-pop-item">'
      +   '<span class="gcal-pop-hora">' + esc(horaLocal(e.start)) + '</span>'
      +   '<span class="gcal-pop-corpo">'
      +     '<span class="gcal-pop-titulo">'
      +       '<i class="gcal-pop-ponto" style="background:' + esc(e.calendar_color || '#4285f4') + '"></i>'
      +       esc(titulo)
      +     '</span>'
      +     (meta.length ? '<span class="gcal-pop-meta">' + esc(meta.join(' · ')) + '</span>' : '')
      +   '</span>'
      +   (e.conference
            ? '<a class="gcal-pop-meet" href="' + esc(e.conference) + '" target="_blank" rel="noopener noreferrer" title="Entrar na reunião">Entrar</a>'
            : '')
      + '</li>';
  }).join('');

  const resumo = []
    .concat(d.hoje ? [d.hoje + ' compromisso(s) hoje'] : ['sem compromissos hoje'])
    .concat(d.convites_pendentes ? [d.convites_pendentes + ' convite(s) pendente(s)'] : [])
    .concat(d.conflitos ? [d.conflitos + ' conflito(s)'] : [])
    .join(' · ');

  return ''
    + (d.mock ? '<p class="gcal-pop-mock">Ambiente de demonstração</p>' : '')
    + '<p class="gcal-pop-resumo">' + esc(resumo) + '</p>'
    + (linhas
        ? '<ul class="gcal-pop-lista">' + linhas + '</ul>'
        : '<p class="gcal-pop-vazio">Nada à frente nas próximas 48 h.</p>')
    + '<div class="gcal-pop-acoes">'
    +   '<button type="button" class="gcal-pop-btn is-primario" data-gcal-acao="abrir">Abrir agenda</button>'
    +   '<button type="button" class="gcal-pop-btn" data-gcal-acao="novo">Novo evento</button>'
    + '</div>';
}

async function abrir() {
  if (_pop || !_btn) return;

  _pop = document.createElement('div');
  _pop.className = 'gcal-pop';
  _pop.setAttribute('role', 'dialog');
  _pop.setAttribute('aria-label', 'Próximos compromissos');
  _pop.innerHTML = corpoCarregando();
  document.body.appendChild(_pop);
  posicionar();

  _pop.addEventListener('mouseleave', agendarFechar);
  _pop.addEventListener('mouseenter', cancelarFechar);
  _pop.addEventListener('click', function (ev) {
    const alvo = ev.target.closest('[data-gcal-acao]');
    if (!alvo) return;
    const acao = alvo.getAttribute('data-gcal-acao');
    fechar();
    window.location.hash = acao === 'novo'
      ? '#/panel-google-calendar/agenda'
      : '#/panel-google-calendar/hoje';
  });
  document.addEventListener('keydown', aoTeclar, true);

  const [resumo, prox] = await Promise.all([
    _ultimo ? Promise.resolve(_ultimo) : pegar('/header/summary'),
    pegar('/header/next'),
  ]);
  if (!_pop) return;                       // fechou enquanto carregava
  if (resumo) aplicarEstado(resumo);
  _pop.innerHTML = corpoLista(resumo, prox && prox.proximos);
  posicionar();
}

let _timerFechar = null;
function agendarFechar() {
  cancelarFechar();
  _timerFechar = setTimeout(fechar, 260);
}
function cancelarFechar() {
  if (_timerFechar) { clearTimeout(_timerFechar); _timerFechar = null; }
}

/* ── ciclo de vida ────────────────────────────────────────────────── */

async function atualizar() {
  if (_carregando || document.hidden) return;   // aba oculta não consulta
  _carregando = true;
  try {
    const d = await pegar('/header/summary');
    if (d) aplicarEstado(d);
  } finally {
    _carregando = false;
  }
}

function ligar(btn) {
  if (!btn || btn.__gcalLigado) return;
  btn.__gcalLigado = true;
  _btn = btn;

  btn.addEventListener('mouseenter', function () {
    cancelarFechar();
    _timerAbrir = setTimeout(abrir, ATRASO_ABRIR);
  });
  btn.addEventListener('mouseleave', function () {
    if (_timerAbrir) { clearTimeout(_timerAbrir); _timerAbrir = null; }
    agendarFechar();
  });
  // Teclado: foco abre, para quem não usa mouse (§80).
  btn.addEventListener('focus', abrir);
  btn.addEventListener('blur', agendarFechar);

  window.addEventListener('resize', posicionar, { passive: true });
  window.addEventListener('scroll', posicionar, { passive: true, capture: true });

  void atualizar();
  if (_timerPoll) clearInterval(_timerPoll);
  _timerPoll = setInterval(atualizar, INTERVALO);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) void atualizar();
  });
}

/**
 * O header monta depois do boot, então esperamos o botão aparecer.
 *
 * O observer PARA assim que acha (`disconnect`): observer de `subtree` no body
 * que vive para sempre satura no boot — é lição registrada neste projeto.
 * Também há um teto de tempo, para não ficar observando numa página que
 * simplesmente não tem o header (ex.: tela de login).
 */
function iniciar() {
  const existente = document.querySelector(SELETOR);
  if (existente) { ligar(existente); return; }

  const obs = new MutationObserver(function () {
    const b = document.querySelector(SELETOR);
    if (b) { obs.disconnect(); clearTimeout(limite); ligar(b); }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  const limite = setTimeout(function () { obs.disconnect(); }, 30000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}

export { iniciar, atualizar };
