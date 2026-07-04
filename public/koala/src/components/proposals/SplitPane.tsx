import { useCallback, useEffect, useRef, useState } from 'react';

// Divisor vertical redimensionável + colapso rápido entre dois painéis.
// Implementação própria (pointer events), sem lib externa.
const SPLIT_KEY = 'koala.editor.split'; // fração da largura útil ocupada pelo form (0..1)
const COLLAPSE_KEY = 'koala.editor.collapse'; // 'none' | 'form' | 'preview'
const DEFAULT_FRACTION = 0.5; // layout atual ≈ 50/50
const FORM_MIN = 360; // px
const PREVIEW_MIN = 380; // px
const HANDLE = 7; // largura do divisor (px)
const STEP = 24; // passo do teclado (px)
const STACK_BELOW = 900; // abaixo desta largura útil, empilha e desabilita o splitter

type Collapse = 'none' | 'form' | 'preview';

function readFraction(): number {
  try {
    const v = parseFloat(localStorage.getItem(SPLIT_KEY) || '');
    return v > 0 && v < 1 ? v : DEFAULT_FRACTION;
  } catch {
    return DEFAULT_FRACTION;
  }
}
function readCollapse(): Collapse {
  try {
    const v = localStorage.getItem(COLLAPSE_KEY);
    return v === 'form' || v === 'preview' ? (v as Collapse) : 'none';
  } catch {
    return 'none';
  }
}

export function SplitPane({ left, right }: { left: any; right: any }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fraction, setFraction] = useState<number>(readFraction);
  const [collapse, setCollapse] = useState<Collapse>(readCollapse);
  const [dragging, setDragging] = useState(false);
  const [stacked, setStacked] = useState(false);

  // observa a largura útil do container p/ decidir empilhamento em telas estreitas
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? el.clientWidth;
      setStacked(w < STACK_BELOW);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // persistência
  useEffect(() => {
    try { localStorage.setItem(SPLIT_KEY, String(fraction)); } catch { /* noop */ }
  }, [fraction]);
  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapse); } catch { /* noop */ }
  }, [collapse]);

  const growable = useCallback(() => {
    const el = wrapRef.current;
    const w = el ? el.getBoundingClientRect().width : 0;
    return Math.max(1, w - HANDLE);
  }, []);

  const clampFraction = useCallback((f: number) => {
    const g = growable();
    const minF = FORM_MIN / g;
    const maxF = (g - PREVIEW_MIN) / g;
    if (maxF < minF) return 0.5; // container pequeno demais: 50/50
    return Math.min(Math.max(f, minF), maxF);
  }, [growable]);

  const applyClientX = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const g = Math.max(1, rect.width - HANDLE);
    const formW = clientX - rect.left - HANDLE / 2;
    setFraction(clampFraction(formW / g));
  }, [clampFraction]);

  // ---- drag (pointer + touch via Pointer Events) ----
  function onDividerPointerDown(e: any) {
    if (collapse !== 'none' || stacked) return;
    e.preventDefault();
    setDragging(true);
  }
  useEffect(() => {
    if (!dragging) return;
    const move = (ev: PointerEvent) => applyClientX(ev.clientX);
    const up = () => setDragging(false);
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none'; // não selecionar texto durante o drag
    document.body.style.cursor = 'col-resize';
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [dragging, applyClientX]);

  function resetSplit() {
    setFraction(DEFAULT_FRACTION);
  }

  function onDividerKeyDown(e: any) {
    if (stacked) return;
    if (collapse !== 'none') {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollapse('none'); }
      return;
    }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setFraction((f) => clampFraction(f - STEP / growable())); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setFraction((f) => clampFraction(f + STEP / growable())); }
    else if (e.key === 'Home') { e.preventDefault(); resetSplit(); }
  }

  const stop = (e: any) => e.stopPropagation();

  const leftGrow = collapse === 'form' ? 0 : collapse === 'preview' ? 1 : fraction;
  const rightGrow = collapse === 'preview' ? 0 : collapse === 'form' ? 1 : 1 - fraction;

  const dividerLabel =
    collapse === 'form' ? 'Reabrir formulário'
      : collapse === 'preview' ? 'Reabrir preview'
        : 'Redimensionar painéis (setas ← → movem; duplo-clique reseta)';

  return (
    <div
      className="k-split"
      ref={wrapRef}
      data-collapse={collapse}
      data-dragging={dragging ? 'true' : undefined}
      data-stacked={stacked ? 'true' : undefined}
    >
      <div className="k-split-pane k-split-pane-form" style={{ flexGrow: leftGrow }}>
        <div className="k-split-inner k-split-inner-form">{left}</div>
      </div>

      <div
        className="k-split-divider"
        role="separator"
        aria-orientation="vertical"
        aria-label={dividerLabel}
        aria-valuenow={Math.round(fraction * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onPointerDown={collapse === 'none' ? onDividerPointerDown : undefined}
        onDoubleClick={collapse === 'none' ? resetSplit : undefined}
        onClick={collapse !== 'none' ? () => setCollapse('none') : undefined}
        onKeyDown={onDividerKeyDown}
      >
        <div className="k-split-divider-ui">
          {collapse === 'none' ? (
            <>
              <button
                type="button"
                className="k-split-col-btn"
                title="Ocultar formulário (preview em tela cheia)"
                aria-label="Ocultar formulário"
                onPointerDown={stop}
                onClick={() => setCollapse('form')}
              >
                ‹
              </button>
              <span className="k-split-grip" aria-hidden="true" />
              <button
                type="button"
                className="k-split-col-btn"
                title="Ocultar preview (formulário em tela cheia)"
                aria-label="Ocultar preview"
                onPointerDown={stop}
                onClick={() => setCollapse('preview')}
              >
                ›
              </button>
            </>
          ) : (
            <span className="k-split-reopen-ico" aria-hidden="true">
              {collapse === 'form' ? '›' : '‹'}
            </span>
          )}
        </div>
      </div>

      <div className="k-split-pane k-split-pane-preview" style={{ flexGrow: rightGrow }}>
        <div className="k-split-inner k-split-inner-preview">{right}</div>
      </div>
    </div>
  );
}
