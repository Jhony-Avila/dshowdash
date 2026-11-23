// panel-atributos/src/ui/celula.ts — UX-2b (DIREITA, 19/11): regras PURAS da edição na célula (Atributos e Unidades).
// Briefing: /srv/dshow-docs/briefings/BRIEFING-UX2B.md. Cada célula grava com versão e chave de operação (uma por intenção) e
// mostra o desfecho do contrato "foi salvo" (docs/atributos/CONTRATO-FOI-SALVO.md): salvo (com recibo) · nada mudou · não foi
// salvo (recusa com motivo) · conflito 409 · não conseguimos confirmar (resposta perdida/sem recibo → "Conferir gravação", só GET).
import { ErroApi, MSG_DESCONHECIDO, type Conferencia, type Recibo } from '../lib/api';

export type FaseCelula = 'ocioso' | 'salvando' | 'conferindo' | 'salvo' | 'sem_mudanca' | 'recusada' | 'conflito' | 'desconhecido' | 'em_andamento';
export interface EstadoCelula { fase: FaseCelula; mensagem: string | null; chave: string | null; codigo?: string | null }
export const CELULA0: EstadoCelula = { fase: 'ocioso', mensagem: null, chave: null };

export const MSG_CONFLITO = 'Outra pessoa mudou este item depois que você abriu a tela. Recarregue para ver o valor atual.';
export const MSG_NAO_RECEBIDO = 'O servidor não recebeu este pedido. Nada foi salvo.';
export const MSG_EM_ANDAMENTO = 'Ainda em andamento no servidor. Confira de novo em instantes.';

/** Ícone pequeno ao lado do valor (texto curto + rótulo acessível + tom). `null` = sem ícone. */
export function iconeDaFase(f: FaseCelula): { simbolo: string; rotulo: string; tom: 'neutro' | 'sucesso' | 'aviso' | 'erro' } | null {
  switch (f) {
    case 'salvando': return { simbolo: '⟳', rotulo: 'Salvando…', tom: 'neutro' };
    case 'conferindo': return { simbolo: '⟳', rotulo: 'Conferindo no servidor…', tom: 'neutro' };
    case 'salvo': return { simbolo: '✓', rotulo: 'Salvo (confirmado pelo servidor)', tom: 'sucesso' };
    case 'sem_mudanca': return { simbolo: '=', rotulo: 'Nada mudou', tom: 'neutro' };
    case 'recusada': return { simbolo: '✕', rotulo: 'Não foi salvo', tom: 'erro' };
    case 'conflito': return { simbolo: '!', rotulo: 'Conflito: outra pessoa mudou', tom: 'aviso' };
    case 'desconhecido': return { simbolo: '?', rotulo: MSG_DESCONHECIDO, tom: 'aviso' };
    case 'em_andamento': return { simbolo: '…', rotulo: 'Em andamento no servidor', tom: 'aviso' };
    default: return null;
  }
}

/** Resposta 2xx que já passou pelo `enviar` (que só devolve com recibo). */
export function estadoDaResposta(r: { desfecho?: unknown; recibo?: Pick<Recibo, 'desfecho'> | null } | null | undefined, chave: string | null): EstadoCelula {
  const semMudanca = r?.desfecho === 'sem_mudanca' || r?.recibo?.desfecho === 'sem_mudanca';
  return { fase: semMudanca ? 'sem_mudanca' : 'salvo', mensagem: semMudanca ? 'Nada mudou.' : null, chave };
}

/** Erro do `enviar`. Só uma recusa ESCRITA pelo servidor diz "não foi salvo"; o resto é desconhecido. `campo`: motivo daquele campo, se veio. */
export function estadoDoErro(e: unknown, chave: string | null, campo?: string): EstadoCelula {
  if (!(e instanceof ErroApi)) return { fase: 'desconhecido', mensagem: MSG_DESCONHECIDO, chave };
  const ch = e.extra.chave ?? chave;
  if (e.desconhecido) return { fase: 'desconhecido', mensagem: MSG_DESCONHECIDO, chave: ch };
  if (e.emAndamento) return { fase: 'em_andamento', mensagem: MSG_EM_ANDAMENTO, chave: ch };
  if (e.http === 409 && e.codigo !== 'VALUE_EXISTS' && e.codigo !== 'OPERATION_IN_PROGRESS' && e.codigo !== 'TYPE_CHANGE_BLOCKED') return { fase: 'conflito', mensagem: e.message || MSG_CONFLITO, chave: ch };
  if (e.http >= 400 && e.http < 500) {
    const motivo = (campo && e.extra.motivos?.[campo]) || e.message;
    return { fase: 'recusada', mensagem: `Não foi salvo. ${motivo}`.trim(), chave: ch, codigo: e.codigo };
  }
  return { fase: 'desconhecido', mensagem: MSG_DESCONHECIDO, chave: ch };
}

/** Resultado do "Conferir gravação" (GET; nada é reenviado). */
export function estadoDaConferencia(c: Pick<Conferencia, 'resultado' | 'erro'>, chave: string): EstadoCelula {
  switch (c.resultado) {
    case 'aplicada': return { fase: 'salvo', mensagem: null, chave };
    case 'sem_mudanca': return { fase: 'sem_mudanca', mensagem: 'Nada mudou.', chave };
    case 'nao_aplicada': return { fase: 'recusada', mensagem: `Não foi salvo. ${c.erro?.mensagem ?? ''}`.trim(), chave };
    case 'nao_encontrada': return { fase: 'recusada', mensagem: MSG_NAO_RECEBIDO, chave };
    default: return { fase: 'em_andamento', mensagem: MSG_EM_ANDAMENTO, chave };
  }
}

