// services/AvatarCatalog.ts — catálogo oficial do Avatar Studio.
// @version 1.0.0  @created 2026-07-29
//
// Fonte única de verdade sobre itens, categorias, raridades, cores sugeridas,
// presets e validação de config. O motor (engine/render) recebe o resolvedor
// daqui — nenhum outro módulo importa as partes diretamente.
import type {
  AvatarConfig, CamadaId, CategoriaId, CategoriaMeta, EstiloFoto, GrupoId, Preset, Raridade, SlotCor,
} from '../domain/types';
import { CORES_PADRAO, normalizarHex, paletaDe } from '../engine/cores';
import { sanitizarParams } from '../engine/params';
import type { ParteDef } from '../engine/base-api';
import { renderAvatar, renderDataUri, hashConfig } from '../engine/render';
import type { OpcoesRender } from '../engine/render';
import { renderFotoEstilizada } from '../engine/render-foto';
import type { OpcoesRenderFoto } from '../engine/render-foto';

// §325: formatos de saída da foto — fachada re-exporta a fonte do engine
export { FORMATOS_FOTO } from '../engine/render-foto';
export type { FormatoFotoId } from '../engine/render-foto';
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
  { id: 'tit_novato_promissor', nome: 'Novato Promissor', raridade: 'comum', lore: 'Chegou ontem. Já entregou hoje.' },
  { id: 'tit_guardiao_da_base', nome: 'Guardião da Base', raridade: 'incomum', lore: 'Nada entra, nada cai, nada passa.' },
  { id: 'tit_maquina_de_meta', nome: 'Máquina de Meta', raridade: 'raro', lore: 'Bateu. Rebateu. Pediu outra.' },
  { id: 'tit_visionario', nome: 'Visionário', raridade: 'epico', lore: 'Enxerga o Q4 em pleno janeiro.' },
  // 4.6 F2 · Onda 3 — 10 títulos novos (rumo à meta §28: 30)
  { id: 'tit_arquiteto_de_dados', nome: 'Arquiteto de Dados', raridade: 'raro', lore: 'Cada tabela no lugar, cada índice com propósito.' },
  { id: 'tit_cacador_de_bugs', nome: 'Caçador de Bugs', raridade: 'incomum', lore: 'O stack trace treme quando ele abre o console.' },
  { id: 'tit_mestre_do_pitch', nome: 'Mestre do Pitch', raridade: 'raro', lore: 'Três slides. Dois minutos. Um sim.' },
  { id: 'tit_senhor_dos_dashboards', nome: 'Senhor dos Dashboards', raridade: 'epico', lore: 'Um painel para a todos governar.' },
  { id: 'tit_alquimista_de_leads', nome: 'Alquimista de Leads', raridade: 'epico', lore: 'Transforma clique frio em contrato assinado.' },
  { id: 'tit_imperador_do_roi', nome: 'Imperador do ROI', raridade: 'lendario', lore: 'Cada real investido volta fazendo reverência.' },
  { id: 'tit_guardiao_do_uptime', nome: 'Guardião do Uptime', raridade: 'raro', lore: '99,99% — e o 0,01% foi planejado.' },
  { id: 'tit_domador_de_algoritmos', nome: 'Domador de Algoritmos', raridade: 'epico', lore: 'O leilão de anúncios obedece ao seu assobio.' },
  { id: 'tit_forjado_na_madrugada', nome: 'Forjado na Madrugada', raridade: 'incomum', lore: 'O deploy das 3h47 conta a história.' },
  { id: 'tit_oraculo', nome: 'Oráculo', raridade: 'mitico', lore: 'Não prevê o futuro. Configura ele.' },
  // 4.6 F2 · Onda 5 — 8 títulos novos (meta §28: 30 ✓)
  { id: 'tit_lider_de_guilda', nome: 'Líder de Guilda', raridade: 'raro', lore: 'A raid do trimestre não se organiza sozinha.' },
  { id: 'tit_ninja_do_excel', nome: 'Ninja do Excel', raridade: 'incomum', lore: 'PROCV na mão esquerda, tabela dinâmica na direita.' },
  { id: 'tit_barao_dos_cliques', nome: 'Barão dos Cliques', raridade: 'epico', lore: 'CTR de dois dígitos e um monóculo de respeito.' },
  { id: 'tit_sussurrador_de_apis', nome: 'Sussurrador de APIs', raridade: 'raro', lore: 'Fala baixinho com o endpoint e ele responde 200.' },
  { id: 'tit_colecionador', nome: 'Colecionador de Conquistas', raridade: 'incomum', lore: 'A estante de troféus pediu reforço estrutural.' },
  { id: 'tit_mago_do_funil', nome: 'Mago do Funil', raridade: 'epico', lore: 'Transforma topo em fundo com um passe de mãos.' },
  { id: 'tit_sentinela', nome: 'Sentinela da Madrugada', raridade: 'raro', lore: 'Enquanto o dash dorme, alguém vigia os alertas.' },
  { id: 'tit_avatar_supremo', nome: 'Avatar Supremo', raridade: 'lendario', lore: 'Dominou os quatro elementos: 2D, 3D, foto e estilo.' },
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
  const colocar = (chave: CamadaId, id: unknown): void => {
    if (typeof id !== 'string' || id === 'nenhum' || camadas[chave]) return;
    const item = POR_ID.get(id);
    const catEsperada = chave.startsWith('acessorio') ? 'acessorio' : chave;
    if (!item || item.categoria !== catEsperada) return;
    if (item.requerBase?.length && !item.requerBase.includes(base)) return;
    if (item.incompativelCom?.some((x) => equipados.includes(x))) return;
    camadas[chave] = id;
    equipados.push(id);
  };
  for (const cat of CATS_OPCIONAIS) {
    if (cat === 'acessorio') continue; // slots aditivos tratados abaixo
    colocar(cat, b.camadas?.[cat]);
  }
  // Acessórios (4.6 §20, decisão #41): 3 slots ADITIVOS — o item SEMPRE
  // pousa no slot que ele declara (chave de chegada é só transporte).
  // A chave legada 'acessorio' migra para o slot do item e nunca persiste.
  const candidatos: unknown[] = [
    b.camadas?.acessorio_cabeca, b.camadas?.acessorio_rosto,
    b.camadas?.acessorio_pescoco, b.camadas?.acessorio,
  ];
  for (const id of candidatos) {
    if (typeof id !== 'string') continue;
    const item = POR_ID.get(id);
    if (item?.categoria === 'acessorio') {
      colocar(`acessorio_${item.slot ?? 'cabeca'}`, id);
    }
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
  // §71 (AS5 F3 C2): propriedades por asset — só de camadas EQUIPADAS,
  // grampeadas ao [min,max] e sem valores padrão (byte-estável como o título)
  if (b.params && typeof b.params === 'object') {
    const params: NonNullable<AvatarConfig['params']> = {};
    for (const [chave, bruto] of Object.entries(b.params)) {
      if (!camadas[chave as CamadaId]) continue;
      const limpo = sanitizarParams(chave, bruto);
      if (limpo) params[chave as CamadaId] = limpo;
    }
    if (Object.keys(params).length) saida.params = params;
  }
  // §73 (AS5 F3 C3): canais de cor por camada — só camadas equipadas, só
  // canais que o ITEM declara (usaCores), hex normalizado; valor idêntico
  // ao global é um no-op e não persiste (byte-estável)
  if (b.coresCamada && typeof b.coresCamada === 'object') {
    const coresCamada: NonNullable<AvatarConfig['coresCamada']> = {};
    for (const [chave, canais] of Object.entries(b.coresCamada)) {
      const idItem = camadas[chave as CamadaId];
      if (!idItem || !canais || typeof canais !== 'object') continue;
      const declarados = POR_ID.get(idItem)?.usaCores ?? [];
      const limpos: Partial<Record<SlotCor, string>> = {};
      for (const canal of declarados) {
        const hex = (canais as Record<string, unknown>)[canal];
        if (typeof hex !== 'string') continue;
        const norm = normalizarHex(hex, saida.cores[canal]);
        if (norm !== saida.cores[canal]) limpos[canal] = norm;
      }
      if (Object.keys(limpos).length) coresCamada[chave as CamadaId] = limpos;
    }
    if (Object.keys(coresCamada).length) saida.coresCamada = coresCamada;
  }
  return saida;
}

