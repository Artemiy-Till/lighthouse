import { ApiRequestError } from '../../api/client';

const fieldNames = {
  category: 'Категория',
  childrenPolicy: 'Посещение с детьми',
  cityId: 'Город',
  description: 'Подробное описание',
  durationMinutes: 'Длительность',
  format: 'Формат',
  groupSize: 'До скольки человек',
  intro: 'Коротко о маршруте',
  meetingPoint: 'Место встречи',
  photoUrls: 'Фотографии',
  priceRub: 'Цена',
  scheduleSlots: 'Доступные даты и время',
  title: 'Название',
} as const;

export class PhotoUploadError extends Error {
  constructor(
    readonly photoNumber: number,
    readonly originalError: unknown,
  ) {
    super('Photo upload failed');
    this.name = 'PhotoUploadError';
  }
}

function validationMessage(message: string) {
  const minimumLength = /longer than or equal to (\d+) characters/.exec(
    message,
  );
  if (minimumLength) return `Нужно минимум ${minimumLength[1]} символов.`;

  const maximumLength = /shorter than or equal to (\d+) characters/.exec(
    message,
  );
  if (maximumLength) return `Допустимо не больше ${maximumLength[1]} символов.`;

  const minimum = /must not be less than (\d+)/.exec(message);
  if (minimum) return `Значение должно быть не меньше ${minimum[1]}.`;

  const maximum = /must not be greater than (\d+)/.exec(message);
  if (maximum) return `Значение должно быть не больше ${maximum[1]}.`;

  if (message.includes('must be a URL address')) {
    return 'Адрес фотографии некорректен. Загрузите её заново.';
  }
  if (message.includes('must contain no more than')) {
    return 'Добавлено слишком много значений.';
  }
  if (message.includes('must contain at least')) {
    return 'Добавьте хотя бы одно значение.';
  }
  if (message.includes('must be one of the following values')) {
    return 'Выберите значение из списка.';
  }
  return 'Проверьте значение этого поля.';
}

export function experienceSubmissionError(error: unknown): string {
  if (error instanceof PhotoUploadError) {
    const prefix = `Фотография ${error.photoNumber}: `;
    const original = error.originalError;
    if (original instanceof ApiRequestError) {
      if (original.status === 413) {
        return `${prefix}файл слишком большой для загрузки. Выберите другое фото или уменьшите его.`;
      }
      if (original.message === 'Photo must be no larger than 3 MB') {
        return `${prefix}после обработки превышает 3 МБ. Выберите другое фото или уменьшите его.`;
      }
      if (original.message === 'Only JPEG, PNG and WebP photos are allowed') {
        return `${prefix}допустимы только JPEG, PNG и WebP.`;
      }
      if (original.details.some((detail) => detail.includes('dataUrl'))) {
        return `${prefix}после обработки слишком большая. Выберите другое фото или уменьшите его.`;
      }
      return `${prefix}не удалось загрузить (ошибка сервера ${original.status}). Повторите попытку.`;
    }
    if (original instanceof Error && /[А-Яа-яЁё]/.test(original.message)) {
      return `${prefix}${original.message}`;
    }
    return `${prefix}не удалось обработать файл. Выберите другое фото.`;
  }

  if (error instanceof ApiRequestError) {
    if (error.message === 'Schedule dates must be in the future') {
      return 'Доступные даты и время: выбранное время уже прошло. Удалите его и добавьте будущее.';
    }
    for (const message of error.details) {
      for (const [field, label] of Object.entries(fieldNames)) {
        if (new RegExp(`\\b${field}\\b`).test(message)) {
          return `${label}: ${validationMessage(message)}`;
        }
      }
    }
    if (error.status === 413) {
      return 'Фотографии: размер запроса слишком большой. Уменьшите фотографии и повторите попытку.';
    }
    if (error.status >= 500) {
      return `Сервер не смог сохранить экскурсию (ошибка ${error.status}). Повторите попытку.`;
    }
    if (error.message === 'Create a professional profile first') {
      return 'Сначала заполните профессиональный профиль гида.';
    }
    return `Не удалось сохранить экскурсию (ошибка ${error.status}). Проверьте данные и повторите попытку.`;
  }

  return 'Не удалось связаться с сервером. Проверьте соединение и повторите попытку.';
}
