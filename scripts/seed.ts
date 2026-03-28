import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

// =====================================================
// LOCALES
// =====================================================
const LOCALES = ['fr', 'en', 'ar', 'zh'] as const;

async function seed() {
  console.log('🌱 Seeding database...\n');

  // =====================================================
  // ROOMS
  // =====================================================
  console.log('🛏️  Seeding rooms...');
  const roomsData = [
    { slug: 'single', roomType: 'single' as const, capacity: 1, price: '88.00', sortOrder: 0 },
    { slug: 'double-1-bed', roomType: 'double' as const, capacity: 2, price: '98.00', sortOrder: 1 },
    { slug: 'double-2-beds', roomType: 'twin' as const, capacity: 2, price: '108.00', sortOrder: 2 },
    { slug: 'triple', roomType: 'triple' as const, capacity: 3, price: '125.00', sortOrder: 3 },
    { slug: 'quad', roomType: 'quad' as const, capacity: 4, price: '140.00', sortOrder: 4 },
    { slug: 'five', roomType: 'five' as const, capacity: 5, price: '155.00', sortOrder: 5 },
  ];

  const roomTranslations: Record<string, Record<string, { name: string; description: string }>> = {
    single: {
      fr: { name: 'Chambre 1 personne', description: 'Chambre confortable pour une personne avec salle de bain, WC, télévision et wifi.' },
      en: { name: 'Single room', description: 'Comfortable single room with bathroom, WC, television and wifi.' },
      ar: { name: 'غرفة فردية', description: 'غرفة فردية مريحة مع حمام ومرحاض وتلفزيون وواي فاي.' },
      zh: { name: '单人房', description: '舒适的单人房，配有浴室、卫生间、电视和无线网络。' },
    },
    'double-1-bed': {
      fr: { name: 'Chambre 2 personnes (1 lit)', description: 'Chambre double avec un grand lit, salle de bain, WC, télévision et wifi.' },
      en: { name: 'Double room (1 bed)', description: 'Double room with one large bed, bathroom, WC, television and wifi.' },
      ar: { name: 'غرفة مزدوجة (سرير واحد)', description: 'غرفة مزدوجة مع سرير كبير واحد، حمام، مرحاض، تلفزيون وواي فاي.' },
      zh: { name: '双人房（一张床）', description: '双人房，配有一张大床、浴室、卫生间、电视和无线网络。' },
    },
    'double-2-beds': {
      fr: { name: 'Chambre 2 personnes (2 lits)', description: 'Chambre double avec deux lits séparés, salle de bain, WC, télévision et wifi.' },
      en: { name: 'Double room (2 beds)', description: 'Double room with two separate beds, bathroom, WC, television and wifi.' },
      ar: { name: 'غرفة مزدوجة (سريرين)', description: 'غرفة مزدوجة مع سريرين منفصلين، حمام، مرحاض، تلفزيون وواي فاي.' },
      zh: { name: '双人房（两张床）', description: '双人房，配有两张独立床、浴室、卫生间、电视和无线网络。' },
    },
    triple: {
      fr: { name: 'Chambre 3 personnes', description: 'Chambre spacieuse pour trois personnes avec salle de bain, WC, télévision et wifi.' },
      en: { name: 'Triple room', description: 'Spacious triple room with bathroom, WC, television and wifi.' },
      ar: { name: 'غرفة ثلاثية', description: 'غرفة ثلاثية واسعة مع حمام ومرحاض وتلفزيون وواي فاي.' },
      zh: { name: '三人房', description: '宽敞的三人房，配有浴室、卫生间、电视和无线网络。' },
    },
    quad: {
      fr: { name: 'Chambre 4 personnes', description: 'Grande chambre familiale pour quatre personnes avec salle de bain, WC, télévision et wifi.' },
      en: { name: 'Quadruple room', description: 'Large family room for four with bathroom, WC, television and wifi.' },
      ar: { name: 'غرفة رباعية', description: 'غرفة عائلية كبيرة لأربعة أشخاص مع حمام ومرحاض وتلفزيون وواي فاي.' },
      zh: { name: '四人房', description: '宽敞的四人家庭房，配有浴室、卫生间、电视和无线网络。' },
    },
    five: {
      fr: { name: 'Chambre 5 personnes', description: 'Notre plus grande chambre pour cinq personnes avec salle de bain, WC, télévision et wifi.' },
      en: { name: 'Five-person room', description: 'Our largest room for five people with bathroom, WC, television and wifi.' },
      ar: { name: 'غرفة لخمسة أشخاص', description: 'أكبر غرفنا لخمسة أشخاص مع حمام ومرحاض وتلفزيون وواي فاي.' },
      zh: { name: '五人房', description: '我们最大的五人房，配有浴室、卫生间、电视和无线网络。' },
    },
  };

  for (const room of roomsData) {
    const [inserted] = await db.insert(schema.rooms).values({
      slug: room.slug,
      roomType: room.roomType,
      capacity: room.capacity,
      pricePerNight: room.price,
      sortOrder: room.sortOrder,
    }).returning();

    for (const locale of LOCALES) {
      const t = roomTranslations[room.slug][locale];
      await db.insert(schema.roomTranslations).values({
        roomId: inserted.id,
        locale,
        name: t.name,
        description: t.description,
      });
    }
  }

  // =====================================================
  // ROOM EXTRAS
  // =====================================================
  console.log('💰 Seeding room extras...');
  const extrasData = [
    { slug: 'breakfast', price: '14.00', sortOrder: 0 },
    { slug: 'half-board', price: '88.00', sortOrder: 1 },
    { slug: 'half-board-child', price: '44.00', sortOrder: 2 },
    { slug: 'full-board', price: '112.00', sortOrder: 3 },
    { slug: 'single-supplement', price: '35.00', sortOrder: 4 },
    { slug: 'full-board-child', price: '56.00', sortOrder: 5 },
    { slug: 'tourist-tax', price: '0.85', sortOrder: 6 },
  ];

  const extraTranslations: Record<string, Record<string, string>> = {
    breakfast: {
      fr: 'Petit déjeuner : buffet 14 €',
      en: 'Breakfast: buffet €14',
      ar: 'فطور: بوفيه 14 يورو',
      zh: '早餐：自助餐 14欧元',
    },
    'half-board': {
      fr: 'Demi-pension : 88 € minimum 3 jours — prix par jour et par personne',
      en: 'Half board: €88 minimum 3 days — price per day per person',
      ar: 'نصف إقامة: 88 يورو الحد الأدنى 3 أيام — السعر لليوم للشخص',
      zh: '半膳：88欧元 最少3天 — 每人每天价格',
    },
    'half-board-child': {
      fr: 'Enfant 2 à 5 ans : 44 €, de 5 à 10 ans : 56 €',
      en: 'Child 2 to 5 years: €44, 5 to 10 years: €56',
      ar: 'طفل من 2 إلى 5 سنوات: 44 يورو، من 5 إلى 10 سنوات: 56 يورو',
      zh: '2至5岁儿童：44欧元，5至10岁：56欧元',
    },
    'full-board': {
      fr: 'Pension complète : 112 € minimum 3 jours — prix par jour et par personne',
      en: 'Full board: €112 minimum 3 days — price per day per person',
      ar: 'إقامة كاملة: 112 يورو الحد الأدنى 3 أيام — السعر لليوم للشخص',
      zh: '全膳：112欧元 最少3天 — 每人每天价格',
    },
    'single-supplement': {
      fr: 'Supplément chambre individuelle : 35 €',
      en: 'Single room supplement: €35',
      ar: 'تكملة غرفة فردية: 35 يورو',
      zh: '单人房补充：35欧元',
    },
    'full-board-child': {
      fr: 'Enfant de 2 à 5 ans : 56 €, de 5 à 10 ans : 68 €',
      en: 'Child 2 to 5 years: €56, 5 to 10 years: €68',
      ar: 'طفل من 2 إلى 5 سنوات: 56 يورو، من 5 إلى 10 سنوات: 68 يورو',
      zh: '2至5岁儿童：56欧元，5至10岁：68欧元',
    },
    'tourist-tax': {
      fr: 'Taxe de séjour : 0,85 € (+18 ans) — Supplément chien : 5 €/jour',
      en: 'Tourist tax: €0.85 (+18 years) — Dog supplement: €5/day',
      ar: 'ضريبة الإقامة: 0.85 يورو (+18 سنة) — تكملة كلب: 5 يورو/يوم',
      zh: '旅游税：0.85欧元（18岁以上）— 宠物犬补充：5欧元/天',
    },
  };

  for (const extra of extrasData) {
    const [inserted] = await db.insert(schema.roomExtras).values({
      slug: extra.slug,
      price: extra.price,
      sortOrder: extra.sortOrder,
    }).returning();

    for (const locale of LOCALES) {
      await db.insert(schema.roomExtraTranslations).values({
        extraId: inserted.id,
        locale,
        label: extraTranslations[extra.slug][locale],
      });
    }
  }

  // =====================================================
  // OPENINGS
  // =====================================================
  console.log('📅 Seeding openings...');

  const openingsData = [
    {
      season: 'summer' as const,
      year: 2026,
      restaurantStartDate: '2026-03-09',
      restaurantEndDate: '2026-10-21',
      hotelStartDate: '2026-07-05',
      hotelEndDate: '2026-09-01',
      sortOrder: 0,
    },
    {
      season: 'winter' as const,
      year: 2026,
      restaurantStartDate: '2026-12-09',
      restaurantEndDate: '2027-04-02',
      hotelStartDate: '2026-12-21',
      hotelEndDate: '2027-03-10',
      sortOrder: 1,
    },
  ];

  const openingTranslationsData: Record<string, Record<string, {
    title: string; restaurantLabel: string; restaurantDates: string;
    hotelLabel: string; hotelDates: string; closedDays: string;
  }>> = {
    'summer-2026': {
      fr: {
        title: 'Saison ÉTÉ',
        restaurantLabel: 'Restaurant',
        restaurantDates: 'Du 9/3/26 au 21/10/26',
        hotelLabel: 'Hôtel',
        hotelDates: 'Du 5/7/26 au 1/9/26 (+week-end juin, septembre, octobre)',
        closedDays: 'Fermé le Lundi et le Dimanche Soir',
      },
      en: {
        title: 'SUMMER Season',
        restaurantLabel: 'Restaurant',
        restaurantDates: 'From 9/3/26 to 21/10/26',
        hotelLabel: 'Hotel',
        hotelDates: 'From 5/7/26 to 1/9/26 (+weekends June, September, October)',
        closedDays: 'Closed on Mondays and Sunday Evenings',
      },
      ar: {
        title: 'موسم الصيف',
        restaurantLabel: 'المطعم',
        restaurantDates: 'من 9/3/26 إلى 21/10/26',
        hotelLabel: 'الفندق',
        hotelDates: 'من 5/7/26 إلى 1/9/26 (+عطلة نهاية الأسبوع يونيو، سبتمبر، أكتوبر)',
        closedDays: 'مغلق يوم الاثنين ومساء الأحد',
      },
      zh: {
        title: '夏季',
        restaurantLabel: '餐厅',
        restaurantDates: '2026年5月9日至2026年10月21日',
        hotelLabel: '酒店',
        hotelDates: '2026年7月5日至2026年9月1日（+六月、九月、十月周末）',
        closedDays: '每周一及周日晚间休息',
      },
    },
    'winter-2026': {
      fr: {
        title: 'Saison HIVER',
        restaurantLabel: 'Restaurant',
        restaurantDates: 'Du 9/12/26 au 2/4/27',
        hotelLabel: 'Hôtel',
        hotelDates: 'Du 21/12/26 au 7/1/27 et du 9/2/27 au 10/3/27 (+week-end janvier et mars)',
        closedDays: 'Fermé le Lundi et le Dimanche Soir',
      },
      en: {
        title: 'WINTER Season',
        restaurantLabel: 'Restaurant',
        restaurantDates: 'From 9/12/26 to 2/4/27',
        hotelLabel: 'Hotel',
        hotelDates: 'From 21/12/26 to 7/1/27 and from 9/2/27 to 10/3/27 (+weekends January and March)',
        closedDays: 'Closed on Mondays and Sunday Evenings',
      },
      ar: {
        title: 'موسم الشتاء',
        restaurantLabel: 'المطعم',
        restaurantDates: 'من 9/12/26 إلى 2/4/27',
        hotelLabel: 'الفندق',
        hotelDates: 'من 21/12/26 إلى 7/1/27 ومن 9/2/27 إلى 10/3/27 (+عطلة نهاية الأسبوع يناير ومارس)',
        closedDays: 'مغلق يوم الاثنين ومساء الأحد',
      },
      zh: {
        title: '冬季',
        restaurantLabel: '餐厅',
        restaurantDates: '2026年12月9日至2027年4月2日',
        hotelLabel: '酒店',
        hotelDates: '2026年12月21日至2027年1月7日及2027年2月9日至2027年3月10日（+一月及三月周末）',
        closedDays: '每周一及周日晚间休息',
      },
    },
  };

  for (const opening of openingsData) {
    const [inserted] = await db.insert(schema.openings).values(opening).returning();
    const key = `${opening.season}-${opening.year}`;

    for (const locale of LOCALES) {
      const t = openingTranslationsData[key][locale];
      await db.insert(schema.openingTranslations).values({
        openingId: inserted.id,
        locale,
        ...t,
      });
    }
  }

  // =====================================================
  // PARTNERS
  // =====================================================
  console.log('🤝 Seeding partners...');
  const partnersData = [
    { slug: 'alpes-bivouac', name: 'Alpes Bivouac', sortOrder: 0 },
    { slug: 'amt-organisation', name: 'AMT Organisation', sortOrder: 1 },
    { slug: 'annecy-aventure', name: 'Annecy Aventure', sortOrder: 2 },
    { slug: 'annecy-takamaka', name: 'Annecy Takamaka', sortOrder: 3 },
    { slug: 'que-faire-a-annecy', name: 'Que Faire à Annecy', sortOrder: 4 },
    { slug: 'semnoz', name: 'Semnoz', sortOrder: 5 },
  ];

  for (const partner of partnersData) {
    await db.insert(schema.partners).values(partner);
  }

  // =====================================================
  // RESTAURANT MENUS
  // =====================================================
  console.log('🍽️  Seeding restaurant menus...');

  // -- Menu du Jour --
  const [menuDuJour] = await db.insert(schema.restaurantMenus).values({
    slug: 'menu-du-jour',
    price: '35.00',
    year: 2026,
    startDate: '2026-03-09',
    endDate: '2026-10-21',
    isActive: true,
    sortOrder: 0,
  }).returning();

  for (const [locale, name, desc] of [
    ['fr', 'Menu du Jour', 'Notre menu quotidien élaboré avec les produits frais du marché'],
    ['en', 'Daily Menu', 'Our daily menu crafted with fresh market products'],
    ['ar', 'قائمة اليوم', 'قائمتنا اليومية المعدة من منتجات السوق الطازجة'],
    ['zh', '每日套餐', '我们用新鲜市场产品精心制作的每日套餐'],
  ] as const) {
    await db.insert(schema.restaurantMenuTranslations).values({
      menuId: menuDuJour.id, locale, name, description: desc,
    });
  }

  // Categories for Menu du Jour
  const [catEntrees] = await db.insert(schema.menuCategories).values({
    menuId: menuDuJour.id, slug: 'entrees', sortOrder: 0,
  }).returning();

  for (const [locale, name] of [['fr', 'Entrées'], ['en', 'Starters'], ['ar', 'المقبلات'], ['zh', '前菜']] as const) {
    await db.insert(schema.menuCategoryTranslations).values({ categoryId: catEntrees.id, locale, name });
  }

  const [catPlats] = await db.insert(schema.menuCategories).values({
    menuId: menuDuJour.id, slug: 'plats', sortOrder: 1,
  }).returning();

  for (const [locale, name] of [['fr', 'Plats'], ['en', 'Main Courses'], ['ar', 'الأطباق الرئيسية'], ['zh', '主菜']] as const) {
    await db.insert(schema.menuCategoryTranslations).values({ categoryId: catPlats.id, locale, name });
  }

  const [catDesserts] = await db.insert(schema.menuCategories).values({
    menuId: menuDuJour.id, slug: 'desserts', sortOrder: 2,
  }).returning();

  for (const [locale, name] of [['fr', 'Desserts'], ['en', 'Desserts'], ['ar', 'الحلويات'], ['zh', '甜点']] as const) {
    await db.insert(schema.menuCategoryTranslations).values({ categoryId: catDesserts.id, locale, name });
  }

  // Menu items — Entrées
  const entreeItems = [
    { slug: 'soupe-crozets', price: '12.00', imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop', translations: {
      fr: { name: 'Soupe de crozets au Beaufort', description: 'Soupe traditionnelle savoyarde aux crozets et fromage Beaufort' },
      en: { name: 'Crozet soup with Beaufort cheese', description: 'Traditional Savoyard soup with crozets and Beaufort cheese' },
      ar: { name: 'شوربة كروزيه بجبنة بوفور', description: 'شوربة سافوا التقليدية مع كروزيه وجبنة بوفور' },
      zh: { name: '博福特奶酪意面汤', description: '传统萨瓦意面博福特奶酪汤' },
    }},
    { slug: 'salade-montagnarde', price: '14.00', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop', translations: {
      fr: { name: 'Salade Montagnarde', description: 'Salade verte, reblochon, noix, lardons et croûtons' },
      en: { name: 'Mountain Salad', description: 'Green salad, reblochon, walnuts, bacon and croutons' },
      ar: { name: 'سلطة الجبل', description: 'سلطة خضراء، ريبلوشون، جوز، لاردون وخبز محمص' },
      zh: { name: '山区沙拉', description: '绿色沙拉、瑞布罗申奶酪、核桃、培根和面包丁' },
    }},
    { slug: 'terrine-campagne', price: '13.00', imageUrl: 'https://images.unsplash.com/photo-1608039829572-26b9cdb3b6a1?w=600&h=400&fit=crop', translations: {
      fr: { name: 'Terrine de campagne maison', description: 'Terrine maison servie avec cornichons et pain de campagne' },
      en: { name: 'Homemade country terrine', description: 'Homemade terrine served with pickles and country bread' },
      ar: { name: 'تيرين ريفي منزلي', description: 'تيرين منزلي يقدم مع مخللات وخبز ريفي' },
      zh: { name: '自制乡村肉酱', description: '自制肉酱配酸黄瓜和乡村面包' },
    }},
  ];

  for (let i = 0; i < entreeItems.length; i++) {
    const item = entreeItems[i];
    const [inserted] = await db.insert(schema.menuItems).values({
      categoryId: catEntrees.id, slug: item.slug, price: item.price, sortOrder: i,
      imageUrl: (item as Record<string, unknown>).imageUrl as string | undefined,
    }).returning();
    for (const locale of LOCALES) {
      await db.insert(schema.menuItemTranslations).values({
        itemId: inserted.id, locale, ...item.translations[locale],
      });
    }
  }

  // Menu items — Plats
  const platItems = [
    { slug: 'tartiflette', price: '22.00', isSignature: true, imageUrl: 'https://images.unsplash.com/photo-1624726175512-19b9baf9fbd1?w=600&h=400&fit=crop', translations: {
      fr: { name: 'Tartiflette au Reblochon', description: 'La tartiflette traditionnelle au reblochon fermier' },
      en: { name: 'Tartiflette with Reblochon', description: 'Traditional tartiflette with farm reblochon cheese' },
      ar: { name: 'تارتيفليت بالريبلوشون', description: 'تارتيفليت تقليدية بجبنة ريبلوشون المزرعة' },
      zh: { name: '瑞布罗申奶酪土豆焗', description: '传统农场瑞布罗申奶酪焗土豆' },
    }},
    { slug: 'filet-omble', price: '28.00', isGlutenFree: true, imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop', translations: {
      fr: { name: 'Filet d\'omble chevalier du lac', description: 'Omble chevalier du lac d\'Annecy, beurre blanc et légumes de saison' },
      en: { name: 'Lake Arctic char fillet', description: 'Lake Annecy Arctic char, white butter sauce and seasonal vegetables' },
      ar: { name: 'فيليه سمك السلمون المرقط', description: 'سمك من بحيرة أنسي، صلصة الزبدة البيضاء وخضروات الموسم' },
      zh: { name: '湖鲑鱼排', description: '安纳西湖鲑鱼，白黄油汁配时令蔬菜' },
    }},
    { slug: 'fondue-savoyarde', price: '24.00', isVegetarian: true, imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&h=400&fit=crop', translations: {
      fr: { name: 'Fondue Savoyarde', description: 'Mélange de Beaufort, Comté et Emmental servi avec pain frais' },
      en: { name: 'Savoyard Fondue', description: 'Blend of Beaufort, Comté and Emmental served with fresh bread' },
      ar: { name: 'فوندو سافوا', description: 'مزيج من بوفور وكومتيه وإيمنتال يقدم مع خبز طازج' },
      zh: { name: '萨瓦奶酪火锅', description: '博福特、孔泰和埃蒙塔尔奶酪混合，配新鲜面包' },
    }},
    { slug: 'diots-polenta', price: '20.00', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop', translations: {
      fr: { name: 'Diots de Savoie à la polenta', description: 'Saucisses savoyardes cuites au vin blanc, servies avec polenta crémeuse' },
      en: { name: 'Savoyard diots with polenta', description: 'Savoyard sausages cooked in white wine, served with creamy polenta' },
      ar: { name: 'نقانق سافوا مع البولنتا', description: 'نقانق سافوا مطبوخة بالنبيذ الأبيض، تقدم مع بولنتا كريمية' },
      zh: { name: '萨瓦香肠配玉米糊', description: '白葡萄酒烹制的萨瓦香肠，配奶油玉米糊' },
    }},
  ];

  for (let i = 0; i < platItems.length; i++) {
    const item = platItems[i];
    const [inserted] = await db.insert(schema.menuItems).values({
      categoryId: catPlats.id, slug: item.slug, price: item.price, sortOrder: i,
      imageUrl: (item as Record<string, unknown>).imageUrl as string | undefined,
      isSignature: (item as Record<string, unknown>).isSignature === true,
      isVegetarian: (item as Record<string, unknown>).isVegetarian === true,
      isGlutenFree: (item as Record<string, unknown>).isGlutenFree === true,
    }).returning();
    for (const locale of LOCALES) {
      await db.insert(schema.menuItemTranslations).values({
        itemId: inserted.id, locale, ...item.translations[locale],
      });
    }
  }

  // Menu items — Desserts
  const dessertItems = [
    { slug: 'tarte-myrtilles', price: '10.00', imageUrl: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=600&h=400&fit=crop', translations: {
      fr: { name: 'Tarte aux myrtilles du Semnoz', description: 'Tarte maison aux myrtilles sauvages cueillies au Semnoz' },
      en: { name: 'Semnoz blueberry tart', description: 'Homemade tart with wild blueberries from Semnoz' },
      ar: { name: 'فطيرة التوت البري', description: 'فطيرة منزلية بالتوت البري البري المقطوف من سيمنوز' },
      zh: { name: '塞姆诺兹蓝莓馅饼', description: '用塞姆诺兹野生蓝莓制作的自制馅饼' },
    }},
    { slug: 'gateau-noix', price: '10.00', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop', translations: {
      fr: { name: 'Gâteau aux noix de Grenoble', description: 'Gâteau moelleux aux noix de Grenoble et caramel' },
      en: { name: 'Grenoble walnut cake', description: 'Moist Grenoble walnut cake with caramel' },
      ar: { name: 'كعكة الجوز', description: 'كعكة رطبة بجوز غرونوبل والكراميل' },
      zh: { name: '格勒诺布尔核桃蛋糕', description: '格勒诺布尔核桃焦糖湿润蛋糕' },
    }},
    { slug: 'creme-brulee-gentiane', price: '11.00', isSignature: true, imageUrl: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&h=400&fit=crop', translations: {
      fr: { name: 'Crème brûlée à la Gentiane', description: 'Crème brûlée infusée à la liqueur de Gentiane des Alpes' },
      en: { name: 'Gentian crème brûlée', description: 'Crème brûlée infused with Alpine Gentian liqueur' },
      ar: { name: 'كريم بروليه بالجنتيان', description: 'كريم بروليه بنكهة مشروب الجنتيان الألبي' },
      zh: { name: '龙胆草焦糖布丁', description: '注入阿尔卑斯龙胆草利口酒的焦糖布丁' },
    }},
  ];

  for (let i = 0; i < dessertItems.length; i++) {
    const item = dessertItems[i];
    const [inserted] = await db.insert(schema.menuItems).values({
      categoryId: catDesserts.id, slug: item.slug, price: item.price, sortOrder: i,
      imageUrl: (item as Record<string, unknown>).imageUrl as string | undefined,
      isSignature: (item as Record<string, unknown>).isSignature === true,
    }).returning();
    for (const locale of LOCALES) {
      await db.insert(schema.menuItemTranslations).values({
        itemId: inserted.id, locale, ...item.translations[locale],
      });
    }
  }

  // -- Menu Savoyard --
  const [menuSavoyard] = await db.insert(schema.restaurantMenus).values({
    slug: 'menu-savoyard',
    price: '48.00',
    year: 2026,
    startDate: '2026-12-09',
    endDate: '2027-04-02',
    isActive: true,
    sortOrder: 1,
  }).returning();

  for (const [locale, name, desc] of [
    ['fr', 'Menu Savoyard', 'Un voyage culinaire à travers les saveurs de la Savoie'],
    ['en', 'Savoyard Menu', 'A culinary journey through the flavors of Savoy'],
    ['ar', 'قائمة سافوا', 'رحلة طهوية عبر نكهات سافوا'],
    ['zh', '萨瓦套餐', '萨瓦风味美食之旅'],
  ] as const) {
    await db.insert(schema.restaurantMenuTranslations).values({
      menuId: menuSavoyard.id, locale, name, description: desc,
    });
  }

  // -- Menu Enfant --
  const [menuEnfant] = await db.insert(schema.restaurantMenus).values({
    slug: 'menu-enfant',
    price: '13.00',
    year: 2026,
    isActive: true,
    sortOrder: 2,
  }).returning();

  for (const [locale, name, desc] of [
    ['fr', 'Menu Enfant', 'Un menu adapté pour les plus petits'],
    ['en', "Children's Menu", 'A menu adapted for the little ones'],
    ['ar', 'قائمة الأطفال', 'قائمة مخصصة للصغار'],
    ['zh', '儿童套餐', '为小朋友量身定制的套餐'],
  ] as const) {
    await db.insert(schema.restaurantMenuTranslations).values({
      menuId: menuEnfant.id, locale, name, description: desc,
    });
  }

  // =====================================================
  // SERVICES
  // =====================================================
  console.log('🎿 Seeding services...');

  const servicesData = [
    { slug: 'ski', icon: 'mdi:ski', sortOrder: 0, translations: {
      fr: { name: 'Ski & Raquettes', description: 'Pistes de ski alpin et nordique, raquettes à neige au départ de l\'hôtel' },
      en: { name: 'Skiing & Snowshoeing', description: 'Alpine and cross-country ski slopes, snowshoeing from the hotel' },
      ar: { name: 'تزلج ومشي بالأحذية الثلجية', description: 'منحدرات التزلج والتزلج الريفي، مشي بالأحذية الثلجية من الفندق' },
      zh: { name: '滑雪与雪鞋行走', description: '高山和越野滑雪道，从酒店出发的雪鞋行走' },
    }},
    { slug: 'randonnee', icon: 'mdi:walk', sortOrder: 1, translations: {
      fr: { name: 'Randonnée', description: 'Sentiers balisés pour tous niveaux dans le massif du Semnoz' },
      en: { name: 'Hiking', description: 'Marked trails for all levels in the Semnoz massif' },
      ar: { name: 'المشي لمسافات طويلة', description: 'مسارات مميزة لجميع المستويات في كتلة سيمنوز' },
      zh: { name: '徒步旅行', description: '塞姆诺兹山区各级别标记步道' },
    }},
    { slug: 'vtt', icon: 'mdi:bike', sortOrder: 2, translations: {
      fr: { name: 'VTT', description: 'Pistes de VTT descente et cross-country avec location possible' },
      en: { name: 'Mountain Biking', description: 'Downhill and cross-country MTB trails with rental available' },
      ar: { name: 'ركوب الدراجات الجبلية', description: 'مسارات نزول وعبر البلاد مع إمكانية الاستئجار' },
      zh: { name: '山地自行车', description: '下坡和越野山地车道，可租赁' },
    }},
    { slug: 'seminaire', icon: 'mdi:presentation', sortOrder: 3, translations: {
      fr: { name: 'Séminaires', description: 'Salles de réunion équipées pour vos séminaires d\'entreprise en montagne' },
      en: { name: 'Seminars', description: 'Equipped meeting rooms for corporate seminars in the mountains' },
      ar: { name: 'ندوات', description: 'قاعات اجتماعات مجهزة لندوات الشركات في الجبال' },
      zh: { name: '研讨会', description: '设备齐全的会议室，适合山区企业研讨会' },
    }},
  ];

  for (const service of servicesData) {
    const [inserted] = await db.insert(schema.services).values({
      slug: service.slug, icon: service.icon, sortOrder: service.sortOrder,
    }).returning();

    for (const locale of LOCALES) {
      await db.insert(schema.serviceTranslations).values({
        serviceId: inserted.id, locale, ...service.translations[locale],
      });
    }
  }

  // =====================================================
  // SITE SETTINGS
  // =====================================================
  console.log('⚙️  Seeding site settings...');

  const settings = [
    { settingKey: 'site_name', settingValue: 'Les Rochers Blancs', settingType: 'text', category: 'general' },
    { settingKey: 'site_tagline', settingValue: 'Hôtel & Restaurant au Semnoz', settingType: 'text', category: 'general' },
    { settingKey: 'contact_phone', settingValue: '+33 4 50 XX XX XX', settingType: 'text', category: 'contact' },
    { settingKey: 'contact_email', settingValue: 'contact@lesrochersblancs.fr', settingType: 'text', category: 'contact' },
    { settingKey: 'contact_address', settingValue: 'Route du Semnoz, 74000 Annecy, France', settingType: 'text', category: 'contact' },
    { settingKey: 'social_instagram', settingValue: '#', settingType: 'text', category: 'social' },
    { settingKey: 'social_facebook', settingValue: '#', settingType: 'text', category: 'social' },
  ];

  for (const setting of settings) {
    await db.insert(schema.siteSettings).values(setting);
  }

  // =====================================================
  // THEME SETTINGS
  // =====================================================
  console.log('🎨 Seeding theme settings...');

  const themeDefaults = [
    { settingKey: 'primary_color', settingValue: '#1a365d', settingType: 'color', category: 'colors' },
    { settingKey: 'accent_color', settingValue: '#c7923e', settingType: 'color', category: 'colors' },
    { settingKey: 'font_heading', settingValue: 'Playfair Display', settingType: 'text', category: 'fonts' },
    { settingKey: 'font_body', settingValue: 'Manrope', settingType: 'text', category: 'fonts' },
  ];

  for (const theme of themeDefaults) {
    await db.insert(schema.themeSettings).values(theme);
  }

  // =====================================================
  // CMS CONTENT
  // =====================================================
  console.log('📝 Seeding CMS content...');

  const cmsEntries = [
    // Hero section
    { sectionKey: 'hero', fieldKey: 'title', fr: 'Les Rochers Blancs', en: 'Les Rochers Blancs', ar: 'Les Rochers Blancs', zh: 'Les Rochers Blancs' },
    { sectionKey: 'hero', fieldKey: 'subtitle', fr: 'Hôtel & Restaurant au Semnoz', en: 'Hotel & Restaurant at Semnoz', ar: 'فندق ومطعم في سيمنوز', zh: '塞姆诺兹酒店与餐厅' },
    { sectionKey: 'hero', fieldKey: 'tagline', fr: 'Un havre de paix à 1700 mètres d\'altitude au cœur des montagnes de Haute-Savoie', en: 'A haven of peace at 1,700 meters altitude in the heart of Haute-Savoie mountains', ar: 'ملاذ هادئ على ارتفاع 1700 متر في قلب جبال هوت سافوا', zh: '上萨瓦省山脉中心海拔1700米的宁静避风港' },
    // About section
    { sectionKey: 'about', fieldKey: 'description', fr: 'Niché au sommet du Semnoz, Les Rochers Blancs est un refuge d\'exception où tradition et modernité se rencontrent.', en: 'Nestled at the summit of Semnoz, Les Rochers Blancs is an exceptional retreat where tradition and modernity meet.', ar: 'يقع في قمة سيمنوز، روشيه بلان هو ملاذ استثنائي حيث يلتقي التقليد والحداثة.', zh: '坐落于塞姆诺兹山顶，Les Rochers Blancs是传统与现代相遇的卓越避世之所。' },
  ];

  for (const entry of cmsEntries) {
    for (const locale of LOCALES) {
      await db.insert(schema.cmsContent).values({
        sectionKey: entry.sectionKey,
        locale,
        fieldKey: entry.fieldKey,
        content: entry[locale],
      });
    }
  }

  console.log('\n✅ Seed complete!');
  await client.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