// ── Propriedades por asset (§71) — fachada para a UI ────────────────
export { PARAMS_POR_CATEGORIA, paramsDaCamada } from '../engine/params';
export type { ParamDef } from '../engine/params';

// ── Paletas de roupa (§74) — presets que preenchem os CANAIS (§73) ──
// 'Original' não está na lista: é a AÇÃO de remover o override da peça.
// 'Personalizado' também não: é qualquer escolha manual nos canais.
export interface PaletaRoupa {
  id: string;
  nome: string;
  canais: { roupa: string; destaque: string };
}
export const PALETAS_ROUPA: PaletaRoupa[] = [
  { id: 'pal_dshow', nome: 'Dshow', canais: { roupa: '#20242e', destaque: '#7c5cff' } },
  { id: 'pal_executivo', nome: 'Executivo', canais: { roupa: '#2b2f3a', destaque: '#c9a75a' } },
  { id: 'pal_mono', nome: 'Monocromático', canais: { roupa: '#3a3f4c', destaque: '#8a93a6' } },
  { id: 'pal_cyber', nome: 'Cyber', canais: { roupa: '#1a1035', destaque: '#4cd9e8' } },
  { id: 'pal_gamer', nome: 'Gamer', canais: { roupa: '#16241c', destaque: '#39d98a' } },
  { id: 'pal_neon', nome: 'Neon', canais: { roupa: '#241436', destaque: '#ff5f8f' } },
  { id: 'pal_claro', nome: 'Claro', canais: { roupa: '#c4c9d6', destaque: '#4c9de8' } },
  { id: 'pal_escuro', nome: 'Escuro', canais: { roupa: '#14161d', destaque: '#5b3d8a' } },
];

// ── Templates do Photo Studio (§326–§327 — AS5 F6) ──────────────────
// Composições reutilizáveis de EstiloFoto com assets REAIS do catálogo.
// Aplicação segue §326.3: itens bloqueados ficam de fora (a UI filtra e
// informa) e a foto do usuário nunca é tocada.
export interface TemplateFoto {
  id: string;
  nome: string;
  descricao: string;
  /** categoria §326.1 (corporativo/gamer/minimalista/evento…) */
  categoria: string;
  estilo: EstiloFoto;
}

