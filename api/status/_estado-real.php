<?php
declare(strict_types=1);
// ═══════════════════════════════════════════════════════════════
// api/status/_estado-real.php — ESTADO REAL dos 22 cartões de status (23/11/2026)
// ───────────────────────────────────────────────────────────────
// Antes: cada endpoint tinha `$isConfigured = false;` FIXO e dizia "não configurado" até para o que funciona (Pipedrive, Calendar,
// Bling). Agora:
//   · Pipedrive / Calendar / Bling → lidos das tabelas de sincronização (só SELECT): última sincronização com sucesso + erro atual;
//   · integrações que NÃO existem no Dash → 'nao_integrado' (é o estado real), com o motivo;
//   · Google Ads → 'simulado' quando ADS_PROVIDER=mock (a variável é lida pelo processo, como o próprio módulo faz);
//   · cartões sem fonte de dados → 'sem_fonte'.
// SEGURANÇA: os endpoints de status são públicos (só CORS). Sem sessão válida a resposta traz só a situação; com sessão
// (SessionGate::readOnly, sem emitir cookie) traz também a última sincronização e o erro atual — como CÓDIGO e texto NOSSO, nunca o
// texto cru da API externa. O cache Redis guarda o estado interno (60 s), nunca a resposta de uma sessão.
// Contrato preservado: {ok, data:{status, configured, message, integration, timestamp}}; 'online' só quando a sincronização está em dia.
// ═══════════════════════════════════════════════════════════════

require_once __DIR__ . '/../core/SessionGate.php';   // só readOnly(): lê a sessão sem emitir cookie

final class StatusEstadoReal
{
    public const VERSAO = '1.0.0';
    private const CACHE_TTL = 60;
    private const ULTIMO_VALIDO_TTL = 7 * 86400;   // último estado válido, mostrado quando a leitura falha

    /** minutos sem sincronização com sucesso a partir dos quais o cartão fica 'atrasado' */
    private const ATRASO_MIN = ['pipedrive' => 30, 'calendar' => 30, 'bling' => 45];

    /** integrações que não existem no Dash (nenhum código, credencial ou sincronização) */
    private const NAO_INTEGRADO = [
        'mercadolivre'  => 'Não há integração com o Mercado Livre no Dash. As vendas do Mercado Livre podem chegar pelos canais de venda do Bling.',
        'lojaintegrada' => 'Não há integração com a Loja Integrada no Dash. As vendas podem chegar pelos canais de venda do Bling.',
        'asaas'         => 'Não há integração com o Asaas no Dash.',
        'payments'      => 'Não há gateway de pagamentos integrado ao Dash.',
        'googledrive'   => 'Não há integração com o Google Drive no Dash.',
        'chatgpt'       => 'Não há integração com o ChatGPT ligada a este cartão.',
        'alfinete'      => 'Não há integração com o Alfinete no Dash.',
    ];

    /** cartões que não são integração e ainda não têm fonte de dados */
    private const SEM_FONTE = [
        'bookmarks' => 'favoritos', 'support' => 'suporte', 'files' => 'arquivos', 'goals' => 'metas', 'links' => 'links',
        'cloud' => 'nuvem', 'monitor' => 'monitoramento', 'logs' => 'logs', 'network' => 'rede', 'web' => 'web', 'email' => 'e-mail',
    ];

    public static function cartoes(): array
    {
        return array_merge(['pipedrive', 'calendar', 'bling', 'adwords'], array_keys(self::NAO_INTEGRADO), array_keys(self::SEM_FONTE));
    }

    // ── núcleo testável: estado interno (completo) a partir das conexões ─────────────────────────────────────

    /**
     * @param callable(string):PDO $conexao 'PIPE_DSHOW' | 'GCAL_DSHOW' | 'BLING'
     * @return array{estado:string,integrado:bool,ultima_ok:?string,erro:?array{codigo:string,mensagem:string},problemas:array<int,string>,fonte:?string}
     */
    public static function estado(string $cartao, callable $conexao, ?int $agora = null): array
    {
        $agora ??= time();
        $base = ['estado' => 'sem_fonte', 'integrado' => false, 'ultima_ok' => null, 'erro' => null, 'problemas' => [], 'fonte' => null];
        if (isset(self::NAO_INTEGRADO[$cartao])) { return ['estado' => 'nao_integrado'] + $base; }
        if (isset(self::SEM_FONTE[$cartao])) { return $base; }
        if ($cartao === 'adwords') {
            $p = (string) (getenv('ADS_PROVIDER') ?: ($_ENV['ADS_PROVIDER'] ?? ''));
            return ['estado' => $p === '' || $p === 'mock' ? 'simulado' : 'nao_verificado', 'fonte' => 'api/ads'] + $base;
        }
        return match ($cartao) {
            'pipedrive' => self::pipedrive($conexao('PIPE_DSHOW'), $agora),
            'calendar'  => self::calendar($conexao('GCAL_DSHOW'), $agora),
            'bling'     => self::bling($conexao('BLING'), $agora),
            default     => throw new InvalidArgumentException('cartão desconhecido'),
        };
    }

