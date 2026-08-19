// testes/visual/golden-casos.ts — onda 1407 (MEGA_BRIEFING_01 §2678–§2689,
// decisão #158): DEFINIÇÃO ÚNICA dos casos golden (g01–g16) — consumida
// pelo golden-avatars.mjs (sha256 dos BYTES do SVG) e pela regressão VISUAL
// (PNG do mesmo SVG). Fonte única = o golden visual é, por construção, a
// imagem do mesmo caso cujo hash de bytes já é tripwire.
//
// Importado por bundle esbuild (node puro) a partir de prova.ts temporário:
//   import { casosGolden } from '<repo>/scripts/avatar/testes/visual/golden-casos';
// O caminho do painel é injetado no bundle (alias) — ver usos.
// @version 1.0.0  @created 2026-08-19
import { CONFIG_PADRAO, itensDe, svgDe, svgFotoDe, validarConfig } from '@painel/services/AvatarCatalog';
import type { AvatarConfig, EstiloFoto } from '@painel/domain/types';

// primeiro id (ordenado) de cada categoria — muda de catálogo ⇒ muda o
// golden ⇒ revisão consciente (é o comportamento DESEJADO)
const primeiro = (cat: string): string => itensDe(cat as never).map((x) => x.id).sort()[0];
const cfg = (extra: Partial<AvatarConfig>): AvatarConfig => validarConfig({ ...CONFIG_PADRAO, ...extra });

export interface CasoGolden { id: string; svg: string; grupo: 'avatar' | 'foto'; tamanho: 'busto' | 'corpo' | 'foto' }

export function casosGolden(): CasoGolden[] {
  const completo = cfg({
    camadas: {
      ...CONFIG_PADRAO.camadas,
      moldura: primeiro('moldura'), efeito: primeiro('efeito'),
      aura: primeiro('aura'), banner: primeiro('banner'), emblema: primeiro('emblema'),
      acessorio_cabeca: itensDe('acessorio').filter((x) => (x.slot ?? 'cabeca') === 'cabeca').map((x) => x.id).sort()[0],
    },
  });

  const CASOS: Array<[string, () => string, 'busto' | 'corpo']> = [
    ['g01-padrao-busto', () => svgDe(cfg({})), 'busto'],
    ['g02-completo-busto', () => svgDe(completo), 'busto'],
    ['g03-sobrepeca', () => svgDe(cfg({ camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_gamer', roupa_sobre: 'sob_colete' } })), 'busto'],
    ['g04-params-aura', () => svgDe(cfg({ camadas: { ...CONFIG_PADRAO.camadas, aura: primeiro('aura') }, params: { aura: { intensidade: 0.5 } } })), 'busto'],
    ['g05-canais-roupa', () => svgDe(cfg({ coresCamada: { roupa: { roupa: '#123456' } } })), 'busto'],
    ['g06-corpo-postura-fino', () => svgDe(cfg({ corpo: 'robusto', postura: 'heroica', corpoFino: { largura: 1.05 } })), 'busto'],
    ['g07-titulo-cores', () => svgDe(cfg({ titulo: 'tit_lenda_dshow', cores: { pele: '#e8b58c', cabelo: '#3d2b1f', roupa: '#2d4a8a', destaque: '#39d98a' } })), 'busto'],
    ['g08-palco', () => svgDe(cfg({}), { palco: true }), 'busto'],
    ['g09-corpo-inteiro', () => svgDe(completo, { palco: true, enquadramento: 'corpo' }), 'corpo'],
  ];

  const FOTO = 'data:image/png;base64,GOLDENSTUB';
  const estiloBase: EstiloFoto = {
    camadas: { fundo: primeiro('fundo'), aura: primeiro('aura') },
    cores: { destaque: '#7c5cff' },
  };
  const CASOS_FOTO: Array<[string, () => string]> = [
    ['g10-foto-medalhao', () => svgFotoDe(FOTO, { ...estiloBase, legenda: 'Golden', ajustes: { vinheta: 0.4 } }, { estatico: true, uid: 'gold10' })],
    ['g11-foto-ordem-camadas', () => svgFotoDe(FOTO, {
      ...estiloBase, ordemFundo: ['aura', 'fundo', 'banner'],
      camadasFoto: { aura: { opacidade: 0.6, blend: 'screen' } },
    }, { estatico: true, uid: 'gold11' })],
    ['g12-foto-wide-header', () => svgFotoDe(FOTO, {
      ...estiloBase, subtitulo: 'Head of Golden', tipografia: { fonte: 'mono', peso: 800 },
    }, { estatico: true, uid: 'gold12', formato: 'header' })],
    // ── goldens v2 (lote 1271–1280, decisão #131): formatos wide restantes
    // + §337/§334 + sobrepeça de corpo — fecham a rede de render ──
    ['g13-foto-wide-banner-reflow', () => svgFotoDe(FOTO, {
      ...estiloBase, legenda: 'Golden', pos: { texto: { x: 30, y: 200 } },
    }, { estatico: true, uid: 'gold13', formato: 'banner', reflowPos: true })],
    ['g14-foto-wide-wallpaper', () => svgFotoDe(FOTO, {
      ...estiloBase, subtitulo: 'Wallpaper Golden',
    }, { estatico: true, uid: 'gold14', formato: 'wallpaper' })],
    ['g15-foto-sombra-luz', () => svgFotoDe(FOTO, {
      ...estiloBase,
      ajustes: { sombra: true, luzLocal: { tipo: 'radial', intensidade: 0.5 }, temperatura: 0.4 },
    }, { estatico: true, uid: 'gold15' })],
  ];
  CASOS.push(['g16-palco-sobrepeca-corpo', () => svgDe(cfg({
    camadas: { ...CONFIG_PADRAO.camadas, roupa: 'rou_gamer', roupa_sobre: 'sob_colete' },
  }), { palco: true, enquadramento: 'corpo' }), 'corpo']);

  const saida: CasoGolden[] = [];
  for (const [id, gerar, tamanho] of CASOS) saida.push({ id, svg: gerar(), grupo: 'avatar', tamanho });
  for (const [id, gerar] of CASOS_FOTO) saida.push({ id, svg: gerar(), grupo: 'foto', tamanho: 'foto' });
  // ordem canônica por id (g01…g16) — independente da ordem de push
  return saida.sort((a, b) => a.id.localeCompare(b.id));
}
