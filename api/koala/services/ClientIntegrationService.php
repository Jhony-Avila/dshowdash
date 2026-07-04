<?php
// /api/koala/services/ClientIntegrationService.php
// Integração com clientes/orçamentos do ERP remoto. Erro gracioso se o remoto não responder
// (o app nunca trava por causa do remoto). @module koala.service.client_integration @version 1.0.0-F2
declare(strict_types=1);

class ClientIntegrationService
{
    private RemoteErpRepository $erp;

    public function __construct(?RemoteErpRepository $erp = null)
    {
        $this->erp = $erp ?? new RemoteErpRepository();
    }

    private function graceful(callable $fn)
    {
        try {
            return $fn();
        } catch (RemoteUnavailableException $e) {
            ApiResponse::error('REMOTE_UNAVAILABLE', 503, [
                'message' => 'ERP indisponivel no momento. Tente novamente.',
            ]);
        }
    }

    public function search(string $q): array
    {
        return $this->graceful(fn() => $this->erp->searchClients($q));
    }

    public function orcamentos(int $clientId): array
    {
        return $this->graceful(fn() => $this->erp->getClientOrcamentos($clientId));
    }
}
