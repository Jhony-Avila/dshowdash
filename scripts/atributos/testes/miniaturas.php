<?php
// Equipamentos › Atributos — testes do PORTÃO P4 (miniaturas, A6). Sem banco e sem tocar em produção: tudo numa pasta temporária.
//  1) atrDirMiniaturas(): ordem ATRWEB_MINIATURAS → DSHOW_ATRIBUTOS_MINIATURAS → padrão fixo; caminho relativo/".." ignorado; pasta ausente → null.
//  2) gerador (tools/equipamentos/miniaturas.php): --modo 0640, sem EXIF, manifesto sem storage_key/caminho, idempotente, --sincronizar.
//  3) ProdutosLeitura::arquivoMiniatura(): só mídia elegível e listada no manifesto; medida fora da lista → null; nível < 50 → 403.
// Uso: php scripts/atributos/testes/miniaturas.php (exit 1 em falha).
declare(strict_types=1);
require_once __DIR__ . '/_memoria.php';
require_once __DIR__ . '/../../../api/atributos/ProdutosLeitura.php';
require_once __DIR__ . '/../../../api/atributos/MiniaturasDir.php';

$falhas = 0; $n = 0;
$ok = function (string $nome, bool $c) use (&$falhas, &$n): void { $n++; if (!$c) { $falhas++; echo "[ERRO] $nome\n"; } };
$T = sys_get_temp_dir() . '/atr-p4-' . getmypid(); @mkdir($T, 0700, true);
@mkdir("$T/a"); @mkdir("$T/b"); @mkdir("$T/padrao");

// ---- 1) caminho da pasta ---------------------------------------------------------------------------------------------------------------
$ok('sem variáveis → padrão fixo (existe)', atrDirMiniaturas([], "$T/padrao") === "$T/padrao");
$ok('sem variáveis e padrão ausente → null (cor média)', atrDirMiniaturas([], "$T/nao-existe") === null);
$ok('ATRWEB_MINIATURAS vence', atrDirMiniaturas(['ATRWEB_MINIATURAS' => "$T/a", 'DSHOW_ATRIBUTOS_MINIATURAS' => "$T/b"], "$T/padrao") === "$T/a");
$ok('DSHOW_ATRIBUTOS_MINIATURAS vence o padrão', atrDirMiniaturas(['DSHOW_ATRIBUTOS_MINIATURAS' => "$T/b/"], "$T/padrao") === "$T/b");
$ok('variável apontando para pasta ausente → null (não cai no padrão)', atrDirMiniaturas(['ATRWEB_MINIATURAS' => "$T/x"], "$T/padrao") === null);
$ok('caminho relativo é ignorado', atrDirMiniaturas(['ATRWEB_MINIATURAS' => 'rel/pasta'], "$T/padrao") === "$T/padrao");
$ok('caminho com ".." é ignorado', atrDirMiniaturas(['ATRWEB_MINIATURAS' => "$T/a/../b"], "$T/padrao") === "$T/padrao");
$ok('variável vazia = ausente', atrDirMiniaturas(['ATRWEB_MINIATURAS' => '', 'DSHOW_ATRIBUTOS_MINIATURAS' => false], "$T/padrao") === "$T/padrao");
$ok('constante padrão do módulo', ATR_MINIATURAS_PADRAO === '/srv/dshow-shared/dash/miniaturas-atributos');

