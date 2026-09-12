/**
 * profile-redirect — shim ADITIVO: `#/profile` → módulo de avatares (`/panel-avatar-studio`).
 * @module  components/router/profile-redirect
 * @version 1.0.0  — FONTE (TS). Irmão index.js é o shipado (transpile 1:1 via
 *          scripts/shell/build-profile-redirect.sh — nunca editar o .js à mão).
 * @created 2026-09-12 (decisões #89/#90: M1b — GO; M3 rebuild do bundle — NO-GO)
 *
 * POR QUE UM MÓDULO STANDALONE: a tabela de rotas vive inlinada em bundles congelados
 * (`components/main/dist/main.bundle.js`, `app/router/dist/app-router.bundle.js`); o roteamento é
 * por hash (o fragmento nunca chega ao servidor) e o banco não decide o painel montado.
 * Mesmo padrão de `app/router/initial-route.js`, `gcal-header-popover`, header v2 e layout v2:
 * usa só a API pública `RouterGlobal.navigate`, não toca em bundle, rollback = remover a linha do
 * `index.html`.
 *
 * FAIL-CLOSED: a flag `as6.profile_redirect` é resolvida por override local de dev
 * (`localStorage['dshow.avst.flags.v1']`, a mesma chave dos outros módulos) → `GET
 * /api/feature-flags?action=resolve&flag=as6.profile_redirect` (credentials include, timeout 1,5 s).
 * Qualquer erro/timeout/JSON inválido/flag ausente = OFF = **no-op absoluto**: `#/profile` segue
 * montando o que monta hoje (`panel-user-preferences`), nenhum listener age, nenhum atributo é
 * escrito.
 *
 * COMO EVITA O FLASH (ON):
 *   - boot frio em `#/profile`: assim que a flag resolve ON, o hash é reescrito SEM evento
 *     (`history.replaceState`) para `#/panel-avatar-studio`. O `initial-route.js` só honra a rota
 *     inicial se o hash ainda for o que ele leu no boot — como mudou, ele não navega para
 *     `/profile`. Este módulo então espera roteador pronto + shell no home (mesmo critério do
 *     initial-route) e navega para `/panel-avatar-studio`: as preferências nunca montam.
 *   - navegação pós-boot para `#/profile`: listener de `hashchange` em CAPTURA (registrado antes
 *     dos listeners do shell, que só nascem no boot) interrompe a propagação do evento (o shell
 *     nunca vê `#/profile`) e troca o hash por `#/panel-avatar-studio` com `location.replace` —
 *     isso dispara um NOVO `hashchange` (profile → avatar) que o shell trata pelo caminho normal de
 *     mudança de rota (o mesmo de um link/favorito), sem histórico extra.
 *   - anti-loop: só reage quando o destino é `/profile`; depois de redirecionar não reprocessa a
 *     mesma navegação; `/panel-avatar-studio` nunca é alvo de reescrita.
 */
'use strict';

export const VERSION = '1.0.0';
export const MODULE_ID = 'router/profile-redirect';
export const FLAG = 'as6.profile_redirect';
export const ROTA_ORIGEM = '/profile';
export const ROTA_ALVO = '/panel-avatar-studio';

const LOCAL_KEY = 'dshow.avst.flags.v1';
const RESOLVE_URL = `/api/feature-flags?action=resolve&flag=${encodeURIComponent(FLAG)}`;
const RESOLVE_TIMEOUT_MS = 1500;
const LIMITE_BOOT_MS = 12000;   // mesmo teto do initial-route: desiste em silêncio
const INTERVALO_MS = 150;
const RAIZ_DO_HOME = '#main .dsd-container__content [data-geral-react-root]';

type Roteador = { navigate: (rota: string, opts?: Record<string, unknown>) => unknown };

const state = {
  resolved: null as boolean | null,
  source: 'none' as 'local' | 'remote' | 'default' | 'none',
  redirects: 0,
  lastAt: 0,
  navegando: false,
};

