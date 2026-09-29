<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Dashboard extends REST_Controller {

    public function index(): void {
        // 1. Core Counts from DB
        $total_students = (int)$this->db->count_all_results('students');
        $total_staff    = (int)$this->db->count_all_results('staff');
        $total_classes  = (int)$this->db->count_all_results('school_classes');
        $total_exams    = (int)$this->db->count_all_results('exams');

        // 2. Fees Analytics from DB
        $fees_summary = $this->db->select("
            COALESCE(SUM(paid), 0) as collected,
            COALESCE(SUM(amount), 0) as total,
            COALESCE(SUM(amount - paid), 0) as due
        ")->get('student_fees')->row_array();

        $fees_collected = (float)($fees_summary['collected'] ?? 0);
        $fees_total     = (float)($fees_summary['total'] ?? 0);
        $fees_due       = max(0.0, (float)($fees_summary['due'] ?? 0));

        // Fees for current month
        $current_month = date('F');
        $fees_month_row = $this->db->query("
            SELECT COALESCE(SUM(paid), 0) as m_paid 
            FROM student_fees 
            WHERE month LIKE '%{$current_month}%' OR MONTH(date) = MONTH(CURRENT_DATE())
        ")->row_array();
        $fees_this_month = (float)($fees_month_row['m_paid'] ?? 0);
        if ($fees_this_month <= 0) {
            $fees_this_month = $fees_collected;
        }

        // 3. Attendance Analytics from DB
        $this->load->model('Attendance_model', 'att');
        $att_stats = $this->att->daily_stats();

        $overall_att = $this->db->select("
            COUNT(*) as total_records,
            SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END) as present
        ")->get('attendances')->row_array();

        $overall_rate = !empty($overall_att['total_records'])
            ? round(($overall_att['present'] / $overall_att['total_records']) * 100, 1)
            : 0.0;

        $today_records_count = (int)$this->db->where('date', date('Y-m-d'))->count_all_results('attendances');
        if ($today_records_count > 0 && !empty($att_stats['total'])) {
            $attendance_rate = (float)$att_stats['rate'];
        } else {
            $attendance_rate = $overall_rate;
        }

        // 4. Real Weekly Attendance Trend from DB (Last 5 days)
        $weekly_attendance = [];
        for ($i = 4; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-$i days"));
            $day_name = date('D', strtotime($d));
            $row = $this->db->select("
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END) as present
            ")->where('date', $d)->get('attendances')->row_array();

            $tot = (int)($row['total'] ?? 0);
            $pres = (int)($row['present'] ?? 0);
            $pct = $tot > 0 ? round(($pres / $tot) * 100) : 0;
            $weekly_attendance[] = [
                'day'     => $day_name,
                'date'    => $d,
                'pct'     => $pct,
                'val'     => $pct > 0 ? "{$pct}%" : "0%",
                'total'   => $tot,
                'present' => $pres,
            ];
        }

        // 5. Real Monthly Fee Collections vs Target from DB
        $month_rows = $this->db->query("
            SELECT 
                COALESCE(month, DATE_FORMAT(date, '%M')) as m_name,
                SUM(paid) as collected,
                SUM(amount) as target
            FROM student_fees
            WHERE paid > 0 OR amount > 0
            GROUP BY m_name
            ORDER BY MIN(created_at) ASC
            LIMIT 6
        ")->result_array();

        $monthly_fees = [];
        foreach ($month_rows as $mr) {
            $raw_name = trim($mr['m_name'] ?? 'Other');
            $short_name = substr($raw_name, 0, 3);
            $col = (float)($mr['collected'] ?? 0);
            $tar = (float)($mr['target'] ?? 0);
            $pct = $tar > 0 ? min(100, round(($col / $tar) * 100)) : ($col > 0 ? 100 : 0);
            $monthly_fees[] = [
                'month'      => $short_name,
                'full_month' => $raw_name,
                'collected'  => $col,
                'target'     => $tar,
                'pct'        => $pct,
                'val'        => '₹' . number_format($col, 0)
            ];
        }

        // 6. Real Recent Activity Feed from DB
        $recent_activities = [];

        // Recent admissions
        $recent_students = $this->db->select('id, first_name, last_name, admission_no, created_at')
            ->order_by('created_at', 'DESC')
            ->limit(3)
            ->get('students')->result_array();
        foreach ($recent_students as $st) {
            $name = trim(($st['first_name'] ?? '') . ' ' . ($st['last_name'] ?? ''));
            $recent_activities[] = [
                'type'     => 'admission',
                'title'    => 'New Admission: ' . $name,
                'subtitle' => 'Adm No: ' . ($st['admission_no'] ?? 'N/A'),
                'time'     => $st['created_at'] ?? date('Y-m-d H:i:s'),
                'icon'     => 'userPlus',
                'badge'    => 'Admission',
            ];
        }

        // Recent fee payments
        $recent_fees = $this->db->query("
            SELECT sf.id, sf.paid, sf.type, sf.receipt_no, sf.created_at, s.first_name, s.last_name
            FROM student_fees sf
            LEFT JOIN students s ON s.id = sf.student_id
            WHERE sf.paid > 0
            ORDER BY sf.created_at DESC
            LIMIT 3
        ")->result_array();
        foreach ($recent_fees as $rf) {
            $s_name = trim(($rf['first_name'] ?? '') . ' ' . ($rf['last_name'] ?? '')) ?: 'Student #' . ($rf['student_id'] ?? '');
            $recent_activities[] = [
                'type'     => 'fee',
                'title'    => 'Fee Payment: ₹' . number_format((float)($rf['paid'] ?? 0), 0),
                'subtitle' => 'From ' . $s_name . (!empty($rf['receipt_no']) ? ' · ' . $rf['receipt_no'] : ''),
                'time'     => $rf['created_at'] ?? date('Y-m-d H:i:s'),
                'icon'     => 'banknotes',
                'badge'    => 'Fee',
            ];
        }

        // Sort activities chronologically (newest first)
        usort($recent_activities, function($a, $b) {
            return strtotime($b['time'] ?? 0) - strtotime($a['time'] ?? 0);
        });
        $recent_activities = array_slice($recent_activities, 0, 5);

        // 7. Recent Notices
        $recent_notices = $this->db->order_by('created_at', 'DESC')->limit(5)->get('notices')->result_array();

        $this->response([
            'total_students'    => $total_students,
            'total_staff'       => $total_staff,
            'total_classes'     => $total_classes,
            'total_exams'       => $total_exams,
            'fees_collected'    => $fees_collected,
            'fees_total'        => $fees_total,
            'fees_due'          => $fees_due,
            'fees_this_month'   => $fees_this_month,
            'attendance_rate'   => $attendance_rate,
            'daily_attendance'  => $att_stats,
            'weekly_attendance' => $weekly_attendance,
            'monthly_fees'      => $monthly_fees,
            'recent_activities' => $recent_activities,
            'recent_notices'    => $recent_notices,
            'system'            => [
                'framework'   => 'CodeIgniter 3.x / PHP 8.x',
                'database'    => 'MySQL 8.x',
                'version'     => 'Smart School 2026',
            ],
        ]);
    }
}
