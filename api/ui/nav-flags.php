<?php
// api/ui/nav-flags.php — visibilidade do menu lateral por feature flag (usado por api/ui/navigation.php). Sem dependência de sessão.
declare(strict_types=1);

/**
 * Visibilidade por feature flag (18/11, módulo Produtos & Atributos — mudança mínima em arquivo compartilhado):
 *   required_feature_flags (CSV ou JSON) → o item só aparece se TODAS estiverem ligadas para o usuário (fail-closed: erro/anônimo = some);
 *   metadata.hide_when_flags (lista)     → o item SOME se alguma estiver ligada para o usuário (fail-open: erro/anônimo = aparece, como hoje).
 * Sem itens com flag, nada é consultado (o menu de quem não usa flags fica idêntico). O cache já é por usuário (ui:nav:...:u{id}).
 */
function navFiltrarPorFlags($pdo, array $itens, $userId, ?callable $resolver = null) {
    $lista = static function ($v) {
        if ($v === null || $v === '') return [];
        if (is_array($v)) return array_values(array_filter(array_map('strval', $v)));
        $j = json_decode((string) $v, true);
        if (is_array($j)) return array_values(array_filter(array_map('strval', $j)));
        return array_values(array_filter(array_map('trim', explode(',', (string) $v))));
    };
    $precisa = []; $esconde = []; $usadas = [];
    foreach ($itens as $i => $item) {
        $precisa[$i] = $lista($item['required_feature_flags'] ?? null);
        $meta = is_string($item['metadata'] ?? null) ? json_decode($item['metadata'], true) : ($item['metadata'] ?? null);
        $esconde[$i] = $lista(is_array($meta) ? ($meta['hide_when_flags'] ?? null) : null);
        foreach (array_merge($precisa[$i], $esconde[$i]) as $f) $usadas[$f] = true;
    }
    if (!$usadas) return $itens;
    $ligada = [];
    $erro = $userId === null;
    if (!$erro) {
        try {
            if ($resolver === null) {
                require_once __DIR__ . '/../feature-flags/resolver.php';
                $r = new FeatureFlagResolver($pdo);
                $resolver = static fn(string $f, int $u) => $r->resolve($f, $u);
            }
            foreach (array_keys($usadas) as $f) $ligada[$f] = !empty($resolver($f, (int) $userId)['enabled']);
        } catch (Throwable $e) { error_log('[nav] flags do menu: ' . $e->getMessage()); $erro = true; }
    }
    $out = [];
    foreach ($itens as $i => $item) {
        if ($precisa[$i] && ($erro || in_array(false, array_map(fn($f) => $ligada[$f] ?? false, $precisa[$i]), true))) continue;
        if ($esconde[$i] && !$erro && in_array(true, array_map(fn($f) => $ligada[$f] ?? false, $esconde[$i]), true)) continue;
        $out[$i] = $item;
    }
    return array_is_list($itens) ? array_values($out) : $out;   // mantém o formato que cada caminho já devolvia
}

function buildNavTree($items) {
    $tree = [];
    $lookup = [];
    foreach ($items as $item) { $item['children'] = []; $lookup[$item['id']] = $item; }
    foreach ($lookup as $id => $item) {
        if (!empty($item['parent_key']) && isset($lookup[$item['parent_key']])) { $lookup[$item['parent_key']]['children'][] = &$lookup[$id]; }
        else { $tree[] = &$lookup[$id]; }
    }
    return $tree;
}

function getTriggerMappings($pdo, $context) {
    $where = ['is_active = 1'];
    $params = [];
    if ($context !== 'all') { $where[] = 'component = :context'; $params[':context'] = $context; }
    $sql = "SELECT trigger_key, intent_id, component, label, icon_name FROM ui_triggers WHERE " . implode(' AND ', $where) . " ORDER BY component, order_index";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $triggers = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $triggers[$row['trigger_key']] = ['intentId' => $row['intent_id'], 'component' => $row['component'], 'label' => $row['label'], 'icon' => $row['icon_name']]; }
    return $triggers;
}

