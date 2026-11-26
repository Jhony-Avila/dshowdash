<?php
declare(strict_types=1);
// teste-geral-v2-conciliacao.php — conciliação Asaas × Precifica com a janela de ±3 dias úteis (ACIMA_ESQUERDA, 26/11).
// Banco de VALIDAÇÃO ATRWEB_VAL_T_13, tabelas próprias com prefixo aleatório (criadas e removidas aqui); pasta de chaves temporária (segredo inventado).
// Uso: php scripts/geral/teste-geral-v2-conciliacao.php
require_once __DIR__ . '/../../api/geral/GeralV2Conciliacao.php';

$ok = 0; $falhas = [];
function check(string $n, bool $c, string $info = ''): void { global $ok, $falhas; if ($c) { $ok++; echo "ok    $n\n"; } else { $falhas[] = $n; echo "FALHA $n" . ($info !== '' ? " · $info" : '') . "\n"; } }

// ---- A. dias úteis
$du = fn(string $a, string $b) => GeralV2Conciliacao::diasUteis($a, $b);
check('dias úteis: sex→seg = 1, sáb→seg = 1, sex→sáb = 0, seg→qui = 3, qua→seg (volta) = −2',
    $du('2026-11-13', '2026-11-16') === 1 && $du('2026-11-14', '2026-11-16') === 1 && $du('2026-11-13', '2026-11-14') === 0
    && $du('2026-11-09', '2026-11-12') === 3 && $du('2026-11-11', '2026-11-09') === -2);

// 26/11: feriados (nacionais + SP capital, lista fixa 2025–2027)
check('feriado 20/11/2026 (sex): qui 19/11 → seg 23/11 = 1 dia útil', $du('2026-11-19', '2026-11-23') === 1);
check('Natal 25/12/2026 (sex): qui 24/12 → seg 28/12 = 1 dia útil', $du('2026-12-24', '2026-12-28') === 1);
check('Carnaval 2026 (seg 16 e ter 17/02): sex 13/02 → qua 18/02 = 1 dia útil; 2027 (08–09/02): sex 05/02 → qua 10/02 = 1', $du('2026-02-13', '2026-02-18') === 1 && $du('2027-02-05', '2027-02-10') === 1);
check('SP capital: 25/01/2027 (seg) e Corpus Christi 04/06/2026 (qui) não são úteis; volta no tempo também desconta', $du('2027-01-22', '2027-01-26') === 1
    && $du('2026-06-03', '2026-06-05') === 1 && $du('2026-11-23', '2026-11-19') === -1);
check('lista: 45 datas, 15 por ano, sem repetição, nenhuma em 2024/2028', count(GeralV2Conciliacao::FERIADOS) === 45 && count(array_unique(GeralV2Conciliacao::FERIADOS)) === 45
    && count(array_filter(GeralV2Conciliacao::FERIADOS, fn($f) => str_starts_with($f, '2026-'))) === 15);

// ---- B. casamento puro (sem banco)
$it = fn(string $id, string $dia, int $c, ?int $l = null) => ['id' => $id, 'dia' => $dia, 'c' => $c, 'l' => $l];
$porDia = fn(array $r) => array_column($r['dias'], null, 'dia');
// J. Carvalho: +38.220 em 10/11 e −38.220 em 11/11 → conciliado com atraso de 1 dia útil
$r = GeralV2Conciliacao::casar([$it('a', '2026-11-10', 3822000), $it('b', '2026-11-10', 100000)], ['2026-11-10' => 100000, '2026-11-11' => 3822000], '2026-10-28', '2026-11-26');
$d = $porDia($r);
check('sobra × −sobra no dia seguinte: 0 sem par, 1 conciliado com atraso', $r['resumo']['itens_sem_par'] === 0 && $r['resumo']['conciliados_com_atraso'] === 1, json_encode($r['resumo']));
check('os dois dias dizem "conciliado com atraso de 1 dia útil", não divergentes, restante 0.00', !$d['2026-11-10']['divergente'] && !$d['2026-11-11']['divergente']
    && $d['2026-11-10']['motivo'] === 'conciliado com atraso de 1 dia útil' && $d['2026-11-11']['motivo'] === 'conciliado com atraso de 1 dia útil'
    && $d['2026-11-10']['restante'] === '0.00' && $d['2026-11-10']['diferenca'] === '38220.00' && $d['2026-11-11']['conciliado_com'] === [['dia' => '2026-11-10', 'dias_uteis' => 1, 'valor' => '38220.00']],
    json_encode($d, JSON_UNESCAPED_UNICODE));
