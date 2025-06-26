import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL2 } from "../config";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";

const FarmerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
        const response = await axios.get(`${API_BASE_URL2}api/farmers/${id}/`);
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
      if (id === "new") {
        await axios.post(`${API_BASE_URL2}api/farmers/`, farmer);
      } else {
        await axios.put(`${API_BASE_URL2}api/farmers/${id}/`, farmer);
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
      <div className="h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img
                className="h-16 w-auto mr-4"
                src={uzbekistanEmblem}
                alt="O'zbekiston gerbi"
              />
              <h1 className="text-xl font-bold text-gray-800">
                Qishloq xo'jaligi Vazirligi
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/farmers")}
                className="text-gray-600 hover:text-gray-800"
              >
                Orqaga
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {id === "new"
              ? "Yangi fermer qo'shish"
              : "Fermer ma'lumotlarini tahrirlash"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-lg rounded-lg p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomi
                </label>
                <input
                  type="text"
                  name="name"
                  value={farmer.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asoschi
                </label>
                <input
                  type="text"
                  name="founder_name"
                  value={farmer.founder_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direktor
                </label>
                <input
                  type="text"
                  name="director_name"
                  value={farmer.director_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={farmer.phone_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manzil
                </label>
                <input
                  type="text"
                  name="address"
                  value={farmer.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={farmer.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  INN
                </label>
                <input
                  type="number"
                  name="inn"
                  value={farmer.inn}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tashkil etilgan yili
                </label>
                <input
                  type="number"
                  name="established_year"
                  value={farmer.established_year}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tuman
                </label>
                <input
                  type="number"
                  name="district"
                  value={farmer.district}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/farmers")}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
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
