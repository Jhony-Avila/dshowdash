// R1 — filmstrip da ORDEM das páginas (miniaturas estilizadas mini-A4, blocos representando o conteúdo).
// Propostas: mock visual (default). Templates: recebe `pages` derivado do structure_json real.
export type SlideThumb = { n: number; kind: 'cover' | 'text' | 'table' | 'closing' };
const MOCK_SLIDES: SlideThumb[] = [
  { n: 1, kind: 'cover' },
  { n: 2, kind: 'text' },
  { n: 3, kind: 'text' },
  { n: 4, kind: 'table' },
  { n: 5, kind: 'text' },
  { n: 6, kind: 'closing' },
];

export function Filmstrip({ pages, label = 'Ordem dos slides (prévia visual)' }: { pages?: SlideThumb[]; label?: string }) {
  const slides = pages && pages.length ? pages : MOCK_SLIDES;
  return (
    <div className="k-filmstrip" role="group" aria-label={label}>
      {slides.map((s) => (
        <div key={s.n} className={'k-slide-thumb' + (s.n === 1 ? ' is-active' : '')} title={'Slide ' + s.n}>
          <span className="k-slide-num">{s.n}</span>
          <div className={'k-slide-canvas k-slide-' + s.kind} aria-hidden="true">
            {s.kind === 'cover' && (<><span className="k-ph k-ph-title" /><span className="k-ph k-ph-sub" /></>)}
            {s.kind === 'text' && (<><span className="k-ph k-ph-head" /><span className="k-ph k-ph-line" /><span className="k-ph k-ph-line" /><span className="k-ph k-ph-line short" /></>)}
            {s.kind === 'table' && (<><span className="k-ph k-ph-head" /><span className="k-ph k-ph-row" /><span className="k-ph k-ph-row" /><span className="k-ph k-ph-row" /></>)}
            {s.kind === 'closing' && (<><span className="k-ph k-ph-block" /></>)}
          </div>
        </div>
      ))}
    </div>
  );
}
