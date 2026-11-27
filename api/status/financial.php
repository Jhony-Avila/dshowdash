<?php
// Financial Status - v3.1.0-ENTERPRISE
// v3.1.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido rand(), dados reais do banco
// P3.5 FIX: Adicionado CORS centralizado
// MIG-001 degrau 1 (LOTE9, AZUL 26/11): a fonte legada INTEGRACAO.requisicoes saiu do caminho. Sem banco e sem cache: 503 explícito
//   {ok:false, error:LEGACY_SOURCE_UNAVAILABLE} (MIG-001-R1, 27/11, VINHO: "UNAVAILABLE", não "RETIRED" — a fonte NÃO foi aposentada; aguarda a fonte nova/Walter). Antes, o erro do banco virava 200 com zeros (indistinguível de "sem transações").
//   O portão de acesso do _init.php continua ANTES (sessão/permissão). Consumidor: panel-footer-financial (HTTP ≠ 2xx → mantém "--").
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

// Até a conciliação da fonte no ERP novo (RDS), com decisão do Jhony/Walter.
ApiResponse::error('LEGACY_SOURCE_UNAVAILABLE', 503, ['message' => 'Indicador financeiro indisponível.']);
