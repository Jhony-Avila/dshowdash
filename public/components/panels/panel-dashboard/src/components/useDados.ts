// components/useDados.ts — hook padrão de carregamento via serviço.
// @version 3.0.0 — atualização preserva os dados anteriores (briefing §29.2):
//   `carregando` = só a PRIMEIRA carga (skeleton); `atualizando` = recargas.
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDados<T>(carregar: () => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(false);
  const seq = useRef(0);
  const temDados = useRef(false);

  const executar = useCallback(() => {
    const id = ++seq.current;
    if (temDados.current) setAtualizando(true); else setCarregando(true);
    setErro(false);
    carregar()
      .then((r) => {
        if (id !== seq.current) return;
        temDados.current = true;
        setDados(r); setCarregando(false); setAtualizando(false);
      })
      .catch(() => {
        if (id !== seq.current) return;
        setErro(true); setCarregando(false); setAtualizando(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { executar(); }, [executar]);

  return { dados, carregando, atualizando, erro, recarregar: executar };
}
