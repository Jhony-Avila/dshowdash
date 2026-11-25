// v2/coerencia.ts — coerência POR INDICADOR na Geral V2 (retorno do agente de mockup, 24/11/2026; CIMA).
// Regras:
//   1. "Zero real" só quando a fonte DAQUELE indicador está em dia E a consulta veio completa. Senão o zero não é confirmado:
//      aparece "—" com "Desatualizado" (nunca um 0 calculado sobre dado velho).
//   2. Indicador com valor e fonte atrasada = "Desatualizado" (último valor válido preservado).
//   3. Negócios ganhos / funil com negócios sem valor = "Dados parciais" (soma dos valores informados).
//   4. A linha de fontes nunca diz "atualizado" quando um indicador daquela fonte está desatualizado ou com problema.
// Funciona com o serviço atual (fonte derivada do indicador, confirmação pelo fontes.php) e com os campos aditivos propostos à
// ACIMA_ESQUERDA (`fonte`, `consulta_completa`), que passam a valer quando chegam.
import type { EstadoBloco, Fonte, IdFonte, IdPrioridade } from './servico';

export type IdIndicador = 'pedidos_bling' | 'negocios_ganhos' | 'funil_aberto' | IdPrioridade | 'agenda';

export const FONTE_DO_INDICADOR: Record<IdIndicador, IdFonte> = {
  pedidos_bling: 'bling', negocios_ganhos: 'pipedrive', funil_aberto: 'pipedrive',
  atividade_vencida: 'pipedrive', sem_proxima_atividade: 'pipedrive', conflito_agenda: 'calendar', agenda: 'calendar',
};
export const NOME_INDICADOR: Record<IdIndicador, string> = {
  pedidos_bling: 'Pedidos lançados no Bling', negocios_ganhos: 'Negócios ganhos', funil_aberto: 'Funil aberto agora',
  atividade_vencida: 'Atividades vencidas', sem_proxima_atividade: 'Sem próxima atividade', conflito_agenda: 'Conflitos na agenda', agenda: 'Próximos compromissos',
};
/** Rótulo CURTO da parte afetada na linha de fontes: "Pipedrive · Com problema (funil)". */
export const PARTE_INDICADOR: Record<IdIndicador, string> = {
  pedidos_bling: 'pedidos', negocios_ganhos: 'negócios ganhos', funil_aberto: 'funil',
  atividade_vencida: 'atividades vencidas', sem_proxima_atividade: 'próxima atividade', conflito_agenda: 'conflitos', agenda: 'agenda',
};
/** Nome COMPLETO da fonte (em 1440 também: "Google Calendar", nunca "Calendar"). */
export const NOME_FONTE: Record<IdFonte, string> = {
  pipedrive: 'Pipedrive', bling: 'Bling', calendar: 'Google Calendar', asaas: 'Asaas', mercadolivre: 'Mercado Livre', lojaintegrada: 'Loja Integrada',
};

export interface IndicadorBruto {
  estado: EstadoBloco; ultimo_sucesso: string | null; motivo: string | null;
  fonte?: IdFonte; consulta_completa?: boolean; sem_valor?: number | null; lacunas?: string[]; quantidade?: number | null;
}
/** 'carregando' = o fontes.php ainda não respondeu (não rebaixa nada); null = não respondeu (não dá para confirmar zero). */
export type FontesLidas = Fonte[] | null | 'carregando';

export interface Efetivo {
  estado: EstadoBloco;
  /** zero calculado que NÃO pôde ser confirmado: a tela mostra "—", nunca 0 */
  zeroNaoConfirmado: boolean;
  /** zero ainda sem confirmação porque o fontes.php não respondeu: a tela mostra "Carregando…" (nunca "Zero real" provisório) */
  conferindo: boolean;
  /** negócios sem valor quando o valor é soma parcial */
  semValor: number | null;
  motivo: string | null;
  quando: string | null;
  fonte: IdFonte;
}

/**
 * Estado efetivo de um indicador.
 * @param falhaAtualizacao a releitura deste bloco falhou depois de um sucesso (a tela mantém a última leitura)
 * @param okEm quando foi a última leitura válida do bloco (para "último sucesso")
 */
