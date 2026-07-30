-- ============================================================================
-- Avatar Studio — EXPANSÃO: seed de ASSETS gerado do catálogo TS.
-- GERADO por scripts/avatar/gerar-seed-assets.mjs — NÃO editar à mão.
-- Idempotente (ON DUPLICATE KEY UPDATE). @generated 2026-07-30
-- ============================================================================


-- ── Partes 2D (motor SVG — biblioteca dshow_svg) ──

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'bas_classica', 'Clássica', 'Rosto oval suave com iluminação de estúdio.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 0,
  'clássico', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'bas_angular', 'Angular', 'Maxilar marcado e traços firmes de protagonista.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 1,
  'clássico', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'bas_androide', 'Androide', 'Chassi sintético polido com pods auriculares de LED.', 'Chassi da série NEXUS-7, aposentado do laboratório com honras e segredos.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 2,
  'tecnologia', JSON_OBJECT('usaCores', '["pele","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'bas_holo', 'Holograma', 'Projeção volumétrica translúcida com varredura de luz.', 'Projeção volumétrica de uma consciência que escolheu ficar.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 3,
  'tecnologia', JSON_OBJECT('usaCores', '["pele","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'bas_redonda', 'Redonda', 'Bochechas cheias e simpatia imediata.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 4,
  'casual', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'bas_coracao', 'Coração', 'Testa ampla e queixo delicado — simetria de capa.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'clássico', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'bas_quadrada', 'Quadrada', 'Mandíbula reta de quem não pula o treino.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'esportivo', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'bas_longa', 'Alongada', 'Traços finos e elegância de editorial.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 7,
  'executivo', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'bas_marcada', 'Marcada', 'Uma cicatriz, mil histórias — nenhuma delas calma.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 8,
  'aventura', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'bas_sardas', 'Sardas', 'Constelação própria nas bochechas.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 9,
  'casual', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'bas_panda', 'Panda', 'Calmo por fora, deadline por dentro.', 'Mastiga bambu e backlog na mesma velocidade: devagar e sem errar.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 10,
  'animais', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'bas_coruja', 'Coruja', 'Vê tudo. Principalmente o que tentaram esconder no relatório.', 'Plantonista noturna oficial. Nenhum log passa despercebido.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 11,
  'animais', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'bas_raposa', 'Raposa', 'Esperta demais para reuniões que podiam ser e-mails.', 'Fechou três negociações antes de você abrir o CRM.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 12,
  'animais', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'bas_lobo', 'Lobo', 'Caça metas em matilha, mas fecha o trimestre sozinho se precisar.', 'O uivo dele é o sino de meta batida.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 13,
  'animais', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'bas_leao', 'Leão', 'A juba entra na sala antes dele.', 'Não disputa território: o território é dele desde o onboarding.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 14,
  'animais', JSON_OBJECT('usaCores', '["pele","cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='mitico'), 2,
  'bas_alien', 'Alienígena', 'Veio estudar a humanidade. Ficou pelo dashboard.', 'Classificou a Terra como "habitável, mas o wi-fi cai". Ficou mesmo assim.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 15,
  'sci-fi', JSON_OBJECT('usaCores', '["pele","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='exclusivo'), 2,
  'bas_ledbot', 'LED Bot', 'O mascote oficial da Dshow. Nasceu num painel de LED e nunca saiu do ar.', 'Primeiro pixel aceso da Dshow. Todo painel que brilha descende dele.',
  'parte2d', 'published', '2d', '2d',
  1, 1, 16,
  'dshow', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'cab_curto', 'Curto Social', 'Corte baixo e alinhado, pronto para a reunião.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 0,
  'executivo', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'cab_topete', 'Topete', 'Volume para cima com atitude clássica.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 1,
  'clássico', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'cab_franja', 'Franja Repicada', 'Mechas caindo sobre a testa em camadas.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 2,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'cab_ondulado', 'Ondulado', 'Ondas volumosas emoldurando o rosto.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 3,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'cab_coque', 'Coque Samurai', 'Preso no alto, disciplina e estilo.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 4,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'cab_cacheado', 'Cacheado Power', 'Coroa de cachos com presença e volume.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'cab_longo', 'Longo Lendário', 'Cabelo longo escorrendo pelos ombros.', 'Dizem que cresceu um centímetro a cada meta batida. Ninguém ousou duvidar.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'clássico', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'cab_moicano', 'Moicano', 'Crista desafiadora de quem não segue manada.', 'Forjado numa madrugada de deploy sem rollback. Sobreviveu. A crista ficou.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 7,
  'punk', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'cab_cyber', 'Undercut Neon', 'Undercut futurista com trilhas de luz raspadas.', 'O undercut oficial da resistência digital. As trilhas raspadas brilham no escuro.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 8,
  'cyberpunk', JSON_OBJECT('usaCores', '["cabelo","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'cab_rabo', 'Rabo de Cavalo', 'Preso alto, pronto para resolver qualquer sprint.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 9,
  'esportivo', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'cab_lateral', 'Risca Lateral', 'Divisão milimétrica — pente e disciplina.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 10,
  'executivo', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'cab_buzz', 'Raspado', 'Máquina zero e foco total.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 11,
  'esportivo', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'cab_afro', 'Afro', 'Coroa cheia com volume de respeito.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 12,
  'clássico', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'cab_trancas', 'Tranças Box', 'Fileiras alinhadas e tranças com contas de luz.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 13,
  'urbano', JSON_OBJECT('usaCores', '["cabelo","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'cab_medio', 'Médio Despojado', 'Na altura do queixo, do jeito que acordou.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 14,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'cab_franja_longa', 'Longo com Franja', 'Cortina lisa até os ombros com franja reta.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 15,
  'clássico', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'cab_meio_coque', 'Meio Coque', 'Metade presa, metade solta — equilíbrio perfeito.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 16,
  'urbano', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'cab_ondas_curtas', 'Ondas Curtas', 'Textura viva sem esforço nenhum.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 17,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'cab_picos_neon', 'Picos Neon', 'Espetado com pontas mergulhadas em luz.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 18,
  'cyberpunk', JSON_OBJECT('usaCores', '["cabelo","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'cab_pixie', 'Pixie', 'Curto, prático e cheio de atitude.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 19,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'cab_repicado_longo', 'Repicado Longo', 'Camadas em movimento até os ombros.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 20,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'cab_dreads', 'Dreads', 'Cordas grossas com peso e presença.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 21,
  'urbano', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'cab_mullet', 'Mullet', 'Negócios na frente, festa atrás. Sempre foi assim.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 22,
  'retrô', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'cab_pompadour', 'Pompadour', 'Volume esculpido com gel e convicção.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 23,
  'retrô', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'cab_chanel', 'Chanel', 'Corte reto no queixo — geometria impecável.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 24,
  'executivo', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'cab_coques_duplos', 'Coques Duplos', 'Simetria espacial: dois módulos de personalidade.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 25,
  'urbano', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'cab_grisalho', 'Grisalho Sábio', 'Cada fio prata é um incidente resolvido.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 26,
  'clássico', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'cab_emo', 'Franja Emo', 'Um olho coberto, o outro julgando o backlog.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 27,
  'retrô', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'cab_lambido', 'Liso Lambido', 'Pente fino, gel firme, reunião às 8.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 28,
  'executivo', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'cab_cachos_soltos', 'Cachos Soltos', 'Molas naturais em queda livre controlada.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 29,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'cab_viking', 'Trança Viking', 'Laterais raspadas e uma trança que já viu batalhas.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 30,
  'aventura', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'cab_holo_gradiente', 'Holo Gradiente', 'As pontas dissolvem em luz de destaque.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 31,
  'cyberpunk', JSON_OBJECT('usaCores', '["cabelo","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='cabelo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'cab_tigela', 'Corte Tigela', 'A tigela foi calibrada em laboratório. Confie.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 32,
  'retrô', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'olh_padrao', 'Confiante', 'Olhar direto e tranquilo.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 0,
  'clássico', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'olh_focado', 'Focado', 'Sobrancelhas firmes: modo competitivo ligado.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 1,
  'gamer', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'olh_feliz', 'Alegre', 'Olhos fechados de quem bateu a meta.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 2,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'olh_serio', 'Analítico', 'Meio-olhar de quem está auditando seus números.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 3,
  'executivo', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'olh_brilho', 'Estelar', 'Pupilas em estrela — encantado com o resultado.', 'Quem viu o dashboard todo verde pela primeira vez nunca mais olhou igual.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 4,
  'fantasia', JSON_OBJECT('usaCores', '["cabelo","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'olh_led', 'LED Sintético', 'Óptica de androide com brilho constante.', 'Óptica sintética calibrada em 60fps. Não pisca — renderiza.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', FALSE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'olh_brincalhao', 'Piscadela', 'Um olho no gráfico, outro na sexta-feira.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'olh_cansado', 'Pós-Deploy', 'Sobreviveu à virada. As olheiras contam a história.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 7,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'olh_misterioso', 'Misterioso', 'Ninguém sabe o que ele planeja. Nem o roadmap.', 'Os olhos brilham no escuro da sala de reunião. Ninguém pergunta por quê.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 8,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='mitico'), 2,
  'olh_vilao', 'Vilão', 'Todo herói de meta precisa de um rival à altura.', 'Vermelho não é raiva. É foco em modo absoluto.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 9,
  'fantasia', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'olh_visor', 'Visor Tático', 'Faixa de visor translúcida com HUD de combate.', 'HUD tático de quem enxerga o funil inteiro antes do lead piscar.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 10,
  'cyberpunk', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', FALSE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'olh_sonolento', 'Sonolento', 'Café ainda não fez efeito.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 11,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'olh_desconfiado', 'Desconfiado', 'Uma sobrancelha no alto: "tem certeza desse número?"', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 12,
  'executivo', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'olh_apaixonado', 'Apaixonado', 'Quando o resultado do mês chega verde.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 13,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'olh_cifrao', 'Cifrão', 'ROI detectado. Pupilas em modo faturamento.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 14,
  'executivo', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'olh_estrela', 'Estrelado', 'Viu o lançamento e virou fã na hora.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 15,
  'gamer', JSON_OBJECT('usaCores', '["cabelo","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'olh_arregalado', 'Arregalado', 'Plot twist na daily.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 16,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'olh_emocionado', 'Emocionado', 'Lágrima de alegria — bateu a meta do trimestre.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 17,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'olh_pixel', 'Pixel Retro', 'Óptica 8-bit direto do fliperama.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 18,
  'gamer', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', FALSE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'olh_gentil', 'Gentil', 'O code review mais educado da empresa.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 19,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'olh_furia', 'Fúria', 'Alguém deu force push na main.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 20,
  'fantasia', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'olh_hipnotico', 'Hipnótico', 'Você já concordou com a proposta. Só não sabe ainda.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 21,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', FALSE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'olh_scanner', 'Scanner', 'Linha única varrendo o ambiente por métricas fracas.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 22,
  'sci-fi', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', FALSE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'olh_gatinho', 'Delineado Gatinho', 'O traço que corta qualquer reunião ao meio.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 23,
  'clássico', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'olh_heterocromia', 'Heterocromia', 'Um olho natural, um olho na cor da sua energia.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 24,
  'fantasia', JSON_OBJECT('usaCores', '["cabelo","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'olh_zen', 'Zen', 'Inbox zero por dentro e por fora.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 25,
  'casual', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'olh_na_mira', 'Na Mira', 'Meta adquirida. Distância: um trimestre.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 26,
  'gamer', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', FALSE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'olh_anime', 'Brilho de Anime', 'Reflexos gigantes de protagonista no episódio final.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 27,
  'fantasia', JSON_OBJECT('usaCores', '["cabelo","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'olh_calculista', 'Calculista', 'Dá para ver as planilhas refletidas na íris.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 28,
  'executivo', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'olh_prisma', 'Prisma', 'A íris decidiu ser todas as cores ao mesmo tempo.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 29,
  'fantasia', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='olhos'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='mitico'), 2,
  'olh_vazio', 'Void', 'Olhou para o abismo do legado. O abismo pediu refactor.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 30,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', FALSE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'boc_sorriso', 'Sorriso', 'Sorriso leve e seguro.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 0,
  'clássico', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'boc_neutra', 'Neutra', 'Expressão serena de poker face.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 1,
  'executivo', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'boc_larga', 'Gargalhada', 'Sorriso aberto com dentes — vitória garantida.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 2,
  'casual', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'boc_lado', 'Sorriso de Canto', 'Meio sorriso de quem sabe o que está fazendo.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 3,
  'gamer', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'boc_determinada', 'Determinada', 'Lábios firmes antes da jogada decisiva.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 4,
  'executivo', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'boc_surpresa', 'Surpresa', 'Quando o CTR dobra sem ninguém mexer em nada.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'casual', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'boc_lingua', 'Deboche', 'Resposta oficial para "isso não vai funcionar".', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'casual', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'boc_bigode', 'Bigode de Respeito', 'Aprovado em todas as reuniões desde 1974.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 7,
  'clássico', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'boc_vilao', 'Sorriso de Vilão', 'O plano está em movimento. Há semanas.', 'Sorriu assim uma vez. O concorrente mudou de nicho.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 8,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'boc_grade', 'Grade Sintética', 'Alto-falante de androide com filete de luz.', 'O alto-falante original do primeiro LED Bot da Dshow. Ainda ecoa.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 9,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'boc_assobio', 'Assobiando', 'Disfarçando depois de dar deploy na sexta.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 10,
  'casual', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'boc_travessa', 'Sorriso Travesso', 'Serrinha de quem já sabe o final da história.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 11,
  'gamer', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'boc_mascara', 'Máscara Ninja', 'Metade do rosto em segredo, cem por cento presença.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 12,
  'aventura', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'boc_palito', 'Palito', 'Mastigando o palito enquanto o build compila.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 13,
  'urbano', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'boc_chiclete', 'Chiclete', 'Bola de chiclete no limite da física.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 14,
  'urbano', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'boc_barba', 'Barba Cheia', 'Barba fechada com sorriso de mentor.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 15,
  'clássico', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'boc_cavanhaque', 'Cavanhaque', 'Moldura fina para decisões afiadas.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 16,
  'clássico', JSON_OBJECT('usaCores', '["cabelo"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'boc_uau', 'Uau', 'O "o" involuntário da demo perfeita.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 17,
  'casual', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'boc_beijo', 'Beijinho', 'Beijo no ar para a meta batida.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 18,
  'casual', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'boc_dente_ouro', 'Sorriso de Ouro', 'Um brilho de 24 quilates no canto do sorriso.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 19,
  'urbano', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'boc_presas', 'Presas', 'Só sai depois do pôr do sol. Home office noturno.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 20,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'boc_franzida', 'Franzida', 'O gráfico caiu 2% e a boca acompanhou.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 21,
  'executivo', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'boc_apito', 'Apito de Coach', 'Fim do intervalo — segundo tempo do trimestre.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 22,
  'esportivo', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'boc_riso_nervoso', 'Riso Nervoso', '"Claro que cabe na sprint" — e o riso saiu torto.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 23,
  'casual', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'boc_batom', 'Batom Marcante', 'A assinatura em qualquer sala — na cor da sua energia.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 24,
  'clássico', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'boc_pirulito', 'Pirulito', 'Energia rápida para o code review longo.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 25,
  'casual', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'boc_bocejo', 'Bocejo', 'A daily das 8h30 cobra seu preço.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 26,
  'casual', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'boc_gato', 'Sorriso de Gato', ':3 — aprovado sem ressalvas.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 27,
  'casual', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'boc_onda_sonora', 'Onda Sonora', 'Fala em formas de onda. Volume sempre no máximo.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 28,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='boca'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'boc_heroica', 'Queixo Heroico', 'Sorriso firme e covinha de pôster de recrutamento.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 29,
  'aventura', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'rou_camiseta', 'Camiseta', 'Básica de algodão, conforto absoluto.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 0,
  'casual', JSON_OBJECT('usaCores', '["roupa"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'rou_regata', 'Regata Treino', 'Para o dia de treino... de digitação intensa.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 1,
  'casual', JSON_OBJECT('usaCores', '["roupa","pele"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'rou_social', 'Camisa Social', 'Colarinho impecável para fechar contratos.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 2,
  'executivo', JSON_OBJECT('usaCores', '["roupa"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'rou_hoodie', 'Hoodie Dev', 'Capuz nas costas e cordões — uniforme de quem builda.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 3,
  'gamer', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'rou_jaqueta', 'Jaqueta Racer', 'Jaqueta esportiva com listras de velocidade.', 'Costurada para quem cruza a linha de chegada antes do relatório carregar.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 4,
  'esporte', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'rou_gamer', 'Jersey Pro Player', 'Camisa oficial de time com raio no peito.', 'Jersey da primeira line-up campeã. O raio no peito não é enfeite — é aviso.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'gamer', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'rou_terno', 'Terno Executivo', 'Alfaiataria completa com gravata — nível diretoria.', 'Alfaiataria de guerra corporativa. Cada costura fechou um contrato.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'executivo', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'rou_kimono', 'Kimono do Dojo', 'Disciplina de samurai, prazo de sprint.', 'Costurado por um mestre que só aceitava pagamento em disciplina.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 7,
  'oriental', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'rou_astronauta', 'Traje Orbital', 'Homologado para vácuo, reuniões e segundas-feiras.', 'Voltou da órbita com um adesivo: "meu outro veículo é um dashboard".',
  'parte2d', 'published', '2d', '2d',
  0, 1, 8,
  'espaço', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='exclusivo'), 2,
  'rou_moletom_dshow', 'Moletom Dshow', 'O uniforme não oficial de quem constrói o dash.', 'Distribuído no primeiro all-hands. Quem tem, não lava — preserva.',
  'parte2d', 'published', '2d', '2d',
  1, 1, 9,
  'dshow', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'rou_armadura', 'Armadura Nexus', 'Peitoral blindado com núcleo de energia pulsante.', 'Peitoral NEXUS com núcleo de energia própria. Bate no ritmo do usuário.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 10,
  'sci-fi', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'rou_polo', 'Polo', 'Gola firme, sexta casual garantida.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 11,
  'casual', JSON_OBJECT('usaCores', '["roupa"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'rou_flanela', 'Flanela Xadrez', 'Xadrez de quem commita ouvindo lo-fi.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 12,
  'casual', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'rou_colete', 'Colete Tático', 'Bolsos para tudo — até para o carregador extra.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 13,
  'aventura', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'rou_smoking', 'Smoking', 'Cetim na lapela e a noite inteira pela frente.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 14,
  'executivo', JSON_OBJECT('usaCores', '["roupa"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'rou_jersey', 'Jersey E-sports', 'O uniforme oficial do time Dshow Nexus.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 15,
  'gamer', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'rou_sobretudo', 'Sobretudo', 'Entra na sala e o vento entra junto.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 16,
  'aventura', JSON_OBJECT('usaCores', '["roupa"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'rou_jaleco', 'Jaleco', 'Ciência aplicada com bolso cheio de canetas.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 17,
  'ciência', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'rou_neon_racer', 'Jaqueta Neon Racer', 'Costura de luz viva — homologada para a madrugada.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 18,
  'cyberpunk', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'ace_brinco', 'Brinco de Argola', 'Detalhe dourado discreto na orelha.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 0,
  'casual', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', 'rosto'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'ace_oculos', 'Óculos de Grau', 'Armação redonda de intelectual.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 1,
  'executivo', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', 'rosto'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'ace_oculos_sol', 'Óculos Escuros', 'Deal fechado, sol na cara, estilo intacto.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 2,
  'casual', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'rosto'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'ace_fone', 'Fone Minimal', 'Headband slim para a playlist de foco.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 3,
  'casual', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ace_bone', 'Boné Snapback', 'Aba reta com logo bordado.', 'Aba reta, ego alinhado. Edição de estreia da collab que nunca foi anunciada.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 4,
  'casual', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'ace_headset', 'Headset Pro Gamer', 'Conchas RGB com microfone articulado.', 'As conchas que ouviram o "GG" da grande final. O RGB nunca apagou.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'gamer', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'ace_cachecol', 'Cachecol', 'Friozinho de ar-condicionado corporativo.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'casual', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'pescoco'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'ace_chapeu_mago', 'Chapéu de Arquimago', 'Conjura dashboards do nada. Nível 20 em SQL arcano.', 'Sussurra queries otimizadas para quem o veste. Às vezes em latim.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 7,
  'fantasia', JSON_OBJECT('usaCores', '["roupa","destaque"]',
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ace_drone', 'Drone Companion', 'Segue você desde o unboxing. Nunca pediu férias.', 'Firmware v0.1 até hoje. Recusa updates: "estou funcionando, não encosta".',
  'parte2d', 'published', '2d', '2d',
  0, 1, 8,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'pescoco'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'ace_medalha', 'Medalha de Veterano', '30 dias de casa, cravados em bronze e fita.', 'Trinta dias. Parece pouco até você contar as segundas-feiras.',
  'parte2d', 'published', '2d', '2d',
  0, 0, 9,
  'conquista', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'pescoco'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ace_gorro_natal', 'Gorro de Natal', 'Dezembro no dash também tem clima.', 'Dezembro oficial da Dshow: meta fechada, gorro na cabeça.',
  'parte2d', 'published', '2d', '2d',
  0, 0, 10,
  'evento', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ace_chapeu_bruxa', 'Chapéu de Bruxa', 'Halloween chegou ao dashboard. Cuidado com as queries.', 'Dizem que quem o veste em outubro faz as queries voarem.',
  'parte2d', 'published', '2d', '2d',
  0, 0, 11,
  'evento', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'ace_coroa', 'Coroa do Top 1', 'Ouro maciço para quem lidera o ranking.', 'Só encosta na cabeça de quem já foi Top 1. Ela sabe. Sempre soube.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 12,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'ace_boina', 'Boina', 'Direção de arte no ponto exato.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 13,
  'clássico', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'ace_viseira_vr', 'Headset VR', 'Metade aqui, metade no metaverso da Dshow.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 14,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'ace_chifres_oni', 'Chifres de Oni', 'O lado lendário do dojo desperta.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 15,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ace_tiara_led', 'Tiara LED', 'Arco de luz fria sobre o cabelo.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 16,
  'cyberpunk', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ace_monoculo', 'Monóculo', 'Analisa o relatório com um só olho — e razão.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 17,
  'clássico', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', 'rosto'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'ace_pintura_guerra', 'Pintura de Guerra', 'Três riscos: foco, meta e vitória.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 18,
  'esportivo', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'rosto'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'ace_piercing', 'Piercing', 'Detalhe de aço na sobrancelha.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 19,
  'urbano', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', 'rosto'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ace_oculos_3d', 'Óculos Retrô 3D', 'O cinema em casa de 1989 aprova.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 20,
  'gamer', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', 'rosto'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ace_corrente', 'Corrente Dourada', 'Elo por elo, cada meta batida.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 21,
  'urbano', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', 'pescoco'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'ace_capa_heroica', 'Capa Heroica', 'Esvoaça mesmo sem vento — questão de atitude.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 0, 22,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'pescoco'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'ace_lenco_bandana', 'Lenço Bandana', 'Nó frouxo, espírito de estrada.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 23,
  'aventura', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'pescoco'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='exclusivo'), 2,
  'ace_cracha_dshow', 'Crachá Dshow', 'Acesso liberado a todos os andares da casa.', NULL,
  'parte2d', 'published', '2d', '2d',
  1, 1, 24,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'pescoco'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'ace_antena', 'Antena Retrô', 'Sintonia fina com frequências que ninguém mais ouve.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 25,
  'sci-fi', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ace_tapa_olho', 'Tapa-olho', 'Perdeu a aposta do sprint. Ganhou personalidade.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 26,
  'aventura', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', 'rosto'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ace_colar_perolas', 'Colar de Pérolas', 'Clássico absoluto — combina até com moletom.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 27,
  'clássico', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', 'pescoco'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'ace_mochila_jato', 'Mochila a Jato', 'Para reuniões em prédios diferentes com 5 min de intervalo.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 28,
  'sci-fi', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', 'pescoco'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='acessorio'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'ace_aureola', 'Auréola', 'Zero bugs em produção este mês. Santidade comprovada.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 29,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', 'cabeca'), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'fun_estudio', 'Estúdio', 'Gradiente suave de estúdio, tingido pela cor de destaque.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 0,
  'clássico', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'fun_estrelas', 'Campo Estelar', 'Noite profunda com estrelas cintilantes.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 1,
  'espaço', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'fun_grade', 'Synthwave', 'Sol retrô sobre a grade infinita dos anos 80.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 2,
  'retrô', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'fun_hex', 'Colmeia Tech', 'Malha hexagonal de engenharia com pulsos de luz.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 3,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'fun_circuito', 'Placa-Mãe', 'Trilhas de circuito energizadas percorrendo o quadro.', 'Um recorte da placa-mãe do servidor original, energizada até hoje.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 4,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'fun_nebulosa', 'Nebulosa', 'Nuvens cósmicas coloridas com poeira estelar.', 'Poeira de estrela recolhida no exato instante em que uma ideia nasceu.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'espaço', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'fun_aurora', 'Aurora Boreal', 'Cortinas de luz dançando no céu polar.', 'O céu polar que apareceu uma única noite sobre o data center.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'natureza', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'fun_led_wall', 'LED Wall Dshow', 'O painel de LED da casa, vivo atrás de você.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 7,
  'dshow', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'fun_lab', 'Laboratório de IA', 'Racks, vidro e o zumbido de mil inferências por segundo.', 'Aqui nasceram os modelos que ninguém teve coragem de desligar.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 8,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'fun_dojo', 'Dojo ao Entardecer', 'Shoji, montanhas e o silêncio antes do treino.', 'O sensei só disse uma coisa: "meça duas vezes, publique uma".',
  'parte2d', 'published', '2d', '2d',
  0, 1, 9,
  'oriental', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'fun_arena', 'Arena E-Sports', 'Holofotes e telões de uma grande final.', 'A arena lotada no ponto exato do último round. O grito ficou preso aqui.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 10,
  'gamer', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'fun_synthwave', 'Pôr do Sol Synthwave', 'O sol riscado que nunca termina de se pôr.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 11,
  'espaço', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'fun_biblioteca', 'Biblioteca', 'Estantes altas e silêncio produtivo.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 12,
  'clássico', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'fun_chuva', 'Noite Chuvosa', 'Vidro molhado e a cidade desfocada lá fora.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 13,
  'urbano', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'fun_praia', 'Praia Pixel', 'Férias em 16 bits — protetor solar incluso.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 14,
  'casual', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'fun_montanhas', 'Montanhas', 'Ar puro e sinal de wi-fi surpreendentemente bom.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 15,
  'aventura', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'fun_escritorio', 'Escritório Noturno', 'A cidade acesa atrás da última entrega do dia.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 16,
  'executivo', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'fun_codigo', 'Cascata de Código', 'As colunas verdes que explicam tudo.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 17,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'fun_forja', 'Forja Vulcânica', 'Onde os itens lendários são temperados.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 18,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='fundo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'fun_hangar', 'Hangar Nexus', 'A baia de lançamento da frota Dshow.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 19,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'mol_aro', 'Aro Clean', 'Contorno fino e elegante.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 0,
  'clássico', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'mol_duplo', 'Aro Duplo', 'Linha dupla com respiro interno.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 1,
  'clássico', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'mol_tech', 'Cantos Táticos', 'Suportes de HUD nos quatro cantos.', 'Suportes de HUD arrancados de um cockpit de simulação militar.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 2,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'mol_neon', 'Neon Pulsante', 'Tubo de neon vivo respirando luz.', 'Tubo de neon soprado por um artesão de arcade em 1989. Ainda pulsa.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 3,
  'cyberpunk', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'mol_ouro', 'Ouro Imperial', 'Moldura lendária cravejada de gemas.', 'Fundida com o ouro das metas impossíveis. As gemas são as exceções.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 4,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'mol_rgb', 'LED RGB', 'O aro gamer clássico — todas as cores, o tempo todo.', 'Se não tem RGB, nem é setup. Lei universal.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'gamer', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='mitico'), 2,
  'mol_cristal', 'Cristal Mítico', 'Lascas de gelo eterno cravadas no quadro.', 'Congelou no exato instante de um recorde. Nunca mais derreteu.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'mol_pioneiro', 'Pioneiro', 'A moldura de quem criou a própria identidade primeiro.', 'Forjada para quem chegou primeiro. O relógio no topo marca aquele exato momento.',
  'parte2d', 'published', '2d', '2d',
  0, 0, 7,
  'conquista', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='exclusivo'), 2,
  'mol_dshow', 'Exclusiva Dshow', 'Moldura assinada da casa — edição exclusiva.', 'A assinatura da casa. Não se compra, não se pede — se reconhece.',
  'parte2d', 'published', '2d', '2d',
  1, 1, 8,
  'dshow', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'mol_madeira', 'Madeira de Lei', 'Clássica, quente e impossível de sair de moda.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 9,
  'clássico', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'mol_selo', 'Selo Oficial', 'Carimbo de autenticidade no canto do quadro.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 10,
  'executivo', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'mol_louros', 'Louros da Vitória', 'Folhas de quem subiu no pódio e pretende voltar.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 11,
  'esportivo', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'mol_circuito', 'Circuito Vivo', 'Trilhas energizadas percorrendo o contorno.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 12,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'mol_chamas', 'Chamas Eternas', 'O contorno queima — o conteúdo ainda mais.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 13,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='mitico'), 2,
  'mol_glitch', 'Glitch Dimensional', 'O quadro não decide em qual realidade ficar.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 0, 14,
  'cyberpunk', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'mol_minimal', 'Fio Minimal', 'Um traço fino. Nada mais é necessário.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 15,
  'clássico', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'mol_pontilhada', 'Pontilhada', 'Recorte aqui — mas só se for para emoldurar.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 16,
  'casual', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'mol_degrade', 'Degradê Duplo', 'Duas cores escorrendo pelo contorno.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 17,
  'casual', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'mol_colmeia', 'Colmeia', 'Hexágonos disciplinados guardando os cantos.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 18,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'mol_vetores', 'Vetores', 'Setas de alinhamento apontando para quem importa.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 19,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'mol_geada', 'Geada', 'Cristais de gelo avançando pelas bordas.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 20,
  'clima', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'mol_espinhos', 'Espinhos', 'Bela por fora, intransponível por definição.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 21,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'mol_serpente', 'Serpente de Luz', 'Duas serpentes luminosas se perseguindo para sempre.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 22,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='moldura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'mol_constelacao', 'Constelação', 'Estrelas ligadas em volta — o mapa aponta para você.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 23,
  'espaço', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'efe_aura', 'Aura de Poder', 'Halo de energia irradiando atrás do personagem.', 'Vaza energia de quem carrega o trimestre nas costas. Contenha-se.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 0,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'efe_chuva', 'Chuva Digital', 'Colunas de código escorrendo atrás de você.', 'Fragmento do código-fonte primordial. Se você lê os símbolos, já é tarde.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 1,
  'cyberpunk', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'efe_scanlines', 'Scanlines CRT', 'Textura de monitor retrô sobre a cena.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 2,
  'retrô', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'efe_particulas', 'Partículas Flutuantes', 'Pontos de luz subindo lentamente pelas bordas.', 'Cada ponto de luz é uma tarefa concluída flutuando em paz.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 3,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'efe_portal', 'Portal Dimensional', 'Anéis giratórios de outra dimensão atrás de você.', 'Ninguém sabe para onde leva. Ele volta sempre com resultados.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 4,
  'sci-fi', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'efe_raio', 'Tempestade Elétrica', 'Relâmpagos estalando ao redor — cuidado ao apertar a mão.', 'A energia estática de quem carrega três sprints no corpo.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'efe_glitch', 'Glitch', 'A realidade desincroniza por um instante. Você não.', 'Um erro de renderização? Não. Um aviso.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'cyberpunk', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='mitico'), 2,
  'efe_fogo', 'Chamas Vivas', 'O fogo de quem carrega a meta do time inteiro.', 'Arde desde o primeiro trimestre. Nunca precisou de gatilho.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 7,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'efe_confete', 'Confete Eterno', 'A festa do Colecionador nunca termina.', 'Caiu na primeira comemoração e nunca parou. Ninguém varre. Ninguém quer.',
  'parte2d', 'published', '2d', '2d',
  0, 0, 8,
  'conquista', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'efe_faiscas', 'Faíscas Lendárias', 'Cintilações douradas em cruz — brilho de troféu.', 'Resíduo de troféu recém-polido. Gruda em quem vence com estilo.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 9,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'efe_neve', 'Nevasca', 'Flocos caindo devagar — inverno particular.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 10,
  'clima', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'efe_folhas', 'Folhas ao Vento', 'Outono constante, prazos também.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 11,
  'natureza', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'efe_borboletas', 'Borboletas', 'Um jardim decidiu te acompanhar.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 12,
  'natureza', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'efe_tempestade', 'Tempestade', 'Relâmpagos cortando o céu atrás de você.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 13,
  'clima', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'efe_bolhas', 'Bolhas', 'Leveza subindo em câmera lenta.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 14,
  'casual', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'efe_sakura', 'Pétalas de Sakura', 'O dojo floresce na sua passagem.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 15,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'efe_moedas', 'Chuva de Moedas', 'O trimestre fechou verde — e transbordou.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 0, 16,
  'executivo', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='mitico'), 2,
  'efe_holo_interf', 'Interferência Holo', 'O sinal falha — a lenda, nunca.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 17,
  'cyberpunk', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'efe_vagalumes', 'Vagalumes', 'Pequenas luzes vagando na penumbra ao seu redor.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 18,
  'natureza', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'efe_veu_aurora', 'Véu de Aurora', 'Cortinas polares ondulando atrás de você.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 19,
  'clima', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'efe_poeira', 'Poeira Estelar', 'Grãos de luz à deriva, sem pressa nenhuma.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 20,
  'espaço', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'efe_descarga', 'Descarga de Energia', 'Arcos elétricos serpenteando pelas bordas do quadro.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 21,
  'sci-fi', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'efe_nevoa', 'Névoa Baixa', 'Um tapete de névoa rolando aos seus pés.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 22,
  'clima', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='efeito'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'efe_metricas', 'Métricas Subindo', 'Setas verdes decolando — o dashboard aprova.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 23,
  'executivo', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'aur_neon', 'Aura Neon', 'Dois anéis de neon respirando em volta de você.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 0,
  'cyberpunk', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'aur_plasma', 'Aura de Plasma', 'Camadas de plasma pulsando em ondas concêntricas.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 1,
  'sci-fi', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'aur_eletrica', 'Aura Elétrica', 'Arcos de eletricidade estalando no contorno.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 2,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'aur_cristal', 'Aura de Cristal', 'Lascas cristalinas orbitando em silêncio absoluto.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 3,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='exclusivo'), 2,
  'aur_dshow', 'Aura LED Dshow', 'O anel LED oficial da casa — segmentos varrendo a órbita.', NULL,
  'parte2d', 'published', '2d', '2d',
  1, 1, 4,
  'dshow', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'aur_orbital', 'Anel Orbital', 'Um anel fino e constante, como um satélite fiel.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'espaço', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'aur_gelo', 'Aura Glacial', 'Névoa fria e cristais suspensos — calma absoluta.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='mitico'), 2,
  'aur_fenix', 'Aura de Fênix', 'Labaredas orbitando devagar — renasce a cada trimestre.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 7,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'aur_solar', 'Aura Solar', 'Raios dourados girando devagar, como um amanhecer fiel.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 8,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'aur_sombria', 'Aura Sombria', 'A penumbra que chega junto — e sai por último.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 9,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'aur_runica', 'Aura Rúnica', 'Glifos antigos orbitando em vigília silenciosa.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 10,
  'fantasia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'aur_prisma', 'Aura Prisma', 'Todo o espectro concorda com você.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 11,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'aur_vento', 'Aura de Vento', 'Correntes de ar desenhando espirais ao redor.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 12,
  'natureza', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'aur_estelar', 'Aura Estelar', 'Uma constelação pessoal cintilando em círculo.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 13,
  'espaço', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='aura'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'aur_toxica', 'Aura Tóxica', 'Vapor esverdeado — cuidado ao se aproximar do ranking.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 14,
  'sci-fi', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ban_executivo', 'Estandarte Executivo', 'Painel sóbrio com friso dourado — sala de reunião vitalícia.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 0,
  'executivo', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'ban_cyber', 'Estandarte Cyber', 'Trilhas de circuito acesas descendo o painel.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 1,
  'cyberpunk', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'ban_galaxy', 'Estandarte Galáxia', 'Um pedaço do espaço profundo pendurado às suas costas.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 2,
  'espaço', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ban_arena', 'Flâmula da Arena', 'A bandeira de quem entra para vencer o campeonato.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 3,
  'gamer', JSON_OBJECT('usaCores', '["destaque","roupa"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='exclusivo'), 2,
  'ban_dshow', 'Painel LED Dshow', 'O telão da casa, aceso só para o seu personagem.', NULL,
  'parte2d', 'published', '2d', '2d',
  1, 1, 4,
  'dshow', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ban_dojo', 'Estandarte do Dojo', 'Seda vermelha e o círculo do treino diário.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'oriental', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'ban_lab', 'Quadro do Laboratório', 'Fórmulas de quem testa antes de afirmar.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'ban_real', 'Estandarte Real', 'Púrpura, ouro e a certeza de quem lidera o ranking.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 7,
  'fantasia', JSON_OBJECT('usaCores', '[]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ban_campeao', 'Estandarte Campeão', 'Listras de pódio e o troféu do último split.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 8,
  'esportivo', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'ban_corsario', 'Estandarte Corsário', 'Bandeira de quem navega fora da rota — e chega primeiro.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 9,
  'aventura', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'ban_guardiao', 'Estandarte Guardião', 'A árvore antiga que protege quem constrói.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 10,
  'natureza', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'ban_imperial', 'Estandarte Imperial', 'Púrpura, ouro e a coroa de quem assina o império.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 11,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'ban_neon_tokyo', 'Estandarte Neon', 'Letreiro vertical aceso na rua molhada.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 12,
  'cyberpunk', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'ban_forjado', 'Estandarte da Forja', 'Martelo, bigorna e brasas que não apagam.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 13,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='banner'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'ban_pixel', 'Estandarte Pixel', 'Herança de 8 bits pendurada com orgulho.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 14,
  'gamer', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='exclusivo'), 2,
  'emb_dshow', 'Emblema Dshow', 'O pixel fundador, preso ao peito de quem é da casa.', NULL,
  'parte2d', 'published', '2d', '2d',
  1, 1, 0,
  'dshow', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'emb_nexus', 'Selo Nexus', 'O hexágono da rede — todos os nós respondem a você.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 1,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'emb_elite', 'Estrela Elite', 'Cinco pontas. Zero sorte. Só resultado.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 2,
  'executivo', JSON_OBJECT('usaCores', '[]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'emb_cyber', 'Divisa Cyber', 'Duas divisas aceleradas — patente das vielas de neon.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 3,
  'cyberpunk', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'emb_diamond', 'Broche Diamond', 'Lapidado sob pressão, como todo trimestre fechado.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 4,
  'executivo', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'emb_raio', 'Pino Relâmpago', 'Energia de sobra para o sprint que vier.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'gamer', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'emb_alvo', 'Alvo Certeiro', 'Três círculos. Um destino: o centro.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'executivo', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'emb_coroa', 'Coroa de Bolso', 'Realeza discreta, presa à lapela.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 7,
  'fantasia', JSON_OBJECT('usaCores', '[]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'emb_foguete', 'Foguete', 'Lançamento confirmado — sem janela de rollback.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 8,
  'espaço', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'emb_escudo', 'Escudo', 'Defesa em primeiro lugar — o resto é contra-ataque.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 9,
  'aventura', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'emb_coracao_pixel', 'Coração Pixel', 'HP cheio para o boss da sexta-feira.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 10,
  'gamer', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'emb_infinito', 'Infinito', 'Escala sem teto, roadmap sem fim.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 11,
  'tecnologia', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'emb_engrenagem', 'Engrenagem', 'A peça que faz o resto girar.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 12,
  'tecnologia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'emb_fenix', 'Fênix', 'Caiu em produção, renasceu no hotfix.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 0, 13,
  'fantasia', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'emb_trofeu', 'Trofeuzinho', 'A taça do último campeonato interno.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 14,
  'esportivo', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'emb_cafe', 'Xícara Eterna', 'O combustível oficial do quarto deploy do dia.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 15,
  'casual', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'emb_grafico', 'Curva de Alta', 'A única direção aceitável: para cima e para a direita.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 16,
  'executivo', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'emb_lua', 'Quarto Crescente', 'Time da madrugada, com orgulho e café.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 17,
  'espaço', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'emb_dado', 'D20 da Sorte', 'Rolou 20 natural na daily. Crítico de produtividade.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 18,
  'gamer', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='emblema'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'emb_chave', 'Chave-Mestra', 'Abre qualquer porta — inclusive a da sala de reunião.', NULL,
  'parte2d', 'published', '2d', '2d',
  0, 1, 19,
  'aventura', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE,
    'slot', NULL), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), metadata = VALUES(metadata), updated_at = NOW();


-- ── Assets 3D da PoC (GLB Meshopt — licenças CC0 rastreadas) ──

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, fallback_strategy,
   is_randomizable, sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='cc0_quaternius'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1,
  'glb_humano_casual', 'Ultimate Modular Men Pack (fev/2022)', 'Base 3D retrabalhada (Quaternius)',
  'glb', 'published', '3d', '3d', 'render_derivado', 1, 0, 'poc,3d',
  JSON_OBJECT('arquivo', '/assets/avatars/3d/humano_casual.glb', 'alturaAlvo', 1.8,
    'prefixo', 'Casual', 'anims', '{"idle":"Idle_Neutral","acenar":"Wave","poder":"Punch_Right","extra":"Roll"}',
    'slots', '{"pele":["Skin"],"cabelo":["Hair","Eyebrows"],"roupa":["Purple"],"detalhe":["White","LightBlue"]}', 'fonte', 'https://quaternius.com/packs/ultimatemodularcharacters.html'),
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, fallback_strategy,
   is_randomizable, sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='cc0_quaternius'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1,
  'glb_humano_terno', 'Ultimate Modular Men Pack (fev/2022)', 'Base 3D retrabalhada (Quaternius)',
  'glb', 'published', '3d', '3d', 'render_derivado', 1, 0, 'poc,3d',
  JSON_OBJECT('arquivo', '/assets/avatars/3d/humano_terno.glb', 'alturaAlvo', 1.8,
    'prefixo', 'Suit', 'anims', '{"idle":"Idle_Neutral","acenar":"Wave","poder":"Punch_Right","extra":"Roll"}',
    'slots', '{"pele":["Skin"],"cabelo":["Hair","Eyebrows"],"roupa":["Suit"],"detalhe":["Tie","White"]}', 'fonte', 'https://quaternius.com/packs/ultimatemodularcharacters.html'),
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, fallback_strategy,
   is_randomizable, sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='cc0_quaternius'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1,
  'glb_humano_punk', 'Ultimate Modular Men Pack (fev/2022)', 'Base 3D retrabalhada (Quaternius)',
  'glb', 'published', '3d', '3d', 'render_derivado', 1, 0, 'poc,3d',
  JSON_OBJECT('arquivo', '/assets/avatars/3d/humano_punk.glb', 'alturaAlvo', 1.8,
    'prefixo', 'Punk', 'anims', '{"idle":"Idle_Neutral","acenar":"Wave","poder":"Punch_Right","extra":"Roll"}',
    'slots', '{"pele":["Skin"],"cabelo":["Red","Eyebrows"],"roupa":["Red_Dark","Black"],"detalhe":["White","LightBlue","Earrings"]}', 'fonte', 'https://quaternius.com/packs/ultimatemodularcharacters.html'),
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, fallback_strategy,
   is_randomizable, sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='roupa'), (SELECT id FROM avatar_libraries WHERE `key`='cc0_quaternius'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1,
  'glb_humano_aventureiro', 'Ultimate Modular Men Pack (fev/2022)', 'Base 3D retrabalhada (Quaternius)',
  'glb', 'published', '3d', '3d', 'render_derivado', 1, 0, 'poc,3d',
  JSON_OBJECT('arquivo', '/assets/avatars/3d/humano_aventureiro.glb', 'alturaAlvo', 1.8,
    'prefixo', 'Adventurer', 'anims', '{"idle":"Idle_Neutral","acenar":"Wave","poder":"Punch_Right","extra":"Roll"}',
    'slots', '{"pele":["Skin"],"cabelo":["Hair","Eyebrows"],"roupa":["Green","LightGreen"],"detalhe":["Grey","Gold","Brown2"]}', 'fonte', 'https://quaternius.com/packs/ultimatemodularcharacters.html'),
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, fallback_strategy,
   is_randomizable, sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='cc0_threejs'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1,
  'glb_androide', 'RobotExpressive (exemplos oficiais do Three.js)', 'Base 3D retrabalhada (Tomás Laulhé / Don McCurdy)',
  'glb', 'published', '3d', '3d', 'render_derivado', 1, 0, 'poc,3d',
  JSON_OBJECT('arquivo', '/assets/avatars/3d/androide.glb', 'alturaAlvo', 1.9,
    'prefixo', NULL, 'anims', '{"idle":"Idle","acenar":"Wave","poder":"Punch","extra":"Dance"}',
    'slots', '{"pele":[],"cabelo":[],"roupa":["Main"],"detalhe":["Grey"]}', 'fonte', 'https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive'),
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE metadata = VALUES(metadata), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, fallback_strategy,
   is_randomizable, sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='cc0_quaternius'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1,
  'glb_animal_pug', 'Pug — Ultimate Animated Character Pack', 'Base 3D retrabalhada (Quaternius)',
  'glb', 'published', '3d', '3d', 'render_derivado', 1, 0, 'poc,3d',
  JSON_OBJECT('arquivo', '/assets/avatars/3d/animal_pug.glb', 'alturaAlvo', 1.45,
    'prefixo', NULL, 'anims', '{"idle":"Idle","acenar":"Victory","poder":"Punch","extra":"Jump"}',
    'slots', '{"pele":["Skin"],"cabelo":[],"roupa":["Shirt","Belt"],"detalhe":["Details","Black"]}', 'fonte', 'https://quaternius.com/packs/ultimatedanimatedcharacter.html'),
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE metadata = VALUES(metadata), updated_at = NOW();


-- ── Títulos (Expansão §27) ──

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'tit_estrategista', 'Estrategista', 'Três jogadas à frente, sempre.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 0, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'tit_pro_player', 'Pro Player', 'O GG dele ecoa na arena até hoje.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 1, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'tit_elite_trader', 'Elite Trader', 'Compra no fundo. Vende no topo. Repete.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 2, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'tit_cyber_architect', 'Cyber Architect', 'Desenha sistemas que sonham em produção.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 3, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'tit_nexus_commander', 'Nexus Commander', 'Todos os nós da rede respondem ao seu comando.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 4, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'tit_mestre_da_luz', 'Mestre da Luz', 'Onde ele passa, o dashboard acende.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 5, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'tit_ceo_supremo', 'CEO Supremo', 'A última palavra em qualquer reunião.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 6, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='exclusivo'), 2,
  'tit_lenda_dshow', 'Lenda Dshow', 'O nome que a casa conta para os novatos.', 'titulo', 'published',
  '2d,3d', '2d', 1, 0, 7, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'tit_novato_promissor', 'Novato Promissor', 'Chegou ontem. Já entregou hoje.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 8, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'tit_guardiao_da_base', 'Guardião da Base', 'Nada entra, nada cai, nada passa.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 9, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'tit_maquina_de_meta', 'Máquina de Meta', 'Bateu. Rebateu. Pediu outra.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 10, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'tit_visionario', 'Visionário', 'Enxerga o Q4 em pleno janeiro.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 11, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'tit_arquiteto_de_dados', 'Arquiteto de Dados', 'Cada tabela no lugar, cada índice com propósito.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 12, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'tit_cacador_de_bugs', 'Caçador de Bugs', 'O stack trace treme quando ele abre o console.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 13, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'tit_mestre_do_pitch', 'Mestre do Pitch', 'Três slides. Dois minutos. Um sim.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 14, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'tit_senhor_dos_dashboards', 'Senhor dos Dashboards', 'Um painel para a todos governar.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 15, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'tit_alquimista_de_leads', 'Alquimista de Leads', 'Transforma clique frio em contrato assinado.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 16, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'tit_imperador_do_roi', 'Imperador do ROI', 'Cada real investido volta fazendo reverência.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 17, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'tit_guardiao_do_uptime', 'Guardião do Uptime', '99,99% — e o 0,01% foi planejado.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 18, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'tit_domador_de_algoritmos', 'Domador de Algoritmos', 'O leilão de anúncios obedece ao seu assobio.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 19, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'tit_forjado_na_madrugada', 'Forjado na Madrugada', 'O deploy das 3h47 conta a história.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 20, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='mitico'), 2,
  'tit_oraculo', 'Oráculo', 'Não prevê o futuro. Configura ele.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 21, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'tit_lider_de_guilda', 'Líder de Guilda', 'A raid do trimestre não se organiza sozinha.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 22, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'tit_ninja_do_excel', 'Ninja do Excel', 'PROCV na mão esquerda, tabela dinâmica na direita.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 23, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'tit_barao_dos_cliques', 'Barão dos Cliques', 'CTR de dois dígitos e um monóculo de respeito.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 24, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'tit_sussurrador_de_apis', 'Sussurrador de APIs', 'Fala baixinho com o endpoint e ele responde 200.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 25, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 2,
  'tit_colecionador', 'Colecionador de Conquistas', 'A estante de troféus pediu reforço estrutural.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 26, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'tit_mago_do_funil', 'Mago do Funil', 'Transforma topo em fundo com um passe de mãos.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 27, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'tit_sentinela', 'Sentinela da Madrugada', 'Enquanto o dash dorme, alguém vigia os alertas.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 28, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, lore,
   asset_type, status, supported_renderers, default_renderer, is_exclusive,
   is_randomizable, sort_order, tags, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='titulo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'tit_avatar_supremo', 'Avatar Supremo', 'Dominou os quatro elementos: 2D, 3D, foto e estilo.', 'titulo', 'published',
  '2d,3d', '2d', 0, 0, 29, 'titulo',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), lore = VALUES(lore),
  rarity_id = VALUES(rarity_id), updated_at = NOW();


-- ── Arquétipos (Expansão §1) ──

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='arquetipo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'arq_executivo', 'Executivo', 'Fecha o trimestre antes do café esfriar.', 'arquetipo', 'published',
  '2d,3d', '2d', 0, 0, 'arquetipo',
  '{"base":"bas_classica","camadas":{"cabelo":"cab_curto","olhos":"olh_serio","boca":"boc_neutra","roupa":"rou_social","fundo":"fun_estudio","banner":"ban_executivo","emblema":"emb_elite"},"cores":{"roupa":"#1c2433","destaque":"#e8b64c"},"titulo":"tit_elite_trader"}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='arquetipo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'arq_ceo', 'CEO', 'A última palavra — e a primeira visão.', 'arquetipo', 'published',
  '2d,3d', '2d', 0, 1, 'arquetipo',
  '{"base":"bas_angular","camadas":{"cabelo":"cab_topete","olhos":"olh_focado","boca":"boc_determinada","roupa":"rou_terno","acessorio":"ace_oculos","fundo":"fun_estudio","banner":"ban_executivo","emblema":"emb_diamond"},"cores":{"roupa":"#14213d","destaque":"#e8b64c"},"titulo":"tit_ceo_supremo"}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='arquetipo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'arq_engenheiro', 'Engenheiro', 'Se está de pé, foi ele que estruturou.', 'arquetipo', 'published',
  '2d,3d', '2d', 0, 2, 'arquetipo',
  '{"base":"bas_classica","camadas":{"cabelo":"cab_coque","olhos":"olh_focado","boca":"boc_neutra","roupa":"rou_camiseta","acessorio":"ace_oculos","fundo":"fun_grade","emblema":"emb_nexus"},"cores":{"roupa":"#2563eb","destaque":"#4c9de8"},"titulo":null}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='arquetipo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'arq_programador', 'Programador', 'Compila sonhos. Debuga pesadelos.', 'arquetipo', 'published',
  '2d,3d', '2d', 0, 3, 'arquetipo',
  '{"base":"bas_classica","camadas":{"cabelo":"cab_franja","olhos":"olh_cansado","boca":"boc_lado","roupa":"rou_hoodie","acessorio":"ace_fone","fundo":"fun_circuito","efeito":"efe_chuva","emblema":"emb_cyber"},"cores":{"roupa":"#0f766e","destaque":"#4cd97c"},"titulo":"tit_cyber_architect"}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='arquetipo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='comum'), 2,
  'arq_comercial', 'Comercial', 'O funil respeita quem sorri primeiro.', 'arquetipo', 'published',
  '2d,3d', '2d', 0, 4, 'arquetipo',
  '{"base":"bas_angular","camadas":{"cabelo":"cab_topete","olhos":"olh_feliz","boca":"boc_sorriso","roupa":"rou_social","fundo":"fun_estudio","emblema":"emb_elite"},"cores":{"roupa":"#5b3a8f","destaque":"#ff5f8f"},"titulo":null}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='arquetipo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'arq_cientista', 'Cientista', 'Hipótese, teste, verdade. Nessa ordem.', 'arquetipo', 'published',
  '2d,3d', '2d', 0, 5, 'arquetipo',
  '{"base":"bas_classica","camadas":{"cabelo":"cab_cacheado","olhos":"olh_brilho","boca":"boc_surpresa","roupa":"rou_camiseta","acessorio":"ace_oculos","fundo":"fun_lab","aura":"aur_plasma"},"cores":{"roupa":"#e8ecf5","destaque":"#4cd9e8"},"titulo":null}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='arquetipo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'arq_hacker', 'Hacker', 'As portas não sabem que estão abertas.', 'arquetipo', 'published',
  '2d,3d', '2d', 0, 6, 'arquetipo',
  '{"base":"bas_classica","camadas":{"cabelo":"cab_cyber","olhos":"olh_misterioso","boca":"boc_lado","roupa":"rou_jaqueta","fundo":"fun_circuito","efeito":"efe_glitch","banner":"ban_cyber","emblema":"emb_cyber"},"cores":{"roupa":"#101726","destaque":"#4cd97c"},"titulo":null}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='arquetipo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'arq_operador', 'Operador', 'Sintético, pontual e impossível de travar.', 'arquetipo', 'published',
  '2d,3d', '2d', 0, 7, 'arquetipo',
  '{"base":"bas_androide","camadas":{"olhos":"olh_led","boca":"boc_grade","roupa":"rou_armadura","fundo":"fun_led_wall","aura":"aur_neon","emblema":"emb_nexus"},"cores":{"pele":"#c8d4e8","destaque":"#4cd9e8"},"titulo":"tit_nexus_commander"}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='arquetipo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'arq_samurai', 'Samurai', 'Treina antes do stand-up. Todos os dias.', 'arquetipo', 'published',
  '2d,3d', '2d', 0, 8, 'arquetipo',
  '{"base":"bas_angular","camadas":{"cabelo":"cab_coque","olhos":"olh_serio","boca":"boc_determinada","roupa":"rou_kimono","fundo":"fun_dojo","aura":"aur_cristal"},"cores":{"roupa":"#d64545","destaque":"#ff5230"},"titulo":null}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='arquetipo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'arq_guerreiro', 'Guerreiro', 'A matilha confia. A meta cai.', 'arquetipo', 'published',
  '2d,3d', '2d', 0, 9, 'arquetipo',
  '{"base":"bas_lobo","camadas":{"olhos":"olh_serio","boca":"boc_determinada","roupa":"rou_armadura","fundo":"fun_arena","aura":"aur_eletrica","emblema":"emb_elite"},"cores":{"destaque":"#ff5230"},"titulo":null}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='arquetipo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'arq_explorador', 'Explorador', 'O mapa termina onde ele começa.', 'arquetipo', 'published',
  '2d,3d', '2d', 0, 10, 'arquetipo',
  '{"base":"bas_raposa","camadas":{"olhos":"olh_brincalhao","boca":"boc_sorriso","roupa":"rou_jaqueta","acessorio":"ace_cachecol","fundo":"fun_aurora","banner":"ban_galaxy"},"cores":{"destaque":"#e8b64c"},"titulo":null}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   asset_type, status, supported_renderers, default_renderer, is_randomizable,
   sort_order, tags, metadata, published_at, created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='arquetipo'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'arq_piloto', 'Piloto', 'Viu a Terra de cima e voltou com metas maiores.', 'arquetipo', 'published',
  '2d,3d', '2d', 0, 11, 'arquetipo',
  '{"base":"bas_classica","camadas":{"cabelo":"cab_curto","olhos":"olh_visor","boca":"boc_determinada","roupa":"rou_astronauta","fundo":"fun_nebulosa","banner":"ban_galaxy","aura":"aur_plasma"},"cores":{"roupa":"#e8ecf5","destaque":"#4c9de8"},"titulo":null}',
  NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), metadata = VALUES(metadata),
  rarity_id = VALUES(rarity_id), updated_at = NOW();


-- ── Regras: requerBase → requires_species · incompativelCom ──

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_curto'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_curto') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_curto') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_topete'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_topete') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_topete') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_franja'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_franja') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_franja') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_ondulado'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_ondulado') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_ondulado') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_coque'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_coque') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_coque') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_cacheado'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_cacheado') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_cacheado') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_longo'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_longo') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_longo') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_moicano'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_moicano') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_moicano') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_cyber'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_cyber') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_cyber') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_rabo'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_rabo') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_rabo') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_lateral'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_lateral') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_lateral') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_buzz'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_buzz') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_buzz') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_afro'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_afro') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_afro') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_trancas'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_trancas') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_trancas') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_medio'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_medio') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_medio') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_franja_longa'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_franja_longa') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_franja_longa') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_meio_coque'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_meio_coque') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_meio_coque') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_ondas_curtas'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_ondas_curtas') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_ondas_curtas') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_picos_neon'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_picos_neon') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_picos_neon') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_pixie'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_pixie') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_pixie') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_repicado_longo'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_repicado_longo') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_repicado_longo') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_dreads'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_dreads') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_dreads') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_mullet'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_mullet') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_mullet') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_pompadour'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_pompadour') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_pompadour') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_chanel'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_chanel') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_chanel') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_coques_duplos'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_coques_duplos') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_coques_duplos') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_grisalho'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_grisalho') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_grisalho') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_emo'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_emo') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_emo') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_lambido'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_lambido') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_lambido') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_cachos_soltos'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_cachos_soltos') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_cachos_soltos') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_viking'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_viking') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_viking') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_holo_gradiente'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_holo_gradiente') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_holo_gradiente') AND rule_type = 'requires_species';

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_tigela'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_tigela') AND r.rule_type = 'requires_species');

