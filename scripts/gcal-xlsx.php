<?php
// Prova do gerador de XLSX nativo
// @module google-calendar.xlsx.prova
// @version 1.0.0
// @created 2026-07-30
//
//     php scripts/gcal-xlsx.php
//
// Nao basta o arquivo ser gerado sem erro: XLSX invalido tambem "gera bem" e so
// falha ao ABRIR, com o Excel dizendo "conteudo ilegivel" sem apontar onde. Por
// isso aqui o arquivo e RELIDO com ZipArchive + SimpleXML, e cada valor e
// conferido dentro do XML — que e o que o Excel vai ler.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

$raiz = dirname(__DIR__);
require_once $raiz . '/api/google-calendar/lib/GcalXlsx.php';

$ok = 0; $falhas = [];
$check = static function (string $n, bool $c, string $o = '') use (&$ok, &$falhas): void {
    if ($c) { $ok++; printf("  ok      %s %s\n", $n, $o); }
    else    { $falhas[] = $n; printf("  FALHA   %s %s\n", $n, $o); }
};
$secao = static fn(string $t) => printf("\n%s\n%s\n", $t, str_repeat('─', mb_strlen($t)));

echo "\nXLSX NATIVO — sem dependência\n", str_repeat('═', 66), "\n";

$colunas = [
    ['id' => 'dia',   'rotulo' => 'Dia',            'tipo' => 'data'],
    ['id' => 'ini',   'rotulo' => 'Início',         'tipo' => 'datahora'],
    ['id' => 'quem',  'rotulo' => 'Participante',   'tipo' => 'texto'],
    ['id' => 'n',     'rotulo' => 'Reuniões',       'tipo' => 'numero',     'total' => 'soma'],
    ['id' => 'min',   'rotulo' => 'Tempo',          'tipo' => 'duracao',    'total' => 'soma'],
    ['id' => 'pct',   'rotulo' => 'Ocupação',       'tipo' => 'percentual', 'total' => 'media'],
];
$linhas = [
    ['dia' => '2026-07-28', 'ini' => '2026-07-28T14:30:00-03:00',
     'quem' => 'Ana; "Sócia" & Cia', 'n' => 3, 'min' => 145, 'pct' => 42.5],
    ['dia' => '2026-07-29', 'ini' => '2026-07-29T09:00:00-03:00',
     'quem' => "Quebra\nde linha", 'n' => 1, 'min' => 30, 'pct' => 8],
    ['dia' => '2026-07-30', 'ini' => null, 'quem' => 'Reunião <tag>',
     'n' => 0, 'min' => 0, 'pct' => 0],
];
$totais = ['n' => 4, 'min' => 175, 'pct' => 16.83];

$bytes = GcalXlsx::gerar($colunas, $linhas, $totais,
    ['Carga de reuniões', 'Período: 28/07/2026 a 30/07/2026', 'Gerado em 30/07/2026 04:00'],
    'Carga de reuniões');

$arq = sys_get_temp_dir() . '/gcal-prova.xlsx';
file_put_contents($arq, $bytes);

// ═══════════════════════════════════════════════════════════════════
$secao('1. É um ZIP válido com as partes obrigatórias');

$check('assinatura ZIP (PK)', str_starts_with($bytes, "PK\x03\x04"),
    strlen($bytes) . ' bytes');

$zip = new ZipArchive();
$check('ZipArchive abre o arquivo', $zip->open($arq) === true);

$partes = [];
for ($i = 0; $i < $zip->numFiles; $i++) { $partes[] = $zip->getNameIndex($i); }
foreach (['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml',
          'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml'] as $p) {
    $check("  contém $p", in_array($p, $partes, true));
}

// ═══════════════════════════════════════════════════════════════════
$secao('2. Todo XML é bem-formado');

libxml_use_internal_errors(true);
foreach ($partes as $p) {
    $conteudo = (string)$zip->getFromName($p);
    libxml_clear_errors();
    $x = simplexml_load_string($conteudo);
    $check("  $p", $x !== false,
        $x === false ? trim((string)(libxml_get_errors()[0]->message ?? '')) : '');
}

// ═══════════════════════════════════════════════════════════════════
$secao('3. Números são NÚMEROS, não texto');

$sheet = (string)$zip->getFromName('xl/worksheets/sheet1.xml');

// Célula numérica tem <v> e NÃO tem t="inlineStr". É a diferença que faz o
// Excel somar em vez de concatenar.
$check('145 gravado como valor numérico',
    (bool)preg_match('/<c r="E\d+" s="\d+"><v>145<\/v><\/c>/', $sheet));
$check('42.5 com PONTO decimal no XML',
    str_contains($sheet, '<v>42.5</v>'),
    '(vírgula aqui corromperia a planilha; o Excel exibe conforme o locale)');
$check('nenhum número virou inlineStr',
    !preg_match('/t="inlineStr"><is><t[^>]*>145</', $sheet));

// ═══════════════════════════════════════════════════════════════════
$secao('4. Datas viram serial do Excel');

// 2026-07-28 = 46.231 dias desde 1899-12-30.
$esperado = (int)((new DateTimeImmutable('2026-07-28'))
    ->diff(new DateTimeImmutable('1899-12-30'))->days);
