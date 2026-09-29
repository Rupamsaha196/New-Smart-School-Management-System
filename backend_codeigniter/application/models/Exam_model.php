<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Exam_model extends CI_Model {

    public function get_exams(): array {
        return $this->db->get('exams')->result_array();
    }

    public function create_exam(array $data): int {
        $this->db->insert('exams', [
            'name'        => $data['name'] ?? 'Term Exam',
            'term'        => $data['term'] ?? 'Term 1',
            'session'     => $data['session'] ?? '2025-26',
            'start_date'  => $data['start_date'] ?? date('Y-m-d'),
            'end_date'    => $data['end_date'] ?? date('Y-m-d', strtotime('+7 days')),
            'status'      => $data['status'] ?? 'Scheduled',
            'created_at'  => date('Y-m-d H:i:s'),
            'updated_at'  => date('Y-m-d H:i:s'),
        ]);
        return $this->db->insert_id();
    }

    public function find(int $id): ?array {
        return $this->db->where('id', $id)->get('exams')->row_array();
    }

    public function get_schedules(int $exam_id): array {
        return $this->db->where('exam_id', $exam_id)->get('exam_schedules')->result_array();
    }

    public function get_marks(int $exam_id, ?int $class_id = null): array {
        $exam = $this->find($exam_id);
        if ($exam) {
            $this->db->where('exam', $exam['name']);
        }
        if ($class_id) {
            $students = $this->db->where('class_id', $class_id)->get('students')->result_array();
            $sids = array_column($students, 'id');
            if (!empty($sids)) {
                $this->db->where_in('student_id', $sids);
            }
        }
        return $this->db->get('exam_results')->result_array();
    }

    public function calculate_grade(float $pct): string {
        if ($pct >= 91) return 'A1';
        if ($pct >= 81) return 'A2';
        if ($pct >= 71) return 'B1';
        if ($pct >= 61) return 'B2';
        if ($pct >= 51) return 'C1';
        if ($pct >= 41) return 'C2';
        if ($pct >= 33) return 'D';
        return 'E';
    }

    public function generate_admit_card(int $exam_id, int $student_id): ?array {
        $exam = $this->find($exam_id);
        $student = $this->db->where('id', $student_id)->get('students')->row_array();
        if (!$exam || !$student) return null;

        $schedules = $this->get_schedules($exam_id);
        return [
            'exam'          => $exam,
            'student'       => $student,
            'roll_number'   => $student['roll_no'] ?? '101',
            'admission_no'  => $student['admission_no'],
            'class_section' => ($student['class'] ?? 'Class 10') . ' - ' . ($student['section'] ?? 'A'),
            'schedules'     => $schedules,
            'exam_center'   => 'Smart School Main Campus, Exam Hall 3',
        ];
    }
}
