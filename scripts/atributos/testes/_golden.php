<?php
// Equipamentos › Atributos — V5 Lote 3: massa dourada compartilhada com o app (fixtures/golden-ficha.json) e a normalização da ficha do
// PHP no MESMO formato do Node (attributes.ts::fichaAplicavel). Usado por golden-ficha.php (memória) e repo-mysql.php (MySQL real, P1-10).
declare(strict_types=1);

const GOLDEN_SHA256 = 'f0dd9169a863671680ca8b46f438ef2620f86c99f45c9e50ce96651d3e34a206';

/** @return array{0: array, 1: bool} [massa, sha256 confere] */
function golden_carregar(): array
{
    $bruto = (string) file_get_contents(__DIR__ . '/fixtures/golden-ficha.json');
    return [json_decode($bruto, true, 64, JSON_THROW_ON_ERROR), hash('sha256', $bruto) === GOLDEN_SHA256];
}

/** Decimal normalizado (sem zeros à direita; "-0" = "0") — o mesmo normDec do Node. */
function golden_norm_dec(string $s): string
{
    $s = trim($s); $neg = str_starts_with($s, '-'); if ($neg) $s = substr($s, 1);
    [$i, $f] = array_pad(explode('.', $s, 2), 2, '');
    $i = ltrim($i, '0'); if ($i === '') $i = '0'; $f = rtrim($f, '0');
    $o = $f !== '' ? "$i.$f" : $i;
    return $neg && $o !== '0' ? "-$o" : $o;
}

/** Ficha do AtributosService::ficha → lista normalizada [grupo_id, atributo_id, posicao, obrigatorio, visivel, autoridade, valor]. */
function golden_normalizar(array $ficha): array
{
    $out = [];
    foreach ($ficha['grupos'] as $g) foreach ($g['atributos'] as $a) {
        $valor = null;
        if (($a['autoridade'] ?? 'local') !== 'precifica') {
            $v = $a['valor']; $e = $v['estado'] ?? 'nao_informado';
            $valor = $e !== 'informado' ? ['estado' => $e] : match ($a['tipo']) {
                'numero', 'inteiro' => ['estado' => 'informado', 'num' => $v['valor_num'] === null ? null : golden_norm_dec((string) $v['valor_num'])],
                'booleano' => ['estado' => 'informado', 'bool' => $v['valor_bool'] === null ? null : (bool) $v['valor_bool']],
                'data' => ['estado' => 'informado', 'data' => $v['valor_data'] === null ? null : substr((string) $v['valor_data'], 0, 10)],
                'opcao' => ['estado' => 'informado', 'opcoes' => array_map('intval', $v['opcoes'] ?? [])],
                'multiopcao' => ['estado' => 'informado', 'opcoes' => (function ($x) { $x = array_map('intval', $x); sort($x); return $x; })($v['opcoes'] ?? [])],
                default => ['estado' => 'informado', 'texto' => $v['valor_texto']],
            };
        }
        $out[] = ['grupo_id' => (int) $g['id'], 'atributo_id' => (int) $a['atributo_id'], 'posicao' => (int) $a['posicao'], 'obrigatorio' => (bool) $a['obrigatorio'],
            'visivel' => (bool) $a['visivel'], 'autoridade' => $a['autoridade'], 'valor' => $valor];
    }
    return $out;
}

/**
 * 3.7 (04/11): completude da ficha SÓ dos obrigatórios de autoridade LOCAL (a do Precifica depende do cache do app, fora da massa) —
 * o MESMO formato que o Node (attributes.ts::completudeLocal) produz. pendentes = ids em ordem crescente.
 */
function golden_completude(array $ficha): array
{
    $precifica = [];
    foreach ($ficha['grupos'] as $g) foreach ($g['atributos'] as $a) if (($a['autoridade'] ?? 'local') === 'precifica') $precifica[(int) $a['atributo_id']] = true;
    $obr = 0;
    foreach ($ficha['grupos'] as $g) foreach ($g['atributos'] as $a) if ($a['obrigatorio'] && !isset($precifica[(int) $a['atributo_id']])) $obr++;
    $pend = [];
    foreach ($ficha['completude']['pendentes'] as $p) if (!isset($precifica[(int) $p['atributo_id']])) $pend[] = (int) $p['atributo_id'];
    sort($pend);
    return ['obrigatorios' => $obr, 'resolvidos' => $obr - count($pend), 'pendentes' => $pend];
}

/** Diferenças item a item (para a mensagem de erro). */
function golden_diferencas(array $got, array $esperado): string
{
    $d = [];
    foreach (array_map(null, $got, $esperado) as $p) if ($p[0] !== $p[1]) $d[] = $p;
    return json_encode($d, JSON_UNESCAPED_UNICODE);
}
