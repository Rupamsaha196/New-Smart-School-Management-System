<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Academics extends REST_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('Academics_model', 'academics_model');
        $this->load->model('Student_model', 'student_model');
    }

    public function classes(): void {
        $campus = $this->get_active_campus();
        $classes = $this->academics_model->get_classes($campus);
        $this->response($classes);
    }

    public function store_class(): void {
        $p = $this->get_payload();
        $name = trim(!empty($p['name']) ? $p['name'] : ($this->input->post('name') ?: ''));
        if (empty($name)) {
            $this->error('Class name is required', 422);
            return;
        }

        $campus = !empty($p['campus']) ? $p['campus'] : $this->get_active_campus();

        $this->apply_campus_filter('', $campus);
        $existing = $this->db->where('LOWER(name)', strtolower($name))->get('school_classes')->row_array();
        if ($existing) {
            $this->error("Duplicate entry: A class with name '{$name}' already exists in this institution.", 409);
            return;
        }

        $teacher = !empty($p['class_teacher']) ? $p['class_teacher'] : ($this->input->post('class_teacher') ?: 'Assigned Faculty');
        $sections = !empty($p['sections']) ? $p['sections'] : (!empty($p['section']) ? $p['section'] : ($this->input->post('sections') ?: ($this->input->post('section') ?: 'A, B')));
        $this->db->insert('school_classes', [
            'name'          => $name,
            'sections'      => $sections,
            'class_teacher' => $teacher,
            'campus'        => $campus,
            'created_at'    => date('Y-m-d H:i:s'),
            'updated_at'    => date('Y-m-d H:i:s'),
        ]);
        $id = $this->db->insert_id();
        $this->success(['id' => $id, 'name' => $name], 'Class created successfully', 201);
    }

    public function destroy_class(int $id): void {
        $this->db->delete('school_classes', ['id' => $id]);
        $this->success(null, 'Class deleted successfully');
    }

    public function subjects(): void {
        $subjects = $this->academics_model->get_subjects();
        $this->response($subjects);
    }

    public function store_subject(): void {
        $p = $this->get_payload();
        $name = trim(!empty($p['name']) ? $p['name'] : ($this->input->post('name') ?: ''));
        $code = trim(!empty($p['code']) ? $p['code'] : ($this->input->post('code') ?: ''));
        $type = !empty($p['type']) ? $p['type'] : ($this->input->post('type') ?: 'Theory');

        if (empty($name)) {
            $this->error('Subject name is required', 422);
            return;
        }

        if (!empty($code)) {
            $existing_code = $this->db->where('LOWER(code)', strtolower($code))->get('subjects')->row_array();
            if ($existing_code) {
                $this->error("Duplicate entry: A subject with code '{$code}' already exists.", 409);
                return;
            }
        }

        $existing_name = $this->db->where('LOWER(name)', strtolower($name))->get('subjects')->row_array();
        if ($existing_name) {
            $this->error("Duplicate entry: A subject with name '{$name}' already exists.", 409);
            return;
        }

        $this->db->insert('subjects', [
            'name'       => $name,
            'code'       => $code,
            'type'       => $type,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
        $id = $this->db->insert_id();
        $this->success(['id' => $id, 'name' => $name, 'code' => $code, 'type' => $type], 'Subject registered successfully', 201);
    }

    public function promote(): void {
        $p = $this->get_payload();
        $student_ids  = !empty($p['student_ids']) ? $p['student_ids'] : ($this->input->post('student_ids') ?: [1]);
        $to_class     = !empty($p['to_class']) ? $p['to_class'] : ($this->input->post('to_class') ?: 'Class 10');
        $to_section   = !empty($p['to_section']) ? $p['to_section'] : ($this->input->post('to_section') ?: 'A');
        $next_session = !empty($p['academic_year']) ? $p['academic_year'] : ($this->input->post('academic_year') ?: '2026-2027');

        $count = $this->student_model->promote($student_ids, $to_class, $to_section, $next_session);
        $this->success(['promoted' => $count], "{$count} students processed for promotion.");
    }

    public function destroy_subject(int $id): void {
        $this->academics_model->delete_subject($id);
        $this->success(null, 'Subject removed successfully');
    }

    public function timetable(): void {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if ($method === 'POST') {
            $this->store_timetable();
            return;
        }
        $class_id = $this->input->get('class_id');
        $timetable = $this->academics_model->get_timetables($class_id ? (int)$class_id : null);
        $this->response($timetable);
    }

    public function store_timetable(): void {
        $user = $this->get_auth_user();
        $role = strtolower($user['role'] ?? '');
        if ($role === 'teacher' || $role === 'student' || $role === 'parent') {
            $this->error('Access denied: Teachers and students do not have permission to modify timetables.', 403);
            return;
        }
        $payload = $this->get_payload();

        $class_id = (int)($payload['class_id'] ?? 1);
        $section = trim($payload['section'] ?? 'A');
        $day = trim($payload['day'] ?? 'Monday');
        $start_time = trim($payload['start_time'] ?? '09:00:00');
        $room = trim($payload['room'] ?? '');

        // Check if class/section already has a subject scheduled in this slot
        $existing_class = $this->db->where([
            'class_id'   => $class_id,
            'section'    => $section,
            'day'        => $day,
            'start_time' => $start_time,
        ])->get('timetables')->row_array();

        if ($existing_class) {
            $this->error("Duplicate timetable slot: Class {$class_id} (Section {$section}) is already scheduled for a class on {$day} at {$start_time}.", 409);
            return;
        }

        // Check if the specified room is already occupied at this day & start_time
        if (!empty($room)) {
            $existing_room = $this->db->where([
                'room'       => $room,
                'day'        => $day,
                'start_time' => $start_time,
            ])->get('timetables')->row_array();

            if ($existing_room) {
                $this->error("Room clash: Room '{$room}' is already booked on {$day} at {$start_time}.", 409);
                return;
            }
        }

        $id = $this->academics_model->create_timetable($payload);
        $this->success(['id' => $id], 'Timetable slot created successfully', 201);
    }

    public function destroy_timetable(int $id): void {
        $user = $this->get_auth_user();
        $role = strtolower($user['role'] ?? '');
        if ($role === 'teacher' || $role === 'student' || $role === 'parent') {
            $this->error('Access denied: Teachers and students do not have permission to delete timetable slots.', 403);
            return;
        }
        $this->academics_model->delete_timetable($id);
        $this->success(null, 'Timetable slot removed');
    }

    public function sessions(): void {
        $sessions = $this->academics_model->get_sessions();
        $this->response($sessions);
    }

    public function store_session(): void {
        $p = $this->get_payload();
        $name = trim(!empty($p['name']) ? $p['name'] : ($this->input->post('name') ?: ''));
        if (empty($name)) {
            $this->error('Academic session name is required', 422);
            return;
        }

        $existing = $this->db->where('LOWER(name)', strtolower($name))->get('academic_sessions')->row_array();
        if ($existing) {
            $this->error("Duplicate entry: An academic session with name '{$name}' already exists.", 409);
            return;
        }

        $start_date = !empty($p['start_date']) ? $p['start_date'] : ($this->input->post('start_date') ?: date('Y-04-01'));
        $end_date = !empty($p['end_date']) ? $p['end_date'] : ($this->input->post('end_date') ?: date('Y-03-31', strtotime('+1 year')));
        $is_active = !empty($p['is_active']) ? 1 : ($this->input->post('is_active') ? 1 : 0);
        if ($is_active) {
            $this->db->update('academic_sessions', ['is_active' => 0]);
        }
        $this->db->insert('academic_sessions', [
            'name'       => $name,
            'start_date' => $start_date,
            'end_date'   => $end_date,
            'is_active'  => $is_active,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
        $id = $this->db->insert_id();
        $this->success(['id' => $id, 'name' => $name], 'Session created successfully', 201);
    }

    public function activate_session(int $id): void {
        $this->academics_model->activate_session($id);
        $this->success(null, 'Academic session activated');
    }

    public function downloads(): void {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if ($method === 'POST') {
            $this->store_download();
            return;
        }
        $class_name = $this->input->get('class_name');
        $materials = $this->academics_model->get_downloads($class_name);
        $this->response($materials);
    }

    public function store_download(): void {
        $payload = $this->get_payload();
        if (empty($payload['title'])) {
            $this->error('Document title is required', 422);
            return;
        }
        $id = $this->academics_model->create_download($payload);
        $this->success(['id' => $id], 'Document uploaded to download center', 201);
    }

    public function destroy_download(int $id): void {
        $this->academics_model->delete_download($id);
        $this->success(null, 'Download resource removed');
    }

    public function live_classes(): void {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if ($method === 'POST') {
            $this->store_live_class();
            return;
        }
        $classes = $this->academics_model->get_live_classes();
        $this->response($classes);
    }

    public function store_live_class(): void {
        $payload = $this->get_payload();
        if (empty($payload['title'])) {
            $this->error('Live session title is required', 422);
            return;
        }
        $id = $this->academics_model->create_live_class($payload);
        $this->success(['id' => $id], 'Live virtual session scheduled', 201);
    }

    public function destroy_live_class(int $id): void {
        $this->academics_model->delete_live_class($id);
        $this->success(null, 'Live class removed');
    }
}
