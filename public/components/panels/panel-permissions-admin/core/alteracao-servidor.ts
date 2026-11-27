// MODULE: uarps-admin-controller:alteracao-servidor (E2/E3 · B2/B3/B4) · VERDE (ACIMA_DIREITA), 27/11/2026
// Uma alteração de permissão = UMA intenção do usuário: uma chave de operação (Idempotency-Key, reaproveitada no reenvio), gravar no
// servidor, RELER do servidor e mostrar SÓ o que a RELEITURA devolveu. Nada é deduzido no navegador (sem otimismo).
// E3 (parecer R27 do GPT Warps, 27/11): três desfechos distintos da gravação —
//   recusa definitiva (o servidor respondeu com erro no contrato) → "Não foi gravado";
//   resultado DESCONHECIDO (rede caiu, resposta perdida ou fora do contrato) → "Confirmação pendente", reconciliar pela MESMA chave;
//   confirmada → rótulo final pela RELEITURA (regra da pessoa + decisão atual do servidor), nunca pela resposta da escrita.
'use strict';
import { Api, novaOperacao } from '../api/client.js';
import { concedente } from '../ui/concedente.js';

export const MODULE_ID = 'uarps-admin-controller:alteracao-servidor';
export type Acao = 'permitir' | 'negar' | 'herdar';
export type Etapa = 'concluido' | 'gravar' | 'pendente' | 'reler';
export interface Releitura { rotulo: string; detalhe: string | null; origem: string | null; regra: string | null }
export interface Resultado { ok: boolean; etapa: Etapa; gravado: boolean | null; erro: string | null; operacaoId: string; tentativas: number; releitura: Releitura }
interface StoreAlteracao { setUserPermissions(userId: string | number, p: Record<string, unknown>): void }

const SEM: Releitura = { rotulo: 'sem comparação', detalhe: null, origem: null, regra: null };
const ESTADO: Record<Acao, 'allow' | 'deny' | 'inherit'> = { permitir: 'allow', negar: 'deny', herdar: 'inherit' };
/** Reenvios automáticos com a MESMA chave quando o desfecho é desconhecido (o servidor devolve o resultado guardado, sem nova mutação). */
export const REENVIOS_AUTOMATICOS = 1;

/** Erro sem envelope do servidor = não sabemos se gravou. Erro DENTRO do contrato ({ok:false,error}) = recusa definitiva. */
export function desfechoDesconhecido(erro: unknown): boolean {
  const e = String(erro || '');
  return e === 'FALHA_DE_REDE' || e === 'ABORTADO' || e === 'ERRO_NO_CLIENTE' || e === 'RESPOSTA_FORA_DO_CONTRATO' || /^HTTP_\d{3}$/.test(e);
}

/** B3: o rótulo vem da decisão que o SERVIDOR devolveu (`acesso_efetivo` ou `atual` da prévia). Sem campo = "sem comparação". */
export function rotuloDaReleitura(dados: any): Releitura {
  const a = dados?.acesso_efetivo ?? dados?.atual ?? dados?.releitura ?? null;
  if (!a || typeof a !== 'object') return { ...SEM };
  const origem = typeof a.origem === 'string' ? a.origem : null; const msg = typeof a.mensagem === 'string' ? a.mensagem : null;
  if (origem === 'exige_concessao_explicita') return { rotulo: 'Negado: esta capacidade exige concessão pessoal explícita', detalhe: msg, origem, regra: null };   // E3.1 (v4.4)
  if (origem === 'sombra') return { rotulo: 'Permitido agora · em sombra, o UARPS negaria', detalhe: msg, origem, regra: null };
  if (origem === 'perfil' && a.ainda_permitido === true) return { rotulo: msg || 'Continua permitido pelo perfil', detalhe: msg, origem, regra: null };
  if (a.ainda_permitido === true) return { rotulo: msg || 'Continua permitido', detalhe: msg, origem, regra: null };
  if (a.ainda_permitido === false && origem !== 'indeterminado') return { rotulo: 'Negado agora', detalhe: msg, origem, regra: null };
  return { rotulo: 'sem comparação', detalhe: msg, origem, regra: null };
}

/** E3.3: texto do concedente = módulo ÚNICO (ui/concedente): quem, QUANDO e a alçada (indeterminada = "Alçada indisponível"). */
export function descreverConcedente(det: any): string { return concedente(det).texto; }

