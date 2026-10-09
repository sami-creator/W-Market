/* ad-details.js — صفحة الإعلان بتصميم prototype: معرض، شريط أيقونات، ناشرة قابلة للضغط، تواصل، مشابهة، مشاركة، إبلاغ */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k), R = window.CONFIG.ROUTES;
  const $ = s => document.querySelector(s);
  const ONLINE_MS = 5 * 60 * 1000;
  const NS = 'http://www.w3.org/2000/svg';

  function safeLink(u) { try { const x = new URL(u); return x.protocol === 'https:' ? x.toString() : null; } catch { return null; } }
  const svg = (inner, attrs = {}) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v)); s.innerHTML = inner; return s; };
  const lineIcon = inner => svg(inner, { fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

  // أيقونات التواصل: دوائر ملونة بشعارات مبسّطة
  const BRAND = {
    chat: ['var(--c-primary)', '<path d="M7 9h10M7 13h6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'],
    whatsapp: ['#25D366', '<path d="M8.5 7.5c-.6.6-.9 1.6-.3 2.9.9 1.9 2.6 3.4 4.4 4.1 1.1.4 1.9 0 2.4-.6l.3-.7-1.6-.8-.6.6c-.6-.2-1.8-1.1-2.1-1.9l.5-.6-.7-1.6-.8.2z" fill="#fff"/>'],
    phone: ['#4B5563', '<path d="M8.5 7.5l1.4 2.4-1 1c.7 1.4 1.7 2.4 3 3l1-1 2.4 1.4c-.3 1.2-1.3 1.7-2.4 1.5-3-.6-5.6-3.2-6.2-6.2-.2-1.1.3-2.1 1.8-2.1z" fill="#fff"/>'],
    facebook: ['#1877F2', '<path d="M13.5 18v-5h1.8l.3-2h-2.1V9.7c0-.6.2-1 1-1h1.1V7c-.2 0-.9-.1-1.6-.1-1.6 0-2.7 1-2.7 2.7V11H9.5v2h1.8v5z" fill="#fff"/>'],
    instagram: ['#E1306C', '<rect x="7" y="7" width="10" height="10" rx="3" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="2.4" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="15" cy="9" r=".8" fill="#fff"/>'],
    tiktok: ['#111', '<path d="M13 7v7.2a2.2 2.2 0 1 1-2-2.2M13 7c.3 1.6 1.4 2.6 3 2.8" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>'],
    telegram: ['#229ED9', '<path d="M17 8l-1.6 8.2c-.1.5-.5.7-.9.4l-2.5-1.8-1.2 1.2c-.1.1-.3.2-.5.2l.2-2.6 4.8-4.3c.2-.2 0-.3-.3-.1l-5.9 3.7-2.5-.8c-.5-.2-.5-.5.1-.7L16.1 7.1c.5-.2.9.1.9.9z" fill="#fff"/>'],
    maps: ['#EA4335', '<path d="M12 6.5a3.8 3.8 0 0 0-3.8 3.8c0 2.7 3.8 6.7 3.8 6.7s3.8-4 3.8-6.7A3.8 3.8 0 0 0 12 6.5z" fill="#fff"/><circle cx="12" cy="10.3" r="1.4" fill="#EA4335"/>']
  };
  function brandBtn(name, attrs, label) {
    const [bg, inner] = BRAND[name];
    const node = el(attrs.href ? 'a' : 'button', Object.assign({ class: 'icon-btn', title: label, 'aria-label': label, type: attrs.href ? null : 'button' }, attrs));
    node.append(svg('<circle cx="12" cy="12" r="11" fill="' + bg + '"/>' + inner));
    return node;
  }

  // أرقام الوصف بخط عريض (كما في prototype)
  function boldNumbers(text) {
    const f = document.createDocumentFragment();
    String(text || '').split(/(\d[\d\s.,]*\d|\d)/).forEach((p, i) => f.append(i % 2 ? el('strong', { text: p }) : document.createTextNode(p)));
    return f;
  }

  // الحقول الإضافية المخزّنة داخل attrs (حالة، بيع/كراء، سعر الكراء، ألوان، مقاسات)
  function extras(ad) {
    const a = ad.attrs || {};
    return {
      condition: a.condition || '', deal: a.deal || 'sale', rent: Number(a.rent_price) || 0,
      colors: Categories.decodeMulti(a.color), sizes: Categories.decodeMulti(a.size || a.shoe_size)
    };
  }

  function shareMenu(ad) {
    const url = location.origin + location.pathname.replace(/[^/]*$/, '') + R.AD + '?id=' + ad.id;
    const ov = el('div', { class: 'modal-overlay' }), box = el('div', { class: 'modal' });
    const copy = async () => {
      try { await navigator.clipboard.writeText(url); } catch { const i = el('input', { value: url }); document.body.append(i); i.select(); document.execCommand('copy'); i.remove(); }
      UI.toastKey('ad.link_copied', 'success'); ov.remove();
    };
    box.append(el('h3', { text: t('ad.share') }),
      el('button', { class: 'menu-opt', type: 'button', onclick: copy }, [t('ad.copy_link'), '🔗']));
    if (navigator.share) box.append(el('button', { class: 'menu-opt', type: 'button', onclick: () => { ov.remove(); navigator.share({ title: ad.title, text: ad.title, url }).catch(() => {}); } }, [t('ad.share_out'), '📤']));
    ov.append(box); ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); }); document.body.append(ov);
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
    const x = extras(ad);
    Gallery.mount($('#gallery'), imgs);

    // نقاط ثلاث عمودية أعلى يمين الصور → الإبلاغ
    const g = $('#gallery .gallery');
    if (g && !mine) {
      const kb = el('button', { class: 'kebab', type: 'button', 'aria-label': t('report.title'), onclick: () => Reports.openMenu(ad.id, ad.user_id) });
      kb.append(svg('<circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="19" r="1.8" fill="currentColor"/>'));
      g.append(kb);
    }

    // شريط الأيقونات: مشاركة، فيديو، إعجاب
    const video = ad.video_url && safeLink(ad.video_url);
    const like = el('button', { class: 'icon-action', type: 'button', title: t('ad.likes'), 'data-like': ad.id });
    like.append(lineIcon('<path d="M12 21s-6.7-4.35-9.33-8.02C.86 10.6 1.2 7.3 3.6 5.4 5.8 3.66 8.9 4.1 10.6 6.1L12 7.7l1.4-1.6c1.7-2 4.8-2.44 7-.7 2.4 1.9 2.74 5.2 0.93 7.58C18.7 16.65 12 21 12 21z"/>'));
    like.addEventListener('click', () => Likes.toggle(ad, like));
    like.disabled = sold || mine;
    const shareBtn = el('button', { class: 'icon-action', type: 'button', title: t('ad.share'), onclick: () => shareMenu(ad) });
    shareBtn.append(lineIcon('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'));
    const vidBtn = el('button', { class: 'icon-action', type: 'button', title: t('ad.video'), style: video ? null : 'opacity:.4', onclick: () => { if (video) window.open(video, '_blank', 'noopener'); else UI.toastKey('ad.no_video', 'info'); } });
    vidBtn.append(lineIcon('<rect x="2" y="5" width="15" height="14" rx="2"/><path d="M17 9.5l5-3v11l-5-3z"/>'));
    const iconRow = el('div', { class: 'detail-icon-row' }, [shareBtn, vidBtn, like]);

    // الناشرة (قابلة للضغط → صفحة حسابها وإعلاناتها)
    const online = seller.last_seen && (Date.now() - new Date(seller.last_seen).getTime() < ONLINE_MS);
    const sellerRow = el('div', { class: 'detail-seller-row', role: 'link', tabindex: 0 }, [
      el('div', { class: 'seller-avatar' }, [el('img', { src: Utils.imgUrl(seller.avatar_url || 'assets/images/avatar.svg', 'thumb'), alt: '' }), el('div', { class: 'mini-dot' + (online ? ' online' : '') })]),
      el('div', {}, [
        el('span', { class: 'seller-name' }, [seller.name || ad.user_name || '', seller.is_verified ? el('span', { class: 'verified-tick', text: ' ✓' }) : null]),
        el('div', { class: 'hint', text: online ? t('ad.online') : (seller.last_seen ? t('ad.last_seen') + ' ' + Utils.timeAgo(seller.last_seen) : '') })
      ])
    ]);
    sellerRow.addEventListener('click', () => Utils.go(R.PROFILE, { u: ad.user_id }));

    // السعر
    const p = Price.display(ad);
    const priceEl = el('div', { class: 'detail-price' }, [p.old ? el('span', { class: 'old-price', text: p.oldText }) : null, p.text, p.pct > 0 ? el('span', { class: 'pct', text: ' -' + p.pct + '%' }) : null]);
    const nego = el('div', { class: 'nego-detail' + (ad.negotiable ? '' : ' fixed'), text: ad.negotiable ? t('ad.negotiable') : t('ad.fixed_price') });
    const rentLine = x.deal === 'both' && x.rent ? el('div', { class: 'rent-price', text: t('ad.rent_price') + ': ' + Utils.formatPrice(x.rent) }) : null;
    const dealBadges = el('div', { class: 'row', style: 'flex-wrap:wrap;margin-bottom:8px' }, [
      x.condition ? el('span', { class: 'badge badge--used', text: t('ad.used') + ' ' + x.condition }) : null,
      x.deal === 'rent' ? el('span', { class: 'badge badge--nego', text: t('ad.deal_rent_only') }) : null,
      x.deal === 'both' ? el('span', { class: 'badge badge--nego', text: t('ad.deal_both') }) : null,
      ad.is_edited ? el('span', { class: 'badge badge--edited', text: t('ad.edited') }) : null,
      sold ? el('span', { class: 'badge badge--sale', text: t('ad.sold') }) : null
    ]);

    // الشريط المعلوماتي
    const loc = [ad.wilaya_id && Geo.wlabel(Geo.wilaya(ad.wilaya_id)), ad.daira_id && Geo.label(Geo.daira(ad.daira_id)), ad.commune_id && Geo.label(Geo.commune(ad.commune_id))].filter(Boolean).join('، ');
    const meta = el('div', { class: 'detail-meta' }, [
      el('span', { text: '⭐ ' + Number(ad.rating_avg || 0).toFixed(1) }), el('span', { text: '❤️ ' + (ad.likes_count || 0) }), el('span', { text: '👁 ' + (ad.click_count || 0) }),
      el('span', { text: '📍 ' + loc }),
      el('span', { class: ad.delivery ? 'delivery-available' : 'delivery-unavailable', text: t('ad.delivery') + ' ' + (ad.delivery ? t('ad.available') + ' ✅' : t('ad.unavailable_short') + ' ❌') })
    ]);

    // السمات (ألوان/مقاسات متعددة…)
    const HIDE = ['condition', 'deal', 'rent_price'];
    const attrChips = Object.entries(ad.attrs || {}).filter(([k]) => !HIDE.includes(k)).map(([k, v]) => {
      const val = Categories.isMulti(k) ? Categories.decodeMulti(v).join(' / ') : v;
      return el('span', { class: 'tag', text: Categories.keyLabel(k) + ': ' + val });
    });

    // التواصل
    const links = [];
    if (!mine && !sold && !paused) links.push(brandBtn('chat', { onclick: () => Chat.start(ad.id, ad.user_id) }, t('ad.chat')));
    const showPhone = ad.show_phone && seller.show_phone && seller.phone;
    const digits = showPhone ? seller.phone.replace(/\D/g, '') : '';
    if (showPhone) {
      links.push(brandBtn('whatsapp', { href: 'https://wa.me/' + (digits.startsWith('0') ? '213' + digits.slice(1) : digits), target: '_blank', rel: 'noopener noreferrer' }, 'WhatsApp'));
      links.push(brandBtn('phone', { href: 'tel:' + seller.phone.replace(/[^\d+]/g, '') }, t('ad.phone')));
    }
    [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['telegram', 'Telegram'], ['maps_url', 'Maps']].forEach(([k, n]) => {
      const u = k === 'maps_url' ?
  (ad.lat && ad.lng ? `https://www.google.com/maps?q=${ad.lat},${ad.lng}` : seller[k] && safeLink(seller[k])) :
  seller[k] && safeLink(seller[k]);
    });
    const contactRow = links.length ? el('div', { class: 'detail-contact-row' }, links) : null;
    const phones = showPhone ? el('div', { class: 'phones' }, [
      el('a', { href: 'tel:' + seller.phone.replace(/[^\d+]/g, ''), text: '📞 ' + seller.phone }),
      el('a', { href: 'https://wa.me/' + (digits.startsWith('0') ? '213' + digits.slice(1) : digits), target: '_blank', rel: 'noopener noreferrer', text: '💬 WhatsApp ' + seller.phone })
    ]) : null;

    const desc = el('p', { class: 'detail-desc' }); desc.append(boldNumbers(ad.description));
    const oldPrices = hist.length ? el('div', {}, [el('b', { text: t('ad.old_prices') }), el('ul', { class: 'price-hist' }, hist.map(h => el('li', { text: Utils.formatPrice(h.old_price) + ' → ' + Utils.formatPrice(h.new_price) + ' · ' + Utils.formatDate(h.changed_at) })))]) : null;
    const faq = (ad.faq || []).length ? el('div', {}, [el('h3', { text: t('ad.faq') }), ...ad.faq.map(q => el('div', { class: 'faq-item' }, [el('b', { text: q.q }), el('span', { text: q.a })]))]) : null;

    info.replaceChildren(...[
      iconRow, sellerRow,
      el('h2', { class: 'detail-title', text: ad.title }), dealBadges, priceEl, nego, rentLine,
      el('div', { class: 'hint', text: Categories.path(ad.category_id, ad.subcategory_id) }),
      meta, attrChips.length ? el('div', { class: 'detail-attrs' }, attrChips) : null,
      contactRow, phones, desc, oldPrices, faq,
      el('div', { class: 'hint', style: 'margin-bottom:12px', text: t('ad.published_on') + ' ' + Utils.formatDate(ad.created_at) })
    ].filter(Boolean));
    Likes.load().then(() => Likes.paint(info));

    // شريط سفلي ثابت: رجوع + طلب الآن (أو تعديل/إحصائيات لصاحبة الإعلان)
    const foot = $('#detail-footer');
    const back = el('button', { class: 'btn-back-small', type: 'button', title: t('common.back'), onclick: () => Router.back() });
    back.append(svg('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>', { fill: 'none', stroke: 'currentColor' }));
    const row = el('div', { class: 'buy-row' }, [back]);
    if (mine) row.append(el('a', { class: 'btn-buy-full', href: R.POST + '?id=' + ad.id, text: t('ad.edit') }), el('a', { class: 'btn-buy-full ghost', href: R.STATS + '?id=' + ad.id, text: t('ad.stats') }));
    else if (!sold && !paused) {
      const order = el('button', { class: 'btn-buy-full', type: 'button', text: '🛒 ' + t('ad.order') });
      order.addEventListener('click', async () => {
        await Auth.ready(); if (!Auth.isLogged()) return Router.toLogin();
        const { data, error } = await SB.db.rpc('get_or_create_conversation', { p_ad: ad.id });
        if (error) return UI.toastKey(UI.errKey(error), 'error');
        await SB.db.from('messages').insert({ conversation_id: data, sender_id: Auth.uid(), content: t('ad.order_msg') });
        Utils.go(R.CHAT, { c: data });
      });
      row.append(order);
    }
    foot.append(row); foot.hidden = false;

    // التقييمات
    if (!sold) {
      Ratings.mount($('#ratings-ad'), { type: 'ad', id: ad.id, ownerId: ad.user_id });
      Ratings.mount($('#ratings-user'), { type: 'user', id: ad.user_id, ownerId: ad.user_id });
    }

    // إعلانات مشابهة (نفس الصنف الفرعي أولًا ثم الصنف)
    try {
      let list = (await Ads.list({ category_id: ad.category_id, subcategory_id: ad.subcategory_id }, 0)).items.filter(a => a.id !== ad.id);
      if (list.length < 4) {
        const more = (await Ads.list({ category_id: ad.category_id }, 0)).items.filter(a => a.id !== ad.id && !list.some(b => b.id === a.id));
        list = list.concat(more);
      }
      list = list.slice(0, 4);
      if (list.length) {
        const box = $('#similar');
        box.append(el('h3', { text: t('ad.similar') }), el('div', { class: 'similar-grid' }, list.map(sa => {
          const im = el('img', { src: Utils.imgUrl(sa.thumb_path, 'thumb'), alt: sa.title, loading: 'lazy' });
          im.addEventListener('error', () => { im.src = 'assets/images/placeholder.svg'; }, { once: true });
          const c = el('div', { class: 'similar-card' }, [el('div', { class: 'similar-img' }, [im]), el('h4', { text: sa.title }), el('div', { class: 'similar-price', text: Price.display(sa).text })]);
          c.addEventListener('click', () => Utils.go(R.AD, { id: sa.id })); return c;
        })));
        box.hidden = false;
      }
    } catch (e) { console.warn('[AdDetails] similar', e); }
    console.log('[AdDetails] ready', id);
  };
})();
