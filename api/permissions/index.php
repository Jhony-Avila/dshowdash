<?php
// API: Permissions Management
// @version 2.3.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - P0.1 FIX: Migrado requireAdmin() para UARPSGate::enforceTrigger()
// v2.3.0: Migrado para UARPSGate + getConnection() centralizado
// v2.2.0: Migrado para AuthHelpers::requireCsrf()

declare(strict_types=1);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../core/UARPSGate.php';
require_once __DIR__ . '/../../config/db_connection.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$user = getCurrentUser();
$userId = (int)($user['id'] ?? 0);

switch ($method) {
    case 'GET':
        handleGetPermissions();
        break;
    case 'POST':
        UARPSGate::enforceTrigger($userId, 'gate:admin:permissions');
        AuthHelpers::requireCsrf();
        handleCreatePermission();
        break;
    case 'PUT':
    case 'PATCH':
        UARPSGate::enforceTrigger($userId, 'gate:admin:permissions');
        AuthHelpers::requireCsrf();
        handleUpdatePermission();
        break;
    case 'DELETE':
        UARPSGate::enforceTrigger($userId, 'gate:admin:permissions');
        AuthHelpers::requireCsrf();
        handleDeletePermission();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetPermissions(): void {
    $userId = $_GET['user_id'] ?? null;
    $roleId = $_GET['role_id'] ?? null;
    $resource = $_GET['resource'] ?? null;

    try {
        $pdo = getConnection('DSHOWDASH');

        if ($userId) {
            // ⚠️ 2026-07-30: este ramo consultava `app_user_permissions`, tabela que
            // NÃO EXISTE — devolvia 500 (`1146 Base table or view not found`).
            //
            // E não é caso de criar a tabela. Permissão POR USUÁRIO neste sistema é
            // UARPS: mora em `app_user_trigger_permissions`, chaveada por
            // `trigger_id` (allow/deny/inherit), e é o que o `UARPSGate` realmente
            // aplica. `app_permissions.id` não tem correspondência definida com
            // `trigger_id`, então NÃO dá para traduzir aqui sem inventar regra.
            //
            // Criar `app_user_permissions` seria pior que o 500: gravaria concessão
            // que NENHUM enforcement lê — a tela diria "concedido" e o acesso
            // continuaria negado. Falhar explicando é a única saída honesta.
            ApiResponse::error('UNSUPPORTED_QUERY', 409, [
                'message' => 'Permissão por usuário não é consultada por aqui. '
                           . 'O modelo em vigor é UARPS (app_user_trigger_permissions), '
                           . 'exposto em GET /api/permissions/uarps?action=user-permissions.',
                'motivo'  => 'app_user_permissions não existe e nada a aplica',
            ]);
            return;
        } elseif ($roleId) {
            // `app_role_permissions` NÃO tem coluna `granted` (conferido no banco):
            // a concessão é a EXISTÊNCIA da linha, e a revogação é `deleted_at`.
            // Selecionar `rp.granted` devolvia 500 (`1054 Unknown column`).
            $stmt = $pdo->prepare("
                SELECT
                    p.id,
                    p.permission_key,
                    p.permission_name,
                    p.resource,
                    p.action,
                    (rp.id IS NOT NULL) AS granted,
                    rp.created_at
                FROM app_permissions p
                LEFT JOIN app_role_permissions rp
                       ON p.id = rp.permission_id
                      AND rp.role_id = ?
                      AND rp.deleted_at IS NULL
                ORDER BY p.resource, p.action
            ");
            $stmt->execute([$roleId]);
        } else {
            $where = [];
            $params = [];

            if ($resource) {
                $where[] = "resource = ?";
                $params[] = $resource;
            }

            $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

            $stmt = $pdo->prepare("
                SELECT id, permission_key, permission_name, resource, action, description, created_at
                FROM app_permissions
                {$whereClause}
                ORDER BY resource, action
            ");
            $stmt->execute($params);
        }

        $permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($permissions as &$perm) {
            if (isset($perm['granted'])) {
                $perm['granted'] = (bool)$perm['granted'];
            }
        }

        ApiResponse::success(['permissions' => $permissions]);

    } catch (Exception $e) {
        error_log("Permissions GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleCreatePermission(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        ApiResponse::error('INVALID_INPUT', 400);
        return;
    }

    $permissionKey = $input['permission_key'] ?? null;
    $permissionName = $input['permission_name'] ?? null;
    $resource = $input['resource'] ?? null;
    $action = $input['action'] ?? null;

    if (!$permissionKey || !$permissionName || !$resource || !$action) {
        ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'permission_key, permission_name, resource e action são obrigatórios']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $checkStmt = $pdo->prepare("SELECT id FROM app_permissions WHERE permission_key = ?");
        $checkStmt->execute([$permissionKey]);

        if ($checkStmt->fetch()) {
            ApiResponse::error('PERMISSION_EXISTS', 409);
            return;
        }

        $stmt = $pdo->prepare("
            INSERT INTO app_permissions (permission_key, permission_name, resource, action, description, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");

        $stmt->execute([
            $permissionKey,
            $permissionName,
            $resource,
            $action,
            $input['description'] ?? null
        ]);

        ApiResponse::success([
            'message' => 'Permissão criada com sucesso',
            'permission_id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        error_log("Permissions POST error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUpdatePermission(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action_type'] ?? 'update';

    if ($action === 'grant' || $action === 'revoke') {
        $userId = $input['user_id'] ?? null;
        $roleId = $input['role_id'] ?? null;
        $permissionId = $input['permission_id'] ?? null;

        if (!$permissionId || (!$userId && !$roleId)) {
            ApiResponse::error('MISSING_FIELDS', 400);
            return;
        }

        try {
            $pdo = getConnection('DSHOWDASH');

            if ($userId) {
                // Mesma razão do ramo de leitura: `app_user_permissions` não existe
                // e concessão por usuário é UARPS. Gravar aqui — ainda que a tabela
                // fosse criada — produziria uma concessão que NENHUM gate lê. Um
                // "permissão concedida" na tela sem efeito nenhum no acesso é pior
                // do que um erro claro.
                ApiResponse::error('UNSUPPORTED_ACTION', 409, [
                    'message' => 'Concessão por usuário passa pelo UARPS, não por este endpoint. '
                               . 'Use os triggers em app_user_trigger_permissions.',
                    'motivo'  => 'app_user_permissions não existe e nenhum enforcement a lê',
                ]);
                return;
            } elseif ($roleId) {
                if ($action === 'grant') {
                    // Sem coluna `granted`: a concessão É a linha. O
                    // `ON DUPLICATE KEY` limpa o `deleted_at` para o caso de a
                    // permissão ter sido revogada antes — sem isso, reconceder
                    // não faria efeito e o INSERT passaria em silêncio.
                    $stmt = $pdo->prepare("
                        INSERT INTO app_role_permissions (role_id, permission_id, created_at)
                        VALUES (?, ?, NOW(3))
                        ON DUPLICATE KEY UPDATE deleted_at = NULL, updated_at = NOW(3)
                    ");
                    $stmt->execute([$roleId, $permissionId]);
                } else {
                    // Revogação é SOFT DELETE: a tabela tem `deleted_at` e o
                    // histórico de quem teve acesso é justamente o que se quer
                    // preservar numa tabela de permissão.
                    $stmt = $pdo->prepare("
                        UPDATE app_role_permissions
                           SET deleted_at = NOW(3), updated_at = NOW(3)
                         WHERE role_id = ? AND permission_id = ? AND deleted_at IS NULL
                    ");
                    $stmt->execute([$roleId, $permissionId]);
                }
            }

            ApiResponse::success(['message' => "Permissão {$action}ed com sucesso"]);

        } catch (Exception $e) {
            error_log("Permissions GRANT/REVOKE error: " . $e->getMessage());
            ApiResponse::error('DATABASE_ERROR', 500);
        }
        return;
    }

    $permissionId = $input['id'] ?? $_GET['id'] ?? null;

    if (!$permissionId) {
        ApiResponse::error('MISSING_PERMISSION_ID', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $updates = [];
        $params = [];

        if (isset($input['permission_name'])) {
            $updates[] = "permission_name = ?";
            $params[] = $input['permission_name'];
        }

        if (isset($input['description'])) {
            $updates[] = "description = ?";
            $params[] = $input['description'];
        }

        if (empty($updates)) {
            ApiResponse::error('NO_UPDATES', 400);
            return;
        }

        $params[] = $permissionId;

        $sql = "UPDATE app_permissions SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        ApiResponse::success(['message' => 'Permissão atualizada com sucesso']);

    } catch (Exception $e) {
        error_log("Permissions UPDATE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeletePermission(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $permissionId = $input['id'] ?? $_GET['id'] ?? null;

    if (!$permissionId) {
        ApiResponse::error('MISSING_PERMISSION_ID', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $pdo->beginTransaction();

        $pdo->prepare("DELETE FROM app_user_permissions WHERE permission_id = ?")->execute([$permissionId]);
        $pdo->prepare("DELETE FROM app_role_permissions WHERE permission_id = ?")->execute([$permissionId]);

        $stmt = $pdo->prepare("DELETE FROM app_permissions WHERE id = ?");
        $stmt->execute([$permissionId]);

        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            ApiResponse::error('PERMISSION_NOT_FOUND', 404);
            return;
        }

        $pdo->commit();

        ApiResponse::success(['message' => 'Permissão excluída com sucesso']);

    } catch (Exception $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Permissions DELETE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
