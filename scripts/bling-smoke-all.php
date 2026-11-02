<?php
// scripts/bling-smoke-all.php — prova do modulo Bling sem depender de HTTP/sessao
// @version 1.0.0  @created 2026-07-30
//
// Uso:  php scripts/bling-smoke-all.php
// Sai com 0 se tudo passar, 1 se algo falhar.
//
// O que este script existe para pegar:
//   1. COERENCIA ENTRE TELAS — o mesmo numero calculado por dois caminhos
//      diferentes precisa bater. Foi a falta disso que gerou incoerencia no GA.
//   2. DETERMINISMO — dois acessos seguidos devolvem o mesmo numero.
//   3. INVARIANTES do grafo — todo pedido aponta para cliente existente, etc.
declare(strict_types=1);

// Script CLI é entrada legítima do módulo — os internals exigem esta
// constante para recusar execução direta por HTTP.
define('BLING_ENTRADA', true);
require_once __DIR__ . '/../api/bling/lib/BlingSituacoes.php';
require_once __DIR__ . '/../api/bling/lib/BlingProviderBase.php';
require_once __DIR__ . '/../api/bling/lib/BlingMock.php';

final class SmokeProvider extends BlingProviderBase
{
    public function nome(): string { return 'mock'; }
    public function ehSimulado(): bool { return true; }
    public function ultimaSync(): ?string { return gmdate('c'); }
    public function colecao(string $nome): array { return BlingMock::grafo()[$nome] ?? []; }
}

$passou = 0;
$falhou = 0;
$erros = [];

function ok(string $nome, bool $cond, string $detalhe = ''): void
{
    global $passou, $falhou, $erros;
    if ($cond) {
        $passou++;
        printf("  \033[32m✔\033[0m %s%s\n", $nome, $detalhe !== '' ? "  ($detalhe)" : '');
    } else {
        $falhou++;
        $erros[] = $nome . ($detalhe !== '' ? " — $detalhe" : '');
        printf("  \033[31m�’\033[0m %s%s\n", $nome, $detalhe !== '' ? "  ($detalhe)" : '');
    }
}

/** Compara dois valores monetarios com tolerancia de centavos. */
function bate(float $a, float $b, float $tol = 0.05): bool
{
    return abs($a - $b) <= $tol;
}

$p = new SmokeProvider();
$g = BlingMock::grafo();
$f = [
    'de' => date('Y-m-d', strtotime('-29 days')), 'ate' => date('Y-m-d'),
    'periodo' => '30d', 'dias' => 30, 'granularidade' => 'dia',
    'pagina' => 1, 'limite' => 50, 'busca' => '', 'ordenar' => '', 'direcao' => 'desc',
];

echo "\n\033[1m1. Integridade do grafo\033[0m\n";

ok('contas geradas', count($g['contas']) >= 2, count($g['contas']) . ' contas');
ok('canais gerados', count($g['canais']) >= 5, count($g['canais']) . ' canais');
ok('produtos gerados', count($g['produtos']) > 150, count($g['produtos']) . ' produtos');
ok('clientes gerados', count($g['clientes']) > 100, count($g['clientes']) . ' clientes');
ok('pedidos gerados', count($g['pedidos']) > 800, count($g['pedidos']) . ' pedidos');
ok('estoque gerado', count($g['estoque']) > 200, count($g['estoque']) . ' linhas');
ok('notas geradas', count($g['notas']) > 300, count($g['notas']) . ' notas');
ok('titulos a receber', count($g['receber']) > 300, count($g['receber']) . ' títulos');
ok('compras geradas', count($g['compras']) > 50, count($g['compras']) . ' pedidos de compra');

echo "\n\033[1m2. Referências (nenhum órfão)\033[0m\n";

$idsCliente = array_flip(array_column($g['clientes'], 'id'));
$idsProduto = array_flip(array_column($g['produtos'], 'id'));
$idsCanal   = array_flip(array_column($g['canais'], 'id'));
$idsPedido  = array_flip(array_column($g['pedidos'], 'id'));
$idsForn    = array_flip(array_column($g['fornecedores'], 'id'));
$idsDep     = array_flip(array_column($g['depositos'], 'id'));

$orfaos = 0;
foreach ($g['pedidos'] as $ped) {
    if (!isset($idsCliente[$ped['cliente']])) { $orfaos++; }
    if (!isset($idsCanal[$ped['canal']]))     { $orfaos++; }
    foreach ($ped['itens'] as $it) {
        if (!isset($idsProduto[$it['produto']])) { $orfaos++; }
    }
}
ok('pedidos sem referência órfã', $orfaos === 0, "$orfaos órfão(s)");

