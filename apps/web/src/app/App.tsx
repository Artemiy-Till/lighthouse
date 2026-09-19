import { Navigate, Route, Routes } from 'react-router-dom';

import { CityProvider } from '../features/city/CityContext';
import { FavoritesProvider } from '../features/favorites/FavoritesContext';
import { SettingsProvider } from '../features/settings/SettingsContext';
import { ThemeProvider } from '../features/theme/ThemeContext';
import { CatalogPage } from '../pages/CatalogPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { HomePage } from '../pages/HomePage';
import { ExperienceDetailsPage } from '../pages/ExperienceDetailsPage';
import { GuidePage } from '../pages/GuidePage';
import { OrdersPage } from '../pages/OrdersPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ProfessionalPage } from '../pages/ProfessionalPage';
import { SettingsPage } from '../pages/SettingsPage';

export function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <CityProvider>
          <FavoritesProvider>
            <Routes>
              <Route element={<HomePage />} path="/" />
              <Route element={<CatalogPage />} path="/catalog" />
              <Route element={<FavoritesPage />} path="/favorites" />
              <Route
                element={<ExperienceDetailsPage />}
                path="/experiences/:experienceId"
              />
              <Route element={<GuidePage />} path="/guides/:guideId" />
              <Route element={<OrdersPage />} path="/orders" />
              <Route element={<ProfilePage />} path="/profile" />
              <Route element={<ProfessionalPage />} path="/professional" />
              <Route element={<SettingsPage />} path="/settings" />
              <Route element={<Navigate replace to="/" />} path="*" />
            </Routes>
          </FavoritesProvider>
        </CityProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
