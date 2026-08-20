-- Move UC-20 state into enrollments so no extra progress/attempt tables remain.
begin;

alter table public.quizzes add column if not exists passing_score integer;
alter table public.quizzes add column if not exists max_attempts integer;

update public.quizzes
set passing_score = 40
where passing_score is null or passing_score < 1 or passing_score > 100;

update public.quizzes
set max_attempts = 3
where max_attempts is null or max_attempts < 1;

alter table public.quizzes alter column passing_score set default 40;
alter table public.quizzes alter column passing_score set not null;
alter table public.quizzes alter column max_attempts set default 3;
alter table public.quizzes alter column max_attempts set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quizzes_passing_score_check') then
    alter table public.quizzes
      add constraint quizzes_passing_score_check check (passing_score between 1 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quizzes_max_attempts_check') then
    alter table public.quizzes
      add constraint quizzes_max_attempts_check check (max_attempts >= 1);
  end if;
end $$;

alter table public.enrollments add column if not exists learning_state jsonb;
update public.enrollments
set learning_state = '{"lessons": {}}'::jsonb
where learning_state is null;
alter table public.enrollments alter column learning_state set default '{"lessons": {}}'::jsonb;
alter table public.enrollments alter column learning_state set not null;

do $$
begin
  if to_regclass('public.lesson_progress') is not null then
    update public.enrollments e
    set learning_state = jsonb_build_object(
      'lessons',
      coalesce((
        select jsonb_object_agg(
          lp.lesson_id::text,
          jsonb_strip_nulls(jsonb_build_object(
            'completed_at', lp.completed_at,
            'last_watched_at', lp.last_watched_at,
            'watch_cycle', lp.watch_cycle
          )) || case when q.id is null then '{}'::jsonb else jsonb_build_object(
            'quiz', jsonb_strip_nulls(jsonb_build_object(
              'quiz_id', q.id::text,
              'watch_cycle', lp.watch_cycle,
              'attempts_used', case when to_regclass('public.quiz_attempts') is null then 0 else (
                select count(*) from public.quiz_attempts qa
                where qa.user_id = e.user_id
                  and qa.quiz_id = q.id
                  and qa.watch_cycle = lp.watch_cycle
              ) end,
              'passed', case when to_regclass('public.quiz_attempts') is null then false else coalesce((
                select bool_or(qa.passed) from public.quiz_attempts qa
                where qa.user_id = e.user_id
                  and qa.quiz_id = q.id
                  and qa.watch_cycle = lp.watch_cycle
              ), false) end,
              'last_score', case when to_regclass('public.quiz_attempts') is null then null else (
                select qa.score from public.quiz_attempts qa
                where qa.user_id = e.user_id
                  and qa.quiz_id = q.id
                  and qa.watch_cycle = lp.watch_cycle
                order by qa.created_at desc
                limit 1
              ) end
            ))
          ) end
        )
        from public.lesson_progress lp
        left join public.quizzes q on q.lesson_id = lp.lesson_id
        where lp.user_id = e.user_id and lp.course_id = e.course_id
      ), '{}'::jsonb)
    );
  end if;
end $$;

with duplicate_certificates as (
  select
    id,
    row_number() over (
      partition by user_id, course_id
      order by issued_date nulls last, created_at nulls last, id
    ) as duplicate_number
  from public.certificates
)
delete from public.certificates c
using duplicate_certificates duplicate
where c.id = duplicate.id and duplicate.duplicate_number > 1;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'certificates'
      and indexdef like 'CREATE UNIQUE INDEX%'
      and indexdef like '%(user_id, course_id)%'
  ) then
    create unique index certificates_user_course_unique
      on public.certificates (user_id, course_id);
  end if;
end $$;

with eligible as (
  select e.user_id, e.course_id, gen_random_uuid() as certificate_id
  from public.enrollments e
  where exists (select 1 from public.lessons l where l.course_id = e.course_id)
    and not exists (
      select 1
      from public.lessons l
      where l.course_id = e.course_id
        and coalesce(e.learning_state -> 'lessons' -> l.id::text ->> 'completed_at', '') = ''
    )
    and not exists (
      select 1
      from public.lessons l
      join public.quizzes q on q.lesson_id = l.id
      where l.course_id = e.course_id
        and coalesce((e.learning_state -> 'lessons' -> l.id::text -> 'quiz' ->> 'passed')::boolean, false) = false
    )
    and not exists (
      select 1 from public.certificates c
      where c.user_id = e.user_id and c.course_id = e.course_id
    )
)
insert into public.certificates (
  id, certificate_url, issued_date, user_id, course_id, created_at, updated_at
)
select
  certificate_id,
  '/api/learning/certificates/' || certificate_id || '/download',
  now(),
  user_id,
  course_id,
  now(),
  now()
from eligible;

drop table if exists public.quiz_attempts;
drop table if exists public.lesson_progress;

commit;
