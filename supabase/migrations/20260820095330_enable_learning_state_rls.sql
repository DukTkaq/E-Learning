-- These learning tables are accessed by the server through its database connection.
-- Keep them unavailable through Supabase's public Data API.
alter table public.lesson_progress enable row level security;
alter table public.quiz_attempts enable row level security;
