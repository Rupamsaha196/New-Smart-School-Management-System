<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Staff extends REST_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('Staff_model', 'staff_model');
    }

    public function index(): void {
        $staff = $this->staff_model->get_all();
        $this->response($staff);
    }

    public function store(): void {
        $payload = $this->get_payload();
        if (empty($payload['name'])) {
            $this->error('Staff name is required', 422);
            return;
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
