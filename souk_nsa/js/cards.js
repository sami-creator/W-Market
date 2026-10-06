/* cards.js — بطاقة الإعلان (prototype style) */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k);
  const FALLBACK = 'assets/images/placeholder.svg';

  function img(src, alt, cls, extra) {
    const i = el('img', Object.assign({ class: cls, alt: alt || '', loading: 'lazy', decoding: 'async', src: Utils.imgUrl(src, 'thumb') }, extra));
    i.addEventListener('error', () => { if (!i.dataset.fb) { i.dataset.fb = '1'; i.src = FALLBACK; } });
    return i;
  }

  const Cards = {
    render(ad) {
      const p = Price.display(ad), sold = ad.status === 'sold';
      const card = el('article', { class: 'card', 'data-id': ad.id });

      /* ===== صورة + شارات ===== */
      const badges = el('div', { class: 'card__badges' });
      if (p.pct > 0) badges.append(el('span', { class: 'badge badge--discount', text: '-' + p.pct + '%' }));
      if (ad.is_edited) badges.append(el('span', { class: 'badge badge--edited', text: t('ad.edited') }));

      const likeCount = el('span', { text: ad.likes_count || 0 });
      const like = el('button', { class: 'like-btn' + (window.Likes && Likes.has(ad.id) ? ' liked' : ''), type: 'button', 'aria-label': t('ad.likes') });
      like.innerHTML = '<span style="font-size:15px">♥</span>';
      like.append(likeCount);
      like.disabled = sold;
      like.addEventListener('click', e => {
        e.stopPropagation();
        if (window.Likes) Likes.toggle(ad, like);
      });

      const imgWrap = el('div', { class: 'card__img-wrap' });
      imgWrap.append(
        img(ad.thumb_path, ad.title, 'card__img'),
        badges
      );
      if (sold) imgWrap.append(el('div', { class: 'sold-ribbon', text: t('ad.sold') }));

      /* ===== جسم البطاقة ===== */
      const body = el('div', { class: 'card__body' });

      // العنوان
      body.append(el('div', { class: 'card__title', text: ad.title }));

      // صف البائع
      const avatarWrap = el('div', { class: 'card__avatar' });
      const avatarImg = img(ad.user_avatar || 'assets/images/avatar.svg', '', 'card__avatar-img');
      avatarImg.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:50%;border:2px solid #fff;';
      const dot = el('div', { class: 'online-dot ' + (ad.is_online ? 'online-dot--on' : 'online-dot--off') });
      avatarWrap.append(avatarImg, dot);

      const sellerName = el('div', { class: 'card__seller-name' });
      sellerName.append(document.createTextNode((ad.user_name || '') + ' '));
      if (ad.is_verified) sellerName.append(el('span', { class: 'verified-tick', text: '✓' }));

      const sellerRow = el('div', { class: 'card__seller-row' });
      sellerRow.append(avatarWrap, sellerName);
      body.append(sellerRow);

      // المسافة
      if (ad.distance_km != null) {
        body.append(el('div', { class: 'card__distance', text: '📍 ' + t('ad.distance_km').replace('{n}', Math.round(ad.distance_km)) }));
      }

      // قابل للتفاوض
      if (ad.negotiable) {
        body.append(el('div', { class: 'card__nego', text: t('ad.negotiable') }));
      }

      // السعر
      const priceRow = el('div', { class: 'card__price-row' });
      if (p.old) priceRow.append(el('span', { class: 'card__old', text: p.oldText }));
      priceRow.append(el('span', { class: 'card__price', text: p.text }));
      body.append(priceRow);

      // التذييل: تقييم + إعجاب
      const footer = el('div', { class: 'card__footer' });
      const ratingEl = el('div', { class: 'card__rating' });
      ratingEl.innerHTML = '<span class="star-icon">★</span>';
      ratingEl.append(document.createTextNode(Number(ad.rating_avg || 0).toFixed(1)));
      footer.append(ratingEl, like);
      body.append(footer);

      // التاريخ
      if (ad.created_at) {
        const d = new Date(ad.created_at);
        body.append(el('div', { class: 'card__date', text: d.toISOString().slice(0, 10) }));
      }

      card.append(imgWrap, body);
      card.addEventListener('click', () => {
        if (window.Tracking) Tracking.click(ad);
        Utils.go(window.CONFIG.ROUTES.AD, { id: ad.id });
      });
      return card;
    },

    renderList(container, items, { append = false } = {}) {
      if (!append) container.replaceChildren();
      const f = document.createDocumentFragment();
      items.forEach(a => f.append(this.render(a)));
      container.append(f);
    }
  };
  window.Cards = Cards;
})();
