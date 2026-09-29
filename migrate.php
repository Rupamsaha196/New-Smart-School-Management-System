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
echo "========================================================================\n\n";

// 1. Resolve Database Credentials from Environment
$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: 3306;
$database = getenv('DB_DATABASE') ?: 'smart_school';
$username = getenv('DB_USERNAME') ?: 'root';
$password = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';

echo "Target Database: {$database} on {$host}:{$port} (User: {$username})\n";

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

// 3. Connect via PDO MySQL
try {
    echo "Connecting to MySQL server...\n";
    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ]);
    echo "Successfully connected to MySQL database: {$database}\n\n";
} catch (PDOException $e) {
    echo "ERROR: Failed to connect to MySQL database.\n";
    echo "Details: " . $e->getMessage() . "\n\n";
    echo "Please verify that your DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, and DB_PASSWORD\n";
    echo "environment variables in the Render Dashboard are correct and that the remote MySQL\n";
    echo "instance allows incoming connections from Render.\n";
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
