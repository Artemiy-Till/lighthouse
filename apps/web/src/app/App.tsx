import { Navigate, Route, Routes } from 'react-router-dom';

import { FoundationPage } from '../pages/FoundationPage';

export function App() {
  return (
    <Routes>
      <Route element={<FoundationPage />} path="/" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
