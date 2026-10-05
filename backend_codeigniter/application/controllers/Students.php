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

        // Duplicate Check 1: Admission Number
        if (!empty($payload['admission_no'])) {
            $adm = trim($payload['admission_no']);
            $existing = $this->student_model->find_by_admission_no($adm);
            if ($existing) {
                $this->error("Duplicate entry: A student with Admission Number '{$adm}' already exists.", 409);
                return;
            }
        } else {
            $payload['admission_no'] = 'SS' . date('Y') . str_pad((string)rand(10, 999), 3, '0', STR_PAD_LEFT);
        }

        // Duplicate Check 2: Email Address
        if (!empty($payload['email'])) {
            $email = trim($payload['email']);
            $existing = $this->db->where('email', $email)->get('students')->row_array();
            if ($existing) {
                $this->error("Duplicate entry: A student with email '{$email}' already exists.", 409);
                return;
            }
        }

        // Duplicate Check 3: Roll Number in same Class/Section
        if (!empty($payload['roll_no']) && !empty($payload['class_id'])) {
            $roll = trim($payload['roll_no']);
            $this->db->where('roll_no', $roll);
            $this->db->where('class_id', $payload['class_id']);
            if (!empty($payload['section'])) {
                $this->db->where('section', $payload['section']);
            }
            $existing = $this->db->get('students')->row_array();
            if ($existing) {
                $sec = $payload['section'] ?? 'A';
                $this->error("Duplicate entry: Roll Number '{$roll}' is already assigned in Class {$payload['class_id']} (Section {$sec}).", 409);
                return;
            }
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
        $user = $this->get_auth_user();
        if ($user) {
            $role = strtolower($user['role'] ?? '');
            if ($role === 'student') {
                $myStudentId = (int)($user['student_id'] ?? ($user['id'] ?? 8));
                if ($myStudentId !== $id) {
                    $this->error("Access denied: You are not authorized to view another student's record.", 403);
                    return;
                }
            } elseif ($role === 'parent') {
                $myChildId = (int)($user['student_id'] ?? ($user['id'] ?? 8));
                if ($myChildId !== $id) {
                    $this->error("Access denied: Parents are only authorized to view their own child's record.", 403);
                    return;
                }
            }
        }

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
        $user = $this->get_auth_user();
        if ($user) {
            $role = strtolower($user['role'] ?? '');
            if ($role === 'student' || $role === 'parent') {
                $this->error('Access denied: Students and parents cannot modify student records.', 403);
                return;
            }
        }

        $payload = $this->get_payload();

        // Check duplicate admission number if changing
        if (!empty($payload['admission_no'])) {
            $adm = trim($payload['admission_no']);
            $existing = $this->db->where('admission_no', $adm)->where('id !=', $id)->get('students')->row_array();
            if ($existing) {
                $this->error("Duplicate entry: Admission Number '{$adm}' is already assigned to another student.", 409);
                return;
            }
        }

        // Check duplicate email if changing
        if (!empty($payload['email'])) {
            $email = trim($payload['email']);
            $existing = $this->db->where('email', $email)->where('id !=', $id)->get('students')->row_array();
            if ($existing) {
                $this->error("Duplicate entry: Student email '{$email}' is already registered to another student.", 409);
                return;
            }
        }

        $this->student_model->update_student($id, $payload);
        $student = $this->student_model->find($id);
        $this->success($student, 'Student record updated successfully');
    }

    public function destroy(int $id): void {
        $user = $this->get_auth_user();
        if ($user) {
            $role = strtolower($user['role'] ?? '');
            if ($role !== 'super_admin' && $role !== 'admin') {
                $this->error('Access denied: Only administrators can delete student records.', 403);
                return;
            }
        }
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