check('resumo da empresa: total Asaas, total Precifica, diferença líquida', $r['resumo']['asaas'] === '39220.00' && $r['resumo']['precifica'] === '39220.00' && $r['resumo']['diferenca'] === '0.00');
// recebido num domingo, baixa na segunda
$r = GeralV2Conciliacao::casar([$it('a', '2026-11-08', 1700000)], ['2026-11-09' => 1700000], '2026-10-28', '2026-11-26');
check('domingo (Asaas) × segunda (Precifica) = atraso de 1 dia útil', $porDia($r)['2026-11-09']['motivo'] === 'conciliado com atraso de 1 dia útil' && $r['resumo']['itens_sem_par'] === 0);
// baixa ANTES do recebimento
$r = GeralV2Conciliacao::casar([$it('a', '2026-11-12', 50000)], ['2026-11-10' => 50000], '2026-10-28', '2026-11-26');
check('baixa 2 dias úteis antes do recebimento', $porDia($r)['2026-11-12']['motivo'] === 'conciliado: baixa 2 dias úteis antes do recebimento' && $r['resumo']['itens_sem_par'] === 0);
// cobrança a cobrança: 9.500 levada para o dia seguinte; o que sobra lá fica divergente
$r = GeralV2Conciliacao::casar([$it('a', '2026-11-25', 950000), $it('b', '2026-11-25', 30000)], ['2026-11-25' => 30000, '2026-11-26' => 1020000], '2026-10-28', '2026-11-26');
$d = $porDia($r);
check('cobrança levada ao dia da janela: 25/11 conciliado com atraso; 26/11 sobra −700,00 "sem recebimento no Asaas"', !$d['2026-11-25']['divergente']
    && $d['2026-11-25']['motivo'] === 'conciliado com atraso de 1 dia útil' && $d['2026-11-26']['divergente'] && $d['2026-11-26']['restante'] === '-700.00'
    && $d['2026-11-26']['motivo'] === 'sem recebimento no Asaas' && $r['resumo']['itens_sem_par'] === 1 && $r['resumo']['conciliados_com_atraso'] === 1, json_encode($d, JSON_UNESCAPED_UNICODE));
// vários recebimentos de um dia baixados todos no dia seguinte (passo 2: o dia inteiro anda)
$r = GeralV2Conciliacao::casar([$it('a', '2026-11-17', 120000), $it('b', '2026-11-17', 80000)], ['2026-11-18' => 200000], '2026-10-28', '2026-11-26');
check('dia inteiro do Asaas baixado no dia seguinte (2 cobranças, 1 baixa somada): conciliado com atraso', $r['resumo']['itens_sem_par'] === 0 && $r['resumo']['conciliados_com_atraso'] === 1);
// fora da janela (5 dias úteis): os dois lados ficam sem par
$r = GeralV2Conciliacao::casar([$it('a', '2026-11-03', 500000)], ['2026-11-10' => 500000], '2026-10-28', '2026-11-26');
$d = $porDia($r);
check('5 dias úteis de distância: sem par dos dois lados, com os motivos curtos', $d['2026-11-03']['motivo'] === 'sem baixa no Precifica' && $d['2026-11-10']['motivo'] === 'sem recebimento no Asaas'
    && $r['resumo']['itens_sem_par'] === 2 && $r['resumo']['conciliados_com_atraso'] === 0);
