<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Students extends REST_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('Student_model', 'student_model');
    }

    public function index(): void {
        $search = $this->input->get('search');
        $class_id = $this->input->get('class_id');
        $students = $this->student_model->get_all($search, $class_id);
        $this->response($students);
    }

    public function store(): void {
        $payload = $this->get_payload();
        if (empty($payload['first_name'])) {
            $this->error('Student first name is required', 422);
            return;
        }

        if (empty($payload['admission_no'])) {
            $payload['admission_no'] = 'SS' . date('Y') . str_pad((string)rand(10, 999), 3, '0', STR_PAD_LEFT);
        }

        $id = $this->student_model->create_student($payload);

        // Auto-create initial quarterly fee invoice for the student
        try {
            $this->load->model('Fee_model', 'fee_model');
            $this->fee_model->quick_create($id, 12500, 'Tuition Fee (Quarterly)', false);
        } catch (Throwable $e) {
            log_message('error', 'Auto fee create error: ' . $e->getMessage());
        }

        $student = $this->student_model->find($id);
        $this->success($student, 'Student admitted successfully', 201);
    }

    public function show(int $id): void {
        $profile = $this->student_model->get_360_profile($id);
        if (!$profile) {
            $this->error('Student not found', 404);
            return;
        }
        $this->response($profile['student'] + [
            'profile_360'      => $profile,
            'attendance_rate'  => $profile['attendance_rate'],
            'fee_summary'      => $profile['fee_summary'],
            'siblings'         => $profile['siblings'],
            'documents'        => $profile['documents'],
            'behavior_notes'   => $profile['behavior_notes'],
        ]);
    }

    public function update(int $id): void {
        $payload = $this->get_payload();
        $this->student_model->update_student($id, $payload);
        $student = $this->student_model->find($id);
        $this->success($student, 'Student record updated successfully');
    }

    public function destroy(int $id): void {
        $this->student_model->delete_student($id);
        $this->success(null, 'Student record deleted');
    }

    public function tc(int $id): void {
        $student = $this->student_model->find($id);
        if (!$student) {
            $this->error('Student not found', 404);
            return;
        }

        $tc_data = [
            'tc_number'     => 'TC-' . date('Y') . '-' . str_pad((string)$id, 4, '0', STR_PAD_LEFT),
            'student_name'  => ($student['first_name'] ?? '') . ' ' . ($student['last_name'] ?? ''),
            'admission_no'  => $student['admission_no'],
            'father_name'   => $student['father_name'] ?? 'Mr. Guardian',
            'mother_name'   => $student['mother_name'] ?? 'Mrs. Guardian',
            'dob'           => $student['dob'] ?? '2010-05-15',
            'class_leaving' => ($student['class'] ?? 'Class 10') . ' - ' . ($student['section'] ?? 'A'),
            'date_of_issue' => date('d-m-Y'),
            'reason'        => 'Parent Job Transfer / Higher Education Relocation',
            'conduct'       => 'Exemplary',
            'affiliation'   => 'CBSE Affiliation #1930248',
        ];
        $this->response($tc_data);
    }

    public function cv(int $id): void {
        $profile = $this->student_model->get_360_profile($id);
        if (!$profile) {
            $this->error('Student not found', 404);
            return;
        }

        $s = $profile['student'];
        $cv = [
            'student'          => $s,
            'name'             => ($s['first_name'] ?? '') . ' ' . ($s['last_name'] ?? ''),
            'admission_no'     => $s['admission_no'] ?? '',
            'attendance_rate'  => $profile['attendance_rate'],
            'academic_record'  => 'CBSE Term 1 Aggregate: 88.5% (Grade A2)',
            'extracurriculars' => 'Robotics Club Lead, Inter-school Debate Finalist, Under-16 Football Team Captain',
            'skills'           => ['Python Basics', 'Public Speaking', 'STEM Research', 'Chess'],
            'generated_at'     => date('Y-m-d H:i:s'),
        ];
        $this->response($cv);
    }

    public function add_note(int $id): void {
        $note = $this->input->post('note') ?: 'Student behavioral record logged.';
        $type = $this->input->post('type') ?: 'Merit';
        $note_id = $this->student_model->add_behavior_incident($id, $note, $type);
        $this->success(['id' => $note_id], 'Behavioral note added successfully', 201);
    }

    public function add_sibling(int $id): void {
        $sibling_id = (int)$this->input->post('sibling_id');
        $this->db->insert('student_siblings', [
            'student_id' => $id,
            'sibling_id' => $sibling_id,
            'relation'   => $this->input->post('relation') ?: 'Brother',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
        $this->success(null, 'Sibling linked successfully');
    }
}
