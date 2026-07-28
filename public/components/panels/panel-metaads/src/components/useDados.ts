// components/useDados.ts — hook padrão de carregamento via serviço.
// @version 1.0.0  @created 2026-07-28
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDados<T>(carregar: () => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const seq = useRef(0);

  const executar = useCallback(() => {
    const id = ++seq.current;
    setCarregando(true); setErro(false);
    carregar()
      .then((r) => { if (id === seq.current) { setDados(r); setCarregando(false); } })
      .catch(() => { if (id === seq.current) { setErro(true); setCarregando(false); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { executar(); }, [executar]);

  return { dados, carregando, erro, recarregar: executar };
}
