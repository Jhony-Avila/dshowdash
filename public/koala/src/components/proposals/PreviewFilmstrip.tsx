import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

// R2 — Filmstrip de páginas REAIS do preview (base da coluna do preview; alinhado ao R1).
// Técnica (b): um iframe srcdoc ISOLADO por página (head-styles do renderer + a .koala-page real),
// escalado com transform:scale. Fiel e sem vazar os seletores globais do preview (*/html/body/@page).
// Clicar numa miniatura rola o preview até a página; a miniatura da página visível fica ATIVA.
const PAGE_W = 794;   // A4 210mm @96dpi
const PAGE_H = 1123;  // A4 297mm @96dpi
const THUMB_H = 84;
const SCALE = THUMB_H / PAGE_H;
const THUMB_W = Math.round(PAGE_W * SCALE);

const CHEV_L = <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>;
const CHEV_R = <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>;

export function PreviewFilmstrip({ iframeRef, tick }: { iframeRef: RefObject<HTMLIFrameElement | null>; tick: number }) {
  const [docs, setDocs] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const livePages = useCallback((): HTMLElement[] => {
    try {
      const d = iframeRef.current?.contentDocument;
      return d ? (Array.from(d.querySelectorAll('.koala-page')) as HTMLElement[]) : [];
    } catch {
      return [];
    }
  }, [iframeRef]);

  // (Re)constrói as miniaturas quando o preview (re)carrega (tick / iframe pronto).
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      const doc = iframeRef.current?.contentDocument;
      const pages = livePages();
      if (doc && pages.length) {
        const head = doc.head?.innerHTML || '';
        const bodyClass = doc.body?.className || '';
        const override = '<style>html,body{margin:0;background:#fff}.koala-page{margin:0!important;box-shadow:none!important}</style>';
        const built = pages.map(
          (p) => `<!doctype html><html><head>${head}${override}</head><body class="${bodyClass}">${p.outerHTML}</body></html>`,
        );
        setDocs(built);
        setActive(0);
        clearInterval(id);
      } else if (++tries > 20) {
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
  }, [tick, livePages, iframeRef]);

  // Página ativa acompanha o scroll do preview.
  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const onScroll = () => {
      const pages = livePages();
      if (!pages.length) return;
      const probe = win.scrollY + win.innerHeight / 3;
      let idx = 0;
      for (let i = 0; i < pages.length; i++) { if (pages[i].offsetTop <= probe) idx = i; }
      setActive(idx);
    };
    win.addEventListener('scroll', onScroll, { passive: true });
    return () => win.removeEventListener('scroll', onScroll);
  }, [tick, livePages, iframeRef]);

  // Mantém a miniatura ativa visível na faixa.
  useEffect(() => {
    thumbRefs.current[active]?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, [active]);

  const goto = useCallback((i: number) => {
    const pages = livePages();
    if (!pages.length) return;
    const idx = Math.max(0, Math.min(pages.length - 1, i));
    pages[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(idx);
  }, [livePages]);

  const total = docs.length;

  return (
    <div className="k-pfilm" role="group" aria-label="Páginas do preview">
      <button className="k-pfilm-nav" onClick={() => goto(active - 1)} disabled={total === 0 || active <= 0} aria-label="Página anterior">{CHEV_L}</button>
      <div className="k-pfilm-strip">
        {total === 0 && <span className="k-pfilm-empty">Gerando prévia…</span>}
        {docs.map((d, i) => (
          <button
            key={i}
            ref={(el) => { thumbRefs.current[i] = el; }}
            type="button"
            className={'k-pfilm-thumb' + (i === active ? ' is-active' : '')}
            onClick={() => goto(i)}
            title={'Página ' + (i + 1)}
            aria-label={'Ir para a página ' + (i + 1)}
            aria-current={i === active ? 'true' : undefined}
          >
            <span className="k-slide-num">{i + 1}</span>
            <span className="k-pfilm-canvas" style={{ width: THUMB_W, height: THUMB_H }}>
              <iframe
                key={tick + '-' + i}
                className="k-pfilm-iframe"
                title={'Miniatura da página ' + (i + 1)}
                srcDoc={d}
                scrolling="no"
                tabIndex={-1}
                aria-hidden="true"
                style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${SCALE})` }}
              />
            </span>
          </button>
        ))}
      </div>
      <button className="k-pfilm-nav" onClick={() => goto(active + 1)} disabled={total === 0 || active >= total - 1} aria-label="Próxima página">{CHEV_R}</button>
    </div>
  );
}
