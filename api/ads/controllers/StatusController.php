<?php
// Ads / StatusController - estado da integracao/configuracao (caminho real degradado)
// @version 1.0.0
// @created 2026-07-21
// @app Ads Intelligence
//
// No modo mock, o status vem de AdsMock::status() (via AdsMockController). Este
// controller cobre o caminho REAL antes do provisionamento (developer token/OAuth/DB):
// reporta apenas prontidao de configuracao, sem quebrar o indicador do header.
declare(strict_types=1);

final class AdsStatusController
{
    /** Status degradado: caminho real ainda nao configurado (prontidao granular). */
    public static function degraded(): void
    {
        $r = class_exists('GoogleAdsClient') ? GoogleAdsClient::readiness() : [];
        $configurado = !empty($r['developer_token']) && !empty($r['oauth_client']) && !empty($r['crypto_key']);
        ApiResponse::success([
            'provider' => 'google',
            'phase' => $configurado ? 1 : 0,
            'db_ready' => !empty($r['db']),
            'oauth_configured' => !empty($r['oauth_client']),
            'developer_token_ready' => !empty($r['developer_token']),
            'crypto_ready' => !empty($r['crypto_key']),
            'login_customer_ready' => !empty($r['login_customer']),
            'accounts_total' => 0,
            'accounts_active' => 0,
            'accounts' => [],
            'currency' => null,
            'message' => $configurado
                ? 'Credenciais presentes; falta concluir OAuth + persistencia em ADS_DSHOW (Fase 1).'
                : 'Integracao Google Ads nao configurada. Use ADS_PROVIDER=mock para testes ou '
                    . 'provisione developer token + OAuth + banco ADS_DSHOW.',
        ]);
    }
}
