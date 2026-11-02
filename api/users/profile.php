<?php
// API: User Profile (plural) — DELEGADOR para o endpoint canônico singular.
// @version 3.0.0-DELEGATE
// @updated 2026-07-17
//
// PORQUÊ: a versão 2.2.0 fazia SELECT de colunas que NÃO existem mais em app_users
// (name/avatar/user_level/phone/timezone/language/bio/last_login) e lia app_user_preferences
// como colunas (theme/sidebar_collapsed/...), quando a tabela virou key-value (pref_key/pref_value).
// Resultado: GET retornava 500 DATABASE_ERROR e quebrava o panel-user-preferences (rotas
// /preferencias, /profile, /settings, /minha-conta), que consome /api/users/profile.php.
//
// FIX: em vez de duplicar (e re-driftar) a lógica, este arquivo passa a DELEGAR para o
// endpoint singular /api/user/profile.php (v4.0.0), que é a fonte única de verdade:
//   - GET  → perfil da sessão + enriquecimento app_user_profiles (via UserProfileRepository)
//   - POST/PUT/PATCH → edição do próprio perfil (CSRF), mesmo contrato { ok, data, error }.
// __DIR__ dentro do singular resolve para /api/user, então os require relativos dele seguem válidos.

declare(strict_types=1);

require __DIR__ . '/../user/profile.php';
