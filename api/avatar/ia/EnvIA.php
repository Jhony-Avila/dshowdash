<?php
declare(strict_types=1);

/**
 * /api/avatar/ia/EnvIA.php — leitura SEGURA de configuração (AS5 F8.2).
 * @version 1.0.0  @created 2026-08-02
 *
 * Único ponto de leitura de env da camada de IA: variável de ambiente
 * primeiro, config/.env como fallback. NUNCA loga valores — só presença.
 * Reutilizado pela fábrica e por todos os provedores (DRY).
 */
final class EnvIA
{
    /** cache por request (o .env não muda no meio de uma requisição) */
    private static ?array $cache = null;

    public static function ler(string $nome): ?string
    {
        $valor = getenv($nome);
        if (is_string($valor) && $valor !== '') {
            return trim($valor);
        }
        if (self::$cache === null) {
            self::$cache = self::carregarArquivo();
        }
        return self::$cache[$nome] ?? null;
    }

    /** presença sem expor o valor (diagnóstico/observabilidade). */
    public static function definido(string $nome): bool
    {
        $v = self::ler($nome);
        return $v !== null && $v !== '';
    }

    private static function carregarArquivo(): array
    {
        $mapa = [];
        $arquivo = __DIR__ . '/../../../config/.env';
        if (!is_readable($arquivo)) {
            return $mapa;
        }
        foreach (file($arquivo, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linha) {
            $linha = trim($linha);
            if ($linha === '' || $linha[0] === '#') {
                continue;
            }
            if (preg_match('/^([A-Z0-9_]+)\s*=\s*["\']?([^"\'#]*)["\']?\s*(#.*)?$/', $linha, $m)) {
                $mapa[$m[1]] = trim($m[2]);
            }
        }
        return $mapa;
    }
}
