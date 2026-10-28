<?php
// LoggerTrait - Logging estruturado JSON
// @version 2.1.0-ENTERPRISE
// @created 2026-01-25
// @updated 2026-01-25
// v2.1.0: Métodos públicos para uso externo
// v2.0.0: Corrigido para funcionar como trait
// #17: Padronização de logs em formato JSON

declare(strict_types=1);

trait LoggerTrait
{
    public static function logJson(string $level, string $component, string $event, array $context = []): void
    {
        $logData = [
            'timestamp' => date('c'),
            'level' => $level,
            'component' => $component,
            'event' => $event,
            'ip' => self::extractLogClientIp(),
            'user_id' => $context['user_id'] ?? null,
            'request_id' => $context['request_id'] ?? null,
            'context' => array_diff_key($context, array_flip(['user_id', 'request_id']))
        ];
        
        error_log(json_encode($logData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }
    
    public static function logInfo(string $component, string $event, array $context = []): void
    {
        self::logJson('info', $component, $event, $context);
    }
    
    public static function logWarning(string $component, string $event, array $context = []): void
    {
        self::logJson('warning', $component, $event, $context);
    }
    
    public static function logError(string $component, string $event, array $context = []): void
    {
        self::logJson('error', $component, $event, $context);
    }
    
    public static function logSecurity(string $component, string $event, array $context = []): void
    {
        self::logJson('security', $component, $event, $context);
    }
    
    private static function extractLogClientIp(): string
    {
        $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        return '0.0.0.0';
    }
}
