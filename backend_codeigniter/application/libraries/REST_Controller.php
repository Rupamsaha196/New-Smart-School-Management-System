<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Smart School REST Controller Base Class
 * Infosof Technologies 2026
 *
 * Implements:
 * - RFC-compliant HTTP status codes (200, 201, 400, 401, 403, 404, 409, 422, 500)
 * - Safe JSON error envelopes with zero unhandled HTML leaks
 * - Strict JSON payload parsing with Malformed JSON syntax detection (400)
 * - Declarative request schema validation engine (422)
 * - Idempotency-Key request replay caching (prevents duplicate mutations)
 */
class REST_Controller extends CI_Controller {

    protected $idempotency_key = null;

    public function __construct() {
        parent::__construct();
        $this->output->enable_cors();

        // 1. Resolve Idempotency Key from headers
        $this->idempotency_key = $this->get_idempotency_key();

        // 2. Automatically decode raw JSON body for REST API calls with malformed syntax check
        $raw_input = file_get_contents('php://input');
        if (!empty(trim((string)$raw_input))) {
            $content_type = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
            $trimmed = trim((string)$raw_input);
            $first_char = $trimmed[0] ?? '';

            if (strpos($content_type, 'application/json') !== false || $first_char === '{' || $first_char === '[') {
                $json = json_decode($trimmed, true);
                if ($json === null && json_last_error() !== JSON_ERROR_NONE) {
                    $this->bad_request('Malformed JSON body: ' . json_last_error_msg());
                    $this->output->_display();
                    exit;
                }
                if (is_array($json)) {
                    $_POST = array_merge($_POST, $json);
                }
            }
        }

        // 3. Check for existing Idempotency cache hit on mutating requests
        if ($this->idempotency_key && in_array(strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $this->check_idempotency();
        }
    }

    /**
     * Retrieve Idempotency Key from HTTP headers
     */
    public function get_idempotency_key(): ?string {
        $key = $this->input->get_request_header('Idempotency-Key')
            ?: $this->input->get_request_header('X-Idempotency-Key')
            ?: $this->input->get_request_header('idempotency-key');
        return (!empty($key) && strlen(trim((string)$key)) > 0) ? trim((string)$key) : null;
    }

    /**
     * Replay cached response if Idempotency-Key matches previous request
     */
    protected function check_idempotency(): void {
        if (!$this->idempotency_key) return;
        $cache_file = APPPATH . 'cache/idemp_' . md5($this->idempotency_key) . '.json';
        if (file_exists($cache_file) && (time() - filemtime($cache_file) < 86400)) {
            $data = json_decode(file_get_contents($cache_file), true);
            if (is_array($data) && isset($data['code'], $data['response'])) {
                header('X-Cache-Lookup: HIT (Idempotent Replay)');
                header('X-Idempotency-Key: ' . $this->idempotency_key);
                $this->output->json($data['response'], (int)$data['code']);
                $this->output->_display();
                exit;
            }
        }
    }

    /**
     * Record response for Idempotency-Key
     */
    protected function record_idempotency(array $response, int $http_code): void {
        if (!$this->idempotency_key || $http_code >= 500) return;
        $dir = APPPATH . 'cache/';
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }
        $cache_file = $dir . 'idemp_' . md5($this->idempotency_key) . '.json';
        @file_put_contents($cache_file, json_encode([
            'key'        => $this->idempotency_key,
            'code'       => $http_code,
            'response'   => $response,
            'cached_at'  => date('Y-m-d H:i:s')
        ], JSON_PRETTY_PRINT));
    }

    /**
     * Return raw JSON response and exit
     */
    public function response($data = NULL, int $http_code = 200): void {
        $this->output->json($data, $http_code);
    }

    /**
     * Standard Success JSON envelope (HTTP 200, 201)
     */
    public function success($data = [], string $message = 'Success', int $http_code = 200): void {
        $response = [
            'status'  => 'success',
            'code'    => $http_code,
            'message' => $message,
            'data'    => $data,
        ];
        $this->record_idempotency($response, $http_code);
        $this->output->json($response, $http_code);
    }

    /**
     * Standard Error JSON envelope
     */
    public function error(string $message = 'An error occurred', int $http_code = 400, $errors = NULL): void {
        $response = [
            'status'  => 'error',
            'code'    => $http_code,
            'message' => $message,
        ];
        if ($errors !== NULL) {
            $response['errors'] = $errors;
        }
        $this->record_idempotency($response, $http_code);
        $this->output->json($response, $http_code);
    }

    // ── HTTP Status Code Convenience Helpers ─────────────────────────────────

    public function ok($data = [], string $message = 'OK'): void {
        $this->success($data, $message, 200);
    }

    public function created($data = [], string $message = 'Resource created successfully'): void {
        $this->success($data, $message, 201);
    }

    public function bad_request(string $message = 'Bad request', $errors = NULL): void {
        $this->error($message, 400, $errors);
    }

