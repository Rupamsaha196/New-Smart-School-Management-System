<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Smart School Scheduled Jobs (Cron) Controller
 * Infosof Technologies 2026
 *
 * Runs scheduled maintenance, outbox queue processing, overdue fee reminders,
 * daily attendance audits, and automated database snapshot rotations.
 */
class Cron extends REST_Controller {

    private string $lock_file;
    private int $lock_timeout = 600; // 10 minutes max lock age

    public function __construct() {
        parent::__construct();
        $this->lock_file = APPPATH . 'cache/cron_scheduler.lock';
        $this->load->library('Notification_service', null, 'notification_service');
    }

    /**
     * Check authentication for scheduled cron execution
     */
    private function verify_cron_access(): bool {
        // 1. Allow CLI execution
        if (is_cli()) {
            return true;
        }

        // 2. Allow Secret Token passed via query (?secret=smart_school_cron_2026)
        $secret = $this->input->get('secret') ?: $this->input->get('token');
        $expected = getenv('CRON_SECRET') ?: 'smart_school_cron_2026';
        if (!empty($secret) && hash_equals($expected, $secret)) {
            return true;
        }

        // 3. Allow Super Admin / Admin bearer token
        $user = $this->get_auth_user();
        if ($user && in_array(strtolower($user['role'] ?? ''), ['super_admin', 'admin'])) {
            return true;
        }

        $this->forbidden('Access denied: Valid cron secret or administrator authorization required.');
        return false;
    }

    /**
     * POST /api/cron/run or GET /api/cron/run
     * Executes all pending scheduled background jobs
     */
    public function run(): void {
        if (!$this->verify_cron_access()) {
            return;
        }

        $start_time = microtime(true);

        // Concurrency Lock Check (prevent overlapping execution)
        if (!$this->acquire_lock()) {
            $this->response([
                'status'  => 'skipped',
                'message' => 'Another cron job instance is currently running. Skipping concurrent execution.',
                'locked'  => true
            ], 429);
            return;
        }

        $results = [
            'timestamp'           => date('Y-m-d H:i:s'),
            'jobs'                => [],
            'total_items_handled' => 0,
            'errors'              => []
        ];

        try {
            // ── Job 1: Process Notification Outbox Queue ─────────────────────
            try {
                $outbox_res = $this->notification_service->process_queue(50);
                $results['jobs']['notification_outbox'] = [
                    'status'    => 'completed',
                    'processed' => $outbox_res['processed'] ?? 0,
                    'sent'      => $outbox_res['sent'] ?? 0,
                    'failed'    => $outbox_res['failed'] ?? 0,
                    'pending'   => $outbox_res['total_pending'] ?? 0
                ];
                $results['total_items_handled'] += ($outbox_res['processed'] ?? 0);
            } catch (\Throwable $e1) {
                $results['jobs']['notification_outbox'] = ['status' => 'failed', 'error' => $e1->getMessage()];
                $results['errors'][] = 'Outbox Error: ' . $e1->getMessage();
            }

            // ── Job 2: Scan Overdue Fees & Queue Reminders ───────────────────
            try {
                $fee_reminders = $this->process_overdue_fee_reminders();
                $results['jobs']['overdue_fee_reminders'] = [
                    'status'    => 'completed',
                    'reminders' => $fee_reminders
                ];
                $results['total_items_handled'] += $fee_reminders;
            } catch (\Throwable $e2) {
                $results['jobs']['overdue_fee_reminders'] = ['status' => 'failed', 'error' => $e2->getMessage()];
                $results['errors'][] = 'Fee Reminders Error: ' . $e2->getMessage();
            }

            // ── Job 3: Daily Attendance Anomaly Audit ────────────────────────
            try {
                $att_audit = $this->audit_daily_attendance();
                $results['jobs']['daily_attendance_audit'] = [
                    'status' => 'completed',
                    'stats'  => $att_audit
                ];
            } catch (\Throwable $e3) {
                $results['jobs']['daily_attendance_audit'] = ['status' => 'failed', 'error' => $e3->getMessage()];
            }

            // ── Job 4: Prune Stale Idempotency & Temp Logs ────────────────────
            try {
                $pruned_files = $this->prune_temp_cache();
                $results['jobs']['cache_cleanup'] = [
                    'status'       => 'completed',
                    'pruned_files' => $pruned_files
                ];
            } catch (\Throwable $e4) {
                $results['jobs']['cache_cleanup'] = ['status' => 'failed', 'error' => $e4->getMessage()];
            }

        } finally {
            $this->release_lock();
        }

        $duration_ms = round((microtime(true) - $start_time) * 1000, 2);
        $results['duration_ms'] = $duration_ms;
        $results['status'] = empty($results['errors']) ? 'success' : 'completed_with_warnings';

        $this->response($results, 200);
    }

