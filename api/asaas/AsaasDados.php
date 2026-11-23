<?php
declare(strict_types=1);

/**
 * /api/asaas/AsaasDados.php — gravação local (repositório), sincronização e resumo do Asaas SÓ LEITURA (ACIMA_DIREITA, 23/11/2026).
 *
 *  - Várias contas desde o início: toda tabela tem `conta` (rótulo) na chave; cobrança = uma linha por (conta, payment_id).
 *  - Nada é apagado: cobrança que some da janela relida vira `ausente = 1` (exclusão lógica), nunca DELETE.
 *  - Falha NUNCA vira zero: a falha marca a conta como `erro` e preserva os dados anteriores; o resumo devolve `null` + motivo
 *    quando não há sincronização boa recente. Zero só aparece quando o Asaas disse zero.
 *  - Uma requisição por vez (sequencial por conta e entre contas), páginas de 100, pausa curta entre páginas.
 *  - O prefixo das tabelas é parâmetro só para os testes (tabelas próprias no banco de validação); em produção é ''.
 */

require_once __DIR__ . '/AsaasConector.php';

final class AsaasEsquema
{
    /** DDL aditiva (CREATE TABLE IF NOT EXISTS). Fonte única: os testes e a migração (scripts/asaas/migracao-asaas.sql) usam esta. */
    public static function ddl(string $p = ''): array
    {
        self::prefixo($p);
        return [
            "CREATE TABLE IF NOT EXISTS `{$p}asaas_contas` (
               `conta` VARCHAR(32) NOT NULL, `nome` VARCHAR(120) NULL, `ambiente` VARCHAR(10) NOT NULL DEFAULT 'producao',
               `estado` VARCHAR(12) NOT NULL DEFAULT 'nunca', `erro_codigo` VARCHAR(40) NULL,
               `ultima_tentativa` DATETIME NULL, `ultima_sync_ok` DATETIME NULL,
               `saldo` DECIMAL(15,2) NULL, `saldo_em` DATETIME NULL, `atualizado_em` DATETIME NOT NULL,
               PRIMARY KEY (`conta`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            "CREATE TABLE IF NOT EXISTS `{$p}asaas_cobrancas` (
               `conta` VARCHAR(32) NOT NULL, `payment_id` VARCHAR(40) NOT NULL, `status` VARCHAR(40) NOT NULL, `billing_type` VARCHAR(24) NULL,
               `valor` DECIMAL(15,2) NOT NULL, `valor_liquido` DECIMAL(15,2) NULL,
               `vencimento` DATE NULL, `data_criacao` DATE NULL, `data_pagamento` DATE NULL, `data_credito` DATE NULL,
               `cliente_id` VARCHAR(40) NULL, `deletada` TINYINT(1) NOT NULL DEFAULT 0, `ausente` TINYINT(1) NOT NULL DEFAULT 0,
               `execucao` BIGINT UNSIGNED NOT NULL, `atualizado_em` DATETIME NOT NULL,
               PRIMARY KEY (`conta`, `payment_id`), KEY `ix_status` (`conta`, `status`), KEY `ix_pagamento` (`conta`, `data_pagamento`),
               KEY `ix_criacao` (`conta`, `data_criacao`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            "CREATE TABLE IF NOT EXISTS `{$p}asaas_extrato` (
               `conta` VARCHAR(32) NOT NULL, `transacao_id` VARCHAR(40) NOT NULL, `tipo` VARCHAR(60) NULL,
               `valor` DECIMAL(15,2) NOT NULL, `saldo` DECIMAL(15,2) NULL, `data` DATE NULL, `payment_id` VARCHAR(40) NULL,
               `execucao` BIGINT UNSIGNED NOT NULL, `atualizado_em` DATETIME NOT NULL,
               PRIMARY KEY (`conta`, `transacao_id`), KEY `ix_data` (`conta`, `data`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            "CREATE TABLE IF NOT EXISTS `{$p}asaas_estatisticas` (
               `conta` VARCHAR(32) NOT NULL, `chave` VARCHAR(20) NOT NULL, `quantidade` INT NOT NULL, `valor` DECIMAL(15,2) NOT NULL,
               `valor_liquido` DECIMAL(15,2) NULL, `consultado_em` DATETIME NOT NULL,
               PRIMARY KEY (`conta`, `chave`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            "CREATE TABLE IF NOT EXISTS `{$p}asaas_execucoes` (
               `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `conta` VARCHAR(32) NOT NULL, `inicio` DATETIME NOT NULL, `fim` DATETIME NULL,
               `resultado` VARCHAR(10) NOT NULL DEFAULT 'andamento', `erro_codigo` VARCHAR(40) NULL, `requisicoes` INT NOT NULL DEFAULT 0,
               `cobrancas` INT NOT NULL DEFAULT 0, `extrato` INT NOT NULL DEFAULT 0,
               PRIMARY KEY (`id`), KEY `ix_conta` (`conta`, `inicio`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        ];
    }

    public static function prefixo(string $p): void
    {
        if ($p !== '' && preg_match('/^asaas_t[a-z0-9]{6,16}_$/', $p) !== 1) throw new InvalidArgumentException('prefixo de teste inválido');
    }
}

final class AsaasValor
{
    /** número do JSON → '1234.56' (string exata); não-número → null */
    public static function dinheiro(mixed $v): ?string
    {
        if (is_int($v)) return number_format($v, 2, '.', '');
        if (is_float($v) && is_finite($v)) return number_format(round($v, 2), 2, '.', '');
        if (is_string($v) && preg_match('/^-?\d{1,13}(\.\d{1,8})?$/', $v)) return number_format(round((float) $v, 2), 2, '.', '');
        return null;
    }

    /** '1234.56' → 123456 (exato, sem float) */
    public static function centavos(string $v): int
    {
        if (preg_match('/^(-?)(\d+)(?:\.(\d{1,2}))?$/', $v, $m) !== 1) throw new InvalidArgumentException('valor');
        $c = (int) $m[2] * 100 + (int) str_pad($m[3] ?? '0', 2, '0');
        return $m[1] === '-' ? -$c : $c;
    }

    public static function deCentavos(int $c): string
    {
        return ($c < 0 ? '-' : '') . intdiv(abs($c), 100) . '.' . str_pad((string) (abs($c) % 100), 2, '0', STR_PAD_LEFT);
    }

    public static function data(mixed $v): ?string
    {
        return is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2}/', $v) ? substr($v, 0, 10) : null;
    }

    public static function id(mixed $v): ?string
    {
        return is_string($v) && preg_match('/^[A-Za-z0-9_-]{1,40}$/', $v) ? $v : null;
    }

    public static function curto(mixed $v, int $n): ?string
    {
        return is_string($v) && $v !== '' ? mb_substr($v, 0, $n) : null;
    }
}

final class AsaasRepositorio
{
    public function __construct(private readonly PDO $pdo, private readonly string $p = '')
    {
        AsaasEsquema::prefixo($p);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    public function iniciar(string $conta, string $ambiente, string $agora): int
    {
        $this->pdo->prepare("INSERT INTO `{$this->p}asaas_contas` (`conta`,`ambiente`,`estado`,`ultima_tentativa`,`atualizado_em`) VALUES (?,?,'nunca',?,?)
                             ON DUPLICATE KEY UPDATE `ambiente`=VALUES(`ambiente`), `ultima_tentativa`=VALUES(`ultima_tentativa`), `atualizado_em`=VALUES(`atualizado_em`)")
                  ->execute([$conta, $ambiente, $agora, $agora]);
        $this->pdo->prepare("INSERT INTO `{$this->p}asaas_execucoes` (`conta`,`inicio`) VALUES (?,?)")->execute([$conta, $agora]);
        return (int) $this->pdo->lastInsertId();
    }

    /** @param list<array<string,mixed>> $itens  @return int gravadas */
    public function gravarCobrancas(string $conta, int $exec, array $itens, string $agora): int
    {
        $sql = "INSERT INTO `{$this->p}asaas_cobrancas` (`conta`,`payment_id`,`status`,`billing_type`,`valor`,`valor_liquido`,`vencimento`,`data_criacao`,
                  `data_pagamento`,`data_credito`,`cliente_id`,`deletada`,`ausente`,`execucao`,`atualizado_em`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)
                ON DUPLICATE KEY UPDATE `status`=VALUES(`status`),`billing_type`=VALUES(`billing_type`),`valor`=VALUES(`valor`),`valor_liquido`=VALUES(`valor_liquido`),
                  `vencimento`=VALUES(`vencimento`),`data_criacao`=VALUES(`data_criacao`),`data_pagamento`=VALUES(`data_pagamento`),`data_credito`=VALUES(`data_credito`),
                  `cliente_id`=VALUES(`cliente_id`),`deletada`=VALUES(`deletada`),`ausente`=0,`execucao`=VALUES(`execucao`),`atualizado_em`=VALUES(`atualizado_em`)";
        $st = $this->pdo->prepare($sql);
        $n = 0;
        $this->pdo->beginTransaction();
        try {
            foreach ($itens as $c) {
                $id = AsaasValor::id($c['id'] ?? null);
                $valor = AsaasValor::dinheiro($c['value'] ?? null);
                $status = is_string($c['status'] ?? null) && preg_match('/^[A-Z_]{3,40}$/', $c['status']) ? $c['status'] : null;
                if ($id === null || $valor === null || $status === null) throw new AsaasErro('resposta_invalida', 200);
                $st->execute([$conta, $id, $status, AsaasValor::curto($c['billingType'] ?? null, 24), $valor, AsaasValor::dinheiro($c['netValue'] ?? null),
                    AsaasValor::data($c['dueDate'] ?? null), AsaasValor::data($c['dateCreated'] ?? null),
                    AsaasValor::data($c['paymentDate'] ?? ($c['clientPaymentDate'] ?? null)), AsaasValor::data($c['creditDate'] ?? null),
                    AsaasValor::id($c['customer'] ?? null), ($c['deleted'] ?? false) === true ? 1 : 0, $exec, $agora]);
                $n++;
            }
            $this->pdo->commit();
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $e;
        }
        return $n;
    }

    /** janela relida POR INTEIRO nesta execução: quem não apareceu vira ausente (lógico; nada é apagado) */
    public function marcarAusentes(string $conta, int $exec, string $de, string $ate): int
    {
        $st = $this->pdo->prepare("UPDATE `{$this->p}asaas_cobrancas` SET `ausente`=1 WHERE `conta`=? AND `data_criacao` BETWEEN ? AND ? AND `execucao`<>? AND `ausente`=0");
        $st->execute([$conta, $de, $ate, $exec]);
        return $st->rowCount();
    }

    public function gravarExtrato(string $conta, int $exec, array $itens, string $agora): int
    {
        $st = $this->pdo->prepare("INSERT INTO `{$this->p}asaas_extrato` (`conta`,`transacao_id`,`tipo`,`valor`,`saldo`,`data`,`payment_id`,`execucao`,`atualizado_em`)
                                   VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE `tipo`=VALUES(`tipo`),`valor`=VALUES(`valor`),`saldo`=VALUES(`saldo`),
                                   `data`=VALUES(`data`),`payment_id`=VALUES(`payment_id`),`execucao`=VALUES(`execucao`),`atualizado_em`=VALUES(`atualizado_em`)");
        $n = 0;
        $this->pdo->beginTransaction();
        try {
            foreach ($itens as $t) {
                $id = AsaasValor::id($t['id'] ?? null);
                $valor = AsaasValor::dinheiro($t['value'] ?? null);
                if ($id === null || $valor === null) throw new AsaasErro('resposta_invalida', 200);
                $st->execute([$conta, $id, AsaasValor::curto($t['type'] ?? null, 60), $valor, AsaasValor::dinheiro($t['balance'] ?? null),
                    AsaasValor::data($t['date'] ?? null), AsaasValor::id($t['paymentId'] ?? null), $exec, $agora]);
                $n++;
            }
            $this->pdo->commit();
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $e;
        }
        return $n;
    }

    public function gravarEstatistica(string $conta, string $chave, array $d, string $agora): void
    {
        $q = $d['quantity'] ?? null; $v = AsaasValor::dinheiro($d['value'] ?? null);
        if (!is_int($q) || $q < 0 || $v === null) throw new AsaasErro('resposta_invalida', 200);
        $this->pdo->prepare("INSERT INTO `{$this->p}asaas_estatisticas` (`conta`,`chave`,`quantidade`,`valor`,`valor_liquido`,`consultado_em`) VALUES (?,?,?,?,?,?)
                             ON DUPLICATE KEY UPDATE `quantidade`=VALUES(`quantidade`),`valor`=VALUES(`valor`),`valor_liquido`=VALUES(`valor_liquido`),`consultado_em`=VALUES(`consultado_em`)")
                  ->execute([$conta, $chave, $q, $v, AsaasValor::dinheiro($d['netValue'] ?? null), $agora]);
    }

    public function concluir(int $exec, string $conta, ?string $saldo, array $contagens, string $agora, int $requisicoes): void
    {
        $this->pdo->prepare("UPDATE `{$this->p}asaas_contas` SET `estado`='ok',`erro_codigo`=NULL,`ultima_sync_ok`=?,`saldo`=?,`saldo_em`=?,`atualizado_em`=? WHERE `conta`=?")
                  ->execute([$agora, $saldo, $agora, $agora, $conta]);
        $this->pdo->prepare("UPDATE `{$this->p}asaas_execucoes` SET `fim`=?,`resultado`='ok',`requisicoes`=?,`cobrancas`=?,`extrato`=? WHERE `id`=?")
                  ->execute([$agora, $requisicoes, $contagens['cobrancas'] ?? 0, $contagens['extrato'] ?? 0, $exec]);
    }

    /** falha: preserva TODO dado anterior (saldo, ultima_sync_ok, cobranças); só marca o estado */
    public function falhar(int $exec, string $conta, string $codigo, string $agora, int $requisicoes): void
    {
        $this->pdo->prepare("UPDATE `{$this->p}asaas_contas` SET `estado`='erro',`erro_codigo`=?,`atualizado_em`=? WHERE `conta`=?")->execute([$codigo, $agora, $conta]);
        if ($exec > 0) $this->pdo->prepare("UPDATE `{$this->p}asaas_execucoes` SET `fim`=?,`resultado`='erro',`erro_codigo`=?,`requisicoes`=? WHERE `id`=?")
                                 ->execute([$agora, $codigo, $requisicoes, $exec]);
    }

    public function nome(string $conta, ?string $nome): void
    {
        if ($nome !== null) $this->pdo->prepare("UPDATE `{$this->p}asaas_contas` SET `nome`=? WHERE `conta`=?")->execute([$nome, $conta]);
    }
}

final class AsaasSincronizador
{
    public const POR_PAGINA = 100;
    public const MAX_PAGINAS_JANELA = 200;   // 20 000 cobranças num mês = volume inesperado → erro, não segue
    public const JANELA_MESES = 13;          // cobranças relidas por mês de criação (pega mudanças de status)
    public const DIAS_PAGAMENTO = 35;        // + cobranças antigas pagas recentemente
    public const DIAS_EXTRATO = 35;

    /**
     * @param Closure(string):AsaasCliente $cliente fábrica por conta (recebe o rótulo)
     * @param Closure(int):void $dormir  pausa entre páginas (ms) — 1 requisição por vez
     */
    public function __construct(
        private readonly AsaasRepositorio $repo,
        private readonly AsaasChaves $chaves,
        private readonly Closure $cliente,
        private readonly Closure $pausaMs,
        private readonly DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo'),
    ) {}

    /** @return array<string, array{resultado:string, erro?:string, cobrancas?:int, extrato?:int, requisicoes:int}> por conta */
    public function sincronizarTodas(DateTimeImmutable $agora): array
    {
        $out = [];
        foreach ($this->chaves->rotulos() as $conta) $out[$conta] = $this->sincronizar($conta, $agora);   // sequencial: uma conta por vez
        return $out;
    }

    public function sincronizar(string $conta, DateTimeImmutable $agora): array
    {
        $agora = $agora->setTimezone($this->fuso);
        $ts = $agora->format('Y-m-d H:i:s');
        $exec = 0; $cli = null;
        try {
            $k = $this->chaves->ler($conta);
            $exec = $this->repo->iniciar($conta, $k['ambiente'], $ts);
            unset($k);
            $cli = ($this->cliente)($conta);
            $saldo = AsaasValor::dinheiro(($cli->get('saldo'))['balance'] ?? null);
            if ($saldo === null) throw new AsaasErro('resposta_invalida', 200);

            $nCob = 0;
            $ini = $agora->modify('first day of this month')->modify('-' . (self::JANELA_MESES - 1) . ' months');
            for ($m = $ini; $m <= $agora; $m = $m->modify('first day of next month')) {
                $de = $m->format('Y-m-01'); $ate = $m->format('Y-m-t');
                $nCob += $this->paginar($cli, 'cobrancas', ['dateCreated[ge]' => $de, 'dateCreated[le]' => $ate],
                    fn(array $itens) => $this->repo->gravarCobrancas($conta, $exec, $itens, $ts));
                $this->repo->marcarAusentes($conta, $exec, $de, $ate);   // só depois de a janela inteira ter vindo
            }
            $nCob += $this->paginar($cli, 'cobrancas', ['paymentDate[ge]' => $agora->modify('-' . self::DIAS_PAGAMENTO . ' days')->format('Y-m-d'),
                'paymentDate[le]' => $agora->format('Y-m-d')], fn(array $itens) => $this->repo->gravarCobrancas($conta, $exec, $itens, $ts));

            foreach (['PENDING', 'OVERDUE'] as $s) $this->repo->gravarEstatistica($conta, $s, $cli->get('estatisticas_cobrancas', ['status' => $s]), $ts);

            $nExt = $this->paginar($cli, 'extrato', ['startDate' => $agora->modify('-' . self::DIAS_EXTRATO . ' days')->format('Y-m-d'),
                'finishDate' => $agora->format('Y-m-d')], fn(array $itens) => $this->repo->gravarExtrato($conta, $exec, $itens, $ts));

            $this->repo->concluir($exec, $conta, $saldo, ['cobrancas' => $nCob, 'extrato' => $nExt], $ts, $cli->requisicoes);
            return ['resultado' => 'ok', 'cobrancas' => $nCob, 'extrato' => $nExt, 'requisicoes' => $cli->requisicoes];
        } catch (AsaasErro $e) {
            $this->repo->falhar($exec, $conta, $e->codigo, $ts, $cli?->requisicoes ?? 0);
            return ['resultado' => 'erro', 'erro' => $e->codigo, 'requisicoes' => $cli?->requisicoes ?? 0];
        } catch (Throwable $e) {
            error_log('[asaas] sincronização ' . $conta . ': ' . get_class($e));
            try { $this->repo->falhar($exec, $conta, 'erro_interno', $ts, $cli?->requisicoes ?? 0); } catch (Throwable) {}
            return ['resultado' => 'erro', 'erro' => 'erro_interno', 'requisicoes' => $cli?->requisicoes ?? 0];
        }
    }

    /** páginas de 100, uma por vez; @param Closure(list<array>):int $gravar */
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
            if ($itens === []) throw new AsaasErro('resposta_invalida', 200);   // hasMore sem itens: não fica em laço
            $offset += count($itens);
        }
    }
}

final class AsaasResumo
{
    public const LIMITE_ATRASO_MIN = 180;   // sem sincronização boa há mais de 3 h → indisponível (nunca zero)
    private const RECEBIDO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];

    public function __construct(private readonly PDO $pdo, private readonly string $p = '', private readonly DateTimeZone $fuso = new DateTimeZone('America/Sao_Paulo'))
    {
        AsaasEsquema::prefixo($p);
    }

    /** @param list<string> $rotulos contas com chave guardada */
    public function montar(array $rotulos, DateTimeImmutable $agora): array
    {
        $agora = $agora->setTimezone($this->fuso);
        $contas = []; $todas = $rotulos !== [];
        $tot = ['saldo' => '0.00', 'a_receber' => '0.00', 'vencido' => '0.00', 'recebido_mes' => '0.00'];
        foreach ($rotulos as $r) {
            $c = $this->conta($r, $agora);
            $contas[] = $c;
            if ($c['disponivel'] !== true) { $todas = false; continue; }
            foreach ($tot as $k => $v) $tot[$k] = AsaasValor::deCentavos(AsaasValor::centavos($v) + AsaasValor::centavos($c['valores'][$k]));
        }
        return [
            'contas' => $contas,
            'total' => $todas ? $tot : null,                         // total só quando TODAS as contas estão disponíveis
            'total_parcial' => !$todas && $rotulos !== [],
            'moeda' => 'BRL',
            'gerado_em' => $agora->format(DATE_ATOM),
        ];
    }

    private function conta(string $r, DateTimeImmutable $agora): array
    {
        $st = $this->pdo->prepare("SELECT `nome`,`estado`,`erro_codigo`,`ultima_tentativa`,`ultima_sync_ok`,`saldo` FROM `{$this->p}asaas_contas` WHERE `conta`=?");
        $st->execute([$r]);
        $c = $st->fetch(PDO::FETCH_ASSOC) ?: null;
        $base = ['conta' => $r, 'nome' => $c['nome'] ?? null, 'disponivel' => false, 'valores' => null,
                 'atualizado_em' => null, 'aviso' => null, 'motivo' => null];
        if ($c === null || $c['ultima_sync_ok'] === null) return ['motivo' => $c !== null && $c['estado'] === 'erro' ? 'erro:' . $c['erro_codigo'] : 'nunca_sincronizada'] + $base;
        $ok = new DateTimeImmutable((string) $c['ultima_sync_ok'], $this->fuso);
        if (($agora->getTimestamp() - $ok->getTimestamp()) > self::LIMITE_ATRASO_MIN * 60) {
            return ['motivo' => 'desatualizada', 'atualizado_em' => $ok->format(DATE_ATOM),
                    'aviso' => $c['estado'] === 'erro' ? 'erro:' . $c['erro_codigo'] : null] + $base;
        }
        if ($c['saldo'] === null) return ['motivo' => 'sem_saldo'] + $base;

        $mesIni = $agora->format('Y-m-01'); $mesFim = $agora->format('Y-m-t');
        $in = implode(',', array_fill(0, count(self::RECEBIDO), '?'));
        $q = $this->pdo->prepare("SELECT
               COALESCE(SUM(CASE WHEN `status`='PENDING' THEN `valor` END),0) a_receber,
               COALESCE(SUM(CASE WHEN `status`='OVERDUE' THEN `valor` END),0) vencido,
               SUM(`status`='OVERDUE') vencido_qtd,
               COALESCE(SUM(CASE WHEN `status` IN ($in) AND `data_pagamento` BETWEEN ? AND ? THEN `valor` END),0) recebido_mes,
               COALESCE(SUM(CASE WHEN `status` IN ($in) AND `data_pagamento` BETWEEN ? AND ? THEN COALESCE(`valor_liquido`,`valor`) END),0) recebido_mes_liquido
             FROM `{$this->p}asaas_cobrancas` WHERE `conta`=? AND `deletada`=0 AND `ausente`=0");
        $q->execute([...self::RECEBIDO, $mesIni, $mesFim, ...self::RECEBIDO, $mesIni, $mesFim, $r]);
        $v = $q->fetch(PDO::FETCH_ASSOC);
        $valores = [
            'saldo' => (string) $c['saldo'],
            'a_receber' => AsaasValor::deCentavos(AsaasValor::centavos((string) $v['a_receber'])),
            'vencido' => AsaasValor::deCentavos(AsaasValor::centavos((string) $v['vencido'])),
            'vencido_qtd' => (int) $v['vencido_qtd'],
            'recebido_mes' => AsaasValor::deCentavos(AsaasValor::centavos((string) $v['recebido_mes'])),
            'recebido_mes_liquido' => AsaasValor::deCentavos(AsaasValor::centavos((string) $v['recebido_mes_liquido'])),
        ];
        // conferência com as estatísticas do próprio Asaas (mesma execução): divergência vira AVISO, nunca troca o número
        $e = $this->pdo->prepare("SELECT `chave`,`valor` FROM `{$this->p}asaas_estatisticas` WHERE `conta`=?");
        $e->execute([$r]);
        $avisos = $c['estado'] === 'erro' ? ['ultima_tentativa_falhou:' . $c['erro_codigo']] : [];
        foreach ($e->fetchAll(PDO::FETCH_KEY_PAIR) as $k => $val) {
            $local = $k === 'PENDING' ? $valores['a_receber'] : ($k === 'OVERDUE' ? $valores['vencido'] : null);
            if ($local !== null && AsaasValor::centavos($local) !== AsaasValor::centavos((string) $val)) $avisos[] = 'divergencia_' . strtolower($k);
        }
        return ['disponivel' => true, 'valores' => $valores, 'atualizado_em' => $ok->format(DATE_ATOM),
                'aviso' => $avisos === [] ? null : implode(',', $avisos)] + $base;
    }
}
