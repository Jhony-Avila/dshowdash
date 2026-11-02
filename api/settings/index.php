<?php
declare(strict_types=1);

// /api/settings/index.php
// API de Configurações Globais do Sistema
// @version 2.5.0-FIX-REDECLARE
// @updated 2026-02-06
// v2.5.0: Removida getClientIp() local — usa versão canônica do AuthHelpers.php (fix Fatal Error: Cannot redeclare)
// P3.4: Migrado auditLog() manual para AuditLogger centralizado
// P3.3: Migrado para padrão _init.php (CorsPolicy + RedisHelper + InputValidator)
// P3.2: Adicionado InputValidator para validação de entrada
// P3.1: Migrado requireAdmin/requireSuperAdmin para UARPSGate::enforceTrigger()

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/UARPSGate.php';
require_once __DIR__ . '/../core/AuditLogger.php';

$method = $_SERVER['REQUEST_METHOD'];

// P3.2: InputValidator para parâmetros GET
$input = InputValidator::fromGet();
$allowedActions = ['list', 'get', 'categories', 'public', 'create', 'update', 'bulk-update', 'delete'];
$action = $input->enum('action', 'list', $allowedActions);

// P3.1: Funções UARPS
// P3.4: Padronizado triggers para gate:admin:*
function enforceSettingsAdmin(int $userId): void {
    UARPSGate::enforceTrigger($userId, 'gate:admin:settings');
}

function enforceSettingsSuperAdmin(int $userId): void {
    UARPSGate::enforceTrigger($userId, 'gate:admin:settings:super');
}

// v2.5.0: getClientIp() removida — função canônica fornecida por AuthHelpers.php (require_once acima)

try {
    $pdo = getConnection('DSHOWDASH');
} catch (Exception $e) {
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503);
}

// GET REQUESTS
if ($method === 'GET') {
    
    if ($action === 'list') {
        requireAuth();
        // P3.2: InputValidator para category
        $category = $input->string('category', '', ['maxLength' => 50]);
        $category = $category ?: null;
        
        $sql = "SELECT id, setting_key, setting_value, setting_type, category, description, is_system, updated_at 
                FROM app_settings WHERE deleted_at IS NULL";
        $params = [];
        
        if ($category) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }
        
        $sql .= " ORDER BY category, setting_key";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $settings = $stmt->fetchAll();
        
        foreach ($settings as &$s) {
            $s['setting_value'] = match($s['setting_type']) {
                'number' => (int)$s['setting_value'],
                'boolean' => $s['setting_value'] === 'true' || $s['setting_value'] === '1',
                'json' => json_decode($s['setting_value'], true),
                default => $s['setting_value']
            };
            $s['is_system'] = (bool)$s['is_system'];
        }
        
        ApiResponse::success($settings, ['count' => count($settings)]);
    }
    
    if ($action === 'get') {
        requireAuth();
        // P3.2: InputValidator para key
        $key = $input->string('key', '', ['maxLength' => 100]);

        if (!$key) {
            ApiResponse::error('KEY_REQUIRED', 400, ['message' => 'Parâmetro key obrigatório']);
        }
        
        $stmt = $pdo->prepare("SELECT * FROM app_settings WHERE setting_key = ? AND deleted_at IS NULL");
        $stmt->execute([$key]);
        $setting = $stmt->fetch();
        
        if (!$setting) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Setting não encontrado']);
        }
        
        $setting['setting_value'] = match($setting['setting_type']) {
            'number' => (int)$setting['setting_value'],
            'boolean' => $setting['setting_value'] === 'true' || $setting['setting_value'] === '1',
            'json' => json_decode($setting['setting_value'], true),
            default => $setting['setting_value']
        };
        
        ApiResponse::success($setting);
    }
    
    if ($action === 'categories') {
        requireAuth();
        $stmt = $pdo->query("SELECT DISTINCT category, COUNT(*) as count FROM app_settings WHERE deleted_at IS NULL GROUP BY category ORDER BY category");
        $categories = $stmt->fetchAll();
        ApiResponse::success($categories);
    }
    
    if ($action === 'public') {
        $stmt = $pdo->query("
            SELECT setting_key, setting_value, setting_type 
            FROM app_settings 
            WHERE setting_key IN ('app.name', 'app.version', 'ui.theme', 'app.locale')
              AND deleted_at IS NULL
        ");
        $settings = [];
        foreach ($stmt->fetchAll() as $s) {
            $value = match($s['setting_type']) {
                'number' => (int)$s['setting_value'],
                'boolean' => $s['setting_value'] === 'true' || $s['setting_value'] === '1',
                'json' => json_decode($s['setting_value'], true),
                default => $s['setting_value']
            };
            $settings[$s['setting_key']] = $value;
        }
        ApiResponse::success($settings);
    }
    
    ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 400, ['action' => $action]);
}

