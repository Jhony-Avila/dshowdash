<?php
// scripts/bling-golive.php — o go-live está pronto? sai 0 ou 1
// @version 1.0.0  @created 2026-07-30  (Fase 5)
//
//     php scripts/bling-golive.php
//
// Não testa nada: CONFERE. Cada item é medido no ambiente de verdade e, quando
// falha, diz exatamente o que fazer. Sai 0 quando pode virar a chave.
//
// Mesma ideia do `gcal-golive.php`: o dia do go-live é o pior momento para
// descobrir que falta uma variável de ambiente.
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
require_once $raiz . '/api/bling/lib/BlingCrypto.php';
require_once $raiz . '/api/bling/lib/BlingTransporte.php';
require_once $raiz . '/api/bling/lib/BlingOAuth.php';
require_once $raiz . '/api/bling/lib/BlingVersionAdapter.php';
require_once $raiz . '/api/bling/lib/BlingNormalizer.php';
require_once $raiz . '/api/bling/repositories/BlingRepository.php';
require_once $raiz . '/api/bling/lib/BlingClient.php';
require_once $raiz . '/api/bling/services/BlingAuthService.php';
require_once $raiz . '/api/bling/services/BlingSyncService.php';
require_once $raiz . '/api/bling/services/BlingQueueService.php';
require_once $raiz . '/api/bling/services/BlingWebhookService.php';

// ⚠️ CNPJ reservado das suítes de teste. As contas criadas pela homologação são
// apagadas ao final, mas se este script rodar DURANTE uma suíte ele veria a
// conta de teste e diria "conta conectada" — falso positivo justamente no
// item que o dono mais precisa que seja verdade.
const CNPJ_DE_TESTE = '00000000000191';

$pronto = []; $falta = []; $opcional = [];

function item(string $rotulo, bool $ok, string $detalhe, string $acao = '', bool $obrigatorio = true): void
{
    global $pronto, $falta, $opcional;
    if ($ok) {
        $pronto[] = [$rotulo, $detalhe];
        printf("  \033[32m✔\033[0m %-42s %s\n", $rotulo, $detalhe);
        return;
    }
    if ($obrigatorio) {
        $falta[] = [$rotulo, $detalhe, $acao];
        printf("  \033[31m✘\033[0m %-42s %s\n", $rotulo, $detalhe);
    } else {
        $opcional[] = [$rotulo, $detalhe, $acao];
        printf("  \033[33m○\033[0m %-42s %s\n", $rotulo, $detalhe);
    }
}
function secao(string $t): void { printf("\n\033[1m%s\033[0m\n", $t); }

printf("\n\033[1mBling — prontidão para go-live\033[0m   %s UTC\n", gmdate('Y-m-d H:i'));

$repo = new BlingRepository();

// ── infraestrutura ────────────────────────────────────────────
secao('Infraestrutura');

$bancoOk = $repo->disponivel();
item('Banco BLING acessível', $bancoOk,
    $bancoOk ? 'conectado como ' . BlingRepository::configuracao()['user'] : 'sem conexão',
    'Conferir DB_BLING_HOST/PORT/NAME/USER/PASS no .env. Lembre que o MySQL trata '
    . 'localhost e 127.0.0.1 como hosts DIFERENTES.');

$schemaOk = $bancoOk && $repo->schemaAplicado();
item('Schema aplicado', $schemaOk,
    $schemaOk ? $repo->contarTabelas() . ' tabelas' : 'incompleto',
    'mysql BLING < docs/BLING/02-banco-BLING.sql');

if ($bancoOk) {
    $semDdl = !$repo->consegueDdl();
    item('Usuário do banco sem DDL', $semDdl,
        $semDdl ? 'CREATE TABLE recusado, como deve ser' : 'PERIGO: consegue alterar o schema',
        'REVOKE do DDL. Manter só SELECT, INSERT, UPDATE, DELETE em BLING.*');
}

$cifraOk = BlingCrypto::disponivel() && BlingCrypto::autoteste();
item('Cifra dos tokens', $cifraOk,
    $cifraOk ? 'AES-256-GCM, autoteste OK' : 'BLING_CRYPTO_KEY ausente ou inválida',
    'openssl rand -hex 32  → gravar em BLING_CRYPTO_KEY no .env');

$cronOk = is_readable('/etc/cron.d/bling');
item('Cron instalado', $cronOk, $cronOk ? '/etc/cron.d/bling' : 'ausente',
    'Instalar /etc/cron.d/bling (fila, incremental, reconciliação, DLQ, expurgo).');

$logOk = is_writable('/var/log/bling-worker.log') || is_writable('/var/log');
item('Log do worker gravável', $logOk,
    $logOk ? '/var/log/bling-worker.log' : 'sem permissão',
    'touch /var/log/bling-worker.log && chown www-data:adm && chmod 640');

$travaOk = is_dir('/var/lib/bling') && is_writable('/var/lib/bling');
item('Diretório da trava do worker', $travaOk,
    $travaOk ? '/var/lib/bling' : 'ausente ou sem permissão',
    'install -d -o www-data -g www-data -m 750 /var/lib/bling');

// ── credenciais ───────────────────────────────────────────────
secao('Credenciais (é o que depende de você)');

$clientId = BlingOAuth::clientId();
$clientSecret = BlingOAuth::clientSecret();

item('BLING_CLIENT_ID', $clientId !== '',
    $clientId !== '' ? substr($clientId, 0, 6) . '…' : 'ausente',
    'Bling › Preferências › Integrações › API › Meus aplicativos');
item('BLING_CLIENT_SECRET', $clientSecret !== '',
    $clientSecret !== '' ? 'presente (' . strlen($clientSecret) . ' caracteres)' : 'ausente',
    'Mesma tela do client_id. NUNCA versionar nem colar em chat.');

