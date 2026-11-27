// MODULE: uarps-admin:concedente (E3.3 · VERDE, 27/11/2026) — texto ÚNICO do concedente de uma regra pessoal (célula, região, diálogo,
// releitura). Parecer GPT Warps: (1) alçada INDETERMINADA no servidor = "Alçada indisponível", NUNCA "perdeu a alçada"; (2) quem concedeu
// E QUANDO (granted_at da linha, com ms). Só id, nível e data: nunca nome/e-mail. A concessão continua valendo até o prazo (é informação).
'use strict';

export const MODULE_ID = 'uarps-admin:concedente';
export type EstadoAlcada = 'com_alcada' | 'sem_alcada' | 'indisponivel';

/** "Perdeu" só com os TRÊS sinais coerentes do servidor; "com alçada" idem; qualquer outra combinação (null, erro, campo ausente,
 *  contraditório) = indisponível. Escritor v4.8: `alcada_estado` explícito; v4.6/v4.7: deduzido dos dois booleanos. */
export function estadoAlcada(d: any): EstadoAlcada {
  const e = d?.alcada_estado; const ok = (v: string) => e === undefined || e === v;
  if (d?.perdeu_alcada === true && d?.concedente_alcada_atual === false && ok('sem_alcada')) return 'sem_alcada';
  if (d?.perdeu_alcada === false && d?.concedente_alcada_atual === true && ok('com_alcada')) return 'com_alcada';
  return 'indisponivel';
}

/** "AAAA-MM-DD HH:MM:SS[.ffffff]" do servidor → "DD/MM/AAAA HH:MM:SS.mmm" (sem fuso inventado; o relógio é o do banco). Ilegível = null. */
export function dataConcessao(v: unknown): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?/.exec(String(v ?? ''));
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}${m[5] ? '.' + (m[5] + '00').slice(0, 3) : ''}` : null;
}

/** Motivo da perda de alçada (escritor v4.8 `alcada_motivo`). Desconhecido = mostrado cru, nunca omitido. */
const MOTIVO: Record<string, string> = {
  nivel_insuficiente: 'o nível dele está abaixo do mínimo da capacidade',
  sem_administracao: 'ele não administra mais permissões',
  sem_a_capacidade: 'ele não possui mais esta capacidade',
};
export function motivoAlcada(m: unknown): string | null { return typeof m === 'string' && m !== '' ? (MOTIVO[m] ?? m) : null; }

export interface Concedente { texto: string; id: string | null; estado: EstadoAlcada | null; concedidoEm: string | null; motivo?: string | null }

/** Sufixo do texto da regra: " · Concedido por #id em <data> (nível atual N)" + a situação da alçada. Sem concedente = vazio. */
export function concedente(d: any): Concedente {
  if (!d || d.concedente_id === null || d.concedente_id === undefined) return { texto: '', id: null, estado: null, concedidoEm: null };
  const quando = dataConcessao(d.granted_at);
  const nivel = d.concedente_nivel_atual === null || d.concedente_nivel_atual === undefined ? 'sem papel ativo' : `nível atual ${d.concedente_nivel_atual}`;
  const estado = estadoAlcada(d);
  let t = ` · Concedido por #${d.concedente_id} ${quando ? `em ${quando}` : '(data da concessão indisponível)'} (${nivel})`;
  const mot = motivoAlcada(d.alcada_motivo);
  if (estado === 'sem_alcada') t += ` · o concedente perdeu a alçada sobre esta capacidade${mot ? ` (${mot})` : ''} · a regra continua valendo até o prazo`;
  else if (estado === 'indisponivel') t += ' · Alçada indisponível: não foi possível confirmar a alçada do concedente agora (a regra continua valendo até o prazo)';
  return { texto: t, id: String(d.concedente_id), estado, concedidoEm: quando, motivo: estado === 'sem_alcada' && typeof d.alcada_motivo === 'string' ? d.alcada_motivo : null };
}

/** Atributos de dados para a célula/região (prova na tela). */
export function atributosConcedente(c: Concedente): string {
  if (!c.id) return '';
  const esc = (s: string) => s.replace(/[&<>"]/g, '');
  return `data-uarps-concedente="${esc(c.id)}" data-uarps-alcada="${c.estado}" ${c.estado === 'sem_alcada' ? 'data-uarps-perdeu-alcada="1" ' : ''}${c.motivo ? `data-uarps-alcada-motivo="${esc(c.motivo)}" ` : ''}${c.concedidoEm ? `data-uarps-concedido-em="${esc(c.concedidoEm)}" ` : ''}`;
}

export default { estadoAlcada, dataConcessao, motivoAlcada, concedente, atributosConcedente, MODULE_ID };
