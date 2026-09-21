const DEFAULT_PRODUCTION_API_URL = 'https://lighthouse-api-lwsx.vercel.app';

const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const apiBaseUrl = configuredApiUrl
  ? configuredApiUrl.replace(/\/$/, '')
  : import.meta.env.DEV
    ? ''
    : DEFAULT_PRODUCTION_API_URL;

export interface MaxUser {
  readonly firstName: string;
  readonly id: string;
  readonly languageCode: string | null;
  readonly lastName: string | null;
  readonly photoUrl: string | null;
  readonly username: string | null;
}

export interface MaxSession {
  readonly authenticated: true;
  readonly user: MaxUser;
}

export type MaxIntegrationStatus =
  | {
      readonly bot: {
        readonly id: string;
        readonly name: string;
        readonly username: string | null;
      };
      readonly configured: true;
      readonly connected: true;
    }
  | {
      readonly configured: boolean;
      readonly connected: false;
      readonly reason: string;
    };

export interface GuideProfile {
  readonly bio: string;
  readonly createdAt: string;
  readonly displayName: string;
  readonly id: string;
  readonly photoUrl: string | null;
}

export interface PublishedExperience {
  readonly availableSlots: readonly ExperienceScheduleSlot[];
  readonly category: string;
  readonly children: string;
  readonly cityId: 'kazan' | 'kostroma' | 'moscow' | 'saint-petersburg';
  readonly createdAt: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly format: string;
  readonly groupSize: number;
  readonly groupType: string;
  readonly guide: Pick<GuideProfile, 'bio' | 'displayName' | 'id' | 'photoUrl'>;
  readonly highlights: readonly string[];
  readonly id: string;
  readonly intro: string;
  readonly meetingPoint: string;
  readonly photos: readonly string[];
  readonly priceRub: number;
  readonly rating: number;
  readonly reviewCount: number;
  readonly status: 'published';
  readonly title: string;
}

export interface ExperienceScheduleSlot {
  readonly date: string;
  readonly remaining: number;
  readonly status: 'completed' | 'scheduled';
  readonly time: string;
}

export interface CreateExperienceInput {
  readonly category: string;
  readonly childrenPolicy: string;
  readonly cityId: PublishedExperience['cityId'];
  readonly description: string;
  readonly durationMinutes: number;
  readonly format: string;
  readonly groupSize: number;
  readonly intro: string;
  readonly meetingPoint: string;
  readonly photoUrls: readonly string[];
  readonly priceRub: number;
  readonly scheduleSlots: readonly string[];
  readonly title: string;
}

export interface GuideScheduleItem {
  readonly bookingCount: number;
  readonly capacity: number;
  readonly date: string;
  readonly experienceId: string;
  readonly guests: readonly {
    readonly bookingId: string;
    readonly maxUserId: string;
    readonly participants: number;
    readonly username: string | null;
  }[];
  readonly participants: number;
  readonly status: 'completed' | 'scheduled';
  readonly time: string;
  readonly title: string;
}

export interface Booking {
  readonly cityId: PublishedExperience['cityId'];
  readonly createdAt: string;
  readonly date: string;
  readonly experienceId: string;
  readonly id: string;
  readonly imageUrl: string;
  readonly guideContact: {
    readonly displayName: string;
    readonly maxUserId: string;
    readonly username: string;
  } | null;
  readonly meetingPoint: string;
  readonly participants: number;
  readonly review: BookingReview | null;
  readonly status: 'cancelled' | 'completed' | 'confirmed';
  readonly time: string;
  readonly title: string;
  readonly totalPriceRub: number;
  readonly unitPriceRub: number;
}

export interface BookingReview {
  readonly comment: string;
  readonly createdAt: string;
  readonly id: string;
  readonly rating: number;
}

export interface ExperienceReview {
  readonly authorName: string;
  readonly authorPhotoUrl: string | null;
  readonly comment: string;
  readonly createdAt: string;
  readonly id: string;
  readonly rating: number;
}

