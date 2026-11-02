-- ============================================================================
-- NAVEGAÇÃO ENTERPRISE AAA - SEED CONTROLADO (IDEMPOTENTE)
-- Versão: 1.0.0
-- Data: 2024-12-13
-- ============================================================================

USE DSHOWDASH;

-- ============================================================================
-- 1. DESTINOS (painéis)
-- ============================================================================
INSERT IGNORE INTO app_nav_destination (destination_key, destination_type, title, is_active) VALUES
('panel-01', 'panel', 'Principal', 1),
('panel-02', 'panel', 'Geral', 1),
('panel-03', 'panel', 'Automações', 1),
('panel-04', 'panel', 'Bling', 1),
('panel-05', 'panel', 'Clientes', 1),
('panel-06', 'panel', 'Colaboradores/RH', 1),
('panel-07', 'panel', 'Comercial', 1),
('panel-08', 'panel', 'Compras', 1),
('panel-09', 'panel', 'Contratos', 1),
('panel-10', 'panel', 'Financeiro', 1),
('panel-11', 'panel', 'Fornecedores', 1),
('panel-12', 'panel', 'Google Ads', 1),
('panel-13', 'panel', 'Google Drive', 1),
('panel-14', 'panel', 'Importação', 1),
('panel-15', 'panel', 'Instagram', 1),
('panel-16', 'panel', 'Operacional', 1),
('panel-17', 'panel', 'Orçamento Clientes', 1),
('panel-18', 'panel', 'Pipedrive', 1),
('panel-19', 'panel', 'Produtos', 1),
('panel-cards', 'panel', 'Dashboard Cards', 1),
('panel-dashboard', 'panel', 'Dashboard', 1),
('panel-user-management', 'panel', 'Gestão de Usuários', 1),
('panel-permissions-admin', 'panel', 'Permissões Admin', 1),
('panel-session-admin', 'panel', 'Sessões Admin', 1),
('panel-audit-trail', 'panel', 'Auditoria', 1),
('panel-nav-admin', 'panel', 'Navegação Admin', 1),
('panel-feature-flags-admin', 'panel', 'Feature Flags', 1),
('panel-health-dashboard', 'panel', 'Health Dashboard', 1),
('panel-user-preferences', 'panel', 'Preferências do Usuário', 1),
('panel-orchestrator', 'panel', 'Orquestrador', 1);

-- ============================================================================
-- 2. ROTAS
-- ============================================================================
INSERT IGNORE INTO app_nav_route (route_clean, description, is_active) VALUES
('/', 'Rota raiz', 1),
('principal', 'Principal', 1),
('dashboard', 'Dashboard', 1),
('geral', 'Geral', 1),
('automacoes', 'Automações', 1),
('bling', 'Bling', 1),
('clientes', 'Clientes', 1),
('colaboradores', 'Colaboradores', 1),
('comercial', 'Comercial', 1),
('compras', 'Compras', 1),
('contratos', 'Contratos', 1),
('financeiro', 'Financeiro', 1),
('fornecedores', 'Fornecedores', 1),
('google-ads', 'Google Ads', 1),
('google-drive', 'Google Drive', 1),
('importacao', 'Importação', 1),
('instagram', 'Instagram', 1),
('operacional', 'Operacional', 1),
('orcamento-clientes', 'Orçamento Clientes', 1),
('pipedrive', 'Pipedrive', 1),
('produtos', 'Produtos', 1),
('rh-pessoas', 'RH Pessoas', 1),
('servidores', 'Servidores', 1),
('admin/usuarios', 'Admin Usuários', 1),
('admin/permissoes', 'Admin Permissões', 1),
('admin/sessoes', 'Admin Sessões', 1),
('admin/auditoria', 'Admin Auditoria', 1),
('admin/navegacao', 'Admin Navegação', 1),
('admin/feature-flags', 'Admin Feature Flags', 1),
('admin/health', 'Admin Health', 1),
('preferencias', 'Preferências', 1),
('minhas-preferencias', 'Minhas Preferências', 1),
('admin-users', 'Admin Users (NavRail)', 1),
('admin-settings', 'Admin Settings (NavRail)', 1),
('settings', 'Settings (Header)', 1),
('profile', 'Profile (Header)', 1),
('docs', 'Documentação', 1),
('relatorios', 'Relatórios', 1),
('api', 'API', 1),
('analytics', 'Analytics', 1),
('charts', 'Charts', 1),
('database', 'Database', 1),
('folder', 'Folder', 1),
('code', 'Code', 1),
('location', 'Location', 1);

