import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ControllersList from "./pages/ControllersList";
// import Contacts from "./pages/Contacts";
import Moderation from "./pages/Moderation";
import LoginPage from "./pages/LoginPage";
import MapContainer from "./pages/mapContainer";
import PlantationDetail from "./pages/PlantationDetail";
import UserInfo from "./pages/UserInfo";
import Farmers from "./pages/Farmers";
import FarmerEdit from "./pages/FarmerEdit";

import RegionsPage from "./pages/statistics/RegionsPage";
import RegionDetailPage from "./pages/statistics/RegionDetailPage";

import FruitsPage from "./pages/statistics/FruitsPage";
import FruitDetailPage from "./pages/statistics/FruitDetailPage";

import ControllersPage from "./pages/statistics/ControllersPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/controllers" element={<ControllersList />} />
      {/* <Route path="/contacts" element={<Contacts />} /> */}
      <Route path="/moderation" element={<Moderation />} />
      <Route path="/plantations/uz" element={<MapContainer />} />
      <Route path="/plantations/:id" element={<PlantationDetail />} />
      <Route path="/user/:id" element={<UserInfo />} />
      <Route path="/statistics/regions" element={<RegionsPage />} />
      <Route path="/statistics/regions/:id" element={<RegionDetailPage />} />
      <Route path="/statistics/fruits" element={<FruitsPage />} />
      <Route path="/statistics/fruits/:id" element={<FruitDetailPage />} />
      <Route path="/statistics/controllers" element={<ControllersPage />} />
      <Route path="/farmers" element={<Farmers />} />
      <Route path="/farmers/:id" element={<FarmerEdit />} />
      <Route path="/farmers/new" element={<FarmerEdit />} />
    </Routes>
  );
}
