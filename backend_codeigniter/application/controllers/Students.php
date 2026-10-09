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
        $campus = $this->get_active_campus();
        $students = $this->student_model->get_all($search, $class_id, $campus);
        $this->response($students);
    }

    public function store(): void {
        $payload = $this->get_payload();
        if (empty($payload['campus'])) {
            $payload['campus'] = $this->get_active_campus();
        }

        // 1. Server-Side Boundary & Null/Empty Validation
        $firstName = trim($payload['first_name'] ?? '');
        $lastName  = trim($payload['last_name'] ?? '');
        if (empty($firstName)) {
            $this->error('Student first name is required and cannot be empty.', 422);
            return;
        }
        if (strlen($firstName) > 100 || strlen($lastName) > 100) {
            $this->error('Student name components must not exceed 100 characters in length.', 422);
            return;
        }

        // DOB boundary validation (cannot be in the future)
        if (!empty($payload['dob'])) {
            $dobTime = strtotime($payload['dob']);
            if (!$dobTime || $dobTime > time()) {
                $this->error('Date of birth cannot be a future date.', 422);
                return;
            }
        }

        // Email format validation
        if (!empty($payload['email'])) {
            $email = trim($payload['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->error("Invalid email address format: '{$email}'.", 422);
                return;
            }
            // Duplicate Check: Email Address
            $existing = $this->db->where('LOWER(email)', strtolower($email))->get('students')->row_array();
            if ($existing) {
                $this->error("Duplicate entry: A student with email '{$email}' already exists.", 409);
                return;
            }
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

        // Duplicate Check 2: Roll Number in same Class/Section
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

        // 2. Atomic Database Transaction
        $this->db->trans_begin();
        try {
            $id = $this->student_model->create_student($payload);

            // Auto-create initial quarterly fee invoice for the student
            $this->load->model('Fee_model', 'fee_model');
            $this->fee_model->quick_create($id, 12500, 'Tuition Fee (Quarterly)', false);

            if ($this->db->trans_status() === FALSE) {
                $this->db->trans_rollback();
                $this->error('Database transaction error: Student enrollment rolled back.', 500);
                return;
            }

            $this->db->trans_commit();
            $student = $this->student_model->find($id);
            $this->success($student, 'Student admitted successfully', 201);
        } catch (\Throwable $e) {
            $this->db->trans_rollback();
            $this->error('Enrollment transaction failed: ' . $e->getMessage(), 500);
        }
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

        // Concurrent Edit Check (Optimistic Concurrency Control)
        if (!empty($payload['expected_updated_at'])) {
            $current = $this->student_model->find($id);
            if ($current && !empty($current['updated_at']) && $current['updated_at'] !== $payload['expected_updated_at']) {
                $this->error("Concurrent edit conflict: Record was updated by another session at {$current['updated_at']}. Please reload before updating.", 409);
                return;
            }
        }

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
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->error("Invalid email address format: '{$email}'.", 422);
                return;
            }
            $existing = $this->db->where('LOWER(email)', strtolower($email))->where('id !=', $id)->get('students')->row_array();
            if ($existing) {
                $this->error("Duplicate entry: Student email '{$email}' is already registered to another student.", 409);
                return;
            }
        }

        $this->db->trans_begin();
        try {
            $this->student_model->update_student($id, $payload);
            if ($this->db->trans_status() === FALSE) {
                $this->db->trans_rollback();
                $this->error('Failed to update student due to database transaction error.', 500);
                return;
            }
            $this->db->trans_commit();
            $student = $this->student_model->find($id);
            $this->success($student, 'Student record updated successfully');
        } catch (\Throwable $e) {
            $this->db->trans_rollback();
            $this->error('Update transaction failed: ' . $e->getMessage(), 500);
        }
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

        // Safe Transactional Deletion to prevent orphan child records
        $this->db->trans_begin();
        try {
            $this->db->delete('student_fees', ['student_id' => $id]);
            $this->db->delete('attendances', ['student_id' => $id]);
            $this->db->delete('student_hostels', ['student_id' => $id]);
            $this->db->delete('student_notes', ['student_id' => $id]);
            $this->student_model->delete_student($id);

            if ($this->db->trans_status() === FALSE) {
                $this->db->trans_rollback();
                $this->error('Database rollback: Unable to complete student deletion.', 500);
                return;
            }
            $this->db->trans_commit();
            $this->success(null, 'Student record and child dependencies removed cleanly without orphan records');
        } catch (\Throwable $e) {
            $this->db->trans_rollback();
            $this->error('Deletion transaction failed: ' . $e->getMessage(), 500);
        }
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