// POST REQUESTS
if ($method === 'POST') {
    requireAuth();
    $user = getCurrentUser();
    enforceSettingsSuperAdmin((int)$user['id']);
    requireCsrf();

    // P3.2: InputValidator para body JSON
    $body = InputValidator::fromJson();
    $bodyData = json_decode(file_get_contents('php://input'), true);

    if ($action === 'create') {
        $key = $body->string('setting_key', '', ['required' => true, 'maxLength' => 100]);
        $value = $bodyData['setting_value'] ?? null;
        $type = $body->enum('setting_type', 'string', ['string', 'number', 'boolean', 'json']);
        $category = $body->string('category', 'general', ['maxLength' => 50]);
        $description = $body->string('description', '', ['maxLength' => 500]);
        $description = $description ?: null;

        // Validação de erros
        if ($body->hasErrors()) {
            ApiResponse::error('VALIDATION_ERROR', 400, ['details' => $body->getErrors()]);
        }

        if (!$key) {
            ApiResponse::error('KEY_REQUIRED', 400, ['message' => 'setting_key obrigatório']);
        }
        
        $stmt = $pdo->prepare("SELECT id FROM app_settings WHERE setting_key = ?");
        $stmt->execute([$key]);
        if ($stmt->fetch()) {
            ApiResponse::error('SETTING_ALREADY_EXISTS', 409, ['message' => 'Setting já existe']);
        }
        
        $valueStr = match($type) {
            'boolean' => $value ? 'true' : 'false',
            'json' => json_encode($value),
            default => (string)$value
        };
        
        $stmt = $pdo->prepare("
            INSERT INTO app_settings (setting_key, setting_value, setting_type, category, description, ip_user)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$key, $valueStr, $type, $category, $description, getClientIp()]);

        AuditLogger::log($pdo, (int)$user['id'], AuditLogger::EVENT_SETTING_UPDATED, 'setting', $key, null, [
            'setting_key' => $key,
            'setting_value' => $valueStr,
            'setting_type' => $type,
            'category' => $category
        ], ['action' => 'created']);

        ApiResponse::success(['id' => $pdo->lastInsertId()], ['message' => 'Setting criado']);
    }
    
    if ($action === 'bulk-update') {
        $settings = $bodyData['settings'] ?? [];

        if (empty($settings)) {
            ApiResponse::error('SETTINGS_REQUIRED', 400, ['message' => 'settings obrigatório']);
        }
        
        $pdo->beginTransaction();
        try {
            $updated = 0;
            foreach ($settings as $key => $value) {
                $stmt = $pdo->prepare("SELECT id, setting_value, setting_type, is_system FROM app_settings WHERE setting_key = ? AND deleted_at IS NULL");
                $stmt->execute([$key]);
                $current = $stmt->fetch();
                
                if (!$current) continue;
                
                $valueStr = match($current['setting_type']) {
                    'boolean' => $value ? 'true' : 'false',
                    'json' => json_encode($value),
                    default => (string)$value
                };
                
                $stmt = $pdo->prepare("UPDATE app_settings SET setting_value = ?, ip_user = ? WHERE setting_key = ?");
                $stmt->execute([$valueStr, getClientIp(), $key]);

                AuditLogger::log($pdo, (int)$user['id'], AuditLogger::EVENT_SETTING_UPDATED, 'setting', $key,
                    ['setting_value' => $current['setting_value']],
                    ['setting_value' => $valueStr],
                    ['action' => 'bulk_updated']
                );
                $updated++;
            }
            
            $pdo->commit();
            ApiResponse::success(null, ['updated' => $updated]);
        } catch (Exception $e) {
            $pdo->rollBack();
            ApiResponse::error('UPDATE_FAILED', 500, ['message' => 'Erro interno']);
        }
    }
    
    ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 400, ['action' => $action]);
}