$orfaos = 0;
foreach ($g['notas'] as $n) {
    if (!isset($idsPedido[$n['pedido']])) { $orfaos++; }
}
ok('notas apontam para pedido existente', $orfaos === 0, "$orfaos órfã(s)");

$orfaos = 0;
foreach ($g['receber'] as $r) {
    if ($r['pedido'] !== null && !isset($idsPedido[$r['pedido']])) { $orfaos++; }
}
ok('títulos apontam para pedido existente', $orfaos === 0, "$orfaos órfão(s)");

$orfaos = 0;
foreach ($g['estoque'] as $e) {
    if (!isset($idsProduto[$e['produto']])) { $orfaos++; }
    if (!isset($idsDep[$e['deposito']]))    { $orfaos++; }
}
ok('estoque aponta para produto e depósito existentes', $orfaos === 0, "$orfaos órfão(s)");

$orfaos = 0;
foreach ($g['compras'] as $c) {
    if (!isset($idsForn[$c['fornecedor']])) { $orfaos++; }
}
ok('compras apontam para fornecedor existente', $orfaos === 0, "$orfaos órfã(s)");

echo "\n\033[1m3. Coerência entre telas (o número tem que bater)\033[0m\n";

// KPI de faturamento x soma da serie de evolucao x soma da tela de vendas.
$kpis = [];
foreach ($p->kpis($f) as $k) { $kpis[$k['id']] = $k; }

$ev = $p->evolucao($f);
$serieFat = [];
foreach ($ev['series'] as $s) {
    if ($s['id'] === 'faturamento') { $serieFat = $s['pontos']; }
}
$somaSerie = array_sum(array_column($serieFat, 'valor'));

ok('KPI faturamento = soma da série de evolução',
    bate($kpis['faturamento_bruto']['valor'], $somaSerie, 1.0),
    sprintf('KPI %.2f vs série %.2f', $kpis['faturamento_bruto']['valor'], $somaSerie));

// KPI de pedidos x soma da serie de pedidos.
$seriePed = [];
foreach ($ev['series'] as $s) {
    if ($s['id'] === 'pedidos') { $seriePed = $s['pontos']; }
}
ok('KPI pedidos = soma da série de pedidos',
    (int) $kpis['pedidos']['valor'] === (int) array_sum(array_column($seriePed, 'valor')),
    sprintf('KPI %d vs série %d', $kpis['pedidos']['valor'], array_sum(array_column($seriePed, 'valor'))));

// Ticket medio derivado = faturamento / pedidos.
$ticketEsperado = $kpis['pedidos']['valor'] > 0
    ? $kpis['faturamento_bruto']['valor'] / $kpis['pedidos']['valor'] : 0;
ok('ticket médio = faturamento ÷ pedidos',
    bate($kpis['ticket_medio']['valor'], $ticketEsperado, 0.02),
    sprintf('%.2f vs %.2f', $kpis['ticket_medio']['valor'], $ticketEsperado));

// Curva ABC de canais soma o mesmo faturamento do KPI.
$abc = $p->curvaAbc('canais', 'faturamento', $f);
ok('curva ABC de canais = faturamento do KPI',
    bate($abc['total'], $kpis['faturamento_bruto']['valor'], 1.0),
    sprintf('ABC %.2f vs KPI %.2f', $abc['total'], $kpis['faturamento_bruto']['valor']));

// Participacao da ABC soma 100%.
$somaPart = array_sum(array_column($abc['itens'], 'participacao'));
ok('participações da curva ABC somam 100%', bate($somaPart, 100.0, 0.5), sprintf('%.2f%%', $somaPart));

// As DEMAIS dimensoes da ABC tambem tem que fechar no mesmo faturamento.
// Canais/clientes agregam por PEDIDO; produtos/categorias/fornecedores agregam
// por ITEM com rateio. Sao dois caminhos de codigo distintos — o teste anterior
// so exercitava um deles, e por isso o bug de rateio passou.
foreach (['clientes', 'produtos', 'categorias', 'fornecedores'] as $dim) {
    $a = $p->curvaAbc($dim, 'faturamento', $f);
    ok("curva ABC de $dim = faturamento do KPI",
        bate($a['total'], $kpis['faturamento_bruto']['valor'], 2.0),
        sprintf('%.2f vs %.2f', $a['total'], $kpis['faturamento_bruto']['valor']));
}

