<?php
// /api/koala/repositories/RemoteErpRepository.php
// Leitura do ERP remoto (DSHOW_PROD). READ-ONLY POR CONSTRUÇÃO:
//  - a credencial disponível (.env) tem GRANT ALL (NÃO é read-only) -> RISCO registrado;
//  - defesa: (1) só métodos de SELECT preparado existem aqui; (2) SET SESSION TRANSACTION READ ONLY;
//    (3) max_execution_time e connect timeout curtos p/ o app nunca travar por causa do remoto.
// @module koala.repository.remote_erp @version 1.0.0-F2
declare(strict_types=1);

class RemoteUnavailableException extends \RuntimeException {}

class RemoteErpRepository
{
    private const CONNECT_TIMEOUT = 4;      // segundos (conexão)
    private const MAX_EXEC_MS      = 4000;  // ms (execução de SELECT)
    private const MAX_RESULTS      = 20;

    private ?\PDO $pdo = null;
    private array $cfg;

    /** $override permite testar o caminho de indisponibilidade (host inalcançável). */
    public function __construct(?array $override = null)
    {
        $this->cfg = $override ?? [
            'host' => getenv('DB_DSHOW_PROD_HOST') ?: ($_ENV['DB_DSHOW_PROD_HOST'] ?? ''),
            'port' => getenv('DB_DSHOW_PROD_PORT') ?: ($_ENV['DB_DSHOW_PROD_PORT'] ?? '3306'),
            'name' => getenv('DB_DSHOW_PROD_NAME') ?: ($_ENV['DB_DSHOW_PROD_NAME'] ?? ''),
            'user' => getenv('DB_DSHOW_PROD_USER') ?: ($_ENV['DB_DSHOW_PROD_USER'] ?? ''),
            'pass' => getenv('DB_DSHOW_PROD_PASS') ?: ($_ENV['DB_DSHOW_PROD_PASS'] ?? ''),
            'timeout' => self::CONNECT_TIMEOUT,
        ];
    }

    private function conn(): \PDO
    {
        if ($this->pdo !== null) { return $this->pdo; }
        $dsn = "mysql:host={$this->cfg['host']};port={$this->cfg['port']};dbname={$this->cfg['name']};charset=utf8mb4";
        try {
            $pdo = new \PDO($dsn, $this->cfg['user'], $this->cfg['pass'], [
                \PDO::ATTR_TIMEOUT            => (int) ($this->cfg['timeout'] ?? self::CONNECT_TIMEOUT),
                \PDO::ATTR_ERRMODE           => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            ]);
            // Guardas by-construction — TOLERANTES a servidor antigo/variante (não quebrar a conexão).
            // (1) Só leitura (defesa; a credencial tem GRANT ALL).
            try {
                $pdo->exec('SET SESSION TRANSACTION READ ONLY');
            } catch (\Throwable $e) {
                // A5 (consolidação 2026-07-04): NÃO quebra a conexão (servidor variante pode não
                // suportar), mas REGISTRA — a credencial tem GRANT ALL, então perder esta guarda
                // silenciosamente reduziria a defesa sem ninguém saber. Fica só SELECT-preparado +
                // LIMIT + timeouts como proteção. Visível no error_log para auditoria.
                error_log('[koala] AVISO seguranca: SET SESSION TRANSACTION READ ONLY falhou no ERP remoto ('
                    . $e->getMessage() . '). Defesa remota agora depende so de SELECT-preparado + LIMIT + timeouts.');
            }
            // (2) Teto de execução do SELECT: MySQL 5.7+ (max_execution_time, ms) OU MariaDB (max_statement_time, s).
            try {
                $pdo->exec('SET SESSION max_execution_time=' . self::MAX_EXEC_MS);
            } catch (\Throwable $e) {
                try { $pdo->exec('SET SESSION max_statement_time=' . (self::MAX_EXEC_MS / 1000)); } catch (\Throwable $e2) { /* nenhum suportado: LIMIT + connect timeout seguram */ }
            }
            $this->pdo = $pdo;
            return $pdo;
        } catch (\Throwable $e) {
            error_log('[koala] ERP remoto indisponivel: ' . $e->getMessage());
            throw new RemoteUnavailableException('ERP remoto indisponivel');
        }
    }

