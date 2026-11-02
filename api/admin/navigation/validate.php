<?php
// /api/admin/navigation/validate.php
// @version 3.0.1-ENTERPRISE
// P0.1: CORS centralizado via CorsPolicy
// P2.1: Migrado $userLevel check para UARPSGate::enforceTrigger()
// P2.1.1: Corrigido para usar trigger existente gate:admin:navigation

declare(strict_types=1);

require_once __DIR__ . '/../../../config/db_connection.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../core/CorsPolicy.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'OPTIONS'],
    'headers' => ['Content-Type', 'Authorization', 'X-CSRF-Token']
]);

header('Cache-Control: no-cache, no-store, must-revalidate');

const VERSION = '3.0.1-ENTERPRISE';
const UARPS_TRIGGER_NAV_READ = 'gate:admin:navigation';

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = getConnection('DSHOWDASH');
    }
    return $pdo;
}

// P2.1: Migrado de $userLevel >= MIN_LEVEL para UARPSGate::enforceTrigger()
function checkAuth(): array {
    $session = SessionGate::requireAuth();
    $userId = (int)($session['user_id'] ?? $session['id'] ?? 0);
    
    // P2.1: UARPS enforce para leitura de navegação
    if ($userId > 0) {
        UARPSGate::enforceTrigger($userId, UARPS_TRIGGER_NAV_READ, 'api/admin/navigation/validate');
    }
    
    return $session;
}

function validateRoute(string $route): array {
    $pdo = getDB();
    $routeClean = ltrim($route, '#/');
    $routeHash = '#/' . $routeClean;
    if ($routeClean === '') {
        $routeHash = '#/';
    }
    
    $result = [
        'route' => $route,
        'route_normalized' => $routeHash,
        'valid' => false,
        'checks' => [],
        'resolution' => null,
        'suggestions' => []
    ];
    
    $stmt = $pdo->prepare("SELECT * FROM app_nav_route WHERE route_hash = ? OR route_clean = ?");
    $stmt->execute([$routeHash, $routeClean]);
    $routeRecord = $stmt->fetch();
    
    $result['checks']['route_exists'] = [
        'passed' => (bool)$routeRecord,
        'message' => $routeRecord ? 'Rota encontrada no sistema' : 'Rota não cadastrada'
    ];
    
    if (!$routeRecord) {
        $stmt = $pdo->prepare("SELECT route_hash FROM app_nav_route WHERE route_hash LIKE ? LIMIT 5");
        $stmt->execute(['%' . $routeClean . '%']);
        $similar = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if ($similar) {
            $result['suggestions'][] = 'Rotas similares: ' . implode(', ', $similar);
        }
        return $result;
    }
    
    $result['checks']['route_active'] = [
        'passed' => (bool)$routeRecord['is_active'],
        'message' => $routeRecord['is_active'] ? 'Rota ativa' : 'Rota INATIVA'
    ];
    
    $stmt = $pdo->prepare("
        SELECT a.*, rev.destination_id, rev.layout 
        FROM app_nav_route_resolution_active a 
        JOIN app_nav_route_resolution_revision rev ON a.resolution_rev_id = rev.resolution_rev_id 
        WHERE a.route_id = ?
    ");
    $stmt->execute([$routeRecord['route_id']]);
    $resolution = $stmt->fetch();
    
    $result['checks']['has_resolution'] = [
        'passed' => (bool)$resolution,
        'message' => $resolution ? 'Resolução ativa encontrada' : 'SEM RESOLUÇÃO ATIVA'
    ];
    
    if (!$resolution) {
        $result['suggestions'][] = 'Esta rota precisa de uma resolução ativa';
        return $result;
    }
    
    $stmt = $pdo->prepare("SELECT * FROM app_nav_destination WHERE destination_id = ?");
    $stmt->execute([$resolution['destination_id']]);
    $destination = $stmt->fetch();
    
    $result['checks']['destination_exists'] = [
        'passed' => (bool)$destination,
        'message' => $destination ? "Destino: {$destination['destination_key']}" : 'DESTINO NÃO ENCONTRADO'
    ];
    
    if (!$destination) {
        $result['suggestions'][] = "Destino ID {$resolution['destination_id']} não existe";
        return $result;
    }
    
    $result['checks']['destination_active'] = [
        'passed' => (bool)$destination['is_active'],
        'message' => $destination['is_active'] ? 'Destino ativo' : 'DESTINO INATIVO'
    ];
    
    $result['resolution'] = [
        'route_id' => $routeRecord['route_id'],
        'route_hash' => $routeRecord['route_hash'],
        'destination_id' => $destination['destination_id'],
        'destination_key' => $destination['destination_key'],
        'destination_type' => $destination['destination_type'],
        'layout' => $resolution['layout'] ?? 'default'
    ];
    
    $allPassed = true;
    foreach ($result['checks'] as $check) {
        if (!$check['passed']) {
            $allPassed = false;
            break;
        }
    }
    $result['valid'] = $allPassed;
    
    return $result;
}

function getSummary(): array {
    $pdo = getDB();
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM sidebar_items WHERE is_deleted = 0 AND is_active = 1");
    $totalSidebarItems = $stmt->fetchColumn();
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM app_nav_route WHERE is_active = 1");
    $totalActiveRoutes = $stmt->fetchColumn();
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM app_nav_destination WHERE is_active = 1");
    $totalActiveDestinations = $stmt->fetchColumn();
    
    $stmt = $pdo->query("
        SELECT COUNT(*) FROM app_nav_route r 
        JOIN app_nav_route_resolution_active a ON r.route_id = a.route_id 
        WHERE r.is_active = 1
    ");
    $routesWithResolution = $stmt->fetchColumn();
    
    return [
        'version' => VERSION,
        'timestamp' => date('c'),
        'counts' => [
            'sidebar_items_active' => (int)$totalSidebarItems,
            'routes_active' => (int)$totalActiveRoutes,
            'routes_with_resolution' => (int)$routesWithResolution,
            'destinations_active' => (int)$totalActiveDestinations
        ],
        'quick_check' => [
            'all_routes_have_resolution' => $routesWithResolution == $totalActiveRoutes,
            'resolution_coverage' => $totalActiveRoutes > 0 
                ? round(($routesWithResolution / $totalActiveRoutes) * 100, 1) . '%' 
                : '100%'
        ],
        '_uarps' => [
            'trigger' => UARPS_TRIGGER_NAV_READ,
            'mode' => 'enforced',
            'version' => 'P2.1.1'
        ]
    ];
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'summary';

if ($method !== 'GET') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

try {
    // P2.1: Todas as ações agora passam por UARPS
    checkAuth();
    
    switch ($action) {
        case 'validate':
            $route = $_GET['route'] ?? null;
            if (!$route) {
                ApiResponse::error('ROUTE_REQUIRED', 400, ['message' => 'Parâmetro "route" obrigatório']);
            }
            ApiResponse::success(validateRoute(urldecode($route)), [
                '_uarps' => ['trigger' => UARPS_TRIGGER_NAV_READ, 'enforced' => true]
            ]);
            break;
            
        case 'summary':
            ApiResponse::success(getSummary());
            break;
            
        default:
            ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 400, ['action' => $action]);
    }
} catch (PDOException $e) {
    error_log("Navigation Validate API Error: " . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500);
} catch (Exception $e) {
    ApiResponse::exception($e);
}