// PUT REQUESTS
if ($method === 'PUT') {
    requireAuth();
    $user = getCurrentUser();
    enforceSettingsAdmin((int)$user['id']);
    requireCsrf();

    // P3.2: InputValidator para body JSON
    $body = InputValidator::fromJson();
    $bodyData = json_decode(file_get_contents('php://input'), true);

    if ($action === 'update') {
        $key = $body->string('setting_key', '', ['maxLength' => 100]) ?: $input->string('key', '', ['maxLength' => 100]);
        $value = $bodyData['setting_value'] ?? null;

        if (!$key) {
            ApiResponse::error('KEY_REQUIRED', 400, ['message' => 'setting_key obrigatório']);
        }
        
        $stmt = $pdo->prepare("SELECT * FROM app_settings WHERE setting_key = ? AND deleted_at IS NULL");
        $stmt->execute([$key]);
        $current = $stmt->fetch();
        
        if (!$current) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Setting não encontrado']);
        }
        
        // P3.1: System settings requerem super-admin via UARPS
        if ($current['is_system']) {
            enforceSettingsSuperAdmin((int)$user['id']);
        }
        
        $valueStr = match($current['setting_type']) {
            'boolean' => $value ? 'true' : 'false',
            'json' => json_encode($value),
            default => (string)$value
        };
        
        $stmt = $pdo->prepare("UPDATE app_settings SET setting_value = ?, ip_user = ? WHERE setting_key = ?");
        $stmt->execute([$valueStr, getClientIp(), $key]);

        AuditLogger::log($pdo, (int)$user['id'], AuditLogger::EVENT_SETTING_UPDATED, 'setting', $key,
            ['setting_value' => $current['setting_value']],
            ['setting_value' => $valueStr]
        );

        ApiResponse::success(null, ['message' => 'Setting atualizado']);
    }
    
    ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 400, ['action' => $action]);
}

// DELETE REQUESTS
if ($method === 'DELETE') {
    requireAuth();
    $user = getCurrentUser();
    enforceSettingsSuperAdmin((int)$user['id']);
    requireCsrf();

    if ($action === 'delete') {
        // P3.2: InputValidator para key
        $key = $input->string('key', '', ['maxLength' => 100]);

        if (!$key) {
            ApiResponse::error('KEY_REQUIRED', 400, ['message' => 'Parâmetro key obrigatório']);
        }
        
        $stmt = $pdo->prepare("SELECT * FROM app_settings WHERE setting_key = ? AND deleted_at IS NULL");
        $stmt->execute([$key]);
        $current = $stmt->fetch();
        
        if (!$current) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Setting não encontrado']);
        }
        
        if ($current['is_system']) {
            ApiResponse::error('CANNOT_DELETE_SYSTEM_SETTING', 403, ['message' => 'Não é possível deletar setting de sistema']);
        }
        
        $stmt = $pdo->prepare("UPDATE app_settings SET deleted_at = NOW(3), ip_user = ? WHERE setting_key = ?");
        $stmt->execute([getClientIp(), $key]);

        AuditLogger::log($pdo, (int)$user['id'], AuditLogger::EVENT_SETTING_UPDATED, 'setting', $key,
            ['setting_value' => $current['setting_value'], 'setting_type' => $current['setting_type']],
            null,
            ['action' => 'deleted']
        );

        ApiResponse::success(null, ['message' => 'Setting removido']);
    }
    
    ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 400, ['action' => $action]);
}

ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