// com o feriado de 20/11: recebido qui 19/11, baixa qua 25/11 = 3 dias úteis (20/11 não conta) → casa
$r = GeralV2Conciliacao::casar([$it('a', '2026-11-19', 300000)], ['2026-11-25' => 300000], '2026-10-28', '2026-11-26');
check('20/11 fora da conta: 19/11 → 25/11 casa com atraso de 3 dias úteis', $r['resumo']['itens_sem_par'] === 0 && $porDia($r)['2026-11-25']['motivo'] === 'conciliado com atraso de 3 dias úteis');
// exatamente 3 dias úteis casa; valor quase igual (1 centavo) NÃO casa entre dias
$r = GeralV2Conciliacao::casar([$it('a', '2026-11-09', 200000)], ['2026-11-12' => 200000], '2026-10-28', '2026-11-26');
check('3 dias úteis casa', $r['resumo']['itens_sem_par'] === 0 && $r['resumo']['conciliados_com_atraso'] === 1);
$r = GeralV2Conciliacao::casar([$it('a', '2026-11-09', 200000)], ['2026-11-10' => 199999], '2026-10-28', '2026-11-26');
check('entre dias só valor EXATO: 2.000,00 × 1.999,99 não casa', $r['resumo']['itens_sem_par'] === 2);
// mesmo dia: juros/multa/desconto e tarifa
$r = GeralV2Conciliacao::casar([$it('a', '2026-11-12', 100000, 99000), $it('b', '2026-11-13', 100000, 99000)], ['2026-11-12' => 101000, '2026-11-13' => 99000], '2026-10-28', '2026-11-26');
$d = $porDia($r);
check('mesmo dia, valor diferente: provável juros/multa/desconto; líquido igual: tarifa do Asaas', $d['2026-11-12']['motivo'] === 'valor diferente: provável juros/multa/desconto'
    && $d['2026-11-13']['motivo'] === 'valor diferente: tarifa do Asaas (o Precifica lançou o líquido)', json_encode($d, JSON_UNESCAPED_UNICODE));
// tolerância de R$ 1,00 no mesmo dia
$r = GeralV2Conciliacao::casar([$it('a', '2026-11-12', 100000)], ['2026-11-12' => 100050], '2026-10-28', '2026-11-26');
check('diferença ≤ R$ 1,00 no dia: bate (motivo null, não divergente)', !$porDia($r)['2026-11-12']['divergente'] && $porDia($r)['2026-11-12']['motivo'] === null);
// margem: recebido em 27/10 (fora da janela), baixa em 28/10 (dentro) → o 28/10 concilia; o 27/10 não aparece
$r = GeralV2Conciliacao::casar([$it('a', '2026-10-27', 400000)], ['2026-10-28' => 400000], '2026-10-28', '2026-11-26');
check('margem antes da janela casa o 1º dia; só os dias da janela saem', array_keys($porDia($r)) === ['2026-10-28'] && !$porDia($r)['2026-10-28']['divergente']
    && $r['resumo']['asaas'] === '0.00' && $r['resumo']['precifica'] === '4000.00');
// Precifica desconhecido no dia: nunca casa, divergente, totais do Precifica "—"
$r = GeralV2Conciliacao::casar([$it('a', '2026-11-14', 100000)], ['2026-11-14' => null, '2026-11-17' => 100000], '2026-10-28', '2026-11-26');
check('valor do Precifica desconhecido: divergente, nunca casado, total do Precifica null', $porDia($r)['2026-11-14']['motivo'] === 'valor do Precifica desconhecido no dia'
    && $porDia($r)['2026-11-14']['restante'] === null && $r['resumo']['precifica'] === null && $r['resumo']['diferenca'] === null && $porDia($r)['2026-11-17']['divergente']);

// ---- C. ponta a ponta no banco de validação
$ini = parse_ini_file('/srv/dshow-modularizacao/atributos-web/validacao/credenciais/atrweb_val.ini', true, INI_SCANNER_RAW)['client'] ?? null;
if (!is_array($ini)) { echo "credencial do banco de validação ilegível\n"; exit(2); }
$dsn = isset($ini['socket']) ? "mysql:unix_socket={$ini['socket']};dbname=ATRWEB_VAL_T_13;charset=utf8mb4"
                             : 'mysql:host=' . ($ini['host'] ?? '127.0.0.1') . ';port=' . ($ini['port'] ?? 3306) . ';dbname=ATRWEB_VAL_T_13;charset=utf8mb4';
