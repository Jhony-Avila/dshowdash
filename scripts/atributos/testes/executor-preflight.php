<?php
// ATRIBUTOS-WEB · DSHOW-036 — teste do PREFLIGHT POR OBJETO do executor de migrações, num schema de validação descartável, com banco de verdade.
// Uso: ATR_TESTE_CRED=/caminho/credenciais.ini ATR_TESTE_SCHEMA=ATRWEB_VAL_T_7 php scripts/atributos/testes/executor-preflight.php
// Sem as variáveis → "NÃO EXECUTADO" (exit 2), nunca "passou". Limpa (DROP TABLE) só dentro do schema ATRWEB_VAL_T_* informado.
declare(strict_types=1);
require_once __DIR__ . '/../../../tools/db/equipamentos-migrar.php';

$falhas = 0; $n = 0;
$ok = function (string $nome, bool $c, string $extra = '') use (&$falhas, &$n): void { $n++; if (!$c) { $falhas++; echo "[ERRO] $nome" . ($extra !== '' ? " — $extra" : '') . "\n"; } };
$dir = __DIR__ . '/../../../db/equipamentos/migrations';

// ---------------------------------------------------------------- 1) leitura dos comandos (sem banco)
$m004 = Migrador::objetosDaMigracao((string) file_get_contents("$dir/004_vinculos_exclusao_logica.sql"));
$nomes = static fn(array $c) => array_map(static fn($o) => "{$o['tipo']}:{$o['tabela']}.{$o['nome']}", $c['objetos']);
$ok('004: cmd 1 = 4 colunas + índice em eq_grupo_atributo', $nomes($m004[1]) === ['coluna:eq_grupo_atributo.versao', 'coluna:eq_grupo_atributo.excluido_em', 'coluna:eq_grupo_atributo.atualizado_por', 'coluna:eq_grupo_atributo.atualizado_em', 'indice:eq_grupo_atributo.idx_eq_ga_vivo']);
$ok('004: cmd 3 é a linha do ledger', $m004[3]['tipo'] === 'ledger' && count($m004) === 3);
$m008 = Migrador::objetosDaMigracao((string) file_get_contents("$dir/008_unidade_por_valor.sql"));
$ok('008: cmd 1 = coluna + FK em eq_valor; cmd 3 = tabela com colunas e 2 FKs', $nomes($m008[1]) === ['coluna:eq_valor.unidade_id', 'fk:eq_valor.fk_eq_valor_unidade']
    && in_array('tabela:eq_atributo_unidade.eq_atributo_unidade', $nomes($m008[3]), true) && in_array('fk:eq_atributo_unidade.fk_eq_au_unidade', $nomes($m008[3]), true));
$ok('COMMENT com vírgula não quebra a cláusula', count($m008[2]['objetos']) === 1);
$r = Migrador::objetosDaMigracao((string) file_get_contents("$dir/005_kits.revert.sql"));
$ok('reversão lida como remoção (DROP FOREIGN KEY / DROP KEY / DROP COLUMN, depois=false)', $r[2]['objetos'][0]['tipo'] === 'fk' && $r[2]['objetos'][0]['depois'] === false && count($r[3]['objetos']) === 4);
$todos = true;
foreach (glob("$dir/*.sql") as $f) foreach (Migrador::objetosDaMigracao((string) file_get_contents($f)) as $c) if ($c['tipo'] === 'desconhecido') $todos = false;
$ok('todas as migrações e reversões do ramo são lidas pelo preflight', $todos);
$ok('comando DDL não suportado → desconhecido', Migrador::objetosDoComando('ALTER TABLE `eq_valor` MODIFY COLUMN `valor_texto` VARCHAR(900) NULL')['tipo'] === 'desconhecido'
    && Migrador::objetosDoComando('RENAME TABLE a TO b')['tipo'] === 'desconhecido');
$ok('INSERT no ledger = ledger; INSERT em outra tabela = dados', Migrador::objetosDoComando("INSERT IGNORE INTO `eq_schema_migrations` (`version`) VALUES ('x')")['tipo'] === 'ledger'
    && Migrador::objetosDoComando("INSERT INTO eq_unidade (simbolo) VALUES ('m')")['tipo'] === 'dados');

