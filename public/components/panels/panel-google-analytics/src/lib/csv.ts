// lib/csv.ts — exportação CSV (§51.2).
// @version 1.0.0  @created 2026-07-30
//
// ⚠️ TRÊS DETALHES QUE DECIDEM SE O ARQUIVO ABRE CERTO NO EXCEL pt-BR:
//
// 1. **Separador `;`**, não vírgula. No Excel configurado em português o separador de lista é
//    ponto-e-vírgula; com vírgula tudo cai numa coluna só e o usuário conclui que a exportação
//    está quebrada.
// 2. **BOM UTF-8** no início do arquivo. Sem ele o Excel lê como Latin-1 e "Localizações" vira
//    "LocalizaÃ§Ãµes". É um único caractere invisível que separa arquivo usável de arquivo lixo.
// 3. **Decimal com vírgula**. `1.234,56` em vez de `1234.56`, senão o Excel trata número como
//    texto e não soma. Este é o mesmo problema que o projeto já teve na entrada de dados
//    monetários (`Number("12,50")` = NaN) — aqui é o caminho inverso.
//
// Não há biblioteca envolvida: `Blob` + `URL.createObjectURL` resolvem, e instalar um pacote de
// XLSX mexeria no `package.json` da RAIZ, que afeta o build de todos os painéis.

/** Escapa um campo para CSV com separador `;`. */
function campo(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = String(v);
  // Número: troca o ponto decimal por vírgula (só quando é claramente numérico).
  if (typeof v === 'number' && Number.isFinite(v)) {
    s = v.toLocaleString('pt-BR', { maximumFractionDigits: 4, useGrouping: false });
  }
  // Aspas duplicadas + envelope quando há separador, quebra de linha ou aspas.
  if (/[;"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export interface ColunaCsv<T> {
  rotulo: string;
  valor: (linha: T) => unknown;
}

/**
 * Gera o texto CSV. Separado do download para poder ser testado sem DOM.
 */
export function gerarCsv<T>(colunas: ColunaCsv<T>[], linhas: T[]): string {
  const cab = colunas.map((c) => campo(c.rotulo)).join(';');
  const corpo = linhas.map((l) => colunas.map((c) => campo(c.valor(l))).join(';'));
  // \r\n: o Excel no Windows é menos tolerante com \n solto.
  return [cab, ...corpo].join('\r\n');
}

/** Dispara o download no navegador. */
export function baixarCsv(nomeBase: string, conteudo: string): void {
  const BOM = '﻿';                       // ver detalhe 2 no topo
  const blob = new Blob([BOM + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const agora = new Date();
  const stamp = [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, '0'),
    String(agora.getDate()).padStart(2, '0'),
  ].join('-');
  a.href = url;
  a.download = `${nomeBase}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // ⚠️ Sem o revoke o blob fica retido na memória da aba até o reload. Numa tela de análise em
  // que o usuário exporta várias vezes, isso acumula.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportar<T>(nomeBase: string, colunas: ColunaCsv<T>[], linhas: T[]): void {
  baixarCsv(nomeBase, gerarCsv(colunas, linhas));
}
