// shell/PaletaComandos.tsx — COMMAND PALETTE do shell (briefing §566, AS5).
// @version 1.0.0  @created 2026-08-03
//
// Ctrl+K / ⌘K abre; busca unificada (mesma normalização §57) sobre:
// AÇÕES do estúdio (aleatório, apresentar, salvar, desfazer, modos, abas)
// + NAVEGAÇÃO (abrir categoria) + EQUIPAR item do catálogo pelo nome.
// Teclado completo: ↑/↓ navega, Enter executa, Esc fecha (§583/§297).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Command, CornerDownLeft } from 'lucide-react';
import { PARTES, RARIDADES, categoriasAtivas } from '../services/AvatarCatalog';
import { MOVIMENTOS, animar } from './movimento';

export interface ComandoPaleta {
  id: string;
  rotulo: string;
  grupo: 'Ações' | 'Navegação' | 'Equipar';
  executar: () => void;
}

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function PaletaComandos({ acoes, aoNavegar, aoEquipar, aoFechar }: {
  acoes: Array<{ id: string; rotulo: string; executar: () => void }>;
  aoNavegar: (categoriaId: string) => void;
  aoEquipar: (itemId: string) => void;
  aoFechar: () => void;
}) {
  const [busca, setBusca] = useState('');
  const [indice, setIndice] = useState(0);
  const refInput = useRef<HTMLInputElement>(null);
  useEffect(() => { refInput.current?.focus(); }, []);

  // §285: entrada suave da paleta (Motion System — guard §297 no módulo)
  const refCaixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void animar(refCaixa.current, MOVIMENTOS.aparecer, { duracao: 160, easing: 'ease-out' });
  }, []);

  const comandos = useMemo<ComandoPaleta[]>(() => {
    const termos = normalizar(busca.trim()).split(/\s+/).filter(Boolean);
    const bate = (alvo: string) => !termos.length || termos.every((t) => normalizar(alvo).includes(t));
    const lista: ComandoPaleta[] = [];
    for (const a of acoes) {
      if (bate(a.rotulo)) lista.push({ id: a.id, rotulo: a.rotulo, grupo: 'Ações', executar: a.executar });
    }
    for (const c of categoriasAtivas()) { // §3393: Sobrepeça só com a flag
      const rotulo = `Abrir ${c.nome}`;
      if (bate(rotulo)) lista.push({ id: `nav-${c.id}`, rotulo, grupo: 'Navegação', executar: () => aoNavegar(c.id) });
    }
    if (termos.length) { // equipar só com busca (catálogo tem 374 partes)
      for (const p of PARTES) {
        if (bate(`${p.nome} ${p.tema}`)) {
          lista.push({ id: `eq-${p.id}`, rotulo: `Equipar ${p.nome} · ${RARIDADES[p.raridade].nome}`, grupo: 'Equipar', executar: () => aoEquipar(p.id) });
          if (lista.length > 40) break;
        }
      }
    }
    return lista.slice(0, 40);
  }, [busca, acoes, aoNavegar, aoEquipar]);

  useEffect(() => { setIndice(0); }, [busca]);

  const executar = (c: ComandoPaleta | undefined) => { if (c) { c.executar(); aoFechar(); } };

  return (
    <div className="avst5-detalhe-fundo" role="dialog" aria-modal="true" aria-label="Paleta de comandos">
      <button type="button" className="avst-fpop-fundo" aria-label="Fechar" onClick={aoFechar} />
      <div ref={refCaixa} className="avst5-paleta-cmd" data-teste="paleta-comandos">
        <div className="avst5-cmd-busca">
          <Command size={14} aria-hidden />
          <input ref={refInput} type="text" value={busca} placeholder="Digite um comando, categoria ou item…"
            aria-label="Buscar comando"
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setIndice((i) => Math.min(i + 1, comandos.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setIndice((i) => Math.max(i - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); executar(comandos[indice]); }
              else if (e.key === 'Escape') { aoFechar(); }
            }} />
          <kbd>Esc</kbd>
        </div>
        <ol className="avst5-cmd-lista" role="listbox" aria-label="Comandos">
          {comandos.map((c, i) => (
            <li key={c.id}>
              <button type="button" role="option" aria-selected={i === indice}
                className={i === indice ? 'avst5-cmd-on' : ''}
                onMouseEnter={() => setIndice(i)}
                onClick={() => executar(c)}>
                <em>{c.grupo}</em> <span>{c.rotulo}</span>
                {i === indice && <CornerDownLeft size={12} aria-hidden />}
              </button>
            </li>
          ))}
          {!comandos.length && <li className="avst5-cmd-vazio">Nada encontrado — tente outro termo.</li>}
        </ol>
      </div>
    </div>
  );
}
