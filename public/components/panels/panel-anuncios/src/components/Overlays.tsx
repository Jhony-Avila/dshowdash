// components/Overlays.tsx — Drawer de fontes (painel lateral direito) e
// Command Palette (Ctrl+K) do workspace.
// @version 1.0.0  @created 2026-07-28
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BookMarked, Search, X } from 'lucide-react';
import { rotuloDominio } from './Resposta';
import type { Unidade } from '../shell/types';

// ── Drawer de fontes ────────────────────────────────────────────────

export function FonteDrawer({ unidade, onFechar }: {
  unidade: Unidade | null;
  onFechar: () => void;
}) {
  if (!unidade) return null;
  const s = unidade.source;
  return (
    <>
      <div className="anx-overlay" onClick={onFechar} aria-hidden />
      <aside className="anx-drawer" role="dialog" aria-label="Fonte da metodologia">
        <div className="anx-drawer-head">
          <span className="anx-drawer-titulo">
            <BookMarked size={15} aria-hidden /> Fonte da metodologia
          </span>
          <button className="anx-side-ic" onClick={onFechar} title="Fechar (Esc)"><X size={15} /></button>
        </div>
        <div className="anx-drawer-body">
          <div className="anx-drawer-badges">
            <span className="anx-badge anx-badge-dom">{rotuloDominio(unidade.domain)}</span>
            {unidade.segment && <span className="anx-badge anx-badge-seg">{unidade.segment}</span>}
            <span className="anx-badge">Fase {s.logical_phase} · Pergunta {s.question_number}</span>
            <span className="anx-badge" title="Grau de autoridade da fonte">
              {unidade.authority === 'official_methodology' ? 'Metodologia oficial' : unidade.authority}
            </span>
          </div>
          <h3 className="anx-drawer-q">{unidade.question}</h3>
          <p className="anx-drawer-a">{unidade.answer}</p>
          {unidade.operational_rule && (
            <div className="anx-callout anx-callout-regra">
              <BookMarked size={15} aria-hidden />
              <div><strong>Regra operacional:</strong> {unidade.operational_rule}</div>
            </div>
          )}
          {unidade.final_rule && (
            <div className="anx-callout anx-callout-regra">
              <BookMarked size={15} aria-hidden />
              <div><strong>Regra final:</strong> {unidade.final_rule}</div>
            </div>
          )}
          <p className="anx-unit-origin">
            Origem: {s.file} (linhas {s.line_start}–{s.line_end})<br />
            ID <code>{unidade.id}</code>
          </p>
        </div>
      </aside>
    </>
  );
}

// ── Command Palette (Ctrl+K) ────────────────────────────────────────

export interface AcaoPalette {
  id: string;
  rotulo: string;
  dica?: string;
  icone?: ReactNode;
  executar: () => void;
}

export function CommandPalette({ aberta, onFechar, acoes }: {
  aberta: boolean;
  onFechar: () => void;
  acoes: AcaoPalette[];
}) {
  const [filtro, setFiltro] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberta) { setFiltro(''); window.setTimeout(() => inputRef.current?.focus(), 30); }
  }, [aberta]);

  const visiveis = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return acoes;
    return acoes.filter((a) => a.rotulo.toLowerCase().includes(f) || (a.dica ?? '').toLowerCase().includes(f));
  }, [filtro, acoes]);

  if (!aberta) return null;

  return (
    <>
      <div className="anx-overlay" onClick={onFechar} aria-hidden />
      <div className="anx-palette" role="dialog" aria-label="Paleta de comandos">
        <div className="anx-palette-input">
          <Search size={15} aria-hidden />
          <input ref={inputRef} value={filtro} placeholder="O que você quer fazer?"
            onChange={(e) => setFiltro(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && visiveis[0]) { visiveis[0].executar(); onFechar(); }
              if (e.key === 'Escape') onFechar();
            }} />
          <kbd>Esc</kbd>
        </div>
        <div className="anx-palette-lista">
          {visiveis.length === 0 && <div className="anx-side-vazio">Nenhum comando encontrado.</div>}
          {visiveis.map((a) => (
            <button key={a.id} className="anx-palette-item"
              onClick={() => { a.executar(); onFechar(); }}>
              {a.icone}
              <span className="anx-palette-rotulo">{a.rotulo}</span>
              {a.dica && <span className="anx-palette-dica">{a.dica}</span>}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
