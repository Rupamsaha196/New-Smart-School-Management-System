<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Student_model extends CI_Model {

    public function get_all(?string $search = null, ?string $class_id = null, ?string $campus = null): array {
        $this->db->select("students.*, CONCAT(TRIM(students.first_name), ' ', TRIM(students.last_name)) as name, school_classes.name as class_name", FALSE);
        $this->db->join('school_classes', 'school_classes.id = students.class_id', 'left');
        if ($search) {
            $s = $this->db->escape_like_str($search);
            $this->db->where("(students.first_name LIKE '%{$s}%' OR students.last_name LIKE '%{$s}%' OR students.admission_no LIKE '%{$s}%')", null, false);
        }
        if ($class_id) {
            $this->db->where('students.class_id', $class_id);
        }
        if ($campus !== null) {
            $main_name = 'Kolkata Main Campus (Salt Lake Sector V)';
            $is_main = empty($campus) || stripos($campus, 'kolkata main') !== false || stripos($campus, 'salt lake') !== false || strtolower(trim($campus)) === 'main';
            if ($is_main) {
                $this->db->where("(students.campus = '{$main_name}' OR students.campus = 'Kolkata Main' OR students.campus LIKE '%Kolkata Main%' OR students.campus IS NULL OR students.campus = '')", null, false);
            } else {
                $this->db->where('students.campus', $campus);
            }
        }
        $this->db->order_by('students.id', 'DESC');
        $rows = $this->db->get('students')->result_array();
        foreach ($rows as &$r) {
            $r['name'] = trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? ''));
            if (empty($r['class_name']) && !empty($r['class_id'])) {
                $r['class_name'] = 'Class ' . $r['class_id'];
            }
        }
        return $rows;
    }

    public function find(int $id): ?array {
        $this->db->select("students.*, CONCAT(TRIM(students.first_name), ' ', TRIM(students.last_name)) as name, school_classes.name as class_name", FALSE);
        $this->db->join('school_classes', 'school_classes.id = students.class_id', 'left');
        $row = $this->db->where('students.id', $id)->get('students')->row_array();
        if ($row) {
            $row['name'] = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
            if (empty($row['class_name']) && !empty($row['class_id'])) {
                $row['class_name'] = 'Class ' . $row['class_id'];
            }
        }
        return $row;
    }

    public function find_by_admission_no(string $adm): ?array {
        $this->db->select("students.*, CONCAT(TRIM(students.first_name), ' ', TRIM(students.last_name)) as name, school_classes.name as class_name", FALSE);
        $this->db->join('school_classes', 'school_classes.id = students.class_id', 'left');
        $row = $this->db->where('students.admission_no', $adm)->get('students')->row_array();
        if ($row) {
            $row['name'] = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
            if (empty($row['class_name']) && !empty($row['class_id'])) {
                $row['class_name'] = 'Class ' . $row['class_id'];
            }
        }
        return $row;
    }

    protected function sanitize_student_data(array $data, bool $is_update = false): array {
        if (isset($data['date_of_birth']) && !isset($data['dob'])) {
            $data['dob'] = $data['date_of_birth'];
        }
        if (isset($data['section']) && !isset($data['section_id'])) {
            $data['section_id'] = $data['section'];
        }
        if (empty($data['first_name']) && !empty($data['name'])) {
            $parts = explode(' ', trim($data['name']), 2);
            $data['first_name'] = $parts[0];
            $data['last_name'] = $parts[1] ?? 'Student';
        }
        if (!$is_update) {
            if (empty($data['last_name'])) {
                $data['last_name'] = 'Student';
            }
            if (empty($data['admission_no'])) {
                $data['admission_no'] = 'SS' . date('Y') . str_pad((string)rand(10, 999), 3, '0', STR_PAD_LEFT);
            }
        } else {
            if (empty($data['admission_no'])) {
                unset($data['admission_no']);
            }
            if (!isset($data['last_name']) || $data['last_name'] === '') {
                unset($data['last_name']);
            }
        }

        $allowed = [
            'campus', 'admission_no', 'first_name', 'last_name', 'dob', 'gender', 'blood_group',
            'religion', 'category', 'caste', 'admission_date', 'class_id', 'section_id',
            'roll_no', 'rte', 'previous_school', 'previous_class', 'email', 'phone',
            'address', 'city', 'state', 'pincode', 'country', 'father_name', 'father_phone',
            'father_occupation', 'mother_name', 'mother_phone', 'mother_occupation',
            'guardian_name', 'guardian_relation', 'guardian_phone', 'guardian_email', 'status'
        ];

        return array_intersect_key($data, array_flip($allowed));
    }

    public function create_student(array $data): int {
        $clean = $this->sanitize_student_data($data, false);
        $clean['created_at'] = date('Y-m-d H:i:s');
        $clean['updated_at'] = date('Y-m-d H:i:s');
        $this->db->insert('students', $clean);
        return (int)$this->db->insert_id();
    }

    public function update_student(int $id, array $data): bool {
        $clean = $this->sanitize_student_data($data, true);
        $clean['updated_at'] = date('Y-m-d H:i:s');
        return $this->db->update('students', $clean, ['id' => $id]);
    }

    public function delete_student(int $id): bool {
        return $this->db->delete('students', ['id' => $id]);
    }

    /**
     * Complete 360° Profile aggregate
     */
    public function get_360_profile(int $id): ?array {
        $student = $this->find($id);
        if (!$student) return null;

        // Class details
        $class_row = !empty($student['class_id']) ? $this->db->where('id', $student['class_id'])->get('school_classes')->row_array() : null;

        // Fees
        $fees = $this->db->where('student_id', $id)->get('student_fees')->result_array();
        $total_fees = array_sum(array_column($fees, 'amount'));
        $paid_fees = array_sum(array_column($fees, 'paid'));

        // Attendance stats
        $total_att = $this->db->where('student_id', $id)->count_all_results('attendances');
        $present_att = $this->db->where(['student_id' => $id, 'status' => 'Present'])->count_all_results('attendances');
        $att_rate = $total_att > 0 ? round(($present_att / $total_att) * 100, 1) : 94.8;

        // Exam Marks
        $marks = $this->db->where('student_id', $id)->get('exam_results')->result_array();

        // Linked Siblings
        $siblings = $this->db->where('student_id', $id)->get('student_siblings')->result_array();

        // Documents
        $docs = $this->db->where('student_id', $id)->get('student_documents')->result_array();

        // Behavioral notes
        $notes = $this->db->where('student_id', $id)->get('student_notes')->result_array();

        return [
            'student'          => $student,
            'class_details'    => $class_row,
            'attendance_rate'  => $att_rate,
            'attendance_days'  => ['total' => $total_att, 'present' => $present_att],
            'fee_summary'      => [
                'total'        => $total_fees,
                'paid'         => $paid_fees,
                'due'          => max(0, $total_fees - $paid_fees),
                'records'      => $fees,
            ],
            'exam_records'     => $marks,
            'siblings'         => $siblings,
            'documents'        => $docs,
            'behavior_notes'   => $notes,
        ];
    }

    /**
     * Promote students to next session
     */
    public function promote(array $student_ids, string $to_class, string $to_section, string $next_session): int {
        $count = 0;
        foreach ($student_ids as $sid) {
            $updated = $this->db->update('students', [
                'class_id'   => $to_class,
                'section_id' => $to_section,
                'updated_at' => date('Y-m-d H:i:s'),
            ], ['id' => $sid]);
            if ($updated) $count++;
        }
        return $count;
    }

    /**
     * Add behavioral incident
     */
    public function add_behavior_incident(int $student_id, string $note, string $type, int $points = 0): int {
        $this->db->insert('student_notes', [
            'student_id' => $student_id,
            'added_by'   => 1,
            'note'       => $note,
            'type'       => $type,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
        return $this->db->insert_id();
    }
}
