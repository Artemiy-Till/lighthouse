alter table published_experiences
  add column if not exists photo_urls text[] not null default '{}'::text[];
