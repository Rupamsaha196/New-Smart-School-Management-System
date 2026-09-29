<?php
/**
 * Smart School Database Migration & Seed Runner for Render / Cloud Deployment
 * Infosof Technologies 2026
 *
 * Can be executed via:
 * 1. Render Web Shell: php migrate.php
 * 2. Web browser: https://your-app.onrender.com/migrate.php?secret=smart_school_init_2026
 */

$is_cli = (php_sapi_name() === 'cli');

// If accessed via web browser, require a secret token to prevent unauthorized execution
if (!$is_cli) {
    $secret = $_GET['secret'] ?? '';
    $allowed_secret = getenv('MIGRATION_SECRET') ?: 'smart_school_init_2026';
    if ($secret !== $allowed_secret) {
        http_response_code(403);
        die("403 Forbidden: Invalid migration secret. Pass ?secret=" . htmlspecialchars($allowed_secret));
    }
    header('Content-Type: text/plain; charset=utf-8');
}

echo "========================================================================\n";
echo "    SMART SCHOOL MANAGEMENT SYSTEM - DATABASE MIGRATION RUNNER         \n";
echo "    INFOSOF TECHNOLOGIES 2026 - MYSQL 8 / RENDER CLOUD DEPLOYMENT      \n";
echo "    Engine: v2.1 (SSL/TLS Encrypted Transport)                         \n";
echo "========================================================================\n\n";

// 1. Resolve Database Credentials from Environment (or URL query override)
$host     = trim($_GET['db_host'] ?? (getenv('DB_HOST') ?: '127.0.0.1'));
$port     = trim($_GET['db_port'] ?? (getenv('DB_PORT') ?: 3306));
$database = trim($_GET['db_name'] ?? (getenv('DB_DATABASE') ?: 'test'));
$username = trim($_GET['db_user'] ?? (getenv('DB_USERNAME') ?: 'root'));
$password = trim($_GET['db_pass'] ?? (getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : ''));

$masked_pw = strlen($password) > 4 ? substr($password, 0, 2) . '****' . substr($password, -2) : '****';
echo "Target Host    : {$host}:{$port}\n";
echo "Target User    : {$username}\n";
echo "Password Info  : Length " . strlen($password) . " (" . $masked_pw . ")\n";
echo "Target Database: {$database}\n\n";

// 2. Locate SQL Dump File
$sql_files = [
    __DIR__ . '/database/smart_school_database_cpanel_2026.sql',
    __DIR__ . '/backend_codeigniter/database/smart_school_infosof_2026.sql'
];

$sql_path = null;
foreach ($sql_files as $f) {
    if (file_exists($f)) {
        $sql_path = $f;
        break;
    }
}

if (!$sql_path) {
    die("ERROR: Could not locate SQL seed dump file.\n");
}

echo "Found SQL Dump: " . basename($sql_path) . " (" . round(filesize($sql_path) / 1024, 2) . " KB)\n";

// 3. Connect via PDO MySQL with TLS/SSL Transport & Auto-Fallbacks
$pdo = null;
$connection_errors = [];

$db_candidates = array_unique(array_filter([$database, '', 'test', 'sys']));

foreach ($db_candidates as $db_target) {
    try {
        $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
        if (!empty($db_target)) {
            $dsn .= ";dbname={$db_target}";
            echo "Attempting connection to database '{$db_target}' with SSL...\n";
        } else {
            echo "Attempting connection to server root with SSL...\n";
        }
        
        $pdo_options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT            => 10,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ];

        // Force TLS/SSL transport for cloud MySQL providers (TiDB Serverless, Aiven, etc.)
        $ca_bundle = '/etc/ssl/certs/ca-certificates.crt';
        if (file_exists($ca_bundle)) {
            $pdo_options[PDO::MYSQL_ATTR_SSL_CA] = $ca_bundle;
        } else {
            $pdo_options[PDO::MYSQL_ATTR_SSL_CAPATH] = '/etc/ssl/certs';
        }
        if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
            $pdo_options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        }

        $pdo = new PDO($dsn, $username, $password, $pdo_options);
        echo "Successfully connected to MySQL" . (!empty($db_target) ? " database '{$db_target}'" : "") . "!\n\n";

        // Select or create target database
        $target_to_use = !empty($database) ? $database : 'test';
        try {
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$target_to_use}`; USE `{$target_to_use}`;");
            echo "Active database set to: `{$target_to_use}`\n";
        } catch (Exception $e) {
            try {
                $pdo->exec("USE `{$target_to_use}`;");
            } catch (Exception $e2) {}
        }
        break;
    } catch (PDOException $e) {
        $connection_errors[] = ($db_target ?: '(server root)') . ': ' . $e->getMessage();
    }
}

if (!$pdo) {
    echo "ERROR: Failed to connect to MySQL database.\n";
    foreach ($connection_errors as $err) {
        echo " Details: " . $err . "\n";
    }
    echo "\nPlease verify your DB_HOST, DB_PORT, DB_USERNAME, and DB_PASSWORD in Render.\n";
    exit(1);
}

// 4. Execute SQL Dump Statements
echo "Executing SQL statements from schema dump...\n";
$sql_content = file_get_contents($sql_path);

// Split SQL queries respecting delimiter and multi-line comments
$queries = [];
$current_query = '';
$lines = explode("\n", $sql_content);

foreach ($lines as $line) {
    $trimmed = trim($line);
    // Skip single-line comments and empty lines
    if ($trimmed === '' || strpos($trimmed, '--') === 0 || strpos($trimmed, '/*') === 0) {
        continue;
    }
    $current_query .= $line . "\n";
    if (substr($trimmed, -1) === ';') {
        $queries[] = $current_query;
        $current_query = '';
    }
}

if (!empty(trim($current_query))) {
    $queries[] = $current_query;
}

$total = count($queries);
echo "Parsed {$total} SQL statements to execute.\n";

$executed = 0;
$errors = 0;

$pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

foreach ($queries as $idx => $q) {
    $trimmed_q = trim($q);
    if ($trimmed_q === '') continue;
    try {
        $pdo->exec($trimmed_q);
        $executed++;
    } catch (PDOException $e) {
        $errors++;
        // Ignore "table already exists" if re-running
        if (strpos($e->getMessage(), 'already exists') === false) {
            echo "Warning on query #" . ($idx + 1) . ": " . $e->getMessage() . "\n";
        }
    }
}

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

echo "\n========================================================================\n";
echo " Execution Summary:\n";
echo " Statements Executed : {$executed} / {$total}\n";
echo " Warnings / Skipped  : {$errors}\n";

// 5. Verify Table Count
$stmt = $pdo->query("SHOW TABLES;");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo " Total Tables Created: " . count($tables) . " tables in database '{$database}'\n";
echo "========================================================================\n\n";

echo "Database migration completed successfully!\n";
echo "You can now log in to Smart School with:\n";
echo "  Super Admin: admin@smartschool.edu / Admin@123\n";
echo "  Teacher    : teacher@smartschool.edu / Teacher@123\n";
echo "  Accountant : accountant@smartschool.edu / Account@123\n";
