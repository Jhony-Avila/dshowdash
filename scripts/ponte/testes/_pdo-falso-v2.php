<?php
declare(strict_types=1);
/** Cópia de scripts/avatar/testes/_pdo-falso.php para a Ponte v2 (+ lastInsertId, query e `lancar` para simular PDOException). PDO/PDOStatement FALSOS para testar sem banco: prepare() casa a SQL normalizada com regex → linhas/afetadas; registra cada execute. */
class StmtFalsoV2 extends PDOStatement
{
    /** @var array<int,array<string,mixed>> */
    private array $linhas;
    private int $afetadas;
    public array $binds = [];
    public function __construct(public string $sql, array $linhas = [], int $afetadas = 0)
    {
        $this->linhas = $linhas;
        $this->afetadas = $afetadas;
    }
    public function execute(?array $params = null): bool { $this->binds = $params ?? []; return true; }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed { return $this->linhas[0] ?? false; }
    public function fetchColumn(int $column = 0): mixed { $l = $this->linhas[0] ?? null; return $l === null ? false : array_values($l)[$column] ?? false; }
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array
    {
        if ($mode === PDO::FETCH_COLUMN) { return array_map(static fn($l) => array_values($l)[0], $this->linhas); }
        return $this->linhas;
    }
    public function rowCount(): int { return $this->afetadas; }
    public function getIterator(): Iterator { return new ArrayIterator($this->linhas); }
}

final class PdoFalsoV2 extends PDO
{
    /** @var array<int,array{0:string,1:array}> */
    public array $executadas = [];
    public array $respostas = [];   // [regex => linhas]
    public bool $emTransacao = false;
    public array $eventos = [];
    public function __construct() {}
    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        $norm = preg_replace('/\s+/', ' ', trim($query));
        foreach ($this->lancar as $re => $msg) { if (preg_match($re, $norm)) { throw new PDOException($msg); } }
        $linhas = []; $afetadas = 0;
        foreach ($this->respostas as $re => $resp) {
            if (preg_match($re, $norm)) { $linhas = $resp['linhas'] ?? []; $afetadas = $resp['afetadas'] ?? 0; break; }
        }
        $st = new class($norm, $linhas, $afetadas, $this) extends StmtFalsoV2 {
            public function __construct(string $sql, array $l, int $a, private PdoFalsoV2 $pdo) { parent::__construct($sql, $l, $a); }
            public function execute(?array $params = null): bool { $this->pdo->executadas[] = [$this->sql, $params ?? []]; return parent::execute($params); }
        };
        return $st;
    }
    /** @var array<string,string> regex → mensagem: prepare() lança PDOException (simula banco em falha) */
    public array $lancar = [];
    public function lastInsertId(?string $name = null): string|false { $this->eventos[] = 'lastInsertId'; return '77'; }
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false { $st = $this->prepare($query); $st->execute([]); return $st; }
    public function beginTransaction(): bool { $this->emTransacao = true; $this->eventos[] = 'begin'; return true; }
    public function commit(): bool { $this->emTransacao = false; $this->eventos[] = 'commit'; return true; }
    public function rollBack(): bool { $this->emTransacao = false; $this->eventos[] = 'rollback'; return true; }
    public function inTransaction(): bool { return $this->emTransacao; }
}

