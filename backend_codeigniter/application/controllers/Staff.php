<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Staff extends REST_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('Staff_model', 'staff_model');
    }

    public function index(): void {
        $campus = $this->get_active_campus();
        $staff = $this->staff_model->get_all($campus);
        $this->response($staff);
    }

    public function store(): void {
        $payload = $this->get_payload();
        if (empty($payload['campus'])) {
            $payload['campus'] = $this->get_active_campus();
        }
        if (empty($payload['name'])) {
            $this->error('Staff name is required', 422);
            return;
        }

        // Duplicate Check 1: Employee ID
        $emp_id = trim($payload['emp_id'] ?? ($payload['staff_id'] ?? ''));
        if (!empty($emp_id)) {
            $existing_emp = $this->db->where('emp_id', $emp_id)->get('staff')->row_array();
            if ($existing_emp) {
                $this->error("Duplicate entry: A staff member with Employee ID '{$emp_id}' already exists.", 409);
                return;
            }
        }

        // Duplicate Check 2: Email Address
        if (!empty($payload['email'])) {
            $email = trim($payload['email']);
            $existing_email = $this->db->where('LOWER(email)', strtolower($email))->get('staff')->row_array();
            if ($existing_email) {
                $this->error("Duplicate entry: A staff member with email '{$email}' already exists.", 409);
                return;
            }
        }

        // Duplicate Check 3: Phone Number
        if (!empty($payload['phone'])) {
            $phone = trim($payload['phone']);
            $existing_phone = $this->db->where('phone', $phone)->get('staff')->row_array();
            if ($existing_phone) {
                $this->error("Duplicate entry: A staff member with phone '{$phone}' already exists.", 409);
                return;
            }
        }

        $id = $this->staff_model->create_staff($payload);
        $record = $this->staff_model->find($id);
        $this->success($record, 'Staff record created', 201);
    }

    public function attendance(): void {
        $date = $this->input->get('date') ?: date('Y-m-d');
        $records = $this->db->where('date', $date)->get('staff_attendances')->result_array();
        $this->response($records);
    }

    public function bulk_attendance(): void {
        $payload = $this->get_payload();
        $date = !empty($payload['date']) ? $payload['date'] : ($this->input->post('date') ?: date('Y-m-d'));
        $records = !empty($payload['records']) ? $payload['records'] : ($this->input->post('records') ?: []);
        $count = $this->staff_model->mark_attendance($date, $records);
        $this->success(['updated' => $count], 'Staff attendance recorded successfully');
    }
}
