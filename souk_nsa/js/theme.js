/* theme.js — إدارة الثيم: وضع ليلي افتراضي، ألوان، خطوط */
'use strict';
(function(){
  const ROOT = document.documentElement;
  const STORE_THEME = 'snsa_theme';
  const STORE_COLOR = 'snsa_color';
  const STORE_FONT  = 'snsa_font';

  /* ===== تطبيق الوضع (light/dark) ===== */
  function applyTheme(t){
    ROOT.dataset.theme = t;
    localStorage.setItem(STORE_THEME, t);
  }

  /* ===== تطبيق لون التطبيق ===== */
  function applyColor(c){
    ROOT.dataset.color = c;
    localStorage.setItem(STORE_COLOR, c);
  }

  /* ===== تطبيق الخط ===== */
  function applyFont(id){
    const f = (window.APP?.FONTS || []).find(x=>x.id===id);
    if(!f) return;
    ROOT.style.setProperty('--font', f.stack);
    localStorage.setItem(STORE_FONT, id);
  }

  /* ===== تحميل مبكر (قبل رسم الصفحة لتفادي الوميض) ===== */
  (function earlyInit(){
    applyTheme(localStorage.getItem(STORE_THEME) || 'dark');
    applyColor(localStorage.getItem(STORE_COLOR) || 'rose');
    const savedFont = localStorage.getItem(STORE_FONT) || 'times';
    // تطبيق الخط مبكراً بدون انتظار APP.FONTS
    const FONT_MAP = {
      times:       "'Times New Roman','Georgia',serif",
      scheherazade:"'Scheherazade New','Times New Roman',serif",
      amiri:       "'Amiri','Times New Roman',serif",
      noto:        "'Noto Serif Arabic','Times New Roman',serif",
      playfair:    "'Playfair Display','Times New Roman',serif",
      lora:        "'Lora','Times New Roman',serif",
    };
    if(FONT_MAP[savedFont]) ROOT.style.setProperty('--font', FONT_MAP[savedFont]);
  })();

  /* ===== تهيئة الصفحة بعد التحميل ===== */
  function init(){
    renderColorGrid();
    renderFontList();
    bindToggle();
    initScrollTop();
  }

  /* ===== شبكة الألوان في الإعدادات ===== */
  function renderColorGrid(){
    const grid = document.getElementById('color-grid');
    if(!grid) return;
    grid.innerHTML = '';
    const cur = localStorage.getItem(STORE_COLOR) || 'rose';
    (window.APP?.COLORS || []).forEach(c=>{
      const btn = document.createElement('button');
      btn.className = 'color-chip' + (c.id===cur?' sel':'');
      btn.style.background = c.hex;
      btn.title = c.label;
      btn.setAttribute('aria-label', c.label);
      btn.addEventListener('click',()=>{
        applyColor(c.id);
        grid.querySelectorAll('.color-chip').forEach(b=>b.classList.remove('sel'));
        btn.classList.add('sel');
      });
      grid.appendChild(btn);
    });
  }

  /* ===== قائمة الخطوط في الإعدادات ===== */
  function renderFontList(){
    const list = document.getElementById('font-list');
    if(!list) return;
    list.innerHTML = '';
    const cur = localStorage.getItem(STORE_FONT) || 'times';
    (window.APP?.FONTS || []).forEach(f=>{
      const btn = document.createElement('button');
      btn.className = 'font-option' + (f.id===cur?' sel':'');
      btn.style.fontFamily = f.stack;
      btn.innerHTML = `<span>${f.label}</span><span style="font-size:13px">${f.id===cur?'✓':''}</span>`;
      btn.addEventListener('click',()=>{
        applyFont(f.id);
        list.querySelectorAll('.font-option').forEach(b=>{
          b.classList.remove('sel');
          b.querySelector('span:last-child').textContent='';
        });
        btn.classList.add('sel');
        btn.querySelector('span:last-child').textContent='✓';
      });
      list.appendChild(btn);
    });
  }

  /* ===== زر تبديل الوضع ===== */
  function bindToggle(){
    document.querySelectorAll('[data-toggle-theme]').forEach(el=>{
      el.addEventListener('click',()=>{
        const next = ROOT.dataset.theme==='dark'?'light':'dark';
        applyTheme(next);
        el.textContent = next==='dark'?'🌙':'☀️';
      });
      const cur = localStorage.getItem(STORE_THEME)||'dark';
      el.textContent = cur==='dark'?'🌙':'☀️';
    });

    // checkbox style toggle in settings
    document.querySelectorAll('[data-theme-check]').forEach(el=>{
      el.checked = (localStorage.getItem(STORE_THEME)||'dark')==='dark';
      el.addEventListener('change',()=>{
        applyTheme(el.checked?'dark':'light');
      });
    });
  }

  /* ===== زر العودة للأعلى ===== */
  function initScrollTop(){
    const btn = document.getElementById('scroll-top-btn');
    if(!btn) return;
    const scroller = document.querySelector('main') || window;
    const onScroll = ()=>{
      const y = scroller===window?window.scrollY:scroller.scrollTop;
      btn.classList.toggle('visible', y>300);
    };
    scroller.addEventListener('scroll', onScroll, {passive:true});
    btn.addEventListener('click',()=>{
      scroller===window
        ? window.scrollTo({top:0,behavior:'smooth'})
        : scroller.scrollTo({top:0,behavior:'smooth'});
    });
  }

  /* ===== API عامة ===== */
  window.THEME = { applyTheme, applyColor, applyFont };

  if(document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