UPDATE avatar_asset_rules SET `condition` =
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo","bas_redonda","bas_coracao","bas_quadrada","bas_longa","bas_marcada","bas_sardas"]}'
WHERE source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_tigela') AND rule_type = 'requires_species';


-- ── Desbloqueios: conquista:x / evento:x ──

INSERT INTO avatar_unlock_rules
  (asset_id, unlock_type, reference_type, reference_id, priority)
SELECT (SELECT id FROM avatar_assets WHERE `key`='ace_medalha'), 'achievement', 'conquista', 'veterano_30d', 0
WHERE NOT EXISTS (SELECT 1 FROM avatar_unlock_rules u
  WHERE u.asset_id = (SELECT id FROM avatar_assets WHERE `key`='ace_medalha') AND u.unlock_type = 'achievement');

INSERT INTO avatar_unlock_rules
  (asset_id, unlock_type, reference_type, reference_id, priority)
SELECT (SELECT id FROM avatar_assets WHERE `key`='ace_gorro_natal'), 'event', 'evento', 'natal', 0
WHERE NOT EXISTS (SELECT 1 FROM avatar_unlock_rules u
  WHERE u.asset_id = (SELECT id FROM avatar_assets WHERE `key`='ace_gorro_natal') AND u.unlock_type = 'event');

