<?php
// /api/koala/services/PublicationService.php
// F4 — Publicação e link público. Publicar CONGELA a versão (E1.3) e aponta o slug para ela;
// o link público SEMPRE serve a versão publicada congelada (nunca o rascunho vivo).
// Métodos "públicos" (resolvePublic/registerView/rateLimited/renderPublished/publishedPdf) NÃO exigem auth
// e são chamados por public.php — tratados como porta hostil (escape, 404 genérico, rate-limit).
// @module koala.service.publication @version 1.0.0-F4
declare(strict_types=1);

class PublicationService
{
    private \PDO $pdo;
    private const DEFAULT_VALID_DAYS = 30;
    public  const RATE_LIMIT_PER_MIN = 60;
    private const PDF_DIR = '/var/www/dshowdash/storage/koala/pdf';

    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    // ── Ações autenticadas (editor) ─────────────────────────────────────────

    /** Publica (ou republica): congela versão + gera slug NOVO + status -> sent. */
    public function publish(array $koala, int $proposalId): array
    {
        $p = (new ProposalService($this->pdo))->get($koala, $proposalId); // auth 404/403
        $fr = (new VersioningService($this->pdo))->freeze($koala, $proposalId, 'publish', 'final');

        $slug = $this->uniqueSlug();
        $validUntil = $p['valid_until'] ?: date('Y-m-d', strtotime('+' . self::DEFAULT_VALID_DAYS . ' days'));
        $url = '/p/' . $slug;
        $this->pdo->prepare(
            'UPDATE koala_proposals
               SET published_version_id = ?, published_at = NOW(), public_slug = ?, public_url = ?,
                   public_revoked_at = NULL, valid_until = ?
             WHERE id = ? AND deleted_at IS NULL'
        )->execute([$fr['version_id'], $slug, $url, $validUntil, $proposalId]);

        // status -> sent (Enviada), com log de status.
        (new ProposalService($this->pdo))->setStatus($koala, $proposalId, 'sent');
        (new LogService($this->pdo))->log($koala, [
            'proposal_id' => $proposalId, 'proposal_version_id' => $fr['version_id'],
            'action' => 'proposal_published', 'entity_type' => 'proposal', 'entity_id' => $proposalId,
            'metadata' => ['slug' => $slug, 'version' => $fr['version_number'], 'valid_until' => $validUntil],
        ]);

        return [
            'slug' => $slug, 'public_url' => $url, 'version' => $fr['version_number'],
            'version_id' => $fr['version_id'], 'valid_until' => $validUntil, 'status' => 'sent', 'reused_version' => $fr['reused'],
        ];
    }

    /** Revoga o link: a partir de agora o slug fica indisponível (sem apagar nada). */
    public function revoke(array $koala, int $proposalId): array
    {
        (new ProposalService($this->pdo))->get($koala, $proposalId); // auth
        $this->pdo->prepare('UPDATE koala_proposals SET public_revoked_at = NOW() WHERE id = ? AND deleted_at IS NULL')
                  ->execute([$proposalId]);
        (new LogService($this->pdo))->log($koala, [
            'proposal_id' => $proposalId, 'action' => 'proposal_link_revoked', 'entity_type' => 'proposal', 'entity_id' => $proposalId,
        ]);
        return ['revoked' => true];
    }

    /** Estado de publicação p/ o editor (link, expiração, revogado). */
    public function publicState(array $koala, int $proposalId): array
    {
        $p = (new ProposalService($this->pdo))->get($koala, $proposalId);
        $published = !empty($p['published_version_id']) && empty($p['public_revoked_at']);
        return [
            'published'    => $published,
            'revoked'      => !empty($p['public_revoked_at']),
            'public_slug'  => $published ? $p['public_slug'] : null,
            'public_url'   => $published ? $p['public_url'] : null,
            'published_at' => $p['published_at'] ?? null,
            'valid_until'  => $p['valid_until'] ?? null,
            'expired'      => $published ? $this->isExpired($p) : false,
            'version_id'   => $published ? (int) $p['published_version_id'] : null,
        ];
    }

