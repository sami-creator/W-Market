# DB_SCHEMA — ما يتوقعه الكود من قاعدة البيانات (أسماء حرفية)

> تنشئينها يدويًا في Supabase. الأنواع مقترحة. فعّلي RLS على **كل** جدول.
> إضافات لازمة: `postgis`، `pg_trgm`، `unaccent`، `pgcrypto`.

## 1) الجداول (العدد = عدد الأعمدة)
| الجدول | الأعمدة |
|---|---|
| `users` (20) | id uuid PK=auth.uid, email, name, avatar_url, gender ('male'/'female'), birth_year int, wilaya_id, daira_id, commune_id, phone, show_phone bool, facebook, instagram, tiktok, telegram, maps_url, is_verified bool=false, registration_complete bool=false, last_seen timestamptz, created_at |
| `wilayas` (3) | id, name_ar, name_fr |
| `dairas` (3) | id, wilaya_id, name |
| `communes` (3) | id, daira_id, name |
| `categories` (8) | id text PK (slug مثل `karakou`), parent_id, name_ar, name_fr, name_en, min_price, max_price, filters_schema jsonb |
| `ads` (28) | id uuid, user_id, category_id, subcategory_id, title, description, price bigint, discount_pct int, negotiable, delivery, show_phone, video_url, wilaya_id, daira_id, commune_id, location geography(Point,4326), attrs jsonb, faq jsonb, status ('active','paused','sold','deleted'), is_edited, price_edit_count int=0, click_count int=0, likes_count int=0, rating_avg numeric=0, rating_count int=0, created_at, updated_at, fts tsvector |
| `ad_images` (6) | id, ad_id, path_thumb, path_medium, path_large, position |
| `price_history` (5) | id, ad_id, old_price, new_price, changed_at |
| `likes` (4) | id, user_id, ad_id, created_at — UNIQUE(user_id, ad_id) |
| `ratings` (8) | id, user_id, target_type ('ad'/'user'), target_id uuid, stars 1..5, comment, device_id, created_at — FK user_id→users |
| `reports` (9) | id, reporter_id, target_type, target_id, reasons text[], note, device_id, status ('pending'/'reviewed'), created_at |
| `clicks_raw` (8) | id, ad_id, user_id null, wilaya_id, daira_id, commune_id, age, created_at |
| `clicks_daily` (6) | id, ad_id, day date, wilaya_id, age_range text, count |
| `conversations` (5) | id, ad_id, buyer_id, seller_id, created_at |
| `messages` (6) | id, conversation_id, sender_id, content (≤300), is_read, created_at |
| `blocks` (4) | id, blocker_id, blocked_id, created_at |
| `interest_scores` (5) | user_id, category_id, wilaya_id, score numeric, updated_at — PK(user_id, category_id, wilaya_id) |
| `notifications` (7) | id, user_id, type, ad_id, message, is_read, created_at |
| `alert_subscriptions` (7) | id, user_id, category_id (= id الصنف الفرعي), wilaya_id, min_price, max_price, created_at |
| `verification_requests` (10) | id, user_id, phone, id_front_path, id_back_path, status ('pending'/'accepted'/'rejected'), reject_reason, reference_no, created_at, reviewed_at |
| `device_fingerprints` (6) | id, user_id, device_id, screen, network, created_at — UNIQUE(user_id, device_id) |
| `onboarding_survey` (4) | id, user_id, source, created_at |
| `banners` (6) | id, image_url, link, text, active bool, sort_order |
| `error_logs` (6) | id, user_id null, page, message, device_model, created_at |
| `user_activity` (5) | id, user_id, page, duration int, day date |
| `search_cache` (5) | id, query text UNIQUE, json_result jsonb, hits int, created_at |
| `phone_otps` (جدول إضافي 27) | phone, user_id, code_hash, expires_at, attempts, created_at — لدوال OTP |

## 2) Views
- **`ads_feed`**: أعمدة `ads` الظاهرة + `thumb_path` (path_thumb للصورة position=0) + `user_name`, `user_avatar`, `is_verified` من `users`. الأعمدة المستعملة في الكود: id,user_id,title,price,discount_pct,negotiable,delivery,status,is_edited,thumb_path,category_id,subcategory_id,wilaya_id,daira_id,commune_id,user_name,user_avatar,is_verified,rating_avg,rating_count,likes_count,click_count,created_at.
- **`seller_public`**: id,name,avatar_url,is_verified,last_seen,show_phone, `phone` (تُرجَع فقط إن show_phone وis_verified، وإلا null), facebook,instagram,tiktok,telegram,maps_url, rating_avg,rating_count (متوسط ratings حيث target_type='user').

