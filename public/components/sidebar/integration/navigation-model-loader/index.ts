// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: navigation-model-loader/index.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID, VERSION from ./core/constants.js
//   STATES from ./core/contracts.js
//   loadFromAPI from ./api/loader.js
//   getFallbackModel, isFallbackModel from ./api/fallback.js
//   track, trackLoad from ./telemetry/tracker.js
//   isValidModel, normalizeModel from ./utils/helpers.js
//
// PROVIDES:
//   load — exported value
//   reload — exported value
//   abort() — exported function
//   getModel() — exported function
//   getStatus() — exported function
//   isReady() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════

'use strict';

import { MODULE_ID, VERSION } from './core/constants.js';
import { STATES } from './core/contracts.js';
import * as State from './core/state.js';
import * as Cache from './cache/cache-manager.js';
import { loadFromAPI } from './api/loader.js';
import { getFallbackModel, isFallbackModel } from './api/fallback.js';
import { track, trackLoad } from './telemetry/tracker.js';
import * as Events from './events/bindings.js';
import { isValidModel, normalizeModel } from './utils/helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


let abortController: AbortController | null = null;

// INTEGRADO-01 · item 8 (ROXO 27/11): IDENTIDADE CONSUMIDA. O consumidor registra a revisão/geração/checksum (meta.menu) do modelo que
// efetivamente aplicou, expõe no DOM (html[data-menu-revision|generation|checksum|source]) e REJEITA uma resposta de geração MENOR que a
// consumida (resposta antiga liberada depois da nova). Um pedido SUPERADO por outro mais novo é descartado sem tocar no estado.
let seqPedido = 0;
// dono do cache = o usuário da porta auth (id); desconhecido = o cache não é usado nem gravado. Logout/login limpam (assinatura feita uma vez).
const donoAtual = (): string | null => { try { const a = (Events.getPorts() as DynObj)?.auth; const u = a?.getUser?.() ?? a?.getCurrentUser?.() ?? null; const id = u?.id ?? u?.user_id ?? u?.userId ?? null; return id !== null && id !== undefined && String(id) !== '' ? String(id) : null; } catch (_e) { return null; } };
let assinouAuth = false;
// CACHE-MENU-P1 (decisão do arquiteto 27/11 22:27): no logout/login limpa o cache do menu E as respostas de /api/ que o service worker guardou no
// Cache Storage (o sw.js grava GET /api/ sem usuário e as serve offline). Pela API caches da PÁGINA, sem editar o sw.js.
const limparRespostasApiDoSW = async () => {
    try {
        const cs = (globalThis as DynObj).caches; if (!cs || !cs.keys) return 0; let n = 0;
        for (const nome of await cs.keys()) { const c = await cs.open(nome); for (const req of await c.keys()) { try { if (new URL(req.url).pathname.startsWith('/api/')) { await c.delete(req); n++; } } catch (_e) { /* url inválida */ } } }
        track('cache:sw-api-clear', { n }); return n;
    } catch (_e) { return 0; }
};
// v3 (item 16, P1 da revisão da VERDE): a limpeza da sessão INVALIDA o pedido em andamento (seqPedido++ e abort) e zera o estado (nada fica
// preso em 'loading'); uma resposta que chegue depois é descartada — e, além disso, load/revalidar só aplicam se o DONO atual for o do início.
const limparSessao = () => {
    seqPedido++; try { if (abortController) abortController.abort(); } catch (_e) { /* já abortado */ } abortController = null;
    Cache.invalidateAll(); limparRespostasApiDoSW(); State.resetState(); publicarIdentidade(null, 'sessao-encerrada'); track('cache:auth-clear');
};
// todas as grafias de logout/login que o shell emite (o catálogo tem 'auth.logout.success'; a orquestração usa 'auth:logout')
const EVENTOS_SESSAO = ['auth.logout', 'auth.logout.success', 'auth.logout.completed', 'auth.logout.detected', 'auth:logout', 'header.logout.requested', 'auth.login.success'];
const assinarAuth = () => { if (assinouAuth) return; try { if (!(Events.getPorts() as DynObj)?.eventBus?.on) return; for (const ev of EVENTOS_SESSAO) Events.on(ev, limparSessao); assinouAuth = true; } catch (_e) { /* barramento ainda não pronto: tenta na próxima carga */ } };
type Identidade = { revision: string; generation: number; checksum: string };
const lerIdentidade = (meta: DynObj): Identidade | null => {
    const m = meta && typeof meta === 'object' ? (meta.menu ?? null) : null;
    if (!m || m.generation === undefined || m.generation === null) return null;
    const g = Number(m.generation); if (!Number.isFinite(g)) return null;
    return { revision: String(m.revision ?? ''), generation: g, checksum: String(m.checksum ?? '') };
};
const identidadeDoModelo = (model: DynObj): Identidade | null => (model && model.metadata && model.metadata.menuConsumido) || null;
const publicarIdentidade = (id: Identidade | null, source: string) => {
    try {
        const g = globalThis as DynObj; g.__dshowMenuConsumido = id ? { ...id, source, at: Date.now() } : { revision: null, generation: null, checksum: null, source, at: Date.now() };
        const el = typeof document !== 'undefined' ? document.documentElement : null; if (!el) return;
        if (id) { el.setAttribute('data-menu-revision', id.revision); el.setAttribute('data-menu-generation', String(id.generation)); el.setAttribute('data-menu-checksum', id.checksum); }
        else { el.removeAttribute('data-menu-revision'); el.removeAttribute('data-menu-generation'); el.removeAttribute('data-menu-checksum'); }
        el.setAttribute('data-menu-source', source);
    } catch (_e) { /* sem DOM: só o global */ }
};

