<?php
// canary-user-flags.php — implementação CANÔNICA e corrigida (decisão #69).
// Ativa flags SÓ para um usuário (default u75), pelo mecanismo oficial, sem improvisar SQL.
// Correções sobre a 1ª versão embutida no FINALIZAR-AVATAR-2.sh:
//   (a) NÃO clona metadados da flag-template — gera dados PRÓPRIOS e corretos por flag
//       (flag_key/flag_name/label/description/reason/notes/*_by/timestamps são definidos aqui;
//        nunca herdados de as6.visual_composer etc.);
//   (b) ROLLBACK completo e fiel ao estado-anterior, com statements SEPARADOS (sem multi-query
//       via PDO::exec) e SEM linha global órfã (linhas que não existiam antes são apagadas;
//       linhas que existiam são restauradas aos valores salvos);
//   (c) descoberta e validação de schema + UNIQUE REAIS (aborta antes de escrever diante de
//       estrutura inesperada); idempotente (re-execução converge, não duplica, não erra).
// Uso:  CANARY_BK=/backup/canary-seed-$(date +%Y%m%d-%H%M%S) \
//        [CANARY_USER=75] [CANARY_FLAGS=as6.vestuario_separado,as6.catalogo_v2] \
//        php canary-user-flags.php
// Nunca imprime segredo (usa a conexão da própria app). Nunca ativa global. Nunca toca outro usuário.
declare(strict_types=1);

$U     = (int)(getenv('CANARY_USER') ?: 75);
$FLAGS = array_values(array_filter(array_map('trim', explode(',', getenv('CANARY_FLAGS') ?: 'as6.vestuario_separado,as6.catalogo_v2'))));
$BK    = getenv('CANARY_BK');
if (!$BK) { fwrite(STDERR, "CANARY_BK ausente\n"); exit(3); }
@mkdir($BK, 0750, true);

function out(string $k, array $extra = []): void {
  echo "CANARY_STATUS=$k\n";
  foreach ($extra as $kk => $vv) echo "$kk=$vv\n";
  exit($k === 'OK' ? 0 : 20);
}

require '/var/www/dshowdash/config/db_connection.php';
$pdo = getConnection("DSHOWDASH");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$DB = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();

// ---------- descoberta de schema + UNIQUE reais ----------
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
$Uc = colinfo($pdo, $DB, 'app_user_feature_flags');
if (!$G || !$Uc) out('BLOCKED_MISSING_OFFICIAL_SCHEMA', ['motivo' => 'tabelas app_feature_flags/app_user_feature_flags ausentes']);
$cg = array_keys($G); $cu = array_keys($Uc);
$ug = uniques($pdo, $DB, 'app_feature_flags');
$uu = uniques($pdo, $DB, 'app_user_feature_flags');

$fk  = in_array('flag_key', $cg, true) ? 'flag_key' : (in_array('key', $cg, true) ? 'key' : null);
$fku = in_array('flag_key', $cu, true) ? 'flag_key' : (in_array('key', $cu, true) ? 'key' : null);
$uk  = in_array('user_id', $cu, true) ? 'user_id' : null;
if (!$fk || !$fku || !$uk) out('BLOCKED_UNEXPECTED_SCHEMA', ['motivo' => 'colunas de chave nao reconhecidas', 'global' => implode(',', $cg), 'user' => implode(',', $cu)]);

// UNIQUE reais que tornam o UPSERT seguro (constraint sobre colunas NOT NULL)
$hasUKg = false; foreach ($ug as $cols) { if ($cols === [$fk]) $hasUKg = true; }
$hasUKu = false; $expU = [$fku, $uk]; sort($expU);
foreach ($uu as $cols) { $c = $cols; sort($c); if ($c === $expU) $hasUKu = true; }
if (!$hasUKg || !$hasUKu) out('BLOCKED_UNEXPECTED_SCHEMA', ['motivo' => 'UNIQUE esperado ausente (uk_flag_key / uk_user_flag)', 'uk_global' => json_encode($ug), 'uk_user' => json_encode($uu)]);

