<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Exams extends REST_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('Exam_model', 'exam_model');
    }

    public function index(): void {
        $campus = $this->get_active_campus();
        $exams = $this->exam_model->get_exams($campus);
        $this->response($exams);
    }

    public function store(): void {
        $payload = $this->get_payload();
        $name = $payload['name'] ?? $this->input->post('name');
        if (!$name) {
            $this->error('Exam name is required', 400);
            return;
        }
        $data = $payload ?: $this->input->post();
        if (empty($data['campus'])) {
            $data['campus'] = $this->get_active_campus();
        }
        $id = $this->exam_model->create_exam($data);
        $this->success(['id' => $id], 'Exam scheduled successfully', 201);
    }

    public function schedules(int $exam_id): void {
        $schedules = $this->exam_model->get_schedules($exam_id);
        $this->response($schedules);
    }

    public function marks(int $exam_id): void {
        $class_id = $this->input->get('class_id');
        $marks = $this->exam_model->get_marks($exam_id, $class_id ? (int)$class_id : null);
        $this->response($marks);
    }

    public function bulk_marks(int $exam_id): void {
        $payload = $this->get_payload();
        $marks_data = !empty($payload['marks']) ? $payload['marks'] : ($this->input->post('marks') ?: []);
        $exam = $this->exam_model->find($exam_id);
        $exam_name = $exam['name'] ?? 'Unit Test 1';
        $count = 0;
        foreach ($marks_data as $m) {
            $student_id   = $m['student_id'] ?? 1;
            $subject_name = $m['subject'] ?? ($m['subject_name'] ?? 'General');
            $marks_val    = floatval($m['marks'] ?? 85);
            $total_val    = intval($m['total'] ?? 100);
            $grade        = $m['grade'] ?? $this->exam_model->calculate_grade(($marks_val / ($total_val ?: 100)) * 100);

            $existing = $this->db->where([
                'student_id' => $student_id,
                'exam'       => $exam_name,
                'subject'    => $subject_name,
            ])->get('exam_results')->row_array();

            if ($existing) {
                $this->db->update('exam_results', [
                    'marks'      => (int)$marks_val,
                    'total'      => $total_val,
                    'grade'      => $grade,
                    'status'     => $marks_val >= 33 ? 'Pass' : 'Fail',
                    'updated_at' => date('Y-m-d H:i:s'),
                ], ['id' => $existing['id']]);
            } else {
                $this->db->insert('exam_results', [
                    'student_id' => $student_id,
                    'exam'       => $exam_name,
                    'subject'    => $subject_name,
                    'marks'      => (int)$marks_val,
                    'total'      => $total_val,
                    'grade'      => $grade,
                    'status'     => $marks_val >= 33 ? 'Pass' : 'Fail',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            }
            $count++;
        }
        $this->success(['entered_records' => $count], 'Marks register updated');
    }

    public function admit_card(int $exam_id): void {
        $student_id = (int)($this->input->get('student_id') ?: 1);
        $card = $this->exam_model->generate_admit_card($exam_id, $student_id);
        if (!$card) {
            $this->error('Unable to generate admit card: record not found', 404);
            return;
        }
        $this->response($card);
    }
}
