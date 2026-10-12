/* tracking.js — تتبع النقرات وزمن الصفحات بأقل استهلاك (دفعة واحدة عند مغادرة الصفحة) */
(function () {
  'use strict';
  let start = Date.now(), visible = document.visibilityState === 'visible', acc = 0, token = null, lastClick = { id: null, ts: 0 }, flushed = false;

  const Tracking = {
    async init() {
      const { data: { session } } = await SB.db.auth.getSession();
      token = session ? session.access_token : null;
      SB.db.auth.onAuthStateChange((_e, s) => { token = s ? s.access_token : null; });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') { acc += Date.now() - start; visible = false; this.flush(); }
        else { start = Date.now(); visible = true; flushed = false; }
      });
      window.addEventListener('pagehide', () => { if (visible) acc += Date.now() - start; this.flush(); });
    },

    // تسجيل نقرة (عد متكرر يزيد الرقم في الخادم). للزائر غير المسجل: بلا بيانات جغرافية
    async click(ad) {
      if (!ad || (lastClick.id === ad.id && Date.now() - lastClick.ts < 3000)) return;
      lastClick = { id: ad.id, ts: Date.now() };
      const p = Auth.state && Auth.state.profile;
      const row = { ad_id: ad.id, user_id: Auth.uid() || null };
      if (p) Object.assign(row, { wilaya_id: p.wilaya_id, daira_id: p.daira_id, commune_id: p.commune_id, age: Utils.ageFromYear(p.birth_year) });
      SB.db.from('clicks_raw').insert(row).then(({ error }) => { if (error) console.warn('[Tracking] click', error.message); });
      Interests.record('click', ad);
    },

    // زمن الصفحة: صف واحد لكل مغادرة (بدل إرسال دوري) لتوفير Bandwidth
    flush() {
      const sec = Math.round(acc / 1000);
      if (flushed || !Auth.uid() || !token || sec < 2) return;
      flushed = true; acc = 0;
      const env = window.__ENV__ || {};
      try {
        fetch(env.SUPABASE_URL + '/rest/v1/user_activity', {
          method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json', apikey: env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token, Prefer: 'return=minimal' },
          body: JSON.stringify({ user_id: Auth.uid(), page: Router.current(), duration: Math.min(sec, 3600), day: new Date().toISOString().slice(0, 10) })
        }).catch(() => {});
      } catch { /* ignore */ }
    }
  };
  window.Tracking = Tracking;
})();
