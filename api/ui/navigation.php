<?php
// UI - Navigation API
// @version 2.4.0-P06-FIX
// @changelog v2.4.0-P06-FIX - Fixed ApiResponse require path

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../core/UARPSGate.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../config/db_connection.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);

SessionGate::start();
$userId = SessionGate::validate() ? ($_SESSION['user_id'] ?? null) : null;

$context = $_GET['context'] ?? 'all';
$action = $_GET['action'] ?? 'items';

$cacheKey = $userId ? "ui:nav:{$context}:{$action}:u{$userId}" : "ui:nav:{$context}:{$action}:anon";
$CACHE_TTL = RedisConfig::TTL_CONFIG;

if (RedisHelper::serveIfCached($cacheKey)) { exit; }

try {
    $pdo = getConnection('DSHOWDASH');
    
    if ($action === 'items' || $action === 'tree' || $action === 'manifest') {
        $items = getNavItems($pdo, $context, $userId, false);
        if ($action === 'tree') {
            $data = ['tree' => buildNavTree($items), 'context' => $context];
        } elseif ($action === 'manifest') {
            $data = ['items' => $items, 'triggers' => getTriggerMappings($pdo, $context), 'tree' => buildNavTree($items)];
        } else {
            $sections = getNavSections($pdo, $context);
        $data = ['items' => $items, 'sections' => $sections, 'context' => $context, 'count' => count($items)];
        }
        $output = ApiResponse::buildSuccess($data, ['version' => '2.4.0-P06-FIX']);
        RedisHelper::cacheAndReturn($cacheKey, $output, $CACHE_TTL);
    } elseif ($action === 'available_routes') {
        // v2.5.0: Returns all available routes and panels for inline dropdown
        $routes = getAvailableRoutes($pdo);
        $output = ApiResponse::buildSuccess($routes, ['version' => '2.5.0']);
        RedisHelper::cacheAndReturn($cacheKey, $output, 60); // TTL curto — rotas mudam
    } else {
        ApiResponse::error('INVALID_ACTION', 400);
    }
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}

function getNavItems($pdo, $context, $userId, $includeInactive) {
    $where = ['1=1'];
    $params = [];
    if (!$includeInactive) { $where[] = 'is_active = 1'; $where[] = 'is_visible = 1'; }
    if ($context !== 'all') { $where[] = 'FIND_IN_SET(:context, display_context) > 0'; $params[':context'] = $context; }
    $sql = "SELECT * FROM ui_nav_items WHERE " . implode(' AND ', $where) . " ORDER BY order_index, id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $allItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if ($userId === null) { return array_filter($allItems, fn($item) => empty($item['uarps_trigger_id'])); }
    $filteredItems = [];
    foreach ($allItems as $item) {
        if (empty($item['uarps_trigger_id'])) { $filteredItems[] = $item; continue; }
        $check = UARPSGate::checkTrigger($userId, $item['uarps_trigger_id']);
        if ($check['allowed']) { $filteredItems[] = $item; }
    }
    return $filteredItems;
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
