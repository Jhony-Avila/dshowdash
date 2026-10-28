<?php
// API: Feature Flags Management
// @version 2.2.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - P0.1 FIX: Migrado requireAdmin() para UARPSGate::enforceTrigger()
// v2.2.0: Migrado para UARPSGate + getConnection() centralizado
// @updated 2026-07-20 - v2.3.0 FIX CRITICO: o endpoint consultava as colunas
//   `flag_value` e `is_active`, que NAO EXISTEM em app_feature_flags. As reais sao
//   `payload_json` e `is_enabled`. Todo GET estourava DATABASE_ERROR (500).
//   Adicionado: environment, starts_at/ends_at, rollout determinístico e override
//   por usuario (app_user_feature_flags). Ver api/feature-flags/resolver.php.

declare(strict_types=1);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../core/UARPSGate.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/resolver.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

$user = getCurrentUser();
$userId = (int)($user['id'] ?? 0);

$method = $_SERVER['REQUEST_METHOD'];

$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        // action=check|resolve devolve a DECISAO da flag (com precedencia completa).
        // Sem action, mantem o comportamento historico de listagem.
        if ($action === 'check' || $action === 'resolve') {
            handleResolveFlag($userId);
        } else {
            handleGetFlags();
        }
        break;
    case 'POST':
    case 'PUT':
    case 'PATCH':
        UARPSGate::enforceTrigger($userId, 'gate:admin:feature-flags');
        AuthHelpers::requireCsrf();
        handleUpdateFlag();
        break;
    case 'DELETE':
        UARPSGate::enforceTrigger($userId, 'gate:admin:feature-flags');
        AuthHelpers::requireCsrf();
        handleDeleteFlag();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetFlags(): void {
    $flagKey = $_GET['key'] ?? $_GET['flag'] ?? null;
    $includeInactive = ($_GET['include_inactive'] ?? 'false') === 'true';

    // COLUNAS REAIS de app_feature_flags. `flag_value` e `is_active` nunca existiram.
    $cols = 'id, flag_key, flag_name, description, is_enabled, rollout_percentage,
             payload_json, environment, starts_at, ends_at, created_at, updated_at';

    try {
        $pdo = getConnection('DSHOWDASH');

        if ($flagKey) {
            $stmt = $pdo->prepare("SELECT {$cols} FROM app_feature_flags
                                    WHERE flag_key = ? AND deleted_at IS NULL LIMIT 1");
            $stmt->execute([$flagKey]);
            $flag = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$flag) {
                ApiResponse::error('FLAG_NOT_FOUND', 404);
                return;
            }
            ApiResponse::success(['flag' => normalizeFlagRow($flag)]);
            return;
        }

        $where = $includeInactive ? 'WHERE deleted_at IS NULL'
                                  : 'WHERE deleted_at IS NULL AND is_enabled = 1';

        $stmt = $pdo->query("SELECT {$cols} FROM app_feature_flags {$where} ORDER BY flag_key ASC");
        $flags = array_map('normalizeFlagRow', $stmt->fetchAll(PDO::FETCH_ASSOC));

        ApiResponse::success(['flags' => $flags]);

    } catch (Exception $e) {
        error_log("FeatureFlags GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

/**
 * GET ?action=check&flag=<key> — decisao resolvida da flag para o usuario atual.
 * Contrato estavel: {flag:{key,enabled,source,environment,rollout_percentage,
 * payload,starts_at,ends_at}}. `source` torna a decisao rastreavel.
 */
function handleResolveFlag(int $userId): void {
    $flagKey = $_GET['flag'] ?? $_GET['key'] ?? null;

    if (!$flagKey) {
        ApiResponse::error('MISSING_FLAG_KEY', 400, ['message' => 'flag_key e obrigatorio']);
        return;
    }

    try {
        $resolver = new FeatureFlagResolver(getConnection('DSHOWDASH'));
        $flag = $resolver->resolve((string)$flagKey, $userId > 0 ? $userId : null);

        ApiResponse::success(['flag' => $flag], [
            'environment' => FeatureFlagResolver::detectEnvironment(),
            'timestamp'   => date('c'),
        ]);
    } catch (Throwable $e) {
        error_log("FeatureFlags resolve error: " . $e->getMessage());
        // Falha de resolucao NAO pode virar 500 e derrubar o boot do consumidor:
        // devolve a flag desligada, com a origem rastreavel.
        ApiResponse::success(['flag' => [
            'key' => (string)$flagKey, 'enabled' => false, 'source' => 'error',
            'environment' => null, 'rollout_percentage' => null,
            'payload' => [], 'starts_at' => null, 'ends_at' => null,
        ]]);
    }
}

/** Tipos corretos + payload decodificado com seguranca. */
function normalizeFlagRow(array $flag): array {
    $flag['is_enabled'] = (bool)($flag['is_enabled'] ?? false);
    $flag['rollout_percentage'] = $flag['rollout_percentage'] !== null
        ? (int)$flag['rollout_percentage'] : 100;
    $flag['payload'] = FeatureFlagResolver::decodePayload(
        $flag['payload_json'] ?? null, (string)($flag['flag_key'] ?? '')
    );
    unset($flag['payload_json']);
    return $flag;
}

function handleUpdateFlag(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        ApiResponse::error('INVALID_INPUT', 400);
        return;
    }

    $flagKey = $input['flag_key'] ?? null;

    if (!$flagKey) {
        ApiResponse::error('MISSING_FLAG_KEY', 400, ['message' => 'flag_key é obrigatório']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        // Aceita `payload_json` (nome real) e tolera `flag_value` (nome antigo que
        // o endpoint usava) para nao quebrar consumidor que ainda envie o legado.
        $raw = $input['payload_json'] ?? $input['payload'] ?? $input['flag_value'] ?? null;
        $payloadJson = $raw === null
            ? null
            : (is_array($raw) ? json_encode($raw, JSON_UNESCAPED_UNICODE) : (string)$raw);

        // Idem para o booleano: a coluna e `is_enabled`; `is_active` era o nome errado.
        $isEnabled = null;
        foreach (['is_enabled', 'is_active'] as $k) {
            if (isset($input[$k])) { $isEnabled = (int)((bool)$input[$k]); break; }
        }

        // `environment` precisa respeitar o enum — valor invalido viraria erro de
        // truncamento no MySQL em vez de mensagem util.
        $environment = $input['environment'] ?? null;
        if ($environment !== null && !in_array($environment, FeatureFlagResolver::ENVIRONMENTS, true)) {
            ApiResponse::error('INVALID_ENVIRONMENT', 400, [
                'message' => 'environment deve ser: ' . implode(', ', FeatureFlagResolver::ENVIRONMENTS),
            ]);
            return;
        }

        $stmt = $pdo->prepare("
            INSERT INTO app_feature_flags
                (flag_key, flag_name, description, is_enabled, rollout_percentage,
                 payload_json, environment, starts_at, ends_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
            ON DUPLICATE KEY UPDATE
                flag_name          = COALESCE(VALUES(flag_name), flag_name),
                description        = COALESCE(VALUES(description), description),
                is_enabled         = COALESCE(VALUES(is_enabled), is_enabled),
                rollout_percentage = COALESCE(VALUES(rollout_percentage), rollout_percentage),
                payload_json       = COALESCE(VALUES(payload_json), payload_json),
                environment        = COALESCE(VALUES(environment), environment),
                starts_at          = VALUES(starts_at),
                ends_at            = VALUES(ends_at),
                deleted_at         = NULL,
                updated_at         = NOW(3)
        ");

        $stmt->execute([
            $flagKey,
            $input['flag_name'] ?? $flagKey,
            $input['description'] ?? null,
            $isEnabled,
            isset($input['rollout_percentage']) ? (int)$input['rollout_percentage'] : 100,
            $payloadJson,
            $environment,
            $input['starts_at'] ?? null,
            $input['ends_at'] ?? null,
        ]);

        ApiResponse::success([
            'message' => 'Flag atualizada com sucesso',
            'flag_key' => $flagKey
        ]);

    } catch (Exception $e) {
        error_log("FeatureFlags UPDATE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeleteFlag(): void {
    $input = json_decode(file_get_contents('php://input'), true);
    $flagKey = $input['flag_key'] ?? $_GET['key'] ?? null;

    if (!$flagKey) {
        ApiResponse::error('MISSING_FLAG_KEY', 400);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("DELETE FROM app_feature_flags WHERE flag_key = ?");
        $stmt->execute([$flagKey]);

        if ($stmt->rowCount() === 0) {
            ApiResponse::error('FLAG_NOT_FOUND', 404);
            return;
        }

        ApiResponse::success([
            'message' => 'Flag excluída com sucesso',
            'flag_key' => $flagKey
        ]);

    } catch (Exception $e) {
        error_log("FeatureFlags DELETE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