/** Descrição da regra pessoal RELIDA (estado efetivo e prazo do servidor; vencida = "expirada", nunca ativa). */
export function descreverRegra(det: any): string {
  if (!det) return 'Sem regra pessoal (herda)';
  const prazo = det.expires_at ? ` até ${String(det.expires_at).slice(0, 23)}` : ' sem prazo';
  const c = descreverConcedente(det);
  if (det.estado_efetivo === 'expirada') return `Regra pessoal expirada em ${String(det.expires_at || '').slice(0, 23)} (não decide mais)${c}`;
  if (det.estado_efetivo === 'allow') return `Regra pessoal: permitir${prazo}${c}`;
  if (det.estado_efetivo === 'deny') return `Regra pessoal: negar${prazo}${c}`;
  return 'Regra pessoal em estado desconhecido';
}

function gravar(p: { userId: string | number; triggerId: string; acao: Acao; motivo?: string }, operacaoId: string): Promise<any> {
  return p.acao === 'herdar'
    ? Api.inheritTrigger(p.userId, p.triggerId, { operacaoId, reason: p.motivo })
    : Api.setTriggerPermission(p.userId, p.triggerId, p.acao === 'permitir', { operacaoId, reason: p.motivo });
}

/** Releitura completa: regra da pessoa (user-permissions) + decisão e origem atuais (prévia, só leitura). Atualiza a tela. */
export async function reler(store: StoreAlteracao, p: { userId: string | number; triggerId: string; acao: Acao }): Promise<{ ok: boolean; erro: string | null; releitura: Releitura }> {
  const lido: any = await Api.getUserPermissions(p.userId);
  if (!lido?.success || !lido.data) return { ok: false, erro: lido?.error || 'FALHA_AO_RELER', releitura: { ...SEM } };
  store.setUserPermissions(p.userId, lido.data);
  const regra = descreverRegra(lido.data.detalhes?.triggers?.[p.triggerId]);
  const dec: any = await Api.previewTrigger(p.userId, p.triggerId, ESTADO[p.acao]);
  if (!dec?.success || !dec.data?.atual) return { ok: false, erro: dec?.error || 'DECISAO_INDISPONIVEL', releitura: { ...SEM, regra } };
  return { ok: true, erro: null, releitura: { ...rotuloDaReleitura(dec.data), regra } };
}

/** Grava a intenção e relê do servidor. `operacaoId` vem de quem chama no reenvio/reconciliação (mesma intenção = mesma chave). */
export async function alterarTrigger(store: StoreAlteracao, p: { userId: string | number; triggerId: string; acao: Acao; motivo?: string; operacaoId?: string }): Promise<Resultado> {
  const operacaoId = p.operacaoId || novaOperacao();
  let res: any = await gravar(p, operacaoId); let tentativas = 1;
  while (!res?.success && desfechoDesconhecido(res?.error) && tentativas <= REENVIOS_AUTOMATICOS) { res = await gravar(p, operacaoId); tentativas++; }
  if (!res?.success && !desfechoDesconhecido(res?.error)) return { ok: false, etapa: 'gravar', gravado: false, erro: res?.error || 'FALHA_AO_GRAVAR', operacaoId, tentativas, releitura: { ...SEM } };
  const r = await reler(store, p);
  if (!res?.success) return { ok: false, etapa: 'pendente', gravado: null, erro: res?.error || 'SEM_CONFIRMACAO', operacaoId, tentativas, releitura: r.releitura };
  if (!r.ok) return { ok: false, etapa: 'reler', gravado: true, erro: r.erro, operacaoId, tentativas, releitura: r.releitura };
  return { ok: true, etapa: 'concluido', gravado: true, erro: null, operacaoId, tentativas, releitura: r.releitura };
}

/** Texto curto por desfecho (B4): recusa, desconhecido e releitura falha nunca usam a mesma mensagem. */
export function mensagemDoResultado(r: Resultado): string {
  if (r.ok) return `Gravado. ${r.releitura.rotulo}`;
  if (r.etapa === 'gravar') return `Não foi gravado: o servidor recusou (${r.erro}). Nada mudou.`;
  if (r.etapa === 'pendente') return `Confirmação pendente: a resposta do servidor se perdeu (${r.erro}). A alteração pode ter sido gravada. Use "Reconciliar": reenvia com a MESMA chave e não grava duas vezes.`;
  return `Gravado (confirmado pelo servidor), mas a releitura falhou (${r.erro}). Recarregue antes de confiar no estado mostrado.`;
}

export default { alterarTrigger, reler, rotuloDaReleitura, descreverRegra, descreverConcedente, desfechoDesconhecido, mensagemDoResultado };
