<?php
declare(strict_types=1);

/**
 * /api/avatar/studio.php — persistência oficial do Avatar Studio.
 * @version 1.7.0
 * @changelog 1.7.0 (2026-07-30) — RETOMADA DO 3D (fila #37): GET devolve
 *   também config_3d_recente (último formato:'3d' do usuário, RE-VALIDADO
 *   por avst_validar_config3d na leitura — fail-closed até contra linhas
 *   antigas); o Estúdio 3D reabre exatamente onde o usuário parou
 *   (sockets, palco vivo, cores, morfos), inclusive após reativar uma
 *   versão 3D pelo Histórico.
 * @changelog 1.6.0 (2026-07-30) — FOTO ESTILIZADA (4.6 §21, decisão #42):
 *   POST {foto, config_foto?, base_version} aceita parâmetros de APRESENTAÇÃO
 *   (fundo/banner/aura/efeito/moldura/emblema/título/destaque — NUNCA
 *   roupa/corpo) validados campo a campo e gravados como formato:
 *   'foto_estilizada' junto do PNG composto (re-encodado GD, como sempre);
 *   travas de desbloqueio valem também para os assets sobre a foto.
 * @changelog 1.5.0 (2026-07-30) — HISTÓRICO COMPLETO (4.6 §22, decisão #42):
 *   GET ?historico=1 passa a 100 itens com nome/fixado/ativo/versão (JOIN
 *   avatar_version_meta); POST {historico_meta:{id,nome?,fixado?}} nomeia e
 *   fixa versões (posse pela sessão); retenção de 100 versões por usuário
 *   com poda pós-salvamento — FIXADAS e a ATIVA nunca são podadas.
 * @changelog 1.4.0 (2026-07-30) — PERSISTÊNCIA 3D (Fase 2, PoC aprovada):
 *   POST {config3d, render, base_version} salva parâmetros JSON formato:'3d'
 *   (decisão #31) + PNG derivado re-encodado via GD como avatar oficial;
 *   GET/histórico reconhecem tipo_ativo '3d'.
 * @changelog 1.3.0 (2026-07-30) — desbloqueio validado no backend (403)
 * @changelog 1.2.0 (2026-07-29) — galeria de fotos (GET ?fotos=1, dedup por
 *   arquivo) e REATIVAÇÃO (POST {reativar_id}: clona a linha antiga como nova
 *   versão ativa reaproveitando o MESMO arquivo — histórico continua
 *   append-only; posse verificada por user_id da sessão, sem IDOR).
 * @changelog 1.1.0 (2026-07-29) — upload de FOTO (data:image/png recortado no
 *   front, re-ENCODADO no servidor via GD → mata payload embutido/polyglot,
 *   480×480, avatar_type='image'); GET devolve também tipo_ativo e
 *   config_camadas_recente (o estúdio recupera o último trabalho em camadas
 *   mesmo com foto ativa); rate limit passa a contar generated+image.
 * @created 2026-07-29
 *
 * Contrato (envelope {ok,data,error,meta} padrão do dash):
 *   GET               → { config, version, render_url, avatar_url,
 *                         tipo_ativo: 'camadas'|'foto'|'3d'|'legado'|null,
 *                         config_camadas_recente, config_3d_recente }
 *   GET ?historico=1  → { itens: [{id, tipo, config, url, criado_em, nome,
 *                         fixado, ativo, versao}], retencao } (100)
 *   POST {config,svg,base_version}  → salva avatar em camadas (SVG sanitizado)
 *   POST {foto,base_version}        → salva foto recortada (PNG re-encodado)
 *   POST {historico_meta:{id,nome?,fixado?}} → nomeia/fixa versão do usuário
 *   base_version divergente → 409 (conflito entre abas).
 *
 * SEGURANÇA: nada do front é confiado — config é RECONSTRUÍDO campo a campo
 * (ids por regex, cores hex), o SVG passa por whitelist fail-closed, fotos
 * são re-encodadas pixel a pixel via GD, o user_id vem SEMPRE da sessão
 * (nunca do payload — sem IDOR), CSRF na escrita, rate limit 30/h.
 * Convive com o sistema legado: linhas antigas ficam intactas (is_active=0).
 */

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/SvgSanitizer.php';
require_once __DIR__ . '/VidaLib.php';

CorsPolicy::setupApiEndpoint([
    'methods'  => ['GET', 'POST', 'OPTIONS'],
    'no_cache' => true,
]);

$metodo = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($metodo, ['GET', 'POST'], true)) {
    header('Allow: GET, POST, OPTIONS');
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

SessionGate::start();
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}
$userId = (int) SessionGate::getUserId();

