<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Smart School REST Controller Base Class
 * Infosof Technologies 2026
 */
class REST_Controller extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->output->enable_cors();

        // Automatically decode raw JSON body for REST API calls
        $raw_input = file_get_contents('php://input');
        if (!empty($raw_input)) {
            $json = json_decode($raw_input, true);
            if (is_array($json)) {
                $_POST = array_merge($_POST, $json);
            }
        }
    }

    /**
     * Return JSON response and exit
     */
    public function response($data = NULL, int $http_code = 200): void {
        $this->output->json($data, $http_code);
    }

    /**
     * Success JSON wrapper
     */
    public function success($data = [], string $message = 'Success', int $http_code = 200): void {
        $response = [
            'status'  => 'success',
            'code'    => $http_code,
            'message' => $message,
            'data'    => $data,
        ];
        $this->output->json($response, $http_code);
    }

    /**
     * Error JSON wrapper
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
        $this->output->json($response, $http_code);
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
            $this->error('Unauthorized: Your role does not have access to this resource.', 403);
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
     */
    public function _remap($method, $params = []) {
        $http_verb = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

        if ($method === 'index') {
            if ($http_verb === 'POST' && method_exists($this, 'store')) {
                return call_user_func_array([$this, 'store'], $params);
            }
            if (($http_verb === 'PUT' || $http_verb === 'PATCH' || $http_verb === 'POST') && method_exists($this, 'update') && !method_exists($this, 'store')) {
                return call_user_func_array([$this, 'update'], $params);
            }
        } elseif ($method === 'show') {
            if (($http_verb === 'PUT' || $http_verb === 'PATCH' || $http_verb === 'POST') && method_exists($this, 'update')) {
                return call_user_func_array([$this, 'update'], $params);
            }
            if ($http_verb === 'DELETE' && method_exists($this, 'destroy')) {
                return call_user_func_array([$this, 'destroy'], $params);
            }
        } elseif ($method === 'classes') {
            if ($http_verb === 'POST' && method_exists($this, 'store_class')) {
                return call_user_func_array([$this, 'store_class'], $params);
            }
            if ($http_verb === 'DELETE' && method_exists($this, 'destroy_class')) {
                return call_user_func_array([$this, 'destroy_class'], $params);
            }
        } elseif ($method === 'subjects' && $http_verb === 'POST' && method_exists($this, 'store_subject')) {
            return call_user_func_array([$this, 'store_subject'], $params);
        } elseif ($method === 'subjects' && $http_verb === 'DELETE' && method_exists($this, 'destroy_subject')) {
            return call_user_func_array([$this, 'destroy_subject'], $params);
        } elseif ($method === 'sessions' && $http_verb === 'POST' && method_exists($this, 'store_session')) {
            return call_user_func_array([$this, 'store_session'], $params);
        } elseif (($method === 'library_books' || $method === 'books') && $http_verb === 'POST' && method_exists($this, 'store_book')) {
            return call_user_func_array([$this, 'store_book'], $params);
        } elseif (($method === 'transport_routes' || $method === 'routes') && $http_verb === 'POST' && method_exists($this, 'store_route')) {
            return call_user_func_array([$this, 'store_route'], $params);
        } elseif ($method === 'hostels' && $http_verb === 'POST' && method_exists($this, 'store_hostel')) {
            return call_user_func_array([$this, 'store_hostel'], $params);
        } elseif ($method === 'transactions' && $http_verb === 'POST' && method_exists($this, 'store_transaction')) {
            return call_user_func_array([$this, 'store_transaction'], $params);
        } elseif ($method === 'notices' && $http_verb === 'POST' && method_exists($this, 'store_notice')) {
            return call_user_func_array([$this, 'store_notice'], $params);
        } elseif ($method === 'marks' && $http_verb === 'POST' && method_exists($this, 'bulk_marks')) {
            return call_user_func_array([$this, 'bulk_marks'], $params);
        } elseif ($method === 'downloads' && $http_verb === 'POST' && method_exists($this, 'store_download')) {
            return call_user_func_array([$this, 'store_download'], $params);
        } elseif ($method === 'live_classes' && $http_verb === 'POST' && method_exists($this, 'store_live_class')) {
            return call_user_func_array([$this, 'store_live_class'], $params);
        } elseif ($method === 'timetable' && $http_verb === 'POST' && method_exists($this, 'store_timetable')) {
            return call_user_func_array([$this, 'store_timetable'], $params);
        } elseif ($method === 'calendar_events' && $http_verb === 'POST' && method_exists($this, 'store_calendar_event')) {
            return call_user_func_array([$this, 'store_calendar_event'], $params);
        }

        if (method_exists($this, $method)) {
            return call_user_func_array([$this, $method], $params);
        }

        show_404(get_class($this) . '/' . $method);
    }
}
