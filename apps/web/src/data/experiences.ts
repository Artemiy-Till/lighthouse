import { type CityId } from './cities';

export interface Experience {
  readonly badge?: string;
  readonly category: string;
  readonly cityId: CityId;
  readonly duration: string;
  readonly id: string;
  readonly image: string;
  readonly price: string;
  readonly rating: string;
  readonly reviews: number;
  readonly title: string;
}

export interface ExperienceDetails {
  readonly children: string;
  readonly description: string;
  readonly format: string;
  readonly groupSize: string;
  readonly groupType: string;
  readonly highlights: readonly string[];
  readonly intro: string;
  readonly meetingPoint: string;
}

export const categories = [
  { emoji: '🚶', label: 'Обзорные' },
  { emoji: '🏛️', label: 'Музеи' },
  { emoji: '⛵', label: 'По воде' },
  { emoji: '🌙', label: 'Вечерние' },
  { emoji: '🍽️', label: 'Гастро' },
  { emoji: '👨‍👩‍👧', label: 'С детьми' },
] as const;

export const experiences: readonly Experience[] = [
  {
    badge: 'Хит',
    category: 'Обзорные',
    cityId: 'saint-petersburg',
    duration: '2 часа · Пешком',
    id: 'first-meeting',
    image: '/images/saint-petersburg-hero.webp',
    price: 'от 1 290 ₽',
    rating: '4,96',
    reviews: 328,
    title: 'Петербург: первое знакомство',
  },
  {
    badge: 'Авторская',
    category: 'Музеи',
    cityId: 'saint-petersburg',
    duration: '1,5 часа · Пешком',
    id: 'hidden-courtyards',
    image: '/images/hidden-courtyards.webp',
    price: 'от 1 800 ₽',
    rating: '4,91',
    reviews: 184,
    title: 'Дворы, парадные и старые истории',
  },
  {
    badge: 'Сегодня',
    category: 'Вечерние',
    cityId: 'saint-petersburg',
    duration: '1,5 часа · На катере',
    id: 'drawbridges',
    image: '/images/drawbridges.webp',
    price: 'от 1 590 ₽',
    rating: '4,88',
    reviews: 517,
    title: 'Разводные мосты с воды',
  },
  {
    category: 'По воде',
    cityId: 'saint-petersburg',
    duration: '5 часов · Мини-группа',
    id: 'kronstadt',
    image: '/images/kronstadt.webp',
    price: 'от 3 200 ₽',
    rating: '4,94',
    reviews: 96,
    title: 'Форты и маяки Кронштадта',
  },
  {
    badge: 'Хит',
    category: 'Обзорные',
    cityId: 'moscow',
    duration: '2,5 часа · Пешком',
    id: 'moscow-first-meeting',
    image: '/images/moscow-kremlin.webp',
    price: 'от 1 490 ₽',
    rating: '4,97',
    reviews: 412,
    title: 'Москва: первое знакомство',
  },
  {
    badge: 'Новинка',
    category: 'С детьми',
    cityId: 'moscow',
    duration: '2 часа · Пешком',
    id: 'moscow-modern-center',
    image: '/images/moscow-zaryadye.webp',
    price: 'от 1 700 ₽',
    rating: '4,89',
    reviews: 86,
    title: 'Москва будущего: парк и новый центр',
  },
  {
    badge: 'Бестселлер',
    category: 'Музеи',
    cityId: 'moscow',
    duration: '1,5 часа · Пешком',
    id: 'moscow-metro',
    image: '/images/moscow-metro.webp',
    price: 'от 1 350 ₽',
    rating: '4,95',
    reviews: 276,
    title: 'Подземные дворцы московского метро',
  },
  {
    category: 'Гастро',
    cityId: 'moscow',
    duration: '3 часа · Мини-группа',
    id: 'moscow-old-lanes',
    image: '/images/moscow-lanes.webp',
    price: 'от 2 600 ₽',
    rating: '4,92',
    reviews: 143,
    title: 'Старая Москва: переулки и чайные истории',
  },
  {
    badge: 'Хит',
    category: 'Обзорные',
    cityId: 'kazan',
    duration: '2 часа · Пешком',
    id: 'kazan-kremlin',
    image: '/images/kazan-kremlin.webp',
    price: 'от 1 290 ₽',
    rating: '4,98',
    reviews: 351,
    title: 'Казанский кремль и две культуры',
  },
  {
    badge: 'Авторская',
    category: 'Гастро',
    cityId: 'kazan',
    duration: '3 часа · Пешком',
    id: 'kazan-tatar-quarter',
    image: '/images/kazan-tatar-quarter.webp',
    price: 'от 2 300 ₽',
    rating: '4,96',
    reviews: 207,
    title: 'Старо-Татарская слобода со вкусом',
  },
  {
    category: 'С детьми',
    cityId: 'kazan',
    duration: '2 часа · Пешком',
    id: 'kazan-bauman-street',
    image: '/images/kazan-bauman.webp',
    price: 'от 1 450 ₽',
    rating: '4,9',
    reviews: 118,
    title: 'Улица Баумана: легенды старой Казани',
  },
  {
    badge: 'Вечером',
    category: 'По воде',
    cityId: 'kazan',
    duration: '1,5 часа · На теплоходе',
    id: 'kazan-river',
    image: '/images/kazan-river.webp',
    price: 'от 1 600 ₽',
    rating: '4,91',
    reviews: 164,
    title: 'Огни Казани с воды',
  },
  {
    badge: 'Хит',
    category: 'Обзорные',
    cityId: 'kostroma',
    duration: '2 часа · Пешком',
    id: 'kostroma-first-meeting',
    image: '/images/kostroma-fire-tower.webp',
    price: 'от 1 200 ₽',
    rating: '4,97',
    reviews: 286,
    title: 'Кострома: первое знакомство',
  },
  {
    badge: 'Бестселлер',
    category: 'Музеи',
    cityId: 'kostroma',
    duration: '3 часа · Мини-группа',
    id: 'kostroma-ipatiev-monastery',
    image: '/images/kostroma-ipatiev.webp',
    price: 'от 1 900 ₽',
    rating: '4,95',
    reviews: 173,
    title: 'Ипатьевский монастырь и история Романовых',
  },
  {
    badge: 'Авторская',
    category: 'С детьми',
    cityId: 'kostroma',
    duration: '2,5 часа · Пешком',
    id: 'kostroma-wooden-streets',
    image: '/images/kostroma-wooden-houses.webp',
    price: 'от 1 550 ₽',
    rating: '4,92',
    reviews: 94,
    title: 'Деревянная Кострома и старые улицы',
  },
  {
    badge: 'На закате',
    category: 'По воде',
    cityId: 'kostroma',
    duration: '1,5 часа · На теплоходе',
    id: 'kostroma-volga-cruise',
    image: '/images/kostroma-volga.webp',
    price: 'от 1 400 ₽',
    rating: '4,9',
    reviews: 128,
    title: 'Кострома с Волги на закате',
  },
];