    private static function pipedrive(PDO $pdo, int $agora): array
    {
        // pipe_sync_runs grava hora LOCAL do servidor (o mesmo relógio do log do cron)
        $ok = $pdo->query("SELECT MAX(finished_at) FROM pipe_sync_runs WHERE status = 'completed'")->fetchColumn() ?: null;
        $ult = $pdo->query('SELECT status FROM pipe_sync_runs ORDER BY id DESC LIMIT 1')->fetchColumn();
        $http = $pdo->query("SELECT http_status FROM pipe_api_requests WHERE result = 'error' AND http_status <> 404
                              AND created_at > NOW() - INTERVAL 1 HOUR ORDER BY id DESC LIMIT 1")->fetchColumn();
        $erro = null;
        if ($ult !== false && $ult !== null && $ult !== 'completed') {
            $erro = ['codigo' => 'SYNC_' . strtoupper((string) $ult), 'mensagem' => 'A última sincronização do Pipedrive não terminou.'];
        } elseif ($http !== false && $http !== null) {
            $erro = ['codigo' => 'HTTP_' . (int) $http, 'mensagem' => 'O Pipedrive recusou chamadas na última hora.'];
        }
        return self::fechar('PIPE_DSHOW', self::iso($ok, date_default_timezone_get()), $erro, [], $agora, 'pipedrive');
    }

    private static function calendar(PDO $pdo, int $agora): array
    {
        $conta = $pdo->query('SELECT connection_status FROM gcal_accounts WHERE is_active = 1 ORDER BY is_default DESC, id LIMIT 1')->fetchColumn();
        if ($conta === false) {
            return ['estado' => 'nao_conectado', 'integrado' => true, 'ultima_ok' => null, 'problemas' => [], 'fonte' => 'GCAL_DSHOW',
                    'erro' => ['codigo' => 'SEM_CONTA', 'mensagem' => 'Nenhuma conta do Google Calendar conectada.']];
        }
        $ok = $pdo->query('SELECT MAX(finished_at) FROM gcal_sync_runs WHERE errors_n = 0')->fetchColumn() ?: null;   // UTC
        $e = $pdo->query('SELECT http_status, error_code FROM gcal_sync_errors WHERE occurred_at > UTC_TIMESTAMP() - INTERVAL 1 DAY
                          ORDER BY id DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC) ?: null;
        $erro = null;
        if ($conta !== 'connected') {
            $erro = ['codigo' => 'CONTA_' . strtoupper((string) $conta), 'mensagem' => 'A conta do Google Calendar precisa ser reconectada.'];
        } elseif ($e !== null) {
            $cod = preg_replace('/[^A-Za-z0-9_]/', '', (string) ($e['error_code'] ?? '')) ?: ('HTTP_' . (int) ($e['http_status'] ?? 0));
            $erro = ['codigo' => substr($cod, 0, 40), 'mensagem' => 'Houve falha de sincronização do Google Calendar nas últimas 24 h.'];
        }
        return self::fechar('GCAL_DSHOW', self::iso($ok, 'UTC'), $erro, [], $agora, 'calendar');
    }

    private const BLING_RECURSO = ['canais' => 'canais de venda', 'contatos' => 'contatos', 'fornecedores' => 'fornecedores',
        'produtos' => 'produtos', 'estoque' => 'estoque', 'pedidos' => 'pedidos', 'compras' => 'compras', 'notas' => 'notas fiscais',
        'receber' => 'contas a receber', 'pagar' => 'contas a pagar', 'categorias' => 'categorias', 'depositos' => 'depósitos'];

    private static function bling(PDO $pdo, int $agora): array
    {
        $conta = $pdo->query('SELECT id, estado_conexao FROM bling_accounts WHERE is_ativo = 1 ORDER BY is_padrao DESC, id LIMIT 1')->fetch(PDO::FETCH_ASSOC) ?: null;
        if ($conta === null) {
            return ['estado' => 'nao_conectado', 'integrado' => true, 'ultima_ok' => null, 'problemas' => [], 'fonte' => 'BLING',
                    'erro' => ['codigo' => 'SEM_CONTA', 'mensagem' => 'Nenhuma conta do Bling conectada.']];
        }
        $id = (int) $conta['id'];
        // última sincronização CONCLUÍDA = último job 'concluido' (o estado guarda a última TENTATIVA, que uma falha sobrescreve)
        $st = $pdo->prepare("SELECT COALESCE((SELECT MAX(terminado_em) FROM bling_sync_jobs WHERE account_id = ? AND situacao = 'concluido'),
                                             (SELECT MAX(ultima_execucao_em) FROM bling_sync_state WHERE account_id = ? AND situacao = 'ok'))");
        $st->execute([$id, $id]);
        $ok = $st->fetchColumn() ?: null;   // UTC
        $st = $pdo->prepare("SELECT s.recurso, s.situacao,
                                    (SELECT e.codigo FROM bling_sync_errors e WHERE e.account_id = s.account_id AND e.recurso = s.recurso
                                      ORDER BY e.id DESC LIMIT 1) AS codigo
                               FROM bling_sync_state s WHERE s.account_id = ? AND s.situacao IN ('erro','parcial','atencao') ORDER BY s.recurso");
        $st->execute([$id]);
        $problemas = []; $erro = null;
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $nome = self::BLING_RECURSO[$r['recurso']] ?? (string) $r['recurso'];
            $cod = preg_replace('/[^A-Z0-9_]/', '', strtoupper((string) ($r['codigo'] ?? ''))) ?: strtoupper((string) $r['situacao']);
            if ($r['situacao'] === 'atencao' && $cod !== 'ESCOPO_AUSENTE') { continue; }   // 'atencao' comum = poucos itens com erro, não é falha
            $problemas[] = $nome;
            $erro ??= $cod === 'ESCOPO_AUSENTE'
                ? ['codigo' => 'ESCOPO_AUSENTE', 'mensagem' => ucfirst($nome) . ': a autorização do Bling não inclui este escopo. Reautorize a conta.']
                : ['codigo' => substr($cod, 0, 40), 'mensagem' => ucfirst($nome) . ': a última sincronização falhou.'];
        }
        if ($conta['estado_conexao'] !== 'conectado') {
            $erro = ['codigo' => 'CONTA_' . strtoupper((string) $conta['estado_conexao']), 'mensagem' => 'A conta do Bling precisa ser reconectada.'];
        }
        return self::fechar('BLING', self::iso($ok, 'UTC'), $erro, $problemas, $agora, 'bling');
    }

    private static function fechar(string $fonte, ?string $ultimaOk, ?array $erro, array $problemas, int $agora, string $cartao): array
    {
        $atrasado = $ultimaOk === null || ($agora - strtotime($ultimaOk)) > self::ATRASO_MIN[$cartao] * 60;
        $estado = $erro !== null ? ($problemas !== [] && !str_starts_with($erro['codigo'], 'CONTA_') ? 'parcial' : 'erro')
            : ($atrasado ? 'atrasado' : 'ok');
        if ($erro === null && $atrasado) {
            $erro = ['codigo' => 'ATRASADO', 'mensagem' => $ultimaOk === null ? 'Ainda não houve sincronização com sucesso.'
                : 'A última sincronização com sucesso passou do intervalo esperado.'];
        }
        return ['estado' => $estado, 'integrado' => true, 'ultima_ok' => $ultimaOk, 'erro' => $erro, 'problemas' => $problemas, 'fonte' => $fonte];
    }

    private static function iso(mixed $valor, string $tz): ?string
    {
        if ($valor === null || $valor === false || $valor === '') { return null; }
        try { return (new DateTimeImmutable((string) $valor, new DateTimeZone($tz)))->format(DATE_ATOM); } catch (Throwable) { return null; }
    }

    // ── resposta pública × com sessão ────────────────────────────────────────────────────────────────────────

    private const STATUS_UI = ['ok' => 'online', 'atrasado' => 'degraded', 'parcial' => 'degraded', 'erro' => 'error',
        'nao_conectado' => 'error', 'nao_integrado' => 'not_configured', 'simulado' => 'not_configured', 'nao_verificado' => 'unknown',
        'sem_fonte' => 'not_configured'];

    private const MENSAGEM_PUBLICA = ['ok' => 'Sincronizando normalmente.', 'atrasado' => 'Sincronização atrasada.',
        'parcial' => 'Sincronizando com falhas em parte dos dados.', 'erro' => 'Sincronização com erro.', 'nao_conectado' => 'Conta não conectada.',
        'simulado' => 'Em modo simulado (dados de exemplo).', 'nao_verificado' => 'Estado não verificado.'];

    /** @param array $e saída de estado() */
    public static function montar(string $cartao, array $e, bool $comSessao, ?int $agora = null, bool $desatualizado = false): array
    {
        $agora ??= time();
        $estado = $e['estado'];
        $msg = match ($estado) {
            'nao_integrado' => self::NAO_INTEGRADO[$cartao] ?? 'Integração não existente no Dash.',
            'sem_fonte'     => 'Este cartão ainda não tem fonte de dados no Dash (' . (self::SEM_FONTE[$cartao] ?? $cartao) . ').',
            default         => self::MENSAGEM_PUBLICA[$estado] ?? 'Estado desconhecido.',
        };
        $d = ['status' => self::STATUS_UI[$estado] ?? 'unknown', 'configured' => $e['integrado'] && $estado !== 'nao_conectado',
              'estado' => $estado, 'integrado' => $e['integrado'], 'message' => $msg, 'integration' => $cartao,
              'timestamp' => date(DATE_ATOM, $agora), 'fonte_verdade' => 'estado-real/' . self::VERSAO];
        if ($desatualizado) {
            $d['desatualizado'] = true;
            $d['message'] .= ' (último estado válido — não foi possível atualizar agora)';
        }
        if (!$comSessao) { return $d; }
        $d['ultima_sincronizacao_ok'] = $e['ultima_ok'];
        $d['last_sync'] = $e['ultima_ok'];   // compatibilidade com os cartões que já liam last_sync
        $d['erro_atual'] = $e['erro'];
        if ($e['problemas'] !== []) { $d['recursos_com_problema'] = $e['problemas']; }
        $partes = [];
        if ($e['integrado']) {
            $partes[] = 'Última sincronização concluída em ' . ($e['ultima_ok']
                ? (new DateTimeImmutable($e['ultima_ok']))->setTimezone(new DateTimeZone('America/Sao_Paulo'))->format('d/m/Y H:i') . ' (Brasília)'
                : 'nenhuma');
        }
        if ($e['erro'] !== null && $e['erro']['codigo'] !== 'ATRASADO') { $partes[] = 'Erro atual: ' . $e['erro']['mensagem']; }
        elseif ($e['erro'] !== null) { $partes[] = $e['erro']['mensagem']; }
        if (!$e['integrado']) { $partes[] = $msg; }
        $d['resumo'] = implode(' · ', $partes);
        return $d;
    }

    // ── entrada HTTP (os 22 endpoints) ───────────────────────────────────────────────────────────────────────

    /** @param ?callable(string):PDO $conexao só para teste; null = as conexões reais */
    public static function responder(string $cartao, ?callable $conexao = null): void
    {
        if (!in_array($cartao, self::cartoes(), true)) { throw new InvalidArgumentException('cartão desconhecido'); }
        try {
            $chave = 'status:real:v1:' . $cartao;
            $bruto = class_exists('RedisHelper') ? RedisHelper::tryGetCache($chave) : null;
            $e = $bruto !== null ? json_decode($bruto, true) : null;
            $desatualizado = false;
            if (!is_array($e) || !isset($e['estado'])) {
                try {
                    $e = self::estado($cartao, $conexao ?? [self::class, 'conexao']);
                    if (class_exists('RedisHelper')) {
                        RedisHelper::setCache($chave, (string) json_encode($e), self::CACHE_TTL);
                        RedisHelper::setCache('status:real:v1:ultimo-valido:' . $cartao, (string) json_encode($e), self::ULTIMO_VALIDO_TTL);
                    }
                } catch (Throwable $t) {
                    // NUNCA zerar o cartão: sem conseguir ler agora, mostra o ÚLTIMO estado válido (com a data da última sincronização
                    // concluída que ele tinha) e avisa que está desatualizado.
                    error_log('[status/' . $cartao . '] estado real indisponível: ' . get_class($t));
                    $v = class_exists('RedisHelper') ? RedisHelper::tryGetCache('status:real:v1:ultimo-valido:' . $cartao) : null;
                    $e = $v !== null ? json_decode($v, true) : null;
                    if (!is_array($e) || !isset($e['estado'])) { throw $t; }
                    $desatualizado = true;
                }
            }
            $sessao = class_exists('SessionGate') ? SessionGate::readOnly() : [];
            $saida = ApiResponse::buildSuccess(self::montar($cartao, $e, !empty($sessao['user_id']), null, $desatualizado));
        } catch (Throwable $t) {
            error_log('[status/' . $cartao . '] sem estado válido para mostrar: ' . get_class($t));
            $saida = ApiResponse::buildSuccess(['status' => 'unknown', 'configured' => null, 'estado' => 'indisponivel', 'integration' => $cartao,
                'message' => 'Não foi possível ler o estado agora.', 'timestamp' => date(DATE_ATOM)]);
        }
        header('Cache-Control: private, no-store');
        echo $saida;
        if (class_exists('RedisHelper')) { RedisHelper::close(); }
    }

    /** conexões só-leitura de uso real (as mesmas que os módulos usam) */
    public static function conexao(string $esquema): PDO
    {
        if ($esquema === 'BLING') {
            if (!defined('BLING_ENTRADA')) { define('BLING_ENTRADA', true); }
            require_once __DIR__ . '/../bling/repositories/BlingRepository.php';
            return (new BlingRepository())->pdo();
        }
        require_once __DIR__ . '/../../config/db_connection.php';
        return getConnection($esquema);
    }
}
