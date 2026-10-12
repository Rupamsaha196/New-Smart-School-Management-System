@echo off
title Smart School Management System - Backend Server
echo ========================================================
echo   Starting Smart School Backend Server on 127.0.0.1:8000
echo ========================================================

set PHP_BIN=php

:: Check if php is in system PATH
where php >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe" (
        set PHP_BIN="C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe"
    ) else if exist "C:\xampp\php\php.exe" (
        set PHP_BIN="C:\xampp\php\php.exe"
    ) else (
        echo [ERROR] PHP executable not found in PATH, Laragon, or XAMPP!
        echo Please ensure PHP is installed and available in PATH.
        pause
        exit /b 1
    )
)

echo Using PHP: %PHP_BIN%
echo Server running at: http://127.0.0.1:8000/
echo Press Ctrl+C to stop the server.
echo.

%PHP_BIN% -S 127.0.0.1:8000 -t backend_codeigniter backend_codeigniter/router.php
pause
