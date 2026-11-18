<?php
// /api/atributos/DecimalExato.php — aritmética decimal EXATA em texto (sem float; o servidor não tem bcmath/gmp e nada é instalado).
// Usada na conversão de unidade (D3/H5): valor × fator_origem ÷ fator_destino, arredondado meio-para-cima na escala pedida.
declare(strict_types=1);

final class DecimalExato
{
    /** "−12.3400" → ['-', '1234', 2] (sinal, dígitos inteiros sem zeros à esquerda, casas). */
    private static function partes(string $d): array
    {
        if (!preg_match('/^(-?)(\d+)(?:\.(\d+))?$/', trim($d), $m)) throw new InvalidArgumentException('decimal inválido');
        $frac = rtrim($m[3] ?? '', '0');
        $int = ltrim($m[2] . $frac, '0');
        return [$m[1], $int === '' ? '0' : $int, strlen($frac)];
    }

    private static function mulInt(string $a, string $b): string
    {
        if ($a === '0' || $b === '0') return '0';
        $r = array_fill(0, strlen($a) + strlen($b), 0);
        for ($i = strlen($a) - 1; $i >= 0; $i--) for ($j = strlen($b) - 1; $j >= 0; $j--) {
            $p = (int) $a[$i] * (int) $b[$j] + $r[$i + $j + 1];
            $r[$i + $j + 1] = $p % 10; $r[$i + $j] += intdiv($p, 10);
        }
        return ltrim(implode('', $r), '0') ?: '0';
    }

    private static function cmpInt(string $a, string $b): int { return strlen($a) <=> strlen($b) ?: strcmp($a, $b); }

    private static function subInt(string $a, string $b): string   // a >= b
    {
        $r = ''; $emp = 0; $b = str_pad($b, strlen($a), '0', STR_PAD_LEFT);
        for ($i = strlen($a) - 1; $i >= 0; $i--) { $d = (int) $a[$i] - (int) $b[$i] - $emp; $emp = $d < 0 ? 1 : 0; $r = (string) ($d + 10 * $emp) . $r; }
        return ltrim($r, '0') ?: '0';
    }

    /** Divisão inteira longa: [quociente, resto]. */
    private static function divInt(string $a, string $b): array
    {
        if ($b === '0') throw new DivisionByZeroError('divisão por zero');
        $q = ''; $r = '0';
        for ($i = 0; $i < strlen($a); $i++) {
            $r = ltrim($r . $a[$i], '0') ?: '0'; $d = 0;
            while (self::cmpInt($r, $b) >= 0) { $r = self::subInt($r, $b); $d++; }
            $q .= (string) $d;
        }
        return [ltrim($q, '0') ?: '0', $r];
    }

    /** a × f1 ÷ f2, arredondado meio-para-cima com $escala casas; resultado sem zeros finais. */
    public static function mulDiv(string $a, string $f1, string $f2, int $escala = 6): string
    {
        [$sa, $ia, $ca] = self::partes($a); [$s1, $i1, $c1] = self::partes($f1); [$s2, $i2, $c2] = self::partes($f2);
        if ($i2 === '0') throw new DivisionByZeroError('fator zero');
        // (ia/10^ca × i1/10^c1) ÷ (i2/10^c2) = ia·i1·10^c2 ÷ (i2·10^(ca+c1)); escala → ×10^(escala+1) para arredondar
        $num = self::mulInt(self::mulInt($ia, $i1), '1' . str_repeat('0', $c2 + $escala + 1));
        $den = self::mulInt($i2, '1' . str_repeat('0', $ca + $c1));
        [$q] = self::divInt($num, $den);
        $ultimo = (int) substr($q, -1); $q = strlen($q) > 1 ? substr($q, 0, -1) : '0';
        if ($ultimo >= 5) $q = self::somaUm($q);
        $q = str_pad($q, $escala + 1, '0', STR_PAD_LEFT);
        $int = ltrim(substr($q, 0, -$escala), '0') ?: '0'; $frac = rtrim(substr($q, -$escala), '0');
        $neg = ($sa === '-') xor ($s1 === '-') xor ($s2 === '-');
        $r = $int . ($frac !== '' ? ".$frac" : '');
        return ($neg && $r !== '0') ? "-$r" : $r;
    }

    private static function somaUm(string $n): string
    {
        $i = strlen($n) - 1;
        while ($i >= 0 && $n[$i] === '9') { $n[$i] = '0'; $i--; }
        return $i < 0 ? '1' . $n : substr_replace($n, (string) ((int) $n[$i] + 1), $i, 1);
    }
}
