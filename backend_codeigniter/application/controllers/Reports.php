<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Reports extends REST_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('Report_model', 'report_model');
    }

    public function index(): void {
        $student_rep = $this->report_model->generate_student_report();
        $finance_rep = $this->report_model->generate_financial_report();
        $att_rep     = $this->report_model->generate_attendance_report();
        $exam_rep    = $this->report_model->generate_exam_report();

        $this->response([
            'student_report'    => $student_rep,
            'financial_report'  => $finance_rep,
            'attendance_report' => $att_rep,
            'exam_report'       => $exam_rep,
            'generated_at'      => date('Y-m-d H:i:s'),
        ]);
    }
}
