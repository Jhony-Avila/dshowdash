<?php
// CookieParamsFactory - Factory para parâmetros de cookie
// @version 1.0.0-ENTERPRISE
// @created 2026-01-25
// #3: Factory pattern para criação de parâmetros de cookie

declare(strict_types=1);

class CookieParamsFactory
{
    private const DEFAULT_LIFETIME = 604800;
    private const DEFAULT_PATH = '/';
    private const DEFAULT_SAMESITE = 'Lax';
    
    // Cria parâmetros para cookie de sessão
    public static function createSessionParams(): array
    {
        // Delega para _cookie_params.php se existir
        $cookieParamsFile = __DIR__ . '/../auth/_cookie_params.php';
        
        if (file_exists($cookieParamsFile)) {
            require_once $cookieParamsFile;
            if (function_exists('getSessionCookieParams')) {
                return getSessionCookieParams();
            }
        }
        
        return self::createDefault();
    }
    
    // Cria parâmetros padrão
    public static function createDefault(): array
    {
        return [
            'lifetime' => self::DEFAULT_LIFETIME,
            'path' => self::DEFAULT_PATH,
            'domain' => self::detectDomain(),
            'secure' => self::detectSecure(),
            'httponly' => true,
            'samesite' => self::DEFAULT_SAMESITE
        ];
    }
    
    // Cria parâmetros para cookie de expiração (logout)
    public static function createExpiredParams(): array
    {
        $params = self::createSessionParams();
        $params['lifetime'] = -42000;
        return $params;
    }
    
    // Cria parâmetros customizados
    public static function create(array $overrides = []): array
    {
        $defaults = self::createDefault();
        return array_merge($defaults, $overrides);
    }
    
    // Detecta se conexão é segura
    private static function detectSecure(): bool
    {
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            return true;
        }
        if (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443) {
            return true;
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') {
            return true;
        }
        if (!empty($_SERVER['HTTP_CF_VISITOR'])) {
            $cfv = json_decode($_SERVER['HTTP_CF_VISITOR'], true);
            if (isset($cfv['scheme']) && strtolower($cfv['scheme']) === 'https') {
                return true;
            }
        }
        return true; // Default secure em produção
    }
    
    // Detecta domínio do cookie
    private static function detectDomain(): string
    {
        $host = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? '');
        $host = strtolower(trim($host));
        
        if (empty($host)) {
            return '';
        }
        
        // Remove porta se presente
        if (strpos($host, ':') !== false) {
            $host = explode(':', $host, 2)[0];
        }
        
        // Não definir domínio para IPs
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return '';
        }
        
        // Produção - apex domain
        if ($host === 'dshowdash.com.br' || 
            $host === 'www.dshowdash.com.br' || 
            str_ends_with($host, '.dshowdash.com.br')) {
            return '.dshowdash.com.br';
        }
        
        return '';
    }
    
    // Info para diagnóstico
    public static function info(): array
    {
        return [
            'version' => '1.0.0-ENTERPRISE',
            'detected_secure' => self::detectSecure(),
            'detected_domain' => self::detectDomain(),
            'default_lifetime' => self::DEFAULT_LIFETIME,
            'default_samesite' => self::DEFAULT_SAMESITE
        ];
    }
}
