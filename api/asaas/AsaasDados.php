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
               `juros_multa` DECIMAL(15,2) NULL, `vencimento_original` DATE NULL, `invoice_url` VARCHAR(255) NULL, `invoice_number` VARCHAR(40) NULL,
               `deletada` TINYINT(1) NOT NULL DEFAULT 0, `presente` TINYINT(1) NOT NULL DEFAULT 1, `execucao` BIGINT UNSIGNED NOT NULL,
               `atualizado_em` DATETIME NOT NULL, PRIMARY KEY (`conta`, `geracao`, `payment_id`), KEY `ix_status` (`conta`, `geracao`, `status`),
               KEY `ix_pagamento` (`conta`, `geracao`, `data_pagamento`)"),
            // 26/11 (Cobranças vencidas): cadastro MÍNIMO do cliente — só o nome e o tipo de pessoa (nunca CPF/CNPJ, e-mail, telefone, endereço)
            $t('asaas_clientes', "`conta` VARCHAR(32) NOT NULL, `cliente_id` VARCHAR(40) NOT NULL, `nome` VARCHAR(160) NULL, `tipo_pessoa` VARCHAR(10) NULL,
               `deletado` TINYINT(1) NOT NULL DEFAULT 0, `atualizado_em` DATETIME NOT NULL, PRIMARY KEY (`conta`, `cliente_id`)"),
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
        if ($p !== '' && preg_match('/^asaas_t[a-z0-9]{6,16}_\z/', $p) !== 1) throw new InvalidArgumentException('prefixo de teste inválido');
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
        if (preg_match('/^(-?)(\d{1,13})(?:\.(\d{1,2}))?\z/', $v, $m) !== 1) return null;
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

    /**
     * Codex DSHOW-113 (3): campo monetário OPCIONAL. Quatro casos, separados:
     *   ausente (chave não veio)   → null (não informado);
     *   null explícito             → null (o Asaas disse "sem valor");
     *   decimal válido (≤ 2 casas) → '1234.56' exato;
     *   presente e INVÁLIDO (19.999, '', 'abc', 1e3, true, [], float…) → AsaasErro('valor_invalido:<origem>.<campo>'): a rodada inteira
     *   é recusada; NUNCA vira null em silêncio nem é trocado por outro valor (ex.: o bruto no lugar do líquido).
     * O erro só leva a origem e o NOME do campo (nunca o valor, o id ou o cliente).
     */
    public static function opcional(array $obj, string $campo, string $origem): ?string
    {
        if (!array_key_exists($campo, $obj) || $obj[$campo] === null) return null;
        $v = self::dinheiro($obj[$campo]);
        if ($v === null) throw new AsaasErro('valor_invalido:' . $origem . '.' . $campo, 200);
        return $v;
    }

    public static function data(mixed $v): ?string { return is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2}/', $v) ? substr($v, 0, 10) : null; }
    public static function id(mixed $v): ?string { return is_string($v) && preg_match('/^[A-Za-z0-9_-]{1,40}\z/', $v) ? $v : null; }
    public static function curto(mixed $v, int $n): ?string { return is_string($v) && $v !== '' ? mb_substr($v, 0, $n) : null; }
    /** 26/11: link da fatura do Asaas (invoiceUrl) — só https em asaas.com, sem query estranha; fora disso null. */
    public static function linkFatura(mixed $v): ?string
    {
        return is_string($v) && strlen($v) <= 255 && preg_match('#^https://(www\.|sandbox\.)?asaas\.com/[A-Za-z0-9/_\-]{1,200}\z#', $v) === 1 ? $v : null;
    }
    public static function numeroFatura(mixed $v): ?string { return (is_string($v) || is_int($v)) && preg_match('/^[0-9]{1,20}\z/', (string) $v) === 1 ? (string) $v : null; }
    /** 26/11: nome do cliente (customers.name), texto de 1 a 160 caracteres sem controle; senão null. */
    public static function nomeCliente(mixed $v): ?string
    {
        if (!is_string($v)) return null;
        $v = trim($v);
        return preg_match('/^[^\x00-\x1F\x7F]{1,160}\z/u', $v) === 1 ? $v : null;
    }

    /** 25/11: nome da conta (commercialInfo): companyName, senão name; texto UTF-8 de 1 a 120 caracteres sem controle. Inválido/ausente → null. */
    public static function nomeConta(array $info): ?string
    {
        foreach (['companyName', 'name'] as $k) {
            $v = $info[$k] ?? null;
            if (!is_string($v)) continue;
            $v = trim($v);
            if (preg_match('/^[^\x00-\x1F\x7F]{1,120}\z/u', $v) === 1) return $v;
        }
        return null;
    }
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
              `vencimento`,`data_criacao`,`data_pagamento`,`data_credito`,`cliente_id`,`deletada`,`presente`,`execucao`,`atualizado_em`,
              `juros_multa`,`vencimento_original`,`invoice_url`,`invoice_number`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?,?)
              ON DUPLICATE KEY UPDATE `status`=VALUES(`status`),`billing_type`=VALUES(`billing_type`),`valor`=VALUES(`valor`),`valor_liquido`=VALUES(`valor_liquido`),
              `vencimento`=VALUES(`vencimento`),`data_criacao`=VALUES(`data_criacao`),`data_pagamento`=VALUES(`data_pagamento`),`data_credito`=VALUES(`data_credito`),
              `cliente_id`=VALUES(`cliente_id`),`deletada`=VALUES(`deletada`),`presente`=1,`execucao`=VALUES(`execucao`),`atualizado_em`=VALUES(`atualizado_em`),
              `juros_multa`=VALUES(`juros_multa`),`vencimento_original`=VALUES(`vencimento_original`),`invoice_url`=VALUES(`invoice_url`),`invoice_number`=VALUES(`invoice_number`)"));
        $n = 0;
        $this->pdo->beginTransaction();
        try {
            foreach ($itens as $c) {
                $id = AsaasValor::id($c['id'] ?? null); $valor = AsaasValor::dinheiro($c['value'] ?? null);
                $status = is_string($c['status'] ?? null) && preg_match('/^[A-Z_]{3,40}\z/', $c['status']) ? $c['status'] : null;
                if ($id === null || $valor === null || $status === null) throw new AsaasErro('resposta_invalida', 200);
                $st->execute([$conta, $ger, $id, $status, AsaasValor::curto($c['billingType'] ?? null, 24), $valor, AsaasValor::opcional($c, 'netValue', 'cobranca'),
                    AsaasValor::data($c['dueDate'] ?? null), AsaasValor::data($c['dateCreated'] ?? null), AsaasValor::data($c['paymentDate'] ?? ($c['clientPaymentDate'] ?? null)),
                    AsaasValor::data($c['creditDate'] ?? null), AsaasValor::id($c['customer'] ?? null), ($c['deleted'] ?? false) === true ? 1 : 0, $exec, $agora,
                    AsaasValor::opcional($c, 'interestValue', 'cobranca'), AsaasValor::data($c['originalDueDate'] ?? null),
                    AsaasValor::linkFatura($c['invoiceUrl'] ?? null), AsaasValor::numeroFatura($c['invoiceNumber'] ?? null)]);
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
                $st->execute([$conta, $id, AsaasValor::curto($t['type'] ?? null, 60), $valor, AsaasValor::opcional($t, 'balance', 'extrato'), AsaasValor::data($t['date'] ?? null),
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
        $q = is_string($q) && preg_match('/^(0|[1-9][0-9]{0,8})\z/', $q) === 1 ? (int) $q : (is_int($q) && $q >= 0 ? $q : null);
        if ($q === null || $v === null) throw new AsaasErro('resposta_invalida', 200);
        $this->q("INSERT INTO `{p}asaas_estatisticas` (`conta`,`geracao`,`chave`,`quantidade`,`valor`,`valor_liquido`,`consultado_em`) VALUES (?,?,?,?,?,?,?)
                  ON DUPLICATE KEY UPDATE `quantidade`=VALUES(`quantidade`),`valor`=VALUES(`valor`),`valor_liquido`=VALUES(`valor_liquido`),`consultado_em`=VALUES(`consultado_em`)",
                 [$conta, $ger, $chave, $q, $v, AsaasValor::opcional($d, 'netValue', 'estatistica'), $agora]);
    }

    /** B1: FIM do ciclo, numa transação — o que não veio fica presente=0 na geração desta rodada; troca a geração ativa com saldo e horário */
    public function concluir(int $exec, int $ger, string $conta, string $saldo, array $cont, string $agora, int $req, ?string $nome = null): void
    {
        $this->pdo->beginTransaction();
        try {
            $this->q("UPDATE `{p}asaas_cobrancas` SET `presente`=0 WHERE `conta`=? AND `geracao`=? AND `execucao`<>?", [$conta, $ger, $exec]);
            // nome: só troca com um nome VÁLIDO desta leitura; sem nome válido fica o que havia (nunca apaga com vazio)
            $this->q("UPDATE `{p}asaas_contas` SET `estado`='ok',`erro_codigo`=NULL,`geracao_ativa`=?,`execucao_ativa`=?,`ultima_sync_ok`=?,`saldo`=?,`saldo_em`=?,`atualizado_em`=?,`nome`=COALESCE(?,`nome`) WHERE `conta`=?",
                     [$ger, $exec, $agora, $saldo, $agora, $agora, $nome, $conta]);
            $this->q("UPDATE `{p}asaas_execucoes` SET `fim`=?,`resultado`='ok',`requisicoes`=?,`cobrancas`=?,`extrato`=? WHERE `id`=?",
                     [$agora, $req, $cont['cobrancas'] ?? 0, $cont['extrato'] ?? 0, $exec]);
            $this->pdo->commit();
        } catch (Throwable $e) { if ($this->pdo->inTransaction()) $this->pdo->rollBack(); throw $e; }
    }

    /** falha: a geração ATIVA, o saldo e o horário ficam como estavam; só o estado registra a falha */
    /** Clientes com cobrança vencida (OVERDUE/DUNNING_REQUESTED) na geração em gravação, sem nome no cache ou com cache de mais de 7 dias. */
    public function clientesSemNome(string $conta, int $ger, string $agora, int $max): array
    {
        return $this->q("SELECT DISTINCT c.`cliente_id` FROM `{p}asaas_cobrancas` c LEFT JOIN `{p}asaas_clientes` k ON k.`conta` = c.`conta` AND k.`cliente_id` = c.`cliente_id`
                          WHERE c.`conta` = ? AND c.`geracao` = ? AND c.`presente` = 1 AND c.`deletada` = 0 AND c.`status` IN ('OVERDUE','DUNNING_REQUESTED')
                            AND c.`cliente_id` IS NOT NULL AND (k.`cliente_id` IS NULL OR k.`nome` IS NULL OR k.`atualizado_em` < ? - INTERVAL 7 DAY)
                          ORDER BY c.`cliente_id` LIMIT " . max(1, min($max, 1000)), [$conta, $ger, $agora])->fetchAll(PDO::FETCH_COLUMN);
    }

    public function gravarCliente(string $conta, string $cid, ?string $nome, ?string $tipo, bool $deletado, string $agora): void
    {
        $this->q("INSERT INTO `{p}asaas_clientes` (`conta`,`cliente_id`,`nome`,`tipo_pessoa`,`deletado`,`atualizado_em`) VALUES (?,?,?,?,?,?)
                  ON DUPLICATE KEY UPDATE `nome`=VALUES(`nome`),`tipo_pessoa`=VALUES(`tipo_pessoa`),`deletado`=VALUES(`deletado`),`atualizado_em`=VALUES(`atualizado_em`)",
                 [$conta, $cid, $nome, $tipo, $deletado ? 1 : 0, $agora]);
    }

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
    public const MAX_CLIENTES_RODADA = 300;   // 26/11: nomes de clientes buscados por conta e por rodada (o resto vem na próxima)
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
            $info = $cli->get('conta');
            if (!hash_equals($identidade, $this->chaves->identidadeDe($info))) throw new AsaasErro('conta_divergente');
            // 25/11 (nome "ainda não lido"): o nome vem da MESMA resposta da identidade (commercialInfo), já conferida acima.
            $nome = AsaasValor::nomeConta($info);
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
            // 25/11 (divergencia_pending/overdue): a janela acima é por CRIAÇÃO (13 meses); cobrança em aberto criada antes dela (parcela de
            // parcelamento antigo, boleto antigo) ficava fora do local, e a estatística do Asaas (sem data) a soma. Puxa TODAS as abertas por status.
            // 26/11: + DUNNING_REQUESTED (negativação pedida: continua vencida, mas sai do status OVERDUE no Asaas)
            foreach (['PENDING', 'OVERDUE', 'DUNNING_REQUESTED'] as $s) {
                $nCob += $this->paginar($cli, 'cobrancas', ['status' => $s], fn(array $itens) => $this->repo->gravarCobrancas($conta, $ger, $exec, $itens, $ts));
            }
            // 26/11 (Cobranças vencidas): NOME dos clientes com cobrança vencida (cache; só nome e tipo de pessoa). Falha aqui NÃO derruba a
            // rodada: o nome fica null ("—") e é tentado de novo na próxima.
            foreach ($this->repo->clientesSemNome($conta, $ger, $ts, self::MAX_CLIENTES_RODADA) as $cid) {
                try {
                    ($this->pausaMs)(250);
                    $cl = $cli->get('cliente', ['id' => $cid]);
                    $this->repo->gravarCliente($conta, $cid, AsaasValor::nomeCliente($cl['name'] ?? null),
                        in_array($cl['personType'] ?? null, ['FISICA', 'JURIDICA'], true) ? $cl['personType'] : null, ($cl['deleted'] ?? false) === true, $ts);
                } catch (AsaasErro $e) {
                    if (in_array($e->codigo, ['chave_recusada', 'acesso_negado', 'limite'], true)) break;   // não insiste na rodada
                }
            }
            foreach (['PENDING', 'OVERDUE'] as $s) $this->repo->gravarEstatistica($conta, $ger, $s, $cli->get('estatisticas_cobrancas', ['status' => $s]), $ts);
            $nExt = $this->paginar($cli, 'extrato', ['startDate' => $agora->modify('-' . self::DIAS_EXTRATO . ' days')->format('Y-m-d'),
                'finishDate' => $agora->format('Y-m-d')], fn(array $itens) => $this->repo->gravarExtrato($conta, $exec, $itens, $ts));

            $this->repo->concluir($exec, $ger, $conta, $saldo, ['cobrancas' => $nCob, 'extrato' => $nExt], $ts, $cli->requisicoes, $nome);   // sucesso SÓ aqui
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
    public const LIMITE_VENCIDAS = 500;
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
        $agora = $agora->setTimezone($this->fuso);
        $contas = []; $todas = $rotulos !== [];
        $tot = ['saldo' => 0, 'a_receber' => 0, 'vencido' => 0, 'recebido_mes' => 0];   // centavos
        $this->noRetrato(function () use ($rotulos, $agora, &$contas, &$todas, &$tot): void {
            foreach ($rotulos as $r) {
                $c = $this->conta($r, $agora);
                $contas[] = $c;
                if ($c['disponivel'] !== true) { $todas = false; continue; }
                foreach ($tot as $k => $v) $tot[$k] = $v + AsaasValor::centavos($c['valores'][$k]);
            }
        });
        return ['contas' => $contas, 'total' => $todas ? array_map([AsaasValor::class, 'deCentavos'], $tot) : null,
                'total_parcial' => !$todas && $rotulos !== [], 'moeda' => 'BRL', 'gerado_em' => $agora->format(DATE_ATOM)];
    }

    /**
     * Ponteiro da conta e as mesmas portas do resumo (divergente / nunca sincronizada / desatualizada): sem número quando a porta fecha.
     * @return array{0:array, 1:?array}  [linha base já com o motivo, null] ou [linha base, ['c' => linha da conta, 'ok' => horário, 'ger' => geração ativa]]
     */
    private function ponteiro(string $r, DateTimeImmutable $agora): array
    {
        $st = $this->pdo->prepare("SELECT `nome`,`estado`,`erro_codigo`,`geracao_ativa`,`ultima_sync_ok`,`saldo` FROM `{$this->p}asaas_contas` WHERE `conta`=?");
        $st->execute([$r]);
        $c = $st->fetch(PDO::FETCH_ASSOC) ?: null;
        $st->closeCursor();
        if ($this->aposPonteiro !== null) ($this->aposPonteiro)($r);
        $base =['conta' => $r, 'nome' => $c['nome'] ?? null, 'disponivel' => false, 'valores' => null, 'atualizado_em' => null, 'aviso' => null, 'motivo' => null];
        if ($c !== null && $c['estado'] === 'divergente') return [['motivo' => 'conta_divergente'] + $base, null];   // B2: nunca mostra números de conta trocada
        if ($c === null || $c['ultima_sync_ok'] === null || $c['geracao_ativa'] === null) {
            return [['motivo' => $c !== null && $c['estado'] === 'erro' ? 'erro:' . $c['erro_codigo'] : 'nunca_sincronizada'] + $base, null];
        }
        $ok = new DateTimeImmutable((string) $c['ultima_sync_ok'], $this->fuso);
        if ($agora->getTimestamp() - $ok->getTimestamp() > self::LIMITE_ATRASO_MIN * 60) {
            return [['motivo' => 'desatualizada', 'atualizado_em' => $ok->format(DATE_ATOM), 'aviso' => $c['estado'] === 'erro' ? 'erro:' . $c['erro_codigo'] : null] + $base, null];
        }
        return [$base, ['c' => $c, 'ok' => $ok, 'ger' => (int) $c['geracao_ativa']]];
    }

    /** Leitura de TODAS as contas sob um mesmo retrato do banco (Codex DSHOW-112 A). */
    private function noRetrato(Closure $ler): mixed
    {
        if ($this->pdo->inTransaction()) throw new LogicException('AsaasResumo precisa de uma conexão fora de transação');
        $this->pdo->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        $this->pdo->exec('START TRANSACTION READ ONLY, WITH CONSISTENT SNAPSHOT');
        try { $v = $ler(); $this->pdo->exec('COMMIT'); return $v; }
        catch (Throwable $e) { try { $this->pdo->exec('ROLLBACK'); } catch (Throwable) {} throw $e; }
    }

    /**
     * Drill-down das VENCIDAS (ACIMA_ESQUERDA, 26/11) — por empresa: cobrança, cliente (código do cliente no Asaas: o nome não é sincronizado),
     * vencimento, valor e dias de atraso. Mesmas portas e mesmo retrato do resumo; `qtd` e `total` batem com `vencido_qtd` e `vencido` do resumo.
     * A lista vem da MAIS atrasada para a menos; acima de `$limite` por empresa, `truncada` = true (o total continua sendo o de todas).
     */
    public function vencidas(array $rotulos, DateTimeImmutable $agora, int $limite = self::LIMITE_VENCIDAS): array
    {
        $agora = $agora->setTimezone($this->fuso); $limite = max(1, min($limite, self::LIMITE_VENCIDAS));
        $hoje = new DateTimeImmutable($agora->format('Y-m-d'), $this->fuso);
        $contas = $this->noRetrato(function () use ($rotulos, $agora, $hoje, $limite): array {
            $out = [];
            foreach ($rotulos as $r) {
                [$base, $pt] = $this->ponteiro($r, $agora);
                unset($base['valores']);
                $base += ['qtd' => null, 'total' => null, 'truncada' => null, 'cobrancas' => null];
                if ($pt === null) { $out[] = $base; continue; }
                $q = $this->pdo->prepare("SELECT `payment_id`,`cliente_id`,`vencimento`,`valor`,`billing_type` FROM `{$this->p}asaas_cobrancas`
                       WHERE `conta`=? AND `geracao`=? AND `presente`=1 AND `deletada`=0 AND `status`='OVERDUE' ORDER BY `vencimento` IS NULL, `vencimento`, `payment_id`");
                $q->execute([$r, $pt['ger']]);
                $lista = []; $n = 0; $tot = 0;
                while (($x = $q->fetch(PDO::FETCH_ASSOC)) !== false) {
                    $n++; $c = AsaasValor::centavos((string) $x['valor']); $tot += $c;
                    if ($n > $limite) continue;
                    $v = $x['vencimento'] !== null ? new DateTimeImmutable((string) $x['vencimento'], $this->fuso) : null;
                    $lista[] = ['cobranca' => $x['payment_id'], 'cliente' => $x['cliente_id'], 'vencimento' => $v?->format('Y-m-d'), 'valor' => AsaasValor::deCentavos($c),
                                'dias_atraso' => $v !== null ? (int) $v->diff($hoje)->format('%r%a') : null, 'forma' => $x['billing_type']];
                }
                $out[] = ['disponivel' => true, 'atualizado_em' => $pt['ok']->format(DATE_ATOM), 'qtd' => $n, 'total' => AsaasValor::deCentavos($tot),
                          'truncada' => $n > $limite, 'cobrancas' => $lista] + $base;
            }
            return $out;
        });
        return ['contas' => $contas, 'limite_por_empresa' => $limite, 'moeda' => 'BRL', 'gerado_em' => $agora->format(DATE_ATOM)];
    }

    /**
     * 26/11 (Cobranças vencidas): TODAS as vencidas (OVERDUE + DUNNING_REQUESTED) das contas em dia, com o nome do cliente do cache, sob um mesmo
     * retrato do banco. Conta fora das portas (divergente / nunca / desatualizada) → em `sem_leitura`, sem número.
     * @return array{contas: list<array>, sem_leitura: list<array>, itens: list<array>}
     */
    public function vencidasDetalhadas(array $rotulos, DateTimeImmutable $agora): array
    {
        $agora = $agora->setTimezone($this->fuso);
        return $this->noRetrato(function () use ($rotulos, $agora): array {
            $contas = []; $sem = []; $itens = [];
            foreach ($rotulos as $r) {
                [$base, $pt] = $this->ponteiro($r, $agora);
                if ($pt === null) { $sem[] = ['conta' => $r, 'nome' => $base['nome'], 'motivo' => $base['motivo']]; continue; }
                $contas[] = ['conta' => $r, 'nome' => $base['nome'], 'atualizado_em' => $pt['ok']->format(DATE_ATOM)];
                $q = $this->pdo->prepare("SELECT c.`payment_id`, c.`cliente_id`, c.`status`, c.`billing_type`, c.`valor`, c.`juros_multa`, c.`vencimento`,
                        c.`vencimento_original`, c.`data_criacao`, c.`invoice_url`, c.`invoice_number`, k.`nome` AS cliente_nome
                       FROM `{$this->p}asaas_cobrancas` c LEFT JOIN `{$this->p}asaas_clientes` k ON k.`conta` = c.`conta` AND k.`cliente_id` = c.`cliente_id`
                      WHERE c.`conta` = ? AND c.`geracao` = ? AND c.`presente` = 1 AND c.`deletada` = 0 AND c.`status` IN ('OVERDUE','DUNNING_REQUESTED')");
                $q->execute([$r, $pt['ger']]);
                foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $x) $itens[] = ['conta' => $r] + $x;
            }
            return ['contas' => $contas, 'sem_leitura' => $sem, 'itens' => $itens];
        });
    }

    /**
     * PERF-001 (26/11 noite): a LISTA das vencidas paginada NO BANCO (ORDER BY + LIMIT numa consulta só, para todas as contas lidas), no mesmo
     * retrato consistente; o total vem do mesmo retrato. Mesma ordem do AsaasCobrancas::lista (chave + payment_id em ordem de bytes, como o strcmp):
     * dias = DATEDIFF(hoje, vencimento) com vencimento nulo = -1; valor; vencimento com nulo no fim ('9999-12-31'). Antes: todas as vencidas em memória.
     * @return array{contas:list<array>, sem_leitura:list<array>, itens:list<array>, total:int}
     */
    public function vencidasPagina(array $rotulos, DateTimeImmutable $agora, ?string $filtro, string $ordem, string $dir, int $pagina, int $porPagina): array
    {
        if (!in_array($ordem, ['dias', 'valor', 'vencimento'], true) || !in_array($dir, ['asc', 'desc'], true) || $pagina < 1 || $porPagina < 1 || $porPagina > 200)
            throw new InvalidArgumentException('lista');
        $agora = $agora->setTimezone($this->fuso); $hoje = $agora->format('Y-m-d');
        return $this->noRetrato(function () use ($rotulos, $agora, $hoje, $filtro, $ordem, $dir, $pagina, $porPagina): array {
            $contas = []; $sem = []; $pares = [];
            foreach ($rotulos as $r) {
                [$base, $pt] = $this->ponteiro($r, $agora);
                if ($pt === null) { $sem[] = ['conta' => $r, 'nome' => $base['nome'], 'motivo' => $base['motivo']]; continue; }
                $contas[] = ['conta' => $r, 'nome' => $base['nome'], 'atualizado_em' => $pt['ok']->format(DATE_ATOM)];
                if ($filtro === null || $filtro === $r) $pares[] = [$r, (int) $pt['ger']];
            }
            if ($pares === []) return ['contas' => $contas, 'sem_leitura' => $sem, 'itens' => [], 'total' => 0];
            $onde = '(' . implode(' OR ', array_fill(0, count($pares), '(c.`conta` = ? AND c.`geracao` = ?)')) . ") AND c.`presente` = 1 AND c.`deletada` = 0 AND c.`status` IN ('OVERDUE','DUNNING_REQUESTED')";
            $args = array_merge(...array_map(fn($x) => [$x[0], $x[1]], $pares));
            $n = $this->pdo->prepare("SELECT COUNT(*) FROM `{$this->p}asaas_cobrancas` c WHERE $onde"); $n->execute($args);
            $chave = match ($ordem) { 'dias' => 'COALESCE(DATEDIFF(?, c.`vencimento`), -1)', 'valor' => 'c.`valor`', 'vencimento' => "COALESCE(c.`vencimento`, '9999-12-31')" };
            $q = $this->pdo->prepare("SELECT c.`conta`, c.`payment_id`, c.`cliente_id`, c.`status`, c.`billing_type`, c.`valor`, c.`juros_multa`, c.`vencimento`,
                    c.`vencimento_original`, c.`data_criacao`, c.`invoice_url`, c.`invoice_number`, k.`nome` AS cliente_nome
                   FROM `{$this->p}asaas_cobrancas` c LEFT JOIN `{$this->p}asaas_clientes` k ON k.`conta` = c.`conta` AND k.`cliente_id` = c.`cliente_id`
                  WHERE $onde ORDER BY $chave " . strtoupper($dir) . ", CAST(c.`payment_id` AS BINARY) ASC LIMIT " . (int) $porPagina . ' OFFSET ' . (int) (($pagina - 1) * $porPagina));
            $q->execute($ordem === 'dias' ? array_merge($args, [$hoje]) : $args);
            return ['contas' => $contas, 'sem_leitura' => $sem, 'itens' => $q->fetchAll(PDO::FETCH_ASSOC), 'total' => (int) $n->fetchColumn()];
        });
    }

    private function conta(string $r, DateTimeImmutable $agora): array
    {
        [$base, $pt] = $this->ponteiro($r, $agora);
        if ($pt === null) return $base;
        ['c' => $c, 'ok' => $ok, 'ger' => $ger] = $pt;
        $mesIni = $agora->format('Y-m-01'); $mesFim = $agora->format('Y-m-t');
        $in = implode(',', array_fill(0, count(self::RECEBIDO), '?'));
        $q = $this->pdo->prepare("SELECT COALESCE(SUM(CASE WHEN `status`='PENDING' THEN `valor` END),0) a_receber,
               COALESCE(SUM(CASE WHEN `status`='OVERDUE' THEN `valor` END),0) vencido, COALESCE(SUM(`status`='OVERDUE'),0) vencido_qtd,
               COALESCE(SUM(CASE WHEN `status` IN ($in) AND `data_pagamento` BETWEEN ? AND ? THEN `valor` END),0) recebido_mes,
               COALESCE(SUM(CASE WHEN `status` IN ($in) AND `data_pagamento` BETWEEN ? AND ? THEN `valor_liquido` END),0) recebido_mes_liquido,
               COALESCE(SUM(`status` IN ($in) AND `data_pagamento` BETWEEN ? AND ? AND `valor_liquido` IS NULL),0) liquido_ausente
             FROM `{$this->p}asaas_cobrancas` WHERE `conta`=? AND `geracao`=? AND `presente`=1 AND `deletada`=0");
        $q->execute([...self::RECEBIDO, $mesIni, $mesFim, ...self::RECEBIDO, $mesIni, $mesFim, ...self::RECEBIDO, $mesIni, $mesFim, $r, $ger]);
        $v = $q->fetch(PDO::FETCH_ASSOC);
        $dec = static fn($x) => AsaasValor::deCentavos(AsaasValor::centavos((string) $x));
        // Decisão do Jhony (24/11): líquido ausente ou null explícito em QUALQUER cobrança recebida no mês → o líquido do mês fica INDISPONÍVEL
        // (null, "—" na conferência). Nunca o bruto no lugar, nunca uma soma parcial (mesma regra do Bling: ausência não vira valor).
        $valores = ['saldo' => $dec($c['saldo']), 'a_receber' => $dec($v['a_receber']), 'vencido' => $dec($v['vencido']), 'vencido_qtd' => (int) $v['vencido_qtd'],
                    'recebido_mes' => $dec($v['recebido_mes']), 'recebido_mes_liquido' => (int) $v['liquido_ausente'] === 0 ? $dec($v['recebido_mes_liquido']) : null];
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
