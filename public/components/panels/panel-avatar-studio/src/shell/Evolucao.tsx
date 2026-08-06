// shell/Evolucao.tsx — drawer EVOLUÇÃO DO AVATAR (lote 181–187 · §241–§246).
// @version 1.0.0  @created 2026-08-05
//
// Linha §241 (primeiro → atual), antes/depois §242 (marco × palco),
// álbum/timeline §243–§244 (grade com origem "tipo git") e memórias §246
// (nota por marco). Aplicar um marco = COMANDO com undo (nunca sobrescreve
// nada sozinho). Tudo local — zero dependência de servidor.
import { useMemo, useState } from 'react';
import { GitBranch, Trash2, X } from 'lucide-react';
import type { AvatarConfig } from '../domain/types';
import { dataUriDe, validarConfig } from '../services/AvatarCatalog';
import {
  ROTULO_ORIGEM, definirNotaMarco, excluirMarco, marcosEvolucao,
} from '../services/Evolucao';
import type { MarcoEvolucao } from '../services/Evolucao';
import { telemetria } from '../services/Telemetria';
import { flag } from '../nucleo/flags'; // lote 481-490 (§244)

const dataCurta = (ms: number): string =>
  new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export function Evolucao({ configAtual, aoAplicar, aoFechar }: {
  configAtual: AvatarConfig;
  aoAplicar: (novo: AvatarConfig) => void;
  aoFechar: () => void;
}) {
  const [tic, setTic] = useState(0);
  const [comparando, setComparando] = useState<MarcoEvolucao | null>(null);
  const [notaDe, setNotaDe] = useState<{ id: string; texto: string } | null>(null);
  const marcos = useMemo(() => marcosEvolucao(), [tic]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmarNota = () => {
    if (notaDe) { definirNotaMarco(notaDe.id, notaDe.texto); setNotaDe(null); setTic((t) => t + 1); }
  };

  return (
    <div className="avst5-detalhe-fundo" role="dialog" aria-modal="true" aria-label="Evolução do avatar">
      <button type="button" className="avst-fpop-fundo" aria-label="Fechar" onClick={aoFechar} />
      <aside className="avst5-detalhe avst5-evolucao" data-teste="evolucao">
        <header className="avst5-det-cab">
          <strong><GitBranch size={14} aria-hidden /> Evolução do avatar</strong>
          <button type="button" className="avst5-painel-btn" title="Fechar" onClick={aoFechar}><X size={14} aria-hidden /></button>
        </header>

        {marcos.length === 0 && (
          <p className="avst5-cons-nota">Ainda sem marcos — cada salvamento com mudança real entra aqui (§241).</p>
        )}

        {/* §242: ANTES E DEPOIS — marco selecionado × palco atual */}
        {comparando && (
          <div className="avst5-evo-comparar" data-teste="evo-comparar">
            <figure>
              <img src={dataUriDe(comparando.config, { estatico: true, tamanho: 132 })} alt="Antes" width={132} height={132} />
              <figcaption>{dataCurta(comparando.quando)} · {ROTULO_ORIGEM[comparando.origem]}</figcaption>
            </figure>
            <span aria-hidden>→</span>
            <figure>
              <img src={dataUriDe(configAtual, { estatico: true, tamanho: 132 })} alt="Agora" width={132} height={132} />
              <figcaption>Agora</figcaption>
            </figure>
            <button type="button" className="avst-botao" onClick={() => setComparando(null)}>Fechar comparação</button>
          </div>
        )}

        {/* §241/§243/§244: linha do tempo "tipo git" com álbum */}
        <ol className="avst5-evo-lista" data-teste="evo-lista">
          {[...marcos].reverse().map((m) => (
            <li key={m.id} className="avst5-evo-marco" data-teste="evo-marco" data-origem={m.origem}>
              <button type="button" className="avst5-evo-thumb" title="Comparar com o avatar atual (§242)"
                data-teste="evo-abrir-comparar" onClick={() => setComparando(m)}>
                <img src={dataUriDe(m.config, { estatico: true, tamanho: 96 })} alt="" width={64} height={64} />
              </button>
              <div className="avst5-evo-info">
                <strong>
                  {/* megas 481-483 (§244, flag as5.memorias_v2): marco de
                      RESTAURAÇÃO é uma bifurcação na linha — marcado */}
                  {flag('as5.memorias_v2') && m.origem === 'restauracao' && (
                    <span className="avst5-evo-branch" data-teste="evo-branch" title="Bifurcação: você voltou a um look anterior e seguiu por outro caminho (§244)">⎇ </span>
                  )}
                  {ROTULO_ORIGEM[m.origem]}
                </strong>
                <time>{dataCurta(m.quando)}</time>
                {notaDe?.id === m.id ? (
                  <input autoFocus value={notaDe.texto} maxLength={80} data-teste="evo-nota-input"
                    placeholder="Memória deste look… (§246)"
                    onChange={(ev) => setNotaDe({ id: m.id, texto: ev.target.value })}
                    onBlur={confirmarNota}
                    onKeyDown={(ev) => { if (ev.key === 'Enter') confirmarNota(); if (ev.key === 'Escape') setNotaDe(null); }} />
                ) : (
                  <button type="button" className="avst5-evo-nota" data-teste="evo-nota"
                    title="Anotar uma memória (§246)"
                    onClick={() => setNotaDe({ id: m.id, texto: m.nota ?? '' })}>
                    {m.nota ?? '+ memória'}
                  </button>
                )}
              </div>
              <span className="avst5-evo-acoes">
                <button type="button" className="avst-botao avst-botao-primario" data-teste="evo-aplicar"
                  title="Trazer este look ao palco (vira comando — Ctrl+Z desfaz)"
                  onClick={() => {
                    aoAplicar(validarConfig(m.config));
                    telemetria('evolucao_aplicou', { origem: m.origem }); // §290
                  }}>Aplicar</button>
                <button type="button" className="avst5-painel-btn" aria-label="Excluir marco"
                  onClick={() => { excluirMarco(m.id); setTic((t) => t + 1); }}><Trash2 size={12} aria-hidden /></button>
              </span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
