-- Course management, cart/checkout integrity, revenue queries and review replies.
alter table public.courses
  alter column description type text;

alter table public.reviews
  add column if not exists instructor_reply text,
  add column if not exists replied_at timestamptz;

create unique index if not exists carts_user_id_unique
  on public.carts (user_id);

create unique index if not exists cart_items_cart_course_unique
  on public.cart_items (cart_id, course_id);

create unique index if not exists enrollments_user_course_unique
  on public.enrollments (user_id, course_id);

create index if not exists courses_instructor_updated_idx
  on public.courses (instructor_id, updated_at desc);

create index if not exists courses_category_id_idx
  on public.courses (category_id);

create index if not exists cart_items_course_id_idx
  on public.cart_items (course_id);

create index if not exists payments_user_id_idx
  on public.payments (user_id);

create index if not exists payments_course_status_created_idx
  on public.payments (course_id, status, created_at);

create index if not exists reviews_course_created_idx
  on public.reviews (course_id, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'courses_price_nonnegative'
      and conrelid = 'public.courses'::regclass
  ) then
    alter table public.courses
      add constraint courses_price_nonnegative check (price >= 0);
  end if;
end $$;
