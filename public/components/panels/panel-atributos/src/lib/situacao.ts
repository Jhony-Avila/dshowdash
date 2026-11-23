// FICHA V3 · situação de cada atributo (briefing do Jhony, item 7). Regra PURA, sem tela.
// - "Pendente" = vazio DE VERDADE: sem linha de valor, ou estado "informado" sem conteúdo PARA AQUELE TIPO. Zero (número/inteiro) e falso
//   (booleano) são valores válidos, nunca "vazio". Texto só com espaços é vazio.
// - Estados gravados continuam o que são: "nao_se_aplica" e "desconhecido" são RESPOSTAS (não são pendência e não são reinterpretados).
// - Obrigatoriedade é outra coisa: o filtro "Obrigatórios pendentes" continua vindo do servidor (completude.obrigatorios_vazios).
import type { ItemFicha } from './tipos';

export type Situacao = 'pendente' | 'preenchido' | 'nao_se_aplica' | 'desconhecido';

export function vazioDeVerdade(i: Pick<ItemFicha, 'tipo' | 'valor'>): boolean {
  const v = i.valor;
  if (!v) return true;
  if (v.estado !== 'informado') return false;
  switch (i.tipo) {
    case 'numero': case 'inteiro': return v.numero === null || v.numero === undefined || String(v.numero).trim() === '';
    case 'booleano': return v.booleano === null || v.booleano === undefined;
    case 'data': return !v.data;
    case 'opcao': case 'multiopcao': return !(v.opcao_ids ?? []).length;
    default: return v.texto === null || v.texto === undefined || String(v.texto).trim() === '';
  }
}

export function situacaoDe(i: Pick<ItemFicha, 'tipo' | 'valor'>): Situacao {
  if (i.valor && i.valor.estado === 'nao_se_aplica') return 'nao_se_aplica';
  if (i.valor && i.valor.estado === 'desconhecido') return 'desconhecido';
  return vazioDeVerdade(i) ? 'pendente' : 'preenchido';
}

export const ROTULO_SITUACAO: Record<Situacao, string> = { pendente: 'Pendente', preenchido: 'Preenchido', nao_se_aplica: 'Não se aplica', desconhecido: 'Desconhecido' };
