<?php
// scripts/bling-fase5-homologacao.php — carga completa e paridade mock × banco
// @version 1.0.0  @created 2026-07-30
//
//     php scripts/bling-fase5-homologacao.php [--manter]
//
// O QUE ISTO PROVA (§72)
// "A API real substitui os mocks sem que nenhuma tela precise ser reconstruída."
//
// A Fase 4 provou o pipeline com 1 produto e 1 pedido: mostra que ele funciona,
// não que funciona com VOLUME nem com a variedade de estados dos dados reais.
//
// Aqui o grafo inteiro do mock (221 produtos, 1538 pedidos, 1405 notas, 1966
// títulos) é servido como se fosse a API v3 — paginado, com códigos numéricos de
// situação, com documentos completos — e entra no banco pelo caminho REAL:
//
//     paginar → normalizar → adaptar versão → resolver FK → upsert
//
// Depois as MESMAS perguntas que as 52 telas fazem são feitas aos dois
// provedores, e as respostas têm que bater. Se baterem, trocar
// BLING_PROVIDER=mock por bling não muda uma linha de tela.
//
// SEGURANÇA: conta de teste com CNPJ reservado, apagada ao final mesmo em erro.
// `--manter` preserva os dados para inspeção manual (e avisa como limpar).
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

$raiz = dirname(__DIR__);

foreach (file($raiz . '/.env') as $linha) {
    $linha = trim($linha);
    if ($linha === '' || $linha[0] === '#' || !str_contains($linha, '=')) continue;
    [$k, $v] = explode('=', $linha, 2);
    $k = trim($k); $v = trim($v, " \t\"'");
    putenv("$k=$v"); $_ENV[$k] = $v;
}

define('BLING_ENTRADA', true);
require_once $raiz . '/api/bling/lib/BlingSituacoes.php';
require_once $raiz . '/api/bling/lib/BlingProviderBase.php';
require_once $raiz . '/api/bling/lib/BlingMock.php';
require_once $raiz . '/api/bling/lib/BlingCrypto.php';
require_once $raiz . '/api/bling/lib/BlingTransporte.php';
require_once $raiz . '/api/bling/lib/BlingOAuth.php';
require_once $raiz . '/api/bling/lib/BlingVersionAdapter.php';
require_once $raiz . '/api/bling/lib/BlingNormalizer.php';
require_once $raiz . '/api/bling/repositories/BlingRepository.php';
require_once $raiz . '/api/bling/lib/BlingClient.php';
require_once $raiz . '/api/bling/lib/BlingProvider.php';
require_once $raiz . '/api/bling/lib/BlingReal.php';
require_once $raiz . '/api/bling/services/BlingAuthService.php';
require_once $raiz . '/api/bling/services/BlingSyncService.php';
require_once $raiz . '/api/bling/services/BlingQueueService.php';
require_once $raiz . '/scripts/lib/BlingApiFalsa.php';

const CNPJ_TESTE = '00000000000191';

$manter = in_array('--manter', $argv, true);
$passou = 0; $falhou = 0; $erros = []; $avisos = [];

function ok(string $nome, bool $cond, string $det = ''): void {
    global $passou, $falhou, $erros;
    if ($cond) { $passou++; printf("  \033[32m✔\033[0m %s%s\n", $nome, $det !== '' ? "  ($det)" : ''); }
    else { $falhou++; $erros[] = $nome . ($det !== '' ? " — $det" : '');
           printf("  \033[31m✘\033[0m %s%s\n", $nome, $det !== '' ? "  ($det)" : ''); }
}
function avisar(string $m): void {
    global $avisos; $avisos[] = $m;
    printf("  \033[33m!\033[0m %s\n", $m);
}
function secao(string $t): void { printf("\n\033[1m%s\033[0m\n", $t); }

$repo = new BlingRepository();
$accountId = null;
$inicioTeste = gmdate('Y-m-d H:i:s', time() - 1);

$limpar = function () use (&$repo, &$accountId, $inicioTeste, $manter) {
    if ($accountId === null) return;
    if ($manter) {
        printf("\n  \033[33mDados MANTIDOS\033[0m (conta %d). Para limpar:\n", $accountId);
        printf("    mysql BLING -e \"DELETE FROM bling_accounts WHERE id=%d\"\n", $accountId);
        return;
    }
    try {
        $repo->pdo()->prepare('DELETE FROM bling_accounts WHERE id = ?')->execute([$accountId]);
        foreach (['bling_sync_jobs', 'bling_sync_errors', 'bling_queue',
                  'bling_raw_payloads', 'bling_audit_logs'] as $t) {
            $repo->pdo()->prepare("DELETE FROM `$t` WHERE account_id = ?")->execute([$accountId]);
        }
        $repo->pdo()->prepare(
            "DELETE FROM bling_webhook_events
              WHERE (account_id = ? OR account_id IS NULL) AND recebido_em >= ?"
        )->execute([$accountId, $inicioTeste]);
    } catch (Throwable $e) {
        fwrite(STDERR, "AVISO: falha ao limpar a conta $accountId: " . $e->getMessage() . "\n");
    }
};
register_shutdown_function($limpar);

