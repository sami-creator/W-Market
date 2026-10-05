/* config.js — كل الثوابت والحدود في مكان واحد */
(function () {
  'use strict';
  window.CONFIG = Object.freeze({
    LIMITS: {
      TITLE: 100, DESCRIPTION: 500, INPUT_GENERIC: 500, CHAT_MESSAGE: 300,
      NAME: 60, FAQ_Q: 120, FAQ_A: 300, FAQ_MAX: 5, REPORT_NOTE: 300,
      IMAGES_MIN: 1, IMAGES_MAX: 10, IMAGE_MAX_BYTES: 5 * 1024 * 1024,
      PRICE_EDITS_MAX: 3, ALERTS_MAX: 3, MIN_AGE: 18,
      PAGE_SIZE: 20, SEARCH_DEBOUNCE_MS: 400
    },
    UPLOAD: {
      ALLOWED_MIME: ['image/jpeg', 'image/png', 'image/webp'],
      ALLOWED_EXT: ['jpg', 'jpeg', 'png', 'webp'],
      SIZES: { thumb: 150, medium: 600, large: 1600 },
      WEBP_QUALITY: 0.8
    },
    STORAGE_KEYS: {
      LANG: 'sn_lang', THEME: 'sn_theme', COLOR: 'sn_color', FONT: 'sn_font',
      SESSION_HINT: 'sn_session_hint', PROFILE_STATE: 'sn_profile_state',
      LIKE_TOAST: 'sn_like_toast_seen', DRAFT: 'sn_ad_draft', DEVICE: 'sn_device_id',
      CACHE_PREFIX: 'sn_cache_'
    },
    DEFAULTS: { LANG: 'ar', THEME: 'light', COLOR: 'rose', FONT: 'cairo' },
    LANGS: ['ar', 'fr', 'en'],
    COLORS: ['rose', 'beige', 'gold', 'cream'],
    FONTS: { cairo: 'Cairo', tajawal: 'Tajawal', almarai: 'Almarai', system: 'system-ui' },
    INTEREST_POINTS: { click: 1, like: 3, message: 5, buy_or_rate: 8 },
    CLICK_RAW_DAYS: 30,
    SUPPORT: { WHATSAPP: '', TELEGRAM: '' },
    ROUTES: {
      HOME: 'index.html', AUTH: 'auth.html', COMPLETE: 'complete-profile.html', PROFILE: 'profile.html',
      EDIT_PROFILE: 'edit-profile.html', VERIFY: 'verify.html', POST: 'post-ad.html', MY_ADS: 'my-ads.html',
      STATS: 'ad-stats.html', AD: 'ad-details.html', FAVS: 'favorites.html', NOTIFS: 'notifications.html',
      CHAT: 'chat.html', SETTINGS: 'settings.html', PRIVACY: 'privacy.html'
    }
  });
})();
