<?php
declare(strict_types=1);
// teste-previa-cadastral.php — C1 (VINHO/ACIMA_ESQUERDA, 26/11): aceites da §7 (parte da PRÉVIA) do briefing PILOTO-CADASTRAL-DSHOW, com dados SINTÉTICOS.
require_once __DIR__ . '/../../api/cadastro/PreviaCadastral.php';
$ok = 0; $f = [];
function ck(string $n, bool $c, string $i = ''): void { global $ok, $f; if ($c) { $ok++; echo "ok    $n\n"; } else { $f[] = $n; echo "FALHA $n" . ($i ? " · $i" : '') . "\n"; } }
$S = fn(?string $v) => ['tipo' => $v === null ? 'NULL' : 'STRING', 'valor' => $v];
$org = fn(int $id, string $nome, string $doc, ?string $ganho, array $campos = [], ?string $idprec = null) => ['id' => $id, 'nome' => $nome, 'doc' => $doc, 'idprec' => $idprec, 'ganho' => $ganho, 'campos' => $campos + ['4022' => ['tipo' => 'STRING', 'valor' => $doc]]];
$OK = ['pipedrive' => ['estado' => 'ok', 'campo_4038' => true], 'precifica' => ['estado' => 'ok'], 'legado' => ['estado' => 'ok']];
$por = fn(array $r) => array_column($r['linhas'], null, 'id');
$achar = fn(array $r, int $org, string $campo) => array_values(array_filter($r['linhas'], fn($l) => $l['org_id'] === $org && $l['campo'] === $campo))[0] ?? null;

// ── A. 101 CNPJs elegíveis, 1 CNPJ com 2 fichas ganhas → ordem estável, 100 CNPJs, identidade preservada
$cnpjs = []; for ($i = 1; $cnpjs === [] || count($cnpjs) < 101; $i++) { $b = sprintf('%08d0001', 10000000 + $i); foreach ([12, 13] as $n) { $s = 0; $p = $n === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2]; for ($j = 0; $j < $n; $j++) $s += (int) $b[$j] * $p[$j]; $r = $s % 11; $b .= (string) ($r < 2 ? 0 : 11 - $r); } $cnpjs[] = $b; }
$orgs = []; $prec = [];
foreach ($cnpjs as $i => $d) { $orgs[] = $org(1000 + $i, "Ficha $i", $d, sprintf('2026-11-%02d 10:00:00', 1 + intdiv($i, 5)), ['4025' => $S(null), '4036' => $S('Fant ' . $i)]); $prec[$d] = [['id' => 5000 + $i, 'razao' => "Razao $i Ltda", 'fantasia' => "Fant $i"]]; }
$orgs[] = $org(2000, 'Outra ficha do mesmo CNPJ', $cnpjs[100], '2026-11-21 09:00:00', ['4025' => $S(null), '4036' => $S('X')]);
$r1 = PreviaCadastral::montar($orgs, $prec, [], [], $OK, ['ganhos'], '2026-11-26T17:00:00-03:00');
$r1b = PreviaCadastral::montar($orgs, $prec, [], [], $OK, ['ganhos'], '2026-11-26T17:00:00-03:00');
$cn = array_values(array_unique(array_column($r1['linhas'], 'cnpj')));
ck('A · 101 elegíveis → 100 CNPJs no lote; o mais recente primeiro; empate pelo CNPJ crescente', $r1['lote']['filas']['ganhos']['cnpjs_elegiveis'] === 101 && count($cn) === 100 && $cn[0] === $cnpjs[100]);
ck('A · ordem estável (2 montagens = mesmas linhas, mesmos ids)', array_column($r1['linhas'], 'id') === array_column($r1b['linhas'], 'id'));
$dois = array_values(array_filter($r1['linhas'], fn($l) => $l['cnpj'] === $cnpjs[100] && $l['campo'] === '4025'));
ck('A · CNPJ com 2 fichas ganhas: 2 destinos, cada um com o seu org_id e o outro em cnpj_compartilhado_com', count($dois) === 2
    && $dois[0]['org_id'] !== $dois[1]['org_id'] && in_array($dois[0]['org_id'], $dois[1]['cnpj_compartilhado_com'], true));

