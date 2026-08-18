-- UC-18.2, UC-19, UC-20 and UC-21 student learning state.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'lessons' and column_name = 'order_index'
  ) then
    alter table public.lessons add column order_index integer not null default 0;
    with ranked as (
      select id, row_number() over (partition by course_id order by created_at, id) - 1 as position
      from public.lessons
    )
    update public.lessons l set order_index = ranked.position from ranked where ranked.id = l.id;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'lessons' and column_name = 'is_final'
  ) then
    alter table public.lessons add column is_final boolean not null default false;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from public.quizzes group by lesson_id having count(*) > 1
  ) then
    raise exception 'Cannot enforce one quiz per lesson: duplicate quizzes exist.';
  end if;
  if exists (
    select 1 from public.reviews group by user_id, course_id having count(*) > 1
  ) then
    raise exception 'Cannot enforce one review per student/course: duplicates exist.';
  end if;
end $$;

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  watch_cycle integer not null default 0 check (watch_cycle >= 0),
  completed_at timestamptz,
  last_watched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  watch_cycle integer not null check (watch_cycle > 0),
  attempt_number integer not null check (attempt_number between 1 and 3),
  correct_count integer not null check (correct_count >= 0),
  question_count integer not null check (question_count > 0),
  score numeric(4,2) not null check (score between 0 and 10),
  passed boolean not null,
  answers jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, quiz_id, watch_cycle, attempt_number)
);

create unique index if not exists quizzes_lesson_id_unique on public.quizzes (lesson_id);
create unique index if not exists reviews_user_course_unique on public.reviews (user_id, course_id);
create index if not exists lesson_progress_course_user_idx on public.lesson_progress (course_id, user_id);
create index if not exists quiz_attempts_user_lesson_idx on public.quiz_attempts (user_id, lesson_id, created_at desc);
create index if not exists payments_user_success_paid_idx on public.payments (user_id, paid_at desc) where status = 'Success';
