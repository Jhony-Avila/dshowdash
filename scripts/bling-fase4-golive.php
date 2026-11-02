<?php
// scripts/bling-fase4-golive.php — prova do caminho de GO-LIVE sem credencial
// @version 1.0.0  @created 2026-07-30
//
//     php scripts/bling-fase4-golive.php
//
// PARA QUE SERVE
// O caminho conectar → callback → gravar token → renovar → paginar → normalizar
// → gravar → SERVIR AS TELAS só seria executado pela primeira vez com as
// credenciais reais, em produção, com o dono olhando.
//
// Este script executa esse caminho inteiro AGORA, com transporte falso e
// credenciais de fachada, contra o banco BLING de verdade.
//
// Se passa, o que falta no go-live é SÓ colar as credenciais: a mecânica está
// provada. Se falha, falha aqui — não na frente do dono.
//
// SEGURANÇA: cria uma conta de teste com CNPJ reservado e APAGA tudo ao final,
// inclusive em caso de erro. Nenhum dado real é tocado.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

$raiz = dirname(__DIR__);

// Carrega o .env: este script roda fora do bootstrap da aplicação.
foreach (file($raiz . '/.env') as $linha) {
    $linha = trim($linha);
    if ($linha === '' || $linha[0] === '#' || !str_contains($linha, '=')) continue;
    [$k, $v] = explode('=', $linha, 2);
    $k = trim($k); $v = trim($v, " \t\"'");
    putenv("$k=$v"); $_ENV[$k] = $v;
}

// Script CLI é entrada legítima do módulo — os internals exigem esta
// constante para recusar execução direta por HTTP.
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
require_once $raiz . '/api/bling/lib/BlingReal.php';
require_once $raiz . '/api/bling/services/BlingAuthService.php';
require_once $raiz . '/api/bling/services/BlingSyncService.php';
require_once $raiz . '/api/bling/services/BlingQueueService.php';
require_once $raiz . '/api/bling/services/BlingWebhookService.php';

/** CNPJ reservado para o teste. Não existe e não colide com conta real. */
const CNPJ_TESTE = '00000000000191';

$passou = 0; $falhou = 0; $erros = [];

function ok(string $nome, bool $cond, string $det = ''): void {
    global $passou, $falhou, $erros;
    if ($cond) { $passou++; printf("  \033[32m✔\033[0m %s%s\n", $nome, $det !== '' ? "  ($det)" : ''); }
    else { $falhou++; $erros[] = $nome . ($det !== '' ? " — $det" : '');
           printf("  \033[31m✘\033[0m %s%s\n", $nome, $det !== '' ? "  ($det)" : ''); }
}
function secao(string $t): void { printf("\n\033[1m%s\033[0m\n", $t); }

$repo = new BlingRepository();
$accountId = null;

// Janela do teste. A limpeza por account_id não bastava: entregas recusadas e
// as que não identificam conta são gravadas com account_id NULL e sobreviviam,
// contaminando a execução seguinte com "duplicado" — um teste que passava só
// na primeira rodada.
$inicioTeste = gmdate('Y-m-d H:i:s', time() - 1);

// Limpeza garantida, inclusive em erro.
$limpar = function () use (&$repo, &$accountId, $inicioTeste) {
    if ($accountId === null) return;
    try {
        // ON DELETE CASCADE leva junto tudo que referencia a conta.
        $repo->pdo()->prepare('DELETE FROM bling_accounts WHERE id = ?')->execute([$accountId]);
        // As tabelas sem FK (deliberadamente) precisam ser limpas à mão.
        foreach (['bling_sync_jobs', 'bling_sync_errors', 'bling_queue',
                  'bling_raw_payloads', 'bling_audit_logs'] as $t) {
            $repo->pdo()->prepare("DELETE FROM `$t` WHERE account_id = ?")->execute([$accountId]);
        }
        // Inclui os de account_id NULL criados DENTRO da janela desta execução:
        // apagar todos seria destrutivo, apagar só por conta deixaria resíduo.
        $repo->pdo()->prepare(
            "DELETE FROM bling_webhook_events
              WHERE (account_id = ? OR account_id IS NULL) AND recebido_em >= ?"
        )->execute([$accountId, $inicioTeste]);
    } catch (Throwable $e) {
        fwrite(STDERR, "AVISO: falha ao limpar a conta de teste $accountId: " . $e->getMessage() . "\n");
    }
};
register_shutdown_function($limpar);