// ── B. espaços, nulo JSON, texto "null", nome = 3993, CNPJ com zeros, filiais da mesma raiz
$m = '11222333000181'; $fil = '11222333000262'; $z = '04252011000110';
$o2 = [$org(1, 'Loja Um', $m, '2026-11-20', ['4025' => $S('   '), '4036' => $S('null')]),
       $org(2, 'Loja Dois', $fil, '2026-11-19', ['4025' => ['tipo' => 'sem_chave', 'valor' => null], '4036' => $S('Loja Dois')]),
       $org(3, 'Zeros', $z, '2026-11-18', ['4025' => ['tipo' => 'OBJECT', 'valor' => null], '4036' => $S('N/A')])];
$p2 = [$m => [['id' => 1, 'razao' => 'Matriz Ltda', 'fantasia' => 'Matriz']], $z => [['id' => 3, 'razao' => 'Zeros SA', 'fantasia' => 'Z']]];
$l2 = [$m => ['razao' => 'MATRIZ LTDA', 'fantasia' => 'MATRIZ', 'json_cnpj' => $m, 'json_razao' => null, 'json_fantasia' => null, 'consultado_em' => '2024-05-01'],
       $z => ['razao' => 'ZEROS SA', 'fantasia' => '', 'json_cnpj' => $z, 'json_razao' => null, 'json_fantasia' => 'Zeros Fantasia', 'consultado_em' => null]];
$r2 = PreviaCadastral::montar($o2, $p2, [], $l2, $OK, ['ganhos'], '2026-11-26T17:00:00-03:00');
ck('B · "   " e nulo JSON e objeto{value:null} e chave ausente = lacuna', $achar($r2, 1, '4025') !== null && $achar($r2, 3, '4025') !== null && $achar($r2, 2, '4025') !== null);
ck('B · texto "null", "N/A" e fantasia igual ao Nome 3993 = PROTEGIDOS (sem linha)', $achar($r2, 1, '4036') === null && $achar($r2, 3, '4036') === null && $achar($r2, 2, '4036') === null
    && $r2['lote']['filas']['ganhos']['protegidos_nao_lacuna'] === 3);
ck('B · CNPJ com zero à esquerda preservado como texto de 14', $achar($r2, 3, '4025')['cnpj'] === '04252011000110');
ck('B · filiais da mesma raiz NÃO se associam (a filial não recebe a razão da matriz; sem cnpj compartilhado)', $achar($r2, 2, '4025')['classificacao'] === 'sem_valor_legado_ausente'
    && $achar($r2, 2, '4025')['cnpj_compartilhado_com'] === [] && $achar($r2, 2, '4025')['grafias'] === []);

// ── C. grafias equivalentes × conteúdos divergentes
$a1 = $achar($r2, 1, '4025');
ck('C · "Matriz Ltda" (Precifica) × "MATRIZ LTDA" (legado) = sugestão; proposto = grafia ORIGINAL do Precifica; as 2 grafias visíveis com a fonte',
    $a1['classificacao'] === 'sugestao' && $a1['proposto'] === ['valor' => 'Matriz Ltda', 'origem' => 'precifica'] && count($a1['grafias']) === 2
    && $a1['grafias'][1]['origem'] === 'legado' && $a1['grafias'][1]['doadora']['consultado_em'] === '2024-05-01' && $a1['pre_selecionada'] === true);
$o3 = [$org(4, 'Bar', '11444777000161', '2026-11-20', ['4025' => $S(null), '4036' => $S(null)])];
$r3 = PreviaCadastral::montar($o3, ['11444777000161' => [['id' => 9, 'razao' => 'Bar do Zé Ltda', 'fantasia' => 'Bar do Zé']]], [],
    ['11444777000161' => ['razao' => 'BAR DO ZE LTDA', 'fantasia' => 'BOTECO', 'json_cnpj' => null, 'json_razao' => null, 'json_fantasia' => null, 'consultado_em' => null]], $OK, ['ganhos'], 'x');