export function getExperiencesForCity(cityId: CityId) {
  return experiences.filter((experience) => experience.cityId === cityId);
}

export function formatOfferCount(count: number) {
  if (count % 10 === 1 && count % 100 !== 11) return `${count} предложение`;
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return `${count} предложения`;
  }
  return `${count} предложений`;
}

const experienceDetails: Readonly<Record<string, ExperienceDetails>> = {
  'first-meeting': {
    children: 'Можно с детьми от 7 лет',
    description:
      'Спокойная прогулка для первого знакомства с Петербургом. Пройдём от Невского проспекта к Дворцовой площади, увидим главные ансамбли города и разберёмся, как имперская столица менялась на протяжении трёх веков.',
    format: 'Пешком',
    groupSize: 'До 12 человек',
    groupType: 'Мини-группа',
    highlights: [
      'Невский проспект и Казанский собор',
      'Дворцовая площадь',
      'Истории петербуржцев разных эпох',
    ],
    intro: 'Главные места и истории города за одну насыщенную прогулку.',
    meetingPoint: 'У выхода со станции метро «Адмиралтейская»',
  },
  'hidden-courtyards': {
    children: 'Подходит участникам от 12 лет',
    description:
      'Заглянем в парадные доходных домов, пройдём через дворы-колодцы и поговорим о быте их прежних жильцов. Маршрут проходит по открытым общественным пространствам и показывает непарадную сторону города.',
    format: 'Пешком',
    groupSize: 'До 10 человек',
    groupType: 'Авторская прогулка',
    highlights: [
      'Парадные старых доходных домов',
      'Дворы-колодцы',
      'Городские легенды без мифов',
    ],
    intro: 'Непарадный Петербург, скрытый за фасадами центральных улиц.',
    meetingPoint: 'У станции метро «Владимирская»',
  },
  drawbridges: {
    children: 'Можно с детьми от 5 лет',
    description:
      'Вечерний маршрут по Неве на небольшом катере. Увидим подсвеченные набережные, пройдём под мостами и встретим главный момент белых ночей с воды.',
    format: 'На катере',
    groupSize: 'До 11 человек',
    groupType: 'Мини-группа',
    highlights: [
      'Развод Дворцового моста',
      'Ночная панорама Невы',
      'Тёплые пледы на борту',
    ],
    intro: 'Лучшие виды на ночной Петербург с воды.',
    meetingPoint: 'Причал на набережной реки Фонтанки, 21',
  },
  kronstadt: {
    children: 'Можно с детьми от 8 лет',
    description:
      'Отправимся на остров Котлин, посетим Морской собор и прогуляемся по берегу Финского залива. Гид расскажет о фортах, моряках и роли Кронштадта в истории страны.',
    format: 'Автомобильно-пешеходная',
    groupSize: 'До 8 человек',
    groupType: 'Мини-группа',
    highlights: [
      'Морской Никольский собор',
      'Берег Финского залива',
      'Петровский док и форты',
    ],
    intro: 'Морская история, форты и простор Финского залива.',
    meetingPoint: 'У станции метро «Беговая»',
  },
  'moscow-first-meeting': {
    children: 'Можно с детьми от 7 лет',
    description:
      'Пройдём по историческому центру от Манежной площади до Зарядья. Поговорим о стенах Кремля, старых торговых рядах и о том, как Москва стала городом разных эпох.',
    format: 'Пешком',
    groupSize: 'До 12 человек',
    groupType: 'Мини-группа',
    highlights: [
      'Красная и Манежная площади',
      'Александровский сад',
      'Панорама из Зарядья',
    ],
    intro: 'Главные символы столицы и понятная история центра Москвы.',
    meetingPoint: 'У памятника маршалу Жукову на Манежной площади',
  },
  'moscow-modern-center': {
    children: 'Особенно интересно детям 8–14 лет',
    description:
      'Семейная прогулка о современной Москве: исследуем парк Зарядье, найдём необычные архитектурные решения и посмотрим, как новые пространства соседствуют с древними улицами.',
    format: 'Пешком',
    groupSize: 'До 10 человек',
    groupType: 'Семейная группа',
    highlights: [
      'Парящий мост',
      'Интерактивные задания',
      'Современная архитектура центра',
    ],
    intro: 'Исследование новой Москвы в игровом формате для всей семьи.',
    meetingPoint: 'У входа в парк «Зарядье» со стороны Москворецкой улицы',
  },
  'moscow-metro': {
    children: 'Можно с детьми от 10 лет',
    description:
      'Проедем по одной из самых красивых линий метро и рассмотрим станции как цельный архитектурный ансамбль. Узнаем, что скрывают мозаики, витражи и бронзовые скульптуры.',
    format: 'Пешком и на метро',
    groupSize: 'До 15 человек',
    groupType: 'Групповая экскурсия',
    highlights: [
      'Мозаики станции «Маяковская»',
      'Скульптуры «Площади Революции»',
      'Архитектурные детали и символы',
    ],
    intro: 'История московского метро через архитектуру его лучших станций.',
    meetingPoint: 'В центре зала станции метро «Маяковская»',
  },
  'moscow-old-lanes': {
    children: 'Подходит участникам от 12 лет',
    description:
      'Прогуляемся по тихим переулкам старой Москвы, найдём купеческие особняки и завершим маршрут чаепитием. Поговорим о городских привычках, кухне и людях, которые создавали характер столицы.',
    format: 'Пешком',
    groupSize: 'До 8 человек',
    groupType: 'Гастро-прогулка',
    highlights: [
      'Купеческие особняки',
      'Истории московских трактиров',
      'Чаепитие с угощением',
    ],
    intro: 'Переулки, купеческие истории и традиционное чаепитие.',
    meetingPoint: 'У выхода № 1 станции метро «Китай-город»',
  },
  'kazan-kremlin': {
    children: 'Можно с детьми от 6 лет',
    description:
      'Познакомимся с ансамблем Казанского кремля и историей города, где веками соседствуют разные культуры. Посетим мечеть Кул-Шариф и увидим старейшие постройки крепости.',
    format: 'Пешком',
    groupSize: 'До 15 человек',
    groupType: 'Мини-группа',
    highlights: ['Мечеть Кул-Шариф', 'Благовещенский собор', 'Башня Сююмбике'],
    intro: 'Две культуры и главные памятники тысячелетнего города.',
    meetingPoint: 'У Спасской башни Казанского кремля',
  },
  'kazan-tatar-quarter': {
    children: 'Можно с детьми от 8 лет',
    description:
      'Пройдём по ярким улицам Старо-Татарской слободы, узнаем о быте казанских купцов и попробуем блюда национальной кухни. Дегустации входят в маршрут.',
    format: 'Пешком',
    groupSize: 'До 10 человек',
    groupType: 'Гастро-прогулка',
    highlights: [
      'Усадьбы татарских купцов',
      'Старинные мечети',
      'Дегустация национальных блюд',
    ],
    intro: 'История татарского района через архитектуру и местную кухню.',
    meetingPoint: 'У театра имени Камала на площади Театральной',
  },
  'kazan-bauman-street': {
    children: 'Рекомендуется детям 7–14 лет',
    description:
      'Игровая прогулка по главной пешеходной улице Казани. Будем разгадывать загадки, искать городские символы и узнаем, почему местные легенды пережили не одно столетие.',
    format: 'Пешком',
    groupSize: 'До 12 человек',
    groupType: 'Семейная группа',
    highlights: [
      'Колокольня Богоявленского собора',
      'Казанский кот',
      'Задания и загадки для детей',
    ],
    intro: 'Нескучная история города в формате семейного квеста.',
    meetingPoint: 'У часов на улице Баумана',
  },
  'kazan-river': {
    children: 'Можно с детьми от 5 лет',
    description:
      'Вечером выйдем на воду и увидим подсвеченный кремль, набережную и современные районы Казани. На борту гид расскажет короткие истории о городе и Волге.',
    format: 'На теплоходе',
    groupSize: 'До 30 человек',
    groupType: 'Групповая прогулка',
    highlights: [
      'Панорама Казанского кремля',
      'Закат над Волгой',
      'Открытая и закрытая палубы',
    ],
    intro: 'Вечерняя панорама Казани и огни набережной с воды.',
    meetingPoint: 'Главный причал Казанского речного порта',
  },
  'kostroma-first-meeting': {
    children: 'Можно с детьми от 7 лет',
    description:
      'Начнём на Сусанинской площади, увидим знаменитую пожарную каланчу и пройдём по старым торговым рядам к волжской набережной. Гид поможет прочитать историю города в его планировке, фасадах и купеческих легендах.',
    format: 'Пешком',
    groupSize: 'До 12 человек',
    groupType: 'Мини-группа',
    highlights: ['Сусанинская площадь', 'Пожарная каланча', 'Торговые ряды'],
    intro:
      'Главные символы Костромы и истории купеческого города за одну прогулку.',
    meetingPoint: 'У памятника Ивану Сусанину на Сусанинской площади',
  },
  'kostroma-ipatiev-monastery': {
    children: 'Можно с детьми от 8 лет',
    description:
      'Познакомимся с ансамблем Ипатьевского монастыря и поговорим о событиях, связавших Кострому с династией Романовых. Осмотрим монастырские стены, собор и исторические палаты.',
    format: 'Пешком',
    groupSize: 'До 15 человек',
    groupType: 'Мини-группа',
    highlights: [
      'Троицкий собор',
      'Палаты бояр Романовых',
      'Панорама реки Костромы',
    ],
    intro: 'Монастырский ансамбль и одна из ключевых страниц русской истории.',
    meetingPoint: 'У главного входа в Ипатьевский монастырь',
  },
  'kostroma-wooden-streets': {
    children: 'Особенно интересно детям 7–14 лет',
    description:
      'Отправимся искать резные наличники, старые деревянные дома и следы ремесленной Костромы. Маршрут построен как семейное исследование с заданиями и понятными историями о городском быте.',
    format: 'Пешком',
    groupSize: 'До 10 человек',
    groupType: 'Семейная группа',
    highlights: ['Резные наличники', 'Купеческие дома', 'Задания для детей'],
    intro:
      'Тёплая семейная прогулка среди деревянных домов и старых городских историй.',
    meetingPoint: 'У входа в Центральный парк на проспекте Мира',
  },
  'kostroma-volga-cruise': {
    children: 'Можно с детьми от 5 лет',
    description:
      'Выйдем на Волгу в мягком вечернем свете и увидим панораму Костромы с воды. На борту гид расскажет о речной торговле, набережной и жизни города на великой русской реке.',
    format: 'На теплоходе',
    groupSize: 'До 30 человек',
    groupType: 'Групповая прогулка',
    highlights: ['Панорама набережной', 'Закат над Волгой', 'Открытая палуба'],
    intro: 'Спокойная речная прогулка с лучшими видами на вечернюю Кострому.',
    meetingPoint: 'Причал № 1 Костромского речного порта',
  },
};

