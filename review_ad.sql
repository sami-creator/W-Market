-- مراجعة الإعلانات (review-ad): جدول السجل + دالة حجز الحصة اليومية (3 طلبات / 24 ساعة لكل مستخدم)

create table if not exists public.ad_reviews (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  category_id    text,
  subcategory_id text,
  result         jsonb
);

create index if not exists ad_reviews_user_time_idx on public.ad_reviews (user_id, created_at desc);

-- لا سياسات = لا وصول من الواجهة؛ الدالة تعمل بمفتاح الخدمة فقط
alter table public.ad_reviews enable row level security;

-- يحجز طلبًا إن كان العدد خلال آخر 24 ساعة أقل من الحد؛ القفل يمنع تجاوز الحد بطلبات متزامنة
create or replace function public.claim_ad_review(p_user uuid, p_limit int default 3)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  used int;
  rid  uuid;
begin
  perform pg_advisory_xact_lock(hashtext('ad_review:' || p_user::text));
  select count(*) into used from public.ad_reviews
   where user_id = p_user and created_at > now() - interval '24 hours';
  if used >= p_limit then
    return jsonb_build_object('allowed', false, 'remaining', 0);
  end if;
  insert into public.ad_reviews (user_id) values (p_user) returning id into rid;
  return jsonb_build_object('allowed', true, 'remaining', p_limit - used - 1, 'review_id', rid);
end;
$$;

revoke all on function public.claim_ad_review(uuid, int) from public, anon, authenticated;
grant execute on function public.claim_ad_review(uuid, int) to service_role;
