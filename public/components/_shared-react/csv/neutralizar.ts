// csv/neutralizar.ts (AZUL/ESQUERDA, 27/11 · CSV/Excel Injection) — UM critério para toda exportação CSV do Dash.
// Texto que o Excel/LibreOffice/Sheets interpretaria como FÓRMULA (começa com = + - @, TAB, CR, LF — também depois de espaços,
// NBSP ou espaço ideográfico, e nas formas de largura total ＝＋－＠) ganha um apóstrofo na frente: a planilha mostra o texto, não executa.
// Números TIPADOS (number/bigint) e booleanos passam intactos (um negativo genuíno continua número). Nulo/indefinido = vazio.
const PERIGOSO = /^[\s  -​　﻿]*[=+\-@＝＋－＠\t\r\n]/u;

/** Valor de UMA célula de CSV com a fórmula neutralizada (sem aspas: o escape de ; " CR LF é do chamador). */
export function neutralizarFormula(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean') return String(v);
  const s = String(v);
  return PERIGOSO.test(s) ? `'${s}` : s;
}

/** Célula pronta para CSV com ';': neutraliza a fórmula e põe aspas quando há ; " CR ou LF. */
export function celulaCsv(v: unknown): string {
  const s = neutralizarFormula(v);
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
