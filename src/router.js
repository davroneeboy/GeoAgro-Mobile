import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Moderation from "./pages/Moderation";
import RejectedPlantations from "./pages/RejectedPlantations";
import ApprovedPlantations from "./pages/ApprovedPlantations";
import LoginPage from "./pages/LoginPage";
import MapContainer from "./pages/MapContainer";
import PlantationDetail from "./pages/PlantationDetail";
import EditPlantation from "./pages/EditPlantation";
import PlantationPreviewPage from "./pages/PlantationPreviewPage";
import UserInfo from "./pages/UserInfo";
import Farmers from "./pages/Farmers";
import FarmerEdit from "./pages/FarmerEdit";
import ProtectedRoute from "./components/ProtectedRoute";

import RegionsPage from "./pages/statistics/RegionsPage";
import RegionDetailPage from "./pages/statistics/RegionDetailPage";

import FruitsPage from "./pages/statistics/FruitsPage";
import FruitDetailPage from "./pages/statistics/FruitDetailPage";

import ControllersPage from "./pages/statistics/ControllersPage";
import DistrictFarmersPage from "./pages/statistics/DistrictFarmersPage";
import AdminLogsPage from "./pages/admin/AdminLogsPage";
import UserLogsPage from "./pages/admin/UserLogsPage";
import PerformanceDashboard from "./pages/admin/PerformanceDashboard";
import MyLogsPage from "./pages/admin/MyLogsPage";
import FarmerPlantationsMap from "./pages/FarmerPlantationsMap";
import DeletionRequests from "./pages/DeletionRequests";
import ArchivedPlantations from "./pages/ArchivedPlantations.tsx";
import Test2StatisticsPage from "./pages/Test2StatisticsPage";

import ConsoleRouter from "./admin/ConsoleRouter";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["superuser"]}><ConsoleRouter /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "observer"]}><HomePage /></ProtectedRoute>} />
      <Route path="/moderation" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><Moderation /></ProtectedRoute>} />
      <Route path="/deletion-requests" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><DeletionRequests /></ProtectedRoute>} />
      <Route path="/rejected-plantations" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><RejectedPlantations /></ProtectedRoute>} />
      <Route path="/approved-plantations" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><ApprovedPlantations /></ProtectedRoute>} />
      <Route path="/archived-plantations" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><ArchivedPlantations /></ProtectedRoute>} />
      <Route path="/plantations/uz" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "observer"]}><MapContainer /></ProtectedRoute>} />
      <Route path="/plantations/:id" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "observer"]}><PlantationDetail /></ProtectedRoute>} />
      <Route path="/plantations/preview/:id" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "observer"]}><PlantationPreviewPage /></ProtectedRoute>} />
      <Route path="/plantations/edit/:id" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><EditPlantation /></ProtectedRoute>} />
      <Route path="/user/:id" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><UserInfo /></ProtectedRoute>} />
      <Route path="/statistics/regions" element={<ProtectedRoute allowedRoles={["superuser", "observer"]}><RegionsPage /></ProtectedRoute>} />
      <Route path="/statistics/regions/:id" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "observer"]}><RegionDetailPage /></ProtectedRoute>} />
      <Route path="/statistics/fruits" element={<ProtectedRoute allowedRoles={["superuser", "observer"]}><FruitsPage /></ProtectedRoute>} />
      <Route path="/statistics/fruits/:id" element={<ProtectedRoute allowedRoles={["superuser", "observer"]}><FruitDetailPage /></ProtectedRoute>} />
      <Route path="/statistics/controllers" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "observer"]}><ControllersPage /></ProtectedRoute>} />
      <Route path="/statistics/districts/:districtId/farmers" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "observer"]}><DistrictFarmersPage /></ProtectedRoute>} />
      <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={["superuser"]}><AdminLogsPage /></ProtectedRoute>} />
      <Route path="/admin/logs/user/:userId" element={<ProtectedRoute allowedRoles={["superuser"]}><UserLogsPage /></ProtectedRoute>} />
      <Route path="/admin/performance" element={<ProtectedRoute allowedRoles={["superuser"]}><PerformanceDashboard /></ProtectedRoute>} />
      <Route path="/my/logs" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><MyLogsPage /></ProtectedRoute>} />
      <Route path="/farmers" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "observer"]}><Farmers /></ProtectedRoute>} />
      <Route path="/farmers/:id" element={<ProtectedRoute allowedRoles={["superuser"]}><FarmerEdit /></ProtectedRoute>} />
      <Route path="/farmers/:id/map" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "observer"]}><FarmerPlantationsMap /></ProtectedRoute>} />
      <Route path="/farmers/new" element={<ProtectedRoute allowedRoles={["superuser"]}><FarmerEdit /></ProtectedRoute>} />
      <Route path="/test2" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "observer"]}><Test2StatisticsPage /></ProtectedRoute>} />
    </Routes>
  );
}

