// services/AvatarCatalog.ts — catálogo oficial do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Fonte única de verdade sobre itens, categorias, raridades, cores sugeridas,
// presets e validação de config. O motor (engine/render) recebe o resolvedor
// daqui — nenhum outro módulo importa as partes diretamente.
import type {
  AvatarConfig, CategoriaId, CategoriaMeta, GrupoId, Preset, Raridade, SlotCor,
} from '../domain/types';
import { CORES_PADRAO, normalizarHex } from '../engine/cores';
import type { ParteDef } from '../engine/base-api';
import { renderAvatar, renderDataUri, hashConfig } from '../engine/render';
import type { OpcoesRender } from '../engine/render';
import { BASES } from '../engine/partes/bases';
import { ESPECIES } from '../engine/partes/especies';
import { CABELOS } from '../engine/partes/cabelos';
import { OLHOS } from '../engine/partes/olhos';
import { BOCAS } from '../engine/partes/bocas';
import { ROUPAS } from '../engine/partes/roupas';
import { ACESSORIOS } from '../engine/partes/acessorios';
import { FUNDOS } from '../engine/partes/fundos';
import { MOLDURAS } from '../engine/partes/molduras';
import { EFEITOS } from '../engine/partes/efeitos';
import { AURAS } from '../engine/partes/auras';
import { BANNERS } from '../engine/partes/banners';
import { EMBLEMAS } from '../engine/partes/emblemas';

export const VERSAO_CONFIG = 1;

// ── Categorias (ordem = ordem da sidebar do studio) ─────────────────

// Grupos e categorias ESPELHAM a taxonomia do banco (avatar_category_groups/
// avatar_categories) — quando a flag avatar_catalog_db ligar, a fonte troca
// para /api/avatar/catalog.php?taxonomia=1 sem mudança de interface.
export const GRUPOS: Array<{ id: GrupoId; nome: string }> = [
  { id: 'identidade',    nome: 'Identidade' },
  { id: 'corpo',         nome: 'Corpo' },
  { id: 'cabelo',        nome: 'Cabelo' },
  { id: 'vestuario',     nome: 'Vestuário' },
  { id: 'equipamentos',  nome: 'Equipamentos' },
  { id: 'poderes',       nome: 'Poderes' },
  { id: 'aparencia',     nome: 'Aparência' },
  { id: 'personalidade', nome: 'Personalidade' },
];

export const CATEGORIAS: CategoriaMeta[] = [
  { id: 'base',      nome: 'Rosto',      obrigatoria: true,  grupo: 'identidade' },
  { id: 'cabelo',    nome: 'Cabelo',     obrigatoria: false, grupo: 'cabelo' },
  { id: 'olhos',     nome: 'Olhos',      obrigatoria: true,  grupo: 'corpo' },
  { id: 'boca',      nome: 'Boca',       obrigatoria: true,  grupo: 'corpo' },
  { id: 'roupa',     nome: 'Roupa',      obrigatoria: true,  grupo: 'vestuario' },
  { id: 'acessorio', nome: 'Acessório',  obrigatoria: false, grupo: 'equipamentos' },
  { id: 'fundo',     nome: 'Fundo',      obrigatoria: true,  grupo: 'aparencia' },
  { id: 'moldura',   nome: 'Moldura',    obrigatoria: false, grupo: 'aparencia' },
  { id: 'efeito',    nome: 'Efeito',     obrigatoria: false, grupo: 'poderes' },
  // Expansão (decisão #33 — 2D imediato nas categorias de baixo custo)
  { id: 'aura',      nome: 'Aura',       obrigatoria: false, grupo: 'poderes' },
  { id: 'banner',    nome: 'Banner',     obrigatoria: false, grupo: 'aparencia' },
  { id: 'emblema',   nome: 'Emblema',    obrigatoria: false, grupo: 'equipamentos' },
];

// ── Títulos (Expansão §27) — dados puros: exibidos como selo, fora do SVG ──
export interface Titulo {
  id: string;
  nome: string;
  raridade: Raridade;
  lore: string;
}

