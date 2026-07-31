// panel-bling/src/lib/exportar.ts — CSV, XLSX e impressão/PDF (§43)
// @version 1.0.0  @created 2026-07-30
//
// CSV e XLSX são montados no SERVIDOR (`api/bling/controllers/ExportController`).
// Gerar planilha no browser exigiria SheetJS no package.json RAIZ, compartilhado
// por todos os painéis — e .xlsx é só um ZIP de XMLs que o PHP monta de graça.
// Este arquivo só DISPARA o download; quem monta é o backend.
//
// Quando usar cada um:
//   CSV   — colar em outro sistema, ou abrir rápido
//   XLSX  — quando a pessoa vai TRABALHAR na planilha: número é número, data é
//           data, soma e ordena em qualquer locale
//   PDF   — impressão do navegador, que respeita o CSS `@media print` da tela

import { BASE } from '../services/api';

export type Formato = 'csv' | 'xlsx' | 'pdf';

/**
 * Dispara o download pelo navegador.
 *
 * Usa navegação direta em vez de fetch+blob de propósito: o arquivo pode passar
 * de alguns MB, e carregar tudo na memória do browser só para recriar um link é
 * desperdício. A navegação também deixa o próprio navegador mostrar o progresso
 * e tratar o `Content-Disposition`.
 */
export function baixar(
  recurso: string,
  formato: Exclude<Formato, 'pdf'>,
  filtros: Record<string, string | number | undefined>,
): void {
  const params = new URLSearchParams({ formato });
  for (const [k, v] of Object.entries(filtros)) {
    if (v === undefined || v === null || v === '') continue;
    // Parâmetros de paginação e ordenação da TELA não valem para o arquivo:
    // a exportação leva o conjunto filtrado inteiro, não a página visível.
    if (k === 'pagina' || k === 'limite') continue;
    params.set(k, String(v));
  }

  const url = `${BASE}/export/${encodeURIComponent(recurso)}?${params.toString()}`;

  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener';
  // `download` só é respeitado em mesma origem — é o caso. O servidor manda
  // Content-Disposition de qualquer forma, então o nome vem de lá.
  a.download = '';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Impressão / PDF.
 *
 * Abre o diálogo do navegador; o CSS `@media print` do módulo já esconde
 * navegação e barras. "Salvar como PDF" ali produz o mesmo resultado de um
 * gerador no servidor, sem trazer um motor de renderização para o projeto.
 */
export function imprimir(): void {
  window.print();
}
