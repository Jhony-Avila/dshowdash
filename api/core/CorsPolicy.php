<?php
declare(strict_types=1);

// /api/core/CorsPolicy.php
// Política CORS centralizada - FONTE ÚNICA
// @version 2.0.0-ENTERPRISE
// @updated 2026-01-21
// P0.1 FIX: Unificação total de CORS

class CorsPolicy {
    
    // Origens permitidas (produção + desenvolvimento)
    private static array $allowedOrigins = [
        'https://dshowdash.com.br',
        'https://www.dshowdash.com.br',
        'https://test.dshowdash.com.br',
        'http://dshowdash.com.br',
        'http://www.dshowdash.com.br',
        'http://test.dshowdash.com.br',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080'
    ];
    
    // Regex para validação dinâmica (subdomínios)
    private static string $originPattern = '#^https?://([\w-]+\.)?dshowdash\.com\.br$#';
    
    // Headers padrão
    private static array $defaultHeaders = [
        'Content-Type',
        'Accept',
        'X-Requested-With',
        'X-CSRF-Token',
        'Authorization'
    ];
    
    // Métodos padrão
    private static array $defaultMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    
    // Verifica se origem é permitida
    public static function isAllowedOrigin(string $origin): bool {
        if (empty($origin)) {
            return false;
        }
        if (in_array($origin, self::$allowedOrigins, true)) {
            return true;
        }
        return (bool)preg_match(self::$originPattern, $origin);
    }
    
    // Aplica política CORS completa
    public static function apply(array $options = []): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if ($origin && self::isAllowedOrigin($origin)) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Credentials: true');
            header('Vary: Origin');
        }
        
        $methods = $options['methods'] ?? self::$defaultMethods;
        header('Access-Control-Allow-Methods: ' . implode(', ', $methods));
        
        $headers = $options['headers'] ?? self::$defaultHeaders;
        header('Access-Control-Allow-Headers: ' . implode(', ', $headers));
        
        $maxAge = $options['max_age'] ?? 86400;
        header("Access-Control-Max-Age: $maxAge");
    }
    
    // Aplica headers de segurança (apenas os NÃO cobertos pelo nginx)
    // X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, X-XSS-Protection
    // são gerenciados exclusivamente pelo nginx via security-headers.conf
    public static function applySecurityHeaders(): void {
        header('Cross-Origin-Resource-Policy: same-origin');
    }
    
    // Aplica headers de no-cache
    public static function applyNoCacheHeaders(): void {
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
    
    // Trata requisição OPTIONS (preflight)
    public static function handlePreflight(array $methods = null): void {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'OPTIONS') {
            return;
        }
        self::apply(['methods' => $methods ?? self::$defaultMethods]);
        http_response_code(204);
        exit;
    }
    
    // Setup completo para API endpoint
    public static function setupApiEndpoint(array $options = []): void {
        self::applySecurityHeaders();
        
        if ($options['no_cache'] ?? true) {
            self::applyNoCacheHeaders();
        }
        
        header('Content-Type: application/json; charset=utf-8');
        
        self::apply($options);
        
        self::handlePreflight($options['methods'] ?? null);
    }
    
    // Bloqueia origens não permitidas (modo estrito)
    public static function enforceStrict(): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin && !self::isAllowedOrigin($origin)) {
            require_once __DIR__ . '/../_helpers/ApiResponse.php';
            ApiResponse::error('CORS_BLOCKED', 403, [
                'message' => 'Origin not allowed',
                'origin' => $origin
            ]);
        }
    }
    
    // Info para diagnóstico
    public static function info(): array {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
        return [
            'version' => '2.0.0-ENTERPRISE',
            'allowed_origins' => self::$allowedOrigins,
            'origin_pattern' => self::$originPattern,
            'default_headers' => self::$defaultHeaders,
            'default_methods' => self::$defaultMethods,
            'current_origin' => $origin,
            'origin_allowed' => $origin ? self::isAllowedOrigin($origin) : null
        ];
    }
}

// Funções globais de compatibilidade (wrapper para CorsPolicy)
// Permite migração gradual de endpoints que usavam CorsHelper

function applyCors(bool $strict = false, bool $credentials = true): void {
    CorsPolicy::apply();
    if ($strict) {
        CorsPolicy::enforceStrict();
    }
}

function applyAdminCors(): void {
    CorsPolicy::apply();
    CorsPolicy::enforceStrict();
}

function applyPublicCors(): void {
    CorsPolicy::apply();
}
