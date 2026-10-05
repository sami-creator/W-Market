/* config.js — ضبط عام مركزي */
'use strict';
const APP = window.APP || {};

/* ===== ألوان التطبيق (أكثر من 10) ===== */
APP.COLORS = [
  { id:'rose',    label:'وردي كلاسيكي', hex:'#c2607a' },
  { id:'pink',    label:'وردي نيون',     hex:'#e91e8c' },
  { id:'beige',   label:'بيج',           hex:'#a67c52' },
  { id:'gold',    label:'ذهبي',          hex:'#c9962e' },
  { id:'cream',   label:'كريمي',         hex:'#8f7a6b' },
  { id:'purple',  label:'بنفسجي',        hex:'#8b5cf6' },
  { id:'lavender',label:'لافندر',         hex:'#9d74c4' },
  { id:'teal',    label:'بترولي',         hex:'#0d9488' },
  { id:'mint',    label:'أخضر نعناعي',   hex:'#10b981' },
  { id:'coral',   label:'مرجاني',        hex:'#f0694a' },
  { id:'orange',  label:'برتقالي',       hex:'#ea8b2f' },
  { id:'sky',     label:'سماوي',         hex:'#0ea5e9' },
  { id:'indigo',  label:'نيلي',          hex:'#4f46e5' },
  { id:'red',     label:'أحمر',          hex:'#dc2626' },
  { id:'emerald', label:'زمردي',         hex:'#059669' },
];

/* ===== الخطوط (Times New Roman افتراضي + 5) ===== */
APP.FONTS = [
  { id:'times',    label:'Times New Roman',  stack:"'Times New Roman','Georgia',serif",          default:true },
  { id:'scheherazade', label:'Scheherazade', stack:"'Scheherazade New','Times New Roman',serif"  },
  { id:'amiri',    label:'Amiri',            stack:"'Amiri','Times New Roman',serif"              },
  { id:'noto',     label:'Noto Serif Arabic',stack:"'Noto Serif Arabic','Times New Roman',serif"  },
  { id:'playfair', label:'Playfair Display', stack:"'Playfair Display','Times New Roman',serif"  },
  { id:'lora',     label:'Lora',             stack:"'Lora','Times New Roman',serif"               },
];

/* ===== ثوابت افتراضية ===== */
APP.DEFAULTS = {
  theme:      'dark',
  color:      'rose',
  font:       'times',
  lang:       'ar',
  delivery:   false,      /* التوصيل افتراضياً غير متوفر */
  condition:  'new',      /* جديد افتراضياً */
  listingType:'sale',     /* بيع فقط افتراضياً */
};

/* ===== مقاسات ملابس ===== */
APP.CLOTHING_SIZES = ['XS','S','M','L','XL','XXL','XXXL','36','38','40','42','44','46','48','50','52','54'];

/* ===== مقاسات أحذية (موسّعة) ===== */
APP.SHOE_SIZES = [
  '34','34.5','35','35.5','36','36.5','37','37.5',
  '38','38.5','39','39.5','40','40.5','41','41.5',
  '42','42.5','43','44','45','46','47','48'
];

