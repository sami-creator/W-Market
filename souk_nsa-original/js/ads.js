/* ads.js — جلب الإعلانات وإجراءات صاحبة الإعلان (كل الفحوص تتكرر في RLS/Edge) */
(function () {
  'use strict';
  const LIST_COLS = 'id,user_id,title,price,discount_pct,negotiable,delivery,status,is_edited,thumb_path,category_id,subcategory_id,wilaya_id,daira_id,commune_id,user_name,user_avatar,is_verified,rating_avg,rating_count,likes_count,click_count,created_at';
  const PS = () => window.CONFIG.LIMITS.PAGE_SIZE;

  function applyFilters(q, f) {
    if (f.category_id) q = q.eq('category_id', f.category_id);
    if (f.subcategory_id) q = q.eq('subcategory_id', f.subcategory_id);
    if (f.wilaya_ids && f.wilaya_ids.length) q = q.in('wilaya_id', f.wilaya_ids);
    if (f.daira_ids && f.daira_ids.length) q = q.in('daira_id', f.daira_ids);
    if (f.commune_ids && f.commune_ids.length) q = q.in('commune_id', f.commune_ids);
    if (f.min_price) q = q.gte('price', f.min_price);
    if (f.max_price) q = q.lte('price', f.max_price);
    if (f.delivery) q = q.eq('delivery', true);
    if (f.verified_only) q = q.eq('is_verified', true);
    if (f.attrs && Object.keys(f.attrs).length) q = q.contains('attrs', f.attrs);
    return q;
  }

  function applySort(q, f) {
    const asc = f.order === 'asc';
    switch (f.sort) {
      case 'views': return q.order('click_count', { ascending: asc });
      case 'rating': return q.order('rating_avg', { ascending: asc }).order('rating_count', { ascending: asc });
      case 'price': return q.order('price', { ascending: asc });
      case 'new': return q.order('created_at', { ascending: asc });
      // الترتيب الافتراضي: الموثقون أولًا ثم الأحدث (فقط عند عدم اختيار ترتيب)
      default: return q.order('is_verified', { ascending: false }).order('created_at', { ascending: false });
    }
  }

  const Ads = {
    LIST_COLS,
    // f: حالة الفلاتر، page: يبدأ من 0
    async list(f = {}, page = 0) {
      const from = page * PS(), to = from + PS() - 1;
      let ids = null, rank = null;
      if (f.q) {
        const { data, error } = await SB.db.rpc('search_ad_ids', { p_q: f.q });
        if (error) console.error('[Ads] search', error);
        ids = (data || []).map(r => r.id); rank = new Map(ids.map((id, i) => [id, i]));
        if (!ids.length) return { items: [], hasMore: false };
      }
      let q = SB.db.from('ads_feed').select(LIST_COLS).eq('status', 'active');
      if (ids) q = q.in('id', ids);
      q = applyFilters(q, f);
      if (!ids || f.sort) q = applySort(q, f);
      const { data, error } = ids && !f.sort ? await q.limit(200) : await q.range(from, to);
      if (error) throw error;
      let items = data || [];
      if (ids && !f.sort) { items.sort((a, b) => rank.get(a.id) - rank.get(b.id)); items = items.slice(from, to + 1); }
      return { items, hasMore: (data || []).length >= PS() };
    },

    // الصفحة الرئيسية المخصصة: 70% حسب الاهتمامات + 30% حديثة/عشوائية (RPC)
    async home(page = 0) {
      if (!Auth.uid()) return this.list({}, page);
      const { data, error } = await SB.db.rpc('home_feed', { p_limit: PS(), p_offset: page * PS() });
      if (error) { console.error('[Ads] home_feed', error); return this.list({}, page); }
      return { items: data || [], hasMore: (data || []).length >= PS() };
    },

    // الأقرب مني عبر Edge Function (PostGIS من جهة الخادم، الإحداثيات لا تُكشف)
    async nearby(coords, f = {}, page = 0) {
      const { data, error } = await SB.fn('nearby-ads', { lat: coords.lat, lng: coords.lng, page, filters: f });
      if (error || !data) throw error || new Error('nearby failed');
      return { items: data.items || [], hasMore: !!data.hasMore };
    },

    async get(id) {
      const { data, error } = await SB.db.from('ads').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },
    async images(adId) {
      const { data } = await SB.db.from('ad_images').select('path_thumb,path_medium,path_large,position').eq('ad_id', adId).order('position');
      return data || [];
    },
    async priceHistory(adId) {
      const { data } = await SB.db.from('price_history').select('old_price,new_price,changed_at').eq('ad_id', adId).order('changed_at', { ascending: false });
      return data || [];
    },
    async mine() {
      const { data, error } = await SB.db.from('ads').select('id,title,price,status,is_edited,price_edit_count,click_count,likes_count,created_at,category_id,subcategory_id').eq('user_id', Auth.uid()).neq('status', 'deleted').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async setStatus(id, status) {
      if (!['active', 'paused'].includes(status)) return { error: 'invalid' };
      return SB.db.from('ads').update({ status }).eq('id', id).eq('user_id', Auth.uid());
    },
    async markSold(id) { return SB.db.rpc('mark_ad_sold', { p_ad: id }); },
    async remove(id) { return SB.db.from('ads').update({ status: 'deleted' }).eq('id', id).eq('user_id', Auth.uid()); }
  };
  window.Ads = Ads;
})();
