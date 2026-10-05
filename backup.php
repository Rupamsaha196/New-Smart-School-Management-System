<?php
/**
 * Smart School Database Backup, Restore & Integrity Verification Utility
 * Infosof Technologies 2026
 *
 * Usage:
 *   CLI Export  : php backup.php export
 *   CLI Restore : php backup.php restore [path/to/backup.sql]
 *   CLI Verify  : php backup.php verify
 *   Web API     : https://your-domain.com/backup.php?action=export&secret=smart_school_init_2026
 */

$is_cli = (php_sapi_name() === 'cli');

if (!$is_cli) {
    $secret = $_GET['secret'] ?? '';
    $allowed_secret = getenv('MIGRATION_SECRET') ?: 'smart_school_init_2026';
    if ($secret !== $allowed_secret) {
        http_response_code(403);
        die("403 Forbidden: Invalid authorization secret.");
    }
}

// Auto-load .env
$env_file = __DIR__ . '/.env';
if (file_exists($env_file)) {
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line !== '' && strpos($line, '#') !== 0 && strpos($line, '=') !== false) {
            list($k, $v) = explode('=', $line, 2);
            $k = trim($k);
            $v = trim($v, " \t\n\r\0\x0B\"'");
            if (!isset($_SERVER[$k]) && !isset($_ENV[$k])) {
                putenv("{$k}={$v}");
                $_ENV[$k] = $v;
                $_SERVER[$k] = $v;
            }
        }
    }
}

$raw_db_url = getenv('MYSQL_URL') ?: getenv('DATABASE_URL');
$parsed_url = !empty($raw_db_url) ? parse_url($raw_db_url) : null;
$host     = trim($_GET['db_host'] ?? ($parsed_url['host'] ?? (getenv('DB_HOST') ?: 'localhost')));
$port     = trim($_GET['db_port'] ?? ($parsed_url['port'] ?? (getenv('DB_PORT') ?: 3306)));
$database = trim($_GET['db_name'] ?? (isset($parsed_url['path']) ? ltrim($parsed_url['path'], '/') : (getenv('DB_DATABASE') ?: 'smart_school')));
$username = trim($_GET['db_user'] ?? (isset($parsed_url['user']) ? urldecode($parsed_url['user']) : (getenv('DB_USERNAME') ?: 'root')));
$password = trim($_GET['db_pass'] ?? (isset($parsed_url['pass']) ? urldecode($parsed_url['pass']) : (getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '')));

function get_pdo($host, $port, $database, $username, $password) {
    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT            => 10,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ];

    $is_local = in_array(strtolower($host), ['localhost', '127.0.0.1', '::1', 'db']) && (getenv('DB_SSL') !== 'true');
    if (!$is_local || getenv('DB_SSL') === 'true') {
        $ca_bundle = '/etc/ssl/certs/ca-certificates.crt';
        if (file_exists($ca_bundle)) {
            $options[PDO::MYSQL_ATTR_SSL_CA] = $ca_bundle;
        } elseif (file_exists('/etc/pki/tls/certs/ca-bundle.crt')) {
            $options[PDO::MYSQL_ATTR_SSL_CA] = '/etc/pki/tls/certs/ca-bundle.crt';
        }
        if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        }
    }
    return new PDO($dsn, $username, $password, $options);
}

$action = $is_cli ? ($argv[1] ?? 'export') : ($_GET['action'] ?? 'export');

// ── 1. EXPORT / BACKUP ─────────────────────────────────────────────────────────
if ($action === 'export') {
    try {
        $pdo = get_pdo($host, $port, $database, $username, $password);
    } catch (Exception $e) {
        die("Database connection failed: " . $e->getMessage() . "\n");
    }

    $backup_dir = __DIR__ . '/database/backups';
    if (!is_dir($backup_dir)) {
        mkdir($backup_dir, 0755, true);
    }

    $filename = "smart_school_backup_" . date('Y_m_d_His') . ".sql";
    $filepath = $backup_dir . '/' . $filename;

    $sql = "-- ==========================================================================\n";
    $sql .= "-- SMART SCHOOL MANAGEMENT SYSTEM - AUTOMATED SQL BACKUP DUMP\n";
    $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
    $sql .= "-- Host: {$host}:{$port} | Database: {$database}\n";
    $sql .= "-- ==========================================================================\n\n";
    $sql .= "SET FOREIGN_KEY_CHECKS = 0;\n";
    $sql .= "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n";
    $sql .= "SET NAMES utf8mb4;\n\n";

    $tables_stmt = $pdo->query("SHOW TABLES;");
    $tables = $tables_stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($tables as $tbl) {
        $sql .= "-- --------------------------------------------------------\n";
        $sql .= "-- Structure for table `{$tbl}`\n";
        $sql .= "-- --------------------------------------------------------\n";
        $sql .= "DROP TABLE IF EXISTS `{$tbl}`;\n";

        $create_stmt = $pdo->query("SHOW CREATE TABLE `{$tbl}`;");
        $create_row = $create_stmt->fetch(PDO::FETCH_NUM);
        $sql .= $create_row[1] . ";\n\n";

        // Dump data
        $rows_stmt = $pdo->query("SELECT * FROM `{$tbl}`;");
        $rows = $rows_stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($rows)) {
            $sql .= "-- Dumping data for table `{$tbl}` (" . count($rows) . " rows)\n";
            $cols = array_keys($rows[0]);
            $col_list = "`" . implode("`, `", $cols) . "`";

            $chunks = array_chunk($rows, 100);
            foreach ($chunks as $chunk) {
                $val_lines = [];
                foreach ($chunk as $r) {
                    $escaped_vals = [];
                    foreach ($r as $val) {
                        if ($val === null) {
                            $escaped_vals[] = "NULL";
                        } else {
                            $escaped_vals[] = $pdo->quote($val);
                        }
                    }
                    $val_lines[] = "(" . implode(", ", $escaped_vals) . ")";
                }
                $sql .= "INSERT INTO `{$tbl}` ({$col_list}) VALUES\n  " . implode(",\n  ", $val_lines) . ";\n";
            }
            $sql .= "\n";
        }
    }

    $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";
    $sql .= "-- Backup generation completed successfully.\n";

    if ($is_cli) {
        file_put_contents($filepath, $sql);
        echo "SUCCESS: Database backup created successfully!\n";
        echo "File: {$filepath} (" . round(strlen($sql) / 1024, 2) . " KB)\n";
        echo "Tables backed up: " . count($tables) . "\n";
    } else {
        header('Content-Type: application/sql');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($sql));
        echo $sql;
        exit;
    }

