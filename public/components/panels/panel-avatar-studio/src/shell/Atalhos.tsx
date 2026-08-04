// shell/Atalhos.tsx — CHEAT-SHEET de atalhos do estúdio (AS5 · mega 37).
// @version 1.0.0  @created 2026-08-04
//
// §548/§583: a tecla "?" abre um overlay acessível com TODOS os atalhos
// (2D + palco 3D), agrupados. Esc fecha; role=dialog; lista data-driven —
// atalho novo entra AQUI e aparece sozinho na folha.
import { useEffect, useRef } from 'react';
import { Keyboard } from 'lucide-react';
import { MOVIMENTOS, animar } from './movimento';

interface GrupoAtalhos {
  grupo: string;
  itens: Array<{ teclas: string[]; faz: string }>;
}

export const ATALHOS: GrupoAtalhos[] = [
  {
    grupo: 'Geral',
    itens: [
      { teclas: ['Ctrl', 'K'], faz: 'Paleta de comandos (§566)' },
      { teclas: ['Ctrl', 'Z'], faz: 'Desfazer' },
      { teclas: ['Ctrl', 'Shift', 'Z'], faz: 'Refazer' },
      { teclas: ['?'], faz: 'Esta folha de atalhos' },
      { teclas: ['Esc'], faz: 'Fecha overlays / volta ao modo edição' },
    ],
  },
  {
    grupo: 'Palco',
    itens: [
      { teclas: ['V'], faz: 'Segurar: compara com o último salvo (§65)' },
      { teclas: ['F'], faz: 'Modo foco' },
      { teclas: ['S'], faz: 'Modo studio' },
    ],
  },
  {
    grupo: 'Palco 3D',
    itens: [
      { teclas: ['P'], faz: 'Apresentar (showcase §174)' },
      { teclas: ['R'], faz: 'Gravar o showcase em WebM (§174.2)' },
      { teclas: ['C'], faz: 'Capturar PNG 960 (§174.1)' },
      { teclas: ['Espaço'], faz: 'Congelar / retomar a pose' },
      { teclas: ['Esc'], faz: 'Sai da tela cheia' },
    ],
  },
];

export function Atalhos({ aoFechar }: { aoFechar: () => void }) {
  const refCaixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void animar(refCaixa.current, MOVIMENTOS.aparecer, { duracao: 160, easing: 'ease-out' });
    const aoEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); };
    window.addEventListener('keydown', aoEsc);
    return () => window.removeEventListener('keydown', aoEsc);
  }, [aoFechar]);

  return (
    <div className="avst5-detalhe-fundo" role="dialog" aria-modal="true" aria-label="Atalhos do teclado">
      <button type="button" className="avst-fpop-fundo" aria-label="Fechar" onClick={aoFechar} />
      <div ref={refCaixa} className="avst5-atalhos" data-teste="atalhos">
        <h3><Keyboard size={15} aria-hidden /> Atalhos do estúdio</h3>
        <div className="avst5-atalhos-grupos">
          {ATALHOS.map((g) => (
            <section key={g.grupo} aria-label={g.grupo}>
              <h4>{g.grupo}</h4>
              <ul>
                {g.itens.map((i) => (
                  <li key={`${g.grupo}-${i.faz}`}>
                    <span className="avst5-atalhos-teclas">
                      {i.teclas.map((t) => <kbd key={t}>{t}</kbd>)}
                    </span>
                    <span>{i.faz}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="avst5-atalhos-nota">Esc fecha esta folha.</p>
      </div>
    </div>
  );
}
