<?php
/**
 * Smart School Scheduled Cron Runner
 * Infosof Technologies 2026
 *
 * Can be run via:
 * 1. CLI: php cron.php
 * 2. HTTP/Webhook: https://your-domain/cron.php?secret=smart_school_cron_2026
 */

$is_cli = (php_sapi_name() === 'cli');

// If accessed via web, verify secret token
if (!$is_cli) {
    $secret = $_GET['secret'] ?? $_GET['token'] ?? '';
    $expected = getenv('CRON_SECRET') ?: 'smart_school_cron_2026';
    if (!hash_equals($expected, (string)$secret)) {
        http_response_code(403);
        die("403 Forbidden: Invalid cron secret. Pass ?secret=" . htmlspecialchars($expected));
    }
    header('Content-Type: application/json; charset=utf-8');
}

// Bootstrap CodeIgniter in CLI or Web context to run Cron controller
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['PATH_INFO'] = '/api/cron/run';
$_GET['secret'] = getenv('CRON_SECRET') ?: 'smart_school_cron_2026';

// Run through CodeIgniter front controller
ob_start();
require_once __DIR__ . '/index.php';
$output = ob_get_clean();

if ($is_cli) {
    echo "========================================================================\n";
    echo "   SMART SCHOOL MANAGEMENT SYSTEM — SCHEDULED CRON RUNNER               \n";
    echo "========================================================================\n";
    echo $output . "\n";
} else {
    echo $output;
}