const load = async (options: { force?: boolean; skipCache?: boolean } = {}) => {
    const { force = false, skipCache = false } = options;
    const startTime = Date.now();

    if (State.isLoading()) {
        track('load:already-loading');
        return { success: false, reason: 'already-loading' };
    }

    if (!force && State.isLoaded()) {
        const model = State.getModel();
        if (model && !isFallbackModel(model)) {
            track('load:already-loaded');
            return { success: true, model, source: 'memory' };
        }
    }

    State.setStatus(STATES.LOADING);
    Events.emitLoadStart();
    assinarAuth(); const dono = donoAtual();

    // 1. Tentar cache (se não skipCache)
    if (!skipCache && !force) {
        const cached = Cache.getCached(dono);
        if (cached && isValidModel(cached.data)) {
            const model = normalizeModel(cached.data);
            if (model && cached.data && cached.data.metadata && cached.data.metadata.menuConsumido) model.metadata = { ...(model.metadata || {}), menuConsumido: cached.data.metadata.menuConsumido };
            State.setModel(model, cached.source);
            publicarIdentidade(identidadeDoModelo(model), String(cached.source || 'cache'));
            State.setStatus(STATES.LOADED);
            Events.emitCacheHit(cached.source);
            Events.emitLoadSuccess(model, cached.source);
            Events.emitModelReady(model);
            trackLoad(cached.source, Date.now() - startTime);
            revalidar(dono);   // stale-while-revalidate (item 10): o cache serve já; a API confere a geração em segundo plano
            return { success: true, model, source: cached.source };
        }
        Events.emitCacheMiss();
    }

    // 2. Tentar API
    const meuPedido = ++seqPedido;
    abortController = new AbortController();
    const apiResult = await loadFromAPI({ signal: abortController.signal });
    if (meuPedido !== seqPedido) { track('load:superseded', { meuPedido, atual: seqPedido }); return { success: false, reason: 'superseded' }; }   // pedido superado: não toca no estado
    if (donoAtual() !== dono) { State.resetState(); track('load:owner-changed', { inicio: dono }); return { success: false, reason: 'owner-changed' }; }   // v3: o dono mudou durante o pedido: descarta
    abortController = null;

    if (apiResult.success && isValidModel(apiResult.data)) {
        const nova = lerIdentidade((apiResult as DynObj).meta);
        const atualModel = State.getModel(); const vigente = identidadeDoModelo(atualModel);
        if (nova && vigente && nova.generation < vigente.generation && atualModel && !isFallbackModel(atualModel)) {
            // resposta ANTIGA (geração menor que a consumida): rejeitada; o estado confirmado fica
            State.setStatus(STATES.LOADED); track('load:stale-rejected', { recebida: nova.generation, consumida: vigente.generation });
            publicarIdentidade(vigente, 'api-stale-rejected');
            return { success: true, model: atualModel, source: 'memory', staleRejected: true, rejected: nova };
        }
        const model = normalizeModel(apiResult.data);
        if (model) model.metadata = { ...(model.metadata || {}), menuConsumido: nova, dono };
        State.setModel(model, 'api');
        publicarIdentidade(nova, 'api');
        State.setStatus(STATES.LOADED);
        Cache.saveToCache(model, dono);
        Events.emitLoadSuccess(model, 'api');
        Events.emitModelReady(model);
        trackLoad('api', Date.now() - startTime);
        return { success: true, model, source: 'api' };
    }

    // 3. Auth required - não usar fallback, apenas sinalizar
    if (apiResult.authRequired) {
        State.setStatus(STATES.ERROR);
        State.setError({ message: 'Auth required' } as DynObj);
        Events.emitLoadError({ type: 'auth', status: apiResult.status } as DynObj);
        track('load:auth-required');
        return { success: false, authRequired: true, status: apiResult.status };
    }

    // 4. Fallback
    track('load:using-fallback', { reason: apiResult.error });
    const fallback = getFallbackModel(apiResult.error || 'api-error');
    State.setModel(fallback, 'fallback');
    State.setStatus(STATES.FALLBACK);
    // @ts-expect-error strict migration — TS2345
    Events.emitLoadFallback(apiResult.error);
    Events.emitModelReady(fallback);
    trackLoad('fallback', Date.now() - startTime, false);

    return { success: true, model: fallback, source: 'fallback', degraded: true };
};

