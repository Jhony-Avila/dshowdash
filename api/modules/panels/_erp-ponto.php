<?php
// _erp-ponto.php — escolhe, POR PAINEL, a origem dos dados do ERP (rebase do patch 0002 de 30/10 sobre a P74 — AZUL, 26/11 noite):
//   flag global `erp_novo.<painel>` ligada + credencial só leitura do Dash → origem 'novo': `_erp-compat-novo.php` (ds_prod) + erp_novo_pdo();
//   senão → origem 'legado': `_erp-compat.php` + getConnection('DSHOW_PROD'), EXATAMENTE como antes.
// As constantes ERP_V_* têm o MESMO nome e o MESMO shape nas duas camadas: o SQL dos painéis não muda.
// Travas da origem nova (PM-007): autorização POR PESSOA antes do cache e da consulta; cache separado por origem; fonte fora = "indisponível" (503), nunca zero.
require_once __DIR__ . '/../../_helpers/ErpNovo.php';

/** 'novo' | 'legado' — decidida UMA vez por requisição (antes do cache) e carrega a camada correspondente. */
function erp_ponto_origem(string $painel): string
{
    static $origem = [];
    if (isset($origem[$painel])) { return $origem[$painel]; }
    $novo = erp_novo_ligado($painel);
    require_once __DIR__ . ($novo ? '/_erp-compat-novo.php' : '/_erp-compat.php');
    return $origem[$painel] = $novo ? 'novo' : 'legado';
}

/** Conexão da origem decidida. Na origem nova, falha → RuntimeException genérica (o painel responde 503 "indisponível"). */
function erp_ponto_pdo(string $painel): PDO
{
    return erp_ponto_origem($painel) === 'novo' ? erp_novo_pdo() : getConnection('DSHOW_PROD');
}

/** Compatibilidade com o nome do patch de 30/10. */
function erp_abrir_painel(string $painel): PDO { return erp_ponto_pdo($painel); }
