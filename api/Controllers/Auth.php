<?php


function handleAuthRequest($method, $uri)
{
    $db = new Database();
    $jwt = new JwtHelper();


    $input = json_decode(file_get_contents('php://input'), true);


    if ($method === 'POST' && preg_match('#^/users/login$#', $uri)) {
        $email = sanitizeInput($input['email'] ?? '');
        $password = $input['password'] ?? ''; 

        if (!$email || !$password) {
            jsonResponse(['message' => 'Email and password are required'], 400);
        }


        $response = $db->select('Vusers', ['email' => $email]);

        if ($response['status'] !== 200 || empty($response['data'])) {
            jsonResponse(['message' => 'Cannot find user'], 400);
        }

        $user = $response['data'][0];


        if (password_verify($password, $user['password_hash'])) {
            $token = $jwt->sign(['userId' => $user['id']]);

            jsonResponse([
                'message' => 'Success',
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'name' => $user['name'],
                    'role' => $user['role'] ?? 'user'
                ]
            ]);

            
            if (isset($user['role']) && $user['role'] === 'owner') {
                $resCheck = $db->select('Vrestaurants', ['owner_id' => $user['id']]);
                if (!empty($resCheck['data'])) {
                    $userData['owner_restaurant_id'] = $resCheck['data'][0]['id'];
                }
            }

            jsonResponse([
                'message' => 'Success',
                'token' => $token,
                'user' => $userData
            ]);
        } else {
            jsonResponse(['message' => 'Not Allowed'], 401);
        }
    }


    if ($method === 'POST' && preg_match('#^/users$#', $uri)) {
        $name = sanitizeInput($input['name'] ?? null);
        $email = sanitizeInput($input['email'] ?? null);
        $phone = sanitizeInput($input['phone'] ?? null);
        $password = $input['password'] ?? null; 

        if (!$name || !$email || !$phone || !$password) {
            jsonResponse(['message' => 'All fields are required'], 400);
        }


        $existing = $db->select('Vusers', ['email' => $email]);
        if (!empty($existing['data'])) {
            jsonResponse(['message' => 'User with this email already exists'], 400);
        }


        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);


        $insertResponse = $db->insert('Vusers', [
            'name' => $name,
            'email' => $email,
            'phone_number' => $phone,
            'password_hash' => $hashedPassword
        ]);

        if ($insertResponse['status'] >= 400) {
            jsonResponse(['message' => 'Error creating user'], 500);
        }

        jsonResponse(['message' => 'User created successfully'], 201);
    }


    if ($method === 'PATCH' && preg_match('#^/users/([a-zA-Z0-9-]+)$#', $uri, $matches)) {
        $requestId = $matches[1];


        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = $jwt->verify($token);

        if (!$decoded || $decoded['userId'] != $requestId) {
            jsonResponse(['message' => "Unauthorized attempt to modify another user's profile."], 403);
        }

        $userId = $decoded['userId'];
        $updates = [];

        if (isset($input['name']))
            $updates['name'] = sanitizeInput($input['name']);
        if (isset($input['phone']))
            $updates['phone_number'] = sanitizeInput($input['phone']);
        if (isset($input['password'])) {
            if (strlen($input['password']) < 6) {
                jsonResponse(['message' => 'Password must be at least 6 characters.'], 400);
            }
            $updates['password_hash'] = password_hash($input['password'], PASSWORD_BCRYPT);
        }

        if (empty($updates)) {
            jsonResponse(['message' => 'No data provided for update.'], 400);
        }

        $updateResponse = $db->update('Vusers', $updates, ['id' => $userId]);

        if ($updateResponse['status'] >= 400) {
            jsonResponse(['message' => 'Failed to update profile.'], 500);
        }

        if (empty($updateResponse['data'])) {
            jsonResponse(['message' => 'User not found or not updated'], 404);
        }
        $updatedUser = $updateResponse['data'][0];


        $safeUser = [
            'name' => $updatedUser['name'],
            'email' => $updatedUser['email'],
            'phone_number' => $updatedUser['phone_number']
        ];

        jsonResponse([
            'message' => 'Profile updated successfully.',
            'user' => $safeUser
        ]);
    }


    if ($method === 'GET' && preg_match('#^/users$#', $uri)) {
        $response = $db->select('Vusers');
        if ($response['status'] >= 400) {
            jsonResponse(['error' => $response['error'] ?? 'Unknown error'], 500);
        }
        jsonResponse($response['data']);
    }
}