ck('C · acento e pontuação PRESERVADOS na comparação: "Bar do Zé Ltda" × "BAR DO ZE LTDA" = divergem → revisão; nada pré-selecionado',
    $achar($r3, 4, '4025')['classificacao'] === 'fontes_divergem' && $achar($r3, 4, '4025')['proposto'] === null && $achar($r3, 4, '4025')['pre_selecionada'] === false
    && $achar($r3, 4, '4036')['classificacao'] === 'fontes_divergem');
ck('C · JSON do legado só com o CNPJ confirmado (zeros: fantasia vazia na coluna, JSON confirmado → origem legado_json)',
    ($p = $achar($r2, 3, '4025')) !== null && $p['classificacao'] === 'sugestao');

// ── D. Razão = Nome com fonte trazendo razão diferente
$o4 = [$org(5, 'Padaria Sol', '11444777000242', '2026-11-20', ['4025' => $S('Padaria Sol'), '4036' => $S('Padaria Sol')])];
$r4 = PreviaCadastral::montar($o4, ['11444777000242' => [['id' => 8, 'razao' => 'Sol Alimentos Ltda', 'fantasia' => 'Padaria Sol']]], [], ['11444777000242' => ['razao' => 'SOL ALIMENTOS LTDA', 'fantasia' => 'PADARIA SOL', 'json_cnpj' => null, 'json_razao' => null, 'json_fantasia' => null, 'consultado_em' => null]], $OK, ['ganhos'], 'x');
ck('D · Razão = Nome e fonte com razão DIFERENTE → nome_para_razao_revisar, NUNCA pré-selecionada; Fantasia = Nome protegida',
    $achar($r4, 5, '4025')['classificacao'] === 'nome_para_razao_revisar' && $achar($r4, 5, '4025')['pre_selecionada'] === false && $achar($r4, 5, '4036') === null);

// ── E. fontes indisponíveis / legado parcial / retorno vazio válido
$rX = PreviaCadastral::montar($o3, [], [], [], ['pipedrive' => ['estado' => 'ok', 'campo_4038' => true], 'precifica' => ['estado' => 'indisponivel'], 'legado' => ['estado' => 'ok']], ['ganhos'], 'x');
ck('E · Precifica indisponível → lote "completa=false" e linha "fonte_indisponivel" (falha não vira ausência)', $rX['lote']['completa'] === false && $achar($rX, 4, '4025')['classificacao'] === 'fonte_indisponivel');
$rP = PreviaCadastral::montar($o3, [], [], [], ['pipedrive' => ['estado' => 'ok', 'campo_4038' => true], 'precifica' => ['estado' => 'ok'], 'legado' => ['estado' => 'parcial']], ['ganhos'], 'x');
ck('E · legado parcial → também incompleta (estado distinto do "sem valor")', $rP['lote']['completa'] === false && $achar($rP, 4, '4025')['classificacao'] === 'fonte_indisponivel');
$rV = PreviaCadastral::montar($o3, [], [], [], $OK, ['ganhos'], 'x');
ck('E · retorno vazio válido → sem_valor_legado_ausente + custo opcional só informativo (nada disparado)', $achar($rV, 4, '4025')['classificacao'] === 'sem_valor_legado_ausente'
    && $rV['lote']['custo_opcional']['total'] === '0.20' && str_contains($rV['lote']['custo_opcional']['nota'], 'nenhuma compra'));

// ── F. decisões com a mesma evidência saem antes do corte
$ev = $achar($r2, 1, '4025')['evidencia_versao'];
$rD = PreviaCadastral::montar($o2, $p2, [], $l2, $OK, ['ganhos'], 'x', [$ev => true]);
ck('F · caso já decidido com a MESMA evidência sai da fila; evidência nova reabre', $achar($rD, 1, '4025') === null && $achar($rD, 3, '4025') !== null);

// ── G. fila sem_cnpj_id_precifica (4022)
$o5 = [$org(10, 'A', '', '2026-11-20', [], '501'), $org(11, 'B', 'lixo123', '2026-11-20', [], '502'), $org(12, 'C', '', '2026-11-20', [], '503'),
       $org(13, 'D', '45997418000153', '2026-11-01'), $org(14, 'E', '', '2026-11-20', [], '504')];