$redirect = getenv('BLING_REDIRECT_URI') ?: ($_ENV['BLING_REDIRECT_URI'] ?? '');
$redirectOk = is_string($redirect) && str_starts_with($redirect, 'https://')
    && str_contains($redirect, '/api/bling/oauth/callback');
item('BLING_REDIRECT_URI', $redirectOk, $redirectOk ? $redirect : ($redirect ?: 'ausente'),
    'Tem que ser https://dshowdash.com.br/api/bling/oauth/callback e estar '
    . 'CADASTRADA IGUAL no aplicativo do Bling — diferença de barra final já derruba o fluxo.');

$segredoWh = BlingWebhookService::segredo();
item('BLING_WEBHOOK_SECRET', $segredoWh !== '',
    $segredoWh !== '' ? 'presente — webhook habilitado' : 'ausente — webhook DESLIGADO',
    'Opcional. Sem ele, o atraso máximo é o do incremental (15 min); '
    . 'as entregas do Bling são recusadas por falta de assinatura.',
    false);

// ── conexão ───────────────────────────────────────────────────
secao('Conexão');

if ($schemaOk) {
    $deTeste = array_map(static fn($c) => (int) $c['id'], $repo->consultar(
        'SELECT id FROM bling_accounts WHERE cnpj = ?', [CNPJ_DE_TESTE]));
    if ($deTeste !== []) {
        printf("  \033[33m!\033[0m %d conta(s) de TESTE no banco — ignoradas aqui. "
            . "Uma suíte está rodando agora?\n", count($deTeste));
    }
    $conectadas = array_values(array_diff($repo->contasAtivas(), $deTeste));
    item('Conta Bling conectada', $conectadas !== [],
        $conectadas !== [] ? count($conectadas) . ' conta(s)' : 'nenhuma',
        'Administração › Integrações › Conectar. Exige as credenciais acima.');

    foreach ($repo->contasComPendencia() as $c) {
        if (in_array((int) $c['id'], $deTeste, true)) { continue; }
        item("Conta “{$c['nome']}”", false, "estado: {$c['estado_conexao']}",
            'Reconectar em Administração › Integrações — o cron pula esta conta.');
    }

    if ($conectadas !== []) {
        $conta = $conectadas[0];
        $tokens = $repo->tokens($conta);
        $temToken = ($tokens['access_token'] ?? null) !== null;
        item('Token legível', $temToken,
            $temToken ? 'decifrado com sucesso' : 'não foi possível decifrar',
            'BLING_CRYPTO_KEY mudou depois de gravar os tokens? Reconectar resolve.');

        $recursos = 0; $comWatermark = 0;
        foreach (array_keys(BlingSyncService::RECURSOS) as $r) {
            $e = $repo->estadoSync($conta, $r);
            if ($e !== null) { $recursos++; if (($e['watermark'] ?? null) !== null) { $comWatermark++; } }
        }
        item('Carga inicial executada', $comWatermark >= count(BlingSyncService::RECURSOS),
            "$comWatermark de " . count(BlingSyncService::RECURSOS) . ' recursos com watermark',
            'Administração › Sincronização › Executar carga inicial.');
    }
}

// ── provedor ──────────────────────────────────────────────────
secao('Provedor');

$provider = strtolower(trim((string) (getenv('BLING_PROVIDER') ?: 'mock')));
$temDados = $schemaOk && ($conectadas ?? []) !== []
    && (int) $repo->valor(
        'SELECT COUNT(*) FROM bling_sales_orders WHERE account_id IN ('
        . implode(',', array_map('intval', $conectadas ?: [0])) . ')') > 0;

// ⚠️ Virar a chave ANTES da carga mostraria telas vazias ao dono, que leria
// isso como "o módulo não funciona" — e estaria olhando um banco vazio, não um
// defeito. A ordem é: conectar → carga → só então trocar o provedor.
item('BLING_PROVIDER', $provider === 'bling',
    "atualmente `$provider`" . ($provider === 'mock' ? ' (dados simulados)' : ''),
    $temDados
        ? 'Trocar para `bling` no .env. O banco já tem dados — pode virar a chave.'
        : 'NÃO trocar ainda: sem carga inicial as telas ficariam vazias. '
        . 'Conectar e carregar primeiro.');

// ── resumo ────────────────────────────────────────────────────
echo "\n" . str_repeat('─', 70) . "\n";

if ($falta === []) {
    printf("  \033[32m✔ PRONTO PARA GO-LIVE\033[0m — %d itens conferidos\n", count($pronto));
    if ($opcional !== []) {
        echo "\n  Opcionais não configurados (não bloqueiam):\n";
        foreach ($opcional as [$r, $d, $a]) { printf("   ○ %s — %s\n     %s\n", $r, $d, $a); }
    }
    echo "\n  Antes de virar a chave, rode a homologação:\n";
    echo "    bash scripts/bling-check-all.sh\n\n";
    echo "  Para voltar atrás: BLING_PROVIDER=mock. Nada é apagado.\n\n";
    exit(0);
}

printf("  \033[31m✘ FALTAM %d item(ns)\033[0m — %d já prontos\n\n", count($falta), count($pronto));
foreach ($falta as $i => [$rotulo, $detalhe, $acao]) {
    printf("  %d. \033[1m%s\033[0m — %s\n     → %s\n\n", $i + 1, $rotulo, $detalhe, $acao);
}
if ($opcional !== []) {
    echo "  Opcionais (não bloqueiam):\n";
    foreach ($opcional as [$r, $d, $a]) { printf("   ○ %s — %s\n", $r, $d); }
    echo "\n";
}
exit(1);
