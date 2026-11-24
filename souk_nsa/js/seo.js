/**
 * seo.js — حقن Meta Tags ديناميكياً لصفحات الإعلانات والملفات الشخصية
 * يُستدعى من ad-details.js و profile.js بعد تحميل البيانات
 */
(function () {
  'use strict';

  const SITE_NAME = 'سوق نسا';
  const SITE_URL  = 'https://souknsa.com';
  const DEFAULT_IMAGE = SITE_URL + '/landing/og.jpeg';

  function setMeta(name, content, attr) {
    if (!content) return;
    const a = attr || 'name';
    let el = document.querySelector('meta[' + a + '="' + name + '"]');
    if (!el) { el = document.createElement('meta'); el.setAttribute(a, name); document.head.appendChild(el); }
    el.setAttribute('content', content);
  }

  function setCanonical(url) {
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el); }
    el.href = url;
  }

  function setSchema(json) {
    let el = document.getElementById('schema-ad') || document.getElementById('schema-profile');
    if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; document.head.appendChild(el); }
    el.textContent = JSON.stringify(json);
  }

  /**
   * updateAdMeta(ad) — استدعِه من ad-details.js بعد تحميل بيانات الإعلان
   * @param {Object} ad — كائن الإعلان من Supabase
   */
  window.SEO = {
    updateAdMeta: function (ad) {
      if (!ad) return;

      const title       = (ad.title || '') + ' — ' + SITE_NAME;
      const description = (ad.description || '').slice(0, 155).replace(/\n/g, ' ');
      const imageUrl    = (ad.images && ad.images[0])
        ? ('https://ik.imagekit.io/6injqmphyw/tr:w-1200,h-630,fo-auto/' + ad.images[0])
        : DEFAULT_IMAGE;
      const pageUrl     = SITE_URL + '/ad-details.html?id=' + ad.id;
      const price       = ad.price ? String(ad.price) + ' دج' : '';

      // Title
      document.title = title;

      // Standard meta
      setMeta('description', description);

      // Canonical
      setCanonical(pageUrl);

      // Open Graph
      setMeta('og:title',       title,       'property');
      setMeta('og:description', description, 'property');
      setMeta('og:image',       imageUrl,    'property');
      setMeta('og:url',         pageUrl,     'property');

      // Twitter
      setMeta('twitter:title',       title);
      setMeta('twitter:description', description);
      setMeta('twitter:image',       imageUrl);

      // Schema.org — Product
      var schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': ad.title || '',
        'description': description,
        'url': pageUrl,
        'image': imageUrl,
        'offers': {
          '@type': 'Offer',
          'priceCurrency': 'DZD',
          'availability': 'https://schema.org/InStock'
        }
      };
      if (ad.price) schema.offers.price = ad.price;
      if (ad.wilaya) schema.offers.areaServed = ad.wilaya;
      setSchema(schema);
    },

    /**
     * updateProfileMeta(user) — استدعِه من profile.js
     */
    updateProfileMeta: function (user) {
      if (!user) return;

      const name    = user.full_name || user.username || SITE_NAME;
      const title   = name + ' — ' + SITE_NAME;
      const pageUrl = SITE_URL + '/profile.html?id=' + (user.id || '');
      const avatar  = user.avatar_url || DEFAULT_IMAGE;
      const bio     = (user.bio || '').slice(0, 155);

      document.title = title;
      setMeta('description', bio || (name + ' على سوق نسا'));
      setCanonical(pageUrl);
      setMeta('og:title',       title,  'property');
      setMeta('og:description', bio,    'property');
      setMeta('og:image',       avatar, 'property');
      setMeta('og:url',         pageUrl,'property');

      setSchema({
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': name,
        'url': pageUrl,
        'image': avatar,
        'description': bio
      });
    }
  };
})();
