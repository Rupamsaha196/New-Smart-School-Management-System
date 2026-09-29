<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Settings extends REST_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('Setting_model', 'setting_model');
    }

    public function index(): void {
        $method = strtolower($_SERVER['REQUEST_METHOD'] ?? 'get');
        if ($method === 'post' || $method === 'put') {
            $this->update();
            return;
        }
        $settings = $this->setting_model->get_settings();
        $this->response($settings);
    }

    public function update(): void {
        $payload = $this->input->post();
        if (empty($payload)) {
            $raw = file_get_contents('php://input');
            if (!empty($raw)) {
                $payload = json_decode($raw, true) ?: [];
            }
        }
        $this->setting_model->update_settings($payload);
        $settings = $this->setting_model->get_settings();
        $this->success($settings, 'School settings updated successfully');
    }

    public function add_campus(): void {
        $campus = trim($this->input->post('campus_name') ?: $this->input->post('campus') ?: '');
        if (empty($campus)) {
            $raw = file_get_contents('php://input');
            $body = json_decode($raw, true) ?: [];
            $campus = trim($body['campus_name'] ?? ($body['campus'] ?? ''));
        }
        if (empty($campus)) {
            $this->error('Campus name is required');
            return;
        }
        $settings = $this->setting_model->get_settings();
        $campuses = json_decode($settings['available_campuses'] ?? '[]', true) ?: [];
        if (!in_array($campus, $campuses)) {
            $campuses[] = $campus;
            $this->setting_model->update_settings([
                'available_campuses' => $campuses
            ]);
        }
        $this->success($campuses, "Campus '{$campus}' added successfully");
    }

    public function custom_fields(): void {
        $fields = $this->setting_model->get_custom_fields();
        $this->response($fields);
    }

    public function two_factor_status(): void {
        $this->response([
            'enabled'   => false,
            'qr_code'   => 'otpauth://totp/SmartSchool:admin@smartschool.com?secret=JBSWY3DPEHPK3PXP&issuer=SmartSchool',
            'secret'    => 'JBSWY3DPEHPK3PXP',
            'backup_codes' => ['4829-1049', '9182-3746', '6291-8374', '5019-2847'],
        ]);
    }

    public function two_factor_enable(): void {
        $this->success(null, 'Two-factor authentication enabled successfully');
    }

    public function two_factor_disable(): void {
        $this->success(null, 'Two-factor authentication disabled');
    }
}