INSERT INTO avatar_unlock_rules
  (asset_id, unlock_type, reference_type, reference_id, priority)
SELECT (SELECT id FROM avatar_assets WHERE `key`='ace_chapeu_bruxa'), 'event', 'evento', 'halloween', 0
WHERE NOT EXISTS (SELECT 1 FROM avatar_unlock_rules u
  WHERE u.asset_id = (SELECT id FROM avatar_assets WHERE `key`='ace_chapeu_bruxa') AND u.unlock_type = 'event');

INSERT INTO avatar_unlock_rules
  (asset_id, unlock_type, reference_type, reference_id, priority)
SELECT (SELECT id FROM avatar_assets WHERE `key`='ace_capa_heroica'), 'achievement', 'conquista', 'explorador_60', 0
WHERE NOT EXISTS (SELECT 1 FROM avatar_unlock_rules u
  WHERE u.asset_id = (SELECT id FROM avatar_assets WHERE `key`='ace_capa_heroica') AND u.unlock_type = 'achievement');

INSERT INTO avatar_unlock_rules
  (asset_id, unlock_type, reference_type, reference_id, priority)
SELECT (SELECT id FROM avatar_assets WHERE `key`='mol_pioneiro'), 'achievement', 'conquista', 'primeiro_avatar', 0
WHERE NOT EXISTS (SELECT 1 FROM avatar_unlock_rules u
  WHERE u.asset_id = (SELECT id FROM avatar_assets WHERE `key`='mol_pioneiro') AND u.unlock_type = 'achievement');

