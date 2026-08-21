alter table public.courses
  add column if not exists rejection_reason text;

alter table public.courses
  drop constraint if exists courses_rejection_reason_length_check;

alter table public.courses
  add constraint courses_rejection_reason_length_check
  check (rejection_reason is null or char_length(rejection_reason) <= 1000);
