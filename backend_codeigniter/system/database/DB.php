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

    $host = trim(getenv('DB_HOST') ?: ($db_config['hostname'] ?? '127.0.0.1'));
    $port = trim(getenv('DB_PORT') ?: ($db_config['port'] ?? '3306'));
    $database = trim(getenv('DB_DATABASE') ?: ($db_config['database'] ?? 'test'));
    $username = trim(getenv('DB_USERNAME') ?: ($db_config['username'] ?? 'root'));
    $password = getenv('DB_PASSWORD') !== false ? trim(getenv('DB_PASSWORD')) : ($db_config['password'] ?? '0');
    $driver = $db_config['dbdriver'] ?? 'pdo';

    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
    $pdo = null;

    try {
        $pdo_options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT            => 5,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
        ];

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
