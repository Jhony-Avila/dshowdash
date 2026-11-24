<?php
declare(strict_types=1);

/**
 * /api/asaas/AsaasDados.php — gravação local, sincronização e resumo do Asaas SÓ LEITURA (ACIMA_DIREITA, 23/11/2026; Codex DSHOW-111 B1–B3).
 *
 *  - B1 RETRATO COMPLETO: cada conta tem DUAS gerações de dados (0 e 1). A sincronização grava SEMPRE na geração INATIVA e só no FIM, numa
 *    transação, troca a geração ativa junto com saldo, estatísticas e horário. O resumo lê só a geração ATIVA: uma rodada interrompida nunca
 *    aparece misturada; o último retrato completo continua na tela até o novo ciclo terminar. Sucesso só é marcado no fim.
 *    Nada é apagado: linha que não veio na rodada fica `presente = 0` na sua geração (UPDATE), nunca DELETE.
 *  - B2 IDENTIDADE: antes de gravar qualquer coisa, a rodada confere /myAccount/commercialInfo → HMAC-SHA256(segredo, cpfCnpj) = identidade presa ao rótulo (DSHOW-112 C).
 *    Divergência → erro `conta_divergente`, nada gravado.
 *  - B3 CENTAVOS: todo valor vira centavos INTEIROS a partir do TEXTO decimal exato (DSHOW-112 B: o JSON nunca vira float; > 2 casas = recusado); o banco recebe
 *    o decimal montado desses centavos.
 *  - Várias contas: toda tabela tem `conta`; cobrança = uma linha por (conta, geração, payment_id).
 *  - Prefixo de tabela só para os testes (tabelas próprias no banco de validação); em produção é ''.
 */

require_once __DIR__ . '/AsaasConector.php';

