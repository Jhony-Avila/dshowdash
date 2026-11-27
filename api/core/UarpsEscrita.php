<?php
// UarpsEscrita — UARPS · saneamento, item A (AZUL, 27/11/2026): a UNIDADE de gravação das permissões individuais (gatilho e região).
//
// Contrato (decisão do arquiteto, 27/11):
//  • toda escrita de permissão (individual, lote, remoção, reset) grava a REGRA e o EVENTO em app_uarps_audit_log na MESMA transação:
//    chave, alvo, ator, operação, antes e depois (estado, vencimento, motivo), origem e instante;
//  • se o evento falhar → ROLLBACK de tudo e erro explícito na API (nunca sucesso com auditoria perdida);
//  • idempotência por id de operação: o mesmo id com o mesmo pedido devolve o resultado gravado (sem reaplicar nem duplicar eventos);
//    o mesmo id com OUTRO pedido = 409; duas requisições simultâneas com o mesmo id se serializam pela PK da operação;
//  • app_permission_audit_log fica só para catálogo e papéis (PermissaoAuditoria) — nada daqui escreve lá.
// Depende da migração scripts/uarps/migracao-uarps-escrita-20261127.sql (portão de banco). Sem ela: 503 explícito, nada gravado.
declare(strict_types=1);

final class UarpsEscritaErro extends \RuntimeException
{
    public function __construct(public readonly string $codigo, public readonly int $http, string $mensagem, public readonly array $detalhes = [])
    {
        parent::__construct($mensagem);
    }
}

final class UarpsEscrita
{
    public const ORIGENS = ['editor', 'lote', 'api', 'reset', 'remocao'];

    public function __construct(private readonly \PDO $pdo) {}

    /**
     * Executa UMA operação administrativa de permissão como unidade indivisível.
     * @param callable(UarpsEscrita): array $aplicar  grava regras e chama evento() para cada mudança; devolve o resultado da operação
     * @return array resultado (+ 'operacao_id'; + 'repeticao' => true quando é a mesma operação já concluída)
     */
    public function executar(string $operacaoId, string $tipo, int $ator, int $alvo, array $pedido, callable $aplicar): array
    {
        if (preg_match('/^[A-Za-z0-9-]{16,64}\z/', $operacaoId) !== 1) {
            throw new UarpsEscritaErro('OPERACAO_ID_INVALIDO', 400, 'Id de operação ausente ou inválido (16–64 caracteres: letras, dígitos e hífen).');
        }
        if ($this->pdo->inTransaction()) {
            throw new UarpsEscritaErro('UARPS_ESCRITA_FALHOU', 500, 'Transação já aberta antes da operação de permissão.');
        }
        $digest = hash('sha256', json_encode([$tipo, $alvo, self::canonico($pedido)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $this->pdo->beginTransaction();
        try {
            try {
                $this->pdo->prepare('INSERT INTO app_uarps_operacoes (operacao_id, tipo, ator, alvo, digest, criado_em) VALUES (?, ?, ?, ?, ?, NOW(3))')
                    ->execute([$operacaoId, $tipo, $ator, $alvo, $digest]);
            } catch (\PDOException $e) {
                $erro = (int) ($e->errorInfo[1] ?? 0);
                $this->pdo->rollBack();
                if ($erro === 1062) { return $this->repeticao($operacaoId, $digest); }
                if ($erro === 1146 || $erro === 1054) {
                    throw new UarpsEscritaErro('UARPS_ESCRITA_INDISPONIVEL', 503, 'Registro de operações de permissão não instalado: nenhuma alteração feita.');
                }
                throw $e;
            }
            $resultado = $aplicar($this);
            $resultado['operacao_id'] = $operacaoId;
            $this->pdo->prepare('UPDATE app_uarps_operacoes SET resultado_json = ? WHERE operacao_id = ?')
                ->execute([json_encode($resultado, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $operacaoId]);
            $this->pdo->commit();
            return $resultado;
        } catch (UarpsEscritaErro $e) {
            if ($this->pdo->inTransaction()) { $this->pdo->rollBack(); }
            throw $e;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) { $this->pdo->rollBack(); }
            error_log('[uarps-escrita] operação desfeita: ' . get_class($e));   // sem mensagem (pode trazer SQL)
            throw new UarpsEscritaErro('UARPS_ESCRITA_FALHOU', 500, 'A alteração de permissão não foi gravada (regra e auditoria desfeitas juntas).');
        }
    }

    /**
     * Grava UM evento de auditoria; chamado de dentro de executar(). Falha = exceção → a operação inteira é desfeita.
     * @param ?array $antes  ['state'=>…, 'expires_at'=>…, 'reason'=>…] ou null (não existia)
     * @param ?array $depois idem, ou null (removida)
     */
    public function evento(string $operacaoId, string $acao, string $entidade, string $chave, int $alvo, int $ator, ?array $antes, ?array $depois, ?string $motivo, string $origem, string $ip): void
    {
        if (!in_array($entidade, ['trigger', 'region'], true)) { throw new \InvalidArgumentException('entidade'); }
        if (!in_array($origem, self::ORIGENS, true)) { throw new \InvalidArgumentException('origem'); }
        $st = $this->pdo->prepare(
            'INSERT INTO app_uarps_audit_log
               (user_id, action, entity_type, entity_id, target_user_id, old_state, new_state, reason, ip_address, operacao_id, origem, antes_json, depois_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $st->execute([
            $ator, $acao, $entidade, $chave, $alvo, $antes['state'] ?? null, $depois['state'] ?? null,
            $motivo === null ? null : mb_substr($motivo, 0, 255), mb_substr($ip, 0, 45), $operacaoId, $origem,
            $antes === null ? null : json_encode($antes, JSON_UNESCAPED_UNICODE), $depois === null ? null : json_encode($depois, JSON_UNESCAPED_UNICODE),
        ]);
        if ($st->rowCount() !== 1) { throw new \RuntimeException('evento de auditoria não gravado'); }
    }

    private function repeticao(string $operacaoId, string $digest): array
    {
        $st = $this->pdo->prepare('SELECT digest, resultado_json FROM app_uarps_operacoes WHERE operacao_id = ?');
        $st->execute([$operacaoId]);
        $linha = $st->fetch(\PDO::FETCH_ASSOC);
        if (!$linha || !hash_equals((string) $linha['digest'], $digest)) {
            throw new UarpsEscritaErro('OPERACAO_ID_REUTILIZADO', 409, 'Este id de operação já foi usado com outro pedido: nada foi alterado.');
        }
        $r = json_decode((string) ($linha['resultado_json'] ?? ''), true);
        if (!is_array($r)) {
            throw new UarpsEscritaErro('OPERACAO_EM_ANDAMENTO', 409, 'A operação com este id ainda não terminou: consulte de novo.');
        }
        return $r + ['repeticao' => true];
    }

    private static function canonico(mixed $v): mixed
    {
        if (!is_array($v)) { return $v; }
        if (array_is_list($v)) { return array_map([self::class, 'canonico'], $v); }
        ksort($v);
        return array_map([self::class, 'canonico'], $v);
    }
}
