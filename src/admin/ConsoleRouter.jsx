import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import UsersPage from './pages/users/UsersPage';
import DistrictsPage from './pages/districts/DistrictsPage';
import FarmersPage from './pages/farmers/FarmersPage';

const Placeholder = ({ title }) => (
  <div className="space-y-3">
    <h1 className="text-xl font-semibold">{title}</h1>
    <p className="text-gray-500">UI-заглушка. Далее подключим данные и формы.</p>
  </div>
);

export default function ConsoleRouter() {
  return (
    <Routes>
      <Route element={<AdminLayout />}> 
        <Route index element={<Placeholder title="Дашборд" />} />
        <Route path="districts" element={<DistrictsPage />} />
        <Route path="farmers" element={<FarmersPage />} />
        <Route path="fruits" element={<Placeholder title="Фрукты" />} />
        <Route path="fruit-varieties" element={<Placeholder title="Сорта фруктов" />} />
        <Route path="investments" element={<Placeholder title="Инвестиции" />} />
        <Route path="plantations" element={<Placeholder title="Плантации" />} />
        <Route path="reservoirs" element={<Placeholder title="Резервуары" />} />
        <Route path="rootstocks" element={<Placeholder title="Подвои" />} />
        <Route path="subsidys" element={<Placeholder title="Субсидии" />} />
        <Route path="trellis" element={<Placeholder title="Шпалеры" />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="mod-logs" element={<Placeholder title="Логи модерации" />} />
      </Route>
    </Routes>
  );
} 