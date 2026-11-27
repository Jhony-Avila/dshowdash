<?php
// UARPS · saneamento, item A (AZUL, 27/11/2026) — ator = o Dono FICTÍCIO (990075; nunca o id 75 em teste): pela hierarquia confirmada (27/11 07:4x), revogação por não-Dono é 403; este teste prova o contrato de escrita, não a hierarquia (que está no teste-uarps-revogacao-dono) — contrato de escrita das permissões individuais, com o UarpsService/UARPSRepository REAIS
// num MySQL LOCAL descartável (esq_uarpsa_<pid>, criado e removido aqui; dados sintéticos; config/ de TESTE numa pasta temporária própria).
//  1 regra nova = regra + 1 evento (operação, origem, antes/depois) na mesma transação
//  2 mesmo id + mesmo pedido = mesmo resultado, sem regravar nem novo evento · 3 mesmo id + outro pedido = 409, nada muda
//  4 vencimento: omitido preserva · null remove · data futura grava · passado/formato inválido = 400
//  5 lote: um item inválido = 400 e NADA aplicado · lote válido conta alterados/inalterados e preserva vencimento
//  6 evento falha (gatilho SIGNAL na auditoria) = ROLLBACK da regra e da operação + erro 500 explícito
//  7 par repetido (2 linhas vigentes) = as 2 recebem o mesmo estado; 1 evento
//  8 remoção = exclusão lógica + evento com o "antes" (+ concedente_id) e o "depois" = {revogador_id} (NAV-04, 27/11); remover de novo = nada, sem evento
//  9 reset = 1 evento por regra (entity_type gatilho/região, dentro do ENUM) · 10 sem a migração = 503, nada gravado
// 11 duas requisições simultâneas com o mesmo id = 1 aplicação e 1 repetição (sem evento duplicado)
// 12 controlador: sem a getClientIp() duplicada e sem o `use` da classe inexistente (as 2 causas de erro fatal no carregamento)
declare(strict_types=1);
if (!defined('DSHOW_DONO_ID')) { define('DSHOW_DONO_ID', 990075); }   // Dono FICTÍCIO
$raiz = realpath(__DIR__ . '/../..');
$f = []; $n = 0; $ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
try { $root = new PDO('mysql:unix_socket=/var/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); }
catch (Throwable) { echo "[PULADO] teste-uarps-escrita: MySQL local indisponível\n"; exit(0); }
$db = 'esq_uarpsa_' . getmypid(); $db2 = $db . '_sem';
$tmp = sys_get_temp_dir() . '/esq-uarpsa-' . getmypid();
$limpar = static function () use ($root, $db, $db2, $tmp): void {
    // regra das 05:00 (arquiteto): bancos DESCARTÁVEIS de teste deste agente podem ser apagados; o temporário de arquivos vai por mv para /backup
    foreach ([$db, $db2] as $b) { $root->exec("DROP DATABASE IF EXISTS `$b`"); $root->exec("DROP DATABASE IF EXISTS `{$b}_fim`"); }
    if (is_dir($tmp)) { exec('mv ' . escapeshellarg($tmp) . ' ' . escapeshellarg('/backup/esquerda/' . date('Ymd-His') . '-teste-uarps-escrita-tmp')); }
};
register_shutdown_function($limpar);
// árvore temporária: api/ do candidato + config/ de teste (nunca a config real)
foreach (['api/permissions/services/UarpsService.php', 'api/permissions/validators/UarpsValidator.php', 'api/core/repositories/UARPSRepository.php',
          'api/core/RepositoryException.php', 'api/core/UARPSGate.php', 'api/core/AccessLevels.php', 'api/core/UARPSPadrao.php', 'api/core/UarpsEscrita.php', 'api/core/UarpsRegrasDono.php', 'api/_helpers/GuardaDono.php'] as $arq) {
    $origem = is_file("$raiz/$arq") ? "$raiz/$arq" : (is_file("$raiz/" . str_replace('api/core/RepositoryException.php', 'api/core/repositories/RepositoryException.php', $arq)) ? "$raiz/" . str_replace('api/core/RepositoryException.php', 'api/core/repositories/RepositoryException.php', $arq) : null);
    if ($origem === null) { continue; }
    @mkdir(dirname("$tmp/$arq"), 0700, true); copy($origem, "$tmp/$arq");
}
foreach (glob("$raiz/api/core/repositories/*Exception*.php") as $x) { @mkdir("$tmp/api/core/repositories", 0700, true); copy($x, "$tmp/api/core/repositories/" . basename($x)); }
@mkdir("$tmp/config", 0700, true);
file_put_contents("$tmp/config/uarps.php", "<?php\nif (!class_exists('UARPSConfig')) { final class UARPSConfig { public static function getMode(): string { return 'shadow'; } public static function isActive(): bool { return true; } public static function shouldEnforce(): bool { return false; } public static function shouldLogDivergence(): bool { return false; } } }\n");
file_put_contents("$tmp/config/db_connection.php", "<?php\nif (!function_exists('getConnection')) { function getConnection(string \$b): PDO { return new PDO('mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=' . getenv('UARPSA_DB') . ';charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); } }\n");
$root->exec("CREATE DATABASE $db"); $root->exec("CREATE DATABASE $db2"); putenv("UARPSA_DB=$db");
foreach ([$db, $db2] as $b) {
    foreach (['app_user_trigger_permissions', 'app_user_region_permissions'] as $t) { $root->exec("CREATE TABLE $b.$t LIKE ATRWEB_VAL_DASH.$t"); }
    // app_uarps_audit_log: estrutura da produção (evidência DSHOW-UARPS-estrutura, colunas 1–11)
    $root->exec("CREATE TABLE $b.app_uarps_audit_log (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NULL, action VARCHAR(50) NOT NULL,
        entity_type ENUM('trigger','region') NOT NULL, entity_id VARCHAR(100) NOT NULL, target_user_id INT UNSIGNED NOT NULL, old_state VARCHAR(20) NULL,
        new_state VARCHAR(20) NULL, reason VARCHAR(255) NULL, ip_address VARCHAR(45) NULL, created_at DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3)) ENGINE=InnoDB");
}
$pdo = new PDO("mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=$db;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
$pdo->exec("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'");
$mig = (string) file_get_contents("$raiz/scripts/uarps/migracao-uarps-escrita-20261127.sql");
foreach ([1, 2] as $vez) { foreach (array_filter(array_map('trim', explode(";\n", $mig))) as $q) { if (!str_starts_with($q, '--') || str_contains($q, "\n")) { $pdo->exec(preg_replace('/^--.*$/m', '', $q)); } } }
$col = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '$db' AND table_name = 'app_uarps_audit_log' AND column_name IN ('operacao_id','origem','antes_json','depois_json')")->fetchColumn();
$ok($col === 4 && (int) $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$db' AND table_name = 'app_uarps_operacoes'")->fetchColumn() === 1, 'migração aplicada 2× (4 colunas + tabela de operações)');
require "$tmp/api/permissions/services/UarpsService.php";
$s = new UarpsService($pdo);
$ev = static fn () => (int) $pdo->query('SELECT COUNT(*) FROM app_uarps_audit_log')->fetchColumn();
$regra = static fn (int $u, string $k) => $pdo->query("SELECT state, LEFT(expires_at, 19) AS expires_at, reason, COUNT(*) OVER () AS n FROM app_user_trigger_permissions WHERE user_id = $u AND trigger_id = " . $pdo->quote($k) . " AND deleted_at IS NULL")->fetch() ?: null;
$erro = static function (callable $c): ?UarpsEscritaErro { try { $c(); return null; } catch (UarpsEscritaErro $e) { return $e; } };
$op = static fn (string $x) => 'op-teste-' . str_pad($x, 8, '0', STR_PAD_LEFT);
// 1
$r1 = $s->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:x', 'state' => 'allow', 'reason' => 'teste'], DSHOW_DONO_ID, '127.0.0.1', $op('1'));
$e1 = $pdo->query("SELECT action, entity_type, entity_id, target_user_id, user_id, operacao_id, origem, antes_json, depois_json FROM app_uarps_audit_log ORDER BY id DESC LIMIT 1")->fetch();
$ok(($regra(501, 'trigger:panel:x')['state'] ?? '') === 'allow' && $ev() === 1 && $e1['operacao_id'] === $op('1') && $e1['origem'] === 'editor' && $e1['antes_json'] === null
    && json_decode((string) $e1['depois_json'], true)['state'] === 'allow' && (int) $e1['target_user_id'] === 501 && (int) $e1['user_id'] === DSHOW_DONO_ID, '1 regra nova: regra + 1 evento com operação, origem, alvo, ator e depois');
// 2
$r2 = $s->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:x', 'state' => 'allow', 'reason' => 'teste'], DSHOW_DONO_ID, '127.0.0.1', $op('1'));
$ok(($r2['repeticao'] ?? false) === true && $r2['state'] === $r1['state'] && $ev() === 1, '2 mesmo id + mesmo pedido: mesmo resultado, sem novo evento');
// 2b repetição SEM EFEITO com OUTRO id (mesmo conteúdo): nada gravado, nenhum evento de mudança (entrega (a) do GPT Warps)
$r2b = $s->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:x', 'state' => 'allow', 'reason' => 'teste'], DSHOW_DONO_ID, '127.0.0.1', $op('2b'));
$ok(($r2b['alterado'] ?? null) === false && !isset($r2b['repeticao']) && $ev() === 1, '2b mesmo conteúdo com OUTRO id: alterado=false e nenhum evento de mudança');
// 3
$e3 = $erro(fn () => $s->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:x', 'state' => 'deny'], DSHOW_DONO_ID, '127.0.0.1', $op('1')));
$ok($e3 !== null && $e3->http === 409 && ($regra(501, 'trigger:panel:x')['state'] ?? '') === 'allow' && $ev() === 1, '3 mesmo id + outro pedido: 409 e nada muda');
// 4 vencimento
$futuro = (new DateTimeImmutable('+10 days'))->format('Y-m-d');
$s->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:x', 'state' => 'allow', 'reason' => 'teste', 'expires_at' => $futuro], DSHOW_DONO_ID, '127.0.0.1', $op('4a'));
$ok(($regra(501, 'trigger:panel:x')['expires_at'] ?? '') === "$futuro 23:59:59", '4a data futura grava o prazo');
$s->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:x', 'state' => 'deny', 'reason' => 'teste'], DSHOW_DONO_ID, '127.0.0.1', $op('4b'));
$ok(($regra(501, 'trigger:panel:x')['state'] ?? '') === 'deny' && ($regra(501, 'trigger:panel:x')['expires_at'] ?? '') === "$futuro 23:59:59", '4b vencimento OMITIDO é preservado ao mudar o estado');
$s->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:x', 'state' => 'deny', 'reason' => 'teste', 'expires_at' => null], DSHOW_DONO_ID, '127.0.0.1', $op('4c'));
$r4c = $regra(501, 'trigger:panel:x');
$ok(is_array($r4c) && array_key_exists('expires_at', $r4c) && $r4c['expires_at'] === null, '4c vencimento null remove o prazo (explícito)');
$e4 = $erro(fn () => $s->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:x', 'state' => 'allow', 'expires_at' => '2020-01-01'], DSHOW_DONO_ID, '127.0.0.1', $op('4d')));
$e4b = $erro(fn () => $s->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:x', 'state' => 'allow', 'expires_at' => 'amanhã'], DSHOW_DONO_ID, '127.0.0.1', $op('4e')));
$ok($e4 !== null && $e4->http === 400 && $e4b !== null && $e4b->http === 400 && ($regra(501, 'trigger:panel:x')['state'] ?? '') === 'deny', '4d prazo no passado / formato inválido = 400, nada muda');
// 5 lote
$antesEv = $ev();
$e5 = $erro(fn () => $s->bulkSetTriggers(['user_id' => 501, 'permissions' => ['trigger:panel:y' => 'allow', 'trigger:panel:z' => 'talvez']], DSHOW_DONO_ID, '127.0.0.1', $op('5a')));
$ok($e5 !== null && $e5->http === 400 && $regra(501, 'trigger:panel:y') === null && $ev() === $antesEv, '5a lote com 1 item inválido: 400 e NADA aplicado');
$s->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:t', 'state' => 'allow', 'expires_at' => $futuro], DSHOW_DONO_ID, '127.0.0.1', $op('5b'));
$antesEv = $ev();
$r5 = $s->bulkSetTriggers(['user_id' => 501, 'permissions' => ['trigger:panel:y' => 'allow', 'trigger:panel:t' => 'deny', 'trigger:panel:x' => 'deny']], DSHOW_DONO_ID, '127.0.0.1', $op('5c'));
$ok($r5['updated'] === 2 && $r5['unchanged'] === 1 && $ev() === $antesEv + 2 && ($regra(501, 'trigger:panel:t')['expires_at'] ?? '') === "$futuro 23:59:59", '5b lote válido: 2 alterados, 1 inalterado, 2 eventos, vencimento PRESERVADO');
// 6 falha do evento
$pdo->exec("CREATE TRIGGER tg_falha BEFORE INSERT ON app_uarps_audit_log FOR EACH ROW BEGIN IF NEW.entity_id = 'trigger:panel:falha' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'auditoria fora'; END IF; END");
$antesEv = $ev();
$e6 = $erro(fn () => $s->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:falha', 'state' => 'allow'], DSHOW_DONO_ID, '127.0.0.1', $op('6')));
$opGravada = (int) $pdo->query("SELECT COUNT(*) FROM app_uarps_operacoes WHERE operacao_id = " . $pdo->quote($op('6')))->fetchColumn();
$ok($e6 !== null && $e6->http === 500 && $e6->codigo === 'UARPS_ESCRITA_FALHOU' && $regra(501, 'trigger:panel:falha') === null && $ev() === $antesEv && $opGravada === 0, '6 evento falhou: ROLLBACK (regra e operação desfeitas) + 500 explícito');
$pdo->exec('DROP TRIGGER tg_falha');
$r6 = $s->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:falha', 'state' => 'allow'], DSHOW_DONO_ID, '127.0.0.1', $op('6'));
$ok(($regra(501, 'trigger:panel:falha')['state'] ?? '') === 'allow' && !isset($r6['repeticao']), '6b o mesmo id, repetido depois da falha, APLICA (a falha não deixou rastro)');
// 7 par repetido
$pdo->exec("INSERT INTO app_user_trigger_permissions (user_id, trigger_id, state, reason) VALUES (502, 'trigger:navigation:pref', 'allow', 'a'), (502, 'trigger:navigation:pref', 'allow', 'b')");
$antesEv = $ev();
$s->setTrigger(['user_id' => 502, 'trigger_id' => 'trigger:navigation:pref', 'state' => 'deny', 'reason' => 'teste'], DSHOW_DONO_ID, '127.0.0.1', $op('7'));
$estados = $pdo->query("SELECT GROUP_CONCAT(DISTINCT state) FROM app_user_trigger_permissions WHERE user_id = 502 AND deleted_at IS NULL")->fetchColumn();
$ok($estados === 'deny' && (int) $pdo->query("SELECT COUNT(*) FROM app_user_trigger_permissions WHERE user_id = 502 AND deleted_at IS NULL")->fetchColumn() === 2 && $ev() === $antesEv + 1, '7 par repetido: as 2 linhas recebem o mesmo estado (nenhuma apagada), 1 evento');
// 8 remoção
$antesEv = $ev();
$r8 = $s->removeTrigger(502, 'trigger:navigation:pref', DSHOW_DONO_ID, '127.0.0.1', $op('8a'), 'saiu da equipe');
$e8 = $pdo->query("SELECT action, origem, antes_json, depois_json, reason FROM app_uarps_audit_log ORDER BY id DESC LIMIT 1")->fetch();
$r8b = $s->removeTrigger(502, 'trigger:navigation:pref', DSHOW_DONO_ID, '127.0.0.1', $op('8b'));
$ok($r8['removida'] === true && $r8['linhas'] === 2 && $e8['origem'] === 'remocao' && json_decode((string) $e8['antes_json'], true)['state'] === 'deny' && json_decode((string) $e8['depois_json'], true) === ['revogador_id' => DSHOW_DONO_ID] && $e8['reason'] === 'saiu da equipe'
    && $r8b['removida'] === false && $ev() === $antesEv + 1, '8 remoção: exclusão lógica + evento com o antes e o motivo; remover de novo = nada');
// 9 reset
$pdo->exec("INSERT INTO app_user_region_permissions (user_id, region_id, state) VALUES (501, 'region:sul', 'allow')");
$vig = (int) $pdo->query("SELECT COUNT(*) FROM app_user_trigger_permissions WHERE user_id = 501 AND deleted_at IS NULL")->fetchColumn();
$antesEv = $ev();
$r9 = $s->resetUser(501, DSHOW_DONO_ID, '127.0.0.1', 'reset de teste', $op('9'));
$tipos = $pdo->query("SELECT GROUP_CONCAT(DISTINCT entity_type ORDER BY entity_type) FROM app_uarps_audit_log WHERE operacao_id = " . $pdo->quote($op('9')))->fetchColumn();
$ok($r9['triggers_reset'] === $vig && $r9['regions_reset'] === 1 && $ev() === $antesEv + $vig + 1 && count(array_intersect(explode(',', (string) $tipos), ['trigger', 'region'])) === 2, '9 reset: 1 evento por regra, entity_type gatilho/região (dentro do ENUM)');   // ORDER BY de ENUM segue a posição na lista
// 10 sem a migração
$pdo2 = new PDO("mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=$db2;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
$e10 = $erro(fn () => (new UarpsService($pdo2))->setTrigger(['user_id' => 501, 'trigger_id' => 'trigger:panel:x', 'state' => 'allow'], DSHOW_DONO_ID, '127.0.0.1', $op('10')));
$ok($e10 !== null && $e10->http === 503 && (int) $pdo2->query('SELECT COUNT(*) FROM app_user_trigger_permissions')->fetchColumn() === 0, '10 sem a migração: 503 explícito e nada gravado');
// 11 duas requisições simultâneas com o mesmo id (dois processos)
file_put_contents("$tmp/par.php", '<?php define("DSHOW_DONO_ID", 990075); require "' . $tmp . '/api/permissions/services/UarpsService.php"; $p = new PDO("mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=' . $db . ';charset=utf8mb4", "root", "", [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);'
    . ' $r = (new UarpsService($p))->bulkSetTriggers(["user_id" => 503, "permissions" => ["trigger:panel:a" => "allow", "trigger:panel:b" => "allow", "trigger:panel:c" => "deny"]], 990075, "127.0.0.1", "op-teste-simultanea"); echo isset($r["repeticao"]) ? "R" : "A";');
$ps = []; foreach ([1, 2] as $i) { $ps[$i] = proc_open([PHP_BINARY, "$tmp/par.php"], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pp[$i]); }
$saida = ''; foreach ([1, 2] as $i) { $saida .= stream_get_contents($pp[$i][1]); fclose($pp[$i][1]); fclose($pp[$i][2]); proc_close($ps[$i]); }
$ev11 = (int) $pdo->query("SELECT COUNT(*) FROM app_uarps_audit_log WHERE operacao_id = 'op-teste-simultanea'")->fetchColumn();
$ok((count_chars($saida, 1)[ord('A')] ?? 0) === 1 && (count_chars($saida, 1)[ord('R')] ?? 0) === 1 && $ev11 === 3, '11 simultâneas com o mesmo id: 1 aplicação + 1 repetição, 3 eventos (sem duplicar) · saída ' . $saida);
// 12 controlador
$c = (string) file_get_contents("$raiz/api/permissions/uarps.php");
$ok(!preg_match('/^\s*function\s+getClientIp\s*\(/m', $c) && !preg_match('/^\s*use\s+Permissions\\\\Services\\\\UarpsService\s*;/m', $c) && str_contains($c, 'catch (UarpsEscritaErro $e)') && str_contains($c, 'uarpsOperacaoId('),
    '12 controlador: sem getClientIp() duplicada, sem o use da classe inexistente, erro explícito e id de operação obrigatório');
if ($f) { echo "[ERRO] teste-uarps-escrita:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   teste-uarps-escrita: $n verificações (regra+evento na mesma transação, rollback na falha do evento, idempotência, vencimento preservado, lote validado antes, par repetido, remoção, reset no ENUM, 503 sem migração, simultaneidade, controlador)\n";