function getAvailableRoutes($pdo) {
    $routes = [];
    $panels = [];

    // Buscar rotas do banco
    try {
        $stmt = $pdo->query("SELECT route_hash, description FROM app_nav_route WHERE is_active = 1 ORDER BY route_hash");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $routes[] = [
                'value' => $row['route_hash'],
                'label' => $row['description'] ?? $row['route_hash'],
                'type'  => 'route'
            ];
        }
    } catch (Exception $e) {}

    // Buscar painéis disponíveis
    try {
        $stmt = $pdo->query("SELECT destination_key, title FROM app_nav_destination WHERE is_active = 1 ORDER BY title");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $panels[] = [
                'value' => $row['destination_key'],
                'label' => $row['title'] ?? $row['destination_key'],
                'type'  => 'panel'
            ];
        }
    } catch (Exception $e) {}

    return array_merge($routes, $panels);
}

function getNavSections($pdo, $context) {
    // v2.6.0: Build sections dynamically from distinct parent_keys in ui_nav_items
    // Groups exist implicitly as parent_key values — no dedicated group table has matching keys
    $sections = [];

    $where = "parent_key IS NOT NULL AND parent_key != '' AND is_active = 1";
    $params = [];
    if ($context !== 'all') {
        $where .= " AND display_context = :ctx";
        $params[':ctx'] = $context;
    }

    // Label map for known group keys
    $labelMap = [
        'sidebar.grp-admin'         => 'Administração',
        'sidebar.grp-automacoes'    => 'Automações',
        'sidebar.grp-centros-custo' => 'Centros de Custo',
        'sidebar.grp-clientes'      => 'Clientes',
        'sidebar.grp-colaboradores' => 'Colaboradores',
        'sidebar.grp-comercial'     => 'Comercial',
        'sidebar.grp-compras'       => 'Compras',
        'sidebar.grp-contabil'      => 'Contabilidade',
        'sidebar.grp-contratos'     => 'Contratos',
        'sidebar.grp-dashboards'    => 'Dashboards',
        'sidebar.grp-empresas'      => 'Empresas',
        'sidebar.grp-favoritos'     => 'Favoritos',
        'sidebar.grp-canais-venda'  => 'Canais de Venda',
        'sidebar.grp-financeiro'    => 'Financeiro',
        'sidebar.grp-fornecedores'  => 'Fornecedores',
        'sidebar.grp-importacao'    => 'Importação',
        'sidebar.grp-locacoes'      => 'Locações',
        'sidebar.grp-logistica'     => 'Logística',
        'sidebar.grp-operacional'   => 'Operacional',
        'sidebar.grp-produtos'      => 'Produtos',
        'sidebar.grp-recebimento'   => 'Recebimento',
        'sidebar.grp-suporte'       => 'Suporte Técnico',
        'sidebar.main'              => 'Principal',
        'sidebar.operacional'       => 'Operacional',
    ];

    try {
        $sql = "SELECT parent_key, display_context, COUNT(*) as item_count, MIN(order_index) as min_order
                FROM ui_nav_items
                WHERE {$where}
                GROUP BY parent_key, display_context
                ORDER BY display_context, min_order";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $order = 0;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $key = $row['parent_key'];
            $label = $labelMap[$key] ?? ucfirst(str_replace(['sidebar.grp-', 'sidebar.', '-'], ['', '', ' '], $key));
            $sections[] = [
                'key'             => $key,
                'group_key'       => $key,
                'label'           => $label,
                'display_context' => $row['display_context'],
                'order_index'     => $order++,
                'item_count'      => (int)$row['item_count'],
                'is_collapsible'  => 1,
            ];
        }
    } catch (Exception $e) {}

    return $sections;
}
