// poc3d/Estudio3DPonteVC.tsx — PONTE: monta o VisualComposer3D compartilhado a
// partir de qualquer contexto que antes abria o Estudio3D legado (App/MaisPainel).
// Auto-contida: histórico Config3D próprio (undo/redo), bridge de cor de destaque
// e um store-shim que só encaminha confirmarPersistencia -> aoSalvar. Sem estado 2D
// (config2d/aplicar2d omitidos): as ferramentas 2D do "Mais" que exigem config
// simplesmente não aparecem — o objetivo é o mesmo palco 3D limpo, unificado.
import { Suspense, lazy, useCallback, useRef, useState } from 'react';
import { CONFIG3D_PADRAO } from './catalogo3d';
import type { Config3D } from './catalogo3d';
import type { AvatarStore } from '../nucleo/estado';

const VC3D = lazy(() => import('../vc/VisualComposer3D'));

export function Estudio3DPonteVC({ corDestaque, versaoBase = 0, aoSalvar }: {
  corDestaque?: string; versaoBase?: number; aoSalvar?: (versao: number) => void;
}) {
  const hist = useRef<{ pilha: Config3D[]; i: number }>({
    pilha: [{ ...CONFIG3D_PADRAO, cores: { ...CONFIG3D_PADRAO.cores, detalhe: corDestaque ?? CONFIG3D_PADRAO.cores.detalhe } }],
    i: 0,
  });
  const [, tick] = useState(0);
  const c = hist.current.pilha[hist.current.i];
  const mudar = useCallback((n: Config3D) => {
    const h = hist.current; h.pilha = h.pilha.slice(0, h.i + 1); h.pilha.push(n); h.i = h.pilha.length - 1; tick((v) => v + 1);
  }, []);
  const desfazer = useCallback(() => { const h = hist.current; if (h.i > 0) { h.i -= 1; tick((v) => v + 1); } }, []);
  const refazer = useCallback(() => { const h = hist.current; if (h.i < h.pilha.length - 1) { h.i += 1; tick((v) => v + 1); } }, []);
  const shim = useRef({ confirmarPersistencia: (nv: number) => { try { aoSalvar?.(nv); } catch { /* ok */ } } }).current as unknown as AvatarStore;
  return (
    <Suspense fallback={<div className="vc3d-carregando" role="status">Carregando…</div>}>
      <VC3D store={shim} config3d={c} aoMudar3d={mudar}
        podeDesfazer={hist.current.i > 0} podeRefazer={hist.current.i < hist.current.pilha.length - 1}
        desfazer={desfazer} refazer={refazer} versaoBase={versaoBase} aoVoltar2D={() => { /* saída pela navegação do container */ }} />
    </Suspense>
  );
}