-- ============================================================================
-- 3. AÇÕES (do action-bindings.js)
-- ============================================================================
INSERT IGNORE INTO app_nav_action (action_key, area, kind, description) VALUES
-- NavRail Navigation
('navrail:home', 'navrail', 'navigation', 'Home'),
('navrail:dashboard', 'navrail', 'navigation', 'Dashboard'),
('navrail:financeiro', 'navrail', 'navigation', 'Financeiro'),
('navrail:comercial', 'navrail', 'navigation', 'Comercial'),
('navrail:clientes', 'navrail', 'navigation', 'Clientes'),
('navrail:analytics', 'navrail', 'navigation', 'Analytics'),
('navrail:relatorios', 'navrail', 'navigation', 'Relatórios'),
('navrail:charts', 'navrail', 'navigation', 'Charts'),
('navrail:database', 'navrail', 'navigation', 'Database'),
('navrail:folder', 'navrail', 'navigation', 'Folder'),
('navrail:docs', 'navrail', 'navigation', 'Docs'),
('navrail:api', 'navrail', 'navigation', 'API'),
('navrail:pipedrive', 'navrail', 'navigation', 'Pipedrive'),
('navrail:location', 'navrail', 'navigation', 'Location'),
('navrail:admin-users', 'navrail', 'navigation', 'Admin Users'),
('navrail:admin-settings', 'navrail', 'navigation', 'Admin Settings'),
('navrail:code', 'navrail', 'navigation', 'Code'),
('navrail:bell', 'navrail', 'ui_event', 'Notifications'),
('navrail:help', 'navrail', 'ui_event', 'Help'),
('navrail:toggle-sidebar', 'navrail', 'ui_event', 'Toggle Sidebar'),
-- Header System
('header:refresh-action', 'header', 'action', 'Refresh'),
('header:fullscreen-action', 'header', 'action', 'Fullscreen'),
-- Header User Menu
('header:user-menu:open', 'header', 'ui_event', 'Open User Menu'),
('header:user-menu:close', 'header', 'ui_event', 'Close User Menu'),
('header:user-menu:profile', 'header', 'navigation', 'Profile'),
('header:user-menu:settings', 'header', 'navigation', 'Settings'),
('header:user-menu:logout', 'header', 'action', 'Logout'),
-- Header External Links
('header:adwords-link', 'header', 'external', 'AdWords'),
('header:alfinete-link', 'header', 'external', 'Alfinete'),
('header:asaas-link', 'header', 'external', 'Asaas'),
('header:bling-link', 'header', 'external', 'Bling'),
('header:calendar-link', 'header', 'external', 'Calendar'),
('header:chatgpt-link', 'header', 'external', 'ChatGPT'),
('header:google-drive-link', 'header', 'external', 'Google Drive'),
('header:loja-integrada-link', 'header', 'external', 'Loja Integrada'),
('header:mercado-livre-link', 'header', 'external', 'Mercado Livre'),
('header:pipedrive-link', 'header', 'external', 'Pipedrive'),
-- Header Status
('header:currency-btc', 'header', 'ui_event', 'BTC Status'),
('header:currency-usd-brl', 'header', 'ui_event', 'USD/BRL Status'),
('header:currency-usd-cny', 'header', 'ui_event', 'USD/CNY Status'),
('header:email-integration', 'header', 'ui_event', 'Email'),
('header:instagram-messenger-integration', 'header', 'ui_event', 'Instagram'),
('header:weather-sp', 'header', 'ui_event', 'Weather SP'),
('header:wechat-integration', 'header', 'ui_event', 'WeChat'),
('header:whatsapp-integration', 'header', 'ui_event', 'WhatsApp'),
-- Footer
('footer:language', 'footer', 'ui_event', 'Language Toggle'),
('footer:logout', 'footer', 'action', 'Logout'),
('footer:termos', 'footer', 'external', 'Termos'),
('footer:privacidade', 'footer', 'external', 'Privacidade'),
('footer:lgpd', 'footer', 'external', 'LGPD');

