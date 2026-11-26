// _shared-react/ag-grid/grade.ts — a TABELA PADRÃO do Dash: AG Grid Community (MIT), decisão do Jhony de 26/11/2026.
// Regra: substitui uma grade existente, nunca vira mais uma. Piloto: Produtos (panel-atributos). Depois: Matriz e Bling contas a pagar.
// Enterprise NÃO é usado (nem comprado): só módulos do pacote `ag-grid-community`.
//
// Uso no modo JavaScript (sem ag-grid-react): `criarGrade(elemento, opcoes)` registra os módulos uma vez, aplica o tema DSHOW
// (tokens --bl-* de styles/tokens.css, claro/escuro automáticos) e os textos em pt-BR (@ag-grid-community/locale).
// NÃO exportado pelo index.ts: quem usa importa '@shared/ag-grid/grade' (o bundle dos outros painéis não muda).
import {
  ModuleRegistry, ClientSideRowModelModule, TextFilterModule, NumberFilterModule, CsvExportModule, CellStyleModule, RowStyleModule,
  ColumnApiModule, LocaleModule, RowSelectionModule, PinnedRowModule, TooltipModule, ColumnAutoSizeModule, RenderApiModule, RowApiModule, ScrollApiModule,
  createGrid, themeQuartz, type GridApi, type GridOptions,
} from 'ag-grid-community';
import { AG_GRID_LOCALE_PT_BR } from '@ag-grid-community/locale';

let registrado = false;
function registrar(): void {
  if (registrado) return;
  ModuleRegistry.registerModules([ClientSideRowModelModule, TextFilterModule, NumberFilterModule, CsvExportModule, CellStyleModule, RowStyleModule,
    ColumnApiModule, LocaleModule, RowSelectionModule, PinnedRowModule, TooltipModule, ColumnAutoSizeModule, RenderApiModule, RowApiModule, ScrollApiModule]);
  registrado = true;
}

/** Tema DSHOW (POC-DATA-GRID.md): Quartz + tokens. Os valores são var(--bl-*): o claro/escuro do Dash vale sem trocar o tema. */
export const temaDshow = themeQuartz.withParams({
  backgroundColor: 'var(--bl-superficie)', foregroundColor: 'var(--bl-texto)', headerBackgroundColor: 'var(--bl-superficie-2, var(--bl-superficie))',
  headerTextColor: 'var(--bl-texto-2, var(--bl-texto))', borderColor: 'var(--bl-borda)', accentColor: 'var(--bl-verde)', chromeBackgroundColor: 'var(--bl-superficie)',
  oddRowBackgroundColor: 'transparent', rowHoverColor: 'var(--bl-verde-suave)', selectedRowBackgroundColor: 'var(--bl-verde-suave)',
  fontFamily: 'var(--bl-fonte)', fontSize: 13, headerFontSize: 12, headerFontWeight: 500, dataFontSize: 13,
  spacing: 6, rowVerticalPaddingScale: 0.6, wrapperBorderRadius: 10, borderRadius: 6, columnBorder: false, headerColumnBorder: false, rowBorder: true,
  inputBackgroundColor: 'var(--bl-superficie)', inputBorder: { color: 'var(--bl-borda)' },
});

/** Padrões da grade do Dash: linhas compactas, ordenação múltipla (Ctrl/⌘ + clique), filtro e redimensionamento em toda coluna. */
export function criarGrade<T>(el: HTMLElement, opcoes: GridOptions<T>): GridApi<T> {
  registrar();
  return createGrid<T>(el, {
    theme: temaDshow, localeText: AG_GRID_LOCALE_PT_BR, rowHeight: 34, headerHeight: 36, animateRows: false, multiSortKey: 'ctrl',
    enableCellTextSelection: true, ensureDomOrder: true, tooltipShowDelay: 400,
    ...opcoes,
    defaultColDef: { sortable: true, resizable: true, filter: true, minWidth: 56, ...opcoes.defaultColDef },
  });
}

/** CSV que abre certo no Excel pt-BR: separador ";" (o BOM UTF-8 o próprio AG Grid já põe no arquivo baixado — conferido no teste logado). */
export function exportarCsv<T>(api: GridApi<T>, nome: string, colunas?: string[]): void {
  api.exportDataAsCsv({ fileName: nome, columnSeparator: ';', ...(colunas ? { columnKeys: colunas } : {}) });
}

export type { GridApi, GridOptions, ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
