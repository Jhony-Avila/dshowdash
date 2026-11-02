<?php
// CSP violation reporter — log only, no DB
// Receives CSP violation reports from browsers (POST /csp-report)
// Format: application/csp-report (JSON body with "csp-report" key)
// @created 2026-04-29 — Fase 2 do hardening de segurança

$report = file_get_contents('php://input');
if ($report) {
    $line = sprintf("[%s] %s\n", date('c'), $report);
    @file_put_contents('/var/log/csp-violations.log', $line, FILE_APPEND | LOCK_EX);
}
http_response_code(204);
