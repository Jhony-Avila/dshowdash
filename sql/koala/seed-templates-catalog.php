<?php
// Seed do CATÁLOGO DE TEMPLATES (7 iniciais). Generico JÁ existe (F1) — NÃO tocar; cria os 6 novos.
// Fluxo REAL (TemplateManagerService): duplicar Generico -> subtítulo de capa do segmento -> publicar -> ativar.
// IDEMPOTENTE por nome. NÃO são [TESTE] (catálogo real). Uso: php sql/koala/seed-templates-catalog.php
declare(strict_types=1);
$_SERVER['REQUEST_METHOD'] = 'CLI';
require __DIR__ . '/../../api/koala/_init.php';

$pdo = getConnection('DSHOWDASH');
$koala = (new AuthKoalaService($pdo))->provisionAndGet(75, 'jhony', 'jhony@dshow.com.br');
$trepo = new TemplateRepository($pdo);
$mgr = new TemplateManagerService($pdo);

// Generico (default publicado) — confere e NÃO toca.
$genId = $trepo->defaultPublishedId();
$gen = $genId ? $trepo->findById($genId) : null;
if (!$gen || $gen['status'] !== 'published') {
    fwrite(STDERR, "ABORT: Generico não está publicado/ativo (id=" . var_export($genId, true) . ")\n");
    exit(1);
}
$genVer = $trepo->getCurrentVersion($genId);
$genStruct = json_decode((string) $genVer['structure_json'], true);
echo "Generico OK: id=$genId, versão publicada v{$genVer['version_number']} (id={$genVer['id']}) — INTOCADO\n";

$SEGMENTS = [
    ['name' => 'Igreja',            'segment' => 'church',        'desc' => 'Template para propostas de painéis LED e sonorização para igrejas e templos.',           'subtitle' => 'Soluções audiovisuais para igrejas e templos'],
    ['name' => 'Centro de controle','segment' => 'control_center','desc' => 'Template para video walls e salas de monitoramento (centros de controle).',                'subtitle' => 'Video walls e salas de monitoramento'],
    ['name' => 'Varejo',            'segment' => 'retail',        'desc' => 'Template para digital signage e vitrines no varejo.',                                      'subtitle' => 'Digital signage e vitrines para o varejo'],
    ['name' => 'Corporativo',       'segment' => 'corporate',     'desc' => 'Template para auditórios, recepções e salas de reunião corporativas.',                     'subtitle' => 'Auditórios, recepções e salas de reunião'],
    ['name' => 'Outdoor',           'segment' => 'outdoor',       'desc' => 'Template para painéis externos de grande formato.',                                        'subtitle' => 'Painéis externos de grande formato'],
    ['name' => 'Totens',            'segment' => 'kiosk',         'desc' => 'Template para totens interativos e autoatendimento.',                                      'subtitle' => 'Totens interativos e autoatendimento'],
];

/** structure da capa recebe um subtítulo FIXO do segmento (diferenciação mínima e honesta). */
function withSegmentCover(array $struct, string $segment, string $subtitle): array
{
    $struct['segment'] = $segment;
    if (isset($struct['pages'][0]['sections'][0]['components']) && is_array($struct['pages'][0]['sections'][0]['components'])) {
        // insere o subtítulo logo após o título da capa
        $comp = ['component_type' => 'text', 'content_json' => ['text' => $subtitle], 'bindings_json' => null];
        array_splice($struct['pages'][0]['sections'][0]['components'], 1, 0, [$comp]);
    }
    return $struct;
}

function findByName(\PDO $pdo, string $name): ?array
{
    $st = $pdo->prepare("SELECT id, name, status FROM koala_templates WHERE name = ? AND deleted_at IS NULL LIMIT 1");
    $st->execute([$name]);
    return $st->fetch(\PDO::FETCH_ASSOC) ?: null;
}

$created = 0; $skipped = 0;
foreach ($SEGMENTS as $seg) {
    $existing = findByName($pdo, $seg['name']);
    if ($existing) {
        echo "  [SKIP] '{$seg['name']}' já existe (id={$existing['id']}, status={$existing['status']})\n";
        $skipped++;
        continue;
    }
    // 1) duplica o Generico (nasce inativo, v1 published = cópia)
    $dup = $mgr->duplicate($koala, $genId, ['name' => $seg['name'], 'description' => $seg['desc']]);
    $tid = (int) $dup['id'];
    // 2) diferencia a capa + publica v2
    $struct = withSegmentCover($genStruct, $seg['segment'], $seg['subtitle']);
    $mgr->saveStructureDraft($koala, $tid, json_encode($struct, JSON_UNESCAPED_UNICODE));
    $mgr->publish($koala, $tid);
    // 3) ativa (published -> selecionável no dropdown da proposta)
    $mgr->setActive($koala, $tid, true);
    $cur = $trepo->getCurrentVersion($tid);
    echo "  [CREATE] '{$seg['name']}' id=$tid, publicado v{$cur['version_number']}\n";
    $created++;
}

echo "\nResumo seed: created=$created skipped=$skipped\n";
echo "Generico id=$genId permanece v{$genVer['version_number']} (não tocado)\n";
