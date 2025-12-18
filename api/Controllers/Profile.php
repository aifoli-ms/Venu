<?php
// This file handles profile-related API requests
// It allows authenticated users to retrieve their own profile information
// It ensures that only valid, logged-in users can access this data
function handleProfileRequest($method, $uri)
{
    if (function_exists('console_log')) {
        console_log("Handling Profile Request: $method $uri");
    }
    $db = new Database();
    $jwt = new JwtHelper();


    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $token = str_replace('Bearer ', '', $authHeader);

    $user = $jwt->verify($token);

    if (!$user) {
        jsonResponse(['message' => 'Unauthorized'], 401);
    }
    $userId = $user['userId'];


    if ($method === 'GET' && preg_match('#^/profile$#', $uri)) {
        $fields = 'name, email, phone_number';
        $response = $db->select('Vusers', ['id' => $userId], $fields);

        if ($response['status'] >= 400 || empty($response['data'])) {
            jsonResponse(['message' => 'User data not found.'], 404);
        }

        jsonResponse($response['data'][0]);
    }
}
