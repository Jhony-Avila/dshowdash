// shell/HistoricoSessao.tsx — HISTÓRICO GRANULAR da sessão (§138/§203).
// @version 1.1.0  @created 2026-07-31  (AS5 F4)
//
// Timeline das ações desta sessão, alimentada pelos NOMES dos comandos do
// AvatarStore (bus §606.1). O REGISTRO vive no ShellStudio (useHistoricoSessao,
// assinado na montagem do shell — a timeline não perde ações executadas
// antes de a aba Equipados abrir); este componente só APRESENTA.
// "Voltar até aqui" = desfazer/refazer N vezes; desfazer não apaga a
// timeline (§138: "restaurar ponto").
import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import type { AvatarStore } from '../nucleo/estado';

export interface EntradaHistorico { nome: string; hora: string; }

/** Hook do REGISTRO — chamado no ShellStudio (vive a sessão inteira). */
export function useHistoricoSessao(store: AvatarStore): {
  entradas: EntradaHistorico[]; posicao: number; irPara: (alvo: number) => void;
} {
  const [entradas, setEntradas] = useState<EntradaHistorico[]>([]);
  const [posicao, setPosicao] = useState(0); // nº de comandos APLICADOS agora

  useEffect(() => {
    const paraExec = store.bus.em('comando:executado', (d) => {
      const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setPosicao((pos) => {
        // comando novo após desfazer TRUNCA o futuro (mesma regra da pilha)
        setEntradas((e) => [...e.slice(0, pos), { nome: d.nome, hora }]);
        return pos + 1;
      });
    });
    const paraUndo = store.bus.em('comando:desfeito', () => setPosicao((p) => Math.max(0, p - 1)));
    const paraRedo = store.bus.em('comando:refeito', () => setPosicao((p) => p + 1));
    return () => { paraExec(); paraUndo(); paraRedo(); };
  }, [store]);

  const irPara = (alvo: number) => {
    const delta = alvo - posicao;
    for (let i = 0; i < -delta; i++) store.desfazer();
    for (let i = 0; i < delta; i++) store.refazer();
  };

  return { entradas, posicao, irPara };
}

const ROTULOS: Record<string, string> = {
  base: 'Base trocada', cabelo: 'Cabelo trocado', olhos: 'Olhos trocados',
  boca: 'Boca trocada', roupa: 'Roupa trocada', fundo: 'Fundo trocado',
  moldura: 'Moldura trocada', efeito: 'Efeito trocado', aura: 'Aura trocada',
  banner: 'Banner trocado', emblema: 'Emblema trocado', config: 'Ajuste aplicado',
};

function rotulo(nomeComando: string): string {
  const alvo = nomeComando.replace(/^equipar:/, '');
  if (alvo.startsWith('acessorio')) return 'Acessório trocado';
  return ROTULOS[alvo] ?? `Alteração: ${alvo}`;
}

export function HistoricoSessao({ entradas, posicao, irPara }: {
  entradas: EntradaHistorico[]; posicao: number; irPara: (alvo: number) => void;
}) {
  if (!entradas.length) return null;

  return (
    <section className="avst5-historico" aria-label="Histórico da sessão">
      <h4 className="avst5-props-titulo"><History size={13} aria-hidden /> Histórico da sessão</h4>
      <ol className="avst5-hist-lista">
        <li>
          <button type="button" className={posicao === 0 ? 'avst5-hist-on' : ''}
            onClick={() => irPara(0)}>
            <span>Início da sessão</span>
          </button>
        </li>
        {entradas.map((e, i) => (
          <li key={`${i}-${e.nome}`}>
            <button type="button" className={posicao === i + 1 ? 'avst5-hist-on' : ''}
              title="Voltar até aqui" onClick={() => irPara(i + 1)}>
              <em>{e.hora}</em> <span>{rotulo(e.nome)}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
