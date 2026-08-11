// nucleo/i18n.ts — INTERNACIONALIZAÇÃO fundação (lote 411–420 · §296,
// flag as5.i18n).
// @version 1.0.0  @created 2026-08-06
//
// Princípios: PT é o idioma CANÔNICO (as chaves SÃO o texto PT de hoje —
// zero risco de regressão: chave sem tradução = texto atual, byte a
// byte); EN é a primeira tradução, cobrindo o TOPO do shell (header,
// modos, ações principais). Superfícies migram por onda — honesto e
// incremental. Flag off OU idioma pt = t() devolve a chave intocada.
// Persistência local; troca ao vivo via evento (sem reload).
import { flag } from './flags';

export type Idioma = 'pt' | 'en';

const CHAVE = 'dshow.avst5.idioma.v1';

/** EN inicial — chave = texto PT canônico da UI de hoje. */
const EN: Record<string, string> = {
  // lote 1081-1090 (#110): módulos AS6 das ondas 911-1080
  Inspector: 'Inspector',
  Identidade: 'Identity',
  Propriedades: 'Properties',
  Cores: 'Colors',
  Compatibilidade: 'Compatibility',
  'Ações': 'Actions',
  'Nada equipado nesta categoria.': 'Nothing equipped in this category.',
  Favoritar: 'Favorite',
  Favorito: 'Favorited',
  Detalhes: 'Details',
  Remover: 'Remove',
  Slot: 'Slot',
  'Requer base': 'Requires base',
  'Conflita com': 'Conflicts with',
  'Sem conflitos no conjunto atual': 'No conflicts in the current set',
  'Camada travada no aleatório': 'Layer locked for randomize',
  'O que mudou': 'What changed',
  'Salvamentos anteriores': 'Previous saves',
  'CMS do catálogo': 'Catalog CMS',
  'somente leitura': 'read-only',
  Assets: 'Assets',
  'Licenças': 'Licenses',
  Auditoria: 'Audit trail',
  'Carregando…': 'Loading…',
  'Restrito a administradores do catálogo (AdminGate fail-closed).': 'Restricted to catalog admins (AdminGate fail-closed).',
  'Não consegui falar com o servidor do catálogo.': 'Could not reach the catalog server.',
  'Nada por aqui.': 'Nothing here.',
  registros: 'records',
  Recarregar: 'Reload',
  Fechar: 'Close',
  // header / modos
  'Modo foco': 'Focus mode',
  'Modo Studio (apresentação)': 'Studio mode (showcase)',
  'Voltar à edição (Esc)': 'Back to editing (Esc)',
  Apresentar: 'Present',
  Capturar: 'Capture',
  Aleatório: 'Random',
  Consultor: 'Advisor',
  Salvar: 'Save',
  Desfazer: 'Undo',
  Refazer: 'Redo',
  Sair: 'Exit',
  Poder: 'Power',
  'Recarregando…': 'Recharging…',
  // lote 1231-1240 (#126, cobertura da onda 1121-1220 — doutrina #62)
  'Buscar por nome ou key…': 'Search by name or key…',
  'Exportar CSV desta página': 'Export this page as CSV',
  'Detalhe do asset': 'Asset details',
  'Fechar detalhe': 'Close details',
  'Cenário, luz e clima': 'Scene, light & weather',
  'Aplicar selecionados': 'Apply selected',
  // catálogo
  Todos: 'All',
  Favoritos: 'Favorites',
  Novos: 'New',
  Bloqueados: 'Locked',
  'Buscar itens': 'Search items',
  Recentes: 'Recent',
  'Limpar filtros e busca': 'Clear filters and search',
  // presets / backup
  Presets: 'Presets',
  Equipados: 'Equipped',
  'Exportar backup': 'Export backup',
  Importar: 'Import',
  'Exportar TUDO': 'Export ALL',
  'Importar TUDO': 'Import ALL',
  // palco
  'Cenários do palco': 'Stage scenes',
  Cenário: 'Scene',
  Clima: 'Weather',
  Hora: 'Time',
  Luz: 'Light',
  Cena: 'Scene',
  // lote 511-520 (§296): CATÁLOGO
  'Buscar item, tema ou lore…': 'Search item, theme or lore…',
  Padrão: 'Default',
  Raridade: 'Rarity',
  Nome: 'Name',
  'Novos primeiro': 'New first',
  Rápidos: 'Quick',
  Permanentes: 'Permanent',
  'Por coleção': 'By collection',
  Ambiental: 'Ambient',
  Distorção: 'Distortion',
  Celebração: 'Celebration',
  Transição: 'Transition',
  Presença: 'Presence',
  'Recentes:': 'Recent:',
  'Conjuntos:': 'Outfits:',
  'Você quis dizer': 'Did you mean',
  'Limpar filtros': 'Clear filters',
  // lote 521-530 (§296): PAINÉIS
  Estilizar: 'Stylize',
  Cancelar: 'Cancel',
  'Baixar PNG': 'Download PNG',
  Copiar: 'Copy',
  Todas: 'All',
  Conquistadas: 'Achieved',
  Pendentes: 'Pending',
  Eventos: 'Events',
  'Seus números': 'Your numbers',
  'Por categoria': 'By category',
  'Mais difíceis': 'Hardest',
  Últimas: 'Latest',
  'Mais raras': 'Rarest',
  'Por tipo (§216)': 'By type (§216)',
  'Preset inteligente (§205)': 'Smart preset (§205)',
  Dia: 'Day',
  Tarde: 'Afternoon',
  Noite: 'Night',
  Amanhecer: 'Dawn',
  'Pôr do sol': 'Sunset',
  Madrugada: 'Late night',
  Neutra: 'Neutral',
  Quente: 'Warm',
  Fria: 'Cool',
  Dramática: 'Dramatic',
  Auto: 'Auto',
  // lote 561-570 (§102.2): criação fina
  'Ajuste fino (§102.2)': 'Fine tuning (§102.2)',
  Largura: 'Width',
  Altura: 'Height',
  'Restaurar neutro': 'Reset to neutral',
  // lote 571-580 (§178.2/§157.4): palco/som v3
  'Volume geral': 'Master volume',
  Efeitos: 'Effects',
  Ambiente: 'Ambience',
  Celebrações: 'Celebrations',
  'Testar som': 'Test sound',
  Materializar: 'Materialize',
  Teleporte: 'Teleport',
  Ascender: 'Ascend',
  // lote 591-600 (§60.4/§64.2): ux final
  'Prévia': 'Preview',
  'Equipado': 'Equipped', // lote 791-800 (§644, as6.dock)
  'Matiz': 'Hue', // lote 811-820 (§206, as6.color_studio)
  'Saturação': 'Saturation',
  'Luminosidade': 'Lightness',
  'Harmonias': 'Harmonies',
  'Complementar': 'Complementary',
  'Análoga −30°': 'Analogous −30°',
  'Análoga +30°': 'Analogous +30°',
  'Tríade −120°': 'Triad −120°',
  'Tríade +120°': 'Triad +120°',
  'Prévia fixada': 'Preview pinned',
  'Fixar prévia': 'Pin preview',
  Soltar: 'Unpin',
  // 3D
  'Prévia 3D (personagens curados)': '3D preview (curated characters)',
  Enquadrar: 'Frame',
  Rosto: 'Face',
  Vida: 'Life',
  Aro: 'Rim',
  Partículas: 'Particles',
  // onda 1295 (#138): cobertura EN das ondas 1291–1294 (barra
  // contextual, divisor da dock, câmera, card "Nenhum")
  Busto: 'Bust',
  Corpo: 'Body',
  'Redimensionar biblioteca de assets': 'Resize asset library',
  'Arraste para redimensionar — duplo clique volta ao padrão': 'Drag to resize — double-click restores the default',
  'Dispensar dicas de contexto': 'Dismiss context tips',
  'Remover o item desta categoria': 'Remove the item from this category',
  Cabelo: 'Hair',
  Olhos: 'Eyes',
  Boca: 'Mouth',
  Roupa: 'Outfit',
  'Sobrepeça': 'Overlayer',
  'Acessórios': 'Accessories',
  Fundo: 'Background',
  Moldura: 'Frame',
  Efeito: 'Effect',
  Aura: 'Aura',
  Banner: 'Banner',
  Emblema: 'Emblem',
  'Escolha a base do personagem. A câmera aproxima do rosto para facilitar a comparação.': 'Pick the character base. The camera zooms to the face to make comparison easier.',
  'Escolha um estilo e ajuste as cores sem perder a visão do rosto.': 'Pick a style and tune its colors without losing sight of the face.',
  'Compare formatos e estilos. O preview foi aproximado para facilitar a escolha.': 'Compare shapes and styles. The preview is zoomed in to make choosing easier.',
  'Compare expressões de perto — a câmera acompanha a boca enquanto você escolhe.': 'Compare expressions up close — the camera follows the mouth while you choose.',
  'Vista a peça e ajuste as cores dela — o corpo inteiro fica visível no preview.': 'Wear the piece and tune its colors — the full body stays visible in the preview.',
  'Adicione uma camada por cima da roupa e veja na hora como combina com o conjunto.': 'Add a layer over the outfit and see instantly how it matches the set.',
  'Até 3 ao mesmo tempo (cabeça, rosto e pescoço) — conflitos de slot aparecem antes de equipar.': 'Up to 3 at once (head, face and neck) — slot conflicts show up before equipping.',
  'Altere o cenário mantendo o avatar visível no centro.': 'Change the backdrop while the avatar stays centered and visible.',
  'Compare molduras ao redor do avatar e visualize o resultado imediatamente.': 'Compare frames around the avatar and see the result immediately.',
  'Equipe um efeito e regule a intensidade — ative o poder no modo Studio para vê-lo em ação.': 'Equip an effect and tune its intensity — trigger the power in Studio mode to see it in action.',
  'Envolva o avatar com uma aura e ajuste os presets vendo o resultado ao vivo.': 'Wrap the avatar in an aura and adjust presets while watching it live.',
  'Escolha o plano de fundo do seu perfil — ele aparece atrás do avatar nas vitrines.': 'Pick your profile background — it shows behind the avatar in showcases.',
  'Posicione seu emblema e ajuste as propriedades — o zoom aproxima do canto onde ele vive.': 'Place your emblem and tune its properties — the zoom moves to the corner where it lives.',
};

let _idioma: Idioma | null = null;

export function idiomaAtual(): Idioma {
  if (_idioma) return _idioma;
  try {
    const v = localStorage.getItem(CHAVE);
    _idioma = v === 'en' ? 'en' : 'pt';
  } catch { _idioma = 'pt'; }
  return _idioma;
}

export function definirIdioma(idioma: Idioma): void {
  _idioma = idioma;
  try { localStorage.setItem(CHAVE, idioma); } catch { /* sem storage */ }
  try { window.dispatchEvent(new Event('avst:idioma')); } catch { /* ssr */ }
}

/** §296: traduz a chave (= texto PT). Sem tradução/flag off = PT intocado. */
export function t(chave: string): string {
  if (idiomaAtual() !== 'en' || !flag('as5.i18n')) return chave;
  return EN[chave] ?? chave;
}