export const TEMPLATES_FOTO: TemplateFoto[] = [
  {
    id: 'tpl_dshow_executive', nome: 'Dshow Executive', categoria: 'executivo',
    descricao: 'Fundo escuro, dourado corporativo e o selo de CEO (§327.1).',
    estilo: { camadas: { fundo: 'fun_escritorio', banner: 'ban_executivo', moldura: 'mol_minimal', emblema: 'emb_dshow' }, titulo: 'tit_ceo_supremo', cores: { destaque: '#e8b64c' } },
  },
  {
    id: 'tpl_showroom_master', nome: 'Showroom Master', categoria: 'dshow',
    descricao: 'Parede de LED, moldura RGB e aura da casa (§327.2).',
    estilo: { camadas: { fundo: 'fun_led_wall', aura: 'aur_dshow', moldura: 'mol_rgb', emblema: 'emb_nexus' }, titulo: 'tit_visionario', cores: { destaque: '#7c5cff' } },
  },
  {
    id: 'tpl_cyber_profile', nome: 'Cyber Profile', categoria: 'tecnologia',
    descricao: 'Synthwave, aura neon e interferência holográfica (§327.3).',
    estilo: { camadas: { fundo: 'fun_synthwave', aura: 'aur_neon', moldura: 'mol_neon', efeito: 'efe_holo_interf' }, titulo: 'tit_cyber_architect', cores: { destaque: '#4cd9e8' } },
  },
  {
    id: 'tpl_pro_player', nome: 'Pro Player', categoria: 'gamer',
    descricao: 'Arena, faíscas de clutch e título de pro (§327.4).',
    estilo: { camadas: { fundo: 'fun_arena', banner: 'ban_campeao', moldura: 'mol_tech', efeito: 'efe_faiscas' }, titulo: 'tit_pro_player', cores: { destaque: '#39d98a' } },
  },
  {
    id: 'tpl_minimal_clean', nome: 'Minimal Clean', categoria: 'minimalista',
    descricao: 'Estúdio neutro, moldura fina, legibilidade máxima (§327.5).',
    estilo: { camadas: { fundo: 'fun_estudio', moldura: 'mol_minimal' }, cores: { destaque: '#4c9de8' } },
  },
  {
    id: 'tpl_achievement', nome: 'Achievement Reveal', categoria: 'conquista',
    descricao: 'Troféu, louros e confete — composição celebratória (§327.6).',
    estilo: { camadas: { fundo: 'fun_estrelas', moldura: 'mol_louros', emblema: 'emb_trofeu', efeito: 'efe_confete' }, titulo: 'tit_lenda_dshow', cores: { destaque: '#e8b64c' } },
  },
  {
    id: 'tpl_china_trip', nome: 'China Trip', categoria: 'evento',
    descricao: 'Montanhas, sakura ao vento e selo de viagem (§327.7).',
    estilo: { camadas: { fundo: 'fun_montanhas', moldura: 'mol_selo', emblema: 'emb_lua', efeito: 'efe_sakura' }, cores: { destaque: '#ff5f8f' } },
  },
  // ── lote 211–220 (§344/§349): galeria PRO — composições que estreiam o
  // sistema de CAMADAS da onda 161–200 (blend/opacidade/plano §338–§342,
  // luz local §334 e tipografia §343). Só ids REAIS do catálogo; cores de
  // texto da paleta aprovada CORES_TEXTO_FOTO. Aplicação: §326.3 (item
  // bloqueado fica de fora) + Foto.aplicarTemplate carrega os campos novos.
  {
    id: 'tpl_aurora_boreal', nome: 'Aurora Boreal', categoria: 'artistico',
    descricao: 'Céu de aurora, véu estelar em screen e luz radial fria (§349).',
    estilo: {
      camadas: { fundo: 'fun_aurora', aura: 'aur_estelar', efeito: 'efe_veu_aurora', moldura: 'mol_cristal' },
      titulo: 'tit_mestre_da_luz', cores: { destaque: '#4cd9e8' },
      camadasFoto: { efeito: { blend: 'screen', opacidade: 0.85, plano: 'frente' }, aura: { blend: 'soft-light' } },
      luzLocal: { tipo: 'radial', intensidade: 0.35 },
      tipografia: { fonte: 'serif', peso: 600, cor: '#7cd9ff' },
    },
  },
  {
    id: 'tpl_noir_executive', nome: 'Noir Executive', categoria: 'executivo',
    descricao: 'Retrato dramático: escritório suave, ouro e luz de holofote (§334).',
    estilo: {
      camadas: { fundo: 'fun_escritorio', moldura: 'mol_ouro', emblema: 'emb_grafico' },
      titulo: 'tit_estrategista', cores: { destaque: '#e8b64c' },
      camadasFoto: { fundo: { opacidade: 0.7 } },
      luzLocal: { tipo: 'radial', intensidade: 0.42 },
      tipografia: { fonte: 'serif', peso: 800, cor: '#ffd75e', caixaAlta: true },
      subtitulo: 'Diretoria',
    },
  },
  {
    id: 'tpl_neon_tokyo', nome: 'Neon Tokyo', categoria: 'cyber',
    descricao: 'Synthwave, banner de Tóquio, scanlines em screen e mono neon (§342).',
    estilo: {
      camadas: { fundo: 'fun_synthwave', banner: 'ban_neon_tokyo', aura: 'aur_neon', efeito: 'efe_scanlines', moldura: 'mol_glitch' },
      titulo: 'tit_cyber_architect', cores: { destaque: '#4cd9e8' },
      camadasFoto: { efeito: { blend: 'screen', opacidade: 0.6, plano: 'frente' }, aura: { blend: 'screen' } },
      luzLocal: { tipo: 'linear', intensidade: 0.2 },
      tipografia: { fonte: 'mono', peso: 800, cor: '#ff9ecb', contorno: true },
    },
  },
  {
    id: 'tpl_campeao_arena', nome: 'Campeão da Arena', categoria: 'gamer',
    descricao: 'Arena, fênix, chamas e faíscas ao vento — pódio (§349).',
    estilo: {
      camadas: { fundo: 'fun_arena', banner: 'ban_campeao', aura: 'aur_fenix', efeito: 'efe_faiscas', moldura: 'mol_chamas' },
      titulo: 'tit_pro_player', cores: { destaque: '#39d98a' },
      camadasFoto: { aura: { blend: 'screen', opacidade: 0.8 }, efeito: { blend: 'screen', plano: 'frente' } },
      luzLocal: { tipo: 'radial', intensidade: 0.3 },
      tipografia: { fonte: 'sistema', peso: 800, cor: '#ffd75e', caixaAlta: true },
    },
  },
  {
    id: 'tpl_zen_dojo', nome: 'Zen Dojo', categoria: 'sereno',
    descricao: 'Dojo tranquilo, madeira, sakura suave e serifa leve (§334).',
    estilo: {
      camadas: { fundo: 'fun_dojo', moldura: 'mol_madeira', efeito: 'efe_sakura' },
      titulo: 'tit_oraculo', cores: { destaque: '#ff9ecb' },
      camadasFoto: { fundo: { opacidade: 0.85 }, efeito: { opacidade: 0.7, plano: 'frente' } },
      luzLocal: { tipo: 'radial', intensidade: 0.25 },
      tipografia: { fonte: 'serif', peso: 400, cor: '#e6eaf2' },
      subtitulo: 'Equilíbrio',
    },
  },
  {
    id: 'tpl_data_oracle', nome: 'Data Oracle', categoria: 'dados',
    descricao: 'Grade de dados, órbita, métricas em screen e mono técnico (§342).',
    estilo: {
      camadas: { fundo: 'fun_grade', aura: 'aur_orbital', efeito: 'efe_metricas', moldura: 'mol_vetores', emblema: 'emb_grafico' },
      titulo: 'tit_arquiteto_de_dados', cores: { destaque: '#4c9de8' },
      camadasFoto: { efeito: { blend: 'screen', opacidade: 0.75, plano: 'frente' }, aura: { blend: 'soft-light', opacidade: 0.9 } },
      luzLocal: { tipo: 'linear', intensidade: 0.15 },
      tipografia: { fonte: 'mono', peso: 600, cor: '#7cd9ff' },
    },
  },
];

// ── Renderização (fachada — a UI só fala com o catálogo) ────────────

/** §158 (AS5): SVG de UM efeito isolado — overlays efêmeros de gatilho
 *  (celebração ao salvar etc.). Nunca entra no config/persistência.
 *  Mega 63 (§153): AURAS também podem ser "ativadas" como poder. */