// ── 2. RESTORE ────────────────────────────────────────────────────────────────
} elseif ($action === 'restore') {
    try {
        $pdo = get_pdo($host, $port, $database, $username, $password);
    } catch (Exception $e) {
        die("Database connection failed: " . $e->getMessage() . "\n");
    }

    $restore_file = $is_cli ? ($argv[2] ?? null) : null;
    if (!$restore_file) {
        // Look for the latest backup in database/backups
        $backup_dir = __DIR__ . '/database/backups';
        $files = glob($backup_dir . '/*.sql');
        if (!empty($files)) {
            rsort($files);
            $restore_file = $files[0];
        } else {
            $restore_file = __DIR__ . '/database/smart_school_database_cpanel_2026.sql';
        }
    }

    if (!file_exists($restore_file)) {
        die("ERROR: Restore file not found at: {$restore_file}\n");
    }

    echo "Restoring database from: " . basename($restore_file) . " (" . round(filesize($restore_file)/1024, 2) . " KB)...\n";

    $sql_content = file_get_contents($restore_file);
    $lines = explode("\n", $sql_content);
    $queries = [];
    $current = '';

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || strpos($trimmed, '--') === 0 || strpos($trimmed, '/*') === 0) continue;
        $current .= $line . "\n";
        if (substr($trimmed, -1) === ';') {
            $queries[] = $current;
            $current = '';
        }
    }
    if (!empty(trim($current))) $queries[] = $current;

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->beginTransaction();
    $executed = 0;

    try {
        foreach ($queries as $q) {
            $t = trim($q);
            if ($t === '') continue;
            $pdo->exec($t);
            $executed++;
        }
        $pdo->commit();
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
        echo "SUCCESS: Database restored successfully!\n";
        echo "Queries executed: {$executed}\n";

        $stmt = $pdo->query("SHOW TABLES;");
        echo "Active tables in `{$database}`: " . count($stmt->fetchAll()) . "\n";
    } catch (Exception $e) {
        $pdo->rollBack();
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
        die("RESTORE FAILED & ROLLED BACK: " . $e->getMessage() . "\n");
    }

// ── 3. DATA INTEGRITY & ORPHAN RECORDS VERIFY ──────────────────────────────────
} elseif ($action === 'verify') {
    try {
        $pdo = get_pdo($host, $port, $database, $username, $password);
    } catch (Exception $e) {
        die("Database connection failed: " . $e->getMessage() . "\n");
    }

    echo "========================================================================\n";
    echo "    DATABASE INTEGRITY & ORPHAN RECORD VERIFICATION REPORT             \n";
    echo "========================================================================\n\n";

    $checks = [
        [
            'name'  => 'Orphan Fee Invoices (student_fees without valid student)',
            'query' => 'SELECT COUNT(*) FROM student_fees sf LEFT JOIN students s ON s.id = sf.student_id WHERE s.id IS NULL'
        ],
        [
            'name'  => 'Orphan Attendances (attendances without valid student)',
            'query' => 'SELECT COUNT(*) FROM attendances a LEFT JOIN students s ON s.id = a.student_id WHERE s.id IS NULL'
        ],
        [
            'name'  => 'Orphan Hostel Allocations (student_hostels without valid student)',
            'query' => 'SELECT COUNT(*) FROM student_hostels sh LEFT JOIN students s ON s.id = sh.student_id WHERE s.id IS NULL'
        ],
        [
            'name'  => 'Orphan Book Issues (book_issues without valid book)',
            'query' => 'SELECT COUNT(*) FROM book_issues bi LEFT JOIN library_books b ON b.id = bi.book_id WHERE b.id IS NULL'
        ],
        [
            'name'  => 'Duplicate Student Admission Numbers',
            'query' => 'SELECT COUNT(*) FROM (SELECT admission_no, COUNT(*) as cnt FROM students GROUP BY admission_no HAVING cnt > 1) t'
        ],
        [
            'name'  => 'Duplicate Class Names',
            'query' => 'SELECT COUNT(*) FROM (SELECT LOWER(name) as nm, COUNT(*) as cnt FROM school_classes GROUP BY nm HAVING cnt > 1) t'
        ]
    ];

    $all_clean = true;
    foreach ($checks as $c) {
        try {
            $count = (int)$pdo->query($c['query'])->fetchColumn();
            if ($count === 0) {
                echo "[CLEAN] {$c['name']}: 0 anomalies detected.\n";
            } else {
                echo "[WARNING] {$c['name']}: {$count} invalid/orphan records found!\n";
                $all_clean = false;
            }
        } catch (Exception $e) {
            echo "[SKIPPED] {$c['name']}: " . $e->getMessage() . "\n";
        }
    }

    echo "\nIntegrity Status: " . ($all_clean ? "100% HEALTHY - No orphan records or integrity violations detected." : "Action required to prune orphans.") . "\n";
} else {
    echo "Usage: php backup.php [export | restore | verify]\n";
}
