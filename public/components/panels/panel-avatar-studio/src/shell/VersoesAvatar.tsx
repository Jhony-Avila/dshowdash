// shell/VersoesAvatar.tsx — TIMELINE de versões do espelho §619
// (lote 141–150). @version 1.0.0  @created 2026-08-04
//
// Lê o espelho (avatar_state_versions): lista versões com origem/resumo/
// data, restaura uma versão (vira COMANDO com undo no shell) e confere a
// CONSISTÊNCIA espelho×local (§629). Espelho fora do ar = aviso honesto,
// nunca quebra (o legado continua mandando na leitura).
import { useEffect, useState } from 'react';
import { History, RefreshCw, X } from 'lucide-react';
import type { EstadoAvatar } from '../nucleo/contratos';
import { checksumEstado } from '../nucleo/contratos';
import { carregarEstado, restaurarVersao } from '../services/EstadoService';
import type { CargaEstado } from '../services/EstadoService';
import { telemetria } from '../services/Telemetria';

export function VersoesAvatar({ estadoLocal, aoAplicarEstado, aoFechar }: {
  estadoLocal: EstadoAvatar;
  aoAplicarEstado: (novo: EstadoAvatar) => void;
  aoFechar: () => void;
}) {
  const [carga, setCarga] = useState<CargaEstado | null | 'erro'>(null);
  const [ocupado, setOcupado] = useState(false);

  const recarregar = () => {
    setCarga(null);
    void carregarEstado().then((c) => setCarga(c ?? 'erro'));
  };
  useEffect(recarregar, []);

  const restaurar = async (versao: number) => {
    setOcupado(true);
    try {
      const r = await restaurarVersao(versao);
      if (!r.ok) return;
      const nova = await carregarEstado();
      if (nova?.estado) {
        aoAplicarEstado(nova.estado); // vira comando com undo no shell
        telemetria('estado619_restaurou', { versao }); // §290
      }
      setCarga(nova ?? 'erro');
    } finally { setOcupado(false); }
  };

  // §629: consistência espelho × local (informativa, nunca bloqueia)
  const consistencia = carga && carga !== 'erro' && carga.checksum
    ? (carga.checksum === checksumEstado(estadoLocal) ? 'em dia' : 'diverge do palco (normal com edições não salvas)')
    : null;

  return (
    <div className="avst5-detalhe-fundo" role="dialog" aria-modal="true" aria-label="Versões do avatar">
      <button type="button" className="avst-fpop-fundo" aria-label="Fechar" onClick={aoFechar} />
      <aside className="avst5-detalhe avst5-versoes" data-teste="versoes-619">
        <header className="avst5-det-cab">
          <strong><History size={14} aria-hidden /> Versões do avatar (§619)</strong>
          <span>
            <button type="button" className="avst5-painel-btn" title="Recarregar" onClick={recarregar}>
              <RefreshCw size={13} aria-hidden /></button>
            <button type="button" className="avst5-painel-btn" title="Fechar" onClick={aoFechar}>
              <X size={14} aria-hidden /></button>
          </span>
        </header>
        {carga === null && <p className="avst5-cons-nota">Consultando o espelho…</p>}
        {carga === 'erro' && (
          <p className="avst5-cons-nota" data-teste="versoes-indisponivel">
            Espelho §619 indisponível agora — suas versões continuam guardadas no caminho clássico.
          </p>
        )}
        {carga !== null && carga !== 'erro' && (<>
          {consistencia && (
            <p className="avst5-cons-nota" data-teste="versoes-consistencia">Consistência §629: {consistencia}.</p>
          )}
          {carga.versoes.length === 0 && (
            <p className="avst5-cons-nota">Ainda sem versões no espelho — salve o avatar e a primeira aparece aqui.</p>
          )}
          <ol className="avst5-versoes-lista" data-teste="versoes-lista">
            {carga.versoes.map((v) => (
              <li key={v.version_number}>
                <div>
                  <strong>v{v.version_number}</strong>
                  {v.is_published ? <em className="avst5-versoes-pub">publicada</em> : null}
                  <span>{v.change_summary ?? v.source}</span>
                  <time>{new Date(v.created_at.replace(' ', 'T')).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
                </div>
                <button type="button" className="avst-botao" disabled={ocupado}
                  data-teste="versao-restaurar"
                  title="Traz esta versão para o palco (vira comando — Ctrl+Z desfaz)"
                  onClick={() => void restaurar(v.version_number)}>
                  Restaurar
                </button>
              </li>
            ))}
          </ol>
        </>)}
      </aside>
    </div>
  );
}
