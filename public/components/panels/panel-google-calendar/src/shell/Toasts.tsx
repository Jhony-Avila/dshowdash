// shell/Toasts.tsx — avisos efêmeros (§60).
// @version 1.0.0  @created 2026-07-30
//
// Existe por causa da atualização otimista: quando o evento se move na tela
// ANTES de o servidor confirmar, o usuário precisa saber que (a) está salvando,
// (b) salvou, ou (c) voltou ao lugar porque falhou. Sem esse retorno, a
// atualização otimista vira mentira silenciosa — que é pior do que esperar.
//
// `role="status"` + `aria-live="polite"` para que leitor de tela anuncie sem
// roubar o foco (§80).
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icone } from './Icone';

export type TomToast = 'ok' | 'erro' | 'info' | 'salvando';

interface Toast {
  id: number;
  tom: TomToast;
  texto: string;
  acao?: { rotulo: string; onClick: () => void };
}

interface Ctx {
  mostrar: (tom: TomToast, texto: string, acao?: Toast['acao']) => number;
  fechar: (id: number) => void;
}

const ToastCtx = createContext<Ctx | null>(null);

const DURACAO: Record<TomToast, number> = {
  ok: 2600,
  info: 3400,
  erro: 7000,        // erro fica mais tempo: costuma vir com ação de desfazer
  salvando: 0,       // 0 = não some sozinho; quem abriu fecha
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<Toast[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const fechar = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
    setItens((l) => l.filter((x) => x.id !== id));
  }, []);

  const mostrar = useCallback((tom: TomToast, texto: string, acao?: Toast['acao']) => {
    const id = ++seq.current;
    setItens((l) => [...l.slice(-3), { id, tom, texto, acao }]);
    const ms = DURACAO[tom];
    if (ms > 0) {
      timers.current.set(id, setTimeout(() => fechar(id), ms));
    }
    return id;
  }, [fechar]);

  const valor = useMemo(() => ({ mostrar, fechar }), [mostrar, fechar]);

  return (
    <ToastCtx.Provider value={valor}>
      {children}
      <div className="gc-toasts" role="status" aria-live="polite" aria-atomic="false">
        {itens.map((t) => (
          <div key={t.id} className={`gc-toast gc-toast-${t.tom}`}>
            <span className="gc-toast-icone">
              {t.tom === 'salvando'
                ? <Icone nome="refresh" tamanho={14} className="gc-girando" />
                : <Icone nome={t.tom === 'ok' ? 'check' : t.tom === 'erro' ? 'alerta' : 'info'} tamanho={14} />}
            </span>
            <span className="gc-toast-texto">{t.texto}</span>
            {t.acao && (
              <button type="button" className="gc-toast-acao"
                      onClick={() => { t.acao!.onClick(); fechar(t.id); }}>
                {t.acao.rotulo}
              </button>
            )}
            <button type="button" className="gc-toast-x" onClick={() => fechar(t.id)}
                    aria-label="Fechar aviso"><Icone nome="x" tamanho={12} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const c = useContext(ToastCtx);
  if (!c) throw new Error('useToast fora de ToastProvider');
  return c;
}
