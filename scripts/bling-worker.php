<?php
// scripts/bling-worker.php — consumidor da fila e agendador do Bling
// @version 1.0.0  @created 2026-07-30
//
//     php scripts/bling-worker.php --modo=fila          drena a fila
//     php scripts/bling-worker.php --modo=incremental   agenda o que venceu
//     php scripts/bling-worker.php --modo=reconciliacao varredura completa
//     php scripts/bling-worker.php --modo=dlq           reprocessa a DLQ
//     php scripts/bling-worker.php --modo=limpeza       expurga o que venceu
//
// Opções: --conta=ID (padrão: todas ativas) · --limite=N · --segundos=N · --seco
//
// ⚠️ NÃO DESCARTAR A SAÍDA NO CRON.
// Neste servidor, dois dos três crons de warm-cache davam 404/401 havia 14 dias
// e ninguém viu — justamente os que faziam `>/dev/null`. Aqui a saída vai para
// /var/log/bling-worker.log e o modo silencioso só cala o que foi bem-sucedido.
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

// Script CLI é entrada legítima do módulo — os internals exigem esta
// constante para recusar execução direta por HTTP.
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

// ── argumentos ────────────────────────────────────────────────
$opt = getopt('', ['modo:', 'conta:', 'limite:', 'segundos:', 'seco', 'ajuda']);
if (isset($opt['ajuda'])) {
    echo file_get_contents(__FILE__, false, null, 0, 900); exit(0);
}
$modo     = (string) ($opt['modo'] ?? 'fila');
$limite   = (int) ($opt['limite'] ?? 50);
$segundos = (int) ($opt['segundos'] ?? 240);
$seco     = isset($opt['seco']);
$contaOpt = isset($opt['conta']) ? (int) $opt['conta'] : null;

$correlationId = 'cron-' . $modo . '-' . bin2hex(random_bytes(4));

function dizer(string $m): void {
    fwrite(STDOUT, sprintf("[%s] %s\n", gmdate('Y-m-d H:i:s') . 'Z', $m));
}
function reclamar(string $m): void {
    fwrite(STDERR, sprintf("[%s] ERRO %s\n", gmdate('Y-m-d H:i:s') . 'Z', $m));
}

// ── trava: duas execuções simultâneas brigariam pela fila ─────
// Diretório próprio, NÃO /tmp: lá o arquivo pode ter sido criado por outro
// usuário (foi o que aconteceu — criado por root, www-data sem acesso).
$dirTrava = '/var/lib/bling';
$arqTrava = $dirTrava . '/worker-' . $modo . '.lock';
$trava = @fopen($arqTrava, 'c');

if ($trava === false) {
    // ⚠️ NÃO tratar como "já está rodando".
    // Confundir os dois casos faria o cron sair com 0 para sempre, e a
    // sincronização pararia sem nenhum sinal — que é como o problema mais caro
    // deste servidor começou.
    reclamar("não consegui abrir a trava $arqTrava — conferir dono/permissão de $dirTrava");
    exit(1);
}
if (!flock($trava, LOCK_EX | LOCK_NB)) {
    // Aqui sim: outra rodada está em andamento. SKIP LOCKED já impede pegar o
    // mesmo item, mas duas rodadas concorrentes dobram o consumo do limite
    // diário da API sem entregar nada a mais.
    dizer("modo=$modo já está rodando — saindo sem fazer nada");
    exit(0);
}

$inicio = microtime(true);
$saida = 0;