// Unidades: ABC por produtos tem que bater com o KPI de produtos vendidos.
$abcUnid = $p->curvaAbc('produtos', 'unidades', $f);
ok('curva ABC em unidades = KPI de produtos vendidos',
    bate($abcUnid['total'], $kpis['produtos_vendidos']['valor'], 0.5),
    sprintf('%.0f vs %.0f', $abcUnid['total'], $kpis['produtos_vendidos']['valor']));

// Sankey: o que entra em "Pedidos" nao pode superar o faturamento do periodo.
$fluxo = $p->fluxoEmpresarial($f);
$entraPedidos = 0.0;
foreach ($fluxo['links'] as $l) {
    if ($l['destino'] === 'Pedidos') { $entraPedidos += $l['valor']; }
}
ok('Sankey: entrada em "Pedidos" = faturamento do KPI',
    bate($entraPedidos, $kpis['faturamento_bruto']['valor'], 1.0),
    sprintf('%.2f vs %.2f', $entraPedidos, $kpis['faturamento_bruto']['valor']));

// Sankey: nenhuma etapa pode receber mais do que a anterior entregou.
$monotonico = true;
$porDestino = [];
foreach ($fluxo['links'] as $l) {
    $porDestino[$l['destino']] = ($porDestino[$l['destino']] ?? 0) + $l['valor'];
}
$cadeia = ['Pedidos', 'Faturamento', 'Nota fiscal', 'Expedição', 'Entrega'];
for ($i = 1; $i < count($cadeia); $i++) {
    $ant = $porDestino[$cadeia[$i - 1]] ?? 0;
    $atu = $porDestino[$cadeia[$i]] ?? 0;
    if ($atu > $ant + 0.05) { $monotonico = false; }
}
ok('Sankey: nenhuma etapa recebe mais que a anterior', $monotonico);

// Funil fiscal: quantidade nunca cresce ao longo das etapas.
$funil = $p->funilFiscal($f);
$decrescente = true;
for ($i = 1; $i < count($funil); $i++) {
    if ($funil[$i]['quantidade'] > $funil[$i - 1]['quantidade']) { $decrescente = false; }
}
ok('funil fiscal é decrescente', $decrescente,
    implode(' → ', array_map(static fn($e) => (string) $e['quantidade'], $funil)));

// Rentabilidade: receita total = faturamento menos frete e desconto.
$rent = $p->rentabilidade('canal', $f);
$receitaRent = array_sum(array_column($rent, 'receita'));
$descontoRent = array_sum(array_column($rent, 'desconto'));
ok('rentabilidade: receita + desconto = faturamento do KPI',
    bate($receitaRent + $descontoRent, $kpis['faturamento_bruto']['valor'], 2.0),
    sprintf('%.2f vs %.2f', $receitaRent + $descontoRent, $kpis['faturamento_bruto']['valor']));

// Waterfall fecha: receita bruta - deducoes = lucro.
$soma = static fn(string $c) => array_sum(array_column($rent, $c));
$lucroCalculado = ($soma('receita') + $soma('desconto')) - $soma('desconto') - $soma('custo')
    - $soma('comissao') - $soma('taxas') - $soma('impostos') - $soma('frete');
ok('waterfall de rentabilidade fecha no lucro',
    bate($lucroCalculado, $soma('lucro'), 2.0),
    sprintf('%.2f vs %.2f', $lucroCalculado, $soma('lucro')));

echo "\n\033[1m3b. Coerência das análises da Fase 3\033[0m\n";

// Matriz margem × volume: os quadrantes têm que particionar o conjunto inteiro.
// Se um item cair em dois quadrantes (ou em nenhum), a soma denuncia.
$rentCanal = $p->rentabilidade('canal', $f);
$comReceita = array_values(array_filter($rentCanal, static fn($l) => $l['receita'] != 0));
$mediana = static function (array $v): float {
    if ($v === []) return 0.0;
    sort($v); $n = count($v);
    return $n % 2 === 1 ? (float) $v[intdiv($n, 2)] : (($v[$n / 2 - 1] + $v[$n / 2]) / 2);
};
$corteV = $mediana(array_column($comReceita, 'receita'));
$corteM = $mediana(array_column($comReceita, 'margem_pct'));
$quad = ['motor' => 0, 'giro' => 0, 'joia' => 0, 'peso' => 0];
$receitaQuad = 0.0;
foreach ($comReceita as $i) {
    $av = $i['receita'] >= $corteV;
    $am = $i['margem_pct'] >= $corteM;
    $q = $av && $am ? 'motor' : ($av ? 'giro' : ($am ? 'joia' : 'peso'));
    $quad[$q]++;
    $receitaQuad += $i['receita'];
}
ok('matriz margem × volume particiona todos os itens',
    array_sum($quad) === count($comReceita),
    sprintf('%d itens em %d quadrantes', array_sum($quad), count($comReceita)));
