<?php
// global-flag-rollout.php — flip GLOBAL de UMA flag (rollout_percentage) pelo mecanismo oficial,
// irmão de canary-user-flags.php (decisão #69) com as MESMAS garantias: descoberta e validação de
// schema + UNIQUE reais (aborta antes de escrever diante de estrutura inesperada), backup fiel do
// estado-anterior (estado-anterior.json + rollback.sql com statement separado), escrita mínima e
// idempotente (só is_enabled/rollout_percentage/updated_at — os mesmos campos que o admin de flags
// escreve; environment/starts_at/ends_at/payload intocados), read-after-write NA FONTE + prova pelo
// FeatureFlagResolver (o mesmo código que serve /api/feature-flags?action=resolve) para um usuário
// SONDA sem override, e auto-rollback se a verificação falhar.
// Uso:  ROLLOUT_BK=/backup/global-rollout-$(date +%Y%m%d-%H%M%S) ROLLOUT_FLAG=as6.x ROLLOUT_PCT=100 \
//        [ROLLOUT_PROBE_USER=546] php scripts/deploy/global-flag-rollout.php
// ROLLOUT_PCT=0 é o ROLLBACK INSTANTÂNEO (classic volta p/ todos sem redeploy; overrides por usuário
// seguem valendo). Nunca cria flag (a flag PRECISA existir), nunca toca app_user_feature_flags,
// nunca toca outra flag, nunca imprime segredo.
declare(strict_types=1);

$FLAG  = trim((string)getenv('ROLLOUT_FLAG'));
$PCT   = getenv('ROLLOUT_PCT');
$BK    = getenv('ROLLOUT_BK');
$PROBE = (int)(getenv('ROLLOUT_PROBE_USER') ?: 546);

function out(string $k, array $extra = []): void {
  echo "ROLLOUT_STATUS=$k\n";
  foreach ($extra as $kk => $vv) echo "$kk=$vv\n";
  exit($k === 'OK' ? 0 : 20);
}
if ($FLAG === '' || !preg_match('/^[a-z0-9][a-z0-9._-]{2,120}$/i', $FLAG)) out('BLOCKED_BAD_INPUT', ['motivo' => 'ROLLOUT_FLAG ausente/invalida']);
if ($PCT === false || $PCT === '' || !preg_match('/^(0|100)$/', (string)$PCT)) out('BLOCKED_BAD_INPUT', ['motivo' => 'ROLLOUT_PCT deve ser 0 (rollback) ou 100 (ligar global)']);
$PCT = (int)$PCT;
if (!$BK) out('BLOCKED_BAD_INPUT', ['motivo' => 'ROLLOUT_BK ausente']);
@mkdir($BK, 0750, true);
if (!is_dir($BK) || !is_writable($BK)) out('BLOCKED_BAD_INPUT', ['motivo' => "ROLLOUT_BK nao gravavel: $BK"]);

require '/var/www/dshowdash/config/db_connection.php';
require_once '/var/www/dshowdash/api/feature-flags/resolver.php';
$pdo = getConnection("DSHOWDASH");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$DB = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();