const AVST_DIR_PUBLICO = '/assets/avatars/studio';
const AVST_LIMITE_HORA = 30;
const AVST_RETENCAO_VERSOES = 100;  // §22: últimas N por usuário (fixadas nunca saem)
const AVST_NOME_VERSAO_MAX = 60;    // limite do label (espelha avatar_version_meta)

/** Envelope de sucesso (mesmo shape do restante do dash). */
function avst_ok(array $data): void
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        ['ok' => true, 'data' => $data, 'error' => null, 'meta' => ['endpoint' => 'avatar/studio', 'version' => '1.0.0']],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function avst_erro(string $codigo, int $status, array $extra = []): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        ['ok' => false, 'data' => $extra ?: null, 'error' => $codigo, 'meta' => ['endpoint' => 'avatar/studio']],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

/**
 * Reconstrói um AvatarConfig VÁLIDO a partir de entrada não confiável.
 * Espelha validarConfig() do front (ids [a-z0-9_], categorias fixas, hex).
 */
function avst_validar_config($bruto): array
{
    if (!is_array($bruto)) {
        throw new InvalidArgumentException('CONFIG_INVALIDO');
    }
    $reId = '/^[a-z0-9_]{1,40}$/';

    $base = $bruto['base'] ?? null;
    if (!is_string($base) || !preg_match($reId, $base)) {
        throw new InvalidArgumentException('CONFIG_BASE_INVALIDA');
    }

    // aura/banner/emblema: Expansão (decisão #33 — categorias 2D imediatas)
    // acessorio_* : slots ADITIVOS (4.6 §20, decisão #41); 'acessorio'
    // legado segue aceito — o front canonicaliza para o slot do item
    $categorias = ['cabelo', 'olhos', 'boca', 'roupa', 'acessorio',
        'acessorio_cabeca', 'acessorio_rosto', 'acessorio_pescoco', 'fundo',
        'moldura', 'efeito', 'aura', 'banner', 'emblema'];
    $camadas = [];
    foreach ($categorias as $cat) {
        $id = $bruto['camadas'][$cat] ?? null;
        if ($id === null || $id === 'nenhum') {
            continue;
        }
        if (!is_string($id) || !preg_match($reId, $id)) {
            throw new InvalidArgumentException("CONFIG_CAMADA_INVALIDA:$cat");
        }
        $camadas[$cat] = $id;
    }

    $cores = [];
    foreach (['pele', 'cabelo', 'roupa', 'destaque'] as $slot) {
        $hex = $bruto['cores'][$slot] ?? null;
        if (!is_string($hex) || !preg_match('/^#[0-9a-f]{6}$/i', $hex)) {
            throw new InvalidArgumentException("CONFIG_COR_INVALIDA:$slot");
        }
        $cores[$slot] = strtolower($hex);
    }

    $versao = $bruto['versao'] ?? 1;

    $saida = [
        'formato' => 'camadas',
        'versao'  => is_int($versao) ? $versao : 1,
        'base'    => $base,
        'camadas' => (object) $camadas, // objeto mesmo vazio ({} e não [])
        'cores'   => $cores,
    ];
    // título (Expansão §27) — opcional; mesmo regex de id do catálogo
    $titulo = $bruto['titulo'] ?? null;
    if (is_string($titulo) && preg_match($reId, $titulo)) {
        $saida['titulo'] = $titulo;
    }
    return $saida;
}

/**
 * Reconstrói o estilo da FOTO ESTILIZADA (4.6 §21) campo a campo.
 * Só categorias de APRESENTAÇÃO são aceitas — roupa/corpo nunca entram.
 * @return array|null null = sem estilização (foto simples)
 */
