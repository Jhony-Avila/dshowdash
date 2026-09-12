import { LOTTIES_BASE_PATH } from "./lifecycle.js";
const VERSION = "10.0.0";
const MODULE_ID = "panel-lotties-management/core/catalogo";
const MODULO_CANONICO = "/assets/animacoes/index.js";
let _mod = null;
async function carregarModulo() {
  if (_mod) return _mod;
  const m = await import(
    /* @vite-ignore */
    MODULO_CANONICO
  );
  _mod = m && typeof m.info === "function" ? m : m && m.default && typeof m.default.info === "function" ? m.default : m;
  return _mod;
}
async function carregarCatalogo(opcoes = {}) {
  const mod = await carregarModulo();
  const info = typeof mod.info === "function" ? mod.info() : {};
  const lista = info && info.availableAnimations || {};
  const itens = Object.keys(lista).map((id) => ({ id, file: lista[id].file, name: lista[id].name || id, url: LOTTIES_BASE_PATH + lista[id].file, disponivel: null }));
  if (opcoes.verificarArquivos !== false) {
    await Promise.all(itens.map(async (it) => {
      try {
        const r = await fetch(it.url, { method: "HEAD", cache: "no-store" });
        it.disponivel = r.ok;
      } catch {
        it.disponivel = false;
      }
    }));
  }
  return { origem: MODULO_CANONICO, base: LOTTIES_BASE_PATH, versao: info && info.version || (typeof mod.getVersion === "function" ? mod.getVersion() : null), itens };
}
async function garantirLottie() {
  const g = globalThis;
  if (typeof g.lottie !== "undefined") return true;
  const mod = await carregarModulo();
  if (typeof mod.init === "function") {
    try {
      await mod.init({ preloadLottie: true });
    } catch {
    }
  }
  return typeof g.lottie !== "undefined";
}
function reset() {
  _mod = null;
}
var catalogo_default = { VERSION, MODULE_ID, MODULO_CANONICO, carregarModulo, carregarCatalogo, garantirLottie, reset };
export {
  MODULE_ID,
  MODULO_CANONICO,
  VERSION,
  carregarCatalogo,
  carregarModulo,
  catalogo_default as default,
  garantirLottie,
  reset
};