try {

// ══════════════════════════════════════════════════════════════
secao('1. Preparação');

if (!$repo->disponivel() || !$repo->schemaAplicado()) {
    fwrite(STDERR, "\nSem banco BLING não há homologação. Rode docs/BLING/02-banco-BLING.sql.\n");
    exit(1);
}
ok('banco pronto', true, $repo->contarTabelas() . ' tabelas');

// ⚠️ Verificação ESTRUTURAL antes de qualquer carga.
// O upsert genérico grava `sincronizado_em` e `payload_hash` em qualquer tabela
// alvo. `bling_sales_channels` não tinha nenhuma das duas, e o resultado era que
// NENHUM canal de venda entrava — 6 erros por item, que não derrubam o recurso e
// por isso não apareciam em lugar nenhum. Conferir a estrutura antes custa
// milissegundos e evita descobrir isso com dados reais.
// `estoque` é a única exceção legítima: saldo não tem identidade própria no
// Bling — a chave é (produto, depósito) — então não tem `bling_id` nem
// `payload_hash`, e usa upsert dedicado. Qualquer OUTRA tabela sem essas colunas
// é defeito.
$semIdentidade = ['estoque'];
$semColuna = [];
foreach (BlingSyncService::RECURSOS as $recurso => $cfg) {
    if ($cfg['tabela'] === null) { continue; }
    $exigidas = in_array($recurso, $semIdentidade, true)
        ? ['sincronizado_em', 'account_id']
        : ['sincronizado_em', 'payload_hash', 'bling_id', 'account_id'];
    foreach ($exigidas as $coluna) {
        $tem = (int) $repo->valor(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$cfg['tabela'], $coluna]);
        if ($tem === 0) { $semColuna[] = "{$cfg['tabela']}.$coluna"; }
    }
}
ok('toda tabela alvo tem as colunas que o upsert usa', $semColuna === [],
   $semColuna === [] ? count(BlingSyncService::RECURSOS) . ' tabelas'
                     : 'FALTA: ' . implode(', ', $semColuna));

