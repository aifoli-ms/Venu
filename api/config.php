<?php
$servername = "localhost";
$db_username = "shaun.esua";
$db_password = "ShaunAtoAifoli18";
$db_name = "webtech_2025A_shaun_esua";


mysqli_report(MYSQLI_REPORT_OFF);


$conn = new mysqli($servername, $db_username, $db_password, $db_name);

if ($conn->connect_error) {
    die("ERROR: " . $conn->connect_error);
}




if (!function_exists('sanitizeInput')) {
    function sanitizeInput($data)
    {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = sanitizeInput($value);
            }
            return $data;
        }

        $clean = preg_replace('/<[^>]*>/', '', $data ?? '');

        if ($clean !== ($data ?? '')) {
            if (function_exists('jsonResponse')) {
                jsonResponse(['message' => 'Invalid input: HTML tags are not allowed.'], 400);
            } else {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['message' => 'Invalid input: HTML tags are not allowed.']);
                exit;
            }
        }

        return htmlspecialchars(trim($data ?? ''), ENT_QUOTES, 'UTF-8');
    }
}

return [
    'host' => $servername,
    'username' => $db_username,
    'password' => $db_password,
    'dbname' => $db_name,
    'charset' => 'utf8mb4'
];