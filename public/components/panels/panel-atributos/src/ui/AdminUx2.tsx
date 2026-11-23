// panel-atributos/src/ui/AdminUx2.tsx — peças visuais do UX-2 (Unidades, Kits, Atributos), da DIREITA.
//  · Faixa fixa: as telas usam <FaixaFixa> de ui/Comuns.tsx (UX-1b-v2 da CIMA, servido em a6c1cc95); o fallback local saiu.
//  · DetalheLinhaUx2: área da LINHA EXPANDIDA logo abaixo da TabelaDados (a TabelaDados ainda não tem linha expandida embutida).
//    TODO(TabelaDados): pedido à ESQUERDA em PARA-STATUS §31 (prop `expandida` + `detalheLinha`); quando existir, o conteúdo
//    passado aqui vira o `detalheLinha` sem mudar.
//  · NaoConferido: o texto padrão "ainda não conferido" (nunca zero).
import React from 'react';
import { NAO_CONFERIDO, type Mudanca } from './admin-ux2';
import './admin-ux2.css';

export function DetalheLinhaUx2({ titulo, aoFechar, children }: { titulo: string; aoFechar: () => void; children: React.ReactNode }) {
  const ref = React.useRef<HTMLElement>(null);
  const id = React.useId();
  React.useEffect(() => { ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [titulo]);
  return (
    <section ref={ref} className="at-ux2-detalhe" aria-labelledby={id} tabIndex={-1}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); aoFechar(); } }}>
      <header className="at-ux2-detalhe__cabeca">
        <h3 id={id}>{titulo}</h3>
        <button type="button" className="bl-botao" onClick={aoFechar} aria-label={`Recolher ${titulo}`}>Recolher</button>
      </header>
      <div className="at-ux2-detalhe__corpo">{children}</div>
    </section>
  );
}

export function BlocoUx2({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <div className="at-ux2-bloco"><h4>{titulo}</h4>{children}</div>;
}

export function NaoConferido({ oque }: { oque: string }) {
  return <span className="at-ux2-nao-conferido" title="O servidor ainda não devolve esta contagem">{oque} {NAO_CONFERIDO}</span>;
}

/** Quadro "antes → depois" (o mesmo corpo que será enviado). */
export function AntesDepois({ mudancas }: { mudancas: Mudanca[] }) {
  if (!mudancas.length) return null;
  return (
    <table className="at-ux2-antes-depois">
      <caption className="bl-so-leitor">O que muda ao salvar</caption>
      <thead><tr><th scope="col">Campo</th><th scope="col">Antes</th><th scope="col" aria-hidden /><th scope="col">Depois</th></tr></thead>
      <tbody>{mudancas.map((m) => <tr key={m.campo}><th scope="row">{m.campo}</th><td>{m.antes}</td><td aria-hidden>→</td><td><strong>{m.depois}</strong></td></tr>)}</tbody>
    </table>
  );
}

/** Lista de IDs com "mostrar todos" (Entram / Saem / Continuam). */
export function ListaIds({ rotulo, ids, nomes, max = 12 }: { rotulo: string; ids: number[]; nomes: Map<number, string>; max?: number }) {
  const [todos, setTodos] = React.useState(false);
  const vis = todos ? ids : ids.slice(0, max);
  return (
    <details className="at-ux2-ids">
      <summary><strong>{rotulo}</strong> <span className="at-ux2-n">{ids.length.toLocaleString('pt-BR')}</span></summary>
      {ids.length === 0 ? <p className="at-fraco">Nenhum.</p> : (
        <ul>{vis.map((i) => <li key={i}><span className="at-ux2-id">ID {i}</span> {nomes.get(i) ?? ''}</li>)}</ul>
      )}
      {ids.length > max && <button type="button" className="at-link" onClick={() => setTodos((v) => !v)}>{todos ? 'Mostrar menos' : `Mostrar os ${ids.length}`}</button>}
    </details>
  );
}
