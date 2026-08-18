-- Store VNPay order state in the existing per-course payments table.
-- Every course in one checkout shares checkout_ref.
alter table public.payments
  add column if not exists checkout_ref varchar(100),
  add column if not exists provider_transaction_no varchar(50),
  add column if not exists provider_response_code varchar(10),
  add column if not exists paid_at timestamptz,
  add column if not exists expires_at timestamptz;

update public.payments
set status = 'Success'
where status is null;

alter table public.payments
  alter column status set default 'Pending',
  alter column status set not null;

create unique index if not exists payments_checkout_course_unique
  on public.payments (checkout_ref, course_id)
  where checkout_ref is not null;

-- Prevent two active VNPay orders from purchasing the same course for one user.
create unique index if not exists payments_pending_user_course_unique
  on public.payments (user_id, course_id)
  where payment_method = 'VNPay' and status = 'Pending';
