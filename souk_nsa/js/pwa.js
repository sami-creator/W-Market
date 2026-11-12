(function() {
  'use strict';
  let deferred = null;
  
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    showBtn();
  });
  
  function showBtn() {
    if (document.getElementById('install-btn')) return;
    const b = document.createElement('button');
    b.id = 'install-btn';
    b.textContent = '⬇ أضف للتطبيقات';
    b.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;padding:12px 20px;border-radius:24px;background:#e11d48;color:#fff;border:0;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.3)';
    b.onclick = async () => {
      if (!deferred) return;
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      b.remove();
    };
    document.body.append(b);
  }
  
  window.addEventListener('appinstalled', () => {
    const b = document.getElementById('install-btn');
    if (b) b.remove();
  });
})();