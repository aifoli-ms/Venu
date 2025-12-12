<?php

function handleMenusRequest($method, $uri)
{
    $db = new Database();
    $jwt = new JwtHelper();

    if ($method === 'GET' && preg_match('#^/restaurants/([0-9]+)/menus/?$#', $uri, $matches)) {
        $id = $matches[1];


        $sql = "SELECT * FROM Vmenus WHERE restaurant_id = ? AND is_active = 1 ORDER BY name ASC";
        $response = $db->rawSelect($sql, [$id]);

        if ($response['status'] >= 400)
            jsonResponse(['message' => 'Server error'], 500);
        jsonResponse($response['data'] ?? []);
    }


    if ($method === 'GET' && preg_match('#^/menus/([0-9]+)/items/?$#', $uri, $matches)) {
        $id = $matches[1];

        $sql = "
            SELECT mi.*, mti.display_order, mti.is_available
            FROM Vmenu_to_item mti
            JOIN Vmenu_items mi ON mti.item_id = mi.id
            WHERE mti.menu_id = ? AND mti.is_available = 1
            ORDER BY mti.display_order ASC
        ";

        $response = $db->rawSelect($sql, [$id]);

        if ($response['status'] >= 400)
            jsonResponse(['message' => 'Server error'], 500);

        jsonResponse($response['data']);
    }


    if ($method === 'GET' && preg_match('#^/menus/([0-9]+)/?$#', $uri, $matches)) {
        $id = $matches[1];
        $response = $db->select('Vmenus', ['id' => $id]);

        if (empty($response['data']))
            jsonResponse(['message' => 'Menu not found'], 404);
        jsonResponse($response['data'][0]);
    }


    if ($method === 'POST' && preg_match('#^/menus/?$#', $uri)) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        if (!$jwt->verify($token))
            jsonResponse(['message' => 'Unauthorized'], 401);

        $input = json_decode(file_get_contents('php://input'), true);
        $restaurant_id = $input['restaurant_id'] ?? null;
        $name = sanitizeInput($input['name'] ?? null);
        $description = sanitizeInput($input['description'] ?? null);

        if (!$restaurant_id || !$name) {
            jsonResponse(['message' => 'Restaurant ID and name are required.'], 400);
        }

        $res = $db->insert('Vmenus', [
            'restaurant_id' => $restaurant_id,
            'name' => $name,
            'description' => $description,
            'is_active' => 1
        ]);
    }


    if ($method === 'PUT' && preg_match('#^/menus/([0-9]+)/?$#', $uri, $matches)) {

        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        if (!$jwt->verify($token))
            jsonResponse(['message' => 'Unauthorized'], 401);

        $id = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);

        $updates = [];
        if (isset($input['name']))
            $updates['name'] = sanitizeInput($input['name']);
        if (isset($input['description']))
            $updates['description'] = sanitizeInput($input['description']);
        if (isset($input['is_active']))
            $updates['is_active'] = $input['is_active'];

        if (empty($updates))
            jsonResponse(['message' => 'No fields to update'], 400);

        $res = $db->update('Vmenus', $updates, ['id' => $id]);

        if ($res['status'] >= 400)
            jsonResponse(['message' => 'Server error updating menu'], 500);
        if (empty($res['data']))
            jsonResponse(['message' => 'Menu not found'], 404);

        jsonResponse(['message' => 'Menu updated successfully', 'menu' => $res['data'][0]]);
    }


    if ($method === 'DELETE' && preg_match('#^/menus/([0-9]+)/?$#', $uri, $matches)) {

        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);
        if (!$jwt->verify($token))
            jsonResponse(['message' => 'Unauthorized'], 401);

        $id = $matches[1];


        $res = $db->update('Vmenus', ['is_active' => 0], ['id' => $id]);

        if ($res['status'] >= 400)
            jsonResponse(['message' => 'Server error deleting menu'], 500);
        if (empty($res['data']))
            jsonResponse(['message' => 'Menu not found'], 404);

        jsonResponse(['message' => 'Menu deleted successfully']);
    }


    jsonResponse(['message' => 'Menu route not found', 'uri' => $uri, 'method' => $method], 404);
}