export function svgEfeitoIsolado(id: string, destaque?: string): string {
  const parte = POR_ID.get(id);
  if (!parte || (parte.categoria !== 'efeito' && parte.categoria !== 'aura')) return '';
  const paleta = paletaDe({ ...CONFIG_PADRAO.cores, ...(destaque ? { destaque } : {}) });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="presentation">${parte.render(paleta, 'fx')}</svg>`;
}

export function svgDe(config: AvatarConfig, opcoes?: OpcoesRender): string {
  return renderAvatar(config, itemPorId, opcoes);
}

export function dataUriDe(config: AvatarConfig, opcoes?: OpcoesRender): string {
  return renderDataUri(config, itemPorId, opcoes);
}

/**
 * SVG da FOTO ESTILIZADA (4.6 §21) — resolve título e cores aqui (quem
 * conhece o catálogo é o serviço; o motor só recebe o selo pronto).
 */
export function svgFotoDe(fotoHref: string, estilo: EstiloFoto, opcoes?: OpcoesRenderFoto): string {
  const titulo = tituloPorId(estilo.titulo);
  // lote 161+: sanitizados AQUI e OMITIDOS quando vazios (objeto vazio no
  // estilo não pode mudar o uid/render — byte-estabilidade defensiva)
  const cfLimpo = estilo.camadasFoto ? sanitizarCamadasFoto(estilo.camadasFoto) : {};
  const luzLimpa = estilo.luzLocal ? sanitizarLuzLocal(estilo.luzLocal) : null;
  const tpLimpa = estilo.tipografia ? sanitizarTipografiaFoto(estilo.tipografia) : {};
  return renderFotoEstilizada(fotoHref, {
    camadas: estilo.camadas,
    cores: { ...CONFIG_PADRAO.cores, destaque: normalizarHex(estilo.cores.destaque, CONFIG_PADRAO.cores.destaque) },
    selo: titulo ? { nome: titulo.nome, cor: RARIDADES[titulo.raridade].cor } : undefined,
    ...(estilo.ajustes ? { ajustes: estilo.ajustes } : {}), // megas 51–54
    // mega 115 (§344): legenda SANITIZADA (whitelist de caracteres, ≤40)
    ...(estilo.legenda ? { legenda: sanitizarLegendaFoto(estilo.legenda) } : {}),
    // lote 161–167 (§338/§334/§343): campos novos SEMPRE validados aqui
    ...(Object.keys(cfLimpo).length ? { camadasFoto: cfLimpo } : {}),
    ...(luzLimpa ? { luzLocal: luzLimpa } : {}),
    ...(Object.keys(tpLimpa).length ? { tipografia: tpLimpa } : {}),
    ...(estilo.subtitulo ? { subtitulo: sanitizarLegendaFoto(estilo.subtitulo) } : {}),
  }, itemPorId, opcoes);
}

/** mega 115 (§344): legenda da foto — só letras/números/pontuação leve. */
export function sanitizarLegendaFoto(texto: string): string {
  return texto.replace(/[^\p{L}\p{N} .,!?'\-]/gu, '').slice(0, 40).trim();
}

// ── lote 161–168 (§338/§342/§334/§343/§349) ─────────────────────────
const BLENDS_FOTO = ['normal', 'multiply', 'screen', 'overlay', 'soft-light'] as const;
/** §343.3: paleta de texto APROVADA (nada de cor livre). */
export const CORES_TEXTO_FOTO = ['#e6eaf2', '#ffd75e', '#7cd9ff', '#ff9ecb'] as const;

export function sanitizarCamadasFoto(cfg: NonNullable<EstiloFoto['camadasFoto']>): NonNullable<EstiloFoto['camadasFoto']> {
  const saida: NonNullable<EstiloFoto['camadasFoto']> = {};
  for (const cat of CATEGORIAS_FOTO) {
    const c = cfg[cat];
    if (!c) continue;
    const limpo: NonNullable<typeof c> = {};
    if (c.oculta === true) limpo.oculta = true;
    if (typeof c.opacidade === 'number' && c.opacidade >= 0.2 && c.opacidade < 1) {
      limpo.opacidade = Math.round(c.opacidade * 100) / 100;
    }
    if (c.blend && c.blend !== 'normal' && (BLENDS_FOTO as readonly string[]).includes(c.blend)) limpo.blend = c.blend;
    if (cat === 'efeito' && (c.plano === 'atras' || c.plano === 'frente')) limpo.plano = c.plano; // §339
    if (Object.keys(limpo).length) saida[cat] = limpo;
  }
  return saida;
}

export function sanitizarLuzLocal(luz: NonNullable<EstiloFoto['luzLocal']>): EstiloFoto['luzLocal'] | null {
  if (luz.tipo !== 'radial' && luz.tipo !== 'linear') return null;
  const i = Math.max(-1, Math.min(1, Number(luz.intensidade) || 0));
  return i === 0 ? null : { tipo: luz.tipo, intensidade: Math.round(i * 100) / 100 };
}

export function sanitizarTipografiaFoto(t: NonNullable<EstiloFoto['tipografia']>): NonNullable<EstiloFoto['tipografia']> {
  const limpo: NonNullable<EstiloFoto['tipografia']> = {};
  if (t.fonte === 'mono' || t.fonte === 'serif') limpo.fonte = t.fonte;
  if (t.peso === 400 || t.peso === 800) limpo.peso = t.peso;
  if (t.tamanho === 'p' || t.tamanho === 'g') limpo.tamanho = t.tamanho;
  if (t.cor && (CORES_TEXTO_FOTO as readonly string[]).includes(t.cor)) limpo.cor = t.cor;
  if (t.contorno === true) limpo.contorno = true;
  if (t.caixaAlta === true) limpo.caixaAlta = true;
  return limpo;
}

/** lote 168 (§349): DICAS de composição — determinísticas, com correção
 *  1-clique quando fizer sentido (nunca aplica sozinho — §239). */
export interface DicaFoto {
  id: string;
  texto: string;
  /** patch aplicável direto no estilo (opcional) */
  correcao?: Partial<EstiloFoto>;
  /** sugestão de trocar o formato de saída (a UI decide) */
  formatoSugerido?: 'header';
}

export function dicasComposicao(estilo: EstiloFoto, formato: string): DicaFoto[] {
  const dicas: DicaFoto[] = [];
  const aj = estilo.ajustes;
  if (formato === 'perfil' && (estilo.legenda?.length ?? 0) > 24) {
    dicas.push({ id: 'legenda-longa', formatoSugerido: 'header',
      texto: 'Legenda longa para o 1:1 — o formato Header dá mais respiro ao texto.' });
  }
  if (formato === 'perfil' && estilo.legenda && estilo.titulo) {
    dicas.push({ id: 'rodape-cheio', formatoSugerido: 'header',
      texto: 'Legenda e selo do título disputam o rodapé no 1:1 — no Header cada um tem seu lugar.' });
  }
  if ((aj?.granulacao ?? 0) > 0.6 && (aj?.desfoqueFundo ?? 0) > 0.6) {
    dicas.push({ id: 'ruido-blur', correcao: { ajustes: { ...aj, granulacao: 0.3 } },
      texto: 'Granulação e desfoque fortes juntos embaçam o resultado — reduzir o grão limpa a foto.' });
  }
  if ((aj?.zoomFoto ?? 1) > 1.45) {
    dicas.push({ id: 'zoom-corte', correcao: { ajustes: { ...aj, zoomFoto: 1.3 } },
      texto: 'Zoom muito alto pode cortar o rosto na exportação — 1.3 preserva o enquadramento.' });
  }
  const tudoOculto = CATEGORIAS_FOTO.every((c) => !estilo.camadas[c] || estilo.camadas[c] === 'nenhum'
    || estilo.camadasFoto?.[c]?.oculta);
  if (estilo.camadasFoto && tudoOculto && Object.values(estilo.camadasFoto).some((c) => c?.oculta)) {
    dicas.push({ id: 'sem-cenario', correcao: { camadasFoto: {} },
      texto: 'Todas as camadas estão ocultas — a foto perde o cenário. Reexibir devolve a composição.' });
  }
  return dicas.slice(0, 3);
}

/** Categorias permitidas SOBRE a foto (§21 — nunca roupa/corpo). */
export const CATEGORIAS_FOTO: Array<keyof EstiloFoto['camadas']> =
  ['fundo', 'banner', 'aura', 'efeito', 'moldura', 'emblema'];

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
  // acessórios por SLOT (decisão #41): 1º sorteio comum, 2º menos provável
  if (rnd() < 0.55) {
    const a = sortearPorRaridade(rnd, sorteaveis('acessorio'));
    camadas[`acessorio_${a.slot ?? 'cabeca'}`] = a.id;
  }
  if (rnd() < 0.22) {
    const a = sortearPorRaridade(rnd, sorteaveis('acessorio'));
    const chave = `acessorio_${a.slot ?? 'cabeca'}` as const;
    if (!camadas[chave]) camadas[chave] = a.id;
  }
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

// ── Aleatório INTELIGENTE (§90 + §135/§135.1 — AS5 F3 P1') ──────────

export type ModoAleatorio = 'completo' | 'cores' | 'categoria' | 'favoritos';

export interface OpcoesAleatorio {
  semente: number;
  modo: ModoAleatorio;
  /** exigido no modo 'categoria' */
  categoria?: CategoriaId;
  /** slots BLOQUEADOS (§70.1/§135.1) — o sorteio NUNCA os troca (nem os preenche) */
  bloqueados?: ReadonlySet<string>;
  /** modo 'favoritos': cada categoria sorteia dos favoritos quando houver */
  favoritos?: ReadonlySet<string>;
}

const SLOTS_ACESSORIO_ALEATORIO = ['acessorio_cabeca', 'acessorio_rosto', 'acessorio_pescoco'] as const;

/**
 * §90: aleatório que respeita o que o usuário PROTEGEU e mantém coerência.
 * Compatibilidade é estrutural: o resultado passa pelo validarConfig
 * (requerBase/incompativelCom) — todo modo é "aleatório compatível".
 * Determinístico por semente (mesma semente → mesmo avatar, como o §13).
 */
export function aleatorioInteligente(atual: AvatarConfig, o: OpcoesAleatorio): AvatarConfig {
  const bloq = o.bloqueados ?? new Set<string>();
  const cand = aleatorio(o.semente);

  // §90: o BLOQUEIO vence o sorteio — se a base sorteada derrubaria um item
  // bloqueado (requerBase §35: validarConfig o removeria), a base NÃO troca
  // (a atual é comprovadamente compatível: o item está equipado nela).
  const baseSeguraParaBloqueados = (candidato: AvatarConfig): boolean => {
    if (bloq.size === 0) return true;
    const validado = validarConfig(candidato);
    return ![...bloq].some((slot) => slot !== 'base'
      && candidato.camadas[slot as CamadaId] && !validado.camadas[slot as CamadaId]);
  };

  // §135: "apenas cores" — camadas intactas, só a paleta gira
  if (o.modo === 'cores') {
    return validarConfig({ ...atual, cores: cand.cores });
  }

  // "apenas a categoria ativa" — os demais slots ficam como estão
  if (o.modo === 'categoria' && o.categoria) {
    const rnd = mulberry32(o.semente ^ 0x5f3c);
    const novo: AvatarConfig = { ...atual, camadas: { ...atual.camadas } };
    if (o.categoria === 'base') {
      if (!bloq.has('base')) {
        novo.base = sortearPorRaridade(rnd, sorteaveis('base')).id;
        if (!baseSeguraParaBloqueados(novo)) novo.base = atual.base; // §90
      }
    } else if (o.categoria === 'acessorio') {
      for (const s of SLOTS_ACESSORIO_ALEATORIO) if (!bloq.has(s)) delete novo.camadas[s];
      const a = sortearPorRaridade(rnd, sorteaveis('acessorio'));
      const chave = `acessorio_${a.slot ?? 'cabeca'}` as const;
      if (!bloq.has(chave)) novo.camadas[chave] = a.id;
    } else if (!bloq.has(o.categoria)) {
      novo.camadas[o.categoria] = sortearPorRaridade(rnd, sorteaveis(o.categoria)).id;
    }
    return validarConfig(novo);
  }

  // 'completo' | 'favoritos': parte do candidato inteiro…
  const novo: AvatarConfig = { ...cand, camadas: { ...cand.camadas } };

  // …modo favoritos re-sorteia cada camada dentro dos favoritos da categoria
  if (o.modo === 'favoritos' && o.favoritos?.size) {
    const rnd = mulberry32(o.semente ^ 0x9e37);
    if (!bloq.has('base')) {
      const favBase = sorteaveis('base').filter((i) => o.favoritos!.has(i.id));
      if (favBase.length) novo.base = sortearPorRaridade(rnd, favBase).id;
    }
    for (const chave of Object.keys(novo.camadas) as CamadaId[]) {
      const cat = chave.startsWith('acessorio') ? 'acessorio' : (chave as CategoriaId);
      const favCat = sorteaveis(cat).filter((i) => o.favoritos!.has(i.id));
      if (favCat.length) {
        const escolhido = sortearPorRaridade(rnd, favCat);
        if (cat === 'acessorio') {
          delete novo.camadas[chave];
          novo.camadas[`acessorio_${escolhido.slot ?? 'cabeca'}`] = escolhido.id;
        } else {
          novo.camadas[chave] = escolhido.id;
        }
      }
    }
  }

  // …e devolve TUDO que está protegido (valor atual, inclusive ausência)
  if (bloq.has('base')) novo.base = atual.base;
  for (const slot of bloq) {
    if (slot === 'base') continue;
    delete novo.camadas[slot as CamadaId];
    const idAtual = atual.camadas[slot as CamadaId];
    if (idAtual) novo.camadas[slot as CamadaId] = idAtual;
  }
  // §90: com os bloqueados restaurados, a base sorteada precisa sustentá-los
  if (!bloq.has('base') && !baseSeguraParaBloqueados(novo)) novo.base = atual.base;

  // regulagens (§71/§73) sobrevivem onde o item NÃO mudou
  const params: NonNullable<AvatarConfig['params']> = {};
  for (const [slot, v] of Object.entries(atual.params ?? {})) {
    if (novo.camadas[slot as CamadaId] === atual.camadas[slot as CamadaId] && v) {
      params[slot as CamadaId] = v;
    }
  }
  const coresCamada: NonNullable<AvatarConfig['coresCamada']> = {};
  for (const [slot, v] of Object.entries(atual.coresCamada ?? {})) {
    if (novo.camadas[slot as CamadaId] === atual.camadas[slot as CamadaId] && v) {
      coresCamada[slot as CamadaId] = v;
    }
  }
  return validarConfig({
    ...novo,
    ...(atual.titulo ? { titulo: atual.titulo } : {}),
    ...(Object.keys(params).length ? { params } : {}),
    ...(Object.keys(coresCamada).length ? { coresCamada } : {}),
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
  // ── 4.6 F2 · Onda 4 — 18 presets novos (meta §28: 24 ✓) ───────────
  {
    id: 'pre_arquiteto',
    nome: 'Arquiteto de Dados',
    descricao: 'Risca impecável, monóculo analítico e a cidade acesa atrás.',
    raridade: 'raro',
    config: {
      base: 'bas_longa',
      camadas: { cabelo: 'cab_lateral', olhos: 'olh_serio', boca: 'boc_neutra', roupa: 'rou_social', acessorio: 'ace_oculos', fundo: 'fun_escritorio', moldura: 'mol_selo' },
      cores: { pele: '#d29e6f', cabelo: '#2a2a33', roupa: '#3e5a7a', destaque: '#4c9de8' },
      titulo: 'tit_arquiteto_de_dados',
    },
  },
  {
    id: 'pre_streamer',
    nome: 'Streamer ao Vivo',
    descricao: 'Picos neon, olhos de estrela e o LED wall no talo.',
    raridade: 'epico',
    config: {
      base: 'bas_redonda',
      camadas: { cabelo: 'cab_picos_neon', olhos: 'olh_estrela', boca: 'boc_larga', roupa: 'rou_jersey', acessorio: 'ace_headset', fundo: 'fun_led_wall', moldura: 'mol_rgb', efeito: 'efe_confete' },
      cores: { pele: '#e8b58c', cabelo: '#20242e', roupa: '#20242e', destaque: '#ff5f8f' },
    },
  },
  {
    id: 'pre_cientista',
    nome: 'Cientista de Plantão',
    descricao: 'Jaleco, sardas e a cara de quem achou um outlier às 2h.',
    raridade: 'incomum',
    config: {
      base: 'bas_sardas',
      camadas: { cabelo: 'cab_coque', olhos: 'olh_arregalado', boca: 'boc_uau', roupa: 'rou_jaleco', acessorio: 'ace_oculos', fundo: 'fun_lab', moldura: 'mol_aro' },
      cores: { pele: '#e8b58c', cabelo: '#8a4a2a', roupa: '#2d6a8a', destaque: '#4cd9e8' },
    },
  },
  {
    id: 'pre_ronin',
    nome: 'Ronin da Madrugada',
    descricao: 'Meio coque, máscara e pétalas de sakura no vento do dojo.',
    raridade: 'lendario',
    config: {
      base: 'bas_marcada',
      camadas: { cabelo: 'cab_meio_coque', olhos: 'olh_misterioso', boca: 'boc_mascara', roupa: 'rou_kimono', fundo: 'fun_dojo', moldura: 'mol_cristal', efeito: 'efe_sakura', aura: 'aur_vento' },
      cores: { pele: '#d29e6f', cabelo: '#14100c', roupa: '#7a2d3c', destaque: '#ff7a3d' },
    },
  },
  {
    id: 'pre_navegante',
    nome: 'Navegante',
    descricao: 'Colete, bandana e o estandarte corsário içado.',
    raridade: 'raro',
    config: {
      base: 'bas_quadrada',
      camadas: { cabelo: 'cab_buzz', olhos: 'olh_focado', boca: 'boc_palito', roupa: 'rou_colete', acessorio: 'ace_lenco_bandana', fundo: 'fun_montanhas', banner: 'ban_corsario' },
      cores: { pele: '#b07a4e', cabelo: '#3d2b1f', roupa: '#5a4a32', destaque: '#e8b64c' },
    },
  },
  {
    id: 'pre_dj',
    nome: 'DJ do Deploy',
    descricao: 'Fone no pescoço... quer dizer, na cabeça — e o synthwave rolando.',
    raridade: 'raro',
    config: {
      base: 'bas_coracao',
      camadas: { cabelo: 'cab_ondas_curtas', olhos: 'olh_brincalhao', boca: 'boc_assobio', roupa: 'rou_hoodie', acessorio: 'ace_fone', fundo: 'fun_synthwave', moldura: 'mol_neon', efeito: 'efe_bolhas' },
      cores: { pele: '#e8b58c', cabelo: '#6b4a2a', roupa: '#2a2438', destaque: '#c99aff' },
    },
  },
  {
    id: 'pre_bibliotecario',
    nome: 'Guardião do Acervo',
    descricao: 'Flanela, monóculo e paz entre as estantes.',
    raridade: 'incomum',
    config: {
      base: 'bas_longa',
      camadas: { cabelo: 'cab_franja_longa', olhos: 'olh_sonolento', boca: 'boc_neutra', roupa: 'rou_flanela', acessorio: 'ace_monoculo', fundo: 'fun_biblioteca', moldura: 'mol_madeira' },
      cores: { pele: '#d29e6f', cabelo: '#5a3a22', roupa: '#5a2d2d', destaque: '#e8b64c' },
    },
  },
  {
    id: 'pre_magnata',
    nome: 'Magnata',
    descricao: 'Smoking, corrente e cifrões na pupila. O ROI agradece.',
    raridade: 'epico',
    config: {
      base: 'bas_angular',
      camadas: { cabelo: 'cab_topete', olhos: 'olh_cifrao', boca: 'boc_lado', roupa: 'rou_smoking', acessorio: 'ace_corrente', fundo: 'fun_escritorio', moldura: 'mol_ouro', efeito: 'efe_faiscas' },
      cores: { pele: '#d29e6f', cabelo: '#14100c', roupa: '#14213d', destaque: '#e8b64c' },
      titulo: 'tit_imperador_do_roi',
    },
  },
  {
    id: 'pre_inverno',
    nome: 'Sentinela do Inverno',
    descricao: 'Sobretudo, cachecol, barba cheia e a nevasca por testemunha.',
    raridade: 'epico',
    config: {
      base: 'bas_marcada',
      camadas: { cabelo: 'cab_longo', olhos: 'olh_serio', boca: 'boc_barba', roupa: 'rou_sobretudo', acessorio: 'ace_cachecol', fundo: 'fun_montanhas', moldura: 'mol_cristal', efeito: 'efe_neve' },
      cores: { pele: '#e8b58c', cabelo: '#6b6b70', roupa: '#2b3550', destaque: '#4cd9e8' },
    },
  },
  {
    id: 'pre_oni',
    nome: 'Oni do Dojo',
    descricao: 'Chifres, sorriso travesso e a aura sombria de quem venceu.',
    raridade: 'lendario',
    config: {
      base: 'bas_angular',
      camadas: { cabelo: 'cab_moicano', olhos: 'olh_vilao', boca: 'boc_travessa', roupa: 'rou_kimono', acessorio: 'ace_chifres_oni', fundo: 'fun_dojo', moldura: 'mol_chamas', aura: 'aur_sombria' },
      cores: { pele: '#b0642a', cabelo: '#14100c', roupa: '#3a1420', destaque: '#ff5230' },
    },
  },
  {
    id: 'pre_piloto_vr',
    nome: 'Piloto de Simulação',
    descricao: 'Headset VR, jaqueta neon e o hangar Nexus pronto p/ launch.',
    raridade: 'lendario',
    config: {
      base: 'bas_classica',
      camadas: { cabelo: 'cab_buzz', olhos: 'olh_focado', boca: 'boc_determinada', roupa: 'rou_neon_racer', acessorio: 'ace_viseira_vr', fundo: 'fun_hangar', moldura: 'mol_circuito', aura: 'aur_neon' },
      cores: { pele: '#e8b58c', cabelo: '#20242e', roupa: '#1c2333', destaque: '#4cd9e8' },
    },
  },
  {
    id: 'pre_panda_zen',
    nome: 'Panda Zen',
    descricao: 'Kimono, brisa suave e zero notificações.',
    raridade: 'raro',
    config: {
      base: 'bas_panda',
      camadas: { olhos: 'olh_feliz', boca: 'boc_sorriso', roupa: 'rou_kimono', fundo: 'fun_dojo', moldura: 'mol_aro', aura: 'aur_vento' },
      cores: { pele: '#eef1f6', cabelo: '#14100c', roupa: '#2f4a33', destaque: '#4cd97c' },
    },
  },
  {
    id: 'pre_raposa_estelar',
    nome: 'Raposa Estelar',
    descricao: 'Mistério, jaqueta e uma constelação particular em órbita.',
    raridade: 'epico',
    config: {
      base: 'bas_raposa',
      camadas: { olhos: 'olh_misterioso', boca: 'boc_lado', roupa: 'rou_jaqueta', fundo: 'fun_synthwave', moldura: 'mol_neon', aura: 'aur_estelar' },
      cores: { pele: '#d98a3a', cabelo: '#3d2b1f', roupa: '#2a2438', destaque: '#c99aff' },
    },
  },
  {
    id: 'pre_guardiao',
    nome: 'Guardião da Trilha',
    descricao: 'Colete, escudo no peito e folhas dançando ao redor.',
    raridade: 'raro',
    config: {
      base: 'bas_quadrada',
      camadas: { cabelo: 'cab_curto', olhos: 'olh_focado', boca: 'boc_determinada', roupa: 'rou_colete', fundo: 'fun_montanhas', banner: 'ban_guardiao', emblema: 'emb_escudo', efeito: 'efe_folhas' },
      cores: { pele: '#b07a4e', cabelo: '#3d2b1f', roupa: '#3e5a4a', destaque: '#4cd97c' },
    },
  },
  {
    id: 'pre_pixelado',
    nome: 'Herói de 8 Bits',
    descricao: 'Olhos pixel, coração de fliperama e praia renderizada em 16 cores.',
    raridade: 'epico',
    config: {
      base: 'bas_classica',
      camadas: { cabelo: 'cab_moicano', olhos: 'olh_pixel', boca: 'boc_travessa', roupa: 'rou_gamer', fundo: 'fun_praia', banner: 'ban_pixel', emblema: 'emb_coracao_pixel', moldura: 'mol_rgb' },
      cores: { pele: '#e8b58c', cabelo: '#ff5f8f', roupa: '#20242e', destaque: '#4cd97c' },
    },
  },
  {
    id: 'pre_tempestade',
    nome: 'Olho da Tempestade',
    descricao: 'Sobretudo na chuva, relâmpagos e calma absoluta.',
    raridade: 'epico',
    config: {
      base: 'bas_longa',
      camadas: { cabelo: 'cab_medio', olhos: 'olh_serio', boca: 'boc_neutra', roupa: 'rou_sobretudo', fundo: 'fun_chuva', moldura: 'mol_tech', efeito: 'efe_tempestade', aura: 'aur_eletrica' },
      cores: { pele: '#d29e6f', cabelo: '#2a2a33', roupa: '#28324a', destaque: '#4c9de8' },
    },
  },
  {
    id: 'pre_verao',
    nome: 'Modo Férias',
    descricao: 'Regata, óculos escuros e chiclete — o backlog que espere.',
    raridade: 'comum',
    config: {
      base: 'bas_redonda',
      camadas: { cabelo: 'cab_rabo', olhos: 'olh_feliz', boca: 'boc_chiclete', roupa: 'rou_regata', acessorio: 'ace_oculos_sol', fundo: 'fun_praia', moldura: 'mol_aro', efeito: 'efe_bolhas' },
      cores: { pele: '#b07a4e', cabelo: '#6b4a2a', roupa: '#1f6e5a', destaque: '#ff7a3d' },
    },
  },
  {
    id: 'pre_forjador',
    nome: 'Mestre Forjador',
    descricao: 'Barba, brasas e a engrenagem que faz tudo girar.',
    raridade: 'raro',
    config: {
      base: 'bas_quadrada',
      camadas: { cabelo: 'cab_buzz', olhos: 'olh_focado', boca: 'boc_barba', roupa: 'rou_colete', fundo: 'fun_forja', banner: 'ban_forjado', emblema: 'emb_engrenagem', moldura: 'mol_madeira', efeito: 'efe_fogo' },
      cores: { pele: '#b0642a', cabelo: '#3d2b1f', roupa: '#4a2d18', destaque: '#ff8a3d' },
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
  /** mega 67 (§210): LORE — a história que a página da coleção conta */
  lore?: string;
}

export const COLECOES: Colecao[] = [
  {
    id: 'col_cyber_nexus',
    nome: 'Cyber Nexus',
    descricao: 'O conjunto sintético completo: chassi, óptica, armadura e a chuva de código.',
    raridade: 'lendario',
    itens: ['bas_androide', 'olh_led', 'boc_grade', 'rou_armadura', 'fun_circuito', 'mol_tech', 'efe_chuva'],
    cores: { pele: '#c8d4e8', destaque: '#4cd9e8' },
    lore: 'Dizem que o Nexus acordou numa madrugada de deploy, entre um commit e um rollback. Quem veste o conjunto completo escuta o hum da rede — e nunca mais olha um dashboard do mesmo jeito.',
  },
  {
    id: 'col_executivo',
    nome: 'Executivo Elite',
    descricao: 'Alfaiataria, olhar analítico e a moldura de quem assina o trimestre.',
    raridade: 'epico',
    itens: ['bas_angular', 'cab_curto', 'olh_serio', 'boc_determinada', 'rou_terno', 'ace_oculos', 'fun_estudio', 'mol_duplo'],
    cores: { roupa: '#20242e', destaque: '#e8b64c' },
    lore: 'O trimestre não se assina sozinho. Cada peça deste conjunto foi vista em pelo menos uma reunião que mudou a meta — e em três que deveriam ter sido um e-mail.',
  },
  {
    id: 'col_dojo',
    nome: 'Caminho do Dojo',
    descricao: 'Kimono, coque de samurai e o entardecer que forjou a disciplina.',
    raridade: 'epico',
    itens: ['cab_coque', 'rou_kimono', 'fun_dojo', 'boc_determinada', 'mol_cristal'],
    cores: { roupa: '#7a2d3c', destaque: '#ff7a3d' },
    lore: 'No dojo, a primeira lição é chegar. A segunda é voltar amanhã. O entardecer da moldura marca a hora em que a disciplina vira hábito — e o hábito vira identidade.',
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
  // ── 4.6 F2 · Onda 4 — 7 coleções novas (meta §28: 12 ✓) ───────────
  {
    id: 'col_oito_bits',
    nome: 'Oito Bits',
    descricao: 'Fliperama completo: pixel nos olhos, no coração e na praia.',
    raridade: 'epico',
    itens: ['olh_pixel', 'ban_pixel', 'emb_coracao_pixel', 'fun_praia', 'ace_oculos_3d', 'mol_rgb'],
    cores: { destaque: '#4cd97c' },
  },
  {
    id: 'col_tempestade',
    nome: 'Olho da Tempestade',
    descricao: 'Chuva, relâmpagos e a sombra elegante do sobretudo.',
    raridade: 'epico',
    itens: ['rou_sobretudo', 'fun_chuva', 'efe_tempestade', 'aur_sombria', 'mol_tech'],
    cores: { destaque: '#4c9de8' },
  },
  {
    id: 'col_campeao',
    nome: 'Circuito Campeão',
    descricao: 'Jersey oficial, louros e o confete da final.',
    raridade: 'raro',
    itens: ['rou_jersey', 'ban_campeao', 'mol_louros', 'efe_confete', 'olh_estrela'],
    cores: { roupa: '#20242e', destaque: '#4cd97c' },
  },
  {
    id: 'col_forja',
    nome: 'Coração da Forja',
    descricao: 'Brasas, bigorna, barba e as chamas que temperam lendas.',
    raridade: 'lendario',
    itens: ['fun_forja', 'ban_forjado', 'efe_fogo', 'boc_barba', 'mol_chamas', 'emb_engrenagem'],
    cores: { destaque: '#ff8a3d' },
  },
  {
    id: 'col_neon_noturno',
    nome: 'Neon Noturno',
    descricao: 'A madrugada synthwave completa: jaqueta, letreiro e circuito vivo.',
    raridade: 'lendario',
    itens: ['rou_neon_racer', 'fun_synthwave', 'aur_neon', 'ban_neon_tokyo', 'ace_tiara_led', 'mol_circuito'],
    cores: { destaque: '#ff5f8f' },
  },
  {
    id: 'col_guardiao_verde',
    nome: 'Guardião Verde',
    descricao: 'Folhas, vento e a bandana de quem protege a trilha.',
    raridade: 'raro',
    itens: ['ban_guardiao', 'efe_folhas', 'aur_vento', 'fun_montanhas', 'ace_lenco_bandana'],
    cores: { destaque: '#4cd97c' },
  },
  {
    id: 'col_realeza',
    nome: 'Sangue Real',
    descricao: 'Coroa, smoking, estandarte imperial e o sol como aura.',
    raridade: 'lendario',
    itens: ['rou_smoking', 'ban_imperial', 'emb_coroa', 'ace_coroa', 'mol_ouro', 'aur_solar'],
    cores: { destaque: '#e8b64c' },
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
