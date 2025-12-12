<?php

class RateLimiter
{
    private $db;

    public function __construct()
    {
        $this->db = new Database();
    }

    /**
     * Check if the request is blocked.
     * Does NOT increment the counter.
     * 
     * @param string $ip The IP address.
     * @param string $endpoint The endpoint identifier.
     * @param int $limit Max requests allowed.
     * @param int $windowSeconds Time window in seconds.
     * @return bool True if blocked, False if allowed.
     */
    public function isBlocked($ip, $endpoint, $limit, $windowSeconds)
    {
        $result = $this->db->select('Vrate_limits', [
            'ip_address' => $ip,
            'endpoint' => $endpoint
        ]);

        if (empty($result['data'])) {
            return false;
        }

        $record = $result['data'][0];
        $currentTime = time();
        $elapsed = $currentTime - $record['window_start'];

        if ($elapsed > $windowSeconds) {
            // Window expired, not blocked.
            // We lazily let the next increment reset it.
            return false;
        }

        if ($record['requests'] >= $limit) {
            return true;
        }

        return false;
    }

    /**
     * Increment the failed attempt counter.
     * 
     * @param string $ip
     * @param string $endpoint
     * @param int $windowSeconds needed to know when to reset if record exists but old
     */
    public function increment($ip, $endpoint, $windowSeconds = 900)
    {
        $currentTime = time();

        $result = $this->db->select('Vrate_limits', [
            'ip_address' => $ip,
            'endpoint' => $endpoint
        ]);

        if (empty($result['data'])) {
            $this->db->insert('Vrate_limits', [
                'ip_address' => $ip,
                'endpoint' => $endpoint,
                'requests' => 1,
                'window_start' => $currentTime
            ]);
            return;
        }

        $record = $result['data'][0];
        $elapsed = $currentTime - $record['window_start'];

        if ($elapsed > $windowSeconds) {
            // Reset
            $this->db->update('Vrate_limits', [
                'requests' => 1,
                'window_start' => $currentTime
            ], ['id' => $record['id']]);
        } else {
            // Increment
            $this->db->query("UPDATE Vrate_limits SET requests = requests + 1 WHERE id = ?", [$record['id']]);
        }
    }

    /**
     * Clear the counter (e.g. on successful login).
     */
    public function clear($ip, $endpoint)
    {
        $this->db->delete('Vrate_limits', [
            'ip_address' => $ip,
            'endpoint' => $endpoint
        ]);
    }
}
