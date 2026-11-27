<?php
declare(strict_types=1);
/**
 * CsvSeguro (AZUL/ESQUERDA, 27/11 · CSV/Excel Injection, lado SERVIDOR) — o MESMO critério de public/components/_shared-react/csv/neutralizar.ts.
 * Texto que a planilha leria como FÓRMULA (começa com = + - @, TAB, CR, LF — também depois de espaço, NBSP, espaço ideográfico, e nas formas de
 * largura total ＝＋－＠) ganha apóstrofo. Números (int/float) e strings PURAMENTE numéricas (o PDO entrega DECIMAL como string, inclusive
 * negativos: "-123.45") passam intactos: não são fórmula. Nulo = vazio. O escape de ; " CR LF continua do fputcsv.
 */
final class CsvSeguro
{
    private const PERIGOSO = '/^[\s\x{00a0}\x{2000}-\x{200b}\x{3000}\x{feff}]*[=+\-@\x{ff1d}\x{ff0b}\x{ff0d}\x{ff20}\t\r\n]/u';
    /** Fallback por bytes (sem /u): espaços ASCII, NBSP do Latin-1 (\xA0) e as formas UTF-8 do espaço ideográfico e da largura total. */
    private const PERIGOSO_BYTES = '/^(?:[\s\xa0]|\xe3\x80\x80|\xc2\xa0)*(?:[=+\-@\t\r\n]|\xef\xbc[\x8b\x8d\x9d]|\xef\xbc\xa0)/';
    private const NUMERO = '/^-?\d+(?:[.,]\d+)?\z/';

    public static function celula(mixed $v): string|int|float
    {
        if ($v === null) return '';
        if (is_int($v) || is_float($v)) return $v;
        if (is_bool($v)) return $v ? '1' : '0';
        $s = (string) $v;
        if (preg_match(self::NUMERO, $s) === 1) return $s;
        $r = preg_match(self::PERIGOSO, $s);
        // UTF-8 INVÁLIDO (ex.: dado do ERP/Bling em Latin-1): com /u o preg_match devolve false — conferir pelos BYTES (achado da VERDE, P1)
        if ($r === false) { $r = preg_match(self::PERIGOSO_BYTES, $s); }
        return $r === 1 ? "'" . $s : $s;
    }

    /** @param array<int|string, mixed> $linha */
    public static function linha(array $linha): array
    {
        return array_map([self::class, 'celula'], $linha);
    }
}