// ---------- descoberta de schema + UNIQUE reais (idêntico ao canary) ----------
function colinfo(PDO $p, string $db, string $t): array {
  $q = $p->prepare("SELECT COLUMN_NAME,IS_NULLABLE,COLUMN_DEFAULT,EXTRA,DATA_TYPE
                    FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?");
  $q->execute([$db, $t]);
  $r = [];
  foreach ($q as $c) $r[$c['COLUMN_NAME']] = $c;
  return $r;
}
function uniques(PDO $p, string $db, string $t): array {
  $q = $p->prepare("SELECT INDEX_NAME,COLUMN_NAME FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND NON_UNIQUE=0
                    ORDER BY INDEX_NAME,SEQ_IN_INDEX");
  $q->execute([$db, $t]);
  $u = [];
  foreach ($q as $r) $u[$r['INDEX_NAME']][] = $r['COLUMN_NAME'];
  return array_values($u);
}
$G = colinfo($pdo, $DB, 'app_feature_flags');
if (!$G) out('BLOCKED_MISSING_OFFICIAL_SCHEMA', ['motivo' => 'tabela app_feature_flags ausente']);
$cg = array_keys($G);
foreach (['flag_key', 'is_enabled', 'rollout_percentage', 'updated_at', 'deleted_at'] as $need) {
  if (!in_array($need, $cg, true)) out('BLOCKED_UNEXPECTED_SCHEMA', ['motivo' => "coluna esperada ausente: $need", 'colunas' => implode(',', $cg)]);
}
$hasUK = false; foreach (uniques($pdo, $DB, 'app_feature_flags') as $cols) { if ($cols === ['flag_key']) $hasUK = true; }
if (!$hasUK) out('BLOCKED_UNEXPECTED_SCHEMA', ['motivo' => 'UNIQUE(flag_key) ausente em app_feature_flags']);

// ---------- estado-anterior (a flag PRECISA existir) ----------
$sel = $pdo->prepare("SELECT * FROM app_feature_flags WHERE `flag_key`=?");
$sel->execute([$FLAG]);
$before = $sel->fetch(PDO::FETCH_ASSOC);
if (!$before) out('BLOCKED_FLAG_NOT_FOUND', ['motivo' => "flag $FLAG inexistente em app_feature_flags (este tooling nunca cria flag)"]);
if ($sel->fetch()) out('BLOCKED_UNEXPECTED_SCHEMA', ['motivo' => 'mais de uma linha para a mesma flag_key']);
if ($before['deleted_at'] !== null) out('BLOCKED_FLAG_DELETED', ['motivo' => "flag $FLAG esta soft-deleted (deleted_at); nao religar por aqui"]);

file_put_contents("$BK/estado-anterior.json", json_encode(['global' => $before, 'probe_user' => $PROBE, 'pedido' => ['flag' => $FLAG, 'rollout_percentage' => $PCT]], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
$q = fn($v) => $v === null ? 'NULL' : $pdo->quote((string)$v);
$sets = []; foreach ($before as $c => $v) $sets[] = "`$c`=" . $q($v);
$rb = "-- rollback global $FLAG — " . date('c') . " (restaura a linha ao estado-anterior)\n"
    . "UPDATE app_feature_flags SET " . implode(',', $sets) . " WHERE `flag_key`=" . $q($FLAG) . ";\n";
file_put_contents("$BK/rollback.sql", $rb);

$doRollback = function () use ($pdo, $before, $FLAG) {
  $cols = array_keys($before);
  $set = implode(',', array_map(fn($c) => "`$c`=?", $cols));
  $pdo->prepare("UPDATE app_feature_flags SET $set WHERE `flag_key`=?")->execute(array_merge(array_values($before), [$FLAG]));
};

// ---------- sonda ANTES (o usuário-sonda não pode ter override — senão não prova o global) ----------
$ov = $pdo->prepare("SELECT COUNT(*) FROM app_user_feature_flags WHERE `user_id`=? AND `flag_key`=?");
$ov->execute([$PROBE, $FLAG]);
if ((int)$ov->fetchColumn() > 0) out('BLOCKED_BAD_INPUT', ['motivo' => "usuario-sonda $PROBE tem override para $FLAG; escolha outro (ROLLOUT_PROBE_USER)"]);
$resolver = new FeatureFlagResolver($pdo);
$probeBefore = $resolver->resolve($FLAG, $PROBE);
$fmt = fn(array $r) => json_encode(['flag_key' => $r['flag_key'], 'is_enabled' => (int)$r['is_enabled'], 'rollout_percentage' => (int)$r['rollout_percentage'], 'environment' => $r['environment'] ?? null, 'updated_at' => $r['updated_at'] ?? null]);
$fmtP = fn(array $r) => json_encode(['user' => $PROBE, 'enabled' => (bool)$r['enabled'], 'source' => $r['source']]);

// ---------- escrita mínima e idempotente (mesmos campos que o admin de flags) ----------
$alreadyThere = ((int)$before['is_enabled'] === 1 && (int)$before['rollout_percentage'] === $PCT);
if (!$alreadyThere) {
  try {
    $pdo->prepare("UPDATE app_feature_flags SET `is_enabled`=1, `rollout_percentage`=?, `updated_at`=NOW(3) WHERE `flag_key`=? AND `deleted_at` IS NULL")
        ->execute([$PCT, $FLAG]);
  } catch (Throwable $e) {
    out('WRITE_FAILED', ['erro' => substr($e->getMessage(), 0, 140), 'ROLLBACK' => "$BK/rollback.sql"]);
  }
}

// ---------- read-after-write NA FONTE + prova pelo resolver ----------
$sel->execute([$FLAG]);
$after = $sel->fetch(PDO::FETCH_ASSOC) ?: [];
$probeAfter = $resolver->resolve($FLAG, $PROBE);
$fail = [];
if ((int)($after['is_enabled'] ?? 0) !== 1) $fail[] = 'is_enabled!=1';
if ((int)($after['rollout_percentage'] ?? -1) !== $PCT) $fail[] = "rollout_percentage!=$PCT";
if (($after['environment'] ?? null) !== ($before['environment'] ?? null)) $fail[] = 'environment_alterado';
$expectEnabled = ($PCT === 100);
if ((bool)$probeAfter['enabled'] !== $expectEnabled) $fail[] = 'resolver_sonda=' . json_encode($probeAfter['enabled']) . '(esperado ' . json_encode($expectEnabled) . ')';
if ($expectEnabled && $probeAfter['source'] !== 'global') $fail[] = 'resolver_source=' . $probeAfter['source'] . '(esperado global)';
// nenhuma outra flag pode ter mudado (contagem de linhas com updated_at nos últimos 5s, exceto a nossa)
$oth = $pdo->prepare("SELECT COUNT(*) FROM app_feature_flags WHERE `flag_key`<>? AND `updated_at` >= NOW(3) - INTERVAL 5 SECOND");
$oth->execute([$FLAG]);
$othersTouched = (int)$oth->fetchColumn();

if ($fail) {
  $doRollback();
  $sel->execute([$FLAG]); $rest = $sel->fetch(PDO::FETCH_ASSOC) ?: [];
  out('VERIFY_FAILED_ROLLED_BACK', ['falhas' => implode('|', $fail), 'RESTAURADO' => $fmt($rest), 'ROLLBACK' => "$BK/rollback.sql"]);
}

file_put_contents("$BK/estado-depois.json", json_encode(['global' => $after, 'probe' => $probeAfter], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
out('OK', [
  'FLAG'          => $FLAG,
  'IDEMPOTENT'    => $alreadyThere ? 'YES(ja estava assim; nada escrito)' : 'NO(escrito agora)',
  'BEFORE'        => $fmt($before),
  'AFTER'         => $fmt($after),
  'PROBE_BEFORE'  => $fmtP($probeBefore),
  'PROBE_AFTER'   => $fmtP($probeAfter),
  'OTHER_FLAGS_TOUCHED_LAST_5S' => (string)$othersTouched,
  'BACKUP'        => $BK,
  'ROLLBACK'      => "$BK/rollback.sql  (ou: ROLLOUT_PCT=0 neste mesmo tooling)",
]);
