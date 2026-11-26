-- menu-integracoes-20261126.sql — Integrações, fase 1, DEGRAU DE BANCO (ROXO/CIMA, 26/11; decisão do Jhony via arquiteto).
-- 1 linha em ui_nav_items: "Integrações" no grupo Favoritos, LOGO DEPOIS de "Geral" (sidebar.principal, order_index 1). A ordem do menu é
-- ORDER BY order_index, id → mesmo order_index 1 e id novo (maior) = logo abaixo do Geral, sem renumerar nenhum item.
-- Visível SÓ para nível ≥ 80 por metadata.nivel_minimo (navFiltrarPorNivel, degrau de código ANTES deste). Nenhum outro item muda.
-- IDEMPOTENTE: não insere se a item_key já existir (@existe, lido antes; sem auto-referência na mesma consulta). Pré-checagem do portão: a linha não existe → aplicar; existe igual → pular; existe diferente → parar.
-- Volta: menu-integracoes-20261126-volta.sql (apaga só esta item_key).
SET @existe := (SELECT COUNT(*) FROM ui_nav_items WHERE item_key = 'sidebar.integracoes');
INSERT INTO ui_nav_items
  (item_key, parent_key, item_type, display_context, label, icon, tooltip, intent_id, route_path, panel_id, depth, order_index,
   is_visible, is_active, is_expanded, is_disabled, is_new, is_beta, min_level, required_permissions, required_feature_flags, description, metadata, created_by)
SELECT 'sidebar.integracoes', 'sidebar.grp-favoritos', 'navigation', 'sidebar', 'Integrações', 'plug', 'Estado das integrações do Dash',
       'sidebar.integracoes', '#/panel-integracoes', 'panel-integracoes', 1, 1,
       1, 1, 0, 0, 0, 0, 0, NULL, NULL, 'Integrações em página inteira (fase 1, 26/11).', JSON_OBJECT('nivel_minimo', 80), 'ROXO (CIMA) 26/11'
FROM DUAL
WHERE @existe = 0;
