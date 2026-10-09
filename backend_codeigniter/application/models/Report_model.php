<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Report_model extends CI_Model {

    /**
     * Map class_id to standard class name
     */
    private function get_class_name(string $class_id, array $classes_map): string {
        if (isset($classes_map[$class_id])) {
            return $classes_map[$class_id];
        }
        if (is_numeric($class_id) && isset($classes_map[(int)$class_id])) {
            return $classes_map[(int)$class_id];
        }
        return $class_id ?: 'Class 10';
    }

    private function apply_campus(?string $campus): void {
        if ($campus !== null) {
            $main_name = 'Kolkata Main Campus (Salt Lake Sector V)';
            $is_main = empty($campus) || stripos($campus, 'kolkata main') !== false || stripos($campus, 'salt lake') !== false || strtolower(trim($campus)) === 'main';
            if ($is_main) {
                $this->db->where("(campus = '{$main_name}' OR campus = 'Kolkata Main' OR campus LIKE '%Kolkata Main%' OR campus IS NULL OR campus = '')", null, false);
            } else {
                $this->db->where('campus', $campus);
            }
        }
    }

    /**
     * 1. Student Information Report: Real day-to-day student records and demographic breakdown
     */
    public function generate_student_report(?string $campus = null): array {
        $this->apply_campus($campus);
        $classes = $this->db->get('school_classes')->result_array();
        $classes_map = [];
        foreach ($classes as $c) {
            $classes_map[$c['id']] = $c['name'];
        }

        $this->apply_campus($campus);
        $students = $this->db->order_by('id', 'ASC')->get('students')->result_array();
        $total = count($students);

        $rte_count = 0;
        $gender_male = 0;
        $gender_female = 0;
        $gen_count = 0;
        $obc_count = 0;
        $sc_count = 0;

        // Preload student fees for fee_status
        $this->apply_campus($campus);
        $fees = $this->db->get('student_fees')->result_array();
        $fees_by_student = [];
        foreach ($fees as $f) {
            $sid = (int)$f['student_id'];
            if (!isset($fees_by_student[$sid])) {
                $fees_by_student[$sid] = ['amount' => 0, 'paid' => 0];
            }
            $fees_by_student[$sid]['amount'] += floatval($f['amount']);
            $fees_by_student[$sid]['paid'] += floatval($f['paid']);
        }

        // Preload attendances for attendance_pct
        $att = $this->db->get('attendances')->result_array();
        $att_by_student = [];
        foreach ($att as $a) {
            $sid = (int)$a['student_id'];
            if (!isset($att_by_student[$sid])) {
                $att_by_student[$sid] = ['total' => 0, 'present' => 0];
            }
            $att_by_student[$sid]['total']++;
            if ($a['status'] === 'Present') {
                $att_by_student[$sid]['present']++;
            }
        }

        $records = [];
        $class_counts = [];

        foreach ($students as $s) {
            $sid = (int)$s['id'];
            $gender = ucfirst(strtolower($s['gender'] ?? 'Male'));
            if ($gender === 'Female') $gender_female++; else $gender_male++;

            $is_rte = strtolower($s['rte'] ?? '') === 'yes' ? 'Yes' : 'No';
            if ($is_rte === 'Yes') $rte_count++;

            $category = ucfirst(strtolower($s['category'] ?? 'General'));
            if ($category === 'Obc') $obc_count++;
            elseif ($category === 'Sc' || $category === 'St') $sc_count++;
            else $gen_count++;

            $c_name = $this->get_class_name($s['class_id'] ?? '', $classes_map);
            $section = $s['section_id'] ?: 'A';

            if (!isset($class_counts[$c_name])) {
                $class_counts[$c_name] = [
                    'class_name'    => $c_name,
                    'section'       => $section,
                    'total'         => 0,
                    'boys'          => 0,
                    'girls'         => 0,
                    'general'       => 0,
                    'obc'           => 0,
                    'sc_st'         => 0,
                    'rte'           => 0,
                ];
            }
            $class_counts[$c_name]['total']++;
            if ($gender === 'Female') $class_counts[$c_name]['girls']++; else $class_counts[$c_name]['boys']++;
            if ($is_rte === 'Yes') $class_counts[$c_name]['rte']++;
            if ($category === 'Obc') $class_counts[$c_name]['obc']++;
            elseif ($category === 'Sc' || $category === 'St') $class_counts[$c_name]['sc_st']++;
            else $class_counts[$c_name]['general']++;

            // Fee status
            $f_info = $fees_by_student[$sid] ?? ['amount' => 0, 'paid' => 0];
            $fee_status = 'Paid';
            if ($f_info['amount'] > 0) {
                if ($f_info['paid'] <= 0) $fee_status = 'Unpaid';
                elseif ($f_info['paid'] < $f_info['amount']) $fee_status = 'Partial';
                else $fee_status = 'Paid';
            }

            // Attendance rate
            $a_info = $att_by_student[$sid] ?? ['total' => 0, 'present' => 0];
            $att_rate = $a_info['total'] > 0 ? round(($a_info['present'] / $a_info['total']) * 100, 1) : 95.0;

            $records[] = [
                'id'             => $sid,
                'admission_no'   => $s['admission_no'] ?? ('SS' . (2025000 + $sid)),
                'name'           => trim(($s['first_name'] ?? '') . ' ' . ($s['last_name'] ?? '')) ?: 'Student',
                'first_name'     => $s['first_name'] ?? '',
                'last_name'      => $s['last_name'] ?? '',
                'roll_no'        => $s['roll_no'] ?: (string)$sid,
                'class_name'     => $c_name,
                'section'        => $section,
                'gender'         => $gender,
                'category'       => $category,
                'rte'            => $is_rte,
                'father_name'    => $s['father_name'] ?: ($s['guardian_name'] ?: 'Guardian'),
                'phone'          => $s['phone'] ?: ($s['father_phone'] ?: 'N/A'),
                'email'          => $s['email'] ?: '',
                'admission_date' => $s['admission_date'] ?: ($s['created_at'] ? explode(' ', $s['created_at'])[0] : '2026-04-01'),
                'status'         => ucfirst($s['status'] ?: 'Active'),
                'fee_status'     => $fee_status,
                'attendance_pct' => $att_rate,
            ];
        }

        // Fill classes summary
        $class_summary = [];
        foreach ($classes as $c) {
            $name = $c['name'];
            $data = $class_counts[$name] ?? [
                'class_name' => $name,
                'section'    => $c['sections'] ?: 'A',
                'total'      => 0,
                'boys'       => 0,
                'girls'      => 0,
                'general'    => 0,
                'obc'        => 0,
                'sc_st'      => 0,
                'rte'        => 0,
            ];
            $data['class_teacher'] = $c['class_teacher'] ?: 'Faculty';
            $class_summary[] = $data;
        }

        return [
            'total_students'   => $total,
            'rte_students'     => $rte_count,
            'rte_percentage'   => $total > 0 ? round(($rte_count / $total) * 100, 1) : 0,
            'male_students'    => $gender_male,
            'female_students'  => $gender_female,
            'general_students' => $gen_count,
            'obc_students'     => $obc_count,
            'sc_students'      => $sc_count,
            'class_breakdown'  => $class_summary,
            'records'          => $records,
        ];
    }

    /**
     * 2. Financial Ledger Report: Real transactions & fees collected
     */
    public function generate_financial_report(?string $campus = null): array {
        $this->apply_campus($campus);
        $fees = $this->db->get('student_fees')->result_array();
        $total_due = (float)array_sum(array_column($fees, 'amount'));
        $total_collected = (float)array_sum(array_column($fees, 'paid'));

        $this->apply_campus($campus);
        $txns = $this->db->order_by('date', 'DESC')->order_by('id', 'DESC')->get('transactions')->result_array();

        $income_txns = array_filter($txns, fn($t) => $t['type'] === 'Income');
        $expense_txns = array_filter($txns, fn($t) => $t['type'] === 'Expense');

        $total_income = (float)array_sum(array_column($income_txns, 'amount'));
        $total_expense = (float)array_sum(array_column($expense_txns, 'amount'));

        $records = [];
        foreach ($txns as $t) {
            $records[] = [
                'id'           => (int)$t['id'],
                'ref_no'       => $t['reference_no'] ?: ('TXN-' . str_pad($t['id'], 5, '0', STR_PAD_LEFT)),
                'date'         => $t['date'] ?: (explode(' ', $t['created_at'] ?? '2026-09-28')[0]),
                'type'         => $t['type'],
                'head'         => $t['head'] ?: 'General Ledger',
                'amount'       => (float)$t['amount'],
                'payment_mode' => $t['payment_mode'] ?: 'Cash',
                'description'  => $t['description'] ?: 'Transaction ledger entry',
                'status'       => 'Verified',
            ];
        }

        // Also append fee receipts that have been paid
        foreach ($fees as $f) {
            if (floatval($f['paid']) > 0) {
                $records[] = [
                    'id'           => (int)$f['id'],
                    'ref_no'       => $f['receipt_no'] ?: ('FEE-REC-' . $f['id']),
                    'date'         => $f['date'] ?: (explode(' ', $f['created_at'] ?? '2026-09-28')[0]),
                    'type'         => 'Income',
                    'head'         => $f['type'] ?: 'Tuition Fee Collection',
                    'amount'       => (float)$f['paid'],
                    'payment_mode' => $f['payment_mode'] ?: 'Cash',
                    'description'  => 'Fee payment receipt for month: ' . ($f['month'] ?: 'Current Term'),
                    'status'       => $f['status'] ?: 'Paid',
                ];
            }
        }

        return [
            'total_fee_due'       => $total_due,
            'total_fee_collected' => $total_collected,
            'total_fee_pending'   => max(0, $total_due - $total_collected),
            'total_other_income'  => $total_income,
            'total_expense'       => $total_expense,
            'net_surplus'         => ($total_collected + $total_income) - $total_expense,
            'records'             => $records,
        ];
    }

    /**
     * 3. Attendance Compliance Report: Real day-to-day student attendances
     */
    public function generate_attendance_report(?string $campus = null): array {
        $this->apply_campus($campus);
        $classes = $this->db->get('school_classes')->result_array();
        $classes_map = [];
        foreach ($classes as $c) {
            $classes_map[$c['id']] = $c['name'];
        }

        // Query all real attendance records joined with students
        $this->db->select('attendances.*, students.first_name, students.last_name, students.admission_no, students.class_id, students.section_id');
        $this->db->from('attendances');
        $this->db->join('students', 'students.id = attendances.student_id', 'inner');
        if ($campus !== null) {
            $main_name = 'Kolkata Main Campus (Salt Lake Sector V)';
            $is_main = empty($campus) || stripos($campus, 'kolkata main') !== false || stripos($campus, 'salt lake') !== false || strtolower(trim($campus)) === 'main';
            if ($is_main) {
                $this->db->where("(attendances.campus = '{$main_name}' OR attendances.campus = 'Kolkata Main' OR attendances.campus IS NULL OR attendances.campus = '')", null, false);
            } else {
                $this->db->where('attendances.campus', $campus);
            }
        }
        $this->db->order_by('attendances.date', 'DESC');
        $this->db->order_by('attendances.id', 'DESC');
        $att_rows = $this->db->get()->result_array();

        $total_records = count($att_rows);
        $total_present = 0;
        $total_absent = 0;
        $total_late = 0;

        $records = [];
        $class_stats = [];

        foreach ($att_rows as $a) {
            $status = $a['status'] ?: 'Present';
            if ($status === 'Present') $total_present++;
            elseif ($status === 'Absent') $total_absent++;
            elseif ($status === 'Late') $total_late++;

            $c_name = $this->get_class_name($a['class_id'] ?? '', $classes_map);
            $section = $a['section_id'] ?: 'A';

            if (!isset($class_stats[$c_name])) {
                $class_stats[$c_name] = [
                    'class_name' => $c_name,
                    'section'    => $section,
                    'total'      => 0,
                    'present'    => 0,
                    'absent'     => 0,
                    'late'       => 0,
                ];
            }
            $class_stats[$c_name]['total']++;
            if ($status === 'Present') $class_stats[$c_name]['present']++;
            elseif ($status === 'Absent') $class_stats[$c_name]['absent']++;
            elseif ($status === 'Late') $class_stats[$c_name]['late']++;

            $records[] = [
                'id'           => (int)$a['id'],
                'date'         => $a['date'],
                'admission_no' => $a['admission_no'] ?? '',
                'student_name' => trim(($a['first_name'] ?? '') . ' ' . ($a['last_name'] ?? '')) ?: 'Student',
                'class_name'   => $c_name,
                'section'      => $section,
                'status'       => $status,
                'remark'       => $a['remark'] ?: 'Day-to-day roll call',
                'recorded_at'  => $a['created_at'] ?? $a['date'],
            ];
        }

        $overall_rate = $total_records > 0 ? round(($total_present / $total_records) * 100, 1) : 0;

        // Class summary
        $class_summary = [];
        foreach ($classes as $c) {
            $name = $c['name'];
            if (isset($class_stats[$name])) {
                $st = $class_stats[$name];
                $rate = $st['total'] > 0 ? round(($st['present'] / $st['total']) * 100, 1) : 0;
                $class_summary[] = [
                    'class_name'         => $name,
                    'section'            => $st['section'],
                    'instructional_days' => $st['total'],
                    'present_count'      => $st['present'],
                    'absent_count'       => $st['absent'],
                    'late_count'         => $st['late'],
                    'present_rate'       => $rate,
                    'status'             => $rate >= 75 ? 'Compliant' : 'Needs Attention',
                ];
            } else {
                $class_summary[] = [
                    'class_name'         => $name,
                    'section'            => $c['sections'] ?: 'A',
                    'instructional_days' => 0,
                    'present_count'      => 0,
                    'absent_count'       => 0,
                    'late_count'         => 0,
                    'present_rate'       => 0,
                    'status'             => 'No Records',
                ];
            }
        }

        return [
            'total_records' => $total_records,
            'total_present' => $total_present,
            'total_absent'  => $total_absent,
            'total_late'    => $total_late,
            'average_rate'  => $overall_rate,
            'class_summary' => $class_summary,
            'records'       => $records,
        ];
    }

    /**
     * 4. Examination Report: Real day-to-day exam results & scorecards
     */
    public function generate_exam_report(?string $campus = null): array {
        $this->apply_campus($campus);
        $classes = $this->db->get('school_classes')->result_array();
        $classes_map = [];
        foreach ($classes as $c) {
            $classes_map[$c['id']] = $c['name'];
        }

        $this->apply_campus($campus);
        $exams = $this->db->get('exams')->result_array();

        // Query all real exam results joined with students
        $this->db->select('exam_results.*, students.first_name, students.last_name, students.admission_no, students.class_id, students.section_id');
        $this->db->from('exam_results');
        $this->db->join('students', 'students.id = exam_results.student_id', 'inner');
        if ($campus !== null) {
            $main_name = 'Kolkata Main Campus (Salt Lake Sector V)';
            $is_main = empty($campus) || stripos($campus, 'kolkata main') !== false || stripos($campus, 'salt lake') !== false || strtolower(trim($campus)) === 'main';
            if ($is_main) {
                $this->db->where("(students.campus = '{$main_name}' OR students.campus = 'Kolkata Main' OR students.campus IS NULL OR students.campus = '')", null, false);
            } else {
                $this->db->where('students.campus', $campus);
            }
        }
        $this->db->order_by('exam_results.id', 'DESC');
        $marks = $this->db->get()->result_array();

        $total_assessments = count($marks);
        $total_students_tested = count(array_unique(array_column($marks, 'student_id')));
        $pass_count = count(array_filter($marks, fn($m) => floatval($m['marks'] ?? 0) >= 33));

        $grades_tally = [];
        $subject_stats = [];
        $records = [];
        $highest_score = 0;
        $total_marks_sum = 0;

        foreach ($marks as $m) {
            $marks_val = (int)($m['marks'] ?? 0);
            $total_val = (int)($m['total'] ?: 100);
            $pct = $total_val > 0 ? round(($marks_val / $total_val) * 100, 1) : 0;
            if ($marks_val > $highest_score) $highest_score = $marks_val;
            $total_marks_sum += $marks_val;

            $grade = $m['grade'] ?: ($pct >= 90 ? 'A1' : ($pct >= 80 ? 'A2' : ($pct >= 70 ? 'B1' : ($pct >= 60 ? 'B2' : 'C'))));
            $grades_tally[$grade] = ($grades_tally[$grade] ?? 0) + 1;

            $subj = $m['subject'] ?: 'General';
            if (!isset($subject_stats[$subj])) {
                $subject_stats[$subj] = [
                    'subject'       => $subj,
                    'exam'          => $m['exam'] ?: 'Term 1 Exam',
                    'appeared'      => 0,
                    'total_marks'   => 0,
                    'highest_marks' => 0,
                    'pass_count'    => 0,
                ];
            }
            $subject_stats[$subj]['appeared']++;
            $subject_stats[$subj]['total_marks'] += $marks_val;
            if ($marks_val > $subject_stats[$subj]['highest_marks']) {
                $subject_stats[$subj]['highest_marks'] = $marks_val;
            }
            if ($marks_val >= 33) {
                $subject_stats[$subj]['pass_count']++;
            }

            $c_name = $this->get_class_name($m['class_id'] ?? '', $classes_map);

            $records[] = [
                'id'           => (int)$m['id'],
                'admission_no' => $m['admission_no'] ?? '',
                'student_name' => trim(($m['first_name'] ?? '') . ' ' . ($m['last_name'] ?? '')) ?: 'Student',
                'class_name'   => $c_name,
                'section'      => $m['section_id'] ?: 'A',
                'exam'         => $m['exam'] ?: 'Unit Test 1',
                'subject'      => $subj,
                'marks'        => $marks_val,
                'total'        => $total_val,
                'percentage'   => $pct,
                'grade'        => $grade,
                'status'       => ucfirst($m['status'] ?: ($marks_val >= 33 ? 'Pass' : 'Fail')),
            ];
        }

        // Subject summary
        $subject_summary = [];
        foreach ($subject_stats as $subj => $st) {
            $avg = $st['appeared'] > 0 ? round($st['total_marks'] / $st['appeared'], 1) : 0;
            $pass_rate = $st['appeared'] > 0 ? round(($st['pass_count'] / $st['appeared']) * 100, 1) : 0;
            $subject_summary[] = [
                'subject'       => $subj,
                'exam'          => $st['exam'],
                'appeared'      => $st['appeared'],
                'average_marks' => $avg,
                'highest_marks' => $st['highest_marks'],
                'pass_rate'     => $pass_rate,
            ];
        }

        return [
            'total_exams'        => count($exams) ?: 3,
            'students_assessed'  => $total_students_tested,
            'total_assessments'  => $total_assessments,
            'pass_percentage'    => $total_assessments > 0 ? round(($pass_count / $total_assessments) * 100, 1) : 100,
            'highest_score'      => $highest_score,
            'average_score'      => $total_assessments > 0 ? round($total_marks_sum / $total_assessments, 1) : 0,
            'top_grades'         => $grades_tally,
            'subject_summary'    => $subject_summary,
            'records'            => $records,
        ];
    }

    /**
     * 5. Behavior Records Report: Real day-to-day student conduct and merit/demerit incidents
     */
    public function generate_behavior_report(?string $campus = null): array {
        $this->apply_campus($campus);
        $classes = $this->db->get('school_classes')->result_array();
        $classes_map = [];
        foreach ($classes as $c) {
            $classes_map[$c['id']] = $c['name'];
        }

        $this->db->select('student_notes.*, students.first_name, students.last_name, students.admission_no, students.class_id, students.section_id, users.name as logged_by');
        $this->db->from('student_notes');
        $this->db->join('students', 'students.id = student_notes.student_id', 'inner');
        $this->db->join('users', 'users.id = student_notes.added_by', 'left');
        if ($campus !== null) {
            $main_name = 'Kolkata Main Campus (Salt Lake Sector V)';
            $is_main = empty($campus) || stripos($campus, 'kolkata main') !== false || stripos($campus, 'salt lake') !== false || strtolower(trim($campus)) === 'main';
            if ($is_main) {
                $this->db->where("(students.campus = '{$main_name}' OR students.campus = 'Kolkata Main' OR students.campus IS NULL OR students.campus = '')", null, false);
            } else {
                $this->db->where('students.campus', $campus);
            }
        }
        $this->db->order_by('student_notes.id', 'DESC');
        $notes = $this->db->get()->result_array();

        $merits_count = 0;
        $demerits_count = 0;
        $records = [];

        foreach ($notes as $n) {
            $type = $n['type'] ?: 'Merit';
            $is_positive = stripos($type, 'Merit') !== false || stripos($type, 'Commendation') !== false || stripos($type, 'Leadership') !== false || stripos($type, 'Behavioural') !== false;
            $is_negative = stripos($type, 'Demerit') !== false || stripos($type, 'Infraction') !== false || stripos($type, 'Late') !== false || stripos($type, 'Violation') !== false;

            if ($is_negative) {
                $demerits_count++;
                $status = 'warning';
                $points = '-5';
            } else {
                $merits_count++;
                $status = 'positive';
                $points = stripos($type, 'Leadership') !== false ? '+15' : '+10';
            }

            $c_name = $this->get_class_name($n['class_id'] ?? '', $classes_map);

            $records[] = [
                'id'           => (int)$n['id'],
                'student_id'   => (int)$n['student_id'],
                'date'         => explode(' ', $n['created_at'] ?? date('Y-m-d'))[0],
                'admission_no' => $n['admission_no'] ?? '',
                'student_name' => trim(($n['first_name'] ?? '') . ' ' . ($n['last_name'] ?? '')) ?: 'Student',
                'class_name'   => $c_name,
                'section'      => $n['section_id'] ?: 'A',
                'type'         => $type,
                'title'        => $n['note'] ?: 'Behavior observation logged',
                'points'       => $points,
                'status'       => $status,
                'logged_by'    => $n['logged_by'] ?: 'Faculty',
            ];
        }

        $total = count($records);
        $discipline_index = $total > 0 ? round((max(0, $total - $demerits_count) / $total) * 100, 1) : 100;

        return [
            'total_records'    => $total,
            'total_merits'     => $merits_count,
            'total_demerits'   => $demerits_count,
            'discipline_index' => $discipline_index,
            'records'          => $records,
        ];
    }
}
