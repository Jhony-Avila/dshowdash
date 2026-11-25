const objeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);
function lerCheckSessao(status, tipo, corpo) {
  if (status !== 200) return { estado: "desconhecido", motivo: `check ${status}` };
  if (!/^application\/json\b/i.test(String(tipo ?? "").trim())) return { estado: "desconhecido", motivo: "check sem JSON" };
  let j;
  try {
    j = JSON.parse(corpo);
  } catch {
    return { estado: "desconhecido", motivo: "check com JSON inv\xE1lido" };
  }
  if (!objeto(j) || j.ok !== true || !("error" in j) || j.error !== null || !objeto(j.data)) return { estado: "desconhecido", motivo: "check sem o envelope de sucesso" };
  const d = j.data;
  const sessao = objeto(d.session) ? d.session : {};
  const csrf = typeof sessao.csrf_token === "string" ? sessao.csrf_token : "";
  if (d.authenticated === false) {
    if (d.user !== null) return { estado: "desconhecido", motivo: "check amb\xEDguo (usu\xE1rio com authenticated:false)" };
    return { estado: "encerrada", csrf };
  }
  if (d.authenticated === true) return { estado: "ativa", csrf, token: typeof sessao.token === "string" ? sessao.token : null };
  return { estado: "desconhecido", motivo: "check sem authenticated booleano" };
}
function sessaoEncerradaProvada(status, tipo, corpo) {
  return lerCheckSessao(status, tipo, corpo).estado === "encerrada";
}
async function lerRespostaCheck(r) {
  const tipo = r.headers && typeof r.headers.get === "function" ? r.headers.get("content-type") : null;
  let corpo;
  try {
    corpo = await r.text();
  } catch {
    return { estado: "desconhecido", motivo: "check ileg\xEDvel" };
  }
  return lerCheckSessao(r.status, tipo, corpo);
}
var sessao_encerrada_default = { lerCheckSessao, sessaoEncerradaProvada, lerRespostaCheck };
export {
  sessao_encerrada_default as default,
  lerCheckSessao,
  lerRespostaCheck,
  sessaoEncerradaProvada
};
