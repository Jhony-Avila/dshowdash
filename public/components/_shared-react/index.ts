// _shared-react/index.ts — ponto de entrada da biblioteca compartilhada
// @version 1.0.0  @created 2026-07-30
//
// Extraída na entrega do módulo Bling (decisão 8.4 do dono, 2026-07-30).
// O Bling é o primeiro consumidor. Pipedrive, DataTables e Google Calendar
// mantêm suas cópias locais até serem migrados um a um, com aceite próprio —
// NENHUM painel que já está no ar é tocado por esta extração.
//
// Consumo: alias `@shared` no vite.config.ts de cada painel.

export * from './lib/formato';
export * from './components/Primitivos';
export * from './components/DataGrid';
export * from './components/Painel';