$now = date('Y-m-d H:i:s');
$isIdentity = function (string $c): bool {
  return (bool)preg_match('/^(flag_name|name|label|title|display|display_name|description|desc|reason|motivo|note|notes|comment|comentario)$/i', $c);
};
// valor "próprio e correto" por coluna, para uma flag nova
$valGlobal = function (string $flag) use ($G, $fk, $isIdentity, $now): array {
  $row = [];
  foreach ($G as $c => $meta) {
    if ($c === $fk) { $row[$c] = $flag; continue; }
    if (strcasecmp($c, 'is_enabled') === 0) { $row[$c] = 1; continue; }             // habilitada como flag…
    if (preg_match('/^rollout(_percentage)?$/i', $c)) { $row[$c] = 0; continue; }    // …mas 0% global ⇒ OFF p/ todos menos override
    if (preg_match('/^(env|environment)$/i', $c)) { $row[$c] = 'all'; continue; }
    if (preg_match('/(updated_at|created_at|modified_at)$/i', $c)) { $row[$c] = $now; continue; }
    if ($isIdentity($c)) { $row[$c] = "canário u75 — $flag"; continue; }             // dado PRÓPRIO, não herdado
    // colunas restantes: só preenche se forem NOT NULL sem default (evita herdar lixo)
    if ($meta['IS_NULLABLE'] === 'NO' && $meta['COLUMN_DEFAULT'] === null && stripos((string)$meta['EXTRA'], 'auto_increment') === false) {
      $row[$c] = 0;
    }
  }
  return $row;
};
$valUser = function (string $flag) use ($Uc, $fku, $uk, $U, $isIdentity, $now): array {
  $row = [];
  foreach ($Uc as $c => $meta) {
    if ($c === $fku) { $row[$c] = $flag; continue; }
    if ($c === $uk)  { $row[$c] = $U; continue; }
    if (strcasecmp($c, 'is_enabled') === 0) { $row[$c] = 1; continue; }
    if (preg_match('/(enabled_by|created_by|updated_by|author)$/i', $c)) { $row[$c] = $U; continue; }
    if (preg_match('/(updated_at|created_at|modified_at)$/i', $c)) { $row[$c] = $now; continue; }
    if ($isIdentity($c)) { $row[$c] = "canário u75 — $flag"; continue; }
    if ($meta['IS_NULLABLE'] === 'NO' && $meta['COLUMN_DEFAULT'] === null && stripos((string)$meta['EXTRA'], 'auto_increment') === false) {
      $row[$c] = 0;
    }
  }
  return $row;
};

