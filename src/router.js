import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ControllersList from "./pages/ControllersList";
// import Contacts from "./pages/Contacts";
import Moderation from "./pages/Moderation";
import RejectedPlantations from "./pages/RejectedPlantations";
import ApprovedPlantations from "./pages/ApprovedPlantations";
import LoginPage from "./pages/LoginPage";
import MapContainer from "./pages/mapContainer";
import PlantationDetail from "./pages/PlantationDetail";
import EditPlantation from "./pages/EditPlantation";
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

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "user"]}><HomePage /></ProtectedRoute>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "user"]}><HomePage /></ProtectedRoute>} />
      <Route path="/plantations" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "user"]}><MapContainer /></ProtectedRoute>} />
      <Route path="/controllers" element={<ProtectedRoute allowedRoles={["superuser"]}><ControllersList /></ProtectedRoute>} />
      {/* <Route path="/contacts" element={<Contacts />} /> */}
      <Route path="/moderation" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><Moderation /></ProtectedRoute>} />
      <Route path="/rejected-plantations" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><RejectedPlantations /></ProtectedRoute>} />
      <Route path="/approved-plantations" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><ApprovedPlantations /></ProtectedRoute>} />
      <Route path="/plantations/uz" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "user"]}><MapContainer /></ProtectedRoute>} />
      <Route path="/plantations/:id" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "user"]}><PlantationDetail /></ProtectedRoute>} />
      <Route path="/plantations/edit/:id" element={<ProtectedRoute allowedRoles={["superuser"]}><EditPlantation /></ProtectedRoute>} />
      <Route path="/user/:id" element={<ProtectedRoute allowedRoles={["superuser", "headof_region", "user"]}><UserInfo /></ProtectedRoute>} />
      <Route path="/statistics/regions" element={<ProtectedRoute allowedRoles={["superuser"]}><RegionsPage /></ProtectedRoute>} />
      <Route path="/statistics/regions/:id" element={<ProtectedRoute allowedRoles={["superuser"]}><RegionDetailPage /></ProtectedRoute>} />
      <Route path="/statistics/fruits" element={<ProtectedRoute allowedRoles={["superuser"]}><FruitsPage /></ProtectedRoute>} />
      <Route path="/statistics/fruits/:id" element={<ProtectedRoute allowedRoles={["superuser"]}><FruitDetailPage /></ProtectedRoute>} />
      <Route path="/statistics/controllers" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><ControllersPage /></ProtectedRoute>} />
      <Route path="/statistics/districts/:districtId/farmers" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><DistrictFarmersPage /></ProtectedRoute>} />
      <Route path="/farmers" element={<ProtectedRoute allowedRoles={["superuser", "headof_region"]}><Farmers /></ProtectedRoute>} />
      <Route path="/farmers/:id" element={<ProtectedRoute allowedRoles={["superuser"]}><FarmerEdit /></ProtectedRoute>} />
      <Route path="/farmers/new" element={<ProtectedRoute allowedRoles={["superuser"]}><FarmerEdit /></ProtectedRoute>} />
    </Routes>
  );
}
