// shell/useRota.ts — rota reativa sincronizada com o historico do navegador.
// @version 1.0.0  @created 2026-07-20
import { useCallback, useEffect, useState } from 'react';
import { ehNossoHash, lerRota, navegar, type Rota } from './routing';

export function useRota(): [Rota, (r: Partial<Rota> & { grupo: string; tela: string }, substituir?: boolean) => void] {
  const [rota, setRota] = useState<Rota>(() => lerRota());

  useEffect(() => {
    const aoMudar = (): void => {
      // Se o usuario saiu do painel, o proximo modulo assume — nao mexemos.
      if (!ehNossoHash()) return;
      setRota(lerRota());
    };

    // popstate cobre voltar/avancar; hashchange cobre navegacao por link.
    window.addEventListener('hashchange', aoMudar);
    window.addEventListener('popstate', aoMudar);

    // Estado pode ter mudado entre o primeiro render e o efeito.
    aoMudar();

    return () => {
      window.removeEventListener('hashchange', aoMudar);
      window.removeEventListener('popstate', aoMudar);
    };
  }, []);

  const ir = useCallback(
    (r: Partial<Rota> & { grupo: string; tela: string }, substituir = false) => navegar(r, substituir),
    []
  );

  return [rota, ir];
}
