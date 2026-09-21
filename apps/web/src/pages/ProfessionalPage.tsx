import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  createPublishedExperience,
  completeGuideSchedule,
  deletePublishedExperience,
  getGuideProfile,
  getGuideSchedule,
  getOwnPublishedExperiences,
  saveGuideProfile,
  type CreateExperienceInput,
  type PublishedExperience,
  uploadExperiencePhoto,
  updatePublishedExperience,
} from '../api/client';
import { AppLayout } from '../components/AppLayout';
import { ProfileBackLink } from '../components/ProfileBackLink';
import { categories } from '../data/experiences';
import { cities, type CityId } from '../data/cities';
import { getMaxUserChatUrl } from '../features/max/max-chat';
import { useMaxConnection } from '../features/max/useMaxConnection';
import { prepareExperiencePhoto } from '../features/marketplace/prepareExperiencePhoto';

interface SelectedPhoto {
  readonly file: File;
  readonly id: string;
  readonly preview: string;
}

const durationOptions = [60, 90, 120, 150, 180, 240, 300];
const formatOptions = ['Пешком', 'По воде', 'На транспорте'];
const childrenOptions = [
  'Можно с детьми любого возраста',
  'Можно с детьми от 7 лет',
  'Только для взрослых',
];

function formatDurationOption(minutes: number) {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toLocaleString('ru-RU')} ч`;
}

function formValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function todayInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isFutureScheduleSlot(slot: string) {
  return new Date(`${slot}:00`).getTime() > Date.now();
}

function currentTimeInputValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function formatScheduleDate(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  return `${new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(year!, month! - 1, day))}, ${time}`;
}

export function ProfessionalPage() {
  const queryClient = useQueryClient();
  const { platform, session } = useMaxConnection();
  const initData = platform.initData ?? '';
  const [created, setCreated] = useState<PublishedExperience | null>(null);
  const [editing, setEditing] = useState<PublishedExperience | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState<'created' | 'updated'>(
    'created',
  );
  const [deleting, setDeleting] = useState<PublishedExperience | null>(null);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [scheduleSlots, setScheduleSlots] = useState<string[]>([]);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const profile = useQuery({
    enabled: Boolean(initData && session.data?.authenticated),
    queryFn: () => getGuideProfile(initData),
    queryKey: ['guide-profile'],
    retry: false,
  });
  const saveProfile = useMutation({
    mutationFn: (value: { bio: string; displayName: string }) =>
      saveGuideProfile(initData, value),
    onSuccess: (value) => {
      queryClient.setQueryData(['guide-profile'], value);
      queryClient.setQueriesData<PublishedExperience>(
        { queryKey: ['published-experience'] },
        (experience) =>
          experience
            ? {
                ...experience,
                guide: {
                  ...experience.guide,
                  bio: value.bio,
                  displayName: value.displayName,
                  photoUrl: value.photoUrl,
                },
              }
            : experience,
      );
      setEditingProfile(false);
      void queryClient.invalidateQueries({
        queryKey: ['published-experiences'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['published-experience'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['own-published-experiences'],
      });
    },
  });
  const ownExperiences = useQuery({
    enabled: Boolean(initData && profile.data),
    queryFn: () => getOwnPublishedExperiences(initData),
    queryKey: ['own-published-experiences'],
    retry: false,
  });
  const guideSchedule = useQuery({
    enabled: Boolean(initData && profile.data),
    queryFn: () => getGuideSchedule(initData),
    queryKey: ['guide-schedule'],
    retry: false,
  });
  const completeSchedule = useMutation({
    mutationFn: (slot: { date: string; experienceId: string; time: string }) =>
      completeGuideSchedule(initData, slot),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['guide-schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
      ]);
    },
  });
  const saveExperience = useMutation({
    mutationFn: async ({
      existingUrls,
      files,
      id,
      value,
    }: {
      existingUrls: readonly string[];
      files: readonly File[];
      id?: string;
      value: Omit<CreateExperienceInput, 'photoUrls'>;
    }) => {
      const photoUrls = [...existingUrls];
      for (const file of files) {
        const prepared = await prepareExperiencePhoto(file);
        const uploaded = await uploadExperiencePhoto(initData, prepared);
        photoUrls.push(uploaded.url);
      }
      const payload = { ...value, photoUrls };
      return id
        ? updatePublishedExperience(initData, id, payload)
        : createPublishedExperience(initData, payload);
    },
    onSuccess: (value, variables) => {
      setCreated(value);
      setLastAction(variables.id ? 'updated' : 'created');
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
      setExistingPhotoUrls([]);
      setEditing(null);
      setPhotoError(null);
      setScheduleSlots([]);
      setScheduleDate('');
      setScheduleTime('12:00');
      setScheduleError(null);
      void queryClient.invalidateQueries({
        queryKey: ['published-experiences'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['own-published-experiences'],
      });
      void queryClient.invalidateQueries({ queryKey: ['guide-schedule'] });
    },
  });
  const deleteExperience = useMutation({
    mutationFn: (id: string) => deletePublishedExperience(initData, id),
    onSuccess: (_, id) => {
      if (editing?.id === id) resetEditor();
      if (created?.id === id) setCreated(null);
      setDeleting(null);
      void queryClient.invalidateQueries({
        queryKey: ['own-published-experiences'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['published-experiences'],
      });
    },
  });

  const maxName = session.data
    ? [session.data.user.firstName, session.data.user.lastName]
        .filter(Boolean)
        .join(' ')
    : '';

  function handleProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveProfile.mutate({
      bio: formValue(form, 'bio'),
      displayName: formValue(form, 'displayName'),
    });
  }

  function handleExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (photos.length + existingPhotoUrls.length === 0) {
      setPhotoError('Добавьте хотя бы одну фотографию экскурсии.');
      return;
    }
    if (scheduleSlots.length === 0) {
      setScheduleError('Добавьте хотя бы одну доступную дату и время.');
      return;
    }
    if (scheduleSlots.some((slot) => !isFutureScheduleSlot(slot))) {
      setScheduleError(
        'Одна из дат уже прошла. Удалите её и выберите будущее время.',
      );
      return;
    }
    const form = new FormData(event.currentTarget);
    setPhotoError(null);
    saveExperience.mutate({
      existingUrls: existingPhotoUrls,
      files: photos.map((photo) => photo.file),
      id: editing?.id,
      value: {
        category: formValue(form, 'category'),
        childrenPolicy: formValue(form, 'childrenPolicy'),
        cityId: formValue(form, 'cityId') as CityId,
        description: formValue(form, 'description'),
        durationMinutes: Number(formValue(form, 'durationMinutes')),
        format: formValue(form, 'format'),
        groupSize: Number(formValue(form, 'groupSize')),
        intro: formValue(form, 'intro'),
        meetingPoint: formValue(form, 'meetingPoint'),
        priceRub: Number(formValue(form, 'priceRub')),
        scheduleSlots,
        title: formValue(form, 'title'),
      },
    });
  }

  function selectPhotos(files: FileList | null) {
    if (!files) return;
    const available = Math.max(0, 6 - photos.length - existingPhotoUrls.length);
    const selected = Array.from(files).slice(0, available);
    if (selected.length < files.length) {
      setPhotoError('Можно добавить не больше 6 фотографий.');
    } else {
      setPhotoError(null);
    }
    setPhotos((current) => [
      ...current,
      ...selected.map((file) => ({
        file,
        id: crypto.randomUUID(),
        preview: URL.createObjectURL(file),
      })),
    ]);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return current.filter((photo) => photo.id !== id);
    });
  }

  function resetEditor() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setExistingPhotoUrls([]);
    setEditing(null);
    setPhotoError(null);
    setScheduleSlots([]);
    setScheduleDate('');
    setScheduleTime('12:00');
    setScheduleError(null);
  }

  function editExperience(experience: PublishedExperience) {
    resetEditor();
    setCreated(null);
    setEditing(experience);
    setExistingPhotoUrls([...experience.photos]);
    setScheduleSlots(
      (experience.availableSlots ?? []).map(
        (slot) => `${slot.date}T${slot.time}`,
      ),
    );
    window.setTimeout(() => {
      document
        .getElementById('professional-experience-editor')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <AppLayout>
      <main className="secondary-page professional-page">
        <ProfileBackLink />
        <header className="page-header">
          <p className="section-kicker">Кабинет гида</p>
          <h1>Профессиональный аккаунт</h1>
          <p>Создавайте экскурсии — они сразу появятся в общем каталоге.</p>
        </header>

        {!platform.isAvailable || !initData ? (
          <section className="professional-card professional-notice">
            <span aria-hidden="true">🛡️</span>
            <h2>Откройте кабинет внутри MAX</h2>
            <p>Профиль гида привязывается к подтверждённому MAX-аккаунту.</p>
          </section>
        ) : session.isPending || profile.isPending ? (
          <section className="professional-card professional-notice">
            <span aria-hidden="true">⏳</span>
            <h2>Проверяем профиль</h2>
          </section>
        ) : profile.isError ? (
          <section className="professional-card professional-notice is-error">
            <span aria-hidden="true">🗄️</span>
            <h2>Нужна общая база данных</h2>
            <p>
              Подключите PostgreSQL к API-проекту, чтобы публикации были видны
              всем.
            </p>
            <button onClick={() => void profile.refetch()} type="button">
              Повторить
            </button>
          </section>
        ) : profile.data === null ? (
          <form
            className="professional-card professional-form"
            onSubmit={handleProfile}
          >
            <div className="professional-step">
              <span>1</span>
              <div>
                <h2>Станьте гидом</h2>
                <p>Заполните публичную карточку профессионала.</p>
              </div>
            </div>
            <label>
              Имя гида
              <input
                defaultValue={maxName}
                maxLength={80}
                minLength={2}
                name="displayName"
                required
              />
            </label>
            <label>
              О себе
              <textarea
                maxLength={1000}
                minLength={20}
                name="bio"
                placeholder="Расскажите об опыте, любимых маршрутах и своём подходе"
                required
                rows={5}
              />
            </label>
            {saveProfile.isError ? (
              <p className="form-error">
                Не удалось сохранить. Проверьте поля и повторите.
              </p>
            ) : null}
            <button
              className="professional-submit"
              disabled={saveProfile.isPending}
              type="submit"
            >
              {saveProfile.isPending
                ? 'Подключаем…'
                : 'Подключить профессиональный аккаунт'}
            </button>
          </form>
        ) : (
          <>
            {editingProfile ? (
              <form
                className="professional-card professional-form professional-profile-editor"
                onSubmit={handleProfile}
              >
                <div className="professional-step">
                  <span aria-hidden="true">✎</span>
                  <div>
                    <h2>Редактирование профиля</h2>
                    <p>Имя и описание обновятся во всех ваших экскурсиях.</p>
                  </div>
                </div>
                <label>
                  Имя гида
                  <input
                    defaultValue={profile.data.displayName}
                    maxLength={80}
                    minLength={2}
                    name="displayName"
                    required
                  />
                </label>
                <label>
                  О себе
                  <textarea
                    defaultValue={profile.data.bio}
                    maxLength={1000}
                    minLength={20}
                    name="bio"
                    required
                    rows={5}
                  />
                </label>
                {saveProfile.isError ? (
                  <p className="form-error">
                    Не удалось сохранить профиль. Проверьте поля и повторите.
                  </p>
                ) : null}
                <div className="professional-profile-editor__actions">
                  <button
                    disabled={saveProfile.isPending}
                    onClick={() => {
                      saveProfile.reset();
                      setEditingProfile(false);
                    }}
                    type="button"
                  >
                    Отмена
                  </button>
                  <button
                    className="professional-submit"
                    disabled={saveProfile.isPending}
                    type="submit"
                  >
                    {saveProfile.isPending ? 'Сохраняем…' : 'Сохранить профиль'}
                  </button>
                </div>
              </form>
            ) : (
              <section className="professional-card professional-status">
                {profile.data.photoUrl ? (
                  <img
                    alt={`Фото профиля ${profile.data.displayName}`}
                    className="professional-status__avatar"
                    height="96"
                    src={profile.data.photoUrl}
                    width="96"
                  />
                ) : (
                  <span aria-hidden="true">✓</span>
                )}
                <div className="professional-status__copy">
                  <p>Профиль гида активен</p>
                  <h2>{profile.data.displayName}</h2>
                  <small>{profile.data.bio}</small>
                </div>
                <button
                  className="professional-status__edit"
                  onClick={() => {
                    saveProfile.reset();
                    setEditingProfile(true);
                  }}
                  type="button"
                >
                  Редактировать профиль
                </button>
              </section>
            )}
            <section className="professional-card professional-schedule">
              <div>
                <p className="section-kicker">Записи пользователей</p>
                <h2>Актуальные экскурсии</h2>
                <p>
                  Здесь подсвечиваются даты, на которые уже записались гости.
                </p>
              </div>
              {guideSchedule.isPending ? (
                <p className="professional-experiences__empty">
                  Загружаем расписание…
                </p>
              ) : (guideSchedule.data?.items ?? []).filter(
                  (slot) =>
                    slot.status === 'scheduled' && slot.bookingCount > 0,
                ).length === 0 ? (
                <p className="professional-experiences__empty">
                  Пока нет актуальных записей.
                </p>
              ) : (
                <div className="professional-schedule__active-list">
                  {(guideSchedule.data?.items ?? [])
                    .filter(
                      (slot) =>
                        slot.status === 'scheduled' && slot.bookingCount > 0,
                    )
                    .map((slot) => (
                      <article
                        key={`${slot.experienceId}-${slot.date}-${slot.time}`}
                      >
                        <span aria-hidden="true">●</span>
                        <div className="professional-schedule__summary">
                          <strong>{slot.title}</strong>
                          <small>
                            {formatScheduleDate(slot.date, slot.time)} ·{' '}
                            {slot.participants} чел.
                          </small>
                        </div>
                        <div className="professional-schedule__actions">
                          {(slot.guests ?? []).map(
                            (guest, guestIndex, guests) => {
                              const chatUrl = getMaxUserChatUrl(
                                guest.maxUserId,
                                guest.username,
                              );
                              return (
                                <a
                                  href={chatUrl}
                                  key={guest.bookingId}
                                  onClick={(event) => {
                                    if (platform.openMaxLink(chatUrl)) {
                                      event.preventDefault();
                                    }
                                  }}
                                >
                                  <span aria-hidden="true">💬</span>
                                  {guests.length === 1
                                    ? 'Написать гостю'
                                    : `Написать гостю ${guestIndex + 1}`}
                                </a>
                              );
                            },
                          )}
                          <button
                            disabled={completeSchedule.isPending}
                            onClick={() => completeSchedule.mutate(slot)}
                            type="button"
                          >
                            Пометить завершённой
                          </button>
                        </div>
                      </article>
                    ))}
                </div>
              )}
              {completeSchedule.isError ? (
                <p className="form-error">
                  Не удалось завершить экскурсию. Повторите ещё раз.
                </p>
              ) : null}
              <div className="professional-schedule__history">
                <div>
                  <p className="section-kicker">Архив гида</p>
                  <h3>История проведённых экскурсий</h3>
                </div>
                {(guideSchedule.data?.items ?? []).filter(
                  (slot) => slot.status === 'completed',
                ).length === 0 ? (
                  <p className="professional-experiences__empty">
                    Завершённые экскурсии появятся здесь.
                  </p>
                ) : (
                  <div className="professional-schedule__history-list">
                    {(guideSchedule.data?.items ?? [])
                      .filter((slot) => slot.status === 'completed')
                      .map((slot) => (
                        <article
                          key={`completed-${slot.experienceId}-${slot.date}-${slot.time}`}
                        >
                          <span aria-hidden="true">✓</span>
                          <div>
                            <strong>{slot.title}</strong>
                            <small>
                              {formatScheduleDate(slot.date, slot.time)} ·{' '}
                              {slot.participants} чел.
                            </small>
                          </div>
                        </article>
                      ))}
                  </div>
                )}
              </div>
            </section>
            <section className="professional-card professional-experiences">
              <div className="professional-experiences__header">
                <div>
                  <p className="section-kicker">Ваши публикации</p>
                  <h2>Мои экскурсии</h2>
                </div>
                <button onClick={resetEditor} type="button">
                  ＋ Новая
                </button>
              </div>
              {ownExperiences.isPending ? (
                <p className="professional-experiences__empty">
                  Загружаем экскурсии…
                </p>
              ) : ownExperiences.isError ? (
                <p className="form-error">Не удалось загрузить экскурсии.</p>
              ) : ownExperiences.data.items.length === 0 ? (
                <p className="professional-experiences__empty">
                  Здесь появятся созданные вами экскурсии.
                </p>
              ) : (
                <div className="professional-experiences__list">
                  {ownExperiences.data.items.map((experience) => (
                    <article key={experience.id}>
                      <img
                        alt=""
                        src={
                          experience.photos[0] ??
                          '/images/saint-petersburg-hero.webp'
                        }
                      />
                      <div>
                        <strong>{experience.title}</strong>
                        <small>
                          {cities.find((city) => city.id === experience.cityId)
                            ?.name ?? experience.cityId}
                          {' · '}
                          {experience.priceRub.toLocaleString('ru-RU')} ₽
                        </small>
                      </div>
                      <div className="professional-experiences__actions">
                        <button
                          onClick={() => editExperience(experience)}
                          type="button"
                        >
                          Редактировать
                        </button>
                        <button
                          className="is-danger"
                          onClick={() => {
                            deleteExperience.reset();
                            setDeleting(experience);
                          }}
                          type="button"
                        >
                          Удалить
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            {created ? (
              <section aria-live="polite" className="professional-success">
                <strong>
                  {lastAction === 'updated'
                    ? 'Изменения сохранены'
                    : 'Экскурсия опубликована'}
                </strong>
                <p>Обновлённая карточка уже доступна всем пользователям.</p>
                <Link to={`/experiences/${created.id}`}>Открыть карточку</Link>
              </section>
            ) : null}
            <form
              id="professional-experience-editor"
              key={editing?.id ?? 'new-experience'}
              className="professional-card professional-form"
              onSubmit={handleExperience}
            >
              <div className="professional-step">
                <span>2</span>
                <div>
                  <h2>
                    {editing
                      ? 'Редактирование экскурсии'
                      : 'Создайте экскурсию'}
                  </h2>
                  <p>
                    {editing
                      ? 'Изменения сразу появятся в общей карточке.'
                      : 'После публикации она появится на главной и в каталоге выбранного города.'}
                  </p>
                </div>
              </div>
              {editing ? (
                <div className="professional-editing-bar">
                  <span>Вы редактируете опубликованную экскурсию</span>
                  <button onClick={resetEditor} type="button">
                    Отменить
                  </button>
                </div>
              ) : null}
              <div className="professional-form__row">
                <label>
                  Город
                  <select
                    defaultValue={editing?.cityId ?? 'saint-petersburg'}
                    name="cityId"
                    required
                  >
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Категория
                  <select
                    defaultValue={editing?.category ?? 'Обзорные'}
                    name="category"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.label}>{category.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Название
                <input
                  defaultValue={editing?.title ?? ''}
                  maxLength={120}
                  minLength={6}
                  name="title"
                  required
                />
              </label>
              <label>
                Коротко о маршруте
                <input
                  defaultValue={editing?.intro ?? ''}
                  maxLength={240}
                  minLength={10}
                  name="intro"
                  required
                />
              </label>
              <label>
                Подробное описание
                <textarea
                  defaultValue={editing?.description ?? ''}
                  maxLength={3000}
                  minLength={40}
                  name="description"
                  required
                  rows={6}
                />
              </label>
              <div className="professional-photos">
                <div>
                  <strong>Фотографии</strong>
                  <small>До 6 фото · JPEG, PNG или WebP</small>
                </div>
                {existingPhotoUrls.length + photos.length > 0 ? (
                  <div className="professional-photos__grid">
                    {existingPhotoUrls.map((url, index) => (
                      <figure key={url}>
                        <img
                          alt={`Фотография экскурсии ${index + 1}`}
                          src={url}
                        />
                        <button
                          aria-label={`Удалить фотографию ${index + 1}`}
                          onClick={() =>
                            setExistingPhotoUrls((current) =>
                              current.filter((item) => item !== url),
                            )
                          }
                          type="button"
                        >
                          ×
                        </button>
                      </figure>
                    ))}
                    {photos.map((photo, index) => (
                      <figure key={photo.id}>
                        <img
                          alt={`Новая фотография экскурсии ${index + 1}`}
                          src={photo.preview}
                        />
                        <button
                          aria-label={`Удалить фотографию ${index + 1}`}
                          onClick={() => removePhoto(photo.id)}
                          type="button"
                        >
                          ×
                        </button>
                      </figure>
                    ))}
                  </div>
                ) : null}
                {existingPhotoUrls.length + photos.length < 6 ? (
                  <label className="professional-photo-picker">
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(event) => {
                        selectPhotos(event.currentTarget.files);
                        event.currentTarget.value = '';
                      }}
                      type="file"
                    />
                    <span aria-hidden="true">＋</span>
                    Выбрать фотографии
                  </label>
                ) : null}
                {photoError ? <p className="form-error">{photoError}</p> : null}
              </div>
              <div className="professional-catalog-parameters">
                <label>
                  Длительность
                  <select
                    defaultValue={editing?.durationMinutes ?? 120}
                    name="durationMinutes"
                    required
                  >
                    {editing &&
                    !durationOptions.includes(editing.durationMinutes) ? (
                      <option value={editing.durationMinutes}>
                        {formatDurationOption(editing.durationMinutes)}
                      </option>
                    ) : null}
                    {durationOptions.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {formatDurationOption(minutes)}
                        {minutes <= 120
                          ? ' · до 2 часов'
                          : minutes <= 180
                            ? ' · 2–3 часа'
                            : ' · более 3 часов'}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Формат
                  <select
                    defaultValue={editing?.format ?? 'Пешком'}
                    name="format"
                    required
                  >
                    {editing && !formatOptions.includes(editing.format) ? (
                      <option>{editing.format}</option>
                    ) : null}
                    {formatOptions.map((format) => (
                      <option key={format}>{format}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Посещение с детьми
                  <select
                    defaultValue={
                      editing?.children ?? 'Можно с детьми от 7 лет'
                    }
                    name="childrenPolicy"
                    required
                  >
                    {editing && !childrenOptions.includes(editing.children) ? (
                      <option>{editing.children}</option>
                    ) : null}
                    {childrenOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="professional-form__row">
                <label>
                  Цена, ₽
                  <input
                    defaultValue={editing?.priceRub ?? 1500}
                    max={1000000}
                    min={100}
                    name="priceRub"
                    required
                    type="number"
                  />
                </label>
                <label>
                  До скольки человек
                  <input
                    defaultValue={editing?.groupSize ?? 10}
                    max={100}
                    min={1}
                    name="groupSize"
                    required
                    type="number"
                  />
                </label>
              </div>
              <label>
                Место встречи
                <input
                  defaultValue={editing?.meetingPoint ?? ''}
                  maxLength={240}
                  minLength={5}
                  name="meetingPoint"
                  required
                />
              </label>
              <div className="professional-availability">
                <div>
                  <strong>Доступные даты и время</strong>
                  <small>
                    Пользователь сможет выбрать только добавленные слоты.
                  </small>
                </div>
                <div className="professional-availability__picker">
                  <label>
                    <span>Дата:</span>
                    <span className="professional-availability__control">
                      <input
                        min={todayInputValue()}
                        onChange={(event) =>
                          setScheduleDate(event.target.value)
                        }
                        type="date"
                        value={scheduleDate}
                      />
                    </span>
                  </label>
                  <label>
                    <span>Время:</span>
                    <span className="professional-availability__control">
                      <input
                        min={
                          scheduleDate === todayInputValue()
                            ? currentTimeInputValue()
                            : undefined
                        }
                        onChange={(event) =>
                          setScheduleTime(event.target.value)
                        }
                        type="time"
                        value={scheduleTime}
                      />
                    </span>
                  </label>
                  <button
                    onClick={() => {
                      if (!scheduleDate) {
                        setScheduleError('Сначала выберите дату.');
                        return;
                      }
                      const slot = `${scheduleDate}T${scheduleTime}`;
                      if (!isFutureScheduleSlot(slot)) {
                        setScheduleError(
                          'Это время уже прошло. Выберите более позднее время.',
                        );
                        return;
                      }
                      setScheduleSlots((current) =>
                        [...new Set([...current, slot])].sort(),
                      );
                      setScheduleError(null);
                      setScheduleDate('');
                    }}
                    type="button"
                  >
                    ＋ Добавить
                  </button>
                </div>
                {scheduleSlots.length > 0 ? (
                  <div className="professional-availability__slots">
                    {scheduleSlots.map((slot) => (
                      <span key={slot}>
                        {formatScheduleDate(slot.slice(0, 10), slot.slice(11))}
                        <button
                          aria-label="Удалить дату"
                          onClick={() =>
                            setScheduleSlots((current) =>
                              current.filter((item) => item !== slot),
                            )
                          }
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                {scheduleError ? (
                  <p className="form-error">{scheduleError}</p>
                ) : null}
              </div>
              {saveExperience.isError ? (
                <p className="form-error">
                  {saveExperience.error.message ===
                  'Schedule dates must be in the future'
                    ? 'Выбранное время уже прошло. Удалите его и добавьте будущее.'
                    : 'Не удалось сохранить экскурсию. Проверьте поля и повторите.'}
                </p>
              ) : null}
              <button
                className="professional-submit"
                disabled={saveExperience.isPending}
                type="submit"
              >
                {saveExperience.isPending
                  ? 'Загружаем фото и публикуем…'
                  : editing
                    ? 'Сохранить изменения'
                    : 'Опубликовать в общем каталоге'}
              </button>
            </form>
            {deleting ? (
              <div
                aria-labelledby="delete-experience-title"
                aria-modal="true"
                className="professional-delete-dialog"
                role="dialog"
              >
                <button
                  aria-label="Закрыть окно удаления"
                  className="professional-delete-dialog__backdrop"
                  onClick={() => setDeleting(null)}
                  type="button"
                />
                <section>
                  <span aria-hidden="true">🗑️</span>
                  <h2 id="delete-experience-title">Удалить экскурсию?</h2>
                  <p>
                    «{deleting.title}» исчезнет из общего каталога. Отменить это
                    действие не получится.
                  </p>
                  {deleteExperience.isError ? (
                    <p className="form-error">Не удалось удалить экскурсию.</p>
                  ) : null}
                  <div>
                    <button
                      disabled={deleteExperience.isPending}
                      onClick={() => setDeleting(null)}
                      type="button"
                    >
                      Отмена
                    </button>
                    <button
                      className="is-danger"
                      disabled={deleteExperience.isPending}
                      onClick={() => deleteExperience.mutate(deleting.id)}
                      type="button"
                    >
                      {deleteExperience.isPending ? 'Удаляем…' : 'Удалить'}
                    </button>
                  </div>
                </section>
              </div>
            ) : null}
          </>
        )}
      </main>
    </AppLayout>
  );
}