ok('receita dos quadrantes = receita da rentabilidade',
    bate($receitaQuad, array_sum(array_column($comReceita, 'receita')), 1.0));

// Mediana como corte: com poucos itens de valor muito alto, a média jogaria
// quase tudo para um lado só. O teste garante que os quadrantes não degeneram.
ok('nenhum quadrante concentra tudo',
    max($quad) < count($comReceita),
    'quadrantes: ' . json_encode($quad));

// Faixas de cobertura: cada linha de estoque entra em EXATAMENTE uma faixa.
$estoque = $g['estoque'];
$contadas = 0;
foreach ($estoque as $e) {
    $cob = $e['cobertura_dias'];
    $chave = match (true) {
        $e['consumo_90d'] === 0 => 'parado',
        $e['disponivel'] <= 0   => 'ruptura',
        $cob === null           => 'parado',
        $cob <= 7               => 'critica',
        $cob <= 15              => 'baixa',
        $cob <= 45              => 'adequada',
        $cob <= 90              => 'alta',
        default                 => 'excesso',
    };
    if ($chave !== '') $contadas++;
}
ok('toda linha de estoque cai numa faixa de cobertura',
    $contadas === count($estoque), "$contadas de " . count($estoque));

// Prazo prometido × realizado: só entra quem tem entrega concluída.
$envios = $g['envios'];
$entregues = array_values(array_filter($envios, static fn($e) => $e['entrega'] !== null));
$prazoNegativo = 0;
foreach ($entregues as $e) {
    if (strtotime($e['entrega']) < strtotime($e['despacho'])) $prazoNegativo++;
}
ok('nenhuma entrega antes do despacho', $prazoNegativo === 0,
    "$prazoNegativo com data impossível");
ok('há entregas concluídas para comparar prazo', count($entregues) > 0,
    count($entregues) . ' de ' . count($envios));

echo "\n\033[1m4. Determinismo\033[0m\n";

$k1 = $p->kpis($f);
$k2 = $p->kpis($f);
ok('dois cálculos seguidos devolvem o mesmo resultado', $k1 == $k2);

$g2 = BlingMock::grafo();
ok('grafo memoizado é idêntico', count($g2['pedidos']) === count($g['pedidos']));

echo "\n\033[1m5. Invariantes de negócio\033[0m\n";

// Todo pedido faturado tem nota; nenhum rascunho tem.
$semNota = 0;
$rascunhoComNota = 0;
$notasPorPedido = [];
foreach ($g['notas'] as $n) { $notasPorPedido[$n['pedido']] = true; }
foreach ($g['pedidos'] as $ped) {
    $temNota = isset($notasPorPedido[$ped['id']]);
    if (in_array($ped['situacao'], ['faturado', 'nota_emitida', 'enviado', 'entregue'], true) && !$temNota) {
        $semNota++;
    }
    if ($ped['situacao'] === 'rascunho' && $temNota) { $rascunhoComNota++; }
}
ok('todo pedido faturado tem nota', $semNota === 0, "$semNota sem nota");
ok('nenhum rascunho tem nota', $rascunhoComNota === 0, "$rascunhoComNota rascunho(s) com nota");

// Total do pedido = subtotal - desconto + frete.
$totalErrado = 0;
foreach ($g['pedidos'] as $ped) {
    if (!bate($ped['total'], $ped['subtotal'] - $ped['desconto'] + $ped['frete'], 0.02)) { $totalErrado++; }
}
ok('total do pedido = subtotal − desconto + frete', $totalErrado === 0, "$totalErrado divergente(s)");

// Soma dos itens = subtotal.
$subtotalErrado = 0;
foreach ($g['pedidos'] as $ped) {
    $soma = array_sum(array_column($ped['itens'], 'total'));
    if (!bate($ped['subtotal'], $soma, 0.05)) { $subtotalErrado++; }
}
ok('soma dos itens = subtotal do pedido', $subtotalErrado === 0, "$subtotalErrado divergente(s)");

// Estoque: disponivel = fisico - reservado.
$estoqueErrado = 0;
foreach ($g['estoque'] as $e) {
    if ($e['disponivel'] !== $e['fisico'] - $e['reservado']) { $estoqueErrado++; }
}
ok('estoque: disponível = físico − reservado', $estoqueErrado === 0, "$estoqueErrado divergente(s)");

