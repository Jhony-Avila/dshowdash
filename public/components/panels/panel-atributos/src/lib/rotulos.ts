// panel-atributos/src/lib/rotulos.ts — rótulos em português.
// Categorias/subcategorias e ficha do Precifica: ESPELHO de backend/api/src/modules/products/labels.ts e specs.ts do app
// (mesma linguagem do app iOS). Código desconhecido aparece como está, nunca é omitido.

export const CATEGORIAS: Record<string, string> = { LED_PANEL: 'Painéis de LED', SERVICE: 'Serviços' };

export const SUBCATEGORIAS: Record<string, string> = {
  LED_MODULE: 'Módulos de LED', PROCESSOR: 'Processadoras', RECEIVING_CARD: 'Placas receptoras', MISCELLANEOUS: 'Diversos', CABINET: 'Gabinetes',
  CASE: 'Cases', METAL_STRUCTURE: 'Estruturas metálicas', TOTEM: 'Totens', CAN: 'Latas de LED', SPHERE: 'Esferas de LED', BACKPACK: 'Mochilas de LED',
  LED_BAG: 'Bolsas de LED', SHELF_BAR: 'Réguas de prateleira', AUTONOMOUS_TV: 'TVs autônomas', EASEL: 'Cavaletes', SENDING_CARD: 'Placas de envio',
  PLAYER: 'Players', CONTROLLER: 'Controladoras', POWER_SUPPLY: 'Fontes de alimentação', CABLE: 'Cabos', COOLER: 'Ventilação', ACCESSORY: 'Acessórios',
  ELECTRIC_DEVICE: 'Dispositivos elétricos', SCREW: 'Parafusos', RUBBER_SEAL: 'Vedações de borracha', MASK: 'Máscaras', ALUMINUM_FRAME: 'Molduras de alumínio',
  PERIPHERAL: 'Periféricos', DIGITAL_SIGNAGE: 'Sinalização digital', MAINTENANCE: 'Manutenção', SUPPORT: 'Suporte', FREIGHT: 'Frete', INSTALLATION: 'Instalação',
  DEINSTALLATION: 'Desinstalação', METAL_WORK: 'Serralheria', OPERATIONAL_EXPENSE: 'Despesas operacionais', TECHNICAL_ASSISTANCE: 'Assistência técnica',
  MARKETING: 'Marketing', PANEL_MOUNTED: 'Painéis montados',
};

export const rotuloCategoria = (c: string) => CATEGORIAS[c] ?? c;
export const rotuloSubcategoria = (s: string | null) => (s ? SUBCATEGORIAS[s] ?? s : 'Sem subcategoria');

/** Fichas técnicas do Precifica (product_specs.kind → título; campo → rótulo e unidade). */
export const FAMILIAS_PRECIFICA: Record<string, { titulo: string; campos: Record<string, { rotulo: string; unidade?: string; enumeracao?: Record<string, string> }> }> = {
  led_module: { titulo: 'Módulo de LED', campos: {
    usage_type: { rotulo: 'Uso', enumeracao: { INDOOR: 'Indoor', OUTDOOR: 'Outdoor', INDOOR_FLEX: 'Indoor flexível', OUTDOOR_FLEX: 'Outdoor flexível', OUTDOOR_MONO: 'Outdoor monocromático', SEMI_OUTDOOR: 'Semi-outdoor' } },
    pitch: { rotulo: 'Pitch', unidade: 'mm' }, width_mm: { rotulo: 'Largura', unidade: 'mm' }, height_mm: { rotulo: 'Altura', unidade: 'mm' },
    depth_mm: { rotulo: 'Profundidade', unidade: 'mm' }, width_resolution: { rotulo: 'Resolução horizontal', unidade: 'px' },
    height_resolution: { rotulo: 'Resolução vertical', unidade: 'px' }, requires_virtual_pixel: { rotulo: 'Exige pixel virtual' } } },
  panel_mounted: { titulo: 'Painel montado', campos: {
    width_mm: { rotulo: 'Largura', unidade: 'mm' }, height_mm: { rotulo: 'Altura', unidade: 'mm' }, depth_mm: { rotulo: 'Profundidade', unidade: 'mm' },
    weight_kg: { rotulo: 'Peso', unidade: 'kg' }, ambient: { rotulo: 'Ambiente', enumeracao: { INDOOR: 'Indoor', OUTDOOR: 'Outdoor', SEMI_OUTDOOR: 'Semi-outdoor' } },
    fixation: { rotulo: 'Fixação', enumeracao: { MAGNETIC: 'Magnética', SCREWED: 'Parafusada' } }, ip_rating: { rotulo: 'Grau de proteção (IP)' },
    material: { rotulo: 'Material', enumeracao: { ALUMINUM: 'Alumínio', IRON: 'Ferro', PC: 'Policarbonato', COMPOSITE: 'Compósito', OTHER: 'Outro' } }, has_glass: { rotulo: 'Vidro' } } },
  processor: { titulo: 'Processadora', campos: { system: { rotulo: 'Sistema' }, max_pixels: { rotulo: 'Capacidade', unidade: 'px' }, accepts_virtual_pixel: { rotulo: 'Aceita pixel virtual' }, requires_sending_card: { rotulo: 'Exige placa de envio' } } },
  sending_card: { titulo: 'Placa de envio', campos: { system: { rotulo: 'Sistema' } } },
  player: { titulo: 'Player', campos: { system: { rotulo: 'Sistema' }, max_pixels: { rotulo: 'Capacidade', unidade: 'px' } } },
  metal_work: { titulo: 'Estrutura metálica', campos: { fixation: { rotulo: 'Fixação', enumeracao: { MAGNETIC: 'Magnética', SCREWED: 'Parafusada' } } } },
};

export const tituloFamilia = (k: string) => FAMILIAS_PRECIFICA[k]?.titulo ?? k;

/** Cor estável por kit (pelo nome), da série do design system. */
const SERIE = ['var(--bl-serie-2)', 'var(--bl-serie-4)', 'var(--bl-serie-3)', 'var(--bl-serie-5)', 'var(--bl-serie-6)', 'var(--bl-serie-7)', 'var(--bl-serie-8)', 'var(--bl-serie-1)'];
export function corKit(nome: string | null | undefined): string {
  if (!nome) return 'var(--bl-neutro)';
  if (nome.startsWith('Base')) return 'var(--bl-serie-7)';
  let h = 0; for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return SERIE[h % SERIE.length];
}

export const IMPORTANCIA: Record<string, string> = {
  obrigatorio: 'Obrigatório', importante: 'Importante', basico: 'Básico', complementar: 'Complementar', opcional: 'Opcional', sem_importancia: 'Sem importância',
};
export const IMPORTANCIAS = ['obrigatorio', 'importante', 'basico', 'complementar', 'opcional', 'sem_importancia'] as const;
export const ESTADO: Record<string, string> = { informado: 'Informado', nao_se_aplica: 'Não se aplica', desconhecido: 'Desconhecido' };
export const TIPO: Record<string, string> = { texto: 'Texto', numero: 'Número', inteiro: 'Inteiro', booleano: 'Sim/Não', opcao: 'Opção', multiopcao: 'Várias opções', data: 'Data' };
export const MOTIVO_KIT: Record<string, string> = { escopo: 'pela subcategoria', todos: 'todos os produtos', direto: 'direto neste produto', kit: 'kit', avulso: 'avulso' };
export const FONTE_SUGESTAO: Record<string, string> = { legado_2025: 'legado 2025', nome_produto: 'nome do produto', precifica: 'Precifica' };