export const TITULOS: Titulo[] = [
  { id: 'tit_estrategista', nome: 'Estrategista', raridade: 'incomum', lore: 'Três jogadas à frente, sempre.' },
  { id: 'tit_pro_player', nome: 'Pro Player', raridade: 'raro', lore: 'O GG dele ecoa na arena até hoje.' },
  { id: 'tit_elite_trader', nome: 'Elite Trader', raridade: 'raro', lore: 'Compra no fundo. Vende no topo. Repete.' },
  { id: 'tit_cyber_architect', nome: 'Cyber Architect', raridade: 'epico', lore: 'Desenha sistemas que sonham em produção.' },
  { id: 'tit_nexus_commander', nome: 'Nexus Commander', raridade: 'epico', lore: 'Todos os nós da rede respondem ao seu comando.' },
  { id: 'tit_mestre_da_luz', nome: 'Mestre da Luz', raridade: 'lendario', lore: 'Onde ele passa, o dashboard acende.' },
  { id: 'tit_ceo_supremo', nome: 'CEO Supremo', raridade: 'lendario', lore: 'A última palavra em qualquer reunião.' },
  { id: 'tit_lenda_dshow', nome: 'Lenda Dshow', raridade: 'exclusivo', lore: 'O nome que a casa conta para os novatos.' },
];

const TITULOS_POR_ID = new Map(TITULOS.map((t) => [t.id, t]));

export function tituloPorId(id: string | undefined): Titulo | undefined {
  return id ? TITULOS_POR_ID.get(id) : undefined;
}

// ── Arquétipos (Expansão §1) — a PRIMEIRA decisão do usuário ────────
// Kits de identidade completos: base + camadas + cores + título sugerido.
// "Presets de identidade" estão na lista 2D imediata da decisão #33.

export interface Arquetipo {
  id: string;
  nome: string;
  papel: string;
  raridade: Raridade;
  base: string;
  camadas: AvatarConfig['camadas'];
  cores: Partial<Record<SlotCor, string>>;
  titulo?: string;
}

