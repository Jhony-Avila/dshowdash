// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/user-menu/ui/aviso-erro
// PURPOSE: aviso VISÍVEL de erro do menu do usuário ("Erro ao sair. Tente novamente.").
// Decisão do Jhony (24/11): a mensagem tem de aparecer NA TELA, não só para o leitor de tela. O anúncio pelo
// anunciador aria-live (accessibility/announce) continua; este aviso é a cópia visual dele, por isso fica com
// aria-hidden="true" (o leitor de tela não lê duas vezes).
// O menu fecha no clique em "Sair" (actions.handleMenuAction), então o aviso não pode morar no dropdown: fica fixo
// logo abaixo do botão do usuário, DENTRO do elemento do componente (sai junto no unmount).
// IMPORTS: (none) · WINDOW ACCESS: só o documento/janela do próprio elemento
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'header/components/user-menu/ui/aviso-erro';
export const SELETOR_AVISO = '[data-aviso-erro="user-menu"]';
export const AVISO_DURACAO_MS = 10000;

export function esconderAvisoErro(raiz: HTMLElement|null|undefined) {
  if (!raiz || typeof raiz.querySelectorAll !== 'function') return;
  raiz.querySelectorAll(SELETOR_AVISO).forEach((el) => el.remove());
}

export function mostrarAvisoErro(raiz: HTMLElement|null|undefined, mensagem: string, duracaoMs: number = AVISO_DURACAO_MS) {
  if (!raiz || !mensagem || !raiz.ownerDocument) return null;
  esconderAvisoErro(raiz);
  const doc = raiz.ownerDocument;
  const janela = doc.defaultView;
  const gatilho = raiz.querySelector('.user-menu-trigger') || raiz;
  const r = gatilho.getBoundingClientRect();
  const largura = janela ? janela.innerWidth : 0;
  const aviso = doc.createElement('div');
  aviso.className = 'user-menu-aviso-erro';
  aviso.setAttribute('data-aviso-erro', 'user-menu');
  aviso.setAttribute('aria-hidden', 'true');
  aviso.setAttribute('title', 'Fechar');
  aviso.textContent = mensagem;
  aviso.style.cssText = [
    'position:fixed',
    `top:${Math.round(r.bottom + 8)}px`,
    `right:${Math.max(8, Math.round(largura - r.right))}px`,
    'z-index:100000',
    'max-width:320px',
    'padding:10px 14px',
    'border-radius:10px',
    'border:1px solid rgba(255,95,95,0.55)',
    'background:#2a1416',
    'color:#ffd6d6',
    'font-size:13px',
    'font-weight:500',
    'line-height:1.4',
    'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
    'cursor:pointer',
    'white-space:normal'
  ].join(';');
  aviso.addEventListener('click', () => aviso.remove());
  raiz.appendChild(aviso);
  if (duracaoMs > 0) setTimeout(() => aviso.remove(), duracaoMs);
  return aviso;
}
