// engine/camadas.ts — onda 1411 (MEGA_BRIEFING_01 §2381–§2394, §2498–§2510;
// decisão #159): CAMADAS_Z — a ordem de pintura do busto vira DADO explícito
// (z crescente), e ORDEM_CAMADAS é DERIVADA dela. Contrato inviolável:
// a derivação reproduz BYTE A BYTE a lista histórica do render (teste
// golden-classic [A] compara com o snapshot literal) — nenhum avatar salvo
// muda de render por causa desta refatoração.
//
// Regras: z só CRESCE em incrementos de 10 (espaço p/ camadas futuras entre
// vizinhas sem reordenar nada); nunca renumerar camada existente; camada
// nova = z novo + entrada no snapshot do teste no MESMO commit.
// @version 1.0.0  @created 2026-08-20
import type { CamadaId } from '../domain/types';

/** Z de pintura por camada do BUSTO (depois da base; menor = mais atrás). */
export const CAMADAS_Z = {
  // bloco clássico (AS3/AS4) — decisão #41
  roupa: 10,
  roupa_sobre: 20, // §3393 (decisão #95): sobrepeça por cima da roupa
  emblema: 30,
  boca: 40,
  olhos: 50,
  cabelo: 60,
  acessorio: 70, // chave legada (configs antigos sem validar)
  acessorio_pescoco: 80,
  acessorio_cabeca: 90,
  acessorio_rosto: 100,
  // onda 1301+ (decisão #140, as6.acess_v2): slots finos aditivos
  acessorio_costas: 110,
  acessorio_olhos: 120,
  acessorio_orelha: 130,
  acessorio_flutuante: 140,
  acessorio_companheiro: 150,
  // onda 1404 (decisão #154, as6.slots_corpo): corporais (forward-compat
  // no busto — render vazio por contrato; só renderCorpo desenha)
  acessorio_pernas: 160,
  acessorio_pes: 170,
  acessorio_cintura: 180,
  acessorio_pulso_e: 190,
  acessorio_pulso_d: 200,
  acessorio_mao_e: 210,
  acessorio_mao_d: 220,
} as const satisfies Partial<Record<CamadaId, number>>;

export type CamadaZ = keyof typeof CAMADAS_Z;

/** Ordem de pintura DERIVADA (z crescente) — consumida pelo render. */
export const ORDEM_CAMADAS: readonly CamadaZ[] = (Object.entries(CAMADAS_Z) as Array<[CamadaZ, number]>)
  .sort((a, b) => a[1] - b[1])
  .map(([id]) => id);
