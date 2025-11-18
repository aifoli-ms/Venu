// src/supabaseClient.js
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const { SUPABASE_URL, SUPABASE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

module.exports = supabase