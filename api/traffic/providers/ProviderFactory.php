<?php
/**
 * ProviderFactory - seleciona a implementação de TrafficProvider conforme config/env.
 * @version 1.0.0
 */

require_once __DIR__ . '/TrafficProvider.php';
require_once __DIR__ . '/MockTrafficProvider.php';
require_once __DIR__ . '/TomTomTrafficProvider.php';

if (!class_exists('ProviderFactory')) {
final class ProviderFactory {
    public static function make(array $cfg): TrafficProvider {
        $choice = $cfg['provider'] ?? 'mock';
        if ($choice === 'tomtom') {
            $key = getenv('TOMTOM_TRAFFIC_API_KEY');
            if ($key !== false && $key !== '') {
                return new TomTomTrafficProvider($key, $cfg);
            }
            // sem chave: degrada para mock (nunca quebra o painel)
            error_log('[traffic] TRAFFIC_PROVIDER=tomtom mas TOMTOM_TRAFFIC_API_KEY ausente → usando mock');
        }
        return new MockTrafficProvider();
    }
}
}
