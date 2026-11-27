<?php
// HealthAgregado — HL-001-R1 (ratificado pelo arquiteto, 27/11; AZUL): as regras PURAS do /api/health (v3) e do coletor, testáveis sem banco.
//  1) decisão global pelo valor NÃO arredondado: disco/memória ≥ 92% / ≥ 95% (ver LIMIARES) = BLOQUEIO (UNHEALTHY); faixa de aviso
//     = rótulo WARNING e aviso, sem rebaixar o agregado (a publicação segue com aviso, como no contrato v4);
//  2) estado agregado MONOTÔNICO: piorar() nunca rebaixa UNHEALTHY para DEGRADED; crítico ausente (banco, sessão, memória, Redis, disco) = falha;
//  3) sondas remotas FORA do caminho síncrono: o health só LÊ a fotografia local do coletor (escrita atômica, dono root, sem escrita para
//     grupo/outros, identidade da release e idade). Coletor parado = fotografia vencida = INFORMATIVO marcado, nunca crítico;
//  4) limiares de memória e orçamento de duração por check (proposta; ver ORCAMENTO_MS e o relatório).
declare(strict_types=1);

final class HealthAgregado
{
    public const ORDEM = ['HEALTHY' => 0, 'DEGRADED' => 1, 'UNHEALTHY' => 2];

    /** [aviso, bloqueio] em % de uso, comparados ANTES de arredondar. Disco = RT-001 (85/92). Memória = proposta (85/95, MemAvailable). */
    public const LIMIARES = ['disco' => [85, 92], 'memoria' => [85, 95]];

    /** Orçamento por check no caminho síncrono (ms) — soma ≤ 120 ms para caber no p95 HTTP < 200 ms (PERF-001) com folga para o PHP-FPM. */
    public const ORCAMENTO_MS = ['php' => 1, 'session' => 10, 'database' => 50, 'remote_databases' => 5, 'disk' => 5, 'memory' => 5,
                                 'directories' => 5, 'redis' => 20, 'navigation' => 15, 'manifest' => 4];

    public const IDADE_MAX_REMOTA_S = 60;

    public static function piorar(string $atual, string $novo): string
    {
        if (!isset(self::ORDEM[$atual]) || !isset(self::ORDEM[$novo])) { return 'UNHEALTHY'; }   // estado desconhecido nunca melhora nada
        return self::ORDEM[$novo] > self::ORDEM[$atual] ? $novo : $atual;
    }

    /**
     * Uso em % a partir de total/livre (NÃO arredondado para decidir).
     * @return array{uso:?float, rotulo:string, agregado:string, aviso:bool, motivo:?string}
     */
    public static function nivelUso(string $recurso, float|int|false|null $total, float|int|false|null $livre): array
    {
        [$aviso, $bloq] = self::LIMIARES[$recurso];
        if ($total === false || $total === null || $livre === false || $livre === null || $total <= 0 || $livre < 0 || $livre > $total) {
            return ['uso' => null, 'rotulo' => 'UNKNOWN', 'agregado' => 'UNHEALTHY', 'aviso' => false, 'motivo' => $recurso . '_desconhecido'];   // crítico ausente = falha
        }
        $usado = (float) $total - (float) $livre;
        $uso = 100.0 * $usado / (float) $total;
        if ($usado * 100 >= $bloq * (float) $total) { return ['uso' => $uso, 'rotulo' => 'CRITICAL', 'agregado' => 'UNHEALTHY', 'aviso' => false, 'motivo' => $recurso . '_acima_de_' . $bloq]; }
        if ($usado * 100 >= $aviso * (float) $total) { return ['uso' => $uso, 'rotulo' => 'WARNING', 'agregado' => 'HEALTHY', 'aviso' => true, 'motivo' => null]; }
        return ['uso' => $uso, 'rotulo' => 'OK', 'agregado' => 'HEALTHY', 'aviso' => false, 'motivo' => null];
    }

