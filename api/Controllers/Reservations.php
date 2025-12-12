<?php


function handleReservationsRequest($method, $uri)
{
    if (function_exists('console_log')) {
        console_log("Handling Reservations Request: $method $uri");
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


    if ($method === 'GET' && preg_match('#^/reservations/user$#', $uri)) {

        $sql = "
            SELECT r.*, 
                   rest.name as restaurant_name, 
                   rest.location, 
                   rest.cuisine_type, 
                   rest.image_url
            FROM Vreservations r
            JOIN Vrestaurants rest ON r.restaurant_id = rest.id
            WHERE r.user_id = ?
            ORDER BY r.reservation_date DESC, r.reservation_time DESC
        ";

        $response = $db->rawSelect($sql, [$userId]);

        if ($response['status'] >= 400) {
            jsonResponse(['message' => 'Failed to fetch reservations.'], 500);
        }


        $formatted = [];
        foreach ($response['data'] as $row) {
            $res = [
                'id' => $row['id'],
                'user_id' => $row['user_id'],
                'restaurant_id' => $row['restaurant_id'],
                'reservation_date' => $row['reservation_date'],
                'reservation_time' => $row['reservation_time'],
                'party_size' => $row['party_size'],
                'status' => $row['status'],
                'created_at' => $row['created_at'] ?? null,
                'restaurants' => [
                    'name' => $row['restaurant_name'],
                    'location' => $row['location'],
                    'cuisine_type' => $row['cuisine_type'],
                    'image_url' => $row['image_url']
                ]
            ];
            $formatted[] = $res;
        }

        jsonResponse($formatted);
    }

    if ($method === 'GET' && preg_match('#^/reservations/restaurant/([0-9]+)$#', $uri, $matches)) {
        $restaurantId = $matches[1];

        $checkOwner = $db->select('Vrestaurants', ['id' => $restaurantId]);

        if (empty($checkOwner['data'])) {
            jsonResponse(['message' => 'Restaurant not found.'], 404);
        }

        $restaurant = $checkOwner['data'][0];


        if ((int) $restaurant['owner_id'] !== (int) $userId) {
            jsonResponse(['message' => 'Access Forbidden: You are not the owner of this restaurant.'], 403);
        }


        $sql = "
            SELECT r.*, u.name as user_name
            FROM Vreservations r
            LEFT JOIN Vusers u ON r.user_id = u.id
            WHERE r.restaurant_id = ?
            ORDER BY r.reservation_date ASC, r.reservation_time ASC
        ";

        $response = $db->rawSelect($sql, [$restaurantId]);

        if ($response['status'] >= 400) {
            jsonResponse(['message' => 'Failed to fetch restaurant reservations.'], 500);
        }

        jsonResponse($response['data']);
    }


    if ($method === 'POST' && preg_match('#^/reservations$#', $uri)) {
        $input = json_decode(file_get_contents('php://input'), true);

        $restaurant_id = sanitizeInput($input['restaurant_id'] ?? null);
        $date = sanitizeInput($input['reservation_date'] ?? null);
        $time = sanitizeInput($input['reservation_time'] ?? null);
        $party_size = sanitizeInput($input['party_size'] ?? null);

        if (!$restaurant_id || !$date || !$time || !$party_size) {
            jsonResponse(['message' => 'Missing required reservation details.'], 400);
        }

        $res = $db->insert('Vreservations', [
            'user_id' => $userId,
            'restaurant_id' => $restaurant_id,
            'reservation_date' => $date,
            'reservation_time' => $time,
            'party_size' => $party_size,
            'status' => 'Confirmed'
        ]);

        if ($res['status'] >= 400) {
            jsonResponse(['message' => 'Failed to create reservation.'], 500);
        }

        jsonResponse(['message' => 'Reservation successfully created.'], 201);
    }


    if ($method === 'DELETE' && preg_match('#^/reservations/([0-9]+)$#', $uri, $matches)) {
        $reservationId = $matches[1];


        $check = $db->select('Vreservations', ['id' => $reservationId, 'user_id' => $userId]);
        if (empty($check['data'])) {
            jsonResponse(['message' => 'Reservation not found or access denied.'], 404);
        }


        $db->delete('Vreservations', ['id' => $reservationId]);
        jsonResponse(['message' => 'Reservation cancelled successfully.'], 200);
    }

    if ($method === 'PATCH' && preg_match('#^/reservations/([0-9]+)/status$#', $uri, $matches)) {
        $reservationId = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);
        $newStatus = sanitizeInput($input['status'] ?? '');

        if (!$newStatus) {
            jsonResponse(['message' => 'Status is required.'], 400);
        }


        $resQuery = $db->select('Vreservations', ['id' => $reservationId]);
        if (empty($resQuery['data'])) {
            jsonResponse(['message' => 'Reservation not found.'], 404);
        }
        $reservation = $resQuery['data'][0];


        $restQuery = $db->select('Vrestaurants', ['id' => $reservation['restaurant_id']]);
        if (empty($restQuery['data'])) {
            jsonResponse(['message' => 'Restaurant not found.'], 404);
        }
        $restaurant = $restQuery['data'][0];


        if ((int) $restaurant['owner_id'] !== (int) $userId) {
            jsonResponse(['message' => 'Unauthorized: Only the restaurant owner can modify this reservation.'], 403);
        }


        $update = $db->update('Vreservations', ['status' => $newStatus], ['id' => $reservationId]);

        if ($update['status'] >= 400) {
            jsonResponse(['message' => 'Failed to update status.'], 500);
        }

        jsonResponse(['message' => 'Reservation status updated.', 'status' => $newStatus]);
    }
}
