<?php
/**
 * API Navigation Test Suite — Testes automatizados das APIs críticas
 * @version 1.0.0
 * @date 2026-03-27
 *
 * Testa os endpoints críticos do painel de administração de navegação:
 *   - GET  /api/admin/navigation/items
 *   - PATCH /api/admin/navigation/items
 *   - POST /api/admin/navigation/reorder
 *   - DELETE /api/admin/navigation/items
 *   - GET  /api/admin/health-dashboard
 *
 * Uso:
 *   php tests/api-navigation-test.php [--base-url=https://dshowdash.com.br] [--verbose]
 *
 * Requisitos:
 *   - cURL extension habilitada
 *   - Cookie de sessão válido (ou credenciais configuradas abaixo)
 */

declare(strict_types=1);

// ═══════════════════════════════════════════════════════════════
// Configuração
// ═══════════════════════════════════════════════════════════════

// Configuração EXTERNA obrigatória (P1-01, Etapa 5): base, usuário e senha vêm de um arquivo INI fora do
// webroot, legível só pelo usuário que roda o teste. SEM fallback: sem o arquivo, o teste não roda.
// Formato: tests/api-navigation-test.config.example
$cfgPath = getenv('DSHOW_NAV_TEST_CONFIG') ?: '';
if ($cfgPath === '' || !is_readable($cfgPath)) {
    fwrite(STDERR, "recusado: defina DSHOW_NAV_TEST_CONFIG com o caminho do arquivo de configuração (ver tests/api-navigation-test.config.example)\n");
    exit(2);
}
$cfg = parse_ini_file($cfgPath, false, INI_SCANNER_RAW);
if (!is_array($cfg) || empty($cfg['base_url']) || empty($cfg['login_user']) || empty($cfg['login_pass'])) {
    fwrite(STDERR, "recusado: configuração incompleta (base_url, login_user e login_pass são obrigatórios)\n");
    exit(2);
}
$baseUrl    = (string) $cfg['base_url'];
$loginUser  = (string) $cfg['login_user'];
$loginPass  = (string) $cfg['login_pass'];
unset($cfg);
$verbose    = false;

// Parse CLI args
foreach ($argv ?? [] as $arg) {
    if (str_starts_with($arg, '--base-url=')) {
        $baseUrl = substr($arg, strlen('--base-url='));
    }
    if ($arg === '--verbose' || $arg === '-v') {
        $verbose = true;
    }
}

$baseUrl = rtrim($baseUrl, '/');

// ═══════════════════════════════════════════════════════════════
// Test Framework
// ═══════════════════════════════════════════════════════════════

$results    = [];
$passed     = 0;
$failed     = 0;
$cookieFile = sys_get_temp_dir() . '/api_nav_test_cookies_' . getmypid() . '.txt';

function logMsg(string $msg, string $level = 'INFO'): void {
    global $verbose;
    $time = date('H:i:s');
    $prefix = match ($level) {
        'OK'    => "\033[32m✓\033[0m",
        'FAIL'  => "\033[31m✗\033[0m",
        'WARN'  => "\033[33m⚠\033[0m",
        'INFO'  => "\033[36mℹ\033[0m",
        default => "  ",
    };
    if ($level !== 'INFO' || $verbose) {
        echo "[{$time}] {$prefix} {$msg}\n";
    }
}

function httpRequest(string $method, string $url, ?array $body = null, array $headers = []): array {
    global $cookieFile, $verbose;

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_COOKIEFILE     => $cookieFile,
        CURLOPT_COOKIEJAR      => $cookieFile,
        CURLOPT_CUSTOMREQUEST  => strtoupper($method),
    ]);

    $defaultHeaders = ['Accept: application/json'];
    if ($body !== null) {
        $jsonBody = json_encode($body);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonBody);
        $defaultHeaders[] = 'Content-Type: application/json';
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($defaultHeaders, $headers));

    $startTime    = microtime(true);
    $responseBody = curl_exec($ch);
    $elapsed      = round((microtime(true) - $startTime) * 1000, 1);
    $httpCode     = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError    = curl_error($ch);
    curl_close($ch);

    if ($verbose) {
        logMsg("{$method} {$url} → HTTP {$httpCode} ({$elapsed}ms)", 'INFO');
    }

    return [
        'status'       => $httpCode,
        'body'         => $responseBody,
        'json'         => @json_decode((string)$responseBody, true),
        'elapsed_ms'   => $elapsed,
        'curl_error'   => $curlError,
    ];
}