// ---------------------------------------------------------------- 2) com banco
$cred = getenv('ATR_TESTE_CRED') ?: ''; $schema = getenv('ATR_TESTE_SCHEMA') ?: '';
if ($cred === '' || !str_starts_with($schema, 'ATRWEB_VAL_T_')) { echo "[NÃO EXECUTADO] executor-preflight (parte com banco): defina ATR_TESTE_CRED e ATR_TESTE_SCHEMA=ATRWEB_VAL_T_* ($n casos sem banco, $falhas falha(s))\n"; exit(2); }
$pdo = migrador_conectar($cred);
$silencio = static function (string $m): void {};
$recria = function () use ($pdo, $schema): void {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$schema` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci");
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach ($pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = '$schema'")->fetchAll(PDO::FETCH_COLUMN) as $t) $pdo->exec("DROP TABLE `$schema`.`$t`");
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
};
// foto da estrutura: prova de "nenhum DDL"
$foto = fn() => md5(json_encode($pdo->query("SELECT table_name, column_name, column_type FROM information_schema.columns WHERE table_schema = '$schema' ORDER BY 1, 2")->fetchAll(PDO::FETCH_NUM))
    . json_encode($pdo->query("SELECT table_name, index_name, column_name FROM information_schema.statistics WHERE table_schema = '$schema' ORDER BY 1, 2, 3")->fetchAll(PDO::FETCH_NUM)));
// pasta temporária com só parte das migrações (+ extras)
$pasta = function (array $versoes, array $extras = []) use ($dir): string {
    $tmp = sys_get_temp_dir() . '/atr-pf-' . getmypid() . '-' . bin2hex(random_bytes(3)); mkdir($tmp, 0700);
    foreach ($versoes as $v) copy("$dir/$v.sql", "$tmp/$v.sql");
    foreach ($extras as $nome => $sql) file_put_contents("$tmp/$nome.sql", $sql);
    return $tmp;
};
$limpaPastas = [];
$cmd = fn(string $v, int $i) => Migrador::comandos((string) file_get_contents("$dir/$v.sql"))[$i - 1];
$erro = function (callable $f): ?string { try { $f(); return null; } catch (MigradorErro $e) { return $e->getMessage(); } };
$todas = array_keys((new Migrador($pdo, $schema, $dir, $silencio))->arquivos());
$ate = static fn(string $ultima) => array_values(array_filter($todas, static fn($v) => strcmp($v, $ultima) <= 0));

// 2.1 do zero: tudo limpo → aplica; depois tudo 'ok'
$recria();
$m = new Migrador($pdo, $schema, $dir, $silencio);
$pf = $m->preflight();
$ok('schema vazio: as 10 pendentes estão "limpo"', count(array_filter($pf, static fn($r) => $r['estado'] === 'limpo')) === 10);
$m->executar(false);
$pf = $m->preflight();
$ok('depois de aplicar: as 10 "ok" (ledger e físico conferem)', count(array_filter($pf, static fn($r) => $r['estado'] === 'ok')) === 10, json_encode(array_column($pf, 'estado')));

// 2.2 ledger sem objeto físico (o contrário)
$pdo->exec("ALTER TABLE `$schema`.`eq_pedido_massa` DROP COLUMN `concluido_em`");
$f0 = $foto();
$e = $erro(fn() => $m->executar(false));
$ok('ledger sem objeto: recusa citando 010 e a coluna que falta', $e !== null && str_contains($e, '010_pedido_massa consta no ledger') && str_contains($e, 'eq_pedido_massa.concluido_em'), (string) $e);
$ok('ledger sem objeto: --dry-run também recusa', $erro(fn() => $m->executar(true)) !== null && $foto() === $f0);
$pdo->exec("ALTER TABLE `$schema`.`eq_pedido_massa` ADD COLUMN `concluido_em` DATETIME(3) NULL");

// 2.3 interrupção depois do 1º DDL da 004 (001–003 pelo executor; 1º ALTER da 004 à mão, sem ledger)
$recria();
$limpaPastas[] = $p = $pasta($ate('003_aceita_nao_se_aplica'));
(new Migrador($pdo, $schema, $p, $silencio))->executar(false);
$pdo->exec("USE `$schema`"); $pdo->exec($cmd('004_vinculos_exclusao_logica', 1));
$f0 = $foto(); $led0 = $m->aplicadas();
$pf = $m->preflight();
$ok('004 interrompida: estado "parcial" 5/10', $pf['004_vinculos_exclusao_logica']['estado'] === 'parcial' && $pf['004_vinculos_exclusao_logica']['no_estado_final'] === 5 && $pf['004_vinculos_exclusao_logica']['objetos'] === 10);
$ok('004 interrompida: as seguintes continuam "limpo"', $pf['005_kits']['estado'] === 'limpo' && $pf['010_pedido_massa']['estado'] === 'limpo');
$e = $erro(fn() => $m->executar(false));
$ok('004 interrompida: executor recusa dizendo o que existe e o que falta', $e !== null && str_contains($e, '004_vinculos_exclusao_logica PARCIAL') && str_contains($e, 'JÁ EXISTE: cmd 1: coluna eq_grupo_atributo.versao')
    && str_contains($e, 'FALTA: cmd 2: coluna eq_grupo_escopo.versao') && str_contains($e, 'nenhum DDL executado'), (string) $e);
$ok('004 interrompida: nenhum DDL e ledger intacto (também no --dry-run)', $erro(fn() => $m->executar(true)) !== null && $foto() === $f0 && $m->aplicadas() === $led0);
$ok('004 interrompida: --registrar-se-completo recusado (não está completa)', str_contains((string) $erro(fn() => $m->executar(false, ['004_vinculos_exclusao_logica'])), 'recusado: estado é parcial'));
// recuperação A: desfazer a parte aplicada (1º comando do .revert.sql = mesmo ALTER) e migrar normalmente
$pdo->exec(Migrador::comandos((string) file_get_contents("$dir/004_vinculos_exclusao_logica.revert.sql"))[0]);
$ok('recuperação A (reverter a parcial): volta a "limpo"', $m->preflight()['004_vinculos_exclusao_logica']['estado'] === 'limpo');
$r = $m->executar(false);
$ok('recuperação A: executor aplica 004–010 e tudo "ok"', count($r['aplicadas']) === 7 && !array_filter($m->preflight(), static fn($x) => $x['estado'] !== 'ok'));

// 2.4 interrupção depois do 1º DDL da 008 (001–007 pelo executor; 1º ALTER da 008 à mão)
$recria();
$limpaPastas[] = $p = $pasta($ate('007_produto_atributo'));
(new Migrador($pdo, $schema, $p, $silencio))->executar(false);
$pdo->exec("USE `$schema`"); $pdo->exec($cmd('008_unidade_por_valor', 1));
$f0 = $foto(); $led0 = $m->aplicadas();
$e = $erro(fn() => $m->executar(false));
$ok('008 interrompida: "parcial" com coluna e FK de eq_valor presentes; fator_base e eq_atributo_unidade faltando', $e !== null && str_contains($e, '008_unidade_por_valor PARCIAL')
    && str_contains($e, 'cmd 1: FK eq_valor.fk_eq_valor_unidade') && str_contains($e, 'FALTA: cmd 2: coluna eq_unidade.fator_base') && str_contains($e, 'cmd 3: tabela eq_atributo_unidade'), (string) $e);
$ok('008 interrompida: nenhum DDL e ledger intacto', $foto() === $f0 && $m->aplicadas() === $led0);
// recuperação B: completar os comandos que faltam (2 e 3) e registrar só com a flag explícita
$pdo->exec($cmd('008_unidade_por_valor', 2)); $pdo->exec($cmd('008_unidade_por_valor', 3));
$e = $erro(fn() => $m->executar(false));
$ok('completa sem ledger: recusa sem a flag', $e !== null && str_contains($e, '008_unidade_por_valor já está fisicamente COMPLETA') && str_contains($e, '--registrar-se-completo 008_unidade_por_valor'), (string) $e);
$f1 = $foto();
$r = $m->executar(true, ['008_unidade_por_valor']);
$ok('--dry-run com a flag: só anuncia (registradas=[008]), não grava', $r['registradas'] === ['008_unidade_por_valor'] && !array_key_exists('008_unidade_por_valor', $m->aplicadas()));
$r = $m->executar(false, ['008_unidade_por_valor']);
$ap = $m->aplicadas();
$ok('recuperação B: 008 registrada com o sha256 do arquivo, SEM DDL da 008; 009–010 aplicadas', $r['registradas'] === ['008_unidade_por_valor'] && $r['aplicadas'] === ['009_sugestao', '010_pedido_massa']
    && ($ap['008_unidade_por_valor'] ?? null) === hash_file('sha256', "$dir/008_unidade_por_valor.sql"));
$ok('recuperação B: tudo "ok" no fim', !array_filter($m->preflight(), static fn($x) => $x['estado'] !== 'ok'));
$ok('--registrar-se-completo de migração já no ledger é recusado', str_contains((string) $erro(fn() => $m->executar(false, ['008_unidade_por_valor'])), 'recusado: estado é ok'));

// 2.5 migrações FUTURAS: DDL não suportado recusa; pendentes encadeadas usam o estado virtual
$limpaPastas[] = $p = $pasta($todas, ['011_futura_modify' => "ALTER TABLE `eq_valor` MODIFY COLUMN `valor_texto` VARCHAR(900) NULL;\nINSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('011_futura_modify', NULL);"]);
$f0 = $foto();
$e = $erro(fn() => (new Migrador($pdo, $schema, $p, $silencio))->executar(false));
$ok('futura com DDL que o preflight não lê: recusa sem aplicar', $e !== null && str_contains($e, '011_futura_modify: preflight não sabe verificar') && $foto() === $f0, (string) $e);
$limpaPastas[] = $p = $pasta($todas, [
    '011_futura_add'  => "ALTER TABLE `eq_unidade` ADD COLUMN `tmp_pf` INT NULL, ADD KEY `idx_tmp_pf` (`tmp_pf`);\nINSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('011_futura_add', NULL);",
    '012_futura_drop' => "ALTER TABLE `eq_unidade` DROP KEY `idx_tmp_pf`, DROP COLUMN `tmp_pf`;\nINSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('012_futura_drop', NULL);",
]);
$mf = new Migrador($pdo, $schema, $p, $silencio);
$pf = $mf->preflight();
$ok('futuras 011 (cria) + 012 (remove) pendentes: ambas "limpo" pelo estado virtual', $pf['011_futura_add']['estado'] === 'limpo' && $pf['012_futura_drop']['estado'] === 'limpo', json_encode([$pf['011_futura_add']['estado'], $pf['012_futura_drop']['estado']]));
$r = $mf->executar(false);
$pf = $mf->preflight();
$ok('futuras aplicadas e conferidas no ledger (012 removeu o que a 011 criou; ambas "ok")', $r['aplicadas'] === ['011_futura_add', '012_futura_drop'] && $pf['011_futura_add']['estado'] === 'ok' && $pf['012_futura_drop']['estado'] === 'ok');
// já aplicada fisicamente sem ledger numa futura (ex.: alguém rodou o ALTER à mão)
$limpaPastas[] = $p = $pasta($todas, ['011_futura_add' => "ALTER TABLE `eq_unidade` ADD COLUMN `tmp_pf2` INT NULL;\nINSERT INTO `eq_schema_migrations` (`version`, `checksum`) VALUES ('011_futura_add', NULL);"]);
$pdo->exec("DELETE FROM `$schema`.`eq_schema_migrations` WHERE version IN ('011_futura_add', '012_futura_drop')");
$pdo->exec("ALTER TABLE `$schema`.`eq_unidade` ADD COLUMN `tmp_pf2` INT NULL");
$e = $erro(fn() => (new Migrador($pdo, $schema, $p, $silencio))->executar(false));
$ok('futura com ALTER já aplicado à mão (sem ledger): recusa "COMPLETA"', $e !== null && str_contains($e, '011_futura_add já está fisicamente COMPLETA'), (string) $e);
$e = $erro(fn() => (new Migrador($pdo, $schema, $pasta($todas, ['011_futura_dados' => "ALTER TABLE `eq_unidade` ADD COLUMN `tmp_pf2` INT NULL;\nUPDATE `eq_unidade` SET `tmp_pf2` = 1;"]), $silencio))->executar(false, ['011_futura_dados']));
$ok('--registrar-se-completo recusado quando a migração tem comandos de dados', $e !== null && str_contains($e, 'tem comandos de dados'), (string) $e);
$pdo->exec("ALTER TABLE `$schema`.`eq_unidade` DROP COLUMN `tmp_pf2`");

foreach (glob(sys_get_temp_dir() . '/atr-pf-' . getmypid() . '-*') as $t) { array_map('unlink', glob("$t/*")); @rmdir($t); }
echo ($falhas ? '[ERRO]' : '[OK]  ') . " executor-preflight ($schema): $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
