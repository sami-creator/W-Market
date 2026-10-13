-- جدول Rate Limit للمساعد الذكي
-- يتم تنظيفه تلقائيًا بـ pg_cron أو عبر DELETE في Edge Function

create table if not exists public.agent_rate_logs (
  id          bigserial primary key,
  user_ref    text        not null,  -- user_id أو fingerprint
  created_at  timestamptz not null default now()
);

-- index للاستعلامات السريعة
create index if not exists agent_rate_logs_user_ref_idx
  on public.agent_rate_logs (user_ref, created_at desc);

-- تنظيف السجلات الأقدم من يومين (لتوفير المساحة)
-- يمكن تشغيلها يدويًا أو جدولتها بـ pg_cron
-- delete from public.agent_rate_logs where created_at < now() - interval '2 days';

-- Row Level Security — Edge Function تستخدم service_role فقط
alter table public.agent_rate_logs enable row level security;

-- لا يستطيع المستخدم العادي القراءة أو الكتابة مباشرة
create policy "no_public_access" on public.agent_rate_logs
  for all using (false);