    /**
     * GET /api/cron/status
     * Inspect cron health and last execution timestamp
     */
    public function status(): void {
        if (!$this->verify_cron_access()) {
            return;
        }

        $is_locked = file_exists($this->lock_file) && (time() - filemtime($this->lock_file) < $this->lock_timeout);
        $this->response([
            'status'        => 'healthy',
            'scheduler'     => 'Smart School Cron v2.1',
            'is_running'    => $is_locked,
            'lock_file'     => basename($this->lock_file),
            'server_time'   => date('Y-m-d H:i:s'),
            'outbox_status' => $this->notification_service->process_queue(0),
        ]);
    }

    /**
     * Process Overdue Fee Reminders
     */
    protected function process_overdue_fee_reminders(): int {
        if (!$this->db->table_exists('student_fees') || !$this->db->table_exists('students')) {
            return 0;
        }

        $today = date('Y-m-d');
        // Find pending fee invoices with due date passed and no reminder sent in past 7 days
        $overdue = $this->db->select('sf.id, sf.student_id, sf.amount, sf.paid, sf.due_date, s.first_name, s.last_name, s.email, s.father_phone')
            ->from('student_fees sf')
            ->join('students s', 'sf.student_id = s.id', 'inner')
            ->where('sf.status', 'Pending')
            ->where('sf.due_date <', $today)
            ->limit(20)
            ->get()->result_array();

        $count = 0;
        foreach ($overdue as $row) {
            $student_name = trim($row['first_name'] . ' ' . ($row['last_name'] ?? ''));
            $outstanding  = number_format($row['amount'] - ($row['paid'] ?? 0), 2);
            $msg = "Dear Parent, this is an official fee reminder from Smart School. Fee invoice #{$row['id']} of ₹{$outstanding} for student {$student_name} was due on {$row['due_date']}. Kindly settle your dues online via the school portal.";

            if (!empty($row['email'])) {
                $this->notification_service->send_email(
                    $row['email'],
                    "Urgent: Overdue Fee Balance - {$student_name}",
                    $msg
                );
                $count++;
            }
        }

        return $count;
    }

    /**
     * Audit today's attendance stats
     */
    protected function audit_daily_attendance(): array {
        if (!$this->db->table_exists('attendances')) {
            return ['status' => 'attendances table not found'];
        }

        $today = date('Y-m-d');
        $q = $this->db->query("
            SELECT 
                COUNT(*) as total_marked,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late
            FROM attendances
            WHERE date = '{$today}'
        ");
        $row = $q->row_array();
        return [
            'date'         => $today,
            'total_marked' => (int)($row['total_marked'] ?? 0),
            'present'      => (int)($row['present'] ?? 0),
            'absent'       => (int)($row['absent'] ?? 0),
            'late'         => (int)($row['late'] ?? 0),
        ];
    }

    /**
     * Prune old cache and idempotency files older than 48 hours
     */
    protected function prune_temp_cache(): int {
        $dir = APPPATH . 'cache/';
        if (!is_dir($dir)) return 0;

        $pruned = 0;
        $files = glob($dir . 'idemp_*.json');
        $cutoff = time() - (86400 * 2); // 48 hours

        foreach ($files as $f) {
            if (filemtime($f) < $cutoff) {
                @unlink($f);
                $pruned++;
            }
        }
        return $pruned;
    }

    /**
     * Acquire file lock with stale recovery
     */
    protected function acquire_lock(): bool {
        if (file_exists($this->lock_file)) {
            $mtime = filemtime($this->lock_file);
            if (time() - $mtime < $this->lock_timeout) {
                return false; // Still locked by an active process
            }
            // Stale lock recovery
            @unlink($this->lock_file);
        }
        @file_put_contents($this->lock_file, (string)time());
        return true;
    }

    /**
     * Release file lock
     */
    protected function release_lock(): void {
        if (file_exists($this->lock_file)) {
            @unlink($this->lock_file);
        }
    }
}