// BFCache / voltar pelo histórico (item 10): a página restaurada do cache do navegador traz a Sidebar antiga no DOM. Se o usuário atual é
// desconhecido (logout) ou outro que o dono do modelo aplicado, o cache é limpo e o modelo é relido (sem dono = a API responde 401 e nada fica).
// conferência de DONO sem depender do barramento: o usuário atual ≠ o dono do modelo aplicado (ou desconhecido) = limpa e relê
const conferirDono = (motivo: string) => {
    const m = State.getModel() as DynObj; if (!m) return;
    const d = donoAtual(); const donoModelo = m && m.metadata ? m.metadata.dono ?? null : null;
    if (!d || d !== donoModelo) { limparSessao(); track('cache:owner-check-clear', { motivo, trocou: !!d }); reload(true); }
};
const aoRestaurarDoHistorico = (e: DynObj) => { if (e && e.persisted) conferirDono('bfcache'); };
const aoFicarVisivel = () => { try { if (typeof document !== 'undefined' && (document as DynObj).visibilityState === 'visible') conferirDono('visivel'); } catch (_e) { /* sem document */ } };
try {
    if (typeof window !== 'undefined' && (window as DynObj).addEventListener) (window as DynObj).addEventListener('pageshow', aoRestaurarDoHistorico);
    if (typeof document !== 'undefined' && (document as DynObj).addEventListener) (document as DynObj).addEventListener('visibilitychange', aoFicarVisivel);
    // LOGOUT sem depender do barramento (na 8112 o 'auth.logout.success' do session-manager não chega a este módulo): o clique no "Sair"
    // (header/footer/menu do usuário: [data-action="logout"]) limpa o cache do menu e o /api/ do SW na hora, na fase de CAPTURA.
    if (typeof document !== 'undefined' && (document as DynObj).addEventListener) (document as DynObj).addEventListener('click', (e: DynObj) => {
        try { const t = e && e.target; if (t && t.closest && t.closest('[data-action="logout"], [data-intent$=".logout"], .logout[data-action]')) { limparSessao(); track('cache:logout-click-clear'); } } catch (_e) { /* nada */ }
    }, true);
} catch (_e) { /* sem window */ }

