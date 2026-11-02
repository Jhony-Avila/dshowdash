<?php
/**
 * Footer API
 * @version 3.3.0-FIX
 * @description API do componente Footer
 * @updated 2026-01-24
 * @changelog v3.3.0-FIX - Removed is_deleted column reference (column doesn't exist)
 * P3.2: UARPS PURO - Removido fallback min_access_level
 * P1.1: Migrado para ApiResponse (contrato ok/data/error/meta)
 */

declare(strict_types=1);

require_once __DIR__ . '/../../core/CorsPolicy.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once '/var/www/dshowdash/config/db_connection.php';

// P3.2: CORS seguro via CorsPolicy
CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'OPTIONS']
]);

header('Content-Type: application/json; charset=utf-8');

// P3.2: UARPS PURO - Filtra itens apenas por UARPS triggers
function filterByUARPS(array $items, int $userId): array {
    return array_values(array_filter($items, function($item) use ($userId) {
        // Se não tem uarps_trigger_id, item é público
        $triggerId = $item['uarps_trigger_id'] ?? null;
        if (empty($triggerId)) {
            return true;
        }

        // P3.2: UARPS PURO - Verifica permissão via UARPSGate
        return UARPSGate::checkTrigger($userId, $triggerId);
    }));
}

// Obtém contexto de autenticação (não obrigatório para footer público)
function getAuthContext(): array {
    try {
        $session = SessionGate::validate();
        if ($session) {
            $user = SessionGate::getUser();
            return [
                'authenticated' => true,
                'user_id' => (int)($user['id'] ?? $user['user_id'] ?? 0)
            ];
        }
    } catch (Exception $e) {
        // Ignora erros de sessão
    }

    return [
        'authenticated' => false,
        'user_id' => 0
    ];
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    if ($method !== 'GET') {
        ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
        exit;
    }

    $auth = getAuthContext();
    $pdo = getDbConnection();

    // Verifica se tabela tem coluna uarps_trigger_id
    $hasUarpsTrigger = false;
    try {
        $checkCol = $pdo->query("SHOW COLUMNS FROM footer_items LIKE 'uarps_trigger_id'");
        $hasUarpsTrigger = $checkCol->rowCount() > 0;
    } catch (Exception $e) {
        // Coluna não existe
    }

    // FIX v3.3.0: Removed is_deleted (column doesn't exist in table)
    if ($hasUarpsTrigger) {
        $stmt = $pdo->query("
            SELECT
                id,
                item_key,
                group_name,
                label,
                tooltip,
                icon_name,
                action_type,
                action_data,
                order_index,
                is_visible,
                min_access_level,
                uarps_trigger_id
            FROM footer_items
            WHERE is_active = 1 AND is_visible = 1
            ORDER BY group_name, order_index
        ");
    } else {
        $stmt = $pdo->query("
            SELECT
                id,
                item_key,
                group_name,
                label,
                tooltip,
                icon_name,
                action_type,
                action_data,
                order_index,
                is_visible,
                min_access_level
            FROM footer_items
            WHERE is_active = 1 AND is_visible = 1
            ORDER BY group_name, order_index
        ");
    }

    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // P3.2: Aplica filtro UARPS
    $filteredItems = filterByUARPS($items, $auth['user_id']);

    // Organiza por grupos
    $groups = [];
    foreach ($filteredItems as $item) {
        $groupName = $item['group_name'] ?? 'default';

        if (!isset($groups[$groupName])) {
            $groups[$groupName] = [
                'name' => $groupName,
                'items' => []
            ];
        }

        // Processa action_data JSON
        $actionData = $item['action_data'];
        if (is_string($actionData) && !empty($actionData)) {
            $decoded = json_decode($actionData, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $actionData = $decoded;
            }
        }

        $groups[$groupName]['items'][] = [
            'id' => $item['id'],
            'key' => $item['item_key'],
            'label' => $item['label'],
            'tooltip' => $item['tooltip'],
            'icon' => $item['icon_name'],
            'actionType' => $item['action_type'],
            'actionData' => $actionData,
            'order' => (int)$item['order_index']
        ];
    }

    // Converte para array indexado
    $groupsArray = array_values($groups);

    ApiResponse::success([
        'groups' => $groupsArray,
        'items' => $filteredItems,
        'total' => count($filteredItems)
    ], [
        'version' => '3.3.0-FIX',
        'uarps_mode' => 'enforced',
        'authenticated' => $auth['authenticated']
    ]);

} catch (PDOException $e) {
    error_log("Footer API error: " . $e->getMessage());

    // Fallback: retorna estrutura vazia
    ApiResponse::success([
        'groups' => [],
        'items' => [],
        'total' => 0
    ], [
        'fallback' => true,
        'reason' => 'Tabela não disponível',
        'error' => $e->getMessage()
    ]);
} catch (Throwable $e) {
    error_log("Footer API Error: " . $e->getMessage());
    ApiResponse::error('INTERNAL_ERROR', 500, ['message' => 'Erro interno do servidor']);
}