try {

// ══════════════════════════════════════════════════════════════
secao('1. Ambiente');

ok('banco BLING acessível', $repo->disponivel(),
   'usuário ' . BlingRepository::configuracao()['user']);
if (!$repo->disponivel()) {
    fwrite(STDERR, "\nSem banco não há o que provar. Rode docs/BLING/02-banco-BLING.sql.\n");
    exit(1);
}
ok('schema aplicado', $repo->schemaAplicado());

// O usuário da aplicação NÃO pode ter DDL. Se tiver, o módulo estaria ampliando
// o passivo do root em vez de reduzi-lo.
$semDdl = true;
try {
    $repo->pdo()->exec('CREATE TABLE bling__proibido (id INT)');
    $repo->pdo()->exec('DROP TABLE bling__proibido');
    $semDdl = false;
} catch (Throwable) { /* esperado */ }
ok('usuário da aplicação NÃO tem DDL', $semDdl,
   $semDdl ? 'CREATE TABLE recusado, como deve ser' : 'PERIGO: bling_app consegue criar tabela');

ok('chave de cifra configurada', BlingCrypto::disponivel());
ok('cifra faz ida e volta', BlingCrypto::autoteste());

// ══════════════════════════════════════════════════════════════
secao('2. Cifra dos tokens');

$segredo = 'token-secreto-' . bin2hex(random_bytes(12));
$blob = BlingCrypto::cifrar($segredo);
ok('token cifrado não contém o texto puro', !str_contains($blob, $segredo));
ok('decifra devolve o original', BlingCrypto::decifrar($blob) === $segredo);

// Adulteração tem que ser DETECTADA, não devolver lixo.
$adulterado = $blob;
$adulterado[strlen($adulterado) - 1] = chr(ord($adulterado[strlen($adulterado) - 1]) ^ 0xFF);
ok('adulteração é detectada (GCM)', BlingCrypto::decifrar($adulterado) === null);
ok('blob vazio não quebra', BlingCrypto::decifrar('') === null && BlingCrypto::decifrar(null) === null);

// ══════════════════════════════════════════════════════════════
secao('3. OAuth — conectar (transporte falso)');

// Credenciais de fachada: o transporte falso não fala com ninguém.
putenv('BLING_CLIENT_ID=teste-client-id');
putenv('BLING_CLIENT_SECRET=teste-client-secret');
putenv('BLING_REDIRECT_URI=https://dshowdash.com.br/api/bling/oauth/callback');

$transporte = new BlingTransporteFalso();
$transporte->responder('oauth/token', new BlingResposta(200, [
    'access_token'  => 'ACESSO_1',
    'refresh_token' => 'REFRESH_1',
    'expires_in'    => 3600,
    'token_type'    => 'Bearer',
]));

$auth = new BlingAuthService($repo, $transporte);

$url = $auth->iniciarConexao(999999, '#/panel-bling');
ok('URL de autorização montada', str_contains($url, 'oauth/authorize') && str_contains($url, 'state='));
parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
$state = (string) ($q['state'] ?? '');
ok('state tem entropia suficiente', strlen($state) >= 32, strlen($state) . ' caracteres');

// Callback com state DESCONHECIDO tem que ser recusado — é o anti-CSRF.
$recusou = false;
try { $auth->concluirConexao('codigo-qualquer', 'state-forjado-' . bin2hex(random_bytes(8))); }
catch (Throwable) { $recusou = true; }
ok('callback com state forjado é RECUSADO', $recusou);

$r = $auth->concluirConexao('codigo-do-bling', $state, [
    'nome' => 'Conta de teste (go-live)', 'cnpj' => CNPJ_TESTE,
]);
$accountId = $r['account_id'];
ok('conta criada', $accountId > 0, "id $accountId");

$t = $repo->tokens($accountId);
ok('access_token gravado e legível', ($t['access_token'] ?? null) === 'ACESSO_1');
ok('refresh_token gravado e legível', ($t['refresh_token'] ?? null) === 'REFRESH_1');

// O token no banco tem que estar CIFRADO, não em texto puro.
$cru = $repo->valor('SELECT access_token_enc FROM bling_oauth_tokens WHERE account_id = ?', [$accountId]);
ok('token está cifrado no banco', !str_contains((string) $cru, 'ACESSO_1'));

// state é de uso único.
ok('state não pode ser reutilizado', $repo->consumirState($state) === null);

// ══════════════════════════════════════════════════════════════
secao('4. OAuth — renovação');

// Expira o token à força.
$repo->pdo()->prepare(
    'UPDATE bling_oauth_tokens SET expira_em = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 HOUR) WHERE account_id = ?'
)->execute([$accountId]);

// ⚠️ O CASO QUE JÁ CUSTOU CARO NO GOOGLE CALENDAR:
// a renovação devolve access_token NOVO e NENHUM refresh_token. O refresh
// antigo continua valendo — sobrescrever com NULL zeraria a conexão.
$transporte->responder('oauth/token', new BlingResposta(200, [
    'access_token' => 'ACESSO_2', 'expires_in' => 3600, 'token_type' => 'Bearer',
]));

$novo = $auth->tokenValido($accountId);
ok('token expirado é renovado automaticamente', $novo === 'ACESSO_2');

$t2 = $repo->tokens($accountId);
ok('refresh_token ANTIGO foi preservado', ($t2['refresh_token'] ?? null) === 'REFRESH_1',
   'renovação sem refresh novo NÃO pode apagar o que existe');
ok('nova expiração no futuro', strtotime((string) $t2['expira_em'] . ' UTC') > time());

// Token ainda válido não deve gerar chamada nova.
$transporte->limpar();
$auth->tokenValido($accountId);
ok('token válido NÃO dispara renovação', $transporte->contar('oauth/token') === 0);

// ══════════════════════════════════════════════════════════════
secao('5. Cliente — limite, retry e paginação');

BlingClient::$dormirParaTeste = static function (int $ms) { /* não espera de verdade */ };

// 429 duas vezes, depois 200: prova o backoff e o respeito ao Retry-After.
$transporte->limpar();
$transporte->responder('/produtos', [
    new BlingResposta(429, ['error' => 'rate limit'], ['Retry-After' => '1']),
    new BlingResposta(429, ['error' => 'rate limit'], ['Retry-After' => '1']),
    new BlingResposta(200, ['data' => [['id' => '1', 'nome' => 'Produto A', 'codigo' => 'A-1', 'preco' => 10]]]),
]);
$cliente = $auth->cliente($accountId);
$resp = $cliente->get('produtos');
ok('429 é reprocessado até obter sucesso', $resp->ok(),
   $transporte->contar('/produtos') . ' tentativas');

// 400 NÃO deve ser repetido: o pedido está errado, repetir só gasta limite.
$transporte->limpar();
$transporte->responder('/invalido', new BlingResposta(400, ['error' => 'campo inválido']));
$cliente->get('invalido');
ok('400 NÃO é reprocessado', $transporte->contar('/invalido') === 1,
   $transporte->contar('/invalido') . ' tentativa(s)');

// Paginação: 2 páginas cheias + 1 parcial = para sozinho.
$transporte->limpar();
$paginas = [];
$transporte->responder('/pedidos/vendas', function ($m, $url) use (&$paginas) {
    parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
    $p = (int) ($q['pagina'] ?? 1);
    $paginas[] = $p;
    $qtd = $p <= 2 ? 100 : 37;   // 3ª página incompleta = última
    $itens = [];
    for ($i = 0; $i < $qtd; $i++) {
        $itens[] = ['id' => (string) (($p - 1) * 100 + $i + 1)];
    }
    return new BlingResposta(200, ['data' => $itens]);
});
$res = $cliente->paginar('pedidos/vendas', [], static fn() => true);
ok('paginação percorre até a página incompleta', $res['itens'] === 237,
   "{$res['itens']} itens em " . count($paginas) . ' páginas');
ok('não pede a página seguinte à incompleta', max($paginas) === 3, 'última página: ' . max($paginas));

// Interrupção pelo callback (é o que o incremental usa ao alcançar o watermark).
$transporte->limpar(); $paginas = [];
$res = $cliente->paginar('pedidos/vendas', [], static fn($itens, $p) => $p < 2);
ok('callback interrompe a paginação', $res['interrompido'] === true, 'parou na página 2');

$consumo = $cliente->consumo();
ok('consumo do limite é contabilizado', $consumo['chamadas_no_dia'] > 0,
   "{$consumo['chamadas_no_dia']} chamadas, {$consumo['consumido_pct']}% do teto diário");

// ══════════════════════════════════════════════════════════════
secao('6. Adapter de versão');

ok('situação numérica traduzida', BlingVersionAdapter::situacaoPedido('9') === 'aprovado');
ok('situação por extenso traduzida', BlingVersionAdapter::situacaoPedido('atendido') === 'entregue');
ok('código DESCONHECIDO vira padrão visível, não exceção',
   BlingVersionAdapter::situacaoPedido('999-que-nao-existe') === 'aguardando_aprovacao');
ok('código desconhecido é registrado para virar tarefa',
   count(BlingVersionAdapter::desconhecidos()) > 0);
ok('título vencido é derivado da data, não do código',
   BlingVersionAdapter::situacaoTitulo('1', gmdate('Y-m-d', strtotime('-10 days')), 100.0, 0.0) === 'vencido');
ok('título liquidado vence a data',
   BlingVersionAdapter::situacaoTitulo('1', gmdate('Y-m-d', strtotime('-10 days')), 100.0, 100.0) === 'liquidado');
ok('título parcial é reconhecido',
   BlingVersionAdapter::situacaoTitulo('1', gmdate('Y-m-d', strtotime('+10 days')), 100.0, 40.0) === 'parcial');

// ══════════════════════════════════════════════════════════════
secao('7. Normalizador');

$produtoBruto = [
    'id' => '7001', 'nome' => 'Caixa Ativa X', 'codigo' => 'CX-001',
    'preco' => '1.234,56', 'precoCusto' => 800.0,
    'categoria' => ['id' => '55'], 'situacao' => 'A',
    'dimensoes' => ['pesoLiquido' => 12.5, 'largura' => 30, 'altura' => 40, 'profundidade' => 20],
];
$n = BlingNormalizer::produto($produtoBruto);
ok('preço pt-BR "1.234,56" vira 1234.56', abs($n['preco'] - 1234.56) < 0.001,
   'Number() puro daria NaN — o normalizador trata');
ok('dimensões montadas', $n['dimensoes'] === '30x40x20');
ok('situação "A" vira ativo', $n['is_ativo'] === 1);

$semId = false;
try { BlingNormalizer::produto(['nome' => 'sem id']); }
catch (Throwable) { $semId = true; }
ok('payload sem id OBRIGATÓRIO levanta erro', $semId);

$semOpcional = BlingNormalizer::produto(['id' => '1', 'nome' => 'mínimo']);
ok('campo opcional ausente vira null, não erro', $semOpcional['gtin'] === null);

// Fuso: o Bling responde em horário de Brasília.
$ped = BlingNormalizer::pedidoVenda([
    'id' => '1', 'data' => '2026-07-15', 'dataCriacao' => '2026-07-15 23:30:00', 'total' => 100,
]);
ok('datahora de Brasília vira UTC', str_starts_with((string) $ped['criado_externo_em'], '2026-07-16 02:30'),
   $ped['criado_externo_em'] . ' — 23h30 em SP é 02h30 UTC do dia seguinte');

// ══════════════════════════════════════════════════════════════
secao('8. Sincronização ponta a ponta');

// Zera as rotas dos blocos anteriores: `responder()` casa por substring e a
// rota de paginação (`/pedidos/vendas` com itens sintéticos) continuaria
// vencendo aqui.
$transporte->limpar();
$transporte->limparRotas();
$transporte->responder('categorias/produtos', new BlingResposta(200, ['data' => [
    ['id' => '55', 'descricao' => 'Áudio profissional'],
]]));
$transporte->responder('/depositos', new BlingResposta(200, ['data' => [
    ['id' => '900', 'descricao' => 'Depósito Geral', 'padrao' => true],
]]));
$transporte->responder('contatos/fornecedores', new BlingResposta(200, ['data' => [
    ['id' => '800', 'nome' => 'Fornecedor Teste', 'numeroDocumento' => '11222333000181', 'email' => 'a@b.c'],
]]));
$transporte->responder('/contatos?', new BlingResposta(200, ['data' => [
    ['id' => '500', 'nome' => 'Cliente Teste', 'numeroDocumento' => '12345678901', 'tipo' => 'F'],
]]));
$transporte->responder('/produtos', new BlingResposta(200, ['data' => [
    ['id' => '7001', 'nome' => 'Caixa Ativa X', 'codigo' => 'CX-001', 'preco' => 1500.0,
     'precoCusto' => 900.0, 'categoria' => ['id' => '55'], 'gtin' => '7890000000017',
     'unidade' => 'UN', 'marca' => 'ProLine', 'situacao' => 'A'],
]]));
$transporte->responder('estoques/saldos', new BlingResposta(200, ['data' => [
    ['produto' => ['id' => '7001'], 'deposito' => ['id' => '900'],
     'saldoFisico' => 40, 'reservado' => 5, 'estoqueMinimo' => 10],
]]));
$transporte->responder('pedidos/vendas', new BlingResposta(200, ['data' => [
    ['id' => '300001', 'numero' => '10001', 'data' => '2026-07-20',
     'situacao' => ['valor' => '9'], 'contato' => ['id' => '500'],
     'total' => 3000.0, 'desconto' => ['valor' => 0], 'transporte' => ['frete' => 0],
     'itens' => [['id' => 'i1', 'produto' => ['id' => '7001'], 'codigo' => 'CX-001',
                  'descricao' => 'Caixa Ativa X', 'quantidade' => 2, 'valor' => 1500.0,
                  'valorCusto' => 900.0]]],
]]));
$transporte->responder('pedidos/compras', new BlingResposta(200, ['data' => []]));
$transporte->responder('/nfe', new BlingResposta(200, ['data' => [
    ['id' => '40001', 'numero' => '5001', 'serie' => '1', 'dataEmissao' => '2026-07-20',
     'valorNota' => 3000.0, 'situacao' => '4', 'pedido' => ['id' => '300001'],
     'contato' => ['id' => '500'], 'chaveAcesso' => str_repeat('1', 44)],
]]));
$transporte->responder('contas/receber', new BlingResposta(200, ['data' => [
    ['id' => '900001', 'numeroDocumento' => 'REC-1', 'contato' => ['id' => '500'],
     'vencimento' => '2026-08-20', 'valor' => 3000.0, 'situacao' => '1'],
]]));
$transporte->responder('contas/pagar', new BlingResposta(200, ['data' => []]));
$transporte->responder('canais-venda', new BlingResposta(200, ['data' => [
    ['id' => '200', 'descricao' => 'Mercado Livre', 'tipo' => 'marketplace'],
]]));

$sync = new BlingSyncService($repo, $auth);
$resultados = $sync->sincronizarTudo($accountId, 'carga_inicial', 'prova-golive');

$comErro = array_filter($resultados, static fn($r) => $r['situacao'] === 'erro');
ok('nenhum recurso falhou', $comErro === [],
   $comErro === [] ? count($resultados) . ' recursos' : implode(',', array_column($comErro, 'recurso')));

ok('produto gravado', (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_products WHERE account_id = ?', [$accountId]) === 1);
ok('pedido gravado', (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_sales_orders WHERE account_id = ?', [$accountId]) === 1);
ok('item do pedido gravado', (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_sales_order_items WHERE account_id = ?', [$accountId]) === 1);

// FK resolvida: o pedido tem que apontar para o contato REAL, não ficar nulo.
$contatoDoPedido = $repo->valor(
    'SELECT contact_id FROM bling_sales_orders WHERE account_id = ?', [$accountId]);
ok('FK do cliente resolvida no pedido', $contatoDoPedido !== null && $contatoDoPedido !== false,
   'sem isso o pedido aparece sem dono na tela');

$catDoProduto = $repo->valor(
    'SELECT category_id FROM bling_products WHERE account_id = ?', [$accountId]);
ok('FK da categoria resolvida no produto', $catDoProduto !== null && $catDoProduto !== false);

// Subtotal derivado dos ITENS — é o que garante coerência com o grid.
$subtotal = (float) $repo->valor('SELECT subtotal FROM bling_sales_orders WHERE account_id = ?', [$accountId]);
ok('subtotal derivado da soma dos itens', abs($subtotal - 3000.0) < 0.01, "R$ $subtotal");

$custo = (float) $repo->valor('SELECT custo_total FROM bling_sales_orders WHERE account_id = ?', [$accountId]);
ok('custo total derivado dos itens', abs($custo - 1800.0) < 0.01, "R$ $custo");

// Timeline da situação (§21.1).
ok('mudança de situação virou histórico', (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_sales_order_status_history WHERE account_id = ?', [$accountId]) >= 1);

// Histórico de preço — o que a Fase 3 não tinha.
ok('histórico de preço registrado', (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_price_history WHERE account_id = ?', [$accountId]) === 1,
   'é o que faz a tela §26.1 deixar de repetir o valor vigente');

// Estado da sincronização persistido com watermark.
$estado = $repo->estadoSync($accountId, 'produtos');
ok('watermark gravado', ($estado['watermark'] ?? null) !== null);
ok('situação do recurso é ok', ($estado['situacao'] ?? '') === 'ok');

// ══════════════════════════════════════════════════════════════
secao('9. Idempotência');

$antesProdutos = (int) $repo->valor('SELECT COUNT(*) FROM bling_products WHERE account_id = ?', [$accountId]);
$antesPedidos  = (int) $repo->valor('SELECT COUNT(*) FROM bling_sales_orders WHERE account_id = ?', [$accountId]);
$antesHistPreco= (int) $repo->valor('SELECT COUNT(*) FROM bling_price_history WHERE account_id = ?', [$accountId]);

$r2 = $sync->sincronizarTudo($accountId, 'carga_inicial', 'prova-golive-2');

ok('reprocessar NÃO duplica produto',
   (int) $repo->valor('SELECT COUNT(*) FROM bling_products WHERE account_id = ?', [$accountId]) === $antesProdutos);
ok('reprocessar NÃO duplica pedido',
   (int) $repo->valor('SELECT COUNT(*) FROM bling_sales_orders WHERE account_id = ?', [$accountId]) === $antesPedidos);
ok('reprocessar NÃO duplica item do pedido',
   (int) $repo->valor('SELECT COUNT(*) FROM bling_sales_order_items WHERE account_id = ?', [$accountId]) === 1);
ok('preço IGUAL não gera linha de histórico',
   (int) $repo->valor('SELECT COUNT(*) FROM bling_price_history WHERE account_id = ?', [$accountId]) === $antesHistPreco,
   'só mudança de valor entra no histórico');

$prod = array_filter($r2, static fn($x) => $x['recurso'] === 'produtos');
$prod = reset($prod);
ok('payload inalterado é IGNORADO, não reescrito', ($prod['ignorados'] ?? 0) >= 1,
   'hash igual evita UPDATE inútil');

// Preço MUDOU → tem que entrar no histórico.
$transporte->responder('/produtos', new BlingResposta(200, ['data' => [
    ['id' => '7001', 'nome' => 'Caixa Ativa X', 'codigo' => 'CX-001', 'preco' => 1699.0,
     'precoCusto' => 900.0, 'categoria' => ['id' => '55'], 'gtin' => '7890000000017',
     'unidade' => 'UN', 'marca' => 'ProLine', 'situacao' => 'A'],
]]));
$sync->sincronizar($accountId, 'produtos', 'incremental', 'prova-preco');
ok('mudança de preço ENTRA no histórico',
   (int) $repo->valor('SELECT COUNT(*) FROM bling_price_history WHERE account_id = ?', [$accountId]) === $antesHistPreco + 1);

// ══════════════════════════════════════════════════════════════
secao('10. Webhook idempotente e fila');

$fila = new BlingQueueService($repo, $sync);
$webhook = new BlingWebhookService($repo, $fila);

// Segredo de fachada só para o teste: o endpoint fica DESLIGADO sem ele.
putenv('BLING_WEBHOOK_SECRET=segredo-de-teste-nao-usar-em-producao');
$assinar = static fn(string $c): array => [
    'X-Bling-Signature' => 'sha256=' . hash_hmac('sha256', $c,
        'segredo-de-teste-nao-usar-em-producao'),
];

// ⚠️ O CENÁRIO QUE A PROVA HTTP FLAGROU:
// a versão anterior aceitava entrega sem assinatura quando o segredo não estava
// configurado. Num endpoint público, sem sessão e sem CSRF, isso deixava
// qualquer pessoa enfileirar sincronização e consumir o limite diário da API.
$corpo = json_encode(['event' => 'order.updated', 'data' => ['id' => '300001']]);
$semAssinatura = $webhook->receber($corpo, [], 'cid-anonimo');
ok('entrega SEM assinatura é RECUSADA', $semAssinatura['aceito'] === false,
   'endpoint público não pode aceitar não autenticado');

$assinaturaErrada = $webhook->receber($corpo, ['X-Bling-Signature' => 'sha256=' . str_repeat('a', 64)]);
ok('assinatura ERRADA é recusada', $assinaturaErrada['aceito'] === false);

// Assinatura de OUTRO corpo não vale para este — senão bastaria capturar uma
// entrega legítima e trocar o conteúdo.
$outra = $assinar(json_encode(['event' => 'x']));
ok('assinatura de outro corpo não é aceita',
   $webhook->receber($corpo, $outra)['aceito'] === false);

$semSegredo = null;
putenv('BLING_WEBHOOK_SECRET=');
$semSegredo = $webhook->receber($corpo, $assinar($corpo));
ok('sem BLING_WEBHOOK_SECRET o webhook fica DESLIGADO', $semSegredo['aceito'] === false,
   'incremental de 15 min e reconciliação diária cobrem o intervalo');
putenv('BLING_WEBHOOK_SECRET=segredo-de-teste-nao-usar-em-producao');

// ⚠️ Este check só passa porque a recusa NÃO ocupa a chave de idempotência da
// entrega válida. Sem esse isolamento, as quatro tentativas recusadas acima
// teriam "queimado" a chave e o Bling perderia a entrega verdadeira — vetor de
// negação de serviço que só aparece testando recusa ANTES da aceitação.
$w1 = $webhook->receber($corpo, $assinar($corpo), 'cid-teste-1');
ok('entrega legítima passa DEPOIS de recusas com o mesmo corpo', $w1['aceito'] === true && $w1['duplicado'] === false, json_encode($w1));
ok('entrega é vinculada à única conta conectada e ENFILEIRADA', $w1['fila_id'] !== null,
   'sem isso o webhook chega, é aceito e não faz nada — pior que estar desligado');

// A MESMA entrega, de novo: não pode processar duas vezes.
$w2 = $webhook->receber($corpo, $assinar($corpo), 'cid-teste-2');
ok('reentrega IDÊNTICA é detectada como duplicada', $w2['duplicado'] === true,
   'reentrega é normal em webhook, não excepcional');

// Mesmo evento e mesmo id, CONTEÚDO diferente = entrega nova.
$corpo2 = json_encode(['event' => 'order.updated', 'data' => ['id' => '300001'], 'v' => 2]);
$w3 = $webhook->receber($corpo2, $assinar($corpo2), 'cid-teste-3');
ok('mesma entidade com conteúdo NOVO não é descartada', $w3['duplicado'] === false,
   'só evento+id descartaria a segunda alteração');

$corpoInvalido = 'isto não é json';
$wInv = $webhook->receber($corpoInvalido, $assinar($corpoInvalido));
ok('corpo inválido é recusado com motivo', $wInv['aceito'] === false && $wInv['motivo'] !== null);

// Drenagem da fila.
$antesFila = $repo->resumoFila();
$dreno = $fila->drenar(10, 10);
ok('fila drenada', $dreno['processados'] > 0, "{$dreno['processados']} item(ns)");
ok('itens concluídos', $dreno['concluidos'] > 0);

// Prioridade: webhook (10) tem que sair antes de carga (50).
$repo->enfileirar($accountId, 'sync', 'produtos', null, ['estrategia' => 'carga_inicial'], 50);
$repo->enfileirar($accountId, 'webhook', 'pedidos', '300001', [], 10);
$prox = $repo->proximoDaFila();
ok('fila respeita prioridade: webhook antes de carga',
   ($prox['tipo'] ?? '') === 'webhook', 'saiu: ' . ($prox['tipo'] ?? '?'));
if ($prox) { $repo->concluirDaFila((int) $prox['id']); }

// DLQ ao esgotar tentativas.
$idFalha = $repo->enfileirar($accountId, 'tipo-invalido', 'produtos', null, [], 10);
for ($i = 1; $i <= 6; $i++) {
    $item = $repo->proximoDaFila();
    if ($item === null) break;
    $repo->falharNaFila((int) $item['id'], 'erro proposital', (int) $item['tentativas'], 5);
    // Libera o backoff para o próximo passo do teste.
    $repo->pdo()->prepare('UPDATE bling_queue SET disponivel_em = UTC_TIMESTAMP() WHERE id = ?')
        ->execute([$item['id']]);
}
$situacaoFinal = $repo->valor('SELECT situacao FROM bling_queue WHERE id = ?', [$idFalha]);
ok('item que falha sempre vai para a DLQ', $situacaoFinal === 'dlq',
   "situação: $situacaoFinal — sem DLQ ele giraria para sempre consumindo limite");

$reproc = $fila->reprocessarDlq(10, 999999);
ok('DLQ pode ser reprocessada', $reproc >= 1, "$reproc item(ns)");

// ══════════════════════════════════════════════════════════════
secao('11. Provedor real serve as telas');

putenv('BLING_PROVIDER=bling');
$real = new BlingReal($repo);

ok('provedor não é simulado', $real->ehSimulado() === false);
ok('produtos vêm do banco', count($real->colecao('produtos')) === 1);
ok('pedidos vêm do banco', count($real->colecao('pedidos')) === 1);

// O CÁLCULO é o mesmo da base — o teste é que ele funciona sobre dados reais.
$f = ['de' => '2026-07-01', 'ate' => '2026-07-31', 'periodo' => '30d', 'dias' => 31,
      'granularidade' => 'dia', 'pagina' => 1, 'limite' => 50, 'busca' => '',
      'ordenar' => '', 'direcao' => 'desc'];
$kpis = [];
foreach ($real->kpis($f) as $k) { $kpis[$k['id']] = $k; }

ok('KPI de faturamento calculado sobre o banco',
   abs($kpis['faturamento_bruto']['valor'] - 3000.0) < 0.01,
   'R$ ' . $kpis['faturamento_bruto']['valor']);
ok('KPI de pedidos calculado sobre o banco', (int) $kpis['pedidos']['valor'] === 1);

$abc = $real->curvaAbc('produtos', 'faturamento', $f);
ok('curva ABC bate com o KPI (mesma regra do mock)',
   abs($abc['total'] - $kpis['faturamento_bruto']['valor']) < 1.0,
   sprintf('ABC %.2f vs KPI %.2f', $abc['total'], $kpis['faturamento_bruto']['valor']));

// Mascaramento na ORIGEM (§62).
$contas = $real->colecao('contas');
ok('CNPJ sai mascarado do provedor',
   isset($contas[0]) && !str_contains((string) $contas[0]['cnpj_mascarado'], CNPJ_TESTE),
   $contas[0]['cnpj_mascarado'] ?? '?');

$clientes = $real->colecao('clientes');
ok('CPF do cliente sai mascarado',
   isset($clientes[0]) && !str_contains((string) $clientes[0]['documento_mascarado'], '12345678901'),
   $clientes[0]['documento_mascarado'] ?? '?');

// ══════════════════════════════════════════════════════════════
secao('12. Mock e real produzem a MESMA FORMA');

// Este é o teste que impede o bug que o Google Calendar teve: mock e banco
// calculando por caminhos diferentes e divergindo só na homologação.
$mock = new class extends BlingProviderBase {
    public function nome(): string { return 'mock'; }
    public function ehSimulado(): bool { return true; }
    public function ultimaSync(): ?string { return gmdate('c'); }
    public function colecao(string $n): array { return BlingMock::grafo()[$n] ?? []; }
};

$divergentes = [];
foreach (['produtos', 'pedidos', 'clientes', 'estoque', 'notas', 'receber',
          'compras', 'pagar', 'envios', 'canais', 'depositos', 'sync'] as $col) {
    $m = $mock->colecao($col);
    $r = $real->colecao($col);
    if ($m === [] || $r === []) { continue; }
    $faltando = array_diff(array_keys($m[0]), array_keys($r[0]));
    if ($faltando !== []) {
        $divergentes[$col] = implode(',', $faltando);
    }
}
ok('provedor real tem TODAS as chaves do mock', $divergentes === [],
   $divergentes === [] ? 'nenhuma chave faltando'
     : implode(' | ', array_map(static fn($k, $v) => "$k: $v", array_keys($divergentes), $divergentes)));

$kpisMock = array_column($mock->kpis($f), 'id');
$kpisReal = array_column($real->kpis($f), 'id');
ok('os dois provedores expõem os MESMOS KPIs', $kpisMock === $kpisReal,
   count($kpisReal) . ' indicadores');

$saudeMock = array_column($mock->saude(), 'id');
$saudeReal = array_column($real->saude(), 'id');
ok('os dois provedores expõem os MESMOS indicadores de saúde', $saudeMock === $saudeReal);

// ══════════════════════════════════════════════════════════════
secao('13. Auditoria e rastro');

ok('conexão foi auditada', (int) $repo->valor(
    "SELECT COUNT(*) FROM bling_audit_logs WHERE account_id = ? AND acao = 'oauth.conectar'",
    [$accountId]) === 1);
ok('jobs de sincronização registrados', (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_sync_jobs WHERE account_id = ?', [$accountId]) > 10);
ok('payload cru guardado para investigação', (int) $repo->valor(
    'SELECT COUNT(*) FROM bling_raw_payloads WHERE account_id = ?', [$accountId]) >= 1);

// ══════════════════════════════════════════════════════════════
secao('14. Worker (o que o cron executa)');

// Esta seção existe porque `contasAtivas()` foi escrito com uma coluna que NÃO
// existe e a suíte passou mesmo assim: nada aqui chamava o worker. Um caminho
// só coberto pelo cron é um caminho que falha às 3 da manhã, sem ninguém vendo.
ok('worker enxerga a conta conectada', in_array($accountId, $repo->contasAtivas(), true));

$repo->pdo()->prepare("UPDATE bling_accounts SET estado_conexao = 'reauth_necessaria' WHERE id = ?")
    ->execute([$accountId]);
ok('conta sem token utilizável NÃO entra na fila do cron',
   !in_array($accountId, $repo->contasAtivas(), true),
   'senão o worker enche a DLQ com falhas que só reconexão resolve');
ok('conta pulada é REPORTADA',
   in_array($accountId, array_map(static fn($c) => (int) $c['id'], $repo->contasComPendencia()), true),
   'pular em silêncio = sincronização parada que ninguém vê');
$repo->pdo()->prepare("UPDATE bling_accounts SET estado_conexao = 'conectado' WHERE id = ?")
    ->execute([$accountId]);

// Cada modo do worker, de verdade, contra o banco de verdade.
$php = PHP_BINARY;
$base = escapeshellarg(dirname(__DIR__) . '/scripts/bling-worker.php');
foreach (['fila', 'incremental', 'reconciliacao', 'dlq', 'limpeza'] as $modo) {
    exec("$php $base --modo=$modo --seco --conta=" . (int) $accountId . ' 2>&1', $saidaCmd, $rc);
    $texto = implode(' | ', $saidaCmd);
    ok("worker --modo=$modo roda sem erro", $rc === 0 && !str_contains($texto, 'ERRO'),
       trim((string) end($saidaCmd)));
    $saidaCmd = [];
}

exec("$php $base --modo=inexistente 2>&1", $saidaCmd, $rc);
ok('modo desconhecido falha com código de saída', $rc !== 0, "exit=$rc");
$saidaCmd = [];

// Expurgo de verdade: um payload vencido tem que sumir.
$repo->pdo()->prepare(
    "INSERT INTO bling_raw_payloads (account_id, recurso, bling_id, payload, payload_hash,
                                     origem, recebido_em, expira_em)
     VALUES (?, 'produtos', 'expurgo-teste', '{}', MD5('{}'), 'sync', UTC_TIMESTAMP(),
             DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY))"
)->execute([$accountId]);
$repo->expurgar();
ok('payload vencido é expurgado', (int) $repo->valor(
    "SELECT COUNT(*) FROM bling_raw_payloads WHERE bling_id = 'expurgo-teste'", []) === 0,
   'sem isso a tabela cresce sem teto — é payload cru de TODA entidade');

} catch (Throwable $e) {
    $falhou++;
    $erros[] = 'EXCEÇÃO: ' . $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine();
    printf("\n  \033[31m✘ EXCEÇÃO\033[0m %s\n     %s:%d\n",
        $e->getMessage(), basename($e->getFile()), $e->getLine());
}

// ══════════════════════════════════════════════════════════════
$limpar();
$accountId = null;   // impede a limpeza dupla no shutdown

echo "\n" . str_repeat('─', 64) . "\n";
printf("  \033[1m%d passaram\033[0m · %s\n", $passou,
    $falhou === 0 ? "\033[32m0 falharam\033[0m" : "\033[31m$falhou falharam\033[0m");
if ($falhou > 0) {
    echo "\n  Falhas:\n";
    foreach ($erros as $e) { echo "   • $e\n"; }
} else {
    echo "\n  \033[32mO caminho de go-live está provado.\033[0m\n";
    echo "  Falta apenas colar BLING_CLIENT_ID e BLING_CLIENT_SECRET no .env\n";
    echo "  e trocar BLING_PROVIDER para `bling`.\n";
}
echo "\n";

exit($falhou === 0 ? 0 : 1);
