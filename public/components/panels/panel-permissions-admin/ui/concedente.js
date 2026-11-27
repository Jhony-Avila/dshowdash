const MODULE_ID = "uarps-admin:concedente";
function estadoAlcada(d) {
  const e = d?.alcada_estado;
  const ok = (v) => e === void 0 || e === v;
  if (d?.perdeu_alcada === true && d?.concedente_alcada_atual === false && ok("sem_alcada")) return "sem_alcada";
  if (d?.perdeu_alcada === false && d?.concedente_alcada_atual === true && ok("com_alcada")) return "com_alcada";
  return "indisponivel";
}
function dataConcessao(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?/.exec(String(v ?? ""));
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}${m[5] ? "." + (m[5] + "00").slice(0, 3) : ""}` : null;
}
const MOTIVO = {
  nivel_insuficiente: "o n\xEDvel dele est\xE1 abaixo do m\xEDnimo da capacidade",
  sem_administracao: "ele n\xE3o administra mais permiss\xF5es",
  sem_a_capacidade: "ele n\xE3o possui mais esta capacidade"
};
function motivoAlcada(m) {
  return typeof m === "string" && m !== "" ? MOTIVO[m] ?? m : null;
}
function concedente(d) {
  if (!d || d.concedente_id === null || d.concedente_id === void 0) return { texto: "", id: null, estado: null, concedidoEm: null };
  const quando = dataConcessao(d.granted_at);
  const nivel = d.concedente_nivel_atual === null || d.concedente_nivel_atual === void 0 ? "sem papel ativo" : `n\xEDvel atual ${d.concedente_nivel_atual}`;
  const estado = estadoAlcada(d);
  let t = ` \xB7 Concedido por #${d.concedente_id} ${quando ? `em ${quando}` : "(data da concess\xE3o indispon\xEDvel)"} (${nivel})`;
  const mot = motivoAlcada(d.alcada_motivo);
  if (estado === "sem_alcada") t += ` \xB7 o concedente perdeu a al\xE7ada sobre esta capacidade${mot ? ` (${mot})` : ""} \xB7 a regra continua valendo at\xE9 o prazo`;
  else if (estado === "indisponivel") t += " \xB7 Al\xE7ada indispon\xEDvel: n\xE3o foi poss\xEDvel confirmar a al\xE7ada do concedente agora (a regra continua valendo at\xE9 o prazo)";
  return { texto: t, id: String(d.concedente_id), estado, concedidoEm: quando, motivo: estado === "sem_alcada" && typeof d.alcada_motivo === "string" ? d.alcada_motivo : null };
}
function atributosConcedente(c) {
  if (!c.id) return "";
  const esc = (s) => s.replace(/[&<>"]/g, "");
  return `data-uarps-concedente="${esc(c.id)}" data-uarps-alcada="${c.estado}" ${c.estado === "sem_alcada" ? 'data-uarps-perdeu-alcada="1" ' : ""}${c.motivo ? `data-uarps-alcada-motivo="${esc(c.motivo)}" ` : ""}${c.concedidoEm ? `data-uarps-concedido-em="${esc(c.concedidoEm)}" ` : ""}`;
}
var concedente_default = { estadoAlcada, dataConcessao, motivoAlcada, concedente, atributosConcedente, MODULE_ID };
export {
  MODULE_ID,
  atributosConcedente,
  concedente,
  dataConcessao,
  concedente_default as default,
  estadoAlcada,
  motivoAlcada
};
