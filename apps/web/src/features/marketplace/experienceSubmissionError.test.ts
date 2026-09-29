import { describe, expect, it, vi } from 'vitest';

import { ApiRequestError, uploadExperiencePhoto } from '../../api/client';
import {
  experienceSubmissionError,
  PhotoUploadError,
} from './experienceSubmissionError';

describe('experienceSubmissionError', () => {
  it('names the field rejected by server validation', () => {
    const error = new ApiRequestError(
      'description must be longer than or equal to 40 characters',
      400,
      ['description must be longer than or equal to 40 characters'],
    );

    expect(experienceSubmissionError(error)).toBe(
      'Подробное описание: Нужно минимум 40 символов.',
    );
  });

  it('identifies the photo rejected by an oversized upload', () => {
    const error = new PhotoUploadError(
      2,
      new ApiRequestError('API request failed with status 413', 413, []),
    );

    expect(experienceSubmissionError(error)).toContain(
      'Фотография 2: файл слишком большой',
    );
  });

  it('preserves HTTP 413 when a proxy returns HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('<html>Request too large</html>', { status: 413 }),
        ),
    );

    await expect(
      uploadExperiencePhoto('signed', {
        dataUrl: 'data:image/jpeg;base64,YQ==',
        filename: 'photo.jpg',
      }),
    ).rejects.toMatchObject({ status: 413 });
  });

  it('distinguishes a server failure from an invalid field', () => {
    const error = new ApiRequestError('Internal server error', 500, [
      'Internal server error',
    ]);

    expect(experienceSubmissionError(error)).toContain(
      'Сервер не смог сохранить экскурсию (ошибка 500)',
    );
  });
});
