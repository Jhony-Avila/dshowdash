// services/ValidadorIA.ts — validação de SUGESTÃO DE IA (briefing §636, AS5 F8).
// @version 1.0.0  @created 2026-07-31
//
// "A IA não poderá inventar IDs inexistentes." — toda sugestão passa por
// asset → categoria → disponibilidade/permissão → compatibilidade, e o
// resultado carrega um RELATÓRIO do que caiu e POR QUÊ (transparência: a
// UI conta ao usuário o que foi ajustado; a telemetria audita o provedor).
// O validarConfig continua sendo a rede final (defesa em profundidade) —
// aqui a diferença é a OBSERVABILIDADE das rejeições, que ele não dá.
import type { AvatarConfig } from '../domain/types';
import { CONFIG_PADRAO, itemPorId, validarConfig } from './AvatarCatalog';

export type MotivoRejeicao =
  | 'id_inexistente'          // §636: IA inventou — nunca entra
  | 'categoria_incompativel'  // id real, mas no slot errado
  | 'bloqueado'               // existe, mas o usuário ainda não desbloqueou
  | 'incompativel_com_base'   // requerBase não bate com a base final
  | 'conflito';               // incompativelCom outro item aceito

export interface ItemRejeitado {
  id: string;
  slot: string;
  motivo: MotivoRejeicao;
}

export interface RelatorioValidacaoIA {
  /** config SEGURO — só o que sobreviveu, ainda re-validado no validarConfig */
  config: AvatarConfig;
  aceitos: string[];
  rejeitados: ItemRejeitado[];
}

/** Sugestão crua como chega do provedor (nunca confiável). */
export interface SugestaoIA {
  base?: unknown;
  camadas?: Record<string, unknown>;
  cores?: unknown;
}

export function validarSugestaoIA(
  bruta: SugestaoIA,
  desbloqueados: ReadonlySet<string>,
): RelatorioValidacaoIA {
  const aceitos: string[] = [];
  const rejeitados: ItemRejeitado[] = [];

  // base primeiro — as compatibilidades derivam dela
  let base = CONFIG_PADRAO.base;
  if (typeof bruta.base === 'string' && bruta.base) {
    const item = itemPorId(bruta.base);
    if (!item) rejeitados.push({ id: bruta.base, slot: 'base', motivo: 'id_inexistente' });
    else if (item.categoria !== 'base') rejeitados.push({ id: bruta.base, slot: 'base', motivo: 'categoria_incompativel' });
    else if (item.bloqueadoPor && !desbloqueados.has(item.id)) rejeitados.push({ id: bruta.base, slot: 'base', motivo: 'bloqueado' });
    else { base = item.id; aceitos.push(item.id); }
  }

  const camadas: Partial<Record<string, string>> = {};
  for (const [slot, idBruto] of Object.entries(bruta.camadas ?? {})) {
    if (typeof idBruto !== 'string' || !idBruto || idBruto === 'nenhum') continue;
    const item = itemPorId(idBruto);
    if (!item) { rejeitados.push({ id: idBruto, slot, motivo: 'id_inexistente' }); continue; }
    const catEsperada = slot.startsWith('acessorio') ? 'acessorio' : slot;
    if (item.categoria !== catEsperada) {
      rejeitados.push({ id: idBruto, slot, motivo: 'categoria_incompativel' });
      continue;
    }
    if (item.bloqueadoPor && !desbloqueados.has(item.id)) {
      rejeitados.push({ id: idBruto, slot, motivo: 'bloqueado' });
      continue;
    }
    if (item.requerBase?.length && !item.requerBase.includes(base)) {
      rejeitados.push({ id: idBruto, slot, motivo: 'incompativel_com_base' });
      continue;
    }
    if (item.incompativelCom?.some((x) => aceitos.includes(x))) {
      rejeitados.push({ id: idBruto, slot, motivo: 'conflito' });
      continue;
    }
    camadas[slot] = item.id;
    aceitos.push(item.id);
  }

  const config = validarConfig({
    ...CONFIG_PADRAO,
    base,
    camadas,
    cores: { ...CONFIG_PADRAO.cores, ...(typeof bruta.cores === 'object' && bruta.cores ? bruta.cores : {}) },
  });
  return { config, aceitos, rejeitados };
}

/** Frase curta e honesta para a UI (o usuário sabe o que foi ajustado). */
export function resumirAjustes(rejeitados: ItemRejeitado[]): string | null {
  if (!rejeitados.length) return null;
  const porMotivo: Record<MotivoRejeicao, number> = {
    id_inexistente: 0, categoria_incompativel: 0, bloqueado: 0,
    incompativel_com_base: 0, conflito: 0,
  };
  for (const r of rejeitados) porMotivo[r.motivo] += 1;
  const partes: string[] = [];
  if (porMotivo.id_inexistente) partes.push(`${porMotivo.id_inexistente} não existe(m) no catálogo`);
  if (porMotivo.bloqueado) partes.push(`${porMotivo.bloqueado} ainda bloqueado(s)`);
  if (porMotivo.categoria_incompativel + porMotivo.incompativel_com_base + porMotivo.conflito) {
    partes.push(`${porMotivo.categoria_incompativel + porMotivo.incompativel_com_base + porMotivo.conflito} incompatível(is)`);
  }
  return `Ajustei a sugestão: ${partes.join(', ')}.`;
}