export const ARQUETIPOS: Arquetipo[] = [
  { id: 'arq_executivo', nome: 'Executivo', papel: 'Fecha o trimestre antes do café esfriar.', raridade: 'comum',
    base: 'bas_classica', camadas: { cabelo: 'cab_curto', olhos: 'olh_serio', boca: 'boc_neutra', roupa: 'rou_social', fundo: 'fun_estudio', banner: 'ban_executivo', emblema: 'emb_elite' },
    cores: { roupa: '#1c2433', destaque: '#e8b64c' }, titulo: 'tit_elite_trader' },
  { id: 'arq_ceo', nome: 'CEO', papel: 'A última palavra — e a primeira visão.', raridade: 'lendario',
    base: 'bas_angular', camadas: { cabelo: 'cab_topete', olhos: 'olh_focado', boca: 'boc_determinada', roupa: 'rou_terno', acessorio: 'ace_oculos', fundo: 'fun_estudio', banner: 'ban_executivo', emblema: 'emb_diamond' },
    cores: { roupa: '#14213d', destaque: '#e8b64c' }, titulo: 'tit_ceo_supremo' },
  { id: 'arq_engenheiro', nome: 'Engenheiro', papel: 'Se está de pé, foi ele que estruturou.', raridade: 'comum',
    base: 'bas_classica', camadas: { cabelo: 'cab_coque', olhos: 'olh_focado', boca: 'boc_neutra', roupa: 'rou_camiseta', acessorio: 'ace_oculos', fundo: 'fun_grade', emblema: 'emb_nexus' },
    cores: { roupa: '#2563eb', destaque: '#4c9de8' } },
  { id: 'arq_programador', nome: 'Programador', papel: 'Compila sonhos. Debuga pesadelos.', raridade: 'raro',
    base: 'bas_classica', camadas: { cabelo: 'cab_franja', olhos: 'olh_cansado', boca: 'boc_lado', roupa: 'rou_hoodie', acessorio: 'ace_fone', fundo: 'fun_circuito', efeito: 'efe_chuva', emblema: 'emb_cyber' },
    cores: { roupa: '#0f766e', destaque: '#4cd97c' }, titulo: 'tit_cyber_architect' },
  { id: 'arq_comercial', nome: 'Comercial', papel: 'O funil respeita quem sorri primeiro.', raridade: 'comum',
    base: 'bas_angular', camadas: { cabelo: 'cab_topete', olhos: 'olh_feliz', boca: 'boc_sorriso', roupa: 'rou_social', fundo: 'fun_estudio', emblema: 'emb_elite' },
    cores: { roupa: '#5b3a8f', destaque: '#ff5f8f' } },
  { id: 'arq_cientista', nome: 'Cientista', papel: 'Hipótese, teste, verdade. Nessa ordem.', raridade: 'raro',
    base: 'bas_classica', camadas: { cabelo: 'cab_cacheado', olhos: 'olh_brilho', boca: 'boc_surpresa', roupa: 'rou_camiseta', acessorio: 'ace_oculos', fundo: 'fun_lab', aura: 'aur_plasma' },
    cores: { roupa: '#e8ecf5', destaque: '#4cd9e8' } },
  { id: 'arq_hacker', nome: 'Hacker', papel: 'As portas não sabem que estão abertas.', raridade: 'epico',
    base: 'bas_classica', camadas: { cabelo: 'cab_cyber', olhos: 'olh_misterioso', boca: 'boc_lado', roupa: 'rou_jaqueta', fundo: 'fun_circuito', efeito: 'efe_glitch', banner: 'ban_cyber', emblema: 'emb_cyber' },
    cores: { roupa: '#101726', destaque: '#4cd97c' } },
  { id: 'arq_operador', nome: 'Operador', papel: 'Sintético, pontual e impossível de travar.', raridade: 'epico',
    base: 'bas_androide', camadas: { olhos: 'olh_led', boca: 'boc_grade', roupa: 'rou_armadura', fundo: 'fun_led_wall', aura: 'aur_neon', emblema: 'emb_nexus' },
    cores: { pele: '#c8d4e8', destaque: '#4cd9e8' }, titulo: 'tit_nexus_commander' },
  { id: 'arq_samurai', nome: 'Samurai', papel: 'Treina antes do stand-up. Todos os dias.', raridade: 'epico',
    base: 'bas_angular', camadas: { cabelo: 'cab_coque', olhos: 'olh_serio', boca: 'boc_determinada', roupa: 'rou_kimono', fundo: 'fun_dojo', aura: 'aur_cristal' },
    cores: { roupa: '#d64545', destaque: '#ff5230' } },
  { id: 'arq_guerreiro', nome: 'Guerreiro', papel: 'A matilha confia. A meta cai.', raridade: 'epico',
    base: 'bas_lobo', camadas: { olhos: 'olh_serio', boca: 'boc_determinada', roupa: 'rou_armadura', fundo: 'fun_arena', aura: 'aur_eletrica', emblema: 'emb_elite' },
    cores: { destaque: '#ff5230' } },
  { id: 'arq_explorador', nome: 'Explorador', papel: 'O mapa termina onde ele começa.', raridade: 'raro',
    base: 'bas_raposa', camadas: { olhos: 'olh_brincalhao', boca: 'boc_sorriso', roupa: 'rou_jaqueta', acessorio: 'ace_cachecol', fundo: 'fun_aurora', banner: 'ban_galaxy' },
    cores: { destaque: '#e8b64c' } },
  { id: 'arq_piloto', nome: 'Piloto', papel: 'Viu a Terra de cima e voltou com metas maiores.', raridade: 'lendario',
    base: 'bas_classica', camadas: { cabelo: 'cab_curto', olhos: 'olh_visor', boca: 'boc_determinada', roupa: 'rou_astronauta', fundo: 'fun_nebulosa', banner: 'ban_galaxy', aura: 'aur_plasma' },
    cores: { roupa: '#e8ecf5', destaque: '#4c9de8' } },
];

/** Aplica o arquétipo como PRIMEIRA decisão: kit completo, sempre validado. */
export function aplicarArquetipo(a: Arquetipo, atual: AvatarConfig): AvatarConfig {
  return validarConfig({
    ...CONFIG_PADRAO,
    base: a.base,
    camadas: { ...a.camadas },
    cores: { ...CONFIG_PADRAO.cores, pele: atual.cores.pele, ...a.cores },
    titulo: a.titulo,
  });
}

// ── Raridades (metadados de UI: selo, cor, peso no sorteio) ─────────

export const RARIDADES: Record<Raridade, { nome: string; cor: string; peso: number; nivel: number }> = {
  comum:     { nome: 'Comum',     cor: '#9aa4b8', peso: 40, nivel: 0 },
  incomum:   { nome: 'Incomum',   cor: '#4cd97c', peso: 28, nivel: 1 },
  raro:      { nome: 'Raro',      cor: '#4c9de8', peso: 16, nivel: 2 },
  epico:     { nome: 'Épico',     cor: '#b06ce8', peso: 9,  nivel: 3 },
  lendario:  { nome: 'Lendário',  cor: '#e8b64c', peso: 5,  nivel: 4 },
  mitico:    { nome: 'Mítico',    cor: '#ff5230', peso: 3,  nivel: 5 },
  exclusivo: { nome: 'Exclusivo', cor: '#ff5f8f', peso: 2,  nivel: 6 },
};

