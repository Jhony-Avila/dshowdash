<?php
// nav-route-resolve.php — reaponta a RESOLUÇÃO de rotas do banco (app_nav_route → destino) pelo MECANISMO OFICIAL do
// registro versionado (tools/db/nav_seed.sql): nova linha em app_nav_route_resolution_revision (checksum único na
// família do seed: SHA256("<route_clean>-><destination_key>-<sufixo>")), reapontamento de app_nav_route_resolution_active,
// linhas em app_nav_audit_log (resolution/activate com old/new; destination/insert quando cria destino). A revisão
// anterior NÃO é apagada: rollback = reativar a revisão anterior (rollback.sql gerado). Mesmas garantias do
// canary-user-flags.php: validação de schema/UNIQUE (aborta antes de escrever), backup fiel (estado-anterior.json +
// dump JSON das 4 tabelas), transação, read-after-write (o MESMO JOIN do generate-orchestrator-manifest.php),
// auto-rollback (rollBack da transação) se a verificação falhar, idempotente (rota já no destino ⇒ nada escrito).
// Nunca cria rota; só cria destino quando o diretório public/components/panels/<key>/index.js EXISTE. Nunca imprime segredo.
// Uso: NAV_BK=/backup/nav-route-resolve/<carimbo> NAV_CHANGES="bling=panel-bling:Bling ERP,pipedrive=panel-pipedrive" \
//       [NAV_ACTOR=claude-agent] [NAV_NOTE="..."] [NAV_REGEN=1] php scripts/deploy/nav-route-resolve.php
declare(strict_types=1);

$BK    = getenv('NAV_BK');
$RAW   = trim((string)getenv('NAV_CHANGES'));
$ACTOR = (string)(getenv('NAV_ACTOR') ?: 'claude-agent');
$NOTE  = (string)(getenv('NAV_NOTE') ?: 'cleanup-dedup-v2: rota legada → painel canônico do produto (registro do código)');
$REGEN = getenv('NAV_REGEN') !== '0';
$SUF   = '-v2-cleanup-' . date('Ymd-His');
$RAIZ  = '/var/www/dshowdash';

function out(string $k, array $extra = []): void { echo "NAV_STATUS=$k\n"; foreach ($extra as $kk => $vv) echo "$kk=$vv\n"; exit($k === 'OK' ? 0 : 20); }
if (!$BK) out('BLOCKED_BAD_INPUT', ['motivo' => 'NAV_BK ausente']);
@mkdir($BK, 0750, true);
if (!is_dir($BK) || !is_writable($BK)) out('BLOCKED_BAD_INPUT', ['motivo' => "NAV_BK nao gravavel: $BK"]);
if ($RAW === '') out('BLOCKED_BAD_INPUT', ['motivo' => 'NAV_CHANGES ausente (route_clean=destination_key[:Titulo],...)']);
$CHANGES = [];
foreach (explode(',', $RAW) as $item) {
  if (!preg_match('/^([a-z0-9][a-z0-9\/_.-]*)=(panel-[a-z0-9-]+)(?::(.+))?$/i', trim($item), $m)) out('BLOCKED_BAD_INPUT', ['motivo' => "item invalido: $item"]);
  $CHANGES[$m[1]] = ['dest' => $m[2], 'title' => isset($m[3]) ? trim($m[3]) : null];
}

require "$RAIZ/config/db_connection.php";
$pdo = getConnection('DSHOWDASH');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$DB = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();

// ---------- schema esperado (aborta antes de escrever) ----------
function cols(PDO $p, string $db, string $t): array { $q = $p->prepare('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?'); $q->execute([$db, $t]); return array_column($q->fetchAll(PDO::FETCH_ASSOC), 'COLUMN_NAME'); }
function uniq(PDO $p, string $db, string $t): array { $q = $p->prepare('SELECT INDEX_NAME, COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND NON_UNIQUE=0 ORDER BY INDEX_NAME, SEQ_IN_INDEX'); $q->execute([$db, $t]); $u = []; foreach ($q as $r) $u[$r['INDEX_NAME']][] = $r['COLUMN_NAME']; return $u; }
$need = [
  'app_nav_route' => ['route_id', 'route_clean', 'is_active'],
  'app_nav_destination' => ['destination_id', 'destination_key', 'destination_type', 'title', 'is_active'],
  'app_nav_route_resolution_revision' => ['resolution_rev_id', 'route_id', 'destination_id', 'layout', 'min_level', 'capabilities_json', 'checksum_sha256', 'revision_note', 'created_by'],
  'app_nav_route_resolution_active' => ['route_id', 'resolution_rev_id', 'activated_at', 'activated_by'],
  'app_nav_audit_log' => ['entity_type', 'entity_key', 'entity_id', 'revision_id', 'operation', 'old_value_json', 'new_value_json', 'checksum_sha256', 'actor', 'actor_detail'],
];
foreach ($need as $t => $cs) { $have = cols($pdo, $DB, $t); if (!$have) out('BLOCKED_MISSING_OFFICIAL_SCHEMA', ['motivo' => "tabela $t ausente"]); foreach ($cs as $c) if (!in_array($c, $have, true)) out('BLOCKED_UNEXPECTED_SCHEMA', ['motivo' => "coluna $t.$c ausente"]); }
$ukRev = uniq($pdo, $DB, 'app_nav_route_resolution_revision'); $ukDest = uniq($pdo, $DB, 'app_nav_destination'); $ukAct = uniq($pdo, $DB, 'app_nav_route_resolution_active');
if (!in_array(['checksum_sha256'], $ukRev, true) || !in_array(['destination_key'], $ukDest, true) || !in_array(['route_id'], $ukAct, true)) out('BLOCKED_UNEXPECTED_SCHEMA', ['motivo' => 'UNIQUE esperado ausente (uk_checksum / uk_destination_key / PK route_id)', 'rev' => json_encode($ukRev), 'dest' => json_encode($ukDest), 'act' => json_encode($ukAct)]);