function avst_validar_config_foto($bruto): ?array
{
    if (!is_array($bruto)) {
        return null;
    }
    $reId = '/^[a-z0-9_]{1,40}$/';
    $camadas = [];
    foreach (['fundo', 'banner', 'aura', 'efeito', 'moldura', 'emblema'] as $cat) {
        $id = $bruto['camadas'][$cat] ?? null;
        if ($id === null || $id === 'nenhum') {
            continue;
        }
        if (!is_string($id) || !preg_match($reId, $id)) {
            throw new InvalidArgumentException("FOTO_ESTILO_INVALIDO:$cat");
        }
        $camadas[$cat] = $id;
    }
    $saida = [
        'formato' => 'foto_estilizada',
        'versao'  => 1,
        'camadas' => (object) $camadas,
        'cores'   => new stdClass(),
    ];
    $destaque = $bruto['cores']['destaque'] ?? null;
    if (is_string($destaque) && preg_match('/^#[0-9a-f]{6}$/i', $destaque)) {
        $saida['cores'] = ['destaque' => strtolower($destaque)];
    }
    $titulo = $bruto['titulo'] ?? null;
    if (is_string($titulo) && preg_match($reId, $titulo)) {
        $saida['titulo'] = $titulo;
    }
    // megas 51–54: AJUSTES não destrutivos — números clampados campo a
    // campo (entrada hostil vira neutro e some); nada além da whitelist.
    $aj = $bruto['ajustes'] ?? null;
    if (is_array($aj)) {
        $clamp = function ($v, float $min, float $max, float $neutro): float {
            return is_numeric($v) ? max($min, min($max, (float) $v)) : $neutro;
        };
        $limpo = [];
        $mapa = [
            'brilho' => [0.5, 1.5, 1.0], 'contraste' => [0.5, 1.5, 1.0],
            'saturacao' => [0.0, 2.0, 1.0], 'temperatura' => [-1.0, 1.0, 0.0],
            'vinheta' => [0.0, 1.0, 0.0], 'rotacao' => [-180.0, 180.0, 0.0],
        ];
        foreach ($mapa as $campo => [$min, $max, $neutro]) {
            $v = $clamp($aj[$campo] ?? null, $min, $max, $neutro);
            if ($v !== $neutro) {
                $limpo[$campo] = $v;
            }
        }
        foreach (['espelhar', 'sombra'] as $campo) {
            if (($aj[$campo] ?? null) === true) {
                $limpo[$campo] = true;
            }
        }
        if ($limpo !== []) {
            $saida['ajustes'] = $limpo;
        }
    }
    return $camadas === [] && !isset($saida['titulo']) && !isset($saida['ajustes']) ? null : $saida;
}

/**
 * Reconstrói um Config3D VÁLIDO (Fase 2 — persistência por PARÂMETROS,
 * decisão #31: nunca arquivos; mesmo JSON → mesma cena). Enums fechados,
 * cores hex, números clampados 0..1 — entrada hostil vira config padrão.
 */
function avst_validar_config3d($bruto): array
{
    if (!is_array($bruto)) {
        throw new InvalidArgumentException('CONFIG3D_INVALIDO');
    }
    $enum = function ($v, array $ops, string $pad) {
        return in_array($v, $ops, true) ? $v : $pad;
    };
    $hex = function ($v, string $pad) {
        return (is_string($v) && preg_match('/^#[0-9a-f]{6}$/i', $v)) ? strtolower($v) : $pad;
    };
    $n01 = function ($v) {
        return is_numeric($v) ? max(0.0, min(1.0, round((float) $v, 3))) : 0.0;
    };
    $variantes = ['casual', 'terno', 'punk', 'aventureiro'];
    $cores = is_array($bruto['cores'] ?? null) ? $bruto['cores'] : [];
    $mat = is_array($bruto['material'] ?? null) ? $bruto['material'] : [];
    $mor = is_array($bruto['morfos'] ?? null) ? $bruto['morfos'] : [];
    // 14 SOCKETS do 3D (4.6 §20, decisão #41) — contrato fechado; o
    // conteúdo por socket chega nas próximas levas 3D (fila #37 item 2).
    $socketsValidos = ['head', 'face', 'eyes', 'ears', 'neck', 'shoulders',
        'back', 'waist', 'wrist_l', 'wrist_r', 'hand_l', 'hand_r',
        'companion', 'pet'];
    $sockets = [];
    foreach ((array) ($bruto['sockets'] ?? []) as $socket => $idItem) {
        if (in_array($socket, $socketsValidos, true)
            && is_string($idItem) && preg_match('/^[a-z0-9_]{1,40}$/', $idItem)) {
            $sockets[$socket] = $idItem;
        }
    }
    return [
        'formato'   => '3d',
        'versao'    => 1,
        'arquetipo' => $enum($bruto['arquetipo'] ?? '', ['humano', 'androide', 'animal'], 'humano'),
        'roupa'     => $enum($bruto['roupa'] ?? '', $variantes, 'casual'),
        'cabeca'    => $enum($bruto['cabeca'] ?? '', $variantes, 'casual'),
        'mochila'   => (bool) ($bruto['mochila'] ?? false),
        'sockets'   => (object) $sockets,
        'cores'     => [
            'pele'    => $hex($cores['pele'] ?? null, '#e0ac69'),
            'cabelo'  => $hex($cores['cabelo'] ?? null, '#3b2a1e'),
            'roupa'   => $hex($cores['roupa'] ?? null, '#7c5cff'),
            'detalhe' => $hex($cores['detalhe'] ?? null, '#e8ecf5'),
        ],
        'material'  => ['metal' => $n01($mat['metal'] ?? 0), 'brilho' => $n01($mat['brilho'] ?? 0.35)],
        'morfos'    => [
            'bravo'    => $n01($mor['bravo'] ?? 0),
            'surpreso' => $n01($mor['surpreso'] ?? 0),
            'triste'   => $n01($mor['triste'] ?? 0),
        ],
        'iluminacao' => $enum($bruto['iluminacao'] ?? '', ['estudio', 'dramatica', 'neon'], 'estudio'),
        // PALCO VIVO (fila #37 item 4): cenários novos + hora + clima
        'cenario'    => $enum($bruto['cenario'] ?? '', ['vazio', 'grade', 'estrelas', 'dojo'], 'vazio'),
        'hora'       => $enum($bruto['hora'] ?? '', ['estudio', 'dia', 'entardecer', 'noite'], 'estudio'),
        'clima'      => $enum($bruto['clima'] ?? '', ['limpo', 'chuva', 'neve', 'vagalumes'], 'limpo'),
        'camera'     => $enum($bruto['camera'] ?? '', ['corpo', 'busto', 'rosto', 'tresquartos'], 'corpo'),
    ];
}