/* ===== ألوان الملابس (موسّعة) ===== */
APP.ITEM_COLORS = [
  { id:'white',     label:'أبيض',           hex:'#ffffff', border:true },
  { id:'ivory',     label:'عاجي',           hex:'#fffff0', border:true },
  { id:'cream',     label:'كريمي',          hex:'#fffdd0', border:true },
  { id:'beige',     label:'بيج',            hex:'#f5f0eb' },
  { id:'champagne', label:'شمبانيا',         hex:'#f7e7ce' },
  { id:'gold',      label:'ذهبي',           hex:'#ffd700' },
  { id:'silver',    label:'فضي',            hex:'#c0c0c0' },
  { id:'pink',      label:'وردي فاتح',      hex:'#ffb6c1' },
  { id:'fuchsia',   label:'فوشيا',          hex:'#ff00ff' },
  { id:'red',       label:'أحمر',           hex:'#e02020' },
  { id:'burgundy',  label:'عنابي',          hex:'#800020' },
  { id:'orange',    label:'برتقالي',        hex:'#ff8c00' },
  { id:'coral',     label:'مرجاني',         hex:'#ff6347' },
  { id:'yellow',    label:'أصفر',           hex:'#ffd700' },
  { id:'green',     label:'أخضر',           hex:'#228b22' },
  { id:'olive',     label:'زيتوني',         hex:'#808000' },
  { id:'mint',      label:'نعناعي',         hex:'#98ff98' },
  { id:'teal',      label:'بترولي',         hex:'#008080' },
  { id:'blue',      label:'أزرق',           hex:'#1a73e8' },
  { id:'navy',      label:'كحلي',           hex:'#1b2a6b' },
  { id:'sky',       label:'سماوي',          hex:'#87ceeb' },
  { id:'purple',    label:'بنفسجي',         hex:'#800080' },
  { id:'lavender',  label:'لافندر',         hex:'#e6e6fa' },
  { id:'brown',     label:'بني',            hex:'#8b4513' },
  { id:'taupe',     label:'تاوب',           hex:'#b5a79b' },
  { id:'gray',      label:'رمادي',          hex:'#9e9e9e' },
  { id:'charcoal',  label:'رمادي داكن',     hex:'#444444' },
  { id:'black',     label:'أسود',           hex:'#111111' },
  { id:'multi',     label:'متعدد الألوان',  hex:'linear-gradient(135deg,#f00,#0f0,#00f)' },
];

/* ===== أسباب الإبلاغ ===== */
APP.REPORT_REASONS = [
  {
    id:'drugs', label:{ ar:'مخدرات أو ممنوعات', fr:'Drogues/produits illicites', en:'Drugs or prohibited items' },
    sub:{ ar:['بيع مخدرات','كحول','تبغ مجهول المصدر','أخرى'], fr:['Drogues','Alcool','Tabac','Autre'], en:['Drugs','Alcohol','Tobacco','Other'] }
  },
  {
    id:'weapons', label:{ ar:'أسلحة أو أدوات خطيرة', fr:'Armes/objets dangereux', en:'Weapons or dangerous items' },
    sub:{ ar:['سلاح ناري','سلاح أبيض','متفجرات','أخرى'], fr:['Arme à feu','Couteau','Explosifs','Autre'], en:['Firearm','Knife','Explosives','Other'] }
  },
  {
    id:'pharma', label:{ ar:'مواد صيدلانية تحتاج وصفة', fr:'Médicaments sur ordonnance', en:'Prescription drugs' },
    sub:{ ar:['دواء بدون وصفة','مواد طبية محظورة','مكملات مجهولة','أخرى'], fr:['Méd. sans ordo.','Produits interdits','Compléments douteux','Autre'], en:['No prescription','Banned','Unknown supplements','Other'] }
  },
  {
    id:'sexual', label:{ ar:'تلميحات جنسية', fr:'Contenu sexuel', en:'Sexual content' },
    sub:{ ar:['صور مسيئة','نص جنسي','خدمات مخلة','أخرى'], fr:['Images indécentes','Texte sexuel','Services','Autre'], en:['Indecent images','Sexual text','Services','Other'] }
  },
  {
    id:'hate', label:{ ar:'تحريض على الكراهية', fr:'Incitation à la haine', en:'Hate speech' },
    sub:{ ar:['عنصرية','كراهية دينية','تمييز','أخرى'], fr:['Racisme','Haine religieuse','Discrimination','Autre'], en:['Racism','Religious hate','Discrimination','Other'] }
  },
  {
    id:'political', label:{ ar:'موضوع سياسي', fr:'Contenu politique', en:'Political content' },
    sub:{ ar:['دعاية حزبية','تحريض','أخرى'], fr:['Propagande','Incitation','Autre'], en:['Propaganda','Incitement','Other'] }
  },
  {
    id:'other', label:{ ar:'أخرى', fr:'Autre', en:'Other' },
    sub:null /* حقل نص حر */
  },
];

/* ===== أنواع الإعلان ===== */
APP.LISTING_TYPES = [
  { id:'sale',      label:{ ar:'بيع فقط',          fr:'Vente uniquement',   en:'Sale only'       } },
  { id:'rent',      label:{ ar:'كراء فقط',          fr:'Location uniquement',en:'Rent only'       } },
  { id:'both',      label:{ ar:'بيع أو كراء',       fr:'Vente ou location',  en:'Sale or rent'    } },
];

