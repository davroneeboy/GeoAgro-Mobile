import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import UsersPage from './pages/users/UsersPage';
import DistrictsPage from './pages/districts/DistrictsPage';
import FarmersPage from './pages/farmers/FarmersPage';
import FruitsPage from './pages/fruits/FruitsPage';
import FruitVarietiesPage from './pages/fruitVarieties/FruitVarietiesPage';
import PlantationsPage from './pages/plantations/PlantationsPage';
import Dashboard from './pages/Dashboard';
import ModerationQueue from './pages/moderation/ModerationQueue';
import ModerationDetail from './pages/moderation/ModerationDetail';
import ModerationStats from './pages/moderation/ModerationStats';
import InvestmentsPage from './pages/investments/InvestmentsPage';
import ReservoirsPage from './pages/reservoirs/ReservoirsPage';
import RootstocksPage from './pages/rootstocks/RootstocksPage';
import SubsidysPage from './pages/subsidys/SubsidysPage';
import TrellisPage from './pages/trellis/TrellisPage';
import ModLogsPage from './pages/modLogs/ModLogsPage';

export default function ConsoleRouter() {
  return (
    <Routes>
      <Route element={<AdminLayout />}> 
        <Route index element={<Dashboard />} />
        <Route path="districts" element={<DistrictsPage />} />
        <Route path="farmers" element={<FarmersPage />} />
        <Route path="fruits" element={<FruitsPage />} />
        <Route path="fruit-varieties" element={<FruitVarietiesPage />} />
        <Route path="plantations" element={<PlantationsPage />} />
        <Route path="investments" element={<InvestmentsPage />} />
        <Route path="moderation" element={<ModerationQueue />} />
        <Route path="moderation/:id" element={<ModerationDetail />} />
        <Route path="moderation-stats" element={<ModerationStats />} />
        <Route path="reservoirs" element={<ReservoirsPage />} />
        <Route path="rootstocks" element={<RootstocksPage />} />
        <Route path="subsidys" element={<SubsidysPage />} />
        <Route path="trellis" element={<TrellisPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="mod-logs" element={<ModLogsPage />} />
      </Route>
    </Routes>
  );
} 