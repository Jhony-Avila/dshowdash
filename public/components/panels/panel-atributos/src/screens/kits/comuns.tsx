// panel-atributos/src/screens/kits/comuns.tsx — peças visuais dos KITS V2: ícones (família Feather/Lucide do módulo, traço 1,5, desenhados
// aqui porque ui/Icones.tsx é da CIMA), popover acessível, seletor "Colunas", menu de escolha (Situação / Agrupar), pílula de situação e
// marcador de origem (mesma legenda da Matriz). Tudo por tokens var(--bl-…) em kits-v2.css.
import React from 'react';
import { ORIGEM, origensDoAlcance } from '../../lib/kits';

const DESENHO = {
  mais: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  busca: <><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  seta: <polyline points="6 9 12 15 18 9" />,
  colunas: <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></>,
  lapis: <><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>,
  copiar: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  energia: <><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></>,
  voltar: <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>,
  /* elo rompido (Lucide "unlink"): Remover do kit — a associação sai, o atributo continua no cadastro */
  eloRompido: <><path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" /><path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" /><line x1="8" y1="2" x2="8" y2="5" /><line x1="2" y1="8" x2="5" y2="8" /><line x1="16" y1="19" x2="16" y2="22" /><line x1="19" y1="16" x2="22" y2="16" /></>,
  fechar: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  pega: <><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></>,
  sobe: <polygon points="12 7 19 16 5 16" />,
  desce: <polygon points="5 8 19 8 12 17" />,
  direita: <polyline points="9 18 15 12 9 6" />,
};
export type NomeIc = keyof typeof DESENHO;
export function Ic({ nome, tam = 16 }: { nome: NomeIc; tam?: number }) {
  return <svg className="at-kv__ic" width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">{DESENHO[nome]}</svg>;
}

/** Botão só com ícone: nome acessível + tooltip obrigatórios. */
export function BotaoIcone({ nome, rotulo, aoClicar, tom, desligado, ...resto }: { nome: NomeIc; rotulo: string; aoClicar: () => void; tom?: 'aviso' | 'perigo' | 'destaque' | 'borda'; desligado?: boolean } & Record<`data-${string}`, string>) {
  return (
    <button type="button" className={`at-kv__icone ${tom ? `at-kv__icone--${tom}` : ''}`} aria-label={rotulo} title={rotulo} disabled={desligado} onClick={aoClicar} {...resto}>
      <Ic nome={nome} />
    </button>);
}

/** Popover acessível (aria-expanded; Esc e clique fora fecham e o foco volta ao botão). */
export function usePopover() {
  const [aberto, setAberto] = React.useState(false);
  const raiz = React.useRef<HTMLDivElement>(null); const botao = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAberto(false); botao.current?.focus(); } };
    document.addEventListener('mousedown', fora); document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', tecla); };
  }, [aberto]);
  return { aberto, setAberto, raiz, botao };
}

/** "Colunas": mostrar/ocultar campos opcionais (identificação e ações fixas) + "Restaurar padrão". */
export function SeletorColunas<C extends string>({ catalogo, visiveis, aoMudar, aoRestaurar, legenda }: {
  catalogo: readonly { id: C; rotulo: string; fixa?: boolean }[]; visiveis: readonly C[]; aoMudar: (id: C) => void; aoRestaurar: () => void; legenda: string;
}) {
  const p = usePopover(); const id = React.useId();
  return (
    <div className="at-kv__pop" ref={p.raiz}>
      <button ref={p.botao} type="button" className="at-kv__botao" aria-haspopup="true" aria-expanded={p.aberto} aria-controls={id} onClick={() => p.setAberto(!p.aberto)} data-botao-colunas>
        <Ic nome="colunas" /><span>Colunas</span><Ic nome="seta" tam={14} />
      </button>
      {p.aberto && (
        <fieldset id={id} className="at-kv__menu" data-colunas>
          <legend className="bl-so-leitor">{legenda}</legend>
          {catalogo.map((c) => (
            <label key={c.id} className={`at-kv__opcao ${c.fixa ? 'at-kv__opcao--fixa' : ''}`} title={c.fixa ? 'Sempre visível' : undefined}>
              <input type="checkbox" checked={visiveis.includes(c.id)} disabled={c.fixa} onChange={() => aoMudar(c.id)} data-coluna-opcao={c.id} />
              <span>{c.rotulo}</span>
            </label>))}
          <button type="button" className="at-link at-kv__restaurar" onClick={aoRestaurar}>Restaurar padrão</button>
        </fieldset>)}
    </div>);
}

