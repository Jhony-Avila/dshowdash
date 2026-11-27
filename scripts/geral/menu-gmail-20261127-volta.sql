-- volta do degrau do Gmail: apaga SÓ a linha criada por ele e reativa o Outlook (a pré-checagem exigiu o Outlook ATIVO antes de aplicar).
DELETE FROM ui_nav_items WHERE item_key = 'sidebar.gmail' AND created_by = 'ROXO (CIMA) 27/11' LIMIT 1;
UPDATE ui_nav_items SET is_active = 1 WHERE item_key = 'sidebar.outlook' AND is_active = 0;