-- ============================================================================
-- 4. BINDING REVISIONS (primeira revisão de cada binding)
-- ============================================================================
INSERT IGNORE INTO app_nav_binding_revision (action_id, effect, params_json, checksum_sha256, revision_note, created_by)
SELECT 
  a.action_id,
  CASE 
    WHEN a.action_key = 'navrail:home' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:dashboard' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:financeiro' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:comercial' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:clientes' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:analytics' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:relatorios' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:charts' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:database' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:folder' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:docs' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:api' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:pipedrive' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:location' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:admin-users' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:admin-settings' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:code' THEN 'NAVIGATE'
    WHEN a.action_key = 'navrail:bell' THEN 'UI_EVENT'
    WHEN a.action_key = 'navrail:help' THEN 'UI_EVENT'
    WHEN a.action_key = 'navrail:toggle-sidebar' THEN 'UI_EVENT'
    WHEN a.action_key = 'header:refresh-action' THEN 'REFRESH'
    WHEN a.action_key = 'header:fullscreen-action' THEN 'FULLSCREEN'
    WHEN a.action_key LIKE 'header:user-menu:%' AND a.action_key NOT LIKE '%logout%' AND a.kind = 'navigation' THEN 'NAVIGATE'
    WHEN a.action_key LIKE 'header:user-menu:%' AND a.kind = 'ui_event' THEN 'UI_EVENT'
    WHEN a.action_key = 'header:user-menu:logout' THEN 'LOGOUT'
    WHEN a.action_key LIKE 'header:%-link' THEN 'EXTERNAL_LINK'
    WHEN a.action_key LIKE 'header:currency-%' THEN 'UI_EVENT'
    WHEN a.action_key LIKE 'header:%-integration' THEN 'UI_EVENT'
    WHEN a.action_key = 'header:weather-sp' THEN 'UI_EVENT'
    WHEN a.action_key = 'footer:language' THEN 'UI_EVENT'
    WHEN a.action_key = 'footer:logout' THEN 'LOGOUT'
    WHEN a.action_key LIKE 'footer:%' AND a.kind = 'external' THEN 'EXTERNAL_LINK'
    ELSE 'UI_EVENT'
  END AS effect,
  CASE 
    WHEN a.action_key = 'navrail:home' THEN '{"route":"#/"}'
    WHEN a.action_key = 'navrail:dashboard' THEN '{"route":"#/dashboard"}'
    WHEN a.action_key = 'navrail:financeiro' THEN '{"route":"#/financeiro"}'
    WHEN a.action_key = 'navrail:comercial' THEN '{"route":"#/comercial"}'
    WHEN a.action_key = 'navrail:clientes' THEN '{"route":"#/clientes"}'
    WHEN a.action_key = 'navrail:analytics' THEN '{"route":"#/analytics"}'
    WHEN a.action_key = 'navrail:relatorios' THEN '{"route":"#/relatorios"}'
    WHEN a.action_key = 'navrail:charts' THEN '{"route":"#/charts"}'
    WHEN a.action_key = 'navrail:database' THEN '{"route":"#/database"}'
    WHEN a.action_key = 'navrail:folder' THEN '{"route":"#/folder"}'
    WHEN a.action_key = 'navrail:docs' THEN '{"route":"#/docs"}'
    WHEN a.action_key = 'navrail:api' THEN '{"route":"#/api"}'
    WHEN a.action_key = 'navrail:pipedrive' THEN '{"route":"#/pipedrive"}'
    WHEN a.action_key = 'navrail:location' THEN '{"route":"#/location"}'
    WHEN a.action_key = 'navrail:admin-users' THEN '{"route":"#/admin-users"}'
    WHEN a.action_key = 'navrail:admin-settings' THEN '{"route":"#/admin-settings"}'
    WHEN a.action_key = 'navrail:code' THEN '{"route":"#/code"}'
    WHEN a.action_key = 'navrail:bell' THEN '{"event":"notifications:toggle"}'
    WHEN a.action_key = 'navrail:help' THEN '{"event":"help:open"}'
    WHEN a.action_key = 'navrail:toggle-sidebar' THEN '{"event":"sidebar:toggle"}'
    WHEN a.action_key = 'header:refresh-action' THEN '{}'
    WHEN a.action_key = 'header:fullscreen-action' THEN '{}'
    WHEN a.action_key = 'header:user-menu:open' THEN '{"event":"user-menu:open"}'
    WHEN a.action_key = 'header:user-menu:close' THEN '{"event":"user-menu:close"}'
    WHEN a.action_key = 'header:user-menu:profile' THEN '{"route":"#/profile"}'
    WHEN a.action_key = 'header:user-menu:settings' THEN '{"route":"#/settings"}'
    WHEN a.action_key = 'header:user-menu:logout' THEN '{}'
    WHEN a.action_key = 'header:adwords-link' THEN '{"url":"https://ads.google.com"}'
    WHEN a.action_key = 'header:alfinete-link' THEN '{"url":"https://alfinete.com.br"}'
    WHEN a.action_key = 'header:asaas-link' THEN '{"url":"https://www.asaas.com"}'
    WHEN a.action_key = 'header:bling-link' THEN '{"url":"https://www.bling.com.br"}'
    WHEN a.action_key = 'header:calendar-link' THEN '{"url":"https://calendar.google.com"}'
    WHEN a.action_key = 'header:chatgpt-link' THEN '{"url":"https://chat.openai.com"}'
    WHEN a.action_key = 'header:google-drive-link' THEN '{"url":"https://drive.google.com"}'
    WHEN a.action_key = 'header:loja-integrada-link' THEN '{"url":"https://lojaintegrada.com.br"}'
    WHEN a.action_key = 'header:mercado-livre-link' THEN '{"url":"https://www.mercadolivre.com.br"}'
    WHEN a.action_key = 'header:pipedrive-link' THEN '{"url":"https://www.pipedrive.com"}'
    WHEN a.action_key = 'footer:termos' THEN '{"url":"/termos"}'
    WHEN a.action_key = 'footer:privacidade' THEN '{"url":"/privacidade"}'
    WHEN a.action_key = 'footer:lgpd' THEN '{"url":"/lgpd"}'
    WHEN a.action_key = 'footer:language' THEN '{"event":"language:toggle"}'
    WHEN a.action_key = 'footer:logout' THEN '{}'
    ELSE '{}'
  END AS params_json,
  SHA2(CONCAT(a.action_key, '-v1-seed'), 256) AS checksum_sha256,
  'Seed inicial P1',
  'system'