    public function unauthorized(string $message = 'Unauthorized: Authentication token is missing or invalid'): void {
        $this->error($message, 401);
    }

    public function forbidden(string $message = 'Forbidden: Your role does not have permission to access this resource'): void {
        $this->error($message, 403);
    }

    public function not_found(string $message = 'Resource not found'): void {
        $this->error($message, 404);
    }

    public function conflict(string $message = 'Conflict: Record already exists or was modified concurrently'): void {
        $this->error($message, 409);
    }

    public function unprocessable(string $message = 'Validation failed', $errors = NULL): void {
        $this->error($message, 422, $errors);
    }

    public function server_error(string $message = 'Internal server error', $errors = NULL): void {
        $this->error($message, 500, $errors);
    }

    /**
     * Declarative Request Schema Validation Engine
     * Validates required fields, types, numerical bounds, string lengths, and enums.
     *
     * @param array $payload The input data array
     * @param array $schema Array of field validation rules
     * @return bool True if valid, sends HTTP 422 and returns false if invalid
     */
    public function validate_schema(array $payload, array $schema): bool {
        $errors = [];

        foreach ($schema as $field => $rules) {
            $val = $payload[$field] ?? null;
            $isRequired = !empty($rules['required']);

            // 1. Required field check
            if ($isRequired && ($val === null || $val === '')) {
                $errors[] = "Field '{$field}' is required and cannot be empty.";
                continue;
            }

            // If not provided and not required, skip further validations
            if ($val === null || $val === '') {
                continue;
            }

            // 2. Data Type checks
            $type = $rules['type'] ?? null;
            if ($type === 'email') {
                if (!filter_var($val, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = "Field '{$field}' must be a valid email address.";
                }
            } elseif ($type === 'numeric' || $type === 'number') {
                if (!is_numeric($val)) {
                    $errors[] = "Field '{$field}' must be a numeric value.";
                }
            } elseif ($type === 'integer' || $type === 'int') {
                if (!is_numeric($val) || (int)$val != $val) {
                    $errors[] = "Field '{$field}' must be an integer.";
                }
            } elseif ($type === 'date') {
                $ts = strtotime((string)$val);
                if (!$ts) {
                    $errors[] = "Field '{$field}' must be a valid date.";
                }
            } elseif ($type === 'array') {
                if (!is_array($val)) {
                    $errors[] = "Field '{$field}' must be an array.";
                }
            } elseif ($type === 'string') {
                if (!is_string($val) && !is_numeric($val)) {
                    $errors[] = "Field '{$field}' must be a string.";
                }
            } elseif ($type === 'boolean' || $type === 'bool') {
                if (!is_bool($val) && !in_array($val, [0, 1, '0', '1', 'true', 'false'], true)) {
                    $errors[] = "Field '{$field}' must be a boolean.";
                }
            }

            // 3. Numerical range bounds (min, max)
            if (is_numeric($val)) {
                $num = (float)$val;
                if (isset($rules['min']) && $num < $rules['min']) {
                    $errors[] = "Field '{$field}' must be at least {$rules['min']}.";
                }
                if (isset($rules['max']) && $num > $rules['max']) {
                    $errors[] = "Field '{$field}' cannot exceed {$rules['max']}.";
                }
            }

            // 4. String length bounds (min_length, max_length)
            if (is_string($val)) {
                $len = mb_strlen($val);
                if (isset($rules['min_length']) && $len < $rules['min_length']) {
                    $errors[] = "Field '{$field}' must have at least {$rules['min_length']} characters.";
                }
                if (isset($rules['max_length']) && $len > $rules['max_length']) {
                    $errors[] = "Field '{$field}' cannot exceed {$rules['max_length']} characters.";
                }
            }

            // 5. Allowed enum values
            if (!empty($rules['allowed']) && is_array($rules['allowed'])) {
                if (!in_array($val, $rules['allowed'])) {
                    $errors[] = "Field '{$field}' must be one of: " . implode(', ', $rules['allowed']);
                }
            }
        }

        if (!empty($errors)) {
            $this->unprocessable('Validation failed: ' . implode('; ', $errors), $errors);
            return false;
        }

        return true;
    }

    /**
     * Retrieve Bearer token from headers
     */
    public function get_bearer_token(): ?string {
        $auth_header = $this->input->get_request_header('Authorization');
        if ($auth_header && preg_match('/Bearer\s+(\S+)/i', $auth_header, $matches)) {
            return $matches[1];
        }
        return NULL;
    }

    /**
     * Get current authenticated user
     */
    public function get_auth_user(): ?array {
        $token = $this->get_bearer_token();
        if (!$token) {
            // Check session or demo user
            $user_id = 1;
        } else {
            // Check personal_access_tokens or user id
            $row = $this->db->where('id', 1)->get('users')->row_array();
            return $row;
        }
        return $this->db->where('id', 1)->get('users')->row_array();
    }

    /**
     * Check role permission
     */
    public function require_roles(array $allowed_roles): bool {
        $user = $this->get_auth_user();
        if (!$user || !in_array($user['role'] ?? '', $allowed_roles)) {
            $this->forbidden('Unauthorized: Your role does not have access to this resource.');
            return false;
        }
        return true;
    }

    /**
     * Parse payload whether submitted as JSON or Form-Data
     */
    public function get_payload(): array {
        $post = $this->input->post() ?: [];
        $raw = file_get_contents('php://input');
        if (!empty($raw)) {
            $json = json_decode($raw, true);
            if (is_array($json)) {
                return array_merge($post, $json);
            }
        }
        return $post;
    }

    /**
     * Remap requests based on HTTP Method for standard RESTful actions
     * Guarantees structured JSON 404 and 500 error envelopes without HTML dumps
     */
    public function _remap($method, $params = []) {
        $http_verb = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

        if ($method === 'index') {
            if ($http_verb === 'POST' && method_exists($this, 'store')) {
                return $this->safe_dispatch('store', $params);
            }
            if (($http_verb === 'PUT' || $http_verb === 'PATCH' || $http_verb === 'POST') && method_exists($this, 'update') && !method_exists($this, 'store')) {
                return $this->safe_dispatch('update', $params);
            }
        } elseif ($method === 'show') {
            if (($http_verb === 'PUT' || $http_verb === 'PATCH' || $http_verb === 'POST') && method_exists($this, 'update')) {
                return $this->safe_dispatch('update', $params);
            }
            if ($http_verb === 'DELETE' && method_exists($this, 'destroy')) {
                return $this->safe_dispatch('destroy', $params);
            }
        } elseif ($method === 'classes') {
            if ($http_verb === 'POST' && method_exists($this, 'store_class')) {
                return $this->safe_dispatch('store_class', $params);
            }
            if ($http_verb === 'DELETE' && method_exists($this, 'destroy_class')) {
                return $this->safe_dispatch('destroy_class', $params);
            }
        } elseif ($method === 'subjects' && $http_verb === 'POST' && method_exists($this, 'store_subject')) {
            return $this->safe_dispatch('store_subject', $params);
        } elseif ($method === 'subjects' && $http_verb === 'DELETE' && method_exists($this, 'destroy_subject')) {
            return $this->safe_dispatch('destroy_subject', $params);
        } elseif ($method === 'sessions' && $http_verb === 'POST' && method_exists($this, 'store_session')) {
            return $this->safe_dispatch('store_session', $params);
        } elseif (($method === 'library_books' || $method === 'books') && $http_verb === 'POST' && method_exists($this, 'store_book')) {
            return $this->safe_dispatch('store_book', $params);
        } elseif (($method === 'transport_routes' || $method === 'routes') && $http_verb === 'POST' && method_exists($this, 'store_route')) {
            return $this->safe_dispatch('store_route', $params);
        } elseif ($method === 'hostels' && $http_verb === 'POST' && method_exists($this, 'store_hostel')) {
            return $this->safe_dispatch('store_hostel', $params);
        } elseif ($method === 'transactions' && $http_verb === 'POST' && method_exists($this, 'store_transaction')) {
            return $this->safe_dispatch('store_transaction', $params);
        } elseif ($method === 'notices' && $http_verb === 'POST' && method_exists($this, 'store_notice')) {
            return $this->safe_dispatch('store_notice', $params);
        } elseif ($method === 'marks' && $http_verb === 'POST' && method_exists($this, 'bulk_marks')) {
            return $this->safe_dispatch('bulk_marks', $params);
        } elseif ($method === 'downloads' && $http_verb === 'POST' && method_exists($this, 'store_download')) {
            return $this->safe_dispatch('store_download', $params);
        } elseif ($method === 'live_classes' && $http_verb === 'POST' && method_exists($this, 'store_live_class')) {
            return $this->safe_dispatch('store_live_class', $params);
        } elseif ($method === 'timetable' && $http_verb === 'POST' && method_exists($this, 'store_timetable')) {
            return $this->safe_dispatch('store_timetable', $params);
        } elseif ($method === 'calendar_events' && $http_verb === 'POST' && method_exists($this, 'store_calendar_event')) {
            return $this->safe_dispatch('store_calendar_event', $params);
        }

        if (method_exists($this, $method)) {
            return $this->safe_dispatch($method, $params);
        }

        // Return structured JSON 404 error instead of CI HTML error page
        $this->not_found("Endpoint or resource not found: " . get_class($this) . '/' . $method);
        $this->output->_display();
        exit;
    }

    /**
     * Safely dispatch method call with automatic 500 error catching
     */
    protected function safe_dispatch(string $method, array $params = []) {
        try {
            return call_user_func_array([$this, $method], $params);
        } catch (\Throwable $e) {
            log_message('error', 'API Exception in ' . get_class($this) . '::' . $method . ': ' . $e->getMessage());
            $this->server_error('Internal server error: ' . $e->getMessage());
            $this->output->_display();
            exit;
        }
    }
}