$o5[0]['campos']['4022'] = $S(null); $o5[2]['campos']['4022'] = $S(''); $o5[4]['campos']['4022'] = ['tipo' => 'sem_chave', 'valor' => null];
$pc = ['501' => '11222333000181', '502' => '11444777000161', '503' => '45997418000153', '504' => '11444777000242'];
$lg = ['11222333000181' => ['razao' => 'A LTDA', 'fantasia' => '', 'json_cnpj' => null, 'json_razao' => null, 'json_fantasia' => null, 'consultado_em' => null]];
$r5 = PreviaCadastral::montar($o5, ['11222333000181' => [['id' => 501, 'razao' => 'A Ltda', 'fantasia' => '']]], $pc, $lg, $OK, ['sem_cnpj_id_precifica'], 'x');
$c5 = $r5['lote']['filas']['sem_cnpj_id_precifica'];
ck('G · 4022 vazio + Precifica válido + legado = sugestão; lixo no 4022 nunca sobrescrito; conflito com outra ficha = identidade_duvidosa; ausente do legado = sem valor',
    $achar($r5, 10, '4022')['classificacao'] === 'sugestao' && $c5['valor_atual_inesperado'] === 1 && $achar($r5, 11, '4022') === null
    && $achar($r5, 12, '4022')['classificacao'] === 'identidade_duvidosa' && $achar($r5, 14, '4022')['classificacao'] === 'sem_valor_legado_ausente', json_encode($c5));

// ── H. RC-008 (revisão independente): F13, F16, F18, F22, F11/F12
$o6 = [$org(20, 'X', '', '2026-11-20', [], '601'), $org(21, 'Y', '', '2026-11-19', [], '602')];
$o6[0]['campos']['4022'] = $S(null); $o6[1]['campos']['4022'] = $S(null);
$r6 = PreviaCadastral::montar($o6, [], ['601' => '11222333000181', '602' => '11222333000181'], ['11222333000181' => ['razao' => 'A', 'fantasia' => '', 'json_cnpj' => null, 'json_razao' => null, 'json_fantasia' => null, 'consultado_em' => null]], $OK, ['sem_cnpj_id_precifica'], 'x');
ck('F13 · o MESMO CNPJ proposto para 2 fichas → identidade_duvidosa nas duas (antes do corte)', array_column($r6['linhas'], 'classificacao') === ['identidade_duvidosa', 'identidade_duvidosa']);
$sem4038 = $OK; $sem4038['pipedrive']['campo_4038'] = false;
$r7 = PreviaCadastral::montar($o6, [], ['601' => '11222333000181'], [], $sem4038, ['sem_cnpj_id_precifica'], 'x');
ck('F18 · sem o campo 4038 a fila sem_cnpj fica BLOQUEADA (sem falso zero)', $r7['linhas'] === [] && $r7['lote']['filas']['sem_cnpj_id_precifica'] === ['bloqueada' => 'campo_4038_ausente', 'fichas' => null]);
$ra = PreviaCadastral::montar($o3, [], [], [], $OK, ['ganhos'], '2026-11-26T17:00:00-03:00'); $rb = PreviaCadastral::montar($o3, [], [], [], $OK, ['ganhos'], '2026-11-26T17:00:00-03:00');
ck('F16 · dois lotes no mesmo segundo têm ids distintos (L-14 dígitos-12 hex)', $ra['lote']['id'] !== $rb['lote']['id'] && preg_match('/^L-\d{14}-[0-9a-f]{12}$/', $ra['lote']['id']) === 1);
ck('F22 · fonte indisponível conta como fonte_indisponivel, NÃO como identidade_duvidosa', $rX['lote']['filas']['ganhos']['por_desfecho']['4025']['fonte_indisponivel'] === 1
    && $rX['lote']['filas']['ganhos']['por_desfecho']['4025']['identidade_duvidosa'] === 0);