// ---------- BACKUP fiel do estado-anterior (para rollback correto) ----------
$ph = implode(',', array_fill(0, count($FLAGS), '?'));
$bg = $pdo->prepare("SELECT * FROM app_feature_flags WHERE `$fk` IN ($ph)");
$bg->execute($FLAGS);
$beforeG = $bg->fetchAll(PDO::FETCH_ASSOC);
$bu = $pdo->prepare("SELECT * FROM app_user_feature_flags WHERE `$uk`=? AND `$fku` IN ($ph)");
$bu->execute(array_merge([$U], $FLAGS));
$beforeU = $bu->fetchAll(PDO::FETCH_ASSOC);
file_put_contents("$BK/estado-anterior.json", json_encode(['global' => $beforeG, 'user' => $beforeU], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

$hadG = []; foreach ($beforeG as $r) $hadG[$r[$fk]] = $r;
$hadU = []; foreach ($beforeU as $r) $hadU[$r[$fku]] = $r;

// rollback.sql legível (statements separados; sem multi-query; sem órfão)
$q = fn($v) => $v === null ? 'NULL' : $pdo->quote((string)$v);
$rb = "-- rollback canário u{$U} " . implode('+', $FLAGS) . " — " . date('c') . "\n";
foreach ($FLAGS as $f) {
  if (isset($hadU[$f])) {
    $sets = []; foreach ($hadU[$f] as $c => $v) $sets[] = "`$c`=" . $q($v);
    $rb .= "UPDATE app_user_feature_flags SET " . implode(',', $sets) . " WHERE `$uk`={$U} AND `$fku`=" . $q($f) . ";\n";
  } else {
    $rb .= "DELETE FROM app_user_feature_flags WHERE `$uk`={$U} AND `$fku`=" . $q($f) . ";\n";
  }
  if (isset($hadG[$f])) {
    $sets = []; foreach ($hadG[$f] as $c => $v) $sets[] = "`$c`=" . $q($v);
    $rb .= "UPDATE app_feature_flags SET " . implode(',', $sets) . " WHERE `$fk`=" . $q($f) . ";\n";
  } else {
    $rb .= "DELETE FROM app_feature_flags WHERE `$fk`=" . $q($f) . ";\n";
  }
}
file_put_contents("$BK/rollback.sql", $rb);

// rollback em runtime (statements separados; nunca multi-query)
$doRollback = function () use ($pdo, $FLAGS, $fk, $fku, $uk, $U, $hadG, $hadU) {
  foreach ($FLAGS as $f) {
    if (isset($hadU[$f])) {
      $r = $hadU[$f]; $cols = array_keys($r);
      $set = implode(',', array_map(fn($c) => "`$c`=?", $cols));
      $st = $pdo->prepare("UPDATE app_user_feature_flags SET $set WHERE `$uk`=? AND `$fku`=?");
      $st->execute(array_merge(array_values($r), [$U, $f]));
    } else {
      $pdo->prepare("DELETE FROM app_user_feature_flags WHERE `$uk`=? AND `$fku`=?")->execute([$U, $f]);
    }
    if (isset($hadG[$f])) {
      $r = $hadG[$f]; $cols = array_keys($r);
      $set = implode(',', array_map(fn($c) => "`$c`=?", $cols));
      $pdo->prepare("UPDATE app_feature_flags SET $set WHERE `$fk`=?")->execute(array_merge(array_values($r), [$f]));
    } else {
      $pdo->prepare("DELETE FROM app_feature_flags WHERE `$fk`=?")->execute([$f]);
    }
  }
};

// upsert idempotente por UNIQUE real
function upsert(PDO $p, string $table, array $row): void {
  $cols = array_keys($row);
  $colList = '`' . implode('`,`', $cols) . '`';
  $ph = implode(',', array_fill(0, count($cols), '?'));
  $upd = implode(',', array_map(fn($c) => "`$c`=VALUES(`$c`)", $cols));
  $st = $p->prepare("INSERT INTO `$table` ($colList) VALUES ($ph) ON DUPLICATE KEY UPDATE $upd");
  $st->execute(array_values($row));
}

$pdo->beginTransaction();
try {
  foreach ($FLAGS as $f) {
    upsert($pdo, 'app_feature_flags', $valGlobal($f));
    upsert($pdo, 'app_user_feature_flags', $valUser($f));
  }
  $pdo->commit();
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  out('WRITE_FAILED_ROLLED_BACK', ['erro' => substr($e->getMessage(), 0, 140)]);
}

// ---------- verificação pós-escrita (na fonte) ----------
$fail = [];
foreach ($FLAGS as $f) {
  $ru = $pdo->prepare("SELECT * FROM app_user_feature_flags WHERE `$uk`=? AND `$fku`=?");
  $ru->execute([$U, $f]); $u = $ru->fetch(PDO::FETCH_ASSOC);
  if (!$u || (int)($u['is_enabled'] ?? 0) !== 1) $fail[] = "u{$U}_off:$f";
  $rg = $pdo->prepare("SELECT * FROM app_feature_flags WHERE `$fk`=?");
  $rg->execute([$f]); $g = $rg->fetch(PDO::FETCH_ASSOC) ?: [];
  $ro = $g['rollout_percentage'] ?? $g['rollout'] ?? null;
  if ((int)$ro !== 0) $fail[] = "global_rollout_nao_zero:$f($ro)";
}
$oc = $pdo->prepare("SELECT COUNT(*) FROM app_user_feature_flags WHERE `$fku` IN ($ph) AND `$uk`<>?");
$oc->execute(array_merge($FLAGS, [$U]));
if ((int)$oc->fetchColumn() > 0) $fail[] = "outros_usuarios_com_override";

if ($fail) {
  $doRollback();
  out('VERIFY_FAILED_ROLLED_BACK', ['falhas' => implode('|', $fail)]);
}

$res = [];
foreach ($FLAGS as $f) $res[$f] = 'GLOBAL=OFF USER_' . $U . '=ON';
$res['OTHER_USERS_UNCHANGED'] = 'YES';
$res['BACKUP'] = $BK;
$res['ROLLBACK'] = "$BK/rollback.sql";
out('OK', $res);