export function getExperienceById(id: string) {
  return experiences.find((experience) => experience.id === id);
}

export function getExperienceDetails(id: string) {
  return experienceDetails[id];
}

const experienceRestrictions: Readonly<Record<string, readonly string[]>> = {
  'first-meeting': ['Гости на инвалидных колясках', 'Дети младше 7 лет'],
  'hidden-courtyards': [
    'Гости на инвалидных колясках',
    'Родители с детскими колясками',
    'Дети младше 12 лет',
  ],
  drawbridges: [
    'Дети младше 5 лет',
    'Гости с выраженной морской болезнью',
    'Гости на инвалидных колясках из-за посадки на катер',
  ],
  kronstadt: [
    'Дети младше 8 лет',
    'Гости, которым тяжело долго находиться в дороге',
  ],
  'moscow-first-meeting': ['Гости на инвалидных колясках', 'Дети младше 7 лет'],
  'moscow-modern-center': [
    'Дети младше 6 лет',
    'Гости, которым противопоказаны длительные прогулки',
  ],
  'moscow-metro': [
    'Гости на инвалидных колясках',
    'Дети младше 10 лет',
    'Гости, которым тяжело пользоваться эскалаторами',
  ],
  'moscow-old-lanes': [
    'Дети младше 12 лет',
    'Гости с пищевой аллергией без предварительного согласования меню',
  ],
  'kazan-kremlin': [
    'Гости на инвалидных колясках без сопровождающего',
    'Дети младше 6 лет',
  ],
  'kazan-tatar-quarter': [
    'Дети младше 8 лет',
    'Гости с пищевой аллергией без предварительного согласования дегустаций',
  ],
  'kazan-bauman-street': [
    'Дети младше 7 лет',
    'Гости, которым противопоказаны активные прогулки',
  ],
  'kazan-river': ['Дети младше 5 лет', 'Гости с выраженной морской болезнью'],
  'kostroma-first-meeting': [
    'Гости на инвалидных колясках',
    'Дети младше 7 лет',
  ],
  'kostroma-ipatiev-monastery': [
    'Гости на инвалидных колясках без сопровождающего',
    'Дети младше 8 лет',
  ],
  'kostroma-wooden-streets': [
    'Гости на инвалидных колясках из-за неровного покрытия',
    'Дети младше 7 лет',
  ],
  'kostroma-volga-cruise': [
    'Дети младше 5 лет',
    'Гости с выраженной морской болезнью',
  ],
};

export function getExperienceRestrictions(id: string) {
  return experienceRestrictions[id] ?? [];
}
