-- pré-checagem (só leitura): 0 = aplicar · 1 com os mesmos campos = pular · qualquer outra coisa = parar
SELECT COUNT(*) AS existe, MAX(parent_key) AS parent, MAX(route_path) AS rota, MAX(JSON_EXTRACT(metadata, '$.nivel_minimo')) AS nivel
FROM ui_nav_items WHERE item_key = 'sidebar.integracoes';
