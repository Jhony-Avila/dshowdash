// art-intake/ancoras.mjs — FONTE ÚNICA de vocabulário de ÂNCORAS do intake.
//
// D-01 (readiness): o validador de contrato exigia nomes de âncora que divergiam
// do idioma que o ilustrador segue. Como o MOTOR não consome nome de âncora
// (heroAssetImport só coleta {nome,x,y} genéricos — não posiciona por nome), a
// fonte de verdade dos NOMES é o contrato de autoria já existente no repo:
//   • V4_HERO_ASSET_TEMPLATE.svg (âncoras que o molde EMBARCA: gola, ombroL,
//     ombroR, cintura, bainha);
//   • V4_ART_AUTHORING_KIT.md §7 (tabela de âncoras mínimas por categoria);
//   • engine/footwear.ts (zonas/âncora do pé: tornozelo, sola).
// NÃO se inventa uma segunda linguagem: os canônicos abaixo são exatamente os
// desses contratos. Aliases existem SÓ para retrocompat (nomes antigos que as
// fixtures/pedidos usaram) e nunca introduzem um nome novo.
//
// Modelo: cada família = lista de GRUPOS de requisito. Um grupo é satisfeito se
// QUALQUER sinônimo do grupo estiver declarado. O 1º nome do grupo é o CANÔNICO;
// os demais são aliases de compat. Assim uma peça canônica e uma legada passam,
// e a mensagem de erro sempre mostra o nome CANÔNICO esperado.
//
// @version 1.0.0  @created 2026-08-28 (ART INTAKE HARDENING — decisão pendente
//   D-01/D-04; NÃO altera motor/produto)

/** família → grupos de requisito [canônico, ...aliases]. */
export const ANCORAS_FAMILIA = {
  // rosto (busto): kit §7 `olhoL, olhoR, nariz, boca, queixo` → mínimo identidade
  rosto: [['olhoL', 'olhoE'], ['olhoR', 'olhoD'], ['boca']],
  // cabelo (busto): kit §7 `coroa, testa, orelhaL, orelhaR, nuca`
  cabelo: [['coroa', 'topo'], ['testa']],
  // mão: pedido HAND `punho, ...`
  mao: [['punho']],
  // calçado: kit §7 `tornozelo, calcanhar, biqueira, sola` + footwear.ts zona `sola`
  calcado: [['tornozelo'], ['sola', 'solado']],
  // roupa torso: template + kit §7 `gola, ombroL, ombroR, cintura, bainha`
  roupa: [['gola'], ['cintura'], ['bainha', 'barra']],
  // roupa inferior: kit §7 `cos, quadrilL, quadrilR, bainhaL, bainhaR` (D-04)
  roupa_inferior: [['cos', 'cintura'], ['bainhaL', 'barraL'], ['bainhaR', 'barraR']],
  // corpo (body): kit §2 âncoras corporais — mínimo estrutural ombros+cintura
  corpo: [['ombroL', 'ombroE'], ['ombroR', 'ombroD'], ['cintura']],
};

export const FAMILIAS = new Set(Object.keys(ANCORAS_FAMILIA));

/** nomes CANÔNICOS de uma família (para mensagens). */
export function canonicos(familia) {
  return (ANCORAS_FAMILIA[familia] || []).map((g) => g[0]);
}

/** grupos NÃO satisfeitos → devolve o nome canônico de cada requisito faltante. */
export function faltantes(familia, declaradas) {
  const set = declaradas instanceof Set ? declaradas : new Set(declaradas);
  return (ANCORAS_FAMILIA[familia] || []).filter((g) => !g.some((n) => set.has(n))).map((g) => g[0]);
}

/** aliases legados efetivamente usados (para a mensagem "recebido X, canônico Y"). */
export function aliasesUsados(familia, declaradas) {
  const set = declaradas instanceof Set ? declaradas : new Set(declaradas);
  const out = [];
  for (const g of (ANCORAS_FAMILIA[familia] || [])) {
    for (let i = 1; i < g.length; i++) if (set.has(g[i]) && !set.has(g[0])) out.push({ recebido: g[i], canonico: g[0] });
  }
  return out;
}
