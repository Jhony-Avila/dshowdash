// panel-atributos/src/ui/MenuBarra.tsx — UX-2b/Unidades V2 (DIREITA, 19/11): controle COMPACTO da barra de ferramentas ("Rótulo: Valor ▾"),
// como o Agrupar do mockup. Abre um menu com as opções; a ativa fica marcada (✓, aria-checked). Esc ou clique fora fecha.
// Sem dependência nova; os estilos ficam em celula.css (.at-und-menu, .at-und-ctrl).
import React from 'react';

export interface OpcaoMenu<V extends string> { valor: V; rotulo: string }

export function MenuEscolha<V extends string>({ rotulo, valor, opcoes, aoEscolher, icone, mostrarValor = true, padrao, classe }: {
  rotulo: string; valor: V; opcoes: readonly OpcaoMenu<V>[]; aoEscolher: (v: V) => void; icone?: React.ReactNode;
  /** false = o botão mostra só o rótulo (ex.: "Agrupar ▾"). */ mostrarValor?: boolean;
  /** valor padrão: quando escolhido, o botão volta a mostrar só o rótulo e não fica destacado. */ padrao?: V; classe?: string;
}) {
  const [aberto, setAberto] = React.useState(false);
  const raiz = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false); };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [aberto]);
  const atual = opcoes.find((o) => o.valor === valor)?.rotulo ?? '';
  const filtrando = padrao !== undefined && valor !== padrao;
  return (
    <span className={`at-und-colunas ${classe ?? ''}`} ref={raiz} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setAberto(false); } }}>
      <button type="button" className={`at-und-ctrl at-und-ctrl--botao ${filtrando ? 'at-und-ctrl--ativo' : ''}`} aria-haspopup="menu" aria-expanded={aberto}
        aria-label={`${rotulo}: ${atual}`} title={`${rotulo}: ${atual}`} onClick={() => setAberto((x) => !x)}>
        {icone}{rotulo}{mostrarValor && (padrao === undefined || filtrando) ? <>: <span className="at-und-ctrl__valor">{atual}</span></> : null} <span aria-hidden>▾</span>
      </button>
      {aberto && (
        <div className="at-und-menu" role="menu" aria-label={rotulo}>
          {opcoes.map((o) => (
            <button key={o.valor} type="button" role="menuitemradio" aria-checked={o.valor === valor} className={`at-und-menu__opcao ${o.valor === valor ? 'at-und-menu__opcao--ativa' : ''}`}
              onClick={() => { aoEscolher(o.valor); setAberto(false); }}>
              <span className="at-und-menu__marca" aria-hidden>{o.valor === valor ? '✓' : ''}</span>{o.rotulo}
            </button>))}
        </div>)}
    </span>
  );
}

/** Menu "Colunas ▾": mostrar/ocultar colunas opcionais. */
export function MenuColunas({ opcionais, ocultas, aoMudar }: { opcionais: readonly { chave: string; titulo: string }[]; ocultas: readonly string[]; aoMudar: (o: string[]) => void }) {
  const [aberto, setAberto] = React.useState(false);
  const raiz = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false); };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [aberto]);
  return (
    <span className="at-und-colunas" ref={raiz} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setAberto(false); } }}>
      <button type="button" className="at-und-ctrl at-und-ctrl--botao" aria-expanded={aberto} aria-haspopup="true" onClick={() => setAberto((x) => !x)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></svg> Colunas <span aria-hidden>▾</span>
      </button>
      {aberto && (
        <div className="at-und-menu" role="group" aria-label="Colunas visíveis">
          {opcionais.map((c) => (
            <label key={c.chave}><input type="checkbox" checked={!ocultas.includes(c.chave)}
              onChange={(e) => aoMudar(e.target.checked ? ocultas.filter((x) => x !== c.chave) : [...ocultas, c.chave])} /> {c.titulo}</label>))}
          {ocultas.length > 0 && <button type="button" className="at-link" onClick={() => aoMudar([])}>Mostrar todas</button>}
        </div>)}
    </span>
  );
}
