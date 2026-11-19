<?php
// Processo FILHO do foi-salvo-mysql.php (P1-1): roda sugestoes_lote COM chave e MORRE (exit, sem catch nem finally) logo depois do COMMIT
// do 1º item com desfecho — o mesmo que a requisição cair no meio do lote. Entrada: 1 argumento JSON {db, chave, ids, titular{id,email},
// produtos[]} + EQ_TEST_CNF no ambiente (só o caminho). Saída: "MORREU_APOS_1_ITEM" (exit 0) ou "NAO_MORREU" (exit 1). Só ATRWEB_VAL_T_7/8/9.
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/AtributosRepo.php';
require_once __DIR__ . '/../../../api/atributos/SugestoesService.php';
require_once __DIR__ . '/_memoria.php';
$a = json_decode((string) ($argv[1] ?? ''), true);
$cnf = (string) (getenv('EQ_TEST_CNF') ?: '');
if (!is_array($a) || !in_array($a['db'] ?? '', ['ATRWEB_VAL_T_7', 'ATRWEB_VAL_T_8', 'ATRWEB_VAL_T_9'], true) || !is_readable($cnf)) { echo "RECUSADO\n"; exit(3); }
$c = (parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: [])['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ";dbname={$a['db']};charset=utf8mb4";
final class PdoQueMorre extends PDO
{
    public ?Closure $aposCommit = null;
    public function commit(): bool { $r = parent::commit(); if ($this->aposCommit) ($this->aposCommit)(); return $r; }
}
$pdo = new PdoQueMorre($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$cat = new CatalogoMemoria();
foreach ($a['produtos'] as $id) $cat->p[(int) $id] = ['id' => (int) $id, 'nome' => "Produto $id (sintético)", 'categoria' => 'LED_PANEL', 'subcategoria' => 'CABLE', 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
$repo = new AtributosRepoPdo($pdo, '');
$svc = new AtributosService($repo, 80, $a['titular']['email'], $cat);
$sug = new SugestoesService($repo, $svc, null, 80, $a['titular']['email']);
$ops = new OperacoesGravacao($repo, (int) $a['titular']['id'], $a['titular']['email'], 80, true);
$chave = (string) $a['chave'];
$pdo->aposCommit = function () use ($pdo, $chave): void {
    try { $st = $pdo->prepare("SELECT COUNT(*) FROM eq_operacao_item WHERE chave = ? AND desfecho <> 'pendente'"); $st->execute([$chave]); $n = (int) $st->fetchColumn(); }
    catch (Throwable $t) { return; }   // código sem a tabela de itens (contraprova): não morre
    if ($n >= 1) { echo "MORREU_APOS_1_ITEM\n"; exit(0); }
};
try { $ops->executar('sugestoes_lote', ['ids' => $a['ids'], 'confirmar' => true], $chave, fn(array $c, $l = null) => $sug->aceitarLote($c, $l)); }
catch (Throwable $t) { echo 'ERRO ' . get_class($t) . "\n"; exit(1); }
echo "NAO_MORREU\n"; exit(1);