function assert_test(string $name, bool $condition, string $details = ''): void {
    global $results, $passed, $failed;
    $result = [
        'name'    => $name,
        'passed'  => $condition,
        'details' => $details,
    ];
    $results[] = $result;
    if ($condition) {
        $passed++;
        logMsg("{$name}" . ($details ? " — {$details}" : ''), 'OK');
    } else {
        $failed++;
        logMsg("{$name}" . ($details ? " — {$details}" : ''), 'FAIL');
    }
}

// ═══════════════════════════════════════════════════════════════
// Autenticação
// ═══════════════════════════════════════════════════════════════

function authenticate(): bool {
    global $baseUrl, $loginUser, $loginPass;

    logMsg("Autenticando como '{$loginUser}'...", 'INFO');

    // Tentar login via API
    $loginEndpoints = [
        '/api/auth/login.php',
        '/api/login.php',
        '/api/auth.php',
    ];

    foreach ($loginEndpoints as $endpoint) {
        $resp = httpRequest('POST', $baseUrl . $endpoint, [
            'username' => $loginUser,
            'password' => $loginPass,
        ]);
        if ($resp['status'] === 200 && isset($resp['json']['ok']) && $resp['json']['ok']) {
            logMsg("Autenticado via {$endpoint}", 'OK');
            return true;
        }
        if ($resp['status'] === 200 && isset($resp['json']['success']) && $resp['json']['success']) {
            logMsg("Autenticado via {$endpoint}", 'OK');
            return true;
        }
    }

    logMsg("Falha na autenticação — testes prosseguem mas podem falhar com 401/403", 'WARN');
    return false;
}

// ═══════════════════════════════════════════════════════════════
// Test Cases
// ═══════════════════════════════════════════════════════════════

function test_get_navigation_items(): void {
    global $baseUrl;

    logMsg('─── TEST: GET /api/admin/navigation/items ───', 'INFO');

    $resp = httpRequest('GET', $baseUrl . '/api/admin/navigation/index.php');

    // HTTP Status
    assert_test(
        'GET items — HTTP 200',
        $resp['status'] === 200,
        "HTTP {$resp['status']}"
    );

    // Response time
    assert_test(
        'GET items — tempo < 3000ms',
        $resp['elapsed_ms'] < 3000,
        "{$resp['elapsed_ms']}ms"
    );

    // JSON válido
    assert_test(
        'GET items — JSON válido',
        $resp['json'] !== null,
        is_array($resp['json']) ? 'OK' : 'Parse error'
    );

    // Estrutura
    $json = $resp['json'];
    if (is_array($json)) {
        $hasOk = array_key_exists('ok', $json);
        $hasData = array_key_exists('data', $json) || array_key_exists('items', $json);
        assert_test(
            'GET items — campo "ok" presente',
            $hasOk,
            $hasOk ? "ok={$json['ok']}" : 'campo ausente'
        );
        assert_test(
            'GET items — campo "data" ou "items" presente',
            $hasData,
            $hasData ? 'OK' : 'campo ausente'
        );

        // Verificar que retorna array de itens
        $items = $json['data']['items'] ?? $json['data'] ?? $json['items'] ?? [];
        if (is_array($items) && count($items) > 0) {
            $first = $items[0];
            $hasId = isset($first['id']) || isset($first['item_key']);
            $hasLabel = isset($first['label']);
            assert_test(
                'GET items — itens têm "id"',
                $hasId,
                $hasId ? 'OK' : 'campo id ausente no primeiro item'
            );
            assert_test(
                'GET items — itens têm "label"',
                $hasLabel,
                $hasLabel ? "label={$first['label']}" : 'campo label ausente'
            );
        }
    }
}

