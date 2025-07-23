import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import ControllersList from "./pages/ControllersList";
import Contacts from "./pages/Contacts";
import Moderation from "./pages/Moderation";
import MapContainer from "./pages/mapContainer";
import PlantationDetail from "./pages/PlantationDetail";
import EditPlantation from "./pages/EditPlantation";
import UserInfo from "./pages/UserInfo";
import RegionsPage from './pages/statistics/RegionsPage';
import RegionDetailPage from './pages/statistics/RegionDetailPage';
import FruitsPage from './pages/statistics/FruitsPage';
import FruitDetailPage from './pages/statistics/FruitDetailPage';
import ControllersPage from './pages/statistics/ControllersPage';
import Farmers from './pages/Farmers';
import FarmerEdit from './pages/FarmerEdit';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/controllers"
          element={
            <ProtectedRoute>
              <ControllersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <Contacts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/moderation"
          element={
            <ProtectedRoute>
              <Moderation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plantations/uz"
          element={
            <ProtectedRoute>
              <MapContainer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plantations/:id"
          element={
            <ProtectedRoute>
              <PlantationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plantations/edit/:id"
          element={
            <ProtectedRoute>
              <EditPlantation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/:id"
          element={
            <ProtectedRoute>
              <UserInfo />
            </ProtectedRoute>
          }
        />
        <Route path="/statistics/regions" element={<RegionsPage />} />
        <Route path="/statistics/regions/:id" element={<RegionDetailPage />} />
        <Route path="/statistics/fruits" element={<FruitsPage />} />
        <Route path="/statistics/fruits/:id" element={<FruitDetailPage />} />
        <Route path="/statistics/controllers" element={<ControllersPage />} />
        <Route path="/farmers" element={<Farmers />} />
        <Route path="/farmers/:id" element={<FarmerEdit />} />
        <Route path="/farmers/new" element={<FarmerEdit />} />
      </Routes>
    </Router>
  );
};

export default App;
