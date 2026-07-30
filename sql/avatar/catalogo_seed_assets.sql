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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'bas_panda', 'Panda', 'Calmo por fora, deadline por dentro.', 'Mastiga bambu e backlog na mesma velocidade: devagar e sem errar.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 4,
  'animais', JSON_OBJECT('usaCores', NULL,
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='raro'), 2,
  'bas_coruja', 'Coruja', 'Vê tudo. Principalmente o que tentaram esconder no relatório.', 'Plantonista noturna oficial. Nenhum log passa despercebido.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 5,
  'animais', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'bas_raposa', 'Raposa', 'Esperta demais para reuniões que podiam ser e-mails.', 'Fechou três negociações antes de você abrir o CRM.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 6,
  'animais', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='epico'), 2,
  'bas_lobo', 'Lobo', 'Caça metas em matilha, mas fecha o trimestre sozinho se precisar.', 'O uivo dele é o sino de meta batida.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 7,
  'animais', JSON_OBJECT('usaCores', '["pele"]',
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='lendario'), 2,
  'bas_leao', 'Leão', 'A juba entra na sala antes dele.', 'Não disputa território: o território é dele desde o onboarding.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 8,
  'animais', JSON_OBJECT('usaCores', '["pele","cabelo"]',
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='mitico'), 2,
  'bas_alien', 'Alienígena', 'Veio estudar a humanidade. Ficou pelo dashboard.', 'Classificou a Terra como "habitável, mas o wi-fi cai". Ficou mesmo assim.',
  'parte2d', 'published', '2d', '2d',
  0, 1, 9,
  'sci-fi', JSON_OBJECT('usaCores', '["pele","destaque"]',
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

INSERT INTO avatar_assets
  (category_id, library_id, rarity_id, license_id, `key`, name, short_description,
   lore, asset_type, status, supported_renderers, default_renderer,
   is_exclusive, is_randomizable, sort_order, tags, metadata, published_at,
   created_at, updated_at)
VALUES ((SELECT id FROM avatar_categories WHERE `key`='especie'), (SELECT id FROM avatar_libraries WHERE `key`='dshow_svg'), (SELECT id FROM avatar_rarities WHERE `key`='exclusivo'), 2,
  'bas_ledbot', 'LED Bot', 'O mascote oficial da Dshow. Nasceu num painel de LED e nunca saiu do ar.', 'Primeiro pixel aceso da Dshow. Todo painel que brilha descende dele.',
  'parte2d', 'published', '2d', '2d',
  1, 1, 10,
  'dshow', JSON_OBJECT('usaCores', '["destaque"]',
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', FALSE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', FALSE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();

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
    'piscar', TRUE), NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), short_description = VALUES(short_description),
  lore = VALUES(lore), rarity_id = VALUES(rarity_id), sort_order = VALUES(sort_order),
  tags = VALUES(tags), updated_at = NOW();


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
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_curto') AND r.rule_type = 'requires_species');

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_topete'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_topete') AND r.rule_type = 'requires_species');

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_franja'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_franja') AND r.rule_type = 'requires_species');

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_ondulado'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_ondulado') AND r.rule_type = 'requires_species');

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_coque'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_coque') AND r.rule_type = 'requires_species');

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_cacheado'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_cacheado') AND r.rule_type = 'requires_species');

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_longo'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_longo') AND r.rule_type = 'requires_species');

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_moicano'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_moicano') AND r.rule_type = 'requires_species');

INSERT INTO avatar_asset_rules
  (source_asset_id, rule_type, target_type, target_key, `condition`, message, is_active)
SELECT (SELECT id FROM avatar_assets WHERE `key`='cab_cyber'), 'requires_species', 'species', NULL,
  '{"qualquer_de":["bas_classica","bas_angular","bas_holo"]}',
  'Compatível apenas com espécies humanoides.', 1
WHERE NOT EXISTS (SELECT 1 FROM avatar_asset_rules r
  WHERE r.source_asset_id = (SELECT id FROM avatar_assets WHERE `key`='cab_cyber') AND r.rule_type = 'requires_species');


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
SELECT (SELECT id FROM avatar_assets WHERE `key`='mol_pioneiro'), 'achievement', 'conquista', 'primeiro_avatar', 0
WHERE NOT EXISTS (SELECT 1 FROM avatar_unlock_rules u
  WHERE u.asset_id = (SELECT id FROM avatar_assets WHERE `key`='mol_pioneiro') AND u.unlock_type = 'achievement');

INSERT INTO avatar_unlock_rules
  (asset_id, unlock_type, reference_type, reference_id, priority)
SELECT (SELECT id FROM avatar_assets WHERE `key`='efe_confete'), 'achievement', 'conquista', 'colecionador_5', 0
WHERE NOT EXISTS (SELECT 1 FROM avatar_unlock_rules u
  WHERE u.asset_id = (SELECT id FROM avatar_assets WHERE `key`='efe_confete') AND u.unlock_type = 'achievement');


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


-- publica nova versão do catálogo (invalidação de cache/ETag)
UPDATE avatar_catalog_meta SET version = version + 1, published_at = NOW(),
  notes = 'Seed de assets migrado do catálogo TS' WHERE id = 1;
