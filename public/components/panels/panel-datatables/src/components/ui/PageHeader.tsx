// components/ui/PageHeader.tsx — cabeçalho ÚNICO de página (Elevação visual §1).
// @version 1.1.0  @updated 2026-07-20
// Estrutura alinhada: breadcrumb em linha própria no topo; abaixo, o título
// (ícone + título grande + subtítulo) e as ações na MESMA linha, centradas
// verticalmente — as ações deixam de flutuar na altura do breadcrumb.
import { type JSX, type ReactNode } from 'react';
import { Icone } from './Icone';
import { fmtRelativo } from '../../lib/format';
import css from './PageHeader.module.css';

export interface Miolo { label: string; icone?: string }

export function PageHeader({
  trilha, titulo, subtitulo, icone, ambiente, atualizadoEm, atualizando, aoAtualizar, acoes,
}: {
  trilha: Miolo[]; titulo: string; subtitulo?: string; icone?: string;
  ambiente?: { label: string; cor?: string | null };
  atualizadoEm?: number | null; atualizando?: boolean; aoAtualizar?: () => void; acoes?: ReactNode;
}): JSX.Element {
  return (
    <header className={css.raiz}>
      <nav className={css.trilha} aria-label="Caminho">
        {trilha.map((m, i) => (
          <span key={i} className={css.trilhaItem}>
            {i > 0 && <Icone nome="ChevronRight" size={12} className={css.sep} />}
            {m.icone && <Icone nome={m.icone} size={12} />}
            <span className={i === trilha.length - 1 ? css.trilhaAtual : undefined}>{m.label}</span>
          </span>
        ))}
      </nav>

      <div className={css.linha}>
        <div className={css.tituloLinha}>
          {icone && <span className={css.icone}><Icone nome={icone} size={20} /></span>}
          <div className={css.tituloBloco}>
            <h1 className={css.titulo}>{titulo}</h1>
            {subtitulo && <p className={css.subtitulo}>{subtitulo}</p>}
          </div>
        </div>

        <div className={css.dir}>
          {ambiente && (
            <span className={css.ambiente} title={`Ambiente: ${ambiente.label}`}
                  style={{ ['--amb' as string]: ambiente.cor ?? 'var(--dt-info)' }}>
              <span className={css.ambienteDot} aria-hidden="true" />
              {ambiente.label}
            </span>
          )}
          {atualizadoEm !== undefined && (
            <span className={css.atualizado} title="Última atualização dos dados em tela">
              <Icone nome="Clock" size={12} />
              {atualizadoEm ? fmtRelativo(new Date(atualizadoEm).toISOString()) : '—'}
            </span>
          )}
          {acoes}
          {aoAtualizar && (
            <button type="button" className={css.atualizar} onClick={aoAtualizar} disabled={atualizando}>
              <Icone nome="RefreshCw" size={13} className={atualizando ? css.girando : undefined} />
              Atualizar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
