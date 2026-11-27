-- pré-checagem (só leitura). Aplicar só se: outlook = 1 linha ATIVA e gmail = 0. Já aplicado (outlook inativo e gmail = 1, criado por ROXO) = pular. Outro estado = parar.
SET @ol := (SELECT COUNT(*) FROM ui_nav_items WHERE item_key = 'sidebar.outlook');
SET @oa := (SELECT MAX(is_active) FROM ui_nav_items WHERE item_key = 'sidebar.outlook');
SET @gl := (SELECT COUNT(*) FROM ui_nav_items WHERE item_key = 'sidebar.gmail');
SET @gc := (SELECT MAX(created_by) FROM ui_nav_items WHERE item_key = 'sidebar.gmail');
SELECT @ol AS outlook_linhas, @oa AS outlook_ativo, @gl AS gmail_linhas, @gc AS gmail_criado_por;
