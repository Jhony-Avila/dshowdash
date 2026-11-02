<?php
// Header UI API
// @version 3.5.0-ENTERPRISE
// @description API do componente Header (componentes, grupos, menus)
// v3.5.0: P0.2 FIX - Adicionado requireCsrf() em todas as mutações
// v3.4.0: Corrigido namespace - classes chamadas diretamente sem use statements
// P3.4: Migrado para InputValidator - validação centralizada de entrada
// P3.3: Corrigido assinatura de enforceHeaderAdminAccess() para incluir userId
// P3.2: UARPS PURO - Removido fallback min_access_level

declare(strict_types=1);

require_once __DIR__ . '/../../_bootstrap.php';
require_once __DIR__ . '/../../core/CorsPolicy.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';
require_once __DIR__ . '/../../core/helpers/InputValidator.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../_helpers/AuthHelpers.php';

CorsPolicy::apply();

header('Content-Type: application/json; charset=utf-8');

const UARPS_TRIGGER_HEADER_ADMIN = 'gate:admin:header';
const UARPS_TRIGGER_HEADER_ADMIN_WRITE = 'gate:admin:header:write';

function filterComponentsByUARPS(array $components, int $userId): array {
    return array_values(array_filter($components, function($item) use ($userId) {
        $triggerId = $item['uarps_trigger_id'] ?? null;
        if (empty($triggerId)) {
            return true;
        }
        $result = UARPSGate::checkTrigger($userId, $triggerId);
        return $result['allowed'];
    }));
}

