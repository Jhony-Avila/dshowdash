// Exportação CSV do resultado (já filtrado/ordenado), respeitando as colunas VISÍVEIS e o
// formato pt-BR de cada célula (usa col.render().text). Abre direto no Excel (BOM UTF-8 + ';').
import type { ColumnDef } from '../dataGrid';

function esc(v: any): string {
  const s = v == null ? '' : String(v);
  return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function buildCsv(cols: ColumnDef[], rows: any[]): string {
  const header = cols.map((c) => esc(c.label)).join(';');
  const body = rows.map((r) => cols.map((c) => esc(c.render(r).text)).join(';'));
  return '﻿' + [header, ...body].join('\r\n'); // BOM p/ o Excel reconhecer UTF-8
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