// STALE-WHILE-REVALIDATE (item 10, P1 do QI do AZUL): depois de um cache-hit, pede a API em segundo plano; se a geração da API for MAIOR que a do
// modelo em uso (ou o modelo em cache não tiver identidade), troca o modelo, regrava o cache do dono e avisa (emitModelReady). Menor/igual = nada muda.
const revalidar = async (dono: string | null) => {
    const meu = ++seqPedido;
    let r: DynObj; try { r = await loadFromAPI({}); } catch (_e) { return; }
    if (meu !== seqPedido) return;   // outra carga mais nova assumiu (ou a sessão foi limpa)
    if (donoAtual() !== dono) { track('revalidate:owner-changed', { inicio: dono }); return; }   // v3: resposta de OUTRO dono nunca se aplica
    // REVOGAÇÃO (P1 do QI do AZUL): 401/403 na revalidação = a sessão/permissão acabou → limpa o cache e retira o modelo (nada protegido fica)
    if (r && r.authRequired) { Cache.invalidateAll(); State.resetState(); publicarIdentidade(null, 'auth-required'); Events.emitLoadError({ type: 'auth', status: r.status } as DynObj); track('revalidate:auth-cleared', { status: r.status }); return; }
    if (!r || !r.success || !isValidModel(r.data)) return;
    // a mesma geração é ACEITA (revogar uma capacidade não muda a geração: o filtro é por usuário); só a MENOR é rejeitada
    const nova = lerIdentidade(r.meta); const atual = State.getModel(); const vig = identidadeDoModelo(atual);
    if (vig && nova && nova.generation < vig.generation) { track('revalidate:older-rejected', { nova: nova.generation, vigente: vig.generation }); return; }
    const model = normalizeModel(r.data); if (!model) return;
    model.metadata = { ...(model.metadata || {}), menuConsumido: nova, dono };
    State.setModel(model, 'api'); State.setStatus(STATES.LOADED); Cache.saveToCache(model, dono); publicarIdentidade(nova, 'api-revalidate');
    Events.emitLoadSuccess(model, 'api'); Events.emitModelReady(model); track('revalidate:updated', { de: vig && vig.generation, para: nova && nova.generation });
};

const reload = async (force?: boolean) => {
    Cache.invalidateAll();
    Events.emitCacheInvalidate();
    State.resetState();
    return load({ force: true, skipCache: true });
};

const abort = () => {
    if (abortController) {
        abortController.abort();
        abortController = null;
        track('load:aborted');
    }
};

const getModel = () => State.getModel();

const getStatus = () => State.getStatus();

const isReady = () => State.isLoaded();

const info = () => ({
    moduleId: MODULE_ID,
    version: VERSION,
    state: State.getState(),
    hasModel: !!State.getModel(),
    isFallback: isFallbackModel(State.getModel())
});

const healthCheck = () => {
    const state = State.getState();
    return {
        healthy: state.status === STATES.LOADED && !!state.model,
        status: state.status,
        lastLoad: state.lastLoad,
        source: state.source,
        isFallback: isFallbackModel(state.model)
    };
};

// API pública
export {
    load,
    reload,
    abort,
    getModel,
    getStatus,
    isReady,
    info,
    healthCheck,
    MODULE_ID,
    VERSION
};

// Default export para compatibilidade
export default {
    load,
    reload,
    abort,
    getModel,
    getStatus,
    isReady,
    info,
    healthCheck,
    MODULE_ID,
    VERSION
};
