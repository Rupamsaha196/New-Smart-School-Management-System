<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Reports extends REST_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('Report_model', 'report_model');
    }

    /**
     * Unified Executive Reports Hub (all 4 domains + behavior)
     */
    public function index(): void {
        $student_rep  = $this->report_model->generate_student_report();
        $finance_rep  = $this->report_model->generate_financial_report();
        $att_rep      = $this->report_model->generate_attendance_report();
        $exam_rep     = $this->report_model->generate_exam_report();
        $behavior_rep = $this->report_model->generate_behavior_report();

        $this->response([
            'student_report'    => $student_rep,
            'financial_report'  => $finance_rep,
            'attendance_report' => $att_rep,
            'exam_report'       => $exam_rep,
            'behavior_report'   => $behavior_rep,
            'generated_at'      => date('Y-m-d H:i:s'),
        ]);
    }

    public function student(): void {
        $this->response($this->report_model->generate_student_report());
    }

    public function finance(): void {
        $this->response($this->report_model->generate_financial_report());
    }

    public function attendance(): void {
        $this->response($this->report_model->generate_attendance_report());
    }

    public function exams(): void {
        $this->response($this->report_model->generate_exam_report());
    }

    public function behavior(): void {
        $this->response($this->report_model->generate_behavior_report());
    }

    /**
     * Store student behavioral record into student_notes table
     */
    public function store_behavior(): void {
        $student_id = (int)$this->input->post('student_id');
        $student_name = trim($this->input->post('student_name') ?? '');
        $title = trim($this->input->post('title') ?? $this->input->post('note') ?? '');
        $type = trim($this->input->post('type') ?? 'Merit');

        if (!$student_id && $student_name) {
            // Find student by name
            $parts = explode(' ', $student_name);
            $first = $parts[0];
            $match = $this->db->like('first_name', $first)->get('students')->row_array();
            if ($match) {
                $student_id = (int)$match['id'];
            }
        }

        if (!$student_id) {
            // Fallback to first student if not provided
            $first_student = $this->db->order_by('id', 'ASC')->get('students', 1)->row_array();
            $student_id = $first_student ? (int)$first_student['id'] : 1;
        }

        if (!$title) {
            $this->error('Observation title or note is required', 400);
            return;
        }

        $user_id = 1;
        if (isset($this->session) && is_object($this->session)) {
            $user_id = $this->session->userdata('user_id') ?: 1;
        }

        $insert_data = [
            'student_id' => $student_id,
            'note'       => $title,
            'type'       => $type,
            'added_by'   => $user_id,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        $this->db->insert('student_notes', $insert_data);
        $insert_id = $this->db->insert_id();

        $this->success([
            'id'         => $insert_id,
            'student_id' => $student_id,
            'note'       => $title,
            'type'       => $type,
            'created_at' => $insert_data['created_at'],
        ], 'Behavior record successfully logged to database', 201);
    }
}
