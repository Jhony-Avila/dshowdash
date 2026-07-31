// lib/exportar.ts — exportação de relatório (§64.1).
// @version 1.0.0  @created 2026-07-30
//
// CSV, XLSX E IMPRESSÃO/PDF.
//
// O XLSX é gerado no SERVIDOR (`api/google-calendar/lib/GcalXlsx.php`), não
// aqui. A razão: fazer planilha no browser exigiria SheetJS no `package.json`
// RAIZ, compartilhado por todos os painéis. Mas .xlsx é só um ZIP de XMLs e o
// PHP já traz ZipArchive — no servidor não há dependência nova, e o arquivo é
// legítimo (nada de "xls" que é HTML renomeado, que faz o Excel avisar formato
// inválido). Por isso este arquivo só BAIXA o xlsx; quem monta é o backend.
//
// Quando usar cada um: CSV para colar em outro sistema; XLSX quando a pessoa
// vai SOMAR, ORDENAR ou FILTRAR — no CSV todo valor é texto e o Excel adivinha
// o tipo pelo locale da máquina.
//
// Duas armadilhas de CSV em pt-BR que este arquivo resolve:
//  1. SEPARADOR — o Excel em locale pt-BR espera `;`. Com vírgula, tudo cai
//     numa coluna só e o usuário conclui que o export está quebrado.
//  2. BOM UTF-8 — sem ele, "Reunião" vira "ReuniÃ£o" no Excel.
import type { ColunaRelatorio, LinhaRelatorio } from '../services/types';

/** Formata um valor para a célula do CSV, respeitando o tipo declarado. */
function valorCsv(v: unknown, tipo: string): string {
  if (v === null || v === undefined) return '';
  if (tipo === 'duracao') {
    const min = Number(v) || 0;
    // Número puro em minutos: no CSV o usuário quer somar, não ler "1h30".
    return String(min);
  }
  if (tipo === 'numero' || tipo === 'percentual') {
    // Decimal com vírgula: é o que o Excel pt-BR entende como número.
    return String(v).replace('.', ',');
  }
  return String(v);
}

function escapar(s: string): string {
  // Aspas duplas quando houver separador, aspas ou quebra de linha.
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function gerarCsv(
  colunas: ColunaRelatorio[],
  linhas: LinhaRelatorio[],
  totais: Record<string, number>,
  cabecalho: string[]
): string {
  const out: string[] = [];

  // Cabeçalho de contexto (título, período, fuso) — um CSV sem isso vira um
  // arquivo órfão na pasta Downloads daqui a duas semanas.
  cabecalho.forEach((l) => out.push(escapar(l)));
  if (cabecalho.length) out.push('');

  out.push(colunas.map((c) => escapar(c.rotulo + (c.tipo === 'duracao' ? ' (min)' : ''))).join(';'));

  for (const l of linhas) {
    out.push(colunas.map((c) => escapar(valorCsv(l[c.id], c.tipo))).join(';'));
  }

  const temTotal = colunas.some((c) => c.total);
  if (temTotal) {
    out.push(colunas.map((c, i) => {
      if (i === 0) return escapar('TOTAL');
      if (!c.total) return '';
      return escapar(valorCsv(totais[c.id] ?? 0, c.tipo));
    }).join(';'));
  }

  return out.join('\r\n');
}

/** Dispara o download com BOM UTF-8. */
export function baixarCsv(nome: string, conteudo: string): void {
  const BOM = '﻿';
  const blob = new Blob([BOM + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome.endsWith('.csv') ? nome : `${nome}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoga no próximo tick: revogar na hora cancela o download em alguns browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Baixa o XLSX montado pelo servidor.
 *
 * Via `fetch` + Blob, e não um `<a href>` simples: a rota exige sessão e, se
 * algo falhar, o backend responde JSON — que num link vira uma aba com texto
 * cru na cara do usuário. Aqui o erro é lido e devolvido como mensagem.
 */
export async function baixarXlsx(
  tipo: string, params: URLSearchParams, nome: string
): Promise<void> {
  const url = `/api/google-calendar/reports/${encodeURIComponent(tipo)}`
            + `?${params.toString()}&formato=xlsx`;
  const res = await fetch(url, { credentials: 'same-origin' });

  if (!res.ok || (res.headers.get('content-type') ?? '').includes('json')) {
    let msg = 'Não foi possível gerar a planilha.';
    try {
      const j = await res.json();
      // Envelope do projeto é {ok, data, error, meta} — nunca `success`.
      msg = j?.meta?.message ?? j?.error ?? msg;
    } catch { /* resposta não-JSON: fica a mensagem padrão */ }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = nome.endsWith('.xlsx') ? nome : `${nome}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/**
 * Impressão / PDF.
 *
 * Usa `window.print()` do próprio documento, com uma classe no root que o CSS
 * de impressão consome. Abrir uma janela nova e reconstruir o HTML lá seria
 * mais controlável, mas perde os tokens do tema e é bloqueado por popup blocker
 * — e o navegador já oferece "Salvar como PDF" no diálogo de impressão.
 */
export function imprimirRelatorio(): void {
  const raiz = document.documentElement;
  raiz.classList.add('gc-imprimindo');
  const limpar = () => {
    raiz.classList.remove('gc-imprimindo');
    window.removeEventListener('afterprint', limpar);
  };
  window.addEventListener('afterprint', limpar);
  window.print();
  // Rede de segurança: em alguns browsers `afterprint` não dispara se o
  // usuário cancela no diálogo.
  setTimeout(limpar, 60000);
}

export function nomeArquivo(tipo: string, de: string, ate: string): string {
  return `google-calendar-${tipo}-${de}_a_${ate}`;
}