INSERT INTO avatar_unlock_rules
  (asset_id, unlock_type, reference_type, reference_id, priority)
SELECT (SELECT id FROM avatar_assets WHERE `key`='mol_glitch'), 'achievement', 'conquista', 'centuriao_100', 0
WHERE NOT EXISTS (SELECT 1 FROM avatar_unlock_rules u
  WHERE u.asset_id = (SELECT id FROM avatar_assets WHERE `key`='mol_glitch') AND u.unlock_type = 'achievement');

INSERT INTO avatar_unlock_rules
  (asset_id, unlock_type, reference_type, reference_id, priority)
SELECT (SELECT id FROM avatar_assets WHERE `key`='efe_confete'), 'achievement', 'conquista', 'colecionador_5', 0
WHERE NOT EXISTS (SELECT 1 FROM avatar_unlock_rules u
  WHERE u.asset_id = (SELECT id FROM avatar_assets WHERE `key`='efe_confete') AND u.unlock_type = 'achievement');

INSERT INTO avatar_unlock_rules
  (asset_id, unlock_type, reference_type, reference_id, priority)
SELECT (SELECT id FROM avatar_assets WHERE `key`='efe_moedas'), 'achievement', 'conquista', 'favoritador_25', 0
WHERE NOT EXISTS (SELECT 1 FROM avatar_unlock_rules u
  WHERE u.asset_id = (SELECT id FROM avatar_assets WHERE `key`='efe_moedas') AND u.unlock_type = 'achievement');