function enforceHeaderAdminAccess(int $userId): int {
    UARPSGate::enforceTrigger($userId, UARPS_TRIGGER_HEADER_ADMIN_WRITE, 'api/ui/header');
    return $userId;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$segments = explode('/', $path);
$resource = $segments[count($segments) - 1] ?? '';

$validator = InputValidator::fromGet();

try {
    switch ($method) {
        case 'GET':
            $user = SessionGate::requireAuth();
            $userId = (int)$user['user_id'];

            $pdo = getDbConnection();

            if ($resource === 'components' || $resource === 'index.php' || $resource === 'header') {
                $stmt = $pdo->query("
                    SELECT 
                        c.id,
                        c.component_key,
                        c.group_id,
                        c.component_type,
                        c.label,
                        c.description,
                        c.icon_name,
                        c.tooltip,
                        c.module_path,
                        c.css_path,
                        c.lazy_load,
                        c.preload_priority,
                        c.api_endpoint,
                        c.polling_interval,
                        c.polling_enabled,
                        c.order_index,
                        c.min_width,
                        c.max_width,
                        c.show_on_mobile,
                        c.show_on_tablet,
                        c.show_on_desktop,
                        c.required_permissions,
                        c.requires_feature,
                        c.config_json,
                        c.uarps_trigger_id,
                        c.is_active,
                        c.is_visible,
                        g.group_key,
                        g.position as group_position
                    FROM header_components c
                    LEFT JOIN header_groups g ON c.group_id = g.id
                    WHERE c.is_active = 1 
                      AND c.is_deleted = 0 
                      AND c.is_visible = 1
                    ORDER BY g.position, g.order_index, c.order_index
                ");
                $components = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $filteredComponents = filterComponentsByUARPS($components, $userId);

                ApiResponse::success($filteredComponents, [
                    'total' => count($filteredComponents),
                    'user_id' => $userId,
                    '_uarps' => [
                        'mode' => 'pure',
                        'fallback_min_access_level' => false,
                        'version' => 'P3.5'
                    ]
                ]);
                exit;
            }

            if ($resource === 'groups') {
                $stmt = $pdo->query("
                    SELECT id, group_key, label, position, order_index, is_active
                    FROM header_groups
                    WHERE is_active = 1 AND is_deleted = 0
                    ORDER BY position, order_index
                ");
                $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

                ApiResponse::success($groups, [
                    'total' => count($groups),
                    '_uarps' => ['mode' => 'pure', 'version' => 'P3.5']
                ]);
                exit;
            }

            if ($resource === 'menu' || $resource === 'user-menu') {
                $stmt = $pdo->query("
                    SELECT id, item_key, label, icon_name, action_type, action_value, order_index, is_divider, uarps_trigger_id, is_active
                    FROM header_menu_items
                    WHERE is_active = 1 AND is_deleted = 0
                    ORDER BY order_index
                ");
                $menuItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $filteredMenu = filterComponentsByUARPS($menuItems, $userId);

                ApiResponse::success($filteredMenu, [
                    'total' => count($filteredMenu),
                    'user_id' => $userId,
                    '_uarps' => ['mode' => 'pure', 'version' => 'P3.5']
                ]);
                exit;
            }

            $stmt = $pdo->query("SELECT * FROM header_groups WHERE is_active = 1 AND is_deleted = 0 ORDER BY position, order_index");
            $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $pdo->query("SELECT * FROM header_components WHERE is_active = 1 AND is_deleted = 0 ORDER BY order_index");
            $components = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $filteredComponents = filterComponentsByUARPS($components, $userId);

            ApiResponse::success([
                'groups' => $groups,
                'components' => $filteredComponents
            ], ['_uarps' => ['mode' => 'pure', 'version' => 'P3.5']]);
            break;

        case 'POST':
            $user = SessionGate::requireAuth();
            $actorId = (int)$user['user_id'];
            enforceHeaderAdminAccess($actorId);
            AuthHelpers::requireCsrf();

            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $pdo = getDbConnection();

            if ($resource === 'components') {
                $stmt = $pdo->prepare("
                    INSERT INTO header_components 
                    (component_key, group_id, component_type, label, description, icon_name, tooltip, 
                     module_path, css_path, lazy_load, preload_priority, api_endpoint, polling_interval,
                     polling_enabled, order_index, min_width, max_width, show_on_mobile, show_on_tablet,
                     show_on_desktop, required_permissions, requires_feature, config_json, uarps_trigger_id,
                     is_active, is_visible, created_by)
                    VALUES (:key, :group_id, :type, :label, :desc, :icon, :tooltip,
                            :module, :css, :lazy, :priority, :api, :poll_interval,
                            :poll_enabled, :order, :min_w, :max_w, :mobile, :tablet,
                            :desktop, :perms, :feature, :config, :uarps,
                            :active, :visible, :created_by)
                ");

                $stmt->execute([
                    'key' => $input['component_key'] ?? 'component_' . time(),
                    'group_id' => $input['group_id'] ?? null,
                    'type' => $input['component_type'] ?? 'button',
                    'label' => $input['label'] ?? 'Novo Componente',
                    'desc' => $input['description'] ?? null,
                    'icon' => $input['icon_name'] ?? 'circle',
                    'tooltip' => $input['tooltip'] ?? null,
                    'module' => $input['module_path'] ?? null,
                    'css' => $input['css_path'] ?? null,
                    'lazy' => (int)($input['lazy_load'] ?? 0),
                    'priority' => (int)($input['preload_priority'] ?? 0),
                    'api' => $input['api_endpoint'] ?? null,
                    'poll_interval' => (int)($input['polling_interval'] ?? 0),
                    'poll_enabled' => (int)($input['polling_enabled'] ?? 0),
                    'order' => (int)($input['order_index'] ?? 99),
                    'min_w' => $input['min_width'] ?? null,
                    'max_w' => $input['max_width'] ?? null,
                    'mobile' => (int)($input['show_on_mobile'] ?? 1),
                    'tablet' => (int)($input['show_on_tablet'] ?? 1),
                    'desktop' => (int)($input['show_on_desktop'] ?? 1),
                    'perms' => $input['required_permissions'] ?? null,
                    'feature' => $input['requires_feature'] ?? null,
                    'config' => isset($input['config_json']) ? json_encode($input['config_json']) : null,
                    'uarps' => $input['uarps_trigger_id'] ?? null,
                    'active' => (int)($input['is_active'] ?? 1),
                    'visible' => (int)($input['is_visible'] ?? 1),
                    'created_by' => $actorId
                ]);

                $newId = (int)$pdo->lastInsertId();

                ApiResponse::success(['id' => $newId], [
                    'message' => 'Componente criado com sucesso',
                    '_uarps' => ['trigger' => UARPS_TRIGGER_HEADER_ADMIN_WRITE, 'enforced' => true]
                ]);
                exit;
            }

            if ($resource === 'groups') {
                $stmt = $pdo->prepare("
                    INSERT INTO header_groups 
                    (group_key, label, position, order_index, is_active, created_by)
                    VALUES (:key, :label, :position, :order, :active, :created_by)
                ");

                $stmt->execute([
                    'key' => $input['group_key'] ?? 'group_' . time(),
                    'label' => $input['label'] ?? 'Novo Grupo',
                    'position' => $input['position'] ?? 'center',
                    'order' => (int)($input['order_index'] ?? 99),
                    'active' => (int)($input['is_active'] ?? 1),
                    'created_by' => $actorId
                ]);

                $newId = (int)$pdo->lastInsertId();

                ApiResponse::success(['id' => $newId], [
                    'message' => 'Grupo criado com sucesso',
                    '_uarps' => ['trigger' => UARPS_TRIGGER_HEADER_ADMIN_WRITE, 'enforced' => true]
                ]);
                exit;
            }

            ApiResponse::error('INVALID_RESOURCE', 400);
            break;

        case 'PUT':
        case 'PATCH':
            $user = SessionGate::requireAuth();
            $actorId = (int)$user['user_id'];
            enforceHeaderAdminAccess($actorId);
            AuthHelpers::requireCsrf();

            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $id = isset($input['id']) ? (int)$input['id'] : $validator->id('id', 0);

            if (!$id) {
                ApiResponse::error('MISSING_ID', 400, ['message' => 'ID required']);
                exit;
            }

            $pdo = getDbConnection();

            if ($resource === 'components') {
                $allowedFields = ['label', 'description', 'icon_name', 'tooltip', 'module_path', 'css_path',
                                  'lazy_load', 'preload_priority', 'api_endpoint', 'polling_interval', 'polling_enabled',
                                  'order_index', 'min_width', 'max_width', 'show_on_mobile', 'show_on_tablet',
                                  'show_on_desktop', 'required_permissions', 'requires_feature', 'uarps_trigger_id',
                                  'is_active', 'is_visible', 'group_id'];
                $updates = [];
                $params = ['id' => $id];

                foreach ($allowedFields as $field) {
                    if (isset($input[$field])) {
                        $updates[] = "$field = :$field";
                        $params[$field] = $input[$field];
                    }
                }

                if (isset($input['config_json'])) {
                    $updates[] = "config_json = :config_json";
                    $params['config_json'] = json_encode($input['config_json']);
                }

                if (empty($updates)) {
                    ApiResponse::error('NO_FIELDS', 400, ['message' => 'No fields to update']);
                    exit;
                }

                $sql = "UPDATE header_components SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);

                ApiResponse::success(null, [
                    'message' => 'Componente atualizado',
                    '_uarps' => ['trigger' => UARPS_TRIGGER_HEADER_ADMIN_WRITE, 'enforced' => true]
                ]);
                exit;
            }

            if ($resource === 'groups') {
                $allowedFields = ['label', 'position', 'order_index', 'is_active'];
                $updates = [];
                $params = ['id' => $id];

                foreach ($allowedFields as $field) {
                    if (isset($input[$field])) {
                        $updates[] = "$field = :$field";
                        $params[$field] = $input[$field];
                    }
                }

                if (empty($updates)) {
                    ApiResponse::error('NO_FIELDS', 400, ['message' => 'No fields to update']);
                    exit;
                }

                $sql = "UPDATE header_groups SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);

                ApiResponse::success(null, [
                    'message' => 'Grupo atualizado',
                    '_uarps' => ['trigger' => UARPS_TRIGGER_HEADER_ADMIN_WRITE, 'enforced' => true]
                ]);
                exit;
            }

            ApiResponse::error('INVALID_RESOURCE', 400);
            break;

        case 'DELETE':
            $user = SessionGate::requireAuth();
            $actorId = (int)$user['user_id'];
            enforceHeaderAdminAccess($actorId);
            AuthHelpers::requireCsrf();

            $id = $validator->id('id', 0);

            if (!$id) {
                ApiResponse::error('MISSING_ID', 400, ['message' => 'ID required']);
                exit;
            }

            $pdo = getDbConnection();

            // header_groups e header_components usam a MESMA coluna de exclusao logica:
            // `is_deleted` (tinyint). A versao anterior gravava `deleted_at = NOW()` para
            // grupos — coluna que nunca existiu -> "Unknown column" e a exclusao SEMPRE
            // falhava, em silencio para quem so olhava a tela.
            $table = ($resource === 'groups') ? 'header_groups' : 'header_components';

            $stmt = $pdo->prepare("UPDATE $table SET is_deleted = 1 WHERE id = :id");
            $stmt->execute(['id' => $id]);

            ApiResponse::success(null, [
                'message' => 'Removido com sucesso',
                '_uarps' => ['trigger' => UARPS_TRIGGER_HEADER_ADMIN_WRITE, 'enforced' => true]
            ]);
            break;

        case 'OPTIONS':
            http_response_code(204);
            break;

        default:
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    }
} catch (Throwable $e) {
    error_log("Header UI API Error: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    $statusCode = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
    $clientMessage = $statusCode >= 500 ? 'Erro interno do servidor' : 'Erro no processamento da requisição';
    ApiResponse::error('INTERNAL_ERROR', $statusCode, ['message' => $clientMessage]);
}
