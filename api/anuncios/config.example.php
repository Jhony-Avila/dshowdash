<?php
// EXEMPLO de configuração do Decision Engine para o proxy /api/anuncios/ask.php.
//
// Copie este arquivo para (FORA do git — config/ nunca é versionado):
//   /var/www/dshowdash/config/decision_engine.php
// e preencha o auth_token com o MESMO valor de DECISION_ENGINE_AUTH_TOKEN
// usado pela API do Decision Engine (google-ads-decision-engine/api).
//
// Permissões sugeridas: chown www-data:www-data + chmod 640.

return [
    // URL interna do serviço (uvicorn api.main:app). Nunca exposta ao navegador.
    'base_url'        => 'http://127.0.0.1:8100',

    // Token enviado no header X-API-Key. Gere um valor longo e aleatório, ex.:
    //   openssl rand -hex 32
    'auth_token'      => 'PREENCHER',

    // Tempo máximo de espera (modo consultor com IA pode levar ~30s).
    'timeout_seconds' => 90,
];
