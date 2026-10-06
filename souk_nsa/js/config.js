/* config.js — كل الثوابت والحدود في مكان واحد
   (يحافظ على الاسم الأصلي window.CONFIG وكل مفاتيحه، ويضيف: ألوان/خطوط جديدة، مقاسات، ألوان المنتجات، أسباب البلاغ، أنواع الإعلان) */
(function () {
  'use strict';
  window.CONFIG = Object.freeze({
    LIMITS: {
      TITLE: 100, DESCRIPTION: 500, INPUT_GENERIC: 500, CHAT_MESSAGE: 300,
      NAME: 60, FAQ_Q: 120, FAQ_A: 300, FAQ_MAX: 5, REPORT_NOTE: 300,
      IMAGES_MIN: 1, IMAGES_MAX: 10, IMAGE_MAX_BYTES: 5 * 1024 * 1024,
      PRICE_EDITS_MAX: 3, ALERTS_MAX: 3, MIN_AGE: 18,
      PAGE_SIZE: 20, SEARCH_DEBOUNCE_MS: 400,
      // حدود الخادم (submit-ad): 5 خصائص كحد أقصى، وكل قيمة ≤ 30 حرفًا
      ATTRS_MAX: 5, ATTR_VALUE: 30
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
      CACHE_PREFIX: 'sn_cache_',
      NAV_STATE: 'sn_nav_state', FILTERS: 'sn_filters'
    },
    // الوضع الليلي والخط Times New Roman افتراضيان
    DEFAULTS: { LANG: 'ar', THEME: 'dark', COLOR: 'rose', FONT: 'times', DELIVERY: false, CONDITION: 'new', LISTING: 'sale' },
    LANGS: ['ar', 'fr', 'en'],

    /* ===== ألوان التطبيق (15) ===== */
    COLORS: ["rose","pink","beige","gold","cream","purple","lavender","teal","mint","coral","orange","sky","indigo","red","emerald"],
    COLOR_HEX: {"rose":"#c2607a","pink":"#e91e8c","beige":"#a67c52","gold":"#c9962e","cream":"#8f7a6b","purple":"#8b5cf6","lavender":"#9d74c4","teal":"#0d9488","mint":"#10b981","coral":"#f0694a","orange":"#ea8b2f","sky":"#0ea5e9","indigo":"#4f46e5","red":"#dc2626","emerald":"#059669"},
    COLOR_LABELS: {"rose":"وردي كلاسيكي","pink":"وردي نيون","beige":"بيج","gold":"ذهبي","cream":"كريمي","purple":"بنفسجي","lavender":"لافندر","teal":"بترولي","mint":"أخضر نعناعي","coral":"مرجاني","orange":"برتقالي","sky":"سماوي","indigo":"نيلي","red":"أحمر","emerald":"زمردي"},

    /* ===== الخطوط: id → الاسم (للقوائم) ===== */
    FONTS: {"times":"Times New Roman","scheherazade":"Scheherazade","amiri":"Amiri","noto":"Noto Serif Arabic","playfair":"Playfair Display","lora":"Lora"},
    FONT_STACKS: {"times":"'Times New Roman','Georgia',serif","scheherazade":"'Scheherazade New','Times New Roman',serif","amiri":"'Amiri','Times New Roman',serif","noto":"'Noto Serif Arabic','Times New Roman',serif","playfair":"'Playfair Display','Times New Roman',serif","lora":"'Lora','Times New Roman',serif"},
    // اسم الخط في Google Fonts (Times New Roman خط نظام فلا يحتاج تحميلًا)
    FONT_GF: { scheherazade: 'Scheherazade+New:wght@400;700', amiri: 'Amiri:wght@400;700', noto: 'Noto+Serif+Arabic:wght@400;700', playfair: 'Playfair+Display:wght@400;700', lora: 'Lora:wght@400;700' },

    /* ===== مقاسات وألوان المنتجات ===== */
    CLOTHING_SIZES: ["XS","S","M","L","XL","XXL","XXXL","36","38","40","42","44","46","48","50","52","54"],
    SHOE_SIZES: ["34","34.5","35","35.5","36","36.5","37","37.5","38","38.5","39","39.5","40","40.5","41","41.5","42","42.5","43","44","45","46","47","48"],
    ITEM_COLORS: [{"id":"white","label":"أبيض","hex":"#ffffff","border":true},{"id":"ivory","label":"عاجي","hex":"#fffff0","border":true},{"id":"cream","label":"كريمي","hex":"#fffdd0","border":true},{"id":"beige","label":"بيج","hex":"#f5f0eb"},{"id":"champagne","label":"شمبانيا","hex":"#f7e7ce"},{"id":"gold","label":"ذهبي","hex":"#ffd700"},{"id":"silver","label":"فضي","hex":"#c0c0c0"},{"id":"pink","label":"وردي فاتح","hex":"#ffb6c1"},{"id":"fuchsia","label":"فوشيا","hex":"#ff00ff"},{"id":"red","label":"أحمر","hex":"#e02020"},{"id":"burgundy","label":"عنابي","hex":"#800020"},{"id":"orange","label":"برتقالي","hex":"#ff8c00"},{"id":"coral","label":"مرجاني","hex":"#ff6347"},{"id":"yellow","label":"أصفر","hex":"#ffd700"},{"id":"green","label":"أخضر","hex":"#228b22"},{"id":"olive","label":"زيتوني","hex":"#808000"},{"id":"mint","label":"نعناعي","hex":"#98ff98"},{"id":"teal","label":"بترولي","hex":"#008080"},{"id":"blue","label":"أزرق","hex":"#1a73e8"},{"id":"navy","label":"كحلي","hex":"#1b2a6b"},{"id":"sky","label":"سماوي","hex":"#87ceeb"},{"id":"purple","label":"بنفسجي","hex":"#800080"},{"id":"lavender","label":"لافندر","hex":"#e6e6fa"},{"id":"brown","label":"بني","hex":"#8b4513"},{"id":"taupe","label":"تاوب","hex":"#b5a79b"},{"id":"gray","label":"رمادي","hex":"#9e9e9e"},{"id":"charcoal","label":"رمادي داكن","hex":"#444444"},{"id":"black","label":"أسود","hex":"#111111"},{"id":"multi","label":"متعدد الألوان","hex":"linear-gradient(135deg,#f00,#0f0,#00f)"}],

    /* ===== أنواع الإعلان وحالة المنتج ===== */
    LISTING_TYPES: [{"id":"sale","label":{"ar":"بيع فقط","fr":"Vente uniquement","en":"Sale only"}},{"id":"rent","label":{"ar":"كراء فقط","fr":"Location uniquement","en":"Rent only"}},{"id":"both","label":{"ar":"بيع أو كراء","fr":"Vente ou location","en":"Sale or rent"}}],
    CONDITIONS: [
      { id: 'new', label: { ar: 'جديد', fr: 'Neuf', en: 'New' } },
      { id: 'used', label: { ar: 'مستعمل', fr: 'Occasion', en: 'Used' } }
    ],

    /* ===== أسباب الإبلاغ (رئيسية + تفاصيل) ===== */
    REPORT_REASONS: [{"id":"drugs","label":{"ar":"مخدرات أو ممنوعات","fr":"Drogues/produits illicites","en":"Drugs or prohibited items"},"sub":{"ar":["بيع مخدرات","كحول","تبغ مجهول المصدر","أخرى"],"fr":["Drogues","Alcool","Tabac","Autre"],"en":["Drugs","Alcohol","Tobacco","Other"]}},{"id":"weapons","label":{"ar":"أسلحة أو أدوات خطيرة","fr":"Armes/objets dangereux","en":"Weapons or dangerous items"},"sub":{"ar":["سلاح ناري","سلاح أبيض","متفجرات","أخرى"],"fr":["Arme à feu","Couteau","Explosifs","Autre"],"en":["Firearm","Knife","Explosives","Other"]}},{"id":"pharma","label":{"ar":"مواد صيدلانية تحتاج وصفة","fr":"Médicaments sur ordonnance","en":"Prescription drugs"},"sub":{"ar":["دواء بدون وصفة","مواد طبية محظورة","مكملات مجهولة","أخرى"],"fr":["Méd. sans ordo.","Produits interdits","Compléments douteux","Autre"],"en":["No prescription","Banned","Unknown supplements","Other"]}},{"id":"sexual","label":{"ar":"تلميحات جنسية","fr":"Contenu sexuel","en":"Sexual content"},"sub":{"ar":["صور مسيئة","نص جنسي","خدمات مخلة","أخرى"],"fr":["Images indécentes","Texte sexuel","Services","Autre"],"en":["Indecent images","Sexual text","Services","Other"]}},{"id":"hate","label":{"ar":"تحريض على الكراهية","fr":"Incitation à la haine","en":"Hate speech"},"sub":{"ar":["عنصرية","كراهية دينية","تمييز","أخرى"],"fr":["Racisme","Haine religieuse","Discrimination","Autre"],"en":["Racism","Religious hate","Discrimination","Other"]}},{"id":"political","label":{"ar":"موضوع سياسي","fr":"Contenu politique","en":"Political content"},"sub":{"ar":["دعاية حزبية","تحريض","أخرى"],"fr":["Propagande","Incitation","Autre"],"en":["Propaganda","Incitement","Other"]}},{"id":"other","label":{"ar":"أخرى","fr":"Autre","en":"Other"},"sub":null}],

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
