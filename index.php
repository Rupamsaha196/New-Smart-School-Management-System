<?php
/**
 * Smart School Management System
 * Root Front Controller / cPanel Universal Router
 * Infosof Technologies 2026
 */

$request_uri = $_SERVER['REQUEST_URI'] ?? '/';
$parsed_path = parse_url($request_uri, PHP_URL_PATH);

// 1. If API request, route directly into CodeIgniter
if (preg_match('#^/api(/.*)?$#i', $parsed_path) || strpos($parsed_path, 'api/') !== false) {
    require_once __DIR__ . '/backend_codeigniter/index.php';
    exit;
}

// 2. If requesting a static frontend file (css, js, assets, etc.)
$frontend_file = __DIR__ . '/frontend' . $parsed_path;
if ($parsed_path !== '/' && file_exists($frontend_file) && !is_dir($frontend_file)) {
    $mime = mime_content_type($frontend_file);
    if (substr($frontend_file, -3) === '.js')  $mime = 'application/javascript';
    if (substr($frontend_file, -4) === '.css') $mime = 'text/css';
    if (substr($frontend_file, -4) === '.svg') $mime = 'image/svg+xml';
    header("Content-Type: {$mime}");
    readfile($frontend_file);
    exit;
}

// 3. Serve Frontend Application
$index_html = __DIR__ . '/frontend/index.html';
if (file_exists($index_html)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($index_html);
    exit;
}

echo "Smart School Management System - Files not found. Please verify deployment.";
