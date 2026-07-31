// shell/atalhos.ts — atalhos de teclado do módulo (§80).
// @version 1.0.0  @created 2026-07-30
//
// Arrastar não é acessível; o §80 pede alternativa por teclado. Isto cobre a
// navegação e as ações; mover evento sem mouse se faz pelo drawer.
//
// REGRA QUE EVITA O BUG CLÁSSICO: atalho de tecla única não pode disparar
// enquanto o usuário digita. Sem essa guarda, escrever "Nova reunião" no campo
// de título troca de tela no "n" e o texto se perde. Também ignoramos quando há
// modificador (Ctrl/Cmd/Alt), para não roubar atalho do navegador nem o Ctrl+K
// da paleta global.
import { useEffect } from 'react';

export interface AcoesAtalho {
  irPara: (rota: 'hoje' | 'agenda' | 'proximos' | 'convites' | 'conflitos') => void;
  novoEvento: () => void;
  focarBusca: () => void;
  atualizar: () => void;
  fechar: () => void;
  alternarSidebar: () => void;
}

function digitando(alvo: EventTarget | null): boolean {
  const el = alvo as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function useAtalhos(acoes: AcoesAtalho, ativo = true) {
  useEffect(() => {
    if (!ativo) return;

    function aoTeclar(e: KeyboardEvent) {
      // Esc funciona SEMPRE, inclusive digitando: é a saída de emergência.
      if (e.key === 'Escape') { acoes.fechar(); return; }

      if (digitando(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case 't': acoes.irPara('hoje'); break;
        case 'a': acoes.irPara('agenda'); break;
        case 'l': acoes.irPara('proximos'); break;
        case 'c': acoes.irPara('convites'); break;
        case 'x': acoes.irPara('conflitos'); break;
        case 'n': e.preventDefault(); acoes.novoEvento(); break;
        case 'r': acoes.atualizar(); break;
        case 'b': acoes.alternarSidebar(); break;
        case '/': e.preventDefault(); acoes.focarBusca(); break;
        default: return;
      }
    }

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [acoes, ativo]);
}

/** Lista para a tela de Configurações e para o title do botão de ajuda. */
export const ATALHOS: Array<{ tecla: string; descricao: string }> = [
  { tecla: 'T', descricao: 'Ir para Hoje' },
  { tecla: 'A', descricao: 'Ir para a Agenda' },
  { tecla: 'L', descricao: 'Ir para a lista de Próximos' },
  { tecla: 'C', descricao: 'Ir para Convites' },
  { tecla: 'X', descricao: 'Ir para Conflitos' },
  { tecla: 'N', descricao: 'Novo evento' },
  { tecla: 'R', descricao: 'Atualizar os dados' },
  { tecla: 'B', descricao: 'Recolher/expandir o menu' },
  { tecla: '/', descricao: 'Focar a busca' },
  { tecla: 'Esc', descricao: 'Fechar painel, drawer ou modal' },
];
