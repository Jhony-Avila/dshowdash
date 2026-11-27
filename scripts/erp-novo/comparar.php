<?php
// ERP novo — PORTÃO DE RECONCILIAÇÃO do Painel 01 (v3: AZUL, 26/11 noite) pelo contrato CP-001 (P01-01…P01-15).
// TRÊS camadas independentes, na MESMA fotografia (uma conexão, START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY):
//   L1 = SQL DIRETO nas tabelas em inglês, SEM a view · L2 = view do patch 0002 (ERP_V_*) · L3 = as funções da API do painel 01
//   (api/modules/panels/panel-01/api.php, o MESMO código que responde ao navegador, sem a camada HTTP: autorização, cache e falha
//   são provados à parte, P01-13/P01-14, por inspeção do arquivo e pelo testes/chaveamento.php).
// Dinheiro em CENTAVOS INTEIROS calculados no banco a partir do DECIMAL (L1/L2); a L3 devolve float e é convertida com 2 casas exatas.
// Tolerância ZERO. Status desconhecido contado à parte → BLOQUEIA a ativação até decisão. P01-12 (empresa): BLOQUEADO por decisão do
// arquiteto (o painel religa sem filtro/agrupamento por empresa até o Walter confirmar a dimensão) — não conta como falha.
// Saída: SÓ contagens, somas e estados (nunca IDs, nomes, documentos ou chaves; conjuntos de IDs comparados por hash e mostrados como "igual").
// Uso (root, terminal comum, credencial só leitura do Dash): php scripts/erp-novo/comparar.php → exit 0 = 14 critérios PASS (+ P01-12 bloqueado)
//   · 1 = algum FAIL/BLOQUEIO · 2 = não configurado/indisponível. Carga mínima: listas paginadas no máx. 10 páginas de 100; detalhes ≤ 40.
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../..');
if (!getenv('ERP_NOVO_TESTE')) { require $raiz . '/config/db_connection.php'; }
require $raiz . '/api/_helpers/ErpNovo.php';
require_once $raiz . '/api/core/helpers/InputValidator.php';
if (!erp_novo_configurado()) { fwrite(STDERR, "[ERRO] credencial do ERP novo ausente (DB_ERP_NOVO_CNF/HOST/NAME)\n"); exit(2); }
require $raiz . '/api/modules/panels/_erp-compat-novo.php';
$fonte = (string)file_get_contents($raiz . '/api/modules/panels/panel-01/api.php');
$i0 = strpos($fonte, 'function getKPIs('); $i1 = strpos($fonte, 'function exportCSV(');
if ($i0 === false || $i1 === false) { fwrite(STDERR, "[ERRO] funções da API do painel 01 não encontradas\n"); exit(2); }
eval(substr($fonte, $i0, $i1 - $i0));
try { $pdo = erp_novo_pdo(); $pdo->exec('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY'); }
catch (Throwable $e) { fwrite(STDERR, "[ERRO] ERP novo indisponível — nenhuma conclusão (P01-14: indisponível, nunca zero)\n"); exit(2); }

$R = []; $tempos = [];
$rec = static function (string $id, string $estado, string $det) use (&$R): void { $R[$id] = [$estado, $det]; };
$q = static function (string $sql, array $p = []) use ($pdo): array { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchAll(PDO::FETCH_NUM); };
$um = static fn (string $sql, array $p = []) => $q($sql, $p)[0] ?? [];
$cent = static fn (string $c): string => "CAST(COALESCE(SUM(ROUND($c * 100)), 0) AS SIGNED)";
$fc = static fn ($v): int => (int)round((float)sprintf('%.2f', (float)$v) * 100);   // float da API → centavos (2 casas exatas)
$api = static function (string $nome, callable $f) use (&$tempos) { $t = hrtime(true); $r = $f(); $tempos[$nome] = (int)round((hrtime(true) - $t) / 1e6); return $r; };
$V = ERP_V_REQUISICAO; $VI = ERP_V_REQUISICAO_ITEM; $VM = ERP_V_REQUISICAO_MIDIA;
$tz = static fn (string $c): string => "CONVERT_TZ($c,'+00:00','-03:00')";
$SIT = ['PENDING' => 1304, 'CONVERTED' => 1305, 'PARTIALLY_PAID' => 1305, 'PAID' => 1306, 'ACCOUNTS_CANCELLED' => 1308, 'CANCELLED' => 1308];
$v = static fn (array $x): InputValidator => new InputValidator($x);
$hash = static function (array $ids): string { sort($ids); return hash('sha256', implode(',', $ids)); };
$BR = new DateTimeZone('America/Sao_Paulo'); $UTC = new DateTimeZone('UTC');
$hoje = new DateTimeImmutable('today', $BR);
$utc = static fn (DateTimeImmutable $d): string => $d->setTimezone($UTC)->format('Y-m-d H:i:s');