/** Nível numérico da raridade (comparações: celebração, ordenação). */
export function nivelRaridade(r: Raridade): number {
  return RARIDADES[r].nivel;
}

// ── Lore (AS3 §9 — obrigatória de raro pra cima; tooltip rica) ──────
// Centralizada aqui para não tocar nos arquivos de arte do motor.

const LORES: Record<string, string> = {
  // raros
  cab_longo: 'Dizem que cresceu um centímetro a cada meta batida. Ninguém ousou duvidar.',
  cab_moicano: 'Forjado numa madrugada de deploy sem rollback. Sobreviveu. A crista ficou.',
  olh_brilho: 'Quem viu o dashboard todo verde pela primeira vez nunca mais olhou igual.',
  olh_led: 'Óptica sintética calibrada em 60fps. Não pisca — renderiza.',
  boc_grade: 'O alto-falante original do primeiro LED Bot da Dshow. Ainda ecoa.',
  rou_jaqueta: 'Costurada para quem cruza a linha de chegada antes do relatório carregar.',
  rou_gamer: 'Jersey da primeira line-up campeã. O raio no peito não é enfeite — é aviso.',
  ace_bone: 'Aba reta, ego alinhado. Edição de estreia da collab que nunca foi anunciada.',
  fun_circuito: 'Um recorte da placa-mãe do servidor original, energizada até hoje.',
  fun_nebulosa: 'Poeira de estrela recolhida no exato instante em que uma ideia nasceu.',
  mol_tech: 'Suportes de HUD arrancados de um cockpit de simulação militar.',
  efe_aura: 'Vaza energia de quem carrega o trimestre nas costas. Contenha-se.',
  efe_chuva: 'Fragmento do código-fonte primordial. Se você lê os símbolos, já é tarde.',
  efe_particulas: 'Cada ponto de luz é uma tarefa concluída flutuando em paz.',
  // épicos
  bas_androide: 'Chassi da série NEXUS-7, aposentado do laboratório com honras e segredos.',
  cab_cyber: 'O undercut oficial da resistência digital. As trilhas raspadas brilham no escuro.',
  olh_visor: 'HUD tático de quem enxerga o funil inteiro antes do lead piscar.',
  rou_terno: 'Alfaiataria de guerra corporativa. Cada costura fechou um contrato.',
  ace_headset: 'As conchas que ouviram o "GG" da grande final. O RGB nunca apagou.',
  fun_aurora: 'O céu polar que apareceu uma única noite sobre o data center.',
  mol_neon: 'Tubo de neon soprado por um artesão de arcade em 1989. Ainda pulsa.',
  // lendários
  bas_holo: 'Projeção volumétrica de uma consciência que escolheu ficar.',
  rou_armadura: 'Peitoral NEXUS com núcleo de energia própria. Bate no ritmo do usuário.',
  ace_coroa: 'Só encosta na cabeça de quem já foi Top 1. Ela sabe. Sempre soube.',
  fun_arena: 'A arena lotada no ponto exato do último round. O grito ficou preso aqui.',
  mol_ouro: 'Fundida com o ouro das metas impossíveis. As gemas são as exceções.',
  efe_faiscas: 'Resíduo de troféu recém-polido. Gruda em quem vence com estilo.',
  // exclusivos
  mol_dshow: 'A assinatura da casa. Não se compra, não se pede — se reconhece.',
  // espécies (F2b)
  bas_panda: 'Mastiga bambu e backlog na mesma velocidade: devagar e sem errar.',
  bas_coruja: 'Plantonista noturna oficial. Nenhum log passa despercebido.',
  bas_raposa: 'Fechou três negociações antes de você abrir o CRM.',
  bas_lobo: 'O uivo dele é o sino de meta batida.',
  bas_leao: 'Não disputa território: o território é dele desde o onboarding.',
  bas_alien: 'Classificou a Terra como "habitável, mas o wi-fi cai". Ficou mesmo assim.',
  bas_ledbot: 'Primeiro pixel aceso da Dshow. Todo painel que brilha descende dele.',
  // expressões (F2b)
  olh_misterioso: 'Os olhos brilham no escuro da sala de reunião. Ninguém pergunta por quê.',
  olh_vilao: 'Vermelho não é raiva. É foco em modo absoluto.',
  boc_vilao: 'Sorriu assim uma vez. O concorrente mudou de nicho.',
  // poderes (F2b)
  efe_portal: 'Ninguém sabe para onde leva. Ele volta sempre com resultados.',
  efe_raio: 'A energia estática de quem carrega três sprints no corpo.',
  efe_glitch: 'Um erro de renderização? Não. Um aviso.',
  efe_fogo: 'Arde desde o primeiro trimestre. Nunca precisou de gatilho.',
  // F2b2
  rou_kimono: 'Costurado por um mestre que só aceitava pagamento em disciplina.',
  rou_astronauta: 'Voltou da órbita com um adesivo: "meu outro veículo é um dashboard".',
  rou_moletom_dshow: 'Distribuído no primeiro all-hands. Quem tem, não lava — preserva.',
  ace_chapeu_mago: 'Sussurra queries otimizadas para quem o veste. Às vezes em latim.',
  ace_drone: 'Firmware v0.1 até hoje. Recusa updates: "estou funcionando, não encosta".',
  fun_lab: 'Aqui nasceram os modelos que ninguém teve coragem de desligar.',
  fun_dojo: 'O sensei só disse uma coisa: "meça duas vezes, publique uma".',
  mol_rgb: 'Se não tem RGB, nem é setup. Lei universal.',
  mol_cristal: 'Congelou no exato instante de um recorde. Nunca mais derreteu.',
  // F3 — recompensas de conquista e itens de evento
  mol_pioneiro: 'Forjada para quem chegou primeiro. O relógio no topo marca aquele exato momento.',
  efe_confete: 'Caiu na primeira comemoração e nunca parou. Ninguém varre. Ninguém quer.',
  ace_medalha: 'Trinta dias. Parece pouco até você contar as segundas-feiras.',
  ace_gorro_natal: 'Dezembro oficial da Dshow: meta fechada, gorro na cabeça.',
  ace_chapeu_bruxa: 'Dizem que quem o veste em outubro faz as queries voarem.',
};

