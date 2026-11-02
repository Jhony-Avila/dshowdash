(() => {
  const bus = window.EventBusGlobal || window.EventBus;
  const log = [];
  const t0 = Date.now();

  const push = (type, payload) => log.push({ ts: Date.now(), dt: Date.now() - t0, type, payload });

  // EventBus hook
  if (bus?.on) {
    const h = (p) => push('EventBus:ui:action', p);
    bus.on('ui:action', h);
    push('init', { ok: true, bus: 'on(ui:action) attached' });

    window.__HDRFTR_DUMP__ = () => {
      try { bus.off?.('ui:action', h); } catch (e) {}
      const uniq = [];
      const seen = new Set();
      for (const e of log) {
        const id = e?.payload?.actionId;
        if (!id) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        uniq.push(e);
      }
      console.log('[HDRFTR] UNIQUE ui:action:', uniq);
      return { count: uniq.length, uniq, all: log };
    };
  } else {
    push('init', { ok: false, reason: 'EventBus not found' });
    window.__HDRFTR_DUMP__ = () => ({ count: 0, uniq: [], all: log });
  }

  // DOM capture hook
  const domHandler = (ev) => {
    const t = ev.target;
    const comp =
      t?.closest?.('[data-link-id]') ||
      t?.closest?.('[data-action-id]') ||
      t?.closest?.('[data-id]') ||
      t?.closest?.('a,button,[role="button"]');

    if (!comp) return;

    push('DOM:click', {
      tag: t?.tagName,
      cls: String(t?.className || ''),
      linkId: comp?.getAttribute?.('data-link-id') || null,
      actionId: comp?.getAttribute?.('data-action-id') || comp?.getAttribute?.('data-actionid') || null,
      dataId: comp?.getAttribute?.('data-id') || null,
      compCls: String(comp?.className || '').slice(0, 120)
    });
  };

  document.addEventListener('click', domHandler, true);

  setTimeout(() => {
    try { document.removeEventListener('click', domHandler, true); } catch (e) {}
    console.log('[HDRFTR] timeout. Rode window.__HDRFTR_DUMP__()');
  }, 20000);

  console.log('[HDRFTR] Probe ativo 20s. Clique em ícones do Header/Footer e rode window.__HDRFTR_DUMP__()');
})();
