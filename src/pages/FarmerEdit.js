import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL2 } from "../config";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import AuthContext from "../context/AuthContext";

const FarmerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);
  const [farmer, setFarmer] = useState({
    name: "",
    founder_name: "",
    director_name: "",
    phone_number: "",
    address: "",
    email: "",
    inn: "",
    established_year: "",
    district: "",
  });
  const [loading, setLoading] = useState(id !== "new");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id === "new") {
      setError(null);
      setLoading(false);
      return;
    }

    const fetchFarmer = async () => {
      try {
        setError(null);
        
        const headers = {
          'Content-Type': 'application/json',
        };

        // Добавляем Bearer токен к заголовкам
        if (authState.accessToken) {
          headers.Authorization = `Bearer ${authState.accessToken}`;
        }

        const response = await axios.get(`${API_BASE_URL2}api/farmers/${id}/`, { headers });
        setFarmer(response.data);
      } catch (error) {
        console.error("Error fetching farmer:", error);
        setError("Failed to load farmer data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFarmer();
  }, [id]);

  // Reset error when switching to new farmer creation
  useEffect(() => {
    if (id === "new" && error) {
      setError(null);
    }
  }, [id, error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFarmer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const headers = {
        'Content-Type': 'application/json',
      };

      // Добавляем Bearer токен к заголовкам
      if (authState.accessToken) {
        headers.Authorization = `Bearer ${authState.accessToken}`;
      }

      if (id === "new") {
        await axios.post(`${API_BASE_URL2}api/farmers/`, farmer, { headers });
      } else {
        await axios.put(`${API_BASE_URL2}api/farmers/${id}/`, farmer, { headers });
      }
      navigate("/farmers");
    } catch (error) {
      console.error("Error saving farmer:", error);
      setError("Failed to save farmer. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg border-b border-gray-700 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                <img
                  className="h-16 w-auto mr-4"
                  src={uzbekistanEmblem}
                  alt="O'zbekiston gerbi"
                />
                <h1 className="text-xl text-start font-extrabold text-white max-w-64 leading-tight">
                  Qishloq xo'jaligi Vazirligi huzuridagi Agrosanoatni rivojlantirish agentligi
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/farmers")}
                className="text-gray-300 hover:text-white"
              >
                Orqaga
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-0.5 bg-green-500" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">
            {id === "new"
              ? "Yangi fermer qo'shish"
              : "Fermer ma'lumotlarini tahrirlash"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-700"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nomi
                </label>
                <input
                  type="text"
                  name="name"
                  value={farmer.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Asoschi
                </label>
                <input
                  type="text"
                  name="founder_name"
                  value={farmer.founder_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Direktor
                </label>
                <input
                  type="text"
                  name="director_name"
                  value={farmer.director_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={farmer.phone_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Manzil
                </label>
                <input
                  type="text"
                  name="address"
                  value={farmer.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={farmer.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  INN
                </label>
                <input
                  type="number"
                  name="inn"
                  value={farmer.inn}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tashkil etilgan yili
                </label>
                <input
                  type="number"
                  name="established_year"
                  value={farmer.established_year}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tuman
                </label>
                <input
                  type="number"
                  name="district"
                  value={farmer.district}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-4">
                              <button
                  type="button"
                  onClick={() => navigate("/farmers")}
                  className="w-full sm:w-auto px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors duration-200"
                >
                Bekor qilish
              </button>
                              <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  disabled={loading}
                >
                {loading ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FarmerEdit;
