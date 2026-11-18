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

/** Cor fixa por kit do legado (tokens de série do design system). */
export const COR_KIT: Record<string, string> = {
  'Base (8)': 'var(--bl-serie-7)', Gabinete: 'var(--bl-serie-2)', 'Módulo': 'var(--bl-serie-4)', Parafusos: 'var(--bl-serie-8)',
  Controladoras: 'var(--bl-serie-3)', Cabos: 'var(--bl-serie-5)', Fontes: 'var(--bl-serie-6)',
};

export const IMPORTANCIA_CURTA: Record<string, string> = {
  'Campos Obrigatórios': 'Obrigatório', 'Campos Importantes': 'Importante', 'Campos Básicos': 'Básico',
  'Campos Complementares': 'Complementar', 'Campos Opcionais': 'Opcional', 'Campos Sem Importância': 'Sem importância',
};
