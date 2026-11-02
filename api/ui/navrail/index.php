<?php
// API: NavRail UI Component
// @version 3.0.0-GROUPS
// @since 2025-01
// @updated 2026-01-27 - MAJOR: Migrado para navrail_items + navrail_groups (tabelas corretas)
// @updated 2026-01-27 - FIX: $_SESSION['user_level'] → $_SESSION['level'] (SessionGate compatibility)
// @updated 2026-01-25 - P0.1 FIX: Migrado requireAdmin() para UARPSGate::enforceTrigger()

declare(strict_types=1);

require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../core/CorsPolicy.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';
require_once __DIR__ . '/../../../config/db_connection.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

$user = getCurrentUser();
$userId = (int)($user['id'] ?? 0);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetNavrail();
        break;
    case 'POST':
    case 'PUT':
        UARPSGate::enforceTrigger($userId, 'gate:admin:navigation');
        AuthHelpers::requireCsrf();
        handleUpdateNavrail();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetNavrail(): void {
    $userId = $_SESSION['user_id'] ?? null;
    $userLevel = $_SESSION['level'] ?? 0;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        // Buscar grupos ativos com permissão adequada
        $groupsStmt = $pdo->prepare("
            SELECT 
                g.id,
                g.group_key,
                g.label,
                g.description,
                g.icon_name,
                g.order_index,
                g.position,
                g.is_collapsible,
                g.min_access_level
            FROM navrail_groups g
            WHERE g.is_active = 1 
              AND g.is_deleted = 0 
              AND g.min_access_level <= ?
            ORDER BY g.order_index ASC
        ");
        $groupsStmt->execute([$userLevel]);
        $groups = $groupsStmt->fetchAll(PDO::FETCH_ASSOC);

        // Buscar itens ativos com permissão adequada
        $itemsStmt = $pdo->prepare("
            SELECT 
                i.id,
                i.item_key,
                i.group_id,
                g.group_key,
                i.label,
                i.tooltip,
                i.icon_name,
                i.action_type,
                i.action_data,
                i.order_index,
                i.show_on_mobile,
                i.show_on_tablet,
                i.show_on_desktop,
                i.min_access_level,
                i.badge_type,
                i.badge_source,
                i.config_json
            FROM navrail_items i
            JOIN navrail_groups g ON i.group_id = g.id
            WHERE i.is_active = 1 
              AND i.is_deleted = 0 
              AND i.is_visible = 1
              AND i.min_access_level <= ?
              AND g.is_active = 1
              AND g.is_deleted = 0
              AND g.min_access_level <= ?
            ORDER BY g.order_index ASC, i.order_index ASC
        ");
        $itemsStmt->execute([$userLevel, $userLevel]);
        $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        // Buscar itens mobile
        $mobileStmt = $pdo->prepare("
            SELECT 
                m.item_id,
                i.item_key,
                m.order_index
            FROM navrail_mobile_items m
            JOIN navrail_items i ON m.item_id = i.id
            WHERE m.is_active = 1
              AND i.is_active = 1
              AND i.is_deleted = 0
              AND i.min_access_level <= ?
            ORDER BY m.order_index ASC
        ");
        $mobileStmt->execute([$userLevel]);
        $mobileItems = $mobileStmt->fetchAll(PDO::FETCH_ASSOC);

        // Buscar preferências do usuário
        $prefsStmt = $pdo->prepare("
            SELECT collapsed_items, pinned_items
            FROM app_user_navigation_preferences
            WHERE user_id = ?
        ");
        $prefsStmt->execute([$userId]);
        $prefs = $prefsStmt->fetch(PDO::FETCH_ASSOC);

        // Formatar grupos
        $formattedGroups = array_map(function($g) {
            return [
                'id' => $g['group_key'],
                'label' => $g['label'],
                'description' => $g['description'],
                'icon' => $g['icon_name'],
                'order' => (int)$g['order_index'],
                'position' => $g['position'] ?? 'top',
                'isCollapsible' => (bool)$g['is_collapsible'],
                'minLevel' => (int)$g['min_access_level']
            ];
        }, $groups);

        // Formatar itens
        $formattedItems = array_map(function($i) {
            $actionData = $i['action_data'] ? json_decode($i['action_data'], true) : null;
            $configJson = $i['config_json'] ? json_decode($i['config_json'], true) : null;
            
            return [
                'id' => $i['item_key'],
                'icon' => $i['icon_name'],
                'label' => $i['label'],
                'tooltip' => $i['tooltip'] ?? $i['label'],
                'group' => $i['group_key'],
                'action' => [
                    'type' => $i['action_type'],
                    'panelId' => $actionData['panelId'] ?? ('panel-' . $i['item_key']),
                    'route' => $actionData['route'] ?? null
                ],
                'intentId' => 'navrail.open.' . $i['item_key'],
                'route' => '#/' . $i['item_key'],
                'panelId' => $actionData['panelId'] ?? ('panel-' . $i['item_key']),
                'order' => (int)$i['order_index'],
                'showOnMobile' => (bool)$i['show_on_mobile'],
                'showOnTablet' => (bool)$i['show_on_tablet'],
                'showOnDesktop' => (bool)$i['show_on_desktop'],
                'minLevel' => (int)$i['min_access_level'],
                'badge' => $i['badge_type'] !== 'none' ? [
                    'type' => $i['badge_type'],
                    'source' => $i['badge_source']
                ] : null,
                'config' => $configJson
            ];
        }, $items);

        // Formatar itens mobile (apenas IDs)
        $formattedMobileItems = array_map(function($m) {
            return $m['item_key'];
        }, $mobileItems);

        ApiResponse::success([
            'groups' => $formattedGroups,
            'items' => $formattedItems,
            'mobileItems' => $formattedMobileItems,
            'preferences' => [
                'collapsed' => $prefs ? json_decode($prefs['collapsed_items'], true) : [],
                'pinned' => $prefs ? json_decode($prefs['pinned_items'], true) : []
            ],
            'userLevel' => $userLevel
        ]);

    } catch (Exception $e) {
        error_log("NavRail GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUpdateNavrail(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        ApiResponse::error('INVALID_INPUT', 400);
        return;
    }

    $action = $input['action'] ?? null;

    try {
        $pdo = getConnection('DSHOWDASH');

        switch ($action) {
            case 'update_item':
                updateNavItem($pdo, $input);
                break;
            case 'create_item':
                createNavItem($pdo, $input);
                break;
            case 'delete_item':
                deleteNavItem($pdo, $input);
                break;
            case 'reorder':
                reorderNavItems($pdo, $input);
                break;
            case 'update_preferences':
                updateUserPreferences($pdo, $input);
                break;
            default:
                ApiResponse::error('INVALID_ACTION', 400, ['message' => 'Ação inválida']);
                return;
        }

    } catch (Exception $e) {
        error_log("NavRail UPDATE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function updateNavItem(PDO $pdo, array $input): void {
    $id = $input['id'] ?? null;

    if (!$id) {
        ApiResponse::error('MISSING_ID', 400);
        return;
    }

    $updates = [];
    $params = [];

    $fieldMapping = [
        'label' => 'label',
        'tooltip' => 'tooltip',
        'icon' => 'icon_name',
        'icon_name' => 'icon_name',
        'group_id' => 'group_id',
        'order_index' => 'order_index',
        'action_type' => 'action_type',
        'action_data' => 'action_data',
        'is_active' => 'is_active',
        'is_visible' => 'is_visible',
        'show_on_mobile' => 'show_on_mobile',
        'show_on_tablet' => 'show_on_tablet',
        'show_on_desktop' => 'show_on_desktop',
        'min_access_level' => 'min_access_level',
        'badge_type' => 'badge_type',
        'badge_source' => 'badge_source',
        'config_json' => 'config_json'
    ];

    foreach ($fieldMapping as $inputField => $dbField) {
        if (isset($input[$inputField])) {
            $value = $input[$inputField];
            if (in_array($inputField, ['action_data', 'config_json']) && is_array($value)) {
                $value = json_encode($value);
            }
            $updates[] = "{$dbField} = ?";
            $params[] = $value;
        }
    }

    if (empty($updates)) {
        ApiResponse::error('NO_UPDATES', 400);
        return;
    }

    $updates[] = "updated_at = NOW()";
    $params[] = $id;

    $sql = "UPDATE navrail_items SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    ApiResponse::success(['message' => 'Item atualizado com sucesso']);
}

function createNavItem(PDO $pdo, array $input): void {
    $itemKey = $input['item_key'] ?? null;
    $label = $input['label'] ?? null;
    $groupId = $input['group_id'] ?? null;

    if (!$itemKey || !$label || !$groupId) {
        ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'item_key, label e group_id são obrigatórios']);
        return;
    }

    $actionData = isset($input['action_data']) && is_array($input['action_data']) 
        ? json_encode($input['action_data']) 
        : null;

    $stmt = $pdo->prepare("
        INSERT INTO navrail_items (
            item_key, group_id, label, tooltip, icon_name, action_type, action_data,
            order_index, show_on_mobile, show_on_tablet, show_on_desktop,
            is_visible, is_active, min_access_level, badge_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, NOW(), NOW())
    ");

    $stmt->execute([
        $itemKey,
        $groupId,
        $label,
        $input['tooltip'] ?? $label,
        $input['icon_name'] ?? $input['icon'] ?? 'circle',
        $input['action_type'] ?? 'openPanel',
        $actionData,
        $input['order_index'] ?? 0,
        $input['show_on_mobile'] ?? 1,
        $input['show_on_tablet'] ?? 1,
        $input['show_on_desktop'] ?? 1,
        $input['min_access_level'] ?? 0,
        $input['badge_type'] ?? 'none'
    ]);

    ApiResponse::success([
        'message' => 'Item criado com sucesso',
        'id' => $pdo->lastInsertId()
    ]);
}

function deleteNavItem(PDO $pdo, array $input): void {
    $id = $input['id'] ?? null;

    if (!$id) {
        ApiResponse::error('MISSING_ID', 400);
        return;
    }

    // Soft delete
    $stmt = $pdo->prepare("UPDATE navrail_items SET is_deleted = 1, is_active = 0, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        ApiResponse::error('ITEM_NOT_FOUND', 404);
        return;
    }

    ApiResponse::success(['message' => 'Item excluído com sucesso']);
}

function reorderNavItems(PDO $pdo, array $input): void {
    $items = $input['items'] ?? [];

    if (empty($items)) {
        ApiResponse::error('EMPTY_ITEMS', 400);
        return;
    }

    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare("UPDATE navrail_items SET order_index = ?, group_id = ?, updated_at = NOW() WHERE id = ?");

        foreach ($items as $item) {
            $stmt->execute([
                $item['order_index'] ?? $item['order'] ?? 0,
                $item['group_id'] ?? null,
                $item['id']
            ]);
        }

        $pdo->commit();
        ApiResponse::success(['message' => 'Ordenação atualizada com sucesso']);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function updateUserPreferences(PDO $pdo, array $input): void {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        ApiResponse::error('UNAUTHORIZED', 401);
        return;
    }

    $collapsed = isset($input['collapsed']) ? json_encode($input['collapsed']) : '[]';
    $pinned = isset($input['pinned']) ? json_encode($input['pinned']) : '[]';

    $stmt = $pdo->prepare("
        INSERT INTO app_user_navigation_preferences (user_id, collapsed_items, pinned_items, updated_at)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            collapsed_items = VALUES(collapsed_items),
            pinned_items = VALUES(pinned_items),
            updated_at = NOW()
    ");

    $stmt->execute([$userId, $collapsed, $pinned]);

    ApiResponse::success(['message' => 'Preferências atualizadas com sucesso']);
}