/* ===== 58 ولاية مرتّبة حسب الرقم ===== */
APP.WILAYAS = [
  {n:1,ar:'أدرار',fr:'Adrar'},{n:2,ar:'الشلف',fr:'Chlef'},{n:3,ar:'الأغواط',fr:'Laghouat'},
  {n:4,ar:'أم البواقي',fr:'Oum El Bouaghi'},{n:5,ar:'باتنة',fr:'Batna'},{n:6,ar:'بجاية',fr:'Béjaïa'},
  {n:7,ar:'بسكرة',fr:'Biskra'},{n:8,ar:'بشار',fr:'Béchar'},{n:9,ar:'البليدة',fr:'Blida'},
  {n:10,ar:'البويرة',fr:'Bouira'},{n:11,ar:'تمنراست',fr:'Tamanrasset'},{n:12,ar:'تبسة',fr:'Tébessa'},
  {n:13,ar:'تلمسان',fr:'Tlemcen'},{n:14,ar:'تيارت',fr:'Tiaret'},{n:15,ar:'تيزي وزو',fr:'Tizi Ouzou'},
  {n:16,ar:'الجزائر',fr:'Alger'},{n:17,ar:'الجلفة',fr:'Djelfa'},{n:18,ar:'جيجل',fr:'Jijel'},
  {n:19,ar:'سطيف',fr:'Sétif'},{n:20,ar:'سعيدة',fr:'Saïda'},{n:21,ar:'سكيكدة',fr:'Skikda'},
  {n:22,ar:'سيدي بلعباس',fr:'Sidi Bel Abbès'},{n:23,ar:'عنابة',fr:'Annaba'},{n:24,ar:'قالمة',fr:'Guelma'},
  {n:25,ar:'قسنطينة',fr:'Constantine'},{n:26,ar:'المدية',fr:'Médéa'},{n:27,ar:'مستغانم',fr:'Mostaganem'},
  {n:28,ar:'المسيلة',fr:'M\'Sila'},{n:29,ar:'معسكر',fr:'Mascara'},{n:30,ar:'ورقلة',fr:'Ouargla'},
  {n:31,ar:'وهران',fr:'Oran'},{n:32,ar:'البيض',fr:'El Bayadh'},{n:33,ar:'إليزي',fr:'Illizi'},
  {n:34,ar:'برج بوعريريج',fr:'Bordj Bou Arréridj'},{n:35,ar:'بومرداس',fr:'Boumerdès'},
  {n:36,ar:'الطارف',fr:'El Tarf'},{n:37,ar:'تندوف',fr:'Tindouf'},{n:38,ar:'تيسمسيلت',fr:'Tissemsilt'},
  {n:39,ar:'الوادي',fr:'El Oued'},{n:40,ar:'خنشلة',fr:'Khenchela'},{n:41,ar:'سوق أهراس',fr:'Souk Ahras'},
  {n:42,ar:'تيبازة',fr:'Tipaza'},{n:43,ar:'ميلة',fr:'Mila'},{n:44,ar:'عين الدفلى',fr:'Aïn Defla'},
  {n:45,ar:'النعامة',fr:'Naâma'},{n:46,ar:'عين تموشنت',fr:'Aïn Témouchent'},{n:47,ar:'غرداية',fr:'Ghardaïa'},
  {n:48,ar:'غليزان',fr:'Relizane'},{n:49,ar:'تيميمون',fr:'Timimoun'},{n:50,ar:'برج باجي مختار',fr:'Bordj Badji Mokhtar'},
  {n:51,ar:'أولاد جلال',fr:'Ouled Djellal'},{n:52,ar:'بني عباس',fr:'Béni Abbès'},
  {n:53,ar:'عين صالح',fr:'In Salah'},{n:54,ar:'عين قزام',fr:'In Guezzam'},
  {n:55,ar:'توقرت',fr:'Touggourt'},{n:56,ar:'جانت',fr:'Djanet'},
  {n:57,ar:'المغير',fr:'El M\'Ghair'},{n:58,ar:'المنيعة',fr:'El Menia'},
];

window.APP = APP;
