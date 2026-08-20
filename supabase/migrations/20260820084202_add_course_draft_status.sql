alter table public.courses
  alter column status set default 'Draft',
  alter column status set not null;

alter table public.courses
  drop constraint if exists courses_status_check;

alter table public.courses
  add constraint courses_status_check
  check (status in ('Draft', 'Pending', 'Approved', 'Rejected', 'Hidden'));
