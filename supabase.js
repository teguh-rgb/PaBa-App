import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://kpfhyuhfzhgnxjfndxhh.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZmh5dWhmemhnbnhqZm5keGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MTY4NzMsImV4cCI6MjEwODM5Mjg3M30.tCz27OLRzdFeJ-ikTbW1PRVXCDp77OhbhEoGjFWY9vk';

if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
    throw new Error('Supabase anon key tidak valid.');
}

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);