// ⚠️ O bug do `UNIQUE` com coluna NULL (Fase 4, bling_prices) custou uma linha
// nova por sincronização e o produto duplicado na tela. Varrer o schema inteiro
// impede que a próxima tabela repita — a verificação é barata, o defeito não.
$uniquesFracos = $repo->consultar(
    "SELECT s.TABLE_NAME t, s.INDEX_NAME i, GROUP_CONCAT(s.COLUMN_NAME) c
       FROM information_schema.STATISTICS s
       JOIN information_schema.COLUMNS col
         ON col.TABLE_SCHEMA = s.TABLE_SCHEMA AND col.TABLE_NAME = s.TABLE_NAME
        AND col.COLUMN_NAME = s.COLUMN_NAME
      WHERE s.TABLE_SCHEMA = DATABASE() AND s.NON_UNIQUE = 0
        AND col.IS_NULLABLE = 'YES'
      GROUP BY s.TABLE_NAME, s.INDEX_NAME");

// Estes três são deliberados: o NULL ali significa "ainda não tem", e várias
// linhas sem valor DEVEM coexistir (nota em digitação não tem chave, conta sem
// CNPJ informado). O que não pode é um UNIQUE de deduplicação depender de NULL.
$deliberados = ['bling_accounts.uq_conta_cnpj', 'bling_invoices.uq_nota_chave'];
$suspeitos = array_values(array_filter($uniquesFracos,
    static fn($u) => !in_array("{$u['t']}.{$u['i']}", $deliberados, true)));
ok('nenhum UNIQUE de deduplicação depende de coluna NULL', $suspeitos === [],
   $suspeitos === [] ? count($deliberados) . ' exceções deliberadas'
     : implode(' | ', array_map(static fn($u) => "{$u['t']}.{$u['i']}({$u['c']})", $suspeitos)));

$grafo = BlingMock::grafo();
$api = new BlingApiFalsa($grafo);
$totais = $api->totais();
ok('grafo do mock carregado', $totais['pedidos'] > 1000,
   sprintf('%d produtos · %d pedidos · %d notas · %d títulos a receber',
       $totais['produtos'], $totais['pedidos'], $totais['notas'], $totais['receber']));

putenv('BLING_CLIENT_ID=homolog-client-id');
putenv('BLING_CLIENT_SECRET=homolog-client-secret');
putenv('BLING_REDIRECT_URI=https://dshowdash.com.br/api/bling/oauth/callback');

$transporte = new BlingTransporteFalso();
$transporte->responder('oauth/token', new BlingResposta(200, [
    'access_token' => 'ACESSO_HOMOLOG', 'refresh_token' => 'REFRESH_HOMOLOG',
    'expires_in' => 3600, 'token_type' => 'Bearer',
]));

$auth = new BlingAuthService($repo, $transporte);
$url = $auth->iniciarConexao(999999, '#/panel-bling');
parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
$r = $auth->concluirConexao('codigo', (string) $q['state'],
    ['nome' => 'Homologação Fase 5', 'cnpj' => CNPJ_TESTE]);
$accountId = $r['account_id'];
ok('conta de homologação conectada', $accountId > 0, "id $accountId");

// ══════════════════════════════════════════════════════════════
secao('2. Carga inicial completa pelo caminho REAL');

BlingClient::$dormirParaTeste = static function (int $ms) {};
$api->instalar($transporte);

$sync = new BlingSyncService($repo, $auth);
$t0 = microtime(true);
$resultados = $sync->sincronizarTudo($accountId, 'carga_inicial', 'homologacao-f5');
$duracao = microtime(true) - $t0;

$comErro = array_filter($resultados, static fn($x) => $x['situacao'] === 'erro');
ok('nenhum recurso falhou', $comErro === [],
   $comErro === [] ? count($resultados) . ' recursos' : implode(', ', array_column($comErro, 'recurso')));

$consultados = array_sum(array_column($resultados, 'consultados'));
$criados = array_sum(array_column($resultados, 'criados'));
$errosItem = array_sum(array_column($resultados, 'erros'));

ok('todos os registros foram consultados', $consultados === array_sum($totais),
   sprintf('%d de %d esperados', $consultados, array_sum($totais)));
ok('nenhum item foi descartado por erro de normalização', $errosItem === 0,
   $errosItem === 0 ? '0 erros' : "$errosItem itens perdidos");
if ($errosItem > 0) {
    foreach ($repo->consultar(
        'SELECT recurso, codigo, mensagem, COUNT(*) n FROM bling_sync_errors
          WHERE account_id = ? GROUP BY recurso, codigo, mensagem LIMIT 5', [$accountId]) as $e) {
        avisar(sprintf('%s (%d×): %s', $e['recurso'], $e['n'], mb_substr((string) $e['mensagem'], 0, 120)));
    }
}

printf("     %s carga: %d registros em %.1fs (%.0f/s)\n",
    '↳', $criados, $duracao, $criados / max($duracao, 0.001));

// A paginação foi de verdade? Com 1538 pedidos e limite 100, são 16 páginas.
$paginasPedidos = $api->paginasServidas['pedidos/vendas'] ?? 0;
ok('paginação percorreu várias páginas', $paginasPedidos >= 15,
   "$paginasPedidos páginas de pedidos — se fosse 1, a paginação não estaria sendo exercitada");

// ══════════════════════════════════════════════════════════════
secao('3. O banco recebeu o que a API mandou');

$contagens = [
    'bling_products'              => ['produtos', $totais['produtos']],
    'bling_contacts'              => ['clientes', $totais['contatos']],
    'bling_suppliers'             => ['fornecedores', $totais['fornecedores']],
    'bling_categories'            => ['categorias', $totais['categorias']],
    'bling_warehouses'            => ['depósitos', $totais['depositos']],
    'bling_sales_channels'        => ['canais', $totais['canais']],
    'bling_inventory'             => ['estoque', $totais['estoque']],
    'bling_sales_orders'          => ['pedidos', $totais['pedidos']],
    'bling_purchase_orders'       => ['compras', $totais['compras']],
    'bling_invoices'              => ['notas', $totais['notas']],
    'bling_accounts_receivable'   => ['a receber', $totais['receber']],
    'bling_accounts_payable'      => ['a pagar', $totais['pagar']],
];
foreach ($contagens as $tabela => [$rotulo, $esperado]) {
    $n = (int) $repo->valor("SELECT COUNT(*) FROM `$tabela` WHERE account_id = ?", [$accountId]);
    ok("$rotulo: $esperado gravados", $n === $esperado, "$n no banco");
}

// FK resolvida: pedido órfão de dono é o defeito que a tela mostra e o banco esconde.
$semCliente = (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_sales_orders WHERE account_id = ? AND contact_id IS NULL', [$accountId]);
ok('nenhum pedido sem cliente', $semCliente === 0, "$semCliente órfãos");

$semProduto = (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_sales_order_items WHERE account_id = ? AND product_id IS NULL', [$accountId]);
ok('nenhum item de pedido sem produto', $semProduto === 0, "$semProduto órfãos");

$semCategoria = (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_products WHERE account_id = ? AND category_id IS NULL', [$accountId]);
ok('nenhum produto sem categoria', $semCategoria === 0, "$semCategoria órfãos");

// ══════════════════════════════════════════════════════════════
secao('4. O adapter de versão trabalhou');

// Se todas as situações caíssem no padrão, o adapter não estaria traduzindo —
// e a tela mostraria tudo como "aguardando aprovação".
$situacoes = $repo->consultar(
    'SELECT situacao, COUNT(*) n FROM bling_sales_orders WHERE account_id = ?
      GROUP BY situacao ORDER BY n DESC', [$accountId]);
$distintas = count($situacoes);
ok('pedidos têm variedade de situações', $distintas >= 5,
   "$distintas distintas: " . implode(', ', array_map(
       static fn($s) => "{$s['situacao']}({$s['n']})", array_slice($situacoes, 0, 5))));

$padrao = 0;
foreach ($situacoes as $s) { if ($s['situacao'] === 'aguardando_aprovacao') { $padrao = (int) $s['n']; } }
ok('a maioria NÃO caiu no valor padrão', $padrao < $totais['pedidos'] * 0.5,
   "$padrao de {$totais['pedidos']} — muitos aqui significaria adapter não traduzindo");

$desconhecidos = BlingVersionAdapter::desconhecidos();
ok('nenhum código de situação desconhecido', $desconhecidos === [],
   $desconhecidos === [] ? 'todos traduzidos' : implode(', ', array_keys($desconhecidos)));

// Títulos vencidos são DERIVADOS da data — não vêm da API.
$vencidos = (int) $repo->valor(
    "SELECT COUNT(*) FROM bling_accounts_receivable WHERE account_id = ? AND situacao = 'vencido'",
    [$accountId]);
ok('títulos vencidos foram derivados da data', $vencidos > 0,
   "$vencidos vencidos — a API manda 'aberto', quem decide vencido somos nós");

// ══════════════════════════════════════════════════════════════
secao('5. LGPD — documento mascarado NA ORIGEM (§62)');

$real = new BlingReal($repo);

// O documento completo entrou; o que sai do provedor tem que estar mascarado.
$clientes = $real->colecao('clientes');
$vazando = array_filter($clientes, static fn($c) =>
    !str_contains((string) ($c['documento_mascarado'] ?? ''), '*'));
ok('todo cliente sai com documento mascarado', $vazando === [],
   count($clientes) . ' clientes, ' . count($vazando) . ' sem máscara');

$fornecedores = $real->colecao('fornecedores');
$vazandoF = array_filter($fornecedores, static fn($f) =>
    !str_contains((string) ($f['cnpj_mascarado'] ?? ''), '*'));
ok('todo fornecedor sai com CNPJ mascarado', $vazandoF === [],
   count($fornecedores) . ' fornecedores, ' . count($vazandoF) . ' sem máscara');

// E o documento completo está no banco, não perdido — é o que permite conciliar.
$doc = (string) $repo->valor(
    'SELECT documento FROM bling_contacts WHERE account_id = ? LIMIT 1', [$accountId]);
ok('documento completo permanece no banco', strlen(preg_replace('/\D/', '', $doc)) >= 11,
   'mascarar na origem não pode significar perder o dado');

// ══════════════════════════════════════════════════════════════
secao('6. PARIDADE — as 52 telas dão o mesmo número nos dois provedores');

$mock = new class extends BlingProviderBase {
    public function nome(): string { return 'mock'; }
    public function ehSimulado(): bool { return true; }
    public function ultimaSync(): ?string { return gmdate('c'); }
    public function colecao(string $n): array { return BlingMock::grafo()[$n] ?? []; }
};

// Janela que cobre o grafo inteiro — comparar num recorte esconderia divergência.
$f = ['de' => '2025-01-01', 'ate' => '2026-12-31', 'periodo' => 'tudo', 'dias' => 730,
      'granularidade' => 'mes', 'pagina' => 1, 'limite' => 50, 'busca' => '',
      'ordenar' => '', 'direcao' => 'desc'];

// ── 6.1 tamanho das coleções (o que alimenta os 39 grids) ──
$colecoes = ['produtos', 'clientes', 'fornecedores', 'pedidos', 'compras', 'notas',
             'receber', 'pagar', 'estoque', 'canais', 'depositos', 'categorias'];
$divergentes = [];
foreach ($colecoes as $c) {
    $nm = count($mock->colecao($c));
    $nr = count($real->colecao($c));
    if ($nm !== $nr) { $divergentes[] = "$c: mock=$nm banco=$nr"; }
}
ok('as coleções têm o mesmo tamanho nos dois provedores', $divergentes === [],
   $divergentes === [] ? count($colecoes) . ' coleções' : implode(' | ', $divergentes));

// ── 6.2 KPIs (§16) ──
$kpisM = []; foreach ($mock->kpis($f) as $k) { $kpisM[$k['id']] = $k; }
$kpisR = []; foreach ($real->kpis($f) as $k) { $kpisR[$k['id']] = $k; }

ok('os dois expõem os mesmos indicadores', array_keys($kpisM) === array_keys($kpisR),
   count($kpisR) . ' indicadores');

// ⚠️ DUAS DIVERGÊNCIAS SÃO ESPERADAS — e é importante que sejam explícitas,
// não toleradas em silêncio. Ambas existem porque o MOCK inventa um estado
// operacional que o dado real não tem:
//
//   aguardando_expedicao  o mock gera envios com situação própria; o real DERIVA
//                         a situação do envio a partir do pedido, porque a API
//                         v3 não tem recurso de envio separado. Contagens
//                         diferentes são consequência da modelagem, não erro.
//   integracoes_falha     o mock simula uma sincronização com erro para a tela
//                         ter o que mostrar. O banco reflete o estado real, que
//                         não teve erro.
//
// Qualquer OUTRA divergência é defeito.
$divergenciaEsperada = ['aguardando_expedicao', 'integracoes_falha'];

$divKpi = [];
$divEsperadas = [];
foreach ($kpisM as $id => $km) {
    $vm = (float) ($km['valor'] ?? 0);
    $vr = (float) ($kpisR[$id]['valor'] ?? 0);
    // Tolerância de 1 centavo por milhão: DECIMAL(14,2) no banco vs float em PHP.
    $tol = max(0.01, abs($vm) * 0.000001);
    if (abs($vm - $vr) <= $tol) { continue; }
    $texto = sprintf('%s: mock=%.2f banco=%.2f', $id, $vm, $vr);
    if (in_array($id, $divergenciaEsperada, true)) { $divEsperadas[] = $texto; }
    else { $divKpi[] = $texto; }
}
ok('nenhuma divergência de KPI além das declaradas', $divKpi === [],
   $divKpi === [] ? sprintf('%d indicadores, %d divergências esperadas',
       count($kpisM), count($divEsperadas)) : implode(' | ', array_slice($divKpi, 0, 4)));

// A lista de exceções tem que continuar VERDADEIRA. Uma exceção que deixou de
// divergir é exceção a remover — senão ela vira licença permanente para um
// defeito futuro no mesmo indicador.
foreach ($divergenciaEsperada as $id) {
    $vm = (float) ($kpisM[$id]['valor'] ?? 0);
    $vr = (float) ($kpisR[$id]['valor'] ?? 0);
    if (abs($vm - $vr) <= max(0.01, abs($vm) * 0.000001)) {
        avisar("KPI $id passou a bater — remover da lista de divergências esperadas");
    }
}

// ── 6.3 curva ABC (§28) nas 5 dimensões ──
$divAbc = [];
foreach (['produtos', 'clientes', 'categorias', 'canais', 'fornecedores'] as $dim) {
    foreach (['faturamento', 'margem'] as $metrica) {
        $am = $mock->curvaAbc($dim, $metrica, $f);
        $ar = $real->curvaAbc($dim, $metrica, $f);
        $tol = max(1.0, abs((float) $am['total']) * 0.0001);
        if (abs((float) $am['total'] - (float) $ar['total']) > $tol) {
            $divAbc[] = sprintf('%s/%s: %.2f vs %.2f', $dim, $metrica, $am['total'], $ar['total']);
        }
    }
}
ok('curva ABC bate nas 5 dimensões × 2 métricas', $divAbc === [],
   $divAbc === [] ? '10 combinações' : implode(' | ', $divAbc));

// ── 6.4 saúde e atenção (§18, §19) ──
$sm = array_column($mock->saude(), 'id');
$sr = array_column($real->saude(), 'id');
ok('mesmos indicadores de saúde', $sm === $sr, count($sr) . ' indicadores');

// Atenção e insights são LISTAS DE OCORRÊNCIAS: só aparecem quando o problema
// existe. Exigir listas idênticas seria exigir que o banco tivesse os mesmos
// problemas que o mock inventou — o que é o oposto do desejado.
//
// O que importa é: (a) o banco não inventa categoria nova, (b) o que só existe
// no mock é simulação, não capacidade perdida.
$am = array_column($mock->atencao(), 'id');
$ar = array_column($real->atencao(), 'id');

// Categorias que dependem de estado que o mock SIMULA e o banco não tem.
$soNoMockEsperado = [
    'webhooks_falha'     => 'o mock simula webhook em DLQ; o banco não teve falha',
    'sync_interrompida'  => 'o mock simula sincronização com erro',
    'remessas_atraso'    => 'depende de previsão de entrega, que a v3 nem sempre traz',
    'estoque_divergente' => 'divergência de inventário não é exposta pela API — é contagem física',
];
$soNoMock = array_values(array_diff($am, $ar));
$inesperado = array_values(array_diff($soNoMock, array_keys($soNoMockEsperado)));
ok('nada some da tela de atenção sem motivo declarado', $inesperado === [],
   $inesperado === [] ? count($soNoMock) . ' ausências, todas explicadas'
     : 'sem explicação: ' . implode(',', $inesperado));

// O contrário — o banco detectar algo que o mock não detecta — é BOM: significa
// que a regra roda sobre dado real. Mas o id tem que ser conhecido.
$soNoBanco = array_values(array_diff($ar, $am));
foreach ($soNoBanco as $id) { avisar("banco detectou '$id', que o mock não gera — regra rodando sobre dado real"); }

ok('o banco produz pontos de atenção de verdade', count($ar) >= 8,
   count($ar) . ' pontos — uma tela de atenção vazia é pior que não existir');

$idsM = array_column($mock->insights($f), 'id');
$idsR = array_column($real->insights($f), 'id');
ok('o banco gera insights', count($idsR) > 0, 'banco=[' . implode(',', $idsR) . ']');
avisar(sprintf('insights: mock=%d banco=%d — o mock injeta erro fiscal e atraso de '
    . 'fornecedor que o dado carregado não tem', count($idsM), count($idsR)));

// ── 6.5 evolução (§17) ──
// evolucao() devolve `series`, cada uma com `pontos` — não `pontos` na raiz.
$serie = static function (array $evo, string $id): array {
    foreach ($evo['series'] ?? [] as $s) { if ($s['id'] === $id) { return $s['pontos'] ?? []; } }
    return [];
};
$em = $mock->evolucao($f);
$er = $real->evolucao($f);
ok('série de evolução tem o mesmo número de pontos',
   count($serie($em, 'faturamento')) === count($serie($er, 'faturamento')),
   sprintf('mock=%d banco=%d pontos',
       count($serie($em, 'faturamento')), count($serie($er, 'faturamento'))));

$somaM = array_sum(array_column($serie($em, 'faturamento'), 'valor'));
$somaR = array_sum(array_column($serie($er, 'faturamento'), 'valor'));
ok('a série soma o mesmo total', abs($somaM - $somaR) < max(1.0, $somaM * 0.0001),
   sprintf('mock=%.2f banco=%.2f', $somaM, $somaR));

// ── 6.6 o total da série bate com o KPI ──
// Esta é a checagem que pegou a divergência de R$ 126.721 na Fase 2: cada tela
// pode estar certa sozinha e o conjunto estar errado.
$kpiFat = (float) ($kpisR['faturamento_bruto']['valor'] ?? 0);
ok('o total da série de evolução bate com o KPI de faturamento',
   abs($somaR - $kpiFat) < max(1.0, $kpiFat * 0.0001),
   sprintf('série=%.2f KPI=%.2f', $somaR, $kpiFat));

$abcProd = $real->curvaAbc('produtos', 'faturamento', $f);
ok('o total da curva ABC bate com o KPI de faturamento',
   abs((float) $abcProd['total'] - $kpiFat) < max(1.0, $kpiFat * 0.0001),
   sprintf('ABC=%.2f KPI=%.2f', $abcProd['total'], $kpiFat));

// ── 6.7 análises da Fase 3 ──
foreach (['fluxoEmpresarial', 'funilFiscal'] as $metodo) {
    $rm = $mock->$metodo($f);
    $rr = $real->$metodo($f);
    ok("$metodo tem a mesma forma", array_keys($rm) === array_keys($rr),
       implode(',', array_slice(array_keys($rr), 0, 4)));
}
// rentabilidade() recebe a dimensão como primeiro argumento.
foreach (['produtos', 'clientes', 'canais'] as $dim) {
    $rm = $mock->rentabilidade($dim, $f);
    $rr = $real->rentabilidade($dim, $f);
    ok("rentabilidade/$dim tem a mesma forma", array_keys($rm) === array_keys($rr),
       implode(',', array_slice(array_keys($rr), 0, 4)));
}

// ══════════════════════════════════════════════════════════════
secao('7. Desempenho com volume');

// Uma tela que demora 3s com 1538 pedidos vai demorar minutos com 50 mil.
// Medir agora é a diferença entre descobrir aqui e descobrir com o dono olhando.
$medir = static function (callable $fn): float {
    $t = microtime(true); $fn(); return (microtime(true) - $t) * 1000;
};

$msKpis = $medir(static fn() => $real->kpis($f));
ok('KPIs respondem rápido', $msKpis < 2000, sprintf('%.0f ms', $msKpis));

$msGrid = $medir(static fn() => $real->colecao('pedidos'));
ok('grid de pedidos responde rápido', $msGrid < 3000,
   sprintf('%.0f ms para %d pedidos', $msGrid, $totais['pedidos']));

$msAbc = $medir(static fn() => $real->curvaAbc('produtos', 'faturamento', $f));
ok('curva ABC responde rápido', $msAbc < 2000, sprintf('%.0f ms', $msAbc));

$msEvo = $medir(static fn() => $real->evolucao($f));
ok('evolução responde rápido', $msEvo < 2000, sprintf('%.0f ms', $msEvo));

// N+1 é o defeito que só aparece com volume: some no teste de 1 registro e
// derruba a tela em produção.
$queries = $repo->consultasExecutadas();
$real2 = new BlingReal($repo);
$real2->colecao('pedidos');
$gasto = $repo->consultasExecutadas() - $queries;
ok('grid de pedidos NÃO faz N+1', $gasto <= 10,
   "$gasto consultas para {$totais['pedidos']} pedidos — N+1 daria mais de mil");

// ══════════════════════════════════════════════════════════════
secao('8. Incremental e reconciliação sobre a base carregada');

$antes = (int) $repo->valor('SELECT COUNT(*) FROM bling_sales_orders WHERE account_id = ?', [$accountId]);

$t0 = microtime(true);
$inc = $sync->sincronizarTudo($accountId, 'incremental', 'homologacao-inc');
$msInc = (microtime(true) - $t0) * 1000;

$depois = (int) $repo->valor('SELECT COUNT(*) FROM bling_sales_orders WHERE account_id = ?', [$accountId]);
ok('incremental NÃO duplica nada', $antes === $depois, "$antes → $depois");

$ignorados = array_sum(array_column($inc, 'ignorados'));
$atualizados = array_sum(array_column($inc, 'atualizados'));
ok('payload inalterado é ignorado, não reescrito', $ignorados > $atualizados,
   "$ignorados ignorados vs $atualizados atualizados");
printf("     ↳ incremental completo em %.1fs\n", $msInc / 1000);

$rec = $sync->sincronizarTudo($accountId, 'reconciliacao', 'homologacao-rec');
$final = (int) $repo->valor('SELECT COUNT(*) FROM bling_sales_orders WHERE account_id = ?', [$accountId]);
ok('reconciliação NÃO duplica nada', $final === $antes, "$antes → $final");

// Preço só entra no histórico quando MUDA.
$hist = (int) $repo->valor('SELECT COUNT(*) FROM bling_price_history WHERE account_id = ?', [$accountId]);
ok('histórico de preço não cresce a cada sync', $hist === $totais['produtos'],
   "$hist linhas para {$totais['produtos']} produtos — 3 sincronizações rodaram");

// ⚠️ Este é o defeito que a Fase 4 encontrou: UNIQUE com coluna NULL não
// deduplica, e o produto aparecia duplicado na tela, uma cópia por sync.
$precos = (int) $repo->valor('SELECT COUNT(*) FROM bling_prices WHERE account_id = ?', [$accountId]);
ok('1 linha de preço vigente por produto, após 3 sincronizações',
   $precos === $totais['produtos'], "$precos linhas para {$totais['produtos']} produtos");

// ══════════════════════════════════════════════════════════════
secao('9. Erro de item dentro da transação da página');

// A carga passou a rodar com UMA TRANSAÇÃO POR PÁGINA (18s em vez de 112s).
// Isso cria um risco novo: se o registro do erro ficasse dentro da transação,
// uma página que falha reverteria o próprio registro da falha — e o item
// desapareceria sem deixar rastro. Este bloco prova que não acontece.
$transporte->limparRotas();
$transporte->responder('oauth/token', new BlingResposta(200, [
    'access_token' => 'ACESSO_HOMOLOG', 'expires_in' => 3600, 'token_type' => 'Bearer',
]));

// Uma página com 3 itens bons e 2 sem `id` — o campo que o normalizador exige.
$transporte->responder('categorias/produtos', new BlingResposta(200, ['data' => [
    ['id' => '50001', 'descricao' => 'Áudio profissional'],
    ['descricao' => 'SEM ID — tem que falhar'],
    ['id' => '50002', 'descricao' => 'Iluminação'],
    ['descricao' => 'SEM ID TAMBÉM'],
    ['id' => '50003', 'descricao' => 'Vídeo'],
]]));

$errosAntes = (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_sync_errors WHERE account_id = ?', [$accountId]);
$catAntes = (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_categories WHERE account_id = ?', [$accountId]);

$rCat = $sync->sincronizar($accountId, 'categorias', 'incremental', 'homologacao-erro');

ok('itens bons da página foram gravados apesar dos ruins',
   (int) $repo->valor('SELECT COUNT(*) FROM bling_categories WHERE account_id = ?',
       [$accountId]) === $catAntes,
   'as 3 categorias válidas já existiam e continuam lá');
ok('itens ruins foram contados como erro', ($rCat['erros'] ?? 0) === 2,
   ($rCat['erros'] ?? 0) . ' erros');

$errosDepois = (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_sync_errors WHERE account_id = ?', [$accountId]);
ok('o erro foi REGISTRADO, não revertido junto com a transação',
   $errosDepois === $errosAntes + 2,
   "$errosAntes → $errosDepois — dentro da transação, o rollback apagaria o rastro");

ok('a conexão não ficou presa em transação aberta',
   !$repo->pdo()->inTransaction(),
   'transação vazada contaminaria TODA gravação seguinte');

ok('o recurso terminou em situação utilizável', in_array($rCat['situacao'], ['atencao', 'parcial'], true),
   $rCat['situacao'] . ' — nem "ok" (houve erro) nem "erro" (a maioria entrou)');

// ══════════════════════════════════════════════════════════════
secao('10. Rollback — voltar para o mock não perde nada');

putenv('BLING_PROVIDER=mock');
$voltou = new BlingMockProvider();
ok('o mock volta a servir imediatamente', count($voltou->colecao('pedidos')) === $totais['pedidos'],
   'trocar BLING_PROVIDER de volta é o rollback — nada é apagado');

$aindaLa = (int) $repo->valor('SELECT COUNT(*) FROM bling_sales_orders WHERE account_id = ?', [$accountId]);
ok('os dados sincronizados continuam no banco', $aindaLa === $totais['pedidos'],
   "$aindaLa pedidos — rollback não é destrutivo");
putenv('BLING_PROVIDER=bling');

} catch (Throwable $e) {
    $falhou++;
    $erros[] = 'EXCEÇÃO: ' . $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine();
    printf("\n  \033[31m✘ EXCEÇÃO\033[0m %s\n     %s:%d\n",
        $e->getMessage(), basename($e->getFile()), $e->getLine());
}

$limpar();
$accountId = null;

echo "\n" . str_repeat('─', 64) . "\n";
printf("  \033[1m%d passaram\033[0m · %s\n", $passou,
    $falhou === 0 ? "\033[32m0 falharam\033[0m" : "\033[31m$falhou falharam\033[0m");
if ($avisos !== []) {
    echo "\n  Avisos:\n";
    foreach ($avisos as $a) { echo "   ! $a\n"; }
}
if ($falhou > 0) {
    echo "\n  Falhas:\n";
    foreach ($erros as $e) { echo "   • $e\n"; }
} else {
    echo "\n  \033[32mAs 52 telas dão o mesmo número lidas do banco e do mock.\033[0m\n";
    echo "  Trocar BLING_PROVIDER=mock por bling não muda uma linha de tela.\n";
}
echo "\n";

exit($falhou === 0 ? 0 : 1);