INSERT INTO avatar_unlock_rules
  (asset_id, unlock_type, reference_type, reference_id, priority)
SELECT (SELECT id FROM avatar_assets WHERE `key`='emb_fenix'), 'achievement', 'conquista', 'assiduo_30', 0
WHERE NOT EXISTS (SELECT 1 FROM avatar_unlock_rules u
  WHERE u.asset_id = (SELECT id FROM avatar_assets WHERE `key`='emb_fenix') AND u.unlock_type = 'achievement');


-- ── Coleções (AS3 F2c) ──

INSERT INTO avatar_collections
  (`key`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('col_cyber_nexus', 'Cyber Nexus', 'O conjunto sintético completo: chassi, óptica, armadura e a chuva de código.', (SELECT id FROM avatar_rarities WHERE `key`='lendario'),
  'published', JSON_OBJECT('cores', '{"pele":"#c8d4e8","destaque":"#4cd9e8"}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_cyber_nexus'), (SELECT id FROM avatar_assets WHERE `key`='bas_androide'), 0);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_cyber_nexus'), (SELECT id FROM avatar_assets WHERE `key`='olh_led'), 1);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_cyber_nexus'), (SELECT id FROM avatar_assets WHERE `key`='boc_grade'), 2);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_cyber_nexus'), (SELECT id FROM avatar_assets WHERE `key`='rou_armadura'), 3);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_cyber_nexus'), (SELECT id FROM avatar_assets WHERE `key`='fun_circuito'), 4);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_cyber_nexus'), (SELECT id FROM avatar_assets WHERE `key`='mol_tech'), 5);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_cyber_nexus'), (SELECT id FROM avatar_assets WHERE `key`='efe_chuva'), 6);