try {
    $repo = new BlingRepository();

    if (!$repo->disponivel()) {
        reclamar('banco BLING inacessível — conferir DB_BLING_* no .env');
        exit(1);
    }
    if (!$repo->schemaAplicado()) {
        reclamar('schema não aplicado — rodar docs/BLING/02-banco-BLING.sql');
        exit(1);
    }
    if (!BlingCrypto::disponivel()) {
        reclamar('BLING_CRYPTO_KEY ausente — sem ela não há como ler os tokens');
        exit(1);
    }

    // Conta ativa mas sem token utilizável não entra na lista — só reconexão
    // manual resolve. Mas tem que APARECER, senão vira sincronização parada em
    // silêncio: o dono continuaria olhando número velho achando que é o de hoje.
    foreach ($repo->contasComPendencia() as $c) {
        reclamar(sprintf('conta %d (%s) PULADA: estado=%s — reconectar em Administração › Integrações',
            $c['id'], $c['nome'], $c['estado_conexao']));
        $saida = 1;
    }

    $contas = $contaOpt !== null ? [$contaOpt] : $repo->contasAtivas();
    if ($contas === []) {
        // Não é erro: antes do go-live é o estado esperado. Mas registra, para
        // que "o cron roda e não faz nada" não vire mistério daqui a um mês.
        dizer('nenhuma conta conectada — nada a fazer');
        exit($saida);
    }

    $auth  = new BlingAuthService($repo, new BlingTransporteCurl());
    $sync  = new BlingSyncService($repo, $auth);
    $fila  = new BlingQueueService($repo, $sync);

    switch ($modo) {

        // ── drena a fila ────────────────────────────────────────
        case 'fila': {
            if ($seco) {
                $r = $repo->resumoFila();
                dizer(sprintf('SECO: %d pendente(s), %d processando, %d dlq',
                    $r['pendente'] ?? 0, $r['processando'] ?? 0, $r['dlq'] ?? 0));
                break;
            }
            $r = $fila->drenar($limite, $segundos);
            dizer(sprintf('fila: %d processado(s), %d concluído(s), %d falha(s) em %.1fs',
                $r['processados'], $r['concluidos'], $r['falhas'], microtime(true) - $inicio));
            if ($r['falhas'] > 0) { $saida = 1; }
            break;
        }

        // ── agenda o incremental do que venceu ──────────────────
        case 'incremental': {
            $agendados = 0;
            foreach ($contas as $conta) {
                foreach (array_keys(BlingSyncService::RECURSOS) as $recurso) {
                    $estado = $repo->estadoSync($conta, $recurso);

                    // Recurso nunca sincronizado espera a carga inicial, que é
                    // disparada pela tela — não pelo cron. Enfileirar carga
                    // completa automaticamente pode estourar o limite diário.
                    if ($estado === null) { continue; }

                    $prox = $estado['proxima_execucao_em'] ?? null;
                    if ($prox !== null && strtotime((string) $prox . ' UTC') > time()) { continue; }

                    if ($seco) { $agendados++; continue; }
                    // Prioridade 30: atrás de webhook (10), à frente de carga (50).
                    $repo->enfileirar($conta, 'sync', $recurso, null,
                        ['estrategia' => 'incremental', 'correlation_id' => $correlationId], 30);
                    $agendados++;
                }
            }
            dizer(($seco ? 'SECO: ' : '') . "incremental: $agendados recurso(s) agendado(s)");
            break;
        }

        // ── rede de segurança: varredura completa ───────────────
        case 'reconciliacao': {
            $agendados = 0;
            foreach ($contas as $conta) {
                foreach (array_keys(BlingSyncService::RECURSOS) as $recurso) {
                    if ($seco) { $agendados++; continue; }
                    // Prioridade 60: é a mais baixa de propósito. Reconciliação
                    // nunca deve atrasar webhook nem incremental.
                    $repo->enfileirar($conta, 'sync', $recurso, null,
                        ['estrategia' => 'reconciliacao', 'correlation_id' => $correlationId], 60);
                    $agendados++;
                }
            }
            dizer(($seco ? 'SECO: ' : '') . "reconciliação: $agendados recurso(s) agendado(s)");
            break;
        }

        // ── devolve a DLQ para a fila ──────────────────────────
        case 'dlq': {
            if ($seco) {
                $r = $repo->resumoFila();
                dizer(sprintf('SECO: %d item(ns) na DLQ', $r['dlq'] ?? 0));
                break;
            }
            $total = 0;
            foreach ($contas as $conta) { $total += $fila->reprocessarDlq($limite, $conta); }
            dizer("dlq: $total item(ns) devolvido(s) para a fila");
            break;
        }

        // ── expurgo por retenção ───────────────────────────────
        case 'limpeza': {
            if ($seco) { dizer('SECO: nada apagado'); break; }
            $r = $repo->expurgar();
            dizer('limpeza: ' . json_encode($r, JSON_UNESCAPED_UNICODE));
            break;
        }

        default:
            reclamar("modo desconhecido: $modo (fila|incremental|reconciliacao|dlq|limpeza)");
            $saida = 2;
    }

} catch (Throwable $e) {
    reclamar($e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine());
    $saida = 1;
} finally {
    flock($trava, LOCK_UN);
    fclose($trava);
}

exit($saida);
