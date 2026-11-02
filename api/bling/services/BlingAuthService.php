<?php
// Bling / services/BlingAuthService.php - conexao e token valido
// @module  bling.service.auth
// @version 1.0.0
// @created 2026-07-30
//
// Ponto único de "me dá um token que funciona". Quem chama a API nunca lida com
// expiração, renovação ou cifra — pede o cliente pronto e usa.
declare(strict_types=1);

// Ponto de entrada único: `public/api` é symlink para esta árvore, então cada
// arquivo daqui é alcançável por HTTP. Sem este guarda, um usuário autenticado
// conseguiria executar internals fora do roteador — que é onde moram o gate de
// permissão, o CSRF e o envelope de resposta.
if (!defined('BLING_ENTRADA')) { http_response_code(404); exit; }

final class BlingAuthService
{
    public function __construct(
        private readonly BlingRepository $repo,
        private readonly BlingTransporte $transporte,
    ) {}

    // ── Conexão ─────────────────────────────────────────────────

    /** Passo 1: gera o state, persiste e devolve a URL para onde mandar o usuário. */
    public function iniciarConexao(int $userId, ?string $redirect = null): string
    {
        $oauth = new BlingOAuth($this->transporte);
        $state = BlingOAuth::novoState();
        // Persistir ANTES de redirecionar: um callback que chega sem state
        // conhecido é recusado, e é isso que impede o ataque.
        $this->repo->guardarState($state, $userId, $redirect);
        return $oauth->urlAutorizacao($state);
    }

    /**
     * Passo 2: o Bling devolve `code` + `state`.
     * @return array{account_id:int,novo:bool}
     */
    public function concluirConexao(string $codigo, string $state, array $dadosConta = []): array
    {
        $registro = $this->repo->consumirState($state);
        if ($registro === null) {
            // Pode ser ataque, mas na prática costuma ser o usuário voltando com
            // o botão do navegador. A mensagem serve para os dois casos.
            throw new RuntimeException(
                'Autorização inválida ou expirada. Inicie a conexão novamente.'
            );
        }

        $oauth = new BlingOAuth($this->transporte);
        $tokens = $oauth->trocarCodigo($codigo);

        $existente = $this->repo->contaPadrao();
        $accountId = $this->repo->criarOuAtualizarConta([
            'nome'   => $dadosConta['nome'] ?? 'Conta Bling',
            'cnpj'   => $dadosConta['cnpj'] ?? null,
            'estado_conexao' => 'conectado',
            'is_padrao' => $existente === null ? 1 : 0,
            'escopos'=> $dadosConta['escopos'] ?? null,
        ]);

        $this->repo->salvarTokens(
            $accountId, $tokens['access_token'], $tokens['refresh_token'],
            $tokens['expires_in'], $tokens['token_type'],
        );

        $this->repo->auditar([
            'account_id' => $accountId,
            'user_id'    => (int) $registro['user_id'],
            'acao'       => 'oauth.conectar',
            'entidade'   => 'bling_accounts',
            'entidade_id'=> (string) $accountId,
            'origem'     => 'callback',
        ]);

        return ['account_id' => $accountId, 'novo' => $existente === null];
    }

    // ── Token válido ────────────────────────────────────────────

    /**
     * Devolve um access_token utilizável, renovando se estiver perto de expirar.
     *
     * Renova com FOLGA (5 min): renovar só quando já expirou garante que alguma
     * requisição vai pegar 401 no meio de uma carga.
     */
    public function tokenValido(int $accountId): string
    {
        $t = $this->repo->tokens($accountId);
        if ($t === null || $t['access_token'] === null) {
            throw new RuntimeException(
                'Conta sem token. Conecte a conta no Bling antes de sincronizar.'
            );
        }

        if (!BlingOAuth::precisaRenovar($t['expira_em'])) {
            return $t['access_token'];
        }

        if ($t['refresh_token'] === null) {
            $this->repo->registrarFalhaRenovacao($accountId, 'Sem refresh_token gravado.');
            throw new RuntimeException(
                'O token expirou e não há refresh_token. É necessário reconectar a conta.'
            );
        }

        try {
            $oauth = new BlingOAuth($this->transporte);
            $novos = $oauth->renovar($t['refresh_token']);
        } catch (Throwable $e) {
            $this->repo->registrarFalhaRenovacao($accountId, $e->getMessage());
            throw new RuntimeException(
                'Não foi possível renovar o acesso ao Bling: ' . $e->getMessage()
            );
        }

        // refresh_token null aqui significa "mantenha o atual" — o repositório
        // usa COALESCE justamente por isso.
        $this->repo->salvarTokens(
            $accountId, $novos['access_token'], $novos['refresh_token'],
            $novos['expires_in'], $novos['token_type'],
        );

        return $novos['access_token'];
    }

    /** Cliente pronto para uso, com token já resolvido. */
    public function cliente(int $accountId): BlingClient
    {
        return new BlingClient(
            $this->transporte,
            $this->tokenValido($accountId),
            $this->repo,
            $accountId,
        );
    }

    public function desconectar(int $accountId, ?int $userId = null): void
    {
        $this->repo->pdo()->prepare(
            "UPDATE bling_accounts
                SET is_ativo = 0, estado_conexao = 'revogado', desconectado_em = UTC_TIMESTAMP()
              WHERE id = ?"
        )->execute([$accountId]);

        // Token some junto: manter credencial de conta desconectada é risco sem
        // contrapartida.
        $this->repo->pdo()->prepare('DELETE FROM bling_oauth_tokens WHERE account_id = ?')
            ->execute([$accountId]);

        $this->repo->auditar([
            'account_id' => $accountId, 'user_id' => $userId,
            'acao' => 'oauth.desconectar', 'entidade' => 'bling_accounts',
            'entidade_id' => (string) $accountId,
        ]);
    }
}