export function efetivo(id: IdIndicador, ind: IndicadorBruto, fontes: FontesLidas, falhaAtualizacao = false, okEm: string | null = null): Efetivo {
  const fonte = ind.fonte ?? FONTE_DO_INDICADOR[id];
  const f = Array.isArray(fontes) ? fontes.find((x) => x.fonte === fonte) ?? null : null;
  const base: Efetivo = { estado: ind.estado, zeroNaoConfirmado: false, conferindo: false, semValor: null, motivo: ind.motivo, quando: ind.ultimo_sucesso, fonte };
  const nome = NOME_FONTE[fonte];
  const fonteAtrasada = !!f && f.estado !== 'conectada';

  if (ind.estado === 'aguardando' || ind.estado === 'erro') return base;
  // um 0 que não é "zero" (consulta incompleta, parcial ou desatualizado) NUNCA aparece como 0: "—" + o estado escrito
  const zeroSemConfirmar = ind.quantidade === 0 && ind.estado !== 'zero';
  if (ind.estado === 'desatualizado') return { ...base, zeroNaoConfirmado: zeroSemConfirmar };

  if (falhaAtualizacao) {
    return { ...base, estado: 'desatualizado', zeroNaoConfirmado: ind.estado === 'zero',
      motivo: 'A atualização falhou; abaixo, a última leitura válida.', quando: okEm ?? ind.ultimo_sucesso };
  }

  // Contrato novo (serviço 2a035013 manda `consulta_completa`): o serviço já decidiu o estado pela fonte DAQUELE indicador
  // e o fontes.php já traz o pior estado — a tela não rebaixa um `parcial` correto para "Desatualizado".
  if (ind.consulta_completa !== undefined) {
    const sv0 = typeof ind.sem_valor === 'number' && ind.sem_valor > 0 && (!ind.lacunas || ind.lacunas.includes('sem_valor')) ? ind.sem_valor : null;
    if (ind.estado === 'zero' && ind.consulta_completa === false) return { ...base, estado: 'desatualizado', zeroNaoConfirmado: true, motivo: 'Zero não confirmado · a consulta não veio completa' };
    return { ...base, zeroNaoConfirmado: zeroSemConfirmar, semValor: ind.estado === 'parcial' ? sv0 : null };
  }

  if (ind.estado === 'zero') {
    // confirmado só com a fonte em dia (fontes.php) E a consulta completa (campo novo; sem ele, vale a fonte em dia)
    const fonteEmDia = ind.consulta_completa === true ? !fonteAtrasada && fontes !== null : f?.estado === 'conectada';
    if (fontes === 'carregando' && ind.consulta_completa !== true && ind.consulta_completa !== false) return { ...base, conferindo: true };   // nunca "Zero real" provisório
    if (ind.consulta_completa === false || !fonteEmDia) {
      return { ...base, estado: 'desatualizado', zeroNaoConfirmado: true,
        motivo: ind.consulta_completa === false ? 'Zero não confirmado · a consulta não veio completa'
          : f ? `Zero não confirmado · ${nome} ${f.estado === 'conectada' ? 'sem confirmação' : 'desatualizado'}` : `Zero não confirmado · sem confirmação de ${nome}`,
        quando: f?.ultimo_sucesso ?? ind.ultimo_sucesso };
    }
    return base;
  }

  // ok / parcial
  if (fonteAtrasada) {
    return { ...base, estado: 'desatualizado', motivo: `${nome} desatualizado`, quando: f!.ultimo_sucesso ?? ind.ultimo_sucesso };
  }
  const sv = typeof ind.sem_valor === 'number' && ind.sem_valor > 0 ? ind.sem_valor : null;
  // 2a035013: `parcial` + `lacunas`; o texto "X negócios sem valor" só quando a lacuna é de valor (as outras usam o `motivo`)
  if (sv !== null && (!ind.lacunas || ind.lacunas.includes('sem_valor'))) return { ...base, estado: 'parcial', semValor: sv };
  return base;
}

const PESO: Record<Fonte['estado'], number> = { conectada: 0, aguardando: 1, desatualizada: 2, problema: 3 };
const TEXTO_ESTADO: Record<Fonte['estado'], string> = { conectada: 'Atualizado', desatualizada: 'Desatualizado', problema: 'Com problema', aguardando: 'Aguardando conexão' };

/**
 * Linha "Fontes e atualização" (retorno do mockup P10, 2ª rodada): o estado e a parte afetada vêm do SERVIÇO
 * (`rotulo_estado`, `afetado`); a tela só acrescenta o que ELA MESMA não conseguiu ler (um bloco que falhou aqui nunca deixa a
 * fonte dele como "Atualizado"). Nunca melhora o estado do serviço.
 * Formato: "Com problema (funil)" · "Desatualizado (negócios ganhos)" · "Atualizado às 18:42".
 */
export function fonteEfetiva(f: Fonte, indicadores: { id: IdIndicador; e: Efetivo }[]): { estado: Fonte['estado']; rotulo: string; partes: string[] } {
  let estado = f.estado;
  const partes: string[] = (f.afetado ?? []).map((a) => a.rotulo);
  const ids = new Set((f.afetado ?? []).map((a) => a.id));
  const mapa = (e: EstadoBloco): Fonte['estado'] | null => (e === 'erro' ? 'problema' : e === 'desatualizado' ? 'desatualizada' : null);
  for (const x of indicadores.filter((y) => y.e.fonte === f.fonte)) {
    const m = mapa(x.e.estado); if (!m) continue;
    if (PESO[m] > PESO[estado] && estado !== 'aguardando') estado = m;
    if (!ids.has(x.id)) { ids.add(x.id); partes.push(PARTE_INDICADOR[x.id]); }
  }
  for (const x of f.indicadores ?? []) {
    const m = mapa(x.estado); if (!m) continue;
    if (PESO[m] > PESO[estado] && estado !== 'aguardando') estado = m;
    if (!ids.has(x.id) && x.id in PARTE_INDICADOR) { ids.add(x.id); partes.push(PARTE_INDICADOR[x.id as IdIndicador]); }
  }
  // o rótulo do serviço vale enquanto a tela não tiver piorado o estado; nunca "Atualizado" com parte afetada
  let rotulo = estado === f.estado && f.rotulo_estado ? f.rotulo_estado : TEXTO_ESTADO[estado];
  if (rotulo === 'Atualizado' && partes.length) rotulo = 'Dados parciais';
  return { estado, rotulo, partes: [...new Set(partes)] };
}

/** "1 negócio sem valor" / "5 negócios sem valor" */
export const textoSemValor = (n: number) => `${n.toLocaleString('pt-BR')} ${n === 1 ? 'negócio' : 'negócios'} sem valor`;