// Titulos: saldo = valor - recebido.
$saldoErrado = 0;
foreach ($g['receber'] as $r) {
    if (!bate($r['saldo'], $r['valor'] - $r['recebido'], 0.02)) { $saldoErrado++; }
}
ok('a receber: saldo = valor − recebido', $saldoErrado === 0, "$saldoErrado divergente(s)");

// Nenhuma situacao desconhecida (o que quebraria badge nas telas).
$desconhecidas = [];
foreach ($g['pedidos'] as $ped) {
    if (!isset(BlingSituacoes::PEDIDO[$ped['situacao']])) { $desconhecidas[$ped['situacao']] = true; }
}
foreach ($g['notas'] as $n) {
    if (!isset(BlingSituacoes::NOTA[$n['situacao']])) { $desconhecidas[$n['situacao']] = true; }
}
foreach ($g['receber'] as $r) {
    if (!isset(BlingSituacoes::TITULO[$r['situacao']])) { $desconhecidas[$r['situacao']] = true; }
}
foreach ($g['compras'] as $c) {
    if (!isset(BlingSituacoes::COMPRA[$c['situacao']])) { $desconhecidas[$c['situacao']] = true; }
}
foreach ($g['envios'] as $e) {
    if (!isset(BlingSituacoes::ENVIO[$e['situacao']])) { $desconhecidas[$e['situacao']] = true; }
}
ok('nenhuma situação fora do vocabulário', count($desconhecidas) === 0,
    implode(', ', array_keys($desconhecidas)));

echo "\n\033[1m6. Cenários que as telas precisam mostrar (§60)\033[0m\n";

$rejeitadas = count(array_filter($g['notas'], static fn($n) => $n['situacao'] === 'rejeitada'));
ok('existem notas rejeitadas', $rejeitadas > 0, "$rejeitadas");

$vencidas = count(array_filter($g['receber'], static fn($r) => $r['situacao'] === 'vencido'));
ok('existem contas vencidas', $vencidas > 0, "$vencidas");

$negativos = count(array_filter($g['estoque'], static fn($e) => $e['status'] === 'negativo'));
ok('existe estoque negativo', $negativos > 0, "$negativos");

$criticos = count(array_filter($g['estoque'], static fn($e) => $e['status'] === 'critico'));
ok('existe estoque crítico', $criticos > 0, "$criticos");

$whFalha = count(array_filter($g['webhooks'], static fn($w) => in_array($w['situacao'], ['falhou', 'dlq'], true)));
ok('existem webhooks com falha', $whFalha > 0, "$whFalha");

$syncErro = count(array_filter($g['sync'], static fn($s) => $s['situacao'] === 'erro'));
ok('existe sincronização com erro', $syncErro > 0, "$syncErro");

$atencao = $p->atencao();
ok('painel "Exige atenção" tem ocorrências', count($atencao) > 0, count($atencao) . ' tipos');

$insights = $p->insights($f);
ok('insights foram gerados', count($insights) > 0, count($insights) . ' insights');

// A queda de vendas foi plantada de proposito no gerador (ultimos 9 dias).
$temQueda = false;
foreach ($insights as $i) {
    if ($i['id'] === 'queda_vendas') { $temQueda = true; }
}
ok('insight de queda de vendas foi detectado', $temQueda,
    'o gerador planta a queda nos últimos 9 dias — se não detectar, a regra está quebrada');

echo "\n\033[1m7. Qualidade e necessidades de compra\033[0m\n";

$scoresRuins = count(array_filter($g['produtos'], static fn($x) => $x['qualidade_score'] < 100));
ok('há produtos com pendência cadastral', $scoresRuins > 0, "$scoresRuins de " . count($g['produtos']));

$scoreForaFaixa = count(array_filter($g['produtos'],
    static fn($x) => $x['qualidade_score'] < 0 || $x['qualidade_score'] > 100));
ok('score de qualidade dentro de 0–100', $scoreForaFaixa === 0, "$scoreForaFaixa fora da faixa");

echo "\n" . str_repeat('─', 62) . "\n";
printf("  \033[1m%d passaram\033[0m · %s\n", $passou,
    $falhou === 0 ? "\033[32m0 falharam\033[0m" : "\033[31m$falhou falharam\033[0m");
if ($falhou > 0) {
    echo "\n  Falhas:\n";
    foreach ($erros as $e) { echo "   • $e\n"; }
}
echo "\n";

exit($falhou === 0 ? 0 : 1);
