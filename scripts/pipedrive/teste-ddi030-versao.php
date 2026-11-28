<?php
declare(strict_types=1);
// scripts/pipedrive/teste-ddi030-versao.php — DDI-030 (GPT DATA, 28/11, VINHO): o espelho local do Pipedrive não regride por ordem de chegada.
// MySQL de TESTE: banco descartável zz_… (estrutura copiada da 8121; dados fictícios). Uso: php teste-ddi030-versao.php <zz_banco> [--raiz <árvore>]
$db = $argv[1] ?? ''; if (preg_match('/^zz_[a-z0-9_]{1,40}\z/', $db) !== 1) { fwrite(STDERR, "banco zz_… obrigatório\n"); exit(2); }
$raiz = (($i = array_search('--raiz', $argv, true)) !== false) ? $argv[$i + 1] : dirname(__DIR__, 2);
require_once "$raiz/api/pipedrive/repositories/SyncRepository.php";
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$db;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
foreach (['pipe_deals', 'pipe_organizations', 'pipe_persons', 'pipe_person_emails', 'pipe_person_phones'] as $t) { $pdo->exec("DROP TABLE IF EXISTS $t"); $pdo->exec("CREATE TABLE $t LIKE ATRWEB_VAL_PIPE_8121.$t"); }
$r = new PipeSyncRepository($pdo);
$ok = 0; $falhas = 0; $c = function (string $n, bool $v) use (&$ok, &$falhas): void { if ($v) $ok++; else { $falhas++; echo "FALHOU: $n\n"; } };
$v = fn (int $m) => sprintf('2026-11-28 10:%02d:00', $m);
$org = fn (int $id, int $m, int $dono, bool $del = false) => ['id' => $id, 'name' => "Org $id", 'owner_id' => $dono, 'update_time' => $v($m), 'add_time' => $v(0), 'active_flag' => !$del, 'is_deleted' => $del];
$deal = fn (int $id, int $m, int $dono, string $st = 'open') => ['id' => $id, 'title' => "Neg $id", 'status' => $st, 'owner_id' => $dono, 'update_time' => $v($m), 'add_time' => $v(0)];
$q = fn (string $t, int $id) => $pdo->query("SELECT owner_id, is_deleted, source_updated_at FROM $t WHERE pipedrive_id = $id")->fetch(PDO::FETCH_ASSOC);

