<?php


class Database
{
    private $pdo;

    public function __construct()
    {
        $config = require __DIR__ . '/config.php';

        $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            $this->pdo = new PDO($dsn, $config['username'], $config['password'], $options);
        } catch (PDOException $e) {
     
            jsonResponse(['message' => 'Database connection failed: ' . $e->getMessage()], 500);
            exit;
        }
    }


    public function query($sql, $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            jsonResponse(['message' => 'Query failed: ' . $e->getMessage()], 500);
            exit;
        }
    }

    
    public function select($table, $where = [], $fields = '*')
    {
        $sql = "SELECT $fields FROM `$table`";
        $params = [];

        if (!empty($where)) {
            $clauses = [];
            foreach ($where as $field => $value) {
                $clauses[] = "`$field` = ?";
                $params[] = $value;
            }
            $sql .= " WHERE " . implode(" AND ", $clauses);
        }

        $stmt = $this->query($sql, $params);
        return [
            'data' => $stmt->fetchAll(),
            'status' => 200 
        ];
    }


    public function rawSelect($sql, $params = [])
    {
        $stmt = $this->query($sql, $params);
        return [
            'data' => $stmt->fetchAll(),
            'status' => 200
        ];
    }

    public function insert($table, $data)
    {
        $keys = array_keys($data);
        $fields = implode('`, `', $keys);
        $placeholders = implode(', ', array_fill(0, count($keys), '?'));

        $sql = "INSERT INTO `$table` (`$fields`) VALUES ($placeholders)";
        $this->query($sql, array_values($data));

        
        $lastId = $this->pdo->lastInsertId();

   
        if ($lastId) {
            $stmt = $this->query("SELECT * FROM `$table` WHERE id = ?", [$lastId]);
            return ['data' => $stmt->fetchAll(), 'status' => 201];
        }

        return ['data' => [], 'status' => 201];
    }

    public function update($table, $data, $where)
    {
        $fields = [];
        $params = [];

        foreach ($data as $key => $value) {
            $fields[] = "`$key` = ?";
            $params[] = $value;
        }

        $setClause = implode(', ', $fields);

     
        $whereClauses = [];
        foreach ($where as $key => $value) {
            $whereClauses[] = "`$key` = ?";
            $params[] = $value;
        }
        $whereSql = implode(' AND ', $whereClauses);

        $sql = "UPDATE `$table` SET $setClause WHERE $whereSql";
        $this->query($sql, $params);

   

        $stmt = $this->query("SELECT * FROM `$table` WHERE $whereSql", array_values($where));
        return ['data' => $stmt->fetchAll(), 'status' => 200];
    }


    public function delete($table, $where)
    {
        $whereClauses = [];
        $params = [];

        foreach ($where as $key => $value) {
            $whereClauses[] = "`$key` = ?";
            $params[] = $value;
        }
        $whereSql = implode(' AND ', $whereClauses);

        $sql = "DELETE FROM `$table` WHERE $whereSql";
        $this->query($sql, $params);

        return ['data' => [], 'status' => 204];
    }
}
