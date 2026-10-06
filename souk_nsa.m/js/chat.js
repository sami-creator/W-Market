/* chat.js — دردشة نصية فقط (Supabase Realtime)، 300 حرف، منع الأرقام، حظر شفاف */
(function () {
  'use strict';
  const el = Utils.el, t = k => I18n.t(k), MAX = () => window.CONFIG.LIMITS.CHAT_MESSAGE;
  let channel = null;

  const Chat = {
    async start(adId, sellerId) {
      await Auth.ready();
      if (!Auth.isLogged()) { UI.toastKey('auth.need_login', 'info'); return Router.toLogin(); }
      if (sellerId === Auth.uid()) return UI.toastKey('rate.own', 'info');
      const { data, error } = await SB.db.rpc('get_or_create_conversation', { p_ad: adId });
      if (error) return UI.toastKey(UI.errKey(error), 'error');
      Interests.record('message', { subcategory_id: null });
      Utils.go(window.CONFIG.ROUTES.CHAT, { c: data });
    },

    async list(container) {
      container.replaceChildren();
      const { data, error } = await SB.db.rpc('my_conversations');
      if (error) { UI.toastKey(UI.errKey(error), 'error'); return; }
      if (!data || !data.length) return UI.emptyState(container, 'notif.none', 'empty.sub');
      const box = el('div', { class: 'chat-list' });
      data.forEach(c => box.append(el('a', { class: 'chat-item', href: window.CONFIG.ROUTES.CHAT + '?c=' + encodeURIComponent(c.id) }, [
        el('img', { class: 'avatar-xs', style: 'width:42px;height:42px', src: Utils.imgUrl(c.other_avatar || 'assets/images/avatar.svg', 'thumb'), alt: '' }),
        el('div', { class: 'grow' }, [el('b', { text: c.other_name || '' }), el('div', { class: 'hint', text: c.ad_title || '' }), el('div', { class: 'muted', text: c.last_message || '' })]),
        c.unread ? el('span', { class: 'dot-badge', style: 'position:static', text: c.unread }) : null
      ])));
      container.append(box);
    },

    async open(convId, container) {
      const msgs = el('div', { class: 'chat-msgs' }), foot = el('div');
      const box = el('div', { class: 'chat-box' }, [msgs, foot]);
      container.replaceChildren(box);

      const { data: st } = await SB.db.rpc('block_status', { p_conv: convId });
      const status = (st && st[0]) || {};
      const renderMsg = m => {
        const me = m.sender_id === Auth.uid();
        msgs.append(el('div', { class: 'msg' + (me ? ' msg--me' : '') }, [el('span', { text: m.content }), el('small', { text: Utils.timeAgo(m.created_at) })]));
        msgs.scrollTop = msgs.scrollHeight;
      };

      // عند الحظر تختفي الرسائل ويظهر إشعار لكلا الطرفين
      const blocked = status.blocked_by_me || status.blocked_me;
      if (blocked) {
        msgs.replaceChildren();
        foot.append(el('div', { class: 'chat-note', text: t(status.blocked_by_me ? 'chat.blocked_by_me' : 'chat.blocked_me') }));
        if (status.blocked_by_me) foot.append(el('button', { class: 'btn btn--ghost btn--block', type: 'button', onclick: async () => { await SB.db.from('blocks').delete().eq('blocker_id', Auth.uid()).eq('blocked_id', status.other_id); this.open(convId, container); } }, t('chat.unblock')));
        return;
      }

      const { data } = await SB.db.from('messages').select('id,sender_id,content,created_at').eq('conversation_id', convId).order('created_at', { ascending: false }).limit(50);
      (data || []).reverse().forEach(renderMsg);
      SB.db.rpc('mark_read', { p_conv: convId });

      if (channel) SB.db.removeChannel(channel);
      channel = SB.db.channel('conv-' + convId).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + convId }, p => { if (p.new.sender_id !== Auth.uid()) renderMsg(p.new); }).subscribe();

      const input = el('input', { class: 'input', maxlength: MAX(), placeholder: t('chat.placeholder') });
      const send = el('button', { class: 'btn btn--primary', type: 'button' }, t('common.send'));
      const blockBtn = el('button', { class: 'btn btn--ghost', type: 'button', onclick: async () => {
        if (!(await UI.confirmDialog(t('chat.block') + '؟'))) return;
        await SB.db.from('blocks').insert({ blocker_id: Auth.uid(), blocked_id: status.other_id }); this.open(convId, container);
      } }, t('chat.block'));

      const submit = async () => {
        const v = Sanitize.validateText(input.value, { max: MAX(), min: 1 });
        if (!v.ok) return UI.toastKey(v.error, 'error');
        input.value = ''; renderMsg({ sender_id: Auth.uid(), content: v.value, created_at: new Date().toISOString() });
        const { error } = await SB.db.from('messages').insert({ conversation_id: convId, sender_id: Auth.uid(), content: v.value });
        if (error) UI.toastKey(UI.errKey(error), 'error');
      };
      send.addEventListener('click', submit);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
      foot.append(el('div', { class: 'chat-input' }, [input, send, blockBtn]));
    },
    close() { if (channel) { SB.db.removeChannel(channel); channel = null; } }
  };
  window.Chat = Chat;
})();
