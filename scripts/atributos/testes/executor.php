<?php
// ATRIBUTOS-WEB — teste do EXECUTOR de migrações num schema de validação descartável (ATRWEB_VAL_T_*), com banco de verdade.
// Uso: ATR_TESTE_CRED=/caminho/credenciais.ini ATR_TESTE_SCHEMA=ATRWEB_VAL_T_1 php scripts/atributos/testes/executor.php
// Sem as variáveis → "NÃO EXECUTADO" (exit 2), nunca "passou".
declare(strict_types=1);
require_once __DIR__ . '/../../../tools/db/equipamentos-migrar.php';

$cred = getenv('ATR_TESTE_CRED') ?: ''; $schema = getenv('ATR_TESTE_SCHEMA') ?: '';
if ($cred === '' || !str_starts_with($schema, 'ATRWEB_VAL_T_')) { echo "[NÃO EXECUTADO] executor: defina ATR_TESTE_CRED e ATR_TESTE_SCHEMA=ATRWEB_VAL_T_*\n"; exit(2); }
$falhas = 0; $n = 0;
$ok = function (string $nome, bool $c) use (&$falhas, &$n): void { $n++; if (!$c) { $falhas++; echo "[ERRO] $nome\n"; } };
$silencio = static function (string $m): void {};
$pdo = migrador_conectar($cred);
$dir = __DIR__ . '/../../../db/equipamentos/migrations';
$recria = function () use ($pdo, $schema): void {
    // schema de teste desta missão: limpar as tabelas é livre (§3.3); o schema em si não é removido
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$schema` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci");
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach ($pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = '$schema'")->fetchAll(PDO::FETCH_COLUMN) as $t) $pdo->exec("DROP TABLE `$schema`.`$t`");
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
};

// guarda de schema
$e = null; try { Migrador::validarSchema('DSHOW_EQUIPAMENTOS', false, null); } catch (MigradorErro $x) { $e = $x; }
$ok('produção recusada sem --modo-producao', $e !== null);
$e = null; try { Migrador::validarSchema('DSHOW_EQUIPAMENTOS', true, null); } catch (MigradorErro $x) { $e = $x; }
$ok('produção recusada com --modo-producao mas sem a senha do portão', $e !== null);
$ok('validação aceita', (function () { Migrador::validarSchema('ATRWEB_VAL_EQ', false, null); return true; })());
// 001–003 byte a byte iguais à produção
$ok('001–003: sha256 = os gravados em produção', hash_file('sha256', "$dir/001_schema.sql") === '6663d43e9f011df6cb9c1fcb2b50390e997b11c677105c2a5606af9ff0643e81'
    && hash_file('sha256', "$dir/002_autoridade_checksum.sql") === '1ba8affdb351ff584eedfbf33b0190882c7104d86319b2632d827bf0e43c0fd3'
    && hash_file('sha256', "$dir/003_aceita_nao_se_aplica.sql") === 'ea7584748c773affeb8ce44584281c8d846d7e7a41e2a54d2b3c4448df9be3c6');
// divisor de comandos
$ok('divisor: aspas, comentários e ; dentro de texto', Migrador::comandos("-- x;\nSELECT 'a;b'; /* c; */ SELECT `x;y`;\n# z;\nSELECT 1") === ["SELECT 'a;b'", 'SELECT `x;y`', 'SELECT 1']);

$recria();
$m = new Migrador($pdo, $schema, $dir, $silencio);
$seco = $m->executar(true);
$todas = array_keys($m->arquivos()); $N = count($todas);   // 18/11 (012_kit_prioridade): contagens pelo número de arquivos, não fixas em 10
$ok("dry-run lista as $N e não cria nada", count($seco['aplicadas']) === $N && $m->aplicadas() === []);
$r1 = $m->executar(false);
$ap = $m->aplicadas();
$ok('do zero: aplica todas', $r1['aplicadas'] === $todas && count($ap) === $N);
$ok('todas com checksum = sha256 do arquivo', count(array_filter($m->arquivos(), fn($f, $v) => ($ap[$v] ?? null) === hash_file('sha256', $f), ARRAY_FILTER_USE_BOTH)) === $N);
$r2 = $m->executar(false);
$ok('reaplicar não muda nada', $r2['aplicadas'] === [] && count($r2['conferidas']) === $N);
// checksum divergente aborta (cópia adulterada da pasta)
$tmp = sys_get_temp_dir() . '/atr-mig-' . getmypid(); @mkdir($tmp, 0700);
foreach (glob("$dir/*.sql") as $f) copy($f, "$tmp/" . basename($f));
file_put_contents("$tmp/005_kits.sql", "\n-- adulterado\n", FILE_APPEND);
$e = null; try { (new Migrador($pdo, $schema, $tmp, $silencio))->executar(false); } catch (MigradorErro $x) { $e = $x; }
$ok('checksum divergente aborta sem alterar', $e !== null && str_contains($e->getMessage(), '005_kits') && $m->aplicadas() === $ap);
// retomar: reverte da última até a 004 e reaplica só elas
$daQuatro = array_values(array_filter($todas, static fn($v) => strcmp($v, '004') > 0));
$volta = array_reverse($daQuatro);
$m->reverter($volta[0]);
$m->reverter($volta[1]);
$ok('reverter só a última (004 recusada)', (function () use ($m) { try { $m->reverter('004_vinculos_exclusao_logica'); return false; } catch (MigradorErro $x) { return true; } })());
foreach (array_slice($volta, 2) as $v) $m->reverter($v);
$colsGA = $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '$schema' AND table_name = 'eq_grupo_atributo'")->fetchColumn();
$ok('reversões da última à 004 voltam a estrutura da 003 (eq_grupo_atributo com 6 colunas, sem eq_sugestao)', (int) $colsGA === 6
    && (int) $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$schema' AND table_name IN ('eq_pedido_massa','eq_sugestao','eq_grupo_produto','eq_produto_atributo','eq_atributo_unidade')")->fetchColumn() === 0);
$r3 = $m->executar(false);
$ok('retoma: reaplica só da 004 em diante', $r3['aplicadas'] === $daQuatro);
array_map('unlink', glob("$tmp/*")); @rmdir($tmp);

echo ($falhas ? '[ERRO]' : '[OK]  ') . " executor ($schema): $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
