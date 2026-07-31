/**
 * lib/exporter.ts — exportação da imagem do mapa (PNG) e impressão/PDF.
 * @version 3.0.0
 *
 * PNG: composto em um canvas NOVO a partir do canvas do mapa, com cabeçalho e legenda
 * desenhados por cima. Não usa html2canvas nem nada parecido — o mapa JÁ é canvas, e
 * rasterizar DOM traria uma dependência pesada para reproduzir pior o que o
 * renderizador faz certo. A legenda é redesenhada em código porque os cartões são HTML
 * e não estariam no bitmap.
 *
 * PDF: `window.print()` com folha de impressão dedicada. Gerar PDF no cliente exigiria
 * jsPDF (~150 KB) para entregar um resultado inferior ao "Salvar como PDF" nativo do
 * navegador, que já sai vetorial e respeita o idioma do sistema. O botão diz
 * "Imprimir / PDF" para não prometer um download automático que não acontece.
 */
'use strict';

import type { City } from '@/data/cities';
import { flagOf } from '@/data/cities';
import { fmtDateLong, fmtHM, fmtHMS, fmtWeekday, offsetShort } from '@/lib/time';
import type { ThemeName } from '@/map/renderer';

export interface ExportOptions {
  canvas: HTMLCanvasElement;
  cities: City[];
  date: Date;
  baseTz: string;
  theme: ThemeName;
  /** Multiplicador de resolução sobre o canvas de tela. */
  scale?: number;
}

const HEADER_H = 74;
const FOOTER_ROW_H = 26;
const PAD = 22;

export async function exportPng(opts: ExportOptions): Promise<boolean> {
  const { canvas, cities, date, baseTz, theme } = opts;
  const scale = opts.scale ?? 1;

  const mapW = canvas.width;
  const mapH = canvas.height;
  if (!mapW || !mapH) return false;

  // Legenda em colunas: 3 por linha, para não crescer indefinidamente.
  const perRow = 3;
  const rows = Math.ceil(cities.length / perRow);
  const footerH = cities.length ? PAD + rows * FOOTER_ROW_H + PAD : PAD;

  const out = document.createElement('canvas');
  out.width = Math.round(mapW * scale);
  out.height = Math.round((mapH + HEADER_H + footerH) * scale);
  const ctx = out.getContext('2d');
  if (!ctx) return false;
  ctx.scale(scale, scale);

  const ink = theme === 'dark' ? '#e8edf7' : '#121826';
  const inkSoft = theme === 'dark' ? 'rgba(232,237,247,0.62)' : 'rgba(18,24,38,0.62)';
  const bg = theme === 'dark' ? '#0b0f1a' : '#f4f7fb';
  const line = theme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, mapW, mapH + HEADER_H + footerH);

  // ---- cabeçalho ----
  ctx.fillStyle = ink;
  ctx.font = '600 22px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Relógio Mundial — Centro Global de Tempo', PAD, 34);

  ctx.fillStyle = inkSoft;
  ctx.font = '13px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    `${fmtWeekday(date, baseTz)}, ${fmtDateLong(date, baseTz)} · ${fmtHMS(date, baseTz)} (${baseTz}) · UTC ${fmtHMS(date, 'UTC')}`,
    PAD, 56,
  );

  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HEADER_H - 0.5);
  ctx.lineTo(mapW, HEADER_H - 0.5);
  ctx.stroke();

  // ---- mapa ----
  ctx.drawImage(canvas, 0, HEADER_H, mapW, mapH);

  // ---- legenda ----
  if (cities.length) {
    const y0 = HEADER_H + mapH;
    ctx.strokeStyle = line;
    ctx.beginPath();
    ctx.moveTo(0, y0 + 0.5);
    ctx.lineTo(mapW, y0 + 0.5);
    ctx.stroke();

    const colW = (mapW - PAD * 2) / perRow;
    cities.forEach((city, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = PAD + col * colW;
      const y = y0 + PAD + row * FOOTER_ROW_H + 14;

      ctx.fillStyle = ink;
      ctx.font = '600 14px ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, monospace';
      ctx.fillText(fmtHM(date, city.tz), x, y);

      ctx.fillStyle = ink;
      ctx.font = '13px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${flagOf(city.cc)} ${city.name}`, x + 58, y);

      ctx.fillStyle = inkSoft;
      ctx.font = '11px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`UTC${offsetShort(date, city.tz)}`, x + colW - 66, y);
    });
  }

  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'));
  if (!blob) return false;

  const stamp = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
  triggerDownload(blob, `relogio-mundial_${stamp}.png`);
  return true;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revogar na hora cancelaria o download em alguns navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Abre o diálogo de impressão do navegador com a folha `@media print` do painel
 * ativa — de onde sai o PDF vetorial via "Salvar como PDF".
 */
export function printPanel(): void {
  window.print();
}
