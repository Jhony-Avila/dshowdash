// =====================================================
// FILE: core/auth/sessao-encerrada.ts
// PURPOSE: Codex DSHOW-115B (P7 + P9) — o ÚNICO validador da resposta do GET /api/auth/check.php. Usado pelo cliente de logout
//   (core/auth/logout-client, P7) e pelas Fotos (panel-atributos/src/lib/fotos.ts, P9, pelo mesmo arquivo-fonte).
//   O check.php só tem três saídas (api/auth/check.php):
//     - 200 JSON {ok:true, data:{authenticated:false, user:null, session:{csrf_token}}, error:null}  → sessão ENCERRADA (a única prova);
//     - 200 JSON {ok:true, data:{authenticated:true, user:{…}, session:{…}}, error:null}            → sessão ATIVA;
//     - 503 JSON {ok:false, data:null, error:'SESSION_CHECK_UNAVAILABLE'}                             → desconhecido.
//   Qualquer outra coisa é AMBÍGUA e fica DESCONHECIDA: status ≠ 200 (401/403 de proxy/WAF inclusive), Content-Type que não é JSON,
//   JSON inválido, ok ≠ true (o defeito do 115B: {ok:false, data:{authenticated:false}} era lido como "saiu"), error ≠ null, authenticated
//   fora do `data`, authenticated não booleano, user não nulo com authenticated:false.
//   Sem dependências e sem efeitos: só lê (status, content-type, corpo em texto).
// =====================================================

export type LeituraCheck =
  | { estado: 'encerrada'; csrf: string }
  | { estado: 'ativa'; csrf: string; token: string | null }
  | { estado: 'desconhecido'; motivo: string };

const objeto = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Lê a resposta do check.php pelo envelope EXATO. Só `encerrada` prova que a sessão acabou; `desconhecido` nunca vira saída nem entrada. */
export function lerCheckSessao(status: number, tipo: string | null | undefined, corpo: string): LeituraCheck {
  if (status !== 200) return { estado: 'desconhecido', motivo: `check ${status}` };
  if (!/^application\/json\b/i.test(String(tipo ?? '').trim())) return { estado: 'desconhecido', motivo: 'check sem JSON' };
  let j: unknown;
  try { j = JSON.parse(corpo); } catch { return { estado: 'desconhecido', motivo: 'check com JSON inválido' }; }
  if (!objeto(j) || j.ok !== true || !('error' in j) || j.error !== null || !objeto(j.data)) return { estado: 'desconhecido', motivo: 'check sem o envelope de sucesso' };
  const d = j.data;
  const sessao = objeto(d.session) ? d.session : {};
  const csrf = typeof sessao.csrf_token === 'string' ? sessao.csrf_token : '';
  if (d.authenticated === false) {
    if (d.user !== null) return { estado: 'desconhecido', motivo: 'check ambíguo (usuário com authenticated:false)' };
    return { estado: 'encerrada', csrf };
  }
  // authenticated:true no envelope de sucesso = sessão viva (o `user` pode vir null: SessionGate::getUser() sem cadastro; não muda o fato)
  if (d.authenticated === true) return { estado: 'ativa', csrf, token: typeof sessao.token === 'string' ? sessao.token : null };
  return { estado: 'desconhecido', motivo: 'check sem authenticated booleano' };
}

/** Atalho: a resposta PROVA que a sessão acabou? (só o envelope exato de sucesso com data.authenticated === false). */
export function sessaoEncerradaProvada(status: number, tipo: string | null | undefined, corpo: string): boolean {
  return lerCheckSessao(status, tipo, corpo).estado === 'encerrada';
}

/** Lê uma Response do fetch (texto inteiro) pelo validador. Falha ao ler o corpo = desconhecido. */
export async function lerRespostaCheck(r: { status: number; headers?: { get(n: string): string | null } | null; text(): Promise<string> }): Promise<LeituraCheck> {
  const tipo = r.headers && typeof r.headers.get === 'function' ? r.headers.get('content-type') : null;
  let corpo: string;
  try { corpo = await r.text(); } catch { return { estado: 'desconhecido', motivo: 'check ilegível' }; }
  return lerCheckSessao(r.status, tipo, corpo);
}

export default { lerCheckSessao, sessaoEncerradaProvada, lerRespostaCheck };