    /** Histórico de visualizações (editor) — IP mascarado, UA resumido. */
    public function views(array $koala, int $proposalId, int $limit = 100): array
    {
        (new ProposalService($this->pdo))->get($koala, $proposalId); // auth
        $limit = max(1, min(500, $limit));
        $stmt = $this->pdo->prepare(
            'SELECT ip_address, user_agent, referrer, viewed_at, proposal_version_id
             FROM koala_public_views WHERE proposal_id = ? ORDER BY id DESC LIMIT ' . $limit
        );
        $stmt->execute([$proposalId]);
        return array_map(function ($v) {
            return [
                'ip'      => self::maskIp((string) ($v['ip_address'] ?? '')),
                'ua'      => self::shortUa((string) ($v['user_agent'] ?? '')),
                'referrer'=> $v['referrer'] ?? null,
                'viewed_at' => $v['viewed_at'],
                'version_id' => $v['proposal_version_id'] ? (int) $v['proposal_version_id'] : null,
            ];
        }, $stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    // ── Caminho PÚBLICO (sem auth) — porta hostil ────────────────────────────

    /** Resolve o slug -> proposta publicada e viva; null se não existe/revogado/excluído (404 genérico). */
    public function resolvePublic(string $slug): ?array
    {
        if (!preg_match('/^[a-f0-9]{24,64}$/', $slug)) { return null; }
        $stmt = $this->pdo->prepare(
            'SELECT id, proposal_number, published_version_id, valid_until, status, currency, title
             FROM koala_proposals
             WHERE public_slug = ? AND deleted_at IS NULL AND public_revoked_at IS NULL AND published_version_id IS NOT NULL
             LIMIT 1'
        );
        $stmt->execute([$slug]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function isExpired(array $p): bool
    {
        return !empty($p['valid_until']) && strtotime((string) $p['valid_until'] . ' 23:59:59') < time();
    }

    /** Registra a abertura + transiciona sent->viewed na 1ª vez. Sem auth. */
    public function registerView(array $p, string $slug): void
    {
        $ver = $p['published_version_id'] ? (int) $p['published_version_id'] : null;
        try {
            $this->pdo->prepare(
                'INSERT INTO koala_public_views (proposal_id, proposal_version_id, public_slug, ip_address, user_agent, referrer)
                 VALUES (?,?,?,?,?,?)'
            )->execute([
                (int) $p['id'], $ver, $slug,
                $_SERVER['REMOTE_ADDR'] ?? null,
                isset($_SERVER['HTTP_USER_AGENT']) ? substr((string) $_SERVER['HTTP_USER_AGENT'], 0, 255) : null,
                isset($_SERVER['HTTP_REFERER']) ? substr((string) $_SERVER['HTTP_REFERER'], 0, 255) : null,
            ]);
            // sent -> viewed só na primeira visualização.
            $this->pdo->prepare("UPDATE koala_proposals SET status = 'viewed' WHERE id = ? AND status = 'sent'")
                      ->execute([(int) $p['id']]);
        } catch (\Throwable $e) { /* best-effort: não quebra a exibição */ }
    }

    /** Rate-limit por IP (bucket de 60s). true = estourou. */
    public function rateLimited(string $ip, int $limit = self::RATE_LIMIT_PER_MIN): bool
    {
        try {
            $bucket = intdiv(time(), 60);
            $this->pdo->prepare('INSERT INTO koala_rate_limit (ip, bucket, hits) VALUES (?,?,1)
                                 ON DUPLICATE KEY UPDATE hits = hits + 1')->execute([$ip, $bucket]);
            $stmt = $this->pdo->prepare('SELECT hits FROM koala_rate_limit WHERE ip = ? AND bucket = ?');
            $stmt->execute([$ip, $bucket]);
            $hits = (int) $stmt->fetchColumn();
            if ($hits % 50 === 1) { // limpeza oportunista de buckets antigos
                $this->pdo->prepare('DELETE FROM koala_rate_limit WHERE bucket < ?')->execute([$bucket - 5]);
            }
            return $hits > $limit;
        } catch (\Throwable $e) {
            return false; // se o rate-limit falhar, não derruba a página (fail-open só p/ leitura pública)
        }
    }

    /** HTML da versão publicada congelada (sem auth) — SEMPRE 'final' (sem marca d'água). */
    public function renderPublished(array $p): string
    {
        $v = (new ProposalVersionRepository($this->pdo))->findById((int) $p['published_version_id']);
        if ($v === null) { throw new \RuntimeException('versao publicada ausente'); }
        $snap = json_decode((string) $v['snapshot_json'], true);
        $renderData = ['structure' => $snap['render']['structure'] ?? null, 'data' => $snap['render']['data'] ?? null];
        return (new ProposalRenderService($this->pdo))->renderFromSnapshot($renderData, 'final');
    }

    /** Caminho absoluto do PDF da versão publicada (gera on-demand). Sem auth. */
    public function publishedPdfPath(array $p): string
    {
        $versionId = (int) $p['published_version_id'];
        $v = (new ProposalVersionRepository($this->pdo))->findById($versionId);
        if ($v === null) { throw new \RuntimeException('versao publicada ausente'); }
        $vn = (int) $v['version_number'];
        $safeNum = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $p['proposal_number']);
        $pdfAbs = self::PDF_DIR . '/proposta-' . ($safeNum !== '' ? $safeNum : (string) $p['id']) . "-v{$vn}.pdf";
        if (!is_file($pdfAbs)) {
            $html = $this->renderPublished($p);
            (new PdfGenerationService($this->pdo))->htmlToPdf($html, $pdfAbs);
            (new ProposalVersionRepository($this->pdo))->setPdfPath($versionId, 'koala/pdf/' . basename($pdfAbs));
        }
        return $pdfAbs;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private function uniqueSlug(): string
    {
        for ($i = 0; $i < 8; $i++) {
            $s = bin2hex(random_bytes(24)); // 48 hex, difícil de adivinhar, não sequencial
            $stmt = $this->pdo->prepare('SELECT 1 FROM koala_proposals WHERE public_slug = ? LIMIT 1');
            $stmt->execute([$s]);
            if (!$stmt->fetchColumn()) { return $s; }
        }
        throw new \RuntimeException('nao foi possivel gerar slug unico');
    }

    private static function maskIp(string $ip): string
    {
        if (strpos($ip, '.') !== false) { // IPv4 -> a.b.xx.xx
            $o = explode('.', $ip);
            return count($o) === 4 ? "{$o[0]}.{$o[1]}.xx.xx" : $ip;
        }
        if (strpos($ip, ':') !== false) { // IPv6 -> prefixo
            $o = explode(':', $ip);
            return ($o[0] ?? '') . ':' . ($o[1] ?? '') . ':xxxx';
        }
        return $ip;
    }

    private static function shortUa(string $ua): string
    {
        foreach (['Edg' => 'Edge', 'OPR' => 'Opera', 'Chrome' => 'Chrome', 'Firefox' => 'Firefox', 'Safari' => 'Safari'] as $needle => $label) {
            if (stripos($ua, $needle) !== false) {
                $os = (stripos($ua, 'Windows') !== false) ? 'Windows'
                    : ((stripos($ua, 'Mac') !== false) ? 'macOS'
                    : ((stripos($ua, 'Android') !== false) ? 'Android'
                    : ((stripos($ua, 'iPhone') !== false || stripos($ua, 'iPad') !== false) ? 'iOS'
                    : ((stripos($ua, 'Linux') !== false) ? 'Linux' : ''))));
                return trim($label . ($os ? " · $os" : ''));
            }
        }
        return $ua !== '' ? 'Outro' : '—';
    }
}
