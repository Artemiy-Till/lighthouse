const maximumSourceBytes = 15 * 1024 * 1024;
const maximumDimension = 1600;

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function readAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать фотографию'));
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Не удалось прочитать фотографию'));
    };
    reader.readAsDataURL(blob);
  });
}

export async function prepareExperiencePhoto(file: File) {
  if (!acceptedTypes.has(file.type)) {
    throw new Error('Можно загружать только JPEG, PNG или WebP');
  }
  if (file.size > maximumSourceBytes) {
    throw new Error('Исходная фотография должна быть не больше 15 МБ');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    maximumDimension / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Не удалось обработать фотографию');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) =>
        value
          ? resolve(value)
          : reject(new Error('Не удалось сжать фотографию')),
      'image/jpeg',
      0.84,
    );
  });

  return {
    dataUrl: await readAsDataUrl(blob),
    filename: `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`,
  };
}