    /**
     * Busca clientes por nome/CNPJ/CPF/email/id_cliente/id_orcamento.
     * Queries DIRECIONADAS por tipo de termo (cada uma com LIMIT) — evita JOIN explosivo
     * + EXISTS correlacionado (que estourava o max_statement_time). Merge por cliente_id.
     */
    public function searchClients(string $q): array
    {
        $q = trim($q);
        if ($q === '') { return []; }
        $like = '%' . $q . '%';
        $digits = preg_replace('/\D/', '', $q) ?? '';
        $isNum = ctype_digit($q);
        $isEmail = strpos($q, '@') !== false;
        $lim = self::MAX_RESULTS;
        $found = [];

        $add = function (array $rows) use (&$found) {
            foreach ($rows as $r) { $found[(int) $r['cliente_id']] = $r; }
        };
        $run = function (string $sql, array $params) {
            $stmt = $this->conn()->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        };

        try {
            // (1) id_cliente e id_orcamento (numérico, indexado)
            if ($isNum) {
                $add($run("SELECT c.id AS cliente_id, e.tipo,
                             COALESCE(o.razao_social, p.nome) AS nome, o.nome_fantasia AS fantasia,
                             COALESCE(o.cnpj, p.cpf) AS documento
                           FROM ent_cliente c JOIN ent_entidade e ON e.id = c.id_entidade
                           LEFT JOIN ent_pessoa p ON p.id_entidade = c.id_entidade
                           LEFT JOIN ent_organizacao o ON o.id_entidade = c.id_entidade
                           WHERE c.id = :qn AND (c.deleted = 0 OR c.deleted IS NULL) LIMIT 5", [':qn' => (int) $q]));
                $add($run("SELECT c.id AS cliente_id, e.tipo,
                             COALESCE(o.razao_social, p.nome) AS nome, o.nome_fantasia AS fantasia,
                             COALESCE(o.cnpj, p.cpf) AS documento
                           FROM Orcamento orc
                           JOIN ent_cliente c ON c.id = orc.id_cliente
                           JOIN ent_entidade e ON e.id = c.id_entidade
                           LEFT JOIN ent_pessoa p ON p.id_entidade = c.id_entidade
                           LEFT JOIN ent_organizacao o ON o.id_entidade = c.id_entidade
                           WHERE orc.Id_Orc = :qn LIMIT 5", [':qn' => (int) $q]));
            }
            // (2) documento CNPJ/CPF (>= 4 dígitos)
            if (strlen($digits) >= 4) {
                $dig = '%' . $digits . '%';
                $add($run("SELECT c.id AS cliente_id, 'PJ' AS tipo, o.razao_social AS nome, o.nome_fantasia AS fantasia, o.cnpj AS documento
                           FROM ent_organizacao o JOIN ent_cliente c ON c.id_entidade = o.id_entidade
                           WHERE o.cnpj LIKE :dig AND (c.deleted = 0 OR c.deleted IS NULL) LIMIT $lim", [':dig' => $dig]));
                $add($run("SELECT c.id AS cliente_id, 'PF' AS tipo, p.nome AS nome, NULL AS fantasia, p.cpf AS documento
                           FROM ent_pessoa p JOIN ent_cliente c ON c.id_entidade = p.id_entidade
                           WHERE p.cpf LIKE :dig AND (c.deleted = 0 OR c.deleted IS NULL) LIMIT $lim", [':dig' => $dig]));
            }
            // (3) email (só se parecer email)
            if ($isEmail) {
                $add($run("SELECT DISTINCT c.id AS cliente_id, e.tipo,
                             COALESCE(o.razao_social, p.nome) AS nome, o.nome_fantasia AS fantasia,
                             COALESCE(o.cnpj, p.cpf) AS documento
                           FROM Contato_Email ce
                           LEFT JOIN ent_pessoa p ON p.id = ce.Id_Pessoa
                           LEFT JOIN ent_organizacao o ON o.id = ce.Id_Organizacao
                           JOIN ent_cliente c ON c.id_entidade = COALESCE(p.id_entidade, o.id_entidade)
                           JOIN ent_entidade e ON e.id = c.id_entidade
                           WHERE ce.Email LIKE :like AND (c.deleted = 0 OR c.deleted IS NULL) LIMIT $lim", [':like' => $like]));
            }
            // (4) nome (pessoa e organização, separados)
            if (!$isNum) {
                $add($run("SELECT c.id AS cliente_id, 'PF' AS tipo, p.nome AS nome, NULL AS fantasia, p.cpf AS documento
                           FROM ent_pessoa p JOIN ent_cliente c ON c.id_entidade = p.id_entidade
                           WHERE p.nome LIKE :like AND (c.deleted = 0 OR c.deleted IS NULL) LIMIT $lim", [':like' => $like]));
                $add($run("SELECT c.id AS cliente_id, 'PJ' AS tipo, o.razao_social AS nome, o.nome_fantasia AS fantasia, o.cnpj AS documento
                           FROM ent_organizacao o JOIN ent_cliente c ON c.id_entidade = o.id_entidade
                           WHERE (o.razao_social LIKE :like OR o.nome_fantasia LIKE :like) AND (c.deleted = 0 OR c.deleted IS NULL) LIMIT $lim", [':like' => $like]));
            }
        } catch (RemoteUnavailableException $e) {
            throw $e;
        } catch (\Throwable $e) {
            error_log('[koala] searchClients: ' . $e->getMessage());
            throw new RemoteUnavailableException('Falha na busca remota');
        }

        return array_slice(array_values($found), 0, self::MAX_RESULTS);
    }

    /** Detalhe completo do cliente (para o snapshot). */
    public function getClientDetail(int $clientId): ?array
    {
        $sql = 'SELECT c.id AS cliente_id, e.tipo,
                       p.cpf, p.nome AS pessoa_nome, p.primeiro_nome, p.sobrenome,
                       o.cnpj, o.razao_social, o.nome_fantasia, o.inscricao_estadual, o.situacao_cadastral
                FROM ent_cliente c
                JOIN ent_entidade e ON e.id = c.id_entidade
                LEFT JOIN ent_pessoa p ON p.id_entidade = c.id_entidade
                LEFT JOIN ent_organizacao o ON o.id_entidade = c.id_entidade
                WHERE c.id = ? AND (c.deleted = 0 OR c.deleted IS NULL) LIMIT 1';
        try {
            $stmt = $this->conn()->prepare($sql);
            $stmt->execute([$clientId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$row) { return null; }
            // e-mail principal (best-effort)
            $em = $this->conn()->prepare(
                'SELECT ce.Email FROM Contato_Email ce
                 JOIN ent_cliente c ON c.id = ?
                 LEFT JOIN ent_pessoa p ON p.id_entidade = c.id_entidade
                 LEFT JOIN ent_organizacao o ON o.id_entidade = c.id_entidade
                 WHERE (ce.Id_Pessoa = p.id OR ce.Id_Organizacao = o.id)
                 ORDER BY ce.Principal DESC LIMIT 1'
            );
            $em->execute([$clientId]);
            $row['email'] = $em->fetchColumn() ?: null;
            return $row;
        } catch (RemoteUnavailableException $e) {
            throw $e;
        } catch (\Throwable $e) {
            error_log('[koala] getClientDetail: ' . $e->getMessage());
            throw new RemoteUnavailableException('Falha ao ler cliente remoto');
        }
    }

    /** Orçamentos do cliente (cabeçalho). Sempre LIMIT. */
    public function getClientOrcamentos(int $clientId): array
    {
        $sql = 'SELECT Id_Orc, id_cliente, Nome_Cliente, Valor_Final, Subtotal, Id_Status, Nome_Vendedor, Data_Criacao
                FROM Orcamento WHERE id_cliente = ? ORDER BY Data_Criacao DESC LIMIT ' . self::MAX_RESULTS;
        try {
            $stmt = $this->conn()->prepare($sql);
            $stmt->execute([$clientId]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (RemoteUnavailableException $e) {
            throw $e;
        } catch (\Throwable $e) {
            error_log('[koala] getClientOrcamentos: ' . $e->getMessage());
            throw new RemoteUnavailableException('Falha ao ler orcamentos remotos');
        }
    }

    /** Itens de um orçamento (para importar como line items). */
    public function getOrcamentoItems(int $orcId): array
    {
        $sql = 'SELECT Id, Id_Orc, Id_Produto, Descricao, Qtd, Valor_Uni, Subtotal, Categoria, categoria_item, Observacao
                FROM Orcamento_Item WHERE Id_Orc = ? ORDER BY Id LIMIT 500';
        try {
            $stmt = $this->conn()->prepare($sql);
            $stmt->execute([$orcId]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (RemoteUnavailableException $e) {
            throw $e;
        } catch (\Throwable $e) {
            error_log('[koala] getOrcamentoItems: ' . $e->getMessage());
            throw new RemoteUnavailableException('Falha ao ler itens do orcamento');
        }
    }
}
