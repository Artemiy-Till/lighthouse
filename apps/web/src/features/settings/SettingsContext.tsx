import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Language = 'en' | 'ru';

const translations = {
  'nav.home': { en: 'Home', ru: 'Главная' },
  'nav.catalog': { en: 'Explore', ru: 'Каталог' },
  'nav.favorites': { en: 'Saved', ru: 'Избранное' },
  'nav.orders': { en: 'Bookings', ru: 'Заказы' },
  'nav.profile': { en: 'Profile', ru: 'Профиль' },
  'nav.main': { en: 'Main navigation', ru: 'Основная навигация' },
  'settings.title': { en: 'Settings', ru: 'Настройки' },
  'settings.subtitle': {
    en: 'Language, appearance and notifications.',
    ru: 'Язык, оформление и уведомления.',
  },
  'settings.interface': { en: 'Interface', ru: 'Интерфейс' },
  'settings.language': { en: 'Language', ru: 'Язык' },
  'settings.russian': { en: 'Russian', ru: 'Русский' },
  'settings.english': { en: 'English', ru: 'Английский' },
  'settings.appearance': { en: 'Appearance', ru: 'Оформление' },
  'settings.light': { en: 'Light', ru: 'Светлая' },
  'settings.dark': { en: 'Dark', ru: 'Тёмная' },
  'settings.notifications': { en: 'Notifications', ru: 'Уведомления' },
  'settings.reminders': {
    en: 'Tour reminders',
    ru: 'Напоминания об экскурсиях',
  },
  'settings.remindersHint': {
    en: 'One day and two hours before start',
    ru: 'За день и за два часа до начала',
  },
  'settings.messages': { en: 'Messages from guides', ru: 'Сообщения от гидов' },
  'settings.messagesHint': {
    en: 'Schedule and meeting point updates',
    ru: 'Изменения времени и места встречи',
  },
  'settings.offers': { en: 'Offers and news', ru: 'Скидки и новости' },
  'settings.offersHint': {
    en: 'Occasional recommendations',
    ru: 'Иногда присылать подборки',
  },
  'settings.saved': {
    en: 'Changes are saved automatically',
    ru: 'Изменения сохраняются автоматически',
  },
  'profile.settings': { en: 'Settings', ru: 'Настройки' },
  'profile.settingsHint': {
    en: 'Language and notifications',
    ru: 'Язык и уведомления',
  },
  'profile.guide': { en: 'Guide dashboard', ru: 'Кабинет гида' },
  'profile.guideHint': {
    en: 'Create and publish tours',
    ru: 'Создавать и публиковать экскурсии',
  },
  'profile.orders': { en: 'My bookings', ru: 'Мои заказы' },
  'profile.noOrders': { en: 'No bookings yet', ru: 'Пока нет записей' },
  'profile.hasOrder': {
    en: 'Upcoming tour booked',
    ru: 'Есть предстоящая экскурсия',
  },
  'profile.theme': { en: 'Dark theme', ru: 'Тёмная тема' },
  'common.on': { en: 'On', ru: 'Включена' },
  'common.off': { en: 'Off', ru: 'Выключена' },
  'common.all': { en: 'All', ru: 'Все' },
  'common.reset': { en: 'Reset filters', ru: 'Сбросить фильтры' },
  'home.favorite': { en: 'Saved', ru: 'Избранное' },
  'home.heroAlt': { en: 'City panorama:', ru: 'Панорама города' },
  'home.eyebrow': { en: 'Experiences nearby', ru: 'Впечатления рядом' },
  'home.title': {
    en: 'See the city in a new way',
    ru: 'Откройте город по‑новому',
  },
  'home.subtitle': {
    en: 'Tours and walks with people who know every story',
    ru: 'Экскурсии и прогулки с теми, кто знает каждую его историю',
  },
  'home.searchAria': { en: 'Search experiences', ru: 'Поиск впечатлений' },
  'home.search': {
    en: 'Where would you like to go?',
    ru: 'Куда или что хотите посмотреть?',
  },
  'home.mood': { en: 'Choose your mood', ru: 'Выберите настроение' },
  'home.activities': { en: 'Things to do', ru: 'Чем заняться' },
  'home.travelers': { en: "Travelers' choice", ru: 'Выбор путешественников' },
  'home.popular': { en: 'Popular in', ru: 'Популярное в' },
  'home.emptyTitle': { en: 'Nothing found yet', ru: 'Пока ничего не нашли' },
  'home.emptyText': {
    en: 'Try another search or reset the selected category.',
    ru: 'Попробуйте другой запрос или сбросьте выбранную категорию.',
  },
  'home.localTip': { en: 'Local tip', ru: 'Совет от местных' },
  'home.helpTitle': {
    en: 'Not sure what to choose?',
    ru: 'Не знаете, что выбрать?',
  },
  'home.helpText': {
    en: 'We collected routes for a first introduction to the city.',
    ru: 'Собрали маршруты для первого знакомства с городом.',
  },
  'home.collection': { en: 'View collection', ru: 'Посмотреть подборку' },
  'catalog.title': { en: 'Experience catalog', ru: 'Каталог впечатлений' },
  'catalog.subtitle': {
    en: 'Tours, walks and unusual routes around the city.',
    ru: 'Экскурсии, прогулки и необычные маршруты по городу.',
  },
  'catalog.search': { en: 'Find a tour', ru: 'Найти экскурсию' },
  'catalog.categories': { en: 'Categories', ru: 'Категории' },
  'catalog.sort': { en: 'Sort', ru: 'Сортировка' },
  'catalog.popular': { en: 'Popular', ru: 'Популярные' },
  'catalog.rating': { en: 'Top rated', ru: 'По рейтингу' },
  'catalog.price': { en: 'Lowest price', ru: 'Сначала дешевле' },
  'catalog.emptyTitle': { en: 'Nothing found', ru: 'Ничего не найдено' },
  'catalog.emptyText': {
    en: 'Change your search or choose another category.',
    ru: 'Измените запрос или выберите другую категорию.',
  },
  'favorites.kicker': { en: 'Saved', ru: 'Сохранённое' },
  'favorites.title': { en: 'Saved experiences', ru: 'Избранное' },
  'favorites.subtitle': {
    en: 'All your ideas for future walks in one place.',
    ru: 'Все идеи для будущих прогулок в одном месте.',
  },
  'favorites.saved': { en: 'Saved:', ru: 'Сохранено:' },
  'favorites.hint': {
    en: 'Tap the heart on a card to remove a tour.',
    ru: 'Нажмите на сердце в карточке, чтобы удалить экскурсию.',
  },
  'favorites.emptyTitle': { en: 'Nothing here yet', ru: 'Здесь пока пусто' },
  'favorites.emptyText': {
    en: 'Save tours you like to return to them later.',
    ru: 'Сохраняйте понравившиеся экскурсии, чтобы вернуться к ним позже.',
  },
  'favorites.toCatalog': { en: 'Explore tours', ru: 'Перейти в каталог' },
  'card.details': { en: 'More about tour', ru: 'Подробнее об экскурсии' },
  'card.addFavorite': { en: 'Add to saved', ru: 'Добавить в избранное' },
  'card.removeFavorite': {
    en: 'Remove from saved',
    ru: 'Удалить из избранного',
  },
  'card.reviews': { en: 'reviews', ru: 'отзывов' },
  'city.choose': { en: 'Choose city. Current:', ru: 'Выбрать город. Сейчас' },
  'city.your': { en: 'Your city', ru: 'Ваш город' },
  'city.destination': { en: 'Destination', ru: 'Направление' },
  'city.title': { en: 'Choose a city', ru: 'Выберите город' },
  'city.close': { en: 'Close city picker', ru: 'Закрыть выбор города' },
  'date.any': { en: 'Any date', ru: 'Любая дата' },
  'date.today': { en: 'Today', ru: 'Сегодня' },
  'date.tomorrow': { en: 'Tomorrow', ru: 'Завтра' },
  'date.weekend': { en: 'This weekend', ru: 'В выходные' },
  'date.kicker': { en: 'When to go', ru: 'Когда отправимся' },
  'date.title': { en: 'Choose a date', ru: 'Выберите дату' },
  'date.close': { en: 'Close date picker', ru: 'Закрыть выбор даты' },
  'date.quick': { en: 'Quick date selection', ru: 'Быстрый выбор даты' },
  'date.calendar': {
    en: 'Or choose a day in the calendar',
    ru: 'Или выберите день в календаре',
  },
  'date.show': { en: 'Show options', ru: 'Показать варианты' },
  'theme.toLight': { en: 'Switch to light theme', ru: 'Включить светлую тему' },
  'theme.toDark': { en: 'Switch to dark theme', ru: 'Включить тёмную тему' },
  'filter.button': { en: 'Filters', ru: 'Фильтры' },
  'filter.active': { en: 'active filters', ru: 'активных фильтра' },
  'filter.kicker': { en: 'Refine results', ru: 'Настройте выдачу' },
  'filter.close': { en: 'Close filters', ru: 'Закрыть фильтры' },
  'filter.price': { en: 'Price per person', ru: 'Цена за человека' },
  'filter.duration': { en: 'Duration', ru: 'Длительность' },
  'filter.format': { en: 'Format', ru: 'Формат' },
  'filter.rating': { en: 'Rating', ru: 'Рейтинг' },
  'filter.children': { en: 'With children', ru: 'С детьми' },
  'filter.anyFeminine': { en: 'Any', ru: 'Любая' },
  'filter.anyMasculine': { en: 'Any', ru: 'Любой' },
  'filter.under1500': { en: 'Up to ₽1,500', ru: 'До 1 500 ₽' },
  'filter.under2000': { en: 'Up to ₽2,000', ru: 'До 2 000 ₽' },
  'filter.under3000': { en: 'Up to ₽3,000', ru: 'До 3 000 ₽' },
  'filter.under2h': { en: 'Up to 2 hours', ru: 'До 2 часов' },
  'filter.twoThreeH': { en: '2–3 hours', ru: '2–3 часа' },
  'filter.over3h': { en: 'Over 3 hours', ru: 'Более 3 часов' },
  'filter.walking': { en: 'Walking', ru: 'Пешком' },
  'filter.water': { en: 'By water', ru: 'По воде' },
  'filter.transport': { en: 'By transport', ru: 'На транспорте' },
  'filter.from49': { en: '4.90+', ru: 'От 4,90' },
  'filter.from495': { en: '4.95+', ru: 'От 4,95' },
  'filter.doesNotMatter': { en: 'Does not matter', ru: 'Неважно' },
  'filter.family': { en: 'Family friendly', ru: 'Подходит с детьми' },
  'filter.reset': { en: 'Reset', ru: 'Сбросить' },
  'orders.kicker': { en: 'Your trips', ru: 'Ваши поездки' },
  'orders.title': { en: 'My bookings', ru: 'Мои заказы' },
  'orders.subtitle': {
    en: 'Tickets, meeting details and your experience history.',
    ru: 'Билеты, детали встреч и история ваших впечатлений.',
  },
  'orders.filter': { en: 'Booking filter', ru: 'Фильтр заказов' },
  'orders.upcoming': { en: 'Upcoming', ru: 'Предстоящие' },
  'orders.history': { en: 'History', ru: 'История' },
  'orders.openMax': {
    en: 'Open the app inside MAX',
    ru: 'Откройте приложение внутри MAX',
  },
  'orders.openMaxHint': {
    en: 'Then we can show your bookings.',
    ru: 'Тогда мы сможем показать ваши записи.',
  },
  'orders.loading': { en: 'Loading bookings…', ru: 'Загружаем заказы…' },
  'orders.error': {
    en: 'Could not load bookings.',
    ru: 'Не удалось загрузить заказы.',
  },
  'orders.noUpcoming': {
    en: 'No upcoming tours',
    ru: 'Нет предстоящих экскурсий',
  },
  'orders.noHistory': { en: 'History is empty', ru: 'История пока пуста' },
  'orders.emptyHint': {
    en: 'Choose a tour in the catalog and book a convenient date.',
    ru: 'Выберите экскурсию в каталоге и запишитесь на удобную дату.',
  },
  'orders.cancelled': { en: 'Cancelled', ru: 'Отменено' },
  'orders.confirmed': { en: 'Confirmed', ru: 'Подтверждено' },
  'orders.completed': { en: 'Completed', ru: 'Завершено' },
  'orders.date': { en: 'Date', ru: 'Дата' },
  'orders.participants': { en: 'Participants', ru: 'Участники' },
  'orders.price': { en: 'Total', ru: 'Стоимость' },
  'orders.number': { en: 'Booking number', ru: 'Номер заказа' },
  'orders.meeting': { en: 'Meeting point', ru: 'Место встречи' },
  'orders.hide': { en: 'Hide details', ru: 'Скрыть детали' },
  'orders.details': { en: 'Booking details', ru: 'Подробнее о заказе' },
  'orders.cancel': { en: 'Cancel booking', ru: 'Отменить запись' },
} as const;

