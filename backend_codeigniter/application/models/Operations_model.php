<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Operations_model extends CI_Model {

    // ── Library ──────────────────────────────
    public function get_books(): array {
        return $this->db->get('library_books')->result_array();
    }

    public function library_stats(): array {
        $books = $this->db->get('library_books')->result_array();
        $total = array_sum(array_column($books, 'qty')) ?: array_sum(array_column($books, 'total_copies'));
        $avail = array_sum(array_column($books, 'available_qty')) ?: array_sum(array_column($books, 'available_copies'));
        $issues = $this->db->where('return_date', null)->count_all_results('book_issues');
        return [
            'total_books'     => $total ?: count($books),
            'available_books' => $avail ?: (count($books) - $issues),
            'issued_books'    => $issues,
        ];
    }

    // ── Transport ────────────────────────────
    public function get_routes(): array {
        return $this->db->get('transport_routes')->result_array();
    }

    public function get_stops(int $route_id): array {
        return $this->db->where('route_id', $route_id)->get('transport_stops')->result_array();
    }

    // ── Hostel ───────────────────────────────
    public function get_hostels(): array {
        return $this->db->get('hostels')->result_array();
    }

    public function get_hostel_rooms(?int $hostel_id = null): array {
        if ($hostel_id) {
            $this->db->where('hostel_id', $hostel_id);
        }
        return $this->db->get('hostel_rooms')->result_array();
    }

    // ── Notices ──────────────────────────────
    public function get_notices(): array {
        return $this->db->order_by('created_at', 'DESC')->get('notices')->result_array();
    }

    public function create_notice(array $data): int {
        $clean = [
            'title'        => $data['title'] ?? 'Notice',
            'content'      => $data['content'] ?? ($data['description'] ?? ($data['message'] ?? 'Notice announcement')),
            'date'         => $data['date'] ?? date('Y-m-d'),
            'audience'     => $data['audience'] ?? 'All',
            'attachment'   => $data['attachment'] ?? null,
            'is_published' => $data['is_published'] ?? 1,
            'created_by'   => $data['created_by'] ?? 1,
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('notices', $clean);
        return $this->db->insert_id();
    }

    public function create_book(array $data): int {
        $clean = [
            'title'         => $data['title'] ?? 'Untitled Book',
            'author'        => $data['author'] ?? 'Unknown Author',
            'isbn'          => $data['isbn'] ?? null,
            'category'      => $data['category'] ?? 'General',
            'qty'           => (int)($data['qty'] ?? 1),
            'available_qty' => (int)($data['available_qty'] ?? ($data['qty'] ?? 1)),
            'rack_no'       => $data['rack'] ?? ($data['rack_no'] ?? 'Rack A-01'),
            'created_at'    => date('Y-m-d H:i:s'),
            'updated_at'    => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('library_books', $clean);
        return $this->db->insert_id();
    }

    public function create_route(array $data): int {
        $clean = [
            'route_name'   => $data['route_name'] ?? ($data['route_title'] ?? ($data['title'] ?? 'New Bus Route')),
            'vehicle_no'   => $data['vehicle_no'] ?? 'WB-01-EA-0000',
            'driver_name'  => $data['driver_name'] ?? 'Assigned Driver',
            'driver_phone' => $data['driver_phone'] ?? '+91 98765 00000',
            'fare'         => (float)($data['fare'] ?? 2000),
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('transport_routes', $clean);
        return $this->db->insert_id();
    }

    public function update_route(int $id, array $data): bool {
        $clean = [];
        if (isset($data['route_name']) || isset($data['route_title'])) {
            $clean['route_name'] = $data['route_name'] ?? $data['route_title'];
        }
        if (isset($data['vehicle_no'])) $clean['vehicle_no'] = $data['vehicle_no'];
        if (isset($data['driver_name'])) $clean['driver_name'] = $data['driver_name'];
        if (isset($data['driver_phone'])) $clean['driver_phone'] = $data['driver_phone'];
        if (isset($data['fare'])) $clean['fare'] = (float)$data['fare'];
        $clean['updated_at'] = date('Y-m-d H:i:s');

        return $this->db->update('transport_routes', $clean, ['id' => $id]);
    }

    public function delete_route(int $id): bool {
        return $this->db->delete('transport_routes', ['id' => $id]);
    }

    public function issue_book(array $data): ?int {
        $book_id = (int)($data['book_id'] ?? 1);
        $book = $this->db->where('id', $book_id)->get('library_books')->row_array();
        if (!$book || (int)$book['available_qty'] <= 0) {
            return null;
        }

        $this->db->trans_begin();
        $clean = [
            'book_id'      => $book_id,
            'student_id'   => !empty($data['student_id']) ? (int)$data['student_id'] : null,
            'student_name' => $data['student_name'] ?? 'Student',
            'issue_date'   => $data['issue_date'] ?? date('Y-m-d'),
            'due_date'     => $data['due_date'] ?? date('Y-m-d', strtotime('+14 days')),
            'status'       => 'Issued',
            'created_at'   => date('Y-m-d H:i:s'),
            'updated_at'   => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('book_issues', $clean);
        $issue_id = $this->db->insert_id();

        // Decrement available_qty in library_books
        $this->db->query("UPDATE library_books SET available_qty = GREATEST(available_qty - 1, 0) WHERE id = ?", [$book_id]);

        if ($this->db->trans_status() === FALSE) {
            $this->db->trans_rollback();
            return null;
        }
        $this->db->trans_commit();
        return $issue_id;
    }

    public function get_book_issues(): array {
        return $this->db->select('book_issues.*, library_books.title as book_title, library_books.isbn, library_books.author')
            ->from('book_issues')
            ->join('library_books', 'library_books.id = book_issues.book_id', 'left')
            ->order_by('book_issues.id', 'DESC')
            ->get()->result_array();
    }

    public function return_book(int $issue_id): bool {
        $issue = $this->db->where('id', $issue_id)->get('book_issues')->row_array();
        if (!$issue || $issue['status'] === 'Returned') return false;

        $this->db->trans_begin();
        $this->db->where('id', $issue_id)->update('book_issues', [
            'status'      => 'Returned',
            'return_date' => date('Y-m-d'),
            'updated_at'  => date('Y-m-d H:i:s'),
        ]);
        $this->db->query("UPDATE library_books SET available_qty = LEAST(available_qty + 1, qty) WHERE id = ?", [(int)$issue['book_id']]);

        if ($this->db->trans_status() === FALSE) {
            $this->db->trans_rollback();
            return false;
        }
        $this->db->trans_commit();
        return true;
    }

    public function create_hostel(array $data): int {
        $clean = [
            'name'       => $data['name'] ?? ($data['hostel_name'] ?? 'New Hostel Block'),
            'type'       => $data['type'] ?? 'Boys',
            'address'    => $data['address'] ?? 'School Campus',
            'intake'     => (int)($data['capacity'] ?? ($data['intake'] ?? 50)),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('hostels', $clean);
        return $this->db->insert_id();
    }

    // ── Hostel Allocations ─────────────────────
    public function allocate_student(array $data): int {
        $room_id = !empty($data['room_id']) ? (int)$data['room_id'] : null;
        if (!$room_id && !empty($data['room_no'])) {
            $existing = $this->db->where('hostel_id', (int)$data['hostel_id'])
                                 ->where('room_no', $data['room_no'])
                                 ->get('hostel_rooms')->row_array();
            if ($existing) {
                $room_id = (int)$existing['id'];
            } else {
                $this->db->insert('hostel_rooms', [
                    'hostel_id'  => (int)$data['hostel_id'],
                    'room_no'    => $data['room_no'],
                    'type'       => $data['room_type'] ?? 'Standard',
                    'capacity'   => (int)($data['capacity'] ?? 2),
                    'fee'        => (float)($data['fee'] ?? 5000),
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
                $room_id = $this->db->insert_id();
            }
        }

        $join_date = !empty($data['join_date']) ? date('Y-m-d', strtotime($data['join_date'])) : date('Y-m-d');
        $clean = [
            'student_id' => (int)$data['student_id'],
            'hostel_id'  => (int)$data['hostel_id'],
            'room_id'    => $room_id,
            'join_date'  => $join_date,
            'leave_date' => !empty($data['leave_date']) ? date('Y-m-d', strtotime($data['leave_date'])) : null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('student_hostels', $clean);
        return $this->db->insert_id();
    }

    public function get_student_allocations(): array {
        $this->db->select('student_hostels.id, student_hostels.student_id, student_hostels.hostel_id, student_hostels.room_id, student_hostels.join_date, student_hostels.leave_date, ' .
                          'students.first_name, students.last_name, students.admission_no, students.roll_no, students.gender, ' .
                          'school_classes.name as class_name, ' .
                          'hostels.name as hostel_name, hostels.type as hostel_type, ' .
                          'hostel_rooms.room_no');
        $this->db->from('student_hostels');
        $this->db->join('students', 'students.id = student_hostels.student_id', 'left');
        $this->db->join('school_classes', 'school_classes.id = students.class_id', 'left');
        $this->db->join('hostels', 'hostels.id = student_hostels.hostel_id', 'left');
        $this->db->join('hostel_rooms', 'hostel_rooms.id = student_hostels.room_id', 'left');
        $this->db->order_by('student_hostels.id', 'DESC');
        return $this->db->get()->result_array();
    }

    public function vacate_student(int $id): bool {
        return $this->db->delete('student_hostels', ['id' => $id]);
    }

    // ── Calendar Events ────────────────────────
    public function get_calendar_events(): array {
        return $this->db->order_by('date', 'ASC')->get('calendar_events')->result_array();
    }

    public function create_calendar_event(array $data): int {
        $type = $data['type'] ?? 'Academic';
        if (!in_array($type, ['Academic', 'Event', 'Holiday'])) {
            $type = 'Academic';
        }
        $clean = [
            'title'       => $data['title'] ?? 'School Event',
            'date'        => date('Y-m-d', strtotime($data['date'] ?? 'now')),
            'type'        => $type,
            'description' => $data['description'] ?? ($data['badge'] ?? 'Official school event'),
            'created_at'  => date('Y-m-d H:i:s'),
            'updated_at'  => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('calendar_events', $clean);
        return $this->db->insert_id();
    }

    public function delete_calendar_event(int $id): bool {
        return $this->db->delete('calendar_events', ['id' => $id]);
    }
}