$pdo = new PDO($dsn, $ini['user'], $ini['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); unset($ini);
check('banco é o de validação', $pdo->query('SELECT DATABASE()')->fetchColumn() === 'ATRWEB_VAL_T_13');
$P = 'asaas_t' . bin2hex(random_bytes(4)) . '_';
$TMP = sys_get_temp_dir() . '/conc-janela.' . bin2hex(random_bytes(4)); mkdir($TMP, 0700);
register_shutdown_function(function () use ($pdo, $P, $TMP): void {
    if (preg_match('/^asaas_t[0-9a-f]{8}_$/', $P) === 1) foreach (['asaas_contas', 'asaas_cobrancas', 'asaas_extrato', 'asaas_estatisticas', 'asaas_execucoes', 'fin_pcf_snapshot', 'fin_pcf_recebido_dia', 'fin_pcf_empresa'] as $t) $pdo->exec("DROP TABLE IF EXISTS `{$P}{$t}`");
    if (preg_match('#/conc-janela\.[0-9a-f]{8}$#', $TMP) && is_dir($TMP)) { foreach (glob("$TMP/*.id") as $f) unlink($f); @unlink("$TMP/" . AsaasChaves::SEGREDO); rmdir($TMP); }
});
foreach (AsaasEsquema::ddl($P) as $sql) $pdo->exec($sql);
$pdo->exec("CREATE TABLE `{$P}fin_pcf_snapshot` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `gerado_em` DATETIME(3) NOT NULL, `estado` VARCHAR(10) NOT NULL)");
$pdo->exec("CREATE TABLE `{$P}fin_pcf_recebido_dia` (`snapshot_id` BIGINT UNSIGNED NOT NULL, `dia` DATE NOT NULL, `empresa_id` INT NULL, `baixas` INT UNSIGNED NOT NULL, `valor_cents` BIGINT NULL)");
$pdo->exec("CREATE TABLE `{$P}fin_pcf_empresa` (`empresa_id` INT NOT NULL PRIMARY KEY, `cnpj` VARCHAR(20) NOT NULL, `nome` VARCHAR(100) NULL)");
file_put_contents("$TMP/" . AsaasChaves::SEGREDO, bin2hex(random_bytes(32)) . "\n");
$ks = new AsaasChaves($TMP);
$cnpj = ['jcar' => '11111111000111', 'jwa' => '22222222000122', 'amb' => '33333333000133', 'sp' => '44444444000144'];
foreach ($cnpj as $r => $c) file_put_contents("$TMP/$r.id", $ks->identidadeDe(['cpfCnpj' => $c]) . "\n");
$pdo->exec("INSERT INTO `{$P}fin_pcf_empresa` VALUES (1, '11.111.111/0001-11', 'J. Carvalho'), (2, '22222222000122', 'DSHOW'), (3, '33333333000133', 'Amb A'), (4, '33333333000133', 'Amb B')");
$pdo->exec("INSERT INTO `{$P}fin_pcf_snapshot` (gerado_em, estado) VALUES ('2026-11-26 14:00:00', 'ok')"); $sid = (int) $pdo->lastInsertId();
foreach (['jcar' => 'J. Carvalho Ltda', 'jwa' => 'J.W.A.', 'amb' => 'Amb', 'sp' => 'Sem Par'] as $r => $n)
    $pdo->prepare("INSERT INTO `{$P}asaas_contas` (`conta`,`nome`,`estado`,`geracao_ativa`,`ultima_sync_ok`,`atualizado_em`) VALUES (?,?,'ok',0,'2026-11-26 11:37:00','2026-11-26 11:37:00')")->execute([$r, $n]);
$cob = $pdo->prepare("INSERT INTO `{$P}asaas_cobrancas` (`conta`,`geracao`,`payment_id`,`status`,`valor`,`valor_liquido`,`data_pagamento`,`deletada`,`presente`,`execucao`,`atualizado_em`) VALUES (?,?,?,?,?,NULL,?,?,?,1,NOW())");
foreach ([['jcar', 0, 'p1', 'RECEIVED', '38220.00', '2026-11-10', 0, 1], ['jcar', 0, 'p2', 'RECEIVED', '1000.00', '2026-11-10', 0, 1],
          ['jcar', 0, 'p3', 'PENDING', '777.00', '2026-11-11', 0, 1], ['jcar', 0, 'p4', 'RECEIVED', '555.00', '2026-11-11', 1, 1], ['jcar', 0, 'p5', 'RECEIVED', '444.00', '2026-11-11', 0, 0],
          ['jcar', 1, 'p6', 'RECEIVED', '333.00', '2026-11-11', 0, 1], ['amb', 0, 'q1', 'RECEIVED', '10.00', '2026-11-12', 0, 1]] as $x) $cob->execute($x);
$pr = $pdo->prepare("INSERT INTO `{$P}fin_pcf_recebido_dia` VALUES ($sid, ?, ?, 1, ?)");
foreach ([['2026-11-10', 1, 100000], ['2026-11-11', 1, 3822000], ['2026-11-20', 2, 500000], ['2026-11-12', 3, 1000]] as $x) $pr->execute($x);
$cc = new GeralV2Conciliacao($pdo, $TMP, $P, 'ATRWEB_VAL_T_13');
$res = $cc->comparar(['jcar', 'jwa', 'amb', 'sp'], new DateTimeImmutable('2026-11-26 12:00:00', new DateTimeZone('America/Sao_Paulo')), 30);
$e = array_column($res['empresas'], null, 'conta');
check('banco: J. Carvalho conciliada com atraso (só RECEIVED, presente, não apagada, da geração ativa)', $e['jcar']['divergencias'] === 0 && $e['jcar']['resumo']['conciliados_com_atraso'] === 1
    && $e['jcar']['resumo']['asaas'] === '39220.00' && $e['jcar']['ligacao_a_confirmar'] === false && $e['jcar']['empresa_precifica'] === 'J. Carvalho', json_encode($e['jcar'], JSON_UNESCAPED_UNICODE));
check('banco: J.W.A. ligada à "DSHOW" sem recebimento no Asaas → ligação a confirmar, fora do total geral', $e['jwa']['ligacao_a_confirmar'] === true && $e['jwa']['empresa_precifica'] === 'DSHOW'
    && str_starts_with((string) $e['jwa']['motivo'], 'ligação a confirmar: o Asaas desta conta não tem recebimento') && $e['jwa']['divergencias'] === 1 && $e['jwa']['resumo']['precifica'] === '5000.00');
check('banco: CNPJ em 2 empresas do Precifica → ligação a confirmar (ambígua)', $e['amb']['ligacao_a_confirmar'] === true && $e['amb']['motivo'] === 'ligação a confirmar: mais de uma empresa/conta com o mesmo CNPJ');
check('banco: sem par continua sem par', $e['sp']['estado'] === 'sem_par' && $e['sp']['dias'] === null && $e['sp']['resumo'] === null);
check('banco: total geral sem as ligações a confirmar; contagens no topo', $res['divergencias'] === 0 && $res['ligacoes_a_confirmar'] === 2 && $res['conciliados_com_atraso'] === 1
    && $res['casamento']['dias_uteis'] === 3, json_encode(array_diff_key($res, ['empresas' => 1]), JSON_UNESCAPED_UNICODE));
check('banco: nenhum CNPJ na resposta', !preg_match('/\d{11,14}|\d{2}\.\d{3}\.\d{3}/', json_encode($res)));

echo 'teste-geral-v2-conciliacao: ', $ok, ' ok, ', count($falhas), " falha(s)\n";
exit($falhas === [] ? 0 : 1);
