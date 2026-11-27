<?php
declare(strict_types=1);
final class DiscoSaude {
    public static function medir(float|false $total, float|false $livre): array {
        if ($total === false || $livre === false || $total <= 0 || $livre < 0 || $livre > $total)
            return [null, 'unknown'];
        $usado = $total - $livre;
        $nivel = $usado * 100 >= 92 * $total ? 'critical' : ($usado * 100 >= 85 * $total ? 'warning' : 'online');
        return [round(100 * $usado / $total, 2), $nivel];
    }
}