export interface CreateBookingInput {
  readonly cityId: PublishedExperience['cityId'];
  readonly date: string;
  readonly experienceId: string;
  readonly groupSize: number;
  readonly imageUrl: string;
  readonly meetingPoint: string;
  readonly participants: number;
  readonly priceRub: number;
  readonly time: string;
  readonly title: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? (payload as { readonly message?: unknown }).message
        : undefined;
    const details = Array.isArray(message)
      ? message.find((item): item is string => typeof item === 'string')
      : typeof message === 'string'
        ? message
        : undefined;
    throw new Error(
      details ?? `API request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export function authenticateMax(initData: string): Promise<MaxSession> {
  return request<MaxSession>('/auth/max', {
    body: JSON.stringify({ initData }),
    method: 'POST',
  });
}

export function getMaxIntegrationStatus(): Promise<MaxIntegrationStatus> {
  return request<MaxIntegrationStatus>('/integrations/max/status');
}

export function getPublishedExperiences(cityId?: string) {
  const query = cityId ? `?cityId=${encodeURIComponent(cityId)}` : '';
  return request<{ readonly items: readonly PublishedExperience[] }>(
    `/experiences${query}`,
  );
}

export function getPublishedExperience(id: string) {
  return request<PublishedExperience>(`/experiences/${encodeURIComponent(id)}`);
}

export function getExperienceReviews(id: string) {
  return request<{ readonly items: readonly ExperienceReview[] }>(
    `/experiences/${encodeURIComponent(id)}/reviews`,
  );
}

function maxHeaders(initData: string) {
  return { 'X-Max-Init-Data': initData };
}

export function getGuideProfile(initData: string) {
  return request<GuideProfile | null>('/professional/profile', {
    headers: maxHeaders(initData),
  });
}

export function saveGuideProfile(
  initData: string,
  profile: Pick<GuideProfile, 'bio' | 'displayName'>,
) {
  return request<GuideProfile>('/professional/profile', {
    body: JSON.stringify(profile),
    headers: maxHeaders(initData),
    method: 'PUT',
  });
}

export function createPublishedExperience(
  initData: string,
  experience: CreateExperienceInput,
) {
  return request<PublishedExperience>('/professional/experiences', {
    body: JSON.stringify(experience),
    headers: maxHeaders(initData),
    method: 'POST',
  });
}

export function getOwnPublishedExperiences(initData: string) {
  return request<{ readonly items: readonly PublishedExperience[] }>(
    '/professional/experiences',
    { headers: maxHeaders(initData) },
  );
}

export function getGuideSchedule(initData: string) {
  return request<{ readonly items: readonly GuideScheduleItem[] }>(
    '/professional/schedule',
    { headers: maxHeaders(initData) },
  );
}

export function completeGuideSchedule(
  initData: string,
  slot: Pick<GuideScheduleItem, 'date' | 'experienceId' | 'time'>,
) {
  return request<{ readonly completed: true }>(
    '/professional/schedule/complete',
    {
      body: JSON.stringify({
        date: slot.date,
        experienceId: slot.experienceId,
        time: slot.time,
      }),
      headers: maxHeaders(initData),
      method: 'POST',
    },
  );
}

export function updatePublishedExperience(
  initData: string,
  id: string,
  experience: CreateExperienceInput,
) {
  return request<PublishedExperience>(
    `/professional/experiences/${encodeURIComponent(id)}`,
    {
      body: JSON.stringify(experience),
      headers: maxHeaders(initData),
      method: 'PUT',
    },
  );
}

export function deletePublishedExperience(initData: string, id: string) {
  return request<{ readonly deleted: true; readonly id: string }>(
    `/professional/experiences/${encodeURIComponent(id)}`,
    {
      headers: maxHeaders(initData),
      method: 'DELETE',
    },
  );
}

export function uploadExperiencePhoto(
  initData: string,
  photo: { readonly dataUrl: string; readonly filename: string },
) {
  return request<{ readonly url: string }>('/professional/photos', {
    body: JSON.stringify(photo),
    headers: maxHeaders(initData),
    method: 'POST',
  });
}

export function createBooking(initData: string, booking: CreateBookingInput) {
  return request<Booking>('/bookings', {
    body: JSON.stringify(booking),
    headers: maxHeaders(initData),
    method: 'POST',
  });
}

export function getBookings(initData: string) {
  return request<{ readonly items: readonly Booking[] }>('/bookings', {
    headers: maxHeaders(initData),
  });
}

export function cancelBooking(initData: string, id: string) {
  return request<{ readonly cancelled: true; readonly id: string }>(
    `/bookings/${encodeURIComponent(id)}`,
    { headers: maxHeaders(initData), method: 'DELETE' },
  );
}

export function createBookingReview(
  initData: string,
  id: string,
  review: { readonly comment: string; readonly rating: number },
) {
  return request<
    BookingReview & {
      readonly bookingId: string;
      readonly experienceId: string;
    }
  >(`/bookings/${encodeURIComponent(id)}/review`, {
    body: JSON.stringify(review),
    headers: maxHeaders(initData),
    method: 'POST',
  });
}