// ── Índices ─────────────────────────────────────────────────────────

export const PARTES: ParteDef[] = [
  ...BASES, ...ESPECIES, ...CABELOS, ...OLHOS, ...BOCAS, ...ROUPAS,
  ...ACESSORIOS, ...FUNDOS, ...MOLDURAS, ...EFEITOS,
  ...AURAS, ...BANNERS, ...EMBLEMAS,
].map((x) => ({
  ...x,
  biblioteca: x.biblioteca ?? 'dshow',
  lore: x.lore ?? LORES[x.id],
  // olhos tech não piscam no idle (AS3 §5.1)
  piscar: x.piscar ?? !(x.id === 'olh_visor' || x.id === 'olh_led'),
}));

const POR_ID = new Map<string, ParteDef>(PARTES.map((x) => [x.id, x]));

export function itemPorId(id: string): ParteDef | undefined {
  return POR_ID.get(id);
}

export function itensDe(categoria: CategoriaId): ParteDef[] {
  return PARTES.filter((x) => x.categoria === categoria);
}

/** Itens sorteáveis (sem trava de conquista/evento) — usado pelo aleatório. */
function sorteaveis(categoria: CategoriaId): ParteDef[] {
  return itensDe(categoria).filter((x) => !x.bloqueadoPor);
}

// ── Cores sugeridas por slot (paleta curada; picker livre continua valendo) ──

export const CORES_SUGERIDAS: Record<SlotCor, string[]> = {
  pele: ['#f5d0a9', '#e8b58c', '#d29e6f', '#b07a4e', '#8a5a35', '#5f3d23', '#c8d4e8', '#9fe8c8'],
  cabelo: ['#14100c', '#3d2b1f', '#6b4a2a', '#a06a30', '#d9b166', '#b8bcc8', '#e84c6f', '#4c9de8', '#7c5cff', '#39d98a'],
  roupa: ['#20242e', '#2d4a8a', '#1f6e5a', '#7a2d3c', '#5b3d8a', '#8a6a1f', '#c4c9d6', '#e85c3a'],
  destaque: ['#7c5cff', '#39d98a', '#4c9de8', '#ff5f8f', '#e8b64c', '#4cd9e8', '#ff7a3d', '#c9d94c'],
};

// ── Config padrão + validação (defesa contra dados de fora) ─────────

