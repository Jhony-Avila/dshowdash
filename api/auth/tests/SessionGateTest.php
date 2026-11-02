<?php
// SessionGateTest - Testes unitários para SessionGate
// @version 1.0.0-ENTERPRISE
// @created 2026-01-25
// #19: Testes unitários para SessionGate

declare(strict_types=1);

require_once __DIR__ . '/../../core/testing/SessionGateMock.php';
require_once __DIR__ . '/../../core/testing/TestHelper.php';

use Core\Testing\SessionGateMock;
use Core\Testing\TestHelper;

class SessionGateTest
{
    private array $results = [];
    
    public function runAll(): array
    {
        $this->results = [];
        $this->testReadOnlyWithValidSession();
        $this->testCsrfTokenGeneration();
        $this->testCsrfTokenRotation();
        $this->testCsrfAgeValidation();
        $this->testUserAuthentication();
        $this->testPermissionCheck();
        $this->testSessionDestroy();
        $this->testRequestIdTracking();
        return $this->results;
    }
    
    private function addResult(string $test, bool $passed, string $message = ''): void
    {
        $this->results[] = ['test' => $test, 'passed' => $passed, 'message' => $message];
    }
    
    public function testReadOnlyWithValidSession(): void
    {
        SessionGateMock::reset();
        $user = TestHelper::createTestUser();
        $session = TestHelper::createTestSession($user);
        SessionGateMock::setMockSession($session);
        $result = SessionGateMock::readOnly();
        $passed = isset($result['user_id']) && $result['user_id'] === $user['id'];
        $this->addResult('readOnly_valid_session', $passed, $passed ? 'OK' : 'user_id não encontrado');
    }
    
    public function testCsrfTokenGeneration(): void
    {
        SessionGateMock::reset();
        $csrf1 = SessionGateMock::getCsrfToken();
        $csrf2 = SessionGateMock::getCsrfToken();
        $passed = !empty($csrf1) && $csrf1 === $csrf2;
        $this->addResult('csrf_token_generation', $passed, $passed ? 'OK' : 'CSRF inconsistente');
    }
    
    public function testCsrfTokenRotation(): void
    {
        SessionGateMock::reset();
        $csrf1 = SessionGateMock::getCsrfToken();
        $csrf2 = SessionGateMock::rotateCsrfToken();
        $passed = !empty($csrf1) && !empty($csrf2) && $csrf1 !== $csrf2;
        $this->addResult('csrf_token_rotation', $passed, $passed ? 'OK' : 'Rotação falhou');
    }
    
    public function testCsrfAgeValidation(): void
    {
        SessionGateMock::reset();
        SessionGateMock::getCsrfToken();
        $valid = SessionGateMock::validateCsrfAge();
        $this->addResult('csrf_age_validation', $valid, $valid ? 'OK' : 'Token deveria ser válido');
    }
    
    public function testUserAuthentication(): void
    {
        SessionGateMock::reset();
        $isActive1 = SessionGateMock::isActive();
        $user = TestHelper::createTestUser();
        SessionGateMock::setMockUser($user);
        $isActive2 = SessionGateMock::isActive();
        $fetchedUser = SessionGateMock::getUser();
        $passed = !$isActive1 && $isActive2 && $fetchedUser['id'] === $user['id'];
        $this->addResult('user_authentication', $passed, $passed ? 'OK' : 'Auth falhou');
    }
    
    public function testPermissionCheck(): void
    {
        SessionGateMock::reset();
        $admin = TestHelper::createTestAdmin();
        SessionGateMock::setMockUser($admin);
        $hasPermission = SessionGateMock::hasPermission('any:permission');
        $this->addResult('permission_check_admin', $hasPermission, $hasPermission ? 'OK' : 'Admin deveria ter permissão');
    }
    
    public function testSessionDestroy(): void
    {
        SessionGateMock::reset();
        $user = TestHelper::createTestUser();
        SessionGateMock::setMockUser($user);
        $before = SessionGateMock::isActive();
        SessionGateMock::destroy();
        $after = SessionGateMock::isActive();
        $passed = $before && !$after;
        $this->addResult('session_destroy', $passed, $passed ? 'OK' : 'Destroy falhou');
    }
    
    public function testRequestIdTracking(): void
    {
        SessionGateMock::reset();
        $id1 = SessionGateMock::getRequestId();
        $id2 = SessionGateMock::getRequestId();
        SessionGateMock::setRequestId('custom_req_123');
        $id3 = SessionGateMock::getRequestId();
        $passed = $id1 === $id2 && $id3 === 'custom_req_123';
        $this->addResult('request_id_tracking', $passed, $passed ? 'OK' : 'Request ID falhou');
    }
    
    public static function run(): array
    {
        $test = new self();
        $results = $test->runAll();
        $passed = count(array_filter($results, fn($r) => $r['passed']));
        $total = count($results);
        return [
            'summary' => ['total' => $total, 'passed' => $passed, 'failed' => $total - $passed, 'success_rate' => round(($passed / $total) * 100, 1) . '%'],
            'tests' => $results
        ];
    }
}
