<?php
declare(strict_types=1);

/**
 * api/obs/ObsConsumidor.php — MIG-001 · o molde ÚNICO dos consumidores da INTEGRACAO que passam a ler do registro central (VINHO, 27/11/2026).
 * ligado(): a flag GLOBAL obs_monitoramento (ausente, desligada ou ilegível = false = o caminho legado de sempre).
 * responder(): cache próprio ('obs:' + a chave do legado); o MESMO formato (o consumidor monta os campos); registro fora = 503, nunca zero. Sempre sai (exit).
 */
require_once __DIR__ . '/ObsExecucoes.php';

final class ObsConsumidor
{
    public static function ligado(): bool
    {
        $redis = class_exists('RedisHelper');
        return ObsExecucoes::fonteRegistroLigada(static function (string $k, ?int $u): array {
            require_once '/var/www/dshowdash/config/db_connection.php';
            require_once __DIR__ . '/../feature-flags/resolver.php';
            return (new FeatureFlagResolver(getConnection('DSHOWDASH')))->resolve($k, $u);
        }, $redis ? static fn(string $k): ?string => RedisHelper::tryGetCache($k) : null, $redis ? static fn(string $k, string $v, int $t) => RedisHelper::setCache($k, $v, $t) : null);
    }

    /** @param Closure(ObsExecucoes):array $montar devolve o `data` no formato legado do consumidor */
    public static function responder(string $chaveLegado, int $ttl, string $versao, Closure $montar): never
    {
        $chave = 'obs:' . $chaveLegado;
        if (RedisHelper::serveIfCached($chave)) exit;
        try {
            require_once '/var/www/dshowdash/config/db_connection.php';
            $data = $montar(new ObsExecucoes(getConnection('DSHOWDASH')));
            RedisHelper::cacheAndReturn($chave, ApiResponse::buildSuccess($data, ['version' => $versao, 'cache' => 'miss', 'fonte' => 'registro_execucoes']), $ttl);
        } catch (Throwable $e) {
            RedisHelper::close();
            error_log('[obs-consumidor] ' . $chaveLegado . ': ' . get_class($e));
            ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, ['fonte' => 'registro_execucoes', 'estado' => 'indisponivel']);
        }
        exit;
    }
}
