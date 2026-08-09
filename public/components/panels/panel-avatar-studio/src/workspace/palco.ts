// workspace/palco.ts — DOMÍNIO da composição do palco 2D (§160–§185,
// §590). @version 1.0.0  @created 2026-08-09  (lote 911–920, decisão
// #93 — componentização fase 3b do ShellStudio)
//
// Constantes, tipos e leitores de preferência LOCAIS do palco que
// viviam no topo do monólito. Movidos VERBATIM para cá para que
// ComposicaoPalco/BarraCenas importem sem dependência circular
// (§3470). Nada aqui entra na serialização do avatar (byte-stability
// por definição): são preferências de apresentação, nunca estado salvo.

// §590 (P9): TEMAS de acento do estúdio — preferência local, nunca flag
export const CHAVE_TEMA = 'dshow.avst5.tema.v1';
export const TEMAS = [
  { id: 'roxo', nome: 'Roxo', cor: '#7c5cff' },
  { id: 'verde', nome: 'Verde', cor: '#39d98a' },
  { id: 'ambar', nome: 'Âmbar', cor: '#e8b64c' },
  { id: 'ciano', nome: 'Ciano', cor: '#4cd9e8' },
] as const;
export type TemaId = (typeof TEMAS)[number]['id'];

export const CHAVE_FUNDO = 'dshow.avst5.fundo.v1';
/** R1 (P1 §9.3) + mega 60 (§160): CENÁRIOS do palco — os 3 clássicos
 *  seguem intactos; dojo/neon/galáxia são os prioritários do briefing. */
export const FUNDOS_CLASSICOS = ['neutro', 'estudio', 'grade', 'dojo', 'neon', 'galaxia'] as const;
// mega 231 (§160.1–.4): cenários PRIORITÁRIOS v2 (flag as5.palco_v2) —
// um por família do briefing: Dshow/corporativo/gamer/sci-fi
export const FUNDOS_V2 = ['showroom', 'escritorio', 'arena', 'cyberpunk'] as const;
export const FUNDOS_PALCO = [...FUNDOS_CLASSICOS, ...FUNDOS_V2] as const;
export type FundoPalco = (typeof FUNDOS_PALCO)[number];
export const ROTULO_FUNDO: Record<FundoPalco, string> = {
  neutro: 'Neutro', estudio: 'Estúdio', grade: 'Grade',
  dojo: 'Dojo', neon: 'Neon', galaxia: 'Galáxia',
  showroom: 'Showroom LED', escritorio: 'Escritório', arena: 'Arena', cyberpunk: 'Cyberpunk',
};
// mega 61 (§162): HORA DO DIA — modificador de luz do cenário
export const HORAS_CLASSICAS = ['dia', 'tarde', 'noite'] as const;
// mega 232 (§162): horas v2 (flag as5.palco_v2)
export const HORAS_V2 = ['amanhecer', 'por-do-sol', 'madrugada'] as const;
export const HORAS_PALCO = [...HORAS_CLASSICAS, ...HORAS_V2] as const;
export type HoraPalco = (typeof HORAS_PALCO)[number];
export const ROTULO_HORA: Record<HoraPalco, string> = {
  dia: 'Dia', tarde: 'Tarde', noite: 'Noite',
  amanhecer: 'Amanhecer', 'por-do-sol': 'Pôr do sol', madrugada: 'Madrugada',
};
// mega 62 (§164): ILUMINAÇÃO 2D — presets de filtro sobre o avatar
export const LUZES_PALCO = ['neutra', 'quente', 'fria', 'dramatica'] as const;
export type LuzPalco = (typeof LUZES_PALCO)[number];
// lote 471-480 (§165, flag as5.luz_contextual): a LUZ segue a HORA no
// modo AUTO — mapeamento fixo e transparente (nada muda sem o usuário
// escolher Auto; presets manuais continuam mandando fora dele)
export const LUZ_POR_HORA: Record<HoraPalco, LuzPalco> = {
  amanhecer: 'neutra', dia: 'neutra', tarde: 'quente',
  'por-do-sol': 'quente', noite: 'dramatica', madrugada: 'fria',
};
export const ROTULO_LUZ: Record<LuzPalco, string> = { neutra: 'Neutra', quente: 'Quente', fria: 'Fria', dramatica: 'Dramática' };
export const CHAVE_HORA = 'dshow.avst5.palco.hora.v1';
export const CHAVE_LUZ = 'dshow.avst5.palco.luz.v1';
// lote 201 (§163): CLIMA do palco — overlay determinístico sobre o cenário
export const CLIMAS_PALCO = ['limpo', 'chuva', 'neve', 'nevoa'] as const;
export type ClimaPalco = (typeof CLIMAS_PALCO)[number];
export const ROTULO_CLIMA: Record<ClimaPalco, string> = { limpo: 'Limpo', chuva: 'Chuva', neve: 'Neve', nevoa: 'Névoa' };
export const CHAVE_CLIMA = 'dshow.avst5.palco.clima.v1';

