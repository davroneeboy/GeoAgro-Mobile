import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import ControllersList from "./pages/ControllersList";
// import Contacts from "./pages/Contacts";
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
import ApprovedPlantations from './pages/ApprovedPlantations';
import RejectedPlantations from './pages/RejectedPlantations';

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
        {/* Контакты больше не отдельная страница; удалено */}
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
        <Route path="/statistics/regions" element={<ProtectedRoute><RegionsPage /></ProtectedRoute>} />
        <Route path="/statistics/regions/:id" element={<ProtectedRoute><RegionDetailPage /></ProtectedRoute>} />
        <Route path="/statistics/fruits" element={<ProtectedRoute><FruitsPage /></ProtectedRoute>} />
        <Route path="/statistics/fruits/:id" element={<ProtectedRoute><FruitDetailPage /></ProtectedRoute>} />
        <Route path="/statistics/controllers" element={<ProtectedRoute><ControllersPage /></ProtectedRoute>} />
        <Route path="/farmers" element={<ProtectedRoute><Farmers /></ProtectedRoute>} />
        <Route path="/farmers/:id" element={<ProtectedRoute><FarmerEdit /></ProtectedRoute>} />
        <Route path="/farmers/new" element={<ProtectedRoute><FarmerEdit /></ProtectedRoute>} />
        <Route path="/approved-plantations" element={<ProtectedRoute><ApprovedPlantations /></ProtectedRoute>} />
        <Route path="/rejected-plantations" element={<ProtectedRoute><RejectedPlantations /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
