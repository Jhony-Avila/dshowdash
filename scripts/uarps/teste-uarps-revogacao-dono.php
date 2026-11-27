<?php
// UARPS · revogação pelo Dono (contrato NAV-04 × UARPS 100% fechado, decisão do Jhony 06:57) — AZUL 27/11, com o UarpsService/UARPSRepository REAIS
// num MySQL LOCAL descartável (esq_uarpsr_<pid>), identidades SINTÉTICAS (Dono FICTÍCIO = 990075 (regra 4 da AUTONOMIA 07:50: nunca o id 75 em teste); o titular 75 aparece SÓ como identidade da lista fixa; 501/502 = usuários fictícios; concedente 90).
// item 2 ANTIBLOQUEIO · item 4 CONGELADOS (inclusive por efeito indireto) · item 3 concedente/revogador no evento + acesso efetivo relido · item 1 o Dono revoga o que ele mesmo concedeu
declare(strict_types=1);
if (!defined('DSHOW_DONO_ID')) { define('DSHOW_DONO_ID', 990075); }   // Dono FICTÍCIO: a constante de produção (75, GuardaDono.php) não é usada em teste
$raiz = realpath(__DIR__ . '/../..');
$f = []; $n = 0; $detalhe = getenv('DETALHE') === '1';   // DETALHE=1: imprime também cada caso APROVADO (evidência positiva)
$ok = static function (bool $c, string $nome) use (&$f, &$n, $detalhe): void { $n++; if (!$c) { $f[] = $nome; } elseif ($detalhe) { echo '[ok] ', $nome, "\n"; } };
try { $root = new PDO('mysql:unix_socket=/var/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); }
catch (Throwable) { echo "[PULADO] teste-uarps-escrita: MySQL local indisponível\n"; exit(0); }
$db = 'esq_uarpsr_' . getmypid(); $db2 = $db . '_sem';
$tmp = sys_get_temp_dir() . '/esq-uarpsr-' . getmypid();
$limpar = static function () use ($root, $db, $db2, $tmp): void {
    // regra das 05:00 (arquiteto): bancos DESCARTÁVEIS de teste deste agente podem ser apagados; o temporário de arquivos vai por mv para /backup
    foreach ([$db, $db2] as $b) { $root->exec("DROP DATABASE IF EXISTS `$b`"); $root->exec("DROP DATABASE IF EXISTS `{$b}_fim`"); }
    if (is_dir($tmp)) { exec('mv ' . escapeshellarg($tmp) . ' ' . escapeshellarg('/backup/esquerda/' . date('Ymd-His') . '-teste-uarps-revogacao-tmp')); }
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
foreach (['app_roles', 'app_user_roles', 'app_uarps_divergence_log', 'app_users'] as $t) { $root->exec("CREATE TABLE $db.$t LIKE ATRWEB_VAL_DASH.$t"); }   // fixture COMPLETA (releitura por perfil)
$pdo->exec("INSERT INTO app_roles (id, role_key, role_name, level) VALUES (1, 'super_admin', 'Super', 100), (2, 'gerente', 'Gerente', 50), (3, 'equipe', 'Equipe', 20)");
$pdo->exec("INSERT INTO app_user_roles (user_id, role_id) VALUES (990075, 1), (508, 2), (90, 2)");
foreach ([990075, 90, 508, 513] as $u) { $pdo->exec("INSERT INTO app_users (id, email, password, username, status) VALUES ($u, 'u$u@sintetico.invalid', 'x', 'u$u', 'active')"); }   // nível = MAX(level) só de contas ativas
require "$tmp/api/permissions/services/UarpsService.php";
$s = new UarpsService($pdo);
$ev = static fn () => (int) $pdo->query('SELECT COUNT(*) FROM app_uarps_audit_log')->fetchColumn();
$regra = static fn (int $u, string $k) => $pdo->query("SELECT state, LEFT(expires_at, 19) AS expires_at, reason, COUNT(*) OVER () AS n FROM app_user_trigger_permissions WHERE user_id = $u AND trigger_id = " . $pdo->quote($k) . " AND deleted_at IS NULL")->fetch() ?: null;

$erro = static function (callable $c): ?UarpsEscritaErro { try { $c(); return null; } catch (UarpsEscritaErro $e) { return $e; } };
$op = static fn (string $x) => 'op-teste-' . str_pad($x, 8, '0', STR_PAD_LEFT);
$evs = static fn () => (int) $pdo->query('SELECT COUNT(*) FROM app_uarps_audit_log')->fetchColumn();
$foto = static fn () => $pdo->query("SELECT GROUP_CONCAT(CONCAT(user_id,':',trigger_id,':',state,':',COALESCE(LEFT(expires_at,19),'-'),':',IF(deleted_at IS NULL,'v','x')) ORDER BY id) FROM app_user_trigger_permissions")->fetchColumn();
$semear = static function (int $u, string $k, string $st, string $quando = '2026-11-20 10:00:00', int $por = 90) use ($pdo): void {
    $pdo->prepare('INSERT INTO app_user_trigger_permissions (user_id, trigger_id, state, reason, granted_by, granted_at) VALUES (?, ?, ?, ?, ?, ?)')->execute([$u, $k, $st, 'semente', $por, $quando]);
};
$pdo->exec('ALTER TABLE app_user_trigger_permissions AUTO_INCREMENT = 100000');   // linhas comuns nunca colidem com os ids REAIS da lista (1725–1735, 218)
$semearId = static function (int $id, int $u, string $k, string $st, string $quando, int $por) use ($pdo): void {
    $pdo->prepare('INSERT INTO app_user_trigger_permissions (id, user_id, trigger_id, state, reason, granted_by, granted_at) VALUES (?, ?, ?, ?, ?, ?, ?)')->execute([$id, $u, $k, $st, 'semente', $por, $quando]);
};
$D = DSHOW_DONO_ID;   // 990075 (fictício)
$semear($D, 'gate:admin:permissions', 'allow', '2026-11-20 10:00:00', $D);   // capacidade essencial do Dono (NÃO congelada: concedida em 20/11)
$semearId(1725, 75, 'gate:admin:users', 'allow', '2026-11-17 20:57:22', $D);   // congelada: IDENTIDADE da lista fixa (titular 75 só como id; banco descartável)
$semear($D, 'trigger:panel:financeiro', 'allow', '2026-11-20 10:00:00', $D); // direito financeiro/operacional do próprio Dono
$semearId(218, 153, 'trigger:navrail:clientes', 'deny', '2025-12-24 14:39:11', $D);   // a negação congelada de Clientes (identidade 218)
$semear(502, 'trigger:panel:y', 'allow', '2026-11-20 10:00:00', 90);          // concedida por OUTRO (90): o Dono revoga mesmo assim
$cod = static fn (?UarpsEscritaErro $e) => $e === null ? 'sem erro' : $e->codigo ?? (method_exists($e, 'getCode') ? (string) $e->getCode() : '?');
$c = static fn (?UarpsEscritaErro $e) => $e === null ? null : ($e->codigo ?? null);
$h = static fn (?UarpsEscritaErro $e) => $e === null ? 0 : ($e->http ?? 0);
// ── item 2: ANTIBLOQUEIO ──
foreach ([
    'remover o próprio gate:admin:permissions' => fn () => $s->removeTrigger($D, 'gate:admin:permissions', $D, '127.0.0.1', $op('a1')),
    'negar a si o gate:admin:permissions' => fn () => $s->setTrigger(['user_id' => $D, 'trigger_id' => 'gate:admin:permissions', 'state' => 'deny', 'reason' => 'x'], $D, '127.0.0.1', $op('a2')),
    'herdar (inherit) no gate:admin:permissions' => fn () => $s->setTrigger(['user_id' => $D, 'trigger_id' => 'gate:admin:permissions', 'state' => 'inherit', 'reason' => 'x'], $D, '127.0.0.1', $op('a3')),
    'pôr PRAZO no próprio gate:admin:permissions' => fn () => $s->setTrigger(['user_id' => $D, 'trigger_id' => 'gate:admin:permissions', 'state' => 'allow', 'expires_at' => '2031-01-01', 'reason' => 'x'], $D, '127.0.0.1', $op('a4')),
    'lote que nega o gate:admin:permissions (com outro item válido)' => fn () => $s->bulkSetTriggers(['user_id' => $D, 'permissions' => ['gate:admin:permissions' => 'deny', 'trigger:panel:outro' => 'allow'], 'reason' => 'x'], $D, '127.0.0.1', $op('a5')),
    'reset do próprio Dono' => fn () => $s->resetUser($D, $D, '127.0.0.1', 'x', $op('a6')),
] as $nome => $fn) {
    $f0 = $foto(); $e0 = $evs(); $e = $erro($fn);
    $ok($e !== null && $h($e) === 403 && $c($e) === 'ANTIBLOQUEIO' && $foto() === $f0 && $evs() === $e0, "item 2 · $nome → 403 ANTIBLOQUEIO com motivo, nada muda, 0 evento · " . ($e ? $h($e) . ' ' . $c($e) : 'passou'));
}
$e0 = $evs();
$r = $s->removeTrigger($D, 'trigger:panel:financeiro', $D, '127.0.0.1', $op('a7'));
$ok(($r['removida'] ?? false) === true && $evs() === $e0 + 1, 'item 2 · o Dono RETIRA de si um direito financeiro/operacional (trigger:panel:financeiro) → removida, 1 evento');
// ── item 3: concedente_id e revogador_id no evento; acesso efetivo relido ──
$ev = $pdo->query("SELECT antes_json, depois_json FROM app_uarps_audit_log ORDER BY id DESC LIMIT 1")->fetch();
$a = json_decode((string) $ev['antes_json'], true); $d = json_decode((string) $ev['depois_json'], true);
$evr = $pdo->query("SELECT target_user_id, entity_type, entity_id, reason, operacao_id, created_at FROM app_uarps_audit_log ORDER BY id DESC LIMIT 1")->fetch();
$ok((int) $evr['target_user_id'] === $D && $evr['entity_type'] === 'trigger' && $evr['entity_id'] === 'trigger:panel:financeiro' && $evr['operacao_id'] === $op('a7') && $evr['created_at'] !== null && ($a['concedido_em'] ?? null) === '2026-11-20 10:00:00.000',
    'v4 · evento de revogação com alvo, escopo (tipo + chave), operação, data do evento e data da concessão original (concedido_em)');
$ok(($a['concedente_id'] ?? null) === $D && ($d['revogador_id'] ?? null) === $D && ($r['concedente_id'] ?? null) === $D && ($r['revogador_id'] ?? null) === $D, 'item 3 · evento e resposta com concedente_id (granted_by) e revogador_id (ator)');
$ok(array_key_exists('acesso_efetivo', $r) && ($r['acesso_efetivo'] === null || array_key_exists('ainda_permitido', $r['acesso_efetivo'])), 'item 3 · depois de gravar, a resposta traz o acesso efetivo relido (ou null = indisponível, nunca "permitido" por omissão) · ' . json_encode($r['acesso_efetivo'] ?? 'ausente'));
// ── item 1: o Dono revoga concessão emitida por OUTRO, sem superior ──
$e0 = $evs(); $r1 = $s->removeTrigger(502, 'trigger:panel:y', $D, '127.0.0.1', $op('a8'));
$ev1 = json_decode((string) $pdo->query("SELECT antes_json FROM app_uarps_audit_log ORDER BY id DESC LIMIT 1")->fetchColumn(), true);
$ok(($r1['removida'] ?? false) === true && ($ev1['concedente_id'] ?? null) === 90 && ($r1['revogador_id'] ?? null) === $D, 'item 1 · o Dono revoga concessão emitida por outro (90) → removida; concedente 90, revogador 75');
// ── item 4: CONGELADOS, inclusive por efeito indireto ──
foreach ([
    'remover a congelada 1725' => fn () => $s->removeTrigger(75, 'gate:admin:users', $D, '127.0.0.1', $op('c1')),
    'negar a congelada 1725' => fn () => $s->setTrigger(['user_id' => 75, 'trigger_id' => 'gate:admin:users', 'state' => 'deny', 'reason' => 'x'], $D, '127.0.0.1', $op('c2')),
    'prazo na congelada 1725' => fn () => $s->setTrigger(['user_id' => 75, 'trigger_id' => 'gate:admin:users', 'state' => 'allow', 'expires_at' => '2031-01-01', 'reason' => 'x'], $D, '127.0.0.1', $op('c3')),
    'lote com a congelada 1725 (e outro item válido)' => fn () => $s->bulkSetTriggers(['user_id' => 75, 'permissions' => ['gate:admin:users' => 'inherit', 'trigger:panel:z' => 'allow'], 'reason' => 'x'], $D, '127.0.0.1', $op('c4')),
    'remover o deny trigger:navrail:clientes' => fn () => $s->removeTrigger(153, 'trigger:navrail:clientes', $D, '127.0.0.1', $op('c5')),
    'trocar o deny de Clientes por allow' => fn () => $s->setTrigger(['user_id' => 153, 'trigger_id' => 'trigger:navrail:clientes', 'state' => 'allow', 'reason' => 'x'], $D, '127.0.0.1', $op('c6')),
    'reset do usuário com o deny de Clientes (efeito indireto)' => fn () => $s->resetUser(153, $D, '127.0.0.1', 'x', $op('c7')),
] as $nome => $fn) {
    $f0 = $foto(); $e0 = $evs(); $e = $erro($fn);
    $ok($e !== null && $h($e) === 409 && $c($e) === 'CONGELADO' && $foto() === $f0 && $evs() === $e0, "item 4 · $nome → 409 CONGELADO, nada muda, 0 evento · " . ($e ? $h($e) . ' ' . $c($e) : 'passou'));
}
$e = $erro(fn () => $s->resetUser(153, $D, '127.0.0.1', 'x', $op('c8')));
$ok($e !== null && in_array('trigger:navrail:clientes', (array) (($e->detalhes ?? $e->extra ?? [])['congeladas'] ?? []), true), 'item 4 · a recusa LISTA as regras congeladas');
// a mesma chave fora do critério NÃO é congelada: gate:* de outro dia e Clientes em allow
$semear(502, 'gate:admin:monitor', 'allow', '2026-11-19 10:00:00', $D); $semear(503, 'trigger:navrail:clientes', 'allow', '2026-11-19 10:00:00', $D);
$ok(($s->removeTrigger(502, 'gate:admin:monitor', $D, '127.0.0.1', $op('c9'))['removida'] ?? false) === true && ($s->removeTrigger(503, 'trigger:navrail:clientes', $D, '127.0.0.1', $op('ca'))['removida'] ?? false) === true, 'item 4 · fora do critério (gate:* de 19/11; Clientes em allow) → revogação normal');
// ── R26-C / precisão do GPT Warps ──
$semearId(1726, 75, 'gate:admin:settings', 'allow', '2026-11-17 20:57:22', $D); $semearId(1727, 75, 'gate:admin:settings:super', 'allow', '2026-11-17 20:57:22', $D);
$semearId(1728, $D, 'gate:admin:feature-flags', 'allow', '2026-11-17 20:57:22', $D);   // id 1728 da lista com OUTRO titular = bloqueada por divergência
$f0 = $foto(); $e0 = $evs();
$e = $erro(fn () => $s->bulkSetTriggers(['user_id' => 75, 'permissions' => ['gate:admin:settings' => 'deny', 'trigger:panel:livre' => 'allow', 'gate:admin:settings:super' => 'deny'], 'reason' => 'x'], $D, '127.0.0.1', $op('r1')));
$lst = (array) ($e->detalhes['congeladas'] ?? []); sort($lst);
$ok($e !== null && $h($e) === 409 && $lst === ['gate:admin:settings', 'gate:admin:settings:super'] && $foto() === $f0 && $evs() === $e0, 'R26-C · lote com 2 congeladas + 1 livre → 409 listando AS DUAS; o item livre também NÃO é gravado; 0 evento · ' . json_encode($lst));
$e = $erro(fn () => $s->bulkSetTriggers(['user_id' => $D, 'permissions' => ['gate:admin:feature-flags' => 'deny', 'gate:admin:permissions' => 'deny'], 'reason' => 'x'], $D, '127.0.0.1', $op('r2')));
$ok($e !== null && $h($e) === 403 && $c($e) === 'ANTIBLOQUEIO' && $foto() === $f0, 'R26-C · lote com antibloqueio E congelada → 403 ANTIBLOQUEIO (precedência), nada muda');
// par repetido: a linha MAIS NOVA não é congelada, a mais antiga é (17/11) — a conferência olha TODAS as linhas atingidas
$semearId(1730, 75, 'gate:admin:audit', 'allow', '2026-11-17 20:57:22', $D); $semear(75, 'gate:admin:audit', 'allow', '2026-11-20 09:00:00', $D);
$f0 = $foto(); $e0 = $evs();
$e1 = $erro(fn () => $s->removeTrigger(75, 'gate:admin:audit', $D, '127.0.0.1', $op('r3')));
$e2 = $erro(fn () => $s->setTrigger(['user_id' => 75, 'trigger_id' => 'gate:admin:audit', 'state' => 'deny', 'reason' => 'x'], $D, '127.0.0.1', $op('r4')));
$e3 = $erro(fn () => $s->resetUser(75, $D, '127.0.0.1', 'x', $op('r5')));
$ok($e1 && $h($e1) === 409 && $e2 && $h($e2) === 409 && $e3 && $h($e3) === 409 && $foto() === $f0 && $evs() === $e0, 'R26-C · par repetido com só a 2ª linha congelada: remoção, edição e reset → 409, nada muda (antes só $linhas[0] era conferida)');
// ── LISTA FIXA DE PRODUÇÃO (lida pelo Jhony 27/11 07:41): o escritor carregou ESTA lista ──
$lc = UarpsRegrasDono::listaCarregada();
$ok($lc['total'] === 12 && $lc['sha256'] === '388794ecd5ff6e39241c62b3e0a0d13ef8c48e9c0c9b2a38166da42da06738d8' && $lc['por_titular'] === [75 => range(1725, 1735), 153 => [218]],
    'lista fixa · escritor carregou a lista de produção: 12 regras · sha256 ' . $lc['sha256'] . ' · ' . implode(' · ', array_map(fn ($t, $ids) => "titular $t = " . count($ids) . ' (' . implode(',', $ids) . ')', array_keys($lc['por_titular']), $lc['por_titular'])));
// identidade lógica: linha IDÊNTICA à da lista (id+titular+chave+estado+data) → congelada; id da lista com outro conteúdo → bloqueia (divergência)
$pdo->exec("INSERT INTO app_user_trigger_permissions (id, user_id, trigger_id, state, reason, granted_by, granted_at) VALUES
  (1734, 75, 'gate:admin:panels:edit', 'allow', 'r', $D, '2026-11-17 20:57:22.000'), (1729, 520, 'trigger:panel:outro', 'allow', 'r', $D, '2026-11-20 10:00:00.000')");
$f0 = $foto(); $e0 = $evs();
$l1 = $erro(fn () => $s->removeTrigger(75, 'gate:admin:panels:edit', $D, '127.0.0.1', $op('lf1')));
$l2 = $erro(fn () => $s->setTrigger(['user_id' => 153, 'trigger_id' => 'trigger:navrail:clientes', 'state' => 'allow', 'reason' => 'x'], $D, '127.0.0.1', $op('lf2')));
$l3 = $erro(fn () => $s->removeTrigger(520, 'trigger:panel:outro', $D, '127.0.0.1', $op('lf3')));
$l4 = $erro(fn () => $s->bulkSetTriggers(['user_id' => 75, 'permissions' => ['gate:admin:panels:edit' => 'deny', 'trigger:panel:livre2' => 'allow'], 'reason' => 'x'], $D, '127.0.0.1', $op('lf4')));
$ok($l1 && $h($l1) === 409 && $l2 && $h($l2) === 409 && $l3 && $h($l3) === 409 && $l4 && $h($l4) === 409 && $foto() === $f0 && $evs() === $e0,
    'lista fixa · regra 1734 (titular 75) e 218 (titular 153, deny) idênticas à lista → 409; id 1729 com outro titular/chave → 409 por divergência; lote com 1 congelada + 1 livre → 409; nada muda, 0 evento');
// lista ausente / incompleta / sha divergente → 503 e NENHUMA alteração passa (nem a de uma regra livre)
$real = UarpsRegrasDono::LISTA_FIXA; $inc = $real; unset($inc[1735]); $adult = $real; $adult[1725][3] = '2026-11-17 20:57:23';
$titular = $real; $titular[1730][0] = 76;                                  // titular trocado (12 regras, mesma composição)
$chave = $real; $chave[1731][1] = 'gate:admin:logs-x';                     // chave trocada
$parcial = $real; unset($parcial[1735]); $parcial[1736] = [75, 'gate:admin:extra', 'allow', '2026-11-17 20:57:22'];   // 12 regras, 1 fora
$compo = $real; $compo[1725][2] = 'deny';                                  // 10 allow + 2 deny
$res = [];
foreach (['ausente' => [], 'incompleta' => $inc, 'titular_trocado' => $titular, 'chave_trocada' => $chave, 'regra_substituida' => $parcial, 'composicao' => $compo, 'data_alterada' => $adult] as $nome => $lst) {
    UarpsRegrasDono::definirListaParaTeste($lst);
    $f0 = $foto(); $e0 = $evs();
    $x1 = $erro(fn () => $s->setTrigger(['user_id' => 521, 'trigger_id' => 'trigger:panel:livre3', 'state' => 'allow', 'reason' => 'x'], $D, '127.0.0.1', $op("ls-$nome-1")));
    $x2 = $erro(fn () => $s->removeTrigger(520, 'trigger:panel:outro', $D, '127.0.0.1', $op("ls-$nome-2")));
    $x3 = $erro(fn () => $s->resetUser(512, $D, '127.0.0.1', 'x', $op("ls-$nome-3")));
    $res[$nome] = ($x1 && $h($x1) === 503 && $c($x1) === 'CONGELADOS_INDISPONIVEIS' && $x2 && $h($x2) === 503 && $x3 && $h($x3) === 503 && $foto() === $f0 && $evs() === $e0) ? '503 ' . ($x1->detalhes['motivo'] ?? '') : 'FALHOU';
}
UarpsRegrasDono::definirListaParaTeste(null);
$ok(!in_array('FALHOU', $res, true), 'lista fixa · ausente, incompleta (11 de 12), titular trocado, chave trocada, regra substituída, composição 10+2 e data alterada → 503 CONGELADOS_INDISPONIVEIS em set/remoção/reset, nada muda, 0 evento · ' . json_encode($res, JSON_UNESCAPED_UNICODE));
// R28: SEM fallback por data em produção — regra que casa com o critério antigo (gate:* de 17/11; deny de Clientes) mas NÃO está na lista NÃO é congelada
$semear(507, 'gate:admin:fora-da-lista', 'allow', '2026-11-17 09:00:00', $D); $semear(508, 'trigger:navrail:clientes', 'deny', '2025-12-24 14:39:11', $D);
$r7 = $s->removeTrigger(507, 'gate:admin:fora-da-lista', $D, '127.0.0.1', $op('r7')); $r8 = $s->removeTrigger(508, 'trigger:navrail:clientes', $D, '127.0.0.1', $op('r8'));
$ok(($r7['removida'] ?? false) === true && ($r8['removida'] ?? false) === true, 'R28 · sem fallback por data: gate:* de 17/11 e deny de Clientes FORA da lista fixa (titular fictício) NÃO são congelados — só a identidade completa da lista decide (o critério só gera alerta)');
// ── hierarquia (confirmada 07:4x): não-Dono só revoga com autoridade superior aplicável (não resolvida = 403); delegado não edita a si ──
$semear(512, 'trigger:panel:h', 'allow', '2026-11-20 10:00:00', $D);
$f0 = $foto(); $e0 = $evs();
$h1 = $erro(fn () => $s->removeTrigger(512, 'trigger:panel:h', 90, '127.0.0.1', $op('h1')));
$h2 = $erro(fn () => $s->setTrigger(['user_id' => 512, 'trigger_id' => 'trigger:panel:h', 'state' => 'deny', 'reason' => 'x'], 90, '127.0.0.1', $op('h2')));
$h3 = $erro(fn () => $s->resetUser(512, 90, '127.0.0.1', 'x', $op('h3')));
$h4 = $erro(fn () => $s->setTrigger(['user_id' => 512, 'trigger_id' => 'trigger:panel:h', 'state' => 'allow', 'expires_at' => '2031-01-01', 'reason' => 'x'], 90, '127.0.0.1', $op('h4')));
$ok($h1 && $c($h1) === 'HIERARQUIA_NAO_RESOLVIDA' && $h2 && $c($h2) === 'HIERARQUIA_NAO_RESOLVIDA' && $h3 && $c($h3) === 'HIERARQUIA_NAO_RESOLVIDA' && $h4 && $c($h4) === 'HIERARQUIA_NAO_RESOLVIDA' && $foto() === $f0 && $evs() === $e0,
    'hierarquia · não-Dono remove, rebaixa (allow→deny), reseta e põe prazo → 403 HIERARQUIA_NAO_RESOLVIDA, nada muda, 0 evento');
$h5 = $erro(fn () => $s->setTrigger(['user_id' => 90, 'trigger_id' => 'trigger:panel:meu', 'state' => 'allow', 'reason' => 'x'], 90, '127.0.0.1', $op('h5')));
$ok($h5 && $h($h5) === 403 && $c($h5) === 'AUTOEDICAO' && $foto() === $f0, 'hierarquia · delegado editando AS PRÓPRIAS permissões (mesmo concedendo) → 403 AUTOEDICAO');
$h6 = $erro(fn () => $s->setTrigger(['user_id' => 512, 'trigger_id' => 'trigger:panel:novo', 'state' => 'allow', 'reason' => 'x'], 90, '127.0.0.1', $op('h6')));
$ok($h6 && $h($h6) === 403 && $c($h6) === 'SEM_ALCADA' && $foto() === $f0, 'hierarquia · não-Dono SEM alçada (sem papel, sem administração de permissões) CONCEDENDO a outro → 403 SEM_ALCADA (Warps R28: concede só quem tem alçada sobre a capacidade); nada muda');
// ── alias pela colação: maiúsculas/minúsculas não escapam da guarda ──
$f0 = $foto(); $e0 = $evs();
$a1 = $erro(fn () => $s->removeTrigger($D, 'GATE:Admin:Permissions', $D, '127.0.0.1', $op('al1')));
$a2 = $erro(fn () => $s->setTrigger(['user_id' => $D, 'trigger_id' => 'Gate:Admin:PERMISSIONS', 'state' => 'deny', 'reason' => 'x'], $D, '127.0.0.1', $op('al2')));
$a3 = $erro(fn () => $s->removeTrigger(153, 'TRIGGER:NAVRAIL:CLIENTES', $D, '127.0.0.1', $op('al3')));
$a4 = $erro(fn () => $s->removeTrigger(75, 'GATE:ADMIN:USERS', $D, '127.0.0.1', $op('al4')));
$ok($a1 && $c($a1) === 'ANTIBLOQUEIO' && $a2 && $c($a2) === 'ANTIBLOQUEIO' && $a3 && $c($a3) === 'CONGELADO' && $a4 && $c($a4) === 'CONGELADO' && $foto() === $f0 && $evs() === $e0,
    'alias · a mesma regra por outra grafia (colação da coluna) → antibloqueio 403 e congelado 409; nada muda · ' . implode('/', array_map(fn ($x) => $x ? $c($x) : 'passou', [$a1, $a2, $a3, $a4])));
// ── A2: prazo OMITIDO preserva o instante COMPLETO de CADA linha (com milissegundos), sem propagar entre linhas do par ──
$pdo->exec("INSERT INTO app_user_trigger_permissions (user_id, trigger_id, state, reason, expires_at, granted_by, granted_at) VALUES
  (510, 'trigger:panel:dup', 'allow', 'r', '2031-01-01 10:00:00.123', $D, '2026-11-20 10:00:00.111'), (510, 'trigger:panel:dup', 'allow', 'r', '2032-02-02 11:11:11.456', $D, '2026-11-21 10:00:00.222')");
$prz = fn () => $pdo->query("SELECT GROUP_CONCAT(CONCAT(id, '=', DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i:%s.%f')) ORDER BY id) FROM app_user_trigger_permissions WHERE user_id = 510 AND deleted_at IS NULL")->fetchColumn();
$p0 = $prz();
$s->setTrigger(['user_id' => 510, 'trigger_id' => 'trigger:panel:dup', 'state' => 'allow', 'reason' => 'motivo novo'], $D, '127.0.0.1', $op('pz1'));
$p1 = $prz();
$s->bulkSetTriggers(['user_id' => 510, 'permissions' => ['trigger:panel:dup' => 'deny'], 'reason' => 'lote'], $D, '127.0.0.1', $op('pz2'));
$p2 = $prz();
$ok($p0 === $p1 && $p1 === $p2 && str_contains($p0, '10:00:00.123000') && str_contains($p0, '11:11:11.456000'), 'A2 · edição e lote sem prazo: cada linha do par conserva o SEU prazo exato (com milissegundos) · ' . $p2);
// ── B6: editar motivo/prazo não muda o concedente nem a data da concessão; a revogação atribui ao concedente ORIGINAL ──
$pdo->exec("INSERT INTO app_user_trigger_permissions (user_id, trigger_id, state, reason, granted_by, granted_at) VALUES (511, 'trigger:panel:c', 'allow', 'r0', 90, '2026-11-20 10:00:00.000')");
$cg = fn () => $pdo->query("SELECT CONCAT(granted_by, '@', DATE_FORMAT(granted_at, '%Y-%m-%d %H:%i:%s.%f')) FROM app_user_trigger_permissions WHERE user_id = 511 AND deleted_at IS NULL")->fetchColumn();
$g0 = $cg();
$s->setTrigger(['user_id' => 511, 'trigger_id' => 'trigger:panel:c', 'state' => 'allow', 'reason' => 'motivo editado', 'expires_at' => '2033-03-03'], $D, '127.0.0.1', $op('cg1'));
$g1 = $cg();
$rr = $s->removeTrigger(511, 'trigger:panel:c', $D, '127.0.0.1', $op('cg2'));
$evc = json_decode((string) $pdo->query("SELECT antes_json FROM app_uarps_audit_log ORDER BY id DESC LIMIT 1")->fetchColumn(), true);
$ok($g0 === $g1 && $g0 === '90@2026-11-20 10:00:00.000000' && ($evc['concedente_id'] ?? null) === 90 && ($evc['concedido_em'] ?? null) === '2026-11-20 10:00:00.000' && ($rr['revogador_id'] ?? null) === $D,
    'B6 · edição de motivo e prazo pelo Dono NÃO altera concedente (90) nem data da concessão; a revogação atribui ao concedente ORIGINAL · ' . $g1);
// ── A3: regra PREEXISTENTE conserva estado, motivo, prazo exato e acesso efetivo depois da falha do evento ──
$pdo->exec("INSERT INTO app_user_trigger_permissions (user_id, trigger_id, state, reason, expires_at, granted_by, granted_at) VALUES (509, 'trigger:panel:pre', 'allow', 'r0', '2031-01-01 10:00:00.123', $D, '2026-11-20 10:00:00')");
$fp = fn () => $pdo->query("SELECT CONCAT(state, '|', reason, '|', DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i:%s.%f')) FROM app_user_trigger_permissions WHERE user_id = 509 AND deleted_at IS NULL")->fetchColumn();
$x0 = $fp(); $ae0 = UarpsRegrasDono::acessoEfetivo(509, 'trigger', 'trigger:panel:pre', $pdo);
$pdo->exec("CREATE TRIGGER tg_falha_r BEFORE INSERT ON app_uarps_audit_log FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'falha simulada'");
$ef = $erro(fn () => $s->setTrigger(['user_id' => 509, 'trigger_id' => 'trigger:panel:pre', 'state' => 'deny', 'reason' => 'r1', 'expires_at' => '2034-04-04'], $D, '127.0.0.1', $op('a3p')));
$pdo->exec('DROP TRIGGER tg_falha_r');   // gatilho do BANCO DESCARTÁVEL deste teste
$x1 = $fp(); $ae1 = UarpsRegrasDono::acessoEfetivo(509, 'trigger', 'trigger:panel:pre', $pdo);
$ok($ef !== null && $h($ef) === 500 && $x0 === $x1 && $x0 === 'allow|r0|2031-01-01 10:00:00.123000' && $ae0 === $ae1 && ($ae1['ainda_permitido'] ?? null) === true,
    'A3 · regra PREEXISTENTE: falha do evento → 500, estado/motivo/prazo exato e acesso efetivo IGUAIS aos de antes · ' . $x1);
// ── releitura B6 com fixture completa: o servidor identifica o perfil que ainda concede; nunca null ──
$semear(508, 'trigger:panel:k', 'allow', '2026-11-20 10:00:00', $D);
$rk = $s->removeTrigger(508, 'trigger:panel:k', $D, '127.0.0.1', $op('rk'));
$semear(513, 'gate:admin:x', 'allow', '2026-11-20 10:00:00', $D);
$rx = $s->removeTrigger(513, 'gate:admin:x', $D, '127.0.0.1', $op('rx'));
$ok(($rk['acesso_efetivo']['ainda_permitido'] ?? null) === true && ($rk['acesso_efetivo']['origem'] ?? null) === 'perfil' && ($rk['acesso_efetivo']['perfil'] ?? null) === 'gerente'
    && str_contains((string) ($rk['acesso_efetivo']['mensagem'] ?? ''), 'perfil gerente'), 'releitura B6 · retirada a exceção pessoal, o servidor diz "Continua permitido pelo perfil gerente" · ' . json_encode($rk['acesso_efetivo'] ?? null, JSON_UNESCAPED_UNICODE));
$ok(is_array($rx['acesso_efetivo'] ?? null) && ($rx['acesso_efetivo']['ainda_permitido'] ?? null) === false && ($rx['acesso_efetivo']['origem'] ?? '') === 'exige_concessao_explicita',
    'releitura B6 · sem regra e sem perfil que conceda (gate:admin:* exige explícito) → negado com a origem explícita, nunca null · ' . json_encode($rx['acesso_efetivo'] ?? null, JSON_UNESCAPED_UNICODE));
// ── perfil (efeito indireto): mudar o PERFIL não altera o efeito das regras congeladas (precedência do gate REAL) ──
// titular fictício 530 = deny trigger:navrail:clientes (como a 218) e ganha super_admin (100); titular 531 = gate:admin:* allow (como 1725–1735) e perde todo perfil
$semear(530, 'trigger:navrail:clientes', 'deny', '2025-12-24 14:39:11', $D); $semear(531, 'gate:admin:users', 'allow', '2026-11-17 20:57:22', $D);
foreach ([530, 531] as $u) { $pdo->exec("INSERT INTO app_users (id, email, password, username, status) VALUES ($u, 'u$u@sintetico.invalid', 'x', 'u$u', 'active')"); }
$pdo->exec("INSERT INTO app_user_roles (user_id, role_id) VALUES (530, 1), (531, 2)");
UARPSGate::clearCache(); $p1 = UarpsRegrasDono::acessoEfetivo(530, 'trigger', 'trigger:navrail:clientes', $pdo); $q1 = UarpsRegrasDono::acessoEfetivo(531, 'trigger', 'gate:admin:users', $pdo);
$pdo->exec("UPDATE app_user_roles SET deleted_at = NOW() WHERE user_id = 531");
UARPSGate::clearCache(); $q2 = UarpsRegrasDono::acessoEfetivo(531, 'trigger', 'gate:admin:users', $pdo);
$ok(($p1['ainda_permitido'] ?? null) === false && ($p1['origem'] ?? '') === 'regra_pessoal' && ($q1['ainda_permitido'] ?? null) === true && ($q2['ainda_permitido'] ?? null) === true && ($q2['origem'] ?? '') === 'regra_pessoal',
    'perfil · deny congelado de Clientes continua NEGANDO com perfil super_admin (100); gate:admin:* congelado continua PERMITINDO sem perfil nenhum — o perfil não quebra congelado');
// ── VERDE E2: acesso_efetivo depois de set/lote/reset; autoridade × sombra separados; PRÉVIA só de leitura ──
$r1 = $s->setTrigger(['user_id' => 508, 'trigger_id' => 'trigger:panel:e2', 'state' => 'deny', 'reason' => 'x'], $D, '127.0.0.1', $op('e2a'));
$r2 = $s->bulkSetTriggers(['user_id' => 508, 'permissions' => ['trigger:panel:e2b' => 'allow', 'trigger:panel:e2c' => 'deny'], 'reason' => 'x'], $D, '127.0.0.1', $op('e2b'));
$ok(($r1['acesso_efetivo']['ainda_permitido'] ?? null) === false && ($r1['acesso_efetivo']['origem'] ?? '') === 'regra_pessoal'
    && ($r2['acesso_efetivo']['trigger:panel:e2b']['ainda_permitido'] ?? null) === true && ($r2['acesso_efetivo']['trigger:panel:e2c']['ainda_permitido'] ?? null) === false,
    'E2 (1) · set e lote devolvem acesso_efetivo relido (por item no lote) · ' . json_encode([$r1['acesso_efetivo']['origem'] ?? null, array_keys($r2['acesso_efetivo'] ?? [])]));
$semear(514, 'trigger:panel:r1', 'allow', '2026-11-20 10:00:00', $D); $semear(514, 'trigger:panel:r2', 'deny', '2026-11-20 10:00:00', $D);
$r3 = $s->resetUser(514, $D, '127.0.0.1', 'x', $op('e2c'));
$ok(array_keys($r3['acesso_efetivo'] ?? []) == ['trigger:panel:r1', 'trigger:panel:r2'] && is_array($r3['acesso_efetivo']['trigger:panel:r1'] ?? null), 'E2 (1) · reset devolve acesso_efetivo por gatilho que existia');
// sombra: gerente (50) perde a exceção de um gatilho de interface de administração (mínimo 80, modo SOMBRA)
$semear(508, 'trigger:panel:admin-e2', 'allow', '2026-11-20 10:00:00', $D);
$rs = $s->removeTrigger(508, 'trigger:panel:admin-e2', $D, '127.0.0.1', $op('e2d'));
$ae = $rs['acesso_efetivo'] ?? [];
$ok(($ae['ainda_permitido'] ?? null) === true && ($ae['origem'] ?? '') === 'sombra' && ($ae['autoridade'] ?? null) === ['modo' => 'sombra', 'permitido' => true]
    && ($ae['sombra']['permitido'] ?? null) === false && ($ae['mensagem'] ?? '') === 'Permitido agora · em sombra, o UARPS negaria',
    'E2 (2) · autoridade (sombra, permitido) e sombra (UARPS negaria) separados: "Permitido agora · em sombra, o UARPS negaria" · ' . json_encode($ae, JSON_UNESCAPED_UNICODE));
// prévia: nada muda; bloqueios com os mesmos códigos do escritor
$f0 = $foto(); $e0 = $evs();
$p1 = $s->previewTrigger($D, 'gate:admin:permissions', 'deny', $D);
$p2 = $s->previewTrigger(75, 'gate:admin:panels:edit', 'inherit', $D);
$p3 = $s->previewTrigger(508, 'trigger:panel:e2b', 'inherit', 90);
$p4 = $s->previewTrigger(508, 'trigger:panel:e2b', 'inherit', $D);
$ok(($p1['bloqueio']['codigo'] ?? '') === 'ANTIBLOQUEIO' && ($p2['bloqueio']['codigo'] ?? '') === 'CONGELADO' && ($p3['bloqueio']['codigo'] ?? '') === 'HIERARQUIA_NAO_RESOLVIDA'
    && $p4['bloqueio'] === null && $p4['gravaria'] === true && ($p4['atual']['origem'] ?? '') === 'regra_pessoal' && ($p4['futuro']['origem'] ?? '') === 'perfil' && $p4['muda'] === false
    && $foto() === $f0 && $evs() === $e0,
    'E2 (3) · prévia só de leitura: antibloqueio, congelado e hierarquia aparecem como bloqueio; atual (regra pessoal) × futuro (perfil), muda=false; nada gravado, 0 evento');
// ── nota da VINHO (10:20): a PRÉVIA não pode segurar lock do par — outra conexão trava o par com FOR UPDATE; a prévia responde na hora,
//    o escritor de verdade (que trava) espera e cai no tempo limite (1 s) — prova de que o lock estava de fato preso
$dbn = (string) $pdo->query('SELECT DATABASE()')->fetchColumn();
$b = new PDO("mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=$dbn;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$b->beginTransaction(); $b->query("SELECT id FROM app_user_trigger_permissions WHERE user_id = 508 AND trigger_id = 'trigger:panel:e2b' AND deleted_at IS NULL FOR UPDATE")->fetchAll();
$pdo->exec('SET SESSION innodb_lock_wait_timeout = 1');
$pvl = 'nao-rodou'; $ew = null; $dtp = $dtw = 0.0;
try {
    $t0 = microtime(true); try { $s->previewTrigger(508, 'trigger:panel:e2b', 'inherit', $D); $pvl = null; } catch (Throwable $x) { $pvl = get_class($x); } $dtp = microtime(true) - $t0;
    $t0 = microtime(true); $ew = $erro(fn () => $s->setTrigger(['user_id' => 508, 'trigger_id' => 'trigger:panel:e2b', 'state' => 'deny', 'reason' => 'x'], $D, '127.0.0.1', $op('lk1'))); $dtw = microtime(true) - $t0;
} finally { $b->rollBack(); $b = null; if ($pdo->inTransaction()) { $pdo->rollBack(); } $pdo->exec('SET SESSION innodb_lock_wait_timeout = 50'); }
$ok($pvl === null && $dtp < 0.9 && $ew !== null && $dtw >= 0.9, sprintf('prévia SEM lock: com o par travado por outra conexão, a prévia responde em %.2f s (' . ($pvl ?? 'ok') . '); o escritor (FOR UPDATE) espera e cai no tempo limite (%.2f s, %s)', $dtp, $dtw, $ew ? $ew->codigo : 'passou'));
// ── Warps R27-1: prévia de "voltar a herdar" com o MESMO decisor do Gate — capacidade que exige concessão pessoal explícita ──
$semear($D, 'gate:admin:explicito-teste', 'allow', '2026-11-20 10:00:00', $D);
$pv = $s->previewTrigger($D, 'gate:admin:explicito-teste', 'inherit', $D);
$rc = $s->removeTrigger($D, 'gate:admin:explicito-teste', $D, '127.0.0.1', $op('w1'));
$pv2 = $s->previewTrigger(508, 'trigger:panel:e2b', 'inherit', $D);
$ok(($pv['futuro']['origem'] ?? '') === 'exige_concessao_explicita' && ($pv['futuro']['ainda_permitido'] ?? null) === false && ($pv['muda'] ?? null) === true
    && ($rc['acesso_efetivo']['origem'] ?? '') === 'exige_concessao_explicita' && ($rc['acesso_efetivo']['ainda_permitido'] ?? null) === ($pv['futuro']['ainda_permitido'] ?? 'x')
    && ($pv2['futuro']['origem'] ?? '') === 'perfil',
    'Warps R27-1 · Dono nível 100 com gate:admin:* pessoal: a PRÉVIA de herdar diz "exige concessão pessoal explícita" (negado; o perfil 100 NÃO concede) e a CONFIRMAÇÃO devolve a MESMA decisão; capacidade comum segue pelo perfil · ' . json_encode([$pv['futuro']['origem'] ?? null, $rc['acesso_efetivo']['origem'] ?? null], JSON_UNESCAPED_UNICODE));
// ── Warps R27-2 (A2): o instante COMPLETO (milissegundos) no recibo, na comparação e no evento ──
$pdo->exec("INSERT INTO app_user_trigger_permissions (user_id, trigger_id, state, reason, expires_at, granted_by, granted_at) VALUES (515, 'trigger:panel:ms', 'allow', 'r0', '2031-01-01 10:00:00.123', $D, '2026-11-20 10:00:00.456')");
$rm1 = $s->setTrigger(['user_id' => 515, 'trigger_id' => 'trigger:panel:ms', 'state' => 'allow', 'reason' => 'só o motivo'], $D, '127.0.0.1', $op('ms1'));
$evm1 = $pdo->query("SELECT antes_json, depois_json FROM app_uarps_audit_log ORDER BY id DESC LIMIT 1")->fetch();
$rm2 = $s->removeTrigger(515, 'trigger:panel:ms', $D, '127.0.0.1', $op('ms2'));
$evm2 = json_decode((string) $pdo->query("SELECT antes_json FROM app_uarps_audit_log ORDER BY id DESC LIMIT 1")->fetchColumn(), true);
$a1 = json_decode((string) $evm1['antes_json'], true); $d1 = json_decode((string) $evm1['depois_json'], true);
$ok(($rm1['expires_at'] ?? '') === '2031-01-01 10:00:00.123' && ($a1['expires_at'] ?? '') === '2031-01-01 10:00:00.123' && ($d1['expires_at'] ?? '') === '2031-01-01 10:00:00.123'
    && ($evm2['expires_at'] ?? '') === '2031-01-01 10:00:00.123' && ($evm2['concedido_em'] ?? '') === '2026-11-20 10:00:00.456' && ($rm1['alterado'] ?? null) === true,
    'Warps R27-2 · recibo, evento (antes/depois) e revogação com o instante COMPLETO: prazo .123 e concessão .456 — nenhuma fração cortada · ' . json_encode([$rm1['expires_at'] ?? null, $evm2['concedido_em'] ?? null]));
// ── R28 Warps · prova focal da v4.5/4.6: concedente ORIGINAL, nível EXATO antes/depois do rebaixamento e alçada sobre AQUELA capacidade ──
$pdo->exec("INSERT INTO app_roles (id, role_key, role_name, level) VALUES (4, 'admin', 'Admin', 90)");
foreach ([991090, 991101] as $u) { $pdo->exec("INSERT INTO app_users (id, email, password, username, status) VALUES ($u, 'u$u@sintetico.invalid', 'x', 'u$u', 'active')"); }
$pdo->exec("INSERT INTO app_user_roles (user_id, role_id) VALUES (991090, 4), (991101, 3)");
$semear(991090, 'gate:admin:permissions', 'allow', '2026-11-20 10:00:00', $D);
UARPSGate::clearCache();
$s->setTrigger(['user_id' => 991101, 'trigger_id' => 'trigger:panel:focal', 'state' => 'allow', 'expires_at' => '2031-05-05 10:30', 'reason' => 'concessão do delegado'], 991090, '127.0.0.1', $op('fo1'));
$eSuper = $erro(fn () => $s->setTrigger(['user_id' => 991101, 'trigger_id' => 'gate:admin:settings:super', 'state' => 'allow', 'reason' => 'capacidade de mínimo 100'], 991090, '127.0.0.1', $op('fo2')));
$semear(991101, 'gate:admin:settings:super', 'allow', '2026-11-20 10:00:00', 991090);   // concessão ANTIGA do delegado (anterior à regra), só para a leitura da alçada
$s->setRegion(['user_id' => 991101, 'region_id' => 'region:focal', 'state' => 'allow', 'reason' => 'região do delegado'], 991090, '127.0.0.1', $op('fo3'));
$ev1 = (int) $pdo->query("SELECT user_id FROM app_uarps_audit_log WHERE operacao_id = '" . $op('fo1') . "'")->fetchColumn();
$linha = (int) $pdo->query("SELECT granted_by FROM app_user_trigger_permissions WHERE user_id = 991101 AND trigger_id = 'trigger:panel:focal' AND deleted_at IS NULL")->fetchColumn();
$lerFocal = function () use ($s): array { UARPSGate::clearCache(); $p = $s->getUserPermissions(991101); return [array_column($p['triggers'], null, 'trigger_id'), array_column($p['regions'], null, 'region_id')]; };
[$t0, $g0] = $lerFocal();
$pdo->exec("UPDATE app_user_roles SET deleted_at = NOW() WHERE user_id = 991090 AND role_id = 4"); $pdo->exec("INSERT INTO app_user_roles (user_id, role_id) VALUES (991090, 3)");   // rebaixa: admin 90 → equipe 20
[$t1, $g1] = $lerFocal();
$v = static fn (array $x) => [$x['concedente_id'] ?? 'AUSENTE', $x['concedente_nivel_atual'] ?? 'NULO', $x['concedente_alcada_atual'] ?? 'NULO', $x['perdeu_alcada'] ?? 'NULO'];
$ok($eSuper && $c($eSuper) === 'SEM_ALCADA' && ($eSuper->detalhes['motivo'] ?? '') === 'nivel_insuficiente', 'R28 Warps (alçada única) · o delegado (90) tentando CONCEDER capacidade de mínimo 100 → 403 SEM_ALCADA (nivel_insuficiente), nada gravado');
$ok($ev1 === 991090 && $linha === 991090
    && $v($t0['trigger:panel:focal']) === [991090, 90, true, false] && $v($t1['trigger:panel:focal']) === [991090, 20, false, true]
    && ($t1['trigger:panel:focal']['state'] ?? '') === 'allow' && ($t1['trigger:panel:focal']['expires_at'] ?? '') === ($t0['trigger:panel:focal']['expires_at'] ?? 'x') && ($t1['trigger:panel:focal']['vigente'] ?? null) === true
    && $v($t0['gate:admin:settings:super']) === [991090, 90, false, true]
    && $v($g0['region:focal']) === [991090, 90, true, false] && $v($g1['region:focal']) === [991090, 20, false, true],
    'R28 Warps · concedente ORIGINAL 991090 = linha = evento; nível EXATO 90 → 20 depois do rebaixamento; alçada sobre a capacidade sim → não (regra e prazo intactos); na capacidade de mínimo 100 o delegado (90) já não tinha alçada; o mesmo para REGIÃO · '
    . json_encode(['antes' => $v($t0['trigger:panel:focal']), 'depois' => $v($t1['trigger:panel:focal']), 'super' => $v($t0['gate:admin:settings:super']), 'regiao' => [$v($g0['region:focal']), $v($g1['region:focal'])]]));
// ── R28 Warps (alçada = critério da concessão): o delegado CONSERVA nível 90 e a administração de permissões, mas PERDE o direito ESPECÍFICO ──
foreach ([992090, 992101] as $u) { $pdo->exec("INSERT INTO app_users (id, email, password, username, status) VALUES ($u, 'u$u@sintetico.invalid', 'x', 'u$u', 'active')"); }
$pdo->exec("INSERT INTO app_user_roles (user_id, role_id) VALUES (992090, 4), (992101, 3)");
$semear(992090, 'gate:admin:permissions', 'allow', '2026-11-20 10:00:00', $D);
UARPSGate::clearCache();
$s->setTrigger(['user_id' => 992101, 'trigger_id' => 'trigger:panel:esp', 'state' => 'allow', 'expires_at' => '2031-06-06 10:30:15.860', 'reason' => 'concessão do delegado'], 992090, '127.0.0.1', $op('w1a'));
$s->setRegion(['user_id' => 992101, 'region_id' => 'region:esp', 'state' => 'allow', 'reason' => 'região do delegado'], 992090, '127.0.0.1', $op('w1b'));
$lerW = function () use ($s): array { UARPSGate::clearCache(); $p = $s->getUserPermissions(992101); return [array_column($p['triggers'], null, 'trigger_id')['trigger:panel:esp'], array_column($p['regions'], null, 'region_id')['region:esp']]; };
[$wt0, $wr0] = $lerW();
// o Dono tira do DELEGADO só aquele direito (gatilho e região); papel e gate:admin:permissions ficam
$s->setTrigger(['user_id' => 992090, 'trigger_id' => 'trigger:panel:esp', 'state' => 'deny', 'reason' => 'perde o direito específico'], $D, '127.0.0.1', $op('w1c'));
$s->setRegion(['user_id' => 992090, 'region_id' => 'region:esp', 'state' => 'deny', 'reason' => 'perde a região'], $D, '127.0.0.1', $op('w1d'));
[$wt1, $wr1] = $lerW();
$wv = static fn (array $x) => [$x['concedente_nivel_atual'] ?? 'NULO', $x['concedente_administra_permissoes'] ?? 'NULO', $x['concedente_possui_capacidade'] ?? 'NULO', $x['concedente_alcada_atual'] ?? 'NULO', $x['perdeu_alcada'] ?? 'NULO', $x['alcada_motivo'] ?? 'NULO'];
UARPSGate::clearCache(); $efW = UarpsRegrasDono::acessoEfetivo(992101, 'trigger', 'trigger:panel:esp', $pdo);
$ok($wv($wt0) === [90, true, true, true, false, 'delegado'] && $wv($wt1) === [90, true, false, false, true, 'sem_a_capacidade']
    && $wv($wr0) === [90, true, true, true, false, 'delegado'] && $wv($wr1) === [90, true, false, false, true, 'sem_a_capacidade']
    && ($wt1['state'] ?? '') === 'allow' && ($wt1['expires_at'] ?? '') === '2031-06-06 10:30:15.860' && ($wt1['expires_at'] ?? '') === ($wt0['expires_at'] ?? 'x') && ($wt1['vigente'] ?? null) === true
    && ($efW['ainda_permitido'] ?? null) === true && ($wr1['state'] ?? '') === 'allow',
    'R28 Warps · delegado CONSERVA nível 90 e gate:admin:permissions mas PERDE o direito específico → "perdeu a alçada" (motivo sem_a_capacidade) no gatilho E na região — caso que o 90→20 não distingue; a concessão já emitida mantém estado, prazo .860 e acesso efetivo · '
    . json_encode(['gatilho' => [$wv($wt0), $wv($wt1)], 'regiao' => [$wv($wr0), $wv($wr1)]]));
$f0 = $foto(); $e0 = $evs();
$wn = $erro(fn () => $s->setTrigger(['user_id' => 992101, 'trigger_id' => 'trigger:panel:esp', 'state' => 'allow', 'reason' => 'renovar'], 992090, '127.0.0.1', $op('w1e')));
$wn2 = $erro(fn () => $s->setTrigger(['user_id' => 512, 'trigger_id' => 'trigger:panel:esp', 'state' => 'allow', 'reason' => 'conceder a outro'], 992090, '127.0.0.1', $op('w1f')));
$pv = $s->previewTrigger(512, 'trigger:panel:esp', 'allow', 992090);
$ok($wn && $c($wn) === 'SEM_ALCADA' && ($wn->detalhes['motivo'] ?? '') === 'sem_a_capacidade' && $wn2 && $c($wn2) === 'SEM_ALCADA' && ($pv['bloqueio']['codigo'] ?? '') === 'SEM_ALCADA' && $foto() === $f0 && $evs() === $e0,
    'R28 Warps · o MESMO critério autoriza: sem o direito específico, o delegado não concede nem renova (403 SEM_ALCADA, motivo sem_a_capacidade) e a prévia mostra o mesmo bloqueio; nada gravado');
// ── R28 Warps · falha na consulta do Gate → alçada INDETERMINADA (null, nunca false); conceder nessa hora = 403 ALCADA_INDETERMINADA ──
if (!method_exists('UarpsRegrasDono', 'definirGateParaTeste')) { $ok(false, 'R28 Warps · falha do Gate → alçada INDETERMINADA: esta versão não tem a regra única de alçada (contraprova)'); } else {
UarpsRegrasDono::definirGateParaTeste(static function (string $tipo, int $u, string $k): array { throw new RuntimeException('Gate indisponível (dublê)'); });
[$wtI, $wrI] = $lerW();
$f0 = $foto(); $e0 = $evs();
$wi = $erro(fn () => $s->setTrigger(['user_id' => 512, 'trigger_id' => 'trigger:panel:outra', 'state' => 'allow', 'reason' => 'x'], 992090, '127.0.0.1', $op('w2a')));
UarpsRegrasDono::definirGateParaTeste(static fn (string $tipo, int $u, string $k): array => ['allowed' => true, 'state' => 'error']);
[$wtE] = $lerW();
UarpsRegrasDono::definirGateParaTeste(null);
$ok(($wt0['alcada_estado'] ?? '') === 'com_alcada' && ($wt1['alcada_estado'] ?? '') === 'sem_alcada' && ($wr1['alcada_estado'] ?? '') === 'sem_alcada' && ($wtI['alcada_estado'] ?? '') === 'indeterminado' && ($wtE['alcada_estado'] ?? '') === 'indeterminado'
    && preg_match('/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3}$/', (string) ($wt0['granted_at'] ?? '')) === 1 && preg_match('/\.\d{3}$/', (string) ($wr0['granted_at'] ?? '')) === 1,
    'R28 Warps / VERDE E3.3 · alcada_estado = com_alcada | sem_alcada | indeterminado, coerente com os booleanos; granted_at da linha com milissegundo (DATETIME(3)) no gatilho e na região · ' . json_encode([$wt0['granted_at'] ?? null, $wr0['granted_at'] ?? null]));
$ok($wv($wtI) === [90, 'NULO', 'NULO', 'NULO', 'NULO', 'indeterminado'] && $wv($wrI) === [90, 'NULO', 'NULO', 'NULO', 'NULO', 'indeterminado'] && $wv($wtE)[3] === 'NULO' && $wv($wtE)[4] === 'NULO'
    && $wi && $c($wi) === 'ALCADA_INDETERMINADA' && $h($wi) === 403 && $foto() === $f0 && $evs() === $e0 && ($wtI['state'] ?? '') === 'allow' && ($wtI['vigente'] ?? null) === true,
    'R28 Warps · Gate com exceção ou estado error → alçada INDETERMINADA (concedente_alcada_atual e perdeu_alcada = null, motivo indeterminado; nunca false) no gatilho e na região; conceder nessa hora → 403 ALCADA_INDETERMINADA, nada gravado; a regra emitida continua vigente');
}
// ── Warps (portão do trem): lote que combina SEM alçada + congeladas → precedência pactuada: ANTIBLOQUEIO quando aplicável; fora disso 409
//    CONGELADO listando TODAS as congeladas (nem SEM_ALCADA nem hierarquia interrompem a coleta antes); zero alterações, zero eventos ──
$f0 = $foto(); $e0 = $evs();
$p1 = $erro(fn () => $s->bulkSetTriggers(['user_id' => 75, 'permissions' => ['gate:admin:settings' => 'deny', 'trigger:panel:esp' => 'allow', 'gate:admin:settings:super' => 'deny'], 'reason' => 'x'], 992090, '127.0.0.1', $op('pc1')));
$lp1 = (array) ($p1->detalhes['congeladas'] ?? []); sort($lp1);
$p1b = $erro(fn () => $s->bulkSetTriggers(['user_id' => 75, 'permissions' => ['trigger:panel:esp' => 'allow', 'gate:admin:settings:super' => 'deny'], 'reason' => 'x'], 992090, '127.0.0.1', $op('pc1b')));
$p2 = $erro(fn () => $s->bulkSetTriggers(['user_id' => $D, 'permissions' => ['trigger:panel:esp' => 'allow', 'gate:admin:feature-flags' => 'deny', 'gate:admin:permissions' => 'deny'], 'reason' => 'x'], 992090, '127.0.0.1', $op('pc2')));
$p3 = $erro(fn () => $s->setTrigger(['user_id' => 75, 'trigger_id' => 'gate:admin:settings', 'state' => 'deny', 'reason' => 'x'], 992090, '127.0.0.1', $op('pc3')));
$p4 = $erro(fn () => $s->bulkSetTriggers(['user_id' => 512, 'permissions' => ['trigger:panel:esp' => 'allow', 'trigger:panel:livre-pc' => 'deny'], 'reason' => 'x'], 992090, '127.0.0.1', $op('pc4')));
$ok($p1 && $h($p1) === 409 && $c($p1) === 'CONGELADO' && $lp1 === ['gate:admin:settings', 'gate:admin:settings:super'] && $p1b && $c($p1b) === 'CONGELADO'
    && $p2 && $h($p2) === 403 && $c($p2) === 'ANTIBLOQUEIO' && $p3 && $h($p3) === 409 && $c($p3) === 'CONGELADO' && $p4 && $c($p4) === 'SEM_ALCADA'
    && $foto() === $f0 && $evs() === $e0,
    'Warps portão · delegado SEM alçada sobre trigger:panel:esp (perdeu o direito; nível 90 e administração ficam): lote 2 congeladas + 1 sem alçada → 409 CONGELADO listando AS DUAS (a coleta não para no SEM_ALCADA nem na hierarquia); sem alçada antes da congelada na ordem → ainda 409; com antibloqueio → 403 ANTIBLOQUEIO; escrita simples em congelada → 409; sem congelada → 403 SEM_ALCADA; zero alterações, zero eventos · '
    . json_encode(['pc1' => [$p1 ? $c($p1) : null, $lp1], 'pc1b' => $p1b ? $c($p1b) : null, 'pc2' => $p2 ? $c($p2) : null, 'pc3' => $p3 ? $c($p3) : null, 'pc4' => $p4 ? $c($p4) : null]));
// ── GPT Warps · cópia de permissões: o instante COMPLETO do vencimento é preservado (origem × destino), em PERMITIR e em NEGAR ──
$pdo->exec("INSERT INTO app_user_trigger_permissions (user_id, trigger_id, state, reason, expires_at, granted_by) VALUES
  (991201, 'trigger:panel:copia-permitir', 'allow', 'origem', '2031-01-01 10:44:31.860', $D), (991201, 'trigger:panel:copia-negar', 'deny', 'origem', '2031-02-02 10:44:31.860', $D)");
$pdo->exec("INSERT INTO app_user_region_permissions (user_id, region_id, state, reason, expires_at, granted_by) VALUES (991201, 'region:copia', 'allow', 'origem', '2031-03-03 10:44:31.860', $D)");
$orig = $s->getUserPermissions(991201); $i = 0; $erroCopia = null;
foreach (['triggers' => 'trigger_id', 'regions' => 'region_id'] as $lista => $col) {   // o que o editor faz: lê a origem e grava cada regra no destino
    foreach ($orig[$lista] as $r) {
        $corpo = ['user_id' => 991202, $col => $r[$col], 'state' => $r['state'], 'expires_at' => $r['expires_at'], 'reason' => 'cópia'];
        try { $col === 'trigger_id' ? $s->setTrigger($corpo, $D, '127.0.0.1', $op('cp' . $i++)) : $s->setRegion($corpo, $D, '127.0.0.1', $op('cp' . $i++)); } catch (UarpsEscritaErro $e) { $erroCopia = $e->codigo . ' ' . $e->getMessage(); }
    }
}
$inst = static fn (string $t, string $c, int $u, string $k) => (string) $pdo->query("SELECT CONCAT(state, '@', DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i:%s.%f')) FROM $t WHERE user_id = $u AND $c = " . $pdo->quote($k) . " AND deleted_at IS NULL")->fetchColumn();
$par = [];
foreach ([['app_user_trigger_permissions', 'trigger_id', 'trigger:panel:copia-permitir'], ['app_user_trigger_permissions', 'trigger_id', 'trigger:panel:copia-negar'], ['app_user_region_permissions', 'region_id', 'region:copia']] as [$t, $c, $k]) {
    $par[$k] = [$inst($t, $c, 991201, $k), $inst($t, $c, 991202, $k)];
}
$ok($erroCopia === null && array_reduce($par, fn ($ok, $p) => $ok && $p[0] !== '' && $p[0] === $p[1], true)
    && $par['trigger:panel:copia-negar'][1] === 'deny@2031-02-02 10:44:31.860000' && $par['trigger:panel:copia-permitir'][1] === 'allow@2031-01-01 10:44:31.860000',
    'GPT Warps · cópia de permissões: PERMITIR e NEGAR (e região) com vencimento .860 — destino = origem até o milissegundo (a negação copiada NÃO termina antes) · ' . json_encode($par) . ($erroCopia ? " · erro: $erroCopia" : ''));
if ($f) { echo "[ERRO] teste-uarps-revogacao-dono:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   teste-uarps-revogacao-dono: $n verificações (antibloqueio, congelados inclusive por efeito indireto, concedente/revogador, acesso efetivo relido, Dono revoga o que outro concedeu)\n";
