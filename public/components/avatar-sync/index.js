'use strict';
// components/avatar-sync/index.js — sincronização do avatar em tempo real.
// @module  avatar-sync
// @version 1.0.0
// @created 2026-07-29
//
// Resolve a falha nº 1 do briefing de avatares (§2.2/§22): o header carregava
// o avatar UMA vez (sessão) e nunca mais. Este módulo é ADITIVO (padrão do
// traffic-monitor/header-indicator): não toca em nenhum bundle, só escuta e
// atualiza as <img> de avatar já existentes no shell.
//
// Fontes de atualização (todas emitidas pelo AvatarService do Avatar Studio):
//   1. CustomEvent 'dshow:avatar:atualizado' no window  → mesma aba
//   2. BroadcastChannel 'dshow-avatar'                  → outras abas
//   3. storage event em 'dshow.avatar.render.v1'        → fallback universal
//
// Alvos: .user-avatar .avatar-img (gatilho do menu), .user-avatar-large
// .avatar-img (dropdown) e qualquer [data-avatar-do-usuario] futuro.

(function () {
  const EVENTO = 'dshow:avatar:atualizado';
  const CANAL = 'dshow-avatar';
  const CHAVE = 'dshow.avatar.render.v1';
  const SELETORES = [
    '.user-avatar .avatar-img',
    '.user-avatar-large .avatar-img',
    '[data-avatar-do-usuario]',
  ].join(',');

  let ultimo = '';

  function aplicar(render) {
    if (!render || typeof render !== 'string' || render === ultimo) return;
    // aceita apenas nossos formatos: caminho publicado ou SVG data-uri local
    const seguro = render.startsWith('/assets/avatars/studio/')
      || render.startsWith('data:image/svg+xml');
    if (!seguro) return;
    ultimo = render;

    const imgs = document.querySelectorAll(SELETORES);
    imgs.forEach((img) => {
      try {
        img.src = render;
        img.style.display = 'block';
        // esconde as iniciais irmãs (o header alterna img × iniciais)
        const irmas = img.parentElement
          ? img.parentElement.querySelectorAll('.avatar-initials')
          : [];
        irmas.forEach((el) => { el.style.display = 'none'; });
      } catch (_) { /* elemento removido no meio do caminho */ }
    });

    if (imgs.length && window.DshowLogger && window.DshowLogger.debug) {
      window.DshowLogger.debug('[avatar-sync] avatar atualizado em ' + imgs.length + ' ponto(s)');
    }
  }

  function iniciar() {
    // 1) mesma aba
    window.addEventListener(EVENTO, (ev) => {
      aplicar(ev && ev.detail ? ev.detail.render : '');
    });

    // 2) outras abas
    try {
      const canal = new BroadcastChannel(CANAL);
      canal.addEventListener('message', (ev) => {
        if (ev && ev.data && ev.data.tipo === EVENTO) aplicar(ev.data.render);
      });
    } catch (_) { /* navegador sem BroadcastChannel — storage cobre */ }

    // 3) fallback entre abas
    window.addEventListener('storage', (ev) => {
      if (ev.key === CHAVE && ev.newValue) aplicar(ev.newValue);
    });
  }

  // ADITIVO: só age depois do load (não compete com o boot do shell)
  if (document.readyState === 'complete') {
    iniciar();
  } else {
    window.addEventListener('load', iniciar, { once: true });
  }
})();