final class AsaasEsquema
{
    public static function ddl(string $p = ''): array
    {
        self::prefixo($p);
        $t = static fn(string $n, string $c) => "CREATE TABLE IF NOT EXISTS `{$p}{$n}` ($c) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        return [
            $t('asaas_contas', "`conta` VARCHAR(32) NOT NULL, `nome` VARCHAR(120) NULL, `ambiente` VARCHAR(10) NOT NULL DEFAULT 'producao',
               `estado` VARCHAR(20) NOT NULL DEFAULT 'nunca', `erro_codigo` VARCHAR(40) NULL, `ultima_tentativa` DATETIME NULL,
               `geracao_ativa` TINYINT NULL, `execucao_ativa` BIGINT UNSIGNED NULL, `ultima_sync_ok` DATETIME NULL,
               `saldo` DECIMAL(15,2) NULL, `saldo_em` DATETIME NULL, `atualizado_em` DATETIME NOT NULL, PRIMARY KEY (`conta`)"),
            $t('asaas_cobrancas', "`conta` VARCHAR(32) NOT NULL, `geracao` TINYINT NOT NULL, `payment_id` VARCHAR(40) NOT NULL, `status` VARCHAR(40) NOT NULL,
               `billing_type` VARCHAR(24) NULL, `valor` DECIMAL(15,2) NOT NULL, `valor_liquido` DECIMAL(15,2) NULL, `vencimento` DATE NULL,
               `data_criacao` DATE NULL, `data_pagamento` DATE NULL, `data_credito` DATE NULL, `cliente_id` VARCHAR(40) NULL,
               `deletada` TINYINT(1) NOT NULL DEFAULT 0, `presente` TINYINT(1) NOT NULL DEFAULT 1, `execucao` BIGINT UNSIGNED NOT NULL,
               `atualizado_em` DATETIME NOT NULL, PRIMARY KEY (`conta`, `geracao`, `payment_id`), KEY `ix_status` (`conta`, `geracao`, `status`),
               KEY `ix_pagamento` (`conta`, `geracao`, `data_pagamento`)"),
            $t('asaas_extrato', "`conta` VARCHAR(32) NOT NULL, `transacao_id` VARCHAR(40) NOT NULL, `tipo` VARCHAR(60) NULL, `valor` DECIMAL(15,2) NOT NULL,
               `saldo` DECIMAL(15,2) NULL, `data` DATE NULL, `payment_id` VARCHAR(40) NULL, `execucao` BIGINT UNSIGNED NOT NULL,
               `atualizado_em` DATETIME NOT NULL, PRIMARY KEY (`conta`, `transacao_id`), KEY `ix_data` (`conta`, `data`)"),
            $t('asaas_estatisticas', "`conta` VARCHAR(32) NOT NULL, `geracao` TINYINT NOT NULL, `chave` VARCHAR(20) NOT NULL, `quantidade` INT NOT NULL,
               `valor` DECIMAL(15,2) NOT NULL, `valor_liquido` DECIMAL(15,2) NULL, `consultado_em` DATETIME NOT NULL, PRIMARY KEY (`conta`, `geracao`, `chave`)"),
            $t('asaas_execucoes', "`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `conta` VARCHAR(32) NOT NULL, `geracao` TINYINT NULL, `inicio` DATETIME NOT NULL,
               `fim` DATETIME NULL, `resultado` VARCHAR(10) NOT NULL DEFAULT 'andamento', `erro_codigo` VARCHAR(40) NULL, `requisicoes` INT NOT NULL DEFAULT 0,
               `cobrancas` INT NOT NULL DEFAULT 0, `extrato` INT NOT NULL DEFAULT 0, PRIMARY KEY (`id`), KEY `ix_conta` (`conta`, `inicio`)"),
        ];
    }

    public static function prefixo(string $p): void
    {
        if ($p !== '' && preg_match('/^asaas_t[a-z0-9]{6,16}_$/', $p) !== 1) throw new InvalidArgumentException('prefixo de teste inválido');
    }
}

/** B3: dinheiro em CENTAVOS inteiros, com conversão decimal exata. */
final class AsaasValor
{
    /**
     * Codex DSHOW-112 B: TEXTO decimal → centavos INTEIROS, sem nenhum arredondamento. O conector entrega cada número do JSON como o
     * literal exato enviado pelo Asaas (AsaasJson); do banco vem o DECIMAL(15,2) em texto. Aceita até 2 casas; MAIS de 2 casas
     * (ex.: 19.999), notação científica, float, booleano ou qualquer outro tipo → null (o chamador recusa a resposta: resposta_invalida).
     * int (só de código interno) → ×100.
     */
    public static function centavosDe(mixed $v): ?int
    {
        if (is_int($v)) return $v * 100;
        if (!is_string($v)) return null;                                         // float NUNCA: já perdeu o literal
        if (preg_match('/^(-?)(\d{1,13})(?:\.(\d{1,2}))?$/', $v, $m) !== 1) return null;
        $c = (int) $m[2] * 100 + (int) str_pad($m[3] ?? '', 2, '0');
        return $m[1] === '-' ? -$c : $c;
    }

    /** '1234.56' (DECIMAL do banco) → 123456, exato */
    public static function centavos(string $v): int
    {
        $c = self::centavosDe($v);
        if ($c === null) throw new InvalidArgumentException('valor');
        return $c;
    }

    public static function deCentavos(int $c): string
    {
        return ($c < 0 ? '-' : '') . intdiv(abs($c), 100) . '.' . str_pad((string) (abs($c) % 100), 2, '0', STR_PAD_LEFT);
    }

    /** número do JSON → '1234.56' exato; não-número → null */
    public static function dinheiro(mixed $v): ?string
    {
        $c = self::centavosDe($v);
        return $c === null ? null : self::deCentavos($c);
    }

    public static function data(mixed $v): ?string { return is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2}/', $v) ? substr($v, 0, 10) : null; }
    public static function id(mixed $v): ?string { return is_string($v) && preg_match('/^[A-Za-z0-9_-]{1,40}$/', $v) ? $v : null; }
    public static function curto(mixed $v, int $n): ?string { return is_string($v) && $v !== '' ? mb_substr($v, 0, $n) : null; }
}

final class AsaasRepositorio
{
    public function __construct(private readonly PDO $pdo, private readonly string $p = '')
    {
        AsaasEsquema::prefixo($p);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    private function q(string $sql, array $a = []): PDOStatement { $s = $this->pdo->prepare(str_replace('{p}', $this->p, $sql)); $s->execute($a); return $s; }

    /** registra a tentativa e devolve [execução, geração INATIVA onde esta rodada vai gravar] */
    public function iniciar(string $conta, string $ambiente, string $agora): array
    {
        $this->q("INSERT INTO `{p}asaas_contas` (`conta`,`ambiente`,`ultima_tentativa`,`atualizado_em`) VALUES (?,?,?,?)
                  ON DUPLICATE KEY UPDATE `ambiente`=VALUES(`ambiente`),`ultima_tentativa`=VALUES(`ultima_tentativa`),`atualizado_em`=VALUES(`atualizado_em`)",
                 [$conta, $ambiente, $agora, $agora]);
        $ativa = $this->q("SELECT `geracao_ativa` FROM `{p}asaas_contas` WHERE `conta`=?", [$conta])->fetchColumn();
        $geracao = $ativa === null || $ativa === false ? 0 : 1 - (int) $ativa;
        $this->q("INSERT INTO `{p}asaas_execucoes` (`conta`,`geracao`,`inicio`) VALUES (?,?,?)", [$conta, $geracao, $agora]);
        return [(int) $this->pdo->lastInsertId(), $geracao];
    }

    public function gravarCobrancas(string $conta, int $ger, int $exec, array $itens, string $agora): int
    {
        $st = $this->pdo->prepare(str_replace('{p}', $this->p, "INSERT INTO `{p}asaas_cobrancas` (`conta`,`geracao`,`payment_id`,`status`,`billing_type`,`valor`,`valor_liquido`,
              `vencimento`,`data_criacao`,`data_pagamento`,`data_credito`,`cliente_id`,`deletada`,`presente`,`execucao`,`atualizado_em`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)
              ON DUPLICATE KEY UPDATE `status`=VALUES(`status`),`billing_type`=VALUES(`billing_type`),`valor`=VALUES(`valor`),`valor_liquido`=VALUES(`valor_liquido`),
              `vencimento`=VALUES(`vencimento`),`data_criacao`=VALUES(`data_criacao`),`data_pagamento`=VALUES(`data_pagamento`),`data_credito`=VALUES(`data_credito`),
              `cliente_id`=VALUES(`cliente_id`),`deletada`=VALUES(`deletada`),`presente`=1,`execucao`=VALUES(`execucao`),`atualizado_em`=VALUES(`atualizado_em`)"));
        $n = 0;
        $this->pdo->beginTransaction();
        try {
            foreach ($itens as $c) {
                $id = AsaasValor::id($c['id'] ?? null); $valor = AsaasValor::dinheiro($c['value'] ?? null);
                $status = is_string($c['status'] ?? null) && preg_match('/^[A-Z_]{3,40}$/', $c['status']) ? $c['status'] : null;
                if ($id === null || $valor === null || $status === null) throw new AsaasErro('resposta_invalida', 200);
                $st->execute([$conta, $ger, $id, $status, AsaasValor::curto($c['billingType'] ?? null, 24), $valor, AsaasValor::dinheiro($c['netValue'] ?? null),
                    AsaasValor::data($c['dueDate'] ?? null), AsaasValor::data($c['dateCreated'] ?? null), AsaasValor::data($c['paymentDate'] ?? ($c['clientPaymentDate'] ?? null)),
                    AsaasValor::data($c['creditDate'] ?? null), AsaasValor::id($c['customer'] ?? null), ($c['deleted'] ?? false) === true ? 1 : 0, $exec, $agora]);
                $n++;
            }
            $this->pdo->commit();
        } catch (Throwable $e) { if ($this->pdo->inTransaction()) $this->pdo->rollBack(); throw $e; }
        return $n;
    }

    public function gravarExtrato(string $conta, int $exec, array $itens, string $agora): int
    {
        $st = $this->pdo->prepare(str_replace('{p}', $this->p, "INSERT INTO `{p}asaas_extrato` (`conta`,`transacao_id`,`tipo`,`valor`,`saldo`,`data`,`payment_id`,`execucao`,`atualizado_em`)
              VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE `tipo`=VALUES(`tipo`),`valor`=VALUES(`valor`),`saldo`=VALUES(`saldo`),`data`=VALUES(`data`),
              `payment_id`=VALUES(`payment_id`),`execucao`=VALUES(`execucao`),`atualizado_em`=VALUES(`atualizado_em`)"));
        $n = 0;
        $this->pdo->beginTransaction();
        try {
            foreach ($itens as $t) {
                $id = AsaasValor::id($t['id'] ?? null); $valor = AsaasValor::dinheiro($t['value'] ?? null);
                if ($id === null || $valor === null) throw new AsaasErro('resposta_invalida', 200);
                $st->execute([$conta, $id, AsaasValor::curto($t['type'] ?? null, 60), $valor, AsaasValor::dinheiro($t['balance'] ?? null), AsaasValor::data($t['date'] ?? null),
                    AsaasValor::id($t['paymentId'] ?? null), $exec, $agora]);
                $n++;
            }
            $this->pdo->commit();
        } catch (Throwable $e) { if ($this->pdo->inTransaction()) $this->pdo->rollBack(); throw $e; }
        return $n;
    }

    public function gravarEstatistica(string $conta, int $ger, string $chave, array $d, string $agora): void
    {
        $q = $d['quantity'] ?? null; $v = AsaasValor::dinheiro($d['value'] ?? null);   // números chegam como texto (AsaasJson)
        $q = is_string($q) && preg_match('/^(0|[1-9][0-9]{0,8})$/', $q) === 1 ? (int) $q : (is_int($q) && $q >= 0 ? $q : null);
        if ($q === null || $v === null) throw new AsaasErro('resposta_invalida', 200);
        $this->q("INSERT INTO `{p}asaas_estatisticas` (`conta`,`geracao`,`chave`,`quantidade`,`valor`,`valor_liquido`,`consultado_em`) VALUES (?,?,?,?,?,?,?)
                  ON DUPLICATE KEY UPDATE `quantidade`=VALUES(`quantidade`),`valor`=VALUES(`valor`),`valor_liquido`=VALUES(`valor_liquido`),`consultado_em`=VALUES(`consultado_em`)",
                 [$conta, $ger, $chave, $q, $v, AsaasValor::dinheiro($d['netValue'] ?? null), $agora]);
    }

    /** B1: FIM do ciclo, numa transação — o que não veio fica presente=0 na geração desta rodada; troca a geração ativa com saldo e horário */
    public function concluir(int $exec, int $ger, string $conta, string $saldo, array $cont, string $agora, int $req): void
    {
        $this->pdo->beginTransaction();
        try {
            $this->q("UPDATE `{p}asaas_cobrancas` SET `presente`=0 WHERE `conta`=? AND `geracao`=? AND `execucao`<>?", [$conta, $ger, $exec]);
            $this->q("UPDATE `{p}asaas_contas` SET `estado`='ok',`erro_codigo`=NULL,`geracao_ativa`=?,`execucao_ativa`=?,`ultima_sync_ok`=?,`saldo`=?,`saldo_em`=?,`atualizado_em`=? WHERE `conta`=?",
                     [$ger, $exec, $agora, $saldo, $agora, $agora, $conta]);
            $this->q("UPDATE `{p}asaas_execucoes` SET `fim`=?,`resultado`='ok',`requisicoes`=?,`cobrancas`=?,`extrato`=? WHERE `id`=?",
                     [$agora, $req, $cont['cobrancas'] ?? 0, $cont['extrato'] ?? 0, $exec]);
            $this->pdo->commit();
        } catch (Throwable $e) { if ($this->pdo->inTransaction()) $this->pdo->rollBack(); throw $e; }
    }

    /** falha: a geração ATIVA, o saldo e o horário ficam como estavam; só o estado registra a falha */
    public function falhar(int $exec, string $conta, string $codigo, string $agora, int $req): void
    {
        $this->q("UPDATE `{p}asaas_contas` SET `estado`=?,`erro_codigo`=?,`atualizado_em`=? WHERE `conta`=?",
                 [$codigo === 'conta_divergente' ? 'divergente' : 'erro', $codigo, $agora, $conta]);
        if ($exec > 0) $this->q("UPDATE `{p}asaas_execucoes` SET `fim`=?,`resultado`='erro',`erro_codigo`=?,`requisicoes`=? WHERE `id`=?", [$agora, $codigo, $req, $exec]);
    }
}

final class AsaasSincronizador
{
    public const POR_PAGINA = 100;
    public const MAX_PAGINAS_JANELA = 200;
    public const JANELA_MESES = 13;
    public const DIAS_PAGAMENTO = 35;
    public const DIAS_EXTRATO = 35;

    /** @param Closure(string):AsaasCliente $cliente  @param Closure(int):void $pausaMs */
    public function __construct(private readonly AsaasRepositorio $repo, private readonly AsaasChaves $chaves, private readonly Closure $cliente,
                                private readonly Closure $pausaMs, private readonly DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo')) {}

    public function sincronizarTodas(DateTimeImmutable $agora): array
    {
        $out = [];
        foreach ($this->chaves->rotulos() as $conta) $out[$conta] = $this->sincronizar($conta, $agora);
        return $out;
    }

    public function sincronizar(string $conta, DateTimeImmutable $agora): array
    {
        $agora = $agora->setTimezone($this->fuso); $ts = $agora->format('Y-m-d H:i:s');
        $exec = 0; $cli = null;
        try {
            $k = $this->chaves->ler($conta);   // sem identidade presa ao rótulo → sem_identidade (não sincroniza)
            [$exec, $ger] = $this->repo->iniciar($conta, $k['ambiente'], $ts);
            $identidade = $k['identidade']; unset($k);
            $cli = ($this->cliente)($conta);
            // B2: a conta da chave tem de ser a mesma presa ao rótulo — ANTES de gravar qualquer dado
            if (!hash_equals($identidade, $this->chaves->identidadeDe($cli->get('conta')))) throw new AsaasErro('conta_divergente');
            $saldo = AsaasValor::dinheiro(($cli->get('saldo'))['balance'] ?? null);
            if ($saldo === null) throw new AsaasErro('resposta_invalida', 200);

            $nCob = 0;
            $ini = $agora->modify('first day of this month')->modify('-' . (self::JANELA_MESES - 1) . ' months');
            for ($m = $ini; $m <= $agora; $m = $m->modify('first day of next month')) {
                $nCob += $this->paginar($cli, 'cobrancas', ['dateCreated[ge]' => $m->format('Y-m-01'), 'dateCreated[le]' => $m->format('Y-m-t')],
                    fn(array $itens) => $this->repo->gravarCobrancas($conta, $ger, $exec, $itens, $ts));
            }
            $nCob += $this->paginar($cli, 'cobrancas', ['paymentDate[ge]' => $agora->modify('-' . self::DIAS_PAGAMENTO . ' days')->format('Y-m-d'),
                'paymentDate[le]' => $agora->format('Y-m-d')], fn(array $itens) => $this->repo->gravarCobrancas($conta, $ger, $exec, $itens, $ts));
            foreach (['PENDING', 'OVERDUE'] as $s) $this->repo->gravarEstatistica($conta, $ger, $s, $cli->get('estatisticas_cobrancas', ['status' => $s]), $ts);
            $nExt = $this->paginar($cli, 'extrato', ['startDate' => $agora->modify('-' . self::DIAS_EXTRATO . ' days')->format('Y-m-d'),
                'finishDate' => $agora->format('Y-m-d')], fn(array $itens) => $this->repo->gravarExtrato($conta, $exec, $itens, $ts));

            $this->repo->concluir($exec, $ger, $conta, $saldo, ['cobrancas' => $nCob, 'extrato' => $nExt], $ts, $cli->requisicoes);   // sucesso SÓ aqui
            return ['resultado' => 'ok', 'geracao' => $ger, 'cobrancas' => $nCob, 'extrato' => $nExt, 'requisicoes' => $cli->requisicoes];
        } catch (AsaasErro $e) {
            $this->repo->falhar($exec, $conta, $e->codigo, $ts, $cli?->requisicoes ?? 0);
            return ['resultado' => 'erro', 'erro' => $e->codigo, 'requisicoes' => $cli?->requisicoes ?? 0];
        } catch (Throwable $e) {
            error_log('[asaas] sincronização ' . $conta . ': ' . get_class($e));
            try { $this->repo->falhar($exec, $conta, 'erro_interno', $ts, $cli?->requisicoes ?? 0); } catch (Throwable) {}
            return ['resultado' => 'erro', 'erro' => 'erro_interno', 'requisicoes' => $cli?->requisicoes ?? 0];
        }
    }

    private function paginar(AsaasCliente $cli, string $rota, array $filtro, Closure $gravar): int
    {
        $offset = 0; $n = 0;
        for ($pag = 0; ; $pag++) {
            if ($pag >= self::MAX_PAGINAS_JANELA) throw new AsaasErro('volume_inesperado');
            if ($pag > 0) ($this->pausaMs)(250);
            $d = $cli->get($rota, $filtro + ['offset' => $offset, 'limit' => self::POR_PAGINA]);
            $itens = $d['data'] ?? null;
            if (!is_array($itens) || !array_is_list($itens) || !is_bool($d['hasMore'] ?? null)) throw new AsaasErro('resposta_invalida', 200);
            if ($itens !== []) $n += $gravar($itens);
            if ($d['hasMore'] !== true) return $n;
            if ($itens === []) throw new AsaasErro('resposta_invalida', 200);
            $offset += count($itens);
        }
    }
}

final class AsaasResumo
{
    public const LIMITE_ATRASO_MIN = 180;
    private const RECEBIDO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];

    /** @param ?Closure(string):void $aposPonteiro SÓ para teste: chamado depois de ler o ponteiro da geração de cada conta */
    public function __construct(private readonly PDO $pdo, private readonly string $p = '', private readonly DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo'),
                                private readonly ?Closure $aposPonteiro = null)
    {
        AsaasEsquema::prefixo($p);
    }

    /**
     * Codex DSHOW-112 A: o painel lê ponteiro da geração, saldo, cobranças e estatísticas de TODAS as contas sob UM MESMO retrato do banco
     * (transação REPEATABLE READ, READ ONLY, WITH CONSISTENT SNAPSHOT). Uma geração publicada — ou reaproveitada — no meio da leitura não
     * entra: a resposta é inteira do retrato do início. Conexão já dentro de transação → recusa (não dá para garantir o retrato).
     */
    public function montar(array $rotulos, DateTimeImmutable $agora): array
    {
        if ($this->pdo->inTransaction()) throw new LogicException('AsaasResumo precisa de uma conexão fora de transação');
        $agora = $agora->setTimezone($this->fuso);
        $this->pdo->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        $this->pdo->exec('START TRANSACTION READ ONLY, WITH CONSISTENT SNAPSHOT');
        try {
            $contas = []; $todas = $rotulos !== [];
            $tot = ['saldo' => 0, 'a_receber' => 0, 'vencido' => 0, 'recebido_mes' => 0];   // centavos
            foreach ($rotulos as $r) {
                $c = $this->conta($r, $agora);
                $contas[] = $c;
                if ($c['disponivel'] !== true) { $todas = false; continue; }
                foreach ($tot as $k => $v) $tot[$k] = $v + AsaasValor::centavos($c['valores'][$k]);
            }
            $this->pdo->exec('COMMIT');
        } catch (Throwable $e) {
            try { $this->pdo->exec('ROLLBACK'); } catch (Throwable) {}
            throw $e;
        }
        return ['contas' => $contas, 'total' => $todas ? array_map([AsaasValor::class, 'deCentavos'], $tot) : null,
                'total_parcial' => !$todas && $rotulos !== [], 'moeda' => 'BRL', 'gerado_em' => $agora->format(DATE_ATOM)];
    }

    private function conta(string $r, DateTimeImmutable $agora): array
    {
        $st = $this->pdo->prepare("SELECT `nome`,`estado`,`erro_codigo`,`geracao_ativa`,`ultima_sync_ok`,`saldo` FROM `{$this->p}asaas_contas` WHERE `conta`=?");
        $st->execute([$r]);
        $c = $st->fetch(PDO::FETCH_ASSOC) ?: null;
        $st->closeCursor();
        if ($this->aposPonteiro !== null) ($this->aposPonteiro)($r);
        $base =['conta' => $r, 'nome' => $c['nome'] ?? null, 'disponivel' => false, 'valores' => null, 'atualizado_em' => null, 'aviso' => null, 'motivo' => null];
        if ($c !== null && $c['estado'] === 'divergente') return ['motivo' => 'conta_divergente'] + $base;   // B2: nunca mostra números de conta trocada
        if ($c === null || $c['ultima_sync_ok'] === null || $c['geracao_ativa'] === null) {
            return ['motivo' => $c !== null && $c['estado'] === 'erro' ? 'erro:' . $c['erro_codigo'] : 'nunca_sincronizada'] + $base;
        }
        $ok = new DateTimeImmutable((string) $c['ultima_sync_ok'], $this->fuso);
        if ($agora->getTimestamp() - $ok->getTimestamp() > self::LIMITE_ATRASO_MIN * 60) {
            return ['motivo' => 'desatualizada', 'atualizado_em' => $ok->format(DATE_ATOM), 'aviso' => $c['estado'] === 'erro' ? 'erro:' . $c['erro_codigo'] : null] + $base;
        }
        $ger = (int) $c['geracao_ativa'];
        $mesIni = $agora->format('Y-m-01'); $mesFim = $agora->format('Y-m-t');
        $in = implode(',', array_fill(0, count(self::RECEBIDO), '?'));
        $q = $this->pdo->prepare("SELECT COALESCE(SUM(CASE WHEN `status`='PENDING' THEN `valor` END),0) a_receber,
               COALESCE(SUM(CASE WHEN `status`='OVERDUE' THEN `valor` END),0) vencido, COALESCE(SUM(`status`='OVERDUE'),0) vencido_qtd,
               COALESCE(SUM(CASE WHEN `status` IN ($in) AND `data_pagamento` BETWEEN ? AND ? THEN `valor` END),0) recebido_mes,
               COALESCE(SUM(CASE WHEN `status` IN ($in) AND `data_pagamento` BETWEEN ? AND ? THEN COALESCE(`valor_liquido`,`valor`) END),0) recebido_mes_liquido
             FROM `{$this->p}asaas_cobrancas` WHERE `conta`=? AND `geracao`=? AND `presente`=1 AND `deletada`=0");
        $q->execute([...self::RECEBIDO, $mesIni, $mesFim, ...self::RECEBIDO, $mesIni, $mesFim, $r, $ger]);
        $v = $q->fetch(PDO::FETCH_ASSOC);
        $dec = static fn($x) => AsaasValor::deCentavos(AsaasValor::centavos((string) $x));
        $valores = ['saldo' => $dec($c['saldo']), 'a_receber' => $dec($v['a_receber']), 'vencido' => $dec($v['vencido']), 'vencido_qtd' => (int) $v['vencido_qtd'],
                    'recebido_mes' => $dec($v['recebido_mes']), 'recebido_mes_liquido' => $dec($v['recebido_mes_liquido'])];
        $e = $this->pdo->prepare("SELECT `chave`,`valor` FROM `{$this->p}asaas_estatisticas` WHERE `conta`=? AND `geracao`=?");
        $e->execute([$r, $ger]);
        $avisos = $c['estado'] === 'erro' ? ['ultima_tentativa_falhou:' . $c['erro_codigo']] : [];
        foreach ($e->fetchAll(PDO::FETCH_KEY_PAIR) as $k => $val) {
            $local = $k === 'PENDING' ? $valores['a_receber'] : ($k === 'OVERDUE' ? $valores['vencido'] : null);
            if ($local !== null && AsaasValor::centavos($local) !== AsaasValor::centavos((string) $val)) $avisos[] = 'divergencia_' . strtolower($k);
        }
        return ['disponivel' => true, 'valores' => $valores, 'atualizado_em' => $ok->format(DATE_ATOM), 'aviso' => $avisos === [] ? null : implode(',', $avisos)] + $base;
    }
}
