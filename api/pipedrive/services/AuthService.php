<?php
// Pipedrive / AuthService - orquestra validar/conectar/reconectar credencial
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
declare(strict_types=1);

final class PipeAuthService
{
    private PipeAccountRepository $repo;

    public function __construct(PipeAccountRepository $repo)
    {
        $this->repo = $repo;
    }

    /**
     * Testa um token SEM salvar. Retorna dados publicos da conta ou erro.
     * @return array ['ok'=>bool, 'company'=>?array, 'error'=>?string, 'meta'=>array]
     */
    public function validate(string $token): array
    {
        $token = trim($token);
        if ($token === '') {
            return ['ok' => false, 'error' => 'EMPTY_TOKEN'];
        }
        $client = new PipedriveClient($token);
        $res = $client->validateToken();
        $this->repo->logApiRequest('GET', '/v1/users/me', $res);

        if (!$res['ok']) {
            return [
                'ok'    => false,
                'error' => $this->friendlyError($res),
                'status'=> $res['status'] ?? 0,
                'meta'  => $this->publicMeta($res['meta'] ?? []),
            ];
        }
        return [
            'ok'      => true,
            'company' => $this->publicCompany($res['data']),
            'meta'    => $this->publicMeta($res['meta'] ?? []),
        ];
    }

    /** Valida e, se ok, cifra + persiste a credencial (status=connected). */
    public function connect(string $token): array
    {
        $r = $this->validate($token);
        if (!$r['ok']) {
            return $r;
        }
        // revalidar cru para ter o payload completo p/ upsert
        $client = new PipedriveClient(trim($token));
        $res = $client->validateToken();
        if (!$res['ok']) {
            return ['ok' => false, 'error' => $this->friendlyError($res)];
        }
        $this->repo->upsertFromValidation($res['data'], trim($token), 'token');
        return [
            'ok'      => true,
            'saved'   => true,
            'company' => $this->publicCompany($res['data']),
            'status'  => $this->repo->publicStatus(),
        ];
    }

    /** Reconectar = mesmo fluxo de connect (substitui a credencial ativa). */
    public function reconnect(string $token): array
    {
        return $this->connect($token);
    }

    /** Desconecta: desativa a credencial ativa (sem apagar o historico). */
    public function disconnect(): array
    {
        $had = $this->repo->deactivateActive();
        return [
            'ok'           => true,
            'disconnected' => $had,
            'status'       => $this->repo->publicStatus(),
        ];
    }

    public function status(): array
    {
        return $this->repo->publicStatus();
    }

    // ── helpers ──────────────────────────────────────────────
    private function publicCompany(array $me): array
    {
        return [
            'user_id'      => isset($me['id']) ? (int)$me['id'] : null,
            'user_name'    => $me['name'] ?? null,
            'user_email'   => $me['email'] ?? null,
            'is_admin'     => isset($me['is_admin']) ? (bool)$me['is_admin'] : null,
            'company_id'   => isset($me['company_id']) ? (int)$me['company_id'] : null,
            'company_name' => $me['company_name'] ?? null,
            'company_domain' => $me['company_domain'] ?? null,
            'timezone'     => $me['timezone_name'] ?? null,
            'currency'     => $me['default_currency'] ?? null,
        ];
    }

    private function publicMeta(array $meta): array
    {
        return [
            'ratelimit_remaining' => $meta['ratelimit_remaining'] ?? null,
            'daily_token_left'    => $meta['daily_token_left'] ?? null,
            'daily_token_limit'   => $meta['daily_token_limit'] ?? null,
            'duration_ms'         => $meta['duration_ms'] ?? null,
        ];
    }

    private function friendlyError(array $res): string
    {
        $status = $res['status'] ?? 0;
        if ($status === 401) return 'CREDENCIAL_INVALIDA';
        if ($status === 403) return 'PERMISSAO_INSUFICIENTE';
        if ($status === 0)   return 'FALHA_DE_REDE';
        return 'ERRO_' . $status;
    }
}
