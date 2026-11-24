const MODULE_ID = "header/components/user-menu/ui/aviso-erro";
const SELETOR_AVISO = '[data-aviso-erro="user-menu"]';
const AVISO_DURACAO_MS = 1e4;
function esconderAvisoErro(raiz) {
  if (!raiz || typeof raiz.querySelectorAll !== "function") return;
  raiz.querySelectorAll(SELETOR_AVISO).forEach((el) => el.remove());
}
function mostrarAvisoErro(raiz, mensagem, duracaoMs = AVISO_DURACAO_MS) {
  if (!raiz || !mensagem || !raiz.ownerDocument) return null;
  esconderAvisoErro(raiz);
  const doc = raiz.ownerDocument;
  const janela = doc.defaultView;
  const gatilho = raiz.querySelector(".user-menu-trigger") || raiz;
  const r = gatilho.getBoundingClientRect();
  const largura = janela ? janela.innerWidth : 0;
  const aviso = doc.createElement("div");
  aviso.className = "user-menu-aviso-erro";
  aviso.setAttribute("data-aviso-erro", "user-menu");
  aviso.setAttribute("aria-hidden", "true");
  aviso.setAttribute("title", "Fechar");
  aviso.textContent = mensagem;
  aviso.style.cssText = [
    "position:fixed",
    `top:${Math.round(r.bottom + 8)}px`,
    `right:${Math.max(8, Math.round(largura - r.right))}px`,
    "z-index:100000",
    "max-width:320px",
    "padding:10px 14px",
    "border-radius:10px",
    "border:1px solid rgba(255,95,95,0.55)",
    "background:#2a1416",
    "color:#ffd6d6",
    "font-size:13px",
    "font-weight:500",
    "line-height:1.4",
    "box-shadow:0 8px 24px rgba(0,0,0,0.35)",
    "cursor:pointer",
    "white-space:normal"
  ].join(";");
  aviso.addEventListener("click", () => aviso.remove());
  raiz.appendChild(aviso);
  if (duracaoMs > 0) setTimeout(() => aviso.remove(), duracaoMs);
  return aviso;
}
export {
  AVISO_DURACAO_MS,
  MODULE_ID,
  SELETOR_AVISO,
  esconderAvisoErro,
  mostrarAvisoErro
};
