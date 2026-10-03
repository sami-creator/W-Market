/* utils.js — دوال مساعدة صغيرة، كل دالة لمهمة واحدة */
(function () {
  'use strict';
  const K = () => window.CONFIG.STORAGE_KEYS;

  const Store = {
    get(key, fallback = null) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; } },
    remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
  };

  function debounce(fn, ms) {
    let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
  }

  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
  }

  // أرقام لاتينية دائمًا + "دج"
  function formatNumber(n) { return Number(n || 0).toLocaleString('en-US').replace(/,/g, '\u00A0'); }
  function formatPrice(n) { return formatNumber(n) + ' ' + (window.I18n ? I18n.t('currency') : 'دج'); }
  // التحويل إلى السنتيم يتم هنا (Client-side): 1 دج = 100 سنتيم
  function toSantim(n) { return formatNumber(Number(n || 0) * 100) + ' ' + (window.I18n ? I18n.t('santim') : 'سنتيم'); }
  function applyDiscount(price, pct) { return pct > 0 ? Math.round(price * (100 - pct) / 100) : price; }

  function timeAgo(iso) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    const t = k => (window.I18n ? I18n.t(k) : k);
    if (s < 60) return t('time.now');
    if (s < 3600) return Math.floor(s / 60) + ' ' + t('time.min');
    if (s < 86400) return Math.floor(s / 3600) + ' ' + t('time.hour');
    if (s < 2592000) return Math.floor(s / 86400) + ' ' + t('time.day');
    return new Date(iso).toLocaleDateString('en-GB');
  }

  function formatDate(iso) { return new Date(iso).toLocaleDateString('en-GB'); }

  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function go(route, params) {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    location.href = route + q;
  }

  function currentYear() { return new Date().getFullYear(); }
  function birthYears() {
    const y = currentYear(), out = [];
    for (let i = y - window.CONFIG.LIMITS.MIN_AGE; i >= y - 80; i--) out.push(i);
    return out;
  }
  function ageFromYear(by) { return currentYear() - Number(by); }

  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v === true ? '' : v);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c === null || c === undefined) return;
      n.append(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return n;
  }

  function imgUrl(path, size) {
    if (!path) return 'assets/images/placeholder.svg';
    if (/^https?:/i.test(path)) return path;
    const base = (window.__ENV__ && window.__ENV__.IMAGE_CDN_BASE) || '';
    const w = window.CONFIG.UPLOAD.SIZES[size] || '';
    if (base) return `${base}/${path}${w ? '?tr=w-' + w : ''}`;
    const sb = (window.__ENV__ && window.__ENV__.SUPABASE_URL) || '';
    return sb && !/^(assets|data|css|js)\//.test(path) ? `${sb}/storage/v1/object/public/ad-images/${path}` : path;
  }

  async function retry(fn, times = 2, delay = 400) {
    let last;
    for (let i = 0; i <= times; i++) {
      try { return await fn(); } catch (e) { last = e; await new Promise(r => setTimeout(r, delay * (i + 1))); }
    }
    throw last;
  }

  window.Utils = {
    Store, debounce, uuid, formatNumber, formatPrice, toSantim, applyDiscount,
    timeAgo, formatDate, qs, go, birthYears, ageFromYear, el, imgUrl, retry
  };
})();
