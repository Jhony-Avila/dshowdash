// shell/BarraSalvamento.tsx — barra FIXA de salvamento do shell (P1 §15).
// @version 0.1.0  @created 2026-07-31
// 4 estados: tudo salvo / alterações / salvando / erro — alimentados pelo
// AvatarStore (nunca pelo scroll ou pelo tamanho do avatar).
import { useState, useSyncExternalStore } from 'react';
import { Check, LoaderCircle, RotateCcw, Save, TriangleAlert } from 'lucide-react';
import type { AvatarStore } from '../nucleo/estado';

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

  const salvar = async () => {
    setFase('salvando');
    const ok = await aoSalvar();
    if (ok) {
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
  return (
    <div className="avst5-salvar avst5-salvar-pendente" role="status">
      <span>{alteradas.length} alteração(ões): <strong>{alteradas.slice(0, 4).join(', ')}{alteradas.length > 4 ? '…' : ''}</strong></span>
      <button type="button" className="avst-botao" onClick={() => store.descartarDraft()}>
        <RotateCcw size={13} aria-hidden /> Descartar
      </button>
      <button type="button" className="avst-botao avst-botao-primario" onClick={() => void salvar()}>
        <Save size={13} aria-hidden /> Salvar
      </button>
    </div>
  );
}