// ---- 2) gerador ----------------------------------------------------------------------------------------------------------------------
$orig = "$T/origem"; $dest = "$T/destino"; @mkdir($dest, 0750);
$jpegComExif = function (string $arq, int $w, int $h): void {
    $im = imagecreatetruecolor($w, $h); imagefill($im, 0, 0, imagecolorallocate($im, 200, 40, 40));
    ob_start(); imagejpeg($im, null, 90); $j = (string) ob_get_clean();
    $exif = "Exif\0\0" . 'MM' . "\0\x2a\0\0\0\x08" . str_repeat("\0", 8) . 'GPS-FALSO-123';   // APP1 mínimo com marca reconhecível
    file_put_contents($arq, substr($j, 0, 2) . "\xFF\xE1" . pack('n', strlen($exif) + 2) . $exif . substr($j, 2));
};
$shas = [];
foreach ([[11, 'p/1/aaa'], [12, 'p/1/bbb'], [13, 'p/2/ccc']] as [$mid, $chave]) {
    @mkdir("$orig/$chave", 0700, true); $jpegComExif("$orig/$chave/original.jpg", 2000, 1000);
    $shas[$mid] = hash('sha256', "midia-$mid");
}
$lista = "$T/lista.tsv";
$escreverLista = function (array $mids) use ($lista, $shas): void {
    $ch = [11 => 'p/1/aaa', 12 => 'p/1/bbb', 13 => 'p/2/ccc']; $l = '';
    foreach ($mids as $m) $l .= implode("\t", [$m, $m < 13 ? 1 : 2, $shas[$m], $ch[$m], $m === 11 ? 1 : 0, $m]) . "\n";
    file_put_contents($lista, $l);
};
$gerador = __DIR__ . '/../../../tools/equipamentos/miniaturas.php';
$rodar = function (string ...$extra) use ($gerador, $lista, $orig, $dest): array {
    $cmd = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($gerador) . ' --lista ' . escapeshellarg($lista) . ' --origem ' . escapeshellarg($orig)
        . ' --destino ' . escapeshellarg($dest) . ' ' . implode(' ', array_map('escapeshellarg', $extra)) . ' 2>&1';
    exec($cmd, $out, $rc); return [$rc, implode("\n", $out)];
};
$escreverLista([11, 12, 13]);
[$rc, $out] = $rodar('--modo', '0640', '--sincronizar');
$ok('1ª geração termina OK', $rc === 0 && str_contains($out, 'MINIATURAS_OK') && str_contains($out, '"geradas":6'));
$a480 = "$dest/{$shas[11]}-480.jpg"; $a1280 = "$dest/{$shas[11]}-1280.jpg";
$ok('dois tamanhos gravados', is_file($a480) && is_file($a1280));
$ok('lado maior 480 e 1280', (getimagesize($a480)[0] ?? 0) === 480 && (getimagesize($a1280)[0] ?? 0) === 1280);
$ok('arquivos 0640', (fileperms($a480) & 0777) === 0640 && (fileperms("$dest/manifesto.json") & 0777) === 0640);
$ok('origem tinha EXIF (controle do teste)', str_contains((string) file_get_contents("$orig/p/1/aaa/original.jpg"), 'GPS-FALSO-123'));
$bin = (string) file_get_contents($a480) . (string) file_get_contents($a1280);
$ok('miniatura SEM EXIF (nem APP1 nem a marca)', !str_contains($bin, 'Exif') && !str_contains($bin, 'GPS-FALSO-123') && !str_contains($bin, "\xFF\xE1"));
$manTxt = (string) file_get_contents("$dest/manifesto.json"); $man = json_decode($manTxt, true);
$ok('manifesto sem storage_key nem caminho de origem', !str_contains($manTxt, 'p/1/aaa') && !str_contains($manTxt, $orig) && !str_contains($manTxt, 'storage'));
$ok('manifesto com as 3 mídias', array_keys($man) === [11, 12, 13] && $man['11']['capa'] === true);
[$rc, $out] = $rodar('--modo', '0640', '--sincronizar');
$ok('2ª execução é incremental (tudo mantido)', $rc === 0 && str_contains($out, '"geradas":0') && str_contains($out, '"mantidas":6'));
$escreverLista([11, 12]);
[$rc, $out] = $rodar('--modo', '0640', '--sincronizar');
$man = json_decode((string) file_get_contents("$dest/manifesto.json"), true);
$ok('--sincronizar tira do manifesto a mídia que saiu da lista, sem apagar o JPEG', array_keys($man) === [11, 12] && str_contains($out, '"retiradas":1')
    && str_contains($out, '"orfas":2') && is_file("$dest/{$shas[13]}-480.jpg"));
$escreverLista([11]);
[$rc, $out] = $rodar('--modo', '0640');
$ok('sem --sincronizar o manifesto só cresce (compatível com a validação)', count(json_decode((string) file_get_contents("$dest/manifesto.json"), true)) === 2);
[$rc, $out] = $rodar('--modo', '0644');
$ok('--modo com leitura para "outros" é recusado', $rc === 2);
[$rc, $out] = $rodar('--modo', 'abc');
$ok('--modo inválido é recusado', $rc === 2);

// ---- 3) leitura do módulo -------------------------------------------------------------------------------------------------------------
$leit = new class implements LeituraVitrine {
  public function catalogo(): array { return []; } public function fotosResumo(): array { return []; } public function fotos(int $p): array { return []; }
  public function fotoElegivel(int $m): bool { return in_array($m, [11, 12], true); } public function familiasPrecifica(): array { return []; } public function specs(int $p): ?array { return null; }
  public function estadosValores(): array { return []; } public function valoresDetalhe(int $p): array { return []; } public function legadoResumo(): array { return []; }
  public function legadoDoItem(int $i): array { return []; } public function vinculos(): array { return []; } public function atributos(): array { return []; }
  public function opcoes(array $ids): array { return []; } public function unidades(): array { return []; } public function unidadesExtras(): array { return []; }
  public function sugestoes(?int $p, ?string $f = null, ?string $t = null, int $l = 500): array { return []; } public function sugestoesPendentesPorProduto(): array { return []; }
  public function historico(int $p, int $l): array { return []; } public function usoAtributos(): array { return []; } public function usoUnidades(): array { return []; }
};
$pl = new ProdutosLeitura($leit, new RepoMemoria(), 50, atrDirMiniaturas(['ATRWEB_MINIATURAS' => $dest]));
$f = $pl->arquivoMiniatura(11, 480);
$ok('mídia elegível → arquivo + ETag', $f !== null && $f['caminho'] === $a480 && $f['etag'] === '"' . substr($shas[11], 0, 40) . '"');
$ok('ETag não revela caminho', !str_contains((string) ($f['etag'] ?? ''), '/'));
$ok('1280 também', ($pl->arquivoMiniatura(11, 1280)['caminho'] ?? '') === $a1280);
$ok('medida fora da lista → null', $pl->arquivoMiniatura(11, 800) === null);
$ok('mídia não elegível → null (mesmo com arquivo)', $pl->arquivoMiniatura(13, 480) === null);
$ok('sem pasta → null (fail-safe)', (new ProdutosLeitura($leit, new RepoMemoria(), 50, atrDirMiniaturas([], "$T/nao-existe")))->arquivoMiniatura(11, 480) === null);
$e = null; try { (new ProdutosLeitura($leit, new RepoMemoria(), 49, $dest))->arquivoMiniatura(11, 480); } catch (AtributosErro $x) { $e = $x; }
$ok('nível 49 → 403', $e?->http === 403);

// A pasta temporária NÃO é apagada (regra "nada é apagado"): fica em $TMPDIR; rode com TMPDIR=<scratch>.
echo "pasta do teste: $T\n";
echo $falhas === 0 ? "OK miniaturas: $n verificações\n" : "FALHOU miniaturas: $falhas de $n\n";
exit($falhas === 0 ? 0 : 1);
