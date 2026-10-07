/* ad-details.js — صفحة الإعلان: معرض، سعر، ناشرة، تواصل، أسئلة شائعة، تقييمات، منتجات مشابهة، مشاركة */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k), R = window.CONFIG.ROUTES;
  const $ = s => document.querySelector(s);
  const ONLINE_MS = 5 * 60 * 1000;

  function safeLink(u) { try { const x = new URL(u); return x.protocol === 'https:' ? x.toString() : null; } catch { return null; } }

  // زر المشاركة: نسخ الرابط أو Web Share API
  function shareAd(ad) {
    const url = location.href;
    const text = ad.title + ' — souk nsa';
    if (navigator.share) {
      navigator.share({ title: text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => UI.toastKey('ad.link_copied', 'success')).catch(() => {
        prompt(t('ad.copy_link'), url);
      });
    }
  }

  // بناء قسم المنتجات المشابهة
  async function renderSimilar(ad, container) {
    try {
      const { data } = await SB.db.from('ads_feed')
        .select(Ads.LIST_COLS)
        .eq('status', 'active')
        .eq('category_id', ad.category_id)
        .neq('id', ad.id)
        .limit(6);
      if (!data || !data.length) return;
      const section = el('div', { class: 'similar-section' });
      section.append(el('h3', { text: t('ad.similar') }));
      const grid = el('div', { class: 'similar-grid' });
      data.forEach(a => {
        const p = Price.display(a);
        const card = el('div', { class: 'similar-card' });
        card.append(
          el('img', { src: Utils.imgUrl(a.thumb_path, 'thumb'), alt: a.title, loading: 'lazy' }),
          el('div', { class: 'similar-card__body' }, [
            el('div', { class: 'similar-card__title', text: a.title }),
            el('div', { class: 'similar-card__price', text: p.text })
          ])
        );
        card.addEventListener('click', () => Utils.go(R.AD, { id: a.id }));
        grid.append(card);
      });
      section.append(grid);
      container.append(section);
    } catch (e) { console.warn('[Similar]', e); }
  }

  App.pages['ad-details'] = async function () {
    await App.boot();
    const id = Utils.qs('id');
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return Utils.go(R.HOME);
    await Promise.all([Categories.load(), Geo.load()]);
    const info = $('#info');
    let ad;
    try { ad = await Ads.get(id); } catch (e) { console.error('[AdDetails]', e); }
    if (!ad || ad.status === 'deleted') return UI.emptyState($('#gallery'), 'ad.unavailable', 'empty.sub');
    document.title = ad.title + ' — souk nsa';

    const [imgs, hist, sellerRes] = await Promise.all([
      Ads.images(id), Ads.priceHistory(id),
      SB.db.from('seller_public').select('*').eq('id', ad.user_id).maybeSingle()
    ]);
    const seller = sellerRes.data || {};
    const mine = Auth.uid() === ad.user_id, sold = ad.status === 'sold', paused = ad.status === 'paused';
    Gallery.mount($('#gallery'), imgs);

    const p = Price.display(ad);
    const badges = el('div', { class: 'row', style: 'flex-wrap:wrap' }, [
      p.pct > 0 ? el('span', { class: 'badge badge--sale', text: '-' + p.pct + '%' }) : null,
      ad.negotiable ? el('span', { class: 'badge badge--nego', text: t('ad.negotiable') }) : null,
      ad.negotiable === false ? el('span', { class: 'badge badge--fixed', text: t('ad.fixed_price') }) : null,
      ad.is_edited ? el('span', { class: 'badge badge--edited', text: t('ad.edited') }) : null,
      ad.delivery ? el('span', { class: 'badge badge--nego', text: t('ad.delivery_yes') }) : null,
      sold ? el('span', { class: 'badge badge--sale', text: t('ad.sold') }) : null
    ]);
    const priceLine = el('div', { class: 'price-line' }, [
      el('span', { class: 'big', text: p.text }), p.old ? el('span', { class: 'card__old', text: p.oldText }) : null,
      el('span', { class: 'hint', text: p.santim })
    ]);
    const oldPrices = hist.length ? el('div', {}, [el('b', { text: t('ad.old_prices') }), el('ul', { class: 'price-hist' }, hist.map(h => el('li', { text: Utils.formatPrice(h.old_price) + ' → ' + Utils.formatPrice(h.new_price) + ' · ' + Utils.formatDate(h.changed_at) })))]) : null;
    const attrs = Object.entries(ad.attrs || {}).map(([k, v]) => el('span', { class: 'tag', text: k + ': ' + v }));
    const loc = [ad.wilaya_id && Geo.label(Geo.wilaya(ad.wilaya_id)), ad.daira_id && Geo.label(Geo.daira(ad.daira_id)), ad.commune_id && Geo.label(Geo.commune(ad.commune_id))].filter(Boolean).join(' · ');

    // أزرار الإجراءات
    const like = el('button', { class: 'btn btn--ghost like-btn', style: 'position:static;width:auto;border-radius:12px', type: 'button', 'data-like': ad.id }, '♥');
    like.addEventListener('click', () => Likes.toggle(ad, like));
    like.disabled = sold || mine;
    const chatBtn = el('button', { class: 'btn btn--primary', type: 'button', onclick: () => Chat.start(ad.id, ad.user_id) }, t('ad.chat'));
    const orderBtn = el('button', { class: 'btn btn--ghost', type: 'button' }, t('ad.order'));
    orderBtn.addEventListener('click', async () => {
      await Auth.ready(); if (!Auth.isLogged()) return Router.toLogin();
      const { data, error } = await SB.db.rpc('get_or_create_conversation', { p_ad: ad.id });
      if (error) return UI.toastKey(UI.errKey(error), 'error');
      await SB.db.from('messages').insert({ conversation_id: data, sender_id: Auth.uid(), content: t('ad.order_msg') });
      Utils.go(R.CHAT, { c: data });
    });
    const report = el('button', { class: 'btn btn--ghost', type: 'button', onclick: () => Reports.openMenu(ad.id, ad.user_id) }, t('report.title'));

    // زر المشاركة
    const shareBtn = el('button', { class: 'share-btn', type: 'button' }, '↗ ' + t('ad.share'));
    shareBtn.addEventListener('click', () => shareAd(ad));

    const actions = el('div', { class: 'detail-actions' }, mine
      ? [el('a', { class: 'btn btn--primary', href: R.POST + '?id=' + ad.id, text: t('ad.edit') }), el('a', { class: 'btn btn--ghost', href: R.STATS + '?id=' + ad.id, text: t('ad.stats') }), shareBtn]
      : (sold || paused) ? [report, shareBtn] : [chatBtn, orderBtn, like, report, shareBtn]);

    // الناشرة والتواصل
    const online = seller.last_seen && (Date.now() - new Date(seller.last_seen).getTime() < ONLINE_MS);
    const links = [];
    if (ad.show_phone && seller.show_phone && seller.phone) links.push(el('a', { href: 'tel:' + seller.phone.replace(/[^\d+]/g, ''), text: '📞 ' + seller.phone }));
    if (ad.show_phone && seller.show_phone && seller.phone) { const d = seller.phone.replace(/\D/g, ''); links.push(el('a', { href: 'https://wa.me/' + (d.startsWith('0') ? '213' + d.slice(1) : d), target: '_blank', rel: 'noopener noreferrer', text: 'WhatsApp' })); }
    [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['telegram', 'Telegram'], ['maps_url', 'Maps']].forEach(([k, n]) => {
      const u = seller[k] && safeLink(seller[k]); if (u) links.push(el('a', { href: u, target: '_blank', rel: 'noopener noreferrer', text: n }));
    });
    const sellerCard = el('div', { class: 'card-box' }, [
      el('div', { class: 'row' }, [
        el('img', { class: 'avatar', style: 'width:52px;height:52px', src: Utils.imgUrl(seller.avatar_url || 'assets/images/avatar.svg', 'thumb'), alt: '' }),
        el('div', { class: 'grow' }, [
          el('b', {}, [seller.name || '', seller.is_verified ? el('span', { class: 'verified-tick', text: ' ✓' }) : null]),
          el('div', { class: 'hint' }, [el('span', { class: 'presence' + (online ? ' on' : '') }), online ? t('ad.online') : (seller.last_seen ? t('ad.last_seen') + ' ' + Utils.timeAgo(seller.last_seen) : '')])
        ]),
        el('span', { class: 'stars', text: '★ ' + Number(seller.rating_avg || 0).toFixed(1) })
      ]),
      links.length ? el('div', { class: 'contact-links', style: 'margin-top:8px' }, links) : null
    ]);

    const faq = (ad.faq || []).length ? el('div', {}, [el('h3', { text: t('ad.faq') }), ...ad.faq.map(q => el('div', { class: 'faq-item' }, [el('b', { text: q.q }), el('span', { text: q.a })]))]) : null;
    const video = ad.video_url && safeLink(ad.video_url) ? el('a', { class: 'btn btn--ghost', href: safeLink(ad.video_url), target: '_blank', rel: 'noopener noreferrer', text: '▶ ' + t('ad.video') }) : null;

    info.replaceChildren(...[
      el('h1', { class: 'page-title', text: ad.title }), badges, priceLine, actions,
      el('div', { class: 'hint', text: Categories.path(ad.category_id, ad.subcategory_id) }),
      attrs.length ? el('div', { class: 'row', style: 'flex-wrap:wrap;margin:8px 0' }, attrs) : null,
      el('p', { class: 'prose', text: ad.description }), video, oldPrices, faq,
      el('div', { class: 'hint', text: '📍 ' + loc }),
      el('div', { class: 'hint', text: t('ad.published_on') + ' ' + Utils.formatDate(ad.created_at) }),
      sellerCard].filter(Boolean));
    Likes.load().then(() => Likes.paint(info));

    // المنتجات المشابهة تحت الإعلان
    await renderSimilar(ad, info);

    // التقييمات: للإعلان وللناشرة
    if (!sold) {
      Ratings.mount($('#ratings-ad'), { type: 'ad', id: ad.id, ownerId: ad.user_id });
      Ratings.mount($('#ratings-user'), { type: 'user', id: ad.user_id, ownerId: ad.user_id });
    }
    console.log('[AdDetails] ready', id);
  };
})();