function test_patch_navigation_item(): void {
    global $baseUrl;

    logMsg('─── TEST: PATCH /api/admin/navigation/items ───', 'INFO');

    // Primeiro, buscar um item existente para testar PATCH
    $getResp = httpRequest('GET', $baseUrl . '/api/admin/navigation/index.php');
    $items = $getResp['json']['data']['items'] ?? $getResp['json']['data'] ?? $getResp['json']['items'] ?? [];

    if (!is_array($items) || count($items) === 0) {
        logMsg('PATCH — sem itens disponíveis para testar, pulando', 'WARN');
        assert_test('PATCH items — itens disponíveis', false, 'sem itens para PATCH');
        return;
    }

    // Encontrar item que não seja divider e seja seguro para testar
    $testItem = null;
    foreach ($items as $item) {
        if (empty($item['is_divider']) && !empty($item['id'])) {
            $testItem = $item;
            break;
        }
    }

    if (!$testItem) {
        logMsg('PATCH — nenhum item testável encontrado', 'WARN');
        return;
    }

    $itemId = $testItem['id'] ?? $testItem['item_key'] ?? '';
    $sourceTable = $testItem['source_table'] ?? $testItem['sourceTable'] ?? '';
    $sourceId = $testItem['source_id'] ?? $testItem['sourceId'] ?? '';

    // PATCH: alterar descrição (campo não destrutivo)
    $originalDesc = $testItem['description'] ?? '';
    $testDesc = 'API Test ' . date('Y-m-d H:i:s');

    $patchResp = httpRequest('PATCH', $baseUrl . '/api/admin/navigation/index.php?id=' . urlencode($itemId), [
        'source_table' => $sourceTable,
        'source_id'    => $sourceId,
        'description'  => $testDesc,
    ]);

    assert_test(
        'PATCH item — HTTP 200',
        $patchResp['status'] === 200,
        "HTTP {$patchResp['status']}"
    );
    assert_test(
        'PATCH item — tempo < 3000ms',
        $patchResp['elapsed_ms'] < 3000,
        "{$patchResp['elapsed_ms']}ms"
    );
    assert_test(
        'PATCH item — JSON válido',
        $patchResp['json'] !== null,
        is_array($patchResp['json']) ? 'OK' : 'Parse error'
    );

    if ($patchResp['json'] !== null) {
        $ok = $patchResp['json']['ok'] ?? $patchResp['json']['success'] ?? false;
        assert_test(
            'PATCH item — operação OK',
            (bool)$ok,
            $ok ? 'OK' : ('Erro: ' . ($patchResp['json']['error'] ?? 'desconhecido'))
        );
    }

    // Restaurar descrição original
    if ($patchResp['status'] === 200) {
        httpRequest('PATCH', $baseUrl . '/api/admin/navigation/index.php?id=' . urlencode($itemId), [
            'source_table' => $sourceTable,
            'source_id'    => $sourceId,
            'description'  => $originalDesc,
        ]);
    }
}

