/* upload.js — تحقق (MIME + امتداد + magic bytes + حجم) وضغط WebP بـ3 أحجام قبل الرفع إلى ImageKit
   + فحص محتوى الصور عبر moderate.js (fail-open: الفشل لا يوقف الرفع) */
(function () {
  'use strict';
  const C = window.CONFIG, U = C.UPLOAD, L = C.LIMITS;

  async function magicOk(file) {
    const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const jpg  = b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
    const png  = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
    const webp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
                 b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
    return jpg || png || webp;
  }

  function toBlob(canvas, type, q) { return new Promise(r => canvas.toBlob(r, type, q)); }

  async function resize(bitmap, maxSide) {
    const s  = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w  = Math.round(bitmap.width * s), h = Math.round(bitmap.height * s);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    let blob = await toBlob(cv, 'image/webp', U.WEBP_QUALITY);
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(cv, 'image/jpeg', U.WEBP_QUALITY);
    return blob;
  }

  /* ---- ImageKit ---- */
  async function uploadToImageKit(blob, fileName) {
    const env = window.__ENV__ || {};
    const publicKey   = env.IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = env.IMAGEKIT_URL_ENDPOINT;
    if (!publicKey || !urlEndpoint) throw new Error('ImageKit غير مضبوط في env.js');

    const { data: authData, error: authError } = await SB.db.functions.invoke('imagekit-auth');
    if (authError) throw authError;

    const formData = new FormData();
    formData.append('file',      blob, fileName);
    formData.append('fileName',  fileName);
    formData.append('publicKey', publicKey);
    formData.append('signature', authData.signature);
    formData.append('expire',    authData.expire);
    formData.append('token',     authData.token);
    formData.append('folder',    authData.folder || '/ads');

    const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST', body: formData
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'ImageKit upload failed'); }
    return (await res.json()).url;
  }

  /* ================================================================
     نافذة تحذير الصورة المشبوهة / الممنوعة
     ================================================================ */
  function showModerationWarning(fileName, verdict, reasons, onContinue, onRemove) {
    const old = document.getElementById('mod-overlay');
    if (old) old.remove();

    const isUnsafe = verdict === 'UNSAFE';
    const overlay  = document.createElement('div');
    overlay.id = 'mod-overlay';
    overlay.className = 'mod-overlay';

    overlay.innerHTML = `
      <div class="mod-dialog">
        <div class="mod-header mod-header--${isUnsafe ? 'unsafe' : 'warning'}">
          <span class="mod-icon">${isUnsafe ? '🚫' : '⚠️'}</span>
          <span>${isUnsafe ? 'صورة ممنوعة' : 'صورة مشبوهة'}</span>
        </div>
        <div class="mod-body">
          <p class="mod-filename">${fileName}</p>
          <p class="mod-label">السبب المحتمل:</p>
          <div class="mod-reasons">
            ${reasons.map(r => `<span class="mod-reason-tag">${r}</span>`).join('')}
          </div>
          <p class="mod-note">${isUnsafe
            ? 'هذه الصورة تنتهك سياسات التطبيق ولا يمكن نشرها.'
            : 'يمكنك إزالة الصورة أو المتابعة — ستخضع للمراجعة اليدوية.'
          }</p>
        </div>
        <div class="mod-footer">
          <button class="btn btn--ghost mod-btn-remove" id="mod-remove">🗑 إزالة الصورة</button>
          ${!isUnsafe ? '<button class="btn btn--primary mod-btn-continue" id="mod-continue">متابعة النشر</button>' : ''}
        </div>
      </div>`;

    document.body.appendChild(overlay);
    document.getElementById('mod-remove').addEventListener('click', () => { overlay.remove(); onRemove(); });
    if (!isUnsafe) {
      document.getElementById('mod-continue').addEventListener('click', () => { overlay.remove(); onContinue(); });
      overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); onContinue(); } });
    }
  }

  /* ================================================================
     بدء فحص مجموعة ملفات في الخلفية فور اختيارها
     onResult(index, file, result) يُستدعى عند انتهاء فحص كل صورة
     يُعيد { promise, results }
     ================================================================ */
  function startModeration(files, onResult) {
    const results = [];
    const promise = Promise.all(
      Array.from(files).map(async (file, i) => {
        const res = await Moderate.checkFile(file);
        results[i] = res;
        if (onResult) onResult(i, file, res);
      })
    );
    return { promise, results };
  }

  /* ================================================================
     واجهة Upload العامة
     ================================================================ */
  const Upload = {

    async validate(file) {
      if (!file) return { ok: false, error: 'err.image_type' };
      const name  = String(file.name || '').toLowerCase();
      const parts = name.split('.');
      const ext   = parts.pop();
      if (parts.length > 1 && parts.slice(1).some(p => /^(php|js|html?|exe|sh|svg|phtml)/.test(p)))
        return { ok: false, error: 'err.image_type' };
      if (!U.ALLOWED_EXT.includes(ext) || !U.ALLOWED_MIME.includes(file.type))
        return { ok: false, error: 'err.image_type' };
      if (file.size > L.IMAGE_MAX_BYTES) return { ok: false, error: 'err.image_size' };
      if (!(await magicOk(file))) return { ok: false, error: 'err.image_type' };
      return { ok: true };
    },

    async compress(file) {
      const bmp = await createImageBitmap(file);
      const out = {};
      for (const [k, px] of Object.entries(U.SIZES)) out[k] = await resize(bmp, px);
      if (bmp.close) bmp.close();
      return out;
    },

    startModeration,
    showModerationWarning,

    /* رفع صور الإعلان مع احترام نتائج الفحص */
    async putAdImages(adId, files, onProgress, modPromise, modResults) {
      /* انتظر انتهاء الفحص إن كان لا يزال جاريًا */
      if (modPromise) { try { await modPromise; } catch { /* fail-open */ } }

      const uid = Auth.uid(), res = [];
      for (let i = 0; i < files.length; i++) {
        const modRes = (modResults && modResults[i]) || { ok: true };
        /* تخطّ الصور الممنوعة صراحةً (UNSAFE) */
        if (modRes.ok === false && modRes.verdict === 'UNSAFE') continue;

        const blobs = await this.compress(files[i]);
        const rec   = { position: i };
        for (const k of Object.keys(blobs)) {
          const fileName = `${uid}_${adId}_${i}_${k}.webp`;
          rec['path_' + k] = await uploadToImageKit(blobs[k], fileName);
        }
        res.push(rec);
        if (onProgress) onProgress(i + 1, files.length);
      }
      return res;
    },

    /* مستند خاص (هوية) — يبقى في Supabase Storage */
    async putPrivate(bucket, path, file) {
      const blob = await resize(await createImageBitmap(file), 1600);
      const { error } = await SB.db.storage.from(bucket).upload(path, blob, { contentType: blob.type, upsert: true });
      if (error) throw error;
      return path;
    }
  };

  window.Upload = Upload;
})();