/** Fases que pedem ação da pessoa (o ícone vira botão "Conferir gravação"). */
export const podeConferir = (f: FaseCelula) => f === 'desconhecido' || f === 'em_andamento';
/** Fases em que nada está em voo (pode editar de novo). */
export const livre = (f: FaseCelula) => f !== 'salvando' && f !== 'conferindo';

// ── Atributos: corpo de UM campo (o servidor aceita atualização parcial com a versão) ───────────────────────────────────────
export type CampoAtributo = 'rotulo' | 'descricao' | 'importancia_padrao' | 'tipo' | 'unidade_id';
export const LIMITES: Record<'rotulo' | 'descricao', number> = { rotulo: 128, descricao: 500 };

export function validarCampoAtributo(campo: CampoAtributo, valor: string): string | null {
  const v = valor.trim();
  if (campo === 'rotulo' && v === '') return 'O rótulo não pode ficar vazio.';
  if ((campo === 'rotulo' || campo === 'descricao') && v.length > LIMITES[campo]) return `No máximo ${LIMITES[campo]} caracteres.`;
  return null;
}

/** Corpo do POST `atributo` para um campo: { id, versao, campo } (+ motivo na troca de unidade). Vazio = limpar (null). */
export function corpoCampoAtributo(a: { id: number; versao: number }, campo: CampoAtributo, valor: string, motivo?: string): Record<string, unknown> {
  const v = valor.trim();
  const dado = v === '' ? null : campo === 'unidade_id' ? Number(v) : v;
  const corpo: Record<string, unknown> = { id: a.id, versao: a.versao, [campo]: dado };
  if (motivo && motivo.trim()) corpo.motivo = motivo.trim();
  return corpo;
}

/** O valor mudou de fato? (texto aparado; vazio = null) */
export const mudou = (antes: string | number | null | undefined, depois: string) => (antes === null || antes === undefined ? '' : String(antes)).trim() !== depois.trim();

const plural = (n: number, s: string, p: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? s : p}`;

/** Barra amarela da troca de TIPO (confirmação na própria linha). */
export function avisoTipo(a: { rotulo: string; produtos_com_valor: number }, de: string, para: string): string {
  return a.produtos_com_valor > 0
    ? `Trocar o tipo de "${a.rotulo}" de ${de} para ${para}? ${plural(a.produtos_com_valor, 'produto tem', 'produtos têm')} valor neste atributo: o servidor recusa a troca de tipo com valores gravados.`
    : `Trocar o tipo de "${a.rotulo}" de ${de} para ${para}? Nenhum produto tem valor neste atributo.`;
}

/** Barra amarela da troca de UNIDADE padrão: com valores gravados, pede o motivo (o servidor exige). */
export function avisoUnidade(a: { rotulo: string; produtos_com_valor: number }, de: string, para: string): { texto: string; pedeMotivo: boolean } {
  const pede = a.produtos_com_valor > 0;
  return {
    texto: pede
      ? `Trocar a unidade padrão de "${a.rotulo}" de ${de} para ${para}? ${plural(a.produtos_com_valor, 'produto tem', 'produtos têm')} valor: os números gravados não são convertidos. Diga o motivo.`
      : `Trocar a unidade padrão de "${a.rotulo}" de ${de} para ${para}? Nenhum produto tem valor neste atributo.`,
    pedeMotivo: pede,
  };
}

/** Confirmação do liga/desliga do atributo, com quantos produtos o usam. */
export function avisoAtivo(a: { rotulo: string; produtos_com_valor: number; em_kits: number }, ativar: boolean): string {
  if (ativar) return `Reativar "${a.rotulo}"? Ele volta a aparecer nas fichas dos kits que o têm.`;
  const uso = [a.produtos_com_valor > 0 ? plural(a.produtos_com_valor, 'produto com valor', 'produtos com valor') : 'nenhum produto com valor',
    a.em_kits > 0 ? `em ${plural(a.em_kits, 'kit', 'kits')}` : 'em nenhum kit'].join(' · ');
  return `Desativar "${a.rotulo}"? Uso hoje: ${uso}. Os valores ficam guardados (nada é apagado); o atributo sai das fichas e das listas de escolha.`;
}

// ── Unidades ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** "Onde é usada" em UMA linha: os primeiros itens + "+N". */
export function umaLinha(itens: readonly string[], max = 2): { texto: string; resto: number } {
  const lista = itens.filter(Boolean);
  return { texto: lista.slice(0, max).join(' · '), resto: Math.max(0, lista.length - max) };
}

/** Status como bolinha colorida (em vez de pílula). */
export const bolinha = (ativo: unknown): { tom: 'sucesso' | 'neutro'; rotulo: string } =>
  (ativo === true || Number(ativo) === 1 ? { tom: 'sucesso', rotulo: 'Ativa' } : { tom: 'neutro', rotulo: 'Inativa' });
