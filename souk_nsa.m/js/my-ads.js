/* my-ads.js — إدارة إعلاناتي: تعديل، إحصائيات، إيقاف/تنشيط، تم البيع، حذف */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k), R = window.CONFIG.ROUTES;
  const $ = s => document.querySelector(s);

  App.pages['my-ads'] = async function () {
    if (!(await App.boot({ guard: true }))) return;
    await Categories.load();
    const box = $('#list');

    async function paint() {
      box.replaceChildren(UI.skeletonCards(2));
      let items;
      try { items = await Ads.mine(); } catch (e) { console.error('[MyAds]', e); box.replaceChildren(); return UI.emptyState(box, 'err.generic', 'common.retry'); }
      box.replaceChildren();
      if (!items.length) return UI.emptyState(box, 'ad.no_ads', 'ad.add');
      items.forEach(a => {
        const sold = a.status === 'sold', paused = a.status === 'paused';
        const act = (key, fn, cls = 'btn btn--ghost') => el('button', { class: cls, type: 'button', onclick: fn }, t(key));
        const actions = el('div', { class: 'actions row', style: 'flex-wrap:wrap;margin-top:8px' }, [
          act('common.edit', () => Utils.go(R.POST, { id: a.id })),
          act('ad.stats', () => Utils.go(R.STATS, { id: a.id })),
          sold ? null : act(paused ? 'ad.activate' : 'ad.pause', async () => { await Ads.setStatus(a.id, paused ? 'active' : 'paused'); paint(); }),
          sold ? null : act('ad.mark_sold', async () => { if (!(await UI.confirmDialog(t('ad.confirm_sold')))) return; const { error } = await Ads.markSold(a.id); if (error) return UI.toastKey(UI.errKey(error), 'error'); paint(); }),
          act('ad.delete', async () => { if (!(await UI.confirmDialog(t('ad.confirm_delete')))) return; await Ads.remove(a.id); paint(); }, 'btn btn--danger')
        ]);
        box.append(el('div', { class: 'card-box' }, [
          el('div', { class: 'row' }, [el('b', { class: 'grow', text: a.title }), el('span', { class: 'pill' + (sold ? '' : paused ? ' pill--pending' : ' pill--ok'), text: t(sold ? 'ad.sold' : paused ? 'ad.status_paused' : 'ad.status_active') })]),
          el('div', { class: 'muted', text: Utils.formatPrice(a.price) + ' · ' + Categories.path(a.category_id, a.subcategory_id) }),
          el('div', { class: 'hint', text: t('ad.clicks') + ': ' + (a.click_count || 0) + ' · ♥ ' + (a.likes_count || 0) + ' · ' + Utils.formatDate(a.created_at) }),
          actions
        ]));
      });
    }
    paint();
  };
})();