export const CONFIG_PADRAO: AvatarConfig = {
  formato: 'camadas',
  versao: VERSAO_CONFIG,
  base: 'bas_classica',
  camadas: {
    cabelo: 'cab_curto',
    olhos: 'olh_padrao',
    boca: 'boc_sorriso',
    roupa: 'rou_camiseta',
    fundo: 'fun_estudio',
  },
  cores: { ...CORES_PADRAO },
};

const CATS_OPCIONAIS = CATEGORIAS.filter((c) => c.id !== 'base').map((c) => c.id) as
  Array<Exclude<CategoriaId, 'base'>>;

/**
 * Coage QUALQUER entrada (localStorage, API, import) num AvatarConfig válido.
 * Regras do briefing §35: id precisa existir e bater a categoria; respeita
 * requerBase e incompativelCom; cores sempre hex normalizado.
 */
export function validarConfig(bruto: unknown): AvatarConfig {
  const b = (bruto ?? {}) as Partial<AvatarConfig>;
  const base = typeof b.base === 'string' && POR_ID.get(b.base)?.categoria === 'base'
    ? b.base
    : CONFIG_PADRAO.base;

  const camadas: AvatarConfig['camadas'] = {};
  const equipados: string[] = [];
  for (const cat of CATS_OPCIONAIS) {
    const id = b.camadas?.[cat];
    if (typeof id !== 'string' || id === 'nenhum') continue;
    const item = POR_ID.get(id);
    if (!item || item.categoria !== cat) continue;
    if (item.requerBase?.length && !item.requerBase.includes(base)) continue;
    if (item.incompativelCom?.some((x) => equipados.includes(x))) continue;
    camadas[cat] = id;
    equipados.push(id);
  }

  const c = (b.cores ?? {}) as Partial<Record<SlotCor, string>>;
  const saida: AvatarConfig = {
    formato: 'camadas',
    versao: VERSAO_CONFIG,
    base,
    camadas,
    cores: {
      pele: normalizarHex(c.pele, CORES_PADRAO.pele),
      cabelo: normalizarHex(c.cabelo, CORES_PADRAO.cabelo),
      roupa: normalizarHex(c.roupa, CORES_PADRAO.roupa),
      destaque: normalizarHex(c.destaque, CORES_PADRAO.destaque),
    },
  };
  // título (Expansão §27): só entra se existir no catálogo — campo OPCIONAL
  // (ausente no JSON quando não escolhido → hash/publicação byte-estáveis)
  if (typeof b.titulo === 'string' && TITULOS_POR_ID.has(b.titulo)) {
    saida.titulo = b.titulo;
  }
  return saida;
}

// ── Renderização (fachada — a UI só fala com o catálogo) ────────────

export function svgDe(config: AvatarConfig, opcoes?: OpcoesRender): string {
  return renderAvatar(config, itemPorId, opcoes);
}

export function dataUriDe(config: AvatarConfig, opcoes?: OpcoesRender): string {
  return renderDataUri(config, itemPorId, opcoes);
}

export { hashConfig };

// ── Randomizador determinístico (mulberry32) — briefing §13 ─────────

