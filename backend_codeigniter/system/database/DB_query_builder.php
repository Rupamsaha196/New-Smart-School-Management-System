<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class CI_DB_result {
    protected array $data = [];
    protected int $num_rows = 0;

    public function __construct(array $data) {
        $this->data = $data;
        $this->num_rows = count($data);
    }

    public function result_array(): array {
        return $this->data;
    }

    public function row_array(): ?array {
        return $this->data[0] ?? NULL;
    }

    public function result(): array {
        return array_map(fn($row) => (object)$row, $this->data);
    }

    public function row() {
        return isset($this->data[0]) ? (object)$this->data[0] : NULL;
    }

    public function num_rows(): int {
        return $this->num_rows;
    }
}

#[\AllowDynamicProperties]
class CI_DB_query_builder {
    public PDO $pdo;
    protected string $select_clause = '*';
    protected string $from_table = '';
    protected array $where_clauses = [];
    protected array $bind_params = [];
    protected array $order_by = [];
    protected ?int $limit_val = null;
    protected ?int $offset_val = null;
    protected array $joins = [];
    protected string $group_by = '';

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function reset_query(): self {
        $this->select_clause = '*';
        $this->from_table = '';
        $this->where_clauses = [];
        $this->bind_params = [];
        $this->order_by = [];
        $this->limit_val = null;
        $this->offset_val = null;
        $this->joins = [];
        $this->group_by = '';
        return $this;
    }

    public function select(string $select = '*'): self {
        $this->select_clause = $select;
        return $this;
    }

    public function from(string $table): self {
        $this->from_table = $table;
        return $this;
    }

    public function join(string $table, string $cond, string $type = 'INNER'): self {
        $this->joins[] = strtoupper($type) . " JOIN `{$table}` ON {$cond}";
        return $this;
    }

    protected function escape_col(string $field): string {
        $field = trim($field);
        if (strpos($field, '(') !== false || strpos($field, ' ') !== false) {
            return $field;
        }
        if (strpos($field, '.') !== false) {
            $parts = explode('.', $field);
            return '`' . implode('`.`', array_map(function($p) { return trim($p, '`'); }, $parts)) . '`';
        }
        return '`' . trim($field, '`') . '`';
    }

    public function where($key, $val = NULL): self {
        if (is_array($key)) {
            foreach ($key as $k => $v) {
                $this->where($k, $v);
            }
            return $this;
        }

        $param_key = ':w_' . count($this->bind_params) . '_' . preg_replace('/[^a-zA-Z0-9_]/', '', $key);
        $clause = strpos($key, ' ') !== false ? "{$key} {$param_key}" : $this->escape_col($key) . " = {$param_key}";

        if (empty($this->where_clauses)) {
            $this->where_clauses[] = $clause;
        } else {
            $this->where_clauses[] = "AND " . $clause;
        }
        $this->bind_params[$param_key] = $val;
        return $this;
    }

    public function or_where($key, $val = NULL): self {
        $param_key = ':or_' . count($this->bind_params) . '_' . preg_replace('/[^a-zA-Z0-9_]/', '', $key);
        $clause = strpos($key, ' ') !== false ? "{$key} {$param_key}" : $this->escape_col($key) . " = {$param_key}";

        if (empty($this->where_clauses)) {
            $this->where_clauses[] = $clause;
        } else {
            $this->where_clauses[] = "OR " . $clause;
        }
        $this->bind_params[$param_key] = $val;
        return $this;
    }

    public function like(string $field, string $match): self {
        $param_key = ':lk_' . count($this->bind_params) . '_' . preg_replace('/[^a-zA-Z0-9_]/', '', $field);
        $clause = $this->escape_col($field) . " LIKE {$param_key}";
        if (empty($this->where_clauses)) {
            $this->where_clauses[] = $clause;
        } else {
            $this->where_clauses[] = "AND " . $clause;
        }
        $this->bind_params[$param_key] = "%{$match}%";
        return $this;
    }

    public function or_like(string $field, string $match): self {
        $param_key = ':or_lk_' . count($this->bind_params) . '_' . preg_replace('/[^a-zA-Z0-9_]/', '', $field);
        $clause = $this->escape_col($field) . " LIKE {$param_key}";
        if (empty($this->where_clauses)) {
            $this->where_clauses[] = $clause;
        } else {
            $this->where_clauses[] = "OR " . $clause;
        }
        $this->bind_params[$param_key] = "%{$match}%";
        return $this;
    }

    public function where_in(string $field, array $values): self {
        if (empty($values)) {
            $clause = "1 = 0";
            if (empty($this->where_clauses)) {
                $this->where_clauses[] = $clause;
            } else {
                $this->where_clauses[] = "AND " . $clause;
            }
            return $this;
        }

        $placeholders = [];
        foreach (array_values($values) as $i => $val) {
            $param_key = ':in_' . count($this->bind_params) . '_' . $i;
            $placeholders[] = $param_key;
            $this->bind_params[$param_key] = $val;
        }

        $clause = $this->escape_col($field) . " IN (" . implode(', ', $placeholders) . ")";
        if (empty($this->where_clauses)) {
            $this->where_clauses[] = $clause;
        } else {
            $this->where_clauses[] = "AND " . $clause;
        }
        return $this;
    }