INSERT INTO avatar_collections
  (`key`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('col_executivo', 'Executivo Elite', 'Alfaiataria, olhar analítico e a moldura de quem assina o trimestre.', (SELECT id FROM avatar_rarities WHERE `key`='epico'),
  'published', JSON_OBJECT('cores', '{"roupa":"#20242e","destaque":"#e8b64c"}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_executivo'), (SELECT id FROM avatar_assets WHERE `key`='bas_angular'), 0);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_executivo'), (SELECT id FROM avatar_assets WHERE `key`='cab_curto'), 1);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_executivo'), (SELECT id FROM avatar_assets WHERE `key`='olh_serio'), 2);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_executivo'), (SELECT id FROM avatar_assets WHERE `key`='boc_determinada'), 3);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_executivo'), (SELECT id FROM avatar_assets WHERE `key`='rou_terno'), 4);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_executivo'), (SELECT id FROM avatar_assets WHERE `key`='ace_oculos'), 5);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_executivo'), (SELECT id FROM avatar_assets WHERE `key`='fun_estudio'), 6);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_executivo'), (SELECT id FROM avatar_assets WHERE `key`='mol_duplo'), 7);

INSERT INTO avatar_collections
  (`key`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('col_dojo', 'Caminho do Dojo', 'Kimono, coque de samurai e o entardecer que forjou a disciplina.', (SELECT id FROM avatar_rarities WHERE `key`='epico'),
  'published', JSON_OBJECT('cores', '{"roupa":"#7a2d3c","destaque":"#ff7a3d"}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_dojo'), (SELECT id FROM avatar_assets WHERE `key`='cab_coque'), 0);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_dojo'), (SELECT id FROM avatar_assets WHERE `key`='rou_kimono'), 1);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_dojo'), (SELECT id FROM avatar_assets WHERE `key`='fun_dojo'), 2);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_dojo'), (SELECT id FROM avatar_assets WHERE `key`='boc_determinada'), 3);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_dojo'), (SELECT id FROM avatar_assets WHERE `key`='mol_cristal'), 4);

INSERT INTO avatar_collections
  (`key`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('col_galaxia', 'Galáxia', 'Traje orbital, olhos estelares e a nebulosa inteira nas suas costas.', (SELECT id FROM avatar_rarities WHERE `key`='lendario'),
  'published', JSON_OBJECT('cores', '{"destaque":"#c99aff"}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_galaxia'), (SELECT id FROM avatar_assets WHERE `key`='rou_astronauta'), 0);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_galaxia'), (SELECT id FROM avatar_assets WHERE `key`='olh_brilho'), 1);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_galaxia'), (SELECT id FROM avatar_assets WHERE `key`='fun_nebulosa'), 2);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_galaxia'), (SELECT id FROM avatar_assets WHERE `key`='efe_particulas'), 3);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_galaxia'), (SELECT id FROM avatar_assets WHERE `key`='mol_neon'), 4);

INSERT INTO avatar_collections
  (`key`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('col_dshow', 'Dshow Original', 'LED Bot, moletom da casa, o LED Wall e a moldura assinada. 100% Dshow.', (SELECT id FROM avatar_rarities WHERE `key`='exclusivo'),
  'published', JSON_OBJECT('cores', '{"destaque":"#7c5cff"}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_dshow'), (SELECT id FROM avatar_assets WHERE `key`='bas_ledbot'), 0);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_dshow'), (SELECT id FROM avatar_assets WHERE `key`='rou_moletom_dshow'), 1);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_dshow'), (SELECT id FROM avatar_assets WHERE `key`='fun_led_wall'), 2);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_dshow'), (SELECT id FROM avatar_assets WHERE `key`='mol_dshow'), 3);

INSERT INTO avatar_collections
  (`key`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('col_oito_bits', 'Oito Bits', 'Fliperama completo: pixel nos olhos, no coração e na praia.', (SELECT id FROM avatar_rarities WHERE `key`='epico'),
  'published', JSON_OBJECT('cores', '{"destaque":"#4cd97c"}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_oito_bits'), (SELECT id FROM avatar_assets WHERE `key`='olh_pixel'), 0);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_oito_bits'), (SELECT id FROM avatar_assets WHERE `key`='ban_pixel'), 1);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_oito_bits'), (SELECT id FROM avatar_assets WHERE `key`='emb_coracao_pixel'), 2);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_oito_bits'), (SELECT id FROM avatar_assets WHERE `key`='fun_praia'), 3);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_oito_bits'), (SELECT id FROM avatar_assets WHERE `key`='ace_oculos_3d'), 4);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_oito_bits'), (SELECT id FROM avatar_assets WHERE `key`='mol_rgb'), 5);

INSERT INTO avatar_collections
  (`key`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('col_tempestade', 'Olho da Tempestade', 'Chuva, relâmpagos e a sombra elegante do sobretudo.', (SELECT id FROM avatar_rarities WHERE `key`='epico'),
  'published', JSON_OBJECT('cores', '{"destaque":"#4c9de8"}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_tempestade'), (SELECT id FROM avatar_assets WHERE `key`='rou_sobretudo'), 0);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_tempestade'), (SELECT id FROM avatar_assets WHERE `key`='fun_chuva'), 1);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_tempestade'), (SELECT id FROM avatar_assets WHERE `key`='efe_tempestade'), 2);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_tempestade'), (SELECT id FROM avatar_assets WHERE `key`='aur_sombria'), 3);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_tempestade'), (SELECT id FROM avatar_assets WHERE `key`='mol_tech'), 4);