/** Linha ativa "camadas" do usuário (ou null). */
function avst_ativo(PDO $pdo, int $userId): ?array
{
    $st = $pdo->prepare("
        SELECT id, avatar_type, avatar_config, avatar_image_url, version, updated_at
        FROM app_user_avatars
        WHERE user_id = ? AND is_active = 1
        ORDER BY updated_at DESC
        LIMIT 1
    ");
    $st->execute([$userId]);
    $linha = $st->fetch(PDO::FETCH_ASSOC);
    return $linha ?: null;
}

function avst_config_da_linha(?array $linha): ?array
{
    if (!$linha || $linha['avatar_type'] !== 'generated' || empty($linha['avatar_config'])) {
        return null;
    }
    $cfg = json_decode((string) $linha['avatar_config'], true);
    return (is_array($cfg) && ($cfg['formato'] ?? '') === 'camadas') ? $cfg : null;
}

/**
 * Decodifica e RE-ENCODA a foto (front envia canvas PNG já recortado).
 * Re-encodar pixel a pixel via GD elimina metadados e payloads embutidos.
 * @return string bytes PNG 480×480
 */
function avst_processar_foto(string $dataUrl): string
{
    if (!function_exists('imagecreatefromstring')) {
        throw new RuntimeException('SEM_GD');
    }
    if (!preg_match('#^data:image/png;base64,#', $dataUrl)) {
        throw new InvalidArgumentException('FOTO_FORMATO');
    }
    $b64 = substr($dataUrl, strlen('data:image/png;base64,'));
    if (strlen($b64) > 8_000_000) { // ~6 MB decodificado
        throw new InvalidArgumentException('FOTO_MUITO_GRANDE');
    }
    $bytes = base64_decode($b64, true);
    if ($bytes === false) {
        throw new InvalidArgumentException('FOTO_BASE64');
    }
    $img = @imagecreatefromstring($bytes);
    if ($img === false) {
        throw new InvalidArgumentException('FOTO_INVALIDA');
    }
    $lg = imagesx($img);
    $al = imagesy($img);
    if ($lg < 64 || $al < 64) {
        imagedestroy($img);
        throw new InvalidArgumentException('FOTO_PEQUENA');
    }
    // recorte central quadrado (o front já manda quadrado; garantimos aqui)
    $lado = min($lg, $al);
    $final = imagecreatetruecolor(480, 480);
    imagealphablending($final, false);
    imagesavealpha($final, true);
    imagecopyresampled(
        $final, $img,
        0, 0,
        (int) (($lg - $lado) / 2), (int) (($al - $lado) / 2),
        480, 480, $lado, $lado
    );
    imagedestroy($img);
    ob_start();
    imagepng($final, null, 7);
    imagedestroy($final);
    $png = ob_get_clean();
    if ($png === false || $png === '') {
        throw new RuntimeException('FOTO_ENCODE');
    }
    return $png;
}

try {
    $pdo = getConnection('DSHOWDASH');

    // ── GET ─────────────────────────────────────────────────────────
    if ($metodo === 'GET') {
        if (isset($_GET['historico'])) {
            // 4.6 §22: 100 itens + metadados de apresentação (nome/fixado).
            // JOIN gracioso: se avatar_version_meta ainda não existir neste
            // ambiente, cai na consulta antiga — a tela nunca quebra.
            $temMeta = true;
            try {
                $st = $pdo->prepare('
                    SELECT a.id, a.avatar_type, a.avatar_config, a.avatar_image_url,
                           a.created_at, a.is_active, a.version,
                           m.label, m.is_pinned
                    FROM app_user_avatars a
                    LEFT JOIN avatar_version_meta m
                      ON m.user_id = a.user_id AND m.version_id = a.id
                    WHERE a.user_id = ? AND a.avatar_type IN (\'generated\', \'image\')
                    ORDER BY a.id DESC
                    LIMIT ' . AVST_RETENCAO_VERSOES);
                $st->execute([$userId]);
            } catch (Throwable $e) {
                $temMeta = false;
                $st = $pdo->prepare('
                    SELECT id, avatar_type, avatar_config, avatar_image_url,
                           created_at, is_active, version
                    FROM app_user_avatars
                    WHERE user_id = ? AND avatar_type IN (\'generated\', \'image\')
                    ORDER BY id DESC
                    LIMIT ' . AVST_RETENCAO_VERSOES);
                $st->execute([$userId]);
            }
            $itens = [];
            foreach ($st as $l) {
                $cfg = json_decode((string) ($l['avatar_config'] ?? ''), true);
                $formato = is_array($cfg) ? ($cfg['formato'] ?? '') : '';
                $itens[] = [
                    'id'        => (int) $l['id'],
                    'tipo'      => $l['avatar_type'] === 'image' ? 'foto' : ($formato === '3d' ? '3d' : 'camadas'),
                    'config'    => ($formato === 'camadas') ? $cfg : null,
                    'url'       => $l['avatar_image_url'] ?: null,
                    'criado_em' => $l['created_at'],
                    'nome'      => $temMeta ? (($l['label'] ?? null) !== null ? (string) $l['label'] : null) : null,
                    'fixado'    => $temMeta && (int) ($l['is_pinned'] ?? 0) === 1,
                    'ativo'     => (int) ($l['is_active'] ?? 0) === 1,
                    'versao'    => (int) ($l['version'] ?? 0),
                ];
            }
            session_write_close();
            avst_ok(['itens' => $itens, 'retencao' => AVST_RETENCAO_VERSOES]);
        }

        // Galeria "Suas fotos" — todas as fotos já enviadas/capturadas,
        // deduplicadas por arquivo (reativações clonam a linha, não o PNG).
        if (isset($_GET['fotos'])) {
            $st = $pdo->prepare("
                SELECT MAX(id) AS id, avatar_image_url AS url, MAX(created_at) AS criado_em
                FROM app_user_avatars
                WHERE user_id = ? AND avatar_type = 'image' AND avatar_image_url IS NOT NULL
                GROUP BY avatar_image_url
                ORDER BY MAX(id) DESC
                LIMIT 24
            ");
            $st->execute([$userId]);
            $fotos = [];
            foreach ($st as $l) {
                $fotos[] = ['id' => (int) $l['id'], 'url' => $l['url'], 'criado_em' => $l['criado_em']];
            }
            session_write_close();
            avst_ok(['fotos' => $fotos]);
        }

        $ativo = avst_ativo($pdo, $userId);
        $configAtivo = avst_config_da_linha($ativo);

        // último trabalho em CAMADAS (mesmo que uma foto esteja ativa agora)
        $configRecente = $configAtivo;
        if ($configRecente === null) {
            $stC = $pdo->prepare("
                SELECT avatar_config FROM app_user_avatars
                WHERE user_id = ? AND avatar_type = 'generated' AND avatar_config IS NOT NULL
                ORDER BY id DESC LIMIT 1
            ");
            $stC->execute([$userId]);
            $bruto = json_decode((string) ($stC->fetchColumn() ?: ''), true);
            if (is_array($bruto) && ($bruto['formato'] ?? '') === 'camadas') {
                $configRecente = $bruto;
            }
        }

        // último trabalho em 3D (retomada do estúdio — fila #37): pega o
        // formato:'3d' mais recente e RE-VALIDA na leitura (fail-closed
        // também contra linhas gravadas por versões antigas do validador)
        $config3dRecente = null;
        $st3 = $pdo->prepare("
            SELECT avatar_config FROM app_user_avatars
            WHERE user_id = ? AND avatar_type = 'generated'
              AND avatar_config LIKE '%\"formato\":\"3d\"%'
            ORDER BY id DESC LIMIT 1
        ");
        $st3->execute([$userId]);
        $bruto3 = json_decode((string) ($st3->fetchColumn() ?: ''), true);
        if (is_array($bruto3) && ($bruto3['formato'] ?? '') === '3d') {
            $config3dRecente = avst_validar_config3d($bruto3);
        }

        $tipoAtivo = null;
        if ($ativo) {
            if ($configAtivo !== null) {
                $tipoAtivo = 'camadas';
            } else {
                $cfg3 = json_decode((string) ($ativo['avatar_config'] ?? ''), true);
                if (is_array($cfg3) && ($cfg3['formato'] ?? '') === '3d') {
                    $tipoAtivo = '3d';
                } else {
                    $tipoAtivo = $ativo['avatar_type'] === 'image' ? 'foto' : 'legado';
                }
            }
        }

        $stU = $pdo->prepare('SELECT avatar_url FROM app_users WHERE id = ?');
        $stU->execute([$userId]);
        $avatarUrl = (string) ($stU->fetchColumn() ?: '');
        if ($tipoAtivo === null && $avatarUrl !== '') {
            $tipoAtivo = 'legado';
        }

        session_write_close();
        avst_ok([
            'config'                 => $configAtivo,
            'version'                => $ativo ? (int) $ativo['version'] : 0,
            'render_url'             => $ativo['avatar_image_url'] ?? null,
            'avatar_url'             => $avatarUrl ?: null,
            'tipo_ativo'             => $tipoAtivo,
            'config_camadas_recente' => $configRecente,
            'config_3d_recente'      => $config3dRecente,
        ]);
    }

    // ── POST ────────────────────────────────────────────────────────
    requireCsrf();

    $corpo = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($corpo)) {
        avst_erro('JSON_INVALIDO', 400);
    }

    // ── Modo HISTORICO_META (4.6 §22): nomear/fixar versão ──────────
    // Operação leve de metadado — não cria versão, então não consome o
    // rate limit de salvamento. Posse SEMPRE pela sessão (sem IDOR).
    if (isset($corpo['historico_meta'])) {
        $hm = is_array($corpo['historico_meta']) ? $corpo['historico_meta'] : [];
        $verId = isset($hm['id']) ? (int) $hm['id'] : 0;
        if ($verId <= 0) {
            avst_erro('VERSAO_INVALIDA', 400);
        }
        $stO = $pdo->prepare("
            SELECT id FROM app_user_avatars
            WHERE id = ? AND user_id = ? AND avatar_type IN ('generated', 'image')
        ");
        $stO->execute([$verId, $userId]);
        if (!$stO->fetchColumn()) {
            avst_erro('VERSAO_NAO_ENCONTRADA', 404);
        }

        // lê o meta atual e mescla só o que veio (nome e/ou fixado)
        $stM = $pdo->prepare('SELECT label, is_pinned FROM avatar_version_meta WHERE user_id = ? AND version_id = ?');
        $stM->execute([$userId, $verId]);
        $meta = $stM->fetch(PDO::FETCH_ASSOC) ?: ['label' => null, 'is_pinned' => 0];

        if (array_key_exists('nome', $hm)) {
            $nome = is_string($hm['nome']) ? trim(strip_tags($hm['nome'])) : '';
            $meta['label'] = $nome === '' ? null : mb_substr($nome, 0, AVST_NOME_VERSAO_MAX);
        }
        if (array_key_exists('fixado', $hm)) {
            $meta['is_pinned'] = !empty($hm['fixado']) ? 1 : 0;
        }

        $pdo->prepare('
            INSERT INTO avatar_version_meta (user_id, version_id, label, is_pinned, created_at, updated_at)
            VALUES (?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE label = VALUES(label), is_pinned = VALUES(is_pinned), updated_at = NOW()
        ')->execute([$userId, $verId, $meta['label'], (int) $meta['is_pinned']]);

        session_write_close();
        avst_ok([
            'id'     => $verId,
            'nome'   => $meta['label'],
            'fixado' => (int) $meta['is_pinned'] === 1,
        ]);
    }

    // Rate limit (mesmo padrão do avatar-upload.php; conta camadas + fotos)
    $stRl = $pdo->prepare("
        SELECT COUNT(*) FROM app_user_avatars
        WHERE user_id = ? AND avatar_type IN ('generated', 'image') AND created_at > ?
    ");
    $stRl->execute([$userId, date('Y-m-d H:i:s', time() - 3600)]);
    if ((int) $stRl->fetchColumn() >= AVST_LIMITE_HORA) {
        avst_erro('RATE_LIMIT', 429, ['limite_por_hora' => AVST_LIMITE_HORA]);
    }

    // ── Modo do salvamento: REATIVAR, FOTO, 3D ou CAMADAS ───────────
    $modoReativar = isset($corpo['reativar_id']);
    $modoFoto  = !$modoReativar && isset($corpo['foto']);
    $modo3d    = !$modoReativar && !$modoFoto && isset($corpo['config3d']);
    $conteudo  = '';   // bytes a publicar
    $extensao  = '';
    $tipoLinha = '';
    $configJson = null;
    $urlReuso   = null;

    if ($modoReativar) {
        // posse SEMPRE verificada pela sessão (id + user_id) — sem IDOR
        $stF = $pdo->prepare("
            SELECT avatar_type, avatar_config, avatar_image_url
            FROM app_user_avatars
            WHERE id = ? AND user_id = ? AND avatar_type IN ('generated', 'image')
        ");
        $stF->execute([(int) $corpo['reativar_id'], $userId]);
        $fonte = $stF->fetch(PDO::FETCH_ASSOC);
        if (!$fonte || empty($fonte['avatar_image_url'])) {
            avst_erro('VERSAO_NAO_ENCONTRADA', 404);
        }
        $tipoLinha  = $fonte['avatar_type'];
        $configJson = $fonte['avatar_config'] ?: null;
        $urlReuso   = $fonte['avatar_image_url'];
    } elseif ($modoFoto) {
        try {
            $conteudo = avst_processar_foto(is_string($corpo['foto']) ? $corpo['foto'] : '');
            // 4.6 §21: estilização opcional — parâmetros validados campo a
            // campo e guardados junto do PNG composto (fonte de verdade).
            $estilo = avst_validar_config_foto($corpo['config_foto'] ?? null);
        } catch (InvalidArgumentException $e) {
            avst_erro($e->getMessage(), 400);
        } catch (RuntimeException $e) {
            error_log('[avatar/studio.php] foto: ' . $e->getMessage());
            avst_erro($e->getMessage(), 500);
        }
        if ($estilo !== null) {
            // travas de desbloqueio valem TAMBÉM sobre a foto (mesma regra
            // do fluxo de camadas — o servidor nunca confia no front)
            $itensFoto = array_values((array) $estilo['camadas']);
            $comTrava = vida_itens_com_trava($pdo, $itensFoto);
            if ($comTrava !== []) {
                $liberados = vida_desbloqueados($pdo, $userId);
                $barrados = array_values(array_diff($comTrava, $liberados));
                if ($barrados !== []) {
                    error_log("AVST_ITEM_BLOQUEADO_FOTO user=$userId itens=" . implode(',', $barrados));
                    avst_erro('ITEM_BLOQUEADO', 403, ['itens' => $barrados]);
                }
            }
            $configJson = json_encode($estilo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        $extensao = 'png';
        $tipoLinha = 'image';
    } elseif ($modo3d) {
        // Fase 2 (PoC aprovada): parâmetros 3D no banco + render derivado
        // como avatar oficial. O PNG vem do frame canônico do CLIENTE e é
        // RE-ENCODADO pixel a pixel via GD (mesma defesa do fluxo de foto).
        try {
            $config3d = avst_validar_config3d($corpo['config3d'] ?? null);
            $conteudo = avst_processar_foto(is_string($corpo['render'] ?? null) ? $corpo['render'] : '');
        } catch (InvalidArgumentException $e) {
            avst_erro($e->getMessage(), 400);
        } catch (RuntimeException $e) {
            error_log('[avatar/studio.php] render3d: ' . $e->getMessage());
            avst_erro($e->getMessage(), 500);
        }
        $extensao = 'png';
        $tipoLinha = 'generated';
        $configJson = json_encode($config3d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } else {
        try {
            $config = avst_validar_config($corpo['config'] ?? null);
        } catch (InvalidArgumentException $e) {
            avst_erro($e->getMessage(), 400);
        }

        // ── Desbloqueio validado no BACKEND (Expansão, critério §23) ──
        // Itens com trava (regras do catálogo no banco) só salvam se o
        // usuário realmente os destravou — o front filtra, mas o servidor
        // nunca confia no front. Sem catálogo migrado → lista vazia (nada
        // é barrado por infraestrutura ausente).
        $equipados = array_merge([$config['base']], array_values((array) $config['camadas']));
        $comTrava = vida_itens_com_trava($pdo, $equipados);
        if ($comTrava !== []) {
            $liberados = vida_desbloqueados($pdo, $userId);
            $barrados = array_values(array_diff($comTrava, $liberados));
            if ($barrados !== []) {
                error_log("AVST_ITEM_BLOQUEADO user=$userId itens=" . implode(',', $barrados));
                avst_erro('ITEM_BLOQUEADO', 403, ['itens' => $barrados]);
            }
        }

        $svgBruto = $corpo['svg'] ?? null;
        if (!is_string($svgBruto) || $svgBruto === '') {
            avst_erro('SVG_AUSENTE', 400);
        }
        try {
            $conteudo = SvgSanitizer::sanitizar($svgBruto);
        } catch (InvalidArgumentException $e) {
            error_log("AVST_SVG_REJEITADO user=$userId motivo=" . $e->getMessage());
            avst_erro('SVG_REJEITADO', 400, ['motivo' => $e->getMessage()]);
        }
        $extensao = 'svg';
        $tipoLinha = 'generated';
        $configJson = json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    $baseVersion = isset($corpo['base_version']) ? (int) $corpo['base_version'] : null;

    // ── Transação: versão + histórico + espelhos ────────────────────
    $pdo->beginTransaction();

    $stV = $pdo->prepare("
        SELECT id, version FROM app_user_avatars
        WHERE user_id = ? AND is_active = 1
        ORDER BY updated_at DESC LIMIT 1
        FOR UPDATE
    ");
    $stV->execute([$userId]);
    $atual = $stV->fetch(PDO::FETCH_ASSOC);
    $versaoAtual = $atual ? (int) $atual['version'] : 0;

    // Conflito de abas: só quando o cliente declara de onde partiu
    if ($baseVersion !== null && $atual && $baseVersion !== $versaoAtual) {
        $pdo->rollBack();
        avst_erro('CONFLITO_VERSAO', 409, ['version' => $versaoAtual]);
    }

    $novaVersao = $versaoAtual + 1;

    if ($modoReativar) {
        // reaproveita o arquivo já publicado — nenhum byte novo em disco
        $renderUrl = $urlReuso;
    } else {
        // Publica o arquivo (nome versionado → fura o cache de 4h do Cloudflare)
        $dirFisico = realpath(__DIR__ . '/../../public') . AVST_DIR_PUBLICO;
        if (!is_dir($dirFisico) && !mkdir($dirFisico, 0755, true) && !is_dir($dirFisico)) {
            $pdo->rollBack();
            avst_erro('DIR_PUBLICACAO', 500);
        }
        $arquivo = sprintf('u%d-v%d.%s', $userId, $novaVersao, $extensao);
        $caminho = $dirFisico . '/' . $arquivo;
        $tmp = $caminho . '.tmp';
        if (file_put_contents($tmp, $conteudo, LOCK_EX) === false || !rename($tmp, $caminho)) {
            @unlink($tmp);
            $pdo->rollBack();
            avst_erro('ESCRITA_ARQUIVO', 500);
        }
        $renderUrl = AVST_DIR_PUBLICO . '/' . $arquivo;
    }

    $pdo->prepare('UPDATE app_user_avatars SET is_active = 0, updated_at = NOW() WHERE user_id = ? AND is_active = 1')
        ->execute([$userId]);

    $pdo->prepare("
        INSERT INTO app_user_avatars
            (user_id, avatar_type, avatar_config, avatar_image_url, is_active, version, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, NOW(), NOW())
    ")->execute([$userId, $tipoLinha, $configJson, $renderUrl, $novaVersao]);

    // ── Retenção (4.6 §22): poda além das N mais recentes ───────────
    // FIXADAS (avatar_version_meta.is_pinned) e a ATIVA nunca saem; só
    // linhas do banco são podadas — arquivos publicados ficam (podem ser
    // compartilhados por reativações). Falha aqui NUNCA derruba o save.
    try {
        $pdo->prepare('
            DELETE a FROM app_user_avatars a
            LEFT JOIN avatar_version_meta m
              ON m.user_id = a.user_id AND m.version_id = a.id AND m.is_pinned = 1
            WHERE a.user_id = ? AND a.is_active = 0 AND m.version_id IS NULL
              AND a.avatar_type IN (\'generated\', \'image\')
              AND a.id NOT IN (
                SELECT id FROM (
                  SELECT id FROM app_user_avatars
                  WHERE user_id = ? AND avatar_type IN (\'generated\', \'image\')
                  ORDER BY id DESC
                  LIMIT ' . AVST_RETENCAO_VERSOES . '
                ) t
              )
        ')->execute([$userId, $userId]);
        // meta órfã (versão podada) — limpeza explícita, sem FK no legado
        $pdo->prepare('
            DELETE m FROM avatar_version_meta m
            LEFT JOIN app_user_avatars a ON a.id = m.version_id
            WHERE m.user_id = ? AND a.id IS NULL
        ')->execute([$userId]);
    } catch (Throwable $e) {
        error_log('[avatar/studio.php] poda: ' . $e->getMessage());
    }

    // Espelho para o header/sessão (mesmo comportamento do avatar.php legado)
    $pdo->prepare('UPDATE app_users SET avatar_url = ?, updated_at = NOW() WHERE id = ?')
        ->execute([$renderUrl, $userId]);

    $pdo->commit();

    if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
        $_SESSION['user']['avatar_url'] = $renderUrl; // check.php reflete sem relogin
    }
    session_write_close();

    $tipoResp = 'camadas';
    if ($tipoLinha === 'image') {
        $tipoResp = 'foto';
    } elseif (is_string($configJson) && strpos($configJson, '"formato":"3d"') !== false) {
        $tipoResp = '3d';
    }
    avst_ok([
        'version'    => $novaVersao,
        'render_url' => $renderUrl,
        'tipo'       => $tipoResp,
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[avatar/studio.php] ' . $e->getMessage());
    avst_erro('ERRO_INTERNO', 500);
}