// ───────────────────────── util ─────────────────────────
function log(nivel: 'debug' | 'info' | 'warn' | 'error', msg: string) {
  try {
    const w = window as unknown as { LoggerGlobal?: Record<string, (m: string) => void>; logger?: Record<string, (m: string) => void> };
    const l = w.LoggerGlobal || w.logger;
    if (l && typeof l[nivel] === 'function') { l[nivel](`[${MODULE_ID}] ${msg}`); return; }
  } catch { /* logger é opcional */ }
  if (nivel === 'error' || nivel === 'warn') console[nivel](`[${MODULE_ID}] ${msg}`);
}
function roteador(): Roteador | null {
  const w = window as unknown as { RouterGlobal?: Roteador; Router?: Roteador };
  const rg = w.RouterGlobal || w.Router;
  return (rg && typeof rg.navigate === 'function') ? rg : null;
}
/** `#/profile`, `#/profile/`, `#/profile?x=1`, `#/profile/qualquer` → true; `#/profile-x` → false. */
export function ehRotaOrigem(hash: string): boolean {
  const h = (hash || '').replace(/^#/, '');
  if (!h.startsWith('/')) return false;
  const semQuery = h.split('?')[0].split('&')[0];
  return semQuery === ROTA_ORIGEM || semQuery.startsWith(ROTA_ORIGEM + '/');
}

// ───────────────────────── flag (fail-closed) ─────────────────────────
function overrideLocal(): boolean | null {
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}') as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(local, FLAG)) return !!local[FLAG];
  } catch { /* storage inválido = sem override */ }
  return null;
}
export async function resolve(): Promise<boolean> {
  const local = overrideLocal();
  if (local !== null) { state.source = 'local'; state.resolved = local; return local; }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), RESOLVE_TIMEOUT_MS);
  try {
    const r = await fetch(RESOLVE_URL, { credentials: 'include', cache: 'no-store', signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) { state.source = 'default'; state.resolved = false; return false; }
    const corpo = await r.json() as { data?: { flag?: { enabled?: unknown } }; flag?: { enabled?: unknown } };
    const f = corpo?.data?.flag ?? corpo?.flag;
    const ligada = !!(f && f.enabled === true);
    state.source = 'remote'; state.resolved = ligada;
    return ligada;
  } catch {
    state.source = 'default'; state.resolved = false;
    return false; // rede/timeout/JSON inválido/flag ausente → OFF (fail-closed)
  } finally { clearTimeout(t); }
}

// ───────────────────────── redirecionamento ─────────────────────────
function reescreverHashSemEvento() {
  try { history.replaceState(history.state, '', `#${ROTA_ALVO}`); } catch { location.replace(`#${ROTA_ALVO}`); }
}
async function navegarQuandoPronto() {
  if (state.navegando) return;
  state.navegando = true;
  const prazo = Date.now() + LIMITE_BOOT_MS;
  try {
    while (Date.now() < prazo) {
      if (location.hash !== `#${ROTA_ALVO}`) { log('debug', 'hash mudou durante a espera; nada a fazer'); return; }
      const rg = roteador();
      // o mesmo critério do initial-route: roteador pronto E shell já montou algo (home) — antes disso
      // navegar é ignorado pelo shell
      if (rg && document.querySelector(RAIZ_DO_HOME)) {
        try {
          void rg.navigate(ROTA_ALVO, { replace: true, source: MODULE_ID });
          state.redirects++; state.lastAt = Date.now();
          document.documentElement.setAttribute('data-profile-redirect', ROTA_ALVO);
          log('info', `${ROTA_ORIGEM} → ${ROTA_ALVO} (boot)`);
        } catch (e) { log('warn', `navigate() falhou: ${(e as Error)?.message}`); }
        return;
      }
      await new Promise((r) => setTimeout(r, INTERVALO_MS));
    }
    log('warn', `desisti de redirecionar: roteador/shell não ficaram prontos em ${LIMITE_BOOT_MS}ms`);
  } finally { state.navegando = false; }
}
function aoMudarHash(e: HashChangeEvent) {
  if (state.resolved !== true) return;                 // OFF/indefinido = no-op absoluto
  if (!ehRotaOrigem(location.hash)) return;            // só `/profile`
  // o shell nunca vê `#/profile`: interrompe este evento e troca o hash (novo hashchange → o shell
  // monta o Avatar Studio pelo caminho normal de mudança de rota; `replace` não empilha histórico)
  if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  state.redirects++; state.lastAt = Date.now();
  document.documentElement.setAttribute('data-profile-redirect', ROTA_ALVO);
  log('info', `${ROTA_ORIGEM} → ${ROTA_ALVO} (hashchange)`);
  location.replace(`#${ROTA_ALVO}`);
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, flag: FLAG, resolved: state.resolved, source: state.source, redirects: state.redirects, lastAt: state.lastAt, from: ROTA_ORIGEM, to: ROTA_ALVO };
}

async function boot() {
  const w = window as unknown as { __profileRedirect?: unknown };
  if (w.__profileRedirect) return; // idempotente (script duplicado / HMR)
  w.__profileRedirect = { VERSION, MODULE_ID, FLAG, info, resolve, ehRotaOrigem };
  // registra ANTES de resolver a flag (o handler é no-op enquanto a flag não estiver ON)
  window.addEventListener('hashchange', aoMudarHash, { capture: true });
  const hashInicial = location.hash;
  const ligada = await resolve();
  if (!ligada) return; // OFF = zero efeito
  if (ehRotaOrigem(hashInicial) && ehRotaOrigem(location.hash)) {
    reescreverHashSemEvento();            // o initial-route deixa de honrar `/profile`
    void navegarQuandoPronto();           // e este módulo leva ao Avatar Studio, sem montar as preferências
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') void boot();

export default { VERSION, MODULE_ID, FLAG, info, resolve, ehRotaOrigem };