// 1) responsável: resposta NOVA chega antes da ANTIGA → o antigo não volta
$r->upsertOrganization($org(1, 10, 990201)); $r->upsertOrganization($org(1, 5, 990202));
$c('org: resposta antiga (v5) depois da nova (v10) NÃO troca o responsável', (int) $q('pipe_organizations', 1)['owner_id'] === 990201);
$r->upsertOrganization($org(1, 12, 990203));
$c('org: resposta mais nova (v12) troca', (int) $q('pipe_organizations', 1)['owner_id'] === 990203);
$r->upsertOrganization($org(1, 12, 990203));
$c('org: mesma versão de novo = idempotente', (int) $q('pipe_organizations', 1)['owner_id'] === 990203 && $q('pipe_organizations', 1)['source_updated_at'] === $v(12));
$x = $org(1, 0, 990204); unset($x['update_time']); $r->upsertOrganization($x);
$c('org: resposta SEM versão com uma persistida = não grava', (int) $q('pipe_organizations', 1)['owner_id'] === 990203);
// 2) exclusão não é "ressuscitada" por resposta antiga
$r->upsertDeal($deal(2, 10, 990201)); $r->markDeleted('deal', '2', $v(20));
$c('deal: excluído na origem em v20', (int) $q('pipe_deals', 2)['is_deleted'] === 1 && $q('pipe_deals', 2)['source_updated_at'] === $v(20));
$r->upsertDeal($deal(2, 15, 990202));
$c('deal: resposta ANTIGA (v15) depois da exclusão NÃO ressuscita', (int) $q('pipe_deals', 2)['is_deleted'] === 1 && (int) $q('pipe_deals', 2)['owner_id'] === 990201);
$r->upsertDeal($deal(2, 25, 990203));
$c('deal: versão posterior à exclusão (v25) vale (restaurado na origem)', (int) $q('pipe_deals', 2)['is_deleted'] === 0 && (int) $q('pipe_deals', 2)['owner_id'] === 990203);
// 3) exclusão ANTIGA não se aplica sobre um estado mais NOVO
$r->upsertOrganization($org(3, 30, 990201)); $r->markDeleted('organization', '3', $v(20));
$c('org: exclusão antiga (v20) sobre estado novo (v30) NÃO se aplica', (int) $q('pipe_organizations', 3)['is_deleted'] === 0);
$r->markDeleted('organization', '3', $v(31));
$c('org: exclusão mais nova (v31) se aplica', (int) $q('pipe_organizations', 3)['is_deleted'] === 1);
$r->markDeleted('deal', '8', $v(20)); $r->upsertDeal($deal(8, 12, 990201));
$c('deal: exclusão que chega ANTES de qualquer versão local (lápide) não deixa a resposta antiga criar o registro ativo', (int) $q('pipe_deals', 8)['is_deleted'] === 1);
// 4) lote: mapa de versões (negócios excluídos) e versão única (leitura completa)
$r->upsertDeal($deal(4, 10, 990201)); $r->upsertDeal($deal(5, 40, 990201));
$n = $r->markDeletedBatch('deal', ['4', '5'], ['4' => $v(20), '5' => $v(20)]);
$c('lote com mapa: só o mais velho que a exclusão é excluído', $n === 1 && (int) $q('pipe_deals', 4)['is_deleted'] === 1 && (int) $q('pipe_deals', 5)['is_deleted'] === 0);
$r->upsertPerson(['id' => 6, 'name' => 'P6', 'owner_id' => 990201, 'update_time' => $v(10), 'add_time' => $v(0), 'emails' => [['value' => 'nova@exemplo.invalid', 'primary' => true]]]);
$r->upsertPerson(['id' => 6, 'name' => 'P6', 'owner_id' => 990202, 'update_time' => $v(4), 'add_time' => $v(0), 'emails' => [['value' => 'antiga@exemplo.invalid', 'primary' => true]]]);
$c('pessoa: resposta antiga NÃO troca os e-mails (filhos) da versão nova', $pdo->query("SELECT GROUP_CONCAT(value) FROM pipe_person_emails WHERE person_pd_id = 6")->fetchColumn() === 'nova@exemplo.invalid');
$c('lote com versão única (início da leitura)', $r->markDeletedBatch('person', ['6'], $v(11)) === 1 && (int) $q('pipe_persons', 6)['is_deleted'] === 1);
// 5) a ORDEM de chegada é irrelevante: 40 permutações aleatórias de 5 respostas (com 1 exclusão) = sempre o estado da maior versão
mt_srand(28112026); $todas = true;
for ($k = 0; $k < 40; $k++) {
    $pdo->exec('DELETE FROM pipe_organizations WHERE pipedrive_id = 7');
    $ev = [[3, 990201, 'u'], [9, 990202, 'u'], [14, 990203, 'u'], [21, 0, 'd'], [17, 990204, 'u']];
    shuffle($ev);
    foreach ($ev as [$m, $dono, $tipo]) { $tipo === 'u' ? $r->upsertOrganization($org(7, $m, $dono)) : $r->markDeleted('organization', '7', $v($m)); }
    $f = $q('pipe_organizations', 7);
    if (!$f || (int) $f['is_deleted'] !== 1 || $f['source_updated_at'] !== $v(21)) { $todas = false; }
}
$c('40 ordens aleatórias (incremental × webhook × reconciliação) = sempre o estado da maior versão (exclusão em v21)', $todas);
echo "teste-ddi030-versao: $ok ok, $falhas falha(s)\n"; exit($falhas === 0 ? 0 : 1);