INSERT INTO avatar_collections
  (`key`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('col_campeao', 'Circuito Campeão', 'Jersey oficial, louros e o confete da final.', (SELECT id FROM avatar_rarities WHERE `key`='raro'),
  'published', JSON_OBJECT('cores', '{"roupa":"#20242e","destaque":"#4cd97c"}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_campeao'), (SELECT id FROM avatar_assets WHERE `key`='rou_jersey'), 0);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_campeao'), (SELECT id FROM avatar_assets WHERE `key`='ban_campeao'), 1);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_campeao'), (SELECT id FROM avatar_assets WHERE `key`='mol_louros'), 2);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_campeao'), (SELECT id FROM avatar_assets WHERE `key`='efe_confete'), 3);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_campeao'), (SELECT id FROM avatar_assets WHERE `key`='olh_estrela'), 4);

INSERT INTO avatar_collections
  (`key`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('col_forja', 'Coração da Forja', 'Brasas, bigorna, barba e as chamas que temperam lendas.', (SELECT id FROM avatar_rarities WHERE `key`='lendario'),
  'published', JSON_OBJECT('cores', '{"destaque":"#ff8a3d"}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_forja'), (SELECT id FROM avatar_assets WHERE `key`='fun_forja'), 0);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_forja'), (SELECT id FROM avatar_assets WHERE `key`='ban_forjado'), 1);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_forja'), (SELECT id FROM avatar_assets WHERE `key`='efe_fogo'), 2);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_forja'), (SELECT id FROM avatar_assets WHERE `key`='boc_barba'), 3);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_forja'), (SELECT id FROM avatar_assets WHERE `key`='mol_chamas'), 4);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_forja'), (SELECT id FROM avatar_assets WHERE `key`='emb_engrenagem'), 5);

INSERT INTO avatar_collections
  (`key`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('col_neon_noturno', 'Neon Noturno', 'A madrugada synthwave completa: jaqueta, letreiro e circuito vivo.', (SELECT id FROM avatar_rarities WHERE `key`='lendario'),
  'published', JSON_OBJECT('cores', '{"destaque":"#ff5f8f"}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_neon_noturno'), (SELECT id FROM avatar_assets WHERE `key`='rou_neon_racer'), 0);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_neon_noturno'), (SELECT id FROM avatar_assets WHERE `key`='fun_synthwave'), 1);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_neon_noturno'), (SELECT id FROM avatar_assets WHERE `key`='aur_neon'), 2);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_neon_noturno'), (SELECT id FROM avatar_assets WHERE `key`='ban_neon_tokyo'), 3);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_neon_noturno'), (SELECT id FROM avatar_assets WHERE `key`='ace_tiara_led'), 4);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_neon_noturno'), (SELECT id FROM avatar_assets WHERE `key`='mol_circuito'), 5);

INSERT INTO avatar_collections
  (`key`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('col_guardiao_verde', 'Guardião Verde', 'Folhas, vento e a bandana de quem protege a trilha.', (SELECT id FROM avatar_rarities WHERE `key`='raro'),
  'published', JSON_OBJECT('cores', '{"destaque":"#4cd97c"}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_guardiao_verde'), (SELECT id FROM avatar_assets WHERE `key`='ban_guardiao'), 0);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_guardiao_verde'), (SELECT id FROM avatar_assets WHERE `key`='efe_folhas'), 1);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_guardiao_verde'), (SELECT id FROM avatar_assets WHERE `key`='aur_vento'), 2);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_guardiao_verde'), (SELECT id FROM avatar_assets WHERE `key`='fun_montanhas'), 3);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_guardiao_verde'), (SELECT id FROM avatar_assets WHERE `key`='ace_lenco_bandana'), 4);

INSERT INTO avatar_collections
  (`key`, name, description, rarity_id, status, metadata, created_at, updated_at)
VALUES ('col_realeza', 'Sangue Real', 'Coroa, smoking, estandarte imperial e o sol como aura.', (SELECT id FROM avatar_rarities WHERE `key`='lendario'),
  'published', JSON_OBJECT('cores', '{"destaque":"#e8b64c"}'), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
  updated_at = NOW();

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_realeza'), (SELECT id FROM avatar_assets WHERE `key`='rou_smoking'), 0);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_realeza'), (SELECT id FROM avatar_assets WHERE `key`='ban_imperial'), 1);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_realeza'), (SELECT id FROM avatar_assets WHERE `key`='emb_coroa'), 2);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_realeza'), (SELECT id FROM avatar_assets WHERE `key`='ace_coroa'), 3);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_realeza'), (SELECT id FROM avatar_assets WHERE `key`='mol_ouro'), 4);

INSERT IGNORE INTO avatar_collection_items (collection_id, asset_id, sort_order)
VALUES ((SELECT id FROM avatar_collections WHERE `key`='col_realeza'), (SELECT id FROM avatar_assets WHERE `key`='aur_solar'), 5);


