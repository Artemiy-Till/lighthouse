import { getMaxPlatform } from '../platform/max/max-platform';

export function FoundationPage() {
  const maxPlatform = getMaxPlatform();

  return (
    <main className="foundation-page">
      <section aria-labelledby="foundation-title" className="foundation-card">
        <p className="foundation-eyebrow">MAX Mini App</p>
        <h1 id="foundation-title">Техническая основа готова</h1>
        <p>
          Продуктовые экраны будут добавляться отдельными вертикальными срезами.
        </p>
        <dl className="foundation-status">
          <div>
            <dt>Среда запуска</dt>
            <dd>{maxPlatform.isAvailable ? 'MAX' : 'Браузер разработки'}</dd>
          </div>
          <div>
            <dt>Платформа</dt>
            <dd>{maxPlatform.platform}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