FROM app_nav_action a
WHERE NOT EXISTS (
  SELECT 1 FROM app_nav_binding_revision br WHERE br.action_id = a.action_id
);

-- ============================================================================
-- 5. ATIVAR BINDINGS (ponte para revisão ativa)
-- ============================================================================
INSERT IGNORE INTO app_nav_binding_active (action_id, binding_rev_id, activated_by)
SELECT br.action_id, br.binding_rev_id, 'system'
FROM app_nav_binding_revision br
INNER JOIN (
  SELECT action_id, MAX(binding_rev_id) as max_rev
  FROM app_nav_binding_revision
  GROUP BY action_id
) latest ON br.action_id = latest.action_id AND br.binding_rev_id = latest.max_rev
WHERE NOT EXISTS (
  SELECT 1 FROM app_nav_binding_active ba WHERE ba.action_id = br.action_id
);

-- ============================================================================
-- 6. ROUTE RESOLUTION REVISIONS (mapeamento rota→destino)
-- ============================================================================
INSERT IGNORE INTO app_nav_route_resolution_revision (route_id, destination_id, layout, checksum_sha256, revision_note, created_by)
SELECT 
  r.route_id,
  d.destination_id,
  'default',
  SHA2(CONCAT(r.route_clean, '->', d.destination_key, '-v1-seed'), 256),
  'Seed inicial P1',
  'system'
