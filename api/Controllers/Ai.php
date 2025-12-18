<?php

// This file handles AI chat requests for "Alfred" by processing user input
// It gathers restaurant data, sends prompts to the Gemini AI, and returns the response
// It can also programmatically create reservations in the database if the AI requests it

function handleAiRequest($method, $uri)
{
    if (function_exists('console_log')) {
        console_log("Handling AI Request: $method $uri");
    }
    $db = new Database();
    $jwt = new JwtHelper();


    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $token = str_replace('Bearer ', '', $authHeader);

    $user = $jwt->verify($token);

    if (!$user) {
        if (function_exists('console_log'))
            console_log("AI Request: Unauthorized");
        jsonResponse(['message' => 'Unauthorized'], 401);
    }
    $userId = $user['userId'];


    if ($method === 'POST' && preg_match('#^/alfred/ask$#', $uri)) {
        $input = json_decode(file_get_contents('php://input'), true);
        $userInput = sanitizeInput($input['user_input'] ?? null);

        if (function_exists('console_log')) {
            console_log("Alfred Ask: User $userId prompted: " . substr($userInput, 0, 50) . "...");
        }

        if (!$userInput) {
            jsonResponse(['message' => 'Input required'], 400);
        }


        $restResp = $db->select('Vrestaurants', [], 'id,name,cuisine_type,location,price_range,average_rating');
        $restaurants = $restResp['data'] ?? [];


        $menuSql = "
            SELECT mi.name, mi.price, m.restaurant_id 
            FROM Vmenu_items mi 
            JOIN Vmenu_to_item mti ON mi.id = mti.item_id 
            JOIN Vmenus m ON mti.menu_id = m.id 
            WHERE m.is_active = 1 AND mti.is_available = 1
        ";
        $menuResp = $db->rawSelect($menuSql);
        $menuItems = $menuResp['data'] ?? [];

        $menusByRest = [];
        foreach ($menuItems as $item) {
            $rid = $item['restaurant_id'];
            if (!isset($menusByRest[$rid]))
                $menusByRest[$rid] = [];
            $menusByRest[$rid][] = $item;
        }

        $legend = "Price Ranges: ₵ (Budget), ₵₵ (Mid-Range), ₵₵₵ (Fine Dining)";
        $restContext = $legend . "\n\nList:\n";
        foreach ($restaurants as $r) {
            $price = $r['price_range'] ?? 'N/A';
            $rating = $r['average_rating'] ?? 'N/A';
            $restContext .= "- [ID: {$r['id']}] {$r['name']} ({$r['cuisine_type']}): {$r['location']}, Price: $price, Rating: $rating stars\n";


            if (isset($menusByRest[$r['id']])) {
                $restContext .= "  Menu Highlights: ";
                $highlights = [];
                $count = 0;
                foreach ($menusByRest[$r['id']] as $item) {
                    if ($count++ >= 5)
                        break;
                   
                    $highlights[] = "{$item['name']} ₵{$item['price']}";
                }
                $restContext .= implode(', ', $highlights) . "\n";
            }
        }


        $sql = "
             SELECT rv.rating, r.name as restaurant_name, r.cuisine_type 
             FROM Vreviews rv
             JOIN Vrestaurants r ON rv.restaurant_id = r.id
             WHERE rv.user_id = ?
             ORDER BY rv.created_at DESC
             LIMIT 5
        ";
        $reviewsResp = $db->rawSelect($sql, [$userId]);

        $prefContext = "User has not submitted reviews, base recommendations on general data.";
        if (!empty($reviewsResp['data'])) {
            $prefContext = "User Feedback:\n";
            foreach ($reviewsResp['data'] as $rev) {
                $rName = $rev['restaurant_name'] ?? 'Unknown';
                $rCuisine = $rev['cuisine_type'] ?? 'Unknown';
                $prefContext .= "- Rated $rName ($rCuisine) {$rev['rating']} stars.\n";
            }
        }


        $sql = "SELECT user_prompt, alfred_response FROM Vai_interactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5";
        $histResp = $db->rawSelect($sql, [$userId]);

        $chatContext = "This is the start of a new session.";
        if (!empty($histResp['data'])) {
            $history = array_reverse($histResp['data']);
            $chatContext = "Past Interactions:\n";
            foreach ($history as $h) {
                $chatContext .= "USER: {$h['user_prompt']}\nALFRED: {$h['alfred_response']}\n---\n";
            }
        }

        $systemInstruction = "
            You are Alfred, a sophisticated, friendly, and brief concierge for 'VENU', a restaurant reservation platform in Ghana.
            Current Time: " . date('Y-m-d H:i:s') . "
            -- CONTEXT --
            $restContext
            -- USER HISTORY --
            $prefContext
            -- PAST INTERACTIONS --
            $chatContext
            -- RULES --
            1. Recommend only from the provided restaurant list.
            2. Use the User Feedback to tailor recommendations.
            3. Keep answers short, friendly, and helpful (max 3 sentences).
            4. If the user wants to make a reservation, ask for any missing details (restaurant, date, time, party size) before calling the tool.
            5. Use the 'makeReservation' tool ONLY when you have all the necessary details.
        ";


        $apiKey = getenv('GEMINI_API_KEY');
        $geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey";

        $toolAuth = [
            'function_declarations' => [
                [
                    'name' => 'makeReservation',
                    'description' => 'Reserve a table at a restaurant.',
                    'parameters' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'restaurant_id' => ['type' => 'STRING', 'description' => 'ID of the restaurant'],
                            'date' => ['type' => 'STRING', 'description' => 'YYYY-MM-DD'],
                            'time' => ['type' => 'STRING', 'description' => 'HH:MM'],
                            'party_size' => ['type' => 'INTEGER', 'description' => 'Number of people']
                        ],
                        'required' => ['restaurant_id', 'date', 'time', 'party_size']
                    ]
                ]
            ]
        ];

        $payload = [
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => $systemInstruction . "\n\nUser Input: " . $userInput]]]
            ],
            'tools' => [$toolAuth],
            'generationConfig' => [
                'maxOutputTokens' => 500,
                'temperature' => 0.5
            ]
        ];

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'content' => json_encode($payload),
                'ignore_errors' => true
            ]
        ]);

        $geminiRaw = file_get_contents($geminiUrl, false, $context);
        $geminiErr = ($geminiRaw === false);

        if ($geminiErr) {
            jsonResponse(['message' => 'AI Service Unavailable'], 500);
        }

        $geminiResp = json_decode($geminiRaw, true);


        $reply = "I apologize, Alfred is currently unavailable.";
        $candidate = $geminiResp['candidates'][0] ?? null;

        if ($candidate) {
            $parts = $candidate['content']['parts'] ?? [];
            foreach ($parts as $part) {
                if (isset($part['functionCall'])) {

                    $fc = $part['functionCall'];
                    if ($fc['name'] === 'makeReservation') {
                        $args = $fc['args'];

                        $res = $db->insert('Vreservations', [
                            'user_id' => $userId,
                            'restaurant_id' => $args['restaurant_id'],
                            'reservation_date' => $args['date'],
                            'reservation_time' => $args['time'],
                            'party_size' => $args['party_size'],
                            'status' => 'Confirmed'
                        ]);

                        if ($res['status'] < 400) {
                            $reply = "I've successfully booked a table for {$args['party_size']} at the restaurant for {$args['date']} at {$args['time']}. Enjoy your meal!";
                        } else {
                            $reply = "I encountered an issue while trying to make that reservation.";
                        }
                    }
                } elseif (isset($part['text'])) {
                    $reply = $part['text'];
                }
            }
        }


        $db->insert('Vai_interactions', [
            'user_id' => $userId,
            'user_prompt' => $userInput,
            'alfred_response' => $reply
        ]);

        jsonResponse(['reply' => $reply]);
    }
}