-- ── Presets de sistema ──

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_executivo', 'Executivo de Elite', 'Terno, olhar analítico e a certeza de quem fecha o trimestre.',
  (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1, 1,
  '{"id":"pre_executivo","nome":"Executivo de Elite","descricao":"Terno, olhar analítico e a certeza de quem fecha o trimestre.","raridade":"raro","config":{"base":"bas_angular","camadas":{"cabelo":"cab_curto","olhos":"olh_serio","boca":"boc_determinada","roupa":"rou_terno","fundo":"fun_estudio","moldura":"mol_duplo"},"cores":{"pele":"#d29e6f","cabelo":"#14100c","roupa":"#20242e","destaque":"#e8b64c"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_proplayer', 'Pro Player', 'Headset RGB, jersey oficial e a arena inteira gritando seu nick.',
  (SELECT id FROM avatar_rarities WHERE `key`='epico'), 1, 1,
  '{"id":"pre_proplayer","nome":"Pro Player","descricao":"Headset RGB, jersey oficial e a arena inteira gritando seu nick.","raridade":"epico","config":{"base":"bas_classica","camadas":{"cabelo":"cab_cyber","olhos":"olh_focado","boca":"boc_lado","roupa":"rou_gamer","acessorio":"ace_headset","fundo":"fun_arena","moldura":"mol_neon"},"cores":{"pele":"#e8b58c","cabelo":"#4c9de8","roupa":"#20242e","destaque":"#39d98a"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_androide', 'Androide Nexus', 'Chassi sintético, chuva digital e núcleo de energia pulsante.',
  (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 1, 1,
  '{"id":"pre_androide","nome":"Androide Nexus","descricao":"Chassi sintético, chuva digital e núcleo de energia pulsante.","raridade":"lendario","config":{"base":"bas_androide","camadas":{"olhos":"olh_led","boca":"boc_grade","roupa":"rou_armadura","fundo":"fun_circuito","moldura":"mol_tech","efeito":"efe_chuva"},"cores":{"pele":"#c8d4e8","cabelo":"#3d2b1f","roupa":"#20242e","destaque":"#4cd9e8"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_sexta', 'Casual de Sexta', 'Óculos escuros, gargalhada solta e zero reuniões depois das 17h.',
  (SELECT id FROM avatar_rarities WHERE `key`='comum'), 1, 1,
  '{"id":"pre_sexta","nome":"Casual de Sexta","descricao":"Óculos escuros, gargalhada solta e zero reuniões depois das 17h.","raridade":"comum","config":{"base":"bas_classica","camadas":{"cabelo":"cab_franja","olhos":"olh_feliz","boca":"boc_larga","roupa":"rou_camiseta","acessorio":"ace_oculos_sol","fundo":"fun_estrelas"},"cores":{"pele":"#b07a4e","cabelo":"#6b4a2a","roupa":"#1f6e5a","destaque":"#ff7a3d"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_lenda', 'Lenda Viva', 'Coroa de ouro, faíscas e uma nebulosa de fundo. Top 1 global.',
  (SELECT id FROM avatar_rarities WHERE `key`='exclusivo'), 1, 1,
  '{"id":"pre_lenda","nome":"Lenda Viva","descricao":"Coroa de ouro, faíscas e uma nebulosa de fundo. Top 1 global.","raridade":"exclusivo","config":{"base":"bas_classica","camadas":{"cabelo":"cab_longo","olhos":"olh_brilho","boca":"boc_sorriso","roupa":"rou_terno","acessorio":"ace_coroa","fundo":"fun_nebulosa","moldura":"mol_ouro","efeito":"efe_faiscas"},"cores":{"pele":"#e8b58c","cabelo":"#d9b166","roupa":"#5b3d8a","destaque":"#e8b64c"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_holograma', 'Holograma Synth', 'Projeção translúcida sobre o grid oitentista. Puro synthwave.',
  (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 1, 1,
  '{"id":"pre_holograma","nome":"Holograma Synth","descricao":"Projeção translúcida sobre o grid oitentista. Puro synthwave.","raridade":"lendario","config":{"base":"bas_holo","camadas":{"olhos":"olh_visor","boca":"boc_neutra","roupa":"rou_jaqueta","fundo":"fun_grade","moldura":"mol_neon","efeito":"efe_scanlines"},"cores":{"pele":"#9fe8c8","cabelo":"#3d2b1f","roupa":"#5b3d8a","destaque":"#ff5f8f"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_arquiteto', 'Arquiteto de Dados', 'Risca impecável, monóculo analítico e a cidade acesa atrás.',
  (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1, 1,
  '{"id":"pre_arquiteto","nome":"Arquiteto de Dados","descricao":"Risca impecável, monóculo analítico e a cidade acesa atrás.","raridade":"raro","config":{"base":"bas_longa","camadas":{"cabelo":"cab_lateral","olhos":"olh_serio","boca":"boc_neutra","roupa":"rou_social","acessorio":"ace_oculos","fundo":"fun_escritorio","moldura":"mol_selo"},"cores":{"pele":"#d29e6f","cabelo":"#2a2a33","roupa":"#3e5a7a","destaque":"#4c9de8"},"titulo":"tit_arquiteto_de_dados"}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_streamer', 'Streamer ao Vivo', 'Picos neon, olhos de estrela e o LED wall no talo.',
  (SELECT id FROM avatar_rarities WHERE `key`='epico'), 1, 1,
  '{"id":"pre_streamer","nome":"Streamer ao Vivo","descricao":"Picos neon, olhos de estrela e o LED wall no talo.","raridade":"epico","config":{"base":"bas_redonda","camadas":{"cabelo":"cab_picos_neon","olhos":"olh_estrela","boca":"boc_larga","roupa":"rou_jersey","acessorio":"ace_headset","fundo":"fun_led_wall","moldura":"mol_rgb","efeito":"efe_confete"},"cores":{"pele":"#e8b58c","cabelo":"#20242e","roupa":"#20242e","destaque":"#ff5f8f"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_cientista', 'Cientista de Plantão', 'Jaleco, sardas e a cara de quem achou um outlier às 2h.',
  (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 1, 1,
  '{"id":"pre_cientista","nome":"Cientista de Plantão","descricao":"Jaleco, sardas e a cara de quem achou um outlier às 2h.","raridade":"incomum","config":{"base":"bas_sardas","camadas":{"cabelo":"cab_coque","olhos":"olh_arregalado","boca":"boc_uau","roupa":"rou_jaleco","acessorio":"ace_oculos","fundo":"fun_lab","moldura":"mol_aro"},"cores":{"pele":"#e8b58c","cabelo":"#8a4a2a","roupa":"#2d6a8a","destaque":"#4cd9e8"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_ronin', 'Ronin da Madrugada', 'Meio coque, máscara e pétalas de sakura no vento do dojo.',
  (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 1, 1,
  '{"id":"pre_ronin","nome":"Ronin da Madrugada","descricao":"Meio coque, máscara e pétalas de sakura no vento do dojo.","raridade":"lendario","config":{"base":"bas_marcada","camadas":{"cabelo":"cab_meio_coque","olhos":"olh_misterioso","boca":"boc_mascara","roupa":"rou_kimono","fundo":"fun_dojo","moldura":"mol_cristal","efeito":"efe_sakura","aura":"aur_vento"},"cores":{"pele":"#d29e6f","cabelo":"#14100c","roupa":"#7a2d3c","destaque":"#ff7a3d"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_navegante', 'Navegante', 'Colete, bandana e o estandarte corsário içado.',
  (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1, 1,
  '{"id":"pre_navegante","nome":"Navegante","descricao":"Colete, bandana e o estandarte corsário içado.","raridade":"raro","config":{"base":"bas_quadrada","camadas":{"cabelo":"cab_buzz","olhos":"olh_focado","boca":"boc_palito","roupa":"rou_colete","acessorio":"ace_lenco_bandana","fundo":"fun_montanhas","banner":"ban_corsario"},"cores":{"pele":"#b07a4e","cabelo":"#3d2b1f","roupa":"#5a4a32","destaque":"#e8b64c"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_dj', 'DJ do Deploy', 'Fone no pescoço... quer dizer, na cabeça — e o synthwave rolando.',
  (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1, 1,
  '{"id":"pre_dj","nome":"DJ do Deploy","descricao":"Fone no pescoço... quer dizer, na cabeça — e o synthwave rolando.","raridade":"raro","config":{"base":"bas_coracao","camadas":{"cabelo":"cab_ondas_curtas","olhos":"olh_brincalhao","boca":"boc_assobio","roupa":"rou_hoodie","acessorio":"ace_fone","fundo":"fun_synthwave","moldura":"mol_neon","efeito":"efe_bolhas"},"cores":{"pele":"#e8b58c","cabelo":"#6b4a2a","roupa":"#2a2438","destaque":"#c99aff"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_bibliotecario', 'Guardião do Acervo', 'Flanela, monóculo e paz entre as estantes.',
  (SELECT id FROM avatar_rarities WHERE `key`='incomum'), 1, 1,
  '{"id":"pre_bibliotecario","nome":"Guardião do Acervo","descricao":"Flanela, monóculo e paz entre as estantes.","raridade":"incomum","config":{"base":"bas_longa","camadas":{"cabelo":"cab_franja_longa","olhos":"olh_sonolento","boca":"boc_neutra","roupa":"rou_flanela","acessorio":"ace_monoculo","fundo":"fun_biblioteca","moldura":"mol_madeira"},"cores":{"pele":"#d29e6f","cabelo":"#5a3a22","roupa":"#5a2d2d","destaque":"#e8b64c"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_magnata', 'Magnata', 'Smoking, corrente e cifrões na pupila. O ROI agradece.',
  (SELECT id FROM avatar_rarities WHERE `key`='epico'), 1, 1,
  '{"id":"pre_magnata","nome":"Magnata","descricao":"Smoking, corrente e cifrões na pupila. O ROI agradece.","raridade":"epico","config":{"base":"bas_angular","camadas":{"cabelo":"cab_topete","olhos":"olh_cifrao","boca":"boc_lado","roupa":"rou_smoking","acessorio":"ace_corrente","fundo":"fun_escritorio","moldura":"mol_ouro","efeito":"efe_faiscas"},"cores":{"pele":"#d29e6f","cabelo":"#14100c","roupa":"#14213d","destaque":"#e8b64c"},"titulo":"tit_imperador_do_roi"}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_inverno', 'Sentinela do Inverno', 'Sobretudo, cachecol, barba cheia e a nevasca por testemunha.',
  (SELECT id FROM avatar_rarities WHERE `key`='epico'), 1, 1,
  '{"id":"pre_inverno","nome":"Sentinela do Inverno","descricao":"Sobretudo, cachecol, barba cheia e a nevasca por testemunha.","raridade":"epico","config":{"base":"bas_marcada","camadas":{"cabelo":"cab_longo","olhos":"olh_serio","boca":"boc_barba","roupa":"rou_sobretudo","acessorio":"ace_cachecol","fundo":"fun_montanhas","moldura":"mol_cristal","efeito":"efe_neve"},"cores":{"pele":"#e8b58c","cabelo":"#6b6b70","roupa":"#2b3550","destaque":"#4cd9e8"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_oni', 'Oni do Dojo', 'Chifres, sorriso travesso e a aura sombria de quem venceu.',
  (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 1, 1,
  '{"id":"pre_oni","nome":"Oni do Dojo","descricao":"Chifres, sorriso travesso e a aura sombria de quem venceu.","raridade":"lendario","config":{"base":"bas_angular","camadas":{"cabelo":"cab_moicano","olhos":"olh_vilao","boca":"boc_travessa","roupa":"rou_kimono","acessorio":"ace_chifres_oni","fundo":"fun_dojo","moldura":"mol_chamas","aura":"aur_sombria"},"cores":{"pele":"#b0642a","cabelo":"#14100c","roupa":"#3a1420","destaque":"#ff5230"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_piloto_vr', 'Piloto de Simulação', 'Headset VR, jaqueta neon e o hangar Nexus pronto p/ launch.',
  (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 1, 1,
  '{"id":"pre_piloto_vr","nome":"Piloto de Simulação","descricao":"Headset VR, jaqueta neon e o hangar Nexus pronto p/ launch.","raridade":"lendario","config":{"base":"bas_classica","camadas":{"cabelo":"cab_buzz","olhos":"olh_focado","boca":"boc_determinada","roupa":"rou_neon_racer","acessorio":"ace_viseira_vr","fundo":"fun_hangar","moldura":"mol_circuito","aura":"aur_neon"},"cores":{"pele":"#e8b58c","cabelo":"#20242e","roupa":"#1c2333","destaque":"#4cd9e8"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_panda_zen', 'Panda Zen', 'Kimono, brisa suave e zero notificações.',
  (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1, 1,
  '{"id":"pre_panda_zen","nome":"Panda Zen","descricao":"Kimono, brisa suave e zero notificações.","raridade":"raro","config":{"base":"bas_panda","camadas":{"olhos":"olh_feliz","boca":"boc_sorriso","roupa":"rou_kimono","fundo":"fun_dojo","moldura":"mol_aro","aura":"aur_vento"},"cores":{"pele":"#eef1f6","cabelo":"#14100c","roupa":"#2f4a33","destaque":"#4cd97c"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_raposa_estelar', 'Raposa Estelar', 'Mistério, jaqueta e uma constelação particular em órbita.',
  (SELECT id FROM avatar_rarities WHERE `key`='epico'), 1, 1,
  '{"id":"pre_raposa_estelar","nome":"Raposa Estelar","descricao":"Mistério, jaqueta e uma constelação particular em órbita.","raridade":"epico","config":{"base":"bas_raposa","camadas":{"olhos":"olh_misterioso","boca":"boc_lado","roupa":"rou_jaqueta","fundo":"fun_synthwave","moldura":"mol_neon","aura":"aur_estelar"},"cores":{"pele":"#d98a3a","cabelo":"#3d2b1f","roupa":"#2a2438","destaque":"#c99aff"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_guardiao', 'Guardião da Trilha', 'Colete, escudo no peito e folhas dançando ao redor.',
  (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1, 1,
  '{"id":"pre_guardiao","nome":"Guardião da Trilha","descricao":"Colete, escudo no peito e folhas dançando ao redor.","raridade":"raro","config":{"base":"bas_quadrada","camadas":{"cabelo":"cab_curto","olhos":"olh_focado","boca":"boc_determinada","roupa":"rou_colete","fundo":"fun_montanhas","banner":"ban_guardiao","emblema":"emb_escudo","efeito":"efe_folhas"},"cores":{"pele":"#b07a4e","cabelo":"#3d2b1f","roupa":"#3e5a4a","destaque":"#4cd97c"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_pixelado', 'Herói de 8 Bits', 'Olhos pixel, coração de fliperama e praia renderizada em 16 cores.',
  (SELECT id FROM avatar_rarities WHERE `key`='epico'), 1, 1,
  '{"id":"pre_pixelado","nome":"Herói de 8 Bits","descricao":"Olhos pixel, coração de fliperama e praia renderizada em 16 cores.","raridade":"epico","config":{"base":"bas_classica","camadas":{"cabelo":"cab_moicano","olhos":"olh_pixel","boca":"boc_travessa","roupa":"rou_gamer","fundo":"fun_praia","banner":"ban_pixel","emblema":"emb_coracao_pixel","moldura":"mol_rgb"},"cores":{"pele":"#e8b58c","cabelo":"#ff5f8f","roupa":"#20242e","destaque":"#4cd97c"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_tempestade', 'Olho da Tempestade', 'Sobretudo na chuva, relâmpagos e calma absoluta.',
  (SELECT id FROM avatar_rarities WHERE `key`='epico'), 1, 1,
  '{"id":"pre_tempestade","nome":"Olho da Tempestade","descricao":"Sobretudo na chuva, relâmpagos e calma absoluta.","raridade":"epico","config":{"base":"bas_longa","camadas":{"cabelo":"cab_medio","olhos":"olh_serio","boca":"boc_neutra","roupa":"rou_sobretudo","fundo":"fun_chuva","moldura":"mol_tech","efeito":"efe_tempestade","aura":"aur_eletrica"},"cores":{"pele":"#d29e6f","cabelo":"#2a2a33","roupa":"#28324a","destaque":"#4c9de8"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_verao', 'Modo Férias', 'Regata, óculos escuros e chiclete — o backlog que espere.',
  (SELECT id FROM avatar_rarities WHERE `key`='comum'), 1, 1,
  '{"id":"pre_verao","nome":"Modo Férias","descricao":"Regata, óculos escuros e chiclete — o backlog que espere.","raridade":"comum","config":{"base":"bas_redonda","camadas":{"cabelo":"cab_rabo","olhos":"olh_feliz","boca":"boc_chiclete","roupa":"rou_regata","acessorio":"ace_oculos_sol","fundo":"fun_praia","moldura":"mol_aro","efeito":"efe_bolhas"},"cores":{"pele":"#b07a4e","cabelo":"#6b4a2a","roupa":"#1f6e5a","destaque":"#ff7a3d"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();

INSERT INTO avatar_presets
  (`key`, name, description, rarity_id, is_system, is_public, configuration,
   apply_scope, created_at, updated_at)
VALUES ('pre_forjador', 'Mestre Forjador', 'Barba, brasas e a engrenagem que faz tudo girar.',
  (SELECT id FROM avatar_rarities WHERE `key`='raro'), 1, 1,
  '{"id":"pre_forjador","nome":"Mestre Forjador","descricao":"Barba, brasas e a engrenagem que faz tudo girar.","raridade":"raro","config":{"base":"bas_quadrada","camadas":{"cabelo":"cab_buzz","olhos":"olh_focado","boca":"boc_barba","roupa":"rou_colete","fundo":"fun_forja","banner":"ban_forjado","emblema":"emb_engrenagem","moldura":"mol_madeira","efeito":"efe_fogo"},"cores":{"pele":"#b0642a","cabelo":"#3d2b1f","roupa":"#4a2d18","destaque":"#ff8a3d"}}}', 'tudo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), configuration = VALUES(configuration),
  updated_at = NOW();


-- publica nova versão do catálogo (invalidação de cache/ETag)
UPDATE avatar_catalog_meta SET version = version + 1, published_at = NOW(),
  notes = 'Seed de assets migrado do catálogo TS' WHERE id = 1;