FROM app_nav_route r
CROSS JOIN app_nav_destination d
WHERE 
  (r.route_clean = '/' AND d.destination_key = 'panel-01')
  OR (r.route_clean = 'principal' AND d.destination_key = 'panel-01')
  OR (r.route_clean = 'dashboard' AND d.destination_key = 'panel-cards')
  OR (r.route_clean = 'geral' AND d.destination_key = 'panel-02')
  OR (r.route_clean = 'automacoes' AND d.destination_key = 'panel-03')
  OR (r.route_clean = 'bling' AND d.destination_key = 'panel-04')
  OR (r.route_clean = 'clientes' AND d.destination_key = 'panel-05')
  OR (r.route_clean = 'colaboradores' AND d.destination_key = 'panel-06')
  OR (r.route_clean = 'comercial' AND d.destination_key = 'panel-07')
  OR (r.route_clean = 'compras' AND d.destination_key = 'panel-08')
  OR (r.route_clean = 'contratos' AND d.destination_key = 'panel-09')
  OR (r.route_clean = 'financeiro' AND d.destination_key = 'panel-10')
  OR (r.route_clean = 'fornecedores' AND d.destination_key = 'panel-11')
  OR (r.route_clean = 'google-ads' AND d.destination_key = 'panel-12')
  OR (r.route_clean = 'google-drive' AND d.destination_key = 'panel-13')
  OR (r.route_clean = 'importacao' AND d.destination_key = 'panel-14')
  OR (r.route_clean = 'instagram' AND d.destination_key = 'panel-15')
  OR (r.route_clean = 'operacional' AND d.destination_key = 'panel-16')
  OR (r.route_clean = 'orcamento-clientes' AND d.destination_key = 'panel-17')
  OR (r.route_clean = 'pipedrive' AND d.destination_key = 'panel-18')
  OR (r.route_clean = 'produtos' AND d.destination_key = 'panel-19')
  OR (r.route_clean = 'rh-pessoas' AND d.destination_key = 'panel-06')
  OR (r.route_clean = 'servidores' AND d.destination_key = 'panel-health-dashboard')
  OR (r.route_clean = 'admin/usuarios' AND d.destination_key = 'panel-user-management')
  OR (r.route_clean = 'admin/permissoes' AND d.destination_key = 'panel-permissions-admin')
  OR (r.route_clean = 'admin/sessoes' AND d.destination_key = 'panel-session-admin')
  OR (r.route_clean = 'admin/auditoria' AND d.destination_key = 'panel-audit-trail')
  OR (r.route_clean = 'admin/navegacao' AND d.destination_key = 'panel-nav-admin')
  OR (r.route_clean = 'admin/feature-flags' AND d.destination_key = 'panel-feature-flags-admin')
  OR (r.route_clean = 'admin/health' AND d.destination_key = 'panel-health-dashboard')
  OR (r.route_clean = 'preferencias' AND d.destination_key = 'panel-user-preferences')
  OR (r.route_clean = 'minhas-preferencias' AND d.destination_key = 'panel-user-preferences')
  OR (r.route_clean = 'admin-users' AND d.destination_key = 'panel-user-management')
  OR (r.route_clean = 'admin-settings' AND d.destination_key = 'panel-nav-admin')
  OR (r.route_clean = 'settings' AND d.destination_key = 'panel-user-preferences')
  OR (r.route_clean = 'profile' AND d.destination_key = 'panel-user-preferences')
  OR (r.route_clean = 'docs' AND d.destination_key = 'panel-dashboard')
  OR (r.route_clean = 'relatorios' AND d.destination_key = 'panel-dashboard')
  OR (r.route_clean = 'api' AND d.destination_key = 'panel-dashboard')
AND NOT EXISTS (
  SELECT 1 FROM app_nav_route_resolution_revision rr 
  WHERE rr.route_id = r.route_id
);

-- ============================================================================
-- 7. ATIVAR ROUTE RESOLUTIONS
-- ============================================================================
INSERT IGNORE INTO app_nav_route_resolution_active (route_id, resolution_rev_id, activated_by)
SELECT rr.route_id, rr.resolution_rev_id, 'system'
FROM app_nav_route_resolution_revision rr
INNER JOIN (
  SELECT route_id, MAX(resolution_rev_id) as max_rev
  FROM app_nav_route_resolution_revision
  GROUP BY route_id
) latest ON rr.route_id = latest.route_id AND rr.resolution_rev_id = latest.max_rev
WHERE NOT EXISTS (
  SELECT 1 FROM app_nav_route_resolution_active ra WHERE ra.route_id = rr.route_id
);

-- ============================================================================
-- FIM DO SEED
-- ============================================================================
