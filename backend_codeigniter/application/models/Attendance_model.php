<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Attendance_model extends CI_Model {

    public function daily_stats(?string $date = null, ?string $campus = null): array {
        $target_date = $date ?: date('Y-m-d');
        if ($campus !== null) {
            $main_name = 'Kolkata Main Campus (Salt Lake Sector V)';
            $is_main = empty($campus) || stripos($campus, 'kolkata main') !== false || stripos($campus, 'salt lake') !== false || strtolower(trim($campus)) === 'main';
            if ($is_main) {
                $this->db->where("(campus = '{$main_name}' OR campus = 'Kolkata Main' OR campus LIKE '%Kolkata Main%' OR campus IS NULL OR campus = '')", null, false);
            } else {
                $this->db->where('campus', $campus);
            }
        }
        $records = $this->db->where('date', $target_date)->get('attendances')->result_array();

        if ($campus !== null) {
            if ($is_main) {
                $this->db->where("(campus = '{$main_name}' OR campus = 'Kolkata Main' OR campus LIKE '%Kolkata Main%' OR campus IS NULL OR campus = '')", null, false);
            } else {
                $this->db->where('campus', $campus);
            }
        }
        $total_students = $this->db->count_all_results('students');
        $present = count(array_filter($records, fn($r) => in_array($r['status'] ?? '', ['Present', 'Late'])));
        $absent  = count(array_filter($records, fn($r) => ($r['status'] ?? '') === 'Absent'));

        return [
            'date'     => $target_date,
            'total'    => $total_students,
            'present'  => $present,
            'absent'   => $absent,
            'rate'     => $total_students > 0 ? round(($present / $total_students) * 100, 1) : 0,
        ];
    }

    public function bulk_mark(string $date, array $records, $class_id = null, ?string $campus = null): int {
        $count = 0;
        $campus_val = $campus ?: 'Kolkata Main Campus (Salt Lake Sector V)';
        $allowed_statuses = ['Present', 'Absent', 'Late', 'Half Day', 'Holiday'];

        foreach ($records as $r) {
            $student_id = !empty($r['student_id']) ? (int)$r['student_id'] : null;
            if (!$student_id) continue;

            // Verify student exists in MySQL students table to satisfy foreign key constraint
            $st = $this->db->where('id', $student_id)->get('students')->row_array();
            if (!$st) {
                continue;
            }

            $raw_status = trim($r['status'] ?? 'Present');
            $status = in_array($raw_status, $allowed_statuses) ? $raw_status : 'Present';

            // Resolve valid integer class_id or null
            $resolved_class_id = null;
            if (!empty($class_id) && is_numeric($class_id) && (int)$class_id > 0) {
                $resolved_class_id = (int)$class_id;
            } elseif (!empty($st['class_id']) && is_numeric($st['class_id']) && (int)$st['class_id'] > 0) {
                $resolved_class_id = (int)$st['class_id'];
            }

            $existing = $this->db->where(['student_id' => $student_id, 'date' => $date])->get('attendances')->row_array();

            if ($existing) {
                $this->db->update('attendances', [
                    'status'     => $status,
                    'remark'     => $r['remark'] ?? null,
                    'campus'     => $campus_val,
                    'updated_at' => date('Y-m-d H:i:s'),
                ], ['id' => $existing['id']]);
            } else {
                $this->db->insert('attendances', [
                    'student_id' => $student_id,
                    'class_id'   => $resolved_class_id,
                    'date'       => $date,
                    'status'     => $status,
                    'remark'     => $r['remark'] ?? null,
                    'campus'     => $campus_val,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            }
            $count++;
        }
        return $count;
    }

    public function log_qr_scan(string $identifier, string $status, string $scan_type, ?int $student_id = null): int {
        $name = 'Identifier ' . $identifier;
        if ($student_id) {
            $st = $this->db->where('id', $student_id)->get('students')->row_array();
            if ($st) {
                $name = trim(($st['first_name'] ?? '') . ' ' . ($st['last_name'] ?? '')) ?: $name;
            }
        }
        $person_type = (stripos($scan_type, 'staff') !== false) ? 'Staff' : 'Student';

        $this->db->insert('qr_attendance_logs', [
            'name'        => $name,
            'identifier'  => $identifier,
            'person_type' => $person_type,
            'status'      => $status,
            'scanned_at'  => date('Y-m-d H:i:s'),
            'created_at'  => date('Y-m-d H:i:s'),
            'updated_at'  => date('Y-m-d H:i:s'),
        ]);
        return $this->db->insert_id();
    }
}
