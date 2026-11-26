-- menu-integracoes-20261126-volta.sql — volta do degrau de banco do menu Integrações: apaga SÓ a linha sidebar.integracoes criada por ele.
DELETE FROM ui_nav_items WHERE item_key = 'sidebar.integracoes' AND created_by = 'ROXO (CIMA) 26/11' LIMIT 1;
