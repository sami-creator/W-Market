-- ================================================================
-- Migration: إضافة أعمدة AI لجدول ad_images + جدول image_search_logs
-- ================================================================

-- 1. أعمدة إضافية في ad_images
ALTER TABLE ad_images
  ADD COLUMN IF NOT EXISTS imagekit_file_id  TEXT,
  ADD COLUMN IF NOT EXISTS ai_description    TEXT,
  ADD COLUMN IF NOT EXISTS ai_tags           TEXT[];

-- فهرس على ai_tags لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_ad_images_ai_tags
  ON ad_images USING GIN (ai_tags);

-- 2. جدول تسجيل محاولات البحث بالصورة (تقييد 3/يوم/مستخدم)
CREATE TABLE IF NOT EXISTS image_search_logs (
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_date DATE    NOT NULL DEFAULT CURRENT_DATE,
  count       INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, search_date)
);

-- 3. دالة upsert لزيادة عداد المحاولات
CREATE OR REPLACE FUNCTION increment_image_search_log(p_user UUID, p_date DATE)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO image_search_logs (user_id, search_date, count)
  VALUES (p_user, p_date, 1)
  ON CONFLICT (user_id, search_date)
  DO UPDATE SET count = image_search_logs.count + 1;
END;
$$;

-- 4. دالة البحث بالكلمات المفتاحية
--    تُعيد معرفات الإعلانات مرتبة حسب عدد التطابقات تنازليًا
CREATE OR REPLACE FUNCTION search_by_image_tags(p_tags TEXT[])
RETURNS TABLE(ad_id UUID, match_count BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT ai.ad_id, COUNT(*) AS match_count
  FROM ad_images ai
  WHERE ai.ai_tags && p_tags   -- && = تقاطع مصفوفتين
    AND EXISTS (
      SELECT 1 FROM ads a
      WHERE a.id = ai.ad_id
        AND a.status = 'active'
    )
  GROUP BY ai.ad_id
  ORDER BY match_count DESC
  LIMIT 50;
$$;

-- RLS: المستخدمون يقرأون سجلاتهم فقط
ALTER TABLE image_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own logs"
  ON image_search_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user inserts own logs"
  ON image_search_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user updates own logs"
  ON image_search_logs FOR UPDATE
  USING (user_id = auth.uid());
