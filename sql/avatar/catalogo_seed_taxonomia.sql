-- ============================================================================
-- Avatar Studio — EXPANSÃO: seed da TAXONOMIA (grupos, categorias, raridades,
-- bibliotecas, licenças). Idempotente: INSERT … ON DUPLICATE KEY UPDATE.
-- @module avatar.sql.catalogo_seed_taxonomia
-- @created 2026-07-30
--
-- Política 3D-first (decisão oficial): supported_renderers declara onde cada
-- categoria existe. Categorias novas SEM assets ainda entram is_active=0
-- (placeholder — aparecem na sidebar só quando o conteúdo chegar).
-- ============================================================================

-- ── Licenças ────────────────────────────────────────────────────────────────
INSERT INTO avatar_licenses
  (id, name, license_type, source_url, commercial_use, modification_allowed,
   redistribution_allowed, attribution_required, attribution_text,
   proof_document_url, created_at, updated_at)
VALUES
  (1, 'CC0 1.0 Universal', 'cc0', 'https://creativecommons.org/publicdomain/zero/1.0/',
   1, 1, 1, 0, NULL, '/assets/avatars/3d/LICENCAS.md', NOW(), NOW()),
  (2, 'Proprietária Dshow', 'proprietaria', NULL, 1, 1, 0, 0,
   'Arte autoral Dshow — uso interno do Dshow Dash.', NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = NOW();

-- ── Bibliotecas ─────────────────────────────────────────────────────────────
INSERT INTO avatar_libraries
  (`key`, name, provider, description, art_style, default_renderer, license_id,
   version, status, is_internal, created_at, updated_at)
VALUES
  ('dshow_svg', 'Dshow Vetorial', 'Dshow',
   'Catálogo autoral do motor SVG em camadas (Frente 6 + AS3).',
   'vetorial em camadas', '2d', 2, '1.0.0', 'published', 1, NOW(), NOW()),
  ('dshow_3d', 'Dshow 3D', 'Dshow',
   'Assets 3D retrabalhados pelo pipeline Dshow (GLB + Meshopt).',
   'realismo estilizado', '3d', 2, '1.0.0', 'published', 1, NOW(), NOW()),
  ('cc0_quaternius', 'CC0 Retrabalhada — Quaternius', 'Quaternius',
   'Bases CC0 (Modular Men, Ultimate Animated Character) retrabalhadas.',
   'low-poly estilizado', '3d', 1, '1.0.0', 'published', 0, NOW(), NOW()),
  ('cc0_threejs', 'CC0 Retrabalhada — three.js examples', 'three.js',
   'RobotExpressive (Tomás Laulhé/Don McCurdy) retrabalhado.',
   'toon expressivo', '3d', 1, '1.0.0', 'published', 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = NOW();

-- ── Raridades (espelho fiel do front — sai do hardcode) ────────────────────
INSERT INTO avatar_rarities
  (`key`, name, level, color_token, effect_key, sound_key, sort_order, metadata)
VALUES
  ('comum',     'Comum',     0, '#9aa4b8', NULL,      'tom_0', 0, JSON_OBJECT('peso', 40)),
  ('incomum',   'Incomum',   1, '#4cd97c', NULL,      'tom_1', 1, JSON_OBJECT('peso', 28)),
  ('raro',      'Raro',      2, '#4c9de8', NULL,      'tom_2', 2, JSON_OBJECT('peso', 16)),
  ('epico',     'Épico',     3, '#b06ce8', 'degrade', 'tom_3', 3, JSON_OBJECT('peso', 9)),
  ('lendario',  'Lendário',  4, '#e8b64c', 'shimmer', 'tom_4', 4, JSON_OBJECT('peso', 5)),
  ('mitico',    'Mítico',    5, '#ff5230', 'shimmer_glow', 'tom_5', 5, JSON_OBJECT('peso', 3)),
  ('exclusivo', 'Exclusivo', 6, '#ff5f8f', 'shimmer_glow', 'tom_6', 6, JSON_OBJECT('peso', 2))
ON DUPLICATE KEY UPDATE name = VALUES(name), color_token = VALUES(color_token),
  level = VALUES(level), sort_order = VALUES(sort_order);

-- ── Grupos da navegação (estrutura do briefing) ────────────────────────────
INSERT INTO avatar_category_groups
  (`key`, name, description, icon, sort_order, is_active, is_collapsible,
   default_expanded, created_at, updated_at)
VALUES
  ('identidade',    'Identidade',    'Quem o personagem é.',            'circle-user',     0, 1, 1, 1, NOW(), NOW()),
  ('corpo',         'Corpo',         'Rosto, pele e traços.',           'person-standing', 1, 1, 1, 0, NOW(), NOW()),
  ('cabelo',        'Cabelo',        'Estilo, cor e volume.',           'brush',           2, 1, 1, 0, NOW(), NOW()),
  ('vestuario',     'Vestuário',     'Roupas, luvas e calçados.',       'shirt',           3, 1, 1, 0, NOW(), NOW()),
  ('equipamentos',  'Equipamentos',  'Acessórios, companions e pets.',  'glasses',         4, 1, 1, 0, NOW(), NOW()),
  ('poderes',       'Poderes',       'Auras, partículas e efeitos.',    'sparkles',        5, 1, 1, 0, NOW(), NOW()),
  ('aparencia',     'Aparência',     'Palco, cenário, clima e luz.',    'image',           6, 1, 1, 0, NOW(), NOW()),
  ('personalidade', 'Personalidade', 'Poses, expressões e título.',     'smile',           7, 1, 1, 0, NOW(), NOW()),
  ('sistema',       'Sistema',       'Presets, histórico e coleções.',  'boxes',           8, 1, 1, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order),
  updated_at = NOW();

-- ── Categorias (as ~30 do briefing como DADOS) ──────────────────────────────
-- slot_key mapeia p/ o Config existente quando a categoria JÁ vive no 2D.
-- is_active=0 = placeholder (entra na sidebar quando houver conteúdo).
-- 15 colunas por linha: grupo, key, nome, slot, tipo, modo,
--   sort, ativo, obrigatoria, cores, materiais, morphs, renderers, criado, atualizado
INSERT INTO avatar_categories
  (group_id, `key`, name, slot_key, category_type, selection_mode, sort_order,
   is_active, is_required, supports_colors, supports_materials, supports_morphs,
   supported_renderers, created_at, updated_at)
VALUES
  -- IDENTIDADE
  ((SELECT id FROM avatar_category_groups WHERE `key`='identidade'), 'arquetipo',     'Arquétipo',     NULL,   'preset', 'single',    0, 1, 0, 0, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='identidade'), 'especie',       'Espécie',       'base', 'asset',  'single',    1, 1, 1, 0, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='identidade'), 'tipo_corporal', 'Tipo Corporal', NULL,   'morph',  'parameter', 2, 0, 0, 0, 0, 1, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='identidade'), 'idade_visual',  'Idade Visual',  NULL,   'morph',  'parameter', 3, 0, 0, 0, 0, 1, '3d',    NOW(), NOW()),
  -- CORPO
  ((SELECT id FROM avatar_category_groups WHERE `key`='corpo'), 'pele',         'Pele',         NULL,    'color', 'parameter', 0, 1, 0, 1, 1, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='corpo'), 'rosto',        'Rosto',        NULL,    'asset', 'single',    1, 0, 0, 0, 0, 1, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='corpo'), 'nariz',        'Nariz',        NULL,    'morph', 'parameter', 2, 0, 0, 0, 0, 1, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='corpo'), 'boca',         'Boca',         'boca',  'asset', 'single',    3, 1, 1, 0, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='corpo'), 'olhos',        'Olhos',        'olhos', 'asset', 'single',    4, 1, 1, 0, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='corpo'), 'sobrancelhas', 'Sobrancelhas', NULL,    'asset', 'single',    5, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='corpo'), 'orelhas',      'Orelhas',      NULL,    'asset', 'single',    6, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='corpo'), 'barba',        'Barba',        NULL,    'asset', 'single',    7, 0, 0, 1, 0, 0, '3d',    NOW(), NOW()),
  -- CABELO
  ((SELECT id FROM avatar_category_groups WHERE `key`='cabelo'), 'cabelo',        'Cabelo',        'cabelo', 'asset', 'single',    0, 1, 0, 1, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='cabelo'), 'cor_cabelo',    'Cor do Cabelo', NULL,     'color', 'parameter', 1, 1, 0, 1, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='cabelo'), 'volume_cabelo', 'Volume',        NULL,     'morph', 'parameter', 2, 0, 0, 0, 0, 1, '3d',    NOW(), NOW()),
  -- VESTUÁRIO
  ((SELECT id FROM avatar_category_groups WHERE `key`='vestuario'), 'roupa',          'Roupa (conjunto)', 'roupa', 'asset', 'single', 0, 1, 1, 1, 1, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='vestuario'), 'roupa_superior', 'Roupa Superior',   NULL,    'asset', 'single', 1, 0, 0, 1, 1, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='vestuario'), 'roupa_inferior', 'Roupa Inferior',   NULL,    'asset', 'single', 2, 0, 0, 1, 1, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='vestuario'), 'luvas',          'Luvas',            NULL,    'asset', 'single', 3, 0, 0, 1, 1, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='vestuario'), 'calcados',       'Calçados',         NULL,    'asset', 'single', 4, 0, 0, 1, 1, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='vestuario'), 'mochila',        'Mochilas',         NULL,    'asset', 'single', 5, 0, 0, 0, 1, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='vestuario'), 'ombros',         'Ombros',           NULL,    'asset', 'single', 6, 0, 0, 0, 1, 0, '3d',    NOW(), NOW()),
  -- EQUIPAMENTOS
  ((SELECT id FROM avatar_category_groups WHERE `key`='equipamentos'), 'acessorio',  'Acessórios',  'acessorio', 'asset', 'single',   0, 1, 0, 0, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='equipamentos'), 'ferramenta', 'Ferramentas', NULL,        'asset', 'single',   1, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='equipamentos'), 'emblema',    'Emblemas',    'emblema',   'asset', 'single',   2, 1, 0, 0, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='equipamentos'), 'broche',     'Broches',     NULL,        'asset', 'multiple', 3, 0, 0, 0, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='equipamentos'), 'companion',  'Companion',   NULL,        'asset', 'single',   4, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='equipamentos'), 'pet',        'Pets',        NULL,        'asset', 'single',   5, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  -- PODERES
  ((SELECT id FROM avatar_category_groups WHERE `key`='poderes'), 'aura',        'Aura',        'aura',   'asset', 'single', 0, 1, 0, 1, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='poderes'), 'particulas',  'Partículas',  NULL,     'asset', 'single', 1, 0, 0, 1, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='poderes'), 'efeito',      'Efeitos',     'efeito', 'asset', 'single', 2, 1, 0, 0, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='poderes'), 'super_poder', 'Super Poder', NULL,     'asset', 'single', 3, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='poderes'), 'halo',        'Halo',        NULL,     'asset', 'single', 4, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='poderes'), 'asas',        'Asas',        NULL,     'asset', 'single', 5, 0, 0, 0, 1, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='poderes'), 'rastro',      'Rastros',     NULL,     'asset', 'single', 6, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  -- APARÊNCIA
  ((SELECT id FROM avatar_category_groups WHERE `key`='aparencia'), 'fundo',       'Fundo',       'fundo',   'asset', 'single', 0, 1, 0, 0, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='aparencia'), 'cenario',     'Cenário',     NULL,      'scene', 'single', 1, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='aparencia'), 'clima',       'Clima',       NULL,      'scene', 'single', 2, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='aparencia'), 'hora_do_dia', 'Hora do Dia', NULL,      'scene', 'single', 3, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='aparencia'), 'iluminacao',  'Iluminação',  NULL,      'scene', 'single', 4, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='aparencia'), 'moldura',     'Moldura',     'moldura', 'asset', 'single', 5, 1, 0, 0, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='aparencia'), 'banner',      'Banner',      'banner',  'asset', 'single', 6, 1, 0, 0, 0, 0, '2d,3d', NOW(), NOW()),
  -- PERSONALIDADE
  ((SELECT id FROM avatar_category_groups WHERE `key`='personalidade'), 'expressao',     'Expressões',     NULL, 'morph',       'parameter', 0, 0, 0, 0, 0, 1, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='personalidade'), 'pose',          'Pose',           NULL, 'animation',   'single',    1, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='personalidade'), 'idle',          'Idle Animation', NULL, 'animation',   'single',    2, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='personalidade'), 'emote',         'Emotes',         NULL, 'animation',   'multiple',  3, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='personalidade'), 'voz',           'Voz',            NULL, 'system',      'single',    4, 0, 0, 0, 0, 0, '3d',    NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='personalidade'), 'personalidade', 'Personalidade',  NULL, 'personality', 'single',    5, 0, 0, 0, 0, 0, '2d,3d', NOW(), NOW()),
  ((SELECT id FROM avatar_category_groups WHERE `key`='personalidade'), 'titulo',        'Título',         NULL, 'system',      'single',    6, 1, 0, 0, 0, 0, '2d,3d', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order),
  supported_renderers = VALUES(supported_renderers), is_active = VALUES(is_active),
  slot_key = VALUES(slot_key), updated_at = NOW();

-- Versão inicial do catálogo (linha única)
INSERT INTO avatar_catalog_meta (id, version, published_at, notes)
VALUES (1, 1, NOW(), 'Fundação da Expansão — taxonomia inicial')
ON DUPLICATE KEY UPDATE version = version;