ck('F20 · objeto sem value (OBJECT_UNEXPECTED) é protegido; objeto com value nulo é lacuna', PreviaCadastral::estadoCampo('OBJECT_UNEXPECTED', null, null) === 'inesperado' && PreviaCadastral::estadoCampo('OBJECT', null, null) === 'vazio');
ck('F11/F12 · aprovável: sugestão/divergem/nome→razão; bloqueado: identidade, sem_valor, fonte_indisponivel; no 4022 só sugestão',
    PreviaCadastral::aprovavel(['campo' => '4025', 'classificacao' => 'sugestao']) && PreviaCadastral::aprovavel(['campo' => '4025', 'classificacao' => 'nome_para_razao_revisar'])
    && !PreviaCadastral::aprovavel(['campo' => '4025', 'classificacao' => 'identidade_duvidosa']) && !PreviaCadastral::aprovavel(['campo' => '4036', 'classificacao' => 'sem_valor_legado_presente'])
    && !PreviaCadastral::aprovavel(['campo' => '4025', 'classificacao' => 'fonte_indisponivel']) && !PreviaCadastral::aprovavel(['campo' => '4022', 'classificacao' => 'fontes_divergem']));
// ── I. Degrau 2 da RC-008: F15/F19, F17/F21 (permutação)
$g1 = $r1['lote']['filas']['ganhos'];
ck('F19 · universo × lote separados, CNPJs e fichas distintos (101/102 no universo; 100 CNPJs no lote)', $g1['universo']['cnpjs'] === 101 && $g1['universo']['fichas'] === 102
    && $g1['lote']['cnpjs'] === 100 && $g1['lote']['fichas'] === count(array_unique(array_column($r1['linhas'], 'org_id'))) && $g1['lote']['campos'] === count($r1['linhas']));
$dec = array_fill_keys(array_column(array_slice($r2['linhas'], 0, 1), 'evidencia_versao'), true);
$r2d = PreviaCadastral::montar($o2, $p2, [], $l2, $OK, ['ganhos'], 'x', $dec); $g2 = $r2d['lote']['filas']['ganhos'];
$soma = 0; foreach ($g2['por_desfecho'] as $cc) $soma += array_sum($cc);
ck('F15 · desfechos e campos vazios contam as MESMAS linhas devolvidas (com caso decidido fora)', $soma === count($r2d['linhas']) && $g2['campos_vazios'] === count(array_filter($r2d['linhas'], fn($l) => $l['classificacao'] !== 'nome_para_razao_revisar'))
    && count($r2d['linhas']) === count($r2['linhas']) - 1);
$p7 = [$m => [['id' => '502', 'razao' => 'MATRIZ LTDA', 'fantasia' => 'M'], ['id' => '501', 'razao' => 'Matriz Ltda', 'fantasia' => 'M']]];
$o7 = [$org(1, 'Loja Um', $m, '2026-11-20', ['4025' => $S(null), '4036' => $S('M')]), $org(9, 'Loja Um B', $m, '2026-11-10', ['4025' => $S(null), '4036' => $S('M')])];
$r7a = PreviaCadastral::montar($o7, $p7, [], $l2, $OK, ['ganhos'], 'x'); $la = $achar($r7a, 1, '4025');
ck('F17 · grafias equivalentes do Precifica PRESERVADAS com as 2 doadoras (+ legado); alternativas na mesma prioridade → precisa_escolha', count(array_filter($la['grafias'], fn($g) => $g['origem'] === 'precifica')) === 2
    && $la['precisa_escolha'] === true && $la['pre_selecionada'] === false);
$assin = fn(array $r) => json_encode(array_map(fn($l) => [$l['id'], $l['evidencia_versao'], $l['grafias'], $l['cnpj_compartilhado_com'], $l['classificacao']], $r['linhas']));
$ref = $assin($r7a); $refA = $assin($r1); $iguais = true; mt_srand(26112026);
for ($t = 0; $t < 20; $t++) {
    $oo = $o7; shuffle($oo); $pp = $p7; shuffle($pp[$m]);
    $iguais = $iguais && $assin(PreviaCadastral::montar($oo, $pp, [], $l2, $OK, ['ganhos'], 'x')) === $ref;
    $ob = $orgs; shuffle($ob); $iguais = $iguais && $assin(PreviaCadastral::montar($ob, $prec, [], [], $OK, ['ganhos'], 'x')) === $refA;
}
ck('F21 · permutação (20 embaralhamentos das fichas e das doadoras) = mesmas linhas, ids, evidências e grafias', $iguais);
echo "teste-previa-cadastral: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
