alter table public.lessons
  add column if not exists can_skip boolean not null default false;

comment on column public.lessons.can_skip is
  'Allows students to seek freely in this lesson video, including required rewatches.';
