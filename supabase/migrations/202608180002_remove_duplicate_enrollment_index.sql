-- The baseline schema already provides enrollments_user_id_course_id_key.
-- Keep a single unique index for (user_id, course_id).
drop index if exists public.enrollments_user_course_unique;