// ---------- estado anterior + backup fiel ----------
$JOIN = 'SELECT r.route_id, r.route_clean, r.is_active, a.resolution_rev_id, a.activated_at, a.activated_by, rev.destination_id, d.destination_key, rev.layout, rev.min_level, rev.capabilities_json, rev.checksum_sha256, rev.revision_note, rev.created_by
         FROM app_nav_route r JOIN app_nav_route_resolution_active a ON a.route_id = r.route_id
         JOIN app_nav_route_resolution_revision rev ON rev.resolution_rev_id = a.resolution_rev_id
         JOIN app_nav_destination d ON d.destination_id = rev.destination_id WHERE r.route_clean = ?';
$sel = $pdo->prepare($JOIN);
$before = [];
foreach ($CHANGES as $rc => $ch) {
  $sel->execute([$rc]); $row = $sel->fetch(PDO::FETCH_ASSOC);
  if (!$row) out('BLOCKED_ROUTE_NOT_RESOLVED', ['motivo' => "rota '$rc' inexistente ou sem resolucao ativa (este tooling nunca cria rota)"]);
  if ((int)$row['is_active'] !== 1) out('BLOCKED_ROUTE_INACTIVE', ['motivo' => "rota '$rc' inativa"]);
  if (!is_file("$RAIZ/public/components/panels/{$ch['dest']}/index.js")) out('BLOCKED_PANEL_MISSING', ['motivo' => "destino {$ch['dest']}: public/components/panels/{$ch['dest']}/index.js nao existe"]);
  $before[$rc] = $row;
}
$dump = [];
foreach (['app_nav_route', 'app_nav_destination', 'app_nav_route_resolution_revision', 'app_nav_route_resolution_active'] as $t) $dump[$t] = $pdo->query("SELECT * FROM `$t`")->fetchAll(PDO::FETCH_ASSOC);
file_put_contents("$BK/dump-tabelas-antes.json", json_encode($dump, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
file_put_contents("$BK/estado-anterior.json", json_encode(['pedido' => $CHANGES, 'antes' => $before], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

// ---------- escrita (transação) ----------
$destSel = $pdo->prepare('SELECT destination_id, destination_key, title, is_active FROM app_nav_destination WHERE destination_key = ?');
$revIns  = $pdo->prepare('INSERT INTO app_nav_route_resolution_revision (route_id, destination_id, layout, min_level, capabilities_json, checksum_sha256, revision_note, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
$actUpd  = $pdo->prepare('UPDATE app_nav_route_resolution_active SET resolution_rev_id = ?, activated_at = NOW(), activated_by = ? WHERE route_id = ?');
$destIns = $pdo->prepare("INSERT INTO app_nav_destination (destination_key, destination_type, title, is_active) VALUES (?, 'panel', ?, 1)");
$audIns  = $pdo->prepare('INSERT INTO app_nav_audit_log (entity_type, entity_key, entity_id, revision_id, operation, old_value_json, new_value_json, checksum_sha256, actor, actor_detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$detail  = 'scripts/deploy/nav-route-resolve.php (' . basename($BK) . ')';
$done = []; $rb = "-- rollback nav-route-resolve " . date('c') . " — reativa a revisão anterior; remove revisões/destinos/auditoria criados\n";
$pdo->beginTransaction();
try {
  foreach ($CHANGES as $rc => $ch) {
    $b = $before[$rc];
    if ($b['destination_key'] === $ch['dest']) { $done[$rc] = ['idempotent' => true, 'dest' => $ch['dest']]; continue; }
    $destSel->execute([$ch['dest']]); $d = $destSel->fetch(PDO::FETCH_ASSOC); $createdDest = null;
    if (!$d) {
      $destIns->execute([$ch['dest'], $ch['title'] ?: $ch['dest']]); $createdDest = (int)$pdo->lastInsertId();
      $audIns->execute(['destination', $ch['dest'], $createdDest, null, 'insert', null, json_encode(['destination_key' => $ch['dest'], 'type' => 'panel', 'title' => $ch['title'] ?: $ch['dest']], JSON_UNESCAPED_UNICODE), hash('sha256', $ch['dest'] . $SUF), $ACTOR, $detail]);
      $audDest = (int)$pdo->lastInsertId();
      $d = ['destination_id' => $createdDest, 'destination_key' => $ch['dest'], 'is_active' => 1];
      $rb .= "DELETE FROM app_nav_audit_log WHERE audit_id = $audDest;\n";
    } elseif ((int)$d['is_active'] !== 1) { throw new RuntimeException("destino {$ch['dest']} existe mas esta inativo"); }
    $checksum = hash('sha256', $rc . '->' . $ch['dest'] . $SUF);
    $revIns->execute([(int)$b['route_id'], (int)$d['destination_id'], $b['layout'] ?: 'default', (int)$b['min_level'], $b['capabilities_json'], $checksum, $NOTE, $ACTOR]);
    $newRev = (int)$pdo->lastInsertId();
    $actUpd->execute([$newRev, $ACTOR, (int)$b['route_id']]);
    $audIns->execute(['resolution', $rc, (int)$b['route_id'], $newRev, 'activate', json_encode(['layout' => $b['layout'], 'destination' => $b['destination_key'], 'resolution_rev_id' => (int)$b['resolution_rev_id']], JSON_UNESCAPED_UNICODE), json_encode(['layout' => $b['layout'] ?: 'default', 'destination' => $ch['dest'], 'resolution_rev_id' => $newRev], JSON_UNESCAPED_UNICODE), $checksum, $ACTOR, $detail]);
    $audRes = (int)$pdo->lastInsertId();
    $rb .= "UPDATE app_nav_route_resolution_active SET resolution_rev_id = {$b['resolution_rev_id']}, activated_at = " . $pdo->quote($b['activated_at']) . ", activated_by = " . $pdo->quote($b['activated_by']) . " WHERE route_id = {$b['route_id']};\n";
    $rb .= "DELETE FROM app_nav_audit_log WHERE audit_id = $audRes;\nDELETE FROM app_nav_route_resolution_revision WHERE resolution_rev_id = $newRev;\n";
    if ($createdDest) $rb .= "DELETE FROM app_nav_destination WHERE destination_id = $createdDest;\n";
    $done[$rc] = ['idempotent' => false, 'from' => $b['destination_key'], 'dest' => $ch['dest'], 'old_rev' => (int)$b['resolution_rev_id'], 'new_rev' => $newRev, 'dest_created' => $createdDest];
  }
  // read-after-write DENTRO da transação (o mesmo JOIN do gerador do manifesto)
  $fail = [];
  foreach ($CHANGES as $rc => $ch) { $sel->execute([$rc]); $r = $sel->fetch(PDO::FETCH_ASSOC); if (!$r || $r['destination_key'] !== $ch['dest']) $fail[] = "$rc=" . ($r['destination_key'] ?? 'null'); }
  if ($fail) { $pdo->rollBack(); out('VERIFY_FAILED_ROLLED_BACK', ['falhas' => implode('|', $fail)]); }
  $pdo->commit();
} catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); out('WRITE_FAILED_ROLLED_BACK', ['erro' => substr($e->getMessage(), 0, 160)]); }
file_put_contents("$BK/rollback.sql", $rb);
file_put_contents("$BK/estado-depois.json", json_encode($done, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

// ---------- regeneração do manifesto (o mesmo script do cron) + verificação ----------
$regen = 'pulado';
if ($REGEN) {
  $o = []; $rc = 0; exec('php ' . escapeshellarg("$RAIZ/scripts/generate-orchestrator-manifest.php") . ' 2>&1', $o, $rc);
  $man = (string)@file_get_contents("$RAIZ/public/core/ui-orchestrator/registry/manifest-generated.js");
  $miss = [];
  foreach ($CHANGES as $r => $ch) { $key = $r === '/' ? 'home' : str_replace('/', '-', trim($r, '/')); /* mesma chave do gerador: '/' vira '-' */ if (!preg_match('/"' . preg_quote($key, '/') . '":\s*\{[^\n]*"panel":\s*"' . preg_quote($ch['dest'], '/') . '"/', $man)) $miss[] = $r; }
  $regen = "rc=$rc manifesto=" . ($miss ? 'FALTAM ' . implode(',', $miss) : 'todas as rotas resolvem ao destino novo');
  file_put_contents("$BK/regen-manifesto.log", implode("\n", $o));
}
$res = ['ACTOR' => $ACTOR, 'BACKUP' => $BK, 'ROLLBACK' => "$BK/rollback.sql", 'MANIFEST_REGEN' => $regen];
foreach ($done as $r => $d) $res["ROUTE[$r]"] = $d['idempotent'] ? "ja em {$d['dest']} (idempotente, nada escrito)" : "{$d['from']} → {$d['dest']} (rev {$d['old_rev']} → {$d['new_rev']}" . ($d['dest_created'] ? ", destino criado id {$d['dest_created']}" : '') . ')';
out('OK', $res);
