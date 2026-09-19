import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  createPublishedExperience,
  getGuideProfile,
  saveGuideProfile,
  type CreateExperienceInput,
  type PublishedExperience,
  uploadExperiencePhoto,
} from '../api/client';
import { AppLayout } from '../components/AppLayout';
import { categories } from '../data/experiences';
import { cities, type CityId } from '../data/cities';
import { useMaxConnection } from '../features/max/useMaxConnection';
import { prepareExperiencePhoto } from '../features/marketplace/prepareExperiencePhoto';

interface SelectedPhoto {
  readonly file: File;
  readonly id: string;
  readonly preview: string;
}

function formValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export function ProfessionalPage() {
  const queryClient = useQueryClient();
  const { platform, session } = useMaxConnection();
  const initData = platform.initData ?? '';
  const [created, setCreated] = useState<PublishedExperience | null>(null);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
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
    },
  });
  const createExperience = useMutation({
    mutationFn: async ({
      files,
      value,
    }: {
      files: readonly File[];
      value: Omit<CreateExperienceInput, 'photoUrls'>;
    }) => {
      const photoUrls: string[] = [];
      for (const file of files) {
        const prepared = await prepareExperiencePhoto(file);
        const uploaded = await uploadExperiencePhoto(initData, prepared);
        photoUrls.push(uploaded.url);
      }
      return createPublishedExperience(initData, { ...value, photoUrls });
    },
    onSuccess: (value) => {
      setCreated(value);
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
      setPhotoError(null);
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
    if (photos.length === 0) {
      setPhotoError('Добавьте хотя бы одну фотографию экскурсии.');
      return;
    }
    const form = new FormData(event.currentTarget);
    setPhotoError(null);
    createExperience.mutate({
      files: photos.map((photo) => photo.file),
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
        title: formValue(form, 'title'),
      },
    });
  }

  function selectPhotos(files: FileList | null) {
    if (!files) return;
    const available = Math.max(0, 6 - photos.length);
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

  return (
    <AppLayout>
      <main className="secondary-page professional-page">
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
            <section className="professional-card professional-status">
              <span aria-hidden="true">✓</span>
              <div>
                <p>Профиль гида активен</p>
                <h2>{profile.data.displayName}</h2>
                <small>{profile.data.bio}</small>
              </div>
            </section>
            {created ? (
              <section aria-live="polite" className="professional-success">
                <strong>Экскурсия опубликована</strong>
                <p>Она уже доступна всем пользователям.</p>
                <Link to={`/experiences/${created.id}`}>Открыть карточку</Link>
              </section>
            ) : null}
            <form
              className="professional-card professional-form"
              onSubmit={handleExperience}
            >
              <div className="professional-step">
                <span>2</span>
                <div>
                  <h2>Создайте экскурсию</h2>
                  <p>
                    После публикации она появится на главной и в каталоге
                    выбранного города.
                  </p>
                </div>
              </div>
              <div className="professional-form__row">
                <label>
                  Город
                  <select name="cityId" required>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Категория
                  <select name="category" required>
                    {categories.map((category) => (
                      <option key={category.label}>{category.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Название
                <input maxLength={120} minLength={6} name="title" required />
              </label>
              <label>
                Коротко о маршруте
                <input maxLength={240} minLength={10} name="intro" required />
              </label>
              <label>
                Подробное описание
                <textarea
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
                {photos.length > 0 ? (
                  <div className="professional-photos__grid">
                    {photos.map((photo, index) => (
                      <figure key={photo.id}>
                        <img
                          alt={`Фотография экскурсии ${index + 1}`}
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
                {photos.length < 6 ? (
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
              <div className="professional-form__row">
                <label>
                  Длительность, мин
                  <input
                    defaultValue={120}
                    max={720}
                    min={30}
                    name="durationMinutes"
                    required
                    type="number"
                  />
                </label>
                <label>
                  Цена, ₽
                  <input
                    defaultValue={1500}
                    max={1000000}
                    min={100}
                    name="priceRub"
                    required
                    type="number"
                  />
                </label>
              </div>
              <div className="professional-form__row">
                <label>
                  Формат
                  <input
                    defaultValue="Пешком"
                    maxLength={80}
                    minLength={3}
                    name="format"
                    required
                  />
                </label>
                <label>
                  До скольки человек
                  <input
                    defaultValue={10}
                    max={100}
                    min={1}
                    name="groupSize"
                    required
                    type="number"
                  />
                </label>
              </div>
              <label>
                Можно ли с детьми
                <input
                  defaultValue="Можно с детьми от 7 лет"
                  maxLength={160}
                  minLength={3}
                  name="childrenPolicy"
                  required
                />
              </label>
              <label>
                Место встречи
                <input
                  maxLength={240}
                  minLength={5}
                  name="meetingPoint"
                  required
                />
              </label>
              {createExperience.isError ? (
                <p className="form-error">
                  Не удалось опубликовать. Проверьте поля и повторите.
                </p>
              ) : null}
              <button
                className="professional-submit"
                disabled={createExperience.isPending}
                type="submit"
              >
                {createExperience.isPending
                  ? 'Загружаем фото и публикуем…'
                  : 'Опубликовать в общем каталоге'}
              </button>
            </form>
          </>
        )}
      </main>
    </AppLayout>
  );
}
