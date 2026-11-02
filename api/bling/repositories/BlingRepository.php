<?php
// Bling / repositories/BlingRepository.php - persistencia no banco BLING
// @module  bling.repository
// @version 1.0.0
// @created 2026-07-30
//
// Conecta com `bling_app` — usuário de PRIVILÉGIO MÍNIMO, não com o root do
// MySQL. Este é o segundo módulo do projeto a fazer isso (o primeiro foi o
// Google Calendar). O passivo do root continua aberto no resto da aplicação,
// mas este módulo não o amplia.
//
// IDEMPOTÊNCIA: todo upsert usa `INSERT ... ON DUPLICATE KEY UPDATE` sobre o
// índice único (account_id, bling_id). Reprocessar um lote não duplica; é o que
// torna webhook e retry seguros.
//
// HASH: quando `payload_hash` não muda, a linha não é reescrita. Evita UPDATE
// inútil e mantém `atualizado_em` significando alguma coisa.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingRepository
{
    /** Contador de leituras — ver consultasExecutadas(). */
    private int $consultas = 0;

    /** bling_id => id interno, só acertos. Ver idPorBlingId(). */
    private array $cacheIds = [];

    private ?PDO $pdo = null;

    public function __construct(private readonly ?PDO $conexaoInjetada = null) {}

    /**
     * Conexão preguiçosa: o módulo em modo mock nunca toca o banco, e abrir
     * conexão no construtor faria toda requisição de tela pagar por isso.
     */
    public function pdo(): PDO
    {
        if ($this->pdo !== null) {
            return $this->pdo;
        }
        if ($this->conexaoInjetada !== null) {
            return $this->pdo = $this->conexaoInjetada;
        }

        $cfg = self::configuracao();
        if ($cfg['user'] === '') {
            throw new RuntimeException(
                'Banco BLING não configurado: falta DB_BLING_USER no .env.'
            );
        }

        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $cfg['host'], $cfg['port'], $cfg['name']);

        $this->pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 10,
        ]);

        // O banco guarda UTC. Fixar a sessão evita que a timezone do servidor
        // (America/Sao_Paulo) contamine CURRENT_TIMESTAMP e desloque tudo em 3h.
        $this->pdo->exec("SET time_zone = '+00:00'");
        return $this->pdo;
    }

    public static function configuracao(): array
    {
        $ler = static function (string $chave, string $padrao = ''): string {
            $v = getenv($chave);
            if (!is_string($v) || $v === '') {
                $v = $_ENV[$chave] ?? $_SERVER[$chave] ?? $padrao;
            }
            return trim((string) $v);
        };
        return [
            'host' => $ler('DB_BLING_HOST', '127.0.0.1'),
            'port' => $ler('DB_BLING_PORT', '3306'),
            'name' => $ler('DB_BLING_NAME', 'BLING'),
            'user' => $ler('DB_BLING_USER'),
            'pass' => $ler('DB_BLING_PASS'),
        ];
    }

    public function disponivel(): bool
    {
        try {
            $this->pdo()->query('SELECT 1');
            return true;
        } catch (Throwable) {
            return false;
        }
    }

    /** O schema está aplicado? Distingue "banco vazio" de "banco fora do ar". */
    public function schemaAplicado(): bool
    {
        try {
            $n = $this->pdo()->query(
                "SELECT COUNT(*) FROM information_schema.TABLES
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'bling_%'"
            )->fetchColumn();
            return (int) $n >= 30;
        } catch (Throwable) {
            return false;
        }
    }

    public function contarTabelas(): int
    {
        try {
            return (int) $this->pdo()->query(
                "SELECT COUNT(*) FROM information_schema.TABLES
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'bling_%'"
            )->fetchColumn();
        } catch (Throwable) {
            return 0;
        }
    }

    /**
     * O usuário da aplicação consegue alterar o schema?
     *
     * Prova ATIVA de propósito. Ler `SHOW GRANTS` diria o que está escrito;
     * tentar o DDL diz o que o motor realmente permite — e é essa a diferença
     * que importa quando o objetivo é não repetir o passivo do app rodando como
     * root do MySQL.
     *
     * A tabela é criada e apagada na mesma chamada; se algo der errado no meio,
     * o nome com prefixo `bling__probe_` deixa o resíduo óbvio.
     */
    public function consegueDdl(): bool
    {
        try {
            $this->pdo()->exec('CREATE TABLE bling__probe_ddl (id INT)');
        } catch (Throwable) {
            return false;   // recusado — é o resultado desejado
        }
        // Conseguiu criar: tenta limpar para não deixar lixo no schema.
        try { $this->pdo()->exec('DROP TABLE bling__probe_ddl'); } catch (Throwable) {}
        return true;
    }

    // ══════════════════════════════════════════════════════════
    // CONTAS E TOKENS
    // ══════════════════════════════════════════════════════════

    public function criarOuAtualizarConta(array $dados): int
    {
        $st = $this->pdo()->prepare(
            "INSERT INTO bling_accounts (nome, cnpj, ambiente, estado_conexao, is_padrao, is_ativo, escopos)
             VALUES (:nome, :cnpj, :amb, :estado, :padrao, 1, :escopos)
             ON DUPLICATE KEY UPDATE
               nome = VALUES(nome), ambiente = VALUES(ambiente),
               estado_conexao = VALUES(estado_conexao), escopos = VALUES(escopos),
               is_ativo = 1, desconectado_em = NULL, id = LAST_INSERT_ID(id)"
        );
        $st->execute([
            ':nome'   => $dados['nome'] ?? 'Conta Bling',
            ':cnpj'   => $dados['cnpj'] ?? null,
            ':amb'    => $dados['ambiente'] ?? 'producao',
            ':estado' => $dados['estado_conexao'] ?? 'conectado',
            ':padrao' => (int) ($dados['is_padrao'] ?? 0),
            ':escopos'=> $dados['escopos'] ?? null,
        ]);
        return (int) $this->pdo()->lastInsertId();
    }

    public function conta(int $id): ?array
    {
        $st = $this->pdo()->prepare('SELECT * FROM bling_accounts WHERE id = ?');
        $st->execute([$id]);
        return $st->fetch() ?: null;
    }

    public function contas(bool $somenteAtivas = true): array
    {
        $sql = 'SELECT * FROM bling_accounts';
        if ($somenteAtivas) {
            $sql .= ' WHERE is_ativo = 1';
        }
        return $this->pdo()->query($sql . ' ORDER BY is_padrao DESC, nome')->fetchAll();
    }

    public function contaPadrao(): ?array
    {
        $r = $this->pdo()->query(
            'SELECT * FROM bling_accounts WHERE is_ativo = 1 ORDER BY is_padrao DESC, id LIMIT 1'
        )->fetch();
        return $r ?: null;
    }

    /**
     * Grava tokens cifrados.
     *
     * ⚠️ COALESCE no refresh_token: o Bling nem sempre devolve um novo na
     * renovação, e quando não devolve o antigo CONTINUA VALENDO. Sobrescrever
     * com NULL zeraria a conexão e obrigaria o usuário a reconectar do nada.
     */
    public function salvarTokens(int $accountId, string $accessToken, ?string $refreshToken,
                                 int $expiraEmSegundos, string $tipo = 'Bearer'): void
    {
        $st = $this->pdo()->prepare(
            "INSERT INTO bling_oauth_tokens
               (account_id, access_token_enc, refresh_token_enc, token_type, expira_em, renovado_em, falhas_renovacao)
             VALUES (:conta, :acesso, :refresh, :tipo, DATE_ADD(UTC_TIMESTAMP(), INTERVAL :exp SECOND), UTC_TIMESTAMP(), 0)
             ON DUPLICATE KEY UPDATE
               access_token_enc  = VALUES(access_token_enc),
               refresh_token_enc = COALESCE(VALUES(refresh_token_enc), refresh_token_enc),
               token_type = VALUES(token_type),
               expira_em  = VALUES(expira_em),
               renovado_em = UTC_TIMESTAMP(),
               falhas_renovacao = 0"
        );
        $st->bindValue(':conta', $accountId, PDO::PARAM_INT);
        $st->bindValue(':acesso', BlingCrypto::cifrar($accessToken), PDO::PARAM_LOB);
        $st->bindValue(':refresh', $refreshToken === null ? null : BlingCrypto::cifrar($refreshToken), PDO::PARAM_LOB);
        $st->bindValue(':tipo', $tipo);
        $st->bindValue(':exp', max(60, $expiraEmSegundos), PDO::PARAM_INT);
        $st->execute();
    }

    /** @return array{access_token:?string,refresh_token:?string,expira_em:?string}|null */
    public function tokens(int $accountId): ?array
    {
        $st = $this->pdo()->prepare(
            'SELECT access_token_enc, refresh_token_enc, token_type, expira_em, falhas_renovacao
               FROM bling_oauth_tokens WHERE account_id = ?'
        );
        $st->execute([$accountId]);
        $r = $st->fetch();
        if (!$r) {
            return null;
        }
        return [
            'access_token'  => BlingCrypto::decifrar($r['access_token_enc']),
            'refresh_token' => BlingCrypto::decifrar($r['refresh_token_enc']),
            'token_type'    => $r['token_type'],
            'expira_em'     => $r['expira_em'],
            'falhas_renovacao' => (int) $r['falhas_renovacao'],
        ];
    }

    public function registrarFalhaRenovacao(int $accountId, string $mensagem): void
    {
        $this->pdo()->prepare(
            'UPDATE bling_oauth_tokens SET falhas_renovacao = falhas_renovacao + 1 WHERE account_id = ?'
        )->execute([$accountId]);

        $this->pdo()->prepare(
            "UPDATE bling_accounts
                SET estado_conexao = 'reauth_necessaria',
                    ultimo_erro_codigo = 'REFRESH_FALHOU',
                    ultimo_erro_msg = ?
              WHERE id = ?"
        )->execute([mb_substr($mensagem, 0, 500), $accountId]);
    }

    // ── Anti-CSRF do OAuth ──────────────────────────────────────

    public function guardarState(string $state, int $userId, ?string $redirect = null, int $minutos = 15): void
    {
        $this->pdo()->prepare(
            'INSERT INTO bling_oauth_states (state, user_id, redirect_to, expira_em)
             VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE))'
        )->execute([$state, $userId, $redirect, $minutos]);
    }

    /** Consome o state: devolve os dados e APAGA. Um state só vale uma vez. */
    public function consumirState(string $state): ?array
    {
        $st = $this->pdo()->prepare(
            'SELECT * FROM bling_oauth_states WHERE state = ? AND expira_em > UTC_TIMESTAMP()'
        );
        $st->execute([$state]);
        $r = $st->fetch();

        // Apaga mesmo se expirado — e limpa o lixo de tentativas antigas.
        $this->pdo()->prepare('DELETE FROM bling_oauth_states WHERE state = ? OR expira_em <= UTC_TIMESTAMP()')
            ->execute([$state]);

        return $r ?: null;
    }

    // ══════════════════════════════════════════════════════════
    // UPSERT GENÉRICO
    // ══════════════════════════════════════════════════════════

    /**
     * Upsert por (account_id, bling_id), pulando quando o hash não mudou.
     *
     * @return string 'criado' | 'atualizado' | 'ignorado'
     */
    public function upsert(string $tabela, int $accountId, array $dados): string
    {
        $blingId = (string) ($dados['bling_id'] ?? '');
        if ($blingId === '') {
            throw new InvalidArgumentException("upsert em $tabela sem bling_id");
        }

        // Hash igual = nada mudou. Poupa o UPDATE e mantém `atualizado_em` honesto.
        if (isset($dados['payload_hash'])) {
            $st = $this->pdo()->prepare(
                "SELECT id, payload_hash FROM `$tabela` WHERE account_id = ? AND bling_id = ?"
            );
            $st->execute([$accountId, $blingId]);
            $atual = $st->fetch();
            if ($atual && $atual['payload_hash'] === $dados['payload_hash']) {
                $this->pdo()->prepare("UPDATE `$tabela` SET sincronizado_em = UTC_TIMESTAMP() WHERE id = ?")
                    ->execute([$atual['id']]);
                return 'ignorado';
            }
        }

        $dados['account_id'] = $accountId;
        $dados['sincronizado_em'] = gmdate('Y-m-d H:i:s');

        $colunas = array_keys($dados);
        $marcadores = array_map(static fn($c) => ':' . $c, $colunas);
        $updates = [];
        foreach ($colunas as $c) {
            if ($c === 'account_id' || $c === 'bling_id') {
                continue;
            }
            $updates[] = "`$c` = VALUES(`$c`)";
        }

        $sql = sprintf(
            'INSERT INTO `%s` (%s) VALUES (%s) ON DUPLICATE KEY UPDATE %s, id = LAST_INSERT_ID(id)',
            $tabela,
            '`' . implode('`,`', $colunas) . '`',
            implode(',', $marcadores),
            implode(',', $updates),
        );

        $st = $this->pdo()->prepare($sql);
        foreach ($dados as $k => $v) {
            $st->bindValue(':' . $k, $v);
        }
        $st->execute();

        // rowCount: 1 = inseriu, 2 = atualizou (comportamento do MySQL).
        return $st->rowCount() === 1 ? 'criado' : 'atualizado';
    }

    /** id interno a partir do id do Bling. Usado para resolver as FKs. */
    /**
     * Resolve o id interno a partir do id do Bling.
     *
     * ⚠️ CACHE SÓ DE ACERTO, NUNCA DE AUSÊNCIA.
     * Um bling_id que já resolveu para um id nunca muda — o upsert atualiza
     * colunas, jamais a chave primária. Mas "não existe" é um estado
     * TEMPORÁRIO: o produto pode ser criado no meio da própria carga, e cachear
     * o negativo deixaria o item de pedido órfão para sempre.
     *
     * Sem o cache, cada pedido gastava uma consulta por contato, uma por canal e
     * uma por item — na homologação com 1.538 pedidos, mais de 9 mil consultas
     * só para resolver produto.
     */
    public function idPorBlingId(string $tabela, int $accountId, ?string $blingId): ?int
    {
        if ($blingId === null || $blingId === '') {
            return null;
        }
        $chave = "$tabela|$accountId|$blingId";
        if (isset($this->cacheIds[$chave])) {
            return $this->cacheIds[$chave];
        }

        $this->consultas++;
        $st = $this->pdo()->prepare("SELECT id FROM `$tabela` WHERE account_id = ? AND bling_id = ?");
        $st->execute([$accountId, $blingId]);
        $id = $st->fetchColumn();
        if ($id === false) {
            return null;
        }
        return $this->cacheIds[$chave] = (int) $id;
    }

    /**
     * Esquece os ids memorizados.
     *
     * O worker é um processo longo: sem isto, uma execução que sincroniza
     * milhares de entidades acumularia o mapa inteiro em memória sem nunca
     * soltá-lo. Chamado ao fim de cada recurso.
     */
    public function limparCacheIds(): void
    {
        $this->cacheIds = [];
    }

    // ══════════════════════════════════════════════════════════
    // ESTADO DA SINCRONIZAÇÃO
    // ══════════════════════════════════════════════════════════

    public function estadoSync(int $accountId, string $recurso): ?array
    {
        $st = $this->pdo()->prepare(
            'SELECT * FROM bling_sync_state WHERE account_id = ? AND recurso = ?'
        );
        $st->execute([$accountId, $recurso]);
        return $st->fetch() ?: null;
    }

    public function salvarEstadoSync(int $accountId, string $recurso, array $dados): void
    {
        $campos = ['estrategia', 'situacao', 'cursor_atual', 'pagina_atual', 'watermark',
                   'ultima_execucao_em', 'proxima_execucao_em', 'duracao_ms',
                   'registros_consultados', 'registros_criados', 'registros_atualizados',
                   'registros_ignorados', 'erros', 'retry', 'limite_consumido_pct'];

        $usar = array_intersect_key($dados, array_flip($campos));
        $usar['account_id'] = $accountId;
        $usar['recurso'] = $recurso;

        $colunas = array_keys($usar);
        $updates = [];
        foreach ($colunas as $c) {
            if ($c === 'account_id' || $c === 'recurso') {
                continue;
            }
            $updates[] = "`$c` = VALUES(`$c`)";
        }

        $sql = sprintf(
            'INSERT INTO bling_sync_state (%s) VALUES (%s) ON DUPLICATE KEY UPDATE %s',
            '`' . implode('`,`', $colunas) . '`',
            implode(',', array_map(static fn($c) => ':' . $c, $colunas)),
            implode(',', $updates),
        );
        $st = $this->pdo()->prepare($sql);
        foreach ($usar as $k => $v) {
            $st->bindValue(':' . $k, $v);
        }
        $st->execute();
    }

    public function estadosSync(?int $accountId = null): array
    {
        if ($accountId === null) {
            return $this->pdo()->query('SELECT * FROM bling_sync_state ORDER BY recurso')->fetchAll();
        }
        $st = $this->pdo()->prepare('SELECT * FROM bling_sync_state WHERE account_id = ? ORDER BY recurso');
        $st->execute([$accountId]);
        return $st->fetchAll();
    }

    public function iniciarJob(?int $accountId, string $recurso, string $estrategia, ?string $correlationId): int
    {
        $st = $this->pdo()->prepare(
            "INSERT INTO bling_sync_jobs (account_id, recurso, estrategia, situacao, iniciado_em, correlation_id)
             VALUES (?, ?, ?, 'executando', UTC_TIMESTAMP(), ?)"
        );
        $st->execute([$accountId, $recurso, $estrategia, $correlationId]);
        return (int) $this->pdo()->lastInsertId();
    }

    public function fecharJob(int $jobId, string $situacao, array $contagens, ?string $mensagem = null): void
    {
        $this->pdo()->prepare(
            "UPDATE bling_sync_jobs
                SET situacao = ?, terminado_em = UTC_TIMESTAMP(),
                    duracao_ms = TIMESTAMPDIFF(MICROSECOND, iniciado_em, UTC_TIMESTAMP()) / 1000,
                    consultados = ?, criados = ?, atualizados = ?, ignorados = ?, erros = ?,
                    mensagem = ?
              WHERE id = ?"
        )->execute([
            $situacao,
            (int) ($contagens['consultados'] ?? 0), (int) ($contagens['criados'] ?? 0),
            (int) ($contagens['atualizados'] ?? 0), (int) ($contagens['ignorados'] ?? 0),
            (int) ($contagens['erros'] ?? 0),
            $mensagem === null ? null : mb_substr($mensagem, 0, 500),
            $jobId,
        ]);
    }

    public function registrarErroSync(?int $accountId, string $recurso, ?string $blingId,
                                      ?string $codigo, ?string $mensagem,
                                      ?int $httpStatus = null, int $tentativa = 1,
                                      ?string $correlationId = null): void
    {
        try {
            $this->pdo()->prepare(
                'INSERT INTO bling_sync_errors
                   (account_id, recurso, bling_id, codigo, mensagem, http_status, tentativa, correlation_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            )->execute([$accountId, $recurso, $blingId, $codigo,
                        $mensagem === null ? null : mb_substr($mensagem, 0, 1000),
                        $httpStatus, $tentativa, $correlationId]);
        } catch (Throwable $e) {
            // Falhar ao registrar erro não pode derrubar a sincronização.
            error_log('[bling] não consegui gravar o erro de sync: ' . $e->getMessage());
        }
    }

    // ══════════════════════════════════════════════════════════
    // FILA
    // ══════════════════════════════════════════════════════════

    public function enfileirar(?int $accountId, string $tipo, string $recurso,
                               ?string $referencia, array $payload = [],
                               int $prioridade = 50, ?string $correlationId = null): int
    {
        $st = $this->pdo()->prepare(
            'INSERT INTO bling_queue (account_id, tipo, recurso, referencia, payload, prioridade, correlation_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $st->execute([$accountId, $tipo, $recurso, $referencia,
                      $payload === [] ? null : json_encode($payload, JSON_UNESCAPED_UNICODE),
                      $prioridade, $correlationId]);
        return (int) $this->pdo()->lastInsertId();
    }

    /**
     * Retira o próximo item da fila.
     *
     * `FOR UPDATE SKIP LOCKED` deixa dois workers rodarem em paralelo sem pegar
     * o mesmo item. Sem o SKIP LOCKED, o segundo worker fica bloqueado
     * esperando o primeiro — e a fila deixa de escalar.
     */
    public function proximoDaFila(): ?array
    {
        $pdo = $this->pdo();
        $pdo->beginTransaction();
        try {
            $r = $pdo->query(
                "SELECT * FROM bling_queue
                  WHERE situacao = 'pendente' AND disponivel_em <= UTC_TIMESTAMP()
                  ORDER BY prioridade, id
                  LIMIT 1 FOR UPDATE SKIP LOCKED"
            )->fetch();

            if (!$r) {
                $pdo->commit();
                return null;
            }

            $pdo->prepare(
                "UPDATE bling_queue SET situacao = 'processando', tentativas = tentativas + 1 WHERE id = ?"
            )->execute([$r['id']]);

            $pdo->commit();
            $r['tentativas'] = (int) $r['tentativas'] + 1;
            return $r;
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public function concluirDaFila(int $id): void
    {
        $this->pdo()->prepare("UPDATE bling_queue SET situacao = 'concluido' WHERE id = ?")->execute([$id]);
    }

    /**
     * Devolve à fila com backoff, ou manda para a DLQ ao esgotar as tentativas.
     * Item que falha para sempre não pode ficar girando: some do radar e come
     * limite de API.
     */
    public function falharNaFila(int $id, string $erro, int $tentativas, int $maxTentativas): string
    {
        if ($tentativas >= $maxTentativas) {
            $this->pdo()->prepare(
                "UPDATE bling_queue SET situacao = 'dlq', ultimo_erro = ? WHERE id = ?"
            )->execute([mb_substr($erro, 0, 1000), $id]);
            return 'dlq';
        }

        $esperaSeg = min(3600, (int) (30 * (2 ** ($tentativas - 1))));
        $this->pdo()->prepare(
            "UPDATE bling_queue
                SET situacao = 'pendente', ultimo_erro = ?,
                    disponivel_em = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND)
              WHERE id = ?"
        )->execute([mb_substr($erro, 0, 1000), $esperaSeg, $id]);
        return 'reagendado';
    }

    public function resumoFila(): array
    {
        $r = $this->pdo()->query(
            "SELECT situacao, COUNT(*) n FROM bling_queue GROUP BY situacao"
        )->fetchAll();
        $saida = ['pendente' => 0, 'processando' => 0, 'concluido' => 0, 'falhou' => 0, 'dlq' => 0];
        foreach ($r as $l) {
            $saida[$l['situacao']] = (int) $l['n'];
        }
        return $saida;
    }

    // ══════════════════════════════════════════════════════════
    // MANUTENÇÃO (worker)
    // ══════════════════════════════════════════════════════════

    /**
     * Contas que o cron deve processar.
     *
     * Só as CONECTADAS. Uma conta em `reauth_necessaria` ou `revogado` está
     * ativa mas não tem token utilizável: incluí-la faria o worker gastar
     * tentativa e encher a DLQ com falhas que nenhuma repetição resolve — só o
     * dono reconectando resolve. `contasComPendencia()` é quem as reporta.
     *
     * @return int[]
     */
    public function contasAtivas(): array
    {
        $r = $this->pdo()->query(
            "SELECT id FROM bling_accounts
              WHERE is_ativo = 1 AND estado_conexao = 'conectado'
              ORDER BY is_padrao DESC, id"
        )->fetchAll();
        return array_map(static fn($l) => (int) $l['id'], $r);
    }

    /**
     * Contas ativas que o cron PULOU e por quê — para o worker dizer em voz alta.
     * @return array<int,array{id:int,nome:string,estado_conexao:string}>
     */
    public function contasComPendencia(): array
    {
        return $this->pdo()->query(
            "SELECT id, nome, estado_conexao FROM bling_accounts
              WHERE is_ativo = 1 AND estado_conexao <> 'conectado'
              ORDER BY id"
        )->fetchAll();
    }

    /**
     * Expurgo por retenção.
     *
     * Sem isto, `bling_raw_payloads` cresce sem teto — é o payload cru de TODA
     * entidade sincronizada, guardado só para investigar divergência. Os prazos
     * são curtos de propósito: o valor de um payload cru cai a quase zero depois
     * de alguns dias, mas o custo em disco não.
     *
     * `bling_audit_logs` fica com o prazo mais longo (§63): é o rastro de quem
     * conectou, desconectou e disparou sincronização.
     *
     * @return array<string,int> tabela => linhas removidas
     */
    public function expurgar(): array
    {
        // ⚠️ A coluna de data tem nome DIFERENTE em cada tabela — não há
        // `criado_em` universal aqui. Assumir um nome só apagaria zero linha e
        // o expurgo pareceria funcionando enquanto o disco enche.
        $politica = [
            // raw_payloads já carrega o vencimento na própria linha (expira_em),
            // gravado no momento da escrita: usa-o em vez de reinterpretar prazo.
            'bling_raw_payloads'   => ['expira_em',   null],
            'bling_webhook_events' => ['recebido_em', 30],
            'bling_sync_jobs'      => ['iniciado_em', 60],
            'bling_sync_errors'    => ['ocorrido_em', 60],
            'bling_audit_logs'     => ['ocorrido_em', 365],
        ];

        $removidos = [];
        foreach ($politica as $tabela => [$coluna, $dias]) {
            $onde = $dias === null
                ? "`$coluna` IS NOT NULL AND `$coluna` < UTC_TIMESTAMP()"
                : "`$coluna` < DATE_SUB(UTC_TIMESTAMP(), INTERVAL " . (int) $dias . " DAY)";

            // Em lotes: um DELETE de milhões de linhas seguraria a tabela e o
            // webhook, que chega a qualquer momento, esperaria pelo lock.
            $total = 0;
            do {
                $st = $this->pdo()->prepare("DELETE FROM `$tabela` WHERE $onde LIMIT 5000");
                $st->execute();
                $n = $st->rowCount();
                $total += $n;
            } while ($n === 5000);
            $removidos[$tabela] = $total;
        }

        // Fila concluída não tem valor histórico: o job já está em sync_jobs.
        $st = $this->pdo()->prepare(
            "DELETE FROM bling_queue
              WHERE situacao = 'concluido'
                AND atualizado_em < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 3 DAY)"
        );
        $st->execute();
        $removidos['bling_queue'] = $st->rowCount();

        return $removidos;
    }

    // ══════════════════════════════════════════════════════════
    // WEBHOOKS
    // ══════════════════════════════════════════════════════════

    /**
     * Registra a entrega. Devolve o id, ou null se JÁ foi recebida.
     *
     * O null é a idempotência do §46 acontecendo: a mesma entrega, reenviada,
     * não vira dois processamentos.
     */
    public function registrarWebhook(?int $accountId, string $evento, ?string $blingId,
                                     string $chaveIdempotencia, bool $assinaturaOk,
                                     ?string $correlationId): ?int
    {
        try {
            $st = $this->pdo()->prepare(
                "INSERT INTO bling_webhook_events
                   (account_id, evento, bling_id, chave_idempotencia, assinatura_ok, situacao, correlation_id)
                 VALUES (?, ?, ?, ?, ?, 'recebido', ?)"
            );
            $st->execute([$accountId, $evento, $blingId, $chaveIdempotencia,
                          $assinaturaOk ? 1 : 0, $correlationId]);
            return (int) $this->pdo()->lastInsertId();
        } catch (PDOException $e) {
            // 23000 = violação de chave única → já recebemos esta entrega.
            if ($e->getCode() === '23000') {
                $this->pdo()->prepare(
                    "UPDATE bling_webhook_events SET situacao = 'duplicado' WHERE chave_idempotencia = ?"
                )->execute([$chaveIdempotencia]);
                return null;
            }
            throw $e;
        }
    }

    public function atualizarWebhook(int $id, string $situacao, ?string $resultado = null,
                                     ?int $duracaoMs = null): void
    {
        $this->pdo()->prepare(
            "UPDATE bling_webhook_events
                SET situacao = ?, resultado = ?, duracao_ms = ?,
                    processado_em = UTC_TIMESTAMP(), tentativas = tentativas + 1
              WHERE id = ?"
        )->execute([$situacao, $resultado === null ? null : mb_substr($resultado, 0, 1000), $duracaoMs, $id]);
    }

    // ══════════════════════════════════════════════════════════
    // PAYLOAD CRU E AUDITORIA
    // ══════════════════════════════════════════════════════════

    public function guardarPayload(?int $accountId, string $recurso, ?string $blingId,
                                   array $payload, string $origem = 'sync', int $diasRetencao = 30): void
    {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE);
        $this->pdo()->prepare(
            'INSERT INTO bling_raw_payloads (account_id, recurso, bling_id, origem, payload, payload_hash, expira_em)
             VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY))'
        )->execute([$accountId, $recurso, $blingId, $origem, $json, md5((string) $json), $diasRetencao]);
    }

    public function auditar(array $d): void
    {
        try {
            $this->pdo()->prepare(
                'INSERT INTO bling_audit_logs
                   (account_id, user_id, usuario_email, acao, entidade, entidade_id,
                    valor_anterior, valor_novo, ip, origem, resultado, detalhe, correlation_id)
                 VALUES (:conta, :usuario, :email, :acao, :entidade, :entidade_id,
                         :antes, :depois, :ip, :origem, :resultado, :detalhe, :cid)'
            )->execute([
                ':conta' => $d['account_id'] ?? null,
                ':usuario' => $d['user_id'] ?? null,
                ':email' => $d['usuario_email'] ?? null,
                ':acao' => $d['acao'],
                ':entidade' => $d['entidade'] ?? null,
                ':entidade_id' => $d['entidade_id'] ?? null,
                ':antes' => isset($d['valor_anterior']) ? json_encode($d['valor_anterior'], JSON_UNESCAPED_UNICODE) : null,
                ':depois' => isset($d['valor_novo']) ? json_encode($d['valor_novo'], JSON_UNESCAPED_UNICODE) : null,
                ':ip' => $d['ip'] ?? null,
                ':origem' => $d['origem'] ?? null,
                ':resultado' => $d['resultado'] ?? 'sucesso',
                ':detalhe' => isset($d['detalhe']) ? mb_substr((string) $d['detalhe'], 0, 1000) : null,
                ':cid' => $d['correlation_id'] ?? null,
            ]);
        } catch (Throwable $e) {
            error_log('[bling] falha ao auditar: ' . $e->getMessage());
        }
    }

    // ── Consulta genérica para o provedor real ──────────────────

    public function consultar(string $sql, array $params = []): array
    {
        $this->consultas++;
        $st = $this->pdo()->prepare($sql);
        $st->execute($params);
        return $st->fetchAll();
    }

    public function valor(string $sql, array $params = []): mixed
    {
        $this->consultas++;
        $st = $this->pdo()->prepare($sql);
        $st->execute($params);
        return $st->fetchColumn();
    }

    /**
     * Quantas consultas de leitura já passaram por aqui.
     *
     * Existe para detectar N+1 — o defeito que some no teste de um registro e
     * derruba a tela em produção. A homologação carrega 1538 pedidos e exige
     * que o grid gaste menos de 10 consultas; um N+1 gastaria mais de mil.
     */
    public function consultasExecutadas(): int
    {
        return $this->consultas;
    }
}
