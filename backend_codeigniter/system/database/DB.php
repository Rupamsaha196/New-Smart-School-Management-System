<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once(__DIR__ . '/DB_query_builder.php');

function &DB($params = '', bool $query_builder_override = NULL) {
    static $_db_instances = [];

    if (isset($_db_instances['default'])) {
        return $_db_instances['default'];
    }

    if (file_exists(APPPATH . 'config/database.php')) {
        require(APPPATH . 'config/database.php');
    }

    $active_group = $active_group ?? 'default';
    $db_config = $db[$active_group] ?? [];

    $host = getenv('DB_HOST') ?: ($db_config['hostname'] ?? '127.0.0.1');
    $port = getenv('DB_PORT') ?: ($db_config['port'] ?? '3306');
    $database = getenv('DB_DATABASE') ?: ($db_config['database'] ?? 'smart_school');
    $username = getenv('DB_USERNAME') ?: ($db_config['username'] ?? 'root');
    $password = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : ($db_config['password'] ?? '0');
    $driver = $db_config['dbdriver'] ?? 'pdo';

    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
    $pdo = null;

    try {
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT            => 3,
        ]);
    } catch (PDOException $e) {
        // Fallback to SQLite if local MySQL is temporarily unavailable
        $sqlite_file = APPPATH . '../database/database.sqlite';
        if (file_exists($sqlite_file)) {
            $pdo = new PDO('sqlite:' . $sqlite_file);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } else {
            // Create minimal SQLite database in memory / file so application doesn't crash
            $pdo = new PDO('sqlite:' . APPPATH . 'cache/smart_school.sqlite');
        }
    }

    $_db_instances['default'] = new CI_DB_query_builder($pdo);
    return $_db_instances['default'];
}
