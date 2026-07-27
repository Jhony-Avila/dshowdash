'use strict';
// panel-datatables/index.js — carregador do painel React.
// @module  panels/panel-datatables
// @version 3.2.0
// @created 2026-07-20
//
// O legado vanilla foi REMOVIDO após o aceite do piloto pelo dono. Este
// adaptador SEMPRE monta a interface React — sem gate de implementação nem
// fallback (decisão do dono: 100% React).
//
// A flag `panel_datatables_react_enabled` permanece apenas como FONTE DO
// PAYLOAD (react_routes) consumido pelo App; não decide mais qual painel sobe.
// Se a flag estiver indisponível, assumimos "tudo migrado" (['*']).
//
// v3.1.0 — CAMINHO DE RENDERIZAÇÃO ESTÁVEL (fix do "header perde estilo após o
// 1º clique"): o app-shell chama unmount()+mount() a cada navegação interna. A
// versão anterior REMOVIA a folha de CSS do módulo no unmount e a recolocava no
// mount (re-injeção via JS). Agora a folha é injetada UMA VEZ e NUNCA removida —
// ela é escopada ao root do módulo (`[data-dt-react-root]` + tokens `--dt-*`),
// então quando o painel fecha as regras não se aplicam a nada (inerte). Assim o
// header nunca perde o estilo e não há churn de remoção/re-injeção.
//
// v3.2.0 — RESILIÊNCIA DE CHUNK (2a): o fetch do manifest agora usa
// `cache: 'no-store'`. O manifest mapeia o entry hasheado do build ATUAL; se o
// browser servir um manifest cacheado (velho), o adaptador carrega um entry que
// referencia chunks já apagados pelo build seguinte (emptyOutDir) → "Unable to
// preload CSS". Forçar a leitura fresca do manifest a cada mount fecha essa
// janela pelo lado cliente (único consumidor do manifest). A recuperação em
// runtime (reload guardado + retry de rota) vive no bundle React.
//
// Continua vanilla de propósito: é ele que o PanelPort importa e precisa
// funcionar mesmo antes de o bundle React carregar.

const MODULE_ID = 'panels/panel-datatables';
const VERSION   = '3.2.0';
const FLAG_KEY  = 'panel_datatables_react_enabled';

// Estado de módulo (instância única, igual ao contrato dos demais painéis).
let _reactMod    = null;
let _folhasReact = [];   // folhas de CSS do bundle (injetadas uma vez, persistem)
let _mounted     = false;

// ═══════════════════════════════════════════════════════════════
// FLAG — apenas o payload (react_routes). Não é mais um gate.
// ═══════════════════════════════════════════════════════════════

async function resolverPayload() {
  const padrao = { react_routes: ['*'] };   // sem servidor: considera tudo migrado

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);   // a flag não pode travar o boot

    const res = await fetch(
      `/api/feature-flags/?action=check&flag=${encodeURIComponent(FLAG_KEY)}`,
      { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!res.ok) return padrao;

    const body = await res.json();
    const flag = body && body.data && body.data.flag;
    return (flag && flag.payload && typeof flag.payload === 'object') ? flag.payload : padrao;
  } catch (_) {
    return padrao;   // inclusive AbortError
  }
}

// ═══════════════════════════════════════════════════════════════
// CSS + CARGA DO BUNDLE
// ═══════════════════════════════════════════════════════════════

const CSS_ATTR = 'data-dt-react-css';

/**
 * Injeta uma folha do bundle, UMA vez (idempotente: checa o href). A folha é
 * escopada ao root do módulo — nunca a removemos: quando o painel fecha, o root
 * some e as regras ficam inertes. NÃO remover é o que mantém o header estável
 * na re-montagem que o app-shell dispara a cada navegação interna.
 */
function injetarCss(href) {
  if (document.querySelector(`link[${CSS_ATTR}][href="${href}"]`)) return;
  const l = document.createElement('link');
  l.setAttribute(CSS_ATTR, '');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}

/**
 * Coleta o CSS do entry E de todos os chunks que ele importa, recursivamente.
 * O Vite move o CSS compartilhado para o registro do CHUNK, não do entry — ler
 * só `manifest[entry].css` devolve vazio e a interface sobe sem estilo.
 */
function coletarCss(manifesto, chaveEntry, base) {
  const folhas = [];
  const vistos = new Set();

  const visitar = (chave) => {
    if (!chave || vistos.has(chave)) return;
    vistos.add(chave);
    const reg = manifesto[chave];
    if (!reg) return;
    (reg.css || []).forEach((c) => {
      const href = base + c;
      if (!folhas.includes(href)) folhas.push(href);
    });
    (reg.imports || []).forEach(visitar);
  };

  visitar(chaveEntry);
  return folhas;
}