function mulberry32(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sortear<T>(rnd: () => number, lista: T[]): T {
  return lista[Math.floor(rnd() * lista.length)];
}

/** Sorteia respeitando o peso das raridades (lendário É raro de sair). */
function sortearPorRaridade(rnd: () => number, lista: ParteDef[]): ParteDef {
  const pesos = lista.map((x) => RARIDADES[x.raridade].peso);
  const total = pesos.reduce((a, b) => a + b, 0);
  let alvo = rnd() * total;
  for (let i = 0; i < lista.length; i++) {
    alvo -= pesos[i];
    if (alvo <= 0) return lista[i];
  }
  return lista[lista.length - 1];
}

export function aleatorio(semente: number): AvatarConfig {
  const rnd = mulberry32(semente);
  const camadas: AvatarConfig['camadas'] = {
    olhos: sortearPorRaridade(rnd, sorteaveis('olhos')).id,
    boca: sortearPorRaridade(rnd, sorteaveis('boca')).id,
    roupa: sortearPorRaridade(rnd, sorteaveis('roupa')).id,
    fundo: sortearPorRaridade(rnd, sorteaveis('fundo')).id,
  };
  if (rnd() < 0.85) camadas.cabelo = sortearPorRaridade(rnd, sorteaveis('cabelo')).id;
  if (rnd() < 0.55) camadas.acessorio = sortearPorRaridade(rnd, sorteaveis('acessorio')).id;
  if (rnd() < 0.6) camadas.moldura = sortearPorRaridade(rnd, sorteaveis('moldura')).id;
  if (rnd() < 0.35) camadas.efeito = sortearPorRaridade(rnd, sorteaveis('efeito')).id;
  // Expansão: as categorias 2D novas também entram no sorteio
  if (rnd() < 0.3) camadas.aura = sortearPorRaridade(rnd, sorteaveis('aura')).id;
  if (rnd() < 0.25) camadas.banner = sortearPorRaridade(rnd, sorteaveis('banner')).id;
  if (rnd() < 0.35) camadas.emblema = sortearPorRaridade(rnd, sorteaveis('emblema')).id;

  return validarConfig({
    formato: 'camadas',
    versao: VERSAO_CONFIG,
    base: sortearPorRaridade(rnd, sorteaveis('base')).id,
    camadas,
    cores: {
      pele: sortear(rnd, CORES_SUGERIDAS.pele),
      cabelo: sortear(rnd, CORES_SUGERIDAS.cabelo),
      roupa: sortear(rnd, CORES_SUGERIDAS.roupa),
      destaque: sortear(rnd, CORES_SUGERIDAS.destaque),
    },
  });
}

// ── Presets curados (briefing §12) ──────────────────────────────────

export const PRESETS: Preset[] = [
  {
    id: 'pre_executivo',
    nome: 'Executivo de Elite',
    descricao: 'Terno, olhar analítico e a certeza de quem fecha o trimestre.',
    raridade: 'raro',
    config: {
      base: 'bas_angular',
      camadas: { cabelo: 'cab_curto', olhos: 'olh_serio', boca: 'boc_determinada', roupa: 'rou_terno', fundo: 'fun_estudio', moldura: 'mol_duplo' },
      cores: { pele: '#d29e6f', cabelo: '#14100c', roupa: '#20242e', destaque: '#e8b64c' },
    },
  },
  {
    id: 'pre_proplayer',
    nome: 'Pro Player',
    descricao: 'Headset RGB, jersey oficial e a arena inteira gritando seu nick.',
    raridade: 'epico',
    config: {
      base: 'bas_classica',
      camadas: { cabelo: 'cab_cyber', olhos: 'olh_focado', boca: 'boc_lado', roupa: 'rou_gamer', acessorio: 'ace_headset', fundo: 'fun_arena', moldura: 'mol_neon' },
      cores: { pele: '#e8b58c', cabelo: '#4c9de8', roupa: '#20242e', destaque: '#39d98a' },
    },
  },
  {
    id: 'pre_androide',
    nome: 'Androide Nexus',
    descricao: 'Chassi sintético, chuva digital e núcleo de energia pulsante.',
    raridade: 'lendario',
    config: {
      base: 'bas_androide',
      camadas: { olhos: 'olh_led', boca: 'boc_grade', roupa: 'rou_armadura', fundo: 'fun_circuito', moldura: 'mol_tech', efeito: 'efe_chuva' },
      cores: { pele: '#c8d4e8', cabelo: '#3d2b1f', roupa: '#20242e', destaque: '#4cd9e8' },
    },
  },
  {
    id: 'pre_sexta',
    nome: 'Casual de Sexta',
    descricao: 'Óculos escuros, gargalhada solta e zero reuniões depois das 17h.',
    raridade: 'comum',
    config: {
      base: 'bas_classica',
      camadas: { cabelo: 'cab_franja', olhos: 'olh_feliz', boca: 'boc_larga', roupa: 'rou_camiseta', acessorio: 'ace_oculos_sol', fundo: 'fun_estrelas' },
      cores: { pele: '#b07a4e', cabelo: '#6b4a2a', roupa: '#1f6e5a', destaque: '#ff7a3d' },
    },
  },
  {
    id: 'pre_lenda',
    nome: 'Lenda Viva',
    descricao: 'Coroa de ouro, faíscas e uma nebulosa de fundo. Top 1 global.',
    raridade: 'exclusivo',
    config: {
      base: 'bas_classica',
      camadas: { cabelo: 'cab_longo', olhos: 'olh_brilho', boca: 'boc_sorriso', roupa: 'rou_terno', acessorio: 'ace_coroa', fundo: 'fun_nebulosa', moldura: 'mol_ouro', efeito: 'efe_faiscas' },
      cores: { pele: '#e8b58c', cabelo: '#d9b166', roupa: '#5b3d8a', destaque: '#e8b64c' },
    },
  },
  {
    id: 'pre_holograma',
    nome: 'Holograma Synth',
    descricao: 'Projeção translúcida sobre o grid oitentista. Puro synthwave.',
    raridade: 'lendario',
    config: {
      base: 'bas_holo',
      camadas: { olhos: 'olh_visor', boca: 'boc_neutra', roupa: 'rou_jaqueta', fundo: 'fun_grade', moldura: 'mol_neon', efeito: 'efe_scanlines' },
      cores: { pele: '#9fe8c8', cabelo: '#3d2b1f', roupa: '#5b3d8a', destaque: '#ff5f8f' },
    },
  },
];

/** Config completo a partir de um preset (aplica versão/formato + validação). */
export function configDePreset(preset: Preset): AvatarConfig {
  return validarConfig({ formato: 'camadas', versao: VERSAO_CONFIG, ...preset.config });
}

// ── Coleções curadas (AS3 F2c — briefing 3.0 §8) ────────────────────
// Conjuntos temáticos com progresso: "usado" = item já equipado alguma vez.

export interface Colecao {
  id: string;
  nome: string;
  descricao: string;
  raridade: Raridade;
  itens: string[];
  /** aplica o conjunto por cima do avatar atual */
  cores?: Partial<Record<SlotCor, string>>;
}

export const COLECOES: Colecao[] = [
  {
    id: 'col_cyber_nexus',
    nome: 'Cyber Nexus',
    descricao: 'O conjunto sintético completo: chassi, óptica, armadura e a chuva de código.',
    raridade: 'lendario',
    itens: ['bas_androide', 'olh_led', 'boc_grade', 'rou_armadura', 'fun_circuito', 'mol_tech', 'efe_chuva'],
    cores: { pele: '#c8d4e8', destaque: '#4cd9e8' },
  },
  {
    id: 'col_executivo',
    nome: 'Executivo Elite',
    descricao: 'Alfaiataria, olhar analítico e a moldura de quem assina o trimestre.',
    raridade: 'epico',
    itens: ['bas_angular', 'cab_curto', 'olh_serio', 'boc_determinada', 'rou_terno', 'ace_oculos', 'fun_estudio', 'mol_duplo'],
    cores: { roupa: '#20242e', destaque: '#e8b64c' },
  },
  {
    id: 'col_dojo',
    nome: 'Caminho do Dojo',
    descricao: 'Kimono, coque de samurai e o entardecer que forjou a disciplina.',
    raridade: 'epico',
    itens: ['cab_coque', 'rou_kimono', 'fun_dojo', 'boc_determinada', 'mol_cristal'],
    cores: { roupa: '#7a2d3c', destaque: '#ff7a3d' },
  },
  {
    id: 'col_galaxia',
    nome: 'Galáxia',
    descricao: 'Traje orbital, olhos estelares e a nebulosa inteira nas suas costas.',
    raridade: 'lendario',
    itens: ['rou_astronauta', 'olh_brilho', 'fun_nebulosa', 'efe_particulas', 'mol_neon'],
    cores: { destaque: '#c99aff' },
  },
  {
    id: 'col_dshow',
    nome: 'Dshow Original',
    descricao: 'LED Bot, moletom da casa, o LED Wall e a moldura assinada. 100% Dshow.',
    raridade: 'exclusivo',
    itens: ['bas_ledbot', 'rou_moletom_dshow', 'fun_led_wall', 'mol_dshow'],
    cores: { destaque: '#7c5cff' },
  },
];

/** Progresso da coleção dado o conjunto de itens já usados. */
export function progressoColecao(colecao: Colecao, usados: Set<string>): { usados: number; total: number } {
  return {
    usados: colecao.itens.filter((i) => usados.has(i)).length,
    total: colecao.itens.length,
  };
}

/** Aplica a coleção por cima do config atual (itens + cores sugeridas). */
export function aplicarColecao(base: AvatarConfig, colecao: Colecao): AvatarConfig {
  const novo: AvatarConfig = {
    ...base,
    camadas: { ...base.camadas },
    cores: { ...base.cores, ...colecao.cores },
  };
  for (const id of colecao.itens) {
    const item = POR_ID.get(id);
    if (!item) continue;
    if (item.categoria === 'base') novo.base = id;
    else novo.camadas[item.categoria as keyof AvatarConfig['camadas']] = id;
  }
  return validarConfig(novo);
}