/** Menu de escolha única com rótulo visível ("Situação: Ativos"). Nome acessível = rótulo + valor. */
export function MenuEscolha<V extends string>({ rotulo, valor, opcoes, aoEscolher, resumo, ...resto }: {
  rotulo: string; valor: V; opcoes: readonly { valor: V; rotulo: string }[]; aoEscolher: (v: V) => void; /** texto do botão para o valor atual ('' = só o rótulo) */ resumo?: (v: V) => string;
} & Record<`data-${string}`, string>) {
  const p = usePopover(); const id = React.useId();
  const atual = resumo ? resumo(valor) : (opcoes.find((o) => o.valor === valor)?.rotulo ?? '');
  return (
    <div className="at-kv__pop" ref={p.raiz}>
      <button ref={p.botao} type="button" className="at-kv__botao" aria-haspopup="listbox" aria-expanded={p.aberto} aria-controls={id} onClick={() => p.setAberto(!p.aberto)} {...resto}>
        <span>{rotulo}{atual && rotulo ? ': ' : ''}{atual}</span><Ic nome="seta" tam={14} />
      </button>
      {p.aberto && (
        <ul id={id} role="listbox" aria-label={rotulo} className="at-kv__menu at-kv__menu--lista">
          {opcoes.map((o) => (
            <li key={o.valor} role="option" aria-selected={o.valor === valor}>
              <button type="button" className="at-kv__item-menu" onClick={() => { aoEscolher(o.valor); p.setAberto(false); p.botao.current?.focus(); }}>{o.rotulo}</button>
            </li>))}
        </ul>)}
    </div>);
}

/** Pílula de situação (texto, sem bolinha). Inativo continua legível. */
export const PilulaSituacao = ({ ativo, f = false }: { ativo: boolean; f?: boolean }) =>
  <span className={`at-kv__pilula ${ativo ? 'at-kv__pilula--ativo' : 'at-kv__pilula--inativo'}`}>{ativo ? (f ? 'Ativa' : 'Ativo') : (f ? 'Inativa' : 'Inativo')}</span>;

/** Marcadores de origem do vínculo (coexistem; ordem fixa da legenda). */
export function Origens({ motivos }: { motivos: readonly string[] }) {
  const l = origensDoAlcance(motivos);
  if (l.length === 0) return <span className="at-kv__fraco">—</span>;
  return <span className="at-kv__origens">{l.map((o) => <span key={o} className={`at-kv__m at-kv__m--${ORIGEM[o].classe}`} title={ORIGEM[o].longo} data-origem={o}>{ORIGEM[o].curto}</span>)}</span>;
}
export function LegendaOrigens() {
  return (
    <ul className="at-kv__legenda" aria-label="Legenda da origem do vínculo">
      {(['escopo', 'direto', 'todos'] as const).map((o) => <li key={o}><span className={`at-kv__m at-kv__m--${ORIGEM[o].classe}`}>{ORIGEM[o].curto}</span>{ORIGEM[o].longo}</li>)}
    </ul>);
}

/** Preferência local (Colunas): protegida — sem armazenamento, vale só na visita. */
export function usePreferencia<C extends string>(chave: string, validar: (v: unknown) => C[]) {
  const [v, setV] = React.useState<C[]>(() => { try { const s = window.localStorage.getItem(chave); return validar(s ? JSON.parse(s) : null); } catch { return validar(null); } });
  const mudar = (n: C[]) => { setV(n); try { window.localStorage.setItem(chave, JSON.stringify(n)); } catch { /* vale só nesta visita */ } };
  return [v, mudar] as const;
}