function test_post_reorder(): void {
    global $baseUrl;

    logMsg('─── TEST: POST /api/admin/navigation/reorder ───', 'INFO');

    // Buscar itens para montar uma ordem válida
    $getResp = httpRequest('GET', $baseUrl . '/api/admin/navigation/index.php');
    $items = $getResp['json']['data']['items'] ?? $getResp['json']['data'] ?? $getResp['json']['items'] ?? [];

    if (!is_array($items) || count($items) < 2) {
        logMsg('REORDER — menos de 2 itens, pulando', 'WARN');
        assert_test('POST reorder — itens suficientes', false, 'menos de 2 itens');
        return;
    }

    // Pegar os primeiros 3 itens do mesmo contexto
    $byContext = [];
    foreach ($items as $item) {
        $ctx = $item['display_context'] ?? $item['section'] ?? 'sidebar';
        $byContext[$ctx][] = $item;
    }

    $testContext = '';
    $testItems = [];
    foreach ($byContext as $ctx => $ctxItems) {
        if (count($ctxItems) >= 2) {
            $testContext = $ctx;
            $testItems = array_slice($ctxItems, 0, min(3, count($ctxItems)));
            break;
        }
    }

    if (count($testItems) < 2) {
        logMsg('REORDER — sem contexto com 2+ itens', 'WARN');
        return;
    }

    // Enviar a mesma ordem (teste não destrutivo)
    $order = [];
    foreach ($testItems as $idx => $item) {
        $order[] = [
            'id'           => $item['id'] ?? $item['item_key'] ?? '',
            'source_table' => $item['source_table'] ?? $item['sourceTable'] ?? '',
            'source_id'    => $item['source_id'] ?? $item['sourceId'] ?? '',
            'order_index'  => $idx,
        ];
    }

    $resp = httpRequest('POST', $baseUrl . '/api/admin/navigation/reorder.php', [
        'items' => $order,
    ]);

    assert_test(
        'POST reorder — HTTP 200',
        $resp['status'] === 200,
        "HTTP {$resp['status']}"
    );
    assert_test(
        'POST reorder — tempo < 3000ms',
        $resp['elapsed_ms'] < 3000,
        "{$resp['elapsed_ms']}ms"
    );
    assert_test(
        'POST reorder — JSON válido',
        $resp['json'] !== null,
        is_array($resp['json']) ? 'OK' : 'Parse error'
    );

    if ($resp['json'] !== null) {
        $ok = $resp['json']['ok'] ?? $resp['json']['success'] ?? false;
        assert_test(
            'POST reorder — operação OK',
            (bool)$ok,
            $ok ? 'OK' : ('Erro: ' . ($resp['json']['error'] ?? 'desconhecido'))
        );
    }
}

function test_delete_navigation_item(): void {
    global $baseUrl;

    logMsg('─── TEST: DELETE /api/admin/navigation/items ───', 'INFO');

    // Criar item temporário para deletar
    $tempItem = [
        'item_key'        => '_api_test_temp_' . time(),
        'label'           => 'API Test Temp Item',
        'display_context' => 'sidebar',
        'route_path'      => '#/test-api-temp',
        'order_index'     => 9999,
        'min_level'       => 100,
        'is_active'       => 0,
        'description'     => 'Item temporário para teste de DELETE',
    ];

    $createResp = httpRequest('POST', $baseUrl . '/api/admin/navigation/index.php', $tempItem);

    if ($createResp['status'] !== 200 && $createResp['status'] !== 201) {
        logMsg("DELETE — não foi possível criar item temp (HTTP {$createResp['status']}), testando sem criar", 'WARN');
        // Testar DELETE com ID inexistente (espera 404 ou erro)
        $resp = httpRequest('DELETE', $baseUrl . '/api/admin/navigation/index.php?id=_nonexistent_test_item_999');
        assert_test(
            'DELETE item inexistente — não é 500',
            $resp['status'] !== 500,
            "HTTP {$resp['status']}"
        );
        assert_test(
            'DELETE item — JSON válido',
            $resp['json'] !== null,
            is_array($resp['json']) ? 'OK' : 'Parse error'
        );
        return;
    }

    // Extrair ID do item criado
    $createdId = $createResp['json']['data']['id'] ?? $createResp['json']['id'] ?? $tempItem['item_key'];
    $sourceTable = $createResp['json']['data']['source_table'] ?? 'ui_nav_items';
    $sourceId = $createResp['json']['data']['source_id'] ?? $createResp['json']['data']['id'] ?? '';

    assert_test(
        'DELETE — item temp criado',
        $createResp['status'] === 200 || $createResp['status'] === 201,
        "item_key={$tempItem['item_key']}"
    );

    // Agora deletar
    $deleteUrl = $baseUrl . '/api/admin/navigation/index.php?id=' . urlencode((string)$createdId)
        . '&source_table=' . urlencode($sourceTable)
        . '&source_id=' . urlencode((string)$sourceId);
    $resp = httpRequest('DELETE', $deleteUrl);

    assert_test(
        'DELETE item — HTTP 200',
        $resp['status'] === 200,
        "HTTP {$resp['status']}"
    );
    assert_test(
        'DELETE item — tempo < 3000ms',
        $resp['elapsed_ms'] < 3000,
        "{$resp['elapsed_ms']}ms"
    );
    assert_test(
        'DELETE item — JSON válido',
        $resp['json'] !== null,
        is_array($resp['json']) ? 'OK' : 'Parse error'
    );

    if ($resp['json'] !== null) {
        $ok = $resp['json']['ok'] ?? $resp['json']['success'] ?? false;
        assert_test(
            'DELETE item — operação OK',
            (bool)$ok,
            $ok ? 'OK' : ('Erro: ' . ($resp['json']['error'] ?? 'desconhecido'))
        );
    }
}