    public function where_not_in(string $field, array $values): self {
        if (empty($values)) {
            return $this;
        }

        $placeholders = [];
        foreach (array_values($values) as $i => $val) {
            $param_key = ':notin_' . count($this->bind_params) . '_' . $i;
            $placeholders[] = $param_key;
            $this->bind_params[$param_key] = $val;
        }

        $clause = $this->escape_col($field) . " NOT IN (" . implode(', ', $placeholders) . ")";
        if (empty($this->where_clauses)) {
            $this->where_clauses[] = $clause;
        } else {
            $this->where_clauses[] = "AND " . $clause;
        }
        return $this;
    }

    public function order_by(string $field, string $direction = 'ASC'): self {
        $this->order_by[] = "{$field} " . strtoupper($direction);
        return $this;
    }

    public function group_by(string $field): self {
        $this->group_by = $field;
        return $this;
    }

    public function limit(int $limit, ?int $offset = null): self {
        $this->limit_val = $limit;
        $this->offset_val = $offset;
        return $this;
    }

    public function get(?string $table = NULL, ?int $limit = NULL, ?int $offset = NULL): CI_DB_result {
        if ($table !== NULL) {
            $this->from_table = $table;
        }
        if ($limit !== NULL) {
            $this->limit($limit, $offset);
        }

        $sql = "SELECT {$this->select_clause} FROM `{$this->from_table}`";

        if (!empty($this->joins)) {
            $sql .= " " . implode(" ", $this->joins);
        }

        if (!empty($this->where_clauses)) {
            $sql .= " WHERE " . implode(" ", $this->where_clauses);
        }

        if ($this->group_by !== '') {
            $sql .= " GROUP BY {$this->group_by}";
        }

        if (!empty($this->order_by)) {
            $sql .= " ORDER BY " . implode(", ", $this->order_by);
        }

        if ($this->limit_val !== null) {
            $sql .= " LIMIT {$this->limit_val}";
            if ($this->offset_val !== null) {
                $sql .= " OFFSET {$this->offset_val}";
            }
        }

        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($this->bind_params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return new CI_DB_result($rows);
        } finally {
            $this->reset_query();
        }
    }

    public function insert(string $table, array $data): bool {
        $keys = array_keys($data);
        $fields = implode('`, `', $keys);
        $placeholders = ':' . implode(', :', $keys);

        $sql = "INSERT INTO `{$table}` (`{$fields}`) VALUES ({$placeholders})";

        $binds = [];
        foreach ($data as $k => $v) {
            $binds[':' . $k] = is_array($v) ? json_encode($v) : $v;
        }

        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute($binds);
        } finally {
            $this->reset_query();
        }
    }

    public function insert_id(): string|int {
        return $this->pdo->lastInsertId();
    }

    public function update(string $table, array $data, $where = NULL): bool {
        if ($where !== NULL) {
            $this->where($where);
        }

        $set_parts = [];
        $binds = [];
        foreach ($data as $k => $v) {
            $param = ':set_' . $k;
            $set_parts[] = "`{$k}` = {$param}";
            $binds[$param] = is_array($v) ? json_encode($v) : $v;
        }

        $sql = "UPDATE `{$table}` SET " . implode(', ', $set_parts);

        if (!empty($this->where_clauses)) {
            $sql .= " WHERE " . implode(' ', $this->where_clauses);
            $binds = array_merge($binds, $this->bind_params);
        }

        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute($binds);
        } finally {
            $this->reset_query();
        }
    }

    public function delete(string $table, $where = NULL): bool {
        if ($where !== NULL) {
            $this->where($where);
        }

        $sql = "DELETE FROM `{$table}`";
        if (!empty($this->where_clauses)) {
            $sql .= " WHERE " . implode(' ', $this->where_clauses);
        }

        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute($this->bind_params);
        } finally {
            $this->reset_query();
        }
    }

    public function count_all_results(?string $table = NULL): int {
        if ($table !== NULL) {
            $this->from_table = $table;
        }
        $sql = "SELECT COUNT(*) as cnt FROM `{$this->from_table}`";
        if (!empty($this->where_clauses)) {
            $sql .= " WHERE " . implode(' ', $this->where_clauses);
        }

        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($this->bind_params);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)($row['cnt'] ?? 0);
        } finally {
            $this->reset_query();
        }
    }

    public function query(string $sql, array $binds = []): CI_DB_result {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($binds);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return new CI_DB_result($rows);
        } finally {
            $this->reset_query();
        }
    }
}
