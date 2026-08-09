// shell/BarraSalvamento.tsx — barra FIXA de salvamento do shell (P1 §15).
// @version 0.1.0  @created 2026-07-31
// 4 estados: tudo salvo / alterações / salvando / erro — alimentados pelo
// AvatarStore (nunca pelo scroll ou pelo tamanho do avatar).
//
// lote 961–970 (AS6 §350/§322, flag as6.diff_v6 — decisão #98): o
// resumo grosso ganha um "ver detalhes" com o DIFF campo a campo
// legível (nomes do catálogo, de → para) + histórico dos últimos
// salvamentos (ring local). Off = barra anterior byte a byte.
import { useState, useSyncExternalStore } from 'react';
import { Check, ListTree, LoaderCircle, RotateCcw, Save, TriangleAlert } from 'lucide-react';
import type { AvatarStore } from '../nucleo/estado';
import { paraLegado2d } from '../nucleo/adaptadores';
import { validarConfig } from '../services/AvatarCatalog';
import { diffCampos, gravarHistoricoDiff, lerHistoricoDiff } from '../workspace/diff';
import { flag } from '../nucleo/flags';
import { t } from '../nucleo/i18n';

/** P1 §15: quais domínios/slots mudaram entre persistido e draft. */
function categoriasAlteradas(store: AvatarStore): string[] {
  const a = store.estadoPersistido;
  const b = store.estadoDraft;
  const mudou = new Set<string>();
  if (a.body.base !== b.body.base) mudou.add('base');
  const slots = new Set([...Object.keys(a.equipment), ...Object.keys(b.equipment)]);
  for (const s of slots) {
    if ((a.equipment as Record<string, string>)[s] !== (b.equipment as Record<string, string>)[s]) {
      mudou.add(s.startsWith('acessorio') ? 'acessório' : s);
    }
  }
  if (JSON.stringify(a.appearance.cores) !== JSON.stringify(b.appearance.cores)) mudou.add('cores');
  return [...mudou];
}

export function BarraSalvamento({ store, aoSalvar }: {
  store: AvatarStore;
  aoSalvar: () => Promise<boolean>;
}) {
  useSyncExternalStore(store.assinar, () => store.estadoDraft);
  const [fase, setFase] = useState<'ocioso' | 'salvando' | 'erro'>('ocioso');
  const [salvoEm, setSalvoEm] = useState<string | null>(null);
  const [detalhes, setDetalhes] = useState(false); // §350 (as6.diff_v6)
  const temDiff = flag('as6.diff_v6');

  const salvar = async () => {
    // §350: o diff é computado ANTES do save (depois o persistido muda)
    const diffs = temDiff
      ? diffCampos(validarConfig(paraLegado2d(store.estadoPersistido)), validarConfig(paraLegado2d(store.estadoDraft)))
      : [];
    setFase('salvando');
    setDetalhes(false);
    const ok = await aoSalvar();
    if (ok) {
      if (temDiff) gravarHistoricoDiff(diffs); // histórico local (ring ≤10)
      setFase('ocioso');
      setSalvoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } else setFase('erro');
  };

  if (fase === 'salvando') {
    return (
      <div className="avst5-salvar" role="status">
        <LoaderCircle size={14} className="avst-girando" aria-hidden /> Salvando…
      </div>
    );
  }
  if (fase === 'erro') {
    return (
      <div className="avst5-salvar avst5-salvar-erro" role="alert">
        <TriangleAlert size={14} aria-hidden /> Não foi possível salvar.
        <button type="button" className="avst-botao" onClick={() => void salvar()}>Tentar de novo</button>
      </div>
    );
  }
  if (!store.temMudancas) {
    return (
      <div className="avst5-salvar" role="status">
        <Check size={14} aria-hidden /> Tudo salvo{salvoEm ? ` · ${salvoEm}` : ''}
      </div>
    );
  }
  const alteradas = categoriasAlteradas(store);
  const diffs = temDiff && detalhes
    ? diffCampos(validarConfig(paraLegado2d(store.estadoPersistido)), validarConfig(paraLegado2d(store.estadoDraft)))
    : [];
  const historico = temDiff && detalhes ? lerHistoricoDiff() : [];
  return (
    <div className="avst5-salvar avst5-salvar-pendente" role="status">
      <span>{alteradas.length} alteração(ões): <strong>{alteradas.slice(0, 4).join(', ')}{alteradas.length > 4 ? '…' : ''}</strong></span>
      {temDiff && (
        <button type="button" className="avst-botao" data-teste="diff-abrir"
          aria-expanded={detalhes} title="O que mudou, campo a campo (§350)"
          onClick={() => setDetalhes((v) => !v)}>
          <ListTree size={13} aria-hidden /> {t('Detalhes')}
        </button>
      )}
      <button type="button" className="avst-botao" onClick={() => store.descartarDraft()}>
        <RotateCcw size={13} aria-hidden /> Descartar
      </button>
      <button type="button" className="avst-botao avst-botao-primario" onClick={() => void salvar()}>
        <Save size={13} aria-hidden /> Salvar
      </button>
      {temDiff && detalhes && (
        /* §350: diff campo a campo, legível — popover acima da barra */
        <div className="avst6-diff" role="dialog" aria-label="O que mudou (§350)" data-teste="diff-painel">
          <strong className="avst6-diff-titulo">{t('O que mudou')}</strong>
          <ul className="avst6-diff-lista">
            {diffs.map((x) => (
              <li key={`${x.campo}:${x.para}`} data-teste="diff-linha" data-tipo={x.tipo}>
                <span className="avst6-diff-campo">{x.campo}</span>
                <span className="avst6-diff-valor">{x.de} → <strong>{x.para}</strong></span>
              </li>
            ))}
          </ul>
          {historico.length > 0 && (
            <div className="avst6-diff-hist" data-teste="diff-historico">
              <strong className="avst6-diff-titulo">{t('Salvamentos anteriores')}</strong>
              {historico.slice(-3).reverse().map((h) => (
                <div key={h.em} className="avst6-diff-hist-item">
                  <span>{new Date(h.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {h.total} mudança(s)</span>
                  <span className="avst6-diff-valor">{h.resumo.slice(0, 2).join(' · ')}{h.total > 2 ? '…' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