function test_get_health_dashboard(): void {
    global $baseUrl;

    logMsg('─── TEST: GET /api/admin/health-dashboard ───', 'INFO');

    $resp = httpRequest('GET', $baseUrl . '/api/admin/health-dashboard.php');

    assert_test(
        'GET health — HTTP 200',
        $resp['status'] === 200,
        "HTTP {$resp['status']}"
    );
    assert_test(
        'GET health — tempo < 3000ms',
        $resp['elapsed_ms'] < 3000,
        "{$resp['elapsed_ms']}ms"
    );
    assert_test(
        'GET health — JSON válido',
        $resp['json'] !== null,
        is_array($resp['json']) ? 'OK' : 'Parse error'
    );

    $json = $resp['json'];
    if (is_array($json)) {
        $hasOk = array_key_exists('ok', $json);
        assert_test(
            'GET health — campo "ok" presente',
            $hasOk,
            $hasOk ? "ok={$json['ok']}" : 'campo ausente'
        );

        $data = $json['data'] ?? [];
        if (is_array($data)) {
            $hasSummary = isset($data['summary']);
            assert_test(
                'GET health — campo "summary" presente',
                $hasSummary,
                $hasSummary ? 'OK' : 'campo ausente'
            );

            if ($hasSummary && is_array($data['summary'])) {
                $summary = $data['summary'];
                assert_test(
                    'GET health — summary.total_items é numérico',
                    isset($summary['total_items']) && is_numeric($summary['total_items']),
                    "total_items=" . ($summary['total_items'] ?? 'N/A')
                );
                assert_test(
                    'GET health — summary.active_items é numérico',
                    isset($summary['active_items']) && is_numeric($summary['active_items']),
                    "active_items=" . ($summary['active_items'] ?? 'N/A')
                );
                assert_test(
                    'GET health — summary.coverage é numérico',
                    isset($summary['coverage']) && is_numeric($summary['coverage']),
                    "coverage=" . ($summary['coverage'] ?? 'N/A') . '%'
                );
            }

            $hasByContext = isset($data['by_context']);
            assert_test(
                'GET health — campo "by_context" presente',
                $hasByContext,
                $hasByContext ? 'OK' : 'campo ausente'
            );
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Execução
// ═══════════════════════════════════════════════════════════════

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════╗\n";
echo "║  API Navigation Test Suite v1.0.0                           ║\n";
echo "║  Base URL: {$baseUrl}                                        \n";
echo "║  Data: " . date('Y-m-d H:i:s') . "                                     \n";
echo "╚═══════════════════════════════════════════════════════════════╝\n\n";

$authenticated = authenticate();

echo "\n";
test_get_navigation_items();
echo "\n";
test_patch_navigation_item();
echo "\n";
test_post_reorder();
echo "\n";
test_delete_navigation_item();
echo "\n";
test_get_health_dashboard();

// Cleanup
if (file_exists($cookieFile)) {
    @unlink($cookieFile);
}

// ═══════════════════════════════════════════════════════════════
// Relatório Final
// ═══════════════════════════════════════════════════════════════

echo "\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  RESULTADO FINAL\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "  Total:    " . count($results) . " testes\n";
echo "  \033[32mPassed:\033[0m  {$passed}\n";
echo "  \033[31mFailed:\033[0m  {$failed}\n";
echo "  Auth:     " . ($authenticated ? 'OK' : 'FAILED') . "\n";
echo "═══════════════════════════════════════════════════════════════\n";

if ($failed > 0) {
    echo "\n\033[31mTestes falharam:\033[0m\n";
    foreach ($results as $r) {
        if (!$r['passed']) {
            echo "  ✗ {$r['name']}" . ($r['details'] ? " — {$r['details']}" : '') . "\n";
        }
    }
}

echo "\n";

// Exit code para CI/CD
exit($failed > 0 ? 1 : 0);
