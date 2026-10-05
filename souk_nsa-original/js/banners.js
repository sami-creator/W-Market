/* banners.js — المساحة القابلة للاستبدال من admin.html (تبقى صورة الحساب على اليمين) */
(function () {
  'use strict';
  let timer = null;

  function safeHref(u) { try { const x = new URL(u); return x.protocol === 'https:' ? x.toString() : null; } catch { return null; } }

  const Banners = {
    async mount(slot) {
      if (!slot) return;
      const fallback = () => { slot.replaceChildren(document.createTextNode(I18n.t('app.name'))); };
      fallback();
      let list = OfflineCache.get('banners');
      if (!list) {
        const { data } = await SB.db.from('banners').select('id,image_url,link,text,sort_order').eq('active', true).order('sort_order');
        list = data || []; OfflineCache.set('banners', list, 10 * 60 * 1000);
      }
      if (!list.length) return;
      let i = 0;
      const show = () => {
        const b = list[i % list.length]; slot.replaceChildren();
        const href = b.link ? safeHref(b.link) : null;
        const node = document.createElement(href ? 'a' : 'div');
        if (href) { node.href = href; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
        if (b.image_url) { const im = document.createElement('img'); im.alt = ''; im.src = b.image_url; im.addEventListener('error', fallback); node.append(im); }
        else node.textContent = b.text || I18n.t('app.name');
        slot.append(node); i++;
      };
      show();
      if (timer) clearInterval(timer);
      if (list.length > 1) timer = setInterval(show, 5000);
    }
  };
  window.Banners = Banners;
})();
