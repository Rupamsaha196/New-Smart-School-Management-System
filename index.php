<?php
/**
 * Smart School Management System
 * Root Front Controller / cPanel Universal Router
 * Infosof Technologies 2026
 */

$request_uri = $_SERVER['REQUEST_URI'] ?? '/';
$parsed_path = parse_url($request_uri, PHP_URL_PATH);

// 0. Lightweight Health Check endpoint (for Render keep-alive & monitoring)
if ($parsed_path === '/health' || $parsed_path === '/api/health') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => 'healthy', 'time' => time(), 'service' => 'Smart School Management System']);
    exit;
}

// 1. If API request, route directly into CodeIgniter
if (preg_match('#/api(/.*)?$#i', $parsed_path) || strpos($parsed_path, 'api/') !== false) {
    require_once __DIR__ . '/backend_codeigniter/index.php';
    exit;
}

// 2. If requesting a static frontend file (css, js, assets, etc.)
if (preg_match('#/(css|js|assets)/.*$#i', $parsed_path, $matches)) {
    $frontend_file = __DIR__ . '/frontend' . $matches[0];
    if (file_exists($frontend_file) && !is_dir($frontend_file)) {
        $mime = 'application/octet-stream';
        if (substr($frontend_file, -3) === '.js')  $mime = 'application/javascript';
        elseif (substr($frontend_file, -4) === '.css') $mime = 'text/css';
        elseif (substr($frontend_file, -4) === '.svg') $mime = 'image/svg+xml';
        elseif (substr($frontend_file, -4) === '.png') $mime = 'image/png';
        elseif (substr($frontend_file, -4) === '.jpg' || substr($frontend_file, -5) === '.jpeg') $mime = 'image/jpeg';
        elseif (substr($frontend_file, -5) === '.webp') $mime = 'image/webp';
        elseif (function_exists('mime_content_type')) $mime = mime_content_type($frontend_file);

        header("Content-Type: {$mime}");
        readfile($frontend_file);
        exit;
    }
}

// Fallback check for direct frontend path
$direct_file = __DIR__ . '/frontend' . $parsed_path;
if ($parsed_path !== '/' && file_exists($direct_file) && !is_dir($direct_file)) {
    $mime = function_exists('mime_content_type') ? mime_content_type($direct_file) : 'application/octet-stream';
    if (substr($direct_file, -3) === '.js')  $mime = 'application/javascript';
    if (substr($direct_file, -4) === '.css') $mime = 'text/css';
    if (substr($direct_file, -4) === '.svg') $mime = 'image/svg+xml';
    header("Content-Type: {$mime}");
    readfile($direct_file);
    exit;
}

// 3. Serve Frontend Application
$index_html = __DIR__ . '/frontend/index.html';
if (file_exists($index_html)) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    readfile($index_html);
    exit;
}

echo "Smart School Management System - Files not found. Please verify deployment.";
