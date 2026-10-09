<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Academics_model extends CI_Model {

    public function get_classes(?string $campus = null): array {
        if ($campus !== null) {
            $main_name = 'Kolkata Main Campus (Salt Lake Sector V)';
            $is_main = empty($campus) || stripos($campus, 'kolkata main') !== false || stripos($campus, 'salt lake') !== false || strtolower(trim($campus)) === 'main';
            if ($is_main) {
                $this->db->where("(campus = '{$main_name}' OR campus = 'Kolkata Main' OR campus LIKE '%Kolkata Main%' OR campus IS NULL OR campus = '')", null, false);
            } else {
                $this->db->where('campus', $campus);
            }
        }
        $classes = $this->db->order_by('id', 'ASC')->get('school_classes')->result_array();
        foreach ($classes as &$c) {
            $this->db->where('class_id', $c['id']);
            if ($campus !== null) {
                if ($is_main) {
                    $this->db->where("(campus = '{$main_name}' OR campus = 'Kolkata Main' OR campus IS NULL OR campus = '')", null, false);
                } else {
                    $this->db->where('campus', $campus);
                }
            }
            $c['students_count'] = $this->db->count_all_results('students');
            $c['section'] = $c['sections'] ?? 'A, B';
        }
        return $classes;
    }

    public function get_subjects(): array {
        return $this->db->get('subjects')->result_array();
    }

    public function get_timetables(?int $class_id = null): array {
        if ($class_id) {
            $this->db->where('class_id', $class_id);
        }
        return $this->db->get('timetables')->result_array();
    }

    public function get_sessions(): array {
        return $this->db->get('academic_sessions')->result_array();
    }

    public function get_active_session(): ?array {
        return $this->db->where('is_active', 1)->get('academic_sessions')->row_array();
    }

    public function activate_session(int $id): bool {
        $this->db->update('academic_sessions', ['is_active' => 0]);
        return $this->db->update('academic_sessions', ['is_active' => 1], ['id' => $id]);
    }

    public function get_downloads(?string $class_name = null): array {
        if ($class_name && $class_name !== 'All') {
            $this->db->where('class_name', $class_name);
        }
        return $this->db->order_by('id', 'DESC')->get('download_materials')->result_array();
    }

    public function create_download(array $data): int {
        $slug = preg_replace('/[^a-zA-Z0-9_-]/', '_', strtolower($data['title'] ?? 'doc'));
        $clean = [
            'title'       => $data['title'] ?? 'Academic Resource',
            'type'        => $data['type'] ?? ($data['category'] ?? 'Study Material'),
            'class_name'  => $data['class_name'] ?? ($data['classes'] ?? 'All Classes'),
            'file_path'   => $data['file_path'] ?? ('/uploads/documents/' . $slug . '.pdf'),
            'file_size'   => $data['file_size'] ?? ($data['size'] ?? '2.4 MB'),
            'description' => $data['description'] ?? 'Curriculum download resource',
            'created_at'  => date('Y-m-d H:i:s'),
            'updated_at'  => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('download_materials', $clean);
        return $this->db->insert_id();
    }

    public function delete_download(int $id): bool {
        return $this->db->delete('download_materials', ['id' => $id]);
    }

    public function get_live_classes(): array {
        return $this->db->order_by('id', 'DESC')->get('live_classes')->result_array();
    }

    public function create_live_class(array $data): int {
        $clean = [
            'title'        => $data['title'] ?? 'Virtual Live Session',
            'subject'      => $data['subject'] ?? 'General',
            'class_name'   => $data['class_name'] ?? ($data['class'] ?? 'Class 10-A'),
            'date'         => !empty($data['date']) ? date('Y-m-d', strtotime($data['date'])) : date('Y-m-d'),
            'time'         => $data['time'] ?? '10:00 AM - 11:00 AM',
            'platform'     => $data['platform'] ?? 'Google Meet',
            'link'         => $data['link'] ?? 'https://meet.google.com/new',
            'status'       => $data['status'] ?? 'upcoming',
            'teacher_name' => $data['teacher_name'] ?? ($data['teacher'] ?? 'Assigned Instructor'),
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('live_classes', $clean);
        return $this->db->insert_id();
    }

    public function delete_live_class(int $id): bool {
        return $this->db->delete('live_classes', ['id' => $id]);
    }

    public function create_timetable(array $data): int {
        $subject_id = !empty($data['subject_id']) ? (int)$data['subject_id'] : 1;
        $clean = [
            'class_id'     => (int)($data['class_id'] ?? 1),
            'section'      => $data['section'] ?? 'A',
            'day'          => $data['day'] ?? 'Monday',
            'start_time'   => $data['start_time'] ?? '09:00:00',
            'end_time'     => $data['end_time'] ?? '09:45:00',
            'subject_id'   => $subject_id,
            'teacher_name' => $data['teacher_name'] ?? 'Faculty Member',
            'room'         => $data['room'] ?? 'Room 201',
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('timetables', $clean);
        return $this->db->insert_id();
    }

    public function delete_timetable(int $id): bool {
        return $this->db->delete('timetables', ['id' => $id]);
    }

    public function delete_subject(int $id): bool {
        return $this->db->delete('subjects', ['id' => $id]);
    }
}
