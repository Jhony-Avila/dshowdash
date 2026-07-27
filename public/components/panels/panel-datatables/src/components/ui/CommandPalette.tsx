// components/ui/CommandPalette.tsx — paleta de comandos Ctrl+K (Elevação §19).
// @version 1.0.0  @created 2026-07-21
// Ctrl/Cmd+K abre. Busca telas + ações, recentes quando vazio, navegação por
// teclado (↑ ↓ Enter Esc). Global no shell do módulo.
import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { queryClient } from '../../lib/api';
import { GRUPOS, META_TELAS } from '../../shell/routing';
import { Icone } from './Icone';
import css from './CommandPalette.module.css';

interface Comando { id: string; label: string; sub: string; icone: string; grupo?: string; tela?: string; run: () => void }
const CHAVE_RECENTES = 'dt.cmd.recentes';

function lerRecentes(): string[] {
  try { return JSON.parse(localStorage.getItem(CHAVE_RECENTES) || '[]'); } catch { return []; }
}

export function CommandPalette({ ir, rotaAtual }: {
  ir: (r: { grupo: string; tela: string }) => void; rotaAtual: string;
}): JSX.Element | null {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  // Registra a rota atual nos recentes (mais recente primeiro, sem duplicar).
  useEffect(() => {
    if (!rotaAtual) return;
    try {
      const at = [rotaAtual, ...lerRecentes().filter((r) => r !== rotaAtual)].slice(0, 6);
      localStorage.setItem(CHAVE_RECENTES, JSON.stringify(at));
    } catch { /* cota: recentes é acessório */ }
  }, [rotaAtual]);

  // Atalho Ctrl/Cmd+K. O app-shell tem um palette próprio no MESMO atalho; para
  // não abrir os dois, interceptamos em fase de CAPTURA e paramos a propagação
  // (stopImmediatePropagation) — assim o Ctrl+K DENTRO do DataTables abre só o
  // nosso. Fora do módulo, o do shell segue normal (este componente nem monta).
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setAberto((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as EventListenerOptions);
  }, []);

  useEffect(() => {
    if (aberto) { setBusca(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 40); }
  }, [aberto]);

  // Todas as telas + ações.
  const comandos = useMemo<Comando[]>(() => {
    const telas: Comando[] = [];
    for (const g of GRUPOS) {
      for (const t of g.telas) {
        const meta = META_TELAS[t.id];
        telas.push({
          id: `${g.id}/${t.id}`, label: meta?.titulo ?? t.rotulo, sub: g.rotulo,
          icone: meta?.icone ?? g.icone, grupo: g.id, tela: t.id,
          run: () => ir({ grupo: g.id, tela: t.id }),
        });
      }
    }
    const acoes: Comando[] = [
      { id: 'act:refresh', label: 'Atualizar dados', sub: 'Ação', icone: 'RefreshCw',
        run: () => queryClient.invalidateQueries({ queryKey: ['dt'] }) },
    ];
    return [...telas, ...acoes];
  }, [ir]);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) {
      const rec = lerRecentes();
      const recentes = rec.map((r) => comandos.find((c) => c.id === r)).filter(Boolean) as Comando[];
      const resto = comandos.filter((c) => !rec.includes(c.id));
      return [...recentes, ...resto];
    }
    return comandos.filter((c) => (c.label + ' ' + c.sub).toLowerCase().includes(t));
  }, [busca, comandos]);

  useEffect(() => { setSel(0); }, [busca]);
  useEffect(() => {
    listaRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!aberto) return null;

  const executar = (c?: Comando): void => { if (c) { c.run(); setAberto(false); } };
  const semBusca = busca.trim() === '';

  return (
    <div className={css.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setAberto(false); }}>
      <div className={css.caixa} role="dialog" aria-modal="true" aria-label="Paleta de comandos">
        <div className={css.buscaLinha}>
          <Icone nome="Search" size={16} className={css.lupa} />
          <input ref={inputRef} className={css.input} value={busca} placeholder="Buscar telas e ações…"
            aria-label="Buscar comando" onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, filtrados.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); executar(filtrados[sel]); }
              else if (e.key === 'Escape') { setAberto(false); }
            }} />
          <kbd className={css.kbd}>esc</kbd>
        </div>
        <div className={css.lista} ref={listaRef} role="listbox">
          {semBusca && filtrados.length > 0 && <div className={css.grupo}>Recentes e telas</div>}
          {filtrados.length === 0 && <div className={css.vazio}>Nada encontrado para “{busca}”.</div>}
          {filtrados.map((c, i) => (
            <button key={c.id} type="button" role="option" aria-selected={i === sel}
              className={`${css.item} ${i === sel ? css.itemSel : ''}`}
              onMouseEnter={() => setSel(i)} onClick={() => executar(c)}>
              <span className={css.itemIcone}><Icone nome={c.icone} size={15} /></span>
              <span className={css.itemLabel}>{c.label}</span>
              <span className={css.itemSub}>{c.sub}</span>
              <Icone nome="ArrowUpRight" size={13} className={css.itemIr} />
            </button>
          ))}
        </div>
        <div className={css.rodape}>
          <span><kbd className={css.kbd}>↑</kbd><kbd className={css.kbd}>↓</kbd> navegar</span>
          <span><kbd className={css.kbd}>↵</kbd> abrir</span>
          <span><kbd className={css.kbd}>ctrl</kbd>+<kbd className={css.kbd}>k</kbd> alternar</span>
        </div>
      </div>
    </div>
  );
}