$check('data como serial, não texto', str_contains($sheet, '<v>' . $esperado . '</v>'),
    "serial esperado $esperado");
$check('datahora traz fração do dia',
    (bool)preg_match('/<v>' . $esperado . '\.6[0-9]+<\/v>/', $sheet),
    '14:30 = 0,604166… do dia');
$check('data vazia não vira 1899',
    !preg_match('/<c r="A\d+"[^>]*><v>0<\/v>/', $sheet));

// ═══════════════════════════════════════════════════════════════════
$secao('5. Texto perigoso é escapado');

$check('& virou &amp;', str_contains($sheet, 'S&#243;cia&quot; &amp; Cia')
                    || str_contains($sheet, '&amp; Cia'));
$check('<tag> não virou marcação', str_contains($sheet, '&lt;tag&gt;'));
$check('nenhum caractere de controle sobrou',
    !preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $sheet),
    '(ilegal em XML 1.0 — o Excel recusa o arquivo inteiro)');

$x = simplexml_load_string($sheet);
$check('quebra de linha preservada dentro da célula',
    str_contains($sheet, "Quebra\nde linha") || str_contains($sheet, 'Quebra&#10;de linha'));

// ═══════════════════════════════════════════════════════════════════
$secao('6. Usabilidade da planilha');

$check('cabeçalho congelado', str_contains($sheet, 'state="frozen"'));
$check('autofiltro na tabela', str_contains($sheet, '<autoFilter'));
$check('larguras de coluna definidas', str_contains($sheet, 'customWidth="1"'),
    '(sem isso o Excel mostra ##### em número e data)');
$check('linha de TOTAL presente', str_contains($sheet, '>TOTAL<'));
$check('unidade vai no RÓTULO, não no formato',
    str_contains($sheet, 'Tempo (min)') && str_contains($sheet, 'Ocupação (%)'),
    '(formato % do Excel multiplicaria 42,5 por 100)');

$wb = (string)$zip->getFromName('xl/workbook.xml');
$check('nome da aba preservado', str_contains($wb, 'Carga de reuni'));

// ═══════════════════════════════════════════════════════════════════
$secao('7. Nome de aba ilegal é saneado');

$z2 = new ZipArchive();
$arq2 = sys_get_temp_dir() . '/gcal-prova2.xlsx';
file_put_contents($arq2, GcalXlsx::gerar($colunas, [], [], [],
    'Relatório: com / barra * e [colchete] muito muito muito longo'));
$z2->open($arq2);
$wb2 = (string)$z2->getFromName('xl/workbook.xml');
preg_match('/name="([^"]*)"/', $wb2, $m);
$nome = $m[1] ?? '';
$check('sem caracteres proibidos no nome da aba',
    !preg_match('#[:\\\\/?*\[\]]#', $nome), $nome);
$check('nome da aba com no máximo 31 caracteres',
    mb_strlen(html_entity_decode($nome, ENT_QUOTES | ENT_XML1, 'UTF-8')) <= 31,
    mb_strlen($nome) . ' chars');
$z2->close();

// ═══════════════════════════════════════════════════════════════════
$secao('8. Casos de borda');

$vazio = GcalXlsx::gerar($colunas, [], []);
$check('relatório sem linhas não quebra', str_starts_with($vazio, "PK\x03\x04"));
$zv = new ZipArchive(); $av = sys_get_temp_dir() . '/gcal-vazio.xlsx';
file_put_contents($av, $vazio); $zv->open($av);
$check('  e continua XML válido',
    simplexml_load_string((string)$zv->getFromName('xl/worksheets/sheet1.xml')) !== false);
$check('  sem autofiltro quando não há dados',
    !str_contains((string)$zv->getFromName('xl/worksheets/sheet1.xml'), '<autoFilter'));
$zv->close();

// Mais de 26 colunas força a numeração AA, AB...
$muitas = [];
for ($i = 0; $i < 30; $i++) {
    $muitas[] = ['id' => "c$i", 'rotulo' => "Col $i", 'tipo' => 'numero'];
}
$largo = GcalXlsx::gerar($muitas, [array_fill_keys(array_column($muitas, 'id'), 1)], []);
$av2 = sys_get_temp_dir() . '/gcal-largo.xlsx';
file_put_contents($av2, $largo);
$z3 = new ZipArchive(); $z3->open($av2);
$s3 = (string)$z3->getFromName('xl/worksheets/sheet1.xml');
$check('coluna 27 vira AA', str_contains($s3, 'r="AA'), '(A..Z, depois AA)');
$check('coluna 30 vira AD', str_contains($s3, 'r="AD'));
$z3->close();

$zip->close();
foreach ([$arq, $arq2, $av, $av2] as $f) { @unlink($f); }

// ═══════════════════════════════════════════════════════════════════
echo "\n", str_repeat('═', 66), "\n";
if ($falhas) {
    printf("%d ok · %d FALHA(S):\n", $ok, count($falhas));
    foreach ($falhas as $f) { echo "  • $f\n"; }
    echo "\n";
    exit(1);
}
printf("TODOS OS %d CHECKS PASSARAM\n\n", $ok);
exit(0);
