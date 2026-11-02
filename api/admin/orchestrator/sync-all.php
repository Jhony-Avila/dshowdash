<?php
// UI Orchestrator - Sync All Sources
// @version 1.3.0-ENTERPRISE - CSRF Protection
// @updated 2026-01-20
// P3.2: Adicionado validação CSRF
// P3.1: Migrado requireAdmin() para UARPSGate::enforceTrigger()

require_once __DIR__ . '/../../../config/db_connection.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../core/UARPSGate.php';

// P3.1: Verificação UARPS
// P3.4: Padronizado trigger para gate:admin:*
requireAuth();
$user = getCurrentUser();
UARPSGate::enforceTrigger((int)$user['id'], 'gate:admin:orchestrator');

// P3.2: Validação CSRF
requireCsrf();

function upsertTrigger($pdo, $data, $dryRun = false) {
    $existing = $pdo->prepare("SELECT id FROM ui_triggers WHERE trigger_key = ?");
    $existing->execute(array($data['trigger_key']));
    $row = $existing->fetch();
    
    if ($row) {
        if (!$dryRun) {
            $stmt = $pdo->prepare("
                UPDATE ui_triggers SET 
                    intent_id = ?, label = ?, icon_name = ?, 
                    is_active = COALESCE(is_active, 1), order_index = ?
                WHERE trigger_key = ?
            ");
            $stmt->execute(array(
                $data['intent_id'],
                isset($data['label']) ? $data['label'] : null,
                isset($data['icon_name']) ? $data['icon_name'] : null,
                isset($data['order_index']) ? $data['order_index'] : 0,
                $data['trigger_key']
            ));
        }
        return 'updated';
    } else {
        if (!$dryRun) {
            $stmt = $pdo->prepare("
                INSERT INTO ui_triggers (trigger_key, intent_id, component, label, icon_name, is_visible, is_active, order_index)
                VALUES (?, ?, ?, ?, ?, 1, 1, ?)
            ");
            $stmt->execute(array(
                $data['trigger_key'],
                $data['intent_id'],
                $data['component'],
                isset($data['label']) ? $data['label'] : null,
                isset($data['icon_name']) ? $data['icon_name'] : null,
                isset($data['order_index']) ? $data['order_index'] : 0
            ));
        }
        return 'created';
    }
}

function actionIdToIntentId($actionId) {
    $intent = str_replace(array(':', '-'), array('.', '.'), $actionId);
    return $intent;
}

function extractLabel($actionId) {
    $parts = explode(':', $actionId);
    $last = end($parts);
    return ucwords(str_replace(array('-', '_'), ' ', $last));
}

try {
    $pdo = getConnection('DSHOWDASH');
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = array();
    
    $dryRun = isset($input['dry_run']) ? $input['dry_run'] : false;
    $sources = isset($input['sources']) ? $input['sources'] : array('sidebar', 'bindings', 'keyboard');
    
    $results = array(
        'dry_run' => $dryRun,
        'sources' => $sources,
        'sidebar' => array('created' => 0, 'updated' => 0, 'items' => array()),
        'bindings' => array('created' => 0, 'updated' => 0, 'items' => array()),
        'keyboard' => array('created' => 0, 'updated' => 0, 'items' => array()),
        'totals' => array('created' => 0, 'updated' => 0, 'total' => 0)
    );
    
    // 1. SIDEBAR ITEMS
    if (in_array('sidebar', $sources)) {
        $stmt = $pdo->query("
            SELECT 
                si.item_key, si.label, si.icon_name, si.route_path, 
                si.panel_id, si.order_index, si.is_active,
                COALESCE(sg.group_key, 'main') as section
            FROM sidebar_items si
            LEFT JOIN sidebar_groups sg ON si.group_id = sg.id
            WHERE si.is_deleted = 0 AND si.is_divider = 0
            ORDER BY si.order_index
        ");
        
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $item) {
            $triggerKey = 'sidebar:' . $item['item_key'];
            $section = $item['section'];
            $prefix = ($section === 'administracao') ? 'nav.admin' : 'nav';
            $intentId = $prefix . '.' . str_replace('-', '.', $item['item_key']);
            
            $action = upsertTrigger($pdo, array(
                'trigger_key' => $triggerKey,
                'intent_id' => $intentId,
                'component' => 'sidebar',
                'label' => $item['label'],
                'icon_name' => $item['icon_name'],
                'order_index' => $item['order_index']
            ), $dryRun);
            
            $results['sidebar'][$action]++;
            $results['sidebar']['items'][] = array(
                'trigger_key' => $triggerKey,
                'intent_id' => $intentId,
                'label' => $item['label'],
                'action' => $action
            );
        }
    }
    
    // 2. ACTION BINDINGS
    if (in_array('bindings', $sources)) {
        $bindingsPath = __DIR__ . '/../../../public/components/main/domain/action-hub/action-bindings.js';
        
        if (file_exists($bindingsPath)) {
            $content = file_get_contents($bindingsPath);
            preg_match_all("/['\"]([a-z]+:[a-z0-9\\-:]+)['\"]:\\s*\\{/i", $content, $matches);
            
            $actionIds = isset($matches[1]) ? $matches[1] : array();
            $order = 0;
            
            foreach ($actionIds as $actionId) {
                if (strpos($actionId, 'sidebar:') === 0) continue;
                
                $parts = explode(':', $actionId);
                $component = $parts[0];
                
                $triggerKey = $actionId;
                $intentId = actionIdToIntentId($actionId);
                $label = extractLabel($actionId);
                
                $action = upsertTrigger($pdo, array(
                    'trigger_key' => $triggerKey,
                    'intent_id' => $intentId,
                    'component' => $component,
                    'label' => $label,
                    'icon_name' => null,
                    'order_index' => $order++
                ), $dryRun);
                
                $results['bindings'][$action]++;
                $results['bindings']['items'][] = array(
                    'trigger_key' => $triggerKey,
                    'intent_id' => $intentId,
                    'component' => $component,
                    'action' => $action
                );
            }
        }
    }
    
    // 3. KEYBOARD SHORTCUTS
    if (in_array('keyboard', $sources)) {
        $shortcuts = array(
            array('key' => 'ctrl+k', 'intent' => 'header.search', 'label' => 'Busca Rápida'),
            array('key' => 'ctrl+/', 'intent' => 'global.shortcuts', 'label' => 'Atalhos'),
            array('key' => 'ctrl+shift+n', 'intent' => 'header.notifications', 'label' => 'Notificações'),
            array('key' => 'ctrl+h', 'intent' => 'nav.home', 'label' => 'Ir para Home'),
            array('key' => 'ctrl+shift+f', 'intent' => 'global.fullscreen', 'label' => 'Tela Cheia'),
            array('key' => 'ctrl+shift+r', 'intent' => 'global.refresh', 'label' => 'Atualizar'),
            array('key' => 'escape', 'intent' => 'global.close.modal', 'label' => 'Fechar Modal'),
            array('key' => 'ctrl+,', 'intent' => 'header.settings', 'label' => 'Configurações'),
            array('key' => 'ctrl+shift+p', 'intent' => 'header.profile', 'label' => 'Meu Perfil'),
            array('key' => 'ctrl+shift+l', 'intent' => 'header.logout', 'label' => 'Sair')
        );
        
        $order = 0;
        foreach ($shortcuts as $sc) {
            $triggerKey = 'keyboard:' . $sc['key'];
            
            $action = upsertTrigger($pdo, array(
                'trigger_key' => $triggerKey,
                'intent_id' => $sc['intent'],
                'component' => 'keyboard',
                'label' => $sc['label'],
                'icon_name' => 'keyboard',
                'order_index' => $order++
            ), $dryRun);
            
            $results['keyboard'][$action]++;
            $results['keyboard']['items'][] = array(
                'trigger_key' => $triggerKey,
                'intent_id' => $sc['intent'],
                'label' => $sc['label'],
                'action' => $action
            );
        }
    }
    
    // Calcular totais
    $results['totals']['created'] = $results['sidebar']['created'] + $results['bindings']['created'] + $results['keyboard']['created'];
    $results['totals']['updated'] = $results['sidebar']['updated'] + $results['bindings']['updated'] + $results['keyboard']['updated'];
    $results['totals']['total'] = $results['totals']['created'] + $results['totals']['updated'];
    
    // Log de auditoria
    if (!$dryRun) {
        $stmt = $pdo->prepare("
            INSERT INTO ui_orchestrator_audit (action, entity_type, entity_id, after_state, ip_address)
            VALUES ('sync_all', 'trigger', 0, ?, ?)
        ");
        $stmt->execute(array(
            json_encode(array('sync_all' => $results['totals'])),
            isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : null
        ));
    }
    
    ApiResponse::success($results);
    
} catch (PDOException $e) {
    error_log("Sync-all API Error: " . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, array('message' => 'Erro interno'));
} catch (Exception $e) {
    ApiResponse::exception($e);
}
