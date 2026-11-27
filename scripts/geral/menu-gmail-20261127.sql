-- menu-gmail-20261127.sql — DEGRAU DE BANCO (ROXO/CIMA, 27/11; decisão do Jhony: a DSHOW não usa mais o Outlook, entra o Gmail). Padrão MENU-INTEG.
-- (1) a linha do Outlook fica INATIVA (não é apagada: a volta reativa); (2) entra "Gmail" no MESMO grupo e posição (Favoritos, order_index 6),
-- apontando para #/panel-gmail (painel do degrau de código: "Não integrada · Integração com o Gmail em preparação").
-- IDEMPOTENTE: @gmail lido antes; o UPDATE só mexe no Outlook ativo. Pré-checagem: menu-gmail-20261127-pre.sql. Volta: menu-gmail-20261127-volta.sql.
SET @gmail := (SELECT COUNT(*) FROM ui_nav_items WHERE item_key = 'sidebar.gmail');
UPDATE ui_nav_items SET is_active = 0 WHERE item_key = 'sidebar.outlook' AND is_active = 1;
INSERT INTO ui_nav_items
  (item_key, parent_key, item_type, display_context, label, icon, tooltip, intent_id, route_path, panel_id, depth, order_index,
   is_visible, is_active, is_expanded, is_disabled, is_new, is_beta, min_level, required_permissions, required_feature_flags, description, metadata, created_by)
SELECT 'sidebar.gmail', 'sidebar.grp-favoritos', 'navigation', 'sidebar', 'Gmail', 'mail', 'Gmail (integração em preparação)',
       'sidebar.gmail', '#/panel-gmail', 'panel-gmail', 0, 6,
       1, 1, 0, 0, 0, 0, 0, NULL, NULL, 'Substitui o Outlook (27/11). Integração com o Gmail em preparação.', NULL, 'ROXO (CIMA) 27/11'
FROM DUAL WHERE @gmail = 0;
