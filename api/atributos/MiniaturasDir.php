<?php
// api/atributos/MiniaturasDir.php — PORTÃO P4 (miniaturas, A6): de onde o módulo lê a pasta de miniaturas.
// Desenho (P4, 18/11): sem /etc, sem ambiente do PHP-FPM e sem tocar na credencial do P2. Ordem:
//   1) ATRWEB_MINIATURAS (validação)  2) DSHOW_ATRIBUTOS_MINIATURAS (sobreposição opcional)  3) padrão fixo ATR_MINIATURAS_PADRAO.
// Só caminho ABSOLUTO, sem "..", e só se a pasta existir. Caso contrário → null: o módulo mostra a cor média (fail-safe, como hoje).
// A pasta é gravada só pelo root (comando do portão P4) e lida pelo www-data; o manifesto nunca guarda storage_key nem caminho de origem.
declare(strict_types=1);

const ATR_MINIATURAS_PADRAO = '/srv/dshow-shared/dash/miniaturas-atributos';

/** @param array<string,string|false>|null $env  (testes) valores das variáveis; null = getenv() real */
function atrDirMiniaturas(?array $env = null, string $padrao = ATR_MINIATURAS_PADRAO): ?string
{
    $ler = static fn(string $k) => $env === null ? getenv($k) : ($env[$k] ?? false);
    foreach ([$ler('ATRWEB_MINIATURAS'), $ler('DSHOW_ATRIBUTOS_MINIATURAS'), $padrao] as $c) {
        if (!is_string($c) || $c === '') continue;          // variável ausente → próxima fonte
        $c = rtrim($c, '/');
        if ($c === '' || $c[0] !== '/' || str_contains($c, '..') || str_contains($c, "\0")) {
            error_log('[atributos] pasta de miniaturas inválida (ignorada)');
            continue;
        }
        return is_dir($c) ? $c : null;                      // fonte escolhida sem pasta → fail-safe (não cai para a próxima)
    }
    return null;
}
