import { Api, novaOperacao } from "../api/client.js";
import { concedente } from "../ui/concedente.js";
const MODULE_ID = "uarps-admin-controller:alteracao-servidor";
const SEM = { rotulo: "sem compara\xE7\xE3o", detalhe: null, origem: null, regra: null };
const ESTADO = { permitir: "allow", negar: "deny", herdar: "inherit" };
const REENVIOS_AUTOMATICOS = 1;
function desfechoDesconhecido(erro) {
  const e = String(erro || "");
  return e === "FALHA_DE_REDE" || e === "ABORTADO" || e === "ERRO_NO_CLIENTE" || e === "RESPOSTA_FORA_DO_CONTRATO" || /^HTTP_\d{3}$/.test(e);
}
function rotuloDaReleitura(dados) {
  const a = dados?.acesso_efetivo ?? dados?.atual ?? dados?.releitura ?? null;
  if (!a || typeof a !== "object") return { ...SEM };
  const origem = typeof a.origem === "string" ? a.origem : null;
  const msg = typeof a.mensagem === "string" ? a.mensagem : null;
  if (origem === "exige_concessao_explicita") return { rotulo: "Negado: esta capacidade exige concess\xE3o pessoal expl\xEDcita", detalhe: msg, origem, regra: null };
  if (origem === "sombra") return { rotulo: "Permitido agora \xB7 em sombra, o UARPS negaria", detalhe: msg, origem, regra: null };
  if (origem === "perfil" && a.ainda_permitido === true) return { rotulo: msg || "Continua permitido pelo perfil", detalhe: msg, origem, regra: null };
  if (a.ainda_permitido === true) return { rotulo: msg || "Continua permitido", detalhe: msg, origem, regra: null };
  if (a.ainda_permitido === false && origem !== "indeterminado") return { rotulo: "Negado agora", detalhe: msg, origem, regra: null };
  return { rotulo: "sem compara\xE7\xE3o", detalhe: msg, origem, regra: null };
}
function descreverConcedente(det) {
  return concedente(det).texto;
}
function descreverRegra(det) {
  if (!det) return "Sem regra pessoal (herda)";
  const prazo = det.expires_at ? ` at\xE9 ${String(det.expires_at).slice(0, 23)}` : " sem prazo";
  const c = descreverConcedente(det);
  if (det.estado_efetivo === "expirada") return `Regra pessoal expirada em ${String(det.expires_at || "").slice(0, 23)} (n\xE3o decide mais)${c}`;
  if (det.estado_efetivo === "allow") return `Regra pessoal: permitir${prazo}${c}`;
  if (det.estado_efetivo === "deny") return `Regra pessoal: negar${prazo}${c}`;
  return "Regra pessoal em estado desconhecido";
}
function gravar(p, operacaoId) {
  return p.acao === "herdar" ? Api.inheritTrigger(p.userId, p.triggerId, { operacaoId, reason: p.motivo }) : Api.setTriggerPermission(p.userId, p.triggerId, p.acao === "permitir", { operacaoId, reason: p.motivo });
}
async function reler(store, p) {
  const lido = await Api.getUserPermissions(p.userId);
  if (!lido?.success || !lido.data) return { ok: false, erro: lido?.error || "FALHA_AO_RELER", releitura: { ...SEM } };
  store.setUserPermissions(p.userId, lido.data);
  const regra = descreverRegra(lido.data.detalhes?.triggers?.[p.triggerId]);
  const dec = await Api.previewTrigger(p.userId, p.triggerId, ESTADO[p.acao]);
  if (!dec?.success || !dec.data?.atual) return { ok: false, erro: dec?.error || "DECISAO_INDISPONIVEL", releitura: { ...SEM, regra } };
  return { ok: true, erro: null, releitura: { ...rotuloDaReleitura(dec.data), regra } };
}
async function alterarTrigger(store, p) {
  const operacaoId = p.operacaoId || novaOperacao();
  let res = await gravar(p, operacaoId);
  let tentativas = 1;
  while (!res?.success && desfechoDesconhecido(res?.error) && tentativas <= REENVIOS_AUTOMATICOS) {
    res = await gravar(p, operacaoId);
    tentativas++;
  }
  if (!res?.success && !desfechoDesconhecido(res?.error)) return { ok: false, etapa: "gravar", gravado: false, erro: res?.error || "FALHA_AO_GRAVAR", operacaoId, tentativas, releitura: { ...SEM } };
  const r = await reler(store, p);
  if (!res?.success) return { ok: false, etapa: "pendente", gravado: null, erro: res?.error || "SEM_CONFIRMACAO", operacaoId, tentativas, releitura: r.releitura };
  if (!r.ok) return { ok: false, etapa: "reler", gravado: true, erro: r.erro, operacaoId, tentativas, releitura: r.releitura };
  return { ok: true, etapa: "concluido", gravado: true, erro: null, operacaoId, tentativas, releitura: r.releitura };
}
function mensagemDoResultado(r) {
  if (r.ok) return `Gravado. ${r.releitura.rotulo}`;
  if (r.etapa === "gravar") return `N\xE3o foi gravado: o servidor recusou (${r.erro}). Nada mudou.`;
  if (r.etapa === "pendente") return `Confirma\xE7\xE3o pendente: a resposta do servidor se perdeu (${r.erro}). A altera\xE7\xE3o pode ter sido gravada. Use "Reconciliar": reenvia com a MESMA chave e n\xE3o grava duas vezes.`;
  return `Gravado (confirmado pelo servidor), mas a releitura falhou (${r.erro}). Recarregue antes de confiar no estado mostrado.`;
}
var alteracao_servidor_default = { alterarTrigger, reler, rotuloDaReleitura, descreverRegra, descreverConcedente, desfechoDesconhecido, mensagemDoResultado };
export {
  MODULE_ID,
  REENVIOS_AUTOMATICOS,
  alterarTrigger,
  alteracao_servidor_default as default,
  descreverConcedente,
  descreverRegra,
  desfechoDesconhecido,
  mensagemDoResultado,
  reler,
  rotuloDaReleitura
};
