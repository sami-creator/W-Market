/* categories.js — هيكل الأصناف مع الفروع المتعددة المستويات */
'use strict';
(function(){

  const lang = document.documentElement.lang||'ar';
  const L=(ar,fr,en)=>({ar,fr,en}[lang]||ar);

  /* ===== شجرة الأصناف ===== */
  const TREE = [
    {
      id:'wedding', label:L('ملابس أعراس','Robes de mariage','Wedding clothes'),
      icon:'💍',
      children:[
        { id:'karako',    label:L('كراكو','Karakou','Karakou') },
        { id:'gandoura',  label:L('قندورة','Gandoura','Gandoura') },
        { id:'kaftan',    label:L('قفطان','Caftan','Kaftan') },
        { id:'takchita',  label:L('تكشيطة','Takchita','Takchita') },
        { id:'hayek',     label:L('حايك','Haïk','Haik') },
        { id:'evening',   label:L('فساتين سهرة','Robes de soirée','Evening dresses') },
        { id:'burnous',   label:L('برنوس','Burnous','Burnous') },
        { id:'other_wed', label:L('أخرى','Autres','Other') },
      ]
    },
    {
      id:'clothing', label:L('ملابس يومية','Vêtements quotidiens','Daily clothing'),
      icon:'👗',
      children:[
        { id:'tops',     label:L('بلوزات وتشيرتات','Hauts','Tops') },
        { id:'pants',    label:L('بنطلونات','Pantalons','Pants') },
        { id:'abayas',   label:L('عبايات','Abayas','Abayas') },
        { id:'jilbab',   label:L('جلباب','Jilbab','Jilbab') },
        { id:'sport',    label:L('ملابس رياضية','Sportswear','Sportswear') },
        { id:'kids',     label:L('ملابس أطفال','Vêtements enfants','Kids clothes') },
        { id:'other_cl', label:L('أخرى','Autres','Other') },
      ]
    },
    {
      id:'shoes', label:L('أحذية','Chaussures','Shoes'),
      icon:'👠',
      children:[
        { id:'heels',      label:L('كعب عالي','Talons hauts','High heels') },
        { id:'flat',       label:L('مسطحة','Plates','Flat shoes') },
        { id:'boots',      label:L('بوط','Bottes','Boots') },
        { id:'sandals',    label:L('صنادل','Sandales','Sandals') },
        { id:'sneakers',   label:L('رياضية','Baskets','Sneakers') },
        { id:'wedding_sh', label:L('أحذية عرس','Chaussures mariage','Wedding shoes') },
        { id:'slippers',   label:L('شباط منزلي','Pantoufles','Slippers') },
        { id:'other_sh',   label:L('أخرى','Autres','Other') },
      ]
    },
    {
      id:'beauty', label:L('تجميل وعناية','Beauté & soins','Beauty & care'),
      icon:'💄',
      children:[
        { id:'skincare',    label:L('عناية بالبشرة','Soins du visage','Skincare') },
        { id:'haircare',    label:L('عناية بالشعر','Soins capillaires','Hair care') },
        { id:'makeup',      label:L('مكياج','Maquillage','Makeup') },
        { id:'perfumes',    label:L('عطور','Parfums','Perfumes') },
        { id:'wigs',        label:L('شعر مستعار','Perruques','Wigs') },
        { id:'nails',       label:L('أظافر','Ongles','Nails') },
        { id:'other_be',    label:L('أخرى','Autres','Other') },
      ]
    },
    {
      id:'accessories', label:L('إكسسوارات','Accessoires','Accessories'),
      icon:'👜',
      children:[
        { id:'bags',     label:L('حقائب','Sacs','Bags') },
        { id:'jewelry',  label:L('مجوهرات','Bijoux','Jewelry') },
        { id:'belts',    label:L('أحزمة','Ceintures','Belts') },
        { id:'scarves',  label:L('أوشحة وحجاب','Foulards','Scarves') },
        { id:'watches',  label:L('ساعات','Montres','Watches') },
        { id:'glasses',  label:L('نظارات','Lunettes','Glasses') },
        { id:'other_ac', label:L('أخرى','Autres','Other') },
      ]
    },
    {
      id:'services', label:L('خدمات','Services','Services'),
      icon:'✂️',
      children:[
        { id:'sewing',    label:L('خياطة وتفصيل','Couture','Sewing') },
        { id:'makeup_sv', label:L('مكياج أعراس','Maquillage mariée','Wedding makeup') },
        { id:'hair_sv',   label:L('تسريحات','Coiffure','Hairstyling') },
        { id:'henna',     label:L('حناء','Henné','Henna') },
        { id:'sweets',    label:L('حلويات','Pâtisseries','Sweets') },
        { id:'photo',     label:L('تصوير','Photographie','Photography') },
        { id:'deco',      label:L('ديكور أعراس','Décoration','Decoration') },
        { id:'other_sv',  label:L('أخرى','Autres','Other') },
      ]
    },
  ];

  /* ===== API ===== */
  window.CATEGORIES = {
    all(){ return TREE; },

    find(id){ return TREE.find(c=>c.id===id); },

    byCat(catId){
      const cat=TREE.find(c=>c.id===catId);
      return cat?.children||[];
    },

    label(id){
      for(const c of TREE){
        if(c.id===id) return c.label;
        const sub=(c.children||[]).find(s=>s.id===id);
        if(sub) return sub.label;
      }
      return id;
    },

    /* شرائح الأصناف الرئيسية */
    renderChips(container, activeId=''){
      if(!container) return;
      container.innerHTML='';
      TREE.forEach(c=>{
        const btn=document.createElement('button');
        btn.className='chip'+(c.id===activeId?' active':'');
        btn.dataset.cat=c.id;
        btn.innerHTML=`${c.icon||''} ${c.label}`;
        container.appendChild(btn);
      });
    },
  };

})();