async function carregarReact() {
  if (_reactMod) return _reactMod;

  const base = '/components/panels/panel-datatables/dist/';
  let entrada = null;

  try {
    // `cache: 'no-store'` (v3.2.0): o manifest é a fonte da verdade sobre qual
    // entry hasheado é o do build ATUAL. Servir um manifest cacheado velho faz
    // o adaptador carregar um entry que aponta para chunks já apagados
    // (emptyOutDir) → "Unable to preload CSS". Ler sempre fresco fecha a janela.
    const res = await fetch(base + '.vite/manifest.json', {
      credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const mf = await res.json();
      const chave = Object.keys(mf).find((k) => k.endsWith('src/entry.tsx'))
                 || Object.keys(mf).find((k) => k.endsWith('entry.tsx'));
      const reg = chave ? mf[chave] : null;
      if (reg && reg.file) {
        entrada = base + reg.file;
        _folhasReact = coletarCss(mf, chave, base);
      }
    }
  } catch (_) { /* trata abaixo */ }

  if (!entrada) {
    throw new Error('Bundle React não encontrado (manifest ausente ou inválido)');
  }

  _reactMod = await import(/* @vite-ignore */ entrada);
  return _reactMod;
}

/** Garante o CSS do módulo na página (idempotente). Injetado uma vez; persiste. */
function garantirCssReact() {
  _folhasReact.forEach(injetarCss);
}

/** Mensagem mínima quando o bundle não carrega — não há mais legado para cair. */
function renderErro(contentEl, err) {
  console.error('[datatables] falha ao carregar o React:', err);
  if (!contentEl) return;
  contentEl.innerHTML =
    '<div style="padding:32px;max-width:520px;margin:40px auto;text-align:center;'
    + 'border:1px solid var(--dt-border,#333);border-radius:12px;'
    + 'background:var(--dt-bg-surface,#1a1a2e);color:var(--dt-text-primary,#e8e8f0)">'
    + '<strong style="display:block;font-size:15px;margin-bottom:8px">Não foi possível carregar o DataTables</strong>'
    + '<span style="font-size:13px;opacity:.8">Recarregue a página. Se persistir, avise a equipe de dev.</span>'
    + '</div>';
}

// ═══════════════════════════════════════════════════════════════
// CICLO DE VIDA (contrato do PanelLifecycleController)
// ═══════════════════════════════════════════════════════════════

export async function mount(contentEl, config = {}) {
  if (_mounted) await unmount();

  const payload = await resolverPayload();

  // Navegação cancelada enquanto a flag resolvia.
  if (config.signal && config.signal.aborted) return;

  try {
    const mod = await carregarReact();
    garantirCssReact();   // injeta a folha do módulo uma vez; nas remontagens é no-op
    await mod.mountReact(contentEl, {
      ...config,
      flag: { key: FLAG_KEY, enabled: true, payload, source: 'ga' },
    });
    _mounted = true;
    return { MODULE_ID, VERSION, impl: 'react' };
  } catch (err) {
    // Sem legado para cair: mostra um aviso claro em vez de tela em branco.
    renderErro(contentEl, err);
    _mounted = false;
    return { MODULE_ID, VERSION, impl: 'error' };
  }
}

export async function unmount() {
  // NÃO removemos a folha de CSS aqui: ela é escopada ao root do módulo e fica
  // inerte quando o painel fecha. Removê-la quebrava o header na re-montagem que
  // o app-shell dispara a cada navegação interna (v3.1.0).
  try {
    if (_reactMod) {
      await _reactMod.unmountReact();
    }
  } catch (err) {
    console.error('[datatables] erro no unmount:', err);
  } finally {
    _mounted = false;
  }
  return Promise.resolve();
}

export function healthCheck() {
  const base = {
    status: _mounted ? 'HEALTHY' : 'IDLE',
    score: _mounted ? 100 : 0,
    maxScore: 100,
    details: { mounted: _mounted, impl: 'react', version: VERSION },
  };
  if (_mounted && _reactMod && _reactMod.reactInfo) {
    base.details.react = _reactMod.reactInfo();
  }
  return base;
}

export function info() {
  return { MODULE_ID, VERSION, impl: 'react', flagKey: FLAG_KEY };
}

const _panel = { mount, unmount, destroy: unmount, dispose: unmount, healthCheck, info, VERSION, MODULE_ID };

export { MODULE_ID, VERSION };
export const destroy = unmount;
export const dispose = unmount;
export default _panel;
