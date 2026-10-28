<?php
declare(strict_types=1);

// /api/core/UARPSEnforcer.php
// UARPS Enforcer - Validador que BLOQUEIA requisições não autorizadas
// @version 1.0.0-ENTERPRISE
// @created 2026-01-21
// @phase P2 (Enforced Mode)
//
// PROPÓSITO:
// - Substitui verificações de nível por verificações UARPS
// - Bloqueia requisições quando UARPS nega acesso
// - Usado em endpoints que requerem permissões específicas

require_once __DIR__ . '/UARPSGate.php';
require_once __DIR__ . '/../../config/uarps.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

class UARPSEnforcer {
    
    // Verifica e bloqueia se region não permitida
    public static function requireRegion(int $userId, string $regionId): bool {
        // Se não está em modo enforced, permite tudo (fallback para legacy)
        if (!UARPSConfig::shouldEnforce()) {
            return true;
        }
        
        $result = UARPSGate::checkRegion($userId, $regionId);
        
        if (!$result['allowed']) {
            self::denyAccess('UARPS_REGION_DENIED', $regionId, $result);
        }
        
        return true;
    }
    
    // Verifica e bloqueia se trigger não permitido
    public static function requireTrigger(int $userId, string $triggerId): bool {
        // Se não está em modo enforced, permite tudo (fallback para legacy)
        if (!UARPSConfig::shouldEnforce()) {
            return true;
        }
        
        $result = UARPSGate::checkTrigger($userId, $triggerId);
        
        if (!$result['allowed']) {
            self::denyAccess('UARPS_TRIGGER_DENIED', $triggerId, $result);
        }
        
        return true;
    }
    
    // Verifica region baseado no endpoint atual (auto-detect)
    public static function enforceCurrentEndpoint(int $userId): bool {
        // Se não está em modo enforced, permite tudo
        if (!UARPSConfig::shouldEnforce()) {
            return true;
        }
        
        $regionId = self::inferRegionFromEndpoint();
        
        if (!$regionId) {
            // Sem region mapeada = permite (fallback seguro)
            return true;
        }
        
        return self::requireRegion($userId, $regionId);
    }
    
    // Infere region baseado no endpoint atual
    private static function inferRegionFromEndpoint(): ?string {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        $path = parse_url($uri, PHP_URL_PATH) ?? $uri;
        
        // Mapeamento de endpoints para regions
        $mappings = [
            '/api/permissions/uarps.php' => 'region:panel:permissions-admin',
            '/api/permissions/index.php' => 'region:panel:permissions-admin',
            '/api/permissions/' => 'region:panel:permissions-admin',
            '/api/users/' => 'region:panel:user-management',
            '/api/sessions/' => 'region:panel:session-admin',
            '/api/settings/' => 'region:panel:user-preferences',
            '/api/feature-flags/' => 'region:panel:feature-flags-admin',
            '/api/admin/orchestrator/' => 'region:panel:orchestrator',
            '/api/health/' => 'region:panel:health-dashboard',
            '/api/audit/' => 'region:panel:audit-trail',
            '/api/uarps-status.php' => 'region:panel:uarps-monitor',
            '/api/ui/header/' => 'region:app:header',
            '/api/ui/sidebar/' => 'region:app:sidebar',
            '/api/ui/navrail/' => 'region:app:sidebar',
            '/api/ui/footer/' => 'region:app:footer',
        ];
        
        foreach ($mappings as $pattern => $regionId) {
            if (strpos($path, $pattern) !== false) {
                return $regionId;
            }
        }
        
        return null;
    }
    
    // Nega acesso e retorna erro
    private static function denyAccess(string $errorCode, string $entityId, array $result): void {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        // Log da negação
        error_log(sprintf(
            "UARPS DENIED: %s | Entity: %s | User: %d | State: %s | IP: %s | Endpoint: %s",
            $errorCode,
            $entityId,
            $result['user_id'] ?? 0,
            $result['state'] ?? 'unknown',
            $ip,
            $_SERVER['REQUEST_URI'] ?? 'unknown'
        ));
        
        // Retorna erro via ApiResponse
        ApiResponse::error($errorCode, 403, [
            'message' => 'Acesso negado pelo sistema UARPS',
            'entity_id' => $entityId,
            'state' => $result['state'] ?? 'deny',
            'uarps_mode' => 'enforced'
        ]);
    }
    
    // Verifica se usuário tem acesso a uma lista de regions (OR - qualquer uma)
    public static function requireAnyRegion(int $userId, array $regionIds): bool {
        if (!UARPSConfig::shouldEnforce()) {
            return true;
        }
        
        foreach ($regionIds as $regionId) {
            $result = UARPSGate::checkRegion($userId, $regionId);
            if ($result['allowed']) {
                return true;
            }
        }
        
        // Nenhuma region permitida
        self::denyAccess('UARPS_NO_REGION_ACCESS', implode(',', $regionIds), ['user_id' => $userId, 'state' => 'deny']);
        return false;
    }
    
    // Verifica se usuário tem acesso a todas as regions (AND)
    public static function requireAllRegions(int $userId, array $regionIds): bool {
        if (!UARPSConfig::shouldEnforce()) {
            return true;
        }
        
        foreach ($regionIds as $regionId) {
            $result = UARPSGate::checkRegion($userId, $regionId);
            if (!$result['allowed']) {
                self::denyAccess('UARPS_REGION_DENIED', $regionId, $result);
                return false;
            }
        }
        
        return true;
    }
    
    // Health check
    public static function healthCheck(): array {
        return [
            'status' => 'READY',
            'mode' => UARPSConfig::getMode(),
            'enforcing' => UARPSConfig::shouldEnforce(),
            'version' => '1.0.0-ENTERPRISE',
            'timestamp' => date('c')
        ];
    }
    
    // Info
    public static function info(): array {
        return [
            'version' => '1.0.0-ENTERPRISE',
            'phase' => 'P2 (Enforced Mode)',
            'purpose' => 'Block unauthorized requests based on UARPS permissions',
            'mode' => UARPSConfig::getMode(),
            'enforcing' => UARPSConfig::shouldEnforce(),
            'health' => self::healthCheck()
        ];
    }
}