    /** /proc/meminfo → [total kB, disponível kB] (false se ilegível). */
    public static function memoria(string|false $meminfo): array
    {
        if (!is_string($meminfo) || !preg_match('/^MemTotal:\s+(\d+)\s*kB/m', $meminfo, $t) || !preg_match('/^MemAvailable:\s+(\d+)\s*kB/m', $meminfo, $a)) {
            return [false, false];
        }
        return [(int) $t[1], (int) $a[1]];
    }

    /**
     * Lê a fotografia remota do coletor. Nunca crítica: devolve o estado por banco e o motivo de não confiar (coleta).
     * @return array{coleta:string, idade_s:?int, bancos:array<string,array{status:string}>}
     */
    public static function fotografiaRemota(string $arquivo, ?string $releaseServida, int $agora, array $aliases = ['INTEGRACAO', 'DSHOW_PROD']): array
    {
        $vazio = static fn (string $coleta, ?int $idade = null) => ['coleta' => $coleta, 'idade_s' => $idade, 'bancos' => array_fill_keys($aliases, ['status' => 'UNKNOWN'])];
        clearstatcache(true, $arquivo);
        $st = @stat($arquivo);
        if ($st === false || !is_file($arquivo)) { return $vazio('sem_fotografia'); }
        if (($st['mode'] & 0022) !== 0 || ($st['uid'] !== 0 && $st['uid'] !== (int) getmyuid())) { return $vazio('permissao_insegura'); }   // escrita por grupo/outros ou dono estranho
        $raw = @file_get_contents($arquivo, false, null, 0, 8193);
        $f = is_string($raw) && strlen($raw) <= 8192 ? json_decode($raw, true) : null;
        if (!is_array($f) || ($f['versao'] ?? null) !== 1 || !is_int($f['gerado_em'] ?? null) || !is_array($f['bancos'] ?? null)) { return $vazio('invalida'); }
        $idade = $agora - $f['gerado_em'];
        if ($idade < -2) { return $vazio('invalida', $idade); }   // relógio do coletor adiantado demais
        $idade = max(0, $idade);
        if ($releaseServida !== null && ($f['release'] ?? null) !== $releaseServida) { return $vazio('release_divergente', $idade); }
        if ($idade > self::IDADE_MAX_REMOTA_S) { return $vazio('vencida', $idade); }   // coletor parado: informativo marcado
        $bancos = [];
        foreach ($aliases as $a) {
            $s = $f['bancos'][$a]['estado'] ?? null;
            $bancos[$a] = ['status' => $s === 'ok' ? 'OK' : ($s === 'falhou' ? 'DOWN' : 'UNKNOWN')];
        }
        return ['coleta' => 'ok', 'idade_s' => $idade, 'bancos' => $bancos];
    }

    /** Escrita ATÔMICA (temporário no mesmo diretório + rename), 0644, dono = quem escreve (root no cron). Falha = exceção (nada pela metade). */
    public static function gravarAtomico(string $arquivo, array $dados): void
    {
        $dir = dirname($arquivo);
        if (!is_dir($dir) || !is_writable($dir)) { throw new RuntimeException('diretório da fotografia indisponível'); }
        $json = json_encode($dados, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        if (strlen($json) > 8192) { throw new RuntimeException('fotografia maior que 8 KiB'); }
        $tmp = tempnam($dir, '.foto-');
        if ($tmp === false) { throw new RuntimeException('temporário indisponível'); }
        try {
            if (file_put_contents($tmp, $json, LOCK_EX) !== strlen($json)) { throw new RuntimeException('gravação incompleta'); }
            if (!chmod($tmp, 0644)) { throw new RuntimeException('chmod'); }
            if (!rename($tmp, $arquivo)) { throw new RuntimeException('rename'); }
        } finally {
            if (is_file($tmp)) { @unlink($tmp); }   // só o temporário que este processo criou
        }
    }
}