// mega 233–234 (§161): PROPRIEDADES DO CENÁRIO — preferências LOCAIS do
// palco (nunca tocam o avatar salvo): intensidade de luz, profundidade
// (vinheta), cor ambiente (paleta aprovada) e movimento ("cenário vivo")
export const AMBIENTES_CENARIO = ['nenhuma', 'azul', 'ambar', 'violeta', 'verde'] as const;
export type AmbienteCenario = (typeof AMBIENTES_CENARIO)[number];
export const COR_AMBIENTE: Record<Exclude<AmbienteCenario, 'nenhuma'>, string> = {
  azul: '#4c9de8', ambar: '#e8b64c', violeta: '#7c5cff', verde: '#39d98a',
};
// mega 257 (§119): IDLE 2D — respiração/flutuação/balanço do avatar no
// palco (preferência local; o render salvo é sempre estático)
export const IDLES_2D = ['nenhum', 'respirar', 'flutuar', 'balancar'] as const;
export type Idle2d = (typeof IDLES_2D)[number];
export const ROTULO_IDLE: Record<Idle2d, string> = { nenhum: 'Parado', respirar: 'Respirar', flutuar: 'Flutuar', balancar: 'Balançar' };
export interface PropsCenario { luz: number; profundidade: number; ambiente: AmbienteCenario; vivo: boolean; idle: Idle2d }
export const CENARIO_NEUTRO: PropsCenario = { luz: 1, profundidade: 0, ambiente: 'nenhuma', vivo: false, idle: 'nenhum' };
export const CHAVE_CENARIO_PROPS = 'dshow.avst5.palco.cenario.v1';
export function lerPropsCenario(): PropsCenario {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_CENARIO_PROPS) ?? 'null');
    if (!b || typeof b !== 'object') return { ...CENARIO_NEUTRO };
    return {
      luz: typeof b.luz === 'number' ? Math.max(0.6, Math.min(1.4, b.luz)) : 1,
      profundidade: typeof b.profundidade === 'number' ? Math.max(0, Math.min(1, b.profundidade)) : 0,
      ambiente: (AMBIENTES_CENARIO as readonly string[]).includes(b.ambiente) ? b.ambiente : 'nenhuma',
      vivo: b.vivo === true,
      idle: (IDLES_2D as readonly string[]).includes(b.idle) ? b.idle : 'nenhum',
    };
  } catch { return { ...CENARIO_NEUTRO }; }
}
// mega 65 (§180): PRESETS DE APRESENTAÇÃO {fundo, hora, luz}
export const CHAVE_APRESENTACAO = 'dshow.avst5.apresentacao.v1';
export interface PresetApresentacao { id: string; nome: string; fundo: FundoPalco; hora: HoraPalco; luz: LuzPalco; clima?: ClimaPalco }
export function lerApresentacoes(): PresetApresentacao[] {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_APRESENTACAO) ?? '[]');
    return Array.isArray(b) ? b.filter((p): p is PresetApresentacao =>
      !!p && typeof p.id === 'string' && typeof p.nome === 'string'
      && (FUNDOS_PALCO as readonly string[]).includes(p.fundo)
      && (HORAS_PALCO as readonly string[]).includes(p.hora)
      && (LUZES_PALCO as readonly string[]).includes(p.luz)
      && (p.clima === undefined || (CLIMAS_PALCO as readonly string[]).includes(p.clima))).slice(0, 6) : [];
  } catch { return []; }
}
export function gravarApresentacoes(l: PresetApresentacao[]): void {
  try { localStorage.setItem(CHAVE_APRESENTACAO, JSON.stringify(l.slice(0, 6))); } catch { /* sem storage */ }
}
// lote 175–176 (§185): HISTÓRICO de apresentação — restaurar composição
// completa (interface antes chamada ComposicaoPalco; renomeada p/ o
// componente da fase 3b poder levar o nome do cluster — decisão #93)
export const CHAVE_HIST_PALCO = 'dshow.avst5.palco.hist.v1';
export interface Composicao { fundo: FundoPalco; hora: HoraPalco; luz: LuzPalco; clima?: ClimaPalco }
export function lerHistPalco(): Composicao[] {
  try {
    const b = JSON.parse(localStorage.getItem(CHAVE_HIST_PALCO) ?? '[]');
    return Array.isArray(b) ? b.filter((h): h is Composicao =>
      !!h && (FUNDOS_PALCO as readonly string[]).includes(h.fundo)
      && (HORAS_PALCO as readonly string[]).includes(h.hora)
      && (LUZES_PALCO as readonly string[]).includes(h.luz)
      && (h.clima === undefined || (CLIMAS_PALCO as readonly string[]).includes(h.clima))).slice(-10) : [];
  } catch { return []; }
}
// lote 174 (§179): ponte Coleção → Cenário ("itens sugerem ambiente")
export const COLECAO_CENARIO: Partial<Record<string, FundoPalco>> = {
  col_cyber_nexus: 'neon', col_neon_noturno: 'neon', col_dojo: 'dojo',
  col_galaxia: 'galaxia', col_oito_bits: 'grade', col_executivo: 'estudio',
};