## 3) الدوال RPC (كلها SECURITY DEFINER عند الحاجة)
| الدالة | المعاملات → الناتج |
|---|---|
| `search_ad_ids` | (p_q text) → table(id): بحث موزون (العنوان > الوصف) مع unaccent/trgm، حد 200، `status='active'` |
| `home_feed` | (p_limit, p_offset) → setof ads_feed: 70% حسب `interest_scores` للمستخدم + 30% حديثة/عشوائية، الموثقون أولًا، `active` فقط |
| `suggest_terms` | (p_q) → table(term) |
| `did_you_mean` | (p_q) → table(term) (pg_trgm similarity) |
| `nearby_ads` | (p_lat,p_lng,p_limit,p_offset,p_filters jsonb) → ads_feed + distance_km (ST_Distance/1000) |
| `add_interest` | (p_category, p_wilaya, p_action): النقاط في الخادم: click1 like3 message5 buy_or_rate8 |
| `get_or_create_conversation` | (p_ad) → uuid؛ يرفض إن كان المستخدم صاحب الإعلان أو محظورًا |
| `my_conversations` | () → id, other_name, other_avatar, ad_title, last_message, unread |
| `block_status` | (p_conv) → blocked_by_me, blocked_me, other_id |
| `mark_read` | (p_conv) |
| `submit_rating` | (p_type,p_id,p_stars,p_comment,p_device): يرفع 'OWN_AD' للنفس، 'DEVICE_DONE' إن سبق للجهاز، 'ALREADY' إن سبق للحساب؛ يحدّث rating_avg/rating_count |
| `submit_report` | (p_type,p_id,p_reasons,p_note,p_device): مرة لكل (حساب/جهاز، هدف) وإلا 'ALREADY' |
| `mark_ad_sold` | (p_ad): للمالكة فقط، status='sold'، وإشعار للمعجبين |
| `profile_stats` | (p_user) → followers (0 حاليًا), ads_count, rating_avg, rating_count |
| `ad_stats` | (p_ad) → jsonb: `{totals:{clicks,likes,messages}, clicks_by_wilaya:[{wilaya_id,count}], clicks_by_age:[{age_range,count}], likes_by_wilaya, messages_by_wilaya}` (للمالكة فقط) |
| `request_phone_otp` / `verify_phone_otp` | (p_phone) / (p_phone,p_code) → boolean؛ الإرسال عبر مزوّدك (واتساب/Firebase) |
| `is_admin` | () → boolean (جدول/قائمة معرفات الأدمن أو claim) |
| `admin_overview` | () → json (users, ads, active_ads, reports_pending, verifications_pending) |
| `decay_interests` / `aggregate_clicks` | تعمل عبر cron-decay-aggregate |
| `orphan_image_paths` | (p_hours int) → setof text: كائنات `ad-images` بلا سجل في ad_images وأقدم من p_hours |

## 4) Triggers مقترحة
- `likes` insert/delete → تحديث `ads.likes_count`. `clicks_raw` insert → `ads.click_count += 1`.
- `alert_subscriptions` before insert → إن كان عدد تنبيهات المستخدم ≥ 3: `RAISE EXCEPTION 'ALERTS_MAX'`.
- `messages` before insert → رفض إن وُجد حظر بين الطرفين، وحد 300 حرف.
- إنشاء صف `users` تلقائيًا عند تسجيل جديد (اختياري، الكود يفعل upsert أيضًا).

## 5) RLS (الفكرة)
- `users`: قراءة الصف الذاتي فقط؛ التعديل لأعمدة محددة (`GRANT UPDATE(name,gender,birth_year,wilaya_id,daira_id,commune_id,show_phone,facebook,instagram,tiktok,telegram,maps_url,avatar_url,registration_complete,last_seen)`)، **ممنوع** is_verified/email/phone.
- `ads`: قراءة عامة للـ active/sold؛ `GRANT UPDATE(status)` فقط للمالكة، والإنشاء/التعديل الكامل عبر Edge Function (service role).
- `likes`, `alert_subscriptions`, `notifications`: كل مستخدم صفوفه فقط. `ratings`: قراءة عامة، حذف للمالكة فقط، إدراج عبر RPC.
- `clicks_raw`, `error_logs`, `user_activity`: INSERT فقط (لا قراءة) للجميع/المسجلين. `banners`: قراءة عامة للنشط، وكتابة للأدمن.
- `verification_requests`: إدراج الحساب لنفسه، وقراءة/تعديل للأدمن. `reports`, `error_logs`, `onboarding_survey`, `categories`(كتابة): للأدمن.

## 6) Storage Buckets
- `ad-images` (عام للقراءة): الرفع فقط إلى مجلد `auth.uid()/…`.
- `avatars` (عام للقراءة): الرفع إلى `auth.uid()/…`.
- `id-docs` (**خاص**): رفع المستخدم لمجلده، قراءة الأدمن (signed URL)، الحذف بـ service role.

## 7) Secrets للـ Edge Functions
`MISTRAL_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` (App Password), `CRON_SECRET`.
جدولة يومية (pg_cron أو Scheduled Functions): استدعاء `cron-decay-aggregate` و`cron-cleanup` مع الترويسة `x-cron-secret`.
Realtime: فعّلي النشر على `messages` و`notifications`.