export type TranslationKey = keyof typeof translations;

interface SettingsContextValue {
  readonly bookingReminders: boolean;
  readonly guideMessages: boolean;
  readonly language: Language;
  readonly offers: boolean;
  readonly setBookingReminders: (value: boolean) => void;
  readonly setGuideMessages: (value: boolean) => void;
  readonly setLanguage: (value: Language) => void;
  readonly setOffers: (value: boolean) => void;
  readonly t: (key: TranslationKey) => string;
}

const fallbackSettings: SettingsContextValue = {
  bookingReminders: true,
  guideMessages: true,
  language: 'ru',
  offers: false,
  setBookingReminders: () => undefined,
  setGuideMessages: () => undefined,
  setLanguage: () => undefined,
  setOffers: () => undefined,
  t: (key) => translations[key].ru,
};

const SettingsContext = createContext<SettingsContextValue>(fallbackSettings);
const readBoolean = (key: string, fallback: boolean) => {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value === 'true';
  } catch {
    return fallback;
  }
};

export function SettingsProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [language, setLanguage] = useState<Language>(() =>
    window.localStorage.getItem('marketplace-language') === 'en' ? 'en' : 'ru',
  );
  const [bookingReminders, setBookingReminders] = useState(() =>
    readBoolean('marketplace-booking-reminders', true),
  );
  const [guideMessages, setGuideMessages] = useState(() =>
    readBoolean('marketplace-guide-messages', true),
  );
  const [offers, setOffers] = useState(() =>
    readBoolean('marketplace-offers', false),
  );

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem('marketplace-language', language);
  }, [language]);
  useEffect(
    () =>
      window.localStorage.setItem(
        'marketplace-booking-reminders',
        String(bookingReminders),
      ),
    [bookingReminders],
  );
  useEffect(
    () =>
      window.localStorage.setItem(
        'marketplace-guide-messages',
        String(guideMessages),
      ),
    [guideMessages],
  );
  useEffect(
    () => window.localStorage.setItem('marketplace-offers', String(offers)),
    [offers],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      bookingReminders,
      guideMessages,
      language,
      offers,
      setBookingReminders,
      setGuideMessages,
      setLanguage,
      setOffers,
      t: (key) => translations[key][language],
    }),
    [bookingReminders, guideMessages, language, offers],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