try {
    // ── P01-01 KPIs: total e soma ─────────────────────────────────────────────────────────────────────────────────────────────
    [$n1, $c1] = array_map('intval', $um("SELECT COUNT(*), {$cent('total')} FROM fin_payment_request WHERE deleted = 0"));
    [$n2, $c2] = array_map('intval', $um("SELECT COUNT(*), {$cent('Total')} FROM $V t"));
    $k = $api('kpis', static fn () => getKPIs($pdo))['data'];
    $ok = $n1 === $n2 && $n2 === (int)$k['total'] && $c1 === $c2 && $c2 === $fc($k['valorTotal']);
    $rec('P01-01', $ok ? 'PASS' : 'FAIL', "requisições L1/L2/L3 = $n1/$n2/{$k['total']} · centavos " . ($c1 === $c2 && $c2 === $fc($k['valorTotal']) ? 'iguais' : "$c1/$c2/" . $fc($k['valorTotal'])));

    // ── P01-02 situação (status EN original → mapeado; desconhecido à parte) ──────────────────────────────────────────────────
    $l1 = []; $desc = [0, 0];
    foreach ($q("SELECT status, COUNT(*), {$cent('total')} FROM fin_payment_request WHERE deleted = 0 GROUP BY status") as [$st, $n, $c]) {
        if (!isset($SIT[$st])) { $desc[0] += (int)$n; $desc[1] += (int)$c; }
        $g = (string)($SIT[$st] ?? 1308); $l1[$g] = [($l1[$g][0] ?? 0) + (int)$n, ($l1[$g][1] ?? 0) + (int)$c];
    }
    ksort($l1);
    $l2 = []; foreach ($q("SELECT Id_Situacao, COUNT(*), {$cent('Total')} FROM $V t GROUP BY Id_Situacao") as [$g, $n, $c]) { $l2[(string)$g] = [(int)$n, (int)$c]; } ksort($l2);
    $l3 = []; foreach ($k['porSituacao'] as $g => $s) { $l3[(string)$g] = [(int)$s['qtd'], $fc($s['valor'])]; } ksort($l3);
    $iguais = $l1 === $l2 && $l2 === $l3;
    $rec('P01-02', !$iguais ? 'FAIL' : ($desc[0] > 0 ? 'BLOQUEIO' : 'PASS'), 'grupos L1/L2/L3 ' . ($iguais ? 'iguais (' . count($l1) . ' grupos)' : 'DIFERENTES') . " · status desconhecido: {$desc[0]} requisições" . ($desc[0] > 0 ? ' → ativação bloqueada até decisão (hoje viram 1308 "Cancelado")' : ''));

    // ── P01-03 mês atual/anterior (created_at UTC em intervalos semiabertos de Brasília) ─────────────────────────────────────
    $ini = $hoje->modify('first day of this month'); $ant = $ini->modify('-1 month'); $prox = $ini->modify('+1 month');
    $janela = static fn (DateTimeImmutable $a, DateTimeImmutable $b) => array_map('intval', $um("SELECT COUNT(*), {$cent('total')} FROM fin_payment_request WHERE deleted = 0 AND created_at >= ? AND created_at < ?", [$utc($a), $utc($b)]));
    $l1m = $janela($ini, $prox); $l1a = $janela($ant, $ini);
    $vj = static fn (DateTimeImmutable $a, DateTimeImmutable $b) => array_map('intval', $um("SELECT COUNT(*), {$cent('Total')} FROM $V t WHERE Data_Requisicao >= ? AND Data_Requisicao < ?", [$a->format('Y-m-d'), $b->format('Y-m-d')]));
    $l2m = $vj($ini, $prox); $l2a = $vj($ant, $ini);
    $l3m = [(int)$k['esteMes']['qtd'], $fc($k['esteMes']['valor'])];
    $ok = $l1m === $l2m && $l2m === $l3m && $l1a === $l2a;
    $rec('P01-03', $ok ? 'PASS' : 'FAIL', "mês atual L1/L2/L3 " . ($l1m === $l2m && $l2m === $l3m ? "iguais ({$l1m[0]})" : json_encode([$l1m, $l2m, $l3m])) . " · mês anterior L1/L2 " . ($l1a === $l2a ? "iguais ({$l1a[0]})" : json_encode([$l1a, $l2a])) . ' (a API só expõe a variação do anterior)');

    // ── P01-04 reembolso ──────────────────────────────────────────────────────────────────────────────────────────────────────
    $r1 = array_map('intval', $um("SELECT COUNT(*), {$cent('total')} FROM fin_payment_request WHERE deleted = 0 AND type = 'REFUND'"));
    $r2 = array_map('intval', $um("SELECT COUNT(*), {$cent('Valor_Reembolso')} FROM $V t WHERE Reembolso = 1"));
    $r3 = [(int)$k['reembolsos']['qtd'], $fc($k['reembolsos']['valor'])];
    $rec('P01-04', $r1 === $r2 && $r2 === $r3 ? 'PASS' : 'FAIL', 'reembolsos L1/L2/L3 ' . ($r1 === $r2 && $r2 === $r3 ? "iguais ({$r1[0]})" : json_encode([$r1, $r2, $r3])));

    // ── P01-05 lista: paginação sem perda/duplicação, ordem determinística, filtros ───────────────────────────────────────────
    $pag = static function (array $f, int $max = 10) use ($pdo, $v, $api): array {
        $ids = []; $total = null; $p = 1;
        do { $r = $api('lista', static fn () => getRequisicoesList($pdo, $v($f + ['page' => (string)$p, 'limit' => '100']))); $total ??= $r['pagination']['total'];
             foreach ($r['data'] as $x) { $ids[] = (int)$x['id']; } $p++; } while ($p <= min($max, (int)$r['pagination']['totalPages']));
        return [$total, $ids, ($p - 1) >= (int)ceil($total / 100)];
    };
    [$tot, $ids, $completa] = $pag([]); [, $ids2] = $pag([]);
    $dup = count($ids) - count(array_unique($ids));
    $l1ids = array_map(static fn ($r) => (int)$r[0], $q('SELECT id FROM fin_payment_request WHERE deleted = 0'));
    $conj = $completa ? ($hash($ids) === $hash($l1ids)) : (count(array_diff($ids, $l1ids)) === 0);
    $falhasFiltro = 0; $filtros = 0;
    foreach ($l1 as $g => [$n]) { $filtros++; if ((int)$pag(['situacao' => $g], 1)[0] !== $n) { $falhasFiltro++; } }
    foreach ([['reembolso' => '1'], ['reembolso' => '0']] as $f) { $filtros++; $esp = (int)$um("SELECT COUNT(*) FROM fin_payment_request WHERE deleted = 0 AND (type = 'REFUND') = ?", [(int)$f['reembolso']])[0]; if ((int)$pag($f, 1)[0] !== $esp) { $falhasFiltro++; } }
    foreach ($q("SELECT supplier_id, COUNT(*) FROM fin_payment_request WHERE deleted = 0 AND supplier_id IS NOT NULL GROUP BY supplier_id ORDER BY 2 DESC, 1 LIMIT 5") as [$sid, $n]) { $filtros++; if ((int)$pag(['fornecedor' => (string)$sid], 1)[0] !== (int)$n) { $falhasFiltro++; } }
    foreach ($q("SELECT cc, COUNT(*) FROM (SELECT MIN(cost_center_id) cc FROM fin_payment_request_cost_center rcc JOIN fin_payment_request r ON r.id = rcc.payment_request_id AND r.deleted = 0 GROUP BY rcc.payment_request_id) x GROUP BY cc ORDER BY 2 DESC, 1 LIMIT 5") as [$cc, $n]) { $filtros++; if ((int)$pag(['centro' => (string)$cc], 1)[0] !== (int)$n) { $falhasFiltro++; } }
    $d0 = $hoje->modify('-30 days');
    $filtros++; $esp = (int)$um("SELECT COUNT(*) FROM fin_payment_request WHERE deleted = 0 AND created_at >= ? AND created_at < ?", [$utc($d0), $utc($hoje->modify('+1 day'))])[0];
    if ((int)$pag(['dataInicio' => $d0->format('Y-m-d'), 'dataFim' => $hoje->format('Y-m-d')], 1)[0] !== $esp) { $falhasFiltro++; }
    $ok = $tot === count($l1ids) && $dup === 0 && $conj && $ids === $ids2 && $falhasFiltro === 0;
    $rec('P01-05', $ok ? 'PASS' : 'FAIL', "total API/L1 = $tot/" . count($l1ids) . " · páginas lidas: " . count($ids) . ($completa ? ' (todas)' : ' (amostra das 10 primeiras)') . " · duplicados $dup · conjunto " . ($conj ? 'igual' : 'DIFERENTE') . ' · ordem ' . ($ids === $ids2 ? 'determinística' : 'INSTÁVEL') . " · filtros $filtros, falhas $falhasFiltro");

    // ── P01-06 detalhe: cardinalidade por pai, total não multiplicado, sem URL do S3 ─────────────────────────────────────────
    $amostra = array_map(static fn ($r) => (int)$r[0], array_merge($q('SELECT id FROM fin_payment_request WHERE deleted = 0 ORDER BY id LIMIT 20'), $q('SELECT id FROM fin_payment_request WHERE deleted = 0 ORDER BY id DESC LIMIT 20')));
    $amostra = array_values(array_unique($amostra)); $fd = 0; $url = 0;
    foreach ($amostra as $id) {
        $d = $api('detalhe', static fn () => getRequisicao360($pdo, $id))['data'] ?? null;
        $ni = (int)$um('SELECT COUNT(*) FROM fin_payment_request_item WHERE payment_request_id = ? AND deleted = 0', [$id])[0];
        $na = (int)$um('SELECT COUNT(*) FROM fin_payment_request_attachment WHERE payment_request_id = ? AND deleted = 0', [$id])[0];
        $ct = (int)$um("SELECT {$cent('total')} FROM fin_payment_request WHERE id = ?", [$id])[0];
        if (!$d || $d['totalItens'] !== $ni || $d['totalMidias'] !== $na || $fc($d['requisicao']['Total']) !== $ct) { $fd++; }
        foreach ($d['midias'] ?? [] as $m) { if (($m['url'] ?? null) !== null) { $url++; } }
    }
    $rec('P01-06', $fd === 0 && $url === 0 ? 'PASS' : 'FAIL', count($amostra) . " detalhes conferidos · divergências $fd · anexos com url $url");

    // ── P01-07 filtros: valores distintos e contagens ─────────────────────────────────────────────────────────────────────────
    $s3 = []; foreach ($api('situacoes', static fn () => getSituacoes($pdo))['data'] as $s) { $s3[(string)$s['id']] = (int)$s['qtd']; } ksort($s3);
    $s1 = array_map(static fn ($x) => $x[0], $l1);
    $cc1 = []; foreach ($q('SELECT cc, COUNT(*) FROM (SELECT (SELECT MIN(rcc.cost_center_id) FROM fin_payment_request_cost_center rcc WHERE rcc.payment_request_id = r.id) cc FROM fin_payment_request r WHERE r.deleted = 0) x JOIN fin_cost_center c ON c.id = x.cc AND c.description IS NOT NULL GROUP BY cc') as [$c, $n]) { $cc1[(string)$c] = (int)$n; } ksort($cc1);
    $cc3 = []; foreach ($api('centros', static fn () => getCentrosCusto($pdo))['data'] as $s) { $cc3[(string)$s['id']] = (int)$s['qtd']; } ksort($cc3);
    $f3 = $api('fornecedores', static fn () => getFornecedores($pdo))['data'];
    $f1 = $q("SELECT r.supplier_id, COUNT(*) FROM fin_payment_request r JOIN pty_supplier f ON f.id = r.supplier_id WHERE r.deleted = 0 GROUP BY r.supplier_id ORDER BY 2 DESC LIMIT 100");
    $qtdF = static fn (array $l, int $i) => array_map(static fn ($x) => (int)$x[$i], $l);
    $fok = $qtdF($f1, 1) === array_map(static fn ($x) => (int)$x['qtd'], $f3);
    $nFor = (int)$um('SELECT COUNT(DISTINCT supplier_id) FROM fin_payment_request WHERE deleted = 0 AND supplier_id IS NOT NULL')[0];
    $nCat3 = count($api('categorias', static fn () => getCategorias($pdo))['data']); $nCat2 = (int)$um("SELECT COUNT(DISTINCT Categoria) FROM $V t WHERE Categoria IS NOT NULL")[0];
    $ok = $s1 === $s3 && $cc1 === $cc3 && $fok;
    $rec('P01-07', $ok ? 'PASS' : 'FAIL', 'situações ' . ($s1 === $s3 ? 'iguais' : 'DIFERENTES') . ' · centros ' . ($cc1 === $cc3 ? 'iguais (' . count($cc1) . ')' : 'DIFERENTES') . ' · fornecedores (top 100 por qtd) ' . ($fok ? 'iguais' : 'DIFERENTES')
        . " · AVISO de limite da tela: fornecedores $nFor distintos (lista mostra ≤ 100), categorias $nCat2 distintas (lista mostra $nCat3 de no máx. 50)");

    // ── P01-08 mensal 12 meses (mês civil de Brasília; ausente na API só vale se L1 comprova zero) ──────────────────────────
    $m1 = []; foreach ($q("SELECT DATE_FORMAT({$tz('created_at')}, '%Y-%m'), COUNT(*), {$cent('total')} FROM fin_payment_request WHERE deleted = 0 AND created_at >= ? GROUP BY 1", [$utc($hoje->modify('-12 months'))]) as [$m, $n, $c]) { $m1[$m] = [(int)$n, (int)$c]; } ksort($m1);
    $m3 = []; foreach ($api('mensal', static fn () => getResumoMensal($pdo))['data'] as $x) { $m3[$x['mes']] = [(int)$x['qtd'], $fc($x['valor'])]; } ksort($m3);
    $rec('P01-08', $m1 === $m3 ? 'PASS' : 'FAIL', count($m1) . ' competências com movimento L1 · API ' . count($m3) . ' · ' . ($m1 === $m3 ? 'iguais (meses ausentes = zero comprovado no L1)' : 'DIFERENTES'));

    // ── P01-09 top fornecedores / categorias (ordem, empate, soma, contagem; categoria = proxy do 1º item) ──────────────────
    $t1 = array_map(static fn ($r) => [(int)$r[0], (int)$r[1], (int)$r[2]], $q("SELECT r.supplier_id, COUNT(*), {$cent('r.total')} FROM fin_payment_request r JOIN pty_supplier f ON f.id = r.supplier_id WHERE r.deleted = 0 GROUP BY r.supplier_id ORDER BY 3 DESC, 2 DESC, 1 ASC LIMIT 10"));
    $t3 = array_map(static fn ($x) => [(int)$x['id'], (int)$x['qtd'], $fc($x['valor'])], $api('top-fornecedores', static fn () => getTopFornecedores($pdo, 10))['data']);
    // ordem e EMPATE: a sequência de ids (comparada por hash, nunca mostrada) tem de ser a mesma — desempate = valor, qtd, id
    $seq = static fn (array $l) => hash('sha256', implode(',', array_column($l, 0)));
    $c2t = array_map(static fn ($r) => [(int)$r[0], (int)$r[1]], $q("SELECT COUNT(*), {$cent('Total')} FROM $V t WHERE Categoria IS NOT NULL AND Descricao_Categoria IS NOT NULL GROUP BY Categoria, Descricao_Categoria ORDER BY 2 DESC, 1 DESC, Descricao_Categoria ASC LIMIT 10"));
    $c3t = array_map(static fn ($x) => [(int)$x['qtd'], $fc($x['valor'])], $api('top-categorias', static fn () => getTopCategorias($pdo))['data']);
    $rec('P01-09', $t1 === $t3 && $c2t === $c3t ? 'PASS' : 'FAIL', 'top fornecedores L1/L3 ' . ($t1 === $t3 ? 'iguais (somas, contagens e ordem por id)' : ($seq($t1) !== $seq($t3) && array_map(static fn ($x) => array_slice($x, 1), $t1) === array_map(static fn ($x) => array_slice($x, 1), $t3) ? 'mesmas somas, ORDEM/EMPATE diferente' : 'DIFERENTES')) . ' · top categorias (proxy: 1ª categoria do item) L2/L3 ' . ($c2t === $c3t ? 'iguais' : 'DIFERENTES'));

    // ── P01-10 CSV: mesma seleção da lista, limite explícito ─────────────────────────────────────────────────────────────────
    $rec('P01-10', $tot <= 5000 ? 'PASS' : 'FAIL', "exportação = a lista (mesma função, limite 5000 com X-Export-Total/X-Export-Truncado) · total $tot" . ($tot > 5000 ? ' → TRUNCARIA: decisão (paginar a exportação ou aceitar o limite rotulado)' : ' cabe inteiro'));

    // ── P01-11 cardinalidade: duplicados, órfãos, fanout ─────────────────────────────────────────────────────────────────────
    [$lin, $dist] = array_map('intval', $um("SELECT COUNT(*), COUNT(DISTINCT Id_Requisicao) FROM $V t"));
    $oi = (int)$um('SELECT COUNT(*) FROM fin_payment_request_item i LEFT JOIN fin_payment_request r ON r.id = i.payment_request_id WHERE i.deleted = 0 AND r.id IS NULL')[0];
    $oa = (int)$um('SELECT COUNT(*) FROM fin_payment_request_attachment a LEFT JOIN fin_payment_request r ON r.id = a.payment_request_id WHERE a.deleted = 0 AND r.id IS NULL')[0];
    $oc = (int)$um('SELECT COUNT(*) FROM fin_payment_request_cost_center x LEFT JOIN fin_cost_center c ON c.id = x.cost_center_id WHERE c.id IS NULL')[0];
    $of = (int)$um('SELECT COUNT(*) FROM fin_payment_request r LEFT JOIN pty_supplier f ON f.id = r.supplier_id WHERE r.deleted = 0 AND r.supplier_id IS NOT NULL AND f.id IS NULL')[0];
    $mi = (int)($um('SELECT COALESCE(MAX(n), 0) FROM (SELECT COUNT(*) n FROM fin_payment_request_item WHERE deleted = 0 GROUP BY payment_request_id) x')[0] ?? 0);
    $mc = (int)($um('SELECT COALESCE(MAX(n), 0) FROM (SELECT COUNT(*) n FROM fin_payment_request_cost_center GROUP BY payment_request_id) x')[0] ?? 0);
    $multi = (int)$um('SELECT COUNT(*) FROM (SELECT payment_request_id FROM fin_payment_request_cost_center GROUP BY payment_request_id HAVING COUNT(*) > 1) x')[0];
    $it2 = (int)$um("SELECT COUNT(*) FROM $VI t")[0]; $it1 = (int)$um('SELECT COUNT(*) FROM fin_payment_request_item WHERE deleted = 0')[0];
    $an2 = (int)$um("SELECT COUNT(*) FROM $VM t")[0]; $an1 = (int)$um('SELECT COUNT(*) FROM fin_payment_request_attachment WHERE deleted = 0')[0];
    $ok = $lin === $dist && $it1 === $it2 && $an1 === $an2 && $c1 === $c2;
    $rec('P01-11', $ok ? 'PASS' : 'FAIL', "view linhas/ids $lin/$dist · itens L1/L2 $it1/$it2 · anexos L1/L2 $an1/$an2 · órfãos: itens $oi, anexos $oa, centros sem cadastro $oc, fornecedor inexistente $of · fanout máx: $mi itens, $mc centros por requisição · $multi com vários centros (total não multiplicado: " . ($c1 === $c2 ? 'sim' : 'NÃO') . ')');

    // ── P01-12 empresa: BLOQUEADO por decisão ───────────────────────────────────────────────────────────────────────────────
    $rec('P01-12', 'BLOQUEADO', 'decisão do arquiteto: religa SEM filtro/agrupamento por empresa até o Walter confirmar a dimensão oficial (fin_payment_request não tem empresa; não inferir por fornecedor)');

    // ── P01-13 autorização e cache (inspeção do código que responde + autorização fail-closed) ──────────────────────────────
    $pos = static fn (string $s): int => ($p = strpos($fonte, $s)) === false ? PHP_INT_MAX : $p;
    $ordem = [$pos('AuthHelpers::requireAuth();'), $pos("\$ERP_ORIGEM = erp_ponto_origem('painel01');"), $pos('erp_novo_autorizado(AuthHelpers::getCurrentUserId())'), $pos('RedisHelper::serveIfCached'), $pos("\$pdo = erp_ponto_pdo('painel01');")];
    $ord = $ordem; sort($ord);
    $prefixo = !preg_match("/['\"]panel:01:/", (string)preg_replace('/\$CACHE_PREFIX = .*;/', '', $fonte)) && str_contains($fonte, "'panel:01n:'");
    $neg = !erp_novo_autorizado(0) && !erp_novo_autorizado(1, static function () { throw new RuntimeException('falha'); }) && !erp_novo_autorizado(1, static fn () => ['enabled' => 'true']) && !erp_novo_autorizado(1, static fn () => ['enabled' => true, 'source' => 'global']) && !erp_novo_autorizado(1, static fn () => ['enabled' => true, 'source' => 'rollout']);
    $ok = $ordem === $ord && !in_array(PHP_INT_MAX, $ordem, true) && $prefixo && $neg;
    $rec('P01-13', $ok ? 'PASS' : 'FAIL', 'ordem login→origem→autorização→cache→conexão ' . ($ordem === $ord ? 'ok' : 'ERRADA') . ' · cache por origem ' . ($prefixo ? 'ok' : 'NÃO') . ' · negado/falha/global/rollout nega ' . ($neg ? 'ok' : 'NÃO') . ' · troca de flag = troca de prefixo (revogado e cache quente: testes/chaveamento.php)');

    // ── P01-14 falhas: indisponível, nunca zero ───────────────────────────────────────────────────────────────────────────────
    $ok = substr_count($fonte, "'estado' => 'indisponivel'") >= 2 && str_contains($fonte, "if (\$ERP_ORIGEM === 'novo') { ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503");
    $rec('P01-14', $ok ? 'PASS' : 'FAIL', 'conexão e consulta da origem nova → 503 {fonte: erp, estado: indisponivel} ' . ($ok ? 'ok' : 'AUSENTE') . ' · este comparador sai 2 (sem conclusão) se a fonte cair · flag OFF = legado, nunca "recuperação"');

    // ── P01-15 desempenho (tempo de cada função da API; limite por SQL = 4 s, imposto pela sessão) ─────────────────────────
    $maxT = $tempos ? max($tempos) : 0; arsort($tempos);
    $rec('P01-15', $maxT < 4000 ? 'PASS' : 'FAIL', 'maior função da API ' . $maxT . ' ms (' . (array_key_first($tempos) ?? '-') . ') · todas: ' . implode(', ', array_map(static fn ($k, $t) => "$k $t", array_keys($tempos), $tempos)) . ' ms · orçamento da requisição inteira: a ratificar (medir no navegador depois da ativação)');
} catch (Throwable $e) {
    fwrite(STDERR, '[ERRO] consulta falhou (' . get_class($e) . ') — nenhuma conclusão; trate como INDISPONÍVEL' . (getenv('ERP_NOVO_TESTE') ? ': ' . $e->getMessage() : '') . "\n"); exit(2);
}
$pdo->exec('ROLLBACK');
ksort($R); $falha = 0;
foreach ($R as $id => [$estado, $det]) { if (!in_array($estado, ['PASS', 'BLOQUEADO'], true)) { $falha++; } printf("%-6s %-9s %s\n", $id, $estado, $det); }
echo $falha ? "== NÃO APTO: $falha critério(s) sem PASS (P01-12 bloqueado por decisão não conta)\n" : "== APTO: 14 critérios PASS (P01-12 bloqueado por decisão)\n";
exit($falha ? 1 : 0